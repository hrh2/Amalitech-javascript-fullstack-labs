# Module 2: Component Interaction & Lifecycle
### FEM10 — continues from FEM09 (Angular Fundamentals)

> **Scope note:** This document covers *only* Module 2 — component hierarchy, `@Input()`/`@Output()` in depth, the full lifecycle-hook sequence (`ngOnChanges`, `ngOnInit`, `ngOnDestroy`), and the basics of change detection. It assumes you've completed Module 1 (components, templates, data binding, `*ngIf`/`*ngFor`/`ngClass`/`ngStyle`, a first pass at `@Input`/`@Output`/`ngOnInit`) and builds directly on top of it. Anything belonging to later modules — `OnPush` change detection strategy, signals, RxJS, routing, forms, HTTP, DI in depth, testing — is flagged **🔒 Coming Later — Outside This Module**.

---

## How this document is organized

Same documentation-first shape as Module 1:

**What is it? → Why does Angular need it? → How does it work? → Syntax breakdown → How do I use it? → When to use / not use → What happens behind the scenes? → How it connects to other concepts → Try It Yourself → Exercises → Common Mistakes**

Every concept ties back to the module's running example, the **Character Counter App**.

---

## Table of Contents

1. [From Module 1 to Module 2: What's New](#1-from-module-1-to-module-2-whats-new)
2. [Component Hierarchy, Properly](#2-component-hierarchy-properly)
3. [`@Input()` in Depth](#3-input-in-depth)
4. [`@Output()` and `EventEmitter` in Depth](#4-output-and-eventemitter-in-depth)
5. [Lifecycle Hooks: The Full Sequence](#5-lifecycle-hooks-the-full-sequence)
6. [`ngOnChanges`](#6-ngonchanges)
7. [`ngOnInit` Revisited: vs `ngOnChanges`](#7-ngoninit-revisited-vs-ngonchanges)
8. [`ngOnDestroy`](#8-ngondestroy)
9. [Change Detection Basics](#9-change-detection-basics)
10. [Putting It Together: Character Counter App Architecture](#10-putting-it-together-character-counter-app-architecture)
11. [Final Module Project: Character Counter App](#11-final-module-project-character-counter-app)
12. [Quick Reference Sheet](#12-quick-reference-sheet)
13. [Source & Resource Mapping](#13-source--resource-mapping)

---

## 1. From Module 1 to Module 2: What's New

Module 1 gave you enough `@Input()`/`@Output()`/`ngOnInit` to make a parent hand data to a child and have the child report user actions back — that was necessary just to make `DessertCard` and `DessertList` talk to each other at all.

Module 2 asks three sharper questions Module 1 deliberately left alone:

1. **What happens when an `@Input()` value changes *after* the component already exists?** (Module 1 only covered the *first* time it's set, via `ngOnInit`.)
2. **What's the full, guaranteed order of lifecycle events**, and which hook is the right tool for which job?
3. **Why does the screen update at all** — what actually triggers Angular to notice that data changed and re-render?

Everything below exists to answer those three questions, using a new running example: the **Character Counter App** — a text area that reports live character/word/sentence counts, enforces an optional character limit, and needs components to react to data that changes continuously and needs cleanup over time (the parts Module 1's static dessert catalog never exercised).

### ✅ Knowledge Check
1. In Module 1, `@Input()` values were only ever read reliably inside `ngOnInit`. What real-world scenario would break if a component *only* ever checked its input once, at creation?

---

## 2. Component Hierarchy, Properly

### What is it?

A **component hierarchy** is the tree structure formed when components contain other components — exactly what you already built in Module 1 (`App` → `DessertList` → `DessertCard`), just now given a name and a fuller mental model. Every Angular application is, structurally, one tree of components rooted at the component bootstrapped in `main.ts`.

### Why does this matter as its own topic?

In Module 1 you experienced a two-level tree (parent, child). Real applications commonly have three, four, or more levels, and the deeper the tree, the more important it is to be precise about two rules that don't change no matter how deep the tree gets:

1. **Data flows down** the tree via `@Input()` — a component can only receive data from its *direct* parent, never "reach up" past it or "reach across" to a sibling.
2. **Events flow up** the tree via `@Output()` — a component can only notify its *direct* parent, never "skip a level" directly to a grandparent.

If a deeply nested grandchild needs to affect a distant ancestor, the *events* must be relayed **one level at a time** — the grandchild emits to its parent, and that parent's own template listens and, in turn, emits (or calls a method) that its own parent listens to, and so on. There is no built-in shortcut in what Module 1–2 have taught you; component communication is strictly parent ↔ direct-child. (A shortcut *does* exist — shared services with dependency injection — but that's **🔒 Coming Later — Outside This Module**.)

### The mental model, extended to three levels

```
CharacterCounterApp (root)
      │
      │ @Input() text, @Input() settings
      ↓
TextInputComponent                    StatsPanelComponent
      │                                       ↑
      │ @Output() textChanged                 │ @Input() stats
      └──────────────► (App recalculates) ────┘
```

Notice: `TextInputComponent` never talks to `StatsPanelComponent` directly. It emits up to `CharacterCounterApp`, which recalculates the stats and passes them down to `StatsPanelComponent`. **The parent is always the switchboard.** This is exactly the pattern Module 1's `DessertList` used between multiple `DessertCard`s, just made explicit now that you have three siblings' worth of coordination to reason about instead of one repeated child.

### Why route everything through the parent instead of letting siblings talk directly?

Because Angular doesn't provide a "sibling-to-sibling" binding mechanism at all — templates only ever bind to their own direct children. Even if it did, funneling all shared state through one parent keeps the data flow **traceable**: at any point, you can look at exactly one component (the parent) to understand the current state of the whole feature, instead of hunting through every sibling for hidden cross-talk.

### How does this compare to React?

| Angular | React |
|---|---|
| Data down via `@Input()`, strictly parent → direct child | Data down via props, strictly parent → direct child |
| Events up via `@Output()`/`EventEmitter`, strictly child → direct parent | Events up via callback props (a function passed down, then called by the child) |
| No built-in sibling-to-sibling binding | No built-in sibling-to-sibling binding either — same "lift state up to the common parent" pattern |

This is one of the few places Angular and React are almost procedurally identical — "lift shared state to the nearest common ancestor" is the standard answer in both.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Trying to bind `[value]` from one child directly onto a sibling's selector in the same template | Angular has no mechanism for a component to bind to a node that isn't its own template's direct child | Emit an `@Output()` to the shared parent; have the parent's `@Input()` binding pass the value to the sibling | Keeps data flow through the parent, the only place both children are reachable |
| Emitting an event and expecting a *grandparent* two levels up to catch it automatically | `@Output()` only notifies the direct parent's template — it doesn't bubble further on its own | Have the immediate parent's handler explicitly re-emit its own `@Output()`, one hop at a time | Each level only knows about its own direct parent/children — relaying is manual and explicit |

### ✅ Knowledge Check
1. If `TextInputComponent` and `StatsPanelComponent` are siblings, why can't `TextInputComponent` just pass data straight to `StatsPanelComponent`?
2. What does it mean, concretely, that "the parent is the switchboard"?

---

## 3. `@Input()` in Depth

Module 1 covered *receiving* an input and reading it once, safely, in `ngOnInit`. This section covers the two things Module 1 intentionally skipped: **reacting when an input changes**, and **controlling what happens the moment a value is assigned**.

### What is it, again? (quick recap)

`@Input()` marks a class property as settable from a parent's template via property binding: `[dessert]="d"` on the child's tag sets that child's `@Input() dessert`.

### The gap Module 1 left open

```typescript
export class TextInputComponent implements OnInit {
  @Input() text = '';

  ngOnInit() {
    console.log('Initial text:', this.text); // ✅ works fine, once
  }
}
```

This works the *first* time. But if the parent later updates `text` — say, the user clicks a "Clear" button that resets the parent's state — `ngOnInit` does **not** run again. `ngOnInit` is a **one-time** hook. Module 1 never needed to know this, because the dessert catalog never changed after the app started. The Character Counter App's whole point is text that changes constantly, so this gap becomes impossible to ignore.

### Two ways to react to a changing `@Input()`

**Option A — an `@Input()` setter** (a plain TypeScript pattern, not Angular-specific):
```typescript
export class TextInputComponent {
  private _text = '';

  @Input()
  set text(value: string) {
    this._text = value;
    console.log('text changed to:', value);
  }
  get text(): string {
    return this._text;
  }
}
```
A `set`/`get` pair lets you run code every time the parent assigns a new value to this specific input. This is useful when you only care about **one** input changing and want small, self-contained reaction logic right next to the property itself.

**Option B — `ngOnChanges`** (an Angular lifecycle hook, covered fully in [Section 6](#6-ngonchanges)): a single method that fires whenever **any** `@Input()` on the component changes, giving you both the new *and* previous value. Use this when you need to react to **multiple** inputs together, or need the previous value for comparison.

**Rule of thumb:** one input, simple reaction → setter. Multiple inputs, or you need the *previous* value → `ngOnChanges`.

### Immutability matters for `@Input()` objects

```typescript
@Input() settings!: { limitEnabled: boolean; maxLength: number };
```

If a parent does this:
```typescript
// ❌ mutates the existing object in place
this.settings.maxLength = 200;
```
Angular's default change detection (see [Section 9](#9-change-detection-basics)) and `ngOnChanges` both compare **by reference** for objects — mutating an object's properties in place does not change *which* object it is, so Angular may not reliably notice. Instead:
```typescript
// ✅ creates a new object reference
this.settings = { ...this.settings, maxLength: 200 };
```
This single habit — always replacing objects/arrays instead of mutating them — is what makes `ngOnChanges` (and, later, the `OnPush` change detection strategy) work correctly. It's worth building the habit now even before you're required to.

### Try It Yourself — Experiment: setter vs. plain property

```typescript
// Version A: plain property (Module 1 style)
@Input() maxLength = 150;

// Version B: setter
private _maxLength = 150;
@Input()
set maxLength(value: number) {
  console.log('maxLength updated to', value);
  this._maxLength = value;
}
get maxLength(): number {
  return this._maxLength;
}
```
Wire a parent button that changes the bound value a few times after initial load. With Version A, nothing logs after the first render. With Version B, every change logs. This is the exact gap `ngOnChanges` closes more generally — try it before reading Section 6 so the problem is concrete first.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Expecting `ngOnInit` to re-run when a parent updates an `@Input()` | `ngOnInit` runs exactly once, right after the *first* input assignment | Use an `@Input()` setter or `ngOnChanges` | Both are designed to run on every subsequent change, not just the first |
| Mutating an `@Input()` object/array in place (`this.settings.x = y`) | Same object reference in, same object reference out — nothing looks "new" to Angular's default comparison | Replace with a new object/array (`{ ...this.settings, x: y }`) | Gives Angular (and `ngOnChanges`) a genuinely different reference to detect |
| Defining both a setter *and* forgetting the matching getter | TypeScript requires a getter alongside a setter for the property to be readable elsewhere in the class/template | Always pair `get`/`set` together | The template and any internal code need to *read* `text`, not just receive updates to it |

### ✅ Knowledge Check
1. Why doesn't `ngOnInit` fire again when a parent changes an already-set `@Input()`?
2. Give one situation where an `@Input()` setter is enough, and one where you'd reach for `ngOnChanges` instead.

---

## 4. `@Output()` and `EventEmitter` in Depth

### Quick recap

`@Output() name = new EventEmitter<T>()` declares a custom event; `this.name.emit(value)` fires it; a parent listens via `(name)="handler($event)"`. Module 1 used this for a single, discrete action (clicking "Buy"). Module 2's Character Counter App needs to emit on **every keystroke** — a continuous stream, not a single click — which raises two new considerations.

### Emitting on every input, not just a click

```html
<textarea (input)="onInput($event)"></textarea>
```
```typescript
@Output() textChanged = new EventEmitter<string>();

onInput(event: Event): void {
  const value = (event.target as HTMLTextAreaElement).value;
  this.textChanged.emit(value);
}
```
Functionally this is the same `@Output()` pattern as Module 1 — the only difference is the *frequency* of emission (once per keystroke instead of once per click). Angular doesn't need anything special for this; it's worth calling out only because "emitting constantly" is a new shape of the same tool, and it's exactly the scenario that will make Sections 6–9 (reacting to changes, cleanup, change detection) concrete rather than abstract.

### Typing your `EventEmitter` precisely

```typescript
@Output() limitChanged = new EventEmitter<{ enabled: boolean; maxLength: number }>();
```
Always give `EventEmitter<T>` a specific type matching exactly what you `.emit(...)`. An untyped `EventEmitter()` (defaulting to `EventEmitter<any>`) compiles, but silently loses the safety net that would otherwise catch a parent handler expecting the wrong shape.

### When *not* to reach for `@Output()`

If a child needs to expose a value **continuously** for live display purposes only (no parent-side reaction needed beyond "show it"), and the parent already owns the source data, ask whether the child needs to emit anything at all — sometimes the parent can compute what it needs directly from data it already has, without a round-trip through the child. `@Output()` is for "the child knows something the parent doesn't and must report it" (raw keystrokes are a good example — only the `<textarea>` element knows exactly when a keystroke happened) — not a default for every piece of internal child state.

### Try It Yourself — Experiment: continuous emission

```typescript
// child: text-input.component.ts
@Output() textChanged = new EventEmitter<string>();
onInput(e: Event) {
  this.textChanged.emit((e.target as HTMLTextAreaElement).value);
}
```
```typescript
// parent
text = '';
onTextChanged(value: string) {
  this.text = value;
  console.log('Parent received:', value.length, 'characters');
}
```
Type into the textarea and watch the console log fire on every single keystroke. Then temporarily comment out the `emit(...)` call and confirm the parent's count freezes — a concrete demonstration that nothing crosses the parent/child boundary except what's explicitly emitted.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| `@Output() textChanged = new EventEmitter();` (untyped) | Compiles, but the parent's handler parameter type isn't checked against what's actually emitted | `@Output() textChanged = new EventEmitter<string>();` | Locks the emitted type so mismatches are caught at compile time |
| Emitting the whole `Event` object when the parent only needs the string value | Forces the parent to know DOM API details (`event.target as HTMLTextAreaElement`) that are really the child's concern | Extract the value inside the child, emit just the string | Keeps DOM-specific logic inside the one component that owns that template |
| Re-emitting on every keystroke when the feature actually only needs "did the user finish typing" | Fires far more parent-side recalculation than necessary | 🔒 *Debouncing this properly uses RxJS, outside this module* — for now, emitting on every keystroke is expected and fine; just be aware coarser control exists later | Performance tuning belongs to a later module; this module's goal is correct wiring, not optimization |

### ✅ Knowledge Check
1. Why should an `EventEmitter` almost always be given an explicit generic type?
2. What's the practical difference between emitting the raw DOM `Event` vs. emitting just the extracted string value?

---

## 5. Lifecycle Hooks: The Full Sequence

### What is a lifecycle hook, precisely?

A **lifecycle hook** is a method Angular calls automatically at a specific, predictable point in a component's life — creation, data updates, and destruction — provided you name the method exactly right (and, for type-safety, implement the matching interface). You met one of these already: `ngOnInit`. This section places it in context alongside its neighbors.

### Why does Angular need a whole *sequence* of hooks, instead of just one "ready" event?

Different setup/teardown tasks need to happen at genuinely different moments:
- Something that depends on an `@Input()` **before it's ever set** can't run in the constructor.
- Something that must react **every time** an `@Input()` changes (not just the first time) can't use a one-shot hook.
- Something that allocates a resource (a timer, a subscription, an event listener) needs a **guaranteed** place to clean that resource up, or it leaks for the lifetime of the whole application.

One hook can't serve all three needs at once, so Angular exposes several, each firing at a different well-defined moment.

### The sequence, for a component with `@Input()`s

```
1. Constructor runs                (plain TypeScript object creation — no inputs set yet)
2. ngOnChanges()                   (fires if the component has @Input()s — before the very first ngOnInit too)
3. ngOnInit()                      (fires exactly once, after the first ngOnChanges)
4. ngOnChanges()  ┐
5. (view re-renders)  │  this cycle repeats every time a bound @Input() value changes
   ... 
N. ngOnDestroy()                   (fires exactly once, right before Angular removes the component)
```

Only three of these are in this module's scope: `ngOnChanges`, `ngOnInit` (revisited), and `ngOnDestroy`. Angular has several more (`ngAfterViewInit`, `ngAfterContentInit`, `ngDoCheck`, and their `Checked` counterparts) — these matter once you're manipulating child component views or content projection directly, which is **🔒 Coming Later — Outside This Module**. You already used one of these early, in Module 1's Order Confirmation Modal (`ngAfterViewInit`, for focus management) — that was a deliberate, flagged exception to give the modal real accessibility; you're not expected to reach for it generally yet.

### Declaring hooks correctly

```typescript
import { Component, OnChanges, OnInit, OnDestroy, SimpleChanges } from '@angular/core';

@Component({ /* ... */ })
export class TextInputComponent implements OnChanges, OnInit, OnDestroy {
  ngOnChanges(changes: SimpleChanges): void { /* ... */ }
  ngOnInit(): void { /* ... */ }
  ngOnDestroy(): void { /* ... */ }
}
```
`implements OnChanges, OnInit, OnDestroy` is optional at runtime (Angular calls these methods by name, regardless), but it's a free correctness check from TypeScript: misspell `ngOnDestroy` as `ngOnDestory` without the interface, and nothing warns you — it simply never gets called, silently. With the interface implemented, TypeScript catches the typo immediately.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Assuming `ngOnDestroy` runs on every data change | Confuses it with `ngOnChanges` — `ngOnDestroy` runs exactly once, only when the component is being removed entirely | Use `ngOnChanges` for "something changed"; reserve `ngOnDestroy` for final cleanup only | Matches the hook to the actual event it represents |
| Misspelling a hook name (`ngOnint`, `ngonInit`) without `implements OnInit` | Angular matches hook names by exact string; a typo means the method silently never runs, with no error | Always add `implements OnInit` (or the matching interface) | TypeScript will refuse to compile if the interface's required method is missing/misnamed |
| Doing expensive setup work directly in the constructor | Constructor runs before Angular has wired up `@Input()`s — and mixing DI/setup concerns with object construction is fragile even when inputs aren't involved | Move it to `ngOnInit` | Guaranteed to run after the component's first inputs are set |

### ✅ Knowledge Check
1. Put these in the correct order: `ngOnInit`, constructor, `ngOnChanges` (first call).
2. Why might implementing `OnDestroy` (the TypeScript interface) save you from a bug you'd otherwise never notice?

### 🎥 Optional Video
**Lifecycle hooks walkthrough**
[Watch on YouTube](https://www.youtube.com/watch?v=jFk9-zV27BE)
**Useful for:** Seeing the full hook sequence fire in a live browser console, in order.
**Recommended when:** Right now, before Sections 6–8 go one hook at a time — seeing them all fire together first makes each individual section easier to place.

---

## 6. `ngOnChanges`

### What is it?

`ngOnChanges` is a lifecycle hook that fires **every time one or more `@Input()` values change** — including the very first time they're set (it actually fires *before* the first `ngOnInit`). It receives a `SimpleChanges` object describing exactly which inputs changed, and both their new and previous values.

### Why does Angular need it, given `ngOnInit` already exists?

`ngOnInit` answers "the component now has its first data — do initial setup." It cannot answer "the data just changed *again* — react to that," because it never runs a second time. `ngOnChanges` is the hook that *does* run again, every time, which is exactly what a live-updating Character Counter needs: the displayed stats must update every time the text input changes, not just once when the app loads.

### Syntax breakdown

```typescript
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({ /* ... */ })
export class StatsPanelComponent implements OnChanges {
  @Input() text = '';

  characterCount = 0;
  wordCount = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['text']) {
      const current = changes['text'].currentValue as string;
      const previous = changes['text'].previousValue as string;
      this.characterCount = current.length;
      this.wordCount = current.trim().length === 0 ? 0 : current.trim().split(/\s+/).length;
      console.log('text changed from', previous, 'to', current);
    }
  }
}
```

- **`changes: SimpleChanges`** — an object keyed by input property name (`changes['text']`, `changes['maxLength']`, etc.) — only the inputs that actually changed **this cycle** appear as keys.
- **`changes['text'].currentValue`** — the new value, already assigned to `this.text` by the time `ngOnChanges` runs.
- **`changes['text'].previousValue`** — the value *before* this change (this is the one piece of information a plain `@Input()` setter, from Section 3, does not give you directly — reason enough on its own to reach for `ngOnChanges` when the previous value matters).
- **`changes['text'].firstChange`** — `true` only on the very first call (equivalent to "this is effectively also acting as an initial setup moment").

### Guarding for multiple inputs

If a component has more than one `@Input()`, `ngOnChanges` fires once per change-detection cycle with **all** changed inputs bundled into the same `SimpleChanges` object — not once per property. Always check which key is actually present rather than assuming:

```typescript
ngOnChanges(changes: SimpleChanges): void {
  if (changes['text']) {
    this.recalculateStats();
  }
  if (changes['maxLength']) {
    this.checkLimitStatus();
  }
}
```

### When to use it

- Reacting to an `@Input()` changing after the component already exists — the Character Counter's `StatsPanelComponent` recalculating counts every time the text changes is the canonical case.
- Needing the **previous** value for comparison (e.g., "did the text just cross the character limit, going from under to over?").
- Reacting to **multiple** inputs whose combination matters (e.g., recompute only when *either* `text` or `maxLength` changes).

### When not to

- A single input, no need for the previous value → an `@Input()` setter (Section 3) is simpler and keeps the reaction logic next to the property it reacts to.
- One-time setup that never needs to repeat → `ngOnInit`.

### What happens behind the scenes?

Whenever Angular's change detection (Section 9) runs and notices that a parent's template binding produced a different value for one of a component's `@Input()`s, Angular collects every changed input for that component into one `SimpleChanges` object and calls `ngOnChanges` once, **before** updating the component's own view — so by the time your template re-renders, `ngOnChanges` has already had a chance to derive anything it needs to.

### Try It Yourself — Experiment: `ngOnChanges` with previous value

```typescript
@Input() maxLength = 150;

ngOnChanges(changes: SimpleChanges): void {
  if (changes['maxLength']) {
    console.log(
      `Limit changed from ${changes['maxLength'].previousValue} to ${changes['maxLength'].currentValue}`
    );
  }
}
```
Wire up a settings panel that lets you change the character limit a few times, and watch both values print each time — something a plain setter alone could not show you without manually tracking a "previous" variable yourself.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| `ngOnChanges(changes) { this.recalc(); }` with no key check, on a component with 3 `@Input()`s | Recalculates on *any* of the three changing, even ones irrelevant to that logic — wasteful, and can cause subtle bugs if the recalculation assumes a specific input changed | `if (changes['text']) { this.recalc(); }` | Only reacts to the specific input that logic actually cares about |
| Reading `this.text` inside `ngOnChanges` expecting the *old* value | By the time `ngOnChanges` runs, `this.text` already holds the **new** value — the class property is already updated | Use `changes['text'].previousValue` for the old value | `SimpleChanges` is the only place the previous value is still available |
| Expecting `ngOnChanges` to fire when something *inside* an `@Input()` object mutates, without replacing the object | Default change detection compares object inputs by reference; mutating in place doesn't produce a new reference | Replace the object (`this.settings = {...this.settings, x}`) from the parent, as covered in Section 3 | Only a new reference registers as "changed" |

### ✅ Knowledge Check
1. Why does `ngOnChanges` receive a `SimpleChanges` object instead of just the new value directly?
2. If a component has two `@Input()`s and only one changes, what does `changes` contain?

---

## 7. `ngOnInit` Revisited: vs `ngOnChanges`

You already know `ngOnInit` from Module 1 — this section exists purely to draw a hard, memorable line between it and `ngOnChanges`, since confusing the two is the single most common lifecycle mistake beginners make (and it's explicitly one of this module's quiz topics and discussion prompts).

### The core distinction

| | `ngOnInit` | `ngOnChanges` |
|---|---|---|
| Fires... | **Exactly once**, after the first `ngOnChanges` | **Every time** a bound `@Input()` changes, including the first time |
| Best for | One-time setup: initial API calls (🔒 later module), setting up non-input-dependent state, logging component creation | Reacting to data that changes *after* creation; comparing new vs. previous values |
| Needs `@Input()`s to fire? | No — fires even on components with zero inputs | Only fires on components that actually have `@Input()` properties |
| Gets the previous value? | N/A — there's no "previous" at creation time | Yes, via `SimpleChanges` |

### A scenario that requires `ngOnChanges` instead of `ngOnInit`

This is close to the module's own discussion prompt, spelled out concretely:

> The Character Counter App has a "Clear text" button in the parent. Clicking it resets the parent's `text` property to `''` and passes it down to `StatsPanelComponent` via `[text]="text"`. `StatsPanelComponent` needs its displayed character/word/sentence counts to immediately reset to zero.

If `StatsPanelComponent` only implemented `ngOnInit`, the counts would be computed once, when the component first appears — and would then **freeze**, never updating again no matter how many times the parent's text changes (including being cleared). `ngOnChanges` is the only one of the two hooks that fires on that reset, which is precisely why this scenario **requires** it.

### A scenario `ngOnInit` alone genuinely covers

If `TextInputComponent` needs to auto-focus its `<textarea>` the moment the app loads, and never again afterward, `ngOnInit` is the correct (and simpler) tool — there is nothing to "react to" repeatedly; it's a single, one-time action tied to the component's creation, not to any particular input's value.

### Using both together

Nothing stops a component from implementing both, for genuinely different jobs:

```typescript
export class StatsPanelComponent implements OnInit, OnChanges {
  @Input() text = '';
  characterCount = 0;

  ngOnInit(): void {
    console.log('StatsPanelComponent created'); // one-time setup/logging
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['text']) {
      this.characterCount = this.text.length; // recalculated on every change
    }
  }
}
```

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Putting stat-recalculation logic in `ngOnInit` only | Counts compute once and never update as the user types | Move the recalculation into `ngOnChanges` | Runs on every input change, not just creation |
| Putting one-time setup (like an initial console log or auto-focus) inside `ngOnChanges` | Runs redundantly on *every* change, not just once | Use `ngOnInit` for genuinely one-time actions | Matches the hook to something that should only happen once |
| Assuming `ngOnChanges` fires even for components with no `@Input()`s at all | It doesn't — with nothing to compare, there's nothing to report | Use `ngOnInit` (or a constructor, for non-Angular setup) instead | `ngOnChanges` is meaningless without at least one bound input |

### Exercises

**Level 1 — Basic:** Add `ngOnChanges` to a component with a single `@Input() count: number` and log the new and previous values every time it changes.

**Level 2 — Practical:** Build a component with two `@Input()`s (`text: string`, `maxLength: number`) whose `ngOnChanges` only recalculates a "characters remaining" value when *either* input changes, correctly guarding each with `changes['text']`/`changes['maxLength']`.

**Level 3 — Challenge:** Reproduce the "Clear text" scenario above end-to-end: a parent with a Clear button, a child `StatsPanelComponent` that resets its counts via `ngOnChanges` when the parent's text becomes `''`, and a one-time `ngOnInit` log confirming the component was only initialized once regardless of how many times Clear is clicked.

### ✅ Knowledge Check
1. In one sentence each: what is `ngOnInit` for, and what is `ngOnChanges` for?
2. Why would using `ngOnInit` alone be a real bug — not just a style issue — in the "Clear text" scenario?

### 🎥 Optional Video
**Component interaction: `@Input()`/`@Output()` walkthrough**
[Watch on YouTube](https://www.youtube.com/watch?v=BGy8DdGw_WE)
**Useful for:** Seeing parent/child data flow and event emission built live, reinforcing Sections 3–4 before the lifecycle-heavy sections that follow.

---

## 8. `ngOnDestroy`

### What is it?

`ngOnDestroy` is a lifecycle hook that fires **exactly once**, immediately before Angular removes a component from the DOM entirely — whether that's because an `*ngIf` condition became false, an `*ngFor` item was removed from its array, or the user navigated away (🔒 routing is a later module, but the same hook applies there too).

### Why does Angular need it?

Some things a component sets up **do not clean themselves up automatically** just because the component's markup disappears:
- A `setInterval`/`setTimeout` keeps running even after the DOM element it was updating is gone.
- A native event listener attached via `addEventListener` (e.g., to `window` or `document`) keeps firing.
- A subscription to an ongoing stream of data (🔒 RxJS `Subscription`s, covered properly later) keeps delivering values into a component that no longer exists.

Left uncleaned, each of these is a **memory leak**: the browser keeps a reference alive (the timer, the listener) pointing at a component instance that should have been garbage-collected, and the leaked callback can still try to update properties on a component that's no longer rendered — at best wasted work, at worst a runtime error.

### Syntax breakdown, with a concrete Character Counter scenario

Suppose a bonus feature shows a small "Still typing…" indicator that turns itself off after 2 seconds of inactivity, implemented with `setTimeout`, reset on every keystroke:

```typescript
import { Component, OnDestroy } from '@angular/core';

@Component({ /* ... */ })
export class TypingIndicatorComponent implements OnDestroy {
  isTyping = false;
  private idleTimeoutId?: ReturnType<typeof setTimeout>;

  onKeystroke(): void {
    this.isTyping = true;
    clearTimeout(this.idleTimeoutId);
    this.idleTimeoutId = setTimeout(() => {
      this.isTyping = false;
    }, 2000);
  }

  ngOnDestroy(): void {
    clearTimeout(this.idleTimeoutId);
  }
}
```

- **`private idleTimeoutId?: ReturnType<typeof setTimeout>`** — stores a handle to the pending timer so it can be cancelled later. `ReturnType<typeof setTimeout>` is just TypeScript's way of typing "whatever `setTimeout` returns," without hard-coding a browser-specific type.
- **`clearTimeout(this.idleTimeoutId)` inside `onKeystroke`** — cancels any *previous* pending timeout before starting a new one, so the indicator only turns off after 2 full seconds of no keystrokes (not 2 seconds after the *first* keystroke).
- **`ngOnDestroy() { clearTimeout(this.idleTimeoutId); }`** — the safety net: if the component itself is destroyed (e.g., the whole Character Counter panel is conditionally hidden via `*ngIf`) while a timeout is still pending, this guarantees the timer is cancelled rather than firing uselessly afterward.

### When to use it

Any time a component directly creates something with an explicit "start" that doesn't automatically "stop" on its own:
- `setInterval`/`setTimeout`
- `addEventListener` (especially on `window`/`document`, since those outlive any individual component)
- 🔒 RxJS subscriptions (the most common real-world use of `ngOnDestroy` — properly covered in a later module)

### When not to bother

- Plain `@Input()`/`@Output()` bindings, template bindings, and anything Angular itself manages need **no manual cleanup** — Angular already handles tearing down its own bindings and event listeners declared in templates (`(click)="..."` and friends) automatically.
- If a component creates nothing that outlives its own DOM element, it needs no `ngOnDestroy` at all — most components in this module (`DessertCard`, `StatsPanelComponent`, plain `TextInputComponent`) genuinely don't need one.

### What happens behind the scenes?

When Angular is about to destroy a component instance — remove its view, detach it from the change-detection tree, and make it eligible for garbage collection — it calls `ngOnDestroy` first, synchronously, giving your code one guaranteed last chance to run cleanup *before* the instance and its references are actually torn down.

### Try It Yourself — Experiment: proving the leak, then fixing it

```typescript
export class LeakyTimerComponent implements OnInit /* missing OnDestroy on purpose */ {
  ngOnInit(): void {
    setInterval(() => console.log('still running...'), 1000);
  }
}
```
Wrap this component in `*ngIf="showTimer"` in a parent, toggle `showTimer` to `false`, and watch the console — `"still running..."` keeps printing even though the component is gone. Now add:
```typescript
export class FixedTimerComponent implements OnInit, OnDestroy {
  private intervalId?: ReturnType<typeof setInterval>;
  ngOnInit(): void {
    this.intervalId = setInterval(() => console.log('still running...'), 1000);
  }
  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }
}
```
Toggle `showTimer` again — the logging now stops immediately when the component is removed. This side-by-side comparison is the clearest possible demonstration of what `ngOnDestroy` is actually for.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Starting a `setInterval`/`setTimeout` in `ngOnInit` with no matching `ngOnDestroy` | The timer keeps firing forever, even after the component is removed — a classic memory leak | Store the handle and `clearInterval`/`clearTimeout` it inside `ngOnDestroy` | Guarantees the timer stops exactly when the component does |
| Adding `window.addEventListener(...)` in a component with no cleanup | `window` outlives every component; the listener (and anything it closes over) is never released | `window.removeEventListener(...)` with the same handler reference, inside `ngOnDestroy` | Matches every `addEventListener` with a corresponding `removeEventListener` |
| Forgetting `implements OnDestroy` | Purely a safety net loss again (same as other hooks) — a misnamed method silently never runs | `export class X implements OnDestroy { ngOnDestroy() {...} }` | TypeScript verifies the method exists and is spelled correctly |

### ✅ Knowledge Check
1. Why doesn't a component's own `(click)="..."` event bindings need manual cleanup in `ngOnDestroy`, but a `window.addEventListener(...)` does?
2. What specifically would you observe in the browser console if `ngOnDestroy` were missing from a component using `setInterval`?

---

## 9. Change Detection Basics

### What is it?

**Change detection** is the mechanism Angular uses to notice that *something* might have changed (a variable was updated, an event fired, data arrived) and to walk the component tree checking whether any template bindings now need to update the real DOM. Everything in Modules 1–2 that "just worked" — interpolation updating, `*ngFor` adding rows, `ngOnChanges` firing — is only possible because change detection ran at the right moment and noticed a difference.

### Why does Angular need this, conceptually?

Plain JavaScript has no built-in way to know "a variable changed, therefore some DOM text needs updating" — that's exactly the manual-DOM-manipulation problem Module 1, Section 1 opened with. Angular's answer is to **run a check regularly enough** that it can catch changes shortly after they happen, then compare each binding's current expression value against what's currently rendered, updating only what's different.

### How does Angular know *when* to check? (Zone.js, at a beginner level)

By default, a new Angular project includes a library called **Zone.js**, which patches (wraps) common asynchronous browser APIs — DOM events (`click`, `input`, `keyup`...), `setTimeout`/`setInterval`, and Promises/`fetch` — so that Angular is notified whenever any of them run. Practically, this means:

- The user types in the Character Counter's `<textarea>` → the `input` event fires → Zone.js notifies Angular → Angular runs a change-detection pass across the component tree.
- A `setTimeout` callback runs (like the typing-indicator example in Section 8) → same notification → same change-detection pass.

You never call "run change detection" yourself for these cases — it's automatic, triggered by exactly the kinds of events your templates already bind to with `(click)`, `(input)`, and so on.

### What "a change-detection pass" actually does (default strategy)

By default (**🔒 the alternative, `OnPush`, is a later-module optimization**), when a change-detection pass runs, Angular walks **every component in the tree**, top to bottom, and for each one:
1. Re-evaluates every template expression (`{{ }}`, `[ ]` bindings) against the component's current property values.
2. If a value differs from what's currently rendered, updates just that piece of the real DOM.
3. If any `@Input()` bindings changed as part of this walk, calls that child's `ngOnChanges` (Section 6) before finishing that component's check.

This is why a single keystroke in `TextInputComponent` can result in `StatsPanelComponent`'s counts updating, even though the two are siblings with no direct connection: the keystroke triggers one whole-tree pass, during which `App`'s `text` property is updated (via the emitted `@Output()`), passed down to `StatsPanelComponent` as a changed `@Input()`, triggering its `ngOnChanges`, all within that same pass.

### How this connects to everything else in this module

```
User types in <textarea>
        │
        ▼
 (input) event fires → Zone.js notifies Angular
        │
        ▼
 Angular runs change detection across the whole tree
        │
        ├─► TextInputComponent's (input) handler runs → @Output() textChanged.emit(value)
        │
        ├─► App's onTextChanged(value) updates App.text
        │
        ├─► StatsPanelComponent's [text] input is now different → ngOnChanges fires → recalculates counts
        │
        └─► Every template expression across the tree is re-checked; only what changed touches the real DOM
```

### 🔒 Coming Later — Outside This Module

- **`ChangeDetectionStrategy.OnPush`** — an opt-in optimization that tells Angular to *skip* checking a component unless its `@Input()` references actually changed (or an event originated inside it) — this is exactly why the "always replace, never mutate" habit from Section 3 matters for the future, even though the default strategy in this module tolerates mutation working "well enough" most of the time.
- **Zone.js internals**, manually triggering change detection (`ChangeDetectorRef`), and zoneless Angular — all later-module/advanced territory.
- **Signals** — a newer, more granular reactivity primitive that changes some of this story; outside this module's scope entirely.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Assuming a plain class property change (e.g., inside a `setTimeout` callback using a *raw*, un-patched timer function acquired in an unusual way) never updates the view | Rare in beginner code, but confusing if encountered — normally Zone.js patches `setTimeout` automatically, so this "shouldn't" happen with standard code | Use the standard global `setTimeout`/`setInterval` (not some manually-detached reference) so Zone.js can patch it as expected | Keeps your code inside the mechanism Angular already wires up for you |
| Believing you must manually call something to "trigger a re-render" after a normal `(click)`/`(input)` handler | Change detection already runs automatically after any Zone.js-patched event | Just update the property — Angular re-checks bindings on its own right after the handler returns | This is the whole point of the default change-detection story |
| Thinking `ngOnChanges` and "change detection" are the same thing | `ngOnChanges` is one small *consequence* of a change-detection pass (specifically, for `@Input()`s) — change detection itself is the much bigger tree-walk-and-compare mechanism | Think of change detection as the umbrella process; `ngOnChanges` as one hook that fires as part of it | Keeps the two ideas at the right scope relative to each other |

### ✅ Knowledge Check
1. In your own words, what role does Zone.js play in making Angular's automatic UI updates possible?
2. Walk through, step by step, what happens between a user pressing a key in the Character Counter's textarea and the word count on screen updating.

### 🎥 Optional Video
No dedicated video was provided in the original resources for this specific topic — the official Angular Lifecycle Hooks guide (linked in Section 13) touches on the relationship between lifecycle hooks and change detection; the explanation above consolidates what this module needs without requiring the full Angular change-detection deep dive (which is considerably more advanced and 🔒 outside this module).

---

## 10. Putting It Together: Character Counter App Architecture

```
CharacterCounterApp (root)
 │
 │  - holds: text: string                (single source of truth for the current text)
 │  - holds: settings: { limitEnabled, maxLength }
 │  - computes: characterCount, wordCount, sentenceCount, isOverLimit
 │
 ├── TextInputComponent
 │     - @Input() text                    (so the textarea reflects resets/external changes)
 │     - @Input() maxLength                (to set the native `maxlength` attribute when limit is enabled)
 │     - @Output() textChanged             (emits on every keystroke)
 │     - ngOnChanges: syncs the textarea's displayed value if the parent resets `text` externally
 │     - [ngClass]: highlights the textarea border when at/near the limit
 │
 ├── SettingsPanelComponent
 │     - @Input() settings
 │     - @Output() settingsChanged         (emits { limitEnabled, maxLength } as a new object, never mutated)
 │
 └── StatsPanelComponent
       - @Input() text
       - @Input() maxLength
       - @Input() limitEnabled
       - ngOnChanges: recalculates characterCount/wordCount/sentenceCount whenever `text` changes;
                      recalculates "remaining characters" whenever `text` OR `maxLength` changes
       - *ngIf: shows a warning message once the limit is reached/exceeded
       - (optional bonus) TypingIndicatorComponent nested inside, demonstrating ngOnDestroy
```

**Data flow, end to end:** `CharacterCounterApp` owns `text` and `settings` as the single source of truth (same pattern as `AppComponent` owning the cart in Module 1). `TextInputComponent` emits every keystroke up via `@Output() textChanged`; the parent updates its own `text` property; that new value flows back down as a changed `@Input()` to both `TextInputComponent` itself (in case it needs to reflect an external reset, like a Clear button) and `StatsPanelComponent`, whose `ngOnChanges` recalculates every displayed statistic. `SettingsPanelComponent` follows the identical pattern for the character-limit settings, always emitting a **new** settings object rather than mutating the existing one (Section 3).

---

## 11. Final Module Project: Character Counter App

### Project Requirements

Build a small Angular app that takes free-form text input and gives the user live feedback about it.

### Functional Requirements

1. A root component (`CharacterCounterApp`) holding `text: string` and a `settings` object (`{ limitEnabled: boolean; maxLength: number }`) as the single source of truth.
2. A `TextInputComponent` that:
   - Renders a `<textarea>` bound to display the current text.
   - Emits the updated text via `@Output()` on every keystroke.
   - Reflects the native `maxlength` attribute when a character limit is enabled (via property binding).
   - Visually highlights (via `ngClass`) as the user approaches/reaches the limit.
3. A `StatsPanelComponent` that:
   - Receives `text` (and the limit settings) via `@Input()`.
   - Uses `ngOnChanges` to recalculate character count, word count, and sentence count every time `text` changes.
   - Shows a warning message (`*ngIf`) once the character limit is reached or exceeded.
4. A `SettingsPanelComponent` that:
   - Lets the user toggle the character limit on/off and set its value.
   - Emits a **new** settings object via `@Output()` any time either sub-value changes — never mutates the existing one in place.
5. A "Clear text" action in the root component that resets `text` to `''`, correctly propagating down through `@Input()`/`ngOnChanges` so `StatsPanelComponent`'s counts reset to zero and `TextInputComponent`'s displayed value clears — **without** relying on `ngOnInit` anywhere in this reset path.
6. (Optional but encouraged) A small `TypingIndicatorComponent` using `setTimeout`/`ngOnDestroy` as described in Section 8, to give `ngOnDestroy` genuine, working code in the project rather than only appearing in the reference material.

### Suggested Component Structure

```
CharacterCounterApp
 ├── TextInputComponent
 ├── SettingsPanelComponent
 └── StatsPanelComponent
       └── TypingIndicatorComponent (optional)
```

### Required Angular Concepts (checklist)

- [ ] Multi-level component hierarchy (at least 3 sibling-level components under one root)
- [ ] `@Input()` (plain property *and* at least one setter, per Section 3)
- [ ] `@Output()` + `EventEmitter`, correctly typed
- [ ] `ngOnChanges` reacting to `text` (and ideally `maxLength`) with correct key-guarding
- [ ] `ngOnInit` used only for genuinely one-time setup
- [ ] (Optional) `ngOnDestroy` cleaning up a `setTimeout`/`setInterval`
- [ ] `*ngIf` for the limit-warning message
- [ ] `ngClass` for the near-limit/over-limit textarea highlight
- [ ] Settings updates always replace the settings object rather than mutating it

### Acceptance Criteria

- Typing in the textarea updates character/word/sentence counts live, with no manual refresh.
- Clicking "Clear text" resets both the textarea and all displayed counts to zero, and this reset works entirely through `@Input()`/`ngOnChanges` — not `ngOnInit`.
- Enabling a character limit visually constrains/warns the user once reached; disabling it removes the constraint.
- No component mutates an `@Input()` object/array in place anywhere in the codebase.
- (If built) The typing indicator correctly turns itself off after 2 seconds of inactivity, and produces no console warnings/leaks when the component containing it is removed via `*ngIf`.

### Hints (if stuck)

- Start by getting `TextInputComponent` → `CharacterCounterApp` → `StatsPanelComponent` working end-to-end with just character count, *before* adding word/sentence counts or the settings panel — this proves the whole data-flow loop early.
- If counts "freeze" after a Clear button click, you've likely put the recalculation logic in `ngOnInit` instead of `ngOnChanges` — this is the exact scenario Section 7 walks through.
- If `ngOnChanges` doesn't seem to fire when you expect, check whether you're mutating an object/array input in place instead of replacing it (Section 3/6).

### Optional Stretch Challenges

- Add a reading-time estimate ("~1 min read") recalculated in the same `ngOnChanges`.
- Add the `TypingIndicatorComponent` bonus described above, and deliberately verify the "leak vs. fixed" comparison from Section 8's Try It Yourself using your own component.
- Add a sentence-count heuristic that's a little smarter than "split on periods" (e.g., also handling `!`/`?`) and discuss, as a comment, what edge cases it still misses — a good habit for thinking about "good enough for this module" vs. production-grade text parsing (which is its own deep topic, well outside this module).

---

## 12. Quick Reference Sheet

### Lifecycle Hooks (Module 2 scope)
```
constructor()                    Plain object creation — no @Input()s set yet
ngOnChanges(changes)              Fires on every @Input() change, including the first — needs OnChanges
ngOnInit()                        Fires exactly once, after the first ngOnChanges — needs OnInit
ngOnDestroy()                     Fires exactly once, right before the component is removed — needs OnDestroy
```

### `SimpleChanges` shape
```
changes['propName'].currentValue    The new value (already assigned to the property)
changes['propName'].previousValue   The value before this change
changes['propName'].firstChange     true only on the very first call
```

### `@Input()` patterns
```
@Input() prop: Type;                        Plain property — read anytime after ngOnInit
@Input() set prop(value: Type) { ... }      Setter — reacts to this one input specifically
```

### `@Output()` pattern
```
@Output() name = new EventEmitter<Type>();  Always type the generic explicitly
this.name.emit(value);
(name)="handler($event)"                    Parent listens the same way as any DOM event
```

### Change Detection (default strategy, Module 2 scope)
```
Zone.js patches: DOM events, setTimeout/setInterval, Promises/fetch
  → notifies Angular → change detection walks the whole component tree
  → re-checks every template binding → updates only what changed
  → fires ngOnChanges for any @Input() that changed along the way
```

### Important Terminology

| Term | Definition |
|---|---|
| **Component hierarchy** | The tree structure formed by components containing other components. |
| **`SimpleChanges`** | The object `ngOnChanges` receives, describing which `@Input()`s changed and their old/new values. |
| **Lifecycle hook** | A method Angular calls automatically at a specific point in a component's life. |
| **`ngOnChanges`** | Fires on every `@Input()` change, including the first. |
| **`ngOnInit`** | Fires exactly once, after the first `ngOnChanges`. |
| **`ngOnDestroy`** | Fires exactly once, right before a component is removed — the place for cleanup. |
| **Change detection** | Angular's mechanism for noticing data changes and updating the DOM to match. |
| **Zone.js** | The library that patches async browser APIs so Angular knows when to run change detection. |
| **Memory leak** | A resource (timer, listener, subscription) that outlives the component that created it because it was never cleaned up. |
| **Immutability (in this context)** | Replacing an object/array with a new one instead of mutating it in place, so reference-based change detection can detect the update. |

### 🔒 Coming Later — Outside This Module
`ChangeDetectionStrategy.OnPush` · Signals · RxJS (including `Subscription`-based cleanup in `ngOnDestroy`) · `ngAfterViewInit`/`ngAfterContentInit`/`ngDoCheck` in depth · Routing · Dependency-injected shared services for cross-sibling communication · HTTP · Forms · Testing

---

## 13. Source & Resource Mapping

| Module Topic | Source Resource | Knowledge Extracted |
|---|---|---|
| Component hierarchy, `@Input()`/`@Output()` deep dive | Angular.io — "Component Interaction" (v17) | Parent/child data flow rules, setter pattern, typed `EventEmitter` |
| `@Input()`/`@Output()` live demonstration | YouTube — "@Input() and @Output() walkthrough" | Practical reinforcement of decorator usage shown building live |
| Lifecycle hooks: sequence, purpose, `ngOnChanges`/`ngOnDestroy` | Angular.io — "Lifecycle Hooks" (v17) | Full hook sequence, `SimpleChanges` shape, cleanup patterns |
| Lifecycle hooks live demonstration | YouTube — "Lifecycle hooks walkthrough" | Console-level demonstration of hook firing order |
| Change detection basics | Angular.io — "Lifecycle Hooks" (contextual coverage) | High-level Zone.js/change-detection relationship, kept intentionally beginner-level per this module's "Analyze the basics" objective |

**Quick links for deeper reading (optional, not required to complete this module):**
- [Component Interaction — Angular.io](https://v17.angular.io/guide/component-interaction)
- [Lifecycle Hooks — Angular.io](https://v17.angular.io/guide/lifecycle-hooks)
- [@Input()/@Output() walkthrough — YouTube](https://www.youtube.com/watch?v=BGy8DdGw_WE)
- [Lifecycle hooks walkthrough — YouTube](https://www.youtube.com/watch?v=jFk9-zV27BE)

---

### Discussion Prompt (from the original module)

> What is the key difference between the `ngOnInit()` and `ngOnChanges()` lifecycle hooks? Describe a scenario where you must use `ngOnChanges()` (instead of `ngOnInit()`) to react to data changes.

Section 7 walks through exactly this scenario (the Character Counter's "Clear text" button) in full — use it as the basis for your answer, but explain it in your own words: `ngOnInit` fires once, at creation, and is blind to anything that happens afterward; `ngOnChanges` fires on every subsequent `@Input()` change and is therefore the only one of the two that can keep a display in sync with data that keeps changing after the component is first created.
