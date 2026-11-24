/* =====================================================================
   KAKAO 60/120-FPS MULTI-BONE SKELETAL PUPPET ENGINE
   - Toàn bộ chuyển động chạy bằng khớp xương 2D mượt ở 60fps / 120fps ProMotion GPU:
     1. Chạy / Tha dây dắt (trot & leash): 7 khớp độc lập (đuôi vẫy + 2 chân xa + thân nhún
        + 2 chân gần sải chéo đối pha + đầu gật gù chớp mắt + dây dắt đỏ đung đưa ở miệng)
     2. Ngồi (sit): Thân ngồi vững trên sàn + đuôi vẫy phía sau + đầu nghiêng qua lại + mắt chớp
     3. Nằm ngửa (belly): Đuôi vẫy tít tách rời khỏi thân lăn bụng hồng
     4. Nhảy bật (jump): Tung người lên không trung vui sướng
   ===================================================================== */
(function () {
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  const ASSETS = [
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

  // Pre-decode toàn bộ bộ phận xương ngay khi khởi động để hiện mượt 0ms
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

  function createPuppetDOM({ pose = 'sit', size = 152, faceRight = true, text = '', photo = '', hero = false, companion = false } = {}) {
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
    // Đặt lệch pha ngẫu nhiên nhẹ để đàn 5 bé Kakao không bước rập khuôn như robot!
    rig.style.setProperty('--phase', (-rand(0, 1.2)).toFixed(2) + 's');
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

    // 2) MULTI-PART SIT PUPPET RIG (đuôi vẫy + thân tĩnh + đầu nghiêng + mắt chớp!)
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
    actor.trotGroup.style.display = isTrot ? 'block' : 'none';
    actor.leashProp.style.display = pose === 'leash' ? 'block' : 'none';
    actor.sitGroup.style.display = pose === 'sit' ? 'block' : 'none';
    actor.bellyGroup.style.display = pose === 'belly' ? 'block' : 'none';
    actor.jumpGroup.style.display = pose === 'jump' ? 'block' : 'none';

    if (pose === 'sit') {
      actor.rig.style.aspectRatio = '286 / 440';
    } else if (pose === 'belly') {
      actor.rig.style.aspectRatio = '440 / 381';
    } else {
      actor.rig.style.aspectRatio = '440 / 400';
    }
  }

  /* =====================================================================
     CONTROLLER (Toàn bộ khớp chân/đuôi/đầu chạy bằng CSS GPU @ 60/120fps;
     JS chỉ điều phối chớp mắt tự nhiên & kịch bản chạy nhảy!)
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

        // 1) Điều khiển trực tiếp 7 khớp xương bằng rAF 60/120Hz (không bao giờ bị kẹt CSS WebKit!)
        if (a.pose === 'trot' || a.pose === 'leash') {
          const targetAmp = a.moving ? 1 : 0;
          a.walkAmp += (targetAmp - a.walkAmp) * (1 - Math.exp(-dt * 12));

          const g = t * 11.2 + ph; // tần số sải chân mượt tự nhiên
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

        // 2) Chớp mắt tự nhiên cho cả lúc chạy lẫn lúc ngồi
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
      this.hackBanner = null;
      if (this.layer) this.layer.innerHTML = '';
    }

    _popHearts(xPct, yPct, count = 4) {
      if (!this.layer) return;
      for (let i = 0; i < count; i++) {
        const h = document.createElement('span');
        h.className = 'k-float-heart';
        h.textContent = i % 3 === 1 ? '🐾' : '❤️';
        h.style.left = `calc(${xPct}% + ${rand(-28, 28).toFixed(0)}px)`;
        h.style.top = `calc(${yPct}% + ${rand(-24, 6).toFixed(0)}px)`;
        h.style.animationDelay = (i * 0.08) + 's';
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

    /* ---------------- 1. PRELUDE (~12.8s): CHIẾN DỊCH KAKAO HACK MÁY CHỊ KHUÊ ---------------- */
    runPrelude(cfg = {}, sendFx = () => {}) {
      this.clearAll();
      this.sendFx = sendFx;
      if (!this.layer) return;

      const lines = cfg.preludeLines || {};

      // Băng rôn nổi dễ thương trên đỉnh màn hình báo máy đã bị Kakao hack + thanh 5 dấu chân tiến trình!
      const banner = document.createElement('div');
      banner.className = 'k-hack-banner';
      const pawIcon = '<svg viewBox="0 0 24 24"><path d="M8.5 5.5a2.3 2.8 0 1 0 0 5.6 2.3 2.8 0 0 0 0-5.6zm7 0a2.3 2.8 0 1 0 0 5.6 2.3 2.8 0 0 0 0-5.6zM4.5 10.2a2 2.5 0 1 0 0 5 2 2.5 0 0 0 0-5zm15 0a2 2.5 0 1 0 0 5 2 2.5 0 0 0 0-5zM12 12.2c-3.1 0-5.6 2.3-5.6 4.9 0 1.7 1.3 2.7 3 2.7 1.1 0 1.8-.4 2.6-.4s1.5.4 2.6.4c1.7 0 3-1 3-2.7 0-2.6-2.5-4.9-5.6-4.9z"/></svg>';
      banner.innerHTML = `
        <div class="k-hb-title" id="k-hb-title">${cfg.bannerTitle || '🐾 MÁY TÍNH CỦA CHỊ KHUÊ ĐÃ BỊ KAKAO HACK! 🐾'}</div>
        <div class="k-hb-sub">
          <div class="k-hb-paws">${[0, 1, 2, 3, 4].map((i) => `<span class="k-hb-paw${i === 0 ? ' lit' : ''}">${pawIcon}</span>`).join('')}</div>
          <span class="k-hb-status" id="k-hb-status">Đang khóa bàn phím đòi đi công viên... 25%</span>
        </div>
      `;
      this.layer.appendChild(banner);
      this.hackBanner = banner;
      const pawDots = [...banner.querySelectorAll('.k-hb-paw')];
      const statusEl = banner.querySelector('#k-hb-status');
      const titleEl = banner.querySelector('#k-hb-title');
      const setHackProgress = (litCount, msg) => {
        pawDots.forEach((el, idx) => el.classList.toggle('lit', idx < litCount));
        if (statusEl) statusEl.textContent = msg;
      };
      requestAnimationFrame(() => banner.classList.add('is-in'));

      // 0.0s — Hacker Trưởng #1: Sải 4 chân tha dây dắt đỏ vào hack khóa máy!
      this._after(0, () => {
        sendFx({ t: 'sfx', kind: 'kakaoPop', x: 0.24 });
        const a1 = this._addActor({
          pose: 'leash',
          size: 168,
          faceRight: true,
          text: lines.leash || 'Hehe Kakao hack khóa máy chị Khuê rồi! Dẫn đi công viên mới mở khóa nha! 🌳🐾',
        });
        a1.wrap.style.left = '-14%';
        a1.wrap.style.top = '66%';
        this.preludeActors.push({ actor: a1, exitX: '-16%', exitY: '66%', exitRight: false });

        requestAnimationFrame(() => {
          a1.wrap.style.transition = 'left 1.45s cubic-bezier(.22, .61, .36, 1), top 0.55s ease, opacity 0.4s ease';
          a1.wrap.style.left = '22%';
        });
        [260, 560, 860, 1160].forEach((ms, i) => this._after(ms, () => this._dropPaw(4 + i * 5, 74)));
        this._after(1420, () => {
          a1.moving = false;
        });
      });

      // 1.85s — Hacker Phụ #2: Thò đầu nghiêng từ mép phải đòi mật khẩu đi công viên!
      this._after(1850, () => {
        sendFx({ t: 'sfx', kind: 'pawTap', x: 0.9, step: 1 });
        setHackProgress(2, 'Đang đổi mật khẩu máy thành "Đi Công Viên"... 45%');
        const a2 = this._addActor({
          pose: 'sit',
          size: 132,
          faceRight: false,
          text: lines.peek || 'Mật khẩu mở MacBook hôm nay là: Dắt Kakao đi công viên 3 vòng!!',
        });
        a2.wrap.classList.add('k-edge-right');
        a2.shadow.style.display = 'none';
        a2.flipWrap.style.transform = 'rotate(-58deg)';
        a2.wrap.style.left = '106%';
        a2.wrap.style.top = '36%';
        this.preludeActors.push({ actor: a2, exitX: '112%', exitY: '36%', exitRight: true, keepRot: true });

        requestAnimationFrame(() => {
          a2.wrap.style.transition = 'left 0.72s cubic-bezier(.18, 1.32, .32, 1), opacity 0.4s ease';
          a2.wrap.style.left = '95%';
        });
      });

      // 3.70s — Hacker #3: Hack luôn chuột cảm ứng, lăn đùng ngửa bụng ăn vạ góc phải dưới!
      this._after(3700, () => {
        sendFx({ t: 'sfx', kind: 'pawTap', x: 0.74, step: 2 });
        sendFx({ t: 'burst', x: 0.74, y: 0.74, type: 'glitter', palette: 'gold', size: 0.65 });
        setHackProgress(3, 'Đã hack khóa luôn chuột cảm ứng... 70%');
        const a3 = this._addActor({
          pose: 'belly',
          size: 168,
          faceRight: true,
          photo: cfg.photo || 'assets/real_photos/kakao_sleep.jpg',
          text: lines.belly || 'Hack luôn chuột cảm ứng rồi! Nằm ăn vạ chờ gãi bụng 10 cái nè!',
        });
        a3.wrap.style.left = '75%';
        a3.wrap.style.top = '75%';
        a3.wrap.style.transform = 'translate3d(-50%, -50%, 0) scale(0.28)';
        this.preludeActors.push({ actor: a3, exitX: '116%', exitY: '75%', exitRight: true });

        requestAnimationFrame(() => {
          a3.wrap.style.transition = 'transform 0.62s cubic-bezier(.18, 1.35, .32, 1), left 0.55s ease, opacity 0.4s ease';
          a3.wrap.style.transform = 'translate3d(-50%, -50%, 0) scale(1)';
        });
      });

      // 5.55s — Hacker #4: Chạy lục lọi ổ cứng tìm bánh thưởng & kho ảnh kỷ niệm!
      this._after(5550, () => {
        sendFx({ t: 'sfx', kind: 'pawTap', x: 0.35, step: 3 });
        setHackProgress(4, 'Đang đánh hơi dữ liệu ổ cứng của chị Khuê... 90%');
        const a4 = this._addActor({
          pose: 'trot',
          size: 154,
          faceRight: false,
          text: lines.zoom || 'Đang lục ổ cứng tìm chỗ giấu bánh thưởng với kho ảnh kỷ niệm... 🦋',
        });
        const bf = document.createElement('span');
        bf.className = 'k-butterfly';
        bf.textContent = '🦋';
        a4.wrap.appendChild(bf);

        a4.wrap.style.left = '110%';
        a4.wrap.style.top = '28%';
        this.preludeActors.push({ actor: a4, exitX: '-16%', exitY: '26%', exitRight: false });

        requestAnimationFrame(() => {
          a4.wrap.style.transition = 'left 1.85s linear, opacity 0.4s ease';
          a4.wrap.style.left = '25%';
        });
        [300, 660, 1020, 1380].forEach((ms, i) => this._after(ms, () => this._dropPaw(86 - i * 15, 34)));
        this._after(1880, () => {
          setActorPose(a4, 'sit', true);
          a4.wrap.style.width = '122px';
        });
      });

      // 7.60s — Hacker #5 (Trung tâm): Phát hiện thư bí mật kỷ niệm 4 năm của anh Quân!
      this._after(7600, () => {
        sendFx({ t: 'sfx', kind: 'kakaoPop', x: 0.5 });
        sendFx({ t: 'burst', x: 0.5, y: 0.50, type: 'heart', palette: 'rose', size: 0.95 });
        setHackProgress(5, 'HACK 100% — Phát hiện tệp mật kỷ niệm 4 năm của anh Quân!');
        const a5 = this._addActor({
          pose: 'sit',
          size: 148,
          faceRight: true,
          hero: true,
          text: lines.realize || 'Ủa khoan... trong ổ cứng có thư bí mật kỷ niệm 4 năm anh Quân gửi chị Khuê nè!!',
        });
        a5.wrap.style.left = '50%';
        a5.wrap.style.top = '54%';
        a5.wrap.style.transform = 'translate3d(-50%, -50%, 0) scale(0.28)';
        this.preludeActors.push({ actor: a5, exitX: '115%', exitY: '54%', exitRight: true });

        requestAnimationFrame(() => {
          a5.wrap.style.transition = 'transform 0.62s cubic-bezier(.18, 1.35, .32, 1), left 0.65s linear, opacity 0.4s ease';
          a5.wrap.style.transform = 'translate3d(-50%, -50%, 0) scale(1)';
        });

        // 9.85s — Mở khóa nhường sân khấu (giữ đủ ~3s để Khuê đọc trọn câu chốt!)
        this._after(2250, () => {
          sendFx({ t: 'sfx', kind: 'kakaoDone', x: 0.5 });
          sendFx({ t: 'burst', x: 0.5, y: 0.28, type: 'doubleHeart', palette: 'rose', size: 1.15 });
          banner.classList.add('is-unlocked');
          if (titleEl) {
            titleEl.textContent = cfg.bannerDone || '❤️ KAKAO MỞ KHÓA MÁY — NHƯỜNG SÂN KHẤU CHO ANH QUÂN ❤️';
          }
          setHackProgress(5, 'Đã mở khóa! Chúc mừng kỷ niệm 4 năm hai anh chị!');

          a5.happyHold = 2.4;
          setActorPose(a5, 'jump', false);
          a5.wrap.style.width = '168px';
          a5.bubble.textContent =
            lines.handover || 'Thôi hôm nay Kakao tha không hack nữa, nhịn đi công viên 1 bữa! Chị Khuê xem quà của anh Quân nha ❤️';
          this._popHearts(50, 46, 5);
          this._popHearts(22, 60, 3);
          this._popHearts(75, 68, 3);

          this._after(950, () => {
            if (this.actors.includes(a5)) {
              setActorPose(a5, 'sit', true);
              a5.wrap.style.width = '148px';
            }
          });
        });
      });
    }

    scatterPrelude() {
      if (this.hackBanner) {
        this.hackBanner.classList.remove('is-in');
        this.hackBanner.classList.add('is-out');
      }
      this.preludeActors.forEach(({ actor, exitX, exitY, exitRight, keepRot }) => {
        actor.bubble.classList.remove('is-visible');
        if (!keepRot) {
          actor.wrap.style.width = '156px';
          actor.moving = true;
          actor.walkAmp = 1;
          setActorPose(actor, 'trot', exitRight);
        }
        actor.wrap.style.transition = 'left 0.68s linear, top 0.68s ease, opacity 0.48s ease 0.16s';
        actor.wrap.style.left = exitX;
        actor.wrap.style.top = exitY;
        actor.wrap.style.opacity = '0';
      });
      this._after(720, () => {
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
      this._popHearts(this.compX, 83, 5);
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
        this._popHearts(this.compX, 84, 3);
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
          this._popHearts(this.compX, 84, 3);
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
