
/* ==========================================================================
   AID — motion layer (v3)
   Text, background, scroll-reveal and scroll-linked animation for all pages.

   - Does not modify construction, lift or company journey animations.
   - Respects prefers-reduced-motion.
   - Uses IntersectionObserver + viewport scanning for reliable reveals.
   - Supports React Router page changes.
   - Prevents duplicate global event listeners.
   ========================================================================== */

(() => {
  'use strict';

  if (window.__aidMotion) return;
  window.__aidMotion = true;

  const root = document.documentElement;

  const rm = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false };

  let supported = false;

  try {
    supported = !!(
      window.IntersectionObserver &&
      window.CSS &&
      CSS.supports &&
      CSS.supports('translate', '0 0') &&
      CSS.supports('clip-path', 'inset(0)')
    );
  } catch (e) {
    /* unsupported */
  }

  if (rm.matches || !supported) {
    root.classList.remove('m-pre');
    return;
  }

  /* ---------- helpers ---------------------------------------------------- */

  const $ = (s, c) =>
    Array.from((c || document).querySelectorAll(s));

  const clamp = (v, a, b) =>
    Math.min(b, Math.max(a, v));

  const EX =
    '#construction-journey,.aid-legacy-journey,.aid-lift-journey,.company-journey,.site-header,[data-no-motion]';

  const SKIP =
    EX + ',.project-detail-panel,.form-result,.no-results';

  const CONTAINER =
    '[data-m="pop"],[data-m="slide"],[data-m="curtain"],[data-m="row"]';

  const page = () =>
    ((location.pathname.split('/').pop() || 'index.html')
      .replace(/\.html?$/, '')) || 'index';

  const S = {
    io: null,
    live: null,
    targets: [],
    scrubs: [],
    raf: 0,
    fired: false,
    off: false,
    timer: 0,
    mo: [],
    listenersBound: false,
    routeObserver: null
  };

  const blocked = (el) =>
    !!(el && el.closest(SKIP));

  const covered = (el) =>
    !!(
      el.parentElement &&
      el.parentElement.closest(CONTAINER)
    );

  const mark = (el, type, o) => {
    o = o || {};

    if (
      !el ||
      el.hasAttribute('data-m') ||
      blocked(el)
    ) {
      return false;
    }

    if (type !== 'head' && covered(el)) {
      return false;
    }

    el.setAttribute('data-m', type);

    if (o.dir) {
      el.setAttribute('data-dir', o.dir);
    }

    if (o.d != null) {
      el.style.setProperty('--d', o.d + 'ms');
    }

    S.targets.push(el);

    return true;
  };

  const markAll = (sel, type, o) =>
    $(sel).filter((el) => mark(el, type, o));

  /* Stagger siblings by their column. */

  const stagger = (items, step) => {
    const vis = items.filter(
      (e) => e.getClientRects().length
    );

    let cols = 1;

    if (vis.length > 1) {
      const t0 = vis[0].getBoundingClientRect().top;

      cols =
        vis.filter(
          (e) =>
            Math.abs(
              e.getBoundingClientRect().top - t0
            ) < 8
        ).length || 1;
    }

    items.forEach((e) => {
      const k = vis.indexOf(e);

      e.style.setProperty(
        '--d',
        (k < 0 ? 0 : (k % cols) * step) + 'ms'
      );
    });
  };

  const staggerGroups = (els, step) => {
    const groups = new Map();

    els.forEach((e) => {
      const p = e.parentElement;

      if (!groups.has(p)) {
        groups.set(p, []);
      }

      groups.get(p).push(e);
    });

    groups.forEach((g) => stagger(g, step));
  };

  /* ---------- text: word-by-word masked headline ------------------------- */

  const split = (el) => {
    let i = 0;

    const label = el.textContent
      .replace(/\s+/g, ' ')
      .trim();

    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();

          n.textContent.split(/(\s+)/).forEach((p) => {
            if (!p) return;

            if (/^\s+$/.test(p)) {
              frag.appendChild(
                document.createTextNode(' ')
              );
              return;
            }

            const w = document.createElement('span');
            const wi = document.createElement('span');

            w.className = 'm-w';
            wi.className = 'm-wi';

            wi.textContent = p;

            wi.style.setProperty('--i', i++);

            w.appendChild(wi);
            frag.appendChild(w);
          });

          node.replaceChild(frag, n);

        } else if (
          n.nodeType === 1 &&
          !/^(br|svg|img|script)$/i.test(n.nodeName)
        ) {
          walk(n);
        }
      });
    };

    walk(el);

    el.setAttribute('aria-label', label);
  };

  /* ---------- count-up --------------------------------------------------- */

  const COUNT =
    '.stats-inline strong,.projects-highlight strong,.fleet-spec-grid strong';

  const countUp = (el) => {
    if (el.dataset.counted) return;

    el.dataset.counted = '1';

    const tn = Array.from(el.childNodes).find(
      (n) =>
        n.nodeType === 3 &&
        /\d/.test(n.textContent)
    );

    if (!tn) return;

    const m = tn.textContent.match(
      /^(\s*)(\d[\d,]*)([\s\S]*)$/
    );

    if (!m) return;

    const target = parseInt(
      m[2].replace(/,/g, ''),
      10
    );

    if (!isFinite(target) || target < 2) return;

    const comma = m[2].indexOf(',') > -1;

    const fmt = (n) =>
      comma ? n.toLocaleString('en-US') : String(n);

    const t0 = performance.now();
    const dur = 1500;

    const step = (now) => {
      if (S.off) {
        tn.textContent = m[0];
        return;
      }

      const t = clamp(
        (now - t0) / dur,
        0,
        1
      );

      const e = 1 - Math.pow(1 - t, 3);

      tn.textContent =
        t < 1
          ? m[1] + fmt(Math.round(target * e)) + m[3]
          : m[0];

      if (t < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  };

  /* ---------- reliable reveal engine ------------------------------------ */

  const reveal = (el, instant) => {
    if (
      !el ||
      !el.isConnected ||
      el.classList.contains('is-in')
    ) {
      return;
    }

    el.classList.add('is-in');

    if (el.matches('.page-cta')) {
      el.classList.add('cta-in');
    }

    if (S.io) {
      S.io.unobserve(el);
    }

    $(
      COUNT,
      el.matches(COUNT) ? el.parentElement : el
    ).forEach((c) => {
      if (instant) {
        c.dataset.counted = '1';
        return;
      }

      const d =
        parseFloat(
          getComputedStyle(
            c.closest('[data-m]') || c
          ).getPropertyValue('--d')
        ) || 0;

      setTimeout(() => countUp(c), d + 250);
    });
  };

  const revealAll = (instant) => {
    $('[data-m]:not(.is-in)').forEach((el) => {
      if (!blocked(el)) {
        reveal(el, instant !== false);
      }
    });
  };

  /*
   * Scan all animated elements.
   *
   * This is important because the original implementation only
   * checked S.targets. This version also checks elements that
   * may have been missed or inserted after initial initialization.
   */

  const scanVisibleElements = () => {
    if (S.off) return;

    const vh =
      window.innerHeight ||
      document.documentElement.clientHeight;

    $('[data-m]:not(.is-in)').forEach((el) => {
      if (!el.isConnected || blocked(el)) return;

      const rect = el.getBoundingClientRect();

      // Trigger only when the element enters the lower
      // 85% of the visible viewport.
      const shouldReveal =
        rect.top < vh * 0.85 &&
        rect.bottom > 0;

      if (shouldReveal) {
        reveal(el);
      }
    });
  };

  /* ---------- per-page hero line art (inline SVG) ------------------------ */

  const P = (d, k) =>
    '<path class="m-s" pathLength="1" style="--k:' +
    (k || 0) +
    '" d="' +
    d +
    '"/>';

  const svg = (inner) =>
    '<svg class="m-art" data-live viewBox="0 0 520 420" fill="none" stroke="currentColor" stroke-width="1.5" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    inner +
    '</svg>';

  const ART = {

    /* tower crane beside a rising frame */

    company: () =>
      svg(
        P('M20 400H500', 0) +
        P('M140 400V70M160 400V70', 1) +
        P('M140 400L160 370L140 340L160 310L140 280L160 250L140 220L160 190L140 160L160 130L140 100L160 70', 2) +
        '<g class="m-jib m-idle">' +
        P('M40 70H470', 3) +
        P('M150 40L470 70M150 40L40 70M150 40V70', 4) +
        P('M130 70V52H170V70', 5) +
        P('M40 70V92H78V70', 6) +
        P('M250 70V150', 7) +
        '<g class="m-load m-idle">' +
        P('M236 150h28v22h-28z', 8) +
        '</g>' +
        '</g>' +
        P('M300 400V240M360 400V240M420 400V240', 9) +
        P('M300 240H420M300 280H420M300 320H420M300 360H420', 10) +
        '<g class="m-win m-f"><path d="M308 380H412M308 340H412M308 300H412M308 260H412"/></g>'
      ),

    /* excavator digging cycle */

    capabilities: () =>
      svg(
        P('M20 400H500', 0) +
        P('M40 400Q85 366 130 400', 1) +
        P('M300 360H460Q482 380 460 400H300Q278 380 300 360Z', 2) +
        P('M320 380m-12 0a12 12 0 1 0 24 0a12 12 0 1 0-24 0M380 380m-12 0a12 12 0 1 0 24 0a12 12 0 1 0-24 0M440 380m-12 0a12 12 0 1 0 24 0a12 12 0 1 0-24 0', 3) +
        P('M320 360V300H400V360M340 300V268H400V300M400 330H452V360', 4) +
        '<g class="m-win m-f"><path d="M350 284H392"/></g>' +
        '<g class="m-boom m-idle">' +
        P('M296 338L230 256L238 248L306 330Z', 5) +
        '<g class="m-stick m-idle">' +
        P('M230 250L141 319L149 328L238 258Z', 6) +
        '<g class="m-bucket m-idle">' +
        P('M145 323L118 340L124 364L156 358L168 334Z', 7) +
        '</g>' +
        '</g>' +
        '</g>'
      ),

    /* skyline whose windows switch on */

    projects: () => {
      const b = [
        [40, 60, 150],
        [110, 50, 230],
        [170, 80, 110],
        [260, 60, 280],
        [330, 70, 190],
        [410, 50, 140]
      ];

      let s = P('M20 400H500', 0);
      let w = '';
      let k = 0;

      b.forEach((q, bi) => {
        const x = q[0];
        const wd = q[1];
        const y = 400 - q[2];

        s += P(
          'M' + x + ' 400V' + y + 'H' + (x + wd) + 'V400',
          bi + 1
        );

        if (bi % 2 === 0) {
          s += P(
            'M' + (x + wd / 2) + ' ' + y +
            'V' + (y - 18),
            bi + 1
          );
        }

        for (let yy = y + 16; yy < 388; yy += 22) {
          for (
            let xx = x + 10;
            xx < x + wd - 8;
            xx += 18
          ) {
            w +=
              '<rect class="m-lit" style="--b:' +
              ((k++ * 7) % 11) +
              '" x="' +
              xx +
              '" y="' +
              yy +
              '" width="8" height="8" fill="#f47721" stroke="none"/>';
          }
        }
      });

      return svg(s + '<g class="m-f">' + w + '</g>');
    },

    /* a steady climb */

    careers: () =>
      svg(
        P('M30 400H520', 0) +
        P('M30 400V370H100V338H170V306H240V274H310V242H380V210H450V178H520', 1) +
        P('M100 370V400M170 338V400M240 306V400M310 274V400M380 242V400M450 210V400', 2) +
        P('M485 170V118', 3) +
        P('M485 118H512L498 130L512 142H485', 4) +
        '<g class="m-f"><circle class="m-climb m-idle" r="7" fill="#f47721" stroke="none"/></g>'
      ),

    /* topographic map with a pinned office */

    contact: () => {
      let c = '';

      for (let i = 0; i < 6; i++) {
        c +=
          '<ellipse cx="302" cy="228" rx="' +
          (38 + i * 36) +
          '" ry="' +
          (24 + i * 24) +
          '" transform="rotate(-14 302 228)" class="m-s" pathLength="1" style="--k:' +
          i +
          '"/>';
      }

      c +=
        '<ellipse cx="120" cy="320" rx="54" ry="30" transform="rotate(10 120 320)" class="m-s" pathLength="1" style="--k:6"/>';

      c +=
        '<ellipse cx="120" cy="320" rx="26" ry="14" transform="rotate(10 120 320)" class="m-s" pathLength="1" style="--k:7"/>';

      return svg(
        c +
        '<g class="m-f">' +
        '<path class="m-flow" d="M60 380C140 350 190 270 302 228" stroke="#f47721" stroke-dasharray="6 6"/>' +
        '<circle class="m-pulse m-idle" cx="302" cy="228" r="5" stroke="#f47721"/>' +
        '<circle cx="302" cy="228" r="5" fill="#f47721" stroke="none"/>' +
        '</g>'
      );
    }
  };

  /* ---------- final CTA skyline ------------------------------------------ */

  const skyMarkup = () => {
    const b = [
      [0, 70, 150],
      [80, 56, 230],
      [146, 90, 120],
      [246, 64, 200],
      [320, 76, 260],
      [404, 50, 160]
    ];

    let windows = '';
    let windowIndex = 0;

    b.forEach((q) => {
      const x = q[0];
      const width = q[1];
      const height = q[2];
      const top = 300 - height;

      const columns = width >= 70 ? 3 : 2;
      const rows = Math.max(
        2,
        Math.floor((height - 24) / 25)
      );

      const cellWidth = 6;
      const gap =
        (width - columns * cellWidth) /
        (columns + 1);

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
          const wx =
            x + gap + col * (cellWidth + gap);

          const wy =
            top + 12 + row * ((height - 24) / rows);

          windows +=
            '<rect class="m-sky-window" style="--w:' +
            windowIndex++ +
            '" x="' +
            wx +
            '" y="' +
            wy +
            '" width="' +
            cellWidth +
            '" height="7" rx="0.5"/>';
        }
      }
    });

    return (
      '<svg class="m-sky" data-m="sky" viewBox="0 0 470 340" aria-hidden="true" focusable="false">' +
      '<g class="m-sky-buildings">' +
      b.map((q, i) =>
        '<rect class="m-bar" style="--n:' +
        i +
        '" x="' +
        q[0] +
        '" y="' +
        (300 - q[2]) +
        '" width="' +
        q[1] +
        '" height="' +
        q[2] +
        '" fill="#fff"/>'
      ).join('') +
      '</g>' +
      '<g class="m-sky-windows">' +
      windows +
      '</g>' +
      '<g class="m-sky-infrastructure">' +
      '<path class="m-sky-road" d="M0 301H470"/>' +
      '<path class="m-sky-road-detail" d="M0 316H470"/>' +
      '<path class="m-sky-road-marking" d="M18 308H88M125 308H195M232 308H302M339 308H409"/>' +
      '<path class="m-sky-connection" d="M35 301V332M435 301V332M0 332H470"/>' +
      '</g>' +
      '</svg>'
    );
  };

  /* ---------- scroll-linked engine --------------------------------------- */

  const hdr = document.querySelector('.site-header');

  let hero = null;

  const rows = [];

  const addScrub = (el, type, o) => {
    if (!el || blocked(el)) return;

    el.setAttribute('data-scrub', type);

    S.scrubs.push(
      Object.assign(
        { el: el, type: type },
        o || {}
      )
    );
  };

  const tick = () => {
    S.raf = 0;

    if (S.off) return;

    const vh = window.innerHeight;
    const y = window.pageYOffset || 0;

    // Reveal elements as they approach the viewport.
    scanVisibleElements();

    if (hdr) {
      hdr.classList.toggle('is-scrolled', y > 8);
    }

    // Hero parallax.
    if (hero) {
      const r = hero.getBoundingClientRect();

      if (r.bottom > -60) {
        const p = clamp(
          -r.top / Math.max(r.height, 1),
          0,
          1
        );

        hero.style.setProperty(
          '--hy',
          (p * 28).toFixed(1) + 'px'
        );

        hero.style.setProperty(
          '--ay',
          (p * 56).toFixed(1) + 'px'
        );

        hero.style.setProperty(
          '--mp',
          (
            p *
            (hero.classList.contains('home-section') ? 30 : 40)
          ).toFixed(1) + 'px'
        );
      }
    }

    // Scroll-linked elements.
    S.scrubs.forEach((s) => {
      if (!s.el.isConnected) return;

      const r = s.el.getBoundingClientRect();

      if (r.bottom < -150 || r.top > vh + 150) return;

      if (s.type === 'rule') {
        s.el.style.setProperty(
          '--rp',
          clamp(
            (vh * 0.92 - r.top) / (vh * 0.3),
            0,
            1
          ).toFixed(3)
        );

      } else if (s.type === 'parallax') {
        const p = clamp(
          ((r.top + r.height / 2) - vh / 2) / vh,
          -1,
          1
        );

        s.el.style.setProperty(
          '--py',
          (p * r.height * 0.065).toFixed(1) + 'px'
        );

      } else if (s.type === 'drift') {
        const p = clamp(
          ((r.top + r.height / 2) - vh / 2) / vh,
          -1,
          1
        );

        s.el.style.setProperty(
          '--dx',
          (p * s.speed).toFixed(1) + 'px'
        );
      }
    });

    // Active fleet row.
    if (rows.length) {
      let best = null;
      let bd = Infinity;

      rows.forEach((el) => {
        if (!el.isConnected) return;

        const r = el.getBoundingClientRect();

        const d = Math.abs(
          r.top + r.height / 2 - vh * 0.5
        );

        if (d < bd) {
          bd = d;
          best = el;
        }
      });

      rows.forEach((el) => {
        el.classList.toggle(
          'is-active',
          el === best && bd < vh * 0.28
        );
      });
    }

    // Short pages and anchor navigation safety.
    if (
      vh + y >=
      document.documentElement.scrollHeight - 4
    ) {
      revealAll(true);
    }
  };

  const schedule = () => {
    if (!S.raf && !S.off) {
      S.raf = requestAnimationFrame(tick);
    }
  };

  /* ---------- filter replay (projects) ----------------------------------- */

  const watchFilters = () => {
    if (!window.MutationObserver) return;

    $('.client-project-grid,.home-project-grid').forEach((grid) => {
      let queued = false;

      const mo = new MutationObserver(() => {
        if (queued) return;

        queued = true;

        requestAnimationFrame(() => {
          queued = false;

          if (S.off) return;

          const cards = $(
            '[data-m="pop"]',
            grid
          ).filter(
            (c) => !c.hidden && c.getClientRects().length
          );

          stagger(cards, 70);

          cards.forEach((c) => {
            c.classList.remove('is-in');
          });

          void grid.offsetWidth;

          cards.forEach((c) => {
            c.classList.add('is-in');
          });
        });
      });

      mo.observe(grid, {
        subtree: true,
        attributes: true,
        attributeFilter: ['hidden']
      });

      S.mo.push(mo);
    });
  };

  /* ---------- off switch ------------------------------------------------- */

  const disable = () => {
    S.off = true;

    clearTimeout(S.timer);

    if (S.raf) {
      cancelAnimationFrame(S.raf);
      S.raf = 0;
    }

    if (S.io) S.io.disconnect();
    if (S.live) S.live.disconnect();

    S.mo.forEach((m) => m.disconnect());

    if (S.routeObserver) {
      S.routeObserver.disconnect();
      S.routeObserver = null;
    }

    root.classList.remove(
      'js-motion',
      'm-pre'
    );

    $('.m-art,.m-sky').forEach((e) => e.remove());
  };

  /* ---------- init ------------------------------------------------------- */

  const init = () => {

    S.io = new IntersectionObserver((entries) => {
      S.fired = true;

      entries.forEach((e) => {
        if (e.isIntersecting) {
          reveal(e.target);
        }
      });

    }, {
      threshold: 0,
      rootMargin: '0px 0px -15% 0px'
    });

    S.live = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        e.target.classList.toggle(
          'is-live',
          e.isIntersecting
        );
      });

    }, {
      threshold: 0,
      rootMargin: '120px 0px'
    });

    // Detect dynamically inserted React content.
    if (!S.routeObserver && window.MutationObserver) {
      S.routeObserver = new MutationObserver(() => {
        schedule();
      });

      S.routeObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    /* 1 · hero: sequenced entrance */

    $('.home-content,.page-hero').forEach((h) => {
      if (blocked(h)) return;

      let n = 0;

      Array.from(h.children).forEach((c) => {
        if (/^(script|style|svg)$/i.test(c.tagName)) {
          return;
        }

        const d = 80 + n++ * 110;

        if (/^h[12]$/i.test(c.tagName)) {
          if (mark(c, 'head', { d: d })) {
            split(c);
          }

        } else if (mark(c, 'rise', { d: d })) {
          $('h1,h2', c).forEach((hh) => {
            if (mark(hh, 'head', { d: d })) {
              split(hh);
            }
          });
        }
      });
    });

    /* 2 · containers */

    const pops = markAll(
      '.sector-card,.values-grid>*,.fleet-spec-grid>*,.client-project-card,.home-project-card,.stats-inline>*,.projects-highlight',
      'pop'
    );

    markAll('.company-index-art', 'pop');

    staggerGroups(pops, 100);

    $('.contact-static').forEach((s) => {
      Array.from(s.children).forEach((c, i) => {
        mark(c, 'slide', {
          dir: i === 0 ? 'left' : 'right',
          d: i * 120
        });
      });
    });

    $('.upcoming-card').forEach((c, i) => {
      mark(c, 'slide', {
        dir: i % 2 === 0 ? 'left' : 'right',
        d: 0
      });
    });

    $('.fleet-row,.location-list>div').forEach((r) => {
      if (mark(r, 'row', { d: 0 })) {
        r.setAttribute('data-rule', 'bottom');
        addScrub(r, 'rule');
      }
    });

    $('.fleet-row').forEach((r) => rows.push(r));

    staggerGroups(
      $('[data-m="row"]'),
      70
    );

    $('.vertical-detail').forEach((vd, i) => {
      const img = vd.querySelector('.vertical-image');

      if (!img) return;

      const left = !(i % 2);

      if (
        mark(img, 'curtain', {
          dir: left ? 'left' : 'right'
        })
      ) {
        addScrub(img, 'parallax');
      }
    });

    $('.page-two-col>img,.page-two-col>video').forEach((m) => {
      const second =
        m === m.parentElement.children[1];

      mark(m, 'curtain', {
        dir: second ? 'right' : 'left'
      });
    });

    /* 3 · display type and text */

    markAll('h1,h2', 'head').forEach(split);

    markAll('.section-top', 'rise');

    markAll(
      '.eyebrow,.mini-label,.intro-lede,.page-lede,.content-note,.project-disclaimer,.portfolio-data-note,' +
      '.project-tools,.home-actions,.home-meta,.home-bottom,.careers-note,.leader-placeholder,' +
      '.button-primary,.button-dark,.text-link,.arrow-link,main p',
      'rise'
    );

    $('.careers-values').forEach((v) => {
      Array.from(v.children).forEach((c, i) => {
        mark(c, 'rise', { d: i * 110 });
      });
    });

    $('.site-footer').forEach((f) => {
      mark(f, 'rise', { d: 0 });
    });

    /* Careers display type */

    $('.careers-mark').forEach((m) => {
      Array.from(m.children).forEach((c, i) => {
        if (
          mark(c, 'wipe', { d: i * 160 })
        ) {
          addScrub(c, 'drift', {
            speed: [70, -70, 70][i % 3]
          });
        }
      });
    });

    $('.careers-note').forEach((e) => {
      if (!e.hasAttribute('data-scrub')) {
        e.setAttribute('data-rule', 'top');
        addScrub(e, 'rule');
      }
    });

    /* 4 · line art, CTA skyline, backgrounds */

    hero =
      document.querySelector('.page-hero') ||
      document.querySelector('.home-section');

    if (
      hero &&
      ART[page()] &&
      hero.classList.contains('page-hero') &&
      !hero.querySelector('.m-art')
    ) {
      hero.insertAdjacentHTML(
        'beforeend',
        ART[page()]()
      );

      const art = hero.lastElementChild;

      art.setAttribute('data-m', 'draw');

      S.targets.push(art);

      S.live.observe(art);
    }

    $('.page-cta').forEach((c) => {
      if (blocked(c)) return;

      if (!c.querySelector('.m-sky')) {
        c.insertAdjacentHTML(
          'beforeend',
          skyMarkup()
        );
      }

      const sky = c.querySelector('.m-sky');

      if (sky && !S.targets.includes(sky)) {
        S.targets.push(sky);
      }

      mark(c, 'cta');
    });

    const bg = (sel, kind) => {
      $(sel).forEach((el) => {
        if (
          el.matches(EX) ||
          el.querySelector(EX) ||
          el.hasAttribute('data-bg')
        ) {
          return;
        }

        el.setAttribute('data-bg', kind);
        el.setAttribute('data-live', '');

        S.live.observe(el);
      });
    };

    bg('.page-hero', 'grid');
    bg('.fleet-strip,.page-cta', 'grid-light');

    bg(
      '.company-profile,.company-section,.capabilities-section,.careers-section,.locations-section,.home-client-projects',
      'dots'
    );

    bg(
      '.projects-section,.upcoming-section,.client-portfolio-section',
      'hatch'
    );

    bg('.sustainability-section', 'glow');

    /* 5 · scroll cue arrow */

    $('.home-bottom').forEach((hb) => {
      if (blocked(hb)) return;

      const w = document.createTreeWalker(
        hb,
        NodeFilter.SHOW_TEXT
      );

      const nodes = [];

      while (w.nextNode()) {
        nodes.push(w.currentNode);
      }

      nodes.forEach((n) => {
        const i = n.textContent.indexOf('↓');

        if (i < 0) return;

        const f = document.createDocumentFragment();

        const a = n.textContent.slice(0, i);
        const b = n.textContent.slice(i + 1);

        const el = document.createElement('i');

        el.className = 'm-bob';
        el.textContent = '↓';

        if (a) {
          f.appendChild(document.createTextNode(a));
        }

        f.appendChild(el);

        if (b) {
          f.appendChild(document.createTextNode(b));
        }

        n.parentNode.replaceChild(f, n);
      });
    });

    /* 6 · activate animation states */

    root.classList.add('js-motion');
    root.classList.remove('m-pre');

    S.targets.forEach((t) => {
      if (t.isConnected) {
        S.io.observe(t);
      }
    });

    watchFilters();

    // Global listeners are registered only once.
    if (!S.listenersBound) {
      window.addEventListener(
        'scroll',
        schedule,
        { passive: true }
      );

      window.addEventListener(
        'resize',
        schedule,
        { passive: true }
      );

      window.addEventListener(
        'pageshow',
        schedule
      );

      document.addEventListener('focusin', (e) => {
        const t =
          e.target.closest &&
          e.target.closest('[data-m]:not(.is-in)');

        if (t) {
          reveal(t, true);
        }
      });

      S.listenersBound = true;
    }

    schedule();

    // Fallback: reveal only currently visible elements.
    // Never reveal every section together just because a timer expired.
    S.timer = setTimeout(() => {
      if (!S.off) {
        scanVisibleElements();
      }
    }, 500);

    /* Layout shifts after fonts load */

    const after = () => {
      schedule();

      try {
        if (
          window.ScrollTrigger &&
          typeof ScrollTrigger.refresh === 'function'
        ) {
          ScrollTrigger.refresh();
        }
      } catch (e) {
        /* ignore */
      }
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(after);
    }

    window.addEventListener(
      'load',
      after,
      { once: true }
    );
  };

  /* ---------- boot ------------------------------------------------------- */

  const boot = () => {
    try {
      init();

    } catch (err) {
      if (window.console) {
        console.error(
          '[aid-motion] disabled:',
          err
        );
      }

      disable();
    }
  };

  /* ---------- React Router route refresh ------------------------------- */

  const refreshForRoute = () => {
    if (S.off || rm.matches || !supported) {
      return;
    }

    if (S.io) {
      S.io.disconnect();
    }

    if (S.live) {
      S.live.disconnect();
    }

    S.mo.forEach((observer) => {
      observer.disconnect();
    });

    S.mo = [];

    if (S.routeObserver) {
      S.routeObserver.disconnect();
      S.routeObserver = null;
    }

    clearTimeout(S.timer);

    if (S.raf) {
      cancelAnimationFrame(S.raf);
      S.raf = 0;
    }

    S.targets = [];
    S.scrubs = [];

    rows.length = 0;

    hero = null;

    S.fired = false;
    S.io = null;
    S.live = null;

    requestAnimationFrame(() => {
      try {
        init();

      } catch (err) {
        if (window.console) {
          console.error(
            '[aid-motion] route refresh failed:',
            err
          );
        }

        disable();
      }
    });
  };

  window.AIDMotionRefresh = refreshForRoute;

  /* ---------- reduced motion changes ------------------------------------ */

  if (rm.addEventListener) {
    rm.addEventListener('change', (e) => {
      if (e.matches) {
        disable();
      }
    });
  }

  /* ---------- start ------------------------------------------------------ */

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      boot,
      { once: true }
    );
  } else {
    boot();
  }

})();
