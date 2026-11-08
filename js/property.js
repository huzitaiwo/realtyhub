/* ==========================================================================
   REALTY — js/property.js
   Property detail: gallery + full-screen viewer, overview, description,
   features, amenities, simulated virtual tour, floor plan, video, simulated
   location, contact / inquiry / callback, viewing scheduler, similar homes.
   URL: property.html?id=<id>   (data from js/data.js)
   ========================================================================== */
(() => {
  "use strict";

  const D = window.RealtyData;
  const UI = window.RealtyUI;
  const S = window.RealtyScheduler;
  const root = document.querySelector("[data-property]");
  if (!D || !UI || !root) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ic = (n, cls = "") =>
    `<svg class="icon ${cls}" aria-hidden="true"><use href="#i-${n}"></use></svg>`;
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

  const p = D.byId[new URLSearchParams(location.search).get("id")];

  /* ---------- Not found ---------- */
  if (!p) {
    document.title = "Home not found — REALTY";
    root.innerHTML = `
      <div class="container property-missing">
        <h1 class="h2">We couldn't find that home.</h1>
        <p class="lead">It may have been removed, or the link may be incomplete.</p>
        <a class="btn btn--dark" href="buy.html">Browse homes ${ic("arrow-right")}</a>
      </div>`;
    return;
  }

  const isRent = p.purpose === "rent";
  const area = D.areaOf(p);
  const detail = D.details(p);
  const profile = UI.getObject("realty:profile", {});

  /* ---------- Page meta + active nav ---------- */
  document.title = `${p.name} — ${isRent ? "Homes to rent" : "Homes for sale"} — REALTY`;
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute(
      "content",
      `${p.name}, ${p.area}. ${D.bedsText(p.beds)}, ${D.bathsText(p.baths)}, ${p.sqft.toLocaleString("en-US")} sq ft.`,
    );
  if (isRent) {
    document
      .querySelectorAll(
        '.site-nav a[href="buy.html"], .mobile-menu__list a[href="buy.html"]',
      )
      .forEach((a) => a.removeAttribute("aria-current"));
    document
      .querySelectorAll(
        '.site-nav a[href="rent.html"], .mobile-menu__list a[href="rent.html"]',
      )
      .forEach((a) => a.setAttribute("aria-current", "page"));
  }

  /* ---------- Probe optional assets ---------- */
  const probe = (src) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });

  const CATS = [
    ["exterior", "Exterior"],
    ["living-room", "Living room"],
    ["kitchen", "Kitchen"],
    ["bedroom", "Bedrooms"],
    ["bathroom", "Bathrooms"],
    ["garden", "Garden"],
    ["amenities", "Amenities"],
  ];

  const customPhotos =
    Array.isArray(p.photos) && p.photos.length ? p.photos : null;
  const photosP = customPhotos
    ? Promise.resolve(
        customPhotos.map((src, i) => {
          const label = i === 0 ? "Exterior" : `Photo ${i + 1}`;
          return {
            key: i === 0 ? "exterior" : `photo-${i}`,
            label,
            src,
            alt: `${label} — ${p.name}`,
          };
        }),
      )
    : Promise.all(
        CATS.map(async ([key, label]) => {
          const src =
            key === "exterior"
              ? p.image
              : `assets/images/gallery/${p.id}-${key}.jpg`;
          return key === "exterior" || (await probe(src))
            ? { key, label, src, alt: `${label} — ${p.name}` }
            : null;
        }),
      ).then((a) => a.filter(Boolean));

  const plansP = Promise.all(
    [1, 2].map(async (n) => {
      const src = `assets/images/floorplans/${p.id}-${n}.jpg`;
      return (await probe(src))
        ? { n, src, label: n === 1 ? "Ground floor" : "Upper floor" }
        : null;
    }),
  ).then((a) => a.filter(Boolean));

  /* ---------- Section templates ---------- */
  const FEATURE_ICON = {
    parking: "car",
    garden: "leaf",
    pool: "waves",
    balcony: "balcony",
    furnished: "sofa",
    "air-conditioning": "snow",
    security: "shield",
    elevator: "elevator",
    "pet-friendly": "paw",
  };
  const has = (f) => p.features.includes(f);
  const L = D.FEATURE_LABELS;

  const headHTML = `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <ol>
        <li><a href="index.html">Home</a></li>
        <li><a href="${isRent ? "rent" : "buy"}.html">${isRent ? "Rent" : "Buy"}</a></li>
        <li aria-current="page">${esc(p.name)}</li>
      </ol>
    </nav>

    <header class="property-head">
      <div>
        <p class="eyebrow eyebrow--mark">${esc(p.type)} / ${isRent ? "To rent" : "For sale"}</p>
        <h1 class="property-head__title">${esc(p.name)}</h1>
        <p class="property-head__area">${ic("pin")}${esc(p.area)}</p>
      </div>
      <div class="property-head__price">
        <p class="price price--xl">${D.priceHTML(p)}</p>
        <span class="badge badge--outline">${esc(p.status)}</span>
      </div>
    </header>

    <div class="property-toolbar">
      <ul class="fact-strip" aria-label="Key facts">
        <li>${ic("bed")}${D.bedsText(p.beds)}</li>
        <li>${ic("bath")}${D.bathsText(p.baths)}</li>
        <li>${ic("area")}${p.sqft.toLocaleString("en-US")} sq ft</li>
        <li>${ic("home")}${esc(p.type)}</li>
      </ul>
      <div class="property-actions">
        <button class="btn btn--outline btn--sm" type="button" data-save aria-pressed="false">${ic("heart")}Save</button>
        <button class="btn btn--outline btn--sm" type="button" data-compare aria-pressed="false">${ic("plus")}Compare</button>
        <button class="btn btn--outline btn--sm" type="button" data-share>${ic("share")}Share</button>
      </div>
    </div>`;

  const galleryHTML = (photos) => `
    <section class="gallery" aria-label="Photo gallery" data-gallery>
      <div class="gallery__stage">
        <button class="gallery__open" type="button" data-g-open aria-label="Open full-screen photo viewer">
          <img data-g-img src="${photos[0].src}" alt="${esc(photos[0].alt)}" fetchpriority="high">
        </button>
        ${
          photos.length > 1
            ? `
        <button class="icon-btn gallery__nav gallery__nav--prev" type="button" data-g-prev aria-label="Previous photo">${ic("arrow-left")}</button>
        <button class="icon-btn gallery__nav gallery__nav--next" type="button" data-g-next aria-label="Next photo">${ic("arrow-right")}</button>`
            : ""
        }
        <p class="gallery__count badge" data-g-count aria-live="polite">1 / ${photos.length}</p>
        <button class="btn btn--dark btn--sm gallery__expand" type="button" data-g-open>${ic("area")}View photos</button>
      </div>
      ${
        photos.length > 1
          ? `
      <ul class="gallery__thumbs" data-g-thumbs>
        ${photos.map((ph, i) => `<li><button class="gallery__thumb" type="button" data-g-thumb="${i}" aria-label="Show ${esc(ph.label)}" aria-current="${i === 0}"><img src="${ph.src}" alt="" loading="lazy" decoding="async"></button></li>`).join("")}
      </ul>`
          : ""
      }
    </section>`;

  const overviewHTML = () => {
    const rows = [
      ["Price", D.priceHTML(p)],
      ["Property type", esc(p.type)],
      ["Bedrooms", D.bedsText(p.beds)],
      ["Bathrooms", D.bathsText(p.baths)],
      ["Floor area", `${p.sqft.toLocaleString("en-US")} sq ft`],
      detail.lot
        ? ["Lot area", `${detail.lot.toLocaleString("en-US")} sq ft`]
        : null,
      has("parking") ? ["Parking", "Yes"] : null,
      detail.year ? ["Year built", String(detail.year)] : null,
      ["Listing status", esc(p.status)],
    ].filter(Boolean);
    return `
      <section aria-labelledby="overview-title">
        <h2 class="section-title" id="overview-title">Overview</h2>
        <dl class="overview-grid">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>
      </section>`;
  };

  const descriptionHTML = () => {
    const [lead, ...rest] = D.describe(p);
    const highlights = D.highlights(p);
    return `
      <section aria-labelledby="desc-title">
        <h2 class="section-title" id="desc-title">About this home</h2>
        <p class="lead lead--lg">${esc(lead)}</p>
        ${rest.map((t) => `<p class="prose">${esc(t)}</p>`).join("")}
        <h3 class="mini-title">Highlights</h3>
        <ul class="highlight-list">${highlights.map((h) => `<li>${ic("check", "icon--brand")}${esc(h)}</li>`).join("")}</ul>
      </section>`;
  };

  const featuresHTML = () => {
    const groups = [
      [
        "Interior",
        [
          D.bedsText(p.beds),
          D.bathsText(p.baths),
          has("furnished") && L.furnished,
          has("air-conditioning") && L["air-conditioning"],
        ],
      ],
      [
        "Exterior",
        [
          has("garden") && L.garden,
          has("balcony") && L.balcony,
          has("parking") && L.parking,
          has("pool") && L.pool,
        ],
      ],
      [
        "Building",
        [
          has("elevator") && L.elevator,
          has("security") && L.security,
          has("pet-friendly") && L["pet-friendly"],
        ],
      ],
    ]
      .map(([title, items]) => [title, items.filter(Boolean)])
      .filter(([, items]) => items.length);
    return `
      <section aria-labelledby="features-title">
        <h2 class="section-title" id="features-title">Features</h2>
        <div class="feature-groups">
          ${groups
            .map(
              ([title, items]) => `
            <div><h3 class="mini-title">${title}</h3><ul class="plain-list">${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>`,
            )
            .join("")}
        </div>
      </section>`;
  };

  const amenitiesHTML = () =>
    !p.features.length
      ? ""
      : `
      <section aria-labelledby="amen-title">
        <h2 class="section-title" id="amen-title">Amenities</h2>
        <ul class="amenity-list">${p.features.map((f) => `<li><span class="amenity__icon">${ic(FEATURE_ICON[f] || "check")}</span>${L[f]}</li>`).join("")}</ul>
      </section>`;

  const tourHTML = (photos) => `
      <section aria-labelledby="tour-title">
        <h2 class="section-title" id="tour-title">Virtual tour</h2>
        <div class="tour" data-tour>
          <div class="tour__stage">
            <img class="tour__img" data-t-img src="${photos[0].src}" alt="">
            <p class="tour__label badge" data-t-label aria-live="polite"></p>
            <div class="tour__floors" data-t-floors role="group" aria-label="Floor"></div>
            <div data-t-hotspots></div>
            <button class="icon-btn tour__nav tour__nav--prev" type="button" data-t-prev aria-label="Previous room">${ic("arrow-left")}</button>
            <button class="icon-btn tour__nav tour__nav--next" type="button" data-t-next aria-label="Next room">${ic("arrow-right")}</button>
          </div>
          <ul class="tour__rooms" data-t-rooms aria-label="Rooms"></ul>
          <p class="sim-note">${ic("compass")}Simulated tour built from the photo gallery. Real 360° assets can be connected to this component later.</p>
        </div>
      </section>`;

  const planHTML = (plans) =>
    !plans.length
      ? ""
      : `
      <section aria-labelledby="plan-title">
        <h2 class="section-title" id="plan-title">Floor plan</h2>
        <div class="plan" data-plan>
          <div class="plan__bar">
            <div class="tabs" role="group" aria-label="Floor" data-pl-tabs></div>
            <div class="plan__tools">
              <button class="icon-btn" type="button" data-pl-zoom="-1" aria-label="Zoom out">${ic("minus")}</button>
              <button class="icon-btn" type="button" data-pl-zoom="1" aria-label="Zoom in">${ic("plus")}</button>
              <a class="text-btn" data-pl-download href="${plans[0].src}" download>${ic("download", "icon--sm")}Download</a>
            </div>
          </div>
          <div class="plan__viewport" tabindex="0" role="region" aria-label="Floor plan, scrollable">
            <img data-pl-img src="${plans[0].src}" alt="Floor plan of ${esc(p.name)}">
          </div>
        </div>
      </section>`;

  const videoHTML = () => `
      <section aria-labelledby="video-title">
        <h2 class="section-title" id="video-title">Video tour</h2>
        <div class="video" data-video>
          <video playsinline preload="metadata" poster="${p.image}" data-v-el>
            <source src="assets/video/${p.id}.mp4" type="video/mp4" data-v-src>
          </video>
          <div class="video__placeholder" data-v-empty hidden>
            ${ic("play", "icon--brand icon--circle")}
            <p>A video tour isn't available for this home yet.</p>
          </div>
          <div class="video__bar" data-v-bar>
            <button class="icon-btn" type="button" data-v-play aria-label="Play">${ic("play")}</button>
            <input class="video__range" type="range" min="0" max="100" step="0.1" value="0" data-v-range aria-label="Seek">
            <span class="video__time" data-v-time>0:00 / 0:00</span>
            <button class="icon-btn" type="button" data-v-full aria-label="Full screen">${ic("area")}</button>
          </div>
        </div>
      </section>`;

  const locationHTML = () => `
      <section aria-labelledby="loc-title">
        <h2 class="section-title" id="loc-title">Location</h2>
        <p class="prose">${esc(p.area)}. ${esc(D.areaTagline(p))}</p>
        <div class="property-map">
          <div class="map" role="img" aria-label="Simulated map showing the approximate area of ${esc(p.name)}">
            <div class="map__canvas">
              <span class="map__road" style="--x:-5%;--y:30%;--w:80%;--r:24deg" aria-hidden="true"></span>
              <span class="map__road" style="--x:30%;--y:-5%;--w:75%;--r:62deg" aria-hidden="true"></span>
              <span class="map__road" style="--x:10%;--y:78%;--w:90%;--r:20deg" aria-hidden="true"></span>
              <span class="map__park" style="--x:82%;--y:22%;--s:26%" aria-hidden="true"></span>
              <span class="map__park" style="--x:14%;--y:80%;--s:24%" aria-hidden="true"></span>
              <span class="marker is-selected" style="--x:52%;--y:46%">${D.compactPrice(p)}</span>
            </div>
            <p class="map__label">Approximate area placement</p>
          </div>
        </div>
        <div class="nearby" data-nearby>
          <div class="tabs" role="group" aria-label="Nearby" data-n-tabs></div>
          <ul class="nearby__list" data-n-list></ul>
        </div>
        <p class="sim-note">${ic("compass")}Simulated demo information. Distances and places are illustrative, not real geospatial data.</p>
      </section>`;

  const sidebarHTML = () => {
    const monthly = isRent ? null : D.monthly(p);
    return `
      <aside class="contact-card" aria-label="Contact the agent">
        <p class="price">${D.priceHTML(p)}</p>
        <p class="contact-card__status"><span class="badge badge--outline">${esc(p.status)}</span> Listed ${esc(D.agoText(p.listed)).toLowerCase()}</p>
        ${
          monthly
            ? `<p class="contact-card__estimate">Estimated ≈ <strong>${D.usd(monthly)} / month</strong>
          <a href="mortgage.html?price=${p.price}&deposit=${Math.round(p.price * 0.2)}">Adjust</a>
          <span>20% deposit, 4.5%, 25 years. Estimate only, not financial advice.</span></p>`
            : ""
        }
        <div class="contact-card__actions">
          <button class="btn btn--dark" type="button" data-contact="inquiry">Contact agent ${ic("arrow-right")}</button>
          <button class="btn btn--outline" type="button" data-schedule>${ic("calendar")}Schedule viewing</button>
        </div>
        <ul class="contact-card__alt">
          <li><button class="text-btn" type="button" data-contact="callback">Request callback</button></li>
          <li><button class="text-btn" type="button" data-concept="Email details">Email agent</button></li>
          <li><button class="text-btn" type="button" data-concept="Phone details">Call agent</button></li>
        </ul>
        <div class="agent">
          <span class="agent__avatar" aria-hidden="true">${esc(p.agency.charAt(0))}</span>
          <div><strong>${esc(p.agency)}</strong><span>Listing agent</span></div>
          ${p.status === "Verified listing" ? `<span class="badge badge--outline agent__badge">${ic("check", "icon--sm")}Verified</span>` : ""}
        </div>
      </aside>`;
  };

  const similarHTML = () => {
    const others = D.PROPERTIES.filter(
      (x) => x.id !== p.id && x.purpose === p.purpose,
    ).slice(0, 3);
    return !others.length
      ? ""
      : `
      <section class="similar" aria-labelledby="similar-title">
        <header class="section-head">
          <div><p class="eyebrow eyebrow--mark">You might also consider</p><h2 class="h2" id="similar-title">Similar homes.</h2></div>
          <a class="link-arrow" href="${isRent ? "rent" : "buy"}.html">View all ${ic("arrow-up-right", "icon--diag")}</a>
        </header>
        <div class="property-grid property-grid--scroll">${others.map(D.card).join("")}</div>
      </section>`;
  };

  /* ---------- Build page ---------- */
  Promise.all([photosP, plansP]).then(([photos, plans]) => {
    root.innerHTML = `
      <div class="container property-page">
        <article class="property" data-property-id="${p.id}" data-property-name="${esc(p.name)}">
          ${headHTML}
          ${galleryHTML(photos)}
          <div class="property-layout">
            <div class="property-main">
              ${overviewHTML()}${descriptionHTML()}${featuresHTML()}${amenitiesHTML()}
              ${tourHTML(photos)}${planHTML(plans)}${videoHTML()}${locationHTML()}
            </div>
            ${sidebarHTML()}
          </div>
        </article>
        ${similarHTML()}
      </div>`;

    mountMobileCta();
    initGallery(photos);
    initTour(photos);
    initPlan(plans);
    initVideo();
    initNearby();
    initActions();
    UI.sync();
  });

  /* ---------- Mobile contact bar ---------- */
  function mountMobileCta() {
    const bar = document.createElement("div");
    bar.className = "mobile-cta";
    bar.innerHTML = `
      <button class="btn btn--dark btn--sm" type="button" data-contact="inquiry">Contact agent</button>
      <button class="btn btn--outline btn--sm" type="button" data-schedule>Schedule viewing</button>`;
    document.body.append(bar);
    document.body.classList.add("has-cta");
  }

  /* ---------- Gallery + full-screen viewer ---------- */
  function initGallery(photos) {
    const el = root.querySelector("[data-gallery]");
    const img = el.querySelector("[data-g-img]");
    const count = el.querySelector("[data-g-count]");
    const thumbs = el.querySelector("[data-g-thumbs]");
    let i = 0;

    const show = (n, animate = true) => {
      i = (n + photos.length) % photos.length;
      const ph = photos[i];
      const swap = () => {
        img.src = ph.src;
        img.alt = ph.alt;
        img.classList.remove("is-fading");
      };
      if (animate && !reduce) {
        img.classList.add("is-fading");
        setTimeout(swap, 180);
      } else swap();
      count.textContent = `${i + 1} / ${photos.length}`;
      if (thumbs) {
        thumbs
          .querySelectorAll("button")
          .forEach((b, k) => b.setAttribute("aria-current", String(k === i)));
        const b = thumbs.children[i];
        thumbs.scrollTo({
          left: b.offsetLeft - thumbs.clientWidth / 2 + b.clientWidth / 2,
          behavior: reduce ? "auto" : "smooth",
        });
      }
    };

    el.addEventListener("click", (e) => {
      if (e.target.closest("[data-g-prev]")) show(i - 1);
      else if (e.target.closest("[data-g-next]")) show(i + 1);
      else if (e.target.closest("[data-g-thumb]"))
        show(Number(e.target.closest("[data-g-thumb]").dataset.gThumb));
      else if (e.target.closest("[data-g-open]")) openViewer(photos, i, show);
    });

    /* Swipe on the hero */
    let startX = null;
    const stage = el.querySelector(".gallery__stage");
    stage.addEventListener("pointerdown", (e) => {
      startX = e.clientX;
    });
    stage.addEventListener("pointerup", (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 50 && photos.length > 1) {
        e.preventDefault();
        show(i + (dx < 0 ? 1 : -1));
      }
    });
    stage.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") show(i - 1);
      if (e.key === "ArrowRight") show(i + 1);
    });
  }

  let viewer;
  function openViewer(photos, startIndex, onClose) {
    if (!viewer) {
      viewer = document.createElement("dialog");
      viewer.className = "viewer";
      viewer.setAttribute("aria-label", "Photo viewer");
      viewer.innerHTML = `
        <header class="viewer__bar">
          <p class="viewer__count" data-v-count aria-live="polite"></p>
          <div class="viewer__cats" data-v-cats role="group" aria-label="Filter photos by room"></div>
          <div class="viewer__tools">
            <button class="icon-btn icon-btn--dark" type="button" data-v-zoom aria-pressed="false" aria-label="Zoom">${ic("plus")}</button>
            <button class="icon-btn icon-btn--dark" type="button" data-v-close aria-label="Close viewer">${ic("close")}</button>
          </div>
        </header>
        <div class="viewer__stage" data-v-stage>
          <button class="icon-btn icon-btn--dark viewer__nav viewer__nav--prev" type="button" data-v-prev aria-label="Previous photo">${ic("arrow-left")}</button>
          <figure class="viewer__fig"><img data-v-img alt=""><figcaption data-v-cap></figcaption></figure>
          <button class="icon-btn icon-btn--dark viewer__nav viewer__nav--next" type="button" data-v-next aria-label="Next photo">${ic("arrow-right")}</button>
        </div>
        <ul class="viewer__thumbs" data-v-thumbs></ul>`;
      document.body.append(viewer);
    }

    const vImg = viewer.querySelector("[data-v-img]");
    const cats = viewer.querySelector("[data-v-cats]");
    const thumbs = viewer.querySelector("[data-v-thumbs]");
    let list = photos;
    let idx = startIndex;
    let zoomed = false;

    const setZoom = (on) => {
      zoomed = on;
      vImg.classList.toggle("is-zoomed", on);
      viewer
        .querySelector("[data-v-zoom]")
        .setAttribute("aria-pressed", String(on));
      if (!on) vImg.style.transformOrigin = "50% 50%";
    };

    const render = () => {
      idx = (idx + list.length) % list.length;
      const ph = list[idx];
      setZoom(false);
      vImg.src = ph.src;
      vImg.alt = ph.alt;
      viewer.querySelector("[data-v-cap]").textContent = ph.label;
      viewer.querySelector("[data-v-count]").textContent =
        `${idx + 1} / ${list.length}`;
      thumbs.innerHTML = list
        .map(
          (x, k) =>
            `<li><button type="button" data-v-thumb="${k}" aria-label="Show ${esc(x.label)}" aria-current="${k === idx}"><img src="${x.src}" alt=""></button></li>`,
        )
        .join("");
      viewer.querySelectorAll("[data-v-prev], [data-v-next]").forEach((b) => {
        b.hidden = list.length < 2;
      });
    };

    const keys = [...new Map(photos.map((x) => [x.key, x.label])).entries()];
    cats.innerHTML =
      keys.length > 2
        ? [["all", "All"], ...keys]
            .map(
              ([k, l]) =>
                `<button type="button" data-v-cat="${k}" aria-pressed="${k === "all"}">${l}</button>`,
            )
            .join("")
        : "";

    const handler = (e) => {
      const t = e.target;
      if (t.closest("[data-v-close]")) viewer.close();
      else if (t.closest("[data-v-prev]")) {
        idx -= 1;
        render();
      } else if (t.closest("[data-v-next]")) {
        idx += 1;
        render();
      } else if (t.closest("[data-v-thumb]")) {
        idx = Number(t.closest("[data-v-thumb]").dataset.vThumb);
        render();
      } else if (t.closest("[data-v-zoom]") || t === vImg) setZoom(!zoomed);
      else if (t.closest("[data-v-cat]")) {
        const k = t.closest("[data-v-cat]").dataset.vCat;
        list = k === "all" ? photos : photos.filter((x) => x.key === k);
        idx = 0;
        cats
          .querySelectorAll("button")
          .forEach((b) =>
            b.setAttribute("aria-pressed", String(b.dataset.vCat === k)),
          );
        render();
      }
    };
    const keyHandler = (e) => {
      if (e.key === "ArrowLeft") {
        idx -= 1;
        render();
      }
      if (e.key === "ArrowRight") {
        idx += 1;
        render();
      }
    };
    const moveHandler = (e) => {
      if (!zoomed) return;
      const r = vImg.getBoundingClientRect();
      vImg.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
    };
    let startX = null;
    const downHandler = (e) => {
      startX = e.clientX;
    };
    const upHandler = (e) => {
      if (startX === null || zoomed) {
        startX = null;
        return;
      }
      const dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 50) {
        idx += dx < 0 ? 1 : -1;
        render();
      }
    };
    const onClose2 = () => {
      viewer.removeEventListener("click", handler);
      viewer.removeEventListener("keydown", keyHandler);
      viewer.removeEventListener("pointermove", moveHandler);
      viewer.removeEventListener("pointerdown", downHandler);
      viewer.removeEventListener("pointerup", upHandler);
      viewer.removeEventListener("close", onClose2);
      document.documentElement.classList.remove("is-locked");
      if (onClose) onClose(photos.indexOf(list[idx]), false);
    };

    viewer.addEventListener("click", handler);
    viewer.addEventListener("keydown", keyHandler);
    viewer.addEventListener("pointermove", moveHandler);
    viewer.addEventListener("pointerdown", downHandler);
    viewer.addEventListener("pointerup", upHandler);
    viewer.addEventListener("close", onClose2);

    render();
    document.documentElement.classList.add("is-locked");
    viewer.showModal();
  }

  /* ---------- Simulated virtual tour ---------- */
  function initTour(photos) {
    const el = root.querySelector("[data-tour]");
    if (!el) return;
    const FLOORS = {
      ground: ["exterior", "living-room", "kitchen", "garden", "amenities"],
      upper: ["bedroom", "bathroom"],
    };
    const hasGround = photos.some((x) => FLOORS.ground.includes(x.key));
    const hasUpper = photos.some((x) => FLOORS.upper.includes(x.key));
    const state = { floor: hasGround && hasUpper ? "ground" : "all", i: 0 };

    const img = el.querySelector("[data-t-img]");
    const label = el.querySelector("[data-t-label]");
    const hot = el.querySelector("[data-t-hotspots]");
    const roomsEl = el.querySelector("[data-t-rooms]");
    const floorsEl = el.querySelector("[data-t-floors]");
    const rooms = () =>
      state.floor === "all"
        ? photos
        : photos.filter((x) => FLOORS[state.floor].includes(x.key));

    floorsEl.innerHTML =
      hasGround && hasUpper
        ? [
            ["ground", "Ground floor"],
            ["upper", "Upper floor"],
          ]
            .map(
              ([k, l]) =>
                `<button type="button" data-t-floor="${k}" aria-pressed="${k === state.floor}">${l}</button>`,
            )
            .join("")
        : "";

    const render = (animate = true) => {
      const list = rooms();
      state.i = (state.i + list.length) % list.length;
      const room = list[state.i];
      const swap = () => {
        img.src = room.src;
        img.alt = `${room.label} — virtual tour view`;
        img.classList.remove("is-fading");
      };
      if (animate && !reduce) {
        img.classList.add("is-fading");
        setTimeout(swap, 180);
      } else swap();
      label.textContent = room.label;

      const prev = list[(state.i - 1 + list.length) % list.length];
      const next = list[(state.i + 1) % list.length];
      hot.innerHTML =
        list.length > 1
          ? `
        <button class="hotspot hotspot--prev" type="button" data-t-go="-1" aria-label="Go to ${esc(prev.label)}"><span>${esc(prev.label)}</span></button>
        <button class="hotspot hotspot--next" type="button" data-t-go="1" aria-label="Go to ${esc(next.label)}"><span>${esc(next.label)}</span></button>`
          : "";
      el.querySelectorAll("[data-t-prev], [data-t-next]").forEach((b) => {
        b.hidden = list.length < 2;
      });

      roomsEl.innerHTML = list
        .map(
          (r, k) =>
            `<li><button type="button" data-t-room="${k}" aria-pressed="${k === state.i}">${esc(r.label)}</button></li>`,
        )
        .join("");
      floorsEl
        .querySelectorAll("button")
        .forEach((b) =>
          b.setAttribute(
            "aria-pressed",
            String(b.dataset.tFloor === state.floor),
          ),
        );
    };

    el.addEventListener("click", (e) => {
      const t = e.target;
      if (t.closest("[data-t-prev]")) {
        state.i -= 1;
        render();
      } else if (t.closest("[data-t-next]")) {
        state.i += 1;
        render();
      } else if (t.closest("[data-t-go]")) {
        state.i += Number(t.closest("[data-t-go]").dataset.tGo);
        render();
      } else if (t.closest("[data-t-room]")) {
        state.i = Number(t.closest("[data-t-room]").dataset.tRoom);
        render();
      } else if (t.closest("[data-t-floor]")) {
        state.floor = t.closest("[data-t-floor]").dataset.tFloor;
        state.i = 0;
        render();
      }
    });
    render(false);
  }

  /* ---------- Floor plan ---------- */
  function initPlan(plans) {
    const el = root.querySelector("[data-plan]");
    if (!el) return;
    const img = el.querySelector("[data-pl-img]");
    const tabs = el.querySelector("[data-pl-tabs]");
    const dl = el.querySelector("[data-pl-download]");
    let i = 0;
    let zoom = 1;

    tabs.innerHTML =
      plans.length > 1
        ? plans
            .map(
              (pl, k) =>
                `<button class="tabs__tab" type="button" data-pl-tab="${k}" aria-pressed="${k === 0}"><span>${pl.label}</span></button>`,
            )
            .join("")
        : `<span class="plan__single">${plans[0].label}</span>`;

    const paint = () => {
      img.src = plans[i].src;
      img.style.width = `${zoom * 100}%`;
      dl.href = plans[i].src;
      tabs
        .querySelectorAll("button")
        .forEach((b, k) => b.setAttribute("aria-pressed", String(k === i)));
    };

    el.addEventListener("click", (e) => {
      const z = e.target.closest("[data-pl-zoom]");
      const t = e.target.closest("[data-pl-tab]");
      if (z) {
        zoom = Math.min(
          3,
          Math.max(1, +(zoom + Number(z.dataset.plZoom) * 0.5).toFixed(1)),
        );
        paint();
      }
      if (t) {
        i = Number(t.dataset.plTab);
        zoom = 1;
        paint();
      }
    });
  }

  /* ---------- Video ---------- */
  function initVideo() {
    const el = root.querySelector("[data-video]");
    const v = el.querySelector("[data-v-el]");
    const bar = el.querySelector("[data-v-bar]");
    const empty = el.querySelector("[data-v-empty]");
    const play = el.querySelector("[data-v-play]");
    const range = el.querySelector("[data-v-range]");
    const time = el.querySelector("[data-v-time]");
    const fmt = (s) =>
      Number.isFinite(s)
        ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`
        : "0:00";

    const unavailable = () => {
      v.hidden = true;
      bar.hidden = true;
      empty.hidden = false;
      el.classList.add("is-empty");
    };
    el.querySelector("[data-v-src]").addEventListener("error", unavailable);
    v.addEventListener("error", unavailable);

    const sync = () => {
      range.value = v.duration ? (v.currentTime / v.duration) * 100 : 0;
      time.textContent = `${fmt(v.currentTime)} / ${fmt(v.duration)}`;
    };
    v.addEventListener("loadedmetadata", sync);
    v.addEventListener("timeupdate", sync);
    v.addEventListener("play", () => {
      play.innerHTML = ic("pause");
      play.setAttribute("aria-label", "Pause");
    });
    v.addEventListener("pause", () => {
      play.innerHTML = ic("play");
      play.setAttribute("aria-label", "Play");
    });
    v.addEventListener("ended", () => {
      v.currentTime = 0;
    });

    play.addEventListener("click", () => (v.paused ? v.play() : v.pause()));
    v.addEventListener("click", () => (v.paused ? v.play() : v.pause()));
    range.addEventListener("input", () => {
      if (v.duration) v.currentTime = (range.value / 100) * v.duration;
    });
    el.querySelector("[data-v-full]").addEventListener("click", () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
    });
  }

  /* ---------- Nearby (simulated) ---------- */
  function initNearby() {
    const el = root.querySelector("[data-nearby]");
    const data = D.nearby(p);
    const TABS = [
      ["landmarks", "Landmarks"],
      ["transport", "Transport"],
      ["schools", "Schools"],
      ["shopping", "Shopping"],
      ["restaurants", "Restaurants"],
    ];
    const tabs = el.querySelector("[data-n-tabs]");
    const list = el.querySelector("[data-n-list]");
    let active = "landmarks";

    const paint = () => {
      tabs.innerHTML = TABS.map(
        ([k, l]) =>
          `<button class="tabs__tab" type="button" data-n-tab="${k}" aria-pressed="${k === active}"><span>${l}</span></button>`,
      ).join("");
      list.innerHTML = data[active]
        .map(
          ([name, dist]) =>
            `<li><span>${ic("pin", "icon--brand")}${esc(name)}</span><em>${esc(dist)}</em></li>`,
        )
        .join("");
    };
    el.addEventListener("click", (e) => {
      const t = e.target.closest("[data-n-tab]");
      if (t) {
        active = t.dataset.nTab;
        paint();
      }
    });
    paint();
  }

  /* ---------- Actions: share, concept buttons, scheduler, inquiry ---------- */
  function initActions() {
    document.addEventListener("click", async (e) => {
      if (e.target.closest("[data-share]")) {
        const data = {
          title: `${p.name} — REALTY`,
          text: `${p.name}, ${p.area}`,
          url: location.href,
        };
        try {
          if (navigator.share) {
            await navigator.share(data);
            return;
          }
          await navigator.clipboard.writeText(location.href);
          UI.toast("Link copied");
        } catch (err) {
          if (err.name !== "AbortError")
            UI.toast("Copy the link from your address bar");
        }
      }
      const concept = e.target.closest("[data-concept]");
      if (concept)
        UI.toast(`${concept.dataset.concept} are a concept in this demo`);

      if (e.target.closest("[data-schedule]")) {
        if (S) S.open({ propertyId: p.id });
        else UI.toast("Scheduler unavailable");
      }
      const contact = e.target.closest("[data-contact]");
      if (contact) openInquiry(contact.dataset.contact);
    });
  }

  let dlg;
  function openInquiry(mode) {
    if (!dlg) {
      dlg = document.createElement("dialog");
      dlg.className = "dialog";
      dlg.setAttribute("aria-labelledby", "inq-title");
      dlg.innerHTML = `
        <form data-inq novalidate>
          <header class="dialog__head">
            <div><p class="eyebrow" data-inq-kicker>Contact agent</p><h2 class="dialog__title" id="inq-title">Send an enquiry</h2></div>
            <button class="icon-btn" type="button" data-inq-close aria-label="Close">${ic("close")}</button>
          </header>
          <div class="dialog__body">
            <dl class="summary">
              <div><dt>Property</dt><dd>${esc(p.name)}</dd></div>
              <div><dt>Address</dt><dd>${esc(p.area)}</dd></div>
              <div><dt>Agent</dt><dd>${esc(p.agency)}</dd></div>
            </dl>
            <div class="form-grid">
              <label class="field"><span class="field__label">Name</span><input class="input" name="name" type="text" autocomplete="name"></label>
              <label class="field"><span class="field__label">Email</span><input class="input" name="email" type="email" autocomplete="email"></label>
              <label class="field"><span class="field__label" data-phone-label>Phone</span><input class="input" name="phone" type="tel" autocomplete="tel"></label>
              <label class="field"><span class="field__label">Preferred contact</span>
                <select class="input" name="contact"><option>Email</option><option>Phone call</option><option>Text message</option></select></label>
              <label class="field span-2"><span class="field__label">Message</span><textarea class="input" name="message" rows="4"></textarea></label>
              <label class="field span-2"><span class="field__label">Preferred viewing date (optional)</span><input class="input" name="date" type="date"></label>
            </div>
            <p class="field__error" data-inq-error role="alert"></p>
          </div>
          <footer class="dialog__foot dialog__foot--end">
            <button class="btn btn--outline btn--sm" type="button" data-inq-close>Cancel</button>
            <button class="btn btn--dark btn--sm" type="submit">Send</button>
          </footer>
        </form>`;
      document.body.append(dlg);

      dlg.addEventListener("click", (e) => {
        if (e.target === dlg || e.target.closest("[data-inq-close]"))
          dlg.close();
      });
      dlg.querySelector("[data-inq]").addEventListener("submit", submitInquiry);
    }

    const f = dlg.querySelector("[data-inq]");
    const callback = mode === "callback";
    dlg.dataset.mode = mode;
    dlg.querySelector("[data-inq-kicker]").textContent = callback
      ? "Request callback"
      : "Contact agent";
    dlg.querySelector("#inq-title").textContent = callback
      ? "Request a callback"
      : "Send an enquiry";
    dlg.querySelector("[data-phone-label]").textContent = callback
      ? "Phone (required)"
      : "Phone";
    f.elements.name.value = profile.name || "Handsome";
    f.elements.email.value = profile.email || "";
    f.elements.phone.value = profile.phone || "";
    f.elements.contact.value = callback ? "Phone call" : "Email";
    f.elements.message.value = callback
      ? `Please call me back about ${p.name} (${p.area}).`
      : `Hello, I'm interested in ${p.name} (${p.area}). Could you tell me more about it?`;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    f.elements.date.min = tomorrow.toISOString().slice(0, 10);
    f.elements.date.value = "";
    dlg.querySelector("[data-inq-error]").textContent = "";
    dlg.showModal();
  }

  function submitInquiry(e) {
    e.preventDefault();
    const f = e.currentTarget;
    const err = dlg.querySelector("[data-inq-error]");
    const callback = dlg.dataset.mode === "callback";
    const name = f.elements.name.value.trim();
    const email = f.elements.email.value.trim();
    const phone = f.elements.phone.value.trim();
    const message = f.elements.message.value.trim();

    if (!name) {
      err.textContent = "Please enter your name.";
      f.elements.name.focus();
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      err.textContent = "Please enter a valid email address.";
      f.elements.email.focus();
      return;
    }
    if (callback && !phone) {
      err.textContent = "Please add a phone number so the agent can call you.";
      f.elements.phone.focus();
      return;
    }
    if (!message) {
      err.textContent = "Please write a short message.";
      f.elements.message.focus();
      return;
    }

    const extra = [`Preferred contact: ${f.elements.contact.value}`];
    if (phone) extra.push(`Phone: ${phone}`);
    if (f.elements.date.value)
      extra.push(`Preferred viewing date: ${f.elements.date.value}`);

    /* Appears in My Desk → Messages */
    const threads = UI.read("realty:messages");
    let thread = threads.find((t) => t.propertyId === p.id);
    if (!thread) {
      thread = {
        id: `t-${Date.now()}`,
        propertyId: p.id,
        unread: 0,
        messages: [],
      };
      threads.push(thread);
    }
    thread.messages.push({
      from: "me",
      text: `${message}\n\n${extra.join("\n")}`,
      at: new Date().toISOString(),
    });
    UI.write("realty:messages", threads);

    dlg.close();
    UI.toast(callback ? "Callback requested" : "Enquiry sent to the agent");
  }
})();
