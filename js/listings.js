/* ==========================================================================
   REALTY — js/listings.js
   Agent listings: table · filter · status · create / edit / delete · photos.
   Stored in localStorage "realty:custom-listings". js/data.js merges these
   into the public collection (property page, saved, compare).
   ========================================================================== */
(() => {
  "use strict";

  const D = window.RealtyData;
  const UI = window.RealtyUI;
  const tbody = document.querySelector("[data-listing-body]");
  if (!D || !UI || !tbody) return;

  const KEY = "realty:custom-listings";
  const MAX_PHOTOS = 4;
  const OWNER =
    (UI.getObject("realty:profile", {}).name || "").trim() || "Handsome";
  const TYPES = [
    "House",
    "Apartment",
    "Condo",
    "Villa",
    "Townhouse",
    "Duplex",
    "Penthouse",
    "Studio",
    "Land",
    "Office",
    "Retail",
    "Warehouse",
  ];
  const STATUS = [
    ["draft", "Draft"],
    ["active", "Active"],
    ["under-offer", "Under offer"],
    ["closed", "Sold / let"],
  ];
  const SEED_META = {
    "bracken-house": [320, 4],
    "olive-court": [410, 6],
    "linden-house": [340, 3],
    "seawall-terrace": [120, 1],
  };

  const ic = (n) =>
    `<svg class="icon icon--sm" aria-hidden="true"><use href="#i-${n}"></use></svg>`;
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
  const ago = (m) => new Date(Date.now() - m * 60000).toISOString();
  const rel = (iso) => {
    const m = Math.max(1, Math.round((Date.now() - new Date(iso)) / 60000));
    if (m < 60) return `${m} min ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h} hr ago`;
    const d = Math.round(h / 24);
    return d < 7
      ? `${d} ${d === 1 ? "day" : "days"} ago`
      : new Date(iso).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        });
  };
  const slug = (s) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  /* ---------- Storage ---------- */
  const load = () => {
    try {
      const v = JSON.parse(localStorage.getItem(KEY));
      return Array.isArray(v) ? v : null;
    } catch {
      return null;
    }
  };
  let list = load();
  const persist = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
      return true;
    } catch {
      return false;
    }
  };

  if (list === null) {
    list = D.PROPERTIES.filter((p) => p.agency === "Aster & Field").map(
      (p, i) => ({
        ...p,
        listingStatus: "active",
        views: (SEED_META[p.id] || [100])[0],
        leads: (SEED_META[p.id] || [0, 1])[1],
        updatedAt: ago(60 * (3 + i * 20)),
      }),
    );
    persist();
  }

  const labelFor = (rec, prev) => {
    if (rec.listingStatus === "under-offer") return "Under offer";
    if (rec.listingStatus === "closed")
      return rec.purpose === "rent" ? "Let" : "Sold";
    if (prev && !["Under offer", "Sold", "Let"].includes(prev)) return prev;
    return "New to REALTY";
  };

  /* ---------- Render ---------- */
  const filterEl = document.querySelector("[data-listing-filter]");
  const empty = document.querySelector("[data-listing-empty]");
  const count = document.querySelector("[data-listing-count]");
  const tableWrap = document.querySelector(".table-scroll");
  const note = document.querySelector(".compare-note");

  const stat = (key, value) => {
    const el = document.querySelector(`[data-stat="${key}"]`);
    if (el) el.textContent = value;
  };
  const two = (n) => String(n).padStart(2, "0");

  const renderStats = () => {
    stat(
      "active",
      two(list.filter((l) => l.listingStatus === "active").length),
    );
    stat(
      "views",
      list.reduce((s, l) => s + (l.views || 0), 0).toLocaleString("en-US"),
    );
    stat("leads", two(list.reduce((s, l) => s + (l.leads || 0), 0)));
    stat(
      "offers",
      two(list.filter((l) => l.listingStatus === "under-offer").length),
    );
  };

  const rowHTML = (l) => `
    <tr data-id="${l.id}">
      <th scope="row">
        <div class="cell-home">
          ${l.image ? `<img src="${l.image}" alt="" loading="lazy" decoding="async">` : '<span class="cell-home__empty" aria-hidden="true"></span>'}
          <div>
            ${
              l.listingStatus === "draft" &&
              !D.PROPERTIES.some(
                (p) => p.id === l.id && p.agency === "Aster & Field",
              )
                ? `<strong>${esc(l.name)}</strong>`
                : `<a href="${D.href(l)}">${esc(l.name)}</a>`
            }
            <span>${esc(l.area)}</span>
          </div>
        </div>
      </th>
      <td>${l.purpose === "rent" ? "To rent" : "For sale"} · ${esc(l.type)}</td>
      <td class="num">${D.priceHTML(l)}</td>
      <td>
        <label class="visually-hidden" for="st-${l.id}">Status for ${esc(l.name)}</label>
        <select class="input input--sm" id="st-${l.id}" data-status="${l.id}">
          ${STATUS.map(([v, t]) => `<option value="${v}" ${v === l.listingStatus ? "selected" : ""}>${t}</option>`).join("")}
        </select>
      </td>
      <td class="num">${(l.views || 0).toLocaleString("en-US")}</td>
      <td class="num">${l.leads || 0}</td>
      <td>${rel(l.updatedAt)}</td>
      <td class="row-actions">
        <button class="text-btn" type="button" data-edit="${l.id}">${ic("edit")}Edit</button>
        <button class="text-btn text-btn--danger" type="button" data-delete="${l.id}">${ic("trash")}Delete</button>
      </td>
    </tr>`;

  const render = () => {
    renderStats();
    const status = filterEl.querySelector("input:checked").value;
    const items = list
      .filter((l) => status === "all" || l.listingStatus === status)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    count.textContent = `${items.length} ${items.length === 1 ? "listing" : "listings"}`;
    tbody.innerHTML = items.map(rowHTML).join("");
    empty.hidden = items.length > 0;
    tableWrap.hidden = items.length === 0;
    note.hidden = list.length === 0;
  };

  filterEl.addEventListener("change", render);

  /* ---------- Status change ---------- */
  tbody.addEventListener("change", (e) => {
    const sel = e.target.closest("[data-status]");
    if (!sel) return;
    const rec = list.find((l) => l.id === sel.dataset.status);
    if (!rec) return;
    rec.listingStatus = sel.value;
    rec.status = labelFor(rec, rec.status);
    rec.updatedAt = new Date().toISOString();
    if (!persist()) UI.toast("Could not save this change on this device");
    else UI.toast("Status updated");
    render();
  });

  /* ---------- Photos ---------- */
  const compress = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const scale = Math.min(1, 1100 / Math.max(img.width, img.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          canvas
            .getContext("2d")
            .drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.78));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });

  /* ---------- Create / edit dialog ---------- */
  const dlg = document.createElement("dialog");
  dlg.className = "dialog dialog--wide";
  dlg.setAttribute("aria-labelledby", "lf-title");
  dlg.innerHTML = `
    <form data-lf novalidate>
      <header class="dialog__head">
        <div><p class="eyebrow" data-lf-kicker>New listing</p><h2 class="dialog__title" id="lf-title">Add a home</h2></div>
        <button class="icon-btn" type="button" data-lf-cancel aria-label="Close"><svg class="icon" aria-hidden="true"><use href="#i-close"></use></svg></button>
      </header>
      <div class="dialog__body">
        <div class="form-grid">
          <label class="field span-2"><span class="field__label">Listing title</span>
            <input class="input" name="name" type="text" maxlength="70" placeholder="e.g. The Garden House"></label>
          <label class="field"><span class="field__label">Listing type</span>
            <select class="input" name="purpose"><option value="buy">For sale</option><option value="rent">To rent</option></select></label>
          <label class="field"><span class="field__label">Property type</span>
            <select class="input" name="type">${TYPES.map((t) => `<option>${t}</option>`).join("")}</select></label>
          <label class="field span-2"><span class="field__label">Location</span>
            <input class="input" name="area" type="text" maxlength="80" placeholder="Neighbourhood, City"></label>
          <label class="field"><span class="field__label" data-price-label>Price ($)</span>
            <input class="input" name="price" type="number" inputmode="numeric" min="0" step="500"></label>
          <label class="field"><span class="field__label">Floor area (sq ft)</span>
            <input class="input" name="sqft" type="number" inputmode="numeric" min="0" step="10"></label>
          <label class="field"><span class="field__label">Bedrooms</span>
            <select class="input" name="beds"><option value="0">Studio</option>${[1, 2, 3, 4, 5, 6].map((n) => `<option value="${n}">${n}</option>`).join("")}</select></label>
          <label class="field"><span class="field__label">Bathrooms</span>
            <select class="input" name="baths">${[1, 2, 3, 4, 5].map((n) => `<option value="${n}">${n}</option>`).join("")}</select></label>
          <label class="field span-2"><span class="field__label">Description</span>
            <textarea class="input" name="description" rows="4" maxlength="1500" placeholder="Describe the home. Leave empty to use an automatic summary."></textarea></label>

          <fieldset class="field span-2 sched__group">
            <legend class="field__label">Features</legend>
            <div class="choice-grid choice-grid--areas">
              ${Object.entries(D.FEATURE_LABELS)
                .map(
                  ([k, l]) =>
                    `<label class="choice choice--text"><input class="visually-hidden" type="checkbox" name="features" value="${k}"><span><strong>${l}</strong></span></label>`,
                )
                .join("")}
            </div>
          </fieldset>

          <fieldset class="field span-2 sched__group">
            <legend class="field__label">Photos (up to ${MAX_PHOTOS}; the first is the cover)</legend>
            <label class="uploader">
              <input class="visually-hidden" type="file" accept="image/*" multiple data-lf-files>
              <span class="uploader__drop"><svg class="icon" aria-hidden="true"><use href="#i-upload"></use></svg>Choose photos</span>
            </label>
            <ul class="uploader__list" data-lf-previews></ul>
          </fieldset>

          <label class="field span-2"><span class="field__label">Status</span>
            <select class="input" name="listingStatus">${STATUS.map(([v, t]) => `<option value="${v}">${t}</option>`).join("")}</select></label>
        </div>
        <p class="field__error" data-lf-error role="alert"></p>
      </div>
      <footer class="dialog__foot dialog__foot--end">
        <button class="btn btn--outline btn--sm" type="button" data-lf-cancel>Cancel</button>
        <button class="btn btn--dark btn--sm" type="submit">Save listing</button>
      </footer>
    </form>`;
  document.body.append(dlg);

  const form = dlg.querySelector("[data-lf]");
  const errorEl = dlg.querySelector("[data-lf-error]");
  const previews = dlg.querySelector("[data-lf-previews]");
  let editing = null;
  let images = [];

  const renderPreviews = () => {
    previews.innerHTML = images
      .map(
        (src, i) => `
      <li class="uploader__item">
        <img src="${src}" alt="Photo ${i + 1}">
        ${i === 0 ? '<span class="badge uploader__cover">Cover</span>' : ""}
        <button class="icon-btn" type="button" data-lf-remove="${i}" aria-label="Remove photo ${i + 1}"><svg class="icon" aria-hidden="true"><use href="#i-close"></use></svg></button>
      </li>`,
      )
      .join("");
  };

  const updatePriceLabel = () => {
    dlg.querySelector("[data-price-label]").textContent =
      form.elements.purpose.value === "rent"
        ? "Rent per month ($)"
        : "Price ($)";
  };
  form.elements.purpose.addEventListener("change", updatePriceLabel);

  const openForm = (rec) => {
    editing = rec || null;
    dlg.querySelector("[data-lf-kicker]").textContent = rec
      ? "Edit listing"
      : "New listing";
    dlg.querySelector("#lf-title").textContent = rec
      ? "Edit this home"
      : "Add a home";
    const r = rec || {
      name: "",
      purpose: "buy",
      type: "House",
      area: "",
      price: "",
      sqft: "",
      beds: 2,
      baths: 1,
      description: "",
      features: [],
      listingStatus: "draft",
    };
    form.elements.name.value = r.name;
    form.elements.purpose.value = r.purpose;
    form.elements.type.value = r.type;
    form.elements.area.value = r.area;
    form.elements.price.value = r.price;
    form.elements.sqft.value = r.sqft;
    form.elements.beds.value = String(r.beds);
    form.elements.baths.value = String(r.baths);
    form.elements.description.value = r.description || "";
    form.elements.listingStatus.value = r.listingStatus;
    form.querySelectorAll('input[name="features"]').forEach((b) => {
      b.checked = (r.features || []).includes(b.value);
    });
    images = rec
      ? rec.photos && rec.photos.length
        ? [...rec.photos]
        : rec.image
          ? [rec.image]
          : []
      : [];
    errorEl.textContent = "";
    updatePriceLabel();
    renderPreviews();
    dlg.showModal();
    form.elements.name.focus();
  };

  dlg.addEventListener("click", (e) => {
    if (e.target === dlg || e.target.closest("[data-lf-cancel]")) {
      dlg.close();
      return;
    }
    const rm = e.target.closest("[data-lf-remove]");
    if (rm) {
      images.splice(Number(rm.dataset.lfRemove), 1);
      renderPreviews();
    }
  });

  dlg.querySelector("[data-lf-files]").addEventListener("change", async (e) => {
    const files = [...e.target.files].filter((f) =>
      f.type.startsWith("image/"),
    );
    e.target.value = "";
    const room = MAX_PHOTOS - images.length;
    if (!room) {
      errorEl.textContent = `You can add up to ${MAX_PHOTOS} photos.`;
      return;
    }
    errorEl.textContent =
      files.length > room
        ? `Only the first ${room} photo${room === 1 ? "" : "s"} were added.`
        : "";
    for (const file of files.slice(0, room)) {
      try {
        images.push(await compress(file));
      } catch {
        errorEl.textContent = "One of the photos could not be read.";
      }
    }
    renderPreviews();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = form.elements;
    const name = f.name.value.trim();
    const area = f.area.value.trim();
    const price = Number(f.price.value);
    const sqft = Number(f.sqft.value);
    const status = f.listingStatus.value;

    if (!name) {
      errorEl.textContent = "Please add a listing title.";
      f.name.focus();
      return;
    }
    if (!area) {
      errorEl.textContent = "Please add a location.";
      f.area.focus();
      return;
    }
    if (!(price > 0)) {
      errorEl.textContent = "Please enter a price greater than zero.";
      f.price.focus();
      return;
    }
    if (!(sqft > 0)) {
      errorEl.textContent = "Please enter the floor area.";
      f.sqft.focus();
      return;
    }
    if (status !== "draft" && images.length === 0) {
      errorEl.textContent =
        "Add at least one photo to publish, or save it as a draft.";
      return;
    }

    const now = new Date().toISOString();
    const rec = {
      listed: 0,
      views: 0,
      leads: 0,
      ...(editing || {}),
      id: editing ? editing.id : `${slug(name)}-${Date.now().toString(36)}`,
      purpose: f.purpose.value,
      name,
      area,
      price,
      sqft,
      type: f.type.value,
      beds: Number(f.beds.value),
      baths: Number(f.baths.value),
      features: [
        ...form.querySelectorAll('input[name="features"]:checked'),
      ].map((b) => b.value),
      description: f.description.value.trim(),
      agency: editing ? editing.agency : OWNER,
      listingStatus: status,
      image: images[0] || "",
      photos: images,
      updatedAt: now,
    };
    rec.status = labelFor(rec, editing ? editing.status : null);

    const previous = [...list];
    if (editing) list = list.map((l) => (l.id === rec.id ? rec : l));
    else list.unshift(rec);
    if (!persist()) {
      list = previous;
      errorEl.textContent =
        "This device has no room to save that. Try fewer or smaller photos.";
      return;
    }
    dlg.close();
    render();
    UI.toast(
      editing
        ? "Listing updated"
        : status === "draft"
          ? "Draft saved"
          : "Listing published",
    );
  });

  /* ---------- Table + page events ---------- */
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-new-listing]")) {
      openForm(null);
      return;
    }
    const edit = e.target.closest("[data-edit]");
    if (edit) {
      openForm(list.find((l) => l.id === edit.dataset.edit));
      return;
    }
    const del = e.target.closest("[data-delete]");
    if (del) {
      const rec = list.find((l) => l.id === del.dataset.delete);
      if (!rec) return;
      UI.confirm({
        title: "Delete this listing?",
        text: `${esc(rec.name)} will be removed from your listings. This cannot be undone.`,
        confirmLabel: "Delete",
        danger: true,
      }).then((yes) => {
        if (!yes) return;
        list = list.filter((l) => l.id !== rec.id);
        persist();
        render();
        UI.toast("Listing deleted");
      });
    }
  });

  render();
})();
