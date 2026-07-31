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

  inSettings: false,           // top-level: are we viewing the Settings section?
  settingsSubpage: "color-theme", // which sub-page the settings detail pane shows
  settingsDrilledOnMobile: false, // mobile only: showing a sub-page vs. the menu list
  pendingThemeChoice: "light",
  pendingFontChoice: "sans",
};

const els = {
  noteForm: document.getElementById("note-form"),
  emptyState: document.getElementById("empty-state"),
  titleInput: document.getElementById("note-title"),
  contentInput: document.getElementById("note-content"),
  tagsField: document.getElementById("tags-field"),
  saveBtn: document.getElementById("save-btn"),
  saveBtnDesktop: document.getElementById("save-btn-desktop"),
  cancelBtn: document.getElementById("cancel-btn"),
  cancelBtnDesktop: document.getElementById("cancel-btn-desktop"),
  desktopFooter: document.getElementById("desktop-footer"),
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
  listDescription: document.getElementById("list-description"),
  contentHeader: document.getElementById("content-header"),
  statusMeta: document.getElementById("status-meta"),
  statusText: document.getElementById("status-text"),
  noteListCol: document.getElementById("note-list-col"),
  noteDetailCol: document.getElementById("main-content"),
  actionsCol: document.getElementById("actions-col"),
  settingsListCol: document.getElementById("settings-list-col"),
  settingsDetailCol: document.getElementById("settings-detail-col"),
  settingsPageTitle: document.getElementById("settings-page-title"),
};

/* ---------------------------------------------------------
 * Tags field (comma-separated, matches the Figma "Tags" input —
 * no separate Edit button/chip list; the person just types
 * "Work, Planning" directly and we split it on save/autosave).
 * ------------------------------------------------------- */
function getTagsFromField() {
  return els.tagsField.value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function setTagsField(tags) {
  els.tagsField.value = tags.join(", ");
}

/* ---------------------------------------------------------
 * Bootstrapping
 * ------------------------------------------------------- */
function init() {
  ui.hydrateIcons();
  themes.initTheme();
  state.pendingThemeChoice = themes.getThemePref();
  state.pendingFontChoice = themes.getFontPref();
  syncRadioCards();
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

  if (state.filterMode === "archived") {
    els.listDescription.textContent = "All your archived notes are stored here. You can restore or delete them anytime.";
    els.listDescription.hidden = false;
  } else if (state.filterMode === "tag" && state.activeTag) {
    els.listDescription.textContent = `All notes with the "${state.activeTag}" tag are shown here.`;
    els.listDescription.hidden = false;
  } else {
    els.listDescription.hidden = true;
  }

  renderEmptyListBanner(notes);

  document.querySelectorAll("[data-nav]").forEach((btn) => {
    btn.setAttribute("aria-current", String(btn.dataset.nav === state.filterMode));
  });
}

function escapeForBanner(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function renderEmptyListBanner(notes) {
  const banner = document.getElementById("empty-list-banner");
  if (notes.length > 0) {
    banner.hidden = true;
    return;
  }

  if (state.query) {
    banner.innerHTML = "No notes match your search.";
  } else if (state.filterMode === "archived") {
    banner.innerHTML =
      'No notes have been archived yet. Move notes here for safekeeping, or ' +
      '<button type="button" class="banner-link" id="banner-create-note">create a new note.</button>';
  } else if (state.filterMode === "tag" && state.activeTag) {
    banner.innerHTML = `No notes found with the "${escapeForBanner(state.activeTag)}" tag.`;
  } else {
    banner.innerHTML = "You don't have any notes yet. Start a new note to capture your thoughts and ideas.";
  }
  banner.hidden = false;

  document.getElementById("banner-create-note")?.addEventListener("click", () => startNewNote());
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
  els.desktopFooter.hidden = true;
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

  els.emptyState.hidden = true;
  els.noteForm.hidden = false;
  els.saveBtn.hidden = false;
  els.cancelBtn.hidden = false;
  els.desktopFooter.hidden = false;

  els.titleInput.value = note.title;
  els.contentInput.value = note.content;
  setTagsField(note.tags);
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
  els.statusMeta.hidden = !archived;
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
    tags: getTagsFromField(),
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
      setTagsField(draft.tags || []);
    }
  }
}

/* ---------------------------------------------------------
 * Note creation / editing / saving
 * ------------------------------------------------------- */
function startNewNote(draft = null) {
  exitMobileSearch();
  exitSettings();
  const blank = new noteManager.Note(draft?.title ?? "", draft?.content ?? "", draft?.tags ?? [], null);
  blank.id = draft?.id || blank.id;
  renderNoteDetail(blank, { editing: true, isNew: true });
}

