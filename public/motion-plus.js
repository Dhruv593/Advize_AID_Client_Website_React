
/* ==========================================================================
   AID MOTION PLUS
   --------------------------------------------------------------------------
   Additional visual interactions for the AID website.

   Features:
   1. Scroll progress bar
   2. Page transition curtain
   3. Internal page link prefetching
   4. Magnetic button interactions
   5. React Router navigation refresh support

   IMPORTANT:
   - Does not modify section heading or label text.
   - Does not interfere with the Home construction journey.
   - Does not interfere with the Company journey.
   - Respects prefers-reduced-motion.
   ========================================================================== */

(function () {
  "use strict";

  // Prevent duplicate global initialization.
  if (window.__aidMotionPlus) return;
  window.__aidMotionPlus = true;

  const root = document.documentElement;

  /* -----------------------------------------------------------------------
     1. Preferences
  ----------------------------------------------------------------------- */

  let reduceMotion = false;
  let finePointer = false;

  try {
    reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    finePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    ).matches;
  } catch (error) {
    // Keep default preferences.
  }

  if (reduceMotion) {
    root.classList.remove("mp-enter");
    return;
  }

  /* -----------------------------------------------------------------------
     2. Scroll progress bar
  ----------------------------------------------------------------------- */

  let rail = document.querySelector(".mp-progress");
  let fill;

  if (!rail) {
    rail = document.createElement("div");
    rail.className = "mp-progress";
    rail.setAttribute("aria-hidden", "true");

    fill = document.createElement("i");
    rail.appendChild(fill);

    document.body.appendChild(rail);
  } else {
    fill = rail.querySelector("i");

    if (!fill) {
      fill = document.createElement("i");
      rail.appendChild(fill);
    }
  }

  let ticking = false;

  function paintProgress() {
    ticking = false;

    const documentHeight = Math.max(
      1,
      document.documentElement.scrollHeight -
        window.innerHeight
    );

    const scrollPosition =
      window.scrollY ||
      window.pageYOffset ||
      0;

    const progress = Math.min(
      1,
      Math.max(0, scrollPosition / documentHeight)
    );

    fill.style.transform =
      "scaleX(" + progress.toFixed(4) + ")";
  }

  function onScroll() {
    if (ticking) return;

    ticking = true;
    requestAnimationFrame(paintProgress);
  }

  window.addEventListener("scroll", onScroll, {
    passive: true
  });

  window.addEventListener("resize", onScroll, {
    passive: true
  });

  paintProgress();

  /* -----------------------------------------------------------------------
     3. Page transition curtain
  ----------------------------------------------------------------------- */

  let shutter = document.querySelector(".mp-shutter");

  if (!shutter) {
    shutter = document.createElement("div");
    shutter.className = "mp-shutter";
    shutter.setAttribute("aria-hidden", "true");

    shutter.innerHTML =
      "<b></b><b></b><b></b><b></b>";

    document.body.appendChild(shutter);
  }

  // Reveal the page when arriving from a full-page navigation.
  if (root.classList.contains("mp-enter")) {
    function revealPage() {
      requestAnimationFrame(function () {
        setTimeout(function () {
          root.classList.add("mp-reveal");

          setTimeout(function () {
            root.classList.remove(
              "mp-enter",
              "mp-reveal"
            );
          }, 800);

        }, 90);
      });
    }

    if (document.readyState === "loading") {
      document.addEventListener(
        "DOMContentLoaded",
        revealPage,
        { once: true }
      );
    } else {
      revealPage();
    }
  }

  let leaving = false;

  function navigateWithCurtain(href) {
    if (leaving) return;

    leaving = true;

    try {
      sessionStorage.setItem("mpS", "1");
    } catch (error) {
      // Storage may be unavailable.
    }

    shutter.classList.add("is-closing");

    setTimeout(function () {
      window.location.href = href;
    }, 440);
  }

  // Restore the curtain when returning through browser history.
  window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
      leaving = false;

      shutter.classList.remove("is-closing");

      root.classList.remove(
        "mp-enter",
        "mp-reveal"
      );
    }
  });

  /* -----------------------------------------------------------------------
     4. Internal page link detection
  ----------------------------------------------------------------------- */

  function getInternalPageLink(anchor) {
    if (!anchor || !anchor.href) return null;

    // React Router links must remain under React Router control.
    if (anchor.hasAttribute("data-router-link")) {
      return null;
    }

    if (
      anchor.target &&
      anchor.target !== "_self"
    ) {
      return null;
    }

    if (anchor.hasAttribute("download")) {
      return null;
    }

    let url;

    try {
      url = new URL(anchor.href, window.location.href);
    } catch (error) {
      return null;
    }

    if (
      url.protocol !== window.location.protocol ||
      url.host !== window.location.host
    ) {
      return null;
    }

    // Ignore same-page links and hash navigation.
    if (url.pathname === window.location.pathname) {
      return null;
    }

    const lastSegment = url.pathname.split("/").pop();

    // Keep only legacy HTML page links.
    if (
      lastSegment &&
      !/\.html?$/i.test(lastSegment)
    ) {
      return null;
    }

    return url;
  }

  /* -----------------------------------------------------------------------
     5. Legacy page transition handling
  ----------------------------------------------------------------------- */

  document.addEventListener("click", function (event) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const anchor =
      event.target &&
      event.target.closest
        ? event.target.closest("a[href]")
        : null;

    const url = getInternalPageLink(anchor);

    if (!url) return;

    event.preventDefault();

    navigateWithCurtain(url.href);
  });

  /* -----------------------------------------------------------------------
     6. Internal link prefetching
  ----------------------------------------------------------------------- */

  const prefetched = new Set();

  let saveData = false;

  try {
    saveData = !!(
      navigator.connection &&
      navigator.connection.saveData
    );
  } catch (error) {
    // Ignore unsupported connection API.
  }

  function prefetchPage(event) {
    if (saveData) return;

    const anchor =
      event.target &&
      event.target.closest
        ? event.target.closest("a[href]")
        : null;

    const url = getInternalPageLink(anchor);

    if (!url) return;

    if (prefetched.has(url.pathname)) return;

    prefetched.add(url.pathname);

    const link = document.createElement("link");

    link.rel = "prefetch";
    link.href = url.href;

    document.head.appendChild(link);
  }

  document.addEventListener(
    "mouseover",
    prefetchPage,
    { passive: true }
  );

  document.addEventListener(
    "touchstart",
    prefetchPage,
    { passive: true }
  );

  /* -----------------------------------------------------------------------
     7. Magnetic button interactions
  ----------------------------------------------------------------------- */

  function initializeMagneticButtons() {
    if (!finePointer) return;

    const buttons = document.querySelectorAll(
      "main .button-primary, main .button-dark"
    );

    buttons.forEach(function (button) {
      // Avoid duplicate event listeners.
      if (button.dataset.mpMagBound === "true") {
        return;
      }

      button.dataset.mpMagBound = "true";

      button.classList.add("mp-mag");

      button.addEventListener("mousemove", function (event) {
        const rect = button.getBoundingClientRect();

        const dx =
          (event.clientX - (rect.left + rect.width / 2)) *
          0.16;

        const dy =
          (event.clientY - (rect.top + rect.height / 2)) *
          0.22;

        button.style.translate =
          dx.toFixed(1) +
          "px " +
          (dy - 2).toFixed(1) +
          "px";
      });

      button.addEventListener("mouseleave", function () {
        button.style.translate = "";
      });
    });
  }

  /* -----------------------------------------------------------------------
     8. React Router refresh function
  ----------------------------------------------------------------------- */

  window.AIDMotionPlusRefresh = function () {
    // Initialize magnetic buttons on the newly mounted page.
    initializeMagneticButtons();

    // Refresh the scroll progress indicator after page changes.
    requestAnimationFrame(function () {
      paintProgress();
    });

    // IMPORTANT:
    // Section label scrambling has intentionally been removed.
    // The original JSX text must remain unchanged.
  };

  /* -----------------------------------------------------------------------
     9. Initial page initialization
  ----------------------------------------------------------------------- */

  initializeMagneticButtons();

  paintProgress();

})();
