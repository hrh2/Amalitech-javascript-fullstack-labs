# FEM15 TA Review Prep — Reactive Recipe Finder (Angular Signals)

Project location: `FEM15-Angular-Signals/recipe-finder-app/`

---

## 1. Project Overview

A single-screen **Recipe Finder**: a static catalog of recipes, a search box, a max-cook-time slider, and a
favorites toggle — every visible list, count, and empty-state message is *derived* from a small set of Signals, with
no manual "recalculate and store" bookkeeping anywhere.

**Why this app is built around Signals, not RxJS or plain properties:** the whole point of the lab is fine-grained,
pull-based reactive state (Module 7). Typing in the search box or dragging the slider should update exactly the
things that depend on that value — the filtered list, the result count, a couple of `effect()`-driven side
effects — without Angular re-checking the entire component tree the way its default change-detection walk would.
Signals make that dependency tracking automatic: `computed()`/`effect()` know what they depend on simply because
they *read* it.

The lab exists specifically to practice: `signal()` + `.set()`/`.update()`, chained `computed()` derivations,
`effect()` for genuine side effects (logging, `localStorage` persistence), and signal-based component inputs
(`input()`/`input.required()`) on a component built fresh for Signals rather than retrofitted from `@Input()`.

---

## 2. Project Structure

```
src/app/
├── app.ts/html/css                      Root shell — renders <app-recipe-finder>, nothing else
├── app.config.ts                        provideBrowserGlobalErrorListeners() only — no router, no HttpClient
│
├── core/
│   └── models/
│       └── recipe.model.ts              Recipe interface (id, name, ingredients, cookTimeMinutes, image)
│
├── shared/
│   └── ui/
│       └── recipe-card/                 Presentational card: signal-based inputs, @Output() for the favorite click
│
└── features/
    └── recipe-finder/
        └── recipe-finder.ts/html/css    All state lives here: the static RECIPES array, every signal/computed/
                                          effect, and the search/filter/grid/empty-state template
```

**Why no `core/services/` or `core/guards/`:** the task specification is explicit — *"No routing, services, or
async API calls — use static data defined in the component file."* `RECIPES` is a plain `const` at the top of
`recipe-finder.ts` (the component file), not a separate `RecipeDataService`. This is a deliberate divergence from
the fuller "Putting It Together" architecture sketched in the module's own reference notes (which uses a
`RecipeDataService` + `toSignal()`) — that sketch is a *bigger*, optional shape; the task specification you were
actually assigned is narrower, and it is the source of truth. `core/models/` stays because a plain TypeScript
interface isn't a service — it doesn't fetch, mutate, or own state.

**Why `shared/ui/recipe-card/` exists at all, given the "no services" restriction doesn't forbid components:**
splitting the card out of the finder template is what makes signal-based **inputs** (Section 6 of the module notes)
demonstrable at all — `RecipeCard` receives `recipe`/`isFavorited` as `input.required()`/`input()`, not `@Input()`,
which is one of the module's own required concepts (see the checklist in §8/§9).

---

## 3. State Architecture — every signal, computed, and effect

### 3.1 Writable signals (`RecipeFinder`)

| Signal | Holds | Set via |
|---|---|---|
| `recipes` | the static catalog (14 recipes) | never mutated after init — exists as a signal because the technical guidelines require `signal()` to hold the recipes array itself |
| `searchTerm` | the current search text | `.set()` on every keystroke |
| `maxCookTime` | the slider's current value (minutes) | `.set()` on every slider `input` event |
| `favoritesOnly` | whether the favorites filter is active | `.update((v) => !v)` |
| `favoriteIds` | the list of favorited recipe ids, loaded from `localStorage` on construction | `.update()` with an **immutable** array pattern — `ids.includes(id) ? ids.filter(...) : [...ids, id]`, never `.push()` |

### 3.2 Chained `computed()` signals

```
searchedRecipes = computed(() => recipes().filter(name/ingredient matches searchTerm()))
        │
        ▼
timeFilteredRecipes = computed(() => searchedRecipes().filter(cookTimeMinutes <= maxCookTime()))
        │
        ▼
filteredRecipes = computed(() => favoritesOnly() ? timeFilteredRecipes().filter(in favoriteIds()) : timeFilteredRecipes())
        │
        ▼
resultCount = computed(() => filteredRecipes().length)
```

