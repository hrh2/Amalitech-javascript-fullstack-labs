/**
 * ui.ts
 * ---------------------------------------------------------------------
 * All DOM manipulation lives here. journal.ts owns the *data*; ui.ts
 * owns turning that data into elements. Every render function is typed
 * to only accept exactly the shape it needs, so there's no way to
 * accidentally hand it something malformed.
 */

import { JournalEntry, Mood } from "./types.js";

/** Small display metadata per mood — kept as a Record so TypeScript
 * forces us to handle every value of the Mood enum, with no gaps. */
const MOOD_META: Record<Mood, { label: string; stamp: string }> = {
  [Mood.HAPPY]: { label: "Happy", stamp: "☺" },
  [Mood.SAD]: { label: "Sad", stamp: "☂" },
  [Mood.MOTIVATED]: { label: "Motivated", stamp: "↑" },
  [Mood.STRESSED]: { label: "Stressed", stamp: "≈" },
  [Mood.CALM]: { label: "Calm", stamp: "○" },
};

function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }) + " · " + date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Populates a <select> with one <option> per Mood, typed against the enum. */
export function populateMoodSelect(select: HTMLSelectElement): void {
  select.innerHTML = "";
  (Object.values(Mood) as Mood[]).forEach((mood) => {
    const option = document.createElement("option");
    option.value = mood;
    option.textContent = `${MOOD_META[mood].stamp} ${MOOD_META[mood].label}`;
    select.appendChild(option);
  });
}

/** Populates the filter <select>, which also needs an "All" option. */
export function populateMoodFilter(select: HTMLSelectElement): void {
  select.innerHTML = "";
  const allOption = document.createElement("option");
  allOption.value = "ALL";
  allOption.textContent = "All entries";
  select.appendChild(allOption);

  (Object.values(Mood) as Mood[]).forEach((mood) => {
    const option = document.createElement("option");
    option.value = mood;
    option.textContent = `${MOOD_META[mood].stamp} ${MOOD_META[mood].label}`;
    select.appendChild(option);
  });
}

/** Builds a single entry "page" element. Delete/edit buttons carry the
 * entry id in a data attribute so journal.ts can wire up delegation. */
function createEntryElement(entry: JournalEntry): HTMLElement {
  const meta = MOOD_META[entry.mood];

  const page = document.createElement("article");
  page.className = "entry";
  page.dataset.id = entry.id;
  // <article> already carries an implicit "article" role — no need to
  // restate it. The accessible name carries mood + date, since the stamp icon and
  // the mood-label chip (hidden on narrow screens) are both decorative.
  page.setAttribute(
    "aria-label",
    `${entry.title}. Mood: ${meta.label}. ${formatTimestamp(entry.timestamp)}.`
  );

  page.innerHTML = `
    <header class="entry__header">
      <span class="entry__stamp" data-mood="${entry.mood}" aria-hidden="true">${meta.stamp}</span>
      <div class="entry__heading">
        <h3 class="entry__title"></h3>
        <time class="entry__date" datetime="${new Date(entry.timestamp).toISOString()}">${formatTimestamp(entry.timestamp)}</time>
      </div>
      <span class="entry__mood-label" aria-hidden="true">${meta.label}</span>
    </header>
    <p class="entry__content"></p>
    <footer class="entry__actions">
      <button type="button" class="entry__edit" data-action="edit">Edit</button>
      <button type="button" class="entry__delete" data-action="delete">Delete</button>
    </footer>
  `;

  // Set title/content via textContent (not innerHTML) so user input
  // is never interpreted as markup — a small but real safety measure.
  const titleEl = page.querySelector<HTMLHeadingElement>(".entry__title");
  const contentEl = page.querySelector<HTMLParagraphElement>(".entry__content");
  if (titleEl) titleEl.textContent = entry.title;
  if (contentEl) contentEl.textContent = entry.content;

  // Give the action buttons an accessible name that doesn't depend on
  // surrounding visual context — important once there are many entries
  // and a screen reader user is tabbing through buttons in isolation.
  const editBtn = page.querySelector<HTMLButtonElement>(".entry__edit");
  const deleteBtn = page.querySelector<HTMLButtonElement>(".entry__delete");
  if (editBtn) editBtn.setAttribute("aria-label", `Edit entry: ${entry.title}`);
  if (deleteBtn) deleteBtn.setAttribute("aria-label", `Delete entry: ${entry.title}`);

  return page;
}

/**
 * Renders the full list of entries into the given container.
 * The parameter is explicitly typed as JournalEntry[] — whatever
 * filtering/sorting happens is the caller's job, this function's only
 * job is to paint exactly what it's given.
 */
export function renderEntries(container: HTMLElement, entries: JournalEntry[]): void {
  container.innerHTML = "";

  if (entries.length === 0) {
    const empty = document.createElement("p");
    empty.className = "entries__empty";
    empty.textContent = "No entries yet. Write the first line above.";
    container.appendChild(empty);
    return;
  }

  const sorted = [...entries].sort((a, b) => b.timestamp - a.timestamp);
  sorted.forEach((entry) => container.appendChild(createEntryElement(entry)));
}
