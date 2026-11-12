/* =========================================================
   MORNING. — Our Coffee page
   Renders the "signature drinks" list straight from js/menu-data.js,
   so names, descriptions and prices always match the Menu.
   ========================================================= */
(function () {
  "use strict";

  const list = document.querySelector("[data-signature]");
  if (!list) return;
  const ids = list.dataset.signature.split(",").map((s) => s.trim());

  document.addEventListener("morning:lang", () => {
    const M = window.MORNING;
    list.innerHTML = ids
      .map((id) => M.findMenuItem(id))
      .filter(Boolean)
      .map((item, i) => M.menuItemHTML(item, i))
      .join("");
  });
})();
