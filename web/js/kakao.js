/* =====================================================================
   KAKAO HYBRID CEL-ANIMATED + MULTI-PART PUPPET ENGINE
   Kết hợp cả 2 thế mạnh:
   1. Nét vẽ minh họa chân thực 100% đúng Kakao ngoài đời (không vòng cổ, đầu vàng cát,
      chấm trắng trán, mõm trắng thon, 1 đốm lưng vàng, chân trắng thon, đuôi trắng dài)
   2. Chuyển động hoạt hình thật (KHÔNG nhún cả tấm ảnh tĩnh!):
      - Chạy/đi bộ: 4 frame cel-animation bước chân thật (trot_0..trot_3 @ 11fps)
        + dây dắt đỏ (leash_prop.png) đung đưa vật lý ở miệng khi đòi đi công viên!
      - Ngồi (sit): Thân ngồi vững trên sàn, đuôi vẫy phía sau (sit_tail), đầu nghiêng
        qua lại độc lập (sit_head) & mắt chớp tự nhiên (sit_head_blink)!
      - Nằm ngửa (belly): Đuôi vẫy tít (belly_tail) tách rời khỏi thân lăn bụng!
   ===================================================================== */
(function () {
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  const TROT_FRAMES = [
    'assets/kakao/trot_0.png',
    'assets/kakao/trot_1.png',
    'assets/kakao/trot_2.png',
    'assets/kakao/trot_3.png',
  ];

  const ASSETS = [
    ...TROT_FRAMES,
    'assets/kakao/leash_prop.png',
    'assets/kakao/jump.png',
    'assets/kakao/sit_tail.png',
    'assets/kakao/sit_body.png',
    'assets/kakao/sit_head.png',
    'assets/kakao/sit_head_blink.png',
    'assets/kakao/belly_tail.png',
    'assets/kakao/belly_body.png',
  ];

  // Pre-decode toàn bộ frame & bộ phận puppet ngay khi mở để chuyển mượt 0ms
  ASSETS.forEach((src) => {
    const im = new Image();
    im.src = src;
    if (im.decode) im.decode().catch(() => {});
  });

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

    // Stage Rig Container (chứa 3 chế độ bộ phận thật: trot-cel, sit-puppet, belly-puppet, jump)
    const rig = document.createElement('div');
    rig.className = 'k-rig';
    flipWrap.appendChild(rig);

    // 1) TROT CEL-ANIMATION RIG (4 frame chân bước thật + dây dắt đỏ đung đưa ở miệng)
    const trotGroup = document.createElement('div');
    trotGroup.className = 'k-mode k-mode-trot';
    const trotFramesEls = TROT_FRAMES.map((src, idx) => {
      const im = new Image();
      im.src = src;
      im.className = 'k-trot-frame' + (idx === 0 ? ' is-on' : '');
      im.draggable = false;
      trotGroup.appendChild(im);
      return im;
    });
    const leashProp = new Image();
    leashProp.src = 'assets/kakao/leash_prop.png';
    leashProp.className = 'k-leash-prop';
    leashProp.draggable = false;
    trotGroup.appendChild(leashProp);
    rig.appendChild(trotGroup);

    // 2) SIT MULTI-PART PUPPET RIG (đuôi vẫy + thân tĩnh + đầu nghiêng + mắt chớp!)
    const sitGroup = document.createElement('div');
    sitGroup.className = 'k-mode k-mode-sit';
    const sitTail = new Image();
    sitTail.src = 'assets/kakao/sit_tail.png';
    sitTail.className = 'k-layer k-sit-tail';
    const sitBody = new Image();
    sitBody.src = 'assets/kakao/sit_body.png';
    sitBody.className = 'k-layer k-sit-body';
    const sitHeadWrap = document.createElement('div');
    sitHeadWrap.className = 'k-layer k-sit-head-wrap';
    const sitHeadOpen = new Image();
    sitHeadOpen.src = 'assets/kakao/sit_head.png';
    sitHeadOpen.className = 'k-layer k-head-open';
    const sitHeadBlink = new Image();
    sitHeadBlink.src = 'assets/kakao/sit_head_blink.png';
    sitHeadBlink.className = 'k-layer k-head-blink';
    sitHeadWrap.append(sitHeadOpen, sitHeadBlink);
    sitGroup.append(sitTail, sitBody, sitHeadWrap);
    rig.appendChild(sitGroup);

    // 3) BELLY MULTI-PART PUPPET RIG (đuôi vẫy riêng + thân lăn bụng ngửa!)
    const bellyGroup = document.createElement('div');
    bellyGroup.className = 'k-mode k-mode-belly';
    const bellyTail = new Image();
    bellyTail.src = 'assets/kakao/belly_tail.png';
    bellyTail.className = 'k-layer k-belly-tail';
    const bellyBody = new Image();
    bellyBody.src = 'assets/kakao/belly_body.png';
    bellyBody.className = 'k-layer k-belly-body';
    bellyGroup.append(bellyTail, bellyBody);
    rig.appendChild(bellyGroup);

    // 4) JUMP / LEAP POSE (phóng vọt vui sướng trên không)
    const jumpGroup = document.createElement('div');
    jumpGroup.className = 'k-mode k-mode-jump';
    const jumpImg = new Image();
    jumpImg.src = 'assets/kakao/jump.png';
    jumpImg.className = 'k-jump-img';
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
      trotFramesEls,
      leashProp,
      sitGroup,
      sitHeadWrap,
      bellyGroup,
      jumpGroup,
      pose: '',
      faceRight,
      frameIdx: (Math.random() * 4) | 0,
      frameAccum: 0,
      blinkTimer: rand(1.4, 3.2),
      blinking: false,
      happyHold: 0,
    };

    setActorPose(actor, pose, faceRight);
    return actor;
  }

  function shouldMirror(pose, faceRight) {
    // trot_0..3 gốc đều hướng PHẢI (+X)
    if (pose === 'trot' || pose === 'leash') return !faceRight;
    // jump.png gốc hướng TRÁI (-X)
    if (pose === 'jump') return faceRight;
    // sit gốc hơi nghiêng phải
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

    // Điều chỉnh tỷ lệ khung chiều cao tự nhiên cho từng tư thế
    if (pose === 'sit') {
      actor.rig.style.aspectRatio = '286 / 440';
    } else if (pose === 'belly') {
      actor.rig.style.aspectRatio = '440 / 381';
    } else if (pose === 'jump') {
      actor.rig.style.aspectRatio = '440 / 400';
    } else {
      actor.rig.style.aspectRatio = '440 / 400';
    }
  }

  /* =====================================================================
     CONTROLLER (chạy vòng lặp nhẹ 60fps lật 4 frame bước chạy & chớp mắt tự nhiên)
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

      for (let i = 0; i < this.actors.length; i++) {
        const a = this.actors[i];

        // 1. Lật 4 frame bước chân chạy thật (11.5 fps -> mỗi ~87ms đổi tư thế 4 chân!)
        if (a.pose === 'trot' || a.pose === 'leash') {
          a.frameAccum += dt;
          if (a.frameAccum >= 0.086) {
            a.frameAccum %= 0.086;
            a.trotFramesEls[a.frameIdx].classList.remove('is-on');
            a.frameIdx = (a.frameIdx + 1) % 4;
            a.trotFramesEls[a.frameIdx].classList.add('is-on');
          }
        }

        // 2. Chớp mắt tự nhiên ở tư thế ngồi (hoặc cười tít mắt '^ ^' khi được nựng!)
        if (a.pose === 'sit') {
          if (a.happyHold > 0) {
            a.happyHold -= dt;
            a.sitHeadWrap.classList.add('is-blinking');
          } else {
            a.blinkTimer -= dt;
            if (!a.blinking && a.blinkTimer <= 0) {
              a.blinking = true;
              a.blinkTimer = 0.16; // nhắm mắt 160ms
              a.sitHeadWrap.classList.add('is-blinking');
            } else if (a.blinking && a.blinkTimer <= 0) {
              a.blinking = false;
              a.blinkTimer = rand(2.3, 4.2);
              a.sitHeadWrap.classList.remove('is-blinking');
            }
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

    /* ---------------- 1. PRELUDE: ĐÀN 5 BÉ KAKAO BƯỚC CHẠY THẬT & ĐÒI ĐI CÔNG VIÊN ---------------- */
    runPrelude(cfg = {}, sendFx = () => {}) {
      this.clearAll();
      this.sendFx = sendFx;
      if (!this.layer) return;

      const lines = cfg.preludeLines || {};

      // Bé #1: 4 chân bước lạch bạch từ trái vào, miệng ngậm dây dắt đỏ đung đưa, tới nơi ngồi ngoáy đuôi nghiêng đầu!
      this._after(0, () => {
        sendFx({ t: 'sfx', kind: 'kakaoPop', x: 0.24 });
        const a1 = this._addActor({
          pose: 'leash',
          size: 168,
          faceRight: true,
          text: lines.leash || 'Gâu gâu!! Đàn Kakao chiếm máy rồi, dẫn đi công viên mới trả nha! 🌳🐾',
        });
        a1.wrap.style.left = '-14%';
        a1.wrap.style.top = '64%';
        this.preludeActors.push({ actor: a1, exitX: '-16%', exitY: '64%', exitRight: false });

        requestAnimationFrame(() => {
          a1.wrap.style.transition = 'left 1.25s linear, top 0.55s ease, opacity 0.4s ease';
          a1.wrap.style.left = '22%';
        });
        [240, 520, 800, 1060].forEach((ms, i) => this._after(ms, () => this._dropPaw(4 + i * 5, 72)));
      });

      // Bé #2: Thò đầu nghiêng từ mép phải màn hình (đầu nghiêng + chớp mắt + vẫy đuôi!)
      this._after(850, () => {
        sendFx({ t: 'sfx', kind: 'pawTap', x: 0.9, step: 1 });
        const a2 = this._addActor({
          pose: 'sit',
          size: 132,
          faceRight: false,
          text: lines.peek || 'Ủa mở máy tính mà hổng dẫn Kakao đi công viên hả chị Khuê?!',
        });
        a2.wrap.classList.add('k-edge-right');
        a2.shadow.style.display = 'none';
        a2.flipWrap.style.transform = 'rotate(-58deg)';
        a2.wrap.style.left = '106%';
        a2.wrap.style.top = '32%';
        this.preludeActors.push({ actor: a2, exitX: '112%', exitY: '32%', exitRight: true, keepRot: true });

        requestAnimationFrame(() => {
          a2.wrap.style.transition = 'left 0.68s cubic-bezier(.18, 1.32, .32, 1), opacity 0.4s ease';
          a2.wrap.style.left = '95%';
        });
      });

      // Bé #3: Lăn ngửa bụng ở góc phải dưới (đuôi vẫy tít tách rời khỏi thân + ảnh thật Kakao!)
      this._after(1700, () => {
        sendFx({ t: 'sfx', kind: 'pawTap', x: 0.74, step: 2 });
        sendFx({ t: 'burst', x: 0.74, y: 0.73, type: 'glitter', palette: 'gold', size: 0.65 });
        const a3 = this._addActor({
          pose: 'belly',
          size: 168,
          faceRight: true,
          photo: cfg.photo || 'assets/real_photos/kakao_sleep.jpg',
          text: lines.belly || 'Nằm lăn ra ăn vạ luôn! Gãi bụng 10 cái mới cho xem tiếp!',
        });
        a3.wrap.style.left = '75%';
        a3.wrap.style.top = '74%';
        a3.wrap.style.transform = 'translate(-50%, -50%) scale(0.28)';
        this.preludeActors.push({ actor: a3, exitX: '116%', exitY: '75%', exitRight: true });

        requestAnimationFrame(() => {
          a3.wrap.style.transition = 'transform 0.6s cubic-bezier(.18, 1.35, .32, 1), left 0.55s ease, opacity 0.4s ease';
          a3.wrap.style.transform = 'translate(-50%, -50%) scale(1)';
        });
      });

      // Bé #4: 4 chân chạy nước đại thật (trot_0..3) băng ngang màn hình trên rượt bướm vàng!
      this._after(2550, () => {
        sendFx({ t: 'sfx', kind: 'pawTap', x: 0.35, step: 3 });
        const a4 = this._addActor({
          pose: 'trot',
          size: 152,
          faceRight: false,
          text: lines.zoom || 'Đi công viên bắt bướm thôiii gâu gâu!! 🦋',
        });
        const bf = document.createElement('span');
        bf.className = 'k-butterfly';
        bf.textContent = '🦋';
        a4.wrap.appendChild(bf);

        a4.wrap.style.left = '110%';
        a4.wrap.style.top = '24%';
        this.preludeActors.push({ actor: a4, exitX: '-16%', exitY: '22%', exitRight: false });

        requestAnimationFrame(() => {
          a4.wrap.style.transition = 'left 1.65s linear, opacity 0.4s ease';
          a4.wrap.style.left = '26%';
        });
        [280, 620, 960, 1300].forEach((ms, i) => this._after(ms, () => this._dropPaw(86 - i * 15, 30)));
        this._after(1680, () => {
          setActorPose(a4, 'sit', true);
          a4.wrap.style.width = '122px';
        });
      });

      // Bé #5 (Trung tâm): Ngồi ngoáy đuôi + nghiêng đầu + chớp mắt tự nhiên phát hiện kỷ niệm 4 năm!
      this._after(3600, () => {
        sendFx({ t: 'sfx', kind: 'kakaoPop', x: 0.5 });
        sendFx({ t: 'burst', x: 0.5, y: 0.48, type: 'heart', palette: 'rose', size: 0.95 });
        const a5 = this._addActor({
          pose: 'sit',
          size: 146,
          faceRight: true,
          hero: true,
          text: lines.realize || 'Ủa khoan... hôm nay kỷ niệm 4 năm của anh Quân với chị Khuê hả?!',
        });
        a5.wrap.style.left = '50%';
        a5.wrap.style.top = '52%';
        a5.wrap.style.transform = 'translate(-50%, -50%) scale(0.28)';
        this.preludeActors.push({ actor: a5, exitX: '115%', exitY: '52%', exitRight: true });

        requestAnimationFrame(() => {
          a5.wrap.style.transition = 'transform 0.62s cubic-bezier(.18, 1.35, .32, 1), left 0.65s linear, opacity 0.4s ease';
          a5.wrap.style.transform = 'translate(-50%, -50%) scale(1)';
        });

        // Bật nhảy lên ăn mừng + cười tít mắt '^ ^' & bắn tim!
        this._after(1550, () => {
          sendFx({ t: 'sfx', kind: 'kakaoDone', x: 0.5 });
          sendFx({ t: 'burst', x: 0.5, y: 0.28, type: 'doubleHeart', palette: 'rose', size: 1.15 });
          a5.happyHold = 2.0;
          setActorPose(a5, 'jump', false);
          a5.wrap.style.width = '168px';
          a5.bubble.textContent =
            lines.handover || 'Thôi hôm nay Kakao nhịn đi công viên 1 bữa! Nhường chỗ cho anh Quân chúc mừng chị Khuê nè ❤️';
          this._popHearts(50, 44, 5);
          this._popHearts(22, 58, 3);
          this._popHearts(75, 66, 3);

          this._after(950, () => {
            if (this.actors.includes(a5)) {
              setActorPose(a5, 'sit', true);
              a5.wrap.style.width = '146px';
            }
          });
        });
      });
    }

    scatterPrelude() {
      this.preludeActors.forEach(({ actor, exitX, exitY, exitRight, keepRot }) => {
        actor.bubble.classList.remove('is-visible');
        if (!keepRot) {
          actor.wrap.style.width = '156px';
          setActorPose(actor, 'trot', exitRight);
        }
        actor.wrap.style.transition = 'left 0.65s linear, top 0.65s ease, opacity 0.48s ease 0.15s';
        actor.wrap.style.left = exitX;
        actor.wrap.style.top = exitY;
        actor.wrap.style.opacity = '0';
      });
      this._after(700, () => {
        if (!this.companion) this.clearAll();
      });
    }

    /* ---------------- 2. TRONG LÚC ĐỌC THƯ: BÉ KAKAO BƯỚC CHẠY THẬT & NGỒI VẪY ĐUÔI ---------------- */
    startStage(cfg = {}, sendFx = () => {}) {
      this.clearAll();
      this.sendFx = sendFx;
      if (!this.layer) return;

      this.compX = 13;

      const comp = this._addActor({
        pose: 'leash',
        size: 124,
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
        comp.wrap.style.transition = 'left 1.75s linear';
        comp.wrap.style.left = this.compX + '%';
      });

      this._after(1780, () => {
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
        c.wrap.style.width = '124px';
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
      const durSec = Math.max(1.15, Math.min(3.1, dist * 0.038));

      c.wrap.style.width = '124px';
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
      this._after(durSec * 1000 + 60, () => {
        if (this.companion === c && onArrive) onArrive();
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
          this._setCompIdleSit(this.compX < 50);
          this._say(
            pick([
              'Ngậm sẵn dây dắt rồi nè, đọc xong đi công viên nhaaa! 🌳',
              'Chị Khuê ơiii bao giờ mới tới giờ đi công viên dọ?',
              'Đi công viên chạy 3 vòng rồi về ăn pate nha!',
            ]),
            4000
          );
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
