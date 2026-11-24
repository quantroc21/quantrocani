/* =====================================================================
   KAKAO PACK & STAGE COMPANION
   - Prelude: Đàn Kakao nhiều tư thế ùa ra đòi đi công viên, lăn bụng, rượt bướm (không dùng card nhiệm vụ)
   - Stage: Bé Kakao chạy lon ton, tha dây dắt đòi đi công viên, lăn bụng, nghiêng đầu đọc thư & cho nựng khi click
   ===================================================================== */
(function () {
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  /* ---- 4 tư thế SVG vẽ riêng theo đúng màu lông thật của bé Kakao ---- */
  function svgTrot(withLeash = false) {
    return `
      <svg class="k-svg k-pose-trot" viewBox="0 0 180 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g class="k-bob">
          <!-- Đuôi ngoáy -->
          <g class="k-tail" style="transform-origin: 42px 68px">
            <path d="M44 70 C22 58, 16 40, 26 34 C34 29, 44 46, 48 64 Z" fill="#FFFBF4" stroke="#4F321C" stroke-width="2.6" stroke-linejoin="round"/>
            <path d="M38 61 C28 52, 25 43, 29 38" stroke="#D7934C" stroke-width="4.5" stroke-linecap="round"/>
          </g>
          <!-- Chân sau (cặp B) -->
          <g class="k-leg-b" style="transform-origin: 54px 92px">
            <rect x="47" y="88" width="13" height="28" rx="6.5" fill="#EDE4D5" stroke="#4F321C" stroke-width="2.4"/>
          </g>
          <!-- Chân trước (cặp A) -->
          <g class="k-leg-a" style="transform-origin: 112px 92px">
            <rect x="105" y="88" width="13" height="28" rx="6.5" fill="#EDE4D5" stroke="#4F321C" stroke-width="2.4"/>
          </g>
          <!-- Thân trắng mũm mĩm + đốm lưng vàng caramel -->
          <ellipse cx="82" cy="78" rx="44" ry="26" fill="#FFFBF4" stroke="#4F321C" stroke-width="2.6"/>
          <path d="M60 54 C78 50, 96 55, 96 70 C84 74, 66 71, 60 54 Z" fill="#D7934C"/>
          <!-- Chân sau ngoài (cặp A) -->
          <g class="k-leg-a" style="transform-origin: 62px 94px">
            <rect x="55" y="90" width="14" height="29" rx="7" fill="#FFFBF4" stroke="#4F321C" stroke-width="2.5"/>
          </g>
          <!-- Chân trước ngoài (cặp B) -->
          <g class="k-leg-b" style="transform-origin: 104px 94px">
            <rect x="97" y="90" width="14" height="29" rx="7" fill="#FFFBF4" stroke="#4F321C" stroke-width="2.5"/>
          </g>
          <!-- Đầu & Tai vàng caramel + Mõm trắng -->
          <g transform="translate(0, 0)">
            <path d="M108 42 L100 12 C99 8, 104 6, 108 10 L122 34 Z" fill="#D7934C" stroke="#4F321C" stroke-width="2.5" stroke-linejoin="round"/>
            <path d="M124 38 L134 10 C136 6, 141 8, 140 13 L136 42 Z" fill="#D7934C" stroke="#4F321C" stroke-width="2.5" stroke-linejoin="round"/>
            <path d="M126 35 L133 15 L134 37 Z" fill="#F2C2AC"/>
            <circle cx="124" cy="56" r="24" fill="#D7934C" stroke="#4F321C" stroke-width="2.6"/>
            <!-- Vệt trắng trán + mõm trắng vươn ra -->
            <path d="M126 36 C128 45, 134 48, 154 52 C161 54, 162 64, 155 69 C147 75, 132 76, 122 72 C122 60, 124 46, 126 36 Z" fill="#FFFBF4"/>
            <path d="M142 70 C152 70, 159 66, 160 58 C159 52, 151 50, 142 50" stroke="#4F321C" stroke-width="2.5" stroke-linecap="round"/>
            <!-- Má hồng + Mắt long lanh + Mũi đen -->
            <ellipse cx="132" cy="63" rx="5.5" ry="3.2" fill="#F7A9A8" opacity="0.72"/>
            <circle cx="134" cy="51" r="4.6" fill="#2A1B12"/>
            <circle cx="132.6" cy="49.4" r="1.6" fill="#FFFFFF"/>
            <ellipse cx="158" cy="55" rx="4.8" ry="3.6" fill="#2A1B12"/>
            <!-- Lưỡi hồng thè vui -->
            <path d="M144 67 Q149 77 153 68" fill="#F28593" stroke="#4F321C" stroke-width="2"/>
            ${withLeash ? `
              <!-- Vòng cổ & Dây dắt đi công viên ngậm trong miệng -->
              <path d="M106 60 Q116 74 126 74" stroke="#D84B3A" stroke-width="4.5" stroke-linecap="round"/>
              <circle cx="122" cy="75" r="3.5" fill="#F4C562" stroke="#4F321C" stroke-width="1.5"/>
              <path d="M147 66 C154 88, 140 108, 162 104 C174 102, 174 86, 163 85 C154 84, 151 96, 158 103" stroke="#D84B3A" stroke-width="4" stroke-linecap="round" fill="none"/>
            ` : ''}
          </g>
        </g>
      </svg>`;
  }

  function svgBelly() {
    return `
      <svg class="k-svg k-pose-belly" viewBox="0 0 180 135" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g class="k-rock" style="transform-origin: 90px 92px">
          <!-- Đuôi ngoáy dưới sàn -->
          <g class="k-tail" style="transform-origin: 36px 94px">
            <path d="M38 94 C18 90, 12 78, 20 72 C28 67, 38 80, 42 90 Z" fill="#FFFBF4" stroke="#4F321C" stroke-width="2.5"/>
          </g>
          <!-- Đầu nằm ngửa + 2 tai xoè -->
          <path d="M126 88 L148 108 C153 112, 148 118, 142 115 L118 100 Z" fill="#D7934C" stroke="#4F321C" stroke-width="2.5"/>
          <path d="M132 72 L158 64 C163 63, 165 69, 160 73 L136 86 Z" fill="#D7934C" stroke="#4F321C" stroke-width="2.5"/>
          <ellipse cx="128" cy="88" rx="23" ry="21" fill="#D7934C" stroke="#4F321C" stroke-width="2.6"/>
          <ellipse cx="134" cy="84" rx="16" ry="14" fill="#FFFBF4"/>
          <!-- Mắt cười tít hệt ảnh thật kakao_sleep.jpg -->
          <path d="M124 84 Q128 79 132 84" stroke="#2A1B12" stroke-width="2.6" stroke-linecap="round"/>
          <path d="M136 92 Q141 87 144 93" stroke="#2A1B12" stroke-width="2.6" stroke-linecap="round"/>
          <ellipse cx="145" cy="77" rx="4.5" ry="3.4" fill="#2A1B12"/>
          <ellipse cx="126" cy="92" rx="4.8" ry="3" fill="#F7A9A8" opacity="0.7"/>
          <!-- Bụng trắng tròn ủm hướng lên trời + bụng hồng -->
          <ellipse cx="82" cy="88" rx="44" ry="26" fill="#FFFBF4" stroke="#4F321C" stroke-width="2.6"/>
          <ellipse cx="80" cy="78" rx="24" ry="11" fill="#FCE0DF" opacity="0.8"/>
          <!-- 4 chân trắng chổng lên trời đạp phành phạch -->
          <g class="k-leg-a" style="transform-origin: 56px 68px">
            <rect x="48" y="44" width="13" height="26" rx="6.5" transform="rotate(-14 54 57)" fill="#FFFBF4" stroke="#4F321C" stroke-width="2.4"/>
          </g>
          <g class="k-leg-b" style="transform-origin: 72px 66px">
            <rect x="65" y="42" width="13" height="25" rx="6.5" transform="rotate(10 71 54)" fill="#FFFBF4" stroke="#4F321C" stroke-width="2.4"/>
          </g>
          <g class="k-leg-b" style="transform-origin: 96px 66px">
            <rect x="90" y="42" width="13" height="25" rx="6.5" transform="rotate(-8 96 54)" fill="#FFFBF4" stroke="#4F321C" stroke-width="2.4"/>
          </g>
          <g class="k-leg-a" style="transform-origin: 110px 70px">
            <rect x="104" y="46" width="13" height="25" rx="6.5" transform="rotate(16 110 58)" fill="#FFFBF4" stroke="#4F321C" stroke-width="2.4"/>
          </g>
        </g>
      </svg>`;
  }

  function svgPlayBow() {
    return `
      <svg class="k-svg k-pose-bow" viewBox="0 0 180 145" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g class="k-hop" style="transform-origin: 90px 115px">
          <!-- Đuôi chổng cao ngoáy tít -->
          <g class="k-tail" style="transform-origin: 42px 48px">
            <path d="M44 52 C26 34, 28 14, 40 12 C49 11, 52 32, 50 48 Z" fill="#FFFBF4" stroke="#4F321C" stroke-width="2.6"/>
            <path d="M41 40 C35 28, 36 20, 41 17" stroke="#D7934C" stroke-width="4.5" stroke-linecap="round"/>
          </g>
          <!-- Chân sau đứng cao -->
          <rect x="44" y="68" width="15" height="46" rx="7.5" transform="rotate(-8 51 91)" fill="#FFFBF4" stroke="#4F321C" stroke-width="2.5"/>
          <!-- Thân dốc xuống tư thế rủ đi chơi công viên -->
          <path d="M42 64 C42 44, 72 44, 96 64 C114 78, 122 92, 108 104 C92 114, 66 102, 48 82 Z" fill="#FFFBF4" stroke="#4F321C" stroke-width="2.6"/>
          <path d="M58 49 C74 48, 88 55, 90 68 C76 70, 62 63, 58 49 Z" fill="#D7934C"/>
          <!-- Hai chân trước duỗi dài phía trước -->
          <rect x="102" y="98" width="42" height="13" rx="6.5" transform="rotate(8 123 104)" fill="#FFFBF4" stroke="#4F321C" stroke-width="2.5"/>
          <rect x="108" y="105" width="42" height="13" rx="6.5" fill="#FFFBF4" stroke="#4F321C" stroke-width="2.5"/>
          <!-- Đầu ngẩng háo hức -->
          <path d="M104 64 L94 30 C93 25, 99 23, 103 27 L118 52 Z" fill="#D7934C" stroke="#4F321C" stroke-width="2.5"/>
          <path d="M126 60 L138 28 C140 23, 146 26, 144 31 L138 62 Z" fill="#D7934C" stroke="#4F321C" stroke-width="2.5"/>
          <path d="M128 56 L137 33 L136 58 Z" fill="#F2C2AC"/>
          <circle cx="122" cy="76" r="24" fill="#D7934C" stroke="#4F321C" stroke-width="2.6"/>
          <path d="M122 54 C120 66, 114 74, 110 86 C112 96, 128 101, 144 95 C156 90, 157 78, 148 73 C134 69, 126 64, 122 54 Z" fill="#FFFBF4"/>
          <circle cx="131" cy="72" r="5" fill="#2A1B12"/>
          <circle cx="129.5" cy="70.2" r="1.8" fill="#FFFFFF"/>
          <ellipse cx="126" cy="84" rx="5.5" ry="3.2" fill="#F7A9A8" opacity="0.72"/>
          <ellipse cx="152" cy="77" rx="4.8" ry="3.6" fill="#2A1B12"/>
          <path d="M136 89 Q142 100 147 89" fill="#F28593" stroke="#4F321C" stroke-width="2"/>
        </g>
      </svg>`;
  }

  function svgSit() {
    return `
      <svg class="k-svg k-pose-sit" viewBox="0 0 160 155" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Đuôi ngoáy sau lưng -->
        <g class="k-tail" style="transform-origin: 112px 124px">
          <path d="M110 126 C132 118, 142 102, 132 94 C124 88, 114 104, 108 120 Z" fill="#FFFBF4" stroke="#4F321C" stroke-width="2.5"/>
          <path d="M115 120 C126 113, 131 104, 127 99" stroke="#D7934C" stroke-width="4.2" stroke-linecap="round"/>
        </g>
        <!-- Thân ngồi ngoan -->
        <ellipse cx="80" cy="116" rx="34" ry="28" fill="#FFFBF4" stroke="#4F321C" stroke-width="2.6"/>
        <path d="M100 96 C113 102, 115 118, 106 128 C98 122, 95 108, 100 96 Z" fill="#D7934C"/>
        <rect x="58" y="114" width="14" height="30" rx="7" fill="#FFFBF4" stroke="#4F321C" stroke-width="2.5"/>
        <rect x="88" y="114" width="14" height="30" rx="7" fill="#FFFBF4" stroke="#4F321C" stroke-width="2.5"/>
        <!-- Đầu nghiêng qua lại dễ thương -->
        <g class="k-tilt" style="transform-origin: 80px 84px">
          <path d="M52 56 L36 18 C34 13, 40 10, 45 14 L70 42 Z" fill="#D7934C" stroke="#4F321C" stroke-width="2.5" stroke-linejoin="round"/>
          <path d="M53 50 L42 22 L64 42 Z" fill="#F2C2AC"/>
          <path d="M108 56 L124 18 C126 13, 120 10, 115 14 L90 42 Z" fill="#D7934C" stroke="#4F321C" stroke-width="2.5" stroke-linejoin="round"/>
          <path d="M107 50 L118 22 L96 42 Z" fill="#F2C2AC"/>
          <path d="M44 66 C44 40, 60 32, 80 32 C100 32, 116 40, 116 66 C116 88, 102 98, 80 98 C58 98, 44 88, 44 66 Z" fill="#D7934C" stroke="#4F321C" stroke-width="2.6"/>
          <!-- Vệt trắng giữa trán + mõm trắng -->
          <path d="M80 38 C77 50, 75 58, 70 67 C57 72, 50 78, 54 88 C58 96, 68 99, 80 99 C92 99, 102 96, 106 88 C110 78, 103 72, 90 67 C85 58, 83 50, 80 38 Z" fill="#FFFBF4"/>
          <ellipse cx="57" cy="78" rx="6" ry="3.5" fill="#F7A9A8" opacity="0.68"/>
          <ellipse cx="103" cy="78" rx="6" ry="3.5" fill="#F7A9A8" opacity="0.68"/>
          <circle cx="64" cy="66" r="5" fill="#2A1B12"/>
          <circle cx="62.4" cy="64.2" r="1.8" fill="#FFFFFF"/>
          <circle cx="96" cy="66" r="5" fill="#2A1B12"/>
          <circle cx="94.4" cy="64.2" r="1.8" fill="#FFFFFF"/>
          <path d="M75 86 L85 86 L85 94 C85 97, 75 97, 75 94 Z" fill="#F28593" stroke="#4F321C" stroke-width="1.9"/>
          <path d="M71 84 Q75.5 89 80 84 Q84.5 89 89 84" stroke="#4F321C" stroke-width="2.2" stroke-linecap="round" fill="none"/>
          <ellipse cx="80" cy="77" rx="6" ry="4.4" fill="#2A1B12"/>
        </g>
      </svg>`;
  }

  function renderPose(pose) {
    if (pose === 'leash') return svgTrot(true);
    if (pose === 'trot') return svgTrot(false);
    if (pose === 'belly') return svgBelly();
    if (pose === 'playbow') return svgPlayBow();
    return svgSit();
  }

  /* ---- Helper tạo DOM 1 bé Kakao ---- */
  function createDogEl({ pose = 'trot', size = 140, flip = false, text = '', photo = '' } = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'k-actor';
    wrap.style.width = size + 'px';

    const body = document.createElement('div');
    body.className = 'k-body' + (flip ? ' is-flipped' : '');
    body.innerHTML = renderPose(pose);
    wrap.appendChild(body);

    if (photo) {
      const badge = document.createElement('div');
      badge.className = 'k-photo-badge';
      const img = new Image();
      img.src = photo;
      badge.appendChild(img);
      wrap.appendChild(badge);
    }

    const bubble = document.createElement('div');
    bubble.className = 'k-bubble' + (text ? ' is-visible' : '');
    bubble.textContent = text || '';
    wrap.appendChild(bubble);

    return { wrap, body, bubble };
  }

  function popHearts(layer, xPct, yPct, count = 4) {
    for (let i = 0; i < count; i++) {
      const h = document.createElement('span');
      h.className = 'k-float-heart';
      h.textContent = i % 3 === 1 ? '🐾' : '❤️';
      h.style.left = `calc(${xPct}% + ${rand(-26, 26).toFixed(0)}px)`;
      h.style.top = `calc(${yPct}% + ${rand(-18, 8).toFixed(0)}px)`;
      h.style.animationDelay = (i * 0.09) + 's';
      layer.appendChild(h);
      setTimeout(() => h.remove(), 1400);
    }
  }

  function dropPawPrint(layer, xPct, yPct) {
    const p = document.createElement('span');
    p.className = 'k-paw-print';
    p.textContent = '🐾';
    p.style.left = xPct + '%';
    p.style.top = yPct + '%';
    layer.appendChild(p);
    setTimeout(() => p.remove(), 1700);
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
      this.compX = 16;
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

    /* ---------------- 1. PRELUDE: ĐÀN KAKAO ÙA RA QUẬY & ĐÒI ĐI CÔNG VIÊN ---------------- */
    runPrelude(cfg = {}, sendFx = () => {}) {
      this.clearAll();
      this.sendFx = sendFx;
      if (!this.layer) return;

      const lines = cfg.preludeLines || {};

      // Bé #1: Ngậm dây dắt chạy từ mép trái vào đòi đi công viên!
      this._after(0, () => {
        sendFx({ t: 'sfx', kind: 'kakaoPop', x: 0.28 });
        const a1 = createDogEl({
          pose: 'leash',
          size: 152,
          text: lines.leash || 'Gâu gâu!! Đàn Kakao chiếm máy rồi, dẫn đi công viên mới trả nha! 🌳🐾',
        });
        a1.wrap.style.left = '-14%';
        a1.wrap.style.top = '60%';
        this.layer.appendChild(a1.wrap);
        this.preludeActors.push({ ...a1, exitX: '-16%', exitY: '62%' });

        requestAnimationFrame(() => {
          a1.wrap.style.transition = 'left 1.15s cubic-bezier(.16, 1, .3, 1), top 0.6s ease, opacity 0.4s ease';
          a1.wrap.style.left = '23%';
        });
        [220, 480, 740].forEach((ms, i) => {
          this._after(ms, () => dropPawPrint(this.layer, 4 + i * 6, 68));
        });
      });

      // Bé #2: Thò đầu ngang từ mép phải màn hình ra nghiêng đầu hỏi!
      this._after(850, () => {
        sendFx({ t: 'sfx', kind: 'pawTap', x: 0.88, step: 1 });
        const a2 = createDogEl({
          pose: 'sit',
          size: 132,
          text: lines.peek || 'Ủa mở máy tính mà hổng dẫn Kakao đi công viên hả chị Khuê?!',
        });
        a2.wrap.classList.add('k-edge-right');
        a2.wrap.style.left = '106%';
        a2.wrap.style.top = '32%';
        a2.body.style.transform = 'rotate(-76deg)';
        this.layer.appendChild(a2.wrap);
        this.preludeActors.push({ ...a2, exitX: '110%', exitY: '32%' });

        requestAnimationFrame(() => {
          a2.wrap.style.transition = 'left 0.7s cubic-bezier(.18, 1.3, .32, 1), opacity 0.4s ease';
          a2.wrap.style.left = '95%';
        });
      });

      // Bé #3: Lăn đùng ngửa bụng ăn vạ góc phải dưới + ảnh thật Kakao cười tít mắt!
      this._after(1750, () => {
        sendFx({ t: 'sfx', kind: 'pawTap', x: 0.72, step: 2 });
        sendFx({ t: 'burst', x: 0.74, y: 0.74, type: 'glitter', palette: 'gold', size: 0.65 });
        const a3 = createDogEl({
          pose: 'belly',
          size: 150,
          photo: cfg.photo || 'assets/real_photos/kakao_sleep.jpg',
          text: lines.belly || 'Nằm lăn ra ăn vạ luôn! Gãi bụng 10 cái mới cho xem tiếp!',
        });
        a3.wrap.style.left = '73%';
        a3.wrap.style.top = '72%';
        a3.wrap.style.transform = 'translate(-50%, -50%) scale(0.3)';
        this.layer.appendChild(a3.wrap);
        this.preludeActors.push({ ...a3, exitX: '112%', exitY: '76%' });

        requestAnimationFrame(() => {
          a3.wrap.style.transition = 'transform 0.6s cubic-bezier(.18, 1.35, .32, 1), left 0.55s ease, opacity 0.4s ease';
          a3.wrap.style.transform = 'translate(-50%, -50%) scale(1)';
        });
      });

      // Bé #4: Chạy zoomies vèo ngang phía trên rượt bướm vàng!
      this._after(2650, () => {
        sendFx({ t: 'sfx', kind: 'pawTap', x: 0.35, step: 3 });
        const a4 = createDogEl({
          pose: 'trot',
          size: 136,
          flip: true,
          text: lines.zoom || 'Đi công viên bắt bướm thôiii gâu gâu!! 🦋',
        });
        const bf = document.createElement('span');
        bf.className = 'k-butterfly';
        bf.textContent = '🦋';
        a4.wrap.appendChild(bf);

        a4.wrap.style.left = '110%';
        a4.wrap.style.top = '23%';
        this.layer.appendChild(a4.wrap);
        this.preludeActors.push({ ...a4, exitX: '-16%', exitY: '21%' });

        requestAnimationFrame(() => {
          a4.wrap.style.transition = 'left 1.45s cubic-bezier(.16, 1, .3, 1), opacity 0.4s ease';
          a4.wrap.style.left = '25%';
        });
        [250, 520, 800].forEach((ms, i) => {
          this._after(ms, () => dropPawPrint(this.layer, 82 - i * 16, 28));
        });
      });

      // Bé #5 (Trung tâm): Nhún nhảy chổng mông phát hiện hôm nay kỷ niệm 4 năm!
      this._after(3650, () => {
        sendFx({ t: 'sfx', kind: 'kakaoPop', x: 0.5 });
        sendFx({ t: 'burst', x: 0.5, y: 0.46, type: 'heart', palette: 'rose', size: 0.95 });
        const a5 = createDogEl({
          pose: 'playbow',
          size: 168,
          text: lines.realize || 'Ủa khoan... hôm nay kỷ niệm 4 năm của anh Quân với chị Khuê hả?!',
        });
        a5.wrap.classList.add('k-hero');
        a5.wrap.style.left = '50%';
        a5.wrap.style.top = '48%';
        a5.wrap.style.transform = 'translate(-50%, -50%) scale(0.35)';
        this.layer.appendChild(a5.wrap);
        this.preludeActors.push({ ...a5, exitX: '50%', exitY: '114%', isHero: true });

        requestAnimationFrame(() => {
          a5.wrap.style.transition = 'transform 0.62s cubic-bezier(.18, 1.35, .32, 1), top 0.55s ease, opacity 0.4s ease';
          a5.wrap.style.transform = 'translate(-50%, -50%) scale(1)';
        });

        // Khúc 5.15s: Cả đàn Kakao đồng loạt bắn tim & nhường sân khấu!
        this._after(1550, () => {
          sendFx({ t: 'sfx', kind: 'kakaoDone', x: 0.5 });
          sendFx({ t: 'burst', x: 0.5, y: 0.28, type: 'doubleHeart', palette: 'rose', size: 1.15 });
          a5.bubble.textContent =
            lines.handover || 'Thôi hôm nay Kakao nhịn đi công viên 1 bữa! Nhường chỗ cho anh Quân chúc mừng chị Khuê nè ❤️';
          popHearts(this.layer, 50, 42, 5);
          popHearts(this.layer, 23, 55, 3);
          popHearts(this.layer, 73, 66, 3);
        });
      });
    }

    scatterPrelude() {
      this.preludeActors.forEach((a) => {
        a.bubble.classList.remove('is-visible');
        a.wrap.style.transition = 'left 0.55s cubic-bezier(.6, 0, .9, .4), top 0.55s cubic-bezier(.6, 0, .9, .4), opacity 0.45s ease';
        a.wrap.style.left = a.exitX;
        a.wrap.style.top = a.exitY;
        a.wrap.style.opacity = '0';
      });
      this._after(600, () => {
        if (!this.companion && this.layer) this.layer.innerHTML = '';
        this.preludeActors = [];
      });
    }

    /* ---------------- 2. TRONG LÚC ĐỌC THƯ: BÉ KAKAO CHẠY CHƠI ĐA DẠNG ---------------- */
    startStage(cfg = {}, sendFx = () => {}) {
      this.clearAll();
      this.sendFx = sendFx;
      if (!this.layer) return;

      this.stageCfg = cfg;
      this.compX = 13;

      const comp = createDogEl({
        pose: 'trot',
        size: 108,
        text: 'Đọc thư từ từ thôi nha, xong dẫn Kakao đi công viên nhaaa! 🐾',
      });
      comp.wrap.classList.add('k-companion');
      comp.wrap.style.left = '-8%';
      comp.wrap.style.bottom = '56px';
      this.layer.appendChild(comp.wrap);
      this.companion = comp;

      // Cho phép click nựng bé Kakao bất kỳ lúc nào!
      comp.wrap.addEventListener('click', (e) => {
        e.stopPropagation();
        this.petCompanion();
      });

      requestAnimationFrame(() => {
        comp.wrap.style.transition = 'left 1.8s cubic-bezier(.16, 1, .3, 1)';
        comp.wrap.style.left = this.compX + '%';
      });

      this._after(1850, () => {
        if (!this.companion) return;
        this._setCompPose('sit', false);
      });
      this._after(4600, () => {
        if (this.companion) this.companion.bubble.classList.remove('is-visible');
      });

      this._scheduleNextAntic(5600);
    }

    _setCompPose(pose, flip = false) {
      if (!this.companion) return;
      this.companion.body.className = 'k-body' + (flip ? ' is-flipped' : '');
      this.companion.body.innerHTML = renderPose(pose);
    }

    _say(text, holdMs = 3600) {
      if (!this.companion) return;
      const b = this.companion.bubble;
      b.textContent = text;
      b.classList.add('is-visible');
      this._after(holdMs, () => {
        if (this.companion && b.textContent === text) b.classList.remove('is-visible');
      });
    }

    petCompanion() {
      if (!this.companion) return;
      this.sendFx({ t: 'sfx', kind: 'kakaoPop', x: this.compX / 100 });
      this._setCompPose('playbow', this.compX > 50);
      popHearts(this.layer, this.compX, 86, 5);
      const petLines = [
        'Á chị Khuê nựng Kakao kìaaa thương quá ❤️',
        'Gâu gâu!! Thương chị Khuê với anh Quân nhất nhà!',
        'Nựng xong xíu nhớ dắt con đi công viên thiệt nha! 🌳',
        'Hihi được gãi đầu sướng quá điii 🐾',
      ];
      this._say(pick(petLines), 3600);
      this._after(2200, () => this._setCompPose('sit', this.compX > 50));
    }

    onPageChange(index, page) {
      if (!this.companion) return;
      if (page && page.finale) {
        this.pageKind = 'finale';
        this._moveCompTo(14, 'trot', () => {
          this._setCompPose('sit', false);
          this._say('Pháo hoa đẹp quá trời luôn gâu gâu!! ✨', 4200);
        });
      } else if (page && page.type === 'rooms') {
        this.pageKind = 'rooms';
        this._setCompPose('playbow', this.compX > 50);
        popHearts(this.layer, this.compX, 86, 3);
        this._say('Đi Hồ Tràm với Phuket nhớ cho Kakao đi ké nha!! 🐾', 4400);
      } else {
        this.pageKind = 'letter';
      }
    }

    _moveCompTo(targetX, walkPose = 'trot', onDone) {
      if (!this.companion) return;
      const dx = targetX - this.compX;
      const flip = dx < 0;
      const dist = Math.abs(dx);
      const durSec = Math.max(1.2, Math.min(3.4, dist * 0.045));

      this._setCompPose(walkPose, flip);
      this.companion.wrap.style.transition = `left ${durSec.toFixed(2)}s linear`;
      this.companion.wrap.style.left = targetX + '%';

      const steps = Math.min(4, Math.max(2, Math.floor(dist / 14)));
      for (let s = 1; s <= steps; s++) {
        const sx = this.compX + (dx * s) / (steps + 1);
        this._after((durSec * 1000 * s) / (steps + 1), () => {
          if (this.companion) dropPawPrint(this.layer, sx, 91);
        });
      }

      this.compX = targetX;
      this._after(durSec * 1000 + 60, () => {
        if (this.companion && onDone) onDone();
      });
    }

    _scheduleNextAntic(delayMs = 5800) {
      if (this.compTimer) clearTimeout(this.compTimer);
      this.compTimer = setTimeout(() => this._doRandomAntic(), delayMs);
    }

    _doRandomAntic() {
      if (!this.companion) return;

      const actions = ['walk_across', 'leash_park', 'belly_roll', 'chase_butterfly', 'sit_cute'];
      const pool = actions.filter((a) => a !== this.lastAction);
      const act = pick(pool);
      this.lastAction = act;

      // Chọn vị trí ở 2 bên lề trái (10..24%) hoặc phải (76..89%) để không bao giờ che tờ thư ở giữa
      const goRight = this.compX < 50;
      const destSideX = goRight ? rand(76, 88) : rand(11, 23);
      const nearbyX = this.compX < 50 ? rand(11, 24) : rand(76, 88);

      if (act === 'walk_across') {
        this._say(pick([
          'Chạy qua bên này hóng chuyện tiếp nè 🐾',
          'Lạch bạch... lạch bạch...',
          'Đi tuần tra quanh bức thư của hai anh chị!',
        ]), 2800);
        this._moveCompTo(destSideX, 'trot', () => {
          this._setCompPose('sit', this.compX > 50);
          this._scheduleNextAntic(rand(5200, 6800));
        });
      } else if (act === 'leash_park') {
        this._moveCompTo(nearbyX, 'leash', () => {
          this._setCompPose('playbow', this.compX > 50);
          this._say(pick([
            'Cầm sẵn dây dắt rồi nè, đọc xong đi công viên nhaaa! 🌳',
            'Chị Khuê ơiii bao giờ mới tới giờ đi công viên dọ?',
            'Đi công viên chạy 3 vòng rồi về ăn pate nha!',
          ]), 4000);
          this._scheduleNextAntic(rand(5800, 7400));
        });
      } else if (act === 'belly_roll') {
        this._setCompPose('belly', false);
        this._say(pick([
          'Lăn ra ngửa bụng hóng gió xíu nha hihi',
          'Click vô bụng nựng Kakao miếng điii!',
          'Êm quá nằm nghe anh Quân tâm sự tiếp nè...',
        ]), 3900);
        this._scheduleNextAntic(rand(5600, 7000));
      } else if (act === 'chase_butterfly') {
        const bf = document.createElement('span');
        bf.className = 'k-butterfly';
        bf.textContent = '🦋';
        this.companion.wrap.appendChild(bf);
        this._say('Á bướm vàng kìaaa bắt lấy nó!! 🦋', 3000);
        this._moveCompTo(destSideX, 'trot', () => {
          bf.remove();
          this._setCompPose('playbow', this.compX > 50);
          popHearts(this.layer, this.compX, 86, 3);
          this._scheduleNextAntic(rand(5400, 6800));
        });
      } else {
        this._setCompPose('sit', this.compX > 50);
        const remarks =
          this.pageKind === 'rooms'
            ? [
                'Mốt đi villa nhớ chừa chỗ cho Kakao chạy sân vườn nha!',
                'Phòng nào có bãi cỏ như công viên là Kakao chấm 10 điểm!',
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
