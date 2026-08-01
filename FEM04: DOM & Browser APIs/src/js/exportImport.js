// exportImport.js
// Handles moving notes in and out of the app as JSON files.
// Export is implemented here first; import + validation + de-duplication
// land in later commits on this feature branch.

import { getNotes } from "./noteManager.js";

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
