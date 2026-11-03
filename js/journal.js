/* ==========================================================================
   REALTY — js/journal.js
   Journal page: topic filter (supports ?topic=reports) · newsletter form
   ========================================================================== */
(() => {
  "use strict";

  /* ---------- Topic filter ---------- */
  const filter = document.querySelector("[data-journal-filter]");
  const count = document.querySelector("[data-story-count]");
  const stories = [...document.querySelectorAll(".journal [data-topic]")];

  if (filter && stories.length) {
    const apply = (topic, { updateUrl = true } = {}) => {
      let n = 0;
      stories.forEach((story) => {
        const show = topic === "all" || story.dataset.topic === topic;
        story.hidden = !show;
        if (show) n += 1;
      });
      if (count) count.textContent = `${n} ${n === 1 ? "story" : "stories"}`;
      if (updateUrl) {
        const url = new URL(location.href);
        if (topic === "all") url.searchParams.delete("topic");
        else url.searchParams.set("topic", topic);
        history.replaceState(null, "", url);
      }
    };

    filter.addEventListener("change", (e) => {
      if (e.target.name === "topic") apply(e.target.value);
    });

    const requested = new URLSearchParams(location.search).get("topic");
    const radio =
      requested &&
      filter.querySelector(
        `input[name="topic"][value="${CSS.escape(requested)}"]`,
      );
    if (radio) radio.checked = true;
    apply(filter.querySelector('input[name="topic"]:checked').value, {
      updateUrl: false,
    });
  }

  /* ---------- Newsletter (front-end only; wire to Firebase later) ---------- */
  const form = document.querySelector("[data-newsletter]");
  const msg = document.querySelector("[data-newsletter-msg]");
  if (form && msg) {
    const input = form.elements.email;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const value = input.value.trim();
      msg.className = "newsletter__msg";
      if (!value || !input.checkValidity()) {
        msg.textContent = "Please enter a valid email address.";
        msg.classList.add("is-error");
        input.focus();
        return;
      }
      msg.textContent = "Thank you. Your first letter is on its way.";
      msg.classList.add("is-success");
      window.RealtyUI?.toast("Subscribed to the monthly letter");
      form.reset();
    });
  }
})();
