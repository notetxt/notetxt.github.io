/* ===================================================================
   NoteTxt — Memo Notepad App logic
   Memos are stored in the browser's localStorage. Nothing leaves
   the device; there is no server or account behind this tool.
   =================================================================== */
(function () {
  "use strict";

  const STORAGE_KEY = "notetxt-memo-notepad-v1";
  const CHAR_LIMIT = 280;
  const COLORS = ["yellow", "pink", "lavender", "mint", "peach", "sky", "coral", "turquoise"];

  let memos = {};
  let currentView = "board"; // 'board' | 'archived'
  let searchQuery = "";
  let activeColorFilter = null;
  const saveTimers = new Map();

  let els = {};

  function cacheEls() {
    els = {
      board: document.getElementById("memoBoard"),
      search: document.getElementById("memoSearch"),
      boardTab: document.getElementById("boardTab"),
      archivedTab: document.getElementById("archivedTab"),
      newMemoBtn: document.getElementById("newMemoBtn"),
      emptyTrashBtn: document.getElementById("emptyTrashBtn"),
      colorFilter: document.getElementById("colorFilter"),
      statMemos: document.getElementById("statMemos"),
      statPinned: document.getElementById("statPinned"),
    };
  }

  /* ---------- storage ---------- */
  function loadMemos() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.warn("NoteTxt: could not read saved memos.", e);
      return {};
    }
  }

  function persistMemos() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memos));
    } catch (e) {
      console.warn("NoteTxt: could not save memo.", e);
    }
  }

  function makeId() {
    return "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  function formatRelative(ts) {
    if (!ts) return "";
    const sec = Math.floor((Date.now() - ts) / 1000);
    if (sec < 10) return "Saved just now";
    if (sec < 60) return `Saved ${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `Saved ${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `Saved ${hr}h ago`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `Saved ${day}d ago`;
    return "Saved " + new Date(ts).toLocaleDateString();
  }

  /* ---------- filtering / sorting ---------- */
  function visibleIds() {
    const ids = Object.keys(memos).filter(function (id) {
      const m = memos[id];
      if (currentView === "archived") {
        if (!m.archived) return false;
      } else if (m.archived) {
        return false;
      }
      if (activeColorFilter && m.color !== activeColorFilter) return false;
      if (searchQuery && (m.text || "").toLowerCase().indexOf(searchQuery.toLowerCase()) === -1) return false;
      return true;
    });

    ids.sort(function (a, b) {
      if (currentView === "board") {
        const pa = memos[a].pinned ? 1 : 0;
        const pb = memos[b].pinned ? 1 : 0;
        if (pa !== pb) return pb - pa;
      }
      return (memos[b].updatedAt || 0) - (memos[a].updatedAt || 0);
    });

    return ids;
  }

  function emptyMessage() {
    if (currentView === "archived") {
      return Object.keys(memos).some(function (id) { return memos[id].archived; })
        ? "No archived memos match your search."
        : "Nothing archived yet. Memos you archive will show up here.";
    }
    if (searchQuery || activeColorFilter) return "No memos match your search or filter.";
    return "No memos yet. Tap + New Memo to pin your first thought.";
  }

  /* ---------- rendering ---------- */
  function cardHTML(memo, id, rotIdx) {
    const rot = "rot-" + ((rotIdx % 5) + 1);

    if (currentView === "archived") {
      return `<article class="sticky sticky-${memo.color} memo-card is-archived ${rot}" data-id="${id}">
        <span class="tape" aria-hidden="true"></span>
        <p class="memo-archived-text">${escapeHtml(memo.text) || "<em>(empty memo)</em>"}</p>
        <div class="memo-footer">
          <div class="memo-footer-row"><span class="memo-time">Archived ${formatRelative(memo.updatedAt)}</span></div>
          <div class="memo-footer-row">
            <button type="button" class="btn btn-ghost btn-sm memo-restore" data-id="${id}">Restore</button>
            <button type="button" class="btn btn-ghost btn-sm memo-delete-forever" data-id="${id}">Delete forever</button>
          </div>
        </div>
      </article>`;
    }

    const len = (memo.text || "").length;
    return `<article class="sticky sticky-${memo.color} memo-card ${rot}" data-id="${id}">
      <span class="tape" aria-hidden="true"></span>
      <button type="button" class="memo-pin ${memo.pinned ? "is-pinned" : ""}" data-id="${id}" aria-pressed="${memo.pinned ? "true" : "false"}" aria-label="${memo.pinned ? "Unpin memo" : "Pin memo to top"}">📌</button>

      <label for="memo-text-${id}" class="visually-hidden">Memo text</label>
      <textarea id="memo-text-${id}" class="memo-text" data-id="${id}" maxlength="${CHAR_LIMIT}" placeholder="Quick thought…">${escapeHtml(memo.text)}</textarea>

      <div class="memo-footer">
        <div class="memo-footer-row">
          <div class="memo-colors" data-id="${id}">
            ${COLORS.map(function (c) {
              return `<button type="button" class="color-dot ${c === memo.color ? "is-selected" : ""}" data-color="${c}" style="background:var(--note-${c})" aria-label="Set color ${c}"></button>`;
            }).join("")}
          </div>
          <span class="memo-charcount ${len >= CHAR_LIMIT - 20 ? "is-near-limit" : ""}" data-id="${id}">${len}/${CHAR_LIMIT}</span>
        </div>
        <div class="memo-footer-row">
          <span class="memo-time">${formatRelative(memo.updatedAt)}</span>
          <button type="button" class="memo-archive" data-id="${id}" aria-label="Archive memo">🗑</button>
        </div>
      </div>
    </article>`;
  }

  function renderBoard() {
    if (!els.board) return;
    const ids = visibleIds();

    if (ids.length === 0) {
      els.board.innerHTML = `<p class="memo-empty">${emptyMessage()}</p>`;
      return;
    }

    els.board.innerHTML = ids.map(function (id, idx) { return cardHTML(memos[id], id, idx); }).join("");
    attachCardListeners();
  }

  function attachCardListeners() {
    if (!els.board) return;

    els.board.querySelectorAll(".memo-text").forEach(function (ta) {
      ta.addEventListener("input", function () {
        const id = ta.getAttribute("data-id");
        if (!memos[id]) return;
        memos[id].text = ta.value;
        memos[id].updatedAt = Date.now();

        const card = ta.closest(".memo-card");
        const counter = card && card.querySelector(".memo-charcount");
        if (counter) {
          counter.textContent = `${ta.value.length}/${CHAR_LIMIT}`;
          counter.classList.toggle("is-near-limit", ta.value.length >= CHAR_LIMIT - 20);
        }
        const timeEl = card && card.querySelector(".memo-time");
        if (timeEl) timeEl.textContent = "Saving…";

        queueCardSave(id, timeEl);
      });

      ta.addEventListener("blur", function () {
        const id = ta.getAttribute("data-id");
        if (saveTimers.has(id)) { clearTimeout(saveTimers.get(id)); saveTimers.delete(id); }
        persistMemos();
        updateStats();
      });
    });

    els.board.querySelectorAll(".memo-pin").forEach(function (btn) {
      btn.addEventListener("click", function () { togglePin(btn.getAttribute("data-id")); });
    });

    els.board.querySelectorAll(".memo-colors").forEach(function (group) {
      group.querySelectorAll(".color-dot").forEach(function (dot) {
        dot.addEventListener("click", function () {
          setMemoColor(group.getAttribute("data-id"), dot.getAttribute("data-color"));
        });
      });
    });

    els.board.querySelectorAll(".memo-archive").forEach(function (btn) {
      btn.addEventListener("click", function () { archiveMemo(btn.getAttribute("data-id")); });
    });
    els.board.querySelectorAll(".memo-restore").forEach(function (btn) {
      btn.addEventListener("click", function () { restoreMemo(btn.getAttribute("data-id")); });
    });
    els.board.querySelectorAll(".memo-delete-forever").forEach(function (btn) {
      btn.addEventListener("click", function () { deleteForever(btn.getAttribute("data-id")); });
    });
  }

  function queueCardSave(id, timeEl) {
    if (saveTimers.has(id)) clearTimeout(saveTimers.get(id));
    const t = setTimeout(function () {
      persistMemos();
      updateStats();
      if (timeEl && memos[id]) timeEl.textContent = formatRelative(memos[id].updatedAt);
      saveTimers.delete(id);
    }, 600);
    saveTimers.set(id, t);
  }

  /* ---------- actions ---------- */
  function createMemo() {
    const id = makeId();
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    memos[id] = { text: "", color: color, pinned: false, archived: false, createdAt: Date.now(), updatedAt: Date.now() };
    persistMemos();
    renderBoard();
    updateStats();
    requestAnimationFrame(function () {
      const el = document.getElementById("memo-text-" + id);
      if (el) el.focus();
      if (els.board) els.board.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  function togglePin(id) {
    if (!memos[id]) return;
    memos[id].pinned = !memos[id].pinned;
    memos[id].updatedAt = Date.now();
    persistMemos();
    renderBoard();
    updateStats();
  }

  function setMemoColor(id, color) {
    if (!memos[id] || COLORS.indexOf(color) === -1) return;
    memos[id].color = color;
    memos[id].updatedAt = Date.now();
    persistMemos();
    renderBoard();
  }

  function archiveMemo(id) {
    if (!memos[id]) return;
    memos[id].archived = true;
    memos[id].updatedAt = Date.now();
    persistMemos();
    renderBoard();
    updateStats();
  }

  function restoreMemo(id) {
    if (!memos[id]) return;
    memos[id].archived = false;
    memos[id].updatedAt = Date.now();
    persistMemos();
    renderBoard();
    updateStats();
  }

  function deleteForever(id) {
    if (!memos[id]) return;
    delete memos[id];
    persistMemos();
    renderBoard();
    updateStats();
  }

  function emptyTrash() {
    const archivedIds = Object.keys(memos).filter(function (id) { return memos[id].archived; });
    if (archivedIds.length === 0) return;
    const ok = window.confirm(`Permanently delete ${archivedIds.length} archived memo${archivedIds.length === 1 ? "" : "s"}? This can't be undone.`);
    if (!ok) return;
    archivedIds.forEach(function (id) { delete memos[id]; });
    persistMemos();
    renderBoard();
    updateStats();
  }

  /* ---------- view / filter controls ---------- */
  function setView(view) {
    currentView = view;
    if (els.boardTab) els.boardTab.classList.toggle("is-active", view === "board");
    if (els.archivedTab) els.archivedTab.classList.toggle("is-active", view === "archived");
    if (els.newMemoBtn) els.newMemoBtn.classList.toggle("hidden", view === "archived");
    if (els.emptyTrashBtn) els.emptyTrashBtn.classList.toggle("hidden", view !== "archived");
    renderBoard();
  }

  function setColorFilter(color) {
    activeColorFilter = color || null;
    if (els.colorFilter) {
      els.colorFilter.querySelectorAll("[data-color]").forEach(function (btn) {
        const isAllBtn = btn.id === "filterAllBtn";
        const active = isAllBtn ? !activeColorFilter : btn.getAttribute("data-color") === activeColorFilter;
        btn.classList.toggle("is-active", active);
      });
    }
    renderBoard();
  }

  /* ---------- stats ---------- */
  function updateStats() {
    const ids = Object.keys(memos).filter(function (id) { return !memos[id].archived; });
    if (els.statMemos) els.statMemos.textContent = String(ids.length);
    const pinned = ids.filter(function (id) { return memos[id].pinned; }).length;
    if (els.statPinned) els.statPinned.textContent = String(pinned);
  }

  /* ---------- init ---------- */
  function init() {
    cacheEls();
    if (!els.board) return; // app not present on this page

    memos = loadMemos();

    if (els.search) {
      els.search.addEventListener("input", function () {
        searchQuery = els.search.value;
        renderBoard();
      });
    }
    if (els.newMemoBtn) els.newMemoBtn.addEventListener("click", createMemo);
    if (els.emptyTrashBtn) els.emptyTrashBtn.addEventListener("click", emptyTrash);
    if (els.boardTab) els.boardTab.addEventListener("click", function () { setView("board"); });
    if (els.archivedTab) els.archivedTab.addEventListener("click", function () { setView("archived"); });

    if (els.colorFilter) {
      els.colorFilter.addEventListener("click", function (e) {
        const btn = e.target.closest("[data-color]");
        if (!btn) return;
        setColorFilter(btn.getAttribute("data-color") || null);
      });
    }

    renderBoard();
    updateStats();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
