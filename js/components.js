/* ==========================================================================
   REALTY — js/components.js
   Injects the SVG icon sprite, shared header (+ mobile menu) and footer.
   Every page uses the same two placeholders:
     <div data-component="site-header"></div>
     <div data-component="site-footer"></div>
   Set <body data-page="buy|rent|neighbourhoods|journal|..."> for active state.
   ========================================================================== */
(() => {
  "use strict";

  const NAV = [
    { id: "buy", label: "Buy", href: "buy.html" },
    { id: "rent", label: "Rent", href: "rent.html" },
    {
      id: "neighbourhoods",
      label: "Neighbourhoods",
      href: "neighbourhoods.html",
    },
    { id: "journal", label: "Journal", href: "journal.html" },
  ];

  const FOOTER_COLS = [
    {
      title: "Discover",
      links: [
        ["Homes for sale", "buy.html"],
        ["Homes to rent", "rent.html"],
        ["Neighbourhoods", "neighbourhoods.html"],
        ["Market journal", "journal.html"],
      ],
    },
    {
      title: "For professionals",
      links: [
        ["Agent workspace", "agent-desk.html"],
        ["Agency desk", "agency-desk.html"],
        ["List a property", "list-a-home.html"],
        ["Market reports", "journal.html?topic=reports"],
      ],
    },
    {
      title: "About REALTY",
      links: [
        ["How it works", "index.html#how-it-works"],
        ["Help centre", "help.html"],
        ["Preferences", "desk.html#preferences"],
        ["Privacy", "privacy.html"],
      ],
    },
  ];

  const SPRITE = `
<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" style="position:absolute;width:0;height:0;overflow:hidden">
  <symbol id="i-mark" viewBox="0 0 24 24"><path d="M3 3h12v12H3zM9 9h12v12H9z"/></symbol>
  <symbol id="i-arrow-right" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>
  <symbol id="i-arrow-up-right" viewBox="0 0 24 24"><path d="M7 17 17 7M8 7h9v9"/></symbol>
  <symbol id="i-chevron-down" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></symbol>
  <symbol id="i-chevron-right" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></symbol>
  <symbol id="i-heart" viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></symbol>
  <symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
  <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></symbol>
  <symbol id="i-bed" viewBox="0 0 24 24"><path d="M3 19V7M3 15h18v4M21 15v-3a3 3 0 0 0-3-3h-7v6M7 12.5a1.5 1.5 0 1 0 0-.01"/></symbol>
  <symbol id="i-bath" viewBox="0 0 24 24"><path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3zM6 12V6.5a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2"/></symbol>
  <symbol id="i-area" viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></symbol>
  <symbol id="i-home" viewBox="0 0 24 24"><path d="m4 11 8-7 8 7M6 10v10h12V10M10 20v-5h4v5"/></symbol>
  <symbol id="i-building" viewBox="0 0 24 24"><rect x="6" y="3" width="12" height="18"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/></symbol>
  <symbol id="i-land" viewBox="0 0 24 24"><path d="m4 17 8 4 8-4-8-4-8 4zM12 13V4l5 2.5L12 9"/></symbol>
  <symbol id="i-compass" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/></symbol>
  <symbol id="i-dollar" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M14.5 9.5c-.4-1-1.4-1.5-2.5-1.5-1.4 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1.1 0-2.1-.5-2.5-1.5M12 6v2M12 16v2"/></symbol>
  <symbol id="i-sparkle" viewBox="0 0 24 24"><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/></symbol>
    <symbol id="i-sliders" viewBox="0 0 24 24"><path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/></symbol>
  <symbol id="i-sort" viewBox="0 0 24 24"><path d="M8 20V4m0 0L4.5 7.5M8 4l3.5 3.5M16 4v16m0 0 3.5-3.5M16 20l-3.5-3.5"/></symbol>
  <symbol id="i-close" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></symbol>
  <symbol id="i-minus" viewBox="0 0 24 24"><path d="M5 12h14"/></symbol>
  <symbol id="i-check" viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></symbol>
</svg>`;

  const icon = (name, cls = "") =>
    `<svg class="icon ${cls}" aria-hidden="true" focusable="false"><use href="#i-${name}"></use></svg>`;

  const page = document.body.dataset.page || "";
  const current = (item) => (item.id === page ? ' aria-current="page"' : "");

  const mark =
    '<svg class="logo__mark" aria-hidden="true" focusable="false"><use href="#i-mark"></use></svg>';

  const headerHTML = `
<header class="site-header" data-header>
  <div class="site-header__inner">
    <nav class="site-nav" aria-label="Primary">
      <ul>${NAV.map((n) => `<li><a href="${n.href}"${current(n)}>${n.label}</a></li>`).join("")}</ul>
    </nav>

    <a class="logo" href="index.html" aria-label="REALTY home">${mark}<span class="logo__word">REALTY</span></a>

    <div class="site-header__actions">
      <a class="btn btn--outline btn--sm" href="desk.html">My Desk</a>
      <a class="btn btn--dark btn--sm" href="list-a-home.html">List a home ${icon("arrow-up-right", "icon--diag")}</a>
    </div>

    <button class="burger" type="button" aria-expanded="false" aria-controls="mobile-menu" aria-label="Open menu">
      <span></span><span></span>
    </button>
  </div>
</header>

<div class="mobile-menu" id="mobile-menu" role="dialog" aria-modal="true" aria-label="Site menu" inert>
  <nav aria-label="Mobile primary">
    <ol class="mobile-menu__list">
      ${NAV.map(
        (n, i) => `
      <li style="--i:${i}">
        <a href="${n.href}"${current(n)}>
          <span class="mobile-menu__num">0${i + 1}</span>
          <span class="mobile-menu__label">${n.label}</span>
          ${icon("arrow-right")}
        </a>
      </li>`,
      ).join("")}
    </ol>
  </nav>
  <div class="mobile-menu__actions">
    <a class="btn btn--outline" href="desk.html">My Desk</a>
    <a class="btn btn--dark" href="list-a-home.html">List a home ${icon("arrow-up-right", "icon--diag")}</a>
  </div>
  <p class="mobile-menu__note">A clearer, calmer way to find the place that fits.</p>
</div>`;

  const footerHTML = `
<footer class="site-footer">
  <div class="container site-footer__top">
    <div class="site-footer__brand">
      <a class="logo logo--stacked logo--light" href="index.html" aria-label="REALTY home">${mark}<span class="logo__word">REALTY</span></a>
      <p>A clearer, calmer way to find the place that fits. Discover addresses, compare particulars, and move with confidence.</p>
    </div>
    ${FOOTER_COLS.map(
      (col, i) => `
    <nav aria-labelledby="footer-col-${i}">
      <h2 class="site-footer__title" id="footer-col-${i}">${col.title}</h2>
      <ul class="site-footer__list">
        ${col.links.map(([label, href]) => `<li><a href="${href}">${label}</a></li>`).join("")}
      </ul>
    </nav>`,
    ).join("")}
  </div>
  <div class="container site-footer__bottom">
    <p>© <span data-year>2026</span> REALTY by Handsome. A product concept interface.</p>
    <p>Property availability and financial figures shown here are representative demos.</p>
  </div>
</footer>`;

  /* Inject sprite + components */
  document.body.insertAdjacentHTML("afterbegin", SPRITE);
  const headerSlot = document.querySelector('[data-component="site-header"]');
  const footerSlot = document.querySelector('[data-component="site-footer"]');
  if (headerSlot) headerSlot.outerHTML = headerHTML;
  if (footerSlot) footerSlot.outerHTML = footerHTML;
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  /* Header behaviour */
  const header = document.querySelector("[data-header]");
  const burger = document.querySelector(".burger");
  const menu = document.getElementById("mobile-menu");
  if (!header || !burger || !menu) return;

  const onScroll = () =>
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const background = () => document.querySelectorAll("main, .site-footer");

  const setMenu = (open, { restoreFocus = true } = {}) => {
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.classList.toggle("is-open", open);
    menu.inert = !open;
    header.classList.toggle("is-menu-open", open);
    document.documentElement.classList.toggle("is-locked", open);
    background().forEach((el) => {
      el.inert = open;
    });
    if (open) menu.querySelector("a")?.focus({ preventScroll: true });
    else if (restoreFocus) burger.focus({ preventScroll: true });
  };

  burger.addEventListener("click", () =>
    setMenu(burger.getAttribute("aria-expanded") !== "true"),
  );
  menu.addEventListener("click", (e) => {
    if (e.target.closest("a")) setMenu(false, { restoreFocus: false });
  });

  document.addEventListener("keydown", (e) => {
    if (!menu.classList.contains("is-open")) return;
    if (e.key === "Escape") {
      setMenu(false);
      return;
    }
    if (e.key !== "Tab") return;
    const items = [burger, ...menu.querySelectorAll("a[href]")];
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  window
    .matchMedia("(min-width: 56.3125em)")
    .addEventListener("change", (e) => {
      if (e.matches && menu.classList.contains("is-open"))
        setMenu(false, { restoreFocus: false });
    });
})();
