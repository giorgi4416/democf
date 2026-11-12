/* =========================================================
   MORNING. — site behaviour
   ========================================================= */
(function () {
  "use strict";

  const CONFIG = window.MORNING_CONFIG;
  const I18N = window.MORNING_I18N;
  const MENU = window.MORNING_MENU;
  const LANGS = ["en", "ka"];
  const STORAGE_KEY = "morning-lang";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Which page we are on (<body data-page="menu">); the homepage has no attribute
  const PAGE = document.body.dataset.page || "home";

  const unsplash = (id, w, h, q = 72) =>
    `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}${h ? `&h=${h}` : ""}&q=${q}`;

  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- Language ---------- */
  let lang = detectLanguage();

  function detectLanguage() {
    const fromUrl = new URLSearchParams(location.search).get("lang");
    if (fromUrl === "ge" || fromUrl === "ka") return "ka";
    if (fromUrl === "en") return "en";
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (LANGS.includes(stored)) return stored;
    } catch (e) { /* storage unavailable */ }
    return (navigator.language || "").toLowerCase().startsWith("ka") ? "ka" : "en";
  }

  const t = (key) => (I18N[lang] && I18N[lang][key]) ?? I18N.en[key] ?? key;

  function applyTranslations() {
    root.lang = lang;
    const metaKey = PAGE === "home" ? "meta" : `meta.${PAGE}`;
    document.title = t(`${metaKey}.title`);
    const desc = $('meta[name="description"]');
    if (desc) desc.setAttribute("content", t(`${metaKey}.description`));

    // Let page scripts (js/pages/*.js) re-render their dynamic content first,
    // so anything they output with data-i18n is translated below as well.
    document.dispatchEvent(new CustomEvent("morning:lang", { detail: { lang, t } }));

    $$("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $$("[data-i18n-html]").forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    $$("[data-i18n-attr]").forEach((el) => {
      el.dataset.i18nAttr.split(";").forEach((pair) => {
        const [attr, key] = pair.split(":").map((s) => s.trim());
        if (attr && key) el.setAttribute(attr, t(key));
      });
    });

    $$(".lang__btn").forEach((btn) => btn.setAttribute("aria-pressed", String(btn.dataset.lang === lang)));
    $$("[data-lang-toggle]").forEach((btn) => { btn.textContent = lang === "ka" ? "EN" : "GE"; });

    // Burger label depends on state
    const burger = $(".burger");
    if (burger) burger.setAttribute("aria-label", t(burger.getAttribute("aria-expanded") === "true" ? "a11y.closeMenu" : "a11y.openMenu"));

    applyConfig();
    renderMenu(currentCat, false);
    updateOpenStatus();
  }

  function setLanguage(next) {
    if (!LANGS.includes(next) || next === lang) return;
    lang = next;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignore */ }

    if (reduceMotion) { applyTranslations(); return; }
    root.classList.add("is-switching");
    setTimeout(() => {
      applyTranslations();
      requestAnimationFrame(() => root.classList.remove("is-switching"));
    }, 180);
  }

  $$(".lang__btn").forEach((btn) => btn.addEventListener("click", () => setLanguage(btn.dataset.lang)));
  $$("[data-lang-toggle]").forEach((btn) => btn.addEventListener("click", () => setLanguage(lang === "ka" ? "en" : "ka")));

  /* ---------- Business details (from config.js) ---------- */
  let mapQueryApplied = null;

  function applyConfig() {
    $$("[data-config]").forEach((el) => {
      const key = el.dataset.config;
      const value = key === "address" ? CONFIG.address[lang] : CONFIG[key];
      if (value != null) el.textContent = value;
    });
    $$("[data-tel]").forEach((el) => el.setAttribute("href", `tel:${CONFIG.phoneHref}`));
    $$("[data-config-href]").forEach((el) => el.setAttribute("href", CONFIG[el.dataset.configHref]));

    const q = encodeURIComponent(CONFIG.mapQuery);
    $$("[data-maps-link]").forEach((el) => el.setAttribute("href", `https://www.google.com/maps/search/?api=1&query=${q}`));
    const map = $("[data-map]");
    const mapKey = `${q}|${lang}`;
    if (map && mapQueryApplied !== mapKey) {
      const src = `https://www.google.com/maps?q=${q}&hl=${lang}&z=15&output=embed`;
      // Only reload the iframe when it has actually changed
      if (map.getAttribute("src") !== src) map.setAttribute("src", src);
      mapQueryApplied = mapKey;
    }

    CONFIG.hours.forEach((h) => {
      $$(`[data-hours="${h.label}"] dd, [data-hours-text="${h.label}"]`).forEach((el) => {
        el.textContent = `${h.open} – ${h.close}`;
      });
    });

    $$("[data-demo-note]").forEach((el) => { el.hidden = !CONFIG.isDemo; });
  }

  /* ---------- Structured data (SEO) ---------- */
  function injectStructuredData() {
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const data = {
      "@context": "https://schema.org",
      "@type": "CafeOrCoffeeShop",
      name: "MORNING.",
      description: I18N.en["meta.description"],
      image: unsplash("1541167760496-1628856ab772", 1200, 800),
      url: location.href.split("#")[0],
      telephone: CONFIG.phoneHref,
      servesCuisine: ["Coffee", "Breakfast", "Brunch", "Desserts"],
      priceRange: "₾₾",
      acceptsReservations: "True",
      address: {
        "@type": "PostalAddress",
        streetAddress: CONFIG.address.en.split(",")[0],
        addressLocality: "Tbilisi",
        addressCountry: "GE",
      },
      openingHoursSpecification: CONFIG.hours.map((h) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: h.days.map((d) => dayNames[d]),
        opens: h.open,
        closes: h.close,
      })),
      sameAs: [CONFIG.instagramUrl, CONFIG.facebookUrl],
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  /* ---------- Opening hours: "Open now" ---------- */
  function tbilisiNow() {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: CONFIG.timeZone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date());
    const get = (type) => parts.find((p) => p.type === type).value;
    const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
    return { day, minutes: parseInt(get("hour"), 10) * 60 + parseInt(get("minute"), 10) };
  }
  const toMinutes = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
  const ruleFor = (day) => CONFIG.hours.find((h) => h.days.includes(day));

  function updateOpenStatus() {
    const status = $("[data-status]");
    if (!status) return;
    let now;
    try { now = tbilisiNow(); } catch (e) { status.hidden = true; return; }

    const today = ruleFor(now.day);
    $$("[data-hours]").forEach((row) => row.classList.toggle("is-today", !!today && row.dataset.hours === today.label));

    let open = false;
    let detail = "";
    if (today && now.minutes >= toMinutes(today.open) && now.minutes < toMinutes(today.close)) {
      open = true;
      detail = t("contact.closesAt").replace("{time}", today.close);
    } else if (today && now.minutes < toMinutes(today.open)) {
      detail = t("contact.opensAt").replace("{time}", today.open);
    } else {
      const tomorrow = ruleFor((now.day + 1) % 7);
      if (tomorrow) detail = t("contact.opensAt").replace("{time}", tomorrow.open);
    }
    status.classList.toggle("is-closed", !open);
    $("[data-status-text]", status).textContent = `${t(open ? "contact.openNow" : "contact.closedNow")}${detail ? " · " + detail : ""}`;
    status.hidden = false;
  }

  /* ---------- Menu ---------- */
  const tabs = $$(".menu__tab[data-cat]"); // homepage menu tabs only
  const panel = $("#menu-panel");
  const list = $("[data-menu-list]");
  const feature = $(".menu__feature");
  const featureImg = $(".menu__feature-img");
  let currentCat = "coffee";
  let switchTimer = null;

  tabs.forEach((tab) => {
    const count = $(".menu__count", tab);
    if (count) count.textContent = homeItems(tab.dataset.cat).length;
  });

  // The homepage shows the short selection; the Menu page shows everything
  function homeItems(cat) { return MENU[cat].items.filter((item) => !item.fullOnly); }

  function itemTemplate(item, i) {
    const [name, desc] = item[lang] || item.en;
    const tag = item.signature ? `<span class="menu-item__tag">${escapeHtml(t("menu.signature"))}</span>` : "";
    return `
      <li class="menu-item" style="--i:${i}">
        <div class="menu-item__thumb">
          <img src="${unsplash(item.img, 200, 200)}" srcset="${unsplash(item.img, 200, 200)} 1x, ${unsplash(item.img, 400, 400)} 2x"
            width="200" height="200" loading="lazy" decoding="async" alt="${escapeHtml(name)}">
        </div>
        <div class="menu-item__body">
          <div class="menu-item__head">
            <h3 class="menu-item__name">${escapeHtml(name)}</h3>
            <span class="menu-item__dots" aria-hidden="true"></span>
            <span class="menu-item__price">${item.price} ₾</span>
          </div>
          <p class="menu-item__desc">${escapeHtml(desc)}</p>
          ${tag}
        </div>
      </li>`;
  }

  function renderMenu(cat, animate) {
    const data = MENU[cat];
    if (!data || !list) return;
    list.innerHTML = homeItems(cat).map(itemTemplate).join("");
    if (animate && !reduceMotion) $$(".menu-item", list).forEach((li) => li.classList.add("is-in"));

    $$("[data-menu-title]").forEach((el) => { el.textContent = t(`menu.cat.${cat}`); });
    $$("[data-menu-lead]").forEach((el) => { el.textContent = t(`menu.lead.${cat}`); });
    if (featureImg) featureImg.alt = "";
  }

  function swapFeature(cat) {
    if (!feature || !featureImg) return;
    const src = unsplash(MENU[cat].feature, 800, 1000);
    if (featureImg.getAttribute("src") === src) return;
    const pre = new Image();
    feature.classList.add("is-swapping");
    const show = () => {
      setTimeout(() => {
        featureImg.src = src;
        feature.classList.remove("is-swapping");
      }, reduceMotion ? 0 : 260);
    };
    pre.onload = show;
    pre.onerror = show;
    pre.src = src;
  }

  function selectCategory(cat, { focus = false } = {}) {
    if (!MENU[cat] || cat === currentCat) return;
    currentCat = cat;

    tabs.forEach((tab) => {
      const active = tab.dataset.cat === cat;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active) {
        panel.setAttribute("aria-labelledby", tab.id);
        if (focus) tab.focus();
        scrollTabIntoView(tab);
      }
    });

    swapFeature(cat);
    clearTimeout(switchTimer);
    if (reduceMotion) { renderMenu(cat, false); return; }
    list.classList.add("is-out");
    switchTimer = setTimeout(() => {
      renderMenu(cat, true);
      list.classList.remove("is-out");
    }, 230);
  }

  function scrollTabIntoView(tab) {
    const strip = tab.parentElement;
    if (strip.scrollWidth <= strip.clientWidth) return;
    const left = tab.offsetLeft - strip.clientWidth / 2 + tab.offsetWidth / 2;
    strip.scrollTo({ left, behavior: reduceMotion ? "auto" : "smooth" });
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => selectCategory(tab.dataset.cat));
    tab.addEventListener("keydown", (e) => {
      let next = null;
      if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
      else if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === "Home") next = tabs[0];
      else if (e.key === "End") next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); selectCategory(next.dataset.cat, { focus: true }); }
    });
  });

  /* ---------- Header: solid on scroll, hide on scroll down ---------- */
  const header = $("#header");
  let lastY = window.scrollY;
  let ticking = false;

  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle("is-top", y < 24);
    if (!root.classList.contains("menu-open")) {
      if (y > 320 && y > lastY + 6) header.classList.add("is-hidden");
      else if (y < lastY - 6 || y < 320) header.classList.remove("is-hidden");
    }
    lastY = y;
    updateParallax();
    ticking = false;
  }
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });

  // Reveal the header when any nav control receives keyboard focus
  header.addEventListener("focusin", () => header.classList.remove("is-hidden"));

  /* ---------- Mobile menu ---------- */
  const burger = $(".burger");
  const mobileMenu = $("#mobile-menu");
  const inertTargets = [$("main"), $(".footer")];

  function setMenu(open) {
    if (!burger || !mobileMenu) return;
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", t(open ? "a11y.closeMenu" : "a11y.openMenu"));
    mobileMenu.classList.toggle("is-open", open);
    mobileMenu.setAttribute("aria-hidden", String(!open));
    root.classList.toggle("menu-open", open);
    inertTargets.forEach((el) => { if (el) el.inert = open; });
    if (open) {
      header.classList.remove("is-hidden");
      setTimeout(() => { const first = $("a", mobileMenu); if (first) first.focus({ preventScroll: true }); }, 350);
    }
  }
  if (burger) burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
  if (mobileMenu) {
    $$("a[href^='#']", mobileMenu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
    mobileMenu.inert = true;
    new MutationObserver(() => { mobileMenu.inert = !mobileMenu.classList.contains("is-open"); })
      .observe(mobileMenu, { attributes: true, attributeFilter: ["class"] });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && root.classList.contains("menu-open")) { setMenu(false); burger.focus(); }
  });
  window.matchMedia("(min-width: 1024px)").addEventListener("change", (e) => { if (e.matches) setMenu(false); });

  /* ---------- Scroll reveal ---------- */
  const revealIO = ("IntersectionObserver" in window && !reduceMotion)
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) { entry.target.classList.add("is-visible"); revealIO.unobserve(entry.target); }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 })
    : null;
  function observeReveal(els) {
    els.forEach((el) => {
      if (el.classList.contains("is-visible")) return;
      if (revealIO) revealIO.observe(el); else el.classList.add("is-visible");
    });
  }
  observeReveal($$(".reveal, .reveal-img"));

  /* ---------- Subtle parallax ---------- */
  const parallaxEls = reduceMotion ? [] : $$("[data-parallax]");
  function updateParallax() {
    if (!parallaxEls.length) return;
    const vh = window.innerHeight;
    parallaxEls.forEach((el) => {
      const box = el.parentElement.getBoundingClientRect();
      if (box.bottom < -100 || box.top > vh + 100) return;
      const offset = box.top + box.height / 2 - vh / 2;
      const speed = parseFloat(el.dataset.parallax) || 0;
      const max = el.classList.contains("hero__img") ? box.height * 0.06 : 30;
      const v = Math.max(-max, Math.min(max, -offset * speed));
      el.style.translate = `0 ${v.toFixed(1)}px`;
    });
  }

  /* ---------- Gallery lightbox ---------- */
  const lightbox = $("#lightbox");
  let galleryBtns = [];
  let lbIndex = 0;
  const visibleGalleryBtns = () => $$(".g-btn").filter((btn) => !btn.closest("[hidden]"));

  function showPhoto(i) {
    lbIndex = (i + galleryBtns.length) % galleryBtns.length;
    const btn = galleryBtns[lbIndex];
    const img = $(".lightbox__img", lightbox);
    const alt = $("img", btn).alt;
    img.classList.add("is-loading");
    // Size the full image to the screen: ~800px on phones, up to 1800px on large displays
    const w = Math.min(1800, Math.ceil((window.innerWidth * Math.min(window.devicePixelRatio || 1, 2)) / 200) * 200);
    const src = unsplash(btn.dataset.photo, w, null, 78);
    lightbox.classList.add("is-loading");
    const pre = new Image();
    pre.onload = pre.onerror = () => {
      img.src = src;
      img.alt = alt;
      img.classList.remove("is-loading");
      lightbox.classList.remove("is-loading");
    };
    pre.src = src;
    $(".lightbox__text", lightbox).textContent = alt;
    $(".lightbox__count", lightbox).textContent = `${String(lbIndex + 1).padStart(2, "0")} / ${String(galleryBtns.length).padStart(2, "0")}`;
  }

  if (lightbox && typeof lightbox.showModal === "function") {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".g-btn");
      if (!btn) return;
      galleryBtns = visibleGalleryBtns();
      showPhoto(Math.max(0, galleryBtns.indexOf(btn)));
      lightbox.showModal();
      root.classList.add("menu-open"); // reuse scroll lock
      header.classList.add("is-hidden");
    });
    lightbox.addEventListener("close", () => {
      root.classList.remove("menu-open");
      galleryBtns[lbIndex].focus({ preventScroll: true });
    });
    lightbox.addEventListener("click", (e) => {
      const action = e.target.closest("[data-lb]");
      if (action) {
        const a = action.dataset.lb;
        if (a === "close") lightbox.close();
        if (a === "prev") showPhoto(lbIndex - 1);
        if (a === "next") showPhoto(lbIndex + 1);
        return;
      }
      if (!e.target.closest(".lightbox__img")) lightbox.close();
    });
    lightbox.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") showPhoto(lbIndex + 1);
      if (e.key === "ArrowLeft") showPhoto(lbIndex - 1);
    });
    let touchX = null;
    lightbox.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
    lightbox.addEventListener("touchend", (e) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) showPhoto(lbIndex + (dx < 0 ? 1 : -1));
      touchX = null;
    });
  } else {
    $$(".g-btn").forEach((btn) => { btn.disabled = true; btn.style.cursor = "default"; });
  }

  /* ---------- Shared helpers for page scripts ---------- */
  window.MORNING = {
    t: (key) => t(key),
    lang: () => lang,
    unsplash,
    escapeHtml,
    menuItemHTML: itemTemplate,
    findMenuItem: (id) => {
      for (const cat of Object.keys(MENU)) {
        const item = MENU[cat].items.find((i) => i.id === id);
        if (item) return item;
      }
      return null;
    },
    observeReveal,
    reduceMotion,
  };

  /* ---------- Init ---------- */
  $$("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
  applyTranslations();
  injectStructuredData();
  onScroll();
  setInterval(updateOpenStatus, 60 * 1000);
})();
