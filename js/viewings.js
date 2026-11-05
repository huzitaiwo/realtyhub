/* ==========================================================================
   REALTY — js/viewings.js
   Viewings list: filter by status · reschedule · cancel · book again
   ========================================================================== */
(() => {
  "use strict";

  const D = window.RealtyData;
  const UI = window.RealtyUI;
  const S = window.RealtyScheduler;
  const list = document.querySelector("[data-viewing-list]");
  if (!D || !UI || !S || !list) return;

  S.seed();

  const filterEl = document.querySelector("[data-viewing-filter]");
  const empty = document.querySelector("[data-viewing-empty]");
  const count = document.querySelector("[data-viewing-count]");
  const note = document.querySelector(".compare-note");
  const ic = (n) =>
    `<svg class="icon icon--sm" aria-hidden="true"><use href="#i-${n}"></use></svg>`;

  const render = () => {
    const status = filterEl.querySelector("input:checked").value;
    const all = S.read().filter((v) => D.byId[v.propertyId]);
    const items = all
      .filter((v) => status === "all" || v.status === status)
      .sort((a, b) =>
        `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
      );

    const n = items.length;
    count.textContent = `${n} ${n === 1 ? "viewing" : "viewings"}`;
    empty.hidden = n > 0;
    note.hidden = all.length === 0;

    list.innerHTML = items
      .map((v) => {
        const p = D.byId[v.propertyId];
        const d = S.parse(v.date);
        const active = ["requested", "confirmed", "rescheduled"].includes(
          v.status,
        );
        return `
      <li class="entry entry--viewing" data-viewing-id="${v.id}" data-property-id="${p.id}">
        <div class="entry__date" aria-hidden="true">
          <small>${d.toLocaleDateString("en-GB", { weekday: "short" })}</small>
          <strong>${d.getDate()}</strong>
          <small>${d.toLocaleDateString("en-GB", { month: "short" })}</small>
        </div>
        <div class="entry__main">
          <img class="entry__thumb" src="${p.image}" alt="" loading="lazy" decoding="async">
          <div>
            <h2 class="entry__title"><a href="${D.href(p)}">${p.name}</a></h2>
            <p class="entry__sub">${p.area} · ${p.agency}</p>
            <p class="entry__meta">
              ${ic("clock")}<span><span class="visually-hidden">${S.dateLabel(v.date)}, </span>${v.time}</span>
              <span class="status status--${v.status}">${S.STATUS[v.status]}</span>
            </p>
          </div>
        </div>
        <div class="entry__actions">
          ${
            active
              ? `
            <button class="text-btn" type="button" data-reschedule="${v.id}">${ic("calendar")}Reschedule</button>
            <button class="text-btn text-btn--danger" type="button" data-cancel="${v.id}">Cancel</button>`
              : `<button class="btn btn--outline btn--sm" type="button" data-again="${p.id}">Book again</button>`
          }
        </div>
      </li>`;
      })
      .join("");

    flashFromHash();
  };

  /* Deep link from the overview: viewings.html#olive-court */
  let flashed = false;
  const flashFromHash = () => {
    if (flashed || !location.hash) return;
    const id = decodeURIComponent(location.hash.slice(1));
    const row = list.querySelector(`[data-property-id="${CSS.escape(id)}"]`);
    if (!row) return;
    flashed = true;
    row.scrollIntoView({ block: "center", behavior: "smooth" });
    row.classList.add("is-flash");
    setTimeout(() => row.classList.remove("is-flash"), 2200);
  };

  filterEl.addEventListener("change", render);
  document.addEventListener("realty:viewings", render);

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-schedule]")) {
      S.open({});
      return;
    }

    const again = e.target.closest("[data-again]");
    if (again) {
      S.open({ propertyId: again.dataset.again });
      return;
    }

    const re = e.target.closest("[data-reschedule]");
    if (re) {
      const v = S.read().find((x) => x.id === re.dataset.reschedule);
      if (v) S.open({ propertyId: v.propertyId, viewingId: v.id });
      return;
    }

    const cancel = e.target.closest("[data-cancel]");
    if (cancel) {
      const v = S.read().find((x) => x.id === cancel.dataset.cancel);
      if (!v) return;
      UI.confirm({
        title: "Cancel this viewing?",
        text: `Your viewing of ${D.byId[v.propertyId].name} on ${S.dateLabel(v.date)} at ${v.time} will be cancelled.`,
        confirmLabel: "Cancel viewing",
        danger: true,
      }).then((yes) => {
        if (!yes) return;
        const all = S.read();
        const target = all.find((x) => x.id === v.id);
        target.status = "cancelled";
        S.write(all);
        UI.toast("Viewing cancelled");
      });
    }
  });

  render();
})();
