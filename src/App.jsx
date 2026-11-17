
import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Company from "./pages/Company";
import Capabilities from "./pages/Capabilities";
import Projects from "./pages/Projects";
import Careers from "./pages/Careers";
import Contact from "./pages/Contact";

const loadedScripts = new Map();

function loadScript(src) {
  if (loadedScripts.has(src)) {
    return loadedScripts.get(src);
  }

  const promise = new Promise((resolve) => {
    const existing = document.querySelector(
      `script[data-aid-script="${src}"]`
    );

    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }

      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", resolve, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.dataset.aidScript = src;

    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };

    script.onerror = () => {
      loadedScripts.delete(src);
      console.error(`Failed to load script: ${src}`);
      resolve();
    };

    document.body.appendChild(script);
  });

  loadedScripts.set(src, promise);
  return promise;
}

function nextFrame() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });
}

function RouteEffects() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });

    const titles = {
      "/": "Home",
      "/company": "Company",
      "/capabilities": "Capabilities",
      "/projects": "Projects",
      "/careers": "Careers",
      "/contact": "Contact",
    };

    document.title = `${titles[location.pathname] || "AID"} | AID`;

    let cancelled = false;

    async function initializePage() {
      // Load shared animation scripts once.
      await loadScript("/motion.js");
      await loadScript("/motion-plus.js");

      if (cancelled) return;

      // Load page interactions.
      // Keep this as a single shared script; avoid removing and
      // reloading it on every route.
      await loadScript("/site.js");

      if (cancelled) return;

      // Load construction journey scripts only on Home.
      if (location.pathname === "/") {
        await loadScript("/vendor/gsap.min.js");
        await loadScript("/vendor/ScrollTrigger.min.js");
        await loadScript("/lift-journey.js");
        await loadScript("/building-journey.js");

        if (cancelled) return;

        if (window.AIDBuildingJourneyInit) {
          window.AIDBuildingJourneyInit();
        }
      }

      // Wait for React DOM and page elements to settle.
      await nextFrame();

      if (cancelled) return;

      // Reinitialize animations on the newly mounted page.
      window.AIDMotionRefresh?.();
      window.AIDMotionPlusRefresh?.();

      window.ScrollTrigger?.refresh?.();
    }

    initializePage();

    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  return null;
}

export default function App() {
  return (
    <>
      <RouteEffects />

      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/company" element={<Company />} />
        <Route path="/capabilities" element={<Capabilities />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<Home />} />
      </Routes>

      <Footer />
    </>
  );
}
