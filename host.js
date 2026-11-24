ObjC.import('Cocoa');
ObjC.import('WebKit');
ObjC.import('Foundation');

const app = $.NSApplication.sharedApplication;
app.setActivationPolicy(1); // Accessory app (no Dock icon flash)

const env = $.NSProcessInfo.processInfo.environment;
const envStr = (k, def = '') => {
  const v = env.objectForKey(k);
  return v && !v.isNil() ? ObjC.unwrap(v) : def;
};

const ROOT = envStr('ANNIV_ROOT', $.NSFileManager.defaultManager.currentDirectoryPath.js);
const WEB_DIR = ROOT + '/web';
const BASE_URL = envStr('ANNIV_URL', ''); // e.g. http://127.0.0.1:PORT
const SKIP_PRELUDE = envStr('ANNIV_SKIP', '0') === '1';
const START_PAGE = envStr('ANNIV_PAGE', '');

function quitAll() {
  if (convergeTimer) {
    try { convergeTimer.invalidate; } catch (_) {}
    convergeTimer = null;
  }
  for (const k of [...satellites.keys()]) closeSatellite(k);
  app.terminate(null);
}

ObjC.registerSubclass({
  name: 'KeyWin',
  superclass: 'NSPanel',
  methods: {
    'canBecomeKeyWindow': { types: ['bool', []], implementation: function () { return true; } },
    'canBecomeMainWindow': { types: ['bool', []], implementation: function () { return true; } },
    'cancelOperation:': {
      types: ['void', ['id']],
      implementation: function () { quitAll(); },
    },
  },
});

const scr = $.NSScreen.mainScreen.frame;
const SW = scr.size.width;
const SH = scr.size.height;
const SX = scr.origin.x;
const SY = scr.origin.y;
const SCALE = Math.min(1.18, Math.max(0.75, SH / 956));

const satellites = new Map();
const MAX_SATELLITES = 10;
const sharedPool = $.WKProcessPool.alloc.init;
let overlayReady = false;
let stageReady = false;
const fxQueue = [];
let stageWin = null;
let stageWv = null;
let overlayWin = null;
let overlayWv = null;
let convergeState = null;
let convergeTimer = null;

function makeConfig(handler) {
  const conf = $.WKWebViewConfiguration.alloc.init;
  conf.setProcessPool(sharedPool);
  conf.setMediaTypesRequiringUserActionForPlayback(0);
  conf.preferences.setValueForKey($.NSNumber.numberWithBool(true), 'allowFileAccessFromFileURLs');
  conf.userContentController.addScriptMessageHandlerName(handler, 'host');
  return conf;
}

function loadPage(wv, relUrl) {
  if (BASE_URL) {
    const full = `${BASE_URL}/${relUrl}`;
    wv.loadRequest($.NSURLRequest.requestWithURL($.NSURL.URLWithString(full)));
  } else {
    const qIdx = relUrl.indexOf('?');
    const filePart = qIdx >= 0 ? relUrl.slice(0, qIdx) : relUrl;
    const queryPart = qIdx >= 0 ? relUrl.slice(qIdx) : '';
    const filePath = `${WEB_DIR}/${filePart}`;
    const base = $.NSURL.fileURLWithPathIsDirectory(WEB_DIR, true);
    let url = $.NSURL.fileURLWithPath(filePath);
    if (queryPart) {
      url = $.NSURL.URLWithStringRelativeToURL(filePart + queryPart, base);
    }
    wv.loadFileURLAllowingReadAccessToURL(url, base);
  }
}

