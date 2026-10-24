/**
 * storage.ts
 * ---------------------------------------------------------------------
 * Type-safe persistence layer. This is the ONLY file that touches
 * localStorage directly. Everything coming out of it is validated and
 * asserted to match our Journal shape, and everything going in is
 * serialized deliberately — no `any` leaks past this boundary.
 */
import { Mood } from "./types.js";
const STORAGE_KEY = "journal-app:entries";
/**
 * Runtime check that an unknown value actually looks like a
 * JournalEntry. TypeScript's `as` assertion only affects compile-time
 * checking — data coming out of localStorage is really just `string |
 * null`, so we validate the parsed JSON by hand before we trust it.
 */
function isJournalEntry(value) {
    if (typeof value !== "object" || value === null)
        return false;
    const candidate = value;
    return (typeof candidate.id === "string" &&
        typeof candidate.title === "string" &&
        typeof candidate.content === "string" &&
        typeof candidate.timestamp === "number" &&
        typeof candidate.mood === "string" &&
        Object.values(Mood).includes(candidate.mood));
}
/**
 * Loads the journal from localStorage.
 * - Handles the `null` case (nothing saved yet, or storage cleared).
 * - Handles malformed/corrupted JSON without throwing.
 * - Filters out anything that doesn't pass the JournalEntry shape
 *   check, so a single corrupted record can't crash the whole app.
 */
export function loadEntries() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
        return [];
    }
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed))
            return [];
        return parsed.filter(isJournalEntry);
    }
    catch {
        // Corrupted data in localStorage — fail safe with an empty journal
        // rather than crashing the app on load.
        console.warn("journal-app: could not parse saved entries, resetting.");
        return [];
    }
}
/** Persists the full journal back to localStorage as JSON. */
export function saveEntries(entries) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}
//# sourceMappingURL=storage.js.map