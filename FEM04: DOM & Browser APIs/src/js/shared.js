// shared.js
// Powers shared.html: the standalone, read-only view for a note's
// public share link. Deliberately separate from main.js — this page
// has no editing, no auth, and needs to work whether or not anyone is
// logged in when the link is opened.

import { sanitizeRichText } from "./sanitize.js";

const NOTES_KEY_PREFIX = "notes_app:notes:";

/**
 * Notes are stored per logged-in user (see storage.js), and whoever
 * opens a share link may not be logged in as the note's owner — or
 * logged in at all. So a shared note is looked up by scanning every
 * "notes_app:notes:*" bucket in localStorage for a matching shareId,
 * rather than going through the normal per-user storage helpers.
 */
function findNoteByShareId(shareId) {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(NOTES_KEY_PREFIX)) continue;

    let notes;
    try {
      notes = JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      continue;
    }

    const match = notes.find((n) => n.shareId === shareId);
    if (match) return match;
  }
  return null;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function formatTimestamp(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "";
  }
}

function renderNotFound() {
  document.getElementById("shared-not-found").hidden = false;
}

function renderNote(note) {
  document.title = `${note.title || "Untitled note"} — Shared Note`;
  document.getElementById("shared-title").textContent = note.title || "Untitled note";
  document.getElementById("shared-timestamp").textContent = `Last edited ${formatTimestamp(note.timestamp)}`;
  document.getElementById("shared-body").innerHTML = sanitizeRichText(note.content || "");

  const tagsEl = document.getElementById("shared-tags");
  tagsEl.innerHTML = (note.tags || [])
    .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
    .join("");

  document.getElementById("shared-note").hidden = false;
}

function init() {
  const shareId = new URLSearchParams(window.location.search).get("id");
  const note = shareId ? findNoteByShareId(shareId) : null;

  if (note) {
    renderNote(note);
  } else {
    renderNotFound();
  }
}

init();