Three levels of chaining (well past the "at least two" the module asks for), plus a fourth, independent
`hasFavorites = computed(() => favoriteIds().length > 0)` used to disable the "favorites only" controls until at
least one recipe has actually been favorited.

### 3.3 `effect()` — three, each reading a different kind of signal

1. **Required — logging filter/search changes:**
   ```typescript
   effect(() => {
     console.log(`[Recipe Finder] search="${this.searchTerm()}" maxCookTime=${this.maxCookTime()}min favoritesOnly=${this.favoritesOnly()}`);
   });
   ```
   Reads three writable signals directly; re-runs whenever any one of them changes.

2. **Guarded effect reading a `computed()`, not a writable signal (Section 5's Example 3 pattern):**
   ```typescript
   effect(() => {
     if (this.resultCount() === 0) {
       console.log('[Recipe Finder] No recipes matched the current search/filters.');
     }
   });
   ```

3. **Genuine side effect — persistence (stretch goal), the module's own "realistic example":**
   ```typescript
   effect(() => {
     localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(this.favoriteIds()));
   });
   ```
   All three are registered in the constructor (a valid injection context) and need no manual cleanup — they're
   torn down automatically with the component, unlike Module 6's Observable subscriptions.

### 3.4 Signal-based inputs (`RecipeCard`)

```typescript
recipe = input.required<Recipe>();
isFavorited = input(false);
@Output() toggleFavorite = new EventEmitter<number>();
```

Per the module's own scope note (Section 6): refactoring **inputs** to `input()`/`input.required()` is this
module's objective; `@Output()`/`EventEmitter` for the favorite-click event is explicitly still correct at this
stage (`output()` is flagged "🔒 Coming Later" in the reference notes) — so the mix here is intentional, not an
oversight.

---

## 4. UI & Design

Colors, type scale, and card styling are pulled directly from the Figma file linked in the task spec (file key
`bFS76MJxeewgyPcIWoA9oK`), read via the Figma MCP (`get_design_context`/`get_metadata`/`get_variable_defs` on the
Desktop/Mobile/Tab frames), not just eyeballed from the exported PNGs. Tokens: primary `#F6B100`, secondary
`#181A20`, quick-silver `#9F9F9F`, white/whitesmoke/bright-gray neutrals — all confirmed against the file's actual
Figma variables, not guessed from screenshots. Font is Urbanist (Google Fonts), matching the typography reference.

- **Header:** yellow band, "Recipe finder" wordmark (Urbanist Bold + Medium, 40px desktop / 26px mobile, matching
  the file's own two logo instances), a search icon (focuses the search input — see below), a heart icon that
  doubles as the "favorites only" shortcut (disabled/dimmed via `hasFavorites()` until something is favorited), and
  a decorative (non-interactive, `aria-hidden`) user icon kept only for visual parity with the design — there's no
  profile/auth feature in this lab, so it isn't wired to anything.
- **Search bar:** a floating white rounded card that overlaps the header's bottom edge — this is the exact motif
  the Figma **Mobile** frame uses for its search box (`rounded-[5px]`, 40px height, soft ambient shadow), applied at
  every breakpoint here since the Desktop/Tab frames only show a search *icon* with no persistent input, and the
  task requires an always-visible, functional search field. This is the one deliberate breakpoint-unification
  choice — documented in §4.1.
- **Toolbar:** cook-time range slider with a live "Max cook time: N min" label, a "Favorites only" checkbox (same
  disabled-until-you-have-favorites rule as the header icon), and a "Clear filters" button — styled as a white,
  shadow-only card (`box-shadow: 0 4px 40px rgba(0,0,0,.1)`, radius 10px) matching the exact shadow/radius used by
  the design's "with benefits" list-item cards. This whole panel has no direct Figma equivalent (the design has no
  cook-time filter at all — it's this lab's own requirement), so it borrows the file's card language rather than
  inventing a new one.
- **Grid:** `app-recipe-card` — a pill-shaped card (`border-radius: 70px 70px 20px 20px`, `box-shadow: 0 4px 10px
  rgba(0,0,0,.25)`) with a circular, slightly rotated photo overlapping the top edge and a small cook-time badge on
  the photo's lower-right corner — this reproduces the file's "Keto Salad" feature-card pattern (Desktop frame,
  node `94:518` and siblings) almost exactly, since that pattern (not the "with benefits" list rows, which are
  always single-column regardless of breakpoint) is the one that actually turns into a responsive grid across
  screen sizes, matching the task's "single column on mobile, grid on larger screens" requirement. The photo itself
  is an emoji inside the circle rather than a real photograph — the design's photos are per-dish stock photography
  this lab has no equivalent asset for, and a remote image URL would introduce a real network dependency (and a
  possible 404) for a value the task only requires be "an image" on a static `Recipe` object. 1 column on mobile,
  2/3/4 columns at increasing breakpoints (`recipe-finder.css`, `@media` at 40rem/60rem/80rem).
- **Icons are real exported assets, not hand-drawn substitutes.** The search/heart/user header icons and the
  card's favorite-heart icon are the actual SVG paths exported from the Figma file (downloaded once via the MCP
  asset URLs, then inlined as `<svg>` markup in the templates so there's no runtime fetch or expiring-URL risk).
  Each inlined path has its hardcoded `stroke="white"`/`stroke="#9F9F9F"` swapped for `stroke="currentColor"` so
  the surrounding CSS can recolor it per state (e.g. the favorite button filling solid on toggle) — the path
  geometry itself is untouched.
- **Empty state:** shown whenever `filteredRecipes().length === 0`, styled with the same shadow-card language as
  the toolbar, with a "Clear filters" escape hatch.
- **Hover/focus:** cards lift on hover; every interactive control has a visible `:focus-visible` outline; the
  favorite button and header icons have distinct hover/active states.

### 4.1 Design-fidelity audit pass — findings and fixes

A follow-up session specifically re-audited the UI against the actual Figma file (not just the exported reference
PNGs), pulled via the Figma MCP (`get_design_context` on the Desktop/Mobile frames, `get_variable_defs` for exact
color tokens, plus the raw exported icon SVGs). The first build was functionally complete but visually generic —
rounded rectangles and emoji text (♡/♥/🔍) standing in for the file's actual card shape, icons, and shadows.

**Mismatches found:**
- Cards were plain rounded rectangles with a rectangular photo strip — the design's recognizable card shape is a
  pill (`70px 70px 20px 20px` corners) with a **circular, tilted** photo overlapping the top edge.
- Header/search/favorite icons were emoji characters (♡/♥/🔍), not the file's actual icon glyphs.
- Card shadows, badge shape/position, and the toolbar/empty-state shadow were approximated rather than matching the
  file's real values (`0 4px 10px rgba(0,0,0,.25)` on cards, `0 4px 40px rgba(0,0,0,.1)` on list-style panels).
- Header logo size (40px/26px) and the floating-search-card motif from the Mobile frame weren't reflected at all.

**Fixes applied:** rebuilt `RecipeCard` around the pill/circular-photo/badge structure in §4 above; replaced every
emoji icon with the real exported SVG (inlined, `currentColor`-parameterized); matched shadows, radii, and type
sizes to the values read directly from the file; added the overlapping search-bar card.

**One real bug this pass introduced and fixed before finishing:** the cook-time badge was first placed at the
pill's bottom-right corner (matching the badge's position *relative to the whole card* at a glance). With a
two-line title (e.g. "Grilled Chicken Caesar Salad") the ingredients line ended up rendering underneath the fixed
badge. Re-reading the Figma export showed the badge is actually anchored to the **photo circle's** corner, not the
card's — moving it there (§4's `.recipe-card__photo-wrap`) fixed the overlap for every title length, since it no
longer depends on how much text is above it.

