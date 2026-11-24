/* =====================================================================
   STAGE.JS — Màn Pháo Hoa Đa Cửa Sổ + Bức Thư Tay + Hạt 3D ghép ảnh thật + Finale tối nền
   ===================================================================== */
(function () {
  if (window.gsap && window.CustomEase) {
    gsap.registerPlugin(CustomEase);
    CustomEase.create('hand', '0.16, 1, 0.3, 1');
  }

  const EASE = window.CustomEase ? 'hand' : 'power3.out';
  const SHOW = window.SHOW;

  const letterRuled = document.getElementById('letter-ruled');
  const letterDate = document.getElementById('letter-date');
  const letterGreeting = document.getElementById('letter-greeting');
  const letterBody = document.getElementById('letter-body');
  const letterSign = document.getElementById('letter-sign');
  const letterSignoff = document.getElementById('letter-signoff');
  const letterSignature = document.getElementById('letter-signature');
  const letterPageNote = document.getElementById('letter-page-note');
  const memoryDesk = document.getElementById('memory-desk');
  const roomsTitle = document.getElementById('rooms-title');
  const roomsRow = document.getElementById('rooms-row');
  const finaleTitle = document.getElementById('finale-title');
  const finaleSub = document.getElementById('finale-sub');
  const devWinEl = document.getElementById('dev-windows');

  const hudProgress = document.getElementById('hud-progress');
  const btnPlay = document.getElementById('btn-play');
  const btnSound = document.getElementById('btn-sound');
  const btnFull = document.getElementById('btn-full-letter');
  const btnSkip = document.getElementById('btn-skip');

  /* ---------------- DevHost fallback when opened directly in browser ---------------- */
  let fallbackFx = null;
  const devFrames = new Map();

  if (!Host.native) {
    const fxCanvas = document.getElementById('fx-fallback');
    if (fxCanvas && window.Fireworks) {
      fallbackFx = new Fireworks(fxCanvas, { dprCap: 1.5 });
    }
    window.DevHost = {
      handle(msg) {
        if (!msg || !msg.cmd) return;
        if (msg.cmd === 'fx' && fallbackFx) {
          fallbackFx.cmd(msg.data);
        } else if (msg.cmd === 'spawn') {
          if (devFrames.has(msg.id)) return;
          const ifr = document.createElement('iframe');
          ifr.className = 'dev-win';
          ifr.src = msg.url;
          const w = msg.w || 280;
          const h = msg.h || 280;
          ifr.style.width = w + 'px';
          ifr.style.height = h + 'px';
          const cx = (msg.x <= 1.5 ? msg.x * window.innerWidth : msg.x) - w / 2;
          const cy = (msg.y <= 1.5 ? msg.y * window.innerHeight : msg.y) - h / 2;
          ifr.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, cx)) + 'px';
          ifr.style.top = Math.max(8, Math.min(window.innerHeight - h - 8, cy)) + 'px';
          devWinEl.appendChild(ifr);
          devFrames.set(msg.id, ifr);
        } else if (msg.cmd === 'act') {
          const targets = msg.id === '*' ? [...devFrames.values()] : [devFrames.get(msg.id)].filter(Boolean);
          targets.forEach((f) => f.contentWindow && f.contentWindow.postMessage({ __act: msg.name }, '*'));
        } else if (msg.cmd === 'close') {
          const f = devFrames.get(msg.id);
          if (f) {
            f.remove();
            devFrames.delete(msg.id);
          }
        }
      },
    };
    window.addEventListener('message', (e) => {
      if (e.data && e.data.__host) window.DevHost.handle(e.data.__host);
    });
  }

  function sendFx(data) {
    Host.post({ cmd: 'fx', data });
  }
  function spawnWin(id, url, x, y, w, h) {
    Host.post({ cmd: 'spawn', id, url, x, y, w, h });
  }
  function actWin(id, name) {
    Host.post({ cmd: 'act', id, name });
  }
  function closeAllSatellites() {
    actWin('*', 'implode');
    actWin('*', 'out');
  }

  /* ---------------- Helpers ---------------- */
  function calcDays() {
    const start = new Date(SHOW.startDate + 'T00:00:00');
    return Math.floor(Math.max(0, Date.now() - start.getTime()) / 86400000);
  }

  function isVideo(src) {
    return /\.(mp4|mov|webm|m4v)$/i.test(src || '');
  }

  function makeMediaEl(src) {
    if (isVideo(src)) {
      const v = document.createElement('video');
      v.src = src;
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.preload = 'auto';
      // Stagger hardware video decoder start slightly past card entrance frame to prevent hitch
      setTimeout(() => v.play().catch(() => {}), 160);
      return v;
    }
    const img = new Image();
    img.src = src;
    return img;
  }

  function cleanupVideos(root) {
    if (!root) return;
    root.querySelectorAll('video').forEach((v) => {
      v.pause();
      v.removeAttribute('src');
      v.load();
    });
  }

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function formatParagraphWithHighlights(text, highlights) {
    let html = escapeHtml(text);
    (highlights || []).forEach((phrase) => {
      const esc = escapeHtml(phrase);
      html = html.replace(esc, `<span class="ink-mark">${esc}</span>`);
    });
    return html;
  }

  /* ---------------- 3D Particle Engine + Atmosphere + Async Warmup ---------------- */
  const atmo = new Atmosphere(document.getElementById('atmo'), { dprCap: 1.5 });
  const particles = new Particles(document.getElementById('gl'));
  particles.warmup();

  let heavyPrepStarted = false;
  function startHeavyPrep() {
    if (heavyPrepStarted) return;
    heavyPrepStarted = true;
    const asyncPrep = ['four', 'wave', 'road', 'ring', 'sun', 'heart', 'infinity'];
    const roomsPage = SHOW.pages.find((pg) => pg.type === 'rooms');
    if (roomsPage && roomsPage.stays) {
      roomsPage.stays.forEach((s, i) => {
        if (!s.future) asyncPrep.push(() => particles.addTextShape('room' + i, s.room, { height: 2.1 }));
      });
    }
    if (SHOW.photoShapes) {
      Object.entries(SHOW.photoShapes).forEach(([key, url]) => {
        asyncPrep.push(() => particles.loadPhotoShape(key, url, { width: 3.6 }));
      });
    }
    particles.prepareAsync(asyncPrep, 180);

    const urls = new Set();
    (SHOW.ring || []).forEach((u) => urls.add(u));
    SHOW.pages.forEach((pg) => {
      (pg.polaroids || []).forEach((m) => !isVideo(m.src) && urls.add(m.src));
      (pg.stays || []).forEach((st) => (st.media || []).forEach((m) => !isVideo(m.src) && urls.add(m.src)));
    });
    const list = [...urls];
    let idx = 0;
    const stepImg = () => {
      if (idx >= list.length) return;
      const im = new Image();
      im.src = list[idx++];
      if (im.decode) im.decode().catch(() => {});
      setTimeout(stepImg, 140);
    };
    setTimeout(stepImg, 250);
  }

  // Only preload the 6 tiny prelude images during prelude so 8GB Macs stay silky smooth
  (function preloadPreludeImages() {
    const urls = new Set();
    if (SHOW.kakaoIntro && SHOW.kakaoIntro.photo) urls.add(SHOW.kakaoIntro.photo);
    (SHOW.wordBursts || []).forEach((w) => w.bg && urls.add(w.bg));
    const list = [...urls];
    let idx = 0;
    const step = () => {
      if (idx >= list.length) return;
      const im = new Image();
      im.src = list[idx++];
      if (im.decode) im.decode().catch(() => {});
      setTimeout(step, 140);
    };
    setTimeout(step, 200);
  })();

  /* ---------------- State & Timers ---------------- */
  let timers = [];
  function after(sec, fn) {
    const t = setTimeout(fn, sec * 1000);
    timers.push(t);
    return t;
  }
  function clearTimers() {
    timers.forEach((t) => clearTimeout(t));
    timers = [];
  }

  let preludeActive = false;
  let currentIndex = 0;
  let hasRenderedStage = false;
  let transitionToken = 0;
  let paused = false;
  let fullLetterMode = false;
  let pageTimer = null;
  let pageTimeouts = [];

  function pageAfter(ms, fn) {
    const id = setTimeout(fn, ms);
    pageTimeouts.push(id);
    return id;
  }
  function clearPageTimers() {
    if (pageTimer) {
      clearTimeout(pageTimer);
      pageTimer = null;
    }
    pageTimeouts.forEach((id) => clearTimeout(id));
    pageTimeouts = [];
  }

  /* ---------------- 1. PRELUDE: Multi-window Firework Show ---------------- */
  function enterStage() {
    if (!preludeActive && document.body.classList.contains('stage-on')) return;
    startHeavyPrep();
    preludeActive = false;
    clearTimers();
    closeAllSatellites();
    document.body.classList.remove('prelude-on');
    document.body.classList.add('stage-on');
    Host.post({ cmd: 'showStage' });
    atmo.start();
    particles.start();
    particles.opacity(0.92, 1.4);
    const startPage = Math.max(0, Math.min(SHOW.pages.length - 1, parseInt(Host.q('page', '0'), 10) || 0));
    showPage(startPage);
  }

  function runPrelude() {
    clearTimers();
    clearPageTimers();
    fullLetterMode = false;
    document.body.classList.remove('full-letter', 'finale-mode', 'rooms-mode');
    btnFull.textContent = 'Xem nguyên bức thư';

    preludeActive = true;
    hasRenderedStage = false;
    document.body.classList.remove('stage-on');
    document.body.classList.add('prelude-on');

    if (Host.q('skip', '0') === '1') {
      enterStage();
      return;
    }

    const days = calcDays();
    const fmt = (s) => s.replace('{days}', days.toLocaleString('vi-VN'));

    const n0 = SHOW.notifications[0];
    const n1 = SHOW.notifications[1];
    after(0.2, () => {
      sendFx({ t: 'sfx', kind: 'notify', x: 0.86 });
      spawnWin(
        'n0',
        `notify.html?id=n0&title=${encodeURIComponent(fmt(n0.title))}&body=${encodeURIComponent(fmt(n0.body))}`,
        0.86, 0.08, 360, 86
      );
    });
    after(1.7, () => {
      sendFx({ t: 'sfx', kind: 'notify', x: 0.86 });
      spawnWin(
        'n1',
        `notify.html?id=n1&title=${encodeURIComponent(fmt(n1.title))}&body=${encodeURIComponent(fmt(n1.body))}`,
        0.86, 0.19, 360, 86
      );
    });
    after(2.95, () => {
      actWin('n0', 'out');
      actWin('n1', 'out');
    });

    /* ---- Act 1: Kakao Mascot Desktop Takeover ---- */
    let curT = 3.2;
    const kk = SHOW.kakaoIntro;
    if (kk) {
      after(curT, () => {
        sendFx({ t: 'sfx', kind: 'kakaoPop', x: 0.5 });
        sendFx({ t: 'flash', x: 0.5, y: 0.5, r: 260, life: 0.45, color: '#fff3dc' });
        sendFx({ t: 'burst', x: 0.5, y: 0.34, type: 'glitter', palette: 'gold', size: 0.85 });
        const q = new URLSearchParams({
          id: 'kakao',
          mode: 'main',
          photo: kk.photo || '',
          s1: kk.step1 || '',
          s2: kk.step2 || '',
          s3: kk.step3 || '',
          done: kk.done || '',
        });
        spawnWin('kakao', `kakao.html?${q.toString()}`, 0.5, 0.5, 650, 420);
      });

      const stamps = (kk.stamps || []).slice(0, 2);
      stamps.forEach((st, idx) => {
        after(curT + 1.15 + idx * 1.45, () => {
          sendFx({ t: 'sfx', kind: 'pawTap', x: st.x, step: idx });
          sendFx({ t: 'burst', x: st.x, y: st.y, type: idx % 2 === 0 ? 'glitter' : 'heart', palette: idx % 2 === 0 ? 'gold' : 'rose', size: 0.65 });
          const sq = new URLSearchParams({
            id: 'kp' + idx,
            mode: 'stamp',
            text: st.text,
            rot: String(st.rot || 0),
          });
          spawnWin('kp' + idx, `kakao.html?${sq.toString()}`, st.x, st.y, 350, 96);
        });
      });

      after(curT + 1.15, () => {
        sendFx({ t: 'sfx', kind: 'pawTap', x: 0.5, step: 1 });
        actWin('kakao', 'step1');
      });
      after(curT + 2.45, () => {
        sendFx({ t: 'sfx', kind: 'pawTap', x: 0.5, step: 3 });
        actWin('kakao', 'step2');
      });
      after(curT + 3.75, () => {
        sendFx({ t: 'sfx', kind: 'pawTap', x: 0.5, step: 5 });
        actWin('kakao', 'step3');
      });
      after(curT + 4.95, () => {
        sendFx({ t: 'sfx', kind: 'kakaoDone', x: 0.5 });
        sendFx({ t: 'burst', x: 0.5, y: 0.24, type: 'doubleHeart', palette: 'rose', size: 1.1 });
        actWin('kakao', 'done');
      });

      after(curT + 6.95, () => {
        actWin('kakao', 'out');
        stamps.forEach((_, idx) => actWin('kp' + idx, 'out'));
        sendFx({ t: 'flash', x: 0.5, y: 0.5, r: 300, life: 0.45, color: '#fff3dc' });
      });

      curT += 7.65;
    } else {
      curT = 3.25;
    }

    /* ---- Act 2: 5 Grand Celebration Cards (held longer so she can savor them) ---- */
    const words = SHOW.wordBursts || [];
    const gaps = [1.02, 0.94, 0.88, 0.84];
    const flyDur = 0.88;

    words.forEach((wb, i) => {
      const tLaunch = curT;
      if (i < gaps.length) curT += gaps[i];

      after(tLaunch, () => {
        sendFx({
          t: 'launch',
          x: wb.x,
          y: wb.y,
          x0: 0.5 + (wb.x - 0.5) * 0.25,
          dur: flyDur,
          type: wb.fx || 'peony',
          palette: wb.pal || 'gold',
          size: 1.15 + i * 0.08,
        });
      });
      after(tLaunch + flyDur - 0.06, () => {
        sendFx({ t: 'sfx', kind: 'slam', x: wb.x, step: i });
        const q = new URLSearchParams({
          id: 'w' + i,
          text: wb.text,
          tone: wb.tone || 'gold',
          bg: wb.bg || '',
          rot: String(wb.rot || 0),
        });
        spawnWin('w' + i, `word.html?${q.toString()}`, wb.x, wb.y, wb.w, wb.h);
      });
    });

    const tAfterWords = curT + flyDur + 0.35;
    after(tAfterWords, () => {
      sendFx({ t: 'sweep', count: 7, dir: 1, type: 'brocade', palette: 'gold', y: 0.26, dur: 0.85 });
      sendFx({ t: 'launch', x: 0.5, y: 0.30, type: 'doubleHeart', palette: 'rose', size: 1.4, dur: 0.9, delay: 0.25 });
    });

    // Second celebratory wave while all 5 cards stay glowing on screen
    const holdSec = Number(SHOW.wordHoldSec) || 6.2;
    after(tAfterWords + Math.min(2.8, holdSec * 0.45), () => {
      sendFx({ t: 'salvo', count: 5, type: 'willow', palette: 'gold', y: 0.25, spread: 0.78, dur: 0.95 });
      sendFx({ t: 'launch', x: 0.32, y: 0.28, type: 'heart', palette: 'rose', size: 1.25, dur: 0.85, delay: 0.2 });
      sendFx({ t: 'launch', x: 0.68, y: 0.28, type: 'heart', palette: 'rose', size: 1.25, dur: 0.85, delay: 0.35 });
    });

    const tCharge = tAfterWords + holdSec;
    after(tCharge, () => {
      sendFx({ t: 'sfx', kind: 'charge' });
      words.forEach((_, i) => actWin('w' + i, 'charge'));
    });

    const tImplode = tCharge + 0.48;
    after(tImplode, () => {
      sendFx({ t: 'sfx', kind: 'implode' });
      words.forEach((wb, i) => {
        actWin('w' + i, 'implode');
        sendFx({ t: 'streak', x0: wb.x, y0: wb.y, x: 0.5, y: 0.5, dur: 0.68, delay: i * 0.03, palette: 'gold' });
      });
      [[0.12, 0.14], [0.88, 0.14], [0.12, 0.86], [0.88, 0.86], [0.5, 0.1]].forEach(([sx, sy], j) => {
        sendFx({ t: 'streak', x0: sx, y0: sy, x: 0.5, y: 0.5, dur: 0.68, delay: 0.06 + j * 0.03, palette: 'gold' });
      });
    });

    after(tImplode + 0.78, () => {
      sendFx({ t: 'sfx', kind: 'supernova' });
      sendFx({ t: 'flash', x: 0.5, y: 0.5, r: 540, life: 0.8, color: '#fff3dc' });
      sendFx({ t: 'salvo', count: 9, type: 'brocade', palette: 'gold', y: 0.24, spread: 0.86, dur: 1.05 });
      sendFx({ t: 'burst', x: 0.5, y: 0.32, type: 'doubleHeart', palette: 'rose', size: 1.45 });
      enterStage();
    });
  }

  /* ---------------- 2. HANDWRITTEN LETTER & FINALE PAGES ---------------- */
  const DEFAULT_SLOTS = ['tr', 'bl', 'tl', 'br', 'ml', 'mr'];

  function appendPolaroid(item, idx = 0, stayIdx = null) {
    const slot = item.slot || DEFAULT_SLOTS[idx % DEFAULT_SLOTS.length];
    const card = document.createElement('div');
    card.className = `polaroid slot-${slot}`;
    if (stayIdx !== null) card.dataset.stay = String(stayIdx);
    const frame = document.createElement('div');
    frame.className = 'polaroid-frame';
    frame.appendChild(makeMediaEl(item.src));
    card.appendChild(frame);

    if (item.note) {
      const note = document.createElement('div');
      note.className = 'polaroid-note';
      note.textContent = item.note;
      card.appendChild(note);
    }
    memoryDesk.appendChild(card);

    gsap.from(card, {
      y: 28,
      opacity: 0,
      scale: 0.94,
      duration: 0.75,
      delay: 0.1 + idx * 0.18,
      ease: EASE,
    });
    return card;
  }

  function renderPolaroids(list, extraClass) {
    cleanupVideos(memoryDesk);
    memoryDesk.innerHTML = '';
    memoryDesk.className = 'memory-desk' + (extraClass ? ' ' + extraClass : '');
    (list || []).forEach((item, idx) => appendPolaroid(item, idx));
  }

  function showPage(index) {
    const pages = SHOW.pages;
    if (index < 0) index = 0;
    if (index >= pages.length) index = pages.length - 1;
    clearPageTimers();

    if (currentIndex !== index && pages[currentIndex] && pages[currentIndex].finale) {
      closeAllSatellites();
    }

    currentIndex = index;
    const p = pages[index];
    const isLetter = (pg) => !pg.finale && pg.type !== 'rooms';
    const letterPagesCount = pages.filter(isLetter).length;

    const wasLetter = hasRenderedStage && !document.body.classList.contains('rooms-mode') && !document.body.classList.contains('finale-mode');
    Soundtrack.setMood(p.mood || 'warm');
    atmo.setMode(p.atmo || 'petals');
    document.body.classList.remove('rooms-mode');

    /* --- ROOMS: progressive journey of hotel key fobs + per-room photos + open future --- */
    if (p.type === 'rooms') {
      document.body.classList.remove('finale-mode');
      document.body.classList.add('rooms-mode');
      hudProgress.textContent = p.title || '';

      cleanupVideos(memoryDesk);
      memoryDesk.innerHTML = '';
      memoryDesk.className = 'memory-desk';

      particles.opacity(0.95, 1.0);
      particles.morph('heart', { dur: 2.0, scatter: 0.9, palette: 'gold', offset: [0, 1.5], scale: 0.55 });

      roomsTitle.textContent = p.title || '';
      roomsRow.innerHTML =
        `<div class="rooms-rail"><div class="rooms-rail-fill" id="rooms-rail-fill"></div></div>` +
        p.stays
          .map((s, i) => `
            <div class="key ${s.future ? 'key-future' : 'key-' + ((i % 3) + 1)}" data-stay="${i}">
              <div class="key-hotel">${escapeHtml(s.hotel)}</div>
              <div class="key-room">${escapeHtml(s.room)}</div>
              <div class="key-kind">${escapeHtml(s.kind)}</div>
              <div class="key-note">${escapeHtml(s.note || '')}</div>
            </div>`)
          .join('');
      gsap.from(roomsTitle, { y: 14, opacity: 0, duration: 0.9, ease: EASE });

      const railFill = document.getElementById('rooms-rail-fill');
      const keys = [...roomsRow.querySelectorAll('.key')];
      gsap.set(keys, { opacity: 0 });

      const focusStay = (stayIdx, withFx = false) => {
        const s = p.stays[stayIdx];
        keys.forEach((k, idx) => k.classList.toggle('is-active', idx === stayIdx));
        memoryDesk.querySelectorAll('.polaroid').forEach((card) => {
          card.classList.toggle('is-highlighted', Number(card.dataset.stay) === stayIdx);
        });
        const shapeName = s.future ? 'infinity' : 'room' + stayIdx;
        particles.morph(shapeName, {
          dur: 1.7,
          scatter: 0.8,
          palette: s.future || stayIdx === 1 ? 'rose' : 'gold',
          offset: [0, 1.5],
          scale: s.future ? 0.85 : 1,
        });
        if (withFx) {
          const r = keys[stayIdx].getBoundingClientRect();
          sendFx({
            t: 'launch',
            x: (r.left + r.width / 2) / window.innerWidth,
            y: Math.max(0.1, (r.top - 80) / window.innerHeight),
            type: s.future ? 'heart' : 'glitter',
            palette: s.future || stayIdx === 1 ? 'rose' : 'gold',
            size: s.future ? 1.1 : 0.9,
            dur: 0.9,
          });
        }
      };

      const step = 3900;
      p.stays.forEach((s, i) => {
        if (!s.future) particles.addTextShape('room' + i, s.room, { height: 2.1 });
        pageAfter(650 + i * step, () => {
          if (currentIndex !== index) return;
          const el = keys[i];
          const tilt = s.future ? 1.8 : [-3, 1.6, -1.4][i % 3];
          sendFx({ t: 'sfx', kind: 'keyDrop', x: 0.25 + i * 0.16, step: i });
          gsap.to(railFill, { scaleX: (i + 1) / p.stays.length, duration: 1.2, ease: EASE });
          gsap.fromTo(
            el,
            { opacity: 0, y: -70, rotation: tilt + 18 },
            { opacity: 1, y: 0, rotation: tilt, duration: 1.8, ease: 'elastic.out(1, 0.42)' }
          );
          (s.media || []).forEach((item, mIdx) => appendPolaroid(item, mIdx, i));
          focusStay(i, true);
        });
      });

      keys.forEach((k, i) => {
        k.addEventListener('click', () => focusStay(i, true));
        k.addEventListener('mouseenter', () => {
          if (parseFloat(getComputedStyle(k).opacity) > 0.5) focusStay(i, false);
        });
      });

      pageAfter(650 + p.stays.length * step + 600, () => {
        if (currentIndex === index) {
          keys.forEach((k) => k.classList.remove('is-active'));
          memoryDesk.querySelectorAll('.polaroid').forEach((c) => c.classList.remove('is-highlighted'));
          particles.morph('heart', { dur: 2.2, scatter: 1, palette: 'rose', offset: [0, 1.45], scale: 0.65 });
        }
      });

      if (p.dur > 0 && !paused && !fullLetterMode) {
        pageTimer = setTimeout(() => {
          if (currentIndex === index && !paused && !fullLetterMode) showPage(index + 1);
        }, p.dur * 1000);
      }
      return;
    }

    /* --- GRAND FINALE DARK SKY (hide bright paper & polaroids for max fireworks contrast) --- */
    if (p.finale) {
      document.body.classList.add('finale-mode');
      cleanupVideos(memoryDesk);
      memoryDesk.innerHTML = '';
      hudProgress.textContent = 'Chúc mừng kỷ niệm 4 năm';

      particles.opacity(0.95, 1.0);
      particles.morph(p.shape || 'heart', {
        dur: 2.2,
        scatter: 1.15,
        palette: 'rose',
        offset: [0, 0.22],
        scale: 1.25,
      });

      finaleTitle.textContent = p.title || '';
      finaleSub.textContent = p.subtitle || '';
      gsap.from(finaleTitle, { y: 26, opacity: 0, duration: 1.1, delay: 0.4, ease: EASE });
      gsap.from(finaleSub, { y: 20, opacity: 0, duration: 1.0, delay: 0.85, ease: EASE });

      // Full-sky vivid fireworks salvo + sweep + 18s choreographed finale
      sendFx({ t: 'burst', x: 0.5, y: 0.32, type: 'doubleHeart', palette: 'rose', size: 1.55 });
      sendFx({ t: 'sweep', count: 7, dir: 1, type: 'brocade', palette: 'gold', y: 0.24, dur: 0.85 });
      sendFx({ t: 'finale', dur: 18 });

      // Orbiting frameless photo ring around the celebration
      const ring = SHOW.ring || [];
      ring.forEach((src, i) => {
        const ang = (i / ring.length) * Math.PI * 2 - Math.PI / 2;
        const x = 0.5 + Math.cos(ang) * 0.37;
        const y = 0.5 + Math.sin(ang) * 0.33;
        pageAfter(1400 + i * 240, () => {
          if (currentIndex !== index) return;
          const q = new URLSearchParams({ id: 'r' + i, src, small: '1' });
          spawnWin('r' + i, `memory.html?${q.toString()}`, x, y, 165, 185);
        });
      });

      pageAfter(10800, () => {
        if (currentIndex !== index) return;
        ring.forEach((src, i) => {
          actWin('r' + i, 'implode');
        });
        sendFx({ t: 'salvo', count: 5, type: 'glitter', palette: 'gold', y: 0.28, spread: 0.72, dur: 1.0 });
      });
      return;
    }

    /* --- HANDWRITTEN LETTER PAGES 1..6 (smooth cross-fade on page turn) --- */
    const token = ++transitionToken;
    const isTurn = wasLetter;
    hasRenderedStage = true;
    document.body.classList.remove('finale-mode');

    const pageLabel = `Trang ${pages.slice(0, index + 1).filter(isLetter).length} / ${letterPagesCount}`;
    letterPageNote.textContent = pageLabel;
    hudProgress.textContent = pageLabel;

    const isPhotoMorph = p.shape && p.shape.startsWith('photo');
    particles.opacity(isPhotoMorph ? 1.0 : 0.88, 1.2);
    particles.morph(p.shape || 'four', {
      dur: 2.3,
      scatter: isPhotoMorph ? 0.65 : 0.95,
      palette: p.palette || 'gold',
      offset: p.shapeOffset || [1.9, 0.05],
      scale: p.shapeScale || 0.95,
    });

    const mountLetterContent = () => {
      if (token !== transitionToken) return;
      letterDate.textContent = index === 0 ? SHOW.dateLabel : '';
      letterGreeting.textContent = p.greeting || '';
      letterGreeting.style.display = p.greeting ? 'block' : 'none';

      letterBody.innerHTML = p.paragraphs
        .map((para) => `<p class="letter-para">${formatParagraphWithHighlights(para, p.highlights)}</p>`)
        .join('');

      if (p.signature) {
        letterSignoff.textContent = p.signoff || '';
        letterSignature.textContent = p.signature;
        letterSign.hidden = false;
      } else {
        letterSign.hidden = true;
      }
      letterRuled.scrollTop = 0;
      letterRuled.classList.remove('turning');

      if (p.greeting) {
        gsap.from(letterGreeting, { y: 12, opacity: 0, duration: 0.75, ease: EASE });
      }
      const paraEls = [...letterBody.querySelectorAll('.letter-para')];
      gsap.from(paraEls, {
        y: 14,
        opacity: 0,
        duration: 0.8,
        stagger: 0.3,
        delay: p.greeting ? 0.12 : 0.04,
        ease: EASE,
      });

      if (!letterSign.hidden) {
        gsap.from(letterSign, { y: 14, opacity: 0, duration: 0.85, delay: 0.75, ease: EASE });
      }

      const marks = [...letterBody.querySelectorAll('.ink-mark')];
      marks.forEach((m, i) => {
        pageAfter(950 + i * 850, () => {
          if (currentIndex === index) m.classList.add('drawn');
        });
      });

      renderPolaroids(p.polaroids, p.polaroidsClass);
    };

    if (isTurn) {
      sendFx({ t: 'sfx', kind: 'pageTurn' });
      letterRuled.classList.add('turning');
      const oldCards = memoryDesk.querySelectorAll('.polaroid');
      if (oldCards.length) {
        gsap.to(oldCards, { opacity: 0, y: -12, scale: 0.96, duration: 0.22, ease: 'power2.in' });
      }
      pageAfter(230, mountLetterContent);
    } else {
      mountLetterContent();
    }

    if (index === 0) {
      sendFx({ t: 'burst', x: 0.72, y: 0.34, type: 'glitter', palette: 'gold', size: 0.95 });
    }
    if (p.firework === 'ring') {
      pageAfter(2000, () => {
        if (currentIndex === index) {
          sendFx({ t: 'launch', x: 0.74, y: 0.32, type: 'ring', palette: 'gold', size: 1.1 });
        }
      });
    }

    if (p.dur > 0 && !paused && !fullLetterMode) {
      pageTimer = setTimeout(() => {
        if (currentIndex === index && !paused && !fullLetterMode) showPage(index + 1);
      }, p.dur * 1000);
    }
  }

  /* ---------------- 3. FULL LETTER VIEW TOGGLE ---------------- */
  function toggleFullLetter() {
    fullLetterMode = !fullLetterMode;
    document.body.classList.remove('finale-mode', 'rooms-mode');
    document.body.classList.toggle('full-letter', fullLetterMode);

    if (fullLetterMode) {
      clearPageTimers();
      closeAllSatellites();
      cleanupVideos(memoryDesk);
      memoryDesk.innerHTML = '';
      btnFull.textContent = 'Quay lại xem từng trang';
      letterPageNote.textContent = 'Nguyên bức thư';
      hudProgress.textContent = 'Toàn bộ bức thư';

      particles.opacity(0.85, 1.2);
      particles.morph('heart', { dur: 2.0, palette: 'rose', offset: [0, 0], scale: 1.15 });
      atmo.setMode('petals_gold');
      Soundtrack.setMood('finale');

      const letterPages = SHOW.pages.filter((pg) => !pg.finale && pg.paragraphs);
      letterDate.textContent = SHOW.dateLabel;
      letterGreeting.textContent = letterPages[0].greeting || '';
      letterGreeting.style.display = 'block';

      const allParas = letterPages.flatMap((pg) =>
        pg.paragraphs.map((para) => `<p class="letter-para">${formatParagraphWithHighlights(para, pg.highlights)}</p>`)
      );
      letterBody.innerHTML = allParas.join('');

      const last = letterPages[letterPages.length - 1];
      letterSignoff.textContent = last.signoff || '';
      letterSignature.textContent = last.signature || '';
      letterSign.hidden = false;
      letterRuled.scrollTop = 0;

      requestAnimationFrame(() => {
        letterBody.querySelectorAll('.ink-mark').forEach((m) => m.classList.add('drawn'));
      });
    } else {
      btnFull.textContent = 'Xem nguyên bức thư';
      showPage(currentIndex);
    }
  }

  /* ---------------- 4. CONTROLS & KEYBOARD ---------------- */
  function togglePause() {
    if (fullLetterMode) return;
    paused = !paused;
    btnPlay.textContent = paused ? 'Tiếp tục' : 'Tạm dừng';
    if (paused) {
      clearPageTimers();
    } else {
      const p = SHOW.pages[currentIndex];
      if (p && p.dur > 0) {
        pageTimer = setTimeout(() => showPage(currentIndex + 1), 5000);
      }
    }
  }

  document.getElementById('btn-prev').addEventListener('click', () => {
    if (fullLetterMode) toggleFullLetter();
    paused = false;
    btnPlay.textContent = 'Tạm dừng';
    showPage(currentIndex - 1);
  });

  document.getElementById('btn-next').addEventListener('click', () => {
    if (fullLetterMode) toggleFullLetter();
    paused = false;
    btnPlay.textContent = 'Tạm dừng';
    showPage(currentIndex + 1);
  });

  btnPlay.addEventListener('click', togglePause);
  btnFull.addEventListener('click', toggleFullLetter);
  btnSkip.addEventListener('click', () => enterStage());

  document.getElementById('btn-fire').addEventListener('click', () => {
    const isFin = document.body.classList.contains('finale-mode');
    if (isFin) {
      sendFx({ t: 'finale', dur: 12 });
    } else {
      sendFx({ t: 'launch', x: 0.65 + Math.random() * 0.25, y: 0.2 + Math.random() * 0.25, type: 'heart', palette: 'rose', size: 1.2 });
      sendFx({ t: 'launch', x: 0.55 + Math.random() * 0.35, y: 0.16 + Math.random() * 0.26, type: 'willow', palette: 'gold', size: 1.05, delay: 0.16 });
    }
  });

  btnSound.addEventListener('click', () => {
    const on = Soundtrack.toggle();
    btnSound.textContent = on ? 'Nhạc nền: Bật' : 'Nhạc nền: Tắt';
  });

  function quitShow() {
    Soundtrack.stop();
    closeAllSatellites();
    Host.post({ cmd: 'quit' });
  }
  document.getElementById('btn-quit').addEventListener('click', quitShow);

  document.getElementById('fin-read').addEventListener('click', () => {
    paused = true;
    btnPlay.textContent = 'Tiếp tục';
    showPage(0);
  });
  document.getElementById('fin-fire').addEventListener('click', () => sendFx({ t: 'finale', dur: 12 }));
  document.getElementById('fin-replay').addEventListener('click', () => {
    paused = false;
    btnPlay.textContent = 'Tạm dừng';
    runPrelude();
  });
  document.getElementById('fin-quit').addEventListener('click', quitShow);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'l') {
      if (preludeActive) enterStage();
      else if (!fullLetterMode) showPage(currentIndex + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'h') {
      if (!preludeActive && !fullLetterMode) showPage(currentIndex - 1);
    } else if (e.key === ' ') {
      if (fullLetterMode) return;
      e.preventDefault();
      if (preludeActive) enterStage();
      else togglePause();
    } else if (e.key === 'Escape') {
      quitShow();
    }
  });

  window.addEventListener('pointerdown', () => {
    Soundtrack.start();
    if (fallbackFx) fallbackFx.sound.resume();
  }, { once: true });

  Soundtrack.start();
  runPrelude();
})();
