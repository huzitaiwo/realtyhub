/* ==========================================================================
   REALTY — js/notifications.js
   Notifications: new match · price reduced · status changed ·
   viewing reminder · agent response. Read / unread state in localStorage.
   ========================================================================== */
(() => {
  "use strict";

  const UI = window.RealtyUI;
  const list = document.querySelector("[data-notice-list]");
  if (!UI || !list) return;

  const KEY = "realty:notifications";
  const filterEl = document.querySelector("[data-notice-filter]");
  const empty = document.querySelector("[data-notice-empty]");
  const count = document.querySelector("[data-notice-count]");
  const readAll = document.querySelector("[data-read-all]");
  const ago = (minutes) => new Date(Date.now() - minutes * 60000).toISOString();

  const ICON = {
    match: "search",
    price: "dollar",
    status: "home",
    viewing: "calendar",
    agent: "message",
  };

  /* ---------- Seed (first visit only) ---------- */
  try {
    if (localStorage.getItem(KEY) === null) {
      UI.write(KEY, [
        {
          id: "n-1",
          type: "match",
          title: "New matching property",
          text: "Bracken House matches your saved search “Richmond family homes”.",
          href: "property.html?id=bracken-house",
          at: ago(20),
          read: false,
        },
        {
          id: "n-2",
          type: "price",
          title: "Price reduced",
          text: "Olive Court is now shown at $875,000 in this demo collection.",
          href: "property.html?id=olive-court",
          at: ago(60 * 2),
          read: false,
        },
        {
          id: "n-3",
          type: "agent",
          title: "Agent response",
          text: "Form & Found replied about Marlowe Townhouse.",
          href: "messages.html?property=marlowe-townhouse",
          at: ago(60 * 5),
          read: false,
        },
        {
          id: "n-4",
          type: "viewing",
          title: "Viewing reminder",
          text: "Your viewing of Olive Court is coming up on Thursday at 14:30.",
          href: "viewings.html#olive-court",
          at: ago(60 * 26),
          read: true,
        },
        {
          id: "n-5",
          type: "status",
          title: "Property status changed",
          text: "The Canton Apartment is now marked as a verified listing.",
          href: "property.html?id=the-canton-apartment",
          at: ago(60 * 24 * 3),
          read: true,
        },
      ]);
    }
  } catch {
    /* storage unavailable */
  }

  /* ---------- Helpers ---------- */
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
  const rel = (iso) => {
    const m = Math.max(1, Math.round((Date.now() - new Date(iso)) / 60000));
    if (m < 60) return `${m} min ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h} hr ago`;
    const d = Math.round(h / 24);
    if (d < 7) return `${d} ${d === 1 ? "day" : "days"} ago`;
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  };

  const render = () => {
    const all = UI.read(KEY).sort((a, b) => b.at.localeCompare(a.at));
    const unread = all.filter((n) => !n.read).length;
    const showUnread =
      filterEl.querySelector("input:checked").value === "unread";
    const items = showUnread ? all.filter((n) => !n.read) : all;

    count.textContent = `${unread} unread · ${all.length} total`;
    readAll.disabled = unread === 0;
    empty.hidden = items.length > 0;

    list.innerHTML = items
      .map(
        (n) => `
      <li class="notice${n.read ? "" : " is-unread"}" data-id="${n.id}">
        <span class="notice__icon" aria-hidden="true"><svg class="icon"><use href="#i-${ICON[n.type] || "bell"}"></use></svg></span>
        <div class="notice__body">
          <p class="notice__title">${n.read ? "" : '<span class="visually-hidden">Unread: </span>'}${esc(n.title)}</p>
          <p class="notice__text">${esc(n.text)}</p>
          <p class="notice__actions">
            <a class="link-arrow" href="${n.href}" data-open="${n.id}">View</a>
            ${n.read ? "" : `<button class="text-btn" type="button" data-read="${n.id}">Mark as read</button>`}
          </p>
        </div>
        <time class="notice__time" datetime="${n.at}">${rel(n.at)}</time>
      </li>`,
      )
      .join("");
  };

  const markRead = (ids) => {
    const all = UI.read(KEY);
    all.forEach((n) => {
      if (ids === "all" || ids.includes(n.id)) n.read = true;
    });
    UI.write(KEY, all);
  };

  /* ---------- Events ---------- */
  filterEl.addEventListener("change", render);

  readAll.addEventListener("click", () => {
    markRead("all");
    render();
    UI.toast("All notifications marked as read");
  });

  list.addEventListener("click", (e) => {
    const read = e.target.closest("[data-read]");
    if (read) {
      markRead([read.dataset.read]);
      render();
      return;
    }
    const open = e.target.closest("[data-open]");
    if (open)
      markRead([open.dataset.open]); /* mark as read, then follow the link */
  });

  render();
})();
