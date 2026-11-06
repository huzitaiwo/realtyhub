/* ==========================================================================
   REALTY — js/messages.js
   Inbox: conversations with agencies per property (localStorage).
   Deep link: messages.html?property=olive-court opens or starts a thread.
   ========================================================================== */
(() => {
  "use strict";

  const D = window.RealtyData;
  const UI = window.RealtyUI;
  const root = document.querySelector("[data-inbox]");
  if (!D || !UI || !root) return;

  const KEY = "realty:messages";
  const listEl = root.querySelector("[data-thread-list]");
  const viewEl = root.querySelector("[data-thread-view]");
  const wide = window.matchMedia("(min-width: 56.3125em)");
  const ago = (minutes) => new Date(Date.now() - minutes * 60000).toISOString();

  /* ---------- Seed (first visit only) ---------- */
  try {
    if (localStorage.getItem(KEY) === null) {
      UI.write(KEY, [
        {
          id: "t-1",
          propertyId: "olive-court",
          unread: 0,
          messages: [
            {
              from: "agent",
              text: "Your viewing on Thursday at 14:30 is confirmed. Let us know if you would like to bring anyone along.",
              at: ago(60 * 30),
            },
            {
              from: "me",
              text: "Thank you. I will come on my own.",
              at: ago(60 * 29),
            },
          ],
        },
        {
          id: "t-2",
          propertyId: "marlowe-townhouse",
          unread: 1,
          messages: [
            {
              from: "agent",
              text: "Thank you for your viewing request. Please choose a preferred time from our schedule and we will confirm it.",
              at: ago(60 * 5),
            },
          ],
        },
        {
          id: "t-3",
          propertyId: "bracken-house",
          unread: 0,
          messages: [
            {
              from: "agent",
              text: "Welcome to REALTY. This home is new to the platform. Ask us for a floor plan or a viewing at any time.",
              at: ago(60 * 50),
            },
          ],
        },
      ]);
    }
  } catch {
    /* storage unavailable */
  }

  /* ---------- Helpers ---------- */
  let threads = UI.read(KEY);
  let activeId = null;

  const save = () => UI.write(KEY, threads);
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
  const last = (t) => t.messages[t.messages.length - 1];
  const stamp = (t) => (last(t) ? last(t).at : "0");
  const fmt = (iso) => {
    const d = new Date(iso);
    return d.toDateString() === new Date().toDateString()
      ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };
  const ic = (n) =>
    `<svg class="icon" aria-hidden="true"><use href="#i-${n}"></use></svg>`;
  const sorted = () =>
    threads
      .filter((t) => D.byId[t.propertyId])
      .sort((a, b) => stamp(b).localeCompare(stamp(a)));

  const bubble = (m) => `
    <div class="msg msg--${m.from === "me" ? "me" : "agent"}">
      <p>${esc(m.text)}</p>
      <time datetime="${m.at}">${fmt(m.at)}</time>
    </div>`;

  /* ---------- Render ---------- */
  const renderList = () => {
    const items = sorted();
    listEl.innerHTML = items.length
      ? items
          .map((t) => {
            const p = D.byId[t.propertyId];
            const m = last(t);
            return `
      <li>
        <button class="thread" type="button" data-thread="${t.id}" aria-current="${t.id === activeId ? "true" : "false"}">
          <img class="thread__thumb" src="${p.image}" alt="" loading="lazy" decoding="async">
          <span class="thread__info">
            <strong>${p.name}</strong>
            <span class="thread__agency">${p.agency}</span>
            <span class="thread__snippet">${m ? esc(m.text) : "No messages yet"}</span>
          </span>
          <span class="thread__meta">
            <time>${m ? fmt(m.at) : ""}</time>
            ${t.unread ? `<span class="thread__badge" aria-label="${t.unread} unread">${t.unread}</span>` : ""}
          </span>
        </button>
      </li>`;
          })
          .join("")
      : '<li class="inbox__none">No conversations yet. Contact an agent from any home.</li>';
  };

  const renderView = () => {
    const t = threads.find((x) => x.id === activeId);
    if (!t) {
      viewEl.innerHTML =
        '<div class="thread-empty"><p>Select a conversation to read it.</p></div>';
      return;
    }
    const p = D.byId[t.propertyId];
    viewEl.innerHTML = `
      <header class="thread-head">
        <button class="icon-btn thread-head__back" type="button" data-back aria-label="Back to conversations">${ic("arrow-left")}</button>
        <img class="thread-head__thumb" src="${p.image}" alt="">
        <div class="thread-head__info"><h2>${p.name}</h2><p>${p.agency} · ${p.area}</p></div>
        <a class="link-arrow" href="${D.href(p)}">View home</a>
      </header>
      <div class="thread-log" role="log" aria-live="polite" aria-label="Messages" data-log tabindex="0">
        ${t.messages.length ? t.messages.map(bubble).join("") : `<p class="thread-log__empty">Start the conversation with ${p.agency} about ${p.name}.</p>`}
      </div>
      <form class="composer" data-composer>
        <label class="visually-hidden" for="msg-input">Write a message</label>
        <textarea class="input composer__input" id="msg-input" rows="1" maxlength="1000" placeholder="Write a message…"></textarea>
        <button class="btn btn--dark btn--sm" type="submit">Send ${ic("send")}</button>
      </form>`;
    const log = viewEl.querySelector("[data-log]");
    log.scrollTop = log.scrollHeight;
  };

  const openThread = (id, { focus = false } = {}) => {
    activeId = id;
    const t = threads.find((x) => x.id === id);
    if (t && t.unread) {
      t.unread = 0;
      save();
    }
    renderList();
    renderView();
    root.dataset.pane = "thread";
    if (focus)
      viewEl.querySelector("#msg-input")?.focus({ preventScroll: true });
  };

  /* ---------- Events ---------- */
  listEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-thread]");
    if (btn) openThread(btn.dataset.thread);
  });

  viewEl.addEventListener("click", (e) => {
    if (e.target.closest("[data-back]")) {
      root.dataset.pane = "list";
      activeId = null;
      renderList();
      renderView();
    }
  });

  viewEl.addEventListener("input", (e) => {
    const ta = e.target.closest(".composer__input");
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`;
  });

  viewEl.addEventListener("keydown", (e) => {
    const ta = e.target.closest(".composer__input");
    if (ta && e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      ta.form.requestSubmit();
    }
  });

  viewEl.addEventListener("submit", (e) => {
    const form = e.target.closest("[data-composer]");
    if (!form) return;
    e.preventDefault();
    const ta = form.elements[0] && form.querySelector(".composer__input");
    const text = ta.value.trim();
    if (!text) return;
    const t = threads.find((x) => x.id === activeId);
    t.messages.push({ from: "me", text, at: new Date().toISOString() });
    save();
    renderList();
    const log = viewEl.querySelector("[data-log]");
    log.querySelector(".thread-log__empty")?.remove();
    log.insertAdjacentHTML("beforeend", bubble(last(t)));
    log.scrollTop = log.scrollHeight;
    ta.value = "";
    ta.style.height = "auto";
    ta.focus();
  });

  /* ---------- Init ---------- */
  const requested = new URLSearchParams(location.search).get("property");
  if (requested && D.byId[requested]) {
    let t = threads.find((x) => x.propertyId === requested);
    if (!t) {
      t = {
        id: `t-${Date.now()}`,
        propertyId: requested,
        unread: 0,
        messages: [],
      };
      threads.push(t);
      save();
    }
    openThread(t.id, { focus: true });
  } else if (wide.matches && sorted().length) {
    openThread(sorted()[0].id);
  } else {
    renderList();
    renderView();
  }
})();
