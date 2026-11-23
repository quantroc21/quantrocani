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

ObjC.registerSubclass({
  name: 'KeyWin',
  superclass: 'NSWindow',
  methods: {
    'canBecomeKeyWindow': { types: ['bool', []], implementation: function () { return true; } },
    'canBecomeMainWindow': { types: ['bool', []], implementation: function () { return true; } },
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
const fxQueue = [];
let stageWin = null;
let stageWv = null;
let overlayWin = null;
let overlayWv = null;

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

function makeWindow(rect, level, ignoresMouse, handler) {
  const win = $.KeyWin.alloc.initWithContentRectStyleMaskBackingDefer(rect, 0, 2, false);
  win.setOpaque(false);
  win.setBackgroundColor($.NSColor.clearColor);
  win.setLevel(level);
  win.setHasShadow(false);
  win.setIgnoresMouseEvents(ignoresMouse);
  win.setCollectionBehavior(1 | 16); // CanJoinAllSpaces | Stationary

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

  // Enforce cap to protect 8GB/16GB RAM
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

  const { win, wv } = makeWindow($.NSMakeRect(x, y, W, H), 1000, true, hostHandler);
  satellites.set(id, { win, wv });
  loadPage(wv, msg.url);
  win.orderFront(null);
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
  try {
    sat.wv.stopLoading();
    sat.win.orderOut(null);
    sat.win.setContentView(null);
    sat.win.close();
  } catch (_) {}
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
              if (msg.who === 'overlay') {
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
            case 'close':
              closeSatellite(msg.id);
              break;
            case 'showStage':
              if (stageWin) {
                stageWin.makeKeyAndOrderFront(null);
                app.activateIgnoringOtherApps(true);
              }
              break;
            case 'quit':
              for (const k of [...satellites.keys()]) closeSatellite(k);
              app.terminate(null);
              break;
          }
        } catch (err) {
          console.log('host err:', err, raw);
        }
      },
    },
  },
});

const hostHandler = $.AnnivHostHandler.alloc.init;

// 1. Stage window (level 998)
{
  const created = makeWindow(scr, 998, false, hostHandler);
  stageWin = created.win;
  stageWv = created.wv;
  const qp = [];
  if (SKIP_PRELUDE) qp.push('skip=1');
  if (START_PAGE !== '') qp.push('page=' + encodeURIComponent(START_PAGE));
  loadPage(stageWv, qp.length ? 'stage.html?' + qp.join('&') : 'stage.html');
  stageWin.makeKeyAndOrderFront(null);
}

// 2. Fireworks transparent overlay window on top of everything (level 1001, click-through)
{
  const created = makeWindow(scr, 1001, true, hostHandler);
  overlayWin = created.win;
  overlayWv = created.wv;
  loadPage(overlayWv, 'overlay.html');
  overlayWin.orderFront(null);
}

app.activateIgnoringOtherApps(true);
app.run;
