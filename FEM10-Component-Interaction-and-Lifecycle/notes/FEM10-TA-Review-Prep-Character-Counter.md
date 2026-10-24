# FEM10 TA Review Prep — Character Counter App

Prep notes for the Character Counter App live code review. Written against what was actually
built in `character-counter-app/`, not a generic description of the concepts.

---

## 1. Project Overview

**What it is:** a single-page text-analysis tool. The user types or pastes text into an editor
and instantly sees character/word/sentence counts, an approximate reading time, and a letter-density
breakdown, with an optional character limit and a light/dark theme toggle.

**What FEM10 focuses on:** splitting one working UI into a proper multi-component Angular tree
and wiring it together the "Angular way" — data flows down through `@Input()`, user actions flow
back up through `@Output()`/`EventEmitter`, and the three core lifecycle hooks (`ngOnInit`,
`ngOnChanges`, `ngOnDestroy`) are used for real initialization, reactive updates, and cleanup work,
not just declared for the sake of it.

**Relationship to the earlier JavaScript Essentials lab:** the visual design (layout, colors,
spacing, copy) is carried over from that plain HTML/CSS/JS version, and the feature set is the
same *plus* one correction — FEM10's spec explicitly asks for character/word/**sentence** counts,
so the third stat card shows **Sentence Count** instead of the old version's **Line Count** (whose
`countSentences()` helper existed in the JS version but was never wired up). All of the actual
*logic* — how the textarea is watched, how the limit is enforced, how state flows around — was
rebuilt from scratch using Angular's component model instead of `document.getElementById` and
manual DOM writes.

---

## 2. Project Architecture

```
src/app/
├── app.component.ts/.html/.css        Root: owns ALL state, wires every child together
├── models/theme.ts                    `Theme = 'light' | 'dark'` — shared type, avoids a
│                                       circular import between AppComponent and ThemeToggleComponent
├── services/
│   └── text-analysis.service.ts       Pure text-math functions (root-provided singleton)
└── components/
    ├── theme-toggle/       Icon button that reports "the user wants to switch theme"
    ├── text-editor/        The textarea + over-limit warning message
    ├── options-panel/      "Exclude Spaces" / "Set Character Limit" checkboxes + limit number input
    ├── stat-card/          One colored stat tile (value + label) — reusable, used 3×
    ├── stats-grid/         Lays out the three StatCardComponents, forwards their data down
    └── letter-density/     Letter-frequency bars + "See more / See less" toggle
```

**Components and what each owns:**

| Component | Owns (local state) | Receives via `@Input()` | Reports via `@Output()` |
|---|---|---|---|
| `AppComponent` | `text`, `excludeSpaces`, `limitEnabled`, `limitValue`, `theme` — **all** app state | — (root) | — (root) |
| `ThemeToggleComponent` | nothing | `theme` | `themeChange` |
| `TextEditorComponent` | nothing (derives `isOverLimit` from its inputs) | `text`, `excludeSpaces`, `limitEnabled`, `limitValue` | `textChange` |
| `OptionsPanelComponent` | nothing | `excludeSpaces`, `limitEnabled`, `limitValue` | `excludeSpacesChange`, `limitEnabledChange`, `limitValueChange` |
| `StatsGridComponent` | nothing (pure pass-through) | `totalChars`, `wordCount`, `sentenceCount` | — |
| `StatCardComponent` | nothing | `value`, `label`, `variant` | — |
| `LetterDensityComponent` | `expanded` (local UI-only state) | `text` | — |

`AppComponent` is the only **smart** component — the only one that holds real application state.
Every other component is **presentational/dumb**: it renders what it's told via `@Input()` and
reports user actions via `@Output()`, but never mutates data it doesn't own. `LetterDensityComponent`
is the one exception worth calling out: its "is the list expanded?" flag is genuinely private view
state that no other component needs, so it's kept local instead of being lifted to `AppComponent`
for no reason.

---

## 3. How Parent-Child Communication Works

Angular components can't call methods on each other directly — communication only happens through
a well-defined contract: **data flows down, events flow up.** Concretely:

1. `AppComponent`'s template binds each child's `@Input()` properties to its own state, e.g.
   `<app-text-editor [text]="text" [limitEnabled]="limitEnabled" ...>`. Whenever `AppComponent.text`
   changes, Angular re-renders that binding and the new value lands in `TextEditorComponent.text`.
