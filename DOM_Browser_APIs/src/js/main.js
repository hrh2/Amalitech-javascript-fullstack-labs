// main.js
// Application entry point. Wires storage.js, noteManager.js, themes.js,
// auth.js and ui.js together, owns the small bit of view state, and
// attaches all event listeners (using event delegation wherever a list
// of similar items is involved).

import * as storage from "./storage.js";
import * as noteManager from "./noteManager.js";
import * as ui from "./ui.js";
import * as themes from "./themes.js";
import * as auth from "./auth.js";

auth.requireAuth();

/* ---------------------------------------------------------
 * View state
 * ------------------------------------------------------- */
const state = {
  filterMode: "all",       // "all" | "archived" | "tag"
  activeTag: null,
  query: "",
  selectedNoteId: null,
  isEditing: false,
  isNewNote: false,
  pendingLocation: null,
  pendingDeleteId: null,
  pendingArchiveId: null,
  pendingRestoreId: null,
};

const els = {
  noteForm: document.getElementById("note-form"),
  emptyState: document.getElementById("empty-state"),
  titleInput: document.getElementById("note-title"),
  contentInput: document.getElementById("note-content"),
  tagInput: document.getElementById("tag-input"),
  saveBtn: document.getElementById("save-btn"),
  saveBtnMobile: document.getElementById("save-btn-mobile"),
  cancelBtn: document.getElementById("cancel-btn"),
  cancelBtnMobile: document.getElementById("cancel-btn-mobile"),
  mobileFooter: document.getElementById("mobile-footer"),
  archiveBtn: document.getElementById("archive-btn"),
  deleteBtn: document.getElementById("delete-btn"),
  archiveIconBtn: document.getElementById("archive-icon-btn"),
  deleteIconBtn: document.getElementById("delete-icon-btn"),
  iconActions: document.getElementById("icon-actions"),
  lastEditedText: document.getElementById("last-edited-text"),
  locationMeta: document.getElementById("location-meta"),
  locationText: document.getElementById("location-text"),
  addLocationBtn: document.getElementById("add-location-btn"),
  listTitle: document.getElementById("list-title"),
};

let draftTags = [];

/* ---------------------------------------------------------
 * Bootstrapping
 * ------------------------------------------------------- */
function init() {
  ui.hydrateIcons();
  themes.initTheme();
  syncThemeMenuState();
  noteManager.initNotes();
  renderSidebarTags();
  renderList();
  renderEmptyDetail();
  attachEventListeners();
  maybeRestoreDraft();
}

/* ---------------------------------------------------------
 * Derived data / rendering
 * ------------------------------------------------------- */
function getFilteredNotes() {
  let source =
    state.filterMode === "archived" ? noteManager.getArchivedNotes() : noteManager.getActiveNotes();

  if (state.filterMode === "tag" && state.activeTag) {
    source = noteManager.filterByTag(state.activeTag, source);
  }
  if (state.query) {
    source = noteManager.searchNotes(state.query, source);
  }
  return source;
}

function renderList() {
  const notes = getFilteredNotes();
  ui.renderNoteList(notes, { selectedId: state.selectedNoteId, query: state.query });
  ui.hydrateIcons(document.getElementById("note-list"));

  const titleMap = {
    all: "All Notes",
    archived: "Archived Notes",
    tag: `Notes Tagged: ${state.activeTag ?? ""}`,
  };
  els.listTitle.textContent = titleMap[state.filterMode] ?? "All Notes";

  document.querySelectorAll("[data-nav]").forEach((btn) => {
    btn.setAttribute("aria-current", String(btn.dataset.nav === state.filterMode));
  });
}

function renderSidebarTags() {
  const tags = noteManager.getAllTags();
  ui.updateTagList(tags, state.filterMode === "tag" ? state.activeTag : null);
}

function renderEmptyDetail() {
  els.emptyState.hidden = false;
  els.noteForm.hidden = true;
  els.saveBtn.hidden = true;
  els.cancelBtn.hidden = true;
  els.mobileFooter.hidden = true;
  els.archiveBtn.hidden = true;
  els.deleteBtn.hidden = true;
  els.archiveIconBtn.hidden = true;
  els.deleteIconBtn.hidden = true;
  state.selectedNoteId = null;
  state.isEditing = false;
}

