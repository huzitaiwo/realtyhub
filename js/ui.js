/* ==========================================================================
   REALTY — js/ui.js
   Shared behaviour for every page: scroll reveal · accordion ·
   save / compare toggles (localStorage) · toast
   ========================================================================== */
(() => {
  "use strict";

  const KEYS = { saved: "realty:saved", compare: "realty:compare" };
  const MAX_COMPARE = 4;
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const read = (key) => {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  };
  const write = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable */
    }
  };

  /* ---------- Toast ---------- */
  let toastEl;
  let toastTimer;
  const toast = (message) => {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      toastEl.setAttribute("aria-live", "polite");
      document.body.append(toastEl);
    }
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 2600);
  };

  /* ---------- Save / compare ---------- */
  const syncButtons = () => {
    const saved = read(KEYS.saved);
    const compare = read(KEYS.compare);
    document.querySelectorAll("[data-save]").forEach((btn) => {
      const id = btn.closest("[data-property-id]")?.dataset.propertyId;
      btn.setAttribute("aria-pressed", String(saved.includes(id)));
    });
    document.querySelectorAll("[data-compare]").forEach((btn) => {
      const id = btn.closest("[data-property-id]")?.dataset.propertyId;
      btn.setAttribute("aria-pressed", String(compare.includes(id)));
    });
  };

  const toggle = (key, id) => {
    const list = read(key);
    const index = list.indexOf(id);
    if (index > -1) list.splice(index, 1);
    else list.push(id);
    write(key, list);
    document.dispatchEvent(
      new CustomEvent("realty:change", { detail: { key, list } }),
    );
    return index === -1;
  };

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-save], [data-compare]");
    if (!btn) return;
    const card = btn.closest("[data-property-id]");
    if (!card) return;
    const id = card.dataset.propertyId;
    const name = card.dataset.propertyName || "Home";

    if (btn.hasAttribute("data-save")) {
      const added = toggle(KEYS.saved, id);
      toast(added ? `${name} saved to My Desk` : `${name} removed from saved`);
    } else {
      const list = read(KEYS.compare);
      if (!list.includes(id) && list.length >= MAX_COMPARE) {
        toast(`You can compare up to ${MAX_COMPARE} homes`);
        return;
      }
      const added = toggle(KEYS.compare, id);
      toast(
        added ? `${name} added to compare` : `${name} removed from compare`,
      );
    }
    syncButtons();
  });

  /* ---------- Accordion (single open) ---------- */
  document.querySelectorAll("[data-accordion]").forEach((accordion) => {
    accordion.addEventListener("click", (e) => {
      const trigger = e.target.closest(".accordion__trigger");
      if (!trigger || !accordion.contains(trigger)) return;
      const willOpen = trigger.getAttribute("aria-expanded") !== "true";
      accordion.querySelectorAll(".accordion__item").forEach((item) => {
        const t = item.querySelector(".accordion__trigger");
        const isTarget = t === trigger;
        t.setAttribute("aria-expanded", String(isTarget && willOpen));
        item.classList.toggle("is-open", isTarget && willOpen);
      });
    });
  });

  /* ---------- Scroll reveal ---------- */
  const revealEls = [...document.querySelectorAll("[data-reveal]")];
  document.querySelectorAll("[data-reveal-group]").forEach((group) => {
    [...group.children].forEach((child, i) =>
      child.style.setProperty("--i", i),
    );
  });

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    revealEls.forEach((el) => observer.observe(el));
  }

  /* ---------- Compare tray ---------- */
  const tray = document.createElement("aside");
  tray.className = "compare-tray";
  tray.setAttribute("aria-label", "Comparison tray");
  tray.inert = true;
  tray.innerHTML = `
    <p><strong data-tray-count>0</strong><span data-tray-text>properties selected</span></p>
    <div class="compare-tray__actions">
      <a class="btn btn--brand btn--sm" href="compare.html" data-tray-link>Compare</a>
      <button class="btn btn--outline-light btn--sm" type="button" data-tray-clear>Clear all</button>
    </div>`;
  document.body.append(tray);

  const renderTray = () => {
    const ids = read(KEYS.compare);
    const n = ids.length;
    tray.classList.toggle("is-visible", n > 0);
    tray.inert = n === 0;
    document.body.classList.toggle("has-tray", n > 0);
    tray.querySelector("[data-tray-count]").textContent = n;
    tray.querySelector("[data-tray-text]").textContent =
      n === 1 ? "property selected — add one more" : "properties selected";
    const link = tray.querySelector("[data-tray-link]");
    link.href = `compare.html?ids=${ids.join(",")}`;
    link.setAttribute("aria-disabled", String(n < 2));
  };

  tray.querySelector("[data-tray-link]").addEventListener("click", (e) => {
    if (e.currentTarget.getAttribute("aria-disabled") === "true")
      e.preventDefault();
  });
  tray.querySelector("[data-tray-clear]").addEventListener("click", () => {
    write(KEYS.compare, []);
    document.dispatchEvent(
      new CustomEvent("realty:change", {
        detail: { key: KEYS.compare, list: [] },
      }),
    );
  });
  document.addEventListener("realty:change", () => {
    syncButtons();
    renderTray();
  });
  renderTray();

  syncButtons();

  /* ---------- Confirmation dialog ---------- */
  const confirmDialog = ({
    title,
    text,
    confirmLabel = "Confirm",
    danger = false,
  }) =>
    new Promise((resolve) => {
      const dlg = document.createElement("dialog");
      dlg.className = "dialog dialog--sm";
      dlg.setAttribute("aria-labelledby", "confirm-title");
      dlg.innerHTML = `
      <div class="dialog__head"><h2 class="dialog__title" id="confirm-title">${title}</h2></div>
      <div class="dialog__body"><p class="lead">${text}</p></div>
      <div class="dialog__foot dialog__foot--end">
        <button class="btn btn--outline btn--sm" type="button" data-confirm="no">Keep it</button>
        <button class="btn ${danger ? "btn--danger" : "btn--dark"} btn--sm" type="button" data-confirm="yes">${confirmLabel}</button>
      </div>`;
      document.body.append(dlg);
      let result = false;
      dlg.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-confirm]");
        if (btn) {
          result = btn.dataset.confirm === "yes";
          dlg.close();
        } else if (e.target === dlg) dlg.close();
      });
      dlg.addEventListener("close", () => {
        dlg.remove();
        resolve(result);
      });
      dlg.showModal();
    });

  window.RealtyUI = {
    toast,
    read,
    write,
    KEYS,
    sync: () => {
      syncButtons();
      renderTray();
    },
    confirm: confirmDialog,
  };

  window.RealtyUI = {
    toast,
    read,
    write,
    KEYS,
    sync: () => {
      syncButtons();
      renderTray();
    },
  };
})();
