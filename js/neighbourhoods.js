/* ==========================================================================
   REALTY — js/neighbourhoods.js
   Neighbourhoods page: filter by setting, keep alternating layout in order
   ========================================================================== */
(() => {
  "use strict";

  const filter = document.querySelector("[data-hood-filter]");
  const list = document.querySelector("[data-hood-list]");
  const count = document.querySelector("[data-hood-count]");
  if (!filter || !list) return;

  const rows = [...list.querySelectorAll(".hood")];

  const apply = (kind) => {
    let n = 0;
    rows.forEach((row) => {
      const show = kind === "all" || row.dataset.kind === kind;
      row.hidden = !show;
      if (show) {
        row.classList.toggle("is-flipped", n % 2 === 1);
        n += 1;
      }
    });
    if (count)
      count.textContent = `${n} ${n === 1 ? "neighbourhood" : "neighbourhoods"} to explore`;
  };

  filter.addEventListener("change", (e) => {
    if (e.target.name === "kind") apply(e.target.value);
  });

  apply(filter.querySelector('input[name="kind"]:checked').value);
})();
