/* ==========================================================================
   REALTY — js/article.js
   Renders a Journal story: header, hero, body blocks, share, related stories,
   reading progress. URL: article.html?id=<id>
   ========================================================================== */
(() => {
  "use strict";

  const root = document.querySelector("[data-article]");
  const ARTICLES = window.RealtyArticles;
  if (!root || !ARTICLES) return;

  const UI = window.RealtyUI;
  const ic = (n, cls = "") =>
    `<svg class="icon ${cls}" aria-hidden="true"><use href="#i-${n}"></use></svg>`;
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
  const long = (iso) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  const short = (iso) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const a = ARTICLES.find(
    (x) => x.id === new URLSearchParams(location.search).get("id"),
  );

  if (!a) {
    document.title = "Story not found — REALTY";
    root.innerHTML = `
      <div class="container article-missing">
        <h1 class="h2">We couldn't find that story.</h1>
        <p class="lead">It may have moved, or the link may be incomplete.</p>
        <a class="btn btn--dark" href="journal.html">Back to the journal ${ic("arrow-right")}</a>
      </div>`;
    return;
  }

  document.title = `${a.title.replace(/\.$/, "")} — REALTY Journal`;
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute("content", a.standfirst);

  const block = (b) => {
    if (b.h) return `<h2>${esc(b.h)}</h2>`;
    if (b.p) return `<p>${esc(b.p)}</p>`;
    if (b.quote) return `<blockquote><p>${esc(b.quote)}</p></blockquote>`;
    if (b.list)
      return `<ul>${b.list.map((i) => `<li>${ic("check", "icon--brand")}<span>${esc(i)}</span></li>`).join("")}</ul>`;
    return "";
  };

  const related = [
    ...ARTICLES.filter((x) => x.id !== a.id && x.topic === a.topic),
    ...ARTICLES.filter((x) => x.id !== a.id && x.topic !== a.topic),
  ].slice(0, 3);

  root.innerHTML = `
    <article class="container article">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <ol>
          <li><a href="index.html">Home</a></li>
          <li><a href="journal.html">Journal</a></li>
          <li><a href="journal.html?topic=${a.topic}">${esc(a.topicLabel)}</a></li>
        </ol>
      </nav>

      <header class="article__head">
        <p class="article-card__meta"><span>${esc(a.topicLabel)}</span><span aria-hidden="true">·</span><time datetime="${a.date}">${long(a.date)}</time><span aria-hidden="true">·</span><span>${a.minutes} min read</span></p>
        <h1 class="article__title">${esc(a.title)}</h1>
        <p class="article__standfirst">${esc(a.standfirst)}</p>
      </header>

      <figure class="article__hero"><img src="${a.image}" alt="" fetchpriority="high"></figure>

      <div class="article__layout">
        <div class="article__aside">
          <button class="btn btn--outline btn--sm" type="button" data-share>${ic("share")}Share</button>
          <a class="text-btn" href="journal.html">${ic("arrow-left", "icon--sm")}All stories</a>
        </div>
        <div class="article__body">${a.body.map(block).join("")}</div>
      </div>

      <aside class="article__cta" aria-label="Next step">
        <div>
          <p class="eyebrow eyebrow--brand">Ready to look?</p>
          <h2>Find a place that feels like home.</h2>
        </div>
        <div class="btn-row">
          <a class="btn btn--brand" href="buy.html">Search homes ${ic("arrow-right")}</a>
          <a class="btn btn--outline-light" href="mortgage.html">Try the mortgage tools ${ic("arrow-right")}</a>
        </div>
      </aside>
    </article>

    <section class="container related" aria-labelledby="related-title">
      <header class="section-head">
        <div><p class="eyebrow eyebrow--mark">Keep reading</p><h2 class="h2" id="related-title">More from the journal.</h2></div>
        <a class="link-arrow" href="journal.html">All stories ${ic("arrow-up-right", "icon--diag")}</a>
      </header>
      <div class="article-grid">
        ${related
          .map(
            (r) => `
        <article class="article-card">
          <a class="article-card__media" href="article.html?id=${r.id}" tabindex="-1" aria-hidden="true"><img src="${r.image}" alt="" loading="lazy" decoding="async"></a>
          <div class="article-card__body">
            <p class="article-card__meta"><span>${esc(r.topicLabel)}</span><span aria-hidden="true">·</span><time datetime="${r.date}">${short(r.date)}</time></p>
            <h3 class="article-card__title"><a href="article.html?id=${r.id}">${esc(r.title)}</a></h3>
            <p class="article-card__excerpt">${esc(r.standfirst)}</p>
            <p class="article-card__foot"><span>${r.minutes} min read</span><span class="article-card__more">Read ${ic("arrow-right")}</span></p>
          </div>
        </article>`,
          )
          .join("")}
      </div>
    </section>`;

  /* ---------- Share ---------- */
  root.addEventListener("click", async (e) => {
    if (!e.target.closest("[data-share]")) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: a.title,
          text: a.standfirst,
          url: location.href,
        });
        return;
      }
      await navigator.clipboard.writeText(location.href);
      if (UI) UI.toast("Link copied");
    } catch (err) {
      if (err.name !== "AbortError" && UI)
        UI.toast("Copy the link from your address bar");
    }
  });

  /* ---------- Reading progress ---------- */
  const bar = document.querySelector("[data-progress]");
  const body = root.querySelector(".article__body");
  if (bar && body) {
    let ticking = false;
    const update = () => {
      const rect = body.getBoundingClientRect();
      const total = rect.height - window.innerHeight * 0.5;
      const done = Math.min(
        1,
        Math.max(0, (window.innerHeight * 0.3 - rect.top) / Math.max(total, 1)),
      );
      bar.style.transform = `scaleX(${done})`;
      ticking = false;
    };
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true },
    );
    update();
  }
})();
