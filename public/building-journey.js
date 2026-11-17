/* Restored AID camera-rig construction journey from the previous V60 website.
   The original detailed SVG scene is scrubbed across a long, 10-stage scroll timeline. */
(() => {
  const init = () => {
    const section = document.querySelector('.aid-legacy-journey');
    const rig = section?.querySelector('#camera-rig');
    if (!section || !rig || !window.gsap || !window.ScrollTrigger || section.dataset.ready === 'true') return;
    section.dataset.ready = 'true';
    const gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const title = section.querySelector('[data-legacy-stage-title]');
    const copy = section.querySelector('[data-legacy-stage-copy]');
    const progress = section.querySelector('[data-legacy-progress]');
    const stages = [
      ['SITE OVERVIEW','Surveying the site and establishing the construction footprint.'],
      ['EXCAVATION','Preparing the ground and forming the excavation.'],
      ['FOUNDATIONS','Installing piles, reinforcement and the foundation slab.'],
      ['STRUCTURAL FRAME','Raising the core, columns, beams and structural frame.'],
      ['FLOOR SLABS','Building the floor plates and defining the building levels.'],
      ['CORE & SERVICES','Revealing circulation, vertical cores and building services.'],
      ['FACADE INSTALLATION','Bringing the exterior envelope and architectural skin into place.'],
      ['INTERIORS','Introducing interior lighting and the sense of occupied space.'],
      ['LANDSCAPING','Completing the surrounding landscape and public realm.'],
      ['COMPLETION','Pulling back to reveal the completed conceptual building.']
    ];
    const clamp = (v, a=0, b=1) => Math.max(a, Math.min(b, v));
    const ease = v => v*v*(3-2*v);

    // Initial scene state mirrors the former GSAP build.
    gsap.set('#excavation-pit', { opacity: 0.1, scale: 0.9, transformOrigin: '960px 750px' });
    gsap.set('#excavator-01', { x: -60, opacity: 0 });
    gsap.set('#excavator-02', { x: 60, opacity: 0 });
    gsap.set('.pile-element', { scaleY: 0, transformOrigin: 'center bottom' });
    gsap.set('#foundation-rebar, #base-slab', { scaleX: 0, transformOrigin: 'center center' });
    gsap.set('#foundation-label', { opacity: 0, y: 20 });
    gsap.set('#concrete-core, .column-item', { scaleY: 0, transformOrigin: 'bottom center' });
    gsap.set('.beam-level', { scaleX: 0, transformOrigin: 'center center' });
    gsap.set('#bracing-group', { opacity: 0 });
    gsap.set('.floor-slab-item', { opacity: 0, y: 15 });
    gsap.set('#stair-flights, #elevator-shaft', { opacity: 0 });
    // The elevator cab waits at the ground-floor landing until the lift ride.
    gsap.set('#elevator-cab', { y: 120, opacity: 1 });
    gsap.set('#mep-services', { strokeDashoffset: 400, opacity: 0 });
    gsap.set('#mep-labels', { opacity: 0 });
    gsap.set('#facade-panels', { opacity: 0, scale: 0.98, transformOrigin: '960px 580px' });
    gsap.set('.fin-item', { opacity: 0, y: 20 });
    gsap.set('#layer-interiors', { opacity: 0 });
    gsap.set('#layer-landscaping', { opacity: 0, y: 30 });
    gsap.set('#target-crosshair', { opacity: 0.2, scale: 0.8, transformOrigin: 'center center' });
    gsap.set(rig, { scale: 0.65, x: 0, y: -180, rotation: 0, transformOrigin: '960px 540px' });

    // The lift ride is inserted after the existing zoom-in (.65-.695). Everything that used to come after it
    // (.87 onward: zoom-out, interiors, landscaping, pull-back) is shifted by O, so nothing else changes.
    const lift = window.AIDLift;
    const O = lift ? lift.timing.topEnd - .87 : 0;
    const D = 1 + O;                                   // total timeline length
    const ZEND = .87 + O;                              // where the existing zoom-out begins
    const origT = t => t < .65 ? t : t < ZEND ? .65 + (t - .65) * (.22 / (ZEND - .65)) : t - O; // map to the original stage timing

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: () => `top top+=${Math.max(0, document.querySelector('.site-header')?.getBoundingClientRect().height || 82)}`,
        end: 'bottom bottom',
        scrub: 1.2,
        invalidateOnRefresh: true,
        onUpdate: self => {
          const p = self.progress;
          const idx = Math.min(9, Math.floor(origT(p * D) * 10));
          if (title) title.textContent = stages[idx][0];
          if (copy) copy.textContent = stages[idx][1];
          if (progress) progress.style.transform = `scaleX(${p})`;
        }
      }
    });

    // 01 → 02: SITE OVERVIEW → EXCAVATION
    tl.to(rig, { scale: 1.05, x: -40, y: -60, rotation: -0.5, duration: .10, ease: 'power1.inOut' }, 0)
      .to('#site-boundary-box', { strokeOpacity: 1, duration: .05 }, .02)
      .to('#excavation-pit', { opacity: 1, scale: 1, duration: .08 }, .04)
      .to('#excavator-01', { x: 0, opacity: 1, duration: .06 }, .05)
      .to('#excavator-02', { x: 0, opacity: 1, duration: .06 }, .06);

    // 02 → 03: EXCAVATION → FOUNDATION
    tl.to(rig, { scale: 1.35, x: 0, y: 40, rotation: 0, duration: .10, ease: 'power1.inOut' }, .10)
      .to('.pile-element', { scaleY: 1, stagger: .008, duration: .06 }, .11)
      .to('#foundation-rebar', { scaleX: 1, duration: .06 }, .13)
      .to('#base-slab', { scaleX: 1, duration: .06 }, .15)
      .to('#foundation-label', { opacity: 1, y: 0, duration: .04 }, .17);

    // 03 → 04: FOUNDATION → STRUCTURAL FRAME
    tl.to(rig, { scale: 1.65, x: 80, y: -180, rotation: .5, duration: .10, ease: 'power1.inOut' }, .20)
      .to('#concrete-core', { scaleY: 1, duration: .08 }, .21)
      .to('.column-item', { scaleY: 1, stagger: .01, duration: .07 }, .23)
      .to('.beam-level', { scaleX: 1, stagger: .012, duration: .07 }, .25)
      .to('#bracing-group', { opacity: .8, duration: .05 }, .27)
      .to('#crane-left', { rotation: -5, transformOrigin: '0px 0px', duration: .08 }, .24);

    // 04 → 05: STRUCTURE → FLOOR SLABS
    tl.to(rig, { scale: 2.10, x: 0, y: -320, rotation: 0, duration: .10, ease: 'power1.inOut' }, .30)
      .to('.floor-slab-item', { opacity: 1, y: 0, stagger: .015, duration: .08, ease: 'back.out(1.2)' }, .31);

    // 05 → 06: CAMERA ENTERS THE BUILDING — CORE & SERVICES
    tl.to(rig, { scale: 2.45, x: -190, y: -115, rotation: 1.0, duration: .10, ease: 'power2.inOut' }, .40)
      .to('.column-item', { strokeOpacity: .3, duration: .05 }, .41)
      .to('#stair-flights', { opacity: 1, duration: .05 }, .42)
      .to('#elevator-shaft', { opacity: 1, duration: .05 }, .43)
      .to('#mep-services', { opacity: 1, strokeDashoffset: 0, duration: .06 }, .44)
      .to('#mep-labels', { opacity: 1, duration: .04 }, .46);

    // (The small cab now waits at the ground floor; the new lift ride below is its journey.)

    // 06 → 07: SERVICES → FACADE
    tl.to(rig, { scale: 1.95, x: 80, y: -180, rotation: -.3, duration: .10, ease: 'power2.out' }, .50)
      .to('#mep-labels', { opacity: 0, duration: .03 }, .50)
      .to('.column-item', { strokeOpacity: 1, duration: .04 }, .51)
      .to('#facade-panels', { opacity: 1, scale: 1, duration: .08 }, .52)
      .to('.fin-item', { opacity: 1, y: 0, stagger: .003, duration: .04 }, .54);

    // Once the exterior is built, push into the finished structure for the full lift ride.
    tl.to(rig, { scale: 3.80, x: -320, y: -120, rotation: 1.2, duration: .045, ease: 'power2.inOut' }, .65);

    // IN-BUILDING LIFT RIDE: push into the shaft, follow the cabin through five floors, rooftop reveal.
    if (lift) lift.build({ gsap, tl, rig, section });

    // 07 → 08: FACADE → INTERIOR LIGHTING
    tl.to(rig, { scale: 1.25, x: 80, y: 80, rotation: 0, duration: .08, ease: 'power1.inOut' }, .87 + O)
      .to('#layer-interiors', { opacity: 1, duration: .08, ease: 'power2.in' }, .89 + O)
      .to('#facade-panels rect', { fillOpacity: .5, duration: .08 }, .89 + O);

    // 08 → 09: INTERIORS → LANDSCAPING
    tl.to('#layer-landscaping', { opacity: 1, y: 0, duration: .08 }, .92 + O)
      .to('#cranes-group', { opacity: .2, duration: .06 }, .93 + O);

    // 09 → 10: PULL BACK TO THE COMPLETED BUILDING
    tl.to(rig, { scale: 1.00, x: 0, y: 0, rotation: 0, duration: .05, ease: 'power2.out' }, .95 + O)
      .to('#target-crosshair', { opacity: .1, duration: .04 }, .96 + O)
      .to('#layer-sky', { filter: 'brightness(1.1)', duration: .04 }, .96 + O);


    if (reducedMotion) {
      if (tl.scrollTrigger) tl.scrollTrigger.kill();   // otherwise the scrub tween re-seeks the timeline back to 0
      tl.progress(1).pause();
      if (title) title.textContent = stages[9][0];
      if (copy) copy.textContent = stages[9][1];
      if (progress) progress.style.transform = 'scaleX(1)';
      section.classList.add('is-reduced-motion');
    }
    requestAnimationFrame(() => window.ScrollTrigger.refresh());
    window.addEventListener('load', () => window.ScrollTrigger.refresh(), { once: true });
  };
  window.AIDBuildingJourneyInit = init;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
