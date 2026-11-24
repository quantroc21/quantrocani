/* =====================================================================
   KAKAO ILLUSTRATED STICKER PACK & LIVING STAGE COMPANION
   - Sử dụng bộ 4 sprite minh họa vẽ tay tách nền trong suốt sắc nét:
     assets/kakao/{leash,jump,belly,sit}.png
   - Chuyển động hoạt hình squash-and-stretch mượt 60fps (0 WebGL overhead)
   - Prelude: Đàn 5 bé Kakao ùa ra đòi đi công viên, lăn ngửa bụng, rượt bướm
   - Stage: Bé Kakao chạy lon ton hai bên lề, tha dây dắt đòi đi công viên,
     lăn bụng, ngồi nghiêng đầu hóng chuyện & nhảy bắn tim khi được click nựng
   ===================================================================== */
(function () {
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  const SPRITES = {
    leash: 'assets/kakao/leash.png', // Mặc định hướng sang PHẢI (+X)
    jump:  'assets/kakao/jump.png',  // Mặc định hướng sang TRÁI (-X)
    belly: 'assets/kakao/belly.png',
    sit:   'assets/kakao/sit.png',
  };

  // Preload ngay cả 4 sprite để hiện tức thì không nháy khung
  Object.values(SPRITES).forEach((src) => {
    const im = new Image();
    im.src = src;
    if (im.decode) im.decode().catch(() => {});
  });

  function shouldMirror(pose, faceRight) {
    if (pose === 'leash') return !faceRight; // leash gốc nhìn phải
    if (pose === 'jump') return faceRight;   // jump gốc nhìn trái
    if (pose === 'sit') return !faceRight;
    return false;
  }

  function createActorDOM({ pose = 'sit', size = 148, faceRight = true, text = '', photo = '', hero = false, companion = false } = {}) {
    const wrap = document.createElement('div');
    wrap.className =
      'k-actor' +
      (hero ? ' k-hero' : '') +
      (companion ? ' k-companion' : '');
    wrap.style.width = size + 'px';

    const shadow = document.createElement('div');
    shadow.className = 'k-ground-shadow';
    wrap.appendChild(shadow);

    const flipWrap = document.createElement('div');
    flipWrap.className = 'k-flip' + (shouldMirror(pose, faceRight) ? ' is-mirrored' : '');

    const animWrap = document.createElement('div');
    animWrap.className = 'k-anim k-pose-' + pose;

    const img = new Image();
    img.className = 'k-sprite-img';
    img.src = SPRITES[pose] || SPRITES.sit;
    img.alt = 'Kakao';
    img.draggable = false;

    animWrap.appendChild(img);
    flipWrap.appendChild(animWrap);
    wrap.appendChild(flipWrap);

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

    return { wrap, flipWrap, animWrap, img, shadow, bubble };
  }

  /* =====================================================================
     CONTROLLER
     ===================================================================== */
  class KakaoPackController {
    constructor(layer) {
      this.layer = layer;
      this.timers = [];
      this.preludeActors = [];
      this.companion = null;
      this.compX = 14;
      this.compFaceRight = true;
      this.compTimer = null;
      this.lastAction = '';
      this.pageKind = 'letter';
      this.sendFx = () => {};
    }

    _after(ms, fn) {
      const id = setTimeout(fn, ms);
      this.timers.push(id);
      return id;
    }

    clearAll() {
      this.timers.forEach((t) => clearTimeout(t));
      this.timers = [];
      if (this.compTimer) {
        clearTimeout(this.compTimer);
        this.compTimer = null;
      }
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

    _setActorPose(actor, pose, faceRight) {
      actor.img.src = SPRITES[pose] || SPRITES.sit;
      actor.animWrap.className = 'k-anim k-pose-' + pose;
      actor.flipWrap.classList.toggle('is-mirrored', shouldMirror(pose, faceRight));
    }

    /* ---------------- 1. PRELUDE: ĐÀN 5 BÉ KAKAO ÙA RA ĐÒI ĐI CÔNG VIÊN ---------------- */
    runPrelude(cfg = {}, sendFx = () => {}) {
      this.clearAll();
      this.sendFx = sendFx;
      if (!this.layer) return;

      const lines = cfg.preludeLines || {};

      // Bé #1: Ngậm dây dắt đỏ chạy từ trái vào đòi đi công viên!
      this._after(0, () => {
        sendFx({ t: 'sfx', kind: 'kakaoPop', x: 0.24 });
        const a1 = createActorDOM({
          pose: 'leash',
          size: 162,
          faceRight: true,
          text: lines.leash || 'Gâu gâu!! Đàn Kakao chiếm máy rồi, dẫn đi công viên mới trả nha! 🌳🐾',
        });
        a1.wrap.style.left = '-14%';
        a1.wrap.style.top = '64%';
        this.layer.appendChild(a1.wrap);
        this.preludeActors.push({ ...a1, exitX: '-16%', exitY: '64%', exitRight: false });

        requestAnimationFrame(() => {
          a1.wrap.style.transition = 'left 1.15s cubic-bezier(.16, 1, .3, 1), top 0.55s ease, opacity 0.4s ease';
          a1.wrap.style.left = '22%';
        });
        [220, 480, 740].forEach((ms, i) => this._after(ms, () => this._dropPaw(5 + i * 6, 72)));
      });

      // Bé #2: Thò đầu nghiêng từ mép phải màn hình ra hờn dỗi!
      this._after(850, () => {
        sendFx({ t: 'sfx', kind: 'pawTap', x: 0.9, step: 1 });
        const a2 = createActorDOM({
          pose: 'sit',
          size: 138,
          faceRight: false,
          text: lines.peek || 'Ủa mở máy tính mà hổng dẫn Kakao đi công viên hả chị Khuê?!',
        });
        a2.wrap.classList.add('k-edge-right');
        a2.shadow.style.display = 'none';
        a2.flipWrap.style.transform = 'rotate(-58deg)';
        a2.wrap.style.left = '106%';
        a2.wrap.style.top = '32%';
        this.layer.appendChild(a2.wrap);
        this.preludeActors.push({ ...a2, exitX: '112%', exitY: '32%', exitRight: true, keepRot: true });

        requestAnimationFrame(() => {
          a2.wrap.style.transition = 'left 0.68s cubic-bezier(.18, 1.32, .32, 1), opacity 0.4s ease';
          a2.wrap.style.left = '95%';
        });
      });

      // Bé #3: Lăn đùng ngửa bụng hồng ăn vạ ở góc phải dưới + ảnh thật Kakao cười tít!
      this._after(1700, () => {
        sendFx({ t: 'sfx', kind: 'pawTap', x: 0.74, step: 2 });
        sendFx({ t: 'burst', x: 0.74, y: 0.73, type: 'glitter', palette: 'gold', size: 0.65 });
        const a3 = createActorDOM({
          pose: 'belly',
          size: 164,
          faceRight: true,
          photo: cfg.photo || 'assets/real_photos/kakao_sleep.jpg',
          text: lines.belly || 'Nằm lăn ra ăn vạ luôn! Gãi bụng 10 cái mới cho xem tiếp!',
        });
        a3.wrap.style.left = '75%';
        a3.wrap.style.top = '74%';
        a3.wrap.style.transform = 'translate(-50%, -50%) scale(0.28)';
        this.layer.appendChild(a3.wrap);
        this.preludeActors.push({ ...a3, exitX: '115%', exitY: '75%', exitRight: true });

        requestAnimationFrame(() => {
          a3.wrap.style.transition = 'transform 0.6s cubic-bezier(.18, 1.35, .32, 1), left 0.55s ease, opacity 0.4s ease';
          a3.wrap.style.transform = 'translate(-50%, -50%) scale(1)';
        });
      });

      // Bé #4: Phóng nhảy tưng tưng ngang phía trên rượt bướm vàng!
      this._after(2600, () => {
        sendFx({ t: 'sfx', kind: 'pawTap', x: 0.35, step: 3 });
        const a4 = createActorDOM({
          pose: 'jump',
          size: 146,
          faceRight: false, // chạy từ phải sang trái
          text: lines.zoom || 'Đi công viên bắt bướm thôiii gâu gâu!! 🦋',
        });
        const bf = document.createElement('span');
        bf.className = 'k-butterfly';
        bf.textContent = '🦋';
        a4.wrap.appendChild(bf);

        a4.wrap.style.left = '110%';
        a4.wrap.style.top = '24%';
        this.layer.appendChild(a4.wrap);
        this.preludeActors.push({ ...a4, exitX: '-16%', exitY: '22%', exitRight: false });

        requestAnimationFrame(() => {
          a4.wrap.style.transition = 'left 1.45s cubic-bezier(.16, 1, .3, 1), opacity 0.4s ease';
          a4.wrap.style.left = '26%';
        });
        [250, 520, 800].forEach((ms, i) => this._after(ms, () => this._dropPaw(84 - i * 16, 30)));
      });

      // Bé #5 (Trung tâm): Bật nhảy ra giữa màn hình phát hiện kỷ niệm 4 năm!
      this._after(3600, () => {
        sendFx({ t: 'sfx', kind: 'kakaoPop', x: 0.5 });
        sendFx({ t: 'burst', x: 0.5, y: 0.48, type: 'heart', palette: 'rose', size: 0.95 });
        const a5 = createActorDOM({
          pose: 'sit',
          size: 176,
          faceRight: true,
          hero: true,
          text: lines.realize || 'Ủa khoan... hôm nay kỷ niệm 4 năm của anh Quân với chị Khuê hả?!',
        });
        a5.wrap.style.left = '50%';
        a5.wrap.style.top = '51%';
        a5.wrap.style.transform = 'translate(-50%, -50%) scale(0.28)';
        this.layer.appendChild(a5.wrap);
        this.preludeActors.push({ ...a5, exitX: '50%', exitY: '118%', exitRight: true });

        requestAnimationFrame(() => {
          a5.wrap.style.transition = 'transform 0.62s cubic-bezier(.18, 1.35, .32, 1), top 0.55s ease, opacity 0.4s ease';
          a5.wrap.style.transform = 'translate(-50%, -50%) scale(1)';
        });

        // Cả đàn nhảy bật lên bắn tim & nhường sân khấu!
        this._after(1550, () => {
          sendFx({ t: 'sfx', kind: 'kakaoDone', x: 0.5 });
          sendFx({ t: 'burst', x: 0.5, y: 0.28, type: 'doubleHeart', palette: 'rose', size: 1.15 });
          this._setActorPose(a5, 'jump', false);
          a5.bubble.textContent =
            lines.handover || 'Thôi hôm nay Kakao nhịn đi công viên 1 bữa! Nhường chỗ cho anh Quân chúc mừng chị Khuê nè ❤️';
          this._popHearts(50, 44, 5);
          this._popHearts(22, 58, 3);
          this._popHearts(75, 66, 3);
        });
      });
    }

    scatterPrelude() {
      this.preludeActors.forEach((a) => {
        a.bubble.classList.remove('is-visible');
        if (!a.keepRot) this._setActorPose(a, 'jump', a.exitRight);
        a.wrap.style.transition = 'left 0.56s cubic-bezier(.55, 0, .9, .4), top 0.56s cubic-bezier(.55, 0, .9, .4), opacity 0.45s ease';
        a.wrap.style.left = a.exitX;
        a.wrap.style.top = a.exitY;
        a.wrap.style.opacity = '0';
      });
      this._after(620, () => {
        if (!this.companion && this.layer) this.layer.innerHTML = '';
        this.preludeActors = [];
      });
    }

    /* ---------------- 2. TRONG LÚC ĐỌC THƯ: BÉ KAKAO CHẠY CHƠI ĐA DẠNG & CHO NỰNG ---------------- */
    startStage(cfg = {}, sendFx = () => {}) {
      this.clearAll();
      this.sendFx = sendFx;
      if (!this.layer) return;

      this.compX = 13;
      this.compFaceRight = true;

      const comp = createActorDOM({
        pose: 'leash',
        size: 112,
        faceRight: true,
        companion: true,
        text: 'Đọc thư thong thả nha, xong dắt Kakao đi công viên nhaaa! 🌳🐾',
      });
      comp.wrap.style.left = '-10%';
      comp.wrap.style.bottom = '54px';
      comp.wrap.title = 'Click để nựng Kakao!';
      this.layer.appendChild(comp.wrap);
      this.companion = comp;

      comp.wrap.addEventListener('click', (e) => {
        e.stopPropagation();
        this.petCompanion();
      });

      requestAnimationFrame(() => {
        comp.wrap.style.transition = 'left 1.75s cubic-bezier(.16, 1, .3, 1)';
        comp.wrap.style.left = this.compX + '%';
      });

      this._after(1800, () => {
        if (!this.companion) return;
        this._setActorPose(this.companion, 'sit', true);
      });
      this._after(4500, () => {
        if (this.companion) this.companion.bubble.classList.remove('is-visible');
      });

      this._scheduleNextAntic(5600);
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
      this._setActorPose(c, 'jump', this.compX < 50);
      c.animWrap.classList.add('k-excited-burst');
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
      this._after(1800, () => {
        if (!this.companion) return;
        c.animWrap.classList.remove('k-excited-burst');
        this._setActorPose(c, 'belly', true);
      });
      this._after(3600, () => {
        if (!this.companion) return;
        this._setActorPose(c, 'sit', this.compX < 50);
      });
    }

    onPageChange(index, page) {
      const c = this.companion;
      if (!c) return;
      if (page && page.finale) {
        this.pageKind = 'finale';
        this._walkCompTo(14, 'jump', () => {
          this._setActorPose(c, 'sit', true);
          this._say('Pháo hoa đẹp quá trời luôn gâu gâu!! ✨', 4200);
        });
      } else if (page && page.type === 'rooms') {
        this.pageKind = 'rooms';
        this._setActorPose(c, 'leash', this.compX < 50);
        this._popHearts(this.compX, 84, 3);
        this._say('Anh chị đi vi vu về nhớ dắt Kakao bù 3 vòng công viên nha!! 🌳🐾', 4300);
        this._after(3200, () => {
          if (this.companion === c) this._setActorPose(c, 'sit', this.compX < 50);
        });
      } else {
        this.pageKind = 'letter';
      }
    }

    _walkCompTo(targetX, walkPose = 'jump', onArrive) {
      const c = this.companion;
      if (!c) return;
      const dx = targetX - this.compX;
      const faceRight = dx >= 0;
      const dist = Math.abs(dx);
      const durSec = Math.max(1.2, Math.min(3.1, dist * 0.038));

      this.compFaceRight = faceRight;
      this._setActorPose(c, walkPose, faceRight);
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
      const sameSide = this.compX < 50 ? rand(12, 22) : rand(78, 88);

      if (act === 'walk_across') {
        this._say(
          pick([
            'Chạy lon ton qua bên này hóng tiếp nè 🐾',
            'Lạch bạch... đi tuần quanh bức thư của anh chị!',
            'Chạy khởi động chân cẳng lát đi công viên!',
          ]),
          2800
        );
        this._walkCompTo(otherSide, 'jump', () => {
          this._setActorPose(c, 'sit', this.compX < 50);
          this._scheduleNextAntic(rand(5200, 6800));
        });
      } else if (act === 'leash_park') {
        this._walkCompTo(sameSide, 'leash', () => {
          this._setActorPose(c, 'leash', this.compX < 50);
          this._say(
            pick([
              'Ngậm sẵn dây dắt rồi nè, đọc xong đi công viên nhaaa! 🌳',
              'Chị Khuê ơiii bao giờ mới tới giờ đi công viên dọ?',
              'Đi công viên chạy 3 vòng rồi về ăn pate nha!',
            ]),
            4000
          );
          this._after(3600, () => {
            if (this.companion === c) this._setActorPose(c, 'sit', this.compX < 50);
          });
          this._scheduleNextAntic(rand(5800, 7400));
        });
      } else if (act === 'belly_roll') {
        this._setActorPose(c, 'belly', true);
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
        this._walkCompTo(otherSide, 'jump', () => {
          bf.remove();
          this._setActorPose(c, 'sit', this.compX < 50);
          this._popHearts(this.compX, 84, 3);
          this._scheduleNextAntic(rand(5400, 6800));
        });
      } else {
        this._setActorPose(c, 'sit', this.compX < 50);
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
