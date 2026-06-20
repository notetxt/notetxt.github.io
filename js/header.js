/* ============================================
   NoteTxt — Site Header Component
   Injects the header/nav into #site-header
   ============================================ */
(function () {
  const headerHTML = `
  <header class="site-header" id="masthead">
    <div class="container header-inner">
      <a href="index.html" class="brand" aria-label="NoteTxt home">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <rect x="4" y="2.5" width="16" height="19" rx="2.4" fill="#FF8C82"/>
            <line x1="8" y1="8" x2="16" y2="8" stroke="#2B2620" stroke-width="1.6" stroke-linecap="round"/>
            <line x1="8" y1="12" x2="16" y2="12" stroke="#2B2620" stroke-width="1.6" stroke-linecap="round"/>
            <line x1="8" y1="16" x2="13" y2="16" stroke="#2B2620" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
        </span>
        <span class="brand-name">Note<em>Txt</em></span>
      </a>

      <nav class="primary-nav" id="primaryNav" aria-label="Primary">
        <a href="index.html#apps">Apps</a>
        <a href="index.html#features">Features</a>
        <a href="index.html#how-it-works">How It Works</a>
        <a href="index.html#use-cases">Use Cases</a>
        <a href="index.html#faq">FAQ</a>
      </nav>

      <a href="notepad-online.html" class="btn btn-primary btn-sm header-cta">Open Notepad</a>

      <button class="nav-toggle" id="navToggle" aria-label="Toggle menu" aria-expanded="false" aria-controls="primaryNav">
        <span></span><span></span><span></span>
      </button>
    </div>
  </header>
  `;

  const mount = document.getElementById("site-header");
  if (mount) {
    mount.innerHTML = headerHTML;
  }

  // Mobile nav toggle
  document.addEventListener("DOMContentLoaded", function () {
    const toggle = document.getElementById("navToggle");
    const nav = document.getElementById("primaryNav");
    const header = document.getElementById("masthead");

    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        const isOpen = nav.classList.toggle("nav-open");
        toggle.classList.toggle("is-active", isOpen);
        toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });

      nav.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
          nav.classList.remove("nav-open");
          toggle.classList.remove("is-active");
          toggle.setAttribute("aria-expanded", "false");
        });
      });
    }

    // Shrink header slightly on scroll
    if (header) {
      window.addEventListener(
        "scroll",
        function () {
          header.classList.toggle("is-scrolled", window.scrollY > 12);
        },
        { passive: true }
      );
    }
  });
})();
