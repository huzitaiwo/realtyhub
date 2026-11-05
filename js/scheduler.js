/* ==========================================================================
   REALTY — js/scheduler.js
   Shared viewing scheduler (4 steps): date → time → details → confirm.
   Usage: RealtyScheduler.open({ propertyId?, viewingId? })
   Needs data.js + ui.js. Stores viewings in localStorage "realty:viewings".
   ========================================================================== */
window.RealtyScheduler = (() => {
  "use strict";

  const D = window.RealtyData;
  const UI = window.RealtyUI;
  const KEY = "realty:viewings";
  const TIMES = [
    "09:00",
    "10:30",
    "12:00",
    "13:30",
    "14:30",
    "15:30",
    "16:30",
    "17:30",
  ];
  const STATUS = {
    requested: "Requested",
    confirmed: "Confirmed",
    rescheduled: "Rescheduled",
    cancelled: "Cancelled",
    completed: "Completed",
  };
  const DEFAULT_NAME = "Handsome";

  /* ---------- Dates + storage ---------- */
  const pad = (n) => String(n).padStart(2, "0");
  const iso = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (s) => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const dateLabel = (s) =>
    parse(s).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  const today = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  };
  const offset = (n) => {
    const d = today();
    d.setDate(d.getDate() + n);
    return iso(d);
  };
  const nextWeekday = (dow) => {
    const d = today();
    do {
      d.setDate(d.getDate() + 1);
    } while (d.getDay() !== dow);
    return iso(d);
  };
  const upcomingDays = () => {
    const out = [];
    for (let i = 1; out.length < 12; i += 1) {
      const d = today();
      d.setDate(d.getDate() + i);
      if (d.getDay() !== 0) out.push(d);
    }
    return out;
  };

  const read = () => UI.read(KEY);
  const write = (list) => {
    UI.write(KEY, list);
    document.dispatchEvent(new CustomEvent("realty:viewings"));
  };

  const seed = () => {
    try {
      if (localStorage.getItem(KEY) !== null) return;
    } catch {
      return;
    }
    const base = {
      name: DEFAULT_NAME,
      email: "",
      phone: "",
      contact: "Email",
      note: "",
    };
    UI.write(KEY, [
      {
        ...base,
        id: "v-seed-1",
        propertyId: "olive-court",
        date: nextWeekday(4),
        time: "14:30",
        status: "confirmed",
      },
      {
        ...base,
        id: "v-seed-2",
        propertyId: "marlowe-townhouse",
        date: nextWeekday(5),
        time: "10:30",
        status: "requested",
      },
      {
        ...base,
        id: "v-seed-3",
        propertyId: "the-canton-apartment",
        date: offset(-7),
        time: "12:00",
        status: "completed",
      },
    ]);
  };

  /* Demo availability: some slots are taken, deterministically */
  const taken = (date, i) => (parse(date).getDate() + i) % 4 === 0;

  /* ---------- Dialog ---------- */
  let dlg;
  let state;

  const ensureDialog = () => {
    if (dlg) return dlg;
    dlg = document.createElement("dialog");
    dlg.className = "dialog";
    dlg.setAttribute("aria-labelledby", "sched-title");
    dlg.innerHTML = `
      <header class="dialog__head">
        <div><p class="eyebrow" data-sched-kicker>Step 1 of 4</p><h2 class="dialog__title" id="sched-title">Schedule a viewing</h2></div>
        <button class="icon-btn" type="button" data-sched-close aria-label="Close"><svg class="icon" aria-hidden="true"><use href="#i-close"></use></svg></button>
      </header>
      <div class="steps-bar" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
      <div class="dialog__body" data-sched-body></div>
      <footer class="dialog__foot">
        <button class="btn btn--outline btn--sm" type="button" data-sched-back>Back</button>
        <button class="btn btn--dark btn--sm" type="button" data-sched-next>Continue</button>
      </footer>`;
    document.body.append(dlg);

    dlg.addEventListener("click", (e) => {
      if (e.target === dlg || e.target.closest("[data-sched-close]")) {
        dlg.close();
        return;
      }
      if (e.target.closest("[data-sched-back]")) {
        state.error = "";
        state.step -= 1;
        render();
        return;
      }
      if (e.target.closest("[data-sched-next]")) next();
    });

    dlg.addEventListener("change", (e) => {
      const t = e.target;
      if (t.name === "date") {
        state.date = t.value;
        state.time = "";
      } else if (t.name === "time") state.time = t.value;
      else if (t.dataset.f) state[t.dataset.f] = t.value;
      state.error = "";
    });
    dlg.addEventListener("input", (e) => {
      if (e.target.dataset.f) state[e.target.dataset.f] = e.target.value;
    });
    return dlg;
  };

  /* ---------- Steps ---------- */
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
  const err = () =>
    `<p class="field__error" role="alert">${state.error || ""}</p>`;

  const step1 = () => {
    const p = D.byId[state.propertyId];
    const home = state.fixed
      ? `<p class="sched__property">${p.name} <span>· ${p.area}</span></p>`
      : `<label class="field"><span class="field__label">Home</span>
          <select class="input" data-f="propertyId">${D.PROPERTIES.map(
            (x) =>
              `<option value="${x.id}" ${x.id === state.propertyId ? "selected" : ""}>${x.name} — ${x.area}</option>`,
          ).join("")}</select></label>`;
    const days = upcomingDays()
      .map((d) => {
        const v = iso(d);
        return `<label class="choice"><input class="visually-hidden" type="radio" name="date" value="${v}" ${state.date === v ? "checked" : ""}>
        <span><small>${d.toLocaleDateString("en-GB", { weekday: "short" })}</small><strong>${d.getDate()}</strong><small>${d.toLocaleDateString("en-GB", { month: "short" })}</small></span></label>`;
      })
      .join("");
    return `${home}<fieldset class="sched__group"><legend class="field__label">Choose a date</legend><div class="choice-grid">${days}</div></fieldset>${err()}`;
  };

  const step2 = () => {
    const slots = TIMES.map((t, i) => {
      const own =
        state.original &&
        state.original.date === state.date &&
        state.original.time === t;
      const off = taken(state.date, i) && !own;
      return `<label class="choice choice--wide"><input class="visually-hidden" type="radio" name="time" value="${t}" ${state.time === t ? "checked" : ""} ${off ? "disabled" : ""}>
        <span><strong>${t}</strong>${off ? "<small>Unavailable</small>" : ""}</span></label>`;
    }).join("");
    return `<p class="sched__property">${dateLabel(state.date)}</p>
      <fieldset class="sched__group"><legend class="field__label">Choose an available time</legend><div class="choice-grid">${slots}</div></fieldset>${err()}`;
  };

  const step3 = () => `
    <div class="form-grid">
      <label class="field"><span class="field__label">Name</span><input class="input" data-f="name" type="text" value="${esc(state.name)}" autocomplete="name"></label>
      <label class="field"><span class="field__label">Email</span><input class="input" data-f="email" type="email" value="${esc(state.email)}" autocomplete="email"></label>
      <label class="field"><span class="field__label">Phone</span><input class="input" data-f="phone" type="tel" value="${esc(state.phone)}" autocomplete="tel"></label>
      <label class="field"><span class="field__label">Preferred contact</span>
        <select class="input" data-f="contact">${["Email", "Phone call", "Text message"].map((c) => `<option ${c === state.contact ? "selected" : ""}>${c}</option>`).join("")}</select></label>
      <label class="field span-2"><span class="field__label">Message (optional)</span><textarea class="input" data-f="note" rows="3">${esc(state.note)}</textarea></label>
    </div>${err()}`;

  const step4 = () => {
    const p = D.byId[state.propertyId];
    return `<dl class="summary">
      <div><dt>Property</dt><dd>${p.name}</dd></div>
      <div><dt>Agent</dt><dd>${p.agency}</dd></div>
      <div><dt>Date</dt><dd>${dateLabel(state.date)}</dd></div>
      <div><dt>Time</dt><dd>${state.time}</dd></div>
      <div><dt>Location</dt><dd>${p.area}</dd></div>
      <div><dt>Contact</dt><dd>${esc(state.name)} · ${esc(state.contact)}</dd></div>
    </dl><p class="sched__note">The agent will confirm this time or suggest another. Estimates and availability shown are representative demos.</p>`;
  };

  const done = () => `<div class="sched__done">
      <svg class="icon icon--brand icon--circle" aria-hidden="true"><use href="#i-check"></use></svg>
      <h3 class="sched__property">${state.viewingId ? "Viewing rescheduled" : "Viewing requested"}</h3>
      <p class="lead">${D.byId[state.propertyId].name} on ${dateLabel(state.date)} at ${state.time}. You can follow it from your viewing plan.</p>
    </div>`;

  /* ---------- Flow ---------- */
  const render = () => {
    const back = dlg.querySelector("[data-sched-back]");
    const nextBtn = dlg.querySelector("[data-sched-next]");
    dlg.querySelector("[data-sched-kicker]").textContent = state.done
      ? "All set"
      : `Step ${state.step} of 4`;
    dlg.querySelector("#sched-title").textContent = state.viewingId
      ? "Reschedule viewing"
      : "Schedule a viewing";
    dlg
      .querySelectorAll(".steps-bar span")
      .forEach((s, i) =>
        s.classList.toggle("is-done", state.done || i < state.step),
      );
    const body = dlg.querySelector("[data-sched-body]");
    body.innerHTML = state.done
      ? done()
      : [step1, step2, step3, step4][state.step - 1]();
    back.hidden = state.step === 1 || state.done;
    nextBtn.textContent = state.done
      ? "Close"
      : state.step === 4
        ? state.viewingId
          ? "Confirm new time"
          : "Confirm request"
        : "Continue";
    (
      body.querySelector("input:checked") ||
      body.querySelector("input:not(:disabled), select")
    )?.focus({ preventScroll: true });
  };

  const next = () => {
    if (state.done) {
      dlg.close();
      return;
    }
    if (state.step === 1 && !state.date) {
      state.error = "Please choose a date.";
      render();
      return;
    }
    if (state.step === 2 && !state.time) {
      state.error = "Please choose a time.";
      render();
      return;
    }
    if (state.step === 3) {
      if (!state.name.trim()) {
        state.error = "Please enter your name.";
        render();
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(state.email.trim())) {
        state.error = "Please enter a valid email address.";
        render();
        return;
      }
    }
    if (state.step < 4) {
      state.error = "";
      state.step += 1;
      render();
      return;
    }

    const list = read();
    const fields = {
      propertyId: state.propertyId,
      date: state.date,
      time: state.time,
      name: state.name.trim(),
      email: state.email.trim(),
      phone: state.phone.trim(),
      contact: state.contact,
      note: state.note.trim(),
    };
    if (state.viewingId) {
      const v = list.find((x) => x.id === state.viewingId);
      if (v) Object.assign(v, fields, { status: "rescheduled" });
    } else {
      list.push({ id: `v-${Date.now()}`, ...fields, status: "requested" });
    }
    write(list);
    state.done = true;
    render();
    UI.toast(state.viewingId ? "Viewing rescheduled" : "Viewing requested");
  };

  const open = ({ propertyId, viewingId } = {}) => {
    ensureDialog();
    const existing = viewingId ? read().find((v) => v.id === viewingId) : null;
    state = {
      step: 1,
      done: false,
      error: "",
      fixed: !!propertyId,
      propertyId: propertyId || D.PROPERTIES[0].id,
      viewingId: viewingId || null,
      original: existing ? { date: existing.date, time: existing.time } : null,
      date: existing ? existing.date : "",
      time: existing ? existing.time : "",
      name: existing ? existing.name : DEFAULT_NAME,
      email: existing ? existing.email : "",
      phone: existing ? existing.phone : "",
      contact: existing ? existing.contact : "Email",
      note: existing ? existing.note : "",
    };
    render();
    dlg.showModal();
  };

  return { open, read, write, seed, parse, dateLabel, STATUS };
})();
