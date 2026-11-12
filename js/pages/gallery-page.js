/* =========================================================
   MORNING. — Gallery page
   Category filter for the masonry grid. The lightbox (js/main.js)
   automatically pages through the photos that are currently visible.
   ========================================================= */
(function () {
  "use strict";

  const grid = document.querySelector("[data-masonry]");
  if (!grid) return;

  const chips = Array.from(document.querySelectorAll("[data-gp-cat]"));
  const items = Array.from(grid.querySelectorAll(".m-item"));
  const countEl = document.querySelector("[data-gp-count]");
  const CATS = chips.map((c) => c.dataset.gpCat);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const hashCat = () => { const h = location.hash.slice(1); return CATS.includes(h) ? h : "all"; };
  let current = hashCat();
  let timer = null;

  function updateCount() {
    if (!countEl || !window.MORNING) return;
    const n = items.filter((li) => !li.hidden).length;
    countEl.textContent = window.MORNING.t("gp.count").replace("{n}", n);
  }

  function apply(cat, animate) {
    current = cat;
    chips.forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.gpCat === cat)));
    const show = () => {
      items.forEach((li) => { li.hidden = !(cat === "all" || li.dataset.cat === cat); });
      updateCount();
      grid.classList.remove("is-filtering");
    };
    clearTimeout(timer);
    if (!animate || reduceMotion) { show(); return; }
    grid.classList.add("is-filtering");
    timer = setTimeout(show, 260);
  }

  chips.forEach((chip) => chip.addEventListener("click", () => {
    const cat = chip.dataset.gpCat;
    if (cat === current) return;
    history.replaceState(null, "", cat === "all" ? location.pathname + location.search : `#${cat}`);
    apply(cat, true);
  }));

  window.addEventListener("hashchange", () => apply(hashCat(), true));
  apply(current, false);
  document.addEventListener("morning:lang", updateCount);
})();