function selectNote(id) {
  exitMobileSearch();
  exitSettings();
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
  const tags = getTagsFromField();

  if (state.isNewNote) {
    const note = noteManager.createNote(title, content, tags, state.pendingLocation);
    state.isNewNote = false;
    state.selectedNoteId = note.id;
    ui.showToast("Note saved successfully!");
  } else {
    noteManager.updateNote(state.selectedNoteId, { title, content, tags, location: state.pendingLocation });
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
  exitMobileSearch();
  exitSettings();
  state.filterMode = mode;
  state.activeTag = tag;
  state.query = "";
  document.getElementById("search-input").value = "";
  renderSidebarTags();
  renderList();
  renderEmptyDetail();
  ui.setMobileView(mode === "archived" ? "archived" : "list");
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
 * Mobile search (its own persistent panel, like Tags/Settings)
 * ------------------------------------------------------- */
function exitMobileSearch() {
  document.getElementById("search-input").value = "";
  state.query = "";
  renderList();
}

function enterMobileSearch() {
  exitSettings();
  state.filterMode = "all";
  state.activeTag = null;
  renderSidebarTags();
  renderList();
  els.listTitle.textContent = "Search";
  els.listDescription.hidden = true;
  document.querySelectorAll("[data-nav]").forEach((btn) => btn.setAttribute("aria-current", "false"));
  ui.setMobileView("search");
  document.getElementById("search-input").focus();
}

/* ---------------------------------------------------------
 * Settings section (full page, not a dropdown)
 * ------------------------------------------------------- */
function enterSettings() {
  exitMobileSearch();
  state.inSettings = true;
  state.settingsDrilledOnMobile = false;
  state.pendingThemeChoice = themes.getThemePref();
  state.pendingFontChoice = themes.getFontPref();
  syncRadioCards();

  els.noteListCol.hidden = true;
  els.noteDetailCol.hidden = true;
  els.actionsCol.hidden = true;
  els.settingsListCol.hidden = false;
  els.settingsDetailCol.hidden = false;

  els.listTitle.textContent = "Settings";
  els.listDescription.hidden = true;
  document.querySelectorAll("[data-nav]").forEach((btn) => btn.setAttribute("aria-current", "false"));
  showSettingsSubpage(state.settingsSubpage);
  ui.setMobileView("settings-menu");
}

function exitSettings() {
  if (!state.inSettings) return;
  state.inSettings = false;
  state.settingsDrilledOnMobile = false;
  els.settingsListCol.hidden = true;
  els.settingsDetailCol.hidden = true;
  els.noteListCol.hidden = false;
  els.noteDetailCol.hidden = false;
  els.actionsCol.hidden = false;
}

function showSettingsSubpage(page) {
  state.settingsSubpage = page;
  document.querySelectorAll(".settings-subpage").forEach((el) => {
    el.hidden = el.id !== `${page}-page`;
  });
  document.querySelectorAll("[data-settings-page]").forEach((btn) => {
    btn.setAttribute("aria-current", String(btn.dataset.settingsPage === page));
  });
  els.settingsPageTitle.textContent = page === "font-theme" ? "Font Theme" : "Color Theme";
}

function drillIntoSettingsSubpage(page) {
  showSettingsSubpage(page);
  state.settingsDrilledOnMobile = true;
  ui.setMobileView("settings-page");
}

function backToSettingsMenu() {
  state.settingsDrilledOnMobile = false;
  ui.setMobileView("settings-menu");
}

function syncRadioCards() {
  document.querySelectorAll("[data-theme-choice]").forEach((card) => {
    card.setAttribute("aria-checked", String(card.dataset.themeChoice === state.pendingThemeChoice));
  });
  document.querySelectorAll("[data-font-choice]").forEach((card) => {
    card.setAttribute("aria-checked", String(card.dataset.fontChoice === state.pendingFontChoice));
  });
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

  // Save / Cancel — header (mobile) + footer (desktop/tablet) buttons both wire to the same actions
  [els.saveBtn, els.saveBtnDesktop].forEach((btn) => btn.addEventListener("click", saveCurrentNote));
  [els.cancelBtn, els.cancelBtnDesktop].forEach((btn) => btn.addEventListener("click", cancelEdit));

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

  // Tags field — comma-separated text, parsed on save/autosave
  els.tagsField.addEventListener("input", scheduleDraftSave);

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
      if (target === "list") {
        exitMobileSearch();
        exitSettings();
        state.filterMode = "all";
        state.activeTag = null;
        renderSidebarTags();
        renderList();
        ui.setMobileView("list");
      } else if (target === "archived") {
        setFilterMode("archived");
      } else if (target === "tags") {
        exitMobileSearch();
        exitSettings();
        els.listTitle.textContent = "Tags";
        els.listDescription.hidden = true;
        document.querySelectorAll("[data-nav]").forEach((b) => b.setAttribute("aria-current", "false"));
        ui.setMobileView("tags");
      } else if (target === "search") {
        enterMobileSearch();
      } else if (target === "settings") {
        enterSettings();
      }
    });
  });

  // Settings entry point (gear icon)
  document.getElementById("settings-toggle").addEventListener("click", enterSettings);

  // Settings: drill into a sub-page from the menu list
  document.querySelectorAll("[data-settings-page]").forEach((btn) => {
    btn.addEventListener("click", () => drillIntoSettingsSubpage(btn.dataset.settingsPage));
  });

  // Settings: mobile "< Settings" back link returns to the menu list
  document.getElementById("settings-back-btn").addEventListener("click", backToSettingsMenu);

  // Settings: Color Theme radio cards (staged selection, applied on demand)
  document.getElementById("color-theme-cards").addEventListener("click", (e) => {
    const card = e.target.closest("[data-theme-choice]");
    if (!card) return;
    state.pendingThemeChoice = card.dataset.themeChoice;
    syncRadioCards();
  });
  document.getElementById("apply-theme-btn").addEventListener("click", () => {
    themes.applyTheme(state.pendingThemeChoice);
    ui.showToast("Settings updated successfully!");
  });

  // Settings: Font Theme radio cards (staged selection, applied on demand)
  document.getElementById("font-theme-cards").addEventListener("click", (e) => {
    const card = e.target.closest("[data-font-choice]");
    if (!card) return;
    state.pendingFontChoice = card.dataset.fontChoice;
    syncRadioCards();
  });
  document.getElementById("apply-font-btn").addEventListener("click", () => {
    themes.applyFont(state.pendingFontChoice);
    ui.showToast("Settings updated successfully!");
  });

  // Settings: Change Password (still a focused modal — no reference design for a full page)
  document.getElementById("change-password-btn").addEventListener("click", () => {
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
