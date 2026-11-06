/* ==========================================================================
   REALTY — js/data.js
   Single source of demo property data + shared card templates.
   Replace with Firestore reads later; keep the same field names.
   ========================================================================== */
window.RealtyData = (() => {
  "use strict";

  const IMG = "assets/images/";

  const FEATURE_LABELS = {
    parking: "Parking",
    garden: "Garden",
    pool: "Pool",
    balcony: "Balcony",
    furnished: "Furnished",
    "air-conditioning": "Air conditioning",
    security: "Security",
    elevator: "Elevator",
    "pet-friendly": "Pet friendly",
  };

  const PROPERTIES = [
    {
      id: "bracken-house",
      purpose: "buy",
      name: "Bracken House",
      area: "Richmond, London",
      price: 1295000,
      beds: 4,
      baths: 3,
      sqft: 2146,
      type: "Detached house",
      agency: "Aster & Field",
      status: "New to REALTY",
      features: ["parking", "garden"],
      listed: 1,
      image: IMG + "property-bracken-house.jpg",
    },
    {
      id: "olive-court",
      purpose: "buy",
      name: "Olive Court",
      area: "West Hove, Sussex",
      price: 875000,
      beds: 3,
      baths: 2,
      sqft: 1504,
      type: "Villa",
      agency: "Aster & Field",
      status: "Reduced",
      features: ["pool", "garden", "parking"],
      listed: 9,
      image: IMG + "property-olive-court.jpg",
    },
    {
      id: "the-canton-apartment",
      purpose: "buy",
      name: "The Canton Apartment",
      area: "Clerkenwell, London",
      price: 645000,
      beds: 2,
      baths: 2,
      sqft: 984,
      type: "Apartment",
      agency: "Form & Found",
      status: "Verified listing",
      features: ["elevator", "balcony"],
      listed: 20,
      image: IMG + "property-canton-apartment.jpg",
    },
    {
      id: "marlowe-townhouse",
      purpose: "buy",
      name: "Marlowe Townhouse",
      area: "Stoke Newington, London",
      price: 1040000,
      beds: 4,
      baths: 2,
      sqft: 1786,
      type: "Townhouse",
      agency: "Form & Found",
      status: "Open viewing",
      features: ["garden"],
      listed: 4,
      image: IMG + "property-marlowe-townhouse.jpg",
    },
    {
      id: "harlow-mews",
      purpose: "rent",
      name: "Harlow Mews",
      area: "Clerkenwell, London",
      price: 4200,
      beds: 2,
      baths: 2,
      sqft: 1020,
      type: "Apartment",
      agency: "Form & Found",
      status: "Verified listing",
      features: ["furnished", "elevator"],
      listed: 2,
      image: IMG + "rent-harlow-mews.jpg",
    },
    {
      id: "linden-house",
      purpose: "rent",
      name: "Linden House",
      area: "Richmond, London",
      price: 5800,
      beds: 4,
      baths: 3,
      sqft: 2010,
      type: "House",
      agency: "Aster & Field",
      status: "Available now",
      features: ["garden", "parking", "pet-friendly"],
      listed: 5,
      image: IMG + "rent-linden-house.jpg",
    },
    {
      id: "pennant-lofts",
      purpose: "rent",
      name: "Pennant Lofts",
      area: "Stoke Newington, London",
      price: 3450,
      beds: 2,
      baths: 1,
      sqft: 880,
      type: "Apartment",
      agency: "Form & Found",
      status: "Reduced",
      features: ["furnished", "balcony"],
      listed: 12,
      image: IMG + "rent-pennant-lofts.jpg",
    },
    {
      id: "seawall-terrace",
      purpose: "rent",
      name: "Seawall Terrace",
      area: "West Hove, Sussex",
      price: 4950,
      beds: 3,
      baths: 2,
      sqft: 1380,
      type: "House",
      agency: "Aster & Field",
      status: "Open viewing",
      features: ["garden", "balcony"],
      listed: 20,
      image: IMG + "rent-seawall-terrace.jpg",
    },
  ];

  const byId = Object.fromEntries(PROPERTIES.map((p) => [p.id, p]));

  /* ---------- Formatting ---------- */
  const usd = (n, d = 0) =>
    `$${n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d })}`;
  const priceHTML = (p) =>
    p.purpose === "rent"
      ? `${usd(p.price)} <span class="price__unit">/ month</span>`
      : usd(p.price);
  const bedsText = (n) =>
    n === 0 ? "Studio" : `${n} ${n === 1 ? "bed" : "beds"}`;
  const bathsText = (n) => `${n} ${n === 1 ? "bath" : "baths"}`;
  const agoText = (d) =>
    d === 0 ? "Today" : d === 1 ? "1 day ago" : `${d} days ago`;

  /* ---------- Estimates (not financial advice) ---------- */
  const monthly = (p, { deposit = 0.2, rate = 4.5, years = 25 } = {}) => {
    if (p.purpose === "rent") return null;
    const loan = p.price * (1 - deposit);
    const r = rate / 100 / 12;
    const n = years * 12;
    return r === 0 ? loan / n : (loan * r) / (1 - Math.pow(1 + r, -n));
  };
  const monthlyCost = (p) => (p.purpose === "rent" ? p.price : monthly(p));

  /* ---------- Templates (same markup as the home-page card) ---------- */
  const ic = (n) =>
    `<svg class="icon" aria-hidden="true"><use href="#i-${n}"></use></svg>`;
  const meta = (p) => `
    <ul class="property-meta" aria-label="Key details">
      <li>${ic("bed")}${bedsText(p.beds)}</li>
      <li>${ic("bath")}${bathsText(p.baths)}</li>
      <li>${ic("area")}${p.sqft.toLocaleString("en-US")} sq ft</li>
    </ul>`;
  const href = (p) => `property.html?id=${p.id}`;

  const card = (p) => `
<article class="property-card" data-property-id="${p.id}" data-property-name="${p.name}">
  <a class="property-card__media" href="${href(p)}" tabindex="-1" aria-hidden="true">
    <img src="${p.image}" alt="" loading="lazy" decoding="async">
    <span class="badge">${p.status}</span>
  </a>
  <div class="property-card__actions">
    <button class="icon-btn" type="button" data-save aria-pressed="false" aria-label="Save ${p.name}">${ic("heart")}</button>
    <button class="icon-btn" type="button" data-compare aria-pressed="false" aria-label="Add ${p.name} to compare">${ic("plus")}</button>
  </div>
  <div class="property-card__body">
    <p class="price">${priceHTML(p)}</p>
    <h3 class="property-card__title"><a href="${href(p)}">${p.name}</a> <span>· ${p.area}</span></h3>
    ${meta(p)}
    <p class="property-card__foot"><span>${p.type}</span><span>${p.agency}</span></p>
  </div>
</article>`;

  const row = (p) => `
<li>
  <article class="property-card property-card--row" data-property-id="${p.id}" data-property-name="${p.name}">
    <a class="property-card__media" href="${href(p)}" tabindex="-1" aria-hidden="true">
      <img src="${p.image}" alt="" loading="lazy" decoding="async">
    </a>
    <div class="property-card__actions">
      <button class="icon-btn" type="button" data-save aria-pressed="false" aria-label="Save ${p.name}">${ic("heart")}</button>
    </div>
    <div class="property-card__body">
      <p class="price">${priceHTML(p)}</p>
      <h3 class="property-card__title"><a href="${href(p)}">${p.name}</a> <span>· ${p.area}</span></h3>
      ${meta(p)}
      <p class="property-card__foot">
        <span>${p.status}</span>
        <button class="compare-link" type="button" data-compare aria-pressed="false" aria-label="Add ${p.name} to compare">
          <span class="compare-link__off">+ Compare</span><span class="compare-link__on">Added</span>
        </button>
      </p>
    </div>
  </article>
</li>`;

  /* ---------- Detail content (property page) ---------- */
  const DETAILS = {
    "bracken-house": { year: 2019, lot: 9500 },
    "olive-court": { year: 2008, lot: 12000 },
    "the-canton-apartment": { year: 2016 },
    "marlowe-townhouse": { year: 1902, lot: 2400 },
    "harlow-mews": { year: 2012 },
    "linden-house": { year: 1998, lot: 8000 },
    "pennant-lofts": { year: 2005 },
    "seawall-terrace": { year: 1930, lot: 3000 },
  };
  const details = (p) => DETAILS[p.id] || {};

  const AREAS = {
    Clerkenwell: {
      tagline: "Light-filled lofts & thoughtful food",
      landmarks: [
        ["Warehouse courtyards", "4 min walk"],
        ["Design studios", "6 min walk"],
      ],
    },
    Richmond: {
      tagline: "River walks & village calm",
      landmarks: [
        ["Riverside path", "5 min walk"],
        ["Village green", "7 min walk"],
      ],
    },
    "Stoke Newington": {
      tagline: "Leafy streets & strong local culture",
      landmarks: [
        ["Tree-lined park", "6 min walk"],
        ["Local market", "8 min walk"],
      ],
    },
    "West Hove": {
      tagline: "Sea air & design-forward homes",
      landmarks: [
        ["Seafront promenade", "5 min walk"],
        ["Beach huts", "7 min walk"],
      ],
    },
  };
  const areaOf = (p) => p.area.split(",")[0].trim();
  const areaTagline = (p) =>
    AREAS[areaOf(p)]
      ? `${areaOf(p)} is known for ${AREAS[areaOf(p)].tagline.toLowerCase()}.`
      : "";

  /* Illustrative only — labelled as simulated on the page */
  const nearby = (p) => ({
    landmarks: (
      AREAS[areaOf(p)] || { landmarks: [["Local landmark", "6 min walk"]] }
    ).landmarks,
    transport: [
      ["Nearest station", "8 min walk"],
      ["Bus stop", "2 min walk"],
    ],
    schools: [
      ["Primary school (concept)", "10 min walk"],
      ["Secondary school (concept)", "15 min walk"],
    ],
    shopping: [
      ["Local high street", "5 min walk"],
      ["Neighbourhood grocer", "3 min walk"],
    ],
    restaurants: [
      ["Neighbourhood café", "2 min walk"],
      ["Casual dining", "6 min walk"],
    ],
  });

  /* Descriptions are generated only from the demo data above */
  const describe = (p) => {
    const type = p.type.toLowerCase();
    const article = /^[aeiou]/.test(type) ? "An" : "A";
    const rooms =
      p.beds === 0
        ? "a studio layout"
        : `${p.beds} ${p.beds === 1 ? "bedroom" : "bedrooms"}`;
    const lead = `${article} ${type} in ${areaOf(p)} with ${rooms}, ${bathsText(p.baths)} and ${p.sqft.toLocaleString("en-US")} sq ft of floor area.`;
    const feats = p.features.map((f) => FEATURE_LABELS[f].toLowerCase());
    const featureLine = feats.length
      ? `Listed features include ${new Intl.ListFormat("en", { style: "long", type: "conjunction" }).format(feats)}.`
      : "";
    const agentLine = `${p.purpose === "rent" ? "Available to rent" : "Offered for sale"} through ${p.agency}, currently marked “${p.status}”.`;
    return [
      lead,
      [featureLine, agentLine].filter(Boolean).join(" "),
      areaTagline(p),
    ].filter(Boolean);
  };
  const highlights = (p) => [
    `${bedsText(p.beds)} · ${bathsText(p.baths)}`,
    `${p.sqft.toLocaleString("en-US")} sq ft of floor area`,
    ...p.features.slice(0, 3).map((f) => FEATURE_LABELS[f]),
    p.status,
  ];
  const compactPrice = (p) =>
    p.purpose === "rent"
      ? `$${(p.price / 1000)
          .toFixed(p.price % 1000 ? 2 : 0)
          .replace(/0+$/, "")
          .replace(/\.$/, "")}k`
      : p.price >= 1e6
        ? `$${+(p.price / 1e6).toFixed(2)}m`
        : `$${Math.round(p.price / 1000)}k`;

  return {
    PROPERTIES,
    byId,
    FEATURE_LABELS,
    usd,
    priceHTML,
    bedsText,
    bathsText,
    agoText,
    monthly,
    monthlyCost,
    card,
    row,
    href,
    details,
    AREAS,
    areaOf,
    areaTagline,
    nearby,
    describe,
    highlights,
    compactPrice,
  };
})();
