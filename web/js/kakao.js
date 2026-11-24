/* =====================================================================
   3D KAKAO PACK & STAGE COMPANION (THREE.JS)
   - Mô hình 3D Kakao điêu khắc mềm mại đúng màu lông thật (đầu/tai vàng caramel,
     vệt trắng giữa trán, mõm trắng, đốm lưng caramel, bụng hồng, đệm chân hồng,
     vòng cổ chuông vàng & dây dắt đỏ đi công viên)
   - Prelude: Đàn 5 bé Kakao 3D chạy nhảy, thò đầu, lăn ngửa bụng 180°, rượt bướm 3D
   - Stage: Bé Kakao 3D chạy lon ton hai bên lề, tha dây đòi đi công viên, lăn bụng,
     nghiêng đầu hóng chuyện & nhảy xoay 360° bắn tim khi được click nựng
   ===================================================================== */
(function () {
  if (!window.THREE) return;
  const THREE = window.THREE;
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  /* ---------------- Shared Textures & Materials (built once, 0 leak) ---------------- */
  let SHARED = null;

  function makeHeadTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const g = c.getContext('2d');

    // Base warm golden-caramel coat
    const baseGrad = g.createLinearGradient(0, 0, 0, 512);
    baseGrad.addColorStop(0, '#dc964b');
    baseGrad.addColorStop(0.55, '#d38a3e');
    baseGrad.addColorStop(1, '#fffaf1');
    g.fillStyle = baseGrad;
    g.fillRect(0, 0, 512, 512);

    // Subtle soft fur grain strokes
    g.globalAlpha = 0.08;
    for (let i = 0; i < 420; i++) {
      g.fillStyle = i % 2 === 0 ? '#ffdfad' : '#a96220';
      g.fillRect(rand(0, 512), rand(0, 320), rand(2, 5), rand(8, 18));
    }
    g.globalAlpha = 1;

    // Creamy-white lower cheeks & chin (centered at u=0.5 -> x=256)
    const cheekGrad = g.createRadialGradient(256, 390, 30, 256, 370, 210);
    cheekGrad.addColorStop(0, '#fffdf9');
    cheekGrad.addColorStop(0.62, '#fffaf1');
    cheekGrad.addColorStop(1, 'rgba(255, 250, 241, 0)');
    g.fillStyle = cheekGrad;
    g.fillRect(0, 170, 512, 342);

    // Kakao's signature white forehead blaze tapering between the eyes
    const blazeGrad = g.createLinearGradient(256, 125, 256, 300);
    blazeGrad.addColorStop(0, 'rgba(255, 252, 246, 0.15)');
    blazeGrad.addColorStop(0.28, 'rgba(255, 252, 246, 0.92)');
    blazeGrad.addColorStop(1, '#fffdf9');
    g.fillStyle = blazeGrad;
    g.beginPath();
    g.moveTo(256, 122);
    g.bezierCurveTo(274, 165, 286, 235, 305, 295);
    g.lineTo(207, 295);
    g.bezierCurveTo(226, 235, 238, 165, 256, 122);
    g.closePath();
    g.fill();

    // Soft rosy cheek blushes
    [186, 326].forEach((bx) => {
      const bl = g.createRadialGradient(bx, 302, 2, bx, 302, 36);
      bl.addColorStop(0, 'rgba(247, 148, 146, 0.58)');
      bl.addColorStop(1, 'rgba(247, 148, 146, 0)');
      g.fillStyle = bl;
      g.beginPath();
      g.arc(bx, 302, 36, 0, Math.PI * 2);
      g.fill();
    });

    const tex = new THREE.CanvasTexture(c);
    if ('colorSpace' in tex && THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    else if ('encoding' in tex && THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function makeBodyTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const g = c.getContext('2d');

    // Warm creamy-white body fur
    g.fillStyle = '#fffaf0';
    g.fillRect(0, 0, 512, 512);

    // Soft warm shading + rosy puppy belly at bottom (y=360..512)
    const belly = g.createRadialGradient(256, 455, 18, 256, 450, 145);
    belly.addColorStop(0, '#fbd8d6');
    belly.addColorStop(0.65, '#fce8e4');
    belly.addColorStop(1, 'rgba(255, 250, 240, 0)');
    g.fillStyle = belly;
    g.fillRect(0, 300, 512, 212);

    // Kakao's signature golden-caramel back saddle patch
    const patch = g.createRadialGradient(295, 130, 22, 295, 130, 118);
    patch.addColorStop(0, '#d68e42');
    patch.addColorStop(0.68, '#dc984f');
    patch.addColorStop(1, 'rgba(220, 152, 79, 0)');
    g.fillStyle = patch;
    g.beginPath();
    g.arc(295, 130, 118, 0, Math.PI * 2);
    g.fill();

    const tex = new THREE.CanvasTexture(c);
    if ('colorSpace' in tex && THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    else if ('encoding' in tex && THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function makeShadowTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(64, 64, 6, 64, 64, 60);
    grd.addColorStop(0, 'rgba(18, 10, 5, 0.42)');
    grd.addColorStop(0.55, 'rgba(18, 10, 5, 0.18)');
    grd.addColorStop(1, 'rgba(18, 10, 5, 0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }

  function getShared() {
    if (SHARED) return SHARED;
    const headTex = makeHeadTexture();
    const bodyTex = makeBodyTexture();
    const shadowTex = makeShadowTexture();

    SHARED = {
      matHead: new THREE.MeshStandardMaterial({ map: headTex, roughness: 0.78, metalness: 0.02 }),
      matBody: new THREE.MeshStandardMaterial({ map: bodyTex, roughness: 0.80, metalness: 0.02 }),
      matWhite: new THREE.MeshStandardMaterial({ color: 0xfffaf0, roughness: 0.78, metalness: 0.02 }),
      matTan: new THREE.MeshStandardMaterial({ color: 0xd79045, roughness: 0.76, metalness: 0.02 }),
      matInnerEar: new THREE.MeshStandardMaterial({ color: 0xf3bfb0, roughness: 0.82, metalness: 0.0 }),
      matPink: new THREE.MeshStandardMaterial({ color: 0xf48a96, roughness: 0.55, metalness: 0.02 }),
      matToeBean: new THREE.MeshStandardMaterial({ color: 0xf2a3ad, roughness: 0.65, metalness: 0.0 }),
      matEye: new THREE.MeshStandardMaterial({ color: 0x1e130d, roughness: 0.08, metalness: 0.08 }),
      matNose: new THREE.MeshStandardMaterial({ color: 0x221510, roughness: 0.16, metalness: 0.05 }),
      matGlint: new THREE.MeshBasicMaterial({ color: 0xffffff }),
      matCollar: new THREE.MeshStandardMaterial({ color: 0xd94836, roughness: 0.48, metalness: 0.08 }),
      matBell: new THREE.MeshStandardMaterial({ color: 0xf7ce68, roughness: 0.24, metalness: 0.68 }),
      matWing: new THREE.MeshBasicMaterial({ color: 0xffdf85, side: THREE.DoubleSide, transparent: true, opacity: 0.92 }),
      matShadow: new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }),

      geoSphere: new THREE.SphereGeometry(1, 32, 26),
      geoSmallSphere: new THREE.SphereGeometry(1, 18, 16),
      geoLeg: new THREE.CapsuleGeometry(0.165, 0.34, 8, 14),
      // Smooth sculpted puppy ear profile via LatheGeometry (sinks cleanly into skull, soft rounded tip!)
      geoEarOuter: new THREE.LatheGeometry(
        [
          new THREE.Vector2(0.001, -0.12),
          new THREE.Vector2(0.24, -0.06),
          new THREE.Vector2(0.27, 0.08),
          new THREE.Vector2(0.22, 0.28),
          new THREE.Vector2(0.13, 0.48),
          new THREE.Vector2(0.055, 0.60),
          new THREE.Vector2(0.001, 0.64),
        ],
        20
      ),
      geoEarInner: new THREE.LatheGeometry(
        [
          new THREE.Vector2(0.001, 0.02),
          new THREE.Vector2(0.14, 0.08),
          new THREE.Vector2(0.15, 0.22),
          new THREE.Vector2(0.09, 0.40),
          new THREE.Vector2(0.03, 0.50),
          new THREE.Vector2(0.001, 0.53),
        ],
        16
      ),
      geoCollar: new THREE.TorusGeometry(0.46, 0.062, 12, 28),
      geoSquint: new THREE.TorusGeometry(0.105, 0.026, 8, 18, Math.PI * 0.88),
      geoSmile: new THREE.TorusGeometry(0.085, 0.018, 8, 16, Math.PI * 0.92),
      geoShadow: new THREE.PlaneGeometry(2.3, 1.65),
      geoTail: new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, 0.16, -0.22),
          new THREE.Vector3(0, 0.42, -0.30),
          new THREE.Vector3(0, 0.60, -0.16),
        ]),
        16,
        0.105,
        12,
        false
      ),
      geoLeash: new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0.22, -0.22, 0.18),
          new THREE.Vector3(0.48, -0.44, 0.08),
          new THREE.Vector3(0.68, -0.28, -0.05),
          new THREE.Vector3(0.55, -0.14, 0.06),
          new THREE.Vector3(0.46, -0.36, 0.08),
        ]),
        24,
        0.032,
        8,
        false
      ),
    };
    return SHARED;
  }

  /* ---------------- Build 1 Articulated 3D Kakao Rig ---------------- */
  function createKakaoRig() {
    const S = getShared();
    const root = new THREE.Group();

    // Soft ground contact shadow (stays on ground)
    const shadow = new THREE.Mesh(S.geoShadow, S.matShadow);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.66;
    root.add(shadow);

    // Main articulated pivot (handles bounce, barrel-roll, play-bow pitch)
    const rig = new THREE.Group();
    root.add(rig);

    const spine = new THREE.Group();
    rig.add(spine);

    // 1. Chubby Sculpted Torso + Fluffy Chest Puff
    const torso = new THREE.Mesh(S.geoSphere, S.matBody);
    torso.rotation.y = -Math.PI / 2; // aligns u=0.5 to +Z front & bottom to belly
    torso.scale.set(0.62, 0.56, 0.88);
    spine.add(torso);

    const chest = new THREE.Mesh(S.geoSphere, S.matWhite);
    chest.position.set(0, -0.04, 0.52);
    chest.scale.set(0.50, 0.47, 0.46);
    spine.add(chest);

    // 2. Red Collar + Shiny Gold Bell
    const collar = new THREE.Mesh(S.geoCollar, S.matCollar);
    collar.position.set(0, 0.24, 0.56);
    collar.rotation.x = Math.PI * 0.34;
    spine.add(collar);

    const bell = new THREE.Mesh(S.geoSmallSphere, S.matBell);
    bell.scale.setScalar(0.095);
    bell.position.set(0, -0.02, 0.80);
    spine.add(bell);

    // 3. Expressive Big Chibi Head
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 0.48, 0.62);
    spine.add(headPivot);

    const cranium = new THREE.Mesh(S.geoSphere, S.matHead);
    cranium.rotation.y = -Math.PI / 2; // aligns face center u=0.5 to +Z!
    cranium.scale.set(0.74, 0.68, 0.70);
    headPivot.add(cranium);

    // Smoothly blended smiling cheek puffs
    [-0.25, 0.25].forEach((cx) => {
      const cheek = new THREE.Mesh(S.geoSmallSphere, S.matWhite);
      cheek.position.set(cx, -0.16, 0.32);
      cheek.scale.set(0.32, 0.24, 0.28);
      headPivot.add(cheek);
    });

    // Tapered creamy-white snout + glossy wet dark nose
    const snout = new THREE.Mesh(S.geoSphere, S.matWhite);
    snout.position.set(0, -0.15, 0.58);
    snout.scale.set(0.34, 0.25, 0.38);
    headPivot.add(snout);

    const nose = new THREE.Mesh(S.geoSmallSphere, S.matNose);
    nose.position.set(0, -0.06, 0.91);
    nose.scale.set(0.115, 0.082, 0.09);
    headPivot.add(nose);

    const noseGlint = new THREE.Mesh(S.geoSmallSphere, S.matGlint);
    noseGlint.position.set(-0.032, -0.035, 0.985);
    noseGlint.scale.set(0.026, 0.016, 0.016);
    headPivot.add(noseGlint);

    // Cute 'ω' puppy smile arcs
    [-0.082, 0.082].forEach((sx) => {
      const sm = new THREE.Mesh(S.geoSmile, S.matNose);
      sm.position.set(sx, -0.18, 0.86);
      sm.rotation.z = Math.PI * 1.04;
      headPivot.add(sm);
    });

    // Animated 3D pink tongue
    const tonguePivot = new THREE.Group();
    tonguePivot.position.set(0, -0.24, 0.80);
    const tongue = new THREE.Mesh(S.geoSmallSphere, S.matPink);
    tongue.scale.set(0.095, 0.13, 0.055);
    tongue.position.set(0, -0.05, 0.02);
    tonguePivot.add(tongue);
    headPivot.add(tonguePivot);

    // Optional 3D Red Park Leash held in mouth!
    const leashGroup = new THREE.Group();
    leashGroup.position.set(0.06, -0.22, 0.84);
    const leashMesh = new THREE.Mesh(S.geoLeash, S.matCollar);
    leashGroup.add(leashMesh);
    leashGroup.visible = false;
    headPivot.add(leashGroup);

    // Open Glossy Puppy Eyes (with dual white catchlights + caramel brow beans)
    const eyesOpen = new THREE.Group();
    headPivot.add(eyesOpen);
    [-1, 1].forEach((side) => {
      const ex = side * 0.285;
      const eye = new THREE.Mesh(S.geoSmallSphere, S.matEye);
      eye.position.set(ex, 0.05, 0.60);
      eye.scale.set(0.115, 0.125, 0.095);
      eyesOpen.add(eye);

      const glint1 = new THREE.Mesh(S.geoSmallSphere, S.matGlint);
      glint1.position.set(ex - 0.032, 0.092, 0.685);
      glint1.scale.setScalar(0.034);
      eyesOpen.add(glint1);

      const glint2 = new THREE.Mesh(S.geoSmallSphere, S.matGlint);
      glint2.position.set(ex + 0.028, 0.018, 0.685);
      glint2.scale.setScalar(0.017);
      eyesOpen.add(glint2);

      // Expressive soft white/cream eyebrow dot
      const brow = new THREE.Mesh(S.geoSmallSphere, S.matWhite);
      brow.position.set(ex * 0.92, 0.21, 0.58);
      brow.scale.set(0.065, 0.038, 0.04);
      brow.rotation.z = side * -0.22;
      headPivot.add(brow);
    });

    // Happy Squinting '^ ^' Eyes (for belly-up & petted joy!)
    const eyesHappy = new THREE.Group();
    eyesHappy.visible = false;
    headPivot.add(eyesHappy);
    [-1, 1].forEach((side) => {
      const sq = new THREE.Mesh(S.geoSquint, S.matEye);
      sq.position.set(side * 0.285, 0.03, 0.63);
      sq.rotation.z = Math.PI * 0.06;
      eyesHappy.add(sq);
    });

    // Sculpted Pointed Upright Golden-Caramel Ears sunken seamlessly into skull
    function makeEar(side) {
      const piv = new THREE.Group();
      piv.position.set(side * 0.36, 0.38, 0.05);
      piv.rotation.z = side * -0.34;
      piv.rotation.x = 0.14;

      const outer = new THREE.Mesh(S.geoEarOuter, S.matTan);
      outer.scale.set(1, 1, 0.48);
      piv.add(outer);

      const inner = new THREE.Mesh(S.geoEarInner, S.matInnerEar);
      inner.position.set(0, 0.02, 0.075);
      inner.scale.set(1, 1, 0.32);
      piv.add(inner);

      headPivot.add(piv);
      return piv;
    }
    const earL = makeEar(-1);
    const earR = makeEar(1);

    // 4. Four Articulated Legs + Plump Paws + Pink Toe-Beans
    function makeLeg(x, y, z) {
      const piv = new THREE.Group();
      piv.position.set(x, y, z);

      const limb = new THREE.Mesh(S.geoLeg, S.matWhite);
      limb.position.y = -0.20;
      piv.add(limb);

      const paw = new THREE.Mesh(S.geoSmallSphere, S.matWhite);
      paw.position.set(0, -0.40, 0.05);
      paw.scale.set(0.18, 0.12, 0.21);
      piv.add(paw);

      // Cute pink paw pad + toe beans on underside (shows during belly roll & jumps!)
      const pad = new THREE.Mesh(S.geoSmallSphere, S.matToeBean);
      pad.position.set(0, -0.49, 0.04);
      pad.scale.set(0.085, 0.03, 0.085);
      piv.add(pad);
      [-0.065, 0, 0.065].forEach((bx, bi) => {
        const bean = new THREE.Mesh(S.geoSmallSphere, S.matToeBean);
        bean.position.set(bx, -0.485, 0.135 + (bi === 1 ? 0.02 : 0));
        bean.scale.set(0.032, 0.022, 0.035);
        piv.add(bean);
      });

      spine.add(piv);
      return piv;
    }
    const legFL = makeLeg(-0.33, -0.18, 0.46);
    const legFR = makeLeg(0.33, -0.18, 0.46);
    const legBL = makeLeg(-0.34, -0.18, -0.44);
    const legBR = makeLeg(0.34, -0.18, -0.44);

    // 5. Fluffy Curved Wagging Tail (tilted slightly to the side so it peeks out adorably!)
    const tailPivot = new THREE.Group();
    tailPivot.position.set(0.12, 0.18, -0.76);
    tailPivot.rotation.y = -0.25;
    const tailMesh = new THREE.Mesh(S.geoTail, S.matWhite);
    tailPivot.add(tailMesh);
    const tailTip = new THREE.Mesh(S.geoSmallSphere, S.matTan);
    tailTip.position.set(0, 0.16, -0.16);
    tailTip.scale.setScalar(0.13);
    tailPivot.add(tailTip);
    spine.add(tailPivot);

    // 6. Optional 3D Flapping Golden Butterfly flying right in front of Kakao's nose!
    const butterfly = new THREE.Group();
    butterfly.position.set(0, 0.72, 1.55);
    butterfly.visible = false;
    const wingGeo = new THREE.CircleGeometry(0.16, 12);
    const wingL = new THREE.Mesh(wingGeo, S.matWing);
    wingL.position.x = -0.11;
    const wingR = new THREE.Mesh(wingGeo, S.matWing);
    wingR.position.x = 0.11;
    butterfly.add(wingL, wingR);
    rig.add(butterfly);

    return {
      root,
      rig,
      spine,
      shadow,
      headPivot,
      eyesOpen,
      eyesHappy,
      tonguePivot,
      leashGroup,
      earL,
      earR,
      legFL,
      legFR,
      legBL,
      legBR,
      tailPivot,
      butterfly,
      wingL,
      wingR,
    };
  }

  /* ---------------- Animate 1 3D Kakao Rig at 60fps ---------------- */
  function updateActorPose(actor, t, dt) {
    const m = actor.model;
    const phase = t * actor.animSpeed + actor.seed;
    const pose = actor.pose;

    // Smoothly interpolate position, yaw (ry), and scale
    const kPos = 1 - Math.exp(-dt * actor.moveSharpness);
    actor.nx += (actor.targetNx - actor.nx) * kPos;
    actor.ny += (actor.targetNy - actor.ny) * kPos;
    actor.scale += (actor.targetScale - actor.scale) * (1 - Math.exp(-dt * 9));

    // Shortest-angle yaw interpolation
    let dYaw = actor.targetYaw - actor.yaw;
    while (dYaw > Math.PI) dYaw -= Math.PI * 2;
    while (dYaw < -Math.PI) dYaw += Math.PI * 2;
    actor.yaw += dYaw * (1 - Math.exp(-dt * 8));

    // Spin burst (when petted or celebrating!)
    if (actor.spinLeft > 0) {
      const step = Math.min(actor.spinLeft, dt * Math.PI * 5.2);
      actor.spinAngle += step;
      actor.spinLeft -= step;
    } else {
      actor.spinAngle = 0;
    }

    m.leashGroup.visible = Boolean(actor.withLeash);
    m.butterfly.visible = Boolean(actor.withButterfly);
    if (actor.withButterfly) {
      const flap = Math.sin(t * 24) * 0.85;
      m.wingL.rotation.y = flap;
      m.wingR.rotation.y = -flap;
      m.butterfly.position.set(
        Math.sin(t * 3.5) * 0.35,
        0.72 + Math.sin(t * 5.2) * 0.18,
        1.45 + Math.cos(t * 2.8) * 0.15
      );
    }

    // Natural eye blink (unless squinting happily)
    const happySquint = pose === 'belly' || actor.forceHappy || actor.spinLeft > 0;
    m.eyesHappy.visible = happySquint;
    m.eyesOpen.visible = !happySquint;
    if (!happySquint) {
      const blinkCycle = (t + actor.seed) % 3.4;
      const blinkScale = blinkCycle > 3.26 ? 0.08 : 1;
      m.eyesOpen.scale.y = blinkScale;
    }

    // Always wag tail & pant tongue happily!
    m.tailPivot.rotation.z = Math.sin(t * 15 + actor.seed) * 0.48;
    m.tailPivot.rotation.x = Math.cos(t * 7.5 + actor.seed) * 0.15;
    m.tonguePivot.scale.y = 0.92 + Math.sin(t * 11 + actor.seed) * 0.18;

    // Reset baseline rig transforms before pose-specific layering
    let targetRoll = 0;
    let targetPitch = 0;
    let hopY = 0;

    if (pose === 'trot' || pose === 'leash') {
      const g = t * 14 + actor.seed;
      const swing = 0.68;
      m.legFL.rotation.x = Math.sin(g) * swing;
      m.legBR.rotation.x = Math.sin(g) * swing;
      m.legFR.rotation.x = -Math.sin(g) * swing;
      m.legBL.rotation.x = -Math.sin(g) * swing;

      hopY = Math.abs(Math.sin(g)) * 0.14;
      targetPitch = Math.cos(g * 2) * 0.06;
      m.headPivot.rotation.z = Math.sin(g * 0.5) * 0.08;
      m.headPivot.rotation.x = -0.06 + Math.sin(g) * 0.05;
      m.earL.rotation.z = -0.36 + Math.abs(Math.sin(g)) * 0.18;
      m.earR.rotation.z = 0.36 - Math.abs(Math.sin(g)) * 0.18;
    } else if (pose === 'belly') {
      // 180° 3D barrel roll onto back exposing pink tummy & paddling pink toe-beans!
      targetRoll = Math.PI + Math.sin(t * 3.8 + actor.seed) * 0.16;
      hopY = 0.08;
      const pad = t * 10 + actor.seed;
      m.legFL.rotation.x = -0.35 + Math.sin(pad) * 0.42;
      m.legFR.rotation.x = -0.35 - Math.sin(pad) * 0.42;
      m.legBL.rotation.x = 0.35 - Math.sin(pad * 0.9) * 0.38;
      m.legBR.rotation.x = 0.35 + Math.sin(pad * 0.9) * 0.38;
      m.headPivot.rotation.x = -0.22;
      m.headPivot.rotation.z = Math.sin(t * 3.8 + actor.seed) * 0.12;
      m.earL.rotation.z = -0.58;
      m.earR.rotation.z = 0.58;
    } else if (pose === 'playbow') {
      // Front down, fluffy butt & wagging tail high up, excited little hops!
      targetPitch = 0.34;
      const bounce = Math.max(0, Math.sin(t * 7.5 + actor.seed));
      hopY = bounce * 0.24;
      m.legFL.rotation.x = -0.82;
      m.legFR.rotation.x = -0.82;
      m.legBL.rotation.x = 0.22;
      m.legBR.rotation.x = 0.22;
      m.headPivot.rotation.x = -0.38;
      m.headPivot.rotation.z = Math.sin(t * 4.2 + actor.seed) * 0.16;
      m.earL.rotation.z = -0.28 - bounce * 0.15;
      m.earR.rotation.z = 0.28 + bounce * 0.15;
    } else {
      // 'sit': Polite puppy sit, tilting head adorably left & right!
      targetPitch = -0.28;
      hopY = -0.05 + Math.sin(phase * 2.2) * 0.025;
      m.legFL.rotation.x = 0.26;
      m.legFR.rotation.x = 0.26;
      m.legBL.rotation.x = -0.95;
      m.legBR.rotation.x = -0.95;
      m.headPivot.rotation.x = 0.24;
      m.headPivot.rotation.z = Math.sin(t * 2.4 + actor.seed) * 0.22;
      m.headPivot.rotation.y = Math.sin(t * 1.5 + actor.seed) * 0.16;
      m.earL.rotation.z = -0.34 + Math.sin(t * 3.2 + actor.seed) * 0.08;
      m.earR.rotation.z = 0.34 + Math.cos(t * 3.2 + actor.seed) * 0.08;
    }

    if (actor.spinLeft > 0) {
      hopY += Math.sin((actor.spinLeft / (Math.PI * 2)) * Math.PI) * 0.55;
    }

    actor.roll += (targetRoll - actor.roll) * (1 - Math.exp(-dt * 8));
    actor.pitch += (targetPitch - actor.pitch) * (1 - Math.exp(-dt * 9));

    m.rig.position.y = hopY;
    m.rig.rotation.y = actor.yaw + actor.spinAngle;
    m.spine.rotation.z = actor.roll;
    m.spine.rotation.x = actor.pitch;
    m.root.rotation.z = actor.bankZ || 0;

    const s = Math.max(0.001, actor.scale);
    m.root.scale.setScalar(s);
    m.shadow.scale.setScalar(clamp(1 - hopY * 0.65, 0.45, 1.05));
    m.shadow.visible = !actor.hideShadow;
  }

  /* =====================================================================
     3D SCENE & PACK CONTROLLER
     ===================================================================== */
  class KakaoPackController {
    constructor(layer) {
      this.layer = layer;
      this.timers = [];
      this.actors = [];
      this.companion = null;
      this.compX = 0.14;
      this.compTimer = null;
      this.lastAction = '';
      this.pageKind = 'letter';
      this.sendFx = () => {};
      this.running = false;
      this.lastTs = 0;

      if (!layer) return;
      this._initThree();
    }

    _initThree() {
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'kakao-gl';
      this.layer.appendChild(this.canvas);

      this.domOverlay = document.createElement('div');
      this.domOverlay.className = 'k-dom-overlay';
      this.layer.appendChild(this.domOverlay);

      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      this.renderer.setClearColor(0x000000, 0);
      if ('outputColorSpace' in this.renderer && THREE.SRGBColorSpace) {
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      } else if ('outputEncoding' in this.renderer && THREE.sRGBEncoding) {
        this.renderer.outputEncoding = THREE.sRGBEncoding;
      }

      this.scene = new THREE.Scene();

      // Orthographic-feel narrow FOV camera so perspective stays flattering across the whole screen
      this.camera = new THREE.PerspectiveCamera(28, 1, 0.1, 60);
      this.camera.position.set(0, 0.35, 16);
      this.camera.lookAt(0, 0, 0);

      // Warm vinyl-plush studio 3-point lighting (soft cream key + caramel bounce + golden rim)
      const hemi = new THREE.HemisphereLight(0xfff8ee, 0xd49a6a, 1.28);
      this.scene.add(hemi);

      const keyLight = new THREE.DirectionalLight(0xfff4df, 1.05);
      keyLight.position.set(4.5, 7.5, 9.0);
      this.scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(0xffcf8c, 0.72);
      rimLight.position.set(-6.0, 4.5, -5.5);
      this.scene.add(rimLight);

      this._projVec = new THREE.Vector3();
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }

    resize() {
      if (!this.renderer) return;
      this.W = window.innerWidth;
      this.H = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.renderer.setPixelRatio(dpr);
      this.renderer.setSize(this.W, this.H, false);
      this.camera.aspect = this.W / Math.max(1, this.H);
      this.camera.updateProjectionMatrix();

      // Visible world height & width at z = 0 plane (distance = 16)
      const vFov = (this.camera.fov * Math.PI) / 180;
      this.visH = 2 * Math.tan(vFov / 2) * 16;
      this.visW = this.visH * this.camera.aspect;
    }

    // Convert normalized screen (0..1 left->right, 0..1 top->bottom) to world (x, y) at z=0
    _screenToWorld(nx, ny) {
      return [
        (nx - 0.5) * this.visW,
        (0.5 - ny) * this.visH,
      ];
    }

    _wake() {
      if (this.running) return;
      this.running = true;
      this.lastTs = performance.now();
      requestAnimationFrame((ts) => this._frame(ts));
    }

    _after(ms, fn) {
      const id = setTimeout(fn, ms);
      this.timers.push(id);
      return id;
    }

    _spawnActor(opts = {}) {
      const model = createKakaoRig();
      this.scene.add(model.root);

      const bubble = document.createElement('div');
      bubble.className = 'k-bubble' + (opts.hero ? ' k-hero-bubble' : '') + (opts.companion ? ' k-comp-bubble' : '');
      if (opts.text) {
        bubble.textContent = opts.text;
        bubble.classList.add('is-visible');
      }
      this.domOverlay.appendChild(bubble);

      let badge = null;
      if (opts.photo) {
        badge = document.createElement('div');
        badge.className = 'k-photo-badge';
        const img = new Image();
        img.src = opts.photo;
        badge.appendChild(img);
        this.domOverlay.appendChild(badge);
      }

      let hitBox = null;
      if (opts.interactive) {
        hitBox = document.createElement('button');
        hitBox.className = 'k-hitbox';
        hitBox.title = 'Click để nựng Kakao!';
        hitBox.addEventListener('click', (e) => {
          e.stopPropagation();
          this.petCompanion();
        });
        this.domOverlay.appendChild(hitBox);
      }

      const actor = {
        model,
        bubble,
        badge,
        hitBox,
        nx: opts.nx ?? 0.5,
        ny: opts.ny ?? 0.5,
        targetNx: opts.targetNx ?? opts.nx ?? 0.5,
        targetNy: opts.targetNy ?? opts.ny ?? 0.5,
        moveSharpness: opts.moveSharpness ?? 3.6,
        scale: opts.startScale ?? 0.01,
        targetScale: opts.scale ?? 0.85,
        yaw: opts.yaw ?? 0,
        targetYaw: opts.targetYaw ?? opts.yaw ?? 0,
        roll: 0,
        pitch: 0,
        bankZ: opts.bankZ ?? 0,
        hideShadow: Boolean(opts.hideShadow),
        pose: opts.pose || 'trot',
        withLeash: Boolean(opts.withLeash),
        withButterfly: Boolean(opts.withButterfly),
        forceHappy: false,
        spinLeft: 0,
        spinAngle: 0,
        animSpeed: rand(0.92, 1.08),
        seed: rand(0, 10),
        bubbleOffsetY: opts.bubbleOffsetY ?? 1.25,
        edgeRight: Boolean(opts.edgeRight),
      };

      this.actors.push(actor);
      this._wake();
      return actor;
    }

    _removeActor(actor) {
      const idx = this.actors.indexOf(actor);
      if (idx >= 0) this.actors.splice(idx, 1);
      if (actor.model && actor.model.root) this.scene.remove(actor.model.root);
      if (actor.bubble) actor.bubble.remove();
      if (actor.badge) actor.badge.remove();
      if (actor.hitBox) actor.hitBox.remove();
    }

    clearAll() {
      this.timers.forEach((t) => clearTimeout(t));
      this.timers = [];
      if (this.compTimer) {
        clearTimeout(this.compTimer);
        this.compTimer = null;
      }
      [...this.actors].forEach((a) => this._removeActor(a));
      this.companion = null;
      if (this.domOverlay) {
        this.domOverlay.querySelectorAll('.k-float-heart, .k-paw-print').forEach((el) => el.remove());
      }
      if (this.renderer && this.scene && this.camera) {
        this.renderer.clear();
      }
    }

    _popHearts(nx, ny, count = 4) {
      if (!this.domOverlay) return;
      for (let i = 0; i < count; i++) {
        const h = document.createElement('span');
        h.className = 'k-float-heart';
        h.textContent = i % 3 === 1 ? '🐾' : '❤️';
        h.style.left = `calc(${(nx * 100).toFixed(1)}% + ${rand(-26, 26).toFixed(0)}px)`;
        h.style.top = `calc(${(ny * 100).toFixed(1)}% + ${rand(-24, 6).toFixed(0)}px)`;
        h.style.animationDelay = (i * 0.08) + 's';
        this.domOverlay.appendChild(h);
        setTimeout(() => h.remove(), 1350);
      }
    }

    _dropPaw(nx, ny) {
      if (!this.domOverlay) return;
      const p = document.createElement('span');
      p.className = 'k-paw-print';
      p.textContent = '🐾';
      p.style.left = (nx * 100).toFixed(1) + '%';
      p.style.top = (ny * 100).toFixed(1) + '%';
      this.domOverlay.appendChild(p);
      setTimeout(() => p.remove(), 1600);
    }

    _frame(now) {
      if (!this.actors.length) {
        this.running = false;
        this.renderer.clear();
        return;
      }
      const dt = Math.min(0.05, Math.max(0.001, (now - this.lastTs) / 1000));
      this.lastTs = now;
      const t = now * 0.001;

      for (let i = 0; i < this.actors.length; i++) {
        const a = this.actors[i];
        updateActorPose(a, t, dt);

        const [wx, wy] = this._screenToWorld(a.nx, a.ny);
        a.model.root.position.set(wx, wy, a.hero ? 1.2 : 0);

        // Project 3D anchor above head to 2D screen pixels for speech bubble, badge & hitbox
        this._projVec.set(wx, wy + a.bubbleOffsetY * a.scale, a.hero ? 1.2 : 0);
        this._projVec.project(this.camera);
        const sx = (this._projVec.x * 0.5 + 0.5) * this.W;
        const sy = (-this._projVec.y * 0.5 + 0.5) * this.H;

        if (a.bubble) {
          if (a.edgeRight) {
            a.bubble.style.left = (sx - 150) + 'px';
            a.bubble.style.top = (sy + 26) + 'px';
          } else {
            const clampedX = clamp(sx, 140, this.W - 140);
            a.bubble.style.left = clampedX + 'px';
            a.bubble.style.top = Math.max(18, sy - 10) + 'px';
          }
        }
        if (a.badge) {
          a.badge.style.left = (sx + 68) + 'px';
          a.badge.style.top = (sy + 52) + 'px';
        }
        if (a.hitBox) {
          a.hitBox.style.left = sx + 'px';
          a.hitBox.style.top = (sy + 48) + 'px';
        }
      }

      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame((ts) => this._frame(ts));
    }

    /* ---------------- 1. PRELUDE: ĐÀN 5 BÉ KAKAO 3D ÙA RA ĐÒI ĐI CÔNG VIÊN ---------------- */
    runPrelude(cfg = {}, sendFx = () => {}) {
      this.clearAll();
      this.sendFx = sendFx;
      const lines = cfg.preludeLines || {};

      // Bé #1: Chạy 3D từ trái vào ngậm dây dắt đỏ đòi đi công viên, rồi xoay mặt nhìn Khuê!
      this._after(0, () => {
        sendFx({ t: 'sfx', kind: 'kakaoPop', x: 0.25 });
        const a1 = this._spawnActor({
          nx: -0.12,
          ny: 0.63,
          targetNx: 0.22,
          targetNy: 0.63,
          moveSharpness: 2.8,
          scale: 0.88,
          startScale: 0.88,
          yaw: Math.PI * 0.46,
          targetYaw: Math.PI * 0.46,
          pose: 'leash',
          withLeash: true,
          text: lines.leash || 'Gâu gâu!! Đàn Kakao chiếm máy rồi, dẫn đi công viên mới trả nha! 🌳🐾',
        });
        a1.exitNx = -0.18; a1.exitNy = 0.64; a1.exitYaw = -Math.PI * 0.48;
        [240, 500, 760].forEach((ms, i) => this._after(ms, () => this._dropPaw(0.04 + i * 0.06, 0.70)));
        this._after(1050, () => {
          a1.pose = 'playbow';
          a1.targetYaw = 0.32; // Xoay người 3D hướng thẳng ra camera!
        });
      });

      // Bé #2: Thò nghiêng 3D từ mép phải màn hình ra hờn dỗi!
      this._after(850, () => {
        sendFx({ t: 'sfx', kind: 'pawTap', x: 0.9, step: 1 });
        const a2 = this._spawnActor({
          nx: 1.10,
          ny: 0.32,
          targetNx: 0.95,
          targetNy: 0.32,
          moveSharpness: 4.5,
          scale: 0.82,
          startScale: 0.82,
          yaw: -0.35,
          targetYaw: -0.35,
          bankZ: 0.95,
          hideShadow: true,
          edgeRight: true,
          pose: 'sit',
          text: lines.peek || 'Ủa mở máy tính mà hổng dẫn Kakao đi công viên hả chị Khuê?!',
        });
        a2.exitNx = 1.14; a2.exitNy = 0.32; a2.exitYaw = 0.4;
      });

      // Bé #3: Chạy vào góc phải dưới rồi lăn đùng 180° ngửa bụng hồng + 4 chân đệm hồng đạp gió!
      this._after(1700, () => {
        sendFx({ t: 'sfx', kind: 'pawTap', x: 0.74, step: 2 });
        sendFx({ t: 'burst', x: 0.74, y: 0.73, type: 'glitter', palette: 'gold', size: 0.65 });
        const a3 = this._spawnActor({
          nx: 0.75,
          ny: 0.74,
          targetNx: 0.75,
          targetNy: 0.74,
          scale: 0.88,
          yaw: -0.28,
          targetYaw: -0.28,
          pose: 'belly',
          photo: cfg.photo || 'assets/real_photos/kakao_sleep.jpg',
          text: lines.belly || 'Nằm lăn ra ăn vạ luôn! Gãi bụng 10 cái mới cho xem tiếp!',
        });
        a3.exitNx = 1.16; a3.exitNy = 0.75; a3.exitYaw = Math.PI * 0.48;
      });

      // Bé #4: Phóng zoomies 3D ngang phía trên rượt bướm vàng đập cánh 3D!
      this._after(2600, () => {
        sendFx({ t: 'sfx', kind: 'pawTap', x: 0.35, step: 3 });
        const a4 = this._spawnActor({
          nx: 1.12,
          ny: 0.24,
          targetNx: 0.27,
          targetNy: 0.24,
          moveSharpness: 2.2,
          scale: 0.80,
          startScale: 0.80,
          yaw: -Math.PI * 0.45,
          targetYaw: -Math.PI * 0.45,
          pose: 'trot',
          withButterfly: true,
          text: lines.zoom || 'Đi công viên bắt bướm thôiii gâu gâu!! 🦋',
        });
        a4.exitNx = -0.18; a4.exitNy = 0.22; a4.exitYaw = -Math.PI * 0.48;
        [260, 540, 820].forEach((ms, i) => this._after(ms, () => this._dropPaw(0.84 - i * 0.16, 0.30)));
        this._after(1450, () => {
          a4.targetYaw = 0.22;
          a4.pose = 'sit';
        });
      });

      // Bé #5 (Hero 3D chính giữa): Nhảy xoay 360° ra giữa màn hình phát hiện kỷ niệm 4 năm!
      this._after(3600, () => {
        sendFx({ t: 'sfx', kind: 'kakaoPop', x: 0.5 });
        sendFx({ t: 'burst', x: 0.5, y: 0.48, type: 'heart', palette: 'rose', size: 0.95 });
        const a5 = this._spawnActor({
          nx: 0.50,
          ny: 0.52,
          targetNx: 0.50,
          targetNy: 0.52,
          scale: 1.16,
          yaw: 0,
          targetYaw: 0,
          pose: 'playbow',
          hero: true,
          bubbleOffsetY: 1.32,
          text: lines.realize || 'Ủa khoan... hôm nay kỷ niệm 4 năm của anh Quân với chị Khuê hả?!',
        });
        a5.hero = true;
        a5.spinLeft = Math.PI * 2;
        a5.exitNx = 0.50; a5.exitNy = 1.18; a5.exitYaw = 0;

        // Cả đàn nhảy xoay ăn mừng & nhường sân khấu!
        this._after(1550, () => {
          sendFx({ t: 'sfx', kind: 'kakaoDone', x: 0.5 });
          sendFx({ t: 'burst', x: 0.5, y: 0.28, type: 'doubleHeart', palette: 'rose', size: 1.15 });
          a5.spinLeft = Math.PI * 2;
          a5.forceHappy = true;
          a5.bubble.textContent =
            lines.handover || 'Thôi hôm nay Kakao nhịn đi công viên 1 bữa! Nhường chỗ cho anh Quân chúc mừng chị Khuê nè ❤️';
          this._popHearts(0.50, 0.44, 5);
          this._popHearts(0.22, 0.56, 3);
          this._popHearts(0.75, 0.66, 3);
        });
      });
    }

    scatterPrelude() {
      this.actors.forEach((a) => {
        if (a.bubble) a.bubble.classList.remove('is-visible');
        if (a.badge) a.badge.style.opacity = '0';
        a.pose = 'trot';
        a.bankZ = 0;
        a.targetYaw = a.exitYaw ?? Math.PI * 0.48;
        a.moveSharpness = 3.8;
        a.targetNx = a.exitNx ?? 1.16;
        a.targetNy = a.exitNy ?? a.ny;
        a.targetScale = 0.5;
      });
      this._after(620, () => {
        if (!this.companion) this.clearAll();
      });
    }

    /* ---------------- 2. TRONG LÚC ĐỌC THƯ: BÉ KAKAO 3D CHẠY CHƠI & CHO NỰNG ---------------- */
    startStage(cfg = {}, sendFx = () => {}) {
      this.clearAll();
      this.sendFx = sendFx;
      this.compX = 0.14;

      const comp = this._spawnActor({
        nx: -0.08,
        ny: 0.86,
        targetNx: this.compX,
        targetNy: 0.86,
        moveSharpness: 2.4,
        scale: 0.68,
        startScale: 0.68,
        yaw: Math.PI * 0.45,
        targetYaw: Math.PI * 0.45,
        pose: 'trot',
        companion: true,
        interactive: true,
        bubbleOffsetY: 1.38,
        text: 'Đọc thư thong thả nha, xong dắt Kakao đi công viên nhaaa! 🌳🐾',
      });
      this.companion = comp;

      this._after(1500, () => {
        if (!this.companion) return;
        this.companion.pose = 'sit';
        this.companion.targetYaw = 0.25;
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
      this.sendFx({ t: 'sfx', kind: 'kakaoPop', x: c.nx });
      c.spinLeft = Math.PI * 2;
      c.pose = 'playbow';
      c.targetYaw = 0;
      this._popHearts(c.nx, 0.82, 5);
      this._say(
        pick([
          'Á chị Khuê nựng Kakao kìaaa thương quá ❤️',
          'Gâu gâu!! Thương chị Khuê với anh Quân nhất nhà!',
          'Nựng xong xíu nhớ dắt con đi công viên thiệt nha! 🌳',
          'Hihi được gãi đầu sướng tít mắt luôn 🐾',
        ]),
        3600
      );
      this._after(2100, () => {
        if (!this.companion) return;
        this.companion.pose = 'sit';
        this.companion.targetYaw = this.compX < 0.5 ? 0.25 : -0.25;
      });
    }

    onPageChange(index, page) {
      const c = this.companion;
      if (!c) return;
      if (page && page.finale) {
        this.pageKind = 'finale';
        this._walkCompTo(0.14, false, () => {
          c.pose = 'sit';
          c.targetYaw = 0.22;
          this._say('Pháo hoa đẹp quá trời luôn gâu gâu!! ✨', 4200);
        });
      } else if (page && page.type === 'rooms') {
        this.pageKind = 'rooms';
        c.pose = 'playbow';
        c.spinLeft = Math.PI * 2;
        c.targetYaw = this.compX < 0.5 ? 0.22 : -0.22;
        this._popHearts(this.compX, 0.82, 3);
        this._say('Anh chị đi vi vu về nhớ dắt Kakao bù 3 vòng công viên nha!! 🌳🐾', 4300);
      } else {
        this.pageKind = 'letter';
      }
    }

    _walkCompTo(destNx, withLeash = false, onArrive) {
      const c = this.companion;
      if (!c) return;
      const dx = destNx - this.compX;
      const dir = dx >= 0 ? 1 : -1;
      const dist = Math.abs(dx);
      const durMs = clamp(dist * 3400, 1200, 2900);

      c.withLeash = withLeash;
      c.pose = withLeash ? 'leash' : 'trot';
      c.targetYaw = dir * Math.PI * 0.46;

      // Smooth linear-ish stride via timed steps + paw prints
      const startX = this.compX;
      const t0 = performance.now();
      c.moveSharpness = 9.0;

      const stepTick = () => {
        if (this.companion !== c) return;
        const k = clamp((performance.now() - t0) / durMs, 0, 1);
        const cur = startX + dx * k;
        c.targetNx = cur;
        this.compX = cur;
        if (k < 1) {
          requestAnimationFrame(stepTick);
        } else {
          c.moveSharpness = 3.6;
          c.withLeash = false;
          c.withButterfly = false;
          if (onArrive) onArrive();
        }
      };
      requestAnimationFrame(stepTick);

      const prints = Math.min(4, Math.max(2, Math.round(dist * 6)));
      for (let i = 1; i <= prints; i++) {
        this._after((durMs * i) / (prints + 1), () => {
          if (this.companion === c) this._dropPaw(startX + (dx * i) / (prints + 1), 0.90);
        });
      }
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

      const goRight = this.compX < 0.5;
      const otherSide = goRight ? rand(0.79, 0.88) : rand(0.12, 0.21);
      const sameSide = this.compX < 0.5 ? rand(0.12, 0.22) : rand(0.78, 0.88);

      if (act === 'walk_across') {
        this._say(
          pick([
            'Chạy lon ton qua bên này hóng tiếp nè 🐾',
            'Lạch bạch... đi tuần quanh bức thư của anh chị!',
            'Chạy tập thể dục khởi động chờ đi công viên!',
          ]),
          2800
        );
        this._walkCompTo(otherSide, false, () => {
          c.pose = 'sit';
          c.targetYaw = this.compX < 0.5 ? 0.25 : -0.25;
          this._scheduleNextAntic(rand(5200, 6800));
        });
      } else if (act === 'leash_park') {
        this._walkCompTo(sameSide, true, () => {
          c.withLeash = true;
          c.pose = 'playbow';
          c.targetYaw = this.compX < 0.5 ? 0.22 : -0.22;
          this._say(
            pick([
              'Ngậm sẵn dây dắt rồi nè, đọc xong đi công viên nhaaa! 🌳',
              'Chị Khuê ơiii bao giờ mới tới giờ đi công viên dọ?',
              'Đi công viên chạy 3 vòng rồi về ăn pate nha!',
            ]),
            4000
          );
          this._after(3800, () => {
            if (this.companion === c) c.withLeash = false;
          });
          this._scheduleNextAntic(rand(5800, 7400));
        });
      } else if (act === 'belly_roll') {
        c.pose = 'belly';
        c.targetYaw = 0;
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
        c.withButterfly = true;
        this._say('Á bướm vàng kìaaa bắt lấy nó!! 🦋', 3000);
        this._walkCompTo(otherSide, false, () => {
          c.pose = 'playbow';
          c.targetYaw = this.compX < 0.5 ? 0.24 : -0.24;
          this._popHearts(this.compX, 0.82, 3);
          this._scheduleNextAntic(rand(5400, 6800));
        });
      } else {
        c.pose = 'sit';
        c.targetYaw = this.compX < 0.5 ? 0.25 : -0.25;
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