**Deliberate deviations (documented, not oversights):**
- No mobile hamburger menu / bottom tab bar — the Mobile frame has both, but they're navigation chrome for pages
  (favorites list, profile) this single-screen lab doesn't have. Adding either would be a non-functional, dead
  control, which the task explicitly says to avoid ("do not remove required functionality" cuts both ways — it
  also means not bolting on *fake* functionality just to look busier).
- The header's user icon is decorative for the same reason (no auth/profile feature in scope).
- The floating search-bar card is used at every breakpoint, not just mobile (see §4) — a deliberate, justified
  unification, not an inconsistency.
- Real dish photography was not sourced; emoji-in-circle stands in for it (see §4's "Grid" bullet).

---

## 5. Why Certain Concepts Were *Not* Used

- **No `RecipeDataService` / `toSignal()` / `HttpClient` / Router** — the task specification explicitly rules these
  out ("No routing, services, or async API calls"). The fuller service-based architecture in the module's own
  reference notes is a larger, optional shape; this build follows the actual assigned specification instead.
- **No `.mutate()`** — it doesn't exist in current Angular (removed before the stable Signals release, per the
  module notes' version-note callout). Every array update here (`favoriteIds`) goes through `.update()` with a
  fresh array — `[...ids, id]` / `ids.filter(...)` — never in-place mutation.
- **No `linkedSignal()`, `toObservable()`, signal-based `output()`, zoneless-specific APIs, or NgRx Signal Store** —
  all flagged "🔒 Coming Later — Outside This Module" in the reference notes; none were needed to satisfy the task.
- **No sort feature or theme toggle** — both are listed as *optional* stretch goals in the task; favorites +
  `localStorage` persistence were implemented instead because they're the stretch goal the module's own "realistic
  effect" example is built around, giving the effect requirement a genuinely meaningful side effect to demonstrate.

---

## 6. Connection to Previous Modules

**FEM09–FEM12 (Fundamentals → Routing).** Standard property/event binding throughout (`[value]`, `(input)`,
`(click)`); the new `@if`/`@for` control-flow syntax is used in the template instead of `*ngIf`/`*ngFor` (this is
current, non-deprecated Angular syntax, not a forbidden later-module concept). No routing exists in this app at all
— a single component tree, on purpose.

**FEM13 (Forms).** Not used — every input (`search`, `range`, `checkbox`) is wired with plain one-way binding plus
an event handler, exactly like FEM12's own recipe-finder-adjacent example avoided `ngModel` for a different reason.
No `FormsModule` anywhere.

**FEM14 (RxJS & Observables).** Deliberately absent. This lab's whole premise (per the module notes' Section 2) is
contrasting "pull"-based Signals against "push"-based Observables covered in FEM14 — introducing RxJS here would
defeat the purpose of the exercise.

