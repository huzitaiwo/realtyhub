/* ==========================================================================
   REALTY — js/agent.js
   Agent Desk: stats · leads · viewing requests · activity · analytics.
   Reads "realty:custom-listings", "realty:leads", "realty:viewings".
   ========================================================================== */
(() => {
  "use strict";

  const D = window.RealtyData;
  const UI = window.RealtyUI;
  const S = window.RealtyScheduler;
  const root = document.querySelector("[data-agent]");
  if (!D || !UI || !S || !root) return;

  S.seed();

  const LKEY = "realty:leads";
  const ago = (m) => new Date(Date.now() - m * 60000).toISOString();
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
  const two = (n) => String(n).padStart(2, "0");
  const rel = (iso) => {
    const m = Math.max(1, Math.round((Date.now() - new Date(iso)) / 60000));
    if (m < 60) return `${m} min ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h} hr ago`;
    const d = Math.round(h / 24);
    return d < 7
      ? `${d} ${d === 1 ? "day" : "days"} ago`
      : new Date(iso).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        });
  };
  const set = (sel, text) => {
    const el = root.querySelector(sel);
    if (el) el.textContent = text;
  };

  /* ---------- Greeting ---------- */
  const greeting = root.querySelector("[data-greeting]");
  if (greeting) {
    const h = new Date().getHours();
    const name =
      (UI.getObject("realty:profile", {}).name || "").trim() || "Handsome";
    greeting.textContent = `${h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"}, ${name}.`;
  }

  /* ---------- Listings (same source as properties.html) ---------- */
  const VIEWS = {
    "bracken-house": 320,
    "olive-court": 410,
    "linden-house": 340,
    "seawall-terrace": 120,
  };
  const stored = UI.read("realty:custom-listings");
  const listings = (
    stored.length
      ? stored
      : D.PROPERTIES.filter((p) => p.agency === "Aster & Field").map((p) => ({
          ...p,
          listingStatus: "active",
          views: VIEWS[p.id] || 100,
          updatedAt: ago(180),
        }))
  ).filter((l) => D.byId[l.id]);
  const mine = new Set(listings.map((l) => l.id));

  /* ---------- Leads (seed on first visit) ---------- */
  try {
    if (localStorage.getItem(LKEY) === null) {
      UI.write(LKEY, [
        {
          id: "l-1",
          propertyId: "bracken-house",
          contact: "Email",
          message: "Is the garden private, and is parking included?",
          at: ago(35),
          status: "new",
        },
        {
          id: "l-2",
          propertyId: "olive-court",
          contact: "Phone call",
          message: "Could I view this on Saturday morning?",
          at: ago(60 * 4),
          status: "new",
        },
        {
          id: "l-3",
          propertyId: "linden-house",
          contact: "Email",
          message: "Are pets welcome in this home?",
          at: ago(60 * 20),
          status: "contacted",
        },
        {
          id: "l-4",
          propertyId: "seawall-terrace",
          contact: "Text message",
          message: "Is this still available from next month?",
          at: ago(60 * 30),
          status: "viewing",
        },
        {
          id: "l-5",
          propertyId: "bracken-house",
          contact: "Email",
          message: "Could you share a floor plan?",
          at: ago(60 * 50),
          status: "closed",
        },
      ]);
    }
  } catch {
    /* storage unavailable */
  }

  const LEAD_STATUS = [
    ["new", "New", "requested"],
    ["contacted", "Contacted", "rescheduled"],
    ["viewing", "Viewing booked", "confirmed"],
    ["closed", "Closed", "completed"],
  ];
  const leads = () =>
    UI.read(LKEY)
      .filter((l) => D.byId[l.propertyId])
      .sort((a, b) => b.at.localeCompare(a.at));
  const labelOf = (l, i) =>
    `Prospect #${1040 + (Number(String(l.id).replace(/\D/g, "")) || i)}`;

  /* ---------- Stats ---------- */
  const renderStats = () => {
    const all = leads();
    const views = listings.reduce((s, l) => s + (l.views || 0), 0);
    const toConfirm = S.read().filter(
      (v) =>
        mine.has(v.propertyId) &&
        ["requested", "rescheduled"].includes(v.status),
    ).length;
    const fresh = all.filter((l) => l.status === "new").length;
    set(
      '[data-stat="active"]',
      two(listings.filter((l) => l.listingStatus === "active").length),
    );
    set('[data-stat="leads"]', two(fresh));
    set(
      '[data-stat-note="leads"]',
      fresh ? "Awaiting a reply" : "All answered",
    );
    set('[data-stat="viewings"]', two(toConfirm));
    set(
      '[data-stat-note="viewings"]',
      toConfirm ? "Needs your answer" : "Nothing waiting",
    );
    set(
      '[data-stat="rate"]',
      views ? `${((all.length / views) * 100).toFixed(1)}%` : "0%",
    );
  };

  /* ---------- Leads ---------- */
  const leadList = root.querySelector("[data-lead-list]");
  const leadEmpty = root.querySelector("[data-lead-empty]");

  const renderLeads = () => {
    const all = leads();
    leadEmpty.hidden = all.length > 0;
    leadList.innerHTML = all
      .map((l, i) => {
        const p = D.byId[l.propertyId];
        const st = LEAD_STATUS.find((s) => s[0] === l.status) || LEAD_STATUS[0];
        return `
      <li class="lead" data-id="${l.id}">
        <span class="lead__avatar" aria-hidden="true">P</span>
        <div class="lead__body">
          <p class="lead__top"><strong>${labelOf(l, i)}</strong><span class="status status--${st[2]}">${st[1]}</span></p>
          <p class="lead__prop"><a href="${D.href(p)}">${esc(p.name)}</a> · ${esc(l.contact)} · ${rel(l.at)}</p>
          <p class="lead__msg">“${esc(l.message)}”</p>
        </div>
        <div class="lead__actions">
          <label class="visually-hidden" for="ls-${l.id}">Status for ${labelOf(l, i)}</label>
          <select class="input input--sm" id="ls-${l.id}" data-lead-status="${l.id}">
            ${LEAD_STATUS.map(([v, t]) => `<option value="${v}" ${v === l.status ? "selected" : ""}>${t}</option>`).join("")}
          </select>
        </div>
      </li>`;
      })
      .join("");
  };

  leadList.addEventListener("change", (e) => {
    const sel = e.target.closest("[data-lead-status]");
    if (!sel) return;
    const all = UI.read(LKEY);
    const l = all.find((x) => x.id === sel.dataset.leadStatus);
    if (!l) return;
    l.status = sel.value;
    UI.write(LKEY, all);
    UI.toast("Lead updated");
    renderAll();
  });

  /* ---------- Viewing requests ---------- */
  const viewList = root.querySelector("[data-viewing-list]");
  const viewEmpty = root.querySelector("[data-viewing-empty]");

  const renderViewings = () => {
    const items = S.read()
      .filter((v) => mine.has(v.propertyId) && D.byId[v.propertyId])
      .sort((a, b) =>
        `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
      );
    viewEmpty.hidden = items.length > 0;
    viewList.innerHTML = items
      .map((v) => {
        const p = D.byId[v.propertyId];
        const pending = ["requested", "rescheduled"].includes(v.status);
        return `
      <li class="agent-viewing" data-id="${v.id}">
        <div class="agent-viewing__info">
          <strong>${esc(p.name)}</strong>
          <span>${S.dateLabel(v.date)} · ${v.time}</span>
          <span class="status status--${v.status}">${S.STATUS[v.status]}</span>
        </div>
        <div class="agent-viewing__actions">
          ${
            pending
              ? `<button class="btn btn--dark btn--sm" type="button" data-v-confirm="${v.id}">Confirm</button>
            <button class="text-btn text-btn--danger" type="button" data-v-decline="${v.id}">Decline</button>`
              : ""
          }
          ${v.status === "confirmed" ? `<button class="btn btn--outline btn--sm" type="button" data-v-complete="${v.id}">Mark completed</button>` : ""}
        </div>
      </li>`;
      })
      .join("");
  };

  const setViewing = (id, status, message) => {
    const all = S.read();
    const v = all.find((x) => x.id === id);
    if (!v) return;
    v.status = status;
    S.write(all);
    UI.toast(message);
    renderAll();
  };

  viewList.addEventListener("click", (e) => {
    const c = e.target.closest("[data-v-confirm]");
    const d = e.target.closest("[data-v-decline]");
    const m = e.target.closest("[data-v-complete]");
    if (c) setViewing(c.dataset.vConfirm, "confirmed", "Viewing confirmed");
    if (m)
      setViewing(
        m.dataset.vComplete,
        "completed",
        "Viewing marked as completed",
      );
    if (d) {
      UI.confirm({
        title: "Decline this viewing?",
        text: "The visitor will see the request as cancelled.",
        confirmLabel: "Decline",
        danger: true,
      }).then((yes) => {
        if (yes)
          setViewing(d.dataset.vDecline, "cancelled", "Viewing declined");
      });
    }
  });

  /* ---------- Activity feed ---------- */
  const renderFeed = () => {
    const events = [
      ...leads().map((l) => ({
        at: l.at,
        title: "New enquiry",
        text: `${D.byId[l.propertyId].name}: “${l.message}”`,
      })),
      ...listings
        .filter((l) => l.updatedAt)
        .map((l) => ({
          at: l.updatedAt,
          title: "Listing updated",
          text: `${l.name} is ${l.listingStatus === "active" ? "live" : l.listingStatus.replace("-", " ")}.`,
        })),
    ]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 5);
    root.querySelector("[data-feed]").innerHTML =
      events
        .map(
          (ev) => `
      <li class="signal">
        <span class="bullet-mark" aria-hidden="true"></span>
        <p class="signal__title">${esc(ev.title)}</p>
        <time class="signal__time" datetime="${ev.at}">${rel(ev.at)}</time>
        <p class="signal__text">${esc(ev.text)}</p>
      </li>`,
        )
        .join("") || '<li class="panel__empty">Nothing has happened yet.</li>';
  };

  /* ---------- Top listings ---------- */
  const leadsFor = (id) => leads().filter((l) => l.propertyId === id).length;
  const renderTop = () => {
    const ranked = [...listings]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 4);
    root.querySelector("[data-top-list]").innerHTML =
      ranked
        .map(
          (l, i) => `
      <li>
        <a class="top-row" href="${D.href(l)}">
          <span class="top-row__rank">${two(i + 1)}</span>
          ${l.image ? `<img src="${l.image}" alt="" loading="lazy" decoding="async">` : '<span class="top-row__noimg"></span>'}
          <span class="top-row__info"><strong>${esc(l.name)}</strong><span>${(l.views || 0).toLocaleString("en-US")} views · ${leadsFor(l.id)} leads</span></span>
        </a>
      </li>`,
        )
        .join("") || '<li class="panel__empty">No listings yet.</li>';
  };

  /* ---------- Analytics ---------- */
  const rand = (n) => {
    const x = Math.sin(n * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  };
  const totalViews = () => listings.reduce((s, l) => s + (l.views || 0), 0);

  const renderChart = () => {
    const days = Number(root.querySelector("[data-range] input:checked").value);
    const avg = totalViews() / 30;
    const data = Array.from({ length: days }, (_, i) =>
      Math.max(0, Math.round(avg * (0.55 + 0.9 * rand(i + 3)))),
    );
    const labels = data.map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      return d;
    });
    const fmt = (d) =>
      d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const max = Math.max(...data, 1);
    const W = 640;
    const H = 220;
    const padB = 24;
    const gap = days > 20 ? 3 : 6;
    const bw = (W - gap * (days - 1)) / days;

    const bars = data
      .map((v, i) => {
        const h = Math.max(2, (v / max) * (H - padB - 10));
        const x = i * (bw + gap);
        return `<rect class="chart__bar${i === days - 1 ? " is-last" : ""}" x="${x.toFixed(1)}" y="${(H - padB - h).toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}"><title>${fmt(labels[i])}: ${v} views</title></rect>`;
      })
      .join("");
    const grid = [0.25, 0.5, 0.75, 1]
      .map(
        (f) =>
          `<line class="chart__grid" x1="0" x2="${W}" y1="${(H - padB - f * (H - padB - 10)).toFixed(1)}" y2="${(H - padB - f * (H - padB - 10)).toFixed(1)}"/>`,
      )
      .join("");
    const ticks = [0, Math.floor((days - 1) / 2), days - 1]
      .map(
        (i, k) =>
          `<text class="chart__tick" x="${k === 0 ? 0 : k === 2 ? W : (i * (bw + gap) + bw / 2).toFixed(1)}" y="${H - 6}" text-anchor="${k === 0 ? "start" : k === 2 ? "end" : "middle"}">${fmt(labels[i])}</text>`,
      )
      .join("");

    const sum = data.reduce((a, b) => a + b, 0);
    const best = data.indexOf(Math.max(...data));
    const chart = root.querySelector("[data-chart]");
    chart.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Bar chart of daily views over the last ${days} days. Total ${sum} views." preserveAspectRatio="none">${grid}${bars}${ticks}</svg>`;

    const periodLeads = Math.round(
      leads().length * (days / 30) + (days >= 14 ? 1 : 0),
    );
    root.querySelector("[data-chart-stats]").innerHTML = `
      <div><dt>Views</dt><dd>${sum.toLocaleString("en-US")}</dd></div>
      <div><dt>Busiest day</dt><dd>${fmt(labels[best])}</dd></div>
      <div><dt>Leads in period</dt><dd>${Math.min(periodLeads, leads().length)}</dd></div>`;
  };

  const renderPerf = () => {
    root.querySelector("[data-perf] tbody").innerHTML = [...listings]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .map((l) => {
        const n = leadsFor(l.id);
        const rate = l.views ? ((n / l.views) * 100).toFixed(1) : "0.0";
        return `<tr>
        <th scope="row"><div class="cell-home">${l.image ? `<img src="${l.image}" alt="" loading="lazy" decoding="async">` : '<span class="cell-home__empty" aria-hidden="true"></span>'}
          <div><a href="${D.href(l)}">${esc(l.name)}</a><span>${esc(l.area)}</span></div></div></th>
        <td>${esc(l.status || "")}</td>
        <td class="num">${(l.views || 0).toLocaleString("en-US")}</td>
        <td class="num">${n}</td>
        <td class="num">${rate}%</td>
      </tr>`;
      })
      .join("");
  };

  root.querySelector("[data-range]").addEventListener("change", renderChart);
  document.addEventListener("realty:viewings", renderAll);

  function renderAll() {
    renderStats();
    renderLeads();
    renderViewings();
    renderFeed();
    renderTop();
    renderChart();
    renderPerf();
  }
  renderAll();
})();
