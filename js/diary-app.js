/* ===================================================================
   NoteTxt — Online Diary App logic
   Stores entries in the browser's localStorage. Nothing leaves
   the device; there is no server or account behind this tool.
   =================================================================== */
(function () {
  "use strict";

  const STORAGE_KEY = "notetxt-online-diary-v1";
  const MOODS = ["😊", "😐", "😢", "😡", "😴", "❤️"];
  const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  let entries = {};
  let viewDate = new Date();           // month/year currently shown on the calendar
  let selectedDate = formatKey(new Date()); // YYYY-MM-DD currently loaded in the editor
  let selectedMood = "";
  let autoSaveTimer = null;

  /* ---------- storage helpers ---------- */
  function loadEntries() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.warn("NoteTxt: could not read saved diary entries.", e);
      return {};
    }
  }

  function persistEntries() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
      console.warn("NoteTxt: could not save diary entry.", e);
    }
  }

  function formatKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  /* ---------- DOM refs (assigned on init) ---------- */
  let els = {};

  function cacheEls() {
    els = {
      calMonthLabel: document.getElementById("calMonthLabel"),
      calendarGrid: document.getElementById("calendarGrid"),
      calPrev: document.getElementById("calPrev"),
      calNext: document.getElementById("calNext"),
      entryDate: document.getElementById("entryDate"),
      moodPicker: document.getElementById("moodPicker"),
      entryText: document.getElementById("entryText"),
      wordCount: document.getElementById("wordCount"),
      saveStatus: document.getElementById("saveStatus"),
      saveBtn: document.getElementById("saveEntryBtn"),
      deleteBtn: document.getElementById("deleteEntryBtn"),
      statCount: document.getElementById("statCount"),
      statStreak: document.getElementById("statStreak"),
    };
  }

  /* ---------- calendar ---------- */
  function renderCalendar() {
    if (!els.calendarGrid) return;

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    els.calMonthLabel.textContent = `${MONTHS[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayKey = formatKey(new Date());

    let html = "";
    for (let i = 0; i < firstDay; i++) {
      html += `<button class="cal-day is-empty" tabindex="-1"></button>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const key = formatKey(dateObj);
      const hasEntry = !!entries[key];
      const isToday = key === todayKey;
      const isSelected = key === selectedDate;

      const classes = ["cal-day"];
      if (hasEntry) classes.push("has-entry");
      if (isToday) classes.push("is-today");
      if (isSelected) classes.push("is-selected");

      html += `<button type="button" class="${classes.join(" ")}" data-date="${key}" aria-label="${MONTHS[month]} ${day}, ${year}${hasEntry ? ", has an entry" : ""}">
        ${day}${hasEntry ? '<span class="entry-dot" aria-hidden="true"></span>' : ""}
      </button>`;
    }

    els.calendarGrid.innerHTML = html;

    els.calendarGrid.querySelectorAll(".cal-day:not(.is-empty)").forEach(function (btn) {
      btn.addEventListener("click", function () {
        selectDate(btn.getAttribute("data-date"));
      });
    });
  }

  /* ---------- editor ---------- */
  function selectDate(key) {
    selectedDate = key;
    const dateObj = new Date(key + "T00:00:00");

    // Keep the calendar in sync if the picked date is in a different month
    if (dateObj.getMonth() !== viewDate.getMonth() || dateObj.getFullYear() !== viewDate.getFullYear()) {
      viewDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
    }

    if (els.entryDate) els.entryDate.value = key;

    const entry = entries[key];
    selectedMood = entry ? entry.mood || "" : "";
    if (els.entryText) els.entryText.value = entry ? entry.text || "" : "";

    renderMoodPicker();
    renderCalendar();
    updateWordCount();
    setSaveStatus(entry ? "saved" : "empty");
  }

  function renderMoodPicker() {
    if (!els.moodPicker) return;
    els.moodPicker.innerHTML = MOODS.map(function (m) {
      const selected = m === selectedMood ? "is-selected" : "";
      return `<button type="button" class="mood-btn ${selected}" data-mood="${m}" aria-label="Mood ${m}" aria-pressed="${m === selectedMood}">${m}</button>`;
    }).join("");

    els.moodPicker.querySelectorAll(".mood-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const mood = btn.getAttribute("data-mood");
        selectedMood = selectedMood === mood ? "" : mood;
        renderMoodPicker();
        queueAutoSave();
      });
    });
  }

  function updateWordCount() {
    if (!els.entryText || !els.wordCount) return;
    const text = els.entryText.value.trim();
    const words = text.length ? text.split(/\s+/).length : 0;
    els.wordCount.textContent = `${words} word${words === 1 ? "" : "s"}`;
  }

  function setSaveStatus(state) {
    if (!els.saveStatus) return;
    els.saveStatus.classList.remove("is-saved", "is-unsaved");
    if (state === "saved") {
      const now = new Date();
      const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      els.saveStatus.textContent = `Saved at ${time}`;
      els.saveStatus.classList.add("is-saved");
    } else if (state === "unsaved") {
      els.saveStatus.textContent = "Unsaved changes…";
      els.saveStatus.classList.add("is-unsaved");
    } else if (state === "deleted") {
      els.saveStatus.textContent = "Entry deleted";
    } else {
      els.saveStatus.textContent = "No entry yet for this day";
    }
  }

  function queueAutoSave() {
    setSaveStatus("unsaved");
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(saveCurrentEntry, 1100);
  }

  function saveCurrentEntry() {
    const text = els.entryText ? els.entryText.value : "";
    if (!text.trim() && !selectedMood) {
      // nothing to save; treat as empty/deleted state instead of saving blanks
      if (entries[selectedDate]) {
        delete entries[selectedDate];
        persistEntries();
        renderCalendar();
        updateStats();
      }
      setSaveStatus("empty");
      return;
    }

    entries[selectedDate] = {
      text: text,
      mood: selectedMood,
      updatedAt: Date.now(),
    };
    persistEntries();
    renderCalendar();
    updateStats();
    setSaveStatus("saved");
  }

  function deleteCurrentEntry() {
    if (!entries[selectedDate]) return;
    delete entries[selectedDate];
    persistEntries();
    if (els.entryText) els.entryText.value = "";
    selectedMood = "";
    renderMoodPicker();
    renderCalendar();
    updateWordCount();
    updateStats();
    setSaveStatus("deleted");
  }

  /* ---------- stats ---------- */
  function updateStats() {
    const keys = Object.keys(entries);
    if (els.statCount) els.statCount.textContent = String(keys.length);

    // streak: consecutive days with entries, counting back from today
    let streak = 0;
    let cursor = new Date();
    while (entries[formatKey(cursor)]) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    if (els.statStreak) els.statStreak.textContent = String(streak);
  }

  /* ---------- init ---------- */
  function init() {
    cacheEls();
    if (!els.calendarGrid) return; // app not present on this page

    entries = loadEntries();

    if (els.entryDate) {
      els.entryDate.value = selectedDate;
      els.entryDate.addEventListener("change", function () {
        if (els.entryDate.value) selectDate(els.entryDate.value);
      });
    }

    if (els.calPrev) {
      els.calPrev.addEventListener("click", function () {
        viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
        renderCalendar();
      });
    }
    if (els.calNext) {
      els.calNext.addEventListener("click", function () {
        viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
        renderCalendar();
      });
    }

    if (els.entryText) {
      els.entryText.addEventListener("input", function () {
        updateWordCount();
        queueAutoSave();
      });
    }

    if (els.saveBtn) {
      els.saveBtn.addEventListener("click", function () {
        clearTimeout(autoSaveTimer);
        saveCurrentEntry();
      });
    }

    if (els.deleteBtn) {
      els.deleteBtn.addEventListener("click", deleteCurrentEntry);
    }

    selectDate(selectedDate);
    updateStats();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
