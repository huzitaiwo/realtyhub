/* ==========================================================================
   REALTY — js/home.js
   Home page only: search tabs (buy/rent) · price options · hero parallax
   ========================================================================== */
(() => {
  "use strict";

  /* ---------- Search form ---------- */
  const form = document.querySelector("[data-search-form]");
  if (form) {
    const priceSelect = form.querySelector("[data-price-select]");
    const PRICES = {
      buy: [
        ["", "Any price"],
        ["0-500000", "Under $500k"],
        ["500000-1000000", "$500k – $1m"],
        ["1000000-2000000", "$1m – $2m"],
        ["2000000-", "$2m+"],
      ],
      rent: [
        ["", "Any price"],
        ["0-2000", "Under $2,000 / mo"],
        ["2000-4000", "$2,000 – $4,000 / mo"],
        ["4000-8000", "$4,000 – $8,000 / mo"],
        ["8000-", "$8,000+ / mo"],
      ],
    };
    const PAGES = { buy: "buy.html", rent: "rent.html" };

    const update = (purpose) => {
      form.action = PAGES[purpose];
      priceSelect.innerHTML = PRICES[purpose]
        .map(([value, label]) => `<option value="${value}">${label}</option>`)
        .join("");
    };

    form.querySelectorAll('input[name="purpose"]').forEach((radio) => {
      radio.addEventListener("change", () => update(radio.value));
    });
    update(form.querySelector('input[name="purpose"]:checked').value);
  }

  /* ---------- Hero parallax (subtle) ---------- */
  const img = document.querySelector("[data-parallax]");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (img && !reduce) {
    let ticking = false;
    const frame = () => {
      const y = Math.min(window.scrollY, 800);
      img.style.transform = `translate3d(0, ${y * -0.04}px, 0)`;
      ticking = false;
    };
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          requestAnimationFrame(frame);
          ticking = true;
        }
      },
      { passive: true },
    );
  }
})();
