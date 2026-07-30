// ui.js
// All DOM-facing rendering logic lives here: turning note/tag data into
// markup, showing toasts, and opening/closing modals with proper focus
// management. noteManager.js and storage.js never import this file —
// data flows one way, from state to DOM.

import { icons } from "./icons.js";

/* ---------------------------------------------------------
 * Icon injection — replace <span data-icon="name"> placeholders
 * ------------------------------------------------------- */
export function hydrateIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach((el) => {
    const name = el.getAttribute("data-icon");
    if (icons[name]) el.innerHTML = icons[name];
  });
}

/* ---------------------------------------------------------
 * Formatting helpers
 * ------------------------------------------------------- */
export function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function highlight(text, query) {
  const safe = escapeHtml(text);
  if (!query) return safe;
  const q = query.trim();
  if (!q) return safe;
  try {
    const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig");
    return safe.replace(re, "<mark>$1</mark>");
  } catch {
    return safe;
  }
}

/* ---------------------------------------------------------
 * Note list rendering
 * ------------------------------------------------------- */
export function renderNoteList(notes, { selectedId = null, query = "" } = {}) {
  const list = document.getElementById("note-list");
  list.innerHTML = "";

  if (notes.length === 0) {
    const li = document.createElement("li");
    li.className = "empty-state";
    li.innerHTML = `<h3>No notes found</h3><p>${query ? "Try a different search term." : "Create your first note to get started."}</p>`;
    list.appendChild(li);
    return;
  }

  notes.forEach((note) => {
    const li = document.createElement("li");
    li.setAttribute("role", "listitem");

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "note-card";
    btn.dataset.noteId = note.id;
    btn.setAttribute("aria-current", String(note.id === selectedId));

    const title = note.title || "Untitled note";
    const tagsHtml = note.tags
      .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
      .join("");

    btn.innerHTML = `
      <h3>${highlight(title, query)}</h3>
      ${note.tags.length ? `<div class="tag-list">${tagsHtml}</div>` : ""}
      <time datetime="${note.timestamp}">${formatDate(note.timestamp)}</time>
    `;
    li.appendChild(btn);
    list.appendChild(li);
  });
}

export function renderAllNotes(notes, opts) {
  renderNoteList(notes, opts);
}

/* ---------------------------------------------------------
 * Tag sidebar rendering (renders into both desktop + mobile lists)
 * ------------------------------------------------------- */
export function updateTagList(tags, activeTag = null) {
  [document.getElementById("tag-nav-list"), document.getElementById("tag-nav-list-mobile")]
    .filter(Boolean)
    .forEach((container) => {
      container.innerHTML = "";
      if (tags.length === 0) {
        const li = document.createElement("li");
        li.innerHTML = `<p class="text-preset-6" style="color:var(--color-text-subtle); padding:8px 12px;">No tags yet</p>`;
        container.appendChild(li);
        return;
      }
      tags.forEach((tag) => {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "tag-nav-btn";
        btn.dataset.tag = tag;
        const isActive = tag === activeTag;
        btn.setAttribute("aria-current", String(isActive));
        btn.innerHTML = `<span data-icon="tag"></span> ${escapeHtml(tag)}${isActive ? '<span class="chevron" data-icon="chevronRight"></span>' : ""}`;
        li.appendChild(btn);
        container.appendChild(li);
      });
      hydrateIcons(container);
    });
}

/* ---------------------------------------------------------
 * Tag editor (chips) inside the note form
 * ------------------------------------------------------- */
export function renderTagEditor(tags) {
  const list = document.getElementById("tag-editor-list");
  list.innerHTML = "";
  tags.forEach((tag) => {
    const li = document.createElement("li");
    li.className = "tag";
    li.innerHTML = `${escapeHtml(tag)} <button type="button" class="tag-remove" data-remove-tag="${escapeHtml(tag)}" aria-label="Remove tag ${escapeHtml(tag)}">${icons.x}</button>`;
    list.appendChild(li);
  });
}

export function renderTagsSummary(tags) {
  const el = document.getElementById("tags-display");
  el.textContent = tags.length ? tags.join(", ") : "No tags";
}

/* ---------------------------------------------------------
 * Toasts
 * ------------------------------------------------------- */
export function showToast(message, { actionLabel = null, onAction = null, duration = 4000 } = {}) {
  const region = document.getElementById("toast-region");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  toast.innerHTML = `
    <span class="toast-icon">${icons.checkCircle}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
    ${actionLabel ? `<button type="button" class="toast-action">${escapeHtml(actionLabel)}</button>` : ""}
    <button type="button" class="toast-close" aria-label="Dismiss notification">${icons.x}</button>
  `;
  region.appendChild(toast);

  const remove = () => toast.remove();
  toast.querySelector(".toast-close").addEventListener("click", remove);
  if (actionLabel) {
    toast.querySelector(".toast-action").addEventListener("click", () => {
      onAction?.();
      remove();
    });
  }
  const timer = setTimeout(remove, duration);
  toast.addEventListener("mouseenter", () => clearTimeout(timer));
}

/* ---------------------------------------------------------
 * Modal focus management
 * ------------------------------------------------------- */
let lastFocusedElement = null;

function getFocusable(container) {
  return Array.from(
    container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => !el.disabled && el.offsetParent !== null);
}

function trapFocus(e, modal) {
  if (e.key !== "Tab") return;
  const focusable = getFocusable(modal);
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

export function openModal(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  lastFocusedElement = document.activeElement;
  overlay.hidden = false;
  const modal = overlay.querySelector(".modal");
  const focusable = getFocusable(modal);
  (focusable[0] || modal).focus();

  const keyHandler = (e) => {
    if (e.key === "Escape") {
      closeModal(id);
    } else {
      trapFocus(e, modal);
    }
  };
  overlay._keyHandler = keyHandler;
  overlay.addEventListener("keydown", keyHandler);
}

export function closeModal(id) {
  const overlay = document.getElementById(id);
  if (!overlay || overlay.hidden) return;
  overlay.hidden = true;
  if (overlay._keyHandler) {
    overlay.removeEventListener("keydown", overlay._keyHandler);
    overlay._keyHandler = null;
  }
  lastFocusedElement?.focus();
}

/* ---------------------------------------------------------
 * Validation helper
 * ------------------------------------------------------- */
export function showValidationError(fieldId, errorId, message) {
  const errorEl = document.getElementById(errorId);
  const field = document.getElementById(fieldId);
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = message ? "flex" : "none";
  }
  if (field) field.setAttribute("aria-invalid", message ? "true" : "false");
}

/* ---------------------------------------------------------
 * View / breadcrumb toggling (mobile)
 * ------------------------------------------------------- */
export function setMobileView(view) {
  document.getElementById("app").dataset.view = view;
  document.querySelectorAll("[data-mobile-nav]").forEach((btn) => {
    btn.setAttribute("aria-current", String(btn.dataset.mobileNav === view));
  });
}

export function toggleArchiveView(isArchived) {
  document.getElementById("list-title").textContent = isArchived ? "Archived Notes" : "All Notes";
}
