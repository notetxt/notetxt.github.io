/* ===================================================================
   NoteTxt — List Maker App logic
   Lists are stored in the browser's localStorage. Nothing leaves
   the device; there is no server or account behind this tool.
   =================================================================== */
(function () {
  "use strict";

  const STORAGE_KEY = "notetxt-list-maker-v1";

  const LIST_TYPES = [
    { id: "todo",     label: "To-Do List",     icon: "✅", color: "mint" },
    { id: "shopping", label: "Shopping List",  icon: "🛒", color: "peach" },
    { id: "packing",  label: "Packing List",   icon: "🧳", color: "sky" },
    { id: "bucket",   label: "Bucket List",    icon: "🌟", color: "lavender" },
    { id: "goals",    label: "Goals List",     icon: "🎯", color: "coral" },
    { id: "reading",  label: "Reading List",   icon: "📚", color: "yellow" },
    { id: "custom",   label: "Custom List",    icon: "✏️", color: "turquoise" },
  ];

  let lists = {};
  let currentId = null;
  let draggedItemId = null;
  let saveTimer = null;

  let els = {};

  function cacheEls() {
    els = {
      search: document.getElementById("listsSearch"),
      newBtn: document.getElementById("newListBtn"),
      typePicker: document.getElementById("typePicker"),
      listsList: document.getElementById("listsList"),
      titleInput: document.getElementById("listTitleInput"),
      typeBadge: document.getElementById("typeBadge"),
      addInput: document.getElementById("addItemInput"),
      addBtn: document.getElementById("addItemBtn"),
      itemList: document.getElementById("itemList"),
      progressFill: document.getElementById("progressFill"),
      progressText: document.getElementById("wordCount"), // reused slot from shared editor-bottom
      saveStatus: document.getElementById("saveStatus"),
      clearDoneBtn: document.getElementById("clearDoneBtn"),
      deleteListBtn: document.getElementById("deleteListBtn"),
      statLists: document.getElementById("statLists"),
      statDone: document.getElementById("statDone"),
    };
  }

  /* ---------- storage ---------- */
  function loadLists() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.warn("NoteTxt: could not read saved lists.", e);
      return {};
    }
  }

  function persistLists() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
    } catch (e) {
      console.warn("NoteTxt: could not save list.", e);
    }
  }

  function makeId(prefix) {
    return (prefix || "i") + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function getType(typeId) {
    return LIST_TYPES.find(function (t) { return t.id === typeId; }) || LIST_TYPES[LIST_TYPES.length - 1];
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  /* ---------- sidebar ---------- */
  function sortedListIds() {
    return Object.keys(lists).sort(function (a, b) {
      return (lists[b].updatedAt || 0) - (lists[a].updatedAt || 0);
    });
  }

  function renderSidebar() {
    if (!els.listsList) return;
    const query = (els.search && els.search.value || "").toLowerCase();
    const ids = sortedListIds().filter(function (id) {
      if (!query) return true;
      return (lists[id].title || "").toLowerCase().indexOf(query) !== -1;
    });

    if (ids.length === 0) {
      els.listsList.innerHTML = `<p class="lists-empty">${query ? "No lists match your search." : "No lists yet. Tap + New list to start."}</p>`;
      return;
    }

    els.listsList.innerHTML = ids.map(function (id) {
      const l = lists[id];
      const type = getType(l.typeId);
      const total = l.items.length;
      const done = l.items.filter(function (i) { return i.checked; }).length;
      const active = id === currentId ? "is-active" : "";
      const title = (l.title && l.title.trim()) || type.label;
      return `<div class="saved-list-card ${active}" data-id="${id}">
        <span class="saved-list-title">${type.icon} ${escapeHtml(title)}</span>
        <span class="saved-list-meta">${total ? `${done} of ${total} done` : "Empty list"}</span>
        <button type="button" class="saved-list-delete" data-id="${id}" aria-label="Delete list ${escapeHtml(title)}">✕</button>
      </div>`;
    }).join("");

    els.listsList.querySelectorAll(".saved-list-card").forEach(function (card) {
      card.addEventListener("click", function (e) {
        if (e.target.closest(".saved-list-delete")) return;
        selectList(card.getAttribute("data-id"));
      });
    });
    els.listsList.querySelectorAll(".saved-list-delete").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        deleteList(btn.getAttribute("data-id"));
      });
    });
  }

  /* ---------- type picker ---------- */
  function renderTypePicker() {
    if (!els.typePicker) return;
    els.typePicker.innerHTML = LIST_TYPES.map(function (t) {
      return `<button type="button" class="type-btn" data-type="${t.id}" data-color="${t.color}">
        <span class="type-icon">${t.icon}</span>${t.label}
      </button>`;
    }).join("");
    els.typePicker.querySelectorAll(".type-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        createNewList(btn.getAttribute("data-type"));
        toggleTypePicker(false);
      });
    });
  }

  function toggleTypePicker(force) {
    if (!els.typePicker || !els.newBtn) return;
    const show = typeof force === "boolean" ? force : els.typePicker.classList.contains("is-hidden");
    els.typePicker.classList.toggle("is-hidden", !show);
    els.newBtn.classList.toggle("is-active", show);
  }

  /* ---------- list selection / creation ---------- */
  function selectList(id) {
    if (!lists[id]) return;
    currentId = id;
    const l = lists[id];
    if (els.titleInput) els.titleInput.value = l.title || "";
    renderTypeBadge();
    renderSidebar();
    renderItems();
    setSaveStatus("saved");
  }

  function createNewList(typeId) {
    const id = makeId("l");
    const type = getType(typeId);
    lists[id] = { title: type.label, typeId: type.id, items: [], updatedAt: Date.now() };
    persistLists();
    currentId = id;
    if (els.titleInput) els.titleInput.value = type.label;
    renderTypeBadge();
    renderSidebar();
    renderItems();
    updateStats();
    setSaveStatus("saved");
    if (els.addInput) els.addInput.focus();
  }

  function deleteList(id) {
    if (!lists[id]) return;
    delete lists[id];
    persistLists();
    if (id === currentId) {
      const remaining = sortedListIds();
      if (remaining.length) {
        selectList(remaining[0]);
      } else {
        currentId = null;
        if (els.titleInput) els.titleInput.value = "";
        renderTypeBadge();
        renderItems();
        setSaveStatus("empty");
      }
    }
    renderSidebar();
    updateStats();
  }

  function renderTypeBadge() {
    if (!els.typeBadge) return;
    if (!currentId || !lists[currentId]) {
      els.typeBadge.textContent = "";
      return;
    }
    const type = getType(lists[currentId].typeId);
    els.typeBadge.innerHTML = `<span aria-hidden="true">${type.icon}</span> ${type.label}`;
  }

  function saveTitle() {
    if (!currentId || !lists[currentId]) return;
    lists[currentId].title = els.titleInput ? els.titleInput.value : "";
    lists[currentId].updatedAt = Date.now();
    persistLists();
    renderSidebar();
    setSaveStatus("saved");
  }

  function queueSave() {
    setSaveStatus("unsaved");
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      if (currentId && lists[currentId]) {
        lists[currentId].updatedAt = Date.now();
        persistLists();
        renderSidebar();
        updateStats();
      }
      setSaveStatus("saved");
    }, 700);
  }

  function setSaveStatus(state) {
    if (!els.saveStatus) return;
    els.saveStatus.classList.remove("is-saved", "is-unsaved");
    if (state === "saved") {
      const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      els.saveStatus.textContent = `Saved at ${time}`;
      els.saveStatus.classList.add("is-saved");
    } else if (state === "unsaved") {
      els.saveStatus.textContent = "Unsaved changes…";
      els.saveStatus.classList.add("is-unsaved");
    } else {
      els.saveStatus.textContent = "No list selected";
    }
  }

  /* ---------- items ---------- */
  function currentItems() {
    return currentId && lists[currentId] ? lists[currentId].items : null;
  }

  function renderItems() {
    if (!els.itemList) return;
    const items = currentItems();

    if (!items) {
      els.itemList.innerHTML = `<p class="items-empty">Pick or create a list to start adding items.</p>`;
      renderProgress();
      return;
    }
    if (items.length === 0) {
      els.itemList.innerHTML = `<p class="items-empty">No items yet. Add your first one above.</p>`;
      renderProgress();
      return;
    }

    els.itemList.innerHTML = items.map(function (item) {
      return `<div class="item-row ${item.checked ? "is-checked" : ""}" draggable="true" data-id="${item.id}">
        <span class="item-drag-handle" aria-hidden="true">⋮⋮</span>
        <input type="checkbox" class="item-checkbox" ${item.checked ? "checked" : ""} aria-label="Mark item complete">
        <input type="text" class="item-text-input" value="${escapeHtml(item.text)}" aria-label="Item text" placeholder="Item">
        <button type="button" class="item-move" data-dir="up" aria-label="Move item up">▲</button>
        <button type="button" class="item-move" data-dir="down" aria-label="Move item down">▼</button>
        <button type="button" class="item-delete" aria-label="Delete item">✕</button>
      </div>`;
    }).join("");

    els.itemList.querySelectorAll(".item-row").forEach(function (row) {
      const id = row.getAttribute("data-id");

      row.querySelector(".item-checkbox").addEventListener("change", function (e) {
        toggleItem(id, e.target.checked);
      });
      row.querySelector(".item-text-input").addEventListener("input", function (e) {
        updateItemText(id, e.target.value);
      });
      row.querySelectorAll(".item-move").forEach(function (btn) {
        btn.addEventListener("click", function () {
          moveItem(id, btn.getAttribute("data-dir"));
        });
      });
      row.querySelector(".item-delete").addEventListener("click", function () {
        deleteItem(id);
      });

      row.addEventListener("dragstart", function () {
        draggedItemId = id;
        row.classList.add("is-dragging");
      });
      row.addEventListener("dragend", function () {
        row.classList.remove("is-dragging");
        draggedItemId = null;
        queueSave();
      });
      row.addEventListener("dragover", function (e) {
        e.preventDefault();
        if (!draggedItemId || draggedItemId === id) return;
        const items2 = currentItems();
        if (!items2) return;
        const fromIdx = items2.findIndex(function (i) { return i.id === draggedItemId; });
        const toIdx = items2.findIndex(function (i) { return i.id === id; });
        if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;
        const moved = items2.splice(fromIdx, 1)[0];
        items2.splice(toIdx, 0, moved);
        renderItems();
      });
    });

    renderProgress();
  }

  function addItem(text) {
    const items = currentItems();
    if (!items || !text.trim()) return;
    items.push({ id: makeId("it"), text: text.trim(), checked: false });
    queueSave();
    renderItems();
  }

  function toggleItem(id, checked) {
    const items = currentItems();
    if (!items) return;
    const item = items.find(function (i) { return i.id === id; });
    if (!item) return;
    item.checked = checked;
    queueSave();
    renderItems();
  }

  function updateItemText(id, text) {
    const items = currentItems();
    if (!items) return;
    const item = items.find(function (i) { return i.id === id; });
    if (!item) return;
    item.text = text;
    queueSave();
  }

  function deleteItem(id) {
    const items = currentItems();
    if (!items) return;
    const idx = items.findIndex(function (i) { return i.id === id; });
    if (idx === -1) return;
    items.splice(idx, 1);
    queueSave();
    renderItems();
  }

  function moveItem(id, dir) {
    const items = currentItems();
    if (!items) return;
    const idx = items.findIndex(function (i) { return i.id === id; });
    if (idx === -1) return;
    const swapWith = dir === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= items.length) return;
    const temp = items[idx];
    items[idx] = items[swapWith];
    items[swapWith] = temp;
    queueSave();
    renderItems();
  }

  function clearCompleted() {
    const items = currentItems();
    if (!items) return;
    const remaining = items.filter(function (i) { return !i.checked; });
    if (!lists[currentId]) return;
    lists[currentId].items = remaining;
    queueSave();
    renderItems();
  }

  function renderProgress() {
    const items = currentItems() || [];
    const total = items.length;
    const done = items.filter(function (i) { return i.checked; }).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    if (els.progressFill) els.progressFill.style.width = pct + "%";
    if (els.progressText) els.progressText.textContent = total ? `${done} of ${total} done` : "0 items";
  }

  /* ---------- stats ---------- */
  function updateStats() {
    const ids = Object.keys(lists);
    if (els.statLists) els.statLists.textContent = String(ids.length);
    let doneCount = 0;
    ids.forEach(function (id) {
      doneCount += lists[id].items.filter(function (i) { return i.checked; }).length;
    });
    if (els.statDone) els.statDone.textContent = String(doneCount);
  }

  /* ---------- init ---------- */
  function init() {
    cacheEls();
    if (!els.itemList || !els.listsList) return; // app not present on this page

    lists = loadLists();
    renderTypePicker();

    if (els.search) {
      els.search.addEventListener("input", renderSidebar);
    }
    if (els.newBtn) {
      els.newBtn.addEventListener("click", function () { toggleTypePicker(); });
    }
    if (els.titleInput) {
      els.titleInput.addEventListener("input", function () {
        setSaveStatus("unsaved");
        clearTimeout(saveTimer);
        saveTimer = setTimeout(saveTitle, 700);
      });
    }
    if (els.addBtn) {
      els.addBtn.addEventListener("click", function () {
        if (els.addInput) {
          addItem(els.addInput.value);
          els.addInput.value = "";
          els.addInput.focus();
        }
      });
    }
    if (els.addInput) {
      els.addInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          addItem(els.addInput.value);
          els.addInput.value = "";
        }
      });
    }
    if (els.clearDoneBtn) {
      els.clearDoneBtn.addEventListener("click", clearCompleted);
    }
    if (els.deleteListBtn) {
      els.deleteListBtn.addEventListener("click", function () {
        if (currentId) deleteList(currentId);
      });
    }

    const existing = sortedListIds();
    if (existing.length) {
      selectList(existing[0]);
    } else {
      renderSidebar();
      renderItems();
      setSaveStatus("empty");
    }
    updateStats();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
