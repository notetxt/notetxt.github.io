/* ============================================
   NoteTxt — Main interactions & animations
   ============================================ */
document.addEventListener("DOMContentLoaded", function () {

  /* ---- Scroll reveal ---- */
  const revealTargets = document.querySelectorAll(
    ".sticky, .feature-card, .step, .detail-row, .case-card, .faq-item, .section-title, .section-sub"
  );

  revealTargets.forEach(function (el) {
    el.classList.add("reveal");
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    revealTargets.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    // Fallback: no IntersectionObserver support
    revealTargets.forEach(function (el) {
      el.classList.add("reveal-in");
    });
  }

  /* ---- FAQ accordion ---- */
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach(function (item) {
    const btn = item.querySelector(".faq-q");
    const answer = item.querySelector(".faq-a");
    if (!btn || !answer) return;

    btn.addEventListener("click", function () {
      const isOpen = item.classList.contains("is-open");

      faqItems.forEach(function (other) {
        other.classList.remove("is-open");
        const otherBtn = other.querySelector(".faq-q");
        const otherAnswer = other.querySelector(".faq-a");
        if (otherBtn) otherBtn.setAttribute("aria-expanded", "false");
        if (otherAnswer) otherAnswer.style.maxHeight = null;
      });

      if (!isOpen) {
        item.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
        answer.style.maxHeight = answer.scrollHeight + "px";
      }
    });
  });

  /* ---- Smooth scroll for in-page anchor links ---- */
  document.querySelectorAll('a[href^="#"], a[href^="index.html#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      const href = link.getAttribute("href");
      const hashIndex = href.indexOf("#");
      if (hashIndex === -1) return;

      const targetId = href.slice(hashIndex + 1);
      const onIndexPage =
        window.location.pathname.endsWith("/") ||
        window.location.pathname.endsWith("index.html") ||
        window.location.pathname.endsWith("notetxt.github.io");

      if (targetId && onIndexPage) {
        const target = document.getElementById(targetId);
        if (target) {
          e.preventDefault();
          const headerOffset = 76;
          const top = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
          window.scrollTo({ top: top, behavior: "smooth" });
        }
      }
    });
  });

});
