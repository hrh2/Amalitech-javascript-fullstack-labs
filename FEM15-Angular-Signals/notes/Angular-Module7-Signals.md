# Module 7: Angular Signals
### FEM15 — continues from FEM09 (Angular Fundamentals) through FEM14 (RxJS & Observables)

> **Scope note:** This document covers *only* Module 7 — the reactive-state/fine-grained-change-detection motivation behind Signals, writable signals (`signal()`, `.set()`, `.update()`), `computed()`, `effect()`, signal-based component inputs (`input()`), a brief, bounded look at Observable interop (`toSignal()`), and a full Signals-vs-Observables comparison. Anything beyond that — signal-based outputs (`output()`) in depth, `linkedSignal()`, deep RxJS-interop patterns (`toObservable()`, `outputFromObservable()`), Signal-based forms, zoneless change detection, and NgRx Signal Store — is flagged **🔒 Coming Later — Outside This Module**.
>
> **A version note before you start:** this module's own learning objectives mention updating a signal's value with `.set()`, `.update()`, **and** `.mutate()`. `.mutate()` existed during Signals' early developer-preview period but was **removed before Angular's stable Signals release** specifically because it allowed mutating a signal's held value in place — which undermines the same reference-based change-detection principle Module 3 already taught you to respect (never mutate an `@Input()` object in place; always replace it). Current, stable Angular has **only** `.set()` and `.update()`. This document teaches both real APIs and explains exactly why `.mutate()` isn't there for you to reach for — so if you go looking for it, you'll know why it's missing rather than assuming something is broken.

---

## How this document is organized

Same documentation-first shape as Modules 1–6:

**What is it? → Why does Angular need it? → How does it work? → Syntax breakdown → Examples → When to use / not use → What happens behind the scenes? → How it connects to other concepts → Try It Yourself → Exercises → Common Mistakes**

Everything ties back to this module's running example: the **Reactive Recipe Finder** — a search-and-filter interface for recipes, built entirely with `signal()`, `computed()`, and `effect()`.

---

## Table of Contents

