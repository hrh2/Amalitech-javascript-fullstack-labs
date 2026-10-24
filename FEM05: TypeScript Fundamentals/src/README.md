# Field Journal — TypeScript Fundamentals Lab

A type-first, client-side journal app built to the lab spec: strict TypeScript,
Interfaces/Enums/Generics, type-safe localStorage, and type-safe DOM CRUD.

## Setup

```bash
npm install
npx tsc          # compiles src/*.ts -> dist/*.js
```

Then open `index.html` directly in a browser (no bundler or server required —
the compiled files are loaded as native ES modules via `<script type="module">`).

## Project structure

```
journal-app/
├── tsconfig.json      # strict: true, target/module ES2020, rootDir/outDir
├── index.html         # entry point, loads dist/journal.js as a module
├── styles.css         # responsive notebook/ledger UI
└── src/
    ├── types.ts       # Mood enum, JournalEntry interface, Journal/NewEntryInput/EntryUpdate aliases
    ├── storage.ts     # type-safe localStorage read/write + runtime validation
    ├── ui.ts           # all DOM rendering, typed against JournalEntry[]
    └── journal.ts      # generic findByProperty<T>, CRUD logic, event wiring
```

`types.ts` was split out from `journal.ts` so the data contracts can be
imported by `storage.ts` and `ui.ts` without those files depending on the
event-handling code in `journal.ts` — a small modularity improvement over
keeping everything in one file.

## Task checklist

- [x] `Mood` enum (`HAPPY | SAD | MOTIVATED | STRESSED | CALM`)
- [x] `JournalEntry` interface, `Journal` type alias
- [x] `NewEntryInput` (`Omit<JournalEntry, "id" | "timestamp">`) and
      `EntryUpdate` (`Partial<...>`) — utility types instead of hand-rolled duplicates
- [x] Generic `findByProperty<T>(list, key, value)` used by both edit and delete flows
- [x] `storage.ts` parses `localStorage`, handles the `null` case, and
      runtime-validates parsed JSON before trusting it as `JournalEntry[]`
- [x] `addEntry` accepts only the human-supplied fields and fills in
      `id`/`timestamp` itself, so every entry that reaches storage is complete
- [x] Full CRUD (add / edit / delete / filter by mood) in `journal.ts`
- [x] Compiles cleanly with `"strict": true`
- [x] Responsive, mobile-friendly UI

## Where the compiler caught real mistakes

Two examples worth noting from building this (see `strict: true` in
`tsconfig.json`):

1. **Enum mismatch.** Typing a mood as a raw string (`mood: "EXCITED"`)
   instead of `Mood.HAPPY` fails at compile time:
   `Type '"EXCITED"' is not assignable to type 'Mood'`. This is exactly the
   class of bug that would otherwise only surface later, as a silently
   un-styled entry in the UI.

2. **Incomplete object literal.** Building a `JournalEntry` without one of
   its required fields (e.g. forgetting `content`) fails immediately:
   `Property 'content' is missing in type '...' but required in type
   'JournalEntry'`. Without TypeScript this would have shipped as a runtime
   `undefined` rendered straight into the DOM.

Both are caught by `npx tsc` before any code reaches the browser — the
core promise of the "type-first" approach this module teaches.

## Notes on the source material

The `Journal_App.md` you attached looks like it mixes the lab brief with
some unrelated feedback/notes from a different submission (references to
"QGY", "QOOL", "NNU" etc. don't correspond to anything in this lab) — I
built strictly from the actual task list (Data Typing, Generics, Application
Integration, UI Implementation) and ignored that section. Flag it if you
meant to include a different file.
