/* ==========================================================================
   REALTY — js/mortgage.js
   Mortgage calculator (repayment) + affordability calculator. Estimates only.
   Prefill: mortgage.html?price=875000&deposit=175000
   ========================================================================== */
(() => {
  "use strict";

  const usd = (n) => `$${Math.round(n).toLocaleString("en-US")}`;
  const params = new URLSearchParams(location.search);

  /* Repayment per period */
  const payment = (loan, ratePct, periods, perYear) => {
    if (loan <= 0 || periods <= 0) return 0;
    const r = ratePct / 100 / perYear;
    return r === 0
      ? loan / periods
      : (loan * r) / (1 - Math.pow(1 + r, -periods));
  };
  const num = (form, name) =>
    Math.max(0, Number(form.elements[name].value) || 0);

  /* ---------- Mortgage calculator ---------- */
  const mort = document.querySelector("[data-mortgage]");
  if (mort) {
    const el = (k) => mort.querySelector(`[data-m="${k}"]`);
    const FREQ = {
      monthly: [12, "monthly"],
      fortnightly: [26, "fortnightly"],
      weekly: [52, "weekly"],
    };

    if (Number(params.get("price")) > 0)
      mort.elements.price.value = Number(params.get("price"));
    if (params.get("deposit") !== null && Number(params.get("deposit")) >= 0)
      mort.elements.deposit.value = Number(params.get("deposit"));

    const calculate = () => {
      const price = num(mort, "price");
      const deposit = Math.min(num(mort, "deposit"), price);
      const loan = price - deposit;
      const [perYear, label] =
        FREQ[mort.elements.frequency.value] || FREQ.monthly;
      const years = Math.min(40, Math.max(1, num(mort, "years")));
      const periods = Math.round(years * perYear);
      const pay = payment(loan, num(mort, "rate"), periods, perYear);
      const total = pay * periods;
      const interest = Math.max(0, total - loan);
      const principalPct = total > 0 ? (loan / total) * 100 : 100;

      el("loan-field").textContent = usd(loan);
      el("freq-label").textContent = label;
      el("payment").textContent = usd(pay);
      el("deposit-pct").textContent =
        `${price > 0 ? Math.round((deposit / price) * 100) : 0}%`;
      el("total-interest").textContent = usd(interest);
      el("total").textContent = usd(total);
      el("principal").textContent =
        `${usd(loan)} · ${Math.round(principalPct)}%`;
      el("interest-share").textContent =
        `${usd(interest)} · ${Math.round(100 - principalPct)}%`;
      el("arc").style.strokeDasharray = `${principalPct} ${100 - principalPct}`;
    };

    mort.addEventListener("input", calculate);
    mort.addEventListener("change", calculate);
    mort.addEventListener("submit", (e) => e.preventDefault());
    calculate();
  }

  /* ---------- Affordability ---------- */
  const aff = document.querySelector("[data-afford]");
  if (aff) {
    const el = (k) => aff.querySelector(`[data-a="${k}"]`);

    const calculate = () => {
      const monthlyIncome = num(aff, "income") / 12;
      const expenses = num(aff, "expenses");
      const deposit = num(aff, "deposit");
      const years = Math.min(40, Math.max(1, num(aff, "years")));
      const periods = years * 12;
      const r = num(aff, "rate") / 100 / 12;

      const affordable = Math.max(
        0,
        Math.min(monthlyIncome * 0.35, monthlyIncome - expenses),
      );
      const loan =
        affordable * (r === 0 ? periods : (1 - Math.pow(1 + r, -periods)) / r);
      const price = loan + deposit;

      el("price").textContent = usd(price);
      el("loan").textContent = usd(loan);
      el("payment").textContent = `${usd(affordable)} / month`;
      el("deposit").textContent = usd(deposit);
      el("msg").textContent =
        affordable === 0
          ? "Your expenses leave little room for a repayment in this estimate."
          : `Based on a repayment of about ${usd(affordable)} a month.`;
    };

    aff.addEventListener("input", calculate);
    aff.addEventListener("submit", (e) => e.preventDefault());
    calculate();
  }
})();
