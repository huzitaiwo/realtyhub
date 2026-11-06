/* ==========================================================================
   REALTY — js/profile.js
   Profile form: personal details + home preferences (localStorage object)
   ========================================================================== */
(() => {
  "use strict";

  const UI = window.RealtyUI;
  const form = document.querySelector("[data-profile]");
  if (!UI || !form) return;

  const KEY = "realty:profile";
  const DEFAULT_NAME = "Handsome";
  const avatar = document.querySelector("[data-avatar]");
  const saved = UI.getObject(KEY, {});

  const initialOf = (name) =>
    (name.trim().charAt(0) || DEFAULT_NAME.charAt(0)).toUpperCase();
  const setError = (field, message) => {
    const box = form.querySelector(`[data-error="${field}"]`);
    const input = form.elements[field];
    if (box) box.textContent = message;
    if (input) {
      if (message) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
    }
  };

  /* ---------- Load ---------- */
  const values = {
    name: DEFAULT_NAME,
    email: "",
    phone: "",
    location: "",
    purpose: "buy",
    beds: 0,
    budgetMin: "",
    budgetMax: "",
    areas: [],
    ...saved,
  };
  form.elements.name.value = values.name;
  form.elements.email.value = values.email;
  form.elements.phone.value = values.phone;
  form.elements.location.value = values.location;
  form.elements.purpose.value = values.purpose;
  form.elements.beds.value = String(values.beds);
  form.elements.budgetMin.value = values.budgetMin;
  form.elements.budgetMax.value = values.budgetMax;
  form.querySelectorAll('input[name="areas"]').forEach((box) => {
    box.checked = values.areas.includes(box.value);
  });
  avatar.textContent = initialOf(values.name);

  form.elements.name.addEventListener("input", () => {
    avatar.textContent = initialOf(form.elements.name.value);
  });

  /* ---------- Save ---------- */
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.elements.name.value.trim();
    const email = form.elements.email.value.trim();
    setError("name", "");
    setError("email", "");

    if (!name) {
      setError("name", "Please enter your name.");
      form.elements.name.focus();
      return;
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      setError("email", "Please enter a valid email address.");
      form.elements.email.focus();
      return;
    }

    UI.setObject(KEY, {
      name,
      email,
      phone: form.elements.phone.value.trim(),
      location: form.elements.location.value.trim(),
      purpose: form.elements.purpose.value,
      beds: Number(form.elements.beds.value) || 0,
      budgetMin: form.elements.budgetMin.value,
      budgetMax: form.elements.budgetMax.value,
      areas: [...form.querySelectorAll('input[name="areas"]:checked')].map(
        (b) => b.value,
      ),
    });

    /* Update the desk header chip without a reload */
    const chipName = document.querySelector(".user-chip__text strong");
    const chipAvatar = document.querySelector(".user-chip__avatar");
    if (chipName) chipName.textContent = name;
    if (chipAvatar) chipAvatar.textContent = initialOf(name);

    UI.toast("Profile saved");
  });
})();