function renderNoteDetail(note, { editing = false, isNew = false } = {}) {
  state.selectedNoteId = note.id;
  state.isEditing = editing;
  state.isNewNote = isNew;
  state.pendingLocation = note.location || null;
  draftTags = [...note.tags];

  els.emptyState.hidden = true;
  els.noteForm.hidden = false;
  els.saveBtn.hidden = false;
  els.cancelBtn.hidden = false;
  els.mobileFooter.hidden = false;

  els.titleInput.value = note.title;
  els.contentInput.value = note.content;
  ui.renderTagEditor(draftTags);
  ui.showValidationError("note-title", "title-error", "");

  els.lastEditedText.textContent = isNew
    ? "Not saved yet"
    : `Last edited ${ui.formatDate(note.timestamp)}`;

  if (note.location) {
    els.locationMeta.hidden = false;
    els.locationText.textContent = note.location.label;
  } else {
    els.locationMeta.hidden = true;
  }

  const archived = !!note.archived;
  els.archiveBtn.hidden = isNew;
  els.deleteBtn.hidden = isNew;
  els.archiveIconBtn.hidden = isNew;
  els.deleteIconBtn.hidden = isNew;
  document.getElementById("archive-btn-label").textContent = archived ? "Restore Note" : "Archive Note";

  ui.setMobileView("detail");
  window.requestAnimationFrame(() => els.titleInput.focus());
}

function currentDraft() {
  return {
    id: state.selectedNoteId,
    title: els.titleInput.value,
    content: els.contentInput.value,
    tags: draftTags,
    isNew: state.isNewNote,
  };
}

/* ---------------------------------------------------------
 * Draft autosave (sessionStorage) — Browser API requirement
 * ------------------------------------------------------- */
let draftTimer = null;
function scheduleDraftSave() {
  clearTimeout(draftTimer);
  draftTimer = setTimeout(() => {
    if (state.isEditing) storage.saveDraft(currentDraft());
  }, 300);
}

function maybeRestoreDraft() {
  const draft = storage.loadDraft();
  if (!draft) return;
  const hasContent = draft.title?.trim() || draft.content?.trim() || draft.tags?.length;
  if (!hasContent) return;

  ui.showToast("We restored an unsaved draft from your last session.", {
    actionLabel: "Discard",
    onAction: () => {
      storage.clearDraft();
      renderEmptyDetail();
    },
  });

  if (draft.isNew) {
    startNewNote(draft);
  } else {
    const existing = noteManager.getNoteById(draft.id);
    if (existing) {
      renderNoteDetail(existing, { editing: true, isNew: false });
      els.titleInput.value = draft.title;
      els.contentInput.value = draft.content;
      draftTags = draft.tags || [];
      ui.renderTagEditor(draftTags);
    }
  }
}

/* ---------------------------------------------------------
 * Note creation / editing / saving
 * ------------------------------------------------------- */
function startNewNote(draft = null) {
  const blank = new noteManager.Note(draft?.title ?? "", draft?.content ?? "", draft?.tags ?? [], null);
  blank.id = draft?.id || blank.id;
  renderNoteDetail(blank, { editing: true, isNew: true });
}

function selectNote(id) {
  const note = noteManager.getNoteById(id);
  if (!note) return;
  storage.clearDraft();
  renderNoteDetail(note, { editing: false, isNew: false });
}

function validateForm() {
  const title = els.titleInput.value.trim();
  if (!title) {
    ui.showValidationError("note-title", "title-error", "Give your note a title before saving.");
    return false;
  }
  ui.showValidationError("note-title", "title-error", "");
  return true;
}

function saveCurrentNote() {
  if (!validateForm()) {
    els.titleInput.focus();
    return;
  }
  const title = els.titleInput.value.trim();
  const content = els.contentInput.value;

  if (state.isNewNote) {
    const note = noteManager.createNote(title, content, draftTags, state.pendingLocation);
    state.isNewNote = false;
    state.selectedNoteId = note.id;
    ui.showToast("Note saved successfully!");
  } else {
    noteManager.updateNote(state.selectedNoteId, { title, content, tags: draftTags, location: state.pendingLocation });
    ui.showToast("Note saved successfully!");
  }

  storage.clearDraft();
  state.isEditing = false;
  renderSidebarTags();
  renderList();
  const saved = noteManager.getNoteById(state.selectedNoteId);
  renderNoteDetail(saved, { editing: false, isNew: false });
  ui.setMobileView("list");
}

