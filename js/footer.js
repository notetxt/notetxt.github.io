/* ============================================
   NoteTxt — Site Footer Component
   Injects the footer into #site-footer
   ============================================ */
(function () {
  const year = new Date().getFullYear();

  const footerHTML = `
  <footer class="site-footer">
    <div class="container footer-inner">

      <div class="footer-col footer-brand">
        <a href="index.html" class="brand" aria-label="NoteTxt home">
          <span class="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <rect x="4" y="2.5" width="16" height="19" rx="2.4" fill="#FFC233"/>
              <line x1="8" y1="8" x2="16" y2="8" stroke="#2B2620" stroke-width="1.6" stroke-linecap="round"/>
              <line x1="8" y1="12" x2="16" y2="12" stroke="#2B2620" stroke-width="1.6" stroke-linecap="round"/>
              <line x1="8" y1="16" x2="13" y2="16" stroke="#2B2620" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
          </span>
          <span class="brand-name">Note<em>Txt</em></span>
        </a>
        <p>Eight free, browser-based writing tools. No sign-up, no install, no clutter, just a cream-colored corner of the internet for your notes.</p>
      </div>

      <div class="footer-col">
        <h4>The Tools</h4>
        <ul>
          <li><a href="notepad-online.html">Notepad Online</a></li>
          <li><a href="diary-online.html">Diary Online</a></li>
          <li><a href="private-journal.html">Private Journal</a></li>
          <li><a href="list-maker.html">List Maker</a></li>
          <li><a href="memo-notepad.html">Memo Notepad</a></li>
          <li><a href="random-text-generator.html">Random Text Generator</a></li>
          <li><a href="case-converter.html">Case Converter</a></li>
          <li><a href="decision-maker.html">Decision Maker</a></li>
        </ul>
      </div>

      <div class="footer-col">
        <h4>Site</h4>
        <ul>
          <li><a href="index.html#apps">All Apps</a></li>
          <li><a href="index.html#features">Features</a></li>
          <li><a href="index.html#how-it-works">How It Works</a></li>
          <li><a href="index.html#faq">FAQ</a></li>
        </ul>
      </div>

      <div class="footer-col">
        <h4>Legal</h4>
        <ul>
          <li><a href="privacy-policy.html">Privacy Policy</a></li>
          <li><a href="terms.html">Terms of Service</a></li>
        </ul>
      </div>

    </div>

    <div class="container footer-bottom">
      <p>&copy; ${year} NoteTxt. All rights reserved.</p>
      <p class="footer-tagline">Built for note-takers, list-makers and the occasionally undecided.</p>
    </div>
  </footer>
  `;

  const mount = document.getElementById("site-footer");
  if (mount) {
    mount.innerHTML = footerHTML;
  }
})();
