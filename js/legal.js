/* ==========================================================================
   REALTY — js/legal.js
   Highlights the current section in the "On this page" list while scrolling
   ========================================================================== */
(() => {
  "use strict";

  const toc = document.querySelector("[data-toc]");
  if (!toc || !("IntersectionObserver" in window)) return;

  const links = [...toc.querySelectorAll("a")];
  const map = new Map(
    links.map((a) => [document.getElementById(a.hash.slice(1)), a]),
  );

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => a.removeAttribute("aria-current"));
        map.get(en.target)?.setAttribute("aria-current", "true");
      });
    },
    { rootMargin: "-20% 0px -70% 0px" },
  );

  map.forEach((_, section) => section && io.observe(section));
})();
