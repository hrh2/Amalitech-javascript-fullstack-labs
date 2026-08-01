// noteManager.js
// Owns the in-memory note data model: creating, updating, deleting,
// archiving, tagging, searching and filtering notes. Has no knowledge
// of the DOM — ui.js is responsible for rendering.

import { saveNotes, loadNotes } from "./storage.js";

export class Note {
  constructor(title, content, tags = [], location = null, categoryId = null) {
    this.id = generateId();
    this.title = title;
    this.content = content;
    this.tags = tags;
    this.archived = false;
    this.timestamp = new Date().toISOString();
    this.location = location; // { city, lat, lng } | null
    this.categoryId = categoryId; // Category.id | null — assignment is 1 note : 1 category
  }

  archive() {
    this.archived = true;
  }

  restore() {
    this.archived = false;
  }

  addTag(tag) {
    const clean = tag.trim();
    if (clean && !this.tags.includes(clean)) {
      this.tags.push(clean);
    }
  }

  removeTag(tag) {
    this.tags = this.tags.filter((t) => t !== tag);
  }
}

function generateId() {
  // crypto.randomUUID is supported in all modern evergreen browsers;
  // fall back to a timestamp+random string otherwise.
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `note_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** In-memory cache of all notes for the current user, hydrated from storage. */
let notes = [];

export const initNotes = () => {
  notes = loadNotes();
  return notes;
};

export const getNotes = () => notes;

export const getNoteById = (id) => notes.find((n) => n.id === id) || null;

export const createNote = (title, content, tags = [], location = null, categoryId = null) => {
  const note = new Note(title, content, tags, location, categoryId);
  notes.unshift(note);
  saveNotes(notes);
  return note;
};

export const updateNote = (id, updates) => {
  const note = getNoteById(id);
  if (!note) return null;
  Object.assign(note, updates, { timestamp: new Date().toISOString() });
  saveNotes(notes);
  return note;
};

export const deleteNote = (id) => {
  notes = notes.filter((n) => n.id !== id);
  saveNotes(notes);
};

export const toggleArchive = (id, archived) => {
  const note = getNoteById(id);
  if (!note) return null;
  note.archived = archived;
  saveNotes(notes);
  return note;
};

/**
 * Adds a batch of already-parsed note objects (e.g. from a JSON import)
 * to the in-memory list and persists it. Imported notes keep their own
 * id/timestamp rather than going through the `Note` constructor, since
 * they're re-entering the app rather than being freshly created.
 *
 * NOTE: this is intentionally minimal for now — structural validation and
 * duplicate detection are handled in later commits on this feature branch.
 */
export const importNotes = (importedNotes) => {
  notes = [...importedNotes, ...notes];
  saveNotes(notes);
  return importedNotes.length;
};

export const searchNotes = (query, sourceList = notes) => {
  const q = query.trim().toLowerCase();
  if (!q) return sourceList;
  return sourceList.filter((n) => {
    return (
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      n.tags.some((t) => t.toLowerCase().includes(q))
    );
  });
};

export const filterByTag = (tag, sourceList = notes) => {
  if (!tag) return sourceList;
  return sourceList.filter((n) => n.tags.includes(tag));
};

export const getAllTags = () => {
  const set = new Set();
  notes.forEach((n) => n.tags.forEach((t) => set.add(t)));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
};

export const getActiveNotes = () => notes.filter((n) => !n.archived);
export const getArchivedNotes = () => notes.filter((n) => n.archived);
