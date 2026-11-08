/* ==========================================================================
   REALTY — js/agency.js
   Agency Desk: team (invite / role / remove) · listing assignment ·
   agency branding with live preview · verification (concept) · settings.
   Storage: realty:agency, realty:team, realty:assignments (+ reads listings).
   ========================================================================== */
(() => {
  "use strict";

  const D = window.RealtyData;
  const UI = window.RealtyUI;
  const root = document.querySelector("[data-agency]");
  if (!D || !UI || !root) return;

  const AK = "realty:agency";
  const TK = "realty:team";
  const LK = "realty:assignments";

  const profile = UI.getObject("realty:profile", {});
  const OWNER = (profile.name || "").trim() || "Handsome";
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
  const ic = (n) =>
    `<svg class="icon icon--sm" aria-hidden="true"><use href="#i-${n}"></use></svg>`;
  const $ = (sel) => root.querySelector(sel);
  const set = (sel, text) => {
    const el = $(sel);
    if (el) el.textContent = text;
  };

  const COLORS = [
    ["#d9792c", "Terracotta"],
    ["#1d302b", "Forest"],
    ["#6b7a4a", "Olive"],
    ["#8a8070", "Stone"],
    ["#a8553a", "Clay"],
  ];
  const DEFAULTS = {
    name: "Aster & Field",
    tagline: "",
    about: "",
    location: "London & surrounding",
    email: "",
    phone: "",
    color: COLORS[0][0],
    logo: "",
    verification: "unverified",
    routing: "owner",
    notifyLeads: true,
  };

  /* ---------- State ---------- */
  let agency = { ...DEFAULTS, ...UI.getObject(AK, {}) };
  let team = UI.read(TK);
  if (!team.length) {
    team = [
      {
        id: "m-owner",
        name: OWNER,
        email: profile.email || "",
        role: "Owner",
        status: "active",
      },
    ];
    UI.write(TK, team);
  }
  team[0].name = team[0].role === "Owner" ? OWNER : team[0].name;
  let assignments = UI.getObject(LK, {});
  let logo = agency.logo;

  const saveAgency = () => {
    try {
      localStorage.setItem(AK, JSON.stringify(agency));
      return true;
    } catch {
      return false;
    }
  };
  const saveTeam = () => UI.write(TK, team);
  const saveAssignments = () => UI.setObject(LK, assignments);

  /* ---------- Listings (same source as the Agent Desk) ---------- */
  const VIEWS = {
    "bracken-house": 320,
    "olive-court": 410,
    "linden-house": 340,
    "seawall-terrace": 120,
  };
  const storedListings = UI.read("realty:custom-listings");
  const listings = (
    storedListings.length
      ? storedListings
      : D.PROPERTIES.filter((p) => p.agency === "Aster & Field").map((p) => ({
          ...p,
          listingStatus: "active",
          views: VIEWS[p.id] || 100,
        }))
  ).filter((l) => D.byId[l.id]);
  const leadsFor = (id) =>
    UI.read("realty:leads").filter((l) => l.propertyId === id).length;
  const STATUS = {
    draft: "Draft",
    active: "Active",
    "under-offer": "Under offer",
    closed: "Sold / let",
  };

  /* ---------- Stats ---------- */
  const renderStats = () => {
    set('[data-stat="team"]', two(team.length));
    set(
      '[data-stat-note="team"]',
      team.some((m) => m.status === "invited")
        ? "Some invites pending"
        : "Including you",
    );
    set(
      '[data-stat="active"]',
      two(listings.filter((l) => l.listingStatus === "active").length),
    );
    set('[data-stat="leads"]', two(UI.read("realty:leads").length));
    set(
      '[data-stat="views"]',
      listings.reduce((s, l) => s + (l.views || 0), 0).toLocaleString("en-US"),
    );
  };

  /* ---------- Team ---------- */
  const assignedCount = (id) =>
    Object.values(assignments).filter((v) => v === id).length;

  const renderTeam = () => {
    $("[data-team-body]").innerHTML = team
      .map((m) => {
        const owner = m.role === "Owner";
        return `
      <tr data-id="${m.id}">
        <th scope="row">
          <div class="member">
            <span class="member__avatar" aria-hidden="true">${esc(m.name.charAt(0).toUpperCase())}</span>
            <div><strong>${esc(m.name)}</strong><span>${m.email ? esc(m.email) : "No email added"}</span></div>
          </div>
        </th>
        <td>${
          owner
            ? "Owner"
            : `
          <label class="visually-hidden" for="role-${m.id}">Role for ${esc(m.name)}</label>
          <select class="input input--sm" id="role-${m.id}" data-role="${m.id}">
            ${["Admin", "Agent"].map((r) => `<option ${r === m.role ? "selected" : ""}>${r}</option>`).join("")}
          </select>`
        }</td>
        <td><span class="status status--${m.status === "active" ? "confirmed" : "requested"}">${m.status === "active" ? "Active" : "Invited"}</span></td>
        <td class="num">${assignedCount(m.id)}</td>
        <td class="row-actions">
          ${
            owner
              ? ""
              : `
            ${m.status === "invited" ? `<button class="text-btn" type="button" data-resend="${m.id}">${ic("send")}Resend</button>` : ""}
            <button class="text-btn text-btn--danger" type="button" data-remove="${m.id}">${ic("trash")}Remove</button>`
          }
        </td>
      </tr>`;
      })
      .join("");
  };

  $("[data-team-body]").addEventListener("change", (e) => {
    const sel = e.target.closest("[data-role]");
    if (!sel) return;
    team.find((m) => m.id === sel.dataset.role).role = sel.value;
    saveTeam();
    UI.toast("Role updated");
  });

  $("[data-team-body]").addEventListener("click", (e) => {
    const resend = e.target.closest("[data-resend]");
    if (resend) {
      UI.toast("Invitation resent (concept)");
      return;
    }
    const rm = e.target.closest("[data-remove]");
    if (!rm) return;
    const member = team.find((m) => m.id === rm.dataset.remove);
    UI.confirm({
      title: `Remove ${esc(member.name)}?`,
      text: "Their listings will become unassigned. This cannot be undone.",
      confirmLabel: "Remove",
      danger: true,
    }).then((yes) => {
      if (!yes) return;
      team = team.filter((m) => m.id !== member.id);
      Object.keys(assignments).forEach((k) => {
        if (assignments[k] === member.id) delete assignments[k];
      });
      saveTeam();
      saveAssignments();
      renderAll();
      UI.toast("Team member removed");
    });
  });

  /* ---------- Invite dialog ---------- */
  const dlg = document.createElement("dialog");
  dlg.className = "dialog";
  dlg.setAttribute("aria-labelledby", "inv-title");
  dlg.innerHTML = `
    <form data-inv novalidate>
      <header class="dialog__head">
        <div><p class="eyebrow">Team</p><h2 class="dialog__title" id="inv-title">Invite an agent</h2></div>
        <button class="icon-btn" type="button" data-inv-close aria-label="Close"><svg class="icon" aria-hidden="true"><use href="#i-close"></use></svg></button>
      </header>
      <div class="dialog__body">
        <div class="form-grid">
          <label class="field span-2"><span class="field__label">Full name</span><input class="input" name="name" type="text" autocomplete="off"></label>
          <label class="field"><span class="field__label">Email</span><input class="input" name="email" type="email" autocomplete="off"></label>
          <label class="field"><span class="field__label">Role</span>
            <select class="input" name="role"><option>Agent</option><option>Admin</option></select></label>
        </div>
        <p class="field__error" data-inv-error role="alert"></p>
      </div>
      <footer class="dialog__foot dialog__foot--end">
        <button class="btn btn--outline btn--sm" type="button" data-inv-close>Cancel</button>
        <button class="btn btn--dark btn--sm" type="submit">Send invitation</button>
      </footer>
    </form>`;
  document.body.append(dlg);

  const invForm = dlg.querySelector("[data-inv]");
  const invError = dlg.querySelector("[data-inv-error]");
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg || e.target.closest("[data-inv-close]")) dlg.close();
  });

  invForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = invForm.elements.name.value.trim();
    const email = invForm.elements.email.value.trim();
    if (!name) {
      invError.textContent = "Please enter their name.";
      invForm.elements.name.focus();
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      invError.textContent = "Please enter a valid email address.";
      invForm.elements.email.focus();
      return;
    }
    if (team.some((m) => m.email.toLowerCase() === email.toLowerCase())) {
      invError.textContent = "Someone with that email is already on the team.";
      return;
    }
    team.push({
      id: `m-${Date.now().toString(36)}`,
      name,
      email,
      role: invForm.elements.role.value,
      status: "invited",
    });
    saveTeam();
    dlg.close();
    renderAll();
    UI.toast(`Invitation sent to ${name} (concept)`);
  });

  root.addEventListener("click", (e) => {
    if (!e.target.closest("[data-invite]")) return;
    invForm.reset();
    invError.textContent = "";
    dlg.showModal();
    invForm.elements.name.focus();
  });

  /* ---------- Listings + assignment ---------- */
  const renderListings = () => {
    $("[data-al-empty]").hidden = listings.length > 0;
    $("[data-agency-listings]").innerHTML = listings
      .map(
        (l) => `
      <tr>
        <th scope="row">
          <div class="cell-home">
            ${l.image ? `<img src="${l.image}" alt="" loading="lazy" decoding="async">` : '<span class="cell-home__empty" aria-hidden="true"></span>'}
            <div><a href="${D.href(l)}">${esc(l.name)}</a><span>${esc(l.area)}</span></div>
          </div>
        </th>
        <td>${STATUS[l.listingStatus] || "Active"}</td>
        <td class="num">${(l.views || 0).toLocaleString("en-US")}</td>
        <td class="num">${leadsFor(l.id)}</td>
        <td>
          <label class="visually-hidden" for="as-${l.id}">Assign ${esc(l.name)}</label>
          <select class="input input--sm" id="as-${l.id}" data-assign="${l.id}">
            <option value="">Unassigned</option>
            ${team.map((m) => `<option value="${m.id}" ${assignments[l.id] === m.id ? "selected" : ""}>${esc(m.name)}</option>`).join("")}
          </select>
        </td>
      </tr>`,
      )
      .join("");
  };

  $("[data-agency-listings]").addEventListener("change", (e) => {
    const sel = e.target.closest("[data-assign]");
    if (!sel) return;
    if (sel.value) assignments[sel.dataset.assign] = sel.value;
    else delete assignments[sel.dataset.assign];
    saveAssignments();
    renderTeam();
    UI.toast("Listing assigned");
  });

  /* ---------- Branding form + preview ---------- */
  const form = $("[data-brand-form]");
  const swatches = $("[data-swatches]");
  const logoPreview = $("[data-logo-preview]");
  const logoRemove = $("[data-logo-remove]");

  swatches.innerHTML = COLORS.map(
    ([hex, label]) => `
    <label class="swatch">
      <input class="visually-hidden" type="radio" name="color" value="${hex}">
      <span style="--swatch:${hex}"><i aria-hidden="true"></i>${label}</span>
    </label>`,
  ).join("");

  const fill = () => {
    ["name", "tagline", "about", "location", "email", "phone"].forEach((k) => {
      form.elements[k].value = agency[k];
    });
    swatches.querySelectorAll("input").forEach((r) => {
      r.checked = r.value === agency.color;
    });
    $('[data-setting="routing"]').value = agency.routing;
    $('[data-setting="notifyLeads"]').checked = !!agency.notifyLeads;
  };

  const logoMarkup = (name) =>
    logo
      ? `<img src="${logo}" alt="">`
      : esc((name || "A").trim().charAt(0).toUpperCase() || "A");

  const renderPreview = () => {
    const v = (k) => form.elements[k].value.trim();
    const color = (
      swatches.querySelector("input:checked") || { value: agency.color }
    ).value;
    const name = v("name") || "Your agency";
    logoPreview.innerHTML = logoMarkup(name);
    logoRemove.hidden = !logo;
    $("[data-preview]").style.setProperty("--agency", color);
    $("[data-preview]").innerHTML = `
      <div class="agency-preview__banner"></div>
      <div class="agency-preview__body">
        <span class="agency-preview__logo">${logoMarkup(name)}</span>
        <h3 class="agency-preview__name">${esc(name)}${agency.verification === "verified" ? ` <span class="badge badge--outline">${ic("check")}Verified</span>` : ""}</h3>
        ${v("tagline") ? `<p class="agency-preview__tagline">${esc(v("tagline"))}</p>` : ""}
        ${v("location") ? `<p class="agency-preview__loc">${ic("pin")}${esc(v("location"))}</p>` : ""}
        ${v("about") ? `<p class="agency-preview__about">${esc(v("about"))}</p>` : ""}
        <dl class="agency-preview__stats">
          <div><dt>Agents</dt><dd>${team.length}</dd></div>
          <div><dt>Listings</dt><dd>${listings.length}</dd></div>
          <div><dt>Active</dt><dd>${listings.filter((l) => l.listingStatus === "active").length}</dd></div>
        </dl>
        ${v("email") || v("phone") ? `<p class="agency-preview__contact">${[v("email"), v("phone")].filter(Boolean).map(esc).join(" · ")}</p>` : ""}
      </div>`;
  };

  const renderVerify = () => {
    const status = agency.verification;
    const box = $("[data-verify]");
    box.innerHTML =
      status === "verified"
        ? `<p><strong>${ic("check")}Verified agency</strong><span>Your profile shows a verified badge.</span></p>`
        : status === "pending"
          ? `<p><strong>Verification pending</strong><span>REALTY will review your agency details. This is a concept in the demo.</span></p>`
          : `<p><strong>Not verified yet</strong><span>A verified badge helps visitors trust your listings.</span></p>
           <button class="btn btn--outline btn--sm" type="button" data-request-verify>Request verification</button>`;
  };

  form.addEventListener("input", renderPreview);
  form.addEventListener("change", renderPreview);

  const compressLogo = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const scale = Math.min(1, 320 / Math.max(img.width, img.height));
          const c = document.createElement("canvas");
          c.width = Math.round(img.width * scale);
          c.height = Math.round(img.height * scale);
          const ctx = c.getContext("2d");
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, c.width, c.height);
          ctx.drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL("image/jpeg", 0.82));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });

  $("[data-logo-file]").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    try {
      logo = await compressLogo(file);
      renderPreview();
    } catch {
      UI.toast("That image could not be read");
    }
  });
  logoRemove.addEventListener("click", () => {
    logo = "";
    renderPreview();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const err = form.querySelector("[data-error]");
    const name = form.elements.name.value.trim();
    err.textContent = "";
    form.elements.name.removeAttribute("aria-invalid");
    if (!name) {
      err.textContent = "Please enter your agency name.";
      form.elements.name.setAttribute("aria-invalid", "true");
      form.elements.name.focus();
      return;
    }
    const email = form.elements.email.value.trim();
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      err.textContent = "Please enter a valid contact email.";
      form.elements.email.focus();
      return;
    }

    agency = {
      ...agency,
      name,
      logo,
      tagline: form.elements.tagline.value.trim(),
      about: form.elements.about.value.trim(),
      location: form.elements.location.value.trim(),
      email,
      phone: form.elements.phone.value.trim(),
      color: (
        swatches.querySelector("input:checked") || { value: agency.color }
      ).value,
    };
    if (saveAgency()) UI.toast("Agency profile saved");
    else UI.toast("There is no room to save the logo. Try a smaller image.");
    renderPreview();
  });

  root.addEventListener("click", (e) => {
    if (!e.target.closest("[data-request-verify]")) return;
    agency.verification = "pending";
    saveAgency();
    renderVerify();
    UI.toast("Verification requested (concept)");
  });

  /* ---------- Settings ---------- */
  root.querySelectorAll("[data-setting]").forEach((el) => {
    el.addEventListener("change", () => {
      agency[el.dataset.setting] =
        el.type === "checkbox" ? el.checked : el.value;
      saveAgency();
      UI.toast("Settings saved");
    });
  });

  /* ---------- Sidebar scroll-spy for the in-page links ---------- */
  const spy = () => {
    const links = [...document.querySelectorAll(".desk-nav a")].filter((a) =>
      a.getAttribute("href").startsWith("agency-desk.html"),
    );
    if (!links.length || !("IntersectionObserver" in window)) return;
    const targetOf = (a) => {
      const h = a.getAttribute("href").split("#")[1];
      return h ? document.getElementById(h) : root;
    };
    const pairs = links.map((a) => [a, targetOf(a)]).filter(([, t]) => t);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          pairs.forEach(([a, t]) => {
            if (t === en.target) a.setAttribute("aria-current", "page");
            else a.removeAttribute("aria-current");
          });
        });
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    pairs.forEach(([, t]) => io.observe(t));
  };

  /* ---------- Init ---------- */
  function renderAll() {
    renderStats();
    renderTeam();
    renderListings();
    renderPreview();
    renderVerify();
  }
  fill();
  renderAll();
  spy();
})();
