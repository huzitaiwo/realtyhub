/* ==========================================================================
   REALTY — js/searches.js
   Saved searches: create · edit · pause/resume alerts · delete (localStorage)
   ========================================================================== */
(() => {
  "use strict";

  const D = window.RealtyData;
  const UI = window.RealtyUI;
  const list = document.querySelector("[data-search-list]");
  if (!D || !UI || !list) return;

  const KEY = "realty:searches";
  const empty = document.querySelector("[data-search-empty]");
  const count = document.querySelector("[data-search-count]");
  const note = document.querySelector(".compare-note");

  const TYPES = { "": "Any type", house: "House", apartment: "Apartment" };
  const BEDS = [
    [0, "Any bedrooms"],
    [1, "1+ bedrooms"],
    [2, "2+ bedrooms"],
    [3, "3+ bedrooms"],
    [4, "4+ bedrooms"],
    [5, "5+ bedrooms"],
  ];

  /* ---------- Seed (first visit only) ---------- */
  try {
    if (localStorage.getItem(KEY) === null) {
      UI.write(KEY, [
        {
          id: "s-1",
          name: "Richmond family homes",
          purpose: "buy",
          q: "Richmond",
          type: "",
          beds: 3,
          priceMin: 0,
          priceMax: 1500000,
          alerts: true,
        },
        {
          id: "s-2",
          name: "Clerkenwell apartments",
          purpose: "buy",
          q: "Clerkenwell",
          type: "apartment",
          beds: 2,
          priceMin: 0,
          priceMax: 700000,
          alerts: true,
        },
        {
          id: "s-3",
          name: "Coastal rentals",
          purpose: "rent",
          q: "West Hove",
          type: "",
          beds: 0,
          priceMin: 0,
          priceMax: 5000,
          alerts: true,
        },
      ]);
    }
  } catch {
    /* storage unavailable */
  }

  /* ---------- Helpers ---------- */
  const money = (v, purpose) =>
    purpose === "rent"
      ? `$${v.toLocaleString("en-US")}`
      : v >= 1e6
        ? `$${+(v / 1e6).toFixed(2)}m`
        : `$${Math.round(v / 1000)}k`;
  const esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );

  const chips = (s) => {
    const out = [s.purpose === "rent" ? "Rent" : "Buy", s.q || "Anywhere"];
    if (s.type) out.push(TYPES[s.type]);
    if (s.beds) out.push(`${s.beds}+ beds`);
    if (s.priceMin && s.priceMax)
      out.push(
        `${money(s.priceMin, s.purpose)} – ${money(s.priceMax, s.purpose)}`,
      );
    else if (s.priceMax) out.push(`Up to ${money(s.priceMax, s.purpose)}`);
    else if (s.priceMin) out.push(`From ${money(s.priceMin, s.purpose)}`);
    return out;
  };

  const matches = (s) =>
    D.PROPERTIES.filter((p) => {
      if (p.purpose !== s.purpose) return false;
      if (
        s.q &&
        !`${p.area} ${p.name}`.toLowerCase().includes(s.q.toLowerCase())
      )
        return false;
      if (s.type === "house" && !/house|villa|townhouse/i.test(p.type))
        return false;
      if (s.type === "apartment" && !/apartment/i.test(p.type)) return false;
      if (s.beds && p.beds < s.beds) return false;
      if (s.priceMin && p.price < s.priceMin) return false;
      if (s.priceMax && p.price > s.priceMax) return false;
      return true;
    }).length;

  const resultsHref = (s) => {
    const params = new URLSearchParams();
    if (s.q) params.set("q", s.q);
    if (s.type) params.set("type", s.type);
    if (s.priceMin || s.priceMax)
      params.set("price", `${s.priceMin || ""}-${s.priceMax || ""}`);
    if (s.beds) params.set("beds", s.beds);
    return `${s.purpose === "rent" ? "rent" : "buy"}.html?${params}`;
  };

  /* ---------- Render ---------- */
  const render = () => {
    const items = UI.read(KEY);
    const n = items.length;
    count.textContent = `${n} saved ${n === 1 ? "search" : "searches"}`;
    empty.hidden = n > 0;
    note.hidden = n === 0;

    list.innerHTML = items
      .map((s) => {
        const m = matches(s);
        return `
      <li class="entry" data-id="${s.id}">
        <div>
          <h2 class="entry__title">${esc(s.name)}</h2>
          <ul class="entry__chips" aria-label="Criteria">${chips(s)
            .map((c) => `<li>${esc(c)}</li>`)
            .join("")}</ul>
          <p class="entry__sub entry__sub--spaced">${m} ${m === 1 ? "match" : "matches"} in the demo collection</p>
        </div>
        <div class="entry__actions">
          <label class="switch">
            <input class="visually-hidden" type="checkbox" data-toggle="${s.id}" ${s.alerts ? "checked" : ""}>
            <span class="switch__track" aria-hidden="true"></span>
            <span class="switch__label">${s.alerts ? "Alerts on" : "Paused"}</span>
          </label>
          <button class="text-btn" type="button" data-edit="${s.id}"><svg class="icon icon--sm" aria-hidden="true"><use href="#i-edit"></use></svg>Edit</button>
          <button class="text-btn text-btn--danger" type="button" data-delete="${s.id}"><svg class="icon icon--sm" aria-hidden="true"><use href="#i-trash"></use></svg>Delete</button>
          <a class="btn btn--outline btn--sm" href="${resultsHref(s)}">View results <svg class="icon" aria-hidden="true"><use href="#i-arrow-right"></use></svg></a>
        </div>
      </li>`;
      })
      .join("");
  };

  /* ---------- Create / edit dialog ---------- */
  const dlg = document.createElement("dialog");
  dlg.className = "dialog";
  dlg.setAttribute("aria-labelledby", "ss-title");
  dlg.innerHTML = `
    <form data-ss-form novalidate>
      <header class="dialog__head">
        <div><p class="eyebrow">Saved search</p><h2 class="dialog__title" id="ss-title">New saved search</h2></div>
        <button class="icon-btn" type="button" data-ss-cancel aria-label="Close"><svg class="icon" aria-hidden="true"><use href="#i-close"></use></svg></button>
      </header>
      <div class="dialog__body">
        <div class="form-grid">
          <label class="field span-2"><span class="field__label">Name</span>
            <input class="input" name="name" type="text" maxlength="60" placeholder="e.g. Weekend family homes" required>
            <span class="field__error" data-name-error role="alert"></span></label>
          <label class="field"><span class="field__label">Looking to</span>
            <select class="input" name="purpose"><option value="buy">Buy</option><option value="rent">Rent</option></select></label>
          <label class="field"><span class="field__label">Property type</span>
            <select class="input" name="type">${Object.entries(TYPES)
              .map(([v, l]) => `<option value="${v}">${l}</option>`)
              .join("")}</select></label>
          <label class="field span-2"><span class="field__label">Location</span>
            <input class="input" name="q" type="text" placeholder="City, neighbourhood or postcode" autocomplete="off"></label>
          <label class="field"><span class="field__label">Bedrooms</span>
            <select class="input" name="beds">${BEDS.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select></label>
          <span class="field"></span>
          <label class="field"><span class="field__label">Min price</span>
            <input class="input" name="priceMin" type="number" inputmode="numeric" min="0" step="500" placeholder="No minimum"></label>
          <label class="field"><span class="field__label">Max price</span>
            <input class="input" name="priceMax" type="number" inputmode="numeric" min="0" step="500" placeholder="No maximum"></label>
          <label class="switch span-2">
            <input class="visually-hidden" type="checkbox" name="alerts" checked>
            <span class="switch__track" aria-hidden="true"></span>
            <span class="switch__label">Alert me when a matching home appears</span>
          </label>
        </div>
      </div>
      <footer class="dialog__foot dialog__foot--end">
        <button class="btn btn--outline btn--sm" type="button" data-ss-cancel>Cancel</button>
        <button class="btn btn--dark btn--sm" type="submit">Save search</button>
      </footer>
    </form>`;
  document.body.append(dlg);

  const form = dlg.querySelector("[data-ss-form]");
  let editingId = null;

  const openDialog = (search) => {
    editingId = search ? search.id : null;
    dlg.querySelector("#ss-title").textContent = search
      ? "Edit saved search"
      : "New saved search";
    const s = search || {
      name: "",
      purpose: "buy",
      q: "",
      type: "",
      beds: 0,
      priceMin: 0,
      priceMax: 0,
      alerts: true,
    };
    form.elements.name.value = s.name;
    form.elements.purpose.value = s.purpose;
    form.elements.type.value = s.type;
    form.elements.q.value = s.q;
    form.elements.beds.value = String(s.beds);
    form.elements.priceMin.value = s.priceMin || "";
    form.elements.priceMax.value = s.priceMax || "";
    form.elements.alerts.checked = !!s.alerts;
    form.elements.name.removeAttribute("aria-invalid");
    dlg.querySelector("[data-name-error]").textContent = "";
    dlg.showModal();
    form.elements.name.focus();
  };

  dlg.addEventListener("click", (e) => {
    if (e.target === dlg || e.target.closest("[data-ss-cancel]")) dlg.close();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.elements.name.value.trim();
    if (!name) {
      form.elements.name.setAttribute("aria-invalid", "true");
      dlg.querySelector("[data-name-error]").textContent =
        "Please give this search a name.";
      form.elements.name.focus();
      return;
    }
    const record = {
      id: editingId || `s-${Date.now()}`,
      name,
      purpose: form.elements.purpose.value,
      type: form.elements.type.value,
      q: form.elements.q.value.trim(),
      beds: Number(form.elements.beds.value) || 0,
      priceMin: Math.max(0, Number(form.elements.priceMin.value) || 0),
      priceMax: Math.max(0, Number(form.elements.priceMax.value) || 0),
      alerts: form.elements.alerts.checked,
    };
    const items = UI.read(KEY);
    const i = items.findIndex((s) => s.id === record.id);
    if (i > -1) items[i] = record;
    else items.unshift(record);
    UI.write(KEY, items);
    dlg.close();
    render();
    UI.toast(editingId ? "Saved search updated" : "Saved search created");
  });

  /* ---------- List events ---------- */
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-new-search]")) {
      openDialog(null);
      return;
    }
    const edit = e.target.closest("[data-edit]");
    if (edit) {
      openDialog(UI.read(KEY).find((s) => s.id === edit.dataset.edit));
      return;
    }
    const del = e.target.closest("[data-delete]");
    if (del) {
      UI.confirm({
        title: "Delete this saved search?",
        text: "You will stop receiving alerts for it. This cannot be undone.",
        confirmLabel: "Delete",
        danger: true,
      }).then((yes) => {
        if (!yes) return;
        UI.write(
          KEY,
          UI.read(KEY).filter((s) => s.id !== del.dataset.delete),
        );
        render();
        UI.toast("Saved search deleted");
      });
    }
  });

  list.addEventListener("change", (e) => {
    const t = e.target.closest("[data-toggle]");
    if (!t) return;
    const items = UI.read(KEY);
    const s = items.find((x) => x.id === t.dataset.toggle);
    if (!s) return;
    s.alerts = t.checked;
    UI.write(KEY, items);
    t.closest(".switch").querySelector(".switch__label").textContent = s.alerts
      ? "Alerts on"
      : "Paused";
    UI.toast(s.alerts ? "Alerts resumed" : "Alerts paused");
  });

  render();
})();