2. The child never edits that `@Input()` value in place. Instead, when something happens (the user
   types, checks a box, clicks a button), the child emits an event through one of its `@Output()`
   properties: `this.textChange.emit(correctedValue)`.
3. `AppComponent`'s template listens for that event — `(textChange)="onTextChange($event)"` — and
   the handler updates `AppComponent`'s own state (`this.text = value`).
4. That state change flows back down through the `@Input()` bindings on the *next* change-detection
   pass, and every component that reads `text` (directly or through a derived getter) re-renders
   with the new value.

This is **unidirectional data flow**: state only ever changes in one place (the owning component),
and every other component is just a reflection of it. Nothing in this app uses two-way binding
(`[(ngModel)]`) — every form control is deliberately wired as an explicit `[value]`/`[checked]` +
`(input)`/`(change)` pair so the data-down/events-up contract stays visible and explicit.

**Concrete example — the character limit changing:**
- User types "20" into the number input inside `OptionsPanelComponent`.
- `OptionsPanelComponent` emits `limitValueChange.emit(20)`.
- `AppComponent.onLimitValueChange(20)` sets `this.limitValue = 20`.
- Angular re-renders `<app-text-editor [limitValue]="limitValue">` with the new value.
- `TextEditorComponent`'s `limitValue` `@Input()` changes, which triggers its `ngOnChanges` (see
  §6) to re-trim the current text if it's now too long, which emits `textChange` back up, updating
  `AppComponent.text`, which then flows down to `TextEditorComponent`, `StatsGridComponent`, and
  `LetterDensityComponent` — all from one user keystroke.

---

## 4. How `@Input()` and `@Output()` Are Used

**`@Input()`** marks a class property as something the *parent* is allowed to set through a
template binding. It's how data gets "down" the tree. Every non-root component in this app
declares its inputs with sensible defaults so the component still renders sanely even before a
parent supplies a value:

```typescript
// text-editor.component.ts
@Input() text = '';
@Input() excludeSpaces = false;
@Input() limitEnabled = false;
@Input() limitValue = 300;
```

**`@Output()`** marks a property (always an `EventEmitter`) as something a *parent* can listen to.
It's how events get "up" the tree — the child never touches the parent's data directly, it just
announces that something happened:

```typescript
// options-panel.component.ts
@Output() excludeSpacesChange = new EventEmitter<boolean>();
@Output() limitEnabledChange = new EventEmitter<boolean>();
@Output() limitValueChange = new EventEmitter<number>();

onExcludeSpacesChange(event: Event): void {
  this.excludeSpacesChange.emit((event.target as HTMLInputElement).checked);
}
```

And on the parent side, both directions show up in the same template line:

```html
<!-- app.component.html -->
<app-options-panel
  [excludeSpaces]="excludeSpaces"
  [limitEnabled]="limitEnabled"
  [limitValue]="limitValue"
  (excludeSpacesChange)="onExcludeSpacesChange($event)"
  (limitEnabledChange)="onLimitEnabledChange($event)"
  (limitValueChange)="onLimitValueChange($event)"
/>
```

`StatCardComponent` is the clearest example of `@Input()` enabling **reuse**: it's a single,
generic component instantiated three times with different data —

```html
<!-- stats-grid.component.html -->
<app-stat-card [value]="totalChars" label="Total Characters" variant="purple" />
<app-stat-card [value]="wordCount" label="Word Count" variant="yellow" />
<app-stat-card [value]="sentenceCount" label="Sentence Count" variant="orange" />
```

`StatCardComponent` itself has no idea whether it's showing characters, words, or sentences — it
just renders whatever `value`/`label`/`variant` it's given. That's the whole point of `@Input()`:
the same component works for three different pieces of data with zero duplicated markup.

---

## 5. How `EventEmitter` Is Used

`EventEmitter<T>` is the class that actually powers `@Output()`. Declaring
`@Output() themeChange = new EventEmitter<'light' | 'dark'>()` creates an object with an `.emit()`
method the component calls internally, and a `.subscribe()`-style API (it's a thin wrapper around
an RxJS `Subject`) that Angular's template binding syntax (`(themeChange)="..."`) uses automatically
under the hood — you almost never call `.subscribe()` on it by hand in a template-driven component,
you just bind to the event name in parentheses.

**Where it's used, end to end:**

```typescript
// theme-toggle.component.ts
@Output() themeChange = new EventEmitter<Theme>();

toggle(): void {
  this.themeChange.emit(this.theme === 'light' ? 'dark' : 'light');
}
```

