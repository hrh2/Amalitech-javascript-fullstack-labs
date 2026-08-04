/**
 * types.ts
 * ---------------------------------------------------------------------
 * Every data contract for the Journal App lives here. Nothing in this
 * file touches the DOM or localStorage — it's pure type/shape
 * definitions, so it can be imported anywhere without side effects.
 */

/** The fixed set of moods a journal entry can be tagged with. */
export enum Mood {
  HAPPY = "HAPPY",
  SAD = "SAD",
  MOTIVATED = "MOTIVATED",
  STRESSED = "STRESSED",
  CALM = "CALM",
}

/** The exact shape of a single saved journal entry. */
export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood: Mood;
  timestamp: number;
}

/** A whole journal is just an array of entries. */
export type Journal = JournalEntry[];

/**
 * What the "new entry" form actually gives us: everything a human
 * types, but none of the fields the system is responsible for
 * generating (id, timestamp). Using Omit keeps this in sync with
 * JournalEntry automatically if the interface ever changes.
 */
export type NewEntryInput = Omit<JournalEntry, "id" | "timestamp">;

/**
 * What an edit operation accepts: any subset of the editable fields.
 * Partial<> makes every property optional so callers can update just
 * the title, just the mood, or anything in between.
 */
export type EntryUpdate = Partial<Omit<JournalEntry, "id" | "timestamp">>;
