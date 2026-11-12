/* =========================================================
   MORNING. — full Menu page
   Category filter (All / Coffee / …) + dietary filters (V / VG / GF).
   Data: js/menu-data.js · Helpers: window.MORNING (js/main.js)
   ========================================================= */
(function () {
  "use strict";

  const MENU = window.MORNING_MENU;
  const mount = document.querySelector("[data-full-menu]");
  if (!mount) return;

  const CATS = Object.keys(MENU);
  const DIETS = ["v", "vg", "gf"];
  const catBtns = Array.from(document.querySelectorAll("[data-fm-cat]"));
  const dietBtns = Array.from(document.querySelectorAll("[data-fm-diet]"));
  const statusEl = document.querySelector("[data-fm-status]");
  const emptyEl = document.querySelector("[data-fm-empty]");
  const filterBar = document.getElementById("menu-filters");

  const hashCat = () => { const h = location.hash.slice(1); return CATS.includes(h) ? h : "all"; };
  const state = { cat: hashCat(), diets: new Set() };
  let M = null; // window.MORNING, available once main.js has run

  const matchesDiet = (item) => [...state.diets].every((d) => (item.tags || []).includes(d));

  function itemHTML(item, i) {
    const { t, escapeHtml: esc, unsplash } = M;
    const [name, desc] = item[M.lang()] || item.en;
    const tags = (item.tags || [])
      .map((d) => `<abbr class="diet" title="${esc(t(`mp.diet.${d}`))}">${esc(t(`mp.short.${d}`))}</abbr>`)
      .join("");
    return `
      <li class="menu-item" style="--i:${i}" data-id="${item.id}">
        <div class="menu-item__thumb">
          <img src="${unsplash(item.img, 200, 200)}" srcset="${unsplash(item.img, 200, 200)} 1x, ${unsplash(item.img, 400, 400)} 2x"
            width="200" height="200" loading="lazy" decoding="async" alt="${esc(name)}">
        </div>
        <div class="menu-item__body">
          <div class="menu-item__head">
            <h3 class="menu-item__name">${esc(name)}</h3>
            <span class="menu-item__dots" aria-hidden="true"></span>
            <span class="menu-item__price">${item.price} ₾</span>
          </div>
          <p class="menu-item__desc">${esc(desc)}</p>
          ${item.signature ? `<span class="menu-item__tag">${esc(t("menu.signature"))}</span>` : ""}
          ${tags ? `<div class="menu-item__tags">${tags}</div>` : ""}
        </div>
      </li>`;
  }

  function render() {
    const { t, escapeHtml: esc, unsplash } = M;
    mount.innerHTML = CATS.map((cat, n) => {
      const data = MENU[cat];
      return `
        <section class="fm-cat" id="cat-${cat}" data-cat="${cat}" aria-labelledby="fm-${cat}">
          <header class="fm-cat__head">
            <span class="fm-cat__num">${String(n + 1).padStart(2, "0")}</span>
            <h2 class="fm-cat__title" id="fm-${cat}">${esc(t(`menu.cat.${cat}`))}</h2>
            <p class="fm-cat__lead">${esc(t(`menu.lead.${cat}`))}</p>
            <figure class="fm-cat__img">
              <img src="${unsplash(data.feature, 800, 1000)}" srcset="${unsplash(data.feature, 560, 700)} 560w, ${unsplash(data.feature, 800, 1000)} 800w"
                sizes="(min-width: 900px) 38vw, 92vw" width="800" height="1000" loading="lazy" decoding="async" alt="">
            </figure>
          </header>
          <ul class="menu__list">${data.items.map(itemHTML).join("")}</ul>
        </section>`;
    }).join("");
  }

  function apply({ animate = false } = {}) {
    let total = 0;
    const perCat = {};
    CATS.forEach((cat) => {
      perCat[cat] = MENU[cat].items.filter(matchesDiet).length;
    });

    mount.querySelectorAll(".fm-cat").forEach((section) => {
      const cat = section.dataset.cat;
      let visible = 0;
      section.querySelectorAll(".menu-item").forEach((li) => {
        const item = MENU[cat].items.find((x) => x.id === li.dataset.id);
        const show = matchesDiet(item);
        li.hidden = !show;
        if (show) {
          li.style.setProperty("--i", visible);
          visible++;
          if (animate && !M.reduceMotion) { li.classList.remove("is-in"); void li.offsetWidth; li.classList.add("is-in"); }
        }
      });
      const showSection = (state.cat === "all" || state.cat === cat) && visible > 0;
      section.hidden = !showSection;
      if (showSection) total += visible;
    });

    // tab counters + pressed state
    catBtns.forEach((btn) => {
      const cat = btn.dataset.fmCat;
      btn.setAttribute("aria-pressed", String(cat === state.cat));
      const n = cat === "all" ? CATS.reduce((s, c) => s + perCat[c], 0) : perCat[cat];
      const sup = btn.querySelector(".menu__count");
      if (sup) sup.textContent = n;
    });
    dietBtns.forEach((btn) => btn.setAttribute("aria-pressed", String(state.diets.has(btn.dataset.fmDiet))));

    if (statusEl) statusEl.textContent = M.t("mp.count").replace("{n}", total);
    if (emptyEl) emptyEl.hidden = total > 0;
  }

  function scrollToMenuTop() {
    const target = mount.getBoundingClientRect().top + window.scrollY - (filterBar ? filterBar.offsetHeight : 0) - 80;
    if (window.scrollY > target) window.scrollTo({ top: target, behavior: M.reduceMotion ? "auto" : "smooth" });
  }

  function setCat(cat) {
    state.cat = cat;
    history.replaceState(null, "", cat === "all" ? location.pathname + location.search : `#${cat}`);
    apply({ animate: true });
    scrollToMenuTop();
  }

  catBtns.forEach((btn) => btn.addEventListener("click", () => setCat(btn.dataset.fmCat)));
  dietBtns.forEach((btn) => btn.addEventListener("click", () => {
    const d = btn.dataset.fmDiet;
    if (state.diets.has(d)) state.diets.delete(d); else state.diets.add(d);
    apply({ animate: true });
    scrollToMenuTop();
  }));
  document.querySelectorAll("[data-fm-clear]").forEach((btn) => btn.addEventListener("click", () => {
    state.diets.clear();
    setCat("all");
  }));
  window.addEventListener("hashchange", () => { state.cat = hashCat(); apply({ animate: true }); });

  // (Re)render whenever the language is applied — main.js fires this on load too
  document.addEventListener("morning:lang", () => {
    M = window.MORNING;
    render();
    apply();
  });
})();
