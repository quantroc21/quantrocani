/* =====================================================================
   ATMOSPHERE.JS — Hiệu ứng không gian xung quanh lá thư (cực nhẹ GPU/CPU)
   Dùng offscreen sprite cache (không shadowBlur mỗi frame, tối đa ~65 hạt):
   - 'petals':      Cánh hoa đào / hoa hồng rơi xoay 3D theo gió
   - 'fireflies':   Đom đóm vàng ấm & ánh sáng biển lững lờ
   - 'lanterns':    Đèn trời thả bay lên bầu trời đêm
   - 'meteors':     Bụi sao & mưa sao băng lướt ngang
   - 'petals_gold': Cánh hoa kết hợp bụi vàng cho trang kết & Finale
   ===================================================================== */
(function () {
  const TAU = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  /* ---- Pre-rendered offscreen sprites ---- */
  function makePetalSprite(colorTop, colorBot) {
    const s = 48;
    const c = document.createElement('canvas');
    c.width = c.height = s;
    const g = c.getContext('2d');
    g.translate(s / 2, s / 2);
    const grd = g.createLinearGradient(0, -18, 0, 18);
    grd.addColorStop(0, colorTop);
    grd.addColorStop(1, colorBot);
    g.fillStyle = grd;
    g.beginPath();
    g.moveTo(0, -18);
    g.bezierCurveTo(14, -14, 15, 6, 0, 18);
    g.bezierCurveTo(-15, 6, -14, -14, 0, -18);
    g.fill();
    return c;
  }

  function makeGlowSprite(hex, soft = false) {
    const s = 64;
    const c = document.createElement('canvas');
    c.width = c.height = s;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grd.addColorStop(0, soft ? hex : '#ffffff');
    grd.addColorStop(0.22, hex);
    grd.addColorStop(0.55, hex + '44');
    grd.addColorStop(1, hex + '00');
    g.fillStyle = grd;
    g.fillRect(0, 0, s, s);
    return c;
  }

  function makeLanternSprite() {
    const w = 72, h = 92;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');

    // Warm outer ambient halo
    const halo = g.createRadialGradient(w / 2, h * 0.52, 4, w / 2, h * 0.52, 34);
    halo.addColorStop(0, 'rgba(255, 196, 102, 0.55)');
    halo.addColorStop(0.55, 'rgba(240, 128, 56, 0.18)');
    halo.addColorStop(1, 'rgba(240, 128, 56, 0)');
    g.fillStyle = halo;
    g.fillRect(0, 0, w, h);

    // Paper lantern silhouette
    const body = g.createLinearGradient(0, 18, 0, 68);
    body.addColorStop(0, '#c85b2c');
    body.addColorStop(0.55, '#f29a48');
    body.addColorStop(1, '#ffe49e');
    g.fillStyle = body;
    g.beginPath();
    g.moveTo(w / 2 - 14, 22);
    g.quadraticCurveTo(w / 2, 16, w / 2 + 14, 22);
    g.quadraticCurveTo(w / 2 + 19, 44, w / 2 + 10, 66);
    g.lineTo(w / 2 - 10, 66);
    g.quadraticCurveTo(w / 2 - 19, 44, w / 2 - 14, 22);
    g.closePath();
    g.fill();

    // Inner bright flame core
    const flame = g.createRadialGradient(w / 2, 62, 0, w / 2, 62, 10);
    flame.addColorStop(0, '#ffffff');
    flame.addColorStop(0.45, '#ffd784');
    flame.addColorStop(1, 'rgba(255, 200, 100, 0)');
    g.fillStyle = flame;
    g.fillRect(w / 2 - 12, 50, 24, 24);
    return c;
  }

  class Atmosphere {
    constructor(canvas, opts = {}) {
      this.c = canvas;
      this.g = canvas.getContext('2d');
      this.dprCap = opts.dprCap || 1.5;
      this.mode = 'petals';
      this.items = [];
      this.meteors = [];
      this.running = false;
      this.mouseX = 0;
      this.mouseT = 0;
      this.fade = 0;
      this.fadeTarget = 1;
      this.nextMeteor = 0;

      this.sprites = {
        petals: [
          makePetalSprite('#ffd6de', '#f2a1b4'),
          makePetalSprite('#fbe3e8', '#f6b8c6'),
          makePetalSprite('#f6b8c6', '#e8899e'),
        ],
        glowGold: makeGlowSprite('#ffe29a'),
        glowAmber: makeGlowSprite('#f5b963'),
        glowBlue: makeGlowSprite('#9fe3ff'),
        lantern: makeLanternSprite(),
      };

      window.addEventListener('pointermove', (e) => {
        this.mouseT = (e.clientX / window.innerWidth - 0.5) * 2;
      });
      window.addEventListener('resize', () => this.resize());
      this.resize();
      this.populate(this.mode);
    }

    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, this.dprCap);
      this.W = window.innerWidth;
      this.H = window.innerHeight;
      this.c.width = Math.round(this.W * dpr);
      this.c.height = Math.round(this.H * dpr);
      this.c.style.width = this.W + 'px';
      this.c.style.height = this.H + 'px';
      this.g.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    setMode(mode) {
      if (this.mode === mode && this.items.length) return;
      if (this.items.length) {
        this.prevItems = this.items;
        this.prevFade = this.fade;
      }
      this.mode = mode;
      this.fade = 0;
      this.populate(mode);
    }

    populate(mode) {
      this.items = [];
      this.meteors = [];
      const W = this.W, H = this.H;

      if (mode === 'petals' || mode === 'petals_gold') {
        const petalCount = mode === 'petals_gold' ? 34 : 44;
        for (let i = 0; i < petalCount; i++) {
          const near = i < 8;
          this.items.push({
            kind: 'petal',
            sprite: pick(this.sprites.petals),
            x: rand(0, W),
            y: rand(-H * 0.2, H),
            vx: rand(-0.35, 0.55),
            vy: near ? rand(1.1, 1.8) : rand(0.55, 1.05),
            scale: near ? rand(0.68, 0.96) : rand(0.32, 0.55),
            alpha: near ? rand(0.45, 0.65) : rand(0.55, 0.88),
            rot: rand(0, TAU),
            vrot: rand(-0.025, 0.025),
            tumble: rand(0, TAU),
            vtumble: rand(0.02, 0.05),
            swayPh: rand(0, TAU),
            swayAmp: rand(0.35, 0.85),
          });
        }
        if (mode === 'petals_gold') {
          for (let i = 0; i < 24; i++) {
            this.items.push(this._makeFirefly(W, H, true));
          }
        }
      } else if (mode === 'fireflies') {
        for (let i = 0; i < 55; i++) {
          this.items.push(this._makeFirefly(W, H, false));
        }
      } else if (mode === 'lanterns') {
        for (let i = 0; i < 22; i++) {
          const depth = rand(0.35, 1.08);
          this.items.push({
            kind: 'lantern',
            x: rand(0, W),
            y: rand(0, H * 1.15),
            vy: -rand(0.28, 0.62) * depth,
            vx: rand(-0.14, 0.18),
            depth,
            swayPh: rand(0, TAU),
            alpha: 0.4 + 0.55 * depth,
          });
        }
        for (let i = 0; i < 26; i++) {
          this.items.push(this._makeFirefly(W, H, true));
        }
      } else if (mode === 'meteors') {
        for (let i = 0; i < 42; i++) {
          this.items.push(this._makeFirefly(W, H, true));
        }
        this.nextMeteor = performance.now() + 450;
      }
    }

    _makeFirefly(W, H, warmOnly) {
      const sprite = warmOnly
        ? (Math.random() < 0.6 ? this.sprites.glowGold : this.sprites.glowAmber)
        : pick([this.sprites.glowGold, this.sprites.glowAmber, this.sprites.glowBlue]);
      return {
        kind: 'firefly',
        sprite,
        x: rand(0, W),
        y: rand(0, H),
        vx: rand(-0.22, 0.22),
        vy: -rand(0.18, 0.52),
        size: rand(12, 28),
        ph: rand(0, TAU),
        speed: rand(0.02, 0.05),
        alpha: rand(0.35, 0.85),
      };
    }

    _spawnMeteor() {
      const W = this.W, H = this.H;
      const fromRight = Math.random() < 0.5;
      const x = fromRight ? rand(W * 0.45, W * 0.98) : rand(W * 0.15, W * 0.75);
      const y = rand(H * 0.03, H * 0.34);
      const speed = rand(12, 18);
      const ang = fromRight ? rand(2.38, 2.68) : rand(0.45, 0.75);
      this.meteors.push({
        x, y,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        len: rand(95, 165),
        life: 0,
        maxLife: rand(34, 48),
      });
    }

    start() {
      if (this.running) return;
      this.running = true;
      this.last = performance.now();
      const loop = (now) => {
        if (!this.running) return;
        this.frame(now);
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }

    stop() {
      this.running = false;
    }

    _drawList(list, fadeAlpha, dt) {
      const g = this.g, W = this.W, H = this.H;
      for (let i = 0; i < list.length; i++) {
        const it = list[i];

        if (it.kind === 'petal') {
          it.swayPh += 0.022 * dt;
          it.tumble += it.vtumble * dt;
          it.rot += it.vrot * dt;
          it.x += (it.vx + Math.sin(it.swayPh) * it.swayAmp + this.mouseX * 0.55) * dt;
          it.y += it.vy * dt;

          if (it.y > H + 40) { it.y = -32; it.x = rand(0, W); }
          if (it.x > W + 40) it.x = -32;
          if (it.x < -40) it.x = W + 32;

          g.save();
          g.globalAlpha = fadeAlpha * it.alpha;
          g.translate(it.x, it.y);
          g.rotate(it.rot);
          g.scale(it.scale, it.scale * (0.35 + 0.65 * Math.abs(Math.cos(it.tumble))));
          g.drawImage(it.sprite, -24, -24);
          g.restore();
        } else if (it.kind === 'firefly') {
          it.ph += it.speed * dt;
          it.x += (it.vx + Math.sin(it.ph * 0.7) * 0.25 + this.mouseX * 0.2) * dt;
          it.y += it.vy * dt;
          if (it.y < -24) { it.y = H + 20; it.x = rand(0, W); }
          if (it.x < -24) it.x = W + 20;
          if (it.x > W + 24) it.x = -20;

          const pulse = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(it.ph));
          g.save();
          g.globalCompositeOperation = 'lighter';
          g.globalAlpha = fadeAlpha * it.alpha * pulse;
          g.drawImage(it.sprite, it.x - it.size / 2, it.y - it.size / 2, it.size, it.size);
          g.restore();
        } else if (it.kind === 'lantern') {
          it.swayPh += 0.014 * dt;
          it.x += (it.vx + Math.sin(it.swayPh) * 0.18 + this.mouseX * 0.12 * it.depth) * dt;
          it.y += it.vy * dt;
          if (it.y < -110) { it.y = H + 80; it.x = rand(0, W); }
          if (it.x < -80) it.x = W + 60;
          if (it.x > W + 80) it.x = -60;

          const w = 72 * it.depth;
          const h = 92 * it.depth;
          const flicker = 0.88 + 0.12 * Math.sin(it.swayPh * 4.3);
          g.save();
          g.globalAlpha = fadeAlpha * it.alpha * flicker;
          g.drawImage(this.sprites.lantern, it.x - w / 2, it.y - h / 2, w, h);
          g.restore();
        }
      }
    }

    frame(now) {
      const dt = Math.min(2.2, (now - this.last) / 16.667);
      this.last = now;
      const g = this.g, W = this.W, H = this.H;

      this.mouseX += (this.mouseT - this.mouseX) * 0.05;
      this.fade = Math.min(1, this.fade + 0.028 * dt);

      g.clearRect(0, 0, W, H);

      if (this.prevItems && this.prevFade > 0.01) {
        this.prevFade = Math.max(0, this.prevFade - 0.036 * dt);
        this._drawList(this.prevItems, this.prevFade, dt);
        if (this.prevFade <= 0.01) this.prevItems = null;
      }

      this._drawList(this.items, this.fade, dt);

      if (this.mode === 'meteors') {
        if (now >= this.nextMeteor) {
          this._spawnMeteor();
          this.nextMeteor = now + rand(1500, 3100);
        }
        for (let i = this.meteors.length - 1; i >= 0; i--) {
          const m = this.meteors[i];
          m.life += dt;
          m.x += m.vx * dt;
          m.y += m.vy * dt;
          if (m.life >= m.maxLife) {
            this.meteors.splice(i, 1);
            continue;
          }
          const k = m.life / m.maxLife;
          const a = Math.sin(k * Math.PI);
          const mag = Math.hypot(m.vx, m.vy) || 1;
          const tx = m.x - (m.vx / mag) * m.len;
          const ty = m.y - (m.vy / mag) * m.len;

          const grad = g.createLinearGradient(m.x, m.y, tx, ty);
          grad.addColorStop(0, `rgba(255, 244, 214, ${0.9 * a * this.fade})`);
          grad.addColorStop(0.35, `rgba(235, 200, 138, ${0.45 * a * this.fade})`);
          grad.addColorStop(1, 'rgba(235, 200, 138, 0)');

          g.save();
          g.globalCompositeOperation = 'lighter';
          g.strokeStyle = grad;
          g.lineWidth = 2.2;
          g.beginPath();
          g.moveTo(m.x, m.y);
          g.lineTo(tx, ty);
          g.stroke();
          g.globalAlpha = a * this.fade;
          g.drawImage(this.sprites.glowGold, m.x - 10, m.y - 10, 20, 20);
          g.restore();
        }
      }
    }
  }

  window.Atmosphere = Atmosphere;
})();