// styleMask 128 = NSWindowStyleMaskNonActivatingPanel (renders over Full-Screen Spaces too!)
// collectionBehavior: 1 (CanJoinAllSpaces) | 16 (Stationary) | 64 (IgnoresCycle) | 256 (FullScreenAuxiliary)
function makeWindow(rect, level, ignoresMouse, handler, nonActivating = true) {
  const mask = nonActivating ? 128 : 0;
  const win = $.KeyWin.alloc.initWithContentRectStyleMaskBackingDefer(rect, mask, 2, false);
  win.setFloatingPanel(true);
  win.setHidesOnDeactivate(false);
  win.setOpaque(false);
  win.setBackgroundColor($.NSColor.clearColor);
  win.setLevel(level);
  win.setHasShadow(false);
  win.setIgnoresMouseEvents(ignoresMouse);
  win.setCollectionBehavior(1 | 16 | 64 | 256);

  const conf = makeConfig(handler);
  const wv = $.WKWebView.alloc.initWithFrameConfiguration(
    $.NSMakeRect(0, 0, rect.size.width, rect.size.height),
    conf
  );
  wv.setValueForKey($.NSNumber.numberWithBool(false), 'drawsBackground');
  win.setContentView(wv);
  return { win, wv };
}

function evalIn(wv, js) {
  if (!wv) return;
  wv.evaluateJavaScriptCompletionHandler(js, function () {});
}

function sendFx(data) {
  const code = `window.FXCMD && window.FXCMD(${JSON.stringify(data)});`;
  if (!overlayReady) {
    fxQueue.push(code);
    return;
  }
  evalIn(overlayWv, code);
}

function spawnSatellite(msg) {
  const id = String(msg.id || ('w_' + Date.now()));
  if (satellites.has(id)) return;

  if (satellites.size >= MAX_SATELLITES) {
    const firstKey = satellites.keys().next().value;
    closeSatellite(firstKey);
  }

  const W = Math.round((msg.w || 280) * SCALE);
  const H = Math.round((msg.h || 280) * SCALE);
  const nx = Number(msg.x || 0.5);
  const ny = Number(msg.y || 0.5);
  const cx = SX + (nx <= 1.5 ? nx * SW : nx);
  const cyTop = ny <= 1.5 ? ny * SH : ny;

  const x = Math.round(Math.max(SX + 8, Math.min(SX + SW - W - 8, cx - W / 2)));
  const y = Math.round(Math.max(SY + 8, Math.min(SY + SH - H - 8, SY + SH - cyTop - H / 2)));

  const interactive = Boolean(msg.interactive);
  const { win, wv } = makeWindow($.NSMakeRect(x, y, W, H), 1002, !interactive, hostHandler, true);
  satellites.set(id, { win, wv });
  loadPage(wv, msg.url);
  win.orderFrontRegardless;
}

function actSatellite(id, name) {
  const code = `window.ACT && window.ACT(${JSON.stringify(name)});`;
  if (id === '*') {
    for (const sat of satellites.values()) evalIn(sat.wv, code);
    return;
  }
  const sat = satellites.get(String(id));
  if (sat) evalIn(sat.wv, code);
}

function closeSatellite(id) {
  const key = String(id);
  const sat = satellites.get(key);
  if (!sat) return;
  satellites.delete(key);
  try { sat.wv.stopLoading; } catch (_) {}
  try { sat.wv.removeFromSuperview; } catch (_) {}
  try { sat.win.orderOut(null); } catch (_) {}
  try { sat.win.close; } catch (_) {}
}

function startConverge(ids, durSec) {
  if (convergeTimer) {
    try { convergeTimer.invalidate; } catch (_) {}
    convergeTimer = null;
  }
  const items = [];
  (ids || []).forEach((id) => {
    const sat = satellites.get(String(id));
    if (!sat) return;
    const f = sat.win.frame;
    items.push({
      id: String(id),
      x0: f.origin.x,
      y0: f.origin.y,
      tx: Math.round(SX + SW * 0.5 - f.size.width * 0.5),
      ty: Math.round(SY + SH * 0.5 - f.size.height * 0.5),
    });
  });
  if (!items.length) return;
  convergeState = { items, t0: Date.now(), durMs: Math.max(200, (Number(durSec) || 0.58) * 1000) };
  convergeTimer = $.NSTimer.scheduledTimerWithTimeIntervalTargetSelectorUserInfoRepeats(
    0.016,
    hostHandler,
    'convergeTick:',
    null,
    true
  );
}