**FEM15 (this module).** Everything in §3: writable signals, chained `computed()`, `effect()` (three distinct,
real-world flavors), and signal-based component inputs.

---

## 7. Realistic User Flows

**Narrowing results while typing:**
> User types "tuna" into the search box → `searchTerm.set('tuna')` → `searchedRecipes` recomputes, matching by name
> or any ingredient → `timeFilteredRecipes` and `filteredRecipes` recompute in turn → `resultCount()` drops to 1 →
> the grid re-renders with a single card → the logging `effect()` fires once with the new search value.

**Hitting zero results:**
> User types a nonsense term → `filteredRecipes()` becomes an empty array → the `@if`/`@else` block swaps to the
> empty-state message → the guarded `effect()` (§3.3, #2) logs "No recipes matched" — a `computed()`-driven effect,
> not a writable-signal-driven one.

**Favoriting a recipe and reloading:**
> User clicks the heart on "Avocado Keto Salad" → `RecipeCard` emits `toggleFavorite(1)` via its `@Output()` →
> `RecipeFinder.onToggleFavorite(1)` runs `favoriteIds.update(...)` with the immutable pattern → the persistence
> `effect()` fires, writing the new array to `localStorage` → the header heart and the "Favorites only" checkbox
> both become enabled (`hasFavorites()` is now `true`) → refreshing the page re-reads `localStorage` in the
> signal's initializer, so the same recipe is still favorited.

---

## 8. Possible TA Questions

**Signals fundamentals**

- *What does "fine-grained reactivity" mean, and how does it differ from Angular's default change detection?*
  Default CD re-checks every template binding in the whole tree; a signal tracks precisely which
  `computed()`/`effect()`/template expression actually read it, so only those update.
- *Why call `searchTerm()` instead of reading `searchTerm` directly?* A signal is a function — reading it is a
  function call. `searchTerm` (no parens) refers to the signal object itself, not its current value.
- *Why is there no `.mutate()` anywhere in this codebase?* It was removed before Angular's stable Signals release
  because in-place mutation defeats reference-based change detection — the exact same principle Module 3 already
  taught for `@Input()` objects. `favoriteIds.update()` always builds a new array instead.

**`computed()`**

- *Why can't you call `.set()` on `filteredRecipes`?* It's read-only by design — its value is entirely derived from
  `recipes`, `searchTerm`, `maxCookTime`, and `favoritesOnly`/`favoriteIds`; changing the *result* directly would
  make it a second, conflicting source of truth.
- *Why chain three `computed()`s instead of one big filter function?* Each stage reads only the signals it actually
  needs, and Angular can short-circuit recomputation at whichever stage nothing relevant changed — plus it mirrors
  the exact "search → time → favorites" order the UI's filters are applied in, which makes the code easy to read
  top to bottom.

**`effect()`**

- *Why three separate `effect()` calls instead of one that does everything?* Each has a distinct, single
  responsibility (logging, a guarded zero-results log, persistence) — bundling them would make each one re-run
  unnecessarily whenever *any* of the others' dependencies changed, and would blur what's actually being reacted to.
- *Why does the persistence effect not need a manual `ngOnDestroy` unsubscribe?* `effect()`'s cleanup is tied
  automatically to the component's injector lifetime — a deliberate difference from Module 6's Observable
  subscriptions, which do need manual teardown.
- *What would go wrong if the zero-results log lived inside the `filteredRecipes` `computed()` instead of its own
  `effect()`?* `computed()` must stay a pure, side-effect-free calculation — Angular can re-run it more or less
  often than intuition suggests for internal caching reasons, so a `console.log` inside it could fire an
  unpredictable number of times.

**Signal-based inputs**

- *Why does `RecipeCard` use `input.required<Recipe>()` instead of `@Input({ required: true })`?* This module's
  explicit refactor objective — plus it needs no `!` non-null assertion, since the signal-input type system already
  guarantees a value is present by the time it's read.
- *Why does `RecipeCard` still use `@Output()`/`EventEmitter` instead of the newer `output()` function?* The
  module's own scope note: refactoring **outputs** is explicitly flagged "outside this module's required depth" —
  mixing `input()` for inputs with `@Output()` for outputs is the expected pattern at this stage.

**Scoping / architecture**

- *Why is there no `RecipeDataService`?* The task specification explicitly says "no routing, services, or async API
  calls — use static data defined in the component file," which this build follows literally: `RECIPES` is a
  top-level `const` in `recipe-finder.ts`.
- *Isn't `core/models/recipe.model.ts` a service?* No — it's a plain TypeScript interface with no injectable class,
  no methods, no state. It doesn't fetch or own anything; it just describes the shape of a `Recipe`.

---

## 9. Things I Must Be Able to Explain (checklist)

- [ ] Every signal in `RecipeFinder` (§3.1) and what triggers each one to change.
- [ ] The full `computed()` chain (§3.2) — why three levels, and in what order the filters apply.
- [ ] All three `effect()`s (§3.3) — what each one reacts to, and why each is a *separate* effect.
- [ ] The immutable `.update()` pattern for `favoriteIds`, and why `.push()`/`.mutate()` would be wrong.
- [ ] `RecipeCard`'s signal-based inputs vs. its still-`@Output()`-based event, and why that mix is correct here.
- [ ] Why there is no service/HTTP/router layer in this app, and where the static data actually lives.
- [ ] The empty-state path: what makes `filteredRecipes()` become `[]`, and what the guarded effect logs when it
      does.
- [ ] The `localStorage` favorites round-trip: written by an effect, read back in the signal's own initializer.
- [ ] Responsive behavior: the grid's breakpoints and why the layout is single-column below `40rem`.
- [ ] Why the recipe card is shaped/badged the way it is (§4.1) — that it's modeled on the Figma file's "Keto Salad"
      feature-card pattern specifically (not the "with benefits" list rows), and why the cook-time badge is
      anchored to the photo circle rather than the card itself (the two-line-title overlap bug that fix resolved).
- [ ] Which icons are inlined exported Figma SVGs vs. which UI elements have no Figma equivalent at all (the
      cook-time slider/checkbox toolbar) and were styled to match the file's card language instead.

---

## 10. Verification Performed

- `ng build` succeeds with no errors or warnings.
- An automated headless-browser run (Playwright, against the live `ng serve` dev server), with **zero
  console/page errors** throughout:
  - Initial load renders all 14 recipe cards; searching "tuna" narrows the grid to exactly 1 card.
  - Searching a nonsense term shows the empty-state message; "Clear filters" restores all 14 results.
  - Moving the cook-time slider to 15 minutes narrows results to the 4 recipes at or under that time, and the
    "N recipes found" count updates to match.
  - Favoriting a card visually marks it (heart fills in); enabling "favorites only" (header icon) narrows the grid
    to exactly that one favorited recipe.
  - Reloading the page after favoriting confirms the favorite survives via `localStorage` (the heart is still
    filled in after a full page reload, with no favorites-related state passed any other way).
  - At a 375px mobile viewport, the recipe grid confirmed as a single CSS grid column with no horizontal overflow.
- `grep` over `src/app` confirms no `HttpClient`, `Router`/`provideRouter`, or `*Service` class anywhere in the
  codebase.
- **Design-fidelity pass (§4.1):** design context pulled directly from the Figma file via MCP (not just the
  exported PNGs) for the Desktop and Mobile frames, plus every referenced icon's raw SVG downloaded and diffed
  against what the app was rendering. Re-screenshotted desktop (1440px), tablet (834px), and mobile (375px) after
  the rebuild and compared side-by-side against the Figma exports — card shape, shadows, badge position, icon
  glyphs, and header/search-bar layout all matched. The full functional test suite (search, slider, favorites
  toggle + persistence, empty state, responsive columns) was re-run after the redesign with the same results as
  before, confirming the visual changes didn't regress any behavior — see the earlier bullets above.

---

## 11. Final Curriculum Audit

**✅ Allowed (FEM09–FEM15) and used throughout:** standalone components, property/event binding, the current
`@if`/`@for` control-flow syntax, `signal()`/`.set()`/`.update()`, chained `computed()`, `effect()` (three distinct
uses, all in a valid injection context), `input()`/`input.required()` for component inputs, `@Output()`/
`EventEmitter` for the favorite-toggle event (per this module's own scope note), and plain immutable array updates.

**❌ Not introduced:** `.mutate()` (removed from Angular before stable release), `linkedSignal()`, `toSignal()`/
`toObservable()`, signal-based `output()`, RxJS of any kind, `HttpClient`, the Router, `FormsModule`/`ngModel`/
`ReactiveFormsModule`, and any external state-management library — all either explicitly out of this module's scope
or explicitly ruled out by the task specification's technical guidelines.

**One deliberate divergence from the module's own reference notes, not from the task:** the notes' "Putting It
Together" architecture (§9 of `Angular-Module7-Signals.md`) sketches a `RecipeDataService` + `toSignal()` design.
This build does not use it, because the actual task specification you were assigned overrides that sketch with a
narrower, explicit rule: *"No routing, services, or async API calls — use static data defined in the component
file."* Where the two disagree, the task specification — the literal deliverable — is the source of truth.

---

## Deliverables status

| Deliverable | Status |
|---|---|
| Static recipe catalog (name, ingredients, cookTime, image) | ✅ Done — 14 recipes, `recipe-finder.ts` |
| Search by name/ingredient | ✅ Done — `searchedRecipes` computed |
| Max cook-time slider filter | ✅ Done — range input + `timeFilteredRecipes` computed |
| Result count via `computed()` | ✅ Done — `resultCount` |
| Live updates on search/filter change | ✅ Done — verified live, no manual refresh needed |
| Empty-state placeholder | ✅ Done — `@else` block with "Clear filters" |
| `effect()` logging filter/search changes | ✅ Done — plus two additional effects (guarded zero-results log, favorites persistence) |
| Card-based, responsive, accessible UI matching the provided design | ✅ Done — audited against the actual Figma file (MCP), not just the exported PNGs; re-verified at mobile/tablet/desktop widths after the redesign pass (§4.1) |
| Stretch: favorites toggle | ✅ Done — header icon + per-card heart, immutable `.update()` |
| Stretch: persist favorites via `localStorage` | ✅ Done — effect-driven, verified across a reload |
| Stretch: sorting / theme toggle | ⚠️ Not implemented — both are optional; scope kept to the required criteria plus the two stretch goals above |
