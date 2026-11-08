/* ==========================================================================
   REALTY — js/desk.js
   Shared by every My Desk page: injects sidebar + mobile top bar + user chip,
   drawer behaviour, time-of-day greeting, and the mortgage estimate.
   Set <body data-desk="overview|saved-properties|saved-searches|compare|
   viewings|messages|mortgage|profile|settings|notifications">
   ========================================================================== */
(() => {
  "use strict";

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
  const profile = window.RealtyUI
    ? window.RealtyUI.getObject("realty:profile", {})
    : {};
  const name = (profile.name || "").trim() || "Handsome";
  const isAgent = document.body.dataset.deskArea === "agent";
  const USER = {
    name,
    safe: esc(name),
    initial: esc(name.charAt(0).toUpperCase()),
    note: isAgent ? "Agent workspace" : "Personal workspace",
  };

  const NAV = [
    ["overview", "Overview", "grid", "desk.html"],
    ["saved-properties", "Saved properties", "heart", "saved-properties.html"],
    ["saved-searches", "Saved searches", "search", "saved-searches.html"],
    ["compare", "Compare", "bookmark", "compare.html"],
    ["viewings", "Viewings", "calendar", "viewings.html"],
    ["messages", "Messages", "message", "messages.html"],
    ["mortgage", "Mortgage tools", "calculator", "mortgage.html"],
    ["profile", "Profile", "user", "profile.html"],
    ["settings", "Settings", "settings", "settings.html"],
  ];
  const FOOT = [
    ["notifications", "Notifications", "bell", "notifications.html"],
  ];

  const AGENT_NAV = [
    ["overview", "Overview", "grid", "agent-desk.html"],
    ["listings", "Listings", "home", "properties.html"],
    ["leads", "Leads", "users", "agent-desk.html#leads"],
    ["viewings", "Viewings", "calendar", "agent-desk.html#viewings"],
    ["analytics", "Analytics", "chart", "agent-desk.html#analytics"],
  ];
  const AGENT_FOOT = [
    ["mydesk", "My Desk", "user", "desk.html"],
    ["notifications", "Notifications", "bell", "notifications.html"],
  ];
  const NAV_ITEMS = isAgent ? AGENT_NAV : NAV;
  const FOOT_ITEMS = isAgent ? AGENT_FOOT : FOOT;

  const current = document.body.dataset.desk || "";
  const icon = (n) =>
    `<svg class="icon" aria-hidden="true" focusable="false"><use href="#i-${n}"></use></svg>`;
  const mark =
    '<svg class="logo__mark" aria-hidden="true" focusable="false"><use href="#i-mark"></use></svg>';
  const link = ([id, label, ic, href]) =>
    `<li><a href="${href}"${id === current ? ' aria-current="page"' : ""}>${icon(ic)}<span>${label}</span></a></li>`;

  const shellHTML = `
<header class="desk-topbar">
  <a class="logo" href="index.html" aria-label="REALTY home">${mark}<span class="logo__word">REALTY</span></a>
  <button class="burger" type="button" aria-expanded="false" aria-controls="desk-sidebar" aria-label="Open desk menu"><span></span><span></span></button>
</header>
<aside class="desk-sidebar" id="desk-sidebar"aria-label="${isAgent ? "Agent Desk" : "My Desk"}">
  <a class="logo logo--light" href="index.html" aria-label="REALTY home">${mark}<span class="logo__word">REALTY</span></a>
  <nav aria-label="Desk navigation">
    <ul class="desk-nav">${NAV_ITEMS.map(link).join("")}</ul>
  </nav>
  <nav class="desk-nav--foot" aria-label="Desk notifications">
    <ul class="desk-nav">${FOOT_ITEMS.map(link).join("")}</ul>
  </nav>
</aside>
<div class="desk-scrim"></div>`;

  const userHTML = `
<div class="user-chip">
  <span class="user-chip__avatar" aria-hidden="true">${USER.initial}</span>
  <span class="user-chip__text"><strong>${USER.name}</strong> to <strong>${USER.safe}</strong><span>${USER.note}</span></span>
</div>`;

  const sidebarSlot = document.querySelector('[data-component="desk-sidebar"]');
  const userSlot = document.querySelector('[data-component="desk-user"]');
  if (sidebarSlot) sidebarSlot.outerHTML = shellHTML;
  if (userSlot) userSlot.outerHTML = userHTML;

  /* ---------- Greeting ---------- */
  const greeting = document.querySelector("[data-greeting]");
  if (greeting) {
    const h = new Date().getHours();
    const part =
      h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
    greeting.textContent = `${part}, ${USER.name}.`;
  }

  /* ---------- Mobile drawer ---------- */
  const burger = document.querySelector(".desk-topbar .burger");
  const sidebar = document.getElementById("desk-sidebar");
  const scrim = document.querySelector(".desk-scrim");
  if (burger && sidebar && scrim) {
    const mq = window.matchMedia("(max-width: 56.25em)");
    sidebar.inert = mq.matches;

    const setDrawer = (open, { restoreFocus = true } = {}) => {
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute(
        "aria-label",
        open ? "Close desk menu" : "Open desk menu",
      );
      sidebar.classList.toggle("is-open", open);
      sidebar.inert = mq.matches && !open;
      scrim.classList.toggle("is-visible", open);
      document.documentElement.classList.toggle("is-locked", open);
      document.querySelector(".desk-main")?.toggleAttribute("inert", open);
      if (open) sidebar.querySelector("a")?.focus({ preventScroll: true });
      else if (restoreFocus) burger.focus({ preventScroll: true });
    };

    burger.addEventListener("click", () =>
      setDrawer(burger.getAttribute("aria-expanded") !== "true"),
    );
    scrim.addEventListener("click", () => setDrawer(false));
    sidebar.addEventListener("click", (e) => {
      if (e.target.closest("a")) setDrawer(false, { restoreFocus: false });
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && sidebar.classList.contains("is-open"))
        setDrawer(false);
    });
    mq.addEventListener("change", () => {
      sidebar.classList.remove("is-open");
      scrim.classList.remove("is-visible");
      document.documentElement.classList.remove("is-locked");
      document.querySelector(".desk-main")?.removeAttribute("inert");
      burger.setAttribute("aria-expanded", "false");
      sidebar.inert = mq.matches;
    });
  }

  /* ---------- Mortgage estimate (repayment formula) ---------- */
  const form = document.querySelector("[data-calc]");
  if (form) {
    const out = form.querySelector("[data-calc-output]");
    const num = (name) => Math.max(0, Number(form.elements[name].value) || 0);

    const calculate = () => {
      const price = num("price");
      const loan = price - Math.min(num("deposit"), price);
      const months = Math.round(num("years") * 12);
      const r = num("rate") / 100 / 12;
      let monthly = 0;
      if (loan > 0 && months > 0) {
        monthly =
          r === 0 ? loan / months : (loan * r) / (1 - Math.pow(1 + r, -months));
      }
      out.textContent = `$${Math.round(monthly).toLocaleString("en-US")}`;
    };

    form.addEventListener("input", calculate);
    form.addEventListener("submit", (e) => e.preventDefault());
    calculate();
  }
})();
