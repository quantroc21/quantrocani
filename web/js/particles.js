/* =====================================================================
   PARTICLE MORPH ENGINE — three.js
   16k hạt 3D biến hình mượt giữa các hình khối & ghép thành ảnh thật có màu
   ===================================================================== */
(function () {
  const N = 12000;
  const TAU = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

  const VERT = /* glsl */ `
    attribute vec3 aFrom;
    attribute vec3 aTo;
    attribute vec3 aColFrom;
    attribute vec3 aColTo;
    attribute float aRand;
    attribute float aSize;
    uniform float uProgress, uTime, uPixel, uScatter, uWave, uFlow, uTanHalf, uAspect, uMouseK, uUsePhotoCol;
    uniform vec2 uMouse;
    varying float vRand;
    varying float vFade;
    varying vec3 vPhotoCol;

    float ease(float t) { return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0; }

    void main() {
      float d = aRand * 0.35;
      float t = ease(clamp((uProgress - d) / 0.65, 0.0, 1.0));
      vec3 p = mix(aFrom, aTo, t);
      float mid = sin(3.14159265 * t);

      // swirl during transition + idle shimmer
      float ph = aRand * 61.0;
      vec3 swirl = vec3(
        sin(uTime * 0.7 + ph + p.y * 1.7),
        cos(uTime * 0.6 + ph * 1.3 + p.x * 1.3),
        sin(uTime * 0.5 + ph * 0.7 + p.z));
      float idleAmp = mix(0.018, 0.004, uUsePhotoCol);
      p += swirl * (idleAmp + mid * 0.85 * uScatter);

      // ocean waves
      p.y += uWave * (sin(p.x * 0.9 + uTime * 1.1) * 0.22 + cos(p.z * 1.3 + uTime * 0.8) * 0.16);

      // road flow
      float zz = mod(p.z + 40.0 + uTime * 5.0, 46.0) - 40.0;
      p.z = mix(p.z, zz, uFlow);

      vec4 mv = modelViewMatrix * vec4(p, 1.0);

      // cursor repel (view space)
      float depth = -mv.z;
      vec2 m = vec2(uMouse.x * uTanHalf * uAspect * depth, uMouse.y * uTanHalf * depth);
      vec2 dv = mv.xy - m;
      float dist = length(dv);
      float r = 0.9;
      mv.xy += normalize(dv + 1e-5) * max(0.0, r - dist) * 0.55 * uMouseK;

      gl_Position = projectionMatrix * mv;
      float ptSize = mix(aSize, 2.55, uUsePhotoCol);
      gl_PointSize = ptSize * uPixel * (1.0 + mid * 0.8) / depth;
      vRand = aRand;
      vFade = smoothstep(46.0, 18.0, depth);
      vPhotoCol = mix(aColFrom, aColTo, t);
    }
  `;

  const FRAG = /* glsl */ `
    uniform vec3 uColA;
    uniform vec3 uColB;
    uniform float uOpacity;
    uniform float uUsePhotoCol;
    varying float vRand;
    varying float vFade;
    varying vec3 vPhotoCol;
    void main() {
      vec2 c = gl_PointCoord - 0.5;
      float d = length(c);
      float edge = mix(0.5, 0.52, uUsePhotoCol);
      float a = smoothstep(edge, 0.0, d);
      a = mix(a * a, pow(a, 1.35), uUsePhotoCol);
      vec3 geomCol = mix(uColA, uColB, smoothstep(0.15, 0.95, vRand));
      geomCol += vec3(1.0) * smoothstep(0.18, 0.0, d) * 0.35;
      vec3 photoCol = vPhotoCol * 0.88 + vec3(0.06, 0.04, 0.03);
      vec3 col = mix(geomCol, photoCol, uUsePhotoCol);
      float shimmer = mix(0.55 + 0.45 * fract(vRand * 7.31), 0.92, uUsePhotoCol);
      gl_FragColor = vec4(col, a * uOpacity * vFade * shimmer);
    }
  `;

  /* ---------------- shape helpers ---------------- */
  function sphereDir() {
    const u = Math.random() * 2 - 1, th = Math.random() * TAU, r = Math.sqrt(1 - u * u);
    return [r * Math.cos(th), u, r * Math.sin(th)];
  }
  function fill(fn) {
    const a = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const p = fn(i, i / N);
      a[i * 3] = p[0]; a[i * 3 + 1] = p[1]; a[i * 3 + 2] = p[2];
    }
    return a;
  }
  function sampleText(str, { height = 4, weight = 300, italic = true, family = 'Georgia, serif' } = {}) {
    const ch = 520, fs = 440;
    const c = document.createElement('canvas');
    const g = c.getContext('2d');
    const font = `${italic ? 'italic ' : ''}${weight} ${fs}px ${family}`;
    g.font = font;
    const w = Math.ceil(g.measureText(str).width + 80);
    c.width = w; c.height = ch;
    g.font = font; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(str, w / 2, ch / 2 + fs * 0.04);
    const data = g.getImageData(0, 0, w, ch).data;
    const pts = [];
    for (let y = 0; y < ch; y += 2) for (let x = 0; x < w; x += 2) if (data[(y * w + x) * 4 + 3] > 140) pts.push(x, y);
    const n = pts.length / 2;
    const k = height / ch;
    return fill(() => {
      const j = (Math.random() * n) | 0;
      return [(pts[j * 2] - w / 2 + rand(-1, 1)) * k, -(pts[j * 2 + 1] - ch / 2 + rand(-1, 1)) * k, gauss() * 0.12];
    });
  }
  function latlon(lat, lon, r) {
    const la = (lat * Math.PI) / 180, lo = (lon * Math.PI) / 180;
    return [r * Math.cos(la) * Math.sin(lo), r * Math.sin(la), r * Math.cos(la) * Math.cos(lo)];
  }

  const SHAPES = {
    dust: () => ({ pos: fill(() => { const d = sphereDir(); const r = 2 + Math.pow(Math.random(), 0.6) * 9; return [d[0] * r * 1.3, d[1] * r * 0.8, d[2] * r * 0.6 - 2]; }), rot: [0, 0, 0], spin: [0, 0.02] }),
    point: () => ({ pos: fill(() => { const d = sphereDir(); const r = Math.random() * 0.06; return [d[0] * r, d[1] * r, d[2] * r]; }), rot: [0, 0, 0], spin: [0, 0] }),
    explode: () => ({ pos: fill(() => { const d = sphereDir(); const r = rand(7, 16); return [d[0] * r, d[1] * r, d[2] * r]; }), rot: [0, 0, 0], spin: [0, 0] }),
    four: () => ({ pos: sampleText('4', { height: 5.2, weight: 300 }), rot: [0, 0, 0], spin: [0, 0] }),
    twenty: () => ({ pos: sampleText('20', { height: 3.6, weight: 300 }), rot: [0, -0.25, 0], spin: [0, 0] }),
    pair: () => ({
      pos: fill((i, f) => {
        if (f < 0.92) { const s = f < 0.46 ? -1 : 1; const d = sphereDir(); const r = 0.72 * Math.cbrt(rand(0.35, 1)); return [s * 0.82 + d[0] * r, d[1] * r, d[2] * r]; }
        const t = Math.random(); return [-0.82 + t * 1.64, Math.sin(t * Math.PI) * 0.06 + gauss() * 0.03, gauss() * 0.03];
      }), rot: [0, 0, 0], spin: [0, 0.15],
    }),
    apart: () => ({
      pos: fill((i, f) => {
        if (f < 0.94) { const s = f < 0.47 ? -1 : 1; const d = sphereDir(); const r = 0.62 * Math.cbrt(rand(0.35, 1)); return [s * 3.0 + d[0] * r, d[1] * r - 0.2, d[2] * r]; }
        const t = Math.random(); return [-3 + t * 6, gauss() * 0.5, gauss() * 0.5];
      }), rot: [0, 0, 0], spin: [0, 0],
    }),
    helix: () => ({
      pos: fill((i, f) => {
        const t = Math.random();
        const y = (t - 0.5) * 5.4, a = t * TAU * 2.4;
        if (f < 0.84) { const s = f < 0.42 ? 0 : Math.PI; const r = 0.95; return [Math.cos(a + s) * r + gauss() * 0.05, y + gauss() * 0.05, Math.sin(a + s) * r + gauss() * 0.05]; }
        const k = Math.floor(t * 26) / 26, a2 = k * TAU * 2.4, y2 = (k - 0.5) * 5.4, u = rand(-1, 1) * 0.95;
        return [Math.cos(a2) * u, y2 + gauss() * 0.02, Math.sin(a2) * u];
      }), rot: [0.15, 0, -0.35], spin: [0, 0.35],
    }),
    curve: () => ({
      pos: fill((i, f) => {
        const ex = (x) => 0.1 * Math.exp(1.2 * (x + 2.4)) - 1.75;
        if (f < 0.62) { const x = rand(-2.4, 1.75); return [x + gauss() * 0.03, ex(x) + gauss() * 0.04, gauss() * 0.06]; }
        if (f < 0.86) { const x = rand(-2.4, 1.75); const y = rand(-1.75, ex(x)); return [x, y, gauss() * 0.05]; }
        if (f < 0.93) return [rand(-2.5, 2.1), -1.8 + gauss() * 0.01, 0];
        return [-2.5 + gauss() * 0.01, rand(-1.8, 2.3), 0];
      }), rot: [0, 0.18, 0], spin: [0, 0],
    }),
    wave: () => ({ pos: fill(() => [rand(-7, 7), -1.45 + gauss() * 0.02, rand(-9, 3)]), rot: [0.08, 0, 0], spin: [0, 0], wave: 1 }),
    globe: () => {
      const A = latlon(10.8, 106.7, 1), B = latlon(34.0, -118.2, 1);
      const om = Math.acos(A[0] * B[0] + A[1] * B[1] + A[2] * B[2]);
      const slerp = (t) => { const s = Math.sin(om); const a = Math.sin((1 - t) * om) / s, b = Math.sin(t * om) / s; return [A[0] * a + B[0] * b, A[1] * a + B[1] * b, A[2] * a + B[2] * b]; };
      const R = 1.8, gold = Math.PI * (3 - Math.sqrt(5));
      return {
        pos: fill((i, f) => {
          if (f < 0.72) { const k = i / (N * 0.72); const y = 1 - k * 2, r = Math.sqrt(1 - y * y), th = gold * i; return [Math.cos(th) * r * R, y * R, Math.sin(th) * r * R]; }
          if (f < 0.92) { const t = Math.random(); const p = slerp(t); const h = R * (1 + 0.38 * Math.sin(Math.PI * t)); return [p[0] * h + gauss() * 0.015, p[1] * h + gauss() * 0.015, p[2] * h + gauss() * 0.015]; }
          const P = f < 0.96 ? A : B; const d = sphereDir(); const r = Math.random() * 0.09; return [P[0] * R + d[0] * r, P[1] * R + d[1] * r, P[2] * R + d[2] * r];
        }),
        rot: [0.35, -3.04, 0], spin: [0, 0.06],
      };
    },
    road: () => ({
      pos: fill((i, f) => {
        if (f < 0.56) { const s = f < 0.28 ? -1 : 1; return [s * 1.5 + gauss() * 0.03, -1.55 + gauss() * 0.02, rand(-40, 6)]; }
        if (f < 0.7) { const z = rand(-40, 6); const seg = ((z % 2) + 2) % 2; return [gauss() * 0.02, -1.55, seg < 1 ? z : z - 1]; }
        return [rand(-22, 22), rand(-0.6, 9), rand(-40, -18)];
      }), rot: [0, 0, 0], spin: [0, 0], flow: 1,
    }),
    ring: () => ({
      pos: fill((i, f) => {
        if (f < 0.82) { const u = Math.random() * TAU, v = Math.random() * TAU, R = 1.25, r = 0.1; return [(R + r * Math.cos(v)) * Math.cos(u), (R + r * Math.cos(v)) * Math.sin(u), r * Math.sin(v)]; }
        let p; do { p = [rand(-1, 1), rand(-1, 1), rand(-1, 1)]; } while (Math.abs(p[0]) + Math.abs(p[1] * 0.8) + Math.abs(p[2]) > 1);
        return [p[0] * 0.3, 1.25 + 0.3 + p[1] * 0.34, p[2] * 0.3];
      }), rot: [0.55, 0, 0], spin: [0, 0.45],
    }),
    sun: () => ({
      pos: fill((i, f) => {
        if (f < 0.55) { let x, y; do { x = rand(-1.4, 1.4); y = rand(-0.1, 1.4); } while (x * x + y * y > 1.96 || (y < 0.75 && Math.floor(y * 9) % 2 === 1)); return [x, y + 0.05, -0.5]; }
        if (f < 0.65) return [rand(-6, 6), gauss() * 0.01, -0.5];
        const k = Math.floor(rand(1, 9)); const w = 1.5 * (1 - k * 0.08) * rand(0, 1) * (Math.random() < 0.5 ? -1 : 1);
        return [w, -k * 0.2, -0.5 + gauss() * 0.02];
      }), rot: [0, 0, 0], spin: [0, 0],
    }),
    heart: () => ({
      pos: fill(() => {
        let x, y, z, v;
        do {
          x = rand(-1.3, 1.3); y = rand(-1.3, 1.3); z = rand(-1.3, 1.3);
          const a = x * x + (9 / 4) * y * y + z * z - 1;
          v = a * a * a - x * x * z * z * z - (9 / 80) * y * y * z * z * z;
        } while (!(v <= 0 && v > -0.035));
        return [x * 1.55, z * 1.55 + 0.15, y * 1.55];
      }), rot: [0, 0, 0], spin: [0, 0.3],
    }),
    infinity: () => ({
      pos: fill(() => {
        const t = Math.random() * TAU, a = 2.5, s = Math.sin(t), c = Math.cos(t), den = 1 + s * s;
        return [(a * c) / den + gauss() * 0.06, (a * s * c) / den + gauss() * 0.06, gauss() * 0.08];
      }), rot: [0, 0, 0], spin: [0, 0],
    }),
  };

  const PALETTE = {
    gold: [0xf3c47a, 0xfff1d6], ember: [0xff6b3d, 0xf3c47a], rose: [0xff7d9c, 0xffe2c4],
    cream: [0xe8dccb, 0xffffff], cool: [0x8fc8ff, 0xf2ece2],
  };

  class Particles {
    constructor(canvas) {
      this.canvas = canvas;
      const r = (this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance', premultipliedAlpha: false }));
      r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      r.setClearColor(0x000000, 0);
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
      this.camera.position.set(0, 0, 9);
      this.root = new THREE.Group();
      this.group = new THREE.Group();
      this.root.add(this.group);
      this.scene.add(this.root);

      const geo = new THREE.BufferGeometry();
      this.from = new Float32Array(N * 3);
      this.to = SHAPES.point().pos;
      this.from.set(this.to);
      this.colFrom = new Float32Array(N * 3);
      this.colTo = new Float32Array(N * 3);
      this.colFrom.fill(1);
      this.colTo.fill(1);

      const rnd = new Float32Array(N), size = new Float32Array(N);
      for (let i = 0; i < N; i++) { rnd[i] = Math.random(); size[i] = Math.random() < 0.06 ? rand(2.4, 3.6) : rand(0.9, 1.9); }
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
      geo.setAttribute('aFrom', new THREE.BufferAttribute(this.from, 3));
      geo.setAttribute('aTo', new THREE.BufferAttribute(this.to, 3));
      geo.setAttribute('aColFrom', new THREE.BufferAttribute(this.colFrom, 3));
      geo.setAttribute('aColTo', new THREE.BufferAttribute(this.colTo, 3));
      geo.setAttribute('aRand', new THREE.BufferAttribute(rnd, 1));
      geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
      this.geo = geo; this.rnd = rnd;

      this.u = {
        uProgress: { value: 1 }, uTime: { value: 0 }, uPixel: { value: 20 }, uScatter: { value: 1 },
        uWave: { value: 0 }, uFlow: { value: 0 }, uOpacity: { value: 0 }, uUsePhotoCol: { value: 0 },
        uTanHalf: { value: Math.tan((35 * Math.PI) / 360) }, uAspect: { value: 1 },
        uMouse: { value: new THREE.Vector2(9, 9) }, uMouseK: { value: 1 },
        uColA: { value: new THREE.Color(PALETTE.gold[0]) }, uColB: { value: new THREE.Color(PALETTE.gold[1]) },
      };
      const mat = new THREE.ShaderMaterial({
        uniforms: this.u, vertexShader: VERT, fragmentShader: FRAG,
        transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
      });
      this.points = new THREE.Points(geo, mat);
      this.points.frustumCulled = false;
      this.group.add(this.points);

      this.spin = [0, 0];
      this.cache = {};
      this.pendingMorph = null;
      this.hasPhotoColor = false;
      this.mouse = new THREE.Vector2(9, 9);
      this.mouseT = new THREE.Vector2(9, 9);
      window.addEventListener('pointermove', (e) => {
        this.mouseT.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
      });
      window.addEventListener('resize', () => this.resize());
      this.resize();
      this.clock = new THREE.Clock();
      this.running = false;
    }
    warmup() {
      // Pre-compile WebGL shader & upload initial geometry while invisible so enterStage has 0ms GPU hitch
      this.renderer.render(this.scene, this.camera);
    }
    resize() {
      const w = window.innerWidth, h = window.innerHeight;
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.u.uAspect.value = w / h;
      this.u.uPixel.value = this.renderer.getPixelRatio() * 15 * (h / 956);
    }
    start() {
      if (this.running) return;
      this.running = true;
      const loop = () => {
        if (!this.running) return;
        const dt = Math.min(0.05, this.clock.getDelta());
        this.u.uTime.value += dt;
        this.group.rotation.x += this.spin[0] * dt;
        this.group.rotation.y += this.spin[1] * dt;
        this.mouse.lerp(this.mouseT, 0.08);
        this.u.uMouse.value.copy(this.mouse);
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
    stop() { this.running = false; }

    loadPhotoShape(name, imgUrl, { width = 3.6 } = {}) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const aspect = (img.naturalWidth || 4) / (img.naturalHeight || 3);
        const rows = Math.max(80, Math.round(Math.sqrt(N / aspect)));
        const cols = Math.max(80, Math.ceil(N / rows));
        const c = document.createElement('canvas');
        c.width = cols;
        c.height = rows;
        const g = c.getContext('2d');
        g.drawImage(img, 0, 0, cols, rows);
        const data = g.getImageData(0, 0, cols, rows).data;

        const pos = new Float32Array(N * 3);
        const color = new Float32Array(N * 3);
        const height = width / aspect;
        const total = cols * rows;

        for (let i = 0; i < N; i++) {
          const idx = Math.min(total - 1, Math.floor((i / N) * total));
          const px = idx % cols;
          const py = Math.floor(idx / cols);
          const off = idx * 4;
          const r = data[off] / 255;
          const gr = data[off + 1] / 255;
          const b = data[off + 2] / 255;
          const lum = 0.299 * r + 0.587 * gr + 0.114 * b;

          pos[i * 3] = (px / (cols - 1) - 0.5) * width + rand(-0.008, 0.008);
          pos[i * 3 + 1] = -(py / (rows - 1) - 0.5) * height + rand(-0.008, 0.008);
          pos[i * 3 + 2] = (lum - 0.5) * 0.42;

          color[i * 3] = r;
          color[i * 3 + 1] = gr;
          color[i * 3 + 2] = b;
        }

        this.cache[name] = { pos, color, rot: [0, -0.08, 0], spin: [0, 0.04], isPhoto: true };
        if (this.pendingMorph && this.pendingMorph.name === name) {
          const opts = this.pendingMorph.opts;
          this.pendingMorph = null;
          this.morph(name, opts);
        }
      };
      img.src = imgUrl;
    }

    addTextShape(name, str, { height = 2.1, italic = false, weight = 400 } = {}) {
      if (this.cache[name] && this.cache[name].text === str) return;
      this.cache[name] = { pos: sampleText(str, { height, italic, weight }), rot: [0, 0, 0], spin: [0, 0], text: str };
    }

    shape(name) {
      if (!this.cache[name]) {
        if (!SHAPES[name]) return null;
        this.cache[name] = SHAPES[name]();
      }
      return this.cache[name];
    }
    prepare(names) { names.forEach((n) => this.shape(n)); }
    prepareAsync(tasks, gapMs = 160) {
      let i = 0;
      const next = () => {
        if (i >= tasks.length) return;
        const t = tasks[i++];
        if (typeof t === 'string') this.shape(t);
        else if (typeof t === 'function') t();
        setTimeout(next, gapMs);
      };
      setTimeout(next, 120);
    }

    morph(name, opts = {}) {
      const { dur = 2.6, scatter = 1, palette, offset = [0, 0], scale = 1 } = opts;
      let s = this.shape(name);
      if (!s) {
        this.pendingMorph = { name, opts };
        s = this.shape('dust');
      } else {
        this.pendingMorph = null;
      }

      const pr = this.u.uProgress.value;
      const needColor = !!(s.color || this.hasPhotoColor);
      if (pr < 1) {
        for (let i = 0; i < N; i++) {
          let t = Math.min(1, Math.max(0, (pr - this.rnd[i] * 0.35) / 0.65));
          t = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          const k = i * 3;
          this.from[k] += (this.to[k] - this.from[k]) * t;
          this.from[k + 1] += (this.to[k + 1] - this.from[k + 1]) * t;
          this.from[k + 2] += (this.to[k + 2] - this.from[k + 2]) * t;
          if (needColor) {
            this.colFrom[k] += (this.colTo[k] - this.colFrom[k]) * t;
            this.colFrom[k + 1] += (this.colTo[k + 1] - this.colFrom[k + 1]) * t;
            this.colFrom[k + 2] += (this.colTo[k + 2] - this.colFrom[k + 2]) * t;
          }
        }
      } else {
        this.from.set(this.to);
        if (needColor) this.colFrom.set(this.colTo);
      }

      this.to.set(s.pos);
      this.geo.attributes.aFrom.needsUpdate = true;
      this.geo.attributes.aTo.needsUpdate = true;

      if (needColor) {
        if (s.color) this.colTo.set(s.color);
        else this.colTo.fill(1);
        this.geo.attributes.aColFrom.needsUpdate = true;
        this.geo.attributes.aColTo.needsUpdate = true;
        this.hasPhotoColor = !!s.color;
      }

      gsap.killTweensOf(this.u.uProgress);
      this.u.uProgress.value = 0;
      this.u.uScatter.value = s.isPhoto ? 0.65 : scatter;
      gsap.to(this.u.uProgress, { value: 1, duration: dur, ease: 'none' });
      gsap.to(this.u.uUsePhotoCol, { value: s.isPhoto ? 1 : 0, duration: dur * 0.85, ease: 'sine.inOut' });
      gsap.to(this.u.uWave, { value: s.wave || 0, duration: dur * 0.8, ease: 'sine.inOut' });
      gsap.to(this.u.uFlow, { value: s.flow || 0, duration: s.flow ? dur : 0.5, delay: s.flow ? dur * 0.4 : 0, ease: 'sine.inOut' });

      const g = this.group.rotation;
      const near = (cur, target) => target + Math.round((cur - target) / TAU) * TAU;
      gsap.to(g, { x: near(g.x, s.rot[0]), y: near(g.y, s.rot[1]), z: s.rot[2], duration: dur, ease: 'power3.inOut' });
      gsap.to(this.spin, { 0: s.spin[0], 1: s.spin[1], duration: dur, ease: 'power2.inOut' });
      gsap.to(this.root.position, { x: offset[0], y: offset[1], duration: dur, ease: 'power3.inOut' });
      gsap.to(this.root.scale, { x: scale, y: scale, z: scale, duration: dur, ease: 'power3.inOut' });
      if (palette) this.colors(palette, dur);
    }
    colors(name, dur = 1.5) {
      const p = PALETTE[name] || PALETTE.gold;
      const a = new THREE.Color(p[0]), b = new THREE.Color(p[1]);
      gsap.to(this.u.uColA.value, { r: a.r, g: a.g, b: a.b, duration: dur });
      gsap.to(this.u.uColB.value, { r: b.r, g: b.g, b: b.b, duration: dur });
    }
    opacity(v, dur = 1.2) { gsap.to(this.u.uOpacity, { value: v, duration: dur, ease: 'sine.inOut' }); }
    screenOf(x, y, z = 0) {
      const v = new THREE.Vector3(x, y, z).applyMatrix4(this.root.matrixWorld).project(this.camera);
      return { x: (v.x * 0.5 + 0.5) * window.innerWidth, y: (-v.y * 0.5 + 0.5) * window.innerHeight };
    }
  }

  window.Particles = Particles;
})();
