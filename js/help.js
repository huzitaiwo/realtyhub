/* ==========================================================================
   REALTY — js/help.js
   Help centre: answers (rendered into the shared accordion) · topic filter ·
   live search · contact form (front-end concept)
   ========================================================================== */
(() => {
  "use strict";

  const list = document.querySelector("[data-help-list]");
  if (!list) return;

  const ANSWERS = [
    [
      "buying",
      "How do I search for homes?",
      "Use the search on the home page or open Buy. Filter by price, bedrooms, property type and features, then sort the results. Hover a card to find its price marker on the map.",
    ],
    [
      "buying",
      "How does the map work?",
      "The map in this demo is simulated. Price markers show an approximate placement rather than real geospatial data. You can pan, zoom and select a marker to preview a home, and a real map provider can be connected later.",
    ],
    [
      "buying",
      "How do I compare homes?",
      "Select + Compare on up to four homes. A tray appears at the bottom of the page; open it to see price, area, price per square foot, amenities, listing age, an estimated monthly payment and the agent side by side, with the best values highlighted.",
    ],
    [
      "buying",
      "What do the labels on a listing mean?",
      "Labels such as New to REALTY, Reduced, Verified listing and Open viewing describe the status shown by the listing agent. In this demo they are representative examples.",
    ],
    [
      "renting",
      "How do rental prices work?",
      "Rental prices are shown per month. When you choose Rent, the price filters switch to monthly ranges, and the comparison page shows the rent as the monthly figure.",
    ],
    [
      "renting",
      "Can I save a rental search?",
      "Yes. In My Desk, open Saved searches, choose New saved search and set it to Rent. You can pause the alerts, edit the search or delete it at any time.",
    ],
    [
      "viewings",
      "How do I request a viewing?",
      "Open a home and choose Schedule viewing. Pick a date, pick an available time, enter your contact details and confirm. The request then appears under Viewings in My Desk.",
    ],
    [
      "viewings",
      "Can I reschedule or cancel a viewing?",
      "Yes. In My Desk, open Viewings and choose Reschedule or Cancel next to the request. Cancelled and completed viewings can be booked again.",
    ],
    [
      "viewings",
      "What do the viewing statuses mean?",
      "Requested means you have asked for a time. Confirmed means the agent has accepted it. Rescheduled means a new time has been chosen. Cancelled means the viewing will not go ahead. Completed means it has taken place.",
    ],
    [
      "mortgage",
      "Is a mortgage estimate an offer or an approval?",
      "Neither. The estimate is an indication based on the deposit, term and rate you enter. It is not financial advice and it is not an offer from a lender.",
    ],
    [
      "mortgage",
      "How is the monthly figure calculated?",
      "REALTY uses the standard repayment formula: the loan amount (price minus deposit), the interest rate and the term give a regular payment. On comparison pages the estimate assumes a 20% deposit at 4.5% over 25 years. You can change every value in Mortgage tools.",
    ],
    [
      "mortgage",
      "How does the affordability calculator work?",
      "It estimates a home price from your income, monthly expenses, deposit, rate and term. It assumes a repayment of no more than 35% of your gross monthly income, and no more than what remains after your expenses. It is a rough guide only.",
    ],
    [
      "account",
      "Where is my saved information kept?",
      "In this demo, saved homes, searches, viewings, messages and settings are kept in your browser on this device. Clearing your browser data removes them. You can also use Clear data in Settings.",
    ],
    [
      "account",
      "How do I change my name or preferences?",
      "Open Profile in My Desk to edit your name, contact details and home preferences. Alert and display options live in Settings.",
    ],
    [
      "agents",
      "How do I list a home?",
      "Choose List a home, then New listing. Add the details, upload up to four photos and save it as a draft or publish it. You can change its status, edit it or delete it from the same page.",
    ],
    [
      "agents",
      "How do I add team members to my agency?",
      "Open the Agency Desk and choose Invite agent. Enter their name and email and pick a role. You can assign listings to each team member from the Agency listings table.",
    ],
  ];

  const tabs = document.querySelector("[data-help-tabs]");
  const input = document.getElementById("help-q");
  const count = document.querySelector("[data-help-count]");
  const empty = document.querySelector("[data-help-empty]");
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

  list.innerHTML = ANSWERS.map(
    ([cat, q, a], i) => `
    <div class="accordion__item" data-cat="${cat}" data-text="${esc((q + " " + a).toLowerCase())}">
      <h3 class="accordion__heading">
        <button class="accordion__trigger" type="button" id="help-t${i}" aria-expanded="false" aria-controls="help-p${i}">
          ${esc(q)}
          <svg class="icon icon--brand" aria-hidden="true"><use href="#i-chevron-right"></use></svg>
        </button>
      </h3>
      <div class="accordion__panel" id="help-p${i}" role="region" aria-labelledby="help-t${i}">
        <div><p>${esc(a)}</p></div>
      </div>
    </div>`,
  ).join("");

  const apply = () => {
    const cat = tabs.querySelector("input:checked").value;
    const term = input.value.trim().toLowerCase();
    let n = 0;
    list.querySelectorAll(".accordion__item").forEach((item) => {
      const show =
        (cat === "all" || item.dataset.cat === cat) &&
        (!term || item.dataset.text.includes(term));
      item.hidden = !show;
      if (show) n += 1;
    });
    count.textContent = `${n} ${n === 1 ? "answer" : "answers"}`;
    empty.hidden = n > 0;
    list.hidden = n === 0;
  };

  tabs.addEventListener("change", apply);
  input.addEventListener("input", apply);
  document
    .querySelector("[data-help-search]")
    .addEventListener("submit", (e) => e.preventDefault());
  document.querySelector("[data-help-reset]").addEventListener("click", () => {
    input.value = "";
    tabs.querySelector('input[value="all"]').checked = true;
    apply();
    input.focus();
  });

  /* Open an answer directly: help.html#help-p3 */
  const open = (id) => {
    const panel = document.getElementById(id);
    const item = panel && panel.closest(".accordion__item");
    if (!item) return;
    item.hidden = false;
    item.classList.add("is-open");
    item
      .querySelector(".accordion__trigger")
      .setAttribute("aria-expanded", "true");
    item.scrollIntoView({ block: "center" });
  };
  apply();
  if (location.hash.startsWith("#help-p")) open(location.hash.slice(1));

  /* ---------- Contact form (front-end concept) ---------- */
  const form = document.querySelector("[data-help-form]");
  const err = document.querySelector("[data-help-error]");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = form.elements;
    err.textContent = "";
    if (!f.name.value.trim()) {
      err.textContent = "Please enter your name.";
      f.name.focus();
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(f.email.value.trim())) {
      err.textContent = "Please enter a valid email address.";
      f.email.focus();
      return;
    }
    if (!f.message.value.trim()) {
      err.textContent = "Please write a short message.";
      f.message.focus();
      return;
    }

    const UI = window.RealtyUI;
    const all = UI ? UI.read("realty:support") : [];
    all.push({
      name: f.name.value.trim(),
      email: f.email.value.trim(),
      topic: f.topic.value,
      message: f.message.value.trim(),
      at: new Date().toISOString(),
    });
    if (UI) {
      UI.write("realty:support", all);
      UI.toast("Message sent. We will be in touch (concept)");
    }
    form.reset();
  });
})();
