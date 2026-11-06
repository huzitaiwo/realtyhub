/* ==========================================================================
   REALTY — js/settings.js
   Settings: alert matrix, preferences, privacy, clear local data
   ========================================================================== */
(() => {
  "use strict";

  const UI = window.RealtyUI;
  const root = document.querySelector("[data-settings]");
  if (!UI || !root) return;

  const KEY = "realty:settings";
  const DEFAULTS = {
    "match.email": true,
    "match.app": true,
    "price.email": true,
    "price.app": true,
    "status.email": false,
    "status.app": true,
    "viewing.email": true,
    "viewing.app": true,
    "agent.email": true,
    "agent.app": true,
    unit: "sqft",
    purpose: "buy",
    showProfile: true,
  };

  const values = { ...DEFAULTS, ...UI.getObject(KEY, {}) };

  root.querySelectorAll("[data-setting]").forEach((el) => {
    const value = values[el.dataset.setting];
    if (el.type === "checkbox") el.checked = !!value;
    else el.value = value;
  });

  root.addEventListener("change", (e) => {
    const el = e.target.closest("[data-setting]");
    if (!el) return;
    values[el.dataset.setting] = el.type === "checkbox" ? el.checked : el.value;
    UI.setObject(KEY, values);
    UI.toast("Settings saved");
  });

  root.querySelector("[data-clear-data]").addEventListener("click", () => {
    UI.confirm({
      title: "Clear all saved data?",
      text: "This removes everything REALTY has saved in this browser. It cannot be undone.",
      confirmLabel: "Clear data",
      danger: true,
    }).then((yes) => {
      if (!yes) return;
      try {
        Object.keys(localStorage)
          .filter((k) => k.startsWith("realty:"))
          .forEach((k) => localStorage.removeItem(k));
      } catch {
        /* storage unavailable */
      }
      UI.toast("Saved data cleared");
      setTimeout(() => location.reload(), 900);
    });
  });
})();
