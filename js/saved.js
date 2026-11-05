/* ==========================================================================
   REALTY — js/saved.js
   Saved properties: reads saved ids from localStorage, grid/list, sort.
   ========================================================================== */
(() => {
  "use strict";

  const D = window.RealtyData;
  const UI = window.RealtyUI;
  const results = document.querySelector("[data-saved-results]");
  if (!D || !UI || !results) return;

  const empty = document.querySelector("[data-saved-empty]");
  const toolbar = document.querySelector("[data-saved-toolbar]");
  const count = document.querySelector("[data-saved-count]");
  const sortEl = document.querySelector("[data-saved-sort]");
  const viewEl = document.querySelector("[data-saved-view]");

  const SORTS = {
    recent: null,
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    largest: (a, b) => b.sqft - a.sqft,
  };

  const render = () => {
    const ids = UI.read(UI.KEYS.saved);
    let items = ids
      .map((id) => D.byId[id])
      .filter(Boolean)
      .reverse();
    const sort = SORTS[sortEl.value];
    if (sort) items = [...items].sort(sort);

    const n = items.length;
    count.textContent = `${n} saved ${n === 1 ? "home" : "homes"}`;
    toolbar.hidden = n === 0;
    empty.hidden = n > 0;

    const view = viewEl.querySelector("input:checked").value;
    results.innerHTML =
      n === 0
        ? ""
        : view === "list"
          ? `<ul class="results__list">${items.map(D.row).join("")}</ul>`
          : `<div class="property-grid property-grid--desk">${items.map(D.card).join("")}</div>`;

    UI.sync();
  };

  sortEl.addEventListener("change", render);
  viewEl.addEventListener("change", render);
  document.addEventListener("realty:change", (e) => {
    if (e.detail && e.detail.key === UI.KEYS.saved) render();
  });

  render();
})();
