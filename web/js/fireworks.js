/* =====================================================================
   FIREWORKS ENGINE — canvas 2D trong suốt, vẽ đè lên desktop
   Pháo: peony · chrys · willow · ring · heart · crossette · palm · glitter
   Âm thanh: tổng hợp bằng Web Audio (không cần file)
   ===================================================================== */
(function () {
  const TAU = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  const PALETTES = {
    gold:  ['#ffd79a', '#f6c46f', '#fff0d2', '#e9a94f'],
    ember: ['#ff7a45', '#ffae73', '#ff5b3a', '#ffd0a8'],
    rose:  ['#ff8fab', '#ffc4d3', '#ff6b93', '#ffe1e8'],
    white: ['#fffaf0', '#ffffff', '#ffeccc'],
    cool:  ['#9fd8ff', '#d7f0ff', '#7cc4ff'],
  };
  const MIXES = [['gold', 'white'], ['ember', 'gold'], ['rose', 'white'], ['gold', 'rose'], ['cool', 'white']];

  /* ---------------- Sprites (glow dots) ---------------- */
  const spriteCache = new Map();
  function sprite(color) {
    if (spriteCache.has(color)) return spriteCache.get(color);
    const s = 64, c = document.createElement('canvas');
    c.width = c.height = s;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.18, color);
    grd.addColorStop(0.45, hexA(color, 0.35));
    grd.addColorStop(1, hexA(color, 0));
    g.fillStyle = grd;
    g.fillRect(0, 0, s, s);
    spriteCache.set(color, c);
    return c;
  }
  const rgbCache = new Map();
  function hexA(hex, a) {
    let rgb = rgbCache.get(hex);
    if (!rgb) {
      const n = parseInt(hex.slice(1), 16);
      rgb = `${n >> 16},${(n >> 8) & 255},${n & 255}`;
      rgbCache.set(hex, rgb);
    }
    return `rgba(${rgb},${a})`;
  }

  /* ---------------- Audio ---------------- */
  class Sound {
    constructor() { this.ctx = null; this.noise = null; this.enabled = true; }
    ensure() {
      if (this.ctx || !this.enabled) return this.ctx;
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.75;
        const comp = this.ctx.createDynamicsCompressor();
        comp.threshold.value = -16; comp.ratio.value = 5;
        this.master.connect(comp).connect(this.ctx.destination);
        const len = this.ctx.sampleRate * 2;
        this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = this.noise.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      } catch (e) { this.enabled = false; }
      return this.ctx;
    }
    resume() { if (this.ensure() && this.ctx.state !== 'running') this.ctx.resume(); }
    _chain(pan) {
      const p = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
      if (p) { p.pan.value = Math.max(-0.85, Math.min(0.85, pan)); p.connect(this.master); return p; }
      return this.master;
    }
    boom(size = 1, pan = 0, lag = 0) {
      if (!this.ensure()) return;
      const c = this.ctx, t = c.currentTime + lag;
      const out = this._chain(pan);
      const src = c.createBufferSource(); src.buffer = this.noise;
      const lp = c.createBiquadFilter(); lp.type = 'lowpass';
      lp.frequency.setValueAtTime(2200, t); lp.frequency.exponentialRampToValueAtTime(110, t + 0.9);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.9 * size, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0008, t + 1.6);
      src.connect(lp).connect(g).connect(out);
      src.start(t, Math.random()); src.stop(t + 1.7);
      const o = c.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(85, t); o.frequency.exponentialRampToValueAtTime(34, t + 0.5);
      const og = c.createGain();
      og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(0.7 * size, t + 0.01);
      og.gain.exponentialRampToValueAtTime(0.0005, t + 0.6);
      o.connect(og).connect(out); o.start(t); o.stop(t + 0.65);
    }
    launch(pan = 0) {
      if (!this.ensure()) return;
      const c = this.ctx, t = c.currentTime, out = this._chain(pan);
      const src = c.createBufferSource(); src.buffer = this.noise;
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
      bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(1400, t + 0.7);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0005, t + 0.8);
      src.connect(bp).connect(g).connect(out); src.start(t, Math.random()); src.stop(t + 0.85);
    }
    crackle(count = 30, dur = 1.2, pan = 0, lag = 0.4) {
      if (!this.ensure()) return;
      const c = this.ctx, out = this._chain(pan);
      for (let i = 0; i < count; i++) {
        const t = c.currentTime + lag + Math.random() * dur;
        const src = c.createBufferSource(); src.buffer = this.noise;
        const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = rand(1800, 4200);
        const g = c.createGain();
        g.gain.setValueAtTime(rand(0.05, 0.22), t); g.gain.exponentialRampToValueAtTime(0.0005, t + rand(0.01, 0.04));
        src.connect(hp).connect(g).connect(out); src.start(t, Math.random() * 1.5); src.stop(t + 0.05);
      }
    }
    /* ---- Cinematic UI & Card Impact SFX ---- */
    sfx(kind, { pan = 0, step = 0 } = {}) {
      if (!this.ensure()) return;
      const c = this.ctx, t = c.currentTime, out = this._chain(pan);

      if (kind === 'notify') {
        [659.25, 987.77].forEach((freq, i) => {
          const o = c.createOscillator(), g = c.createGain();
          o.type = 'sine'; o.frequency.setValueAtTime(freq, t + i * 0.08);
          g.gain.setValueAtTime(0.0001, t + i * 0.08);
          g.gain.linearRampToValueAtTime(0.14, t + i * 0.08 + 0.015);
          g.gain.exponentialRampToValueAtTime(0.0004, t + i * 0.08 + 0.48);
          o.connect(g).connect(out);
          o.start(t + i * 0.08); o.stop(t + i * 0.08 + 0.52);
        });
        return;
      }

      if (kind === 'slam') {
        // 1) Visceral cinematic sub-bass thud
        const sub = c.createOscillator(), sg = c.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(140 + step * 8, t);
        sub.frequency.exponentialRampToValueAtTime(38, t + 0.34);
        sg.gain.setValueAtTime(0.0001, t);
        sg.gain.linearRampToValueAtTime(0.75, t + 0.008);
        sg.gain.exponentialRampToValueAtTime(0.0006, t + 0.44);
        sub.connect(sg).connect(out);
        sub.start(t); sub.stop(t + 0.46);

        // 2) Crisp foil/impact transient snap
        const snap = c.createBufferSource(); snap.buffer = this.noise;
        const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1900 + step * 260; bp.Q.value = 1.6;
        const ng = c.createGain();
        ng.gain.setValueAtTime(0.45, t);
        ng.gain.exponentialRampToValueAtTime(0.0008, t + 0.14);
        snap.connect(bp).connect(ng).connect(out);
        snap.start(t, Math.random()); snap.stop(t + 0.16);

        // 3) Escalating harmonic golden bell note (C5 -> D5 -> E5 -> G5 -> C6)
        const scale = [523.25, 587.33, 659.25, 783.99, 1046.5];
        const f = scale[Math.min(scale.length - 1, step)];
        [f, f * 1.5, f * 2].forEach((hz, k) => {
          const o = c.createOscillator(), g = c.createGain();
          o.type = k === 0 ? 'triangle' : 'sine';
          o.frequency.setValueAtTime(hz, t);
          g.gain.setValueAtTime(0.0001, t);
          g.gain.linearRampToValueAtTime(k === 0 ? 0.22 : 0.09, t + 0.012);
          g.gain.exponentialRampToValueAtTime(0.0004, t + (k === 0 ? 1.15 : 0.72));
          o.connect(g).connect(out);
          o.start(t); o.stop(t + 1.2);
        });
        return;
      }

      if (kind === 'charge') {
        // Tension rising shimmer swell (0.48s)
        const src = c.createBufferSource(); src.buffer = this.noise;
        const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 2.8;
        bp.frequency.setValueAtTime(320, t);
        bp.frequency.exponentialRampToValueAtTime(2800, t + 0.48);
        const g = c.createGain();
        g.gain.setValueAtTime(0.001, t);
        g.gain.exponentialRampToValueAtTime(0.32, t + 0.45);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.52);
        src.connect(bp).connect(g).connect(out);
        src.start(t, Math.random()); src.stop(t + 0.54);

        const o = c.createOscillator(), og = c.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(110, t);
        o.frequency.exponentialRampToValueAtTime(330, t + 0.48);
        og.gain.setValueAtTime(0.001, t);
        og.gain.linearRampToValueAtTime(0.22, t + 0.45);
        og.gain.exponentialRampToValueAtTime(0.001, t + 0.52);
        o.connect(og).connect(out);
        o.start(t); o.stop(t + 0.54);
        return;
      }

      if (kind === 'implode') {
        // Reverse-suction vacuum sweep into center
        const src = c.createBufferSource(); src.buffer = this.noise;
        const lp = c.createBiquadFilter(); lp.type = 'bandpass'; lp.Q.value = 1.8;
        lp.frequency.setValueAtTime(2200, t);
        lp.frequency.exponentialRampToValueAtTime(160, t + 0.65);
        const g = c.createGain();
        g.gain.setValueAtTime(0.001, t);
        g.gain.linearRampToValueAtTime(0.34, t + 0.14);
        g.gain.exponentialRampToValueAtTime(0.0008, t + 0.72);
        src.connect(lp).connect(g).connect(out);
        src.start(t, Math.random()); src.stop(t + 0.74);
        return;
      }

      if (kind === 'supernova') {
        // Big cinematic bass drop + shimmering major chord bloom
        this.boom(1.3, 0, 0);
        [261.63, 329.63, 392.0, 523.25, 659.25, 783.99].forEach((hz, k) => {
          const o = c.createOscillator(), g = c.createGain();
          o.type = k < 3 ? 'triangle' : 'sine';
          o.frequency.setValueAtTime(hz, t + 0.04);
          g.gain.setValueAtTime(0.0001, t + 0.04);
          g.gain.linearRampToValueAtTime(0.095, t + 0.16);
          g.gain.exponentialRampToValueAtTime(0.0004, t + 2.4);
          o.connect(g).connect(out);
          o.start(t + 0.04); o.stop(t + 2.45);
        });
        return;
      }

      if (kind === 'pageTurn') {
        const src = c.createBufferSource(); src.buffer = this.noise;
        const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.9;
        const g = c.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.075, t + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0004, t + 0.24);
        src.connect(bp).connect(g).connect(out);
        src.start(t, Math.random()); src.stop(t + 0.26);
        return;
      }

      if (kind === 'kakaoPop') {
        // Bouncy warm marimba chord + cute two-note puppy chirp ("arf-arf!")
        [523.25, 659.25, 783.99].forEach((hz, k) => {
          const o = c.createOscillator(), g = c.createGain();
          o.type = 'triangle';
          o.frequency.setValueAtTime(hz, t + k * 0.045);
          g.gain.setValueAtTime(0.0001, t + k * 0.045);
          g.gain.linearRampToValueAtTime(0.16, t + k * 0.045 + 0.015);
          g.gain.exponentialRampToValueAtTime(0.0005, t + k * 0.045 + 0.42);
          o.connect(g).connect(out);
          o.start(t + k * 0.045); o.stop(t + k * 0.045 + 0.45);
        });
        [0.18, 0.34].forEach((off, idx) => {
          const o = c.createOscillator(), bp = c.createBiquadFilter(), g = c.createGain();
          o.type = 'sawtooth';
          const base = idx === 0 ? 410 : 460;
          o.frequency.setValueAtTime(base, t + off);
          o.frequency.exponentialRampToValueAtTime(base * 1.65, t + off + 0.055);
          o.frequency.exponentialRampToValueAtTime(base * 0.92, t + off + 0.11);
          bp.type = 'bandpass'; bp.frequency.value = 1150; bp.Q.value = 2.4;
          g.gain.setValueAtTime(0.0001, t + off);
          g.gain.linearRampToValueAtTime(0.18, t + off + 0.018);
          g.gain.exponentialRampToValueAtTime(0.0006, t + off + 0.12);
          o.connect(bp).connect(g).connect(out);
          o.start(t + off); o.stop(t + off + 0.13);
        });
        return;
      }

      if (kind === 'pawTap') {
        // Cute wooden kalimba / paw-pad boop
        const notes = [587.33, 659.25, 783.99, 880, 987.77, 1046.5];
        const f = notes[step % notes.length];
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(f * 0.85, t);
        o.frequency.exponentialRampToValueAtTime(f, t + 0.035);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.17, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0005, t + 0.28);
        o.connect(g).connect(out);
        o.start(t); o.stop(t + 0.3);
        return;
      }

      if (kind === 'kakaoDone') {
        // Cheerful ascending bell sparkle when Kakao finishes hacking
        [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((hz, k) => {
          const o = c.createOscillator(), g = c.createGain();
          o.type = k % 2 === 0 ? 'sine' : 'triangle';
          o.frequency.setValueAtTime(hz, t + k * 0.055);
          g.gain.setValueAtTime(0.0001, t + k * 0.055);
          g.gain.linearRampToValueAtTime(0.15, t + k * 0.055 + 0.012);
          g.gain.exponentialRampToValueAtTime(0.0004, t + k * 0.055 + 0.65);
          o.connect(g).connect(out);
          o.start(t + k * 0.055); o.stop(t + k * 0.055 + 0.7);
        });
        return;
      }

      if (kind === 'keyDrop') {
        // Warm brass key clink + ascending chime
        const notes = [440, 554.37, 659.25, 880];
        const f = notes[step % notes.length];
        [f, f * 2.75].forEach((hz, k) => {
          const o = c.createOscillator(), g = c.createGain();
          o.type = k === 0 ? 'sine' : 'triangle';
          o.frequency.setValueAtTime(hz, t);
          g.gain.setValueAtTime(0.0001, t);
          g.gain.linearRampToValueAtTime(k === 0 ? 0.14 : 0.05, t + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0004, t + (k === 0 ? 0.9 : 0.25));
          o.connect(g).connect(out);
          o.start(t); o.stop(t + 0.95);
        });
      }
    }
  }

  /* ---------------- Engine ---------------- */
  class Fireworks {
    constructor(canvas, opts = {}) {
      this.c = canvas;
      this.g = canvas.getContext('2d');
      this.dprCap = opts.dprCap || 1.5;
      this.parts = [];
      this.rockets = [];
      this.flashes = [];
      this.shockwaves = [];
      this.sound = new Sound();
      this.running = false;
      this.idleFrames = 0;
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }
    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, this.dprCap);
      this.W = window.innerWidth; this.H = window.innerHeight;
      this.c.width = Math.round(this.W * dpr); this.c.height = Math.round(this.H * dpr);
      this.c.style.width = this.W + 'px'; this.c.style.height = this.H + 'px';
      this.g.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.S = Math.min(this.W, this.H) / 900;
    }
    wake() {
      if (this.running) return;
      this.running = true; this.idleFrames = 0; this.last = performance.now();
      requestAnimationFrame((t) => this.frame(t));
    }
    pan(x) { return (x / this.W) * 2 - 1; }
    colors(palette) {
      if (Array.isArray(palette)) return palette;
      if (palette && PALETTES[palette]) return PALETTES[palette];
      const m = pick(MIXES);
      return [...PALETTES[m[0]], ...PALETTES[m[1]]];
    }

    /* ---- public API ---- */
    launch({ x, y, type = 'peony', palette, dur = 1.1, x0, size = 1, delay = 0, onArrive }) {
      const go = () => {
        const sx = x0 !== undefined ? x0 : x + rand(-0.08, 0.08) * this.W;
        this.rockets.push({
          x0: sx, y0: this.H + 12, x1: x, y1: y, t0: performance.now(), dur: dur * 1000,
          type, palette, size, onArrive, x: sx, y: this.H + 12,
        });
        this.sound.launch(this.pan(sx));
        this.wake();
      };
      delay > 0 ? setTimeout(go, delay * 1000) : go();
    }
    streak({ x0, y0, x, y, dur = 0.8, palette = 'gold', delay = 0 }) {
      const go = () => {
        this.rockets.push({ x0, y0, x1: x, y1: y, t0: performance.now(), dur: dur * 1000, type: 'none', palette, size: 0.6, x: x0, y: y0, streak: true });
        this.wake();
      };
      delay > 0 ? setTimeout(go, delay * 1000) : go();
    }
    flash({ x, y, r = 220, life = 0.45, color = '#fff3dc' }) {
      this.flashes.push({ x, y, r: r * this.S, t0: performance.now(), life: life * 1000, color });
      this.wake();
    }
    burst({ x, y, type = 'peony', palette, size = 1, sound = true }) {
      const cols = this.colors(palette);
      const S = this.S * size;
      const fn = this['_' + type] || this._peony;
      fn.call(this, x, y, cols, S);
      if (type !== 'none') {
        this.flash({ x, y, r: 165 * size, life: 0.36 });
        if (['heart', 'doubleHeart', 'brocade', 'palm', 'peony'].includes(type)) {
          this.shockwaves.push({
            x, y,
            rMax: 240 * S,
            t0: performance.now(),
            life: 520,
            color: palette === 'rose' || type.toLowerCase().includes('heart') ? '#ff9bb4' : '#ffd79a',
          });
        }
      }
      if (sound && type !== 'none') {
        this.sound.boom(Math.min(1.35, 0.7 + size * 0.45), this.pan(x), rand(0.01, 0.08));
        if (type === 'glitter' || type === 'willow' || type === 'palm' || type === 'brocade') {
          this.sound.crackle(type === 'glitter' ? 75 : 38, 1.5, this.pan(x));
        }
      }
      this.wake();
    }
    salvo({ count = 7, type = 'willow', palette = 'gold', y = 0.28, spread = 0.8, dur = 1.2 }) {
      for (let i = 0; i < count; i++) {
        const f = count === 1 ? 0.5 : i / (count - 1);
        const x = this.W * (0.5 + (f - 0.5) * spread);
        this.launch({ x, y: this.H * (y + rand(-0.04, 0.05)), type, palette, dur: dur + rand(-0.1, 0.1), x0: this.W * 0.5 + (f - 0.5) * this.W * 0.2, delay: i * 0.06 });
      }
    }
    sweep({ count = 7, dir = 1, type = 'brocade', palette = 'gold', y = 0.26, dur = 0.85, size = 1.15 } = {}) {
      for (let i = 0; i < count; i++) {
        const f = count === 1 ? 0.5 : (dir > 0 ? i : count - 1 - i) / (count - 1);
        const x = this.W * (0.1 + f * 0.8);
        this.launch({
          x,
          y: this.H * (y + rand(-0.04, 0.05)),
          type,
          palette,
          size,
          dur: dur + rand(-0.06, 0.06),
          x0: this.W * (0.5 + (f - 0.5) * 0.45),
          delay: i * 0.09,
        });
      }
    }
    finale({ dur = 18 } = {}) {
      const types = ['peony', 'chrys', 'ring', 'crossette', 'palm', 'heart', 'doubleHeart', 'glitter', 'willow', 'brocade'];
      let t = 0;
      while (t < dur - 3.5) {
        const p = t / dur;
        const gap = 0.46 - p * 0.30;
        this.launch({
          x: this.W * rand(0.10, 0.90), y: this.H * rand(0.12, 0.44),
          type: pick(types), dur: rand(0.8, 1.15), size: rand(1.0, 1.45), delay: t,
        });
        if (p > 0.3 && Math.random() < 0.65) {
          this.launch({ x: this.W * rand(0.14, 0.86), y: this.H * rand(0.14, 0.40), type: pick(types), size: rand(0.95, 1.3), dur: rand(0.85, 1.15), delay: t + 0.1 });
        }
        t += gap;
      }
      setTimeout(() => this.sweep({ count: 7, dir: 1, type: 'brocade', palette: 'gold', y: 0.24, dur: 0.85 }), Math.max(0, (dur - 6.2) * 1000));
      setTimeout(() => this.sweep({ count: 7, dir: -1, type: 'peony', palette: 'rose', y: 0.28, dur: 0.85 }), Math.max(0, (dur - 4.8) * 1000));

      const end = dur - 3.2;
      for (let i = 0; i < 11; i++) {
        this.launch({ x: this.W * (0.06 + i * 0.088), y: this.H * rand(0.13, 0.24), type: i % 2 === 0 ? 'brocade' : 'willow', palette: 'gold', size: 1.35, dur: 1.05, delay: end + i * 0.05 });
      }
      this.launch({ x: this.W * 0.5, y: this.H * 0.30, type: 'doubleHeart', palette: 'rose', size: 1.75, dur: 1.1, delay: end + 0.65 });
      this.launch({ x: this.W * 0.25, y: this.H * 0.24, type: 'glitter', palette: 'white', size: 1.35, dur: 1.0, delay: end + 0.85 });
      this.launch({ x: this.W * 0.75, y: this.H * 0.24, type: 'glitter', palette: 'white', size: 1.35, dur: 1.0, delay: end + 0.9 });
    }
    clear() { this.parts.length = 0; this.rockets.length = 0; this.flashes.length = 0; this.shockwaves.length = 0; }

    /* ---- particle factory ---- */
    _p(x, y, vx, vy, o) {
      if (this.parts.length > 1600) return null;
      const p = {
        x, y, vx, vy, age: 0,
        life: o.life || 80, color: o.color, size: o.size || 3,
        drag: o.drag || 0.955, grav: o.grav !== undefined ? o.grav : 0.06,
        trail: !!o.trail, flicker: o.flicker || 0,
        strobe: !!o.strobe, glitter: o.glitter || 0, onDeath: o.onDeath || null,
      };
      this.parts.push(p);
      return p;
    }
    _sphere(n, speed, fn) {
      for (let i = 0; i < n; i++) {
        const u = Math.random() * 2 - 1, th = Math.random() * TAU, r = Math.sqrt(1 - u * u);
        const s = speed * rand(0.9, 1.04);
        fn(Math.cos(th) * r * s, Math.sin(th) * r * s, i);
      }
    }
    _peony(x, y, cols, S) {
      this._sphere(160, 8.2 * S, (vx, vy) => this._p(x, y, vx, vy, { color: pick(cols), life: rand(75, 105), size: 3.6 * S + 1, grav: 0.07 * S, flicker: 0.4 }));
    }
    _chrys(x, y, cols, S) {
      const c = pick(cols);
      this._sphere(140, 7.8 * S, (vx, vy) => this._p(x, y, vx, vy, { color: c, life: rand(80, 110), size: 2.9 * S + 1, grav: 0.06 * S, trail: true, flicker: 0.3 }));
    }
    _willow(x, y, cols, S) {
      this._sphere(115, 5.8 * S, (vx, vy) => this._p(x, y, vx, vy, { color: pick(PALETTES.gold), life: rand(155, 210), size: 2.8 * S + 1, drag: 0.968, grav: 0.034 * S, trail: true, glitter: 0.09 }));
    }
    _brocade(x, y, cols, S) {
      this._sphere(140, 6.9 * S, (vx, vy) => this._p(x, y, vx, vy, { color: pick(PALETTES.gold), life: rand(120, 165), size: 3.0 * S + 1, drag: 0.958, grav: 0.048 * S, trail: true, glitter: 0.14 }));
      this._sphere(45, 3.2 * S, (vx, vy) => this._p(x, y, vx, vy, { color: '#fffaf0', life: rand(70, 100), size: 2.2 * S + 1, grav: 0.03 * S, strobe: true }));
    }
    _ring(x, y, cols, S) {
      const n = 96, tilt = rand(0.3, 1), rot = rand(0, TAU), c = pick(cols), sp = 7.4 * S;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU;
        let vx = Math.cos(a) * sp, vy = Math.sin(a) * sp * tilt;
        const rx = vx * Math.cos(rot) - vy * Math.sin(rot), ry = vx * Math.sin(rot) + vy * Math.cos(rot);
        this._p(x, y, rx, ry, { color: c, life: rand(85, 105), size: 3.4 * S + 1, grav: 0.05 * S, flicker: 0.5 });
      }
      this._sphere(36, 2.4 * S, (vx, vy) => this._p(x, y, vx, vy, { color: '#fff4dc', life: 55, size: 2.6 * S + 1, grav: 0.04 * S }));
    }
    _heart(x, y, cols, S) {
      const n = 130, c = pick(PALETTES.rose), sp = 0.52 * S;
      for (let i = 0; i < n; i++) {
        const t = (i / n) * TAU;
        const hx = 16 * Math.pow(Math.sin(t), 3);
        const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        this._p(x, y, hx * sp, hy * sp, { color: i % 5 === 0 ? '#ffffff' : c, life: rand(90, 110), size: 3.6 * S + 1, drag: 0.955, grav: 0.024 * S, flicker: 0.4 });
      }
    }
    _doubleHeart(x, y, cols, S) {
      const n = 110;
      for (let i = 0; i < n; i++) {
        const t = (i / n) * TAU;
        const hx = 16 * Math.pow(Math.sin(t), 3);
        const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        this._p(x, y, hx * 0.36 * S, hy * 0.36 * S, { color: i % 4 === 0 ? '#ffffff' : '#ff6b93', life: rand(85, 105), size: 3.4 * S + 1, drag: 0.955, grav: 0.022 * S, flicker: 0.35 });
        this._p(x, y, hx * 0.62 * S, hy * 0.62 * S, { color: i % 5 === 0 ? '#fff6e0' : '#ffd79a', life: rand(95, 115), size: 3.2 * S + 1, drag: 0.956, grav: 0.024 * S, trail: true });
      }
    }
    _crossette(x, y, cols, S) {
      const n = 16, c = pick(cols);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + rand(-0.1, 0.1), sp = 6.8 * S;
        this._p(x, y, Math.cos(a) * sp, Math.sin(a) * sp, {
          color: c, life: 42, size: 3.9 * S + 1, grav: 0.05 * S, trail: true,
          onDeath: (p) => {
            for (let k = 0; k < 4; k++) {
              const b = a + Math.PI / 4 + (k * Math.PI) / 2, s2 = 3.6 * S;
              this._p(p.x, p.y, p.vx * 0.3 + Math.cos(b) * s2, p.vy * 0.3 + Math.sin(b) * s2, { color: '#fff1d6', life: rand(44, 60), size: 2.8 * S + 1, grav: 0.06 * S, trail: true });
            }
          },
        });
      }
    }
    _palm(x, y, cols, S) {
      const n = 12;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + rand(-0.15, 0.15), sp = 8.6 * S;
        this._p(x, y, Math.cos(a) * sp, Math.sin(a) * sp - 1.4 * S, { color: pick(PALETTES.gold), life: rand(105, 138), size: 5.4 * S + 1.5, drag: 0.955, grav: 0.055 * S, trail: true, glitter: 0.28 });
      }
    }
    _glitter(x, y, cols, S) {
      this._sphere(210, 6.8 * S, (vx, vy) => {
        const k = Math.random();
        this._p(x, y, vx * k, vy * k, { color: pick(PALETTES.white), life: rand(95, 135), size: 2.5 * S + 1, grav: 0.04 * S, strobe: true });
      });
    }
    _none() {}

    /* ---- loop ---- */
    frame(now) {
      const dt = Math.min(2.5, (now - this.last) / 16.667);
      this.last = now;
      const g = this.g, W = this.W, H = this.H;

      g.globalCompositeOperation = 'destination-out';
      g.fillStyle = 'rgba(0,0,0,0.26)';
      g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = 'lighter';

      // flashes
      for (let i = this.flashes.length - 1; i >= 0; i--) {
        const f = this.flashes[i], k = Math.max(0, (now - f.t0) / f.life);
        if (k >= 1) { this.flashes.splice(i, 1); continue; }
        const a = (1 - k) * (1 - k);
        const rad = Math.max(1, f.r * (0.6 + k * 0.6));
        const grd = g.createRadialGradient(f.x, f.y, 0, f.x, f.y, rad);
        grd.addColorStop(0, hexA(f.color, 0.55 * a));
        grd.addColorStop(1, hexA(f.color, 0));
        g.fillStyle = grd;
        g.fillRect(f.x - f.r * 1.3, f.y - f.r * 1.3, f.r * 2.6, f.r * 2.6);
      }

      // shockwaves
      for (let i = this.shockwaves.length - 1; i >= 0; i--) {
        const sw = this.shockwaves[i], k = Math.max(0, (now - sw.t0) / sw.life);
        if (k >= 1) { this.shockwaves.splice(i, 1); continue; }
        const e = 1 - Math.pow(1 - k, 3);
        const rad = 12 + sw.rMax * e;
        g.strokeStyle = hexA(sw.color, (1 - k) * 0.65);
        g.lineWidth = Math.max(0.8, 3.2 * (1 - k));
        g.beginPath();
        g.arc(sw.x, sw.y, rad, 0, TAU);
        g.stroke();
      }

      // rockets
      for (let i = this.rockets.length - 1; i >= 0; i--) {
        const r = this.rockets[i];
        const k = Math.max(0, Math.min(1, (now - r.t0) / r.dur));
        const e = r.streak ? k * k * (0.35 + 0.65 * k) : 1 - Math.pow(1 - k, 2.2);
        const px = r.x, py = r.y;
        r.x = r.x0 + (r.x1 - r.x0) * e;
        r.y = r.y0 + (r.y1 - r.y0) * e;
        const col = r.streak ? '#ffe2ad' : '#ffe9c4';
        g.strokeStyle = hexA(col, 0.9);
        g.lineWidth = r.streak ? 3.0 : 1.6;
        g.beginPath(); g.moveTo(px, py); g.lineTo(r.x, r.y); g.stroke();
        const sp = sprite(col), s = (r.streak ? 28 : 16) * this.S + 6;
        g.drawImage(sp, r.x - s / 2, r.y - s / 2, s, s);
        if (Math.random() < 0.9 * dt) {
          this._p(r.x, r.y, rand(-0.5, 0.5), rand(0, 1.2), { color: '#f6c46f', life: rand(18, 34), size: 1.8, grav: 0.03, drag: 0.92 });
        }
        if (k >= 1) {
          this.rockets.splice(i, 1);
          if (r.type !== 'none') this.burst({ x: r.x1, y: r.y1, type: r.type, palette: r.palette, size: r.size });
          if (r.onArrive) r.onArrive();
        }
      }

      // particles
      for (let i = this.parts.length - 1; i >= 0; i--) {
        const p = this.parts[i];
        p.age += dt;
        if (p.age >= p.life) {
          if (p.onDeath) p.onDeath(p);
          const last = this.parts.length - 1;
          if (i !== last) this.parts[i] = this.parts[last];
          this.parts.pop();
          continue;
        }
        const ox = p.x, oy = p.y;
        const d = Math.pow(p.drag, dt);
        p.vx *= d; p.vy = p.vy * d + p.grav * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;

        const lifeK = p.age / p.life;
        let a = lifeK < 0.7 ? 1 : 1 - (lifeK - 0.7) / 0.3;
        if (p.flicker && lifeK > 0.55 && Math.random() < p.flicker) a *= 0.25;
        if (p.strobe) a *= Math.random() < 0.45 ? 1 : 0.08;

        if (p.trail) {
          g.strokeStyle = hexA(p.color, 0.55 * a);
          g.lineWidth = Math.max(1, p.size * 0.45);
          g.beginPath(); g.moveTo(ox, oy); g.lineTo(p.x, p.y); g.stroke();
        }
        if (p.glitter && Math.random() < p.glitter * dt) {
          this._p(p.x, p.y, rand(-0.3, 0.3), rand(0.2, 0.8), { color: '#fff6e0', life: rand(14, 26), size: 1.6, grav: 0.02, strobe: true });
        }
        const s = p.size * 4.2 * (0.6 + 0.4 * a);
        g.globalAlpha = a;
        g.drawImage(sprite(p.color), p.x - s / 2, p.y - s / 2, s, s);
        g.globalAlpha = 1;
      }

      const active = this.parts.length || this.rockets.length || this.flashes.length || this.shockwaves.length;
      if (!active) {
        if (++this.idleFrames > 24) {
          g.globalCompositeOperation = 'source-over';
          g.clearRect(0, 0, W, H);
          this.running = false;
          return;
        }
      } else this.idleFrames = 0;
      requestAnimationFrame((t) => this.frame(t));
    }

    /* ---- command dispatcher (dùng cho native host / postMessage) ---- */
    cmd(o) {
      const W = this.W, H = this.H;
      const px = (v) => (v <= 1.5 ? v * W : v);
      const py = (v) => (v <= 1.5 ? v * H : v);
      switch (o.t) {
        case 'launch': return this.launch({ ...o, x: px(o.x), y: py(o.y), x0: o.x0 !== undefined ? px(o.x0) : undefined });
        case 'burst': return this.burst({ ...o, x: px(o.x), y: py(o.y) });
        case 'flash': return this.flash({ ...o, x: px(o.x), y: py(o.y) });
        case 'streak': return this.streak({ ...o, x0: px(o.x0), y0: py(o.y0), x: px(o.x), y: py(o.y) });
        case 'salvo': return this.salvo(o);
        case 'sweep': return this.sweep(o);
        case 'finale': return this.finale(o);
        case 'sfx': return this.sound.sfx(o.kind, { pan: o.x !== undefined ? this.pan(px(o.x)) : 0, step: o.step || 0 });
        case 'clear': return this.clear();
        case 'resume': return this.sound.resume();
        case 'volume': if (this.sound.ensure()) this.sound.master.gain.value = o.v; return;
      }
    }
  }

  window.Fireworks = Fireworks;
})();