ObjC.registerSubclass({
  name: 'AnnivHostHandler',
  superclass: 'NSObject',
  methods: {
    'userContentController:didReceiveScriptMessage:': {
      types: ['void', ['id', 'id']],
      implementation: function (ucc, msgObj) {
        let raw = '';
        try {
          raw = ObjC.unwrap(msgObj.body);
          const msg = typeof raw === 'string' ? JSON.parse(raw) : raw;
          if (!msg || !msg.cmd) return;

          switch (msg.cmd) {
            case 'ready':
              if (msg.who === 'stage') {
                stageReady = true;
              } else if (msg.who === 'overlay') {
                overlayReady = true;
                while (fxQueue.length) evalIn(overlayWv, fxQueue.shift());
              }
              break;
            case 'fx':
              sendFx(msg.data);
              break;
            case 'spawn':
              spawnSatellite(msg);
              break;
            case 'act':
              actSatellite(msg.id, msg.name);
              break;
            case 'converge':
              startConverge(msg.ids, msg.dur);
              break;
            case 'close':
              closeSatellite(msg.id);
              break;
            case 'hideStage':
              if (stageWin) stageWin.setIgnoresMouseEvents(true);
              break;
            case 'skipPrelude':
              evalIn(stageWv, 'window.__enterStage && window.__enterStage();');
              break;
            case 'showStage':
              if (stageWin) {
                stageWin.setIgnoresMouseEvents(false);
                stageWin.makeKeyAndOrderFront(null);
                app.activateIgnoringOtherApps(true);
              }
              break;
            case 'quit':
              quitAll();
              break;
          }
        } catch (err) {
          console.log('host err:', err, raw);
        }
      },
    },
    'convergeTick:': {
      types: ['void', ['id']],
      implementation: function (tmr) {
        if (!convergeState) {
          try { tmr.invalidate; } catch (_) {}
          return;
        }
        const k = Math.min(1, (Date.now() - convergeState.t0) / convergeState.durMs);
        const e = k * k * (0.35 + 0.65 * k);
        for (let i = 0; i < convergeState.items.length; i++) {
          const it = convergeState.items[i];
          const sat = satellites.get(it.id);
          if (!sat) continue;
          const nx = it.x0 + (it.tx - it.x0) * e;
          const ny = it.y0 + (it.ty - it.y0) * e;
          try { sat.win.setFrameOrigin($.NSMakePoint(nx, ny)); } catch (_) {}
        }
        if (k >= 1) {
          convergeState = null;
          convergeTimer = null;
          try { tmr.invalidate; } catch (_) {}
        }
      },
    },
    'watchdogTick:': {
      types: ['void', ['id']],
      implementation: function () {
        if (!stageReady) {
          console.log('Watchdog: stage.html did not report ready within 5s; aborting safely.');
          quitAll();
        }
      },
    },
  },
});

const hostHandler = $.AnnivHostHandler.alloc.init;

// 1. Stage window (level 998) — click-through during prelude so desktop NEVER locks up!
{
  const created = makeWindow(scr, 998, !SKIP_PRELUDE, hostHandler, false);
  stageWin = created.win;
  stageWv = created.wv;
  const qp = [];
  if (SKIP_PRELUDE) qp.push('skip=1');
  if (START_PAGE !== '') qp.push('page=' + encodeURIComponent(START_PAGE));
  loadPage(stageWv, qp.length ? 'stage.html?' + qp.join('&') : 'stage.html');
  stageWin.orderFrontRegardless;
  if (SKIP_PRELUDE) {
    stageWin.makeKeyAndOrderFront(null);
    app.activateIgnoringOtherApps(true);
  }
}

// 2. Fireworks transparent overlay window on top of everything (level 1001, click-through)
{
  const created = makeWindow(scr, 1001, true, hostHandler, true);
  overlayWin = created.win;
  overlayWv = created.wv;
  loadPage(overlayWv, 'overlay.html');
  overlayWin.orderFrontRegardless;
}

// Safety watchdog: if stage.html fails to load within 5.5s (e.g. server killed), auto-exit immediately
$.NSTimer.scheduledTimerWithTimeIntervalTargetSelectorUserInfoRepeats(
  5.5,
  hostHandler,
  'watchdogTick:',
  null,
  false
);

app.run;
