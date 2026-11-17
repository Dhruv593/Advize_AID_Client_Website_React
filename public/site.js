(() => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  if (toggle && nav && !toggle.dataset.aidBound) {
    toggle.dataset.aidBound = 'true';
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    nav.addEventListener('click', event => {
      if (event.target.closest('a')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open navigation');
      }
    });
  }
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

  const contactForm = document.querySelector('[data-contact-form]');
  if (contactForm) {
    const params = new URLSearchParams(location.search);
    const interest = params.get('interest') || params.get('project') || '';
    const names = {
      residential: 'Residential development', commercial: 'Commercial development', industrial: 'Industrial development',
      infrastructure: 'Infrastructure development', careers: 'Careers / expression of interest',
      'mall-of-lubumbashi': 'Mall of Lubumbashi', 'university-campus': 'University Campus'
    };
    const select = contactForm.querySelector('[name="interest"]');
    if (select && names[interest]) select.value = names[interest];
    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      if (!contactForm.reportValidity()) return;
      const result = document.querySelector('[data-form-result]');
      if (result) {
        result.hidden = false;
        result.innerHTML = '<strong>Form validation complete.</strong><p>Your details passed browser validation. This prototype does not send or store submissions. Connect AID’s approved email or CRM endpoint before launch.</p>';
        result.scrollIntoView({behavior:'smooth', block:'nearest'});
      }
    });
  }

  const projectArea = document.querySelector('[data-projects]');
  if (projectArea) {
    const input = projectArea.querySelector('[data-project-search]');
    const filterButtons = [...projectArea.querySelectorAll('[data-project-filter]')];
    const cards = [...projectArea.querySelectorAll('[data-project-card]')];
    const empty = projectArea.querySelector('[data-no-results]');
    let active = 'all';
    const apply = () => {
      const q = (input?.value || '').trim().toLowerCase();
      let visible = 0;
      cards.forEach(card => {
        const type = card.dataset.type || '';
        const text = (card.dataset.search || card.textContent).toLowerCase();
        const ok = (active === 'all' || active === type) && text.includes(q);
        card.hidden = !ok;
        if (ok) visible++;
      });
      if (empty) empty.hidden = visible > 0;
    };
    input?.addEventListener('input', apply);
    filterButtons.forEach(button => button.addEventListener('click', () => {
      active = button.dataset.projectFilter;
      filterButtons.forEach(b => { const chosen = b === button; b.classList.toggle('selected', chosen); b.setAttribute('aria-pressed', String(chosen)); });
      apply();
    }));
    apply();

    const params = new URLSearchParams(location.search);
    const project = params.get('project');
    const details = {
      'golf-villa': { title:'Golf Villa', size:'Not supplied', type:'Residential', image:'images/client-projects/golf-villa.webp', text:'A residential project visual collection supplied by AID. Location, scope, delivery status, dates and approved project description are to be confirmed.' },
      'guest-house': { title:'Guest House', size:'Not supplied', type:'Residential', image:'images/client-projects/guest-house.webp', text:'A guest-house visual collection supplied by AID. Location, scope, delivery status, dates and approved project description are to be confirmed.' },
      'residential-tower': { title:'Residential Tower', size:'Not supplied', type:'Residential', image:'images/client-projects/residential-tower.webp', text:'A residential tower visual collection supplied by AID. Location, scope, delivery status, dates and approved project description are to be confirmed.' },
      'mall-of-lubumbashi': { title:'Mall of Lubumbashi', size:'20,000 sqm stated in proposal', type:'Retail · Leisure', image:'images/client-projects/mall-of-lubumbashi.webp', text:'The August 2026 proposal identifies Mall of Lubumbashi as an upcoming development of 20,000 sqm. Current status, programme, location details, approved renderings and timeline require confirmation.' },
      'hospital': { title:'Hospital', size:'Not supplied', type:'Healthcare / Institutional', image:'images/client-projects/hospital.webp', text:'A hospital visual collection supplied by AID. Location, scope, delivery status, dates and approved project description are to be confirmed.' },
      'palais-de-justice': { title:'Palais de Justice', size:'Not supplied', type:'Civic / Institutional', image:'images/client-projects/palais-de-justice.webp', text:'A Palais de Justice visual collection supplied by AID. Location, scope, delivery status, dates and approved project description are to be confirmed.' },
      'school': { title:'School', size:'Not supplied', type:'Education / Institutional', image:'images/client-projects/school.webp', text:'A school visual document was supplied by AID as a PDF. The project scope, location, delivery status and approved description are to be confirmed.' },
      'university': { title:'University', size:'18,000 sqm stated in proposal', type:'Education', image:'images/client-projects/university.webp', text:'The August 2026 proposal identifies a University Campus of 18,000 sqm as an upcoming development. Current status, programme, location details, approved renderings and timeline require confirmation.' },
      'university-campus': { title:'University Campus', size:'18,000 sqm stated in proposal', type:'Education', image:'images/client-projects/university.webp', text:'The August 2026 proposal identifies a University Campus of 18,000 sqm as an upcoming development. Current status, programme, location details, approved renderings and timeline require confirmation.' }
    };
    if (project && details[project]) {
      const d = details[project];
      const detail = document.querySelector('[data-project-detail]');
      if (detail) {
        detail.hidden = false;
        detail.querySelector('[data-detail-title]').textContent = d.title;
        detail.querySelector('[data-detail-size]').textContent = d.size;
        detail.querySelector('[data-detail-type]').textContent = d.type;
        detail.querySelector('[data-detail-text]').textContent = d.text;
        const detailImage = detail.querySelector('[data-detail-image]');
        if (detailImage) { detailImage.src = d.image; detailImage.alt = d.title + ' — client-supplied project visual'; }
        const kicker = detail.querySelector('[data-detail-kicker]');
        if (kicker) kicker.textContent = 'CLIENT-SUPPLIED PROJECT VISUAL · STATUS TO CONFIRM';
        const enquiry = detail.querySelector('[data-detail-contact]');
        if (enquiry) enquiry.href = 'contact.html?project=' + encodeURIComponent(project);
        detail.scrollIntoView({behavior:'auto', block:'start'});
      }
    }
  }

  const portfolio = document.querySelector('[data-client-project-grid]');
  if (portfolio) {
    const search = document.querySelector('[data-portfolio-search]');
    const filters = [...document.querySelectorAll('[data-portfolio-filter]')];
    const cards = [...portfolio.querySelectorAll('[data-client-project-card]')];
    let activeFilter = 'all';
    const applyPortfolioFilters = () => {
      const q = (search?.value || '').trim().toLowerCase();
      let visible = 0;
      cards.forEach(card => {
        const filter = card.dataset.filter || '';
        const text = (card.dataset.search || card.textContent).toLowerCase();
        const matchesFilter = activeFilter === 'all' || filter === activeFilter || card.dataset.sector === activeFilter;
        const matchesSearch = text.includes(q);
        card.hidden = !(matchesFilter && matchesSearch);
        if (!card.hidden) visible++;
      });
      const empty = document.querySelector('[data-portfolio-empty]');
      if (empty) empty.hidden = visible > 0;
    };
    search?.addEventListener('input', applyPortfolioFilters);
    filters.forEach(button => button.addEventListener('click', () => {
      activeFilter = button.dataset.portfolioFilter;
      filters.forEach(item => {
        const chosen = item === button;
        item.classList.toggle('selected', chosen);
        item.setAttribute('aria-pressed', String(chosen));
      });
      applyPortfolioFilters();
    }));
    applyPortfolioFilters();
  }

})();


