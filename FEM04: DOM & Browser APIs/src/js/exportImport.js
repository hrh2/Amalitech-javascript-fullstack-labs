// exportImport.js
// Handles moving notes in and out of the app as JSON files.
// Export, import, and structural validation are implemented here;
// duplicate prevention on import lands in a later commit on this
// feature branch.

import { getNotes, importNotes } from "./noteManager.js";

const EXPORT_FORMAT_VERSION = 1;

/**
 * Serializes all of the current user's notes into a JSON export payload
 * and triggers a browser download of the resulting file.
 *
 * The payload is wrapped with a small envelope (version + exportedAt)
 * rather than a bare array so that a future import step has something
 * to validate against.
 *
 * @returns {{ count: number, filename: string }} how many notes were
 *   exported and the filename the browser was asked to save as.
 */
export function exportNotesToJson() {
  const notes = getNotes();

  const payload = {
    version: EXPORT_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    notes,
  };

  const json = JSON.stringify(payload, null, 2);
  const filename = `notes-export-${formatDateForFilename(new Date())}.json`;

  downloadJsonFile(json, filename);

  return { count: notes.length, filename };
}

/** Triggers a browser download of `json` as a file named `filename`. */
function downloadJsonFile(json, filename) {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Release the object URL once the download has had a chance to start.
  URL.revokeObjectURL(url);
}

function formatDateForFilename(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Checks that a raw parsed object looks enough like a Note to import.
 * Only `title` and `content` are required — everything else has a safe
 * default — so notes exported by slightly older/newer versions of this
 * app, or hand-edited files, still have a reasonable chance of passing.
 */
function isValidNoteShape(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;
  if (typeof raw.title !== "string") return false;
  if (typeof raw.content !== "string") return false;
  if (raw.tags !== undefined && !isStringArray(raw.tags)) return false;
  if (raw.archived !== undefined && typeof raw.archived !== "boolean") return false;
  if (raw.timestamp !== undefined && Number.isNaN(Date.parse(raw.timestamp))) return false;
  if (raw.location !== undefined && raw.location !== null && typeof raw.location !== "object") return false;
  return true;
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

/**
 * Fills in any missing optional fields on a note that already passed
 * `isValidNoteShape`, so every note handed to `noteManager.importNotes`
 * has a complete, predictable shape.
 */
function normalizeImportedNote(raw) {
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : generateImportId(),
    title: raw.title,
    content: raw.content,
    tags: isStringArray(raw.tags) ? raw.tags : [],
    archived: typeof raw.archived === "boolean" ? raw.archived : false,
    timestamp: raw.timestamp && !Number.isNaN(Date.parse(raw.timestamp)) ? raw.timestamp : new Date().toISOString(),
    location: raw.location && typeof raw.location === "object" ? raw.location : null,
  };
}

function generateImportId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `note_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Splits a raw array of parsed JSON entries into notes that are shaped
 * closely enough to import (normalized to a complete Note-like object)
 * and a count of entries that were rejected.
 *
 * @param {unknown[]} rawNotes
 * @returns {{ valid: object[], invalidCount: number }}
 */
export function validateImportedNotes(rawNotes) {
  const valid = [];
  let invalidCount = 0;

  rawNotes.forEach((raw) => {
    if (isValidNoteShape(raw)) {
      valid.push(normalizeImportedNote(raw));
    } else {
      invalidCount += 1;
    }
  });

  return { valid, invalidCount };
}

/**
 * Reads a File selected by the user (expected to be a previous export),
 * parses it as JSON, validates the notes it contains, and adds whichever
 * of them are shaped like valid notes to the app.
 *
 * Accepts either the `{ version, exportedAt, notes }` envelope this app
 * exports, or a bare array of notes, so files from slightly different
 * sources still have a chance of working. Entries that don't look like
 * valid notes are silently skipped rather than aborting the whole import.
 *
 * Duplicate prevention is handled in a later commit — this step is only
 * responsible for making sure what gets imported is structurally sound.
 *
 * @param {File} file
 * @returns {Promise<{ count: number, skipped: number }>}
 */
export function importNotesFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      let parsed;
      try {
        parsed = JSON.parse(reader.result);
      } catch {
        reject(new Error("That file isn't valid JSON."));
        return;
      }

      const rawNotes = Array.isArray(parsed) ? parsed : parsed?.notes;
      if (!Array.isArray(rawNotes)) {
        reject(new Error("That file doesn't contain any notes to import."));
        return;
      }

      const { valid, invalidCount } = validateImportedNotes(rawNotes);
      if (valid.length === 0) {
        reject(new Error("None of the notes in that file are in a valid format."));
        return;
      }

      const count = importNotes(valid);
      resolve({ count, skipped: invalidCount });
    };

    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsText(file);
  });
}
