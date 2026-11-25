/* =====================================================================
   KAKAO 60/120-FPS MULTI-BONE SKELETAL PUPPET ENGINE
   - Màn 1 (~13.5s): Kakao Đại Ca đeo kính râm ngồi GIỮA MÀN HÌNH đập phím MacBook
     lạch cạch ở 60/120fps (kèm âm bàn phím cơ & đồng bọn chạy quanh đòi đi công viên),
     tới khúc gõ trúng thư mục mật 4 năm của anh Quân thì rớt kính râm mắt tròn xoe
     rồi giơ cả 2 chân hoan hô mở khóa nhường sân khấu!
   - Màn 2 (trong lúc đọc thư): Bé Kakao chạy lon ton 4 chân mượt 60/120fps ở 2 bên lề,
     tha dây dắt đòi đi công viên, lăn bụng, ngồi nghiêng đầu chớp mắt & cho click nựng.
   ===================================================================== */
(function () {
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  const ASSETS = [
    'assets/kakao/hack_tail.png',
    'assets/kakao/hack_paw_far.png',
    'assets/kakao/hack_body.png',
    'assets/kakao/hack_head_cool.png',
    'assets/kakao/hack_head_tongue.png',
    'assets/kakao/hack_laptop.png',
    'assets/kakao/hack_paw_near.png',
    'assets/kakao/hack_shock.png',
    'assets/kakao/hack_cheer.png',
    'assets/kakao/run_tail.png',
    'assets/kakao/run_leg_br.png',
    'assets/kakao/run_leg_fr.png',
    'assets/kakao/run_torso.png',
    'assets/kakao/run_leg_bl.png',
    'assets/kakao/run_leg_fl.png',
    'assets/kakao/run_head.png',
    'assets/kakao/run_head_blink.png',
    'assets/kakao/leash_prop.png',
    'assets/kakao/jump.png',
    'assets/kakao/sit_tail.png',
    'assets/kakao/sit_body.png',
    'assets/kakao/sit_head.png',
    'assets/kakao/sit_head_blink.png',
    'assets/kakao/belly_tail.png',
    'assets/kakao/belly_body.png',
  ];

  // Pre-decode toàn bộ mảnh xương ngay khi mở để chuyển trạng thái 0ms
  ASSETS.forEach((src) => {
    const im = new Image();
    im.src = src;
    if (im.decode) im.decode().catch(() => {});
  });

  function makeLayerImg(src, cls) {
    const im = new Image();
    im.src = src;
    im.className = 'k-layer ' + cls;
    im.draggable = false;
    return im;
  }

  function createPuppetDOM({
    pose = 'sit',
    size = 152,
    faceRight = true,
    text = '',
    photo = '',
    hero = false,
    companion = false,
    withHackerRig = false,
  } = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'k-actor' + (hero ? ' k-hero' : '') + (companion ? ' k-companion' : '');
    wrap.style.width = size + 'px';

    const shadow = document.createElement('div');
    shadow.className = 'k-ground-shadow';
    wrap.appendChild(shadow);

    const flipWrap = document.createElement('div');
    flipWrap.className = 'k-flip';
    wrap.appendChild(flipWrap);

    const rig = document.createElement('div');
    rig.className = 'k-rig';
    flipWrap.appendChild(rig);

    // 1) 7-BONE 60/120FPS TROT & LEASH RIG
    const trotGroup = document.createElement('div');
    trotGroup.className = 'k-mode k-mode-trot';
    const runTail  = makeLayerImg('assets/kakao/run_tail.png', 'k-run-tail');
    const runLegBR = makeLayerImg('assets/kakao/run_leg_br.png', 'k-run-leg-br');
    const runLegFR = makeLayerImg('assets/kakao/run_leg_fr.png', 'k-run-leg-fr');
    const runTorso = makeLayerImg('assets/kakao/run_torso.png', 'k-run-torso');
    const runLegBL = makeLayerImg('assets/kakao/run_leg_bl.png', 'k-run-leg-bl');
    const runLegFL = makeLayerImg('assets/kakao/run_leg_fl.png', 'k-run-leg-fl');

    const runHeadWrap = document.createElement('div');
    runHeadWrap.className = 'k-layer k-run-head-wrap';
    const runHeadOpen  = makeLayerImg('assets/kakao/run_head.png', 'k-head-open');
    const runHeadBlink = makeLayerImg('assets/kakao/run_head_blink.png', 'k-head-blink');
    const leashProp = new Image();
    leashProp.src = 'assets/kakao/leash_prop.png';
    leashProp.className = 'k-leash-prop';
    leashProp.draggable = false;
    runHeadWrap.append(runHeadOpen, runHeadBlink, leashProp);

    trotGroup.append(runTail, runLegBR, runLegFR, runTorso, runLegBL, runLegFL, runHeadWrap);
    rig.appendChild(trotGroup);

    // 2) MULTI-PART SIT PUPPET RIG
    const sitGroup = document.createElement('div');
    sitGroup.className = 'k-mode k-mode-sit';
    const sitTail = makeLayerImg('assets/kakao/sit_tail.png', 'k-sit-tail');
    const sitBody = makeLayerImg('assets/kakao/sit_body.png', 'k-sit-body');
    const sitHeadWrap = document.createElement('div');
    sitHeadWrap.className = 'k-layer k-sit-head-wrap';
    const sitHeadOpen  = makeLayerImg('assets/kakao/sit_head.png', 'k-head-open');
    const sitHeadBlink = makeLayerImg('assets/kakao/sit_head_blink.png', 'k-head-blink');
    sitHeadWrap.append(sitHeadOpen, sitHeadBlink);
    sitGroup.append(sitTail, sitBody, sitHeadWrap);
    rig.appendChild(sitGroup);

    // 3) MULTI-PART BELLY PUPPET RIG
    const bellyGroup = document.createElement('div');
    bellyGroup.className = 'k-mode k-mode-belly';
    const bellyTail = makeLayerImg('assets/kakao/belly_tail.png', 'k-belly-tail');
    const bellyBody = makeLayerImg('assets/kakao/belly_body.png', 'k-belly-body');
    bellyGroup.append(bellyTail, bellyBody);
    rig.appendChild(bellyGroup);

    // 4) MID-AIR JUMP POSE
    const jumpGroup = document.createElement('div');
    jumpGroup.className = 'k-mode k-mode-jump';
    const jumpImg = new Image();
    jumpImg.src = 'assets/kakao/jump.png';
    jumpImg.className = 'k-jump-img';
    jumpImg.draggable = false;
    jumpGroup.appendChild(jumpImg);
    rig.appendChild(jumpGroup);

    // 5) CENTER-SCREEN LAPTOP HACKER RIG (only mounted on Hero Hacker Kakao to save DOM!)
    let hackParts = null;
    if (withHackerRig) {
      const hackGroup = document.createElement('div');
      hackGroup.className = 'k-mode k-mode-hack';
      const hackTail    = makeLayerImg('assets/kakao/hack_tail.png', 'k-hack-tail');
      const hackPawFar  = makeLayerImg('assets/kakao/hack_paw_far.png', 'k-hack-paw-far');
      const hackBody    = makeLayerImg('assets/kakao/hack_body.png', 'k-hack-body');
      const hackHeadWrap = document.createElement('div');
      hackHeadWrap.className = 'k-layer k-hack-head-wrap';
      const hackHeadCool   = makeLayerImg('assets/kakao/hack_head_cool.png', 'k-hack-head-cool');
      const hackHeadTongue = makeLayerImg('assets/kakao/hack_head_tongue.png', 'k-hack-head-tongue');
      hackHeadWrap.append(hackHeadCool, hackHeadTongue);
      const hackLaptop  = makeLayerImg('assets/kakao/hack_laptop.png', 'k-hack-laptop');
      const hackPawNear = makeLayerImg('assets/kakao/hack_paw_near.png', 'k-hack-paw-near');
      const hackShock   = makeLayerImg('assets/kakao/hack_shock.png', 'k-hack-shock');
      const hackCheer   = makeLayerImg('assets/kakao/hack_cheer.png', 'k-hack-cheer');

      hackGroup.append(hackTail, hackPawFar, hackBody, hackHeadWrap, hackLaptop, hackPawNear, hackShock, hackCheer);
      rig.appendChild(hackGroup);
      hackParts = { hackGroup, hackTail, hackPawFar, hackBody, hackHeadWrap, hackLaptop, hackPawNear, hackShock, hackCheer };
    }

    if (photo) {
      const badge = document.createElement('div');
      badge.className = 'k-photo-badge';
      const bImg = new Image();
      bImg.src = photo;
      badge.appendChild(bImg);
      wrap.appendChild(badge);
    }

    const bubble = document.createElement('div');
    bubble.className =
      'k-bubble' +
      (hero ? ' k-hero-bubble' : '') +
      (companion ? ' k-comp-bubble' : '') +
      (text ? ' is-visible' : '');
    bubble.textContent = text || '';
    wrap.appendChild(bubble);

    const actor = {
      wrap,
      flipWrap,
      rig,
      shadow,
      bubble,
      trotGroup,
      runTail,
      runLegBR,
      runLegFR,
      runLegBL,
      runLegFL,
      runHeadWrap,
      leashProp,
      sitGroup,
      sitTail,
      sitHeadWrap,
      bellyGroup,
      bellyTail,
      jumpGroup,
      hackParts,
      hackSpeed: 1,
      pose: '',
      faceRight,
      moving: pose === 'trot' || pose === 'leash',
      walkAmp: pose === 'trot' || pose === 'leash' ? 1 : 0,
      phase: rand(0, Math.PI * 2),
      blinkTimer: rand(1.4, 3.4),
      blinking: false,
      happyHold: 0,
    };

    setActorPose(actor, pose, faceRight);
    return actor;
  }

  function shouldMirror(pose, faceRight) {
    if (pose.startsWith('hack_')) return false;
    if (pose === 'trot' || pose === 'leash') return !faceRight;
    if (pose === 'jump') return faceRight;
    if (pose === 'sit') return !faceRight;
    return false;
  }

  function setActorPose(actor, pose, faceRight = actor.faceRight) {
    actor.pose = pose;
    actor.faceRight = faceRight;
    actor.flipWrap.classList.toggle('is-mirrored', shouldMirror(pose, faceRight));

    const isTrot = pose === 'trot' || pose === 'leash';
    const isHack = pose.startsWith('hack_');

    actor.trotGroup.style.display = isTrot ? 'block' : 'none';
    actor.leashProp.style.display = pose === 'leash' ? 'block' : 'none';
    actor.sitGroup.style.display = pose === 'sit' ? 'block' : 'none';
    actor.bellyGroup.style.display = pose === 'belly' ? 'block' : 'none';
    actor.jumpGroup.style.display = pose === 'jump' ? 'block' : 'none';

    if (actor.hackParts) {
      const hp = actor.hackParts;
      hp.hackGroup.style.display = isHack ? 'block' : 'none';
      if (isHack) {
        const typing = pose === 'hack_type' || pose === 'hack_fast';
        hp.hackPawFar.style.display  = typing ? 'block' : 'none';
        hp.hackBody.style.display    = typing ? 'block' : 'none';
        hp.hackHeadWrap.style.display = typing ? 'block' : 'none';
        hp.hackLaptop.style.display  = typing ? 'block' : 'none';
        hp.hackPawNear.style.display = typing ? 'block' : 'none';
        hp.hackHeadWrap.classList.toggle('is-tongue', pose === 'hack_fast');
        hp.hackShock.style.display   = pose === 'hack_shock' ? 'block' : 'none';
        hp.hackCheer.style.display   = pose === 'hack_cheer' ? 'block' : 'none';
        actor.hackSpeed = pose === 'hack_fast' ? 1.42 : 1.0;
      }
    }

    if (isHack) {
      actor.rig.style.aspectRatio = '1 / 1';
    } else if (pose === 'sit') {
      actor.rig.style.aspectRatio = '286 / 440';
    } else if (pose === 'belly') {
      actor.rig.style.aspectRatio = '440 / 381';
    } else {
      actor.rig.style.aspectRatio = '440 / 400';
    }
  }

  /* =====================================================================
     CONTROLLER
     ===================================================================== */
  class KakaoPackController {
    constructor(layer) {
      this.layer = layer;
      this.timers = [];
      this.actors = [];
      this.preludeActors = [];
      this.companion = null;
      this.compX = 14;
      this.compTimer = null;
      this.lastAction = '';
      this.pageKind = 'letter';
      this.sendFx = () => {};
      this.running = false;
      this.lastTs = 0;
    }

    _after(ms, fn) {
      const id = setTimeout(fn, ms);
      this.timers.push(id);
      return id;
    }

    _wake() {
      if (this.running) return;
      this.running = true;
      this.lastTs = performance.now();
      requestAnimationFrame((ts) => this._tick(ts));
    }

    _tick(now) {
      if (!this.actors.length) {
        this.running = false;
        return;
      }
      const dt = Math.min(0.08, Math.max(0.001, (now - this.lastTs) / 1000));
      this.lastTs = now;
      const t = now * 0.001;

      for (let i = 0; i < this.actors.length; i++) {
        const a = this.actors[i];
        const ph = a.phase;

        // 0) CENTER HACKER KAKAO FURIOUSLY MASHING LAPTOP KEYBOARD AT 60/120FPS!
        if (a.pose.startsWith('hack_') && a.hackParts) {
          const hp = a.hackParts;
          const tailSpd = a.pose === 'hack_cheer' ? 18 : a.pose === 'hack_shock' ? 6 : 13;
          const tailDeg = Math.sin(t * tailSpd + ph) * (a.pose === 'hack_shock' ? 8 : 16);
          hp.hackTail.style.transform = `rotate3d(0, 0, 1, ${tailDeg.toFixed(1)}deg)`;

          if (a.pose === 'hack_type' || a.pose === 'hack_fast') {
            const g = t * 21 * a.hackSpeed + ph; // tốc độ đập phím lạch cạch siêu hài!
            // Far paw: -40deg (đập xuống bàn phím sau màn hình) <-> +8deg (giơ cao khoe đệm chân!)
            const farDeg = -16 + Math.sin(g) * 24;
            // Near paw: ngược pha hoàn toàn với far paw (-18deg giơ lên <-> +10deg đập xuống phím!)
            const nearDeg = -4 - Math.sin(g) * 14;
            const headDeg = Math.sin(g * 0.5) * 3.8;
            const bodyBob = -Math.abs(Math.sin(g)) * 2.5;

            hp.hackPawFar.style.transform = `rotate3d(0, 0, 1, ${farDeg.toFixed(1)}deg)`;
            hp.hackPawNear.style.transform = `rotate3d(0, 0, 1, ${nearDeg.toFixed(1)}deg)`;
            hp.hackHeadWrap.style.transform = `rotate3d(0, 0, 1, ${headDeg.toFixed(1)}deg)`;
            hp.hackGroup.style.transform = `translate3d(0, ${bodyBob.toFixed(1)}px, 0)`;
          } else if (a.pose === 'hack_cheer') {
            const hop = -Math.abs(Math.sin(t * 9.5)) * 7;
            hp.hackGroup.style.transform = `translate3d(0, ${hop.toFixed(1)}px, 0)`;
          } else {
            hp.hackGroup.style.transform = 'translate3d(0, 0, 0)';
          }
          continue;
        }

        // 1) 7-Bone 60/120Hz Trot & Leash Rig
        if (a.pose === 'trot' || a.pose === 'leash') {
          const targetAmp = a.moving ? 1 : 0;
          a.walkAmp += (targetAmp - a.walkAmp) * (1 - Math.exp(-dt * 12));

          const g = t * 11.2 + ph;
          const sA = Math.sin(g) * 25 * a.walkAmp;
          const sB = -sA;
          const bob = -Math.abs(Math.sin(g)) * 5.5 * a.walkAmp;
          const tailDeg = 2 + Math.sin(t * 14 + ph) * (12 + 6 * a.walkAmp);
          const headDeg = Math.sin(g + 0.6) * 3.5 * a.walkAmp + Math.sin(t * 3.2 + ph) * 1.8;
          const leashDeg = Math.sin(g - 0.5) * 13 * a.walkAmp + Math.sin(t * 4.5 + ph) * 4.5;

          a.trotGroup.style.transform = `translate3d(0, ${bob.toFixed(1)}px, 0)`;
          a.runLegBL.style.transform = `rotate3d(0, 0, 1, ${sA.toFixed(1)}deg)`;
          a.runLegFR.style.transform = `rotate3d(0, 0, 1, ${(-sA * 0.96).toFixed(1)}deg)`;
          a.runLegBR.style.transform = `rotate3d(0, 0, 1, ${sB.toFixed(1)}deg)`;
          a.runLegFL.style.transform = `rotate3d(0, 0, 1, ${(-sB * 0.96).toFixed(1)}deg)`;
          a.runTail.style.transform = `rotate3d(0, 0, 1, ${tailDeg.toFixed(1)}deg)`;
          a.runHeadWrap.style.transform = `rotate3d(0, 0, 1, ${headDeg.toFixed(1)}deg)`;
          if (a.pose === 'leash') {
            a.leashProp.style.transform = `rotate3d(0, 0, 1, ${leashDeg.toFixed(1)}deg)`;
          }
        } else if (a.pose === 'sit') {
          const tailDeg = 2 + Math.sin(t * 10.5 + ph) * 18;
          const headDeg = Math.sin(t * 1.9 + ph) * 9;
          a.sitTail.style.transform = `rotate3d(0, 0, 1, ${tailDeg.toFixed(1)}deg)`;
          a.sitHeadWrap.style.transform = `rotate3d(0, 0, 1, ${headDeg.toFixed(1)}deg)`;
        } else if (a.pose === 'belly') {
          const rockDeg = Math.sin(t * 3.6 + ph) * 4.5;
          const tailDeg = Math.sin(t * 13 + ph) * 18;
          a.bellyGroup.style.transform = `rotate3d(0, 0, 1, ${rockDeg.toFixed(1)}deg)`;
          a.bellyTail.style.transform = `rotate3d(0, 0, 1, ${tailDeg.toFixed(1)}deg)`;
        }

        // 2) Chớp mắt tự nhiên
        if (a.happyHold > 0) {
          a.happyHold -= dt;
          a.sitHeadWrap.classList.add('is-blinking');
          a.runHeadWrap.classList.add('is-blinking');
        } else {
          a.blinkTimer -= dt;
          if (!a.blinking && a.blinkTimer <= 0) {
            a.blinking = true;
            a.blinkTimer = 0.16;
            a.sitHeadWrap.classList.add('is-blinking');
            a.runHeadWrap.classList.add('is-blinking');
          } else if (a.blinking && a.blinkTimer <= 0) {
            a.blinking = false;
            a.blinkTimer = rand(2.2, 4.0);
            a.sitHeadWrap.classList.remove('is-blinking');
            a.runHeadWrap.classList.remove('is-blinking');
          }
        }
      }

      requestAnimationFrame((ts) => this._tick(ts));
    }

    _addActor(opts) {
      const a = createPuppetDOM(opts);
      this.layer.appendChild(a.wrap);
      this.actors.push(a);
      this._wake();
      return a;
    }

    clearAll() {
      this.timers.forEach((t) => clearTimeout(t));
      this.timers = [];
      if (this.compTimer) {
        clearTimeout(this.compTimer);
        this.compTimer = null;
      }
      this.actors = [];
      this.preludeActors = [];
      this.companion = null;
      if (this.layer) this.layer.innerHTML = '';
    }

    _popSymbols(xPct, yPct, symbols = ['❤️', '🐾'], count = 4) {
      if (!this.layer) return;
      for (let i = 0; i < count; i++) {
        const h = document.createElement('span');
        h.className = 'k-float-heart';
        h.textContent = symbols[i % symbols.length];
        h.style.left = `calc(${xPct}% + ${rand(-32, 32).toFixed(0)}px)`;
        h.style.top = `calc(${yPct}% + ${rand(-20, 6).toFixed(0)}px)`;
        h.style.animationDelay = (i * 0.09) + 's';
        this.layer.appendChild(h);
        setTimeout(() => h.remove(), 1350);
      }
    }

    _dropPaw(xPct, yPct) {
      if (!this.layer) return;
      const p = document.createElement('span');
      p.className = 'k-paw-print';
      p.textContent = '🐾';
      p.style.left = xPct + '%';
      p.style.top = yPct + '%';
      this.layer.appendChild(p);
      setTimeout(() => p.remove(), 1600);
    }

    /* ---------------- 1. PRELUDE (~13.2s): KAKAO NGỒI GIỮA MÀN HÌNH ĐẬP PHÍM MACBOOK ---------------- */
    runPrelude(cfg = {}, sendFx = () => {}) {
      this.clearAll();
      this.sendFx = sendFx;
      if (!this.layer) return;

      const lines = cfg.preludeLines || {};
      let boss = null;

      // 0.0s — ĐẠI CA KAKAO ĐEO KÍNH RÂM BẬT LÊN NGAY GIỮA MÀN HÌNH ĐẬP PHÍM MACBOOK LẠCH CẠCH!
      this._after(0, () => {
        sendFx({ t: 'sfx', kind: 'kakaoPop', x: 0.5 });
        sendFx({ t: 'sfx', kind: 'keyClack', x: 0.5 });
        boss = this._addActor({
          pose: 'hack_type',
          size: 245,
          hero: true,
          withHackerRig: true,
          text: lines.hackStart || 'Hehe chị Khuê sơ hở là Kakao nhảy lên bàn phím hack khóa MacBook liền!',
        });
        boss.wrap.style.left = '50%';
        boss.wrap.style.top = '55%';
        boss.wrap.style.zIndex = '6';
        boss.wrap.style.transform = 'translate3d(-50%, -50%, 0) scale(0.28)';
        this.preludeActors.push({ actor: boss, exitX: '50%', exitY: '118%', exitRight: true, isBoss: true });

        requestAnimationFrame(() => {
          boss.wrap.style.transition = 'transform 0.62s cubic-bezier(.18, 1.32, .32, 1), top 0.62s ease, opacity 0.45s ease';
          boss.wrap.style.transform = 'translate3d(-50%, -50%, 0) scale(1)';
        });

        // Tiếng gõ bàn phím lạch cạch + icon bay ra từ màn hình MacBook trong lúc gõ!
        [1100, 2600, 4100, 5600, 7000].forEach((ms, idx) => {
          this._after(ms, () => {
            if (!this.actors.includes(boss)) return;
            sendFx({ t: 'sfx', kind: 'keyClack', x: 0.5 });
            this._popSymbols(46, 54, ['🐾', '🔑', '🦴'], 3);
            if (idx === 2) {
              // Tới giây 4.1: Đại ca thè lưỡi tập trung đập phím nhanh gấp rưỡi!
              setActorPose(boss, 'hack_fast', true);
              boss.bubble.textContent =
                lines.hackFast || 'Đang gõ lệnh khóa chuột nè... lạch cạch lạch cạch... Cấm tắt máy nha!';
            }
          });
        });
      });

      // 2.0s — Đồng bọn #1: Tha dây dắt đỏ chạy từ trái vào giục đại ca đổi mật khẩu đi công viên!
      this._after(2000, () => {
        sendFx({ t: 'sfx', kind: 'pawTap', x: 0.22, step: 1 });
        const a1 = this._addActor({
          pose: 'leash',
          size: 162,
          faceRight: true,
          text: lines.leash || 'Gõ lẹ đi đại ca! Đổi mật khẩu máy thành: Dắt Kakao đi công viên 3 vòng!! 🌳🐾',
        });
        a1.wrap.style.left = '-14%';
        a1.wrap.style.top = '69%';
        this.preludeActors.push({ actor: a1, exitX: '-16%', exitY: '69%', exitRight: false });

        requestAnimationFrame(() => {
          a1.wrap.style.transition = 'left 1.4s cubic-bezier(.22, .61, .36, 1), opacity 0.4s ease';
          a1.wrap.style.left = '19%';
        });
        [260, 560, 860, 1140].forEach((ms, i) => this._after(ms, () => this._dropPaw(4 + i * 4.5, 76)));
        this._after(1380, () => {
          a1.moving = false;
        });
      });

      // 4.1s — Đồng bọn #2: Thò đầu nghiêng từ mép phải canh cửa!
      this._after(4100, () => {
        sendFx({ t: 'sfx', kind: 'pawTap', x: 0.92, step: 2 });
        const a2 = this._addActor({
          pose: 'sit',
          size: 130,
          faceRight: false,
          text: lines.peek || 'Tụi em canh cửa cho đại ca gõ phím rồi nè!',
        });
        a2.wrap.classList.add('k-edge-right');
        a2.shadow.style.display = 'none';
        a2.flipWrap.style.transform = 'rotate(-58deg)';
        a2.wrap.style.left = '106%';
        a2.wrap.style.top = '32%';
        this.preludeActors.push({ actor: a2, exitX: '112%', exitY: '32%', exitRight: true, keepRot: true });

        requestAnimationFrame(() => {
          a2.wrap.style.transition = 'left 0.7s cubic-bezier(.18, 1.32, .32, 1), opacity 0.4s ease';
          a2.wrap.style.left = '95%';
        });
      });

      // 6.0s — Đồng bọn #3 (lăn bụng đè trackpad) + #4 (chạy trên lục ổ cứng tìm bánh thưởng)
      this._after(6000, () => {
        sendFx({ t: 'sfx', kind: 'pawTap', x: 0.78, step: 3 });
        sendFx({ t: 'burst', x: 0.78, y: 0.74, type: 'glitter', palette: 'gold', size: 0.65 });
        const a3 = this._addActor({
          pose: 'belly',
          size: 162,
          faceRight: true,
          photo: cfg.photo || 'assets/real_photos/kakao_sleep.jpg',
          text: lines.belly || 'Nằm đè lên bàn di chuột ăn vạ luôn, gãi bụng 10 cái mới nhả!',
        });
        a3.wrap.style.left = '80%';
        a3.wrap.style.top = '75%';
        a3.wrap.style.transform = 'translate3d(-50%, -50%, 0) scale(0.28)';
        this.preludeActors.push({ actor: a3, exitX: '116%', exitY: '75%', exitRight: true });

        requestAnimationFrame(() => {
          a3.wrap.style.transition = 'transform 0.6s cubic-bezier(.18, 1.35, .32, 1), left 0.55s ease, opacity 0.4s ease';
          a3.wrap.style.transform = 'translate3d(-50%, -50%, 0) scale(1)';
        });

        const a4 = this._addActor({
          pose: 'trot',
          size: 146,
          faceRight: false,
          text: lines.zoom || 'Tiện tay lục ổ cứng tìm chỗ giấu bánh thưởng luôn gâu gâu!! 🦋',
        });
        const bf = document.createElement('span');
        bf.className = 'k-butterfly';
        bf.textContent = '🦋';
        a4.wrap.appendChild(bf);
        a4.wrap.style.left = '110%';
        a4.wrap.style.top = '22%';
        this.preludeActors.push({ actor: a4, exitX: '-16%', exitY: '22%', exitRight: false });

        requestAnimationFrame(() => {
          a4.wrap.style.transition = 'left 1.8s linear, opacity 0.4s ease';
          a4.wrap.style.left = '22%';
        });
        this._after(1820, () => {
          setActorPose(a4, 'sit', true);
          a4.wrap.style.width = '118px';
        });
      });

      // 8.2s — KHỰNG LẠI! Đại ca Kakao rớt kính râm, mắt tròn xoe 'o' phát hiện thư mục mật 4 năm!
      this._after(8200, () => {
        if (!boss || !this.actors.includes(boss)) return;
        sendFx({ t: 'sfx', kind: 'kakaoPop', x: 0.5 });
        sendFx({ t: 'burst', x: 0.47, y: 0.52, type: 'heart', palette: 'rose', size: 0.95 });
        setActorPose(boss, 'hack_shock', true);
        this._popSymbols(46, 52, ['❤️', '✨'], 4);
        boss.bubble.textContent =
          lines.realize || 'Ủa khoan... gõ nhầm vô thư mục mật thấy bức thư kỷ niệm 4 năm anh Quân gửi chị Khuê nè!!';
      });

      // 10.45s — GIƠ 2 CHÂN HOAN HÔ '^ ^' MỞ KHÓA TRẢ MÁY CHO CHỊ KHUÊ! (giữ tới 13.15s)
      this._after(10450, () => {
        if (!boss || !this.actors.includes(boss)) return;
        sendFx({ t: 'sfx', kind: 'kakaoDone', x: 0.5 });
        sendFx({ t: 'burst', x: 0.5, y: 0.30, type: 'doubleHeart', palette: 'rose', size: 1.2 });
        setActorPose(boss, 'hack_cheer', true);
        boss.bubble.textContent =
          lines.handover || 'Thôi Kakao mở khóa trả máy, nhịn đi công viên 1 bữa! Chị Khuê đọc quà của anh Quân nha ❤️';
        this._popSymbols(50, 46, ['❤️', '🐾', '✨'], 6);
        this._popSymbols(19, 62, ['❤️', '🐾'], 3);
        this._popSymbols(80, 68, ['❤️', '🐾'], 3);
      });
    }

    scatterPrelude() {
      this.preludeActors.forEach(({ actor, exitX, exitY, exitRight, keepRot, isBoss }) => {
        actor.bubble.classList.remove('is-visible');
        if (!keepRot && !isBoss) {
          actor.wrap.style.width = '156px';
          actor.moving = true;
          actor.walkAmp = 1;
          setActorPose(actor, 'trot', exitRight);
        }
        actor.wrap.style.transition = 'left 0.65s linear, top 0.62s cubic-bezier(.55, 0, .9, .4), opacity 0.48s ease 0.14s';
        actor.wrap.style.left = exitX;
        actor.wrap.style.top = exitY;
        actor.wrap.style.opacity = '0';
      });
      this._after(700, () => {
        if (!this.companion) this.clearAll();
      });
    }

    /* ---------------- 2. TRONG LÚC ĐỌC THƯ: BÉ KAKAO SẢI CHÂN 60/120FPS & NGỒI VẪY ĐUÔI ---------------- */
    startStage(cfg = {}, sendFx = () => {}) {
      this.clearAll();
      this.sendFx = sendFx;
      if (!this.layer) return;

      this.compX = 13;

      const comp = this._addActor({
        pose: 'leash',
        size: 126,
        faceRight: true,
        companion: true,
        text: 'Đọc thư thong thả nha, xong dắt Kakao đi công viên nhaaa! 🌳🐾',
      });
      comp.wrap.style.left = '-10%';
      comp.wrap.style.bottom = '52px';
      comp.wrap.title = 'Click để nựng Kakao!';
      this.companion = comp;

      comp.wrap.addEventListener('click', (e) => {
        e.stopPropagation();
        this.petCompanion();
      });

      requestAnimationFrame(() => {
        comp.wrap.style.transition = 'left 1.8s linear';
        comp.wrap.style.left = this.compX + '%';
      });

      this._after(1820, () => {
        if (!this.companion) return;
        this._setCompIdleSit(true);
      });
      this._after(4500, () => {
        if (this.companion) this.companion.bubble.classList.remove('is-visible');
      });

      this._scheduleNextAntic(5600);
    }

    _setCompIdleSit(faceRight = this.compX < 50) {
      if (!this.companion) return;
      this.companion.moving = false;
      this.companion.wrap.style.width = '98px';
      setActorPose(this.companion, 'sit', faceRight);
    }

    _say(text, holdMs = 3800) {
      if (!this.companion) return;
      const b = this.companion.bubble;
      b.textContent = text;
      b.classList.add('is-visible');
      this._after(holdMs, () => {
        if (this.companion && b.textContent === text) b.classList.remove('is-visible');
      });
    }

    petCompanion() {
      const c = this.companion;
      if (!c) return;
      this.sendFx({ t: 'sfx', kind: 'kakaoPop', x: this.compX / 100 });
      c.wrap.style.width = '126px';
      setActorPose(c, 'jump', this.compX < 50);
      this._popSymbols(this.compX, 83, ['❤️', '🐾'], 5);
      this._say(
        pick([
          'Á chị Khuê nựng Kakao kìaaa thương quá ❤️',
          'Gâu gâu!! Thương chị Khuê với anh Quân nhất nhà!',
          'Nựng xong xíu nhớ dắt con đi công viên thiệt nha! 🌳',
          'Hihi được gãi đầu sướng tít mắt luôn 🐾',
        ]),
        3600
      );
      this._after(950, () => {
        if (this.companion !== c) return;
        c.wrap.style.width = '126px';
        setActorPose(c, 'belly', true);
      });
      this._after(3200, () => {
        if (this.companion !== c) return;
        c.happyHold = 1.8;
        this._setCompIdleSit(this.compX < 50);
      });
    }

    onPageChange(index, page) {
      const c = this.companion;
      if (!c) return;
      if (page && page.finale) {
        this.pageKind = 'finale';
        this._walkCompTo(14, 'trot', () => {
          c.happyHold = 2.5;
          this._setCompIdleSit(true);
          this._say('Pháo hoa đẹp quá trời luôn gâu gâu!! ✨', 4200);
        });
      } else if (page && page.type === 'rooms') {
        this.pageKind = 'rooms';
        c.wrap.style.width = '126px';
        setActorPose(c, 'leash', this.compX < 50);
        this._popSymbols(this.compX, 84, ['❤️', '🐾'], 3);
        this._say('Anh chị đi vi vu về nhớ dắt Kakao bù 3 vòng công viên nha!! 🌳🐾', 4300);
        this._after(2400, () => {
          if (this.companion === c) this._setCompIdleSit(this.compX < 50);
        });
      } else {
        this.pageKind = 'letter';
      }
    }

    _walkCompTo(targetX, walkPose = 'trot', onArrive) {
      const c = this.companion;
      if (!c) return;
      const dx = targetX - this.compX;
      const faceRight = dx >= 0;
      const dist = Math.abs(dx);
      const durSec = Math.max(1.2, Math.min(3.2, dist * 0.038));

      c.wrap.style.width = '126px';
      c.moving = true;
      c.walkAmp = 1;
      setActorPose(c, walkPose, faceRight);
      c.wrap.style.transition = `left ${durSec.toFixed(2)}s linear`;
      c.wrap.style.left = targetX + '%';

      const steps = Math.min(4, Math.max(2, Math.floor(dist / 15)));
      for (let s = 1; s <= steps; s++) {
        const sx = this.compX + (dx * s) / (steps + 1);
        this._after((durSec * 1000 * s) / (steps + 1), () => {
          if (this.companion === c) this._dropPaw(sx, 91);
        });
      }

      this.compX = targetX;
      this._after(durSec * 1000 + 40, () => {
        if (this.companion === c) {
          c.moving = false;
          if (onArrive) onArrive();
        }
      });
    }

    _scheduleNextAntic(delayMs = 5800) {
      if (this.compTimer) clearTimeout(this.compTimer);
      this.compTimer = setTimeout(() => this._doRandomAntic(), delayMs);
    }

    _doRandomAntic() {
      const c = this.companion;
      if (!c) return;

      const actions = ['walk_across', 'leash_park', 'belly_roll', 'chase_butterfly', 'sit_cute'];
      const act = pick(actions.filter((a) => a !== this.lastAction));
      this.lastAction = act;

      const goRight = this.compX < 50;
      const otherSide = goRight ? rand(78, 88) : rand(12, 22);
      const sameSide = this.compX < 50 ? rand(11, 23) : rand(77, 88);

      if (act === 'walk_across') {
        this._say(
          pick([
            'Chạy lon ton qua bên này hóng tiếp nè 🐾',
            'Lạch bạch... đi tuần quanh bức thư của anh chị!',
            'Chạy khởi động chân cẳng lát đi công viên!',
          ]),
          2800
        );
        this._walkCompTo(otherSide, 'trot', () => {
          this._setCompIdleSit(this.compX < 50);
          this._scheduleNextAntic(rand(5200, 6800));
        });
      } else if (act === 'leash_park') {
        this._walkCompTo(sameSide, 'leash', () => {
          this._say(
            pick([
              'Ngậm sẵn dây dắt rồi nè, đọc xong đi công viên nhaaa! 🌳',
              'Chị Khuê ơiii bao giờ mới tới giờ đi công viên dọ?',
              'Đi công viên chạy 3 vòng rồi về ăn pate nha!',
            ]),
            4000
          );
          this._after(3600, () => {
            if (this.companion === c) this._setCompIdleSit(this.compX < 50);
          });
          this._scheduleNextAntic(rand(5800, 7400));
        });
      } else if (act === 'belly_roll') {
        c.wrap.style.width = '126px';
        setActorPose(c, 'belly', true);
        this._say(
          pick([
            'Lăn đùng ngửa bụng hồng hóng gió xíu nha hihi',
            'Click vô người nựng Kakao miếng điii!',
            'Êm quá nằm nghe anh Quân tâm sự tiếp nè...',
          ]),
          3900
        );
        this._scheduleNextAntic(rand(5600, 7000));
      } else if (act === 'chase_butterfly') {
        const bf = document.createElement('span');
        bf.className = 'k-butterfly';
        bf.style.left = goRight ? '96%' : '-22px';
        bf.textContent = '🦋';
        c.wrap.appendChild(bf);
        this._say('Á bướm vàng kìaaa bắt lấy nó!! 🦋', 3000);
        this._walkCompTo(otherSide, 'trot', () => {
          bf.remove();
          c.happyHold = 1.6;
          this._setCompIdleSit(this.compX < 50);
          this._popSymbols(this.compX, 84, ['❤️', '🐾'], 3);
          this._scheduleNextAntic(rand(5400, 6800));
        });
      } else {
        c.happyHold = 1.5;
        this._setCompIdleSit(this.compX < 50);
        const remarks =
          this.pageKind === 'rooms'
            ? [
                'Ở nhà ngoan chờ anh chị đi chơi về thưởng súp thưởng nè!',
                'Chỗ nào có bãi cỏ rộng như công viên là Kakao mê nhấttt!',
              ]
            : this.pageKind === 'finale'
              ? [
                  'Chúc mừng 4 năm của anh Quân với chị Khuê nhaaa ❤️',
                  'Pháo hoa sáng rực luôn gâu gâu!!',
                ]
              : [
                  'Anh Quân viết thư thương chị Khuê quá trời kìa ❤️',
                  'Bốn năm rồi đó, trộm vía thương hai anh chị nhất!',
                  'Kakao ngồi ngoan canh cho chị Khuê đọc thư nè',
                ];
        this._say(pick(remarks), 4000);
        this._scheduleNextAntic(rand(5400, 7000));
      }
    }
  }

  window.KakaoPack = KakaoPackController;
})();