// STEP 2 — Company Journey: scroll-linked milestone progression and direct navigation.

// STEP 2 — Company Journey: route-safe initialization.
(() => {
  const initCompanyJourney = () => {
    const root = document.querySelector('.company-journey');
    if (!root) return;

    // Prevent duplicate initialization on the same mounted section.
    if (root.dataset.journeyReady === 'true') return;
    root.dataset.journeyReady = 'true';

    const sticky = root.querySelector('.journey-sticky');
    const buttons = [...root.querySelectorAll('[data-milestone]')];
    const kicker = root.querySelector('#journey-kicker');
    const heading = root.querySelector('#company-journey-title');
    const description = root.querySelector('#journey-description');
    const copy = root.querySelector('.journey-copy');

    const milestones = [
      {
        label: 'MILESTONE 01',
        heading: 'Building the<br><em>groundwork.</em>',
        description: 'This space will tell the story of an important moment in AID’s development, using a client-approved date and milestone description.'
      },
      {
        label: 'MILESTONE 02',
        heading: 'Turning plans<br><em>into progress.</em>',
        description: 'Add a verified milestone describing a significant stage in AID’s growth, project delivery, or development capability.'
      },
      {
        label: 'MILESTONE 03',
        heading: 'Growing the<br><em>possibilities.</em>',
        description: 'Use this milestone to highlight an approved achievement, expansion, or development in the company’s story.'
      },
      {
        label: 'MILESTONE 04',
        heading: 'Looking toward<br><em>what comes next.</em>',
        description: 'Close the timeline with a confirmed milestone that connects AID’s experience to its future direction.'
      }
    ];

    let activeIndex = -1;
    let rafPending = false;
    let animationTimer;

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const setActive = (index, animate = true) => {
      index = Math.max(0, Math.min(milestones.length - 1, index));

      if (index === activeIndex) return;

      activeIndex = index;

      const item = milestones[index];

      buttons.forEach((button, buttonIndex) => {
        const active = buttonIndex === index;

        button.classList.toggle('is-active', active);

        if (active) {
          button.setAttribute('aria-current', 'step');
        } else {
          button.removeAttribute('aria-current');
        }
      });

      const year =
        buttons[index]?.querySelector('span')?.textContent?.trim()
        || 'YEAR TO CONFIRM';

      kicker.innerHTML =
        `${item.label} <span>· ${year === '20XX' ? 'YEAR TO CONFIRM' : year}</span>`;

      heading.innerHTML = item.heading;
      description.textContent = item.description;

      copy.classList.remove('is-transitioning');
      clearTimeout(animationTimer);

      if (animate && !reducedMotion) {
        requestAnimationFrame(() => {
          copy.classList.add('is-transitioning');
        });

        animationTimer = setTimeout(() => {
          copy.classList.remove('is-transitioning');
        }, 480);
      }
    };

    const updateFromScroll = () => {
      rafPending = false;

      if (reducedMotion || !sticky) return;

      const rect = root.getBoundingClientRect();
      const travel = Math.max(1, root.offsetHeight - sticky.offsetHeight);

      const progress = Math.max(
        0,
        Math.min(1, -rect.top / travel)
      );

      const index = Math.min(
        milestones.length - 1,
        Math.round(progress * (milestones.length - 1))
      );

      setActive(index, true);
    };

    const requestUpdate = () => {
      if (rafPending) return;

      rafPending = true;
      requestAnimationFrame(updateFromScroll);
    };

    buttons.forEach((button, index) => {
      button.addEventListener('keydown', (event) => {
        let nextIndex = null;

        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
          nextIndex = (index + 1) % buttons.length;
        } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
          nextIndex = (index - 1 + buttons.length) % buttons.length;
        } else if (event.key === 'Home') {
          nextIndex = 0;
        } else if (event.key === 'End') {
          nextIndex = buttons.length - 1;
        }

        if (nextIndex !== null) {
          event.preventDefault();
          buttons[nextIndex].focus();
          buttons[nextIndex].click();
        }
      });

      button.addEventListener('click', () => {
        if (!reducedMotion && sticky) {
          const rect = root.getBoundingClientRect();
          const travel = Math.max(1, root.offsetHeight - sticky.offsetHeight);

          const targetProgress = index / (milestones.length - 1);
          const targetY =
            window.scrollY + rect.top + targetProgress * travel;

          window.scrollTo({
            top: targetY,
            behavior: 'smooth'
          });
        } else {
          setActive(index, true);
        }
      });
    });

    // Remove previous route listeners before registering new ones.
    if (window.__aidCompanyJourneyScroll) {
      window.removeEventListener(
        'scroll',
        window.__aidCompanyJourneyScroll
      );
    }

    if (window.__aidCompanyJourneyResize) {
      window.removeEventListener(
        'resize',
        window.__aidCompanyJourneyResize
      );
    }

    window.__aidCompanyJourneyScroll = requestUpdate;
    window.__aidCompanyJourneyResize = requestUpdate;

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });

    setActive(0, false);
    requestUpdate();
  };

  // Expose the initializer so React Router can call it after mounting.
  window.AIDCompanyJourneyInit = initCompanyJourney;

  // Also support the original static HTML page.
  initCompanyJourney();
})();


// Motion layer (text, background, construction and scroll animations). Safe to remove.
(() => {
  if (window.__aidMotion || document.querySelector('script[src*="motion.js"]')) return;
  const s = document.createElement('script');
  s.src = 'motion.js';
  s.defer = true;
  document.head.appendChild(s);
})();