1. [From Module 6 to Module 7: What's New](#1-from-module-6-to-module-7-whats-new)
2. [The "Why" of Signals: Reactive State & Fine-Grained Change Detection](#2-the-why-of-signals-reactive-state--fine-grained-change-detection)
3. [Writable Signals](#3-writable-signals)
4. [Computed Signals](#4-computed-signals)
5. [Effects](#5-effects)
6. [Signal-Based Inputs: Refactoring Away From `@Input()`](#6-signal-based-inputs-refactoring-away-from-input)
7. [A Bounded Look at Interop: `toSignal()`](#7-a-bounded-look-at-interop-tosignal)
8. [Signals vs. Observables: The Full Comparison](#8-signals-vs-observables-the-full-comparison)
9. [Putting It Together: Reactive Recipe Finder Architecture](#9-putting-it-together-reactive-recipe-finder-architecture)
10. [Final Module Project: Reactive Recipe Finder](#10-final-module-project-reactive-recipe-finder)
11. [Quick Reference Sheet](#11-quick-reference-sheet)
12. [Source & Resource Mapping](#12-source--resource-mapping)

---

## 1. From Module 6 to Module 7: What's New

Module 6, Section 9 previewed Signals just enough to place them next to Observables and explain why the course taught RxJS first (`HttpClient`, the Router, and Forms all remain Observable-based). This module delivers the depth that section deliberately deferred: how to actually build reactive component state with `signal()`, `computed()`, and `effect()`, and — matching this module's own sixth learning objective — how to *refactor* existing `@Input()`-based or RxJS-based code into Signals where it genuinely simplifies things.

This is also the first module whose lab (the Reactive Recipe Finder) is a **new application**, not a continuation of the Dessert Shop or Kanban apps — a deliberate choice, since building something with Signals *from the start* is a different, useful exercise from retrofitting them onto code already shaped around `@Input()`/RxJS habits.

### ✅ Knowledge Check
1. Why does this course teach RxJS (Module 6) before Signals (this module), rather than the reverse?

---

## 2. The "Why" of Signals: Reactive State & Fine-Grained Change Detection

### What is "reactive state," in this context?

**Reactive state** is a value that automatically notifies whatever depends on it whenever it changes — you've actually already been relying on a form of this since Module 1 (a component property changing, and its template automatically updating). Signals give that same idea an explicit, first-class **wrapper object**, rather than leaving it as an implicit consequence of Angular's whole-tree change-detection walk (Module 2, Section 9).

### Why does Angular need this, given change detection (Module 2) already exists?

Recall Module 2's default change-detection story: a change-detection pass walks **every component in the tree**, re-checking **every template expression**, to figure out what actually changed. This works, and is what every app in this course has run on so far — but it means a single keystroke in one small component can trigger Angular to re-check bindings across the *entire* application, even in components with no relevant changes at all, simply because the default strategy doesn't know in advance which parts of the tree could possibly be affected.

Signals exist to make that **precise** instead of exhaustive. A signal wraps a value and — critically — **tracks exactly which parts of a template (or which `computed()`/`effect()`) actually read it**. When that signal's value changes, Angular can update *exactly* those dependent places, without needing to re-check the rest of the tree "just in case." This is called **fine-grained reactivity** — fine-grained because the unit of "what needs to update" shrinks from "possibly everything" down to "precisely what actually depends on this one value."

### The "pull" vs. "push" distinction (Signals vs. Observables, previewed)

- **Signals are "pull"-based**: reading a signal's current value (`count()`) is a plain, synchronous function call that returns whatever the value currently is, on demand, whenever you ask.
- **Observables are "push"-based**: you don't ask an Observable "what's your current value right now" — you `.subscribe()`, and it *pushes* values to you over time, whenever they happen to occur (Module 6).

This distinction is the core of this module's own third resource ("Angular Signals | Angular University Blog") and is worth holding onto through every section that follows — it explains almost every syntactic and behavioral difference between the two systems, covered fully in Section 8.

### A first, minimal look (full syntax in Section 3)

```typescript
import { signal } from '@angular/core';

const count = signal(0);

console.log(count());  // 0 — reading a signal is just calling it like a function
count.set(5);
console.log(count());  // 5
```
Compare this to the Observable-based equivalent from Module 6:
```typescript
import { BehaviorSubject } from 'rxjs'; // 🔒 BehaviorSubject itself is outside this course's RxJS depth

const count$ = new BehaviorSubject(0);
count$.subscribe((value) => console.log(value)); // must subscribe to ever see a value at all
count$.next(5);
```
Reading a signal needs **no subscription at all** — this is the single most immediately visible difference, and directly demonstrates the "pull" framing above.

### How does this compare to React?

| Angular Signals | React |
|---|---|
| `signal(initialValue)`, read via `count()` | `useState(initialValue)`, read via the state variable directly |
| `.set(newValue)` / `.update(fn)` | The setter function returned by `useState` |
| `computed(() => ...)`, automatically tracks dependencies | `useMemo(() => ..., [deps])`, dependencies listed manually |
| `effect(() => { ... })`, automatically tracks dependencies | `useEffect(() => { ... }, [deps])`, dependencies listed manually |

The comparison to React's hooks is closer than anything Observables offered — both systems are built around small, explicit reactive containers read directly in component logic — with one meaningful difference worth noting: Angular's `computed()`/`effect()` **automatically** detect which signals they depend on just by reading them, while React's `useMemo`/`useEffect` require you to **manually** list dependencies in an array, a well-known source of subtle bugs in React code when that list is incomplete or stale.

### 🎥 Optional Video
**Angular Signals: The Future of Reactivity in Angular? (Fireship) (3 min)**
[Watch on YouTube](https://www.youtube.com/watch?v=Qy-oUc5eB2M)
**Useful for:** A very fast, high-level framing of exactly this section's motivation, before any syntax.
**Recommended when:** Right now — it's short, and this section already stands on its own alongside it.

### ✅ Knowledge Check
1. In your own words, what does "fine-grained" mean in the context of Signals-based change detection, contrasted with Module 2's default whole-tree walk?
2. What does it mean that Signals are "pull"-based while Observables are "push"-based?

---

## 3. Writable Signals

### What is a writable signal?

A **writable signal** is a signal whose value can be changed directly, created with `signal(initialValue)` — the most basic building block of Signals-based state, roughly analogous to a plain component property (`count = 0`), but reactive.

### Syntax breakdown

```typescript
import { Component, signal } from '@angular/core';

@Component({ /* ... */ })
export class RecipeSearchComponent {
  searchTerm = signal('');
  favoritesOnly = signal(false);
  resultCount = signal(0);
}
```
```html
<input [value]="searchTerm()" (input)="searchTerm.set($any($event.target).value)" />
<p>{{ resultCount() }} results</p>
```
- **`signal('')`** — creates a writable signal, initialized to an empty string. The **type** of the signal (`WritableSignal<string>`) is inferred from the initial value, exactly like a plain `let x = ''` would infer `string`.
- **`searchTerm()`** — reading a signal's current value is done by **calling it like a function** — this is the syntax that makes Signals immediately visually distinct from a plain property (no parentheses) or an Observable (needs `.subscribe()`/`| async`).
- **`{{ resultCount() }}`** — in a template, a signal is read the exact same way as in the class: call it. Angular's template compiler recognizes this pattern and automatically sets up the fine-grained tracking described in Section 2.

### `.set()` — replacing the value entirely

```typescript
searchTerm = signal('');
searchTerm.set('chocolate cake');
```
`.set(newValue)` replaces the signal's current value outright — directly comparable to plain assignment (`this.searchTerm = 'chocolate cake'`), just going through the signal's own method instead of the `=` operator, since a signal isn't a plain variable Angular could intercept assignment to.

### `.update()` — deriving the new value from the current one

```typescript
resultCount = signal(0);
resultCount.update((current) => current + 1);
```
`.update(fn)` receives the **current** value and returns the **new** value — the natural choice whenever the new value depends on the old one (incrementing a count, toggling a boolean, appending to a list), rather than replacing it with something computed independently.

```typescript
favoritesOnly = signal(false);
favoritesOnly.update((current) => !current); // toggling a boolean
```

### Why there is no `.mutate()` in current Angular — the immutability principle, revisited

Early Signals previews included a `.mutate()` method allowing in-place changes to an object/array held by a signal (e.g., pushing an item directly into an array signal's existing array). It was **removed before the stable release**, and the reason is the exact same one Module 3 already taught for `@Input()` objects: **reference-based change detection needs a genuinely new reference to recognize that something changed.** If a signal held an array and `.mutate()` pushed into it in place, the signal's *reference* would never actually change — any `computed()`/`effect()`/template binding depending on it might not reliably re-run, since "did this signal's value change" is checked by reference, not by deep-inspecting its contents.

```typescript
// ❌ the removed .mutate() pattern — no longer available, and wouldn't reliably notify dependents anyway
favoriteRecipeIds.mutate((ids) => ids.push(42));

// ✅ current, correct pattern: always produce a NEW array/object via .update()
favoriteRecipeIds.update((ids) => [...ids, 42]);
```
This should feel immediately familiar: it's the **exact same habit** Module 3, Section 3 established for `@Input()` objects ("always replace, never mutate"), now enforced by Signals' own API design rather than left as a best-practice suggestion.

### Three worked examples

**Example 1 — a simple counter (the canonical minimal example):**
```typescript
count = signal(0);
increment(): void { this.count.update((c) => c + 1); }
decrement(): void { this.count.update((c) => c - 1); }
reset(): void { this.count.set(0); }
```

**Example 2 — an array signal, updated immutably:**
```typescript
favoriteRecipeIds = signal<number[]>([]);

addFavorite(id: number): void {
  this.favoriteRecipeIds.update((ids) => [...ids, id]);
}

removeFavorite(id: number): void {
  this.favoriteRecipeIds.update((ids) => ids.filter((existingId) => existingId !== id));
}
```

**Example 3 — an object signal, updated immutably (directly parallel to Module 3's `@Input()` settings example):**
```typescript
filters = signal({ maxPrepTime: 60, favoritesOnly: false });

setMaxPrepTime(minutes: number): void {
  this.filters.update((current) => ({ ...current, maxPrepTime: minutes }));
}
```

### Try It Yourself — Experiment: `.set()` vs. `.update()`

```typescript
count = signal(10);
```
Try `this.count.set(this.count() + 1)` and `this.count.update((c) => c + 1)` side by side — both produce the identical result for this simple case. Now imagine (or actually build) a button that both effects could race on if triggered rapidly/programmatically from two different places at once — `.update()` is the safer default whenever the new value is *derived from* the current one, since it always operates on whatever the value actually is at the moment it runs, rather than a value read slightly earlier and potentially now stale.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| `searchTerm` (no parentheses) inside a template or class, expecting the current value | This refers to the **signal itself** (a function/object), not its value | `searchTerm()` — always call it to read the current value | Matches the actual API: signals are read by invocation |
| `favoriteRecipeIds().push(id)` to try to add to an array signal's contents | Mutates the array in place; the signal's reference never changes, so dependents may not reliably re-run | `favoriteRecipeIds.update((ids) => [...ids, id])` | Produces a genuinely new array reference, which fine-grained tracking can detect |
| Looking for `.mutate()` in current Angular documentation/autocomplete and assuming something is broken when it's missing | `.mutate()` was removed before the stable release, precisely because it encouraged the in-place-mutation pattern just described | Use `.update()` with an immutable pattern instead | This is a deliberate, documented API design decision, not a bug or version mismatch on your end |
| Calling `.set()` with a value computed from a possibly-stale read of the signal's own current value (e.g., `count.set(count() + 1)` inside code that might run concurrently with other updates) | Can read a value that's about to be superseded by another pending update, in more complex scenarios | Prefer `.update((current) => current + 1)` whenever the new value depends on the old one | `.update()`'s callback always receives the true current value at the moment it actually runs |

### ✅ Knowledge Check
1. Why is `favoriteRecipeIds()` different from `favoriteRecipeIds` in what it refers to?
2. Why was `.mutate()` removed from Signals before Angular's stable release, and what does its removal have in common with a rule Module 3 already taught?

### 🎥 Optional Video
**Angular Signals - A Deep Dive (Angular University) (31 min)**
[Watch on YouTube](https://www.youtube.com/watch?v=n1a2eQ0Zyls)
**Useful for:** A comprehensive, practical walkthrough of the full Signals API — `signal()`, `.set()`, `.update()`, `computed()`, and `effect()` — reinforcing this section and Sections 4–5 together.

---

## 4. Computed Signals

### What is it?

A **computed signal**, created with `computed(() => ...)`, is a **read-only** signal whose value is automatically **derived** from one or more other signals — it recalculates itself whenever any signal it reads changes, and does nothing at all if none of them have.

### Why does Angular need this, instead of just recalculating a value manually whenever needed?

Recipe search naturally needs derived values: "how many results match the current search term and filters," "is the favorites list empty," "what's the filtered recipe list itself." You could recompute these by hand, in a method called whenever anything might have changed — but that either means recomputing far too often (every change-detection cycle, whether or not the inputs actually changed) or means manually tracking exactly which of several signals changed and recomputing conditionally, error-prone bookkeeping `computed()` does automatically and correctly.

### Syntax breakdown

```typescript
import { Component, signal, computed } from '@angular/core';

@Component({ /* ... */ })
export class RecipeFinderComponent {
  allRecipes = signal<Recipe[]>([/* ... */]);
  searchTerm = signal('');

  filteredRecipes = computed(() =>
    this.allRecipes().filter((recipe) =>
      recipe.name.toLowerCase().includes(this.searchTerm().toLowerCase())
    )
  );
}
```
```html
<p>{{ filteredRecipes().length }} recipes found</p>
<ul>
  <li *ngFor="let recipe of filteredRecipes()">{{ recipe.name }}</li>
</ul>
```
- **`computed(() => ...)`** — the function passed in **reads** other signals (`this.allRecipes()`, `this.searchTerm()`) directly, using normal signal-call syntax. Angular automatically detects **which** signals were read during that function's execution — there's no dependency array to maintain manually, unlike React's `useMemo` (Section 2's comparison).
- **`filteredRecipes()`** — read exactly like a writable signal, via a function call — the only difference is you **cannot** call `.set()`/`.update()` on it; a computed signal's value is entirely derived, never assigned directly.
- **Automatic recalculation, only when needed** — if neither `allRecipes` nor `searchTerm` has changed since the last read, `filteredRecipes()` returns a cached result instead of re-filtering the array pointlessly.

### Chaining computed signals

```typescript
allRecipes = signal<Recipe[]>([/* ... */]);
searchTerm = signal('');
maxPrepTime = signal(60);

searchedRecipes = computed(() =>
  this.allRecipes().filter((r) => r.name.toLowerCase().includes(this.searchTerm().toLowerCase()))
);

filteredRecipes = computed(() =>
  this.searchedRecipes().filter((r) => r.prepTimeMinutes <= this.maxPrepTime())
);
```
`computed()` signals can read **other** `computed()` signals, not just writable ones — Angular tracks the dependency chain transparently across as many layers as needed, recalculating only the links actually affected by whatever changed.

### Three worked examples

**Example 1 — a simple derived boolean:**
```typescript
favoriteRecipeIds = signal<number[]>([]);
hasFavorites = computed(() => this.favoriteRecipeIds().length > 0);
```

**Example 2 — combining several signals into one derived object (useful for passing a single, cohesive value into a child component):**
```typescript
searchTerm = signal('');
maxPrepTime = signal(60);

activeFilters = computed(() => ({
  term: this.searchTerm(),
  maxPrepTime: this.maxPrepTime()
}));
```

**Example 3 — the filtered-and-searched recipe list, feeding a result count too:**
```typescript
filteredRecipes = computed(() => /* ... as above ... */);
resultCount = computed(() => this.filteredRecipes().length);
```

### When to use `computed()`

Any value that's **entirely derivable** from other signals — filtering, sorting, counting, formatting, combining. If you find yourself writing a method that recalculates something from current signal values and manually storing the result in *another* writable signal via `.set()`, that's usually a sign `computed()` is the more correct tool.

### When not to

Anything involving a **side effect** (an HTTP call, logging, updating something outside the signal system entirely) does not belong in `computed()` — a computed function should be a **pure** calculation with no side effects, since Angular may call it more or fewer times than you'd expect for a normal function (it's optimized around caching and only recalculating when truly necessary). Side effects belong in `effect()` instead (Section 5).

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Calling `.set()` or `.update()` on a `computed()` signal | Computed signals are **read-only** — there's no method to assign them directly, by design | Change the writable signals it depends on instead; the computed signal updates itself automatically | Keeps derived values honestly derived, never a separate, independently-settable source of truth |
| Putting a side effect (an HTTP call, a `console.log` used for more than quick debugging, mutating an unrelated variable) inside a `computed()` function | `computed()` is meant to be pure; Angular may re-run it at unexpected times for caching/optimization reasons, so side effects inside it can run more or less often than intended | Use `effect()` (Section 5) for side effects; keep `computed()` purely calculating a derived value | Matches each tool to what it's actually designed and optimized for |
| Manually recomputing and `.set()`-ing a "derived" value inside every method that changes any of its inputs | Repeats the same recalculation logic in multiple places, and risks forgetting to update it from some code path | Use `computed()` once; let Angular keep it in sync automatically everywhere its inputs change | Centralizes the derivation logic in exactly one place, correctly reactive by construction |

### Exercises

**Level 1 — Basic:** Given `allRecipes = signal<Recipe[]>([...])` and `searchTerm = signal('')`, write a `computed()` signal producing the filtered list by name.

**Level 2 — Practical:** Add a `maxPrepTime = signal(60)` and a second, chained `computed()` signal further filtering the Level 1 result by prep time.

**Level 3 — Challenge:** Add a `favoritesOnly = signal(false)` toggle and a `favoriteRecipeIds = signal<number[]>([])` list, and produce a final `computed()` signal that additionally filters to only favorited recipes when `favoritesOnly()` is true — chaining three levels of `computed()` derivation together.

### ✅ Knowledge Check
1. Why can't you call `.set()` on a `computed()` signal?
2. Why does putting an HTTP call inside a `computed()` function specifically cause problems, beyond just being poor style?

---

## 5. Effects

### What is it?

An **effect**, created with `effect(() => ...)`, is a block of code that automatically **re-runs whenever any signal it reads changes** — used specifically for **side effects** (logging, saving to local storage, manually syncing with a non-signal-based API) rather than for producing a value the way `computed()` does.

### Why does Angular need a separate primitive for this, instead of just using `computed()` everywhere?

Section 4 established that `computed()` must stay pure — no side effects — because Angular may re-run it more or less often than a naive reading of the code would suggest, purely for its own internal caching. `effect()` is the intentionally-separate tool for the cases where a **side effect** genuinely needs to happen in response to signal changes — it makes the *intent* ("this code has side effects and that's expected") explicit and distinct from "this code purely calculates a value."

### Syntax breakdown

```typescript
import { Component, signal, effect } from '@angular/core';

@Component({ /* ... */ })
export class RecipeFinderComponent {
  searchTerm = signal('');

  constructor() {
    effect(() => {
      console.log('Search term is now:', this.searchTerm());
    });
  }
}
```
- **`effect(() => {...})`** — like `computed()`, the function automatically tracks which signals it reads (`this.searchTerm()` here) and re-runs the whole function again whenever any of them change.
- **Called inside the constructor** — this is a real, meaningful requirement, not incidental style: `effect()` must be called within an **injection context** (the same concept Module 4's `inject()` relied on) — a component's constructor is the most common valid place for this in ordinary component code.

### A realistic example: syncing a signal to `localStorage`

```typescript
export class RecipeFinderComponent {
  favoriteRecipeIds = signal<number[]>(this.loadFavoritesFromStorage());

  constructor() {
    effect(() => {
      localStorage.setItem('favoriteRecipeIds', JSON.stringify(this.favoriteRecipeIds()));
    });
  }

  private loadFavoritesFromStorage(): number[] {
    const raw = localStorage.getItem('favoriteRecipeIds');
    return raw ? JSON.parse(raw) : [];
  }
}
```
Every time `favoriteRecipeIds` changes (via `.update()`, Section 3), this effect automatically re-runs and persists the new list — genuinely a side effect (writing to `localStorage`, a browser API entirely outside the signal system), exactly the kind of work `computed()` was described as unsuited for in Section 4.

### Effects and lifecycle — a direct connection to Module 2

An `effect()` is automatically cleaned up when its containing component is destroyed — conceptually parallel to Module 2's `ngOnDestroy`-based cleanup for subscriptions/timers, except Angular handles the cleanup **for you** here, since the effect is tied to the component's own injector lifetime. You do not need to manually "unsubscribe" from an effect the way Module 6 required for Observable subscriptions.

### Three worked examples

**Example 1 — logging, for debugging (shown above).**

**Example 2 — persisting state to `localStorage`** (shown above).

**Example 3 — a guarded effect, reacting only when a derived condition becomes true:**
```typescript
resultCount = computed(() => this.filteredRecipes().length);

constructor() {
  effect(() => {
    if (this.resultCount() === 0) {
      console.log('No recipes matched — consider showing a helpful empty state.');
    }
  });
}
```
This demonstrates `effect()` reading a **`computed()`** signal, not just writable ones directly — the dependency-tracking mechanism works identically regardless of which kind of signal is being read.

### When to use `effect()`

Genuine side effects that need to happen automatically in response to signal changes: logging, persistence (`localStorage`, analytics events), manually synchronizing with a non-Angular/non-signal API.

### When not to

- **Deriving a value** other code will read — that's `computed()`'s job, not `effect()`'s (an effect's return value, if any, isn't tracked as reactive state the way `computed()`'s is).
- **Simple event-driven side effects** already naturally expressed as a direct method call from a template's `(click)`/`(input)` binding (Module 1) — if something only ever needs to happen as a direct, immediate reaction to one specific user action, a plain event-bound method remains simpler and more explicit than an effect quietly watching for a signal to change as a proxy for that same action.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Using `effect()` to derive a value meant to be read elsewhere (e.g., `effect(() => { this.count = this.a() + this.b(); })` assigning a plain property) | Fights against the signal system — the plain `count` property isn't itself reactive, so anything depending on it won't be notified correctly | Use `computed()` to derive values that other code needs to read reactively | Produces a genuinely reactive derived signal, not a plain property quietly kept in sync by a side channel |
| Calling `effect()` outside a valid injection context (e.g., inside a plain method called later, well after construction, unrelated to Angular's own lifecycle hooks) | `effect()`, like `inject()` (Module 4), requires an injection context to register itself correctly | Call `effect()` in the constructor (or another Angular-recognized injection context) | Matches the API to the contexts Angular actually supports |
| Expecting manual cleanup code (an `ngOnDestroy` unregistering the effect) to be necessary | Effects are automatically tied to and cleaned up with their component's lifetime | Trust Angular's automatic cleanup; no manual teardown is needed for a component-level effect | A deliberate, documented difference from Module 6's manual Observable-subscription cleanup requirements |

### ✅ Knowledge Check
1. Why does putting a value-deriving calculation inside `effect()` instead of `computed()` cause problems, even if it "seems to work" at first?
2. Why doesn't a component-level `effect()` need manual cleanup in `ngOnDestroy`, unlike Module 6's Observable subscriptions?

---

## 6. Signal-Based Inputs: Refactoring Away From `@Input()`

### The problem this solves

Module 1's `@Input()` decorator has one real limitation Modules 2–6 worked around rather than solved: reading a **changed** `@Input()` value after the component's first creation required `ngOnChanges` (Module 2) — a separate lifecycle hook, with its own `SimpleChanges` object to unwrap, entirely disconnected from `computed()`/`effect()`'s automatic dependency tracking. **Signal-based inputs**, created with `input()`, close this gap: an input becomes a signal, so it participates directly in the same reactive system as everything else in this module.

### Syntax breakdown

```typescript
import { Component, input } from '@angular/core';
import { Recipe } from '../models/recipe.model';

@Component({ /* ... */ })
export class RecipeCardComponent {
  recipe = input.required<Recipe>();
  isFavorited = input(false); // optional input, with a default value
}
```
```html
<h3>{{ recipe().name }}</h3>
<p *ngIf="isFavorited()">⭐ Favorited</p>
```
- **`input.required<Recipe>()`** — declares a **required** signal-based input of type `Recipe` — the signal equivalent of Module 1's `@Input({ required: true }) recipe!: Recipe;`. Notably, there's no `!` non-null-assertion workaround needed here (Module 1 required one, since `@Input()` properties are set *after* construction) — `input.required()`'s type system already guarantees a value will be present by the time it's ever read.
- **`input(false)`** — declares an **optional** signal-based input with a default value of `false`, used whenever the parent doesn't provide `[isFavorited]="..."` explicitly — the signal equivalent of `@Input() isFavorited = false;`.
- **`recipe()`** — read exactly like any other signal — a plain function call, no different from a `signal()`-created writable one, or a `computed()`-derived one, from the reading side.

### Reacting to changes — the whole point of this refactor

```typescript
export class RecipeCardComponent {
  recipe = input.required<Recipe>();

  // Automatically re-derives whenever the PARENT passes a new `recipe` value —
  // no ngOnChanges, no SimpleChanges, no manual key-checking required.
  formattedPrepTime = computed(() => `${this.recipe().prepTimeMinutes} min`);

  constructor() {
    effect(() => {
      console.log('Now displaying recipe:', this.recipe().name);
    });
  }
}
```
Compare this directly to Module 2, Section 6's `ngOnChanges`-based pattern for reacting to a changing `@Input()`:
```typescript
// Module 2's approach — still entirely valid, and still necessary for @Input()-based components
@Input() recipe!: Recipe;
formattedPrepTime = '';

ngOnChanges(changes: SimpleChanges): void {
  if (changes['recipe']) {
    this.formattedPrepTime = `${this.recipe.prepTimeMinutes} min`;
  }
}
```
The signal-based version needs **no separate lifecycle hook at all** — `computed()`/`effect()` already know to re-run whenever `recipe()` changes, because reading it inside those functions is exactly what registers the dependency, precisely as described in Sections 4–5.

### Refactoring a real Module 1 component: `DessertCardComponent`, revisited

**Before (Module 1, `@Input()`/`@Output()`):**
```typescript
export class DessertCard {
  @Input({ required: true }) dessert!: Dessert;
  @Input() quantity = 0;
  @Output() add = new EventEmitter<Dessert>();
}
```

**After (this module, signal-based input — `@Output()` is unaffected, see note below):**
```typescript
export class DessertCard {
  dessert = input.required<Dessert>();
  quantity = input(0);
  @Output() add = new EventEmitter<Dessert>();
}
```
```html
<!-- template changes from {{ dessert.name }} to {{ dessert().name }}, etc. -->
<h3>{{ dessert().name }}</h3>
```

> **🔒 A note on `@Output()`:** Angular also offers a signal-adjacent `output()` function as a modern alternative to `@Output()`/`EventEmitter`, but it is **outside this module's required depth** — this module's own learning objectives specifically name refactoring **inputs**, not outputs. `@Output()`/`EventEmitter` (Module 1) remains entirely valid, current, and is what this module's own lab expects for anything event-emitting; mixing `input()` for inputs with `@Output()` for outputs, as shown above, is completely normal and expected at this stage.

### When to refactor `@Input()` to `input()`

- A component whose `@Input()` genuinely needs to drive `computed()`/`effect()`-based derived logic, where `ngOnChanges`'s separate hook and manual key-checking (Module 2, Section 6) previously added real boilerplate.
- New components, where starting with signal-based inputs from the beginning avoids ever needing `ngOnChanges` for this purpose at all.

### When not to bother

- A component using an `@Input()` only for simple, direct template display, with no derived (`computed()`) or side-effecting (`effect()`) logic depending on it — Module 1's plain `@Input()` remains entirely valid and doesn't need to change just because a newer alternative exists.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| `{{ recipe.name }}` in a template, after switching to `recipe = input.required<Recipe>()` | `recipe` is now a signal (a function), not a plain property — reading it without calling it returns the signal object itself, not the value | `{{ recipe().name }}` | Matches signal-reading syntax established throughout this module |
| Mixing `@Input()` and `input()` for the *same* logical property, expecting them to behave interchangeably | They're two entirely different mechanisms; a template/class can't read one as if it were the other | Pick one mechanism per property and use it consistently | Keeps the component's data flow model internally consistent |
| Assuming `input.required<Recipe>()` still needs a `!` non-null assertion like Module 1's `@Input({ required: true })` did | Signal-based required inputs are typed such that TypeScript already knows a value is guaranteed present, without needing the workaround | Simply declare `recipe = input.required<Recipe>();` with no `!` needed anywhere | The signal-based API was designed to close this exact Module 1 rough edge |

### ✅ Knowledge Check
1. What Module 2 lifecycle hook does a signal-based input make unnecessary for reacting to changing input values, and why?
2. Why does `input.required<Recipe>()` not need the `!` non-null assertion that Module 1's `@Input({ required: true })` did?

---

## 7. A Bounded Look at Interop: `toSignal()`

### The problem this solves

Module 6 built an entire application data-flow model around Observables — `HttpClient` responses, route parameters, reactive forms' `valueChanges` (🔒 not covered in depth in Module 5, but exists). Signals don't replace any of that; **`toSignal()`** exists specifically to let a component consume an existing Observable **as a signal**, getting Signals' simpler, subscription-free reading syntax at the boundary where a component actually displays the value — without needing to rewrite `HttpClient`/the Router themselves.

### Syntax breakdown

```typescript
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DessertDataService } from '../../services/dessert-data.service';

@Component({ /* ... */ })
export class DessertListComponent {
  private dessertData = inject(DessertDataService);

  desserts = toSignal(this.dessertData.getDesserts(), { initialValue: [] });
}
```
```html
<li *ngFor="let dessert of desserts()">{{ dessert.name }}</li>
```
- **`toSignal(observable, { initialValue: [] })`** — subscribes to the given Observable **immediately** (this is a real, meaningful behavior difference worth noting: unlike the `async` pipe, which subscribes only once the template actually uses it, `toSignal()` subscribes as soon as it's called) and produces a signal that always holds the **most recently emitted value**.
- **`{ initialValue: [] }`** — required whenever the Observable might not emit **synchronously** (an `HttpClient` response never does — it always takes at least a little time) — without it, the signal's value would briefly be `undefined` before the first real emission arrives, which TypeScript will correctly flag as a type mismatch against `desserts: Dessert[]`.
- **Automatic unsubscription** — like `effect()` (Section 5), `toSignal()`'s underlying subscription is automatically cleaned up when the component is destroyed — no manual `ngOnDestroy` needed, the same automatic-cleanup story Section 5 already established.

### Comparing `toSignal()` to the `async` pipe (Module 6, Section 8)

| | `async` pipe | `toSignal()` |
|---|---|---|
| Where used | Template only | Class property — usable in both the class *and* the template |
| When does subscription start? | Only once the template actually renders the binding | Immediately, when `toSignal()` is called |
| Reading syntax | `data$ \| async` in the template | `data()` — same as every other signal |
| Cleanup | Automatic | Automatic |

### 🔒 Coming Later — Outside This Module
`toObservable()` (the reverse direction — turning a signal into an Observable), `outputFromObservable()`/`outputToObservable()`, and deeper RxJS-interop patterns for genuinely bidirectional signal/Observable systems.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Calling `toSignal(observable)` with no `initialValue` for an Observable that doesn't emit synchronously | The resulting signal's type includes `undefined` until the first emission, which can cause type errors or unexpected `undefined` reads immediately after creation | Provide `{ initialValue: ... }` matching a sensible default/loading state | Guarantees the signal always has a well-typed value, even before the real data arrives |
| Calling `toSignal()` for a stream whose subscription should be deferred until actually displayed (e.g., an expensive request only some users will ever see) | `toSignal()` subscribes immediately upon creation, unlike the `async` pipe | Use the `async` pipe instead when subscription timing genuinely needs to be deferred | Matches the tool to the specific timing behavior actually needed |
| Using `toSignal()` merely to avoid writing `\| async` once in a template, with no other benefit needed | Adds an extra layer of conversion for no real gain if the value is only ever read in the template anyway | The `async` pipe alone is perfectly sufficient (and arguably simpler) for template-only Observable consumption | Keeps the simplest adequate tool as the default, per Module 6's own guidance |

### ✅ Knowledge Check
1. Why does `toSignal()` usually require an `initialValue` option, while the `async` pipe does not need an equivalent?
2. What's the key timing difference between `toSignal()` and the `async` pipe, regarding when subscription actually begins?

---

## 8. Signals vs. Observables: The Full Comparison

This section consolidates Section 2's early preview and Module 6, Section 9's forward-looking glimpse into the complete comparison this module's quiz specifically tests.

### Side-by-side

| | Signals | Observables |
|---|---|---|
| Model | "Pull" — read on demand via a function call | "Push" — values arrive over time via `.subscribe()` |
| Reading syntax | `count()` | `.subscribe(...)` or `\| async` in a template |
| Holds how many values? | Exactly one **current** value at a time | Zero, one, or many values, over time |
| Requires cleanup? | No — automatic (Sections 5, 7) | Yes — manual `unsubscribe()`/`takeUntil`, or the `async` pipe (Module 6, Section 8) |
| Operator library | Smaller: `computed()` for derivation, `effect()` for side effects | Extensive: `map`, `filter`, `switchMap`, `catchError`, and the rest of RxJS |
| Naturally represents... | A single piece of reactive component/application state | A genuine sequence of events over time (HTTP responses, route changes, DOM events, timers) |
| Used natively by | Component inputs (`input()`), component state | `HttpClient`, the Router's `ActivatedRoute`, Reactive Forms' `valueChanges` |
| Synchronous or asynchronous? | Always synchronous to read | Can be either — some Observables emit synchronously (`of(...)`), most real-world ones (HTTP, timers) do not |

### A decision rule for new code going forward

> **Local component/application state that's read directly (not "a sequence of events over time") → Signals.**
> **Anything that's genuinely a stream of events arriving over time, or anything Angular's own framework APIs already hand you as an Observable (`HttpClient`, the Router, Forms) → stay with Observables, optionally bridged into a signal at the display boundary with `toSignal()` (Section 7) if that simplifies the component consuming it.**

### Why both exist, permanently, rather than one replacing the other

Observables solve a genuinely different, broader problem than Signals do — representing an ongoing sequence of asynchronous events, with a rich operator library for composing/transforming/canceling them (Module 6). Signals solve a narrower, extremely common problem — plain reactive state — more simply than Observables ever could for that specific case, at the cost of not attempting to solve the broader "stream of async events" problem at all. Neither is "the future that replaces the other"; they're complementary tools for genuinely different shapes of problem, bridged by `toSignal()`/`async` where needed.

### ✅ Knowledge Check
1. Restate, in your own words, the single clearest rule for choosing Signals over Observables (or vice versa) for a new piece of state.
2. Name one Angular framework API that remains Observable-based, and explain why Signals wouldn't be a natural fit for replacing it entirely.

---

## 9. Putting It Together: Reactive Recipe Finder Architecture

```
RecipeDataService (Module 3 pattern — providedIn: 'root')
 │  getRecipes(): Observable<Recipe[]>   (still Observable — real/mock HTTP data source)

RecipeFinderComponent (root of the feature)
 │  recipes = toSignal(this.recipeData.getRecipes(), { initialValue: [] })   ← Section 7's interop
 │  searchTerm = signal('')                                                   ← Section 3
 │  maxPrepTime = signal(60)                                                  ← Section 3
 │  favoritesOnly = signal(false)                                             ← Section 3
 │  favoriteRecipeIds = signal<number[]>([])                                  ← Section 3
 │
 │  searchedRecipes = computed(() => /* filter recipes() by searchTerm() */)  ← Section 4
 │  timeFilteredRecipes = computed(() => /* filter searchedRecipes() by maxPrepTime() */)
 │  filteredRecipes = computed(() => /* optionally filter by favoritesOnly()/favoriteRecipeIds() */)
 │  resultCount = computed(() => this.filteredRecipes().length)
 │
 │  constructor() {
 │    effect(() => localStorage.setItem('favorites', JSON.stringify(this.favoriteRecipeIds())));  ← Section 5
 │  }
 │
 └── RecipeCardComponent (×N, via *ngFor over filteredRecipes())
       recipe = input.required<Recipe>()          ← Section 6
       isFavorited = input(false)                  ← Section 6
       @Output() toggleFavorite = new EventEmitter<number>()   ← @Output() remains unchanged, per Section 6's note
```

**How this differs from every prior module's architecture diagrams:** there is no `@Input()`, no `ngOnChanges`, and no manual Observable subscription/unsubscription anywhere in this component tree except the one, deliberate `toSignal()` bridge at the data-loading boundary. Every derived value (`searchedRecipes`, `timeFilteredRecipes`, `filteredRecipes`, `resultCount`) is a `computed()` signal, automatically staying correct as any of `recipes`, `searchTerm`, `maxPrepTime`, or `favoritesOnly`/`favoriteRecipeIds` changes — with zero manual "remember to recalculate this" code anywhere.

---

## 10. Final Module Project: Reactive Recipe Finder

### Project Requirements

Build a Reactive Recipe Finder from scratch, using Signals as the primary state-management approach throughout.

### Functional Requirements

1. A `RecipeDataService` (Module 3 pattern) providing a recipe catalog — hard-coded or `HttpClient`-backed (Module 3) — exposed to the component via `toSignal()` (Section 7).
2. Writable signals for: the current search term, a maximum prep-time filter, a favorites-only toggle, and a list of favorited recipe ids.
3. At least two **chained** `computed()` signals deriving the final filtered/searched recipe list from the above (per Section 4's chaining example).
4. A `computed()` signal deriving a result count from the filtered list.
5. At least one `effect()` with a genuine side effect — persisting favorites to `localStorage` is the suggested, realistic choice.
6. A `RecipeCardComponent` using **signal-based inputs** (`input.required()`/`input()`), not `@Input()` — directly practicing this module's refactoring objective on a component you build fresh rather than retrofit.
7. A working "toggle favorite" interaction, using `@Output()`/`EventEmitter` (unchanged from Module 1) from `RecipeCardComponent`, updating the parent's `favoriteRecipeIds` signal via `.update()` with an immutable array pattern (Section 3) — never `.push()` in place.

### Suggested Component/Service Structure

```
services/
└── recipe-data.service.ts     (Module 3 pattern; Observable-based getRecipes())

components/
├── recipe-finder (root)       (all signals/computed/effect state lives here)
└── recipe-card                (signal-based inputs; @Output() unchanged)
```

### Required Angular Concepts (checklist)

- [ ] At least four writable signals (`signal()`)
- [ ] At least two chained `computed()` signals
- [ ] At least one `effect()` performing a genuine side effect
- [ ] `.update()` used with an immutable pattern for the favorites array (never `.push()` in place)
- [ ] `input.required()`/`input()` used in `RecipeCardComponent`, not `@Input()`
- [ ] `toSignal()` used at the one data-loading boundary, with a correct `initialValue`
- [ ] `@Output()`/`EventEmitter` still used correctly for the favorite-toggle event (per Section 6's scope note)

### Acceptance Criteria

- Typing in the search box updates the displayed recipe list and result count live, entirely through signal reads — no manual subscription/unsubscription anywhere in the feature.
- Toggling the favorites-only filter and adjusting the prep-time filter both correctly narrow the `computed()`-chained result list.
- Favoriting/unfavoriting a recipe correctly updates `localStorage` (verified via the browser's dev tools), driven entirely by the `effect()`.
- Refreshing the page restores favorited recipes from `localStorage` (the writable signal's initial value is read from storage on construction).
- `RecipeCardComponent`'s template correctly reads its signal-based inputs via function-call syntax (`recipe()`, not `recipe`).

### Hints (if stuck)

- Build the search-term filtering as a single, un-chained `computed()` signal first, confirm it updates live, then add the prep-time and favorites filters as additional chained `computed()` signals one at a time — the same "prove the simple case first" advice as every prior module's project.
- If the favorites `effect()` doesn't seem to fire, double-check it's registered in the constructor (a valid injection context), not in a method called later.
- If `RecipeCardComponent`'s template shows `[object Object]` or similar instead of a recipe's actual field, you've likely forgotten to call the input signal (`recipe.name` instead of `recipe().name`).

### Optional Stretch Challenges

- Add a `resultCount() === 0` guarded `effect()` (Section 5, Example 3) logging a helpful diagnostic message when a search/filter combination yields no results.
- Refactor a **second**, independent small component to use `input()` instead of `@Input()`, and write a short comment comparing how you would have handled the same reactive-derivation logic with `ngOnChanges` instead (a deliberate, reflective repeat of Section 6's core exercise).
- Research (and document in a comment, without necessarily implementing) how `linkedSignal()` — 🔒 outside this module's required depth — might apply to a scenario where the favorites-only toggle should reset itself under some condition, as a preview of a related, more advanced Signals API.

---

## 11. Quick Reference Sheet

### Writable Signals
```
const count = signal(0);           Creates a writable signal
count()                             Reads the current value (function call syntax)
count.set(5)                        Replaces the value entirely
count.update(c => c + 1)            Derives the new value from the current one
// .mutate() was REMOVED before stable release — always replace, never mutate in place
```

### Computed Signals
```
const doubled = computed(() => count() * 2);   Read-only, auto-tracks dependencies
doubled()                                       Read exactly like a writable signal
// No .set()/.update() — value is entirely derived
```

### Effects
```
constructor() {
  effect(() => {
    console.log('count changed to', count());   // re-runs whenever a read signal changes
  });
}
// Must be called in an injection context (e.g., a component constructor)
// Automatically cleaned up when the component is destroyed — no manual unsubscribe needed
```

### Signal-Based Inputs
```
recipe = input.required<Recipe>();    Required signal input — no `!` needed
isFavorited = input(false);           Optional signal input, with a default value
recipe()                              Read like any other signal, in class or template
// Replaces @Input() + ngOnChanges for reactive derivation (Sections 4-5 apply directly)
// @Output()/EventEmitter is UNCHANGED — still from Module 1, not part of this refactor
```

### RxJS Interop
```
import { toSignal } from '@angular/core/rxjs-interop';

data = toSignal(someObservable$, { initialValue: fallback });
// Subscribes IMMEDIATELY (unlike the async pipe, which waits for template use)
// Automatically unsubscribes on component destruction
```

### Signals vs. Observables — the core rule
```
Local, directly-read reactive state           → Signals
A genuine stream of events over time, or      → Observables (HttpClient, Router,
anything a framework API already hands           Reactive Forms), optionally bridged
you as an Observable                             into a signal via toSignal()
```

### Important Terminology

| Term | Definition |
|---|---|
| **Signal** | A reactive value wrapper, read via function-call syntax, supporting fine-grained change tracking. |
| **Fine-grained reactivity** | Updating precisely what depends on a changed value, rather than re-checking an entire component tree. |
| **Writable signal** | A signal created with `signal()`, changeable via `.set()`/`.update()`. |
| **`computed()`** | A read-only signal automatically derived from other signals. |
| **`effect()`** | A block of code that automatically re-runs in response to signal changes, for side effects. |
| **Injection context** | The contexts (e.g., a component constructor) in which functions like `effect()`/`inject()` are valid to call. |
| **`input()`** | Creates a signal-based component input, replacing `@Input()` for reactive-derivation scenarios. |
| **`toSignal()`** | Converts an existing Observable into a signal, for use at a display boundary. |
| **"Pull" vs. "push"** | Signals are read on demand (pull); Observables push values to subscribers over time. |

### 🔒 Coming Later — Outside This Module
`output()` (signal-based component outputs) · `linkedSignal()` · `toObservable()` and deeper RxJS interop · Signal-based Forms · zoneless change detection · NgRx Signal Store

---

## 12. Source & Resource Mapping

| Module Topic | Source Resource | Knowledge Extracted |
|---|---|---|
| What Signals are, why they exist | Angular.dev — "Introduction to Signals" | Core motivation and fine-grained-reactivity framing used in Section 2 |
| Signals' motivation, concisely (video) | YouTube — Fireship, "Angular Signals: The Future of Reactivity in Angular?" (3 min) | Section 2's fast, high-level framing |
| Full Signals API — writable, computed, effect | Angular.dev — "Introduction to Signals" (sub-pages) | Sections 3–5's syntax and examples |
| Full Signals API walkthrough (video) | YouTube — Angular University, "Angular Signals - A Deep Dive" (31 min) | Reinforcement across Sections 3–5 |
| Signals vs. Observables ("pull" vs. "push") | Angular University Blog — "Angular Signals" | Section 8's core comparison framing |
| Signals vs. Observables, concisely (video, revisited) | YouTube — Fireship, "Angular Signals" (3 min, referenced again for this comparison) | Section 8's quick-reference framing |

**Quick links for deeper reading (optional, not required to complete this module):**
- [Introduction to Signals — Angular.dev](https://angular.dev/guide/signals)
- [Angular Signals: The Future of Reactivity in Angular? — YouTube](https://www.youtube.com/watch?v=Qy-oUc5eB2M)
- [Angular Signals - A Deep Dive — YouTube](https://www.youtube.com/watch?v=n1a2eQ0Zyls)
- [Angular Signals — Angular University Blog](https://blog.angular-university.io/angular-signals/)
