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
        <a href="/" class="brand" aria-label="NoteTxt home">
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
          <li><a href="notepad-online">Notepad Online</a></li>
          <li><a href="Online-diary">Diary Online</a></li>
          <li><a href="private-journal">Private Journal</a></li>
          <li><a href="list-maker">List Maker</a></li>
          <li><a href="memo-notepad">Memo Notepad</a></li>
          <li><a href="random-text-generator">Random Text Generator</a></li>
          <li><a href="case-converter">Case Converter</a></li>
          <li><a href="decision-maker">Decision Maker</a></li>
        </ul>
      </div>

      <div class="footer-col">
        <h4>Site</h4>
        <ul>
          <li><a href="/#apps">All Apps</a></li>
          <li><a href="/#features">Features</a></li>
          <li><a href="/#how-it-works">How It Works</a></li>
          <li><a href="/#faq">FAQ</a></li>
        </ul>
      </div>

      <div class="footer-col">
        <h4>Legal</h4>
        <ul>
          <li><a href="/privacy">Privacy Policy</a></li>
          <li><a href="/terms">Terms of Service</a></li>
          <li><a href="/contact">Contact</a></li>
          <li><a href="/about">About</a></li>
          <li><a href="/cookies">Cookies Policy</a></li>
        </ul>
      </div>

    </div>

    <div class="container footer-bottom">
      <p>&copy; ${year} NoteTxT. All rights reserved.</p>
      <p class="footer-tagline">Built for note-takers, list-makers and the occasionally undecided.</p>
    </div>
  </footer>
  `;

  const mount = document.getElementById("site-footer");
  if (mount) {
    mount.innerHTML = footerHTML;
  }
})();