```html
<!-- app.component.html -->
<app-theme-toggle [theme]="theme" (themeChange)="onThemeChange($event)" />
```

```typescript
// app.component.ts
onThemeChange(theme: Theme): void {
  this.theme = theme;
  this.applyTheme();   // sets the data-theme attribute on <html>
  this.queuePersist();  // saves it to localStorage (debounced)
}
```

The button click never touches `document`, `localStorage`, or any sibling component — it just emits
one strongly-typed value (`Theme`, not a raw string) and lets `AppComponent` decide what that means.
Every `@Output()` in this app is typed the same deliberate way (`EventEmitter<string>`,
`EventEmitter<boolean>`, `EventEmitter<number>`) so a bad emit is a compile-time TypeScript error,
not a runtime surprise.

---

## 6. Lifecycle Hooks Used and Why

### `ngOnInit` — `AppComponent`

```typescript
ngOnInit(): void {
  this.restoreState();   // read saved text/options/theme from localStorage, or detect system theme
  this.applyTheme();     // set the data-theme attribute before first paint

  this.persistSubscription = this.persist$
    .pipe(debounceTime(300))
    .subscribe(() => this.saveState());
}
```

**Why it has to be `ngOnInit` and not the constructor:** the constructor is for basic
dependency-injection setup only — Angular hasn't finished setting up bindings yet, and doing
"real work" (reading storage, starting a subscription) there is considered bad practice. `ngOnInit`
runs once, right after Angular has processed the component's inputs for the first time, which is
the correct place for one-time initialization logic like this.

### `ngOnChanges` — `TextEditorComponent` and `LetterDensityComponent`

`ngOnChanges` fires whenever one of a component's `@Input()`-bound properties changes value. Two
components use it for two different reasons:

**`LetterDensityComponent`** — recompute the density table whenever the text changes:
```typescript
ngOnChanges(changes: SimpleChanges): void {
  if (changes['text']) {
    this.density = this.textAnalysis.getLetterDensity(this.text);
  }
}
```
This is the "textbook" use case the lab spec describes: react to an `@Input()` changing.

**`TextEditorComponent`** — re-enforce the character limit when the limit *itself* changes, not
just when the user types:
```typescript
ngOnChanges(changes: SimpleChanges): void {
  const limitRelatedChange = !!(changes['limitEnabled'] || changes['limitValue'] || changes['excludeSpaces']);
  if (limitRelatedChange && !changes['text']) {
    const corrected = this.enforceLimit(this.text);
    if (corrected !== this.text) {
      Promise.resolve().then(() => this.textChange.emit(corrected));
    }
  }
}
```
**Why this is needed at all:** the limit and "exclude spaces" checkbox live in a *sibling*
component (`OptionsPanelComponent`), not in `TextEditorComponent` itself. If a user has already
typed 250 characters and *then* sets the limit to 100, nothing about their typing changed — the
*limit* changed — so the local `(input)` handler on the textarea never fires. Without `ngOnChanges`,
the text would silently stay over the new limit until the next keystroke. `ngOnChanges` is what
lets `TextEditorComponent` notice "one of my inputs I don't control just changed" and react anyway.

**A real bug this surfaced, worth mentioning to the TA:** emitting `textChange` *synchronously*
from inside `ngOnChanges` caused `NG0100: ExpressionChangedAfterItHasBeenCheckedError` in dev mode.
The reason: `ngOnChanges` runs *in the middle of* the parent's own change-detection pass (because
the parent's `[limitValue]` binding is what triggered it). Emitting synchronously calls
`AppComponent.onTextChange()`, which mutates `AppComponent.text` — a value Angular may have already
checked earlier in that same pass — so Angular's dev-mode double-check catches the inconsistency
and throws. The fix was to defer the emit to a microtask (`Promise.resolve().then(() => ...)`), so
the parent's state changes on the *next* tick instead of mid-check. This is a good story to bring
up in review — it shows the lab's request to "inspect change detection behavior" wasn't just
theoretical.

### `ngOnDestroy` — `AppComponent`

