/* ==========================================================================
   REALTY — js/compare.js
   Compare up to four homes. Source: ?ids=a,b,c or localStorage "realty:compare".
   ========================================================================== */
(() => {
  "use strict";

  const D = window.RealtyData;
  const UI = window.RealtyUI;
  const view = document.querySelector("[data-compare-view]");
  if (!D || !UI || !view) return;

  const MAX = 4;
  const KEY = UI.KEYS.compare;
  const empty = document.querySelector("[data-compare-empty]");
  const count = document.querySelector("[data-compare-count]");
  const addSelect = document.querySelector("[data-add-select]");
  const addBtn = document.querySelector("[data-add-btn]");
  const legend = document.querySelector(".compare-legend");
  const note = document.querySelector(".compare-note");

  /* ---------- Initial ids ---------- */
  const fromUrl = (new URLSearchParams(location.search).get("ids") || "")
    .split(",")
    .map((s) => s.trim())
    .filter((id) => D.byId[id]);
  if (fromUrl.length) {
    UI.write(KEY, [...new Set(fromUrl)].slice(0, MAX));
    history.replaceState(null, "", location.pathname);
  }

  const notify = () =>
    document.dispatchEvent(
      new CustomEvent("realty:change", {
        detail: { key: KEY, list: UI.read(KEY) },
      }),
    );

  /* ---------- Highlights (computed within the same purpose) ---------- */
  const highlight = (items, valueOf, pick) => {
    const winners = new Set();
    ["buy", "rent"].forEach((purpose) => {
      const group = items.filter((p) => p.purpose === purpose);
      if (group.length < 2) return;
      const values = group.map(valueOf);
      if (new Set(values).size < 2) return;
      const target = pick(...values);
      group.forEach((p) => {
        if (valueOf(p) === target) winners.add(p.id);
      });
    });
    return winners;
  };

  const tag = (text) => ` <span class="best-tag">${text}</span>`;

  const render = () => {
    const ids = UI.read(KEY)
      .filter((id) => D.byId[id])
      .slice(0, MAX);
    const items = ids.map((id) => D.byId[id]);
    const n = items.length;

    count.textContent = `${n} of ${MAX} homes selected`;
    empty.hidden = n > 0;
    view.hidden = n === 0;
    legend.hidden = n < 2;
    note.hidden = n === 0;

    /* Add control */
    const remaining = D.PROPERTIES.filter((p) => !ids.includes(p.id));
    addSelect.innerHTML = remaining
      .map(
        (p) =>
          `<option value="${p.id}">${p.name} — ${D.usd(p.price)}${p.purpose === "rent" ? " / month" : ""}</option>`,
      )
      .join("");
    const full = n >= MAX || remaining.length === 0;
    addSelect.disabled = full;
    addBtn.disabled = full;

    if (n === 0) {
      view.innerHTML = "";
      return;
    }

    const bestPrice = highlight(items, (p) => p.price, Math.min);
    const largest = highlight(items, (p) => p.sqft, Math.max);
    const mostBeds = highlight(items, (p) => p.beds, Math.max);
    const lowestPay = highlight(
      items,
      (p) => Math.round(D.monthlyCost(p)),
      Math.min,
    );

    const perSqft = (p) =>
      p.purpose === "rent"
        ? `${D.usd(p.price / p.sqft, 2)} / sq ft / month`
        : `${D.usd(p.price / p.sqft)} / sq ft`;

    const ROWS = [
      [
        "Price",
        (p) => `<span class="compare-table__price">${D.priceHTML(p)}</span>`,
        bestPrice,
        "Best price",
      ],
      ["Property type", (p) => p.type],
      ["Location", (p) => p.area],
      ["Bedrooms", (p) => D.bedsText(p.beds), mostBeds, "Most bedrooms"],
      ["Bathrooms", (p) => D.bathsText(p.baths)],
      [
        "Area",
        (p) => `${p.sqft.toLocaleString("en-US")} sq ft`,
        largest,
        "Largest area",
      ],
      ["Price per area", perSqft],
      ["Parking", (p) => (p.features.includes("parking") ? "Yes" : "—")],
      [
        "Amenities",
        (p) => p.features.map((f) => D.FEATURE_LABELS[f]).join(", ") || "—",
      ],
      ["Listing age", (p) => D.agoText(p.listed)],
      [
        "Estimated monthly payment",
        (p) => `≈ ${D.usd(D.monthlyCost(p))} / month`,
        lowestPay,
        "Lowest estimated payment",
      ],
      ["Agent", (p) => p.agency],
    ];

    const head = items
      .map(
        (p) => `
      <th scope="col" class="compare-table__col">
        <a class="compare-table__img" href="${D.href(p)}"><img src="${p.image}" alt="" loading="lazy" decoding="async"></a>
        <a class="compare-table__name" href="${D.href(p)}">${p.name}</a>
        <button class="compare-table__remove" type="button" data-remove="${p.id}" aria-label="Remove ${p.name} from comparison">Remove</button>
      </th>`,
      )
      .join("");

    const body = ROWS.map(
      ([label, fn, winners, text]) => `
      <tr>
        <th scope="row">${label}</th>
        ${items
          .map((p) => {
            const win = winners && winners.has(p.id);
            return `<td${win ? ' class="is-best"' : ""}>${fn(p)}${win ? tag(text) : ""}</td>`;
          })
          .join("")}
      </tr>`,
    ).join("");

    view.innerHTML = `
      <div class="table-scroll" tabindex="0" role="region" aria-label="Property comparison, scrollable">
        <table class="compare-table">
          <caption class="visually-hidden">Comparison of ${n} ${n === 1 ? "home" : "homes"}</caption>
          <thead><tr><td class="compare-table__corner"></td>${head}</tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>`;
  };

  /* ---------- Events ---------- */
  view.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-remove]");
    if (!btn) return;
    UI.write(
      KEY,
      UI.read(KEY).filter((id) => id !== btn.dataset.remove),
    );
    notify();
  });

  addBtn.addEventListener("click", () => {
    const list = UI.read(KEY);
    if (list.length >= MAX) {
      UI.toast(`You can compare up to ${MAX} homes`);
      return;
    }
    if (addSelect.value && !list.includes(addSelect.value)) {
      UI.write(KEY, [...list, addSelect.value]);
      notify();
    }
  });

  document.addEventListener("realty:change", (e) => {
    if (e.detail && e.detail.key === KEY) render();
  });

  render();
})();