function cancelEdit() {
  storage.clearDraft();
  if (state.isNewNote) {
    renderEmptyDetail();
    ui.setMobileView("list");
    return;
  }
  const note = noteManager.getNoteById(state.selectedNoteId);
  if (note) {
    renderNoteDetail(note, { editing: false, isNew: false });
  } else {
    renderEmptyDetail();
  }
  ui.setMobileView("list");
}

/* ---------------------------------------------------------
 * Delete / archive / restore (with confirmation modals)
 * ------------------------------------------------------- */
function requestDelete(id) {
  state.pendingDeleteId = id;
  ui.openModal("delete-modal");
}
function requestArchive(id) {
  const note = noteManager.getNoteById(id);
  if (note?.archived) {
    state.pendingRestoreId = id;
    ui.openModal("restore-modal");
  } else {
    state.pendingArchiveId = id;
    ui.openModal("archive-modal");
  }
}

function confirmDelete() {
  noteManager.deleteNote(state.pendingDeleteId);
  ui.closeModal("delete-modal");
  ui.showToast("Note permanently deleted.");
  renderSidebarTags();
  renderList();
  renderEmptyDetail();
  ui.setMobileView("list");
}

function confirmArchive() {
  noteManager.toggleArchive(state.pendingArchiveId, true);
  ui.closeModal("archive-modal");
  ui.showToast("Note archived.", {
    actionLabel: "Archived Notes",
    onAction: () => setFilterMode("archived"),
  });
  renderSidebarTags();
  renderList();
  renderEmptyDetail();
  ui.setMobileView("list");
}

function confirmRestore() {
  noteManager.toggleArchive(state.pendingRestoreId, false);
  ui.closeModal("restore-modal");
  ui.showToast("Note restored to active notes.", {
    actionLabel: "All Notes",
    onAction: () => setFilterMode("all"),
  });
  renderSidebarTags();
  renderList();
  renderEmptyDetail();
  ui.setMobileView("list");
}

/* ---------------------------------------------------------
 * Filters / search / tags
 * ------------------------------------------------------- */
function setFilterMode(mode, tag = null) {
  state.filterMode = mode;
  state.activeTag = tag;
  state.query = "";
  document.getElementById("search-input").value = "";
  renderSidebarTags();
  renderList();
  renderEmptyDetail();
  ui.setMobileView("list");
}

let searchDebounce = null;
function handleSearchInput(value) {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    state.query = value;
    renderList();
  }, 150);
}

/* ---------------------------------------------------------
 * Tags editor (chips inside the form)
 * ------------------------------------------------------- */
function addTagFromInput() {
  const value = els.tagInput.value.trim().replace(/,$/, "");
  if (!value) return;
  if (!draftTags.includes(value)) {
    draftTags.push(value);
    ui.renderTagEditor(draftTags);
    scheduleDraftSave();
    ui.showToast("Tag added successfully!");
  }
  els.tagInput.value = "";
}

function removeTag(tag) {
  draftTags = draftTags.filter((t) => t !== tag);
  ui.renderTagEditor(draftTags);
  scheduleDraftSave();
  ui.showToast("Tag removed successfully!");
}

/* ---------------------------------------------------------
 * Geolocation (bonus Browser API)
 * ------------------------------------------------------- */
function requestLocation() {
  if (!("geolocation" in navigator)) {
    ui.showToast("Geolocation isn't supported in this browser.");
    return;
  }
  els.addLocationBtn.disabled = true;
  els.addLocationBtn.textContent = "Locating…";
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      state.pendingLocation = {
        lat: latitude,
        lng: longitude,
        label: `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`,
      };
      els.locationMeta.hidden = false;
      els.locationText.textContent = state.pendingLocation.label;
      resetLocationBtn();
      scheduleDraftSave();
      ui.showToast("Location added to note.");
    },
    (err) => {
      resetLocationBtn();
      const message =
        err.code === err.PERMISSION_DENIED
          ? "Location permission was denied."
          : "Couldn't determine your location.";
      ui.showToast(message);
    },
    { timeout: 8000 }
  );
}
function resetLocationBtn() {
  els.addLocationBtn.disabled = false;
  els.addLocationBtn.innerHTML = `<span data-icon="mapPin"></span> Add my location`;
  ui.hydrateIcons(els.addLocationBtn);
}

