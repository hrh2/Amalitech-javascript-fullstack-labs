/**
 * journal.ts
 * ---------------------------------------------------------------------
 * Application entry point: business logic (add/edit/delete/filter) and
 * the event handlers that connect the DOM to that logic. Data shape
 * comes from types.ts, persistence from storage.ts, rendering from ui.ts.
 */

import { Journal, JournalEntry, Mood, NewEntryInput, EntryUpdate } from "./types.js";
import { loadEntries, saveEntries } from "./storage.js";
import { renderEntries, populateMoodSelect, populateMoodFilter } from "./ui.js";

/* ------------------------------------------------------------------ */
/* Generic utility                                                     */
/* ------------------------------------------------------------------ */

/**
 * Generic finder: works over any array of objects, as long as `key` is
 * an actual key of that object's type. <T> is inferred from `list`, so
 * calling findByProperty(entries, "id", "123") returns a JournalEntry,
 * while findByProperty(otherList, "name", "x") would return whatever
 * type otherList holds — the compiler enforces `key` and `value` line
 * up with T at every call site.
 */
function findByProperty<T>(list: T[], key: keyof T, value: T[keyof T]): T | undefined {
  return list.find((item) => item[key] === value);
}

/* ------------------------------------------------------------------ */
/* State                                                                */
/* ------------------------------------------------------------------ */

let entries: Journal = loadEntries();
let activeFilter: Mood | "ALL" = "ALL";
let editingId: string | null = null;

/* ------------------------------------------------------------------ */
/* CRUD operations — all explicitly typed in and out                   */
/* ------------------------------------------------------------------ */

/**
 * Accepts only the fields a human can supply (NewEntryInput = the
 * JournalEntry interface minus id/timestamp), and is responsible for
 * filling in the rest so every entry that reaches storage is a
 * complete, valid JournalEntry.
 */
function addEntry(input: NewEntryInput): JournalEntry {
  const entry: JournalEntry = {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    content: input.content.trim(),
    mood: input.mood,
    timestamp: Date.now(),
  };
  entries.push(entry);
  saveEntries(entries);
  return entry;
}

function editEntry(id: string, updates: EntryUpdate): JournalEntry | undefined {
  const existing = findByProperty(entries, "id", id);
  if (!existing) return undefined;

  Object.assign(existing, updates);
  saveEntries(entries);
  return existing;
}

function deleteEntry(id: string): boolean {
  const before = entries.length;
  entries = entries.filter((entry) => entry.id !== id);
  saveEntries(entries);
  return entries.length < before;
}

function filterByMood(filter: Mood | "ALL"): Journal {
  if (filter === "ALL") return entries;
  return entries.filter((entry) => entry.mood === filter);
}

/* ------------------------------------------------------------------ */
/* DOM wiring                                                           */
/* ------------------------------------------------------------------ */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector<HTMLFormElement>("#entry-form");
  const titleInput = document.querySelector<HTMLInputElement>("#entry-title");
  const contentInput = document.querySelector<HTMLTextAreaElement>("#entry-content");
  const moodSelect = document.querySelector<HTMLSelectElement>("#entry-mood");
  const filterSelect = document.querySelector<HTMLSelectElement>("#mood-filter");
  const entriesContainer = document.querySelector<HTMLElement>("#entries");
  const submitButton = document.querySelector<HTMLButtonElement>("#submit-button");
  const cancelEditButton = document.querySelector<HTMLButtonElement>("#cancel-edit");

  if (
    !form ||
    !titleInput ||
    !contentInput ||
    !moodSelect ||
    !filterSelect ||
    !entriesContainer ||
    !submitButton ||
    !cancelEditButton
  ) {
    console.error("journal-app: expected DOM elements were not found.");
    return;
  }

  populateMoodSelect(moodSelect);
  populateMoodFilter(filterSelect);

  function refresh(): void {
    if (!entriesContainer) return;
    renderEntries(entriesContainer, filterByMood(activeFilter));
  }

  function resetForm(): void {
    form!.reset();
    editingId = null;
    submitButton!.textContent = "Save entry";
    cancelEditButton!.hidden = true;
  }

  form.addEventListener("submit", (event: SubmitEvent) => {
    event.preventDefault();

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const mood = moodSelect.value as Mood;

    if (!title || !content) return;

    if (editingId) {
      editEntry(editingId, { title, content, mood });
    } else {
      const input: NewEntryInput = { title, content, mood };
      addEntry(input);
    }

    resetForm();
    refresh();
  });

  cancelEditButton.addEventListener("click", () => {
    resetForm();
  });

  filterSelect.addEventListener("change", () => {
    const value = filterSelect.value;
    activeFilter = value === "ALL" ? "ALL" : (value as Mood);
    refresh();
  });

  // Event delegation for per-entry edit/delete buttons — avoids
  // re-binding listeners every time the list re-renders.
  entriesContainer.addEventListener("click", (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const button = target.closest<HTMLButtonElement>("button[data-action]");
    if (!button) return;

    const entryEl = button.closest<HTMLElement>(".entry");
    const id = entryEl?.dataset.id;
    if (!id) return;

    if (button.dataset.action === "delete") {
      deleteEntry(id);
      if (editingId === id) resetForm();
      refresh();
      return;
    }

    if (button.dataset.action === "edit") {
      const entry = findByProperty(entries, "id", id);
      if (!entry) return;

      titleInput.value = entry.title;
      contentInput.value = entry.content;
      moodSelect.value = entry.mood;
      editingId = entry.id;
      submitButton.textContent = "Update entry";
      cancelEditButton.hidden = false;
      titleInput.focus();
    }
  });

  refresh();
});