```typescript
ngOnDestroy(): void {
  this.persistSubscription?.unsubscribe();
}
```
This app is a single root component with no routing, so in practice `AppComponent` is never
actually destroyed while the tab is open — but the pattern is demonstrated correctly and for a real
reason: `ngOnInit` starts an RxJS subscription (the debounced `localStorage` save), and any
subscription started in a component must be torn down in `ngOnDestroy` to avoid leaking it if the
component *were* ever destroyed (e.g. if this were embedded inside a routed app later). The lab
spec calls this hook out as optional/"if event subscriptions or timers are used" — this app
deliberately introduces one (the debounce subscription) specifically so this hook has genuine work
to do instead of being an empty method added just to tick a box.

---

## 7. How Data Flows Through the Application

**Typing in the editor:**
`textarea (input) DOM event` → `TextEditorComponent.onInput()` → `enforceLimit()` trims the value
if a limit is active → `textChange.emit(correctedValue)` → `AppComponent.onTextChange()` sets
`this.text` → change detection re-renders every binding that reads `text`: `[text]` on
`TextEditorComponent` and `LetterDensityComponent` directly, plus the *getters* `totalChars`,
`wordCount`, `sentenceCount`, `readingTime` on `AppComponent` (all computed from `text` via
`TextAnalysisService`) feed `StatsGridComponent` and the reading-time paragraph.

**Changing an option (limit/exclude-spaces):**
`checkbox/number input (change|input) DOM event` inside `OptionsPanelComponent` → the matching
`@Output()` emits → the matching `AppComponent.on...Change()` handler updates state → flows back
down to `TextEditorComponent` as new `@Input()` values → `TextEditorComponent.ngOnChanges()` fires
and re-trims the text if needed (see §6) → if it emits a correction, the whole cycle above runs
again for the new `text`.

**Toggling the theme:**
button click → `ThemeToggleComponent.toggle()` emits the opposite theme → `AppComponent.onThemeChange()`
sets `this.theme`, calls `applyTheme()` (writes the `data-theme` attribute onto `<html>` via the
injected `DOCUMENT` token, which is what the CSS custom properties in `styles.css` key off of), and
queues a debounced save.

**Persisting and restoring:**
Every state-changing handler in `AppComponent` calls `queuePersist()`, which pushes onto an RxJS
`Subject`. That stream is debounced 300ms and only then writes one combined JSON blob
(`text`/`excludeSpaces`/`limitEnabled`/`limitValue`/`theme`) to `localStorage` — so a burst of
keystrokes results in one write, not one per keystroke. On the next load, `ngOnInit` reads that
blob back (falling back to the system's `prefers-color-scheme` for the theme if nothing was saved
yet) before the first render.

**The one thing that never happens:** no component ever reaches "sideways" to a sibling or "up"
past its direct parent. `TextEditorComponent` has no idea `OptionsPanelComponent` exists, and vice
versa — they only ever talk to `AppComponent`, which is what makes each of them independently
understandable and reusable.

---

## 8. Important Angular Concepts Demonstrated

- **Standalone components.** Nothing in this project uses an `NgModule` — every component
  declares its own `imports: [...]` array of the child components/directives its template needs
  (e.g. `AppComponent` imports all six feature components; `StatsGridComponent` imports
  `StatCardComponent`).
- **Unidirectional data flow** via `@Input()`/`@Output()`, described in full in §3–§5.
- **The three lifecycle hooks the lab requires** (`ngOnInit`, `ngOnChanges`, `ngOnDestroy`), each
  used for a genuine reason rather than being stubbed in — see §6.
- **Change detection pitfalls.** The `ExpressionChangedAfterItHasBeenCheckedError` encountered and
  fixed (§6) is a direct, hands-on demonstration of *why* Angular's change-detection model matters,
  not just that it exists.
- **A shared, stateless service** (`TextAnalysisService`, `@Injectable({ providedIn: 'root' })`)
  holding the pure character/word/sentence/letter-density/reading-time math, injected via
  constructor into `AppComponent`, `TextEditorComponent`, and `LetterDensityComponent` — so the same
  counting logic can't drift between components that all need it.
- **Constructor-based Dependency Injection** for more than just custom services — `AppComponent`
  also injects Angular's `DOCUMENT` token (`@Inject(DOCUMENT) private readonly document: Document`)
  instead of touching the global `document` directly, which is the idiomatic, testable way to reach
  the DOM from a component.
- **New built-in control-flow syntax** (`@if` / `@else` / `@for`) in every template instead of the
  older `*ngIf`/`*ngFor` structural directives.
- **Component reusability** — `StatCardComponent` instantiated three times with different
  `@Input()` data instead of writing three near-identical stat tiles by hand.