/* ---------------------------------------------------------
 * Settings dropdown / theme / font / password / logout
 * ------------------------------------------------------- */
function syncThemeMenuState() {
  const theme = document.documentElement.getAttribute("data-theme") || "light";
  const font = document.documentElement.getAttribute("data-font") || "sans";
  document.querySelectorAll("[data-theme-choice]").forEach((btn) => {
    btn.setAttribute("aria-checked", String(btn.dataset.themeChoice === theme));
  });
  document.querySelectorAll("[data-font-choice]").forEach((btn) => {
    btn.setAttribute("aria-checked", String(btn.dataset.fontChoice === font));
  });
}

function closeAllMenus() {
  ["settings-panel", "color-theme-submenu", "font-theme-submenu"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.hidden = true;
  });
  document.getElementById("settings-toggle")?.setAttribute("aria-expanded", "false");
  document.getElementById("color-theme-toggle")?.setAttribute("aria-expanded", "false");
  document.getElementById("font-theme-toggle")?.setAttribute("aria-expanded", "false");
}

/* ---------------------------------------------------------
 * Event listeners (uses delegation for repeated list items)
 * ------------------------------------------------------- */
function attachEventListeners() {
  // Sidebar nav (All Notes / Archived)
  document.querySelectorAll("[data-nav]").forEach((btn) => {
    btn.addEventListener("click", () => setFilterMode(btn.dataset.nav));
  });

  // Tag lists — delegate on the shared parent, works for desktop + mobile
  [document.getElementById("tag-nav-list"), document.getElementById("tag-nav-list-mobile")].forEach(
    (list) => {
      list?.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-tag]");
        if (!btn) return;
        setFilterMode("tag", btn.dataset.tag);
      });
    }
  );

  // Note list — event delegation: one listener handles every note card
  document.getElementById("note-list").addEventListener("click", (e) => {
    const card = e.target.closest("[data-note-id]");
    if (!card) return;
    selectNote(card.dataset.noteId);
  });

  // Search
  document.getElementById("search-form").addEventListener("submit", (e) => e.preventDefault());
  document.getElementById("search-input").addEventListener("input", (e) => handleSearchInput(e.target.value));

  // Create note
  document.getElementById("create-note-btn").addEventListener("click", () => startNewNote());
  document.getElementById("fab-create").addEventListener("click", () => startNewNote());

  // Save / Cancel (desktop + mobile duplicate buttons)
  [els.saveBtn, els.saveBtnMobile].forEach((btn) => btn.addEventListener("click", saveCurrentNote));
  [els.cancelBtn, els.cancelBtnMobile].forEach((btn) => btn.addEventListener("click", cancelEdit));

  // Back button (mobile)
  document.getElementById("back-btn").addEventListener("click", () => {
    ui.setMobileView("list");
  });

  // Archive / Delete (desktop actions column + mobile icon buttons)
  els.archiveBtn.addEventListener("click", () => requestArchive(state.selectedNoteId));
  els.deleteBtn.addEventListener("click", () => requestDelete(state.selectedNoteId));
  els.archiveIconBtn.addEventListener("click", () => requestArchive(state.selectedNoteId));
  els.deleteIconBtn.addEventListener("click", () => requestDelete(state.selectedNoteId));

  document.getElementById("confirm-delete-btn").addEventListener("click", confirmDelete);
  document.getElementById("confirm-archive-btn").addEventListener("click", confirmArchive);
  document.getElementById("confirm-restore-btn").addEventListener("click", confirmRestore);

  // Generic modal cancel buttons
  document.querySelectorAll("[data-modal-cancel]").forEach((btn) => {
    btn.addEventListener("click", () => ui.closeModal(btn.dataset.modalCancel));
  });
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) ui.closeModal(overlay.id);
    });
  });

  els.noteForm.addEventListener("submit", (e) => e.preventDefault());

  // Live form inputs -> validation + draft autosave
  els.titleInput.addEventListener("input", () => {
    if (els.titleInput.value.trim()) ui.showValidationError("note-title", "title-error", "");
    scheduleDraftSave();
  });
  els.titleInput.addEventListener("blur", validateForm);
  els.titleInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveCurrentNote();
    }
  });
  els.contentInput.addEventListener("input", scheduleDraftSave);

  // Tag input (Enter or comma commits a tag)
  els.tagInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTagFromInput();
    }
  });
  document.getElementById("tag-editor-list").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-remove-tag]");
    if (!btn) return;
    removeTag(btn.dataset.removeTag);
  });

  // Escape cancels an in-progress edit (when no modal is open)
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const modalOpen = Array.from(document.querySelectorAll(".modal-overlay")).some((o) => !o.hidden);
    if (!modalOpen && state.isEditing) cancelEdit();
  });

  // Geolocation
  els.addLocationBtn.addEventListener("click", requestLocation);

  // Mobile bottom navigation
  document.querySelectorAll("[data-mobile-nav]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.mobileNav;
      if (target === "list") { state.filterMode = "all"; state.activeTag = null; renderSidebarTags(); renderList(); ui.setMobileView("list"); }
      else if (target === "archived") setFilterMode("archived");
      else if (target === "tags") ui.setMobileView("tags");
      else if (target === "search") { ui.setMobileView("list"); document.getElementById("search-input").focus(); }
      else if (target === "settings") { toggleSettingsPanel(); }
    });
  });

  // Settings dropdown
  const settingsToggle = document.getElementById("settings-toggle");
  const settingsPanel = document.getElementById("settings-panel");
  settingsToggle.addEventListener("click", () => toggleSettingsPanel());

  function toggleSettingsPanel() {
    const isOpen = !settingsPanel.hidden;
    closeAllMenus();
    if (!isOpen) {
      settingsPanel.hidden = false;
      settingsToggle.setAttribute("aria-expanded", "true");
      settingsPanel.querySelector(".dropdown-item")?.focus();
    }
  }

  document.addEventListener("click", (e) => {
    if (!e.target.closest("#settings-dropdown")) closeAllMenus();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAllMenus();
  });

  document.getElementById("color-theme-toggle").addEventListener("click", (e) => {
    e.stopPropagation();
    const submenu = document.getElementById("color-theme-submenu");
    const willOpen = submenu.hidden;
    document.getElementById("font-theme-submenu").hidden = true;
    submenu.hidden = !willOpen;
    e.currentTarget.setAttribute("aria-expanded", String(willOpen));
  });
  document.getElementById("font-theme-toggle").addEventListener("click", (e) => {
    e.stopPropagation();
    const submenu = document.getElementById("font-theme-submenu");
    const willOpen = submenu.hidden;
    document.getElementById("color-theme-submenu").hidden = true;
    submenu.hidden = !willOpen;
    e.currentTarget.setAttribute("aria-expanded", String(willOpen));
  });

  document.querySelectorAll("[data-theme-choice]").forEach((btn) => {
    btn.addEventListener("click", () => {
      themes.applyTheme(btn.dataset.themeChoice);
      syncThemeMenuState();
      ui.showToast("Settings updated successfully!");
      closeAllMenus();
    });
  });
  document.querySelectorAll("[data-font-choice]").forEach((btn) => {
    btn.addEventListener("click", () => {
      themes.applyFont(btn.dataset.fontChoice);
      syncThemeMenuState();
      ui.showToast("Settings updated successfully!");
      closeAllMenus();
    });
  });

  document.getElementById("change-password-btn").addEventListener("click", () => {
    closeAllMenus();
    document.getElementById("password-form").reset();
    ui.showValidationError("new-password", "password-error", "");
    ui.openModal("password-modal");
  });

  document.getElementById("password-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const current = document.getElementById("current-password").value;
    const next = document.getElementById("new-password").value;
    if (next.length < 8) {
      const err = document.getElementById("password-error");
      err.textContent = "New password must be at least 8 characters.";
      err.style.display = "block";
      return;
    }
    const result = auth.changePassword(current, next);
    const err = document.getElementById("password-error");
    if (!result.ok) {
      err.textContent = result.error;
      err.style.display = "block";
      return;
    }
    err.style.display = "none";
    ui.closeModal("password-modal");
    ui.showToast("Password changed successfully!");
  });

  document.getElementById("logout-btn").addEventListener("click", () => {
    auth.logout();
  });
}

init();
