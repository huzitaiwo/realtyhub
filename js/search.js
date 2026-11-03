/* ==========================================================================
   REALTY — js/search.js
   Search results pages (Buy / Rent): filter bar + drawer, filtering/sorting,
   bidirectional list ↔ map highlighting, simulated pan/zoom map, popup.
   Page markup: <main data-search data-purpose="buy|rent">
   ========================================================================== */
(() => {
  "use strict";

  const root = document.querySelector("[data-search]");
  if (!root) return;

  const purpose = root.dataset.purpose === "rent" ? "rent" : "buy";
  const CONFIG = {
    buy: {
      steps: [
        250000, 500000, 750000, 1000000, 1500000, 2000000, 3000000, 5000000,
      ],
      priceMin: 500000,
      priceMax: 1500000,
    },
    rent: {
      steps: [1000, 2000, 3000, 4000, 6000, 8000, 12000],
      priceMin: 2000,
      priceMax: 6000,
    },
  }[purpose];

  const icon = (name) =>
    `<svg class="icon" aria-hidden="true" focusable="false"><use href="#i-${name}"></use></svg>`;
  const fmt = (v) => {
    if (purpose === "rent") return `$${v.toLocaleString("en-US")}`;
    return v >= 1e6
      ? `$${+(v / 1e6).toFixed(2)}m`
      : `$${Math.round(v / 1000)}k`;
  };

  /* ---------- Options ---------- */
  const BEDS = [
    [0, "Any"],
    [-1, "Studio"],
    [1, "1+"],
    [2, "2+"],
    [3, "3+"],
    [4, "4+"],
    [5, "5+"],
  ];
  const BATHS = [
    [0, "Any"],
    [1, "1+"],
    [2, "2+"],
    [3, "3+"],
  ];
  const TYPES = [
    ["house", "House"],
    ["apartment", "Apartment"],
    ["land", "Land"],
    ["new-build", "New build"],
    ["commercial", "Commercial"],
  ];
  const FEATURES = [
    ["parking", "Parking"],
    ["garden", "Garden"],
    ["pool", "Pool"],
    ["balcony", "Balcony"],
    ["furnished", "Furnished"],
    ["air-conditioning", "Air conditioning"],
    ["security", "Security"],
    ["elevator", "Elevator"],
    ["pet-friendly", "Pet friendly"],
  ];
  const ADDED = [
    ["any", "Any time"],
    ["1", "Added today"],
    ["7", "Last 7 days"],
    ["30", "Last 30 days"],
  ];
  const SORT = [
    ["recommended", "Recommended"],
    ["newest", "Newest"],
    ["price-asc", "Price low to high"],
    ["price-desc", "Price high to low"],
    ["viewed", "Most viewed"],
    ["reduced", "Recently reduced"],
    ["largest", "Largest"],
    ["beds", "Most bedrooms"],
  ];

  /* ---------- State ---------- */
  const EMPTY = {
    q: "",
    priceMin: 0,
    priceMax: 0,
    beds: 0,
    baths: 0,
    types: [],
    features: [],
    verified: false,
    added: "any",
  };
  const DEFAULTS = {
    ...EMPTY,
    priceMin: CONFIG.priceMin,
    priceMax: CONFIG.priceMax,
    beds: 2,
    types: ["house", "apartment"],
  };
  const state = { ...DEFAULTS, sort: "recommended" };

  const params = new URLSearchParams(location.search);
  if (
    [...params.keys()].some((k) => ["q", "type", "price", "beds"].includes(k))
  ) {
    Object.assign(state, EMPTY);
    state.q = (params.get("q") || "").trim();
    const type = params.get("type");
    if (type)
      state.types = [["villa", "townhouse"].includes(type) ? "house" : type];
    const price = params.get("price");
    if (price) {
      const [a, b] = price.split("-");
      state.priceMin = Number(a) || 0;
      state.priceMax = Number(b) || 0;
    }
    if (params.get("beds")) state.beds = Number(params.get("beds")) || 0;
  }

  /* ---------- Build filter bar + drawer ---------- */
  const radioList = (name, key, opts) =>
    opts
      .map(
        ([v, l]) =>
          `<label class="option"><input type="radio" name="${name}" value="${v}" data-filter="${key}"><span>${l}</span></label>`,
      )
      .join("");
  const checkList = (key, opts) =>
    opts
      .map(
        ([v, l]) =>
          `<label class="option"><input type="checkbox" value="${v}" data-filter="${key}"><span>${l}</span></label>`,
      )
      .join("");
  const seg = (name, key, opts) =>
    `<div class="seg">${opts
      .map(
        ([v, l]) =>
          `<label class="seg__item"><input class="visually-hidden" type="radio" name="${name}" value="${v}" data-filter="${key}"><span>${l}</span></label>`,
      )
      .join("")}</div>`;
  const selectField = (
    key,
    label,
    opts,
  ) => `<label class="field"><span class="field__label">${label}</span>
    <select class="field__control field__control--boxed" data-filter="${key}">${opts.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select></label>`;

  const minOpts = [[0, "No minimum"], ...CONFIG.steps.map((v) => [v, fmt(v)])];
  const maxOpts = [[0, "No maximum"], ...CONFIG.steps.map((v) => [v, fmt(v)])];

  const chip = (id, label, panel, { lead = "", end = false } = {}) => `
    <div class="chip-wrap">
      <button class="chip${lead ? " chip--sort" : ""}" type="button" aria-expanded="false" aria-controls="pop-${id}" data-chip="${id}">
        ${lead ? icon(lead) : ""}<span data-chip-label="${id}">${label}</span>${lead ? "" : icon("chevron-down")}
      </button>
      <div class="popover${end ? " popover--end" : ""}" id="pop-${id}" role="group" aria-label="${label}" data-popover="${id}" inert>${panel}</div>
    </div>`;

  root.querySelector("[data-filter-bar]").innerHTML = `
    <div class="filter-bar__main">
      <button class="chip chip--filters" type="button" data-open-drawer aria-haspopup="dialog" aria-controls="filter-drawer">
        ${icon("sliders")}<span>Filters</span><span class="chip__count" data-filter-count>00</span>
      </button>
      ${chip("price", "Any price", `<div class="popover__grid">${selectField("priceMin", "Minimum", minOpts)}${selectField("priceMax", "Maximum", maxOpts)}</div>`)}
      ${chip("beds", "Any bedrooms", radioList("p-beds", "beds", BEDS))}
      ${chip("types", "Any type", checkList("types", TYPES))}
      ${chip(
        "verified",
        "Verified",
        radioList("p-verified", "verified", [
          ["false", "All listings"],
          ["true", "Verified only"],
        ]),
      )}
      ${chip("added", "Recently added", radioList("p-added", "added", ADDED))}
    </div>
    <div class="filter-bar__sort">${chip("sort", "Recommended", radioList("p-sort", "sort", SORT), { lead: "sort", end: true })}</div>`;

  const scrim = document.createElement("div");
  scrim.className = "scrim";
  const drawer = document.createElement("aside");
  drawer.className = "drawer";
  drawer.id = "filter-drawer";
  drawer.setAttribute("role", "dialog");
  drawer.setAttribute("aria-modal", "true");
  drawer.setAttribute("aria-labelledby", "drawer-title");
  drawer.inert = true;
  drawer.innerHTML = `
    <div class="drawer__head">
      <h2 class="drawer__title" id="drawer-title">Filters</h2>
      <button class="icon-btn" type="button" data-close-drawer aria-label="Close filters">${icon("close")}</button>
    </div>
    <div class="drawer__body">
      <fieldset class="filter-group"><legend>Price</legend>
        <div class="popover__grid">${selectField("priceMin", "Minimum", minOpts)}${selectField("priceMax", "Maximum", maxOpts)}</div></fieldset>
      <fieldset class="filter-group"><legend>Bedrooms</legend>${seg("d-beds", "beds", BEDS)}</fieldset>
      <fieldset class="filter-group"><legend>Bathrooms</legend>${seg("d-baths", "baths", BATHS)}</fieldset>
      <fieldset class="filter-group"><legend>Property type</legend><div class="option-grid">${checkList("types", TYPES)}</div></fieldset>
      <fieldset class="filter-group"><legend>Features</legend><div class="option-grid">${checkList("features", FEATURES)}</div></fieldset>
      <fieldset class="filter-group"><legend>Listing</legend>
        <label class="option"><input type="checkbox" data-filter="verified"><span>Verified listings only</span></label>
        ${selectField("added", "Added", ADDED)}</fieldset>
    </div>
    <div class="drawer__foot">
      <button class="drawer__clear" type="button" data-clear-all>Clear all</button>
      <button class="btn btn--dark" type="button" data-close-drawer data-drawer-apply>Show homes</button>
    </div>`;
  document.body.append(scrim, drawer);

  /* ---------- Elements ---------- */
  const list = root.querySelector("[data-results]");
  const items = [...list.children];
  const cardOf = (li) => li.querySelector("[data-property-id]");
  const empty = root.querySelector("[data-empty]");
  const countEl = root.querySelector("[data-result-count]");
  const map = root.querySelector("[data-map]");
  const canvas = map.querySelector("[data-canvas]");
  const popup = map.querySelector("[data-popup]");
  const markers = [...map.querySelectorAll(".marker")];
  const isSheet = () => window.matchMedia("(max-width: 56.25em)").matches;

  /* ---------- Filtering + sorting ---------- */
  const matches = (el) => {
    const d = el.dataset;
    const price = +d.price;
    if (
      state.q &&
      !`${d.area} ${d.propertyName}`
        .toLowerCase()
        .includes(state.q.toLowerCase())
    )
      return false;
    if (state.priceMin && price < state.priceMin) return false;
    if (state.priceMax && price > state.priceMax) return false;
    if (state.beds === -1 ? +d.beds !== 0 : state.beds && +d.beds < state.beds)
      return false;
    if (state.baths && +d.baths < state.baths) return false;
    if (state.types.length && !state.types.includes(d.type)) return false;
    if (state.verified && d.verified !== "true") return false;
    if (state.added !== "any" && +d.added > +state.added) return false;
    if (
      state.features.length &&
      !state.features.every((f) => (d.features || "").split(" ").includes(f))
    )
      return false;
    return true;
  };

  const COMPARE = {
    recommended: (a, b) => +a.dataset.order - +b.dataset.order,
    newest: (a, b) => +cardOf(a).dataset.added - +cardOf(b).dataset.added,
    "price-asc": (a, b) => +cardOf(a).dataset.price - +cardOf(b).dataset.price,
    "price-desc": (a, b) => +cardOf(b).dataset.price - +cardOf(a).dataset.price,
    viewed: (a, b) => +cardOf(b).dataset.views - +cardOf(a).dataset.views,
    reduced: (a, b) =>
      (cardOf(b).dataset.reduced === "true") -
      (cardOf(a).dataset.reduced === "true"),
    largest: (a, b) => +cardOf(b).dataset.sqft - +cardOf(a).dataset.sqft,
    beds: (a, b) => +cardOf(b).dataset.beds - +cardOf(a).dataset.beds,
  };

  const optionLabel = (opts, value) =>
    (opts.find(([v]) => String(v) === String(value)) || [, ""])[1];

  const activeCount = () =>
    (state.q ? 1 : 0) +
    (state.priceMin || state.priceMax ? 1 : 0) +
    (state.beds ? 1 : 0) +
    (state.baths ? 1 : 0) +
    (state.types.length ? 1 : 0) +
    (state.features.length ? 1 : 0) +
    (state.verified ? 1 : 0) +
    (state.added !== "any" ? 1 : 0);

  const priceLabel = () => {
    const { priceMin: a, priceMax: b } = state;
    if (a && b) return `${fmt(a)} — ${fmt(b)}`;
    if (a) return `${fmt(a)}+`;
    if (b) return `Up to ${fmt(b)}`;
    return "Any price";
  };

  const updateLabels = () => {
    const set = (id, text, active) => {
      const label = root.querySelector(`[data-chip-label="${id}"]`);
      if (!label) return;
      label.textContent = text;
      label.closest(".chip").classList.toggle("is-active", active);
    };
    set("price", priceLabel(), !!(state.priceMin || state.priceMax));
    set(
      "beds",
      state.beds === 0
        ? "Any bedrooms"
        : state.beds === -1
          ? "Studio"
          : `${state.beds}+ bedrooms`,
      !!state.beds,
    );
    set(
      "types",
      state.types.length
        ? state.types.length <= 2
          ? state.types.map((t) => optionLabel(TYPES, t)).join(" & ")
          : `${state.types.length} types`
        : "Any type",
      !!state.types.length,
    );
    set("verified", "Verified", state.verified);
    set(
      "added",
      state.added === "any"
        ? "Recently added"
        : optionLabel(ADDED, state.added),
      state.added !== "any",
    );
    set("sort", optionLabel(SORT, state.sort), false);
    root.querySelector("[data-filter-count]").textContent = String(
      activeCount(),
    ).padStart(2, "0");
  };

  const syncInputs = () => {
    document.querySelectorAll("[data-filter]").forEach((el) => {
      const key = el.dataset.filter;
      if (key === "types" || key === "features")
        el.checked = state[key].includes(el.value);
      else if (key === "verified")
        el.checked =
          el.type === "checkbox"
            ? state.verified
            : String(state.verified) === el.value;
      else if (el.tagName === "SELECT") el.value = String(state[key]);
      else el.checked = String(state[key]) === el.value;
    });
  };

  let selectedId = null;

  const apply = () => {
    const visible = [];
    items.forEach((li) => {
      const ok = matches(cardOf(li));
      li.hidden = !ok;
      if (ok) visible.push(li);
      const marker = markers.find(
        (m) => m.dataset.for === cardOf(li).dataset.propertyId,
      );
      if (marker) marker.hidden = !ok;
    });
    [...items]
      .sort(COMPARE[state.sort] || COMPARE.recommended)
      .forEach((li) => list.append(li));

    empty.hidden = visible.length > 0;
    const total = Number(countEl.dataset.total);
    const filtered = visible.length < items.length;
    countEl.textContent = filtered
      ? `${visible.length} of ${total} addresses match your criteria`
      : `${total} addresses have been located for your criteria`;
    const apply = document.querySelector("[data-drawer-apply]");
    if (apply)
      apply.textContent = visible.length
        ? `Show ${visible.length} ${visible.length === 1 ? "home" : "homes"}`
        : "No homes match";

    const stillVisible = visible.some(
      (li) => cardOf(li).dataset.propertyId === selectedId,
    );
    if (!stillVisible)
      select(visible.length ? cardOf(visible[0]).dataset.propertyId : null, {
        popup: false,
      });
  };

  const update = () => {
    syncInputs();
    updateLabels();
    apply();
  };

  const NUMERIC = new Set(["beds", "baths", "priceMin", "priceMax"]);
  document.addEventListener("change", (e) => {
    const el = e.target.closest("[data-filter]");
    if (!el) return;
    const key = el.dataset.filter;
    if (key === "types" || key === "features") {
      const set = new Set(state[key]);
      if (el.checked) set.add(el.value);
      else set.delete(el.value);
      state[key] = [...set];
    } else if (key === "verified")
      state.verified =
        el.type === "checkbox" ? el.checked : el.value === "true";
    else state[key] = NUMERIC.has(key) ? Number(el.value) : el.value;
    update();
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-clear-all]")) return;
    const sort = state.sort;
    Object.assign(state, EMPTY, { types: [], features: [], sort });
    update();
  });

  /* ---------- Popovers ---------- */
  let openPopover = null;
  const closePopover = () => {
    if (!openPopover) return;
    const { btn, pop } = openPopover;
    btn.setAttribute("aria-expanded", "false");
    pop.classList.remove("is-open");
    pop.inert = true;
    if (!drawer.classList.contains("is-open"))
      scrim.classList.remove("is-visible");
    openPopover = null;
  };
  const showPopover = (btn) => {
    closePopover();
    const pop = document.getElementById(btn.getAttribute("aria-controls"));
    btn.setAttribute("aria-expanded", "true");
    pop.classList.add("is-open");
    pop.inert = false;
    if (isSheet()) scrim.classList.add("is-visible");
    openPopover = { btn, pop };
  };

  root.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-chip]");
    if (!btn) return;
    if (openPopover && openPopover.btn === btn) closePopover();
    else showPopover(btn);
  });
  document.addEventListener("click", (e) => {
    if (openPopover && !e.target.closest(".chip-wrap")) closePopover();
  });

  /* ---------- Drawer ---------- */
  const openDrawer = () => {
    closePopover();
    drawer.classList.add("is-open");
    drawer.inert = false;
    scrim.classList.add("is-visible");
    document.documentElement.classList.add("is-locked");
    drawer.querySelector("[data-close-drawer]").focus({ preventScroll: true });
  };
  const closeDrawer = () => {
    drawer.classList.remove("is-open");
    drawer.inert = true;
    scrim.classList.remove("is-visible");
    document.documentElement.classList.remove("is-locked");
    root.querySelector("[data-open-drawer]")?.focus({ preventScroll: true });
  };
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-open-drawer]")) openDrawer();
    else if (e.target.closest("[data-close-drawer]")) closeDrawer();
  });
  scrim.addEventListener("click", () => {
    if (drawer.classList.contains("is-open")) closeDrawer();
    else closePopover();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (drawer.classList.contains("is-open")) closeDrawer();
      else if (openPopover) {
        const b = openPopover.btn;
        closePopover();
        b.focus();
      } else closePopup();
    }
    if (e.key === "Tab" && drawer.classList.contains("is-open")) {
      const f = [
        ...drawer.querySelectorAll("button, input, select, [href]"),
      ].filter((x) => !x.disabled && x.offsetParent !== null);
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  /* ---------- List ↔ map highlighting ---------- */
  const markerOf = (id) => markers.find((m) => m.dataset.for === id);
  const cardById = (id) => list.querySelector(`[data-property-id="${id}"]`);
  const cards = () => items.map(cardOf);

  const setActive = (id) => {
    cards().forEach((c) =>
      c.classList.toggle("is-active", c.dataset.propertyId === id),
    );
    markers.forEach((m) =>
      m.classList.toggle("is-active", m.dataset.for === id),
    );
  };

  function select(id, { popup: withPopup = false, scroll = false } = {}) {
    selectedId = id;
    cards().forEach((c) =>
      c.classList.toggle("is-selected", c.dataset.propertyId === id),
    );
    markers.forEach((m) =>
      m.classList.toggle("is-selected", m.dataset.for === id),
    );
    if (id && withPopup) openPopup(id);
    else closePopup();
    if (id && scroll && !isSheet())
      cardById(id)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  list.addEventListener("mouseover", (e) => {
    const c = e.target.closest("[data-property-id]");
    setActive(c ? c.dataset.propertyId : null);
  });
  list.addEventListener("mouseleave", () => setActive(null));
  list.addEventListener("focusin", (e) => {
    const c = e.target.closest("[data-property-id]");
    if (c) setActive(c.dataset.propertyId);
  });
  list.addEventListener("focusout", () => setActive(null));
  list.addEventListener("click", (e) => {
    if (e.target.closest("a, button")) return;
    const c = e.target.closest("[data-property-id]");
    if (c) select(c.dataset.propertyId, { popup: true });
  });

  markers.forEach((m) => {
    m.addEventListener("mouseenter", () => setActive(m.dataset.for));
    m.addEventListener("mouseleave", () => setActive(null));
    m.addEventListener("focus", () => setActive(m.dataset.for));
    m.addEventListener("blur", () => setActive(null));
    m.addEventListener("click", () =>
      select(m.dataset.for, { popup: true, scroll: true }),
    );
  });

  /* ---------- Popup ---------- */
  let popupMarker = null;
  function openPopup(id) {
    const card = cardById(id);
    const marker = markerOf(id);
    if (!card || !marker) return;
    popup.innerHTML = `
      <button class="map-popup__close" type="button" aria-label="Close preview" data-popup-close>${icon("close")}</button>
      <img src="${card.querySelector("img").getAttribute("src")}" alt="">
      <div class="map-popup__body">
        <p class="price">${card.querySelector(".price").textContent}</p>
        <p class="map-popup__title">${card.dataset.propertyName} <span>· ${card.dataset.area}</span></p>
        <a class="link-arrow" href="${card.querySelector(".property-card__title a").getAttribute("href")}">View details ${icon("arrow-up-right")}</a>
      </div>`;
    popupMarker = marker;
    popup.classList.add("is-open");
    placePopup();
  }
  function closePopup() {
    popup.classList.remove("is-open");
    popupMarker = null;
  }
  function placePopup() {
    if (!popupMarker || !popup.classList.contains("is-open")) return;
    const mr = map.getBoundingClientRect();
    const r = popupMarker.getBoundingClientRect();
    const half = popup.offsetWidth / 2;
    const x = r.left + r.width / 2 - mr.left;
    popup.style.left = `${Math.min(Math.max(x, half + 8), mr.width - half - 8)}px`;
    popup.style.top = `${Math.max(r.top - mr.top, popup.offsetHeight + 24)}px`;
  }
  popup.addEventListener("click", (e) => {
    if (e.target.closest("[data-popup-close]")) closePopup();
  });

  /* ---------- Pan + zoom (simulated map) ---------- */
  let z = 1;
  let tx = 0;
  let ty = 0;
  const Z_MIN = 1;
  const Z_MAX = 2.4;
  const paint = () => {
    const w = map.clientWidth;
    const h = map.clientHeight;
    tx = Math.min(0, Math.max(tx, -(z - 1) * w));
    ty = Math.min(0, Math.max(ty, -(z - 1) * h));
    canvas.style.setProperty("--z", z);
    canvas.style.transform = `translate(${tx}px, ${ty}px) scale(${z})`;
    map.classList.toggle("is-zoomed", z > 1);
  };
  const zoomBy = (
    delta,
    cx = map.clientWidth / 2,
    cy = map.clientHeight / 2,
  ) => {
    const nz = Math.min(Z_MAX, Math.max(Z_MIN, +(z + delta).toFixed(2)));
    if (nz === z) return;
    tx = cx - (cx - tx) * (nz / z);
    ty = cy - (cy - ty) * (nz / z);
    z = nz;
    canvas.classList.add("is-animating");
    paint();
    setTimeout(() => {
      canvas.classList.remove("is-animating");
      placePopup();
    }, 460);
  };

  map
    .querySelectorAll("[data-zoom]")
    .forEach((btn) =>
      btn.addEventListener("click", () =>
        zoomBy(Number(btn.dataset.zoom) * 0.6),
      ),
    );
  map.addEventListener(
    "wheel",
    (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const r = map.getBoundingClientRect();
      zoomBy(e.deltaY < 0 ? 0.3 : -0.3, e.clientX - r.left, e.clientY - r.top);
    },
    { passive: false },
  );

  let drag = null;
  canvas.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".marker") || z === 1) return;
    drag = { x: e.clientX, y: e.clientY, tx, ty };
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add("is-dragging");
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag) return;
    tx = drag.tx + (e.clientX - drag.x);
    ty = drag.ty + (e.clientY - drag.y);
    paint();
    placePopup();
  });
  const endDrag = () => {
    drag = null;
    canvas.classList.remove("is-dragging");
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  window.addEventListener("resize", () => {
    paint();
    placePopup();
  });

  /* ---------- Init ---------- */
  paint();
  update();
  select(
    selectedId ||
      (items.find((li) => !li.hidden)
        ? cardOf(items.find((li) => !li.hidden)).dataset.propertyId
        : null),
    { popup: false },
  );
})();
