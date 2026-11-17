/* AID — in-building lift ride (production build).
   The camera pushes from the existing zoomed building shot straight into the building's own lift shaft,
   follows the cabin floor by floor, then rises over the roof and hands back to the existing zoom-out.

   Everything is driven by ONE source of truth: the scrubbed GSAP timeline in building-journey.js.
   The timeline tweens a tiny state object { push, pos, door, top }; render() turns that state into
   cabin position, ropes, doors, floor display, floor lighting, camera and caption. Scrolling in either
   direction, jumping, or resizing therefore can never desynchronise the pieces. */
(() => {
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const sm = v => v * v * (3 - 2 * v);
  const lerp = (a, b, t) => a + (b - a) * t;

  // ---- editable floor content (replace with approved AID copy) ----
  const FLOORS = [
    ['01', 'COMPANY', 'The people behind the build.', 'Company story, leadership and operating philosophy.'],
    ['02', 'LEADERSHIP', 'Discipline at every level.', 'Governance, delivery approach and accountability.'],
    ['03', 'SUSTAINABILITY', 'Built for the long term.', 'Materials, communities and measurable impact.'],
    ['04', 'PROJECTS', 'A portfolio in motion.', 'Selected projects, sectors, locations and verified metrics.'],
    ['05', 'CAPABILITIES', 'Ready for what comes next.', 'Residential, commercial, industrial and infrastructure.']
  ];

  // ---- building geometry (SVG units, taken from the building drawing) ----
  const FLOOR_TOP = [751, 688, 623, 558, 493];   // top of each floor slab = where the cabin threshold stops
  const CAB_H = 38, CAB_X = 949;
  const ROOF_FOCUS_Y = 372;                       // world y the camera looks at for the rooftop reveal
  const FROM = { s: 3.8, x: -320, y: -120, rot: 1.2 };   // = pose at the end of the existing zoom-in (building-journey.js)

  // ---- timeline (fractions of the original timeline; 1 unit ~ 1200vh of scroll) ----
  const T = { push0: 0.695, push1: 0.745, leg: 0.031, topDur: 0.05, stops: [0.046, 0.034, 0.046, 0.034, 0.060] };
  T.rideStart = T.push1;
  T.rideEnd = T.rideStart + T.stops.reduce((a, b) => a + b, 0) + 4 * T.leg;
  T.topEnd = T.rideEnd + T.topDur;                // existing zoom-out starts here

  const cabBottomAt = pos => {
    const p = clamp(pos, 0, 4), i = Math.min(3, Math.floor(p));
    return FLOOR_TOP[i] + (FLOOR_TOP[i + 1] - FLOOR_TOP[i]) * (p - i);
  };

  window.AIDLift = {
    timing: T,
    build({ gsap, tl, rig, section }) {
      const $ = s => section.querySelector(s);
      const svg = $('.main-svg');
      const sticky = $('.aid-legacy-sticky') || section;
      const oldCab = $('#elevator-cab'), facade = $('#facade-panels'), detail = $('#lift-detail'), structure = $('#layer-structure');
      const cabD = $('#lift-cab-d'), doorL = $('#lift-door-l'), doorR = $('#lift-door-r');
      const ropeA = $('#lift-rope-a'), ropeB = $('#lift-rope-b'), halo = $('#lift-halo');
      const cabFloor = $('#lift-cab-floor');
      const lamps = Array.from(section.querySelectorAll('.lift-lamp'));
      const glows = Array.from(section.querySelectorAll('.lift-glow'));
      const card = $('[data-lift-card]'), readout = $('[data-lift-readout]'), focus = $('[data-lift-focus]');
      const cardFloor = $('[data-lift-card-floor]'), cardTitle = $('[data-lift-card-title]');
      const cardSub = $('[data-lift-card-subtitle]'), cardCopy = $('[data-lift-card-copy]'), sideNum = $('[data-lift-side-number]');
      const legacyCopy = $('.aid-legacy-copy');
      if (!detail || !cabD) return;

      // ---- camera framing, measured from the real viewport (desktop / tablet / phone) ----
      const cam = { k: 0.75, sd: 8, st: 3.7 };
      const measure = () => {
        const r = svg.getBoundingClientRect(), h = sticky.clientHeight || r.height, w = sticky.clientWidth || r.width;
        cam.k = Math.max(r.width / 1920, r.height / 1080) || 0.75;
        cam.sd = clamp((0.36 * h) / (CAB_H * cam.k), 4.5, 12);       // cabin ~36% of viewport height
        cam.st = clamp(w / (cam.k * 520), 2.2, 5);                    // rooftop shot ~520 world units wide
      };

      // GSAP resolves the rig's transform-origin against the SVG group's own bounding box (not the viewBox),
      // so the camera maths has to use the origin GSAP actually applies, or the shaft ends up off-centre.
      const origin = () => { const g = rig._gsap || {}; return { x: g.xOrigin ?? 960, y: g.yOrigin ?? 540 }; };
      const L = { push: 0, pos: 0, door: 0, top: 0 };
      let shownIdx = -1, shownFloorTxt = '', dimmed = false;

      const render = () => {
        const e = L.push, top = L.top, pos = L.pos, door = L.door;
        const vis = sm(clamp((e - 0.2) / 0.6));
        detail.style.opacity = vis.toFixed(3);
        gsap.set(oldCab, { opacity: 1 - vis });
        // The glass facade and structural frame step back so the shaft is the hero; they return for the rooftop shot.
        // (Before the push the facade / structure tweens own these properties, so only touch them while active.)
        if (e > 0 || dimmed) {
          const k = sm(clamp(e / 0.8)) * (1 - sm(top));
          gsap.set(facade, { opacity: 1 - 0.78 * k });
          if (structure) gsap.set(structure, { opacity: 1 - 0.66 * k });
          dimmed = e > 0;
        }

        // cabin, ropes, doors
        const bottom = cabBottomAt(pos), cabTop = bottom - CAB_H;
        cabD.setAttribute('transform', `translate(${CAB_X} ${cabTop.toFixed(3)})`);
        ropeA.setAttribute('y2', cabTop.toFixed(3));
        ropeB.setAttribute('y2', cabTop.toFixed(3));
        doorL.setAttribute('transform', `translate(${(-door * 8.6).toFixed(3)} 0)`);
        doorR.setAttribute('transform', `translate(${(door * 8.6).toFixed(3)} 0)`);
        halo.style.opacity = (door * 0.9).toFixed(3);

        // floor display in the cabin + landing lamps + floor lighting
        const idx = clamp(Math.round(pos), 0, 4), d = Math.abs(pos - idx);
        const txt = FLOORS[idx][0];
        if (txt !== shownFloorTxt) { shownFloorTxt = txt; cabFloor.textContent = txt; }
        lamps.forEach((l, i) => l.setAttribute('fill', Math.abs(pos - i) < 0.4 ? '#ffb84d' : '#0b2236'));
        glows.forEach((g, i) => { g.style.opacity = (clamp(1 - Math.abs(pos - i) * 1.25) * (0.25 + 0.5 * door) * vis).toFixed(3); });

        // caption + readout (text swaps while invisible, mid-leg)
        const cv = sm(clamp((e - 0.85) / 0.15)) * (1 - sm(clamp(top / 0.5))) * clamp((0.5 - d) / 0.2);
        if (idx !== shownIdx) {
          shownIdx = idx; const f = FLOORS[idx];
          if (cardFloor) cardFloor.textContent = `FLOOR ${f[0]}`;
          if (cardTitle) cardTitle.textContent = f[1];
          if (cardSub) cardSub.textContent = f[2];
          if (cardCopy) cardCopy.textContent = f[3];
          if (sideNum) sideNum.textContent = f[0];
        }
        if (card) { card.style.opacity = cv.toFixed(3); card.style.transform = `translateY(${(-50 + (1 - cv) * 2).toFixed(2)}%)`; }
        if (readout) readout.style.opacity = cv.toFixed(3);
        if (focus) focus.style.opacity = (sm(e) * (1 - 0.7 * sm(top))).toFixed(3);

        // camera: existing zoom pose -> shaft follow -> rooftop. Skipped while push == 0 so the existing zoom tween owns the rig.
        if (e > 0) {
          const o = origin();
          const fromC = { x: o.x + (960 - o.x - FROM.x) / FROM.s, y: o.y + (540 - o.y - FROM.y) / FROM.s }; // world point the existing zoom looks at
          const fx = 960, fy = bottom - CAB_H / 2;
          const cx = lerp(fx, 960, top), cy = lerp(fy, ROOF_FOCUS_Y, top);
          const s = cam.sd * Math.pow(cam.st / cam.sd, top);
          const c2x = lerp(fromC.x, cx, e), c2y = lerp(fromC.y, cy, e);
          const s2 = FROM.s * Math.pow(s / FROM.s, e);
          gsap.set(rig, { scale: s2, x: 960 - o.x - s2 * (c2x - o.x), y: 540 - o.y - s2 * (c2y - o.y), rotation: lerp(FROM.rot, 0, e) });
        }
      };
      const upd = { onUpdate: render, immediateRender: false };

      measure();
      if (window.ScrollTrigger) window.ScrollTrigger.addEventListener('refreshInit', measure);
      window.addEventListener('resize', () => { measure(); render(); });

      // 1) push into the shaft (continues straight from the existing zoom-in)
      tl.fromTo(L, { push: 0 }, { push: 1, duration: T.push1 - T.push0, ease: 'power2.inOut', ...upd }, T.push0);
      // 2) five stops, four upward legs
      let t = T.rideStart;
      T.stops.forEach((s, i) => {
        const last = i === 4;
        tl.fromTo(L, { door: 0 }, { door: 1, duration: s * (last ? 0.34 : 0.28), ease: 'power2.inOut', ...upd }, t);
        if (!last) tl.fromTo(L, { door: 1 }, { door: 0, duration: s * 0.28, ease: 'power2.inOut', ...upd }, t + s * 0.72);
        t += s;
        if (!last) { tl.fromTo(L, { pos: i }, { pos: i + 1, duration: T.leg, ease: 'power2.inOut', ...upd }, t); t += T.leg; }
      });
      // 3) rise over the roof for the skyline shot, then the existing zoom-out takes over at T.topEnd
      tl.fromTo(L, { top: 0 }, { top: 1, duration: T.topDur, ease: 'power2.inOut', ...upd }, T.rideEnd);

      // stage headline of the building journey steps aside while the lift captions are on screen
      if (legacyCopy) {
        tl.fromTo(legacyCopy, { opacity: 1 }, { opacity: 0, duration: 0.02, ease: 'none', immediateRender: false }, T.push0 - 0.005);
        tl.fromTo(legacyCopy, { opacity: 0 }, { opacity: 1, duration: 0.04, ease: 'none', immediateRender: false }, T.topEnd + 0.01);
      }
    }
  };
})();