- **RxJS for a real cross-cutting concern** — a `Subject` + `debounceTime(300)` batches
  `localStorage` writes, and the resulting `Subscription` is explicitly cleaned up in `ngOnDestroy`.
- **Local vs. lifted state** — `LetterDensityComponent.expanded` is kept local because nothing else
  needs it, while every other piece of state lives in `AppComponent` because multiple components
  need to read or react to it. Not everything has to be lifted to the root just because the app has
  a "smart component" pattern.

---

## 9. Possible TA Review Questions

**Q: What is `@Input()` and why do you need it?**
A: A decorator that lets a parent component pass data into a child through a template attribute
binding, e.g. `[text]="text"`. Without it, a child component's properties are just private fields
the parent has no way to set — `@Input()` is what makes a property part of the component's public
API from the outside.

**Q: What is `@Output()` and how is it different from `@Input()`?**
A: `@Output()` is the reverse direction — it lets a child announce something happened (always via
an `EventEmitter`) that the parent can listen for with a template event binding, e.g.
`(textChange)="onTextChange($event)"`. `@Input()` is parent-to-child data; `@Output()` is
child-to-parent notification. Neither one lets a component directly read or write another
component's internal state — everything goes through this explicit contract.

**Q: Why doesn't `OptionsPanelComponent` just call a method on `AppComponent` directly?**
A: Angular components don't hold references to each other like that — a child doesn't (and
shouldn't) know its parent exists, let alone what methods it has. Emitting an event and letting the
*parent's template* decide what to call keeps the child fully reusable: `OptionsPanelComponent`
would work identically if it were dropped into a completely different parent with different
handler names.

**Q: Why is all the state kept in `AppComponent` instead of spread across the components that use it?**
A: Several components need the *same* piece of state — `text` alone is read by `TextEditorComponent`,
`LetterDensityComponent`, and (via derived getters) `StatsGridComponent`. If each of those owned its
own copy, they'd immediately go out of sync. Lifting the state to their common ancestor and passing
it down as `@Input()` guarantees there's exactly one source of truth.

**Q: Walk me through what happens, end to end, when I type a character.**
A: See §7 ("Typing in the editor") — the short version: the textarea's native `input` event fires,
`TextEditorComponent` optionally trims it against the current limit, emits the (possibly corrected)
string up to `AppComponent`, which updates its `text` field; that flows back down as new `@Input()`
values to every component that displays something derived from the text.

**Q: Why does `TextEditorComponent` need `ngOnChanges` specifically, and not just react inside its own `(input)` handler?**
A: Because the character limit can change from a *different* component (`OptionsPanelComponent`)
without the user typing anything. The `(input)` handler only runs when the user interacts with
*this* component's textarea; `ngOnChanges` is the only hook that notices "one of my `@Input()`
values changed for a reason outside my own control," which is exactly what happens when the limit
or exclude-spaces setting changes elsewhere.

**Q: You had a change-detection error during development — what was it and how did you fix it?**
A: `NG0100: ExpressionChangedAfterItHasBeenCheckedError`, caused by emitting the corrected text
*synchronously* from inside `TextEditorComponent.ngOnChanges()`. Since `ngOnChanges` runs mid-way
through the parent's own change-detection pass, that synchronous emit mutated `AppComponent.text`
while Angular was still verifying that pass, and Angular's dev-mode consistency check caught the
mismatch. Wrapping the emit in `Promise.resolve().then(() => ...)` defers it to the next microtask,
so the parent's state updates *after* the current check finishes instead of during it.

**Q: Why use `ngOnInit` for restoring saved state instead of just doing it in the constructor?**
A: The constructor should only be used for dependency injection and trivial field initialization —
Angular hasn't finished processing the component's inputs or bindings yet at that point. `ngOnInit`
is guaranteed to run once, after the component's initial inputs are set, which is the documented,
correct place to do setup work like reading from `localStorage` or starting a subscription.

**Q: Is `ngOnDestroy` actually necessary here, given this app has no routing?**
A: In this specific app, `AppComponent` is realistically never destroyed while the tab stays open,
so it isn't "load-bearing" today — but it's still correct practice: `ngOnInit` opens an RxJS
subscription (the debounced persistence stream), and *any* subscription a component creates should
be torn down in `ngOnDestroy` so it doesn't leak if that component's lifetime assumptions ever
change (e.g. this component being rendered inside a route that can unload). The lab spec calls this
hook "optional... if event subscriptions or timers are used" — this app intentionally uses one so
the hook has real, demonstrable work to do.

**Q: Why is `TextAnalysisService` a service instead of just methods on `AppComponent`?**
A: Three different components (`AppComponent`, `TextEditorComponent`, `LetterDensityComponent`) all
need the exact same counting/density logic. Duplicating `countCharacters`/`getLetterDensity` in
each of them risks the implementations quietly drifting apart. A single `@Injectable({ providedIn:
'root' })` service means every consumer calls the same, one implementation, and it can be unit
tested completely independently of any component template (which it is — see
`text-analysis.service.spec.ts`).

**Q: How is `StatCardComponent` reusable, and why does that matter?**
A: It has no idea what data it's displaying — it just takes `value`, `label`, and `variant` as
`@Input()`s and renders them. `StatsGridComponent` instantiates it three times with different data
(`totalChars`/"Total Characters"/purple, `wordCount`/"Word Count"/yellow, `sentenceCount`/"Sentence
Count"/orange) instead of three near-duplicate blocks of markup. Adding a fourth stat later would
mean one more `<app-stat-card>` line, not a new component.

**Q: Why doesn't `LetterDensityComponent`'s "See more" state live in `AppComponent` like everything else?**
A: Because nothing else in the app needs to know whether the density list is expanded — it's purely
about how that one component renders itself. Lifting state to a parent is for data that's *shared*
across components; state that's genuinely private to one component's view (like an expand/collapse
toggle) is correctly kept local. Not every piece of state belongs in the "smart" component just
because a smart/dumb pattern is being used.

**Q: Why does this app avoid `[(ngModel)]` / two-way binding?**
A: The lab is specifically about demonstrating explicit `@Input()`/`@Output()` data flow. Two-way
binding is really syntactic sugar for the same `[value]` + `(valueChange)` pattern used here, but
using the explicit form makes the "data down, events up" contract visible in every template
instead of hidden behind a shorthand — which matters for a lab whose whole point is showing that
communication pattern clearly.

**Q: How did you verify the component communication and lifecycle hooks actually work, not just compile?**
A: Unit tests (Jasmine/Karma, 33 passing) exercise the real behavior: `ThemeToggleComponent`
emitting the correct opposite theme on click, `OptionsPanelComponent` emitting the right typed value
from each native DOM event, `TextEditorComponent` trimming input correctly both with and without
"exclude spaces," and `TextEditorComponent.ngOnChanges`/`LetterDensityComponent.ngOnChanges`
correctly reacting to simulated `SimpleChanges`. On top of that, the app was run in a real Chrome
instance (scripted end-to-end interaction) to confirm the full click → emit → state update → re-render
loop behaves correctly in the browser, which is how the `ExpressionChangedAfterItHasBeenCheckedError`
above was actually caught.

---

## 10. Key Concepts to Understand

- **Data flows down, events flow up.** A child never mutates a parent's data directly — it reports
  what happened via `@Output()` and lets the parent decide how to update its own state.
- **`@Input()`/`@Output()` are a contract, not a reference.** A child component knows nothing about
  who its parent is or what else the app does with the data it emits — that's what makes it reusable.
- **`EventEmitter<T>` is the mechanism behind every `@Output()`.** Typing it (`EventEmitter<boolean>`,
  `EventEmitter<Theme>`, etc.) turns a wrong emit into a compile error instead of a runtime bug.
- **`ngOnInit` is for one-time setup after inputs are available**, not for logic that belongs in the
  constructor.
- **`ngOnChanges` is for reacting to `@Input()` changes that originate outside the component itself**
  — it's the only hook that fires when a *sibling's* change lands on this component as a new input.
- **`ngOnDestroy` exists to undo whatever a component started in `ngOnInit`** — mainly unsubscribing
  from long-lived streams so they don't outlive the component.
- **Change detection can run "mid-check."** Mutating a parent's bound state synchronously from
  inside a child lifecycle hook (like `ngOnChanges`) can trigger
  `ExpressionChangedAfterItHasBeenCheckedError`; deferring the mutation to a microtask/macrotask
  is the standard fix.
- **A service is for logic multiple components need identically.** `TextAnalysisService` exists so
  three different components never have three different definitions of "how do I count characters."
- **Not all state has to live in the root component.** Lift state only as high as the components
  that actually need to share it — state private to one component's own rendering (like an
  expand/collapse flag) can stay local.
