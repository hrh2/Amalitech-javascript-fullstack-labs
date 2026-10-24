# Module 11: Performance & Best Practices
### FEM19 — continues from FEM09 (Angular Fundamentals) through FEM18 (Testing in Angular)

> **Scope note:** This document covers *only* Module 11 — measuring performance, `OnPush` change detection (and the real refactoring challenges it creates), runtime quick wins (`trackBy`/`track`, keeping logic out of templates), lazy loading revisited (including preloading and a brief look at `@defer`), analyzing bundle size, Angular style-guide conventions, accessibility (a11y) best practices, building for production, and deploying to a modern hosting platform. Anything beyond that — server-side rendering and hydration, zoneless change detection in depth, CDK virtual scrolling, service workers/PWA, custom preloading strategies, advanced CI/CD pipelines, CDN cache tuning — is flagged **🔒 Coming Later — Outside This Module**.
>
> **This module pays off several deferrals from earlier modules.** Module 2 introduced default change detection and explicitly deferred `OnPush`. Module 3 and Module 7 drilled the "always replace, never mutate" habit without showing its biggest payoff. Module 4 deferred preloading strategies. The Dessert Shop lab (Task 8) asked you to deploy without this course ever covering production builds in depth. Module 11 is where all of those land.
>
> **A version note before you start.** Angular's performance and tooling story evolves quickly. A few details in this document differ by Angular version — the name of the default change-detection strategy in documentation and enums, whether `environment.prod.ts` is generated for you, the shape of the build output folder, and the file-naming conventions in the official style guide. Wherever that matters, the text says so explicitly. When in doubt, check the documentation for the exact version your project uses.

---

## How this document is organized

Same documentation-first shape as Modules 1–10:

**What is it? → Why does Angular need it? → How does it work? → Syntax breakdown → Examples → When to use / not use → What happens behind the scenes? → How it connects to other concepts → Try It Yourself → Exercises → Common Mistakes**

Everything ties back to two running examples you already built: the **Dessert Shop App** (Module 1, plus the lab) and the **Kanban app** (Modules 4–5, 8–10) — this module optimizes and ships them.

---

## Table of Contents

1. [From Module 10 to Module 11: What's New](#1-from-module-10-to-module-11-whats-new)
2. [Measure First: Profiling and the Performance Mindset](#2-measure-first-profiling-and-the-performance-mindset)
3. [Change Detection Revisited: Default vs. `OnPush`](#3-change-detection-revisited-default-vs-onpush)
4. [Refactoring a Component to `OnPush`](#4-refactoring-a-component-to-onpush)
5. [Other Runtime Quick Wins](#5-other-runtime-quick-wins)
6. [Lazy Loading, Revisited](#6-lazy-loading-revisited)
7. [Analyzing Bundle Size](#7-analyzing-bundle-size)
8. [Angular Style Guide & Code Conventions](#8-angular-style-guide--code-conventions)
9. [Accessibility (a11y) Best Practices](#9-accessibility-a11y-best-practices)
10. [Building for Production](#10-building-for-production)
11. [Deploying to a Hosting Platform](#11-deploying-to-a-hosting-platform)
12. [Putting It Together: An Optimization Workflow](#12-putting-it-together-an-optimization-workflow)
13. [Final Module Project: Optimize & Ship](#13-final-module-project-optimize--ship)
14. [Quick Reference Sheet](#14-quick-reference-sheet)
15. [Source & Resource Mapping](#15-source--resource-mapping)

---

## 1. From Module 10 to Module 11: What's New

Ten modules built features. This one asks three different questions about the features you already have:

1. **Is it fast?** — not "does it work," but how quickly it loads and how smoothly it responds (Sections 2–7).
2. **Is it well-made?** — consistent with Angular's conventions, and usable by people who navigate by keyboard or screen reader (Sections 8–9).
3. **Can anyone actually use it?** — built for production and live at a real URL (Sections 10–11).

A theme runs through the whole module: **performance work is measurement-driven.** Almost every technique below has a cost (more code, more constraints, more to remember), so you apply it where a measurement says it matters — not everywhere, on principle.

### ✅ Knowledge Check
1. Name two things earlier modules explicitly deferred that this module delivers.

---

## 2. Measure First: Profiling and the Performance Mindset

### What is profiling, and why start here?

**Profiling** means observing what your application actually does — how long it takes to load, how much work runs on each interaction — rather than guessing. This module's live session is built entirely around that workflow: *profile → find the bottleneck → apply one technique → profile again to confirm it helped.*

The reason to start here, before any technique, is that optimization without measurement routinely makes code more complicated for no gain — or "fixes" something that was never the problem.

### Two kinds of performance, two sets of tools

| Kind | What it means | What to measure with |
|---|---|---|
| **Load performance** | How long until the user sees and can use the page; how many bytes were downloaded | Lighthouse, the browser's Network tab (Module 9, Section 8), bundle analysis (Section 7) |
| **Runtime performance** | How much work the app does after loading, on each click/keystroke/update | Browser DevTools **Performance** panel, **Angular DevTools** Profiler |

### Core web-vitals vocabulary you'll see in Lighthouse

- **LCP (Largest Contentful Paint)** — how long until the largest visible element (often a hero image) renders. Load-related.
- **CLS (Cumulative Layout Shift)** — how much the page jumps around while loading (e.g., images without width/height pushing text down).
- **INP (Interaction to Next Paint)** — how quickly the page visually responds to user interactions. Runtime-related.
- **TBT (Total Blocking Time)** — a lab-measured proxy for how long the main thread was blocked by JavaScript during load.

You don't need to memorize thresholds; you need to recognize which *kind* of problem each metric points at — large initial bundle → hurts LCP/TBT; excessive change detection → hurts INP.

### Angular DevTools — seeing change detection happen

**Angular DevTools** is a browser extension adding an Angular-specific panel. Its **Profiler** records change-detection cycles and shows which components were checked and how long each took — the direct way to *see* what Section 3 describes, rather than take it on faith. A typical use: record while typing into a search box, and notice that dozens of unrelated components are re-checked on every keystroke. That observation is the signal that `OnPush` (Section 3) will help.

### A repeatable workflow

1. **Baseline** — record Lighthouse scores, bundle size (Section 7), and a profiler recording of one slow interaction.
2. **Hypothesize** — pick the single biggest suspect (huge initial bundle? needless re-checks? unoptimized images?).
3. **Change one thing.**
4. **Re-measure** — keep the change only if the numbers improved.
5. **Write it down** — before/after numbers are exactly what this module's final project asks you to report.

### Try It Yourself — Experiment: your first baseline

Build the Dessert Shop (or Kanban) in production mode (Section 10), serve it, and run a Lighthouse audit in Chrome DevTools. Record the Performance and Accessibility scores. Keep those numbers — you'll compare against them at the end of the module.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Optimizing from a hunch, with no baseline | You can't tell whether a change helped, hurt, or did nothing | Measure first; re-measure after every change | Turns optimization from folklore into evidence |
| Measuring performance against the **development** server (`ng serve`) | Development builds are unminified and include extra checks — numbers don't reflect what users get | Always measure a **production** build | Matches what is actually deployed |
| Changing five things at once, then re-measuring | If the score moves, you don't know which change caused it | One change per measurement | Keeps cause and effect traceable |

### ✅ Knowledge Check
1. Why should performance measurements use a production build rather than `ng serve`?
2. Which kind of problem does the Angular DevTools Profiler help diagnose — load or runtime?

### 🎥 Optional Video
The module's resource list includes three overview videos on Angular performance — covering change detection/`OnPush` and bundle analysis ([video 1](https://www.youtube.com/watch?v=tMxrY7IL-Ac)), lazy loading and production builds ([video 2](https://www.youtube.com/watch?v=9kRievveGGU)), and a concise top-techniques overview ([video 3](https://www.youtube.com/watch?v=64TMz93YMq8)). Titles aren't given in the source; they're best watched alongside Sections 3–7 rather than here.

---

## 3. Change Detection Revisited: Default vs. `OnPush`

### A quick recap of where this started

Module 2, Section 9 described the default behavior: after any Zone.js-patched event (a click, a timer, an HTTP response), Angular walks **every component in the tree**, re-evaluating every template binding. It also said `OnPush` was "a later-module optimization." This is that module.

### What is `OnPush`?

`ChangeDetectionStrategy.OnPush` is a per-component opt-in that tells Angular: **"don't re-check this component on every pass — only when there's a reason to."** Angular then skips the component (and its subtree) during a change-detection pass unless one of a specific set of triggers has occurred.

```typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-dessert-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dessert-card.component.html'
})
export class DessertCardComponent {
  dessert = input.required<Dessert>();
}
```

### Default vs. `OnPush` — the comparison the discussion prompt asks for

| | Default (often called "CheckAlways") | `OnPush` |
|---|---|---|
| When is the component checked? | On **every** change-detection pass, whether or not anything relevant changed | Only when a specific trigger occurs (see below) |
| Cost as the app grows | Grows with the **total number of components** | Grows with the number of components that actually have a reason to update |
| Mutating an `@Input()` object in place | "Works" (the next full pass notices) | **Not detected** — Angular compares input **references** |
| Plain property assigned inside a subscription callback | Updates on screen | **May not update** unless something marks the component for checking |
| Strictness | Forgiving | Demands the immutability habits from Modules 3, 7 and 8 |

> **Naming note:** the default strategy appears in the enum as `ChangeDetectionStrategy.Default`, and is commonly described in discussion as "CheckAlways." Newer Angular releases have been revisiting this naming, so check your version's API reference if you see a different identifier. The *behavior* described above is what matters.

### The triggers that DO make an `OnPush` component check itself

An `OnPush` component is re-checked when:

1. **An `@Input()`'s reference changes** (or a signal-based `input()`'s value changes) — a new object/array/primitive arrives from the parent.
2. **An event handler bound in its own template fires** — a `(click)` on the component itself or one of its children.
3. **The `async` pipe receives a new value** — the pipe marks the component for checking for you (Module 6, Section 8).
4. **A signal read in its template changes** — Module 7's signals notify precisely the views that read them.
5. **You explicitly ask** — via `ChangeDetectorRef.markForCheck()` (Section 4).

Everything else — a plain property quietly reassigned from a timer, a subscription, or a parent that mutated an object in place — does **not** trigger a check.

### Why this works so well with what you already learned

Notice how neatly the triggers line up with habits this course has been building since Module 3:

- "Always replace, never mutate" objects and arrays (Modules 3, 7, 8) → satisfies trigger 1.
- Prefer the `async` pipe over manual subscriptions (Module 6) → satisfies trigger 3.
- Prefer signals for component state (Module 7) → satisfies trigger 4.
- NgRx selectors producing new references only when data actually changes (Module 8) → satisfies trigger 1 cleanly.

A codebase that followed those habits is *already nearly `OnPush`-ready.* That's not an accident — it's the same principle from different angles.

### How does this compare to React?

| Angular | React |
|---|---|
| `OnPush` — skip checking unless inputs' references change or an explicit trigger fires | `React.memo` — skip re-rendering unless props change (by shallow comparison) |
| Mutating an object input in place silently fails to update | Mutating state/props in place silently fails to re-render |
| Signals / `async` pipe mark views for checking automatically | State setters schedule a re-render of the owning component |

The shared lesson: both frameworks' optimizations rely on **reference equality**, so both punish in-place mutation.

### ✅ Knowledge Check
1. List the triggers that cause an `OnPush` component to be re-checked.
2. Why do the immutability habits from Modules 3, 7 and 8 make `OnPush` adoption easier?

---

## 4. Refactoring a Component to `OnPush`

This section directly answers the second half of the module's discussion prompt: *what specific challenge might you face when refactoring to `OnPush`, and how would you solve it?* The short version: **code that "worked" only because Default checked everything, every time, starts silently failing to update the screen.** Here are the concrete forms that takes, each with its fix.

### Challenge 1 — in-place mutation of an input

**The bug.** A parent holds a list and mutates it:
```typescript
// parent
desserts: Dessert[] = [/* ... */];
addDessert(d: Dessert): void {
  this.desserts.push(d);            // same array reference
}
```
```typescript
// child (OnPush)
@Component({ changeDetection: ChangeDetectionStrategy.OnPush, /* ... */ })
export class DessertGridComponent {
  @Input() desserts: Dessert[] = [];
}
```
After `push`, the child's `desserts` is the **same reference** as before, so Angular sees no input change and the grid never updates. Under Default this "worked."

**The fix.** Replace instead of mutate:
```typescript
addDessert(d: Dessert): void {
  this.desserts = [...this.desserts, d];   // new reference → trigger 1 fires
}
```
This is the exact habit from Module 3, Section 3 — here you see what it was *for*.

### Challenge 2 — a plain property assigned from a subscription or timer

**The bug.**
```typescript
@Component({ changeDetection: ChangeDetectionStrategy.OnPush, /* ... */ })
export class BoardListComponent implements OnInit {
  boards: Board[] = [];

  ngOnInit(): void {
    this.boardService.getBoards().subscribe((boards) => {
      this.boards = boards;           // plain property assignment
    });
  }
}
```
When the HTTP response arrives, Zone.js triggers a change-detection pass — but this `OnPush` component has no trigger (no input change, no template event), so it's skipped. The list stays empty.

**Fix A (preferred) — the `async` pipe** (Module 6):
```typescript
boards$ = this.boardService.getBoards();
```
```html
<li *ngFor="let board of boards$ | async">{{ board.name }}</li>
```

**Fix B (preferred) — a signal** (Module 7):
```typescript
boards = toSignal(this.boardService.getBoards(), { initialValue: [] });
```
```html
<li *ngFor="let board of boards()">{{ board.name }}</li>
```

**Fix C (last resort) — tell Angular explicitly:**
```typescript
private cdr = inject(ChangeDetectorRef);

ngOnInit(): void {
  this.boardService.getBoards().subscribe((boards) => {
    this.boards = boards;
    this.cdr.markForCheck();          // trigger 5: "please check me on the next pass"
  });
}
```
`markForCheck()` marks this component (and its ancestors) to be checked on the **next** pass. It works, but it's manual bookkeeping — if you find yourself sprinkling it everywhere, that's a signal to move to the `async` pipe or signals instead.

### Challenge 3 — mutation hidden inside a service-held object

An `@Input()` object that's fine today can be mutated later by *another* part of the app that holds the same reference — e.g., a service handing out its internal array. Under `OnPush`, the component won't see that mutation.

**The fix.** Services should return new references when state changes (the `BehaviorSubject` pattern from Module 8, Section 3: `.next([...current, item])`), and should expose read-only streams (`asObservable()`).

### Challenge 4 — getters and methods called from the template

This one isn't a *breakage* under `OnPush`, but it's the best real example of a performance cost already hiding in the apps you built. Recall the Dessert Shop's `AppComponent` (Module 1 lab):

```typescript
get cartLines(): CartLine[] {
  return this.desserts
    .filter((d) => (this.quantities[d.id] ?? 0) > 0)
    .map((d) => ({ dessert: d, quantity: this.quantities[d.id] }));
}
get orderTotal(): number { /* recomputes from cartLines */ }
```
and the template binds `[cartLines]="cartLines"` and `[orderTotal]="orderTotal"`. A getter used in a template **re-runs on every change-detection pass** — and because `cartLines` builds a **new array each call**, it also hands children a *new reference every time*, which defeats `OnPush` on those children entirely (trigger 1 fires on every pass).

**The fix — compute once, from signals** (Module 7):
```typescript
quantities = signal<Record<number, number>>({});

cartLines = computed(() =>
  this.desserts
    .filter((d) => (this.quantities()[d.id] ?? 0) > 0)
    .map((d) => ({ dessert: d, quantity: this.quantities()[d.id] }))
);
orderTotal = computed(() =>
  this.cartLines().reduce((sum, l) => sum + l.quantity * l.dessert.price, 0)
);
```
`computed()` memoizes: it recalculates only when `quantities()` actually changes, and returns the **same reference** otherwise — so children stay stable, and `OnPush` can actually skip them. (Alternatives: a **pure pipe**, or NgRx **selectors**, Module 8, Section 6 — all memoizing mechanisms.)

### A step-by-step refactoring checklist

1. Add `changeDetection: ChangeDetectionStrategy.OnPush` to **one leaf-most component** first (e.g., `DessertCardComponent`), not the root.
2. Exercise every interaction that component supports; look for stale UI.
3. For each stale spot, identify *which* trigger is missing (mutation? plain property? timer?) and apply the matching fix above.
4. Re-profile with Angular DevTools (Section 2) to confirm the component is actually being skipped.
5. Move up the tree, one component at a time.

### Try It Yourself — Experiment: break it on purpose, then fix it

Take `DessertCardComponent` with an `@Input() dessert`. Set `OnPush`. In the parent, change `dessert.price = 9.99` (mutation) and observe the card **not** updating. Then change the parent to `this.dessert = { ...this.dessert, price: 9.99 }` and watch it update. Seeing both behaviors side by side is the clearest possible demonstration of reference-based detection.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Adding `OnPush` to the root component first | Root `OnPush` can hide staleness across the whole app, making bugs hard to trace to a cause | Start with a small leaf component and work upward | Keeps each step's failures local and diagnosable |
| "Fixing" every stale view with `markForCheck()` | Treats the symptom each time; the underlying mutation/plain-property pattern remains | Prefer immutable updates, the `async` pipe, or signals; reserve `markForCheck()` for genuine edge cases | Removes the cause rather than patching around it |
| Using `detectChanges()` as a blanket workaround | Forces an immediate check and can cause repeated or recursive checks | Use `markForCheck()` when you must intervene manually, and only when you must | Schedules a check on the normal pass instead of forcing one |
| Expecting `OnPush` to speed up an app whose children receive a **new** array/object on every pass (e.g., from a template getter) | Every pass looks like "an input changed," so nothing is skipped | Memoize with `computed()`, a pure pipe, or selectors so references stay stable | Gives `OnPush` stable references to compare |

### Exercises

**Level 1 — Basic:** Add `OnPush` to `DessertCardComponent` and confirm every interaction (add, increment, decrement) still updates its UI.

**Level 2 — Practical:** Reproduce Challenge 2 deliberately in a small component (plain property assigned in a subscription), observe the stale view, then fix it three ways: `async` pipe, `toSignal`, and `markForCheck()`.

**Level 3 — Challenge:** Refactor the Dessert Shop's `AppComponent` getters (`cartLines`, `orderTotal`) into `computed()` signals, add `OnPush` to `CartComponent` and `DessertListComponent`, and use Angular DevTools to show those components are now skipped on unrelated interactions.

### ✅ Knowledge Check
1. (Discussion prompt) Explain Default vs. `OnPush` in your own words, and name one concrete challenge when refactoring to `OnPush` and its solution.
2. Why does a template getter that builds a new array each call undermine `OnPush` on a child component?
3. When is `markForCheck()` appropriate, and why should it not be your first tool?

---

## 5. Other Runtime Quick Wins

### 5.1 Tracking list items: `trackBy` / `track`

When a list re-renders, Angular needs to decide which existing DOM elements correspond to which items. By default it compares by **object identity**; if you replace the array with freshly-created objects (very common after an HTTP refresh), Angular may destroy and recreate **every** row.

```html
<!-- Module 1 syntax: *ngFor with trackBy -->
<app-dessert-card *ngFor="let d of desserts; trackBy: trackById" [dessert]="d"></app-dessert-card>
```
```typescript
trackById(_index: number, dessert: Dessert): number {
  return dessert.id;
}
```
```html
<!-- Newer built-in control flow: track is REQUIRED -->
@for (d of desserts; track d.id) {
  <app-dessert-card [dessert]="d" />
}
```
Tracking by a stable identity (`id`) lets Angular reuse the existing DOM and component instance for each item, updating only what changed. **Version note:** the `@for` block is part of Angular's newer built-in control flow; it requires a `track` expression, which nudges every list toward this good practice. The course's earlier modules used `*ngFor` because that's what the source resources taught; both are valid, and `track`/`trackBy` serves the same purpose in each.

### 5.2 Keep heavy logic out of templates

Section 4 (Challenge 4) showed the cost of getters/method calls in templates. The general rule: **a template expression should be cheap and side-effect-free**, because it may run on every pass. Move computation into `computed()` signals, pure pipes, or NgRx selectors, so it runs only when its inputs change.

### 5.3 Pure pipes

A **pure pipe** (the default for pipes) re-runs only when its input value's reference changes — making it a template-friendly, memoized alternative to a method call:
```typescript
@Pipe({ name: 'currencyShort', standalone: true })
export class CurrencyShortPipe implements PipeTransform {
  transform(value: number): string {
    return `$${value.toFixed(2)}`;
  }
}
```
```html
<p>{{ dessert.price | currencyShort }}</p>
```
(Module 10 listed pipes among the unit-testable pieces; a pure pipe is also trivially testable.)

### 5.4 Images: a brief, bounded note

Images are often the largest bytes on a page. Two quick wins: always provide `width`/`height` (prevents layout shift, CLS from Section 2) — the Dessert Shop's `<img>` tags already did — and lazy-load below-the-fold images with the native `loading="lazy"` attribute. Angular also ships the **`NgOptimizedImage`** directive (`ngSrc`), which enforces several image best practices and supports a `priority` attribute for the main above-the-fold image. **🔒 A full treatment of `NgOptimizedImage` (loaders, CDN integration, `srcset` generation) is outside this module.**

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Omitting `trackBy` on a list that is regularly replaced with new objects | Every row is torn down and rebuilt on each refresh | Track by a stable `id` | Reuses existing DOM/components for unchanged items |
| Tracking by array **index** for a list that can be reordered or filtered | Items "swap identity" when positions shift, causing wrong reuse | Track by a unique, stable key | Identity follows the data, not its position |
| Calling an expensive method from a template binding | Runs on every pass | Use `computed()`, a pure pipe, or a selector | Memoizes the work |

### ✅ Knowledge Check
1. Why is `track d.id` better than tracking by array index for a list that can be filtered?
2. What makes a pure pipe a better template tool than a method call?

---

## 6. Lazy Loading, Revisited

### What's already known, and what's new

Module 4, Section 7 introduced `loadChildren` and the core idea: don't ship a feature's code until the user visits it. This section adds the pieces Module 4 deferred or didn't need yet — loading a **single component** lazily, **preloading** (fetching lazy chunks in the background), and a brief look at the newer `@defer` block — and, more importantly, **how to verify lazy loading actually worked** (Section 7).

### Lazy-loading a single standalone component: `loadComponent`

```typescript
export const routes: Routes = [
  { path: '', component: BoardListComponent },
  {
    path: 'settings',
    loadComponent: () =>
      import('./settings/settings.component').then((m) => m.SettingsComponent)
  },
  {
    path: 'reports',
    loadChildren: () =>
      import('./reports/reports.routes').then((m) => m.REPORTS_ROUTES)
  }
];
```
- **`loadComponent`** — lazily loads **one** standalone component for a route; ideal when a feature is a single screen.
- **`loadChildren`** — lazily loads a whole **set of routes** (Module 4), for a feature with several screens.

Both rely on the same dynamic `import(...)`, which makes the bundler emit a **separate chunk** loaded on first navigation.

### Choosing what to lazy-load

Good candidates are features that are **not needed on first paint** and used by only some users: settings, admin areas, reports, rarely-visited detail screens. Poor candidates: the landing screen itself, and anything that appears on essentially every visit — lazy-loading those just adds a network round-trip to the critical path.

### Preloading — recovering the "first visit is slow" cost

Lazy loading's trade-off (Module 4) is a small delay the first time a lazy route is opened. **Preloading** loads lazy chunks in the background *after* the initial load, so they're often ready before the user clicks:

```typescript
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes, withPreloading(PreloadAllModules))]
};
```
`PreloadAllModules` fetches every lazy route's chunk once the app is idle after startup. It keeps the **initial** bundle small (the main win) while hiding most of the lazy-load delay. **🔒 Custom preloading strategies** (e.g., preload only specific routes, or only on fast connections) are outside this module.

### A brief look at `@defer`

Routing isn't the only place to defer code. Angular's `@defer` block lazily loads **a component inside a template**, triggered by a condition:

```html
@defer (on viewport) {
  <app-activity-chart />
} @placeholder {
  <p>Chart will load when scrolled into view…</p>
}
```
Here, `app-activity-chart` (and everything only it imports) is split into its own chunk and fetched when its placeholder scrolls into view. **Version note:** `@defer` belongs to the newer template syntax and works with standalone components. **🔒 Its full set of triggers (`on idle`, `on interaction`, `when`, prefetching) and sub-blocks is outside this module** — it's introduced so you recognize it as the in-template sibling of route-level lazy loading.

### Verifying that lazy loading worked

Lazy loading can silently fail: if *any* non-lazy file imports a lazy component directly, the bundler pulls it back into the main bundle (the mistake called out in Module 4's mistakes table). Two checks:
1. **Network tab** (Module 9, Section 8): on first load, the lazy chunk should **not** appear; navigating to the route should trigger a new `chunk-….js` request.
2. **Bundle analysis** (Section 7): the lazy feature's code should appear in its own chunk, not inside the main bundle.

### Try It Yourself — Experiment: prove a chunk loads late

Lazy-load one route with `loadComponent`. Build for production, open the Network tab with the cache disabled, load the home page and confirm no settings chunk is requested. Then click through to Settings and watch the chunk download. Finally add `PreloadAllModules` and observe the chunk downloading shortly after the home page finishes — *before* any click.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Lazy-loading the home route, or other always-needed screens | Adds a network round-trip to the critical path for every visitor | Lazy-load only what isn't needed at startup | Keeps the common path fast |
| Importing a lazy component (or its module) directly anywhere in eagerly-loaded code | The bundler includes it in the main bundle, defeating the split | Reference lazy features **only** through `import(...)` in route config | Preserves the separate chunk |
| Assuming lazy loading worked without checking | Silent failures are common | Verify via the Network tab and bundle analysis | Confirms the split actually exists |

### ✅ Knowledge Check
1. When would you choose `loadComponent` over `loadChildren`?
2. What does preloading change about lazy loading's trade-off, and what does it *not* change?

---

## 7. Analyzing Bundle Size

### What is a bundle, and why does its size matter?

Your build outputs JavaScript **bundles** (and CSS). The browser must download, parse, and execute the **initial** bundle before the app becomes usable — so its size directly affects load performance (Section 2's LCP/TBT). Bundle analysis answers: *what is actually in there, and what is taking the space?*

### Tool 1 — `source-map-explorer`

A **source map** links minified production code back to your original source files. `source-map-explorer` uses those maps to draw a treemap of which files and libraries contribute how many bytes.

```bash
ng build --source-map
npx source-map-explorer dist/<your-app>/browser/*.js
```
(Replace `<your-app>` with your project name. The exact output folder shape depends on your Angular version/builder — see Section 10.)

How to read it:
- Large rectangles are the biggest contributors — start there.
- Look for **surprises**: a date library you barely use, an icon set imported whole, a charting library loaded at startup for one rarely-visited screen.

### Tool 2 — build stats

```bash
ng build --stats-json
```
This writes a `stats.json` describing the build's inputs and outputs, which dedicated bundle-analyzer tools can visualize. (Which analyzer to use depends on your builder; the Angular documentation lists the current recommendation for your version.)

### Tool 3 — budgets: letting the build police itself

Angular lets you declare **size budgets** in `angular.json`; the build warns or fails when they're exceeded:

```json
"budgets": [
  { "type": "initial", "maximumWarning": "500kB", "maximumError": "1MB" },
  { "type": "anyComponentStyle", "maximumWarning": "2kB", "maximumError": "4kB" }
]
```
New projects typically start with defaults like these. Treat them as an early-warning system: if a pull request pushes the initial bundle over budget, you find out at build time, not from a user.

### Common findings and the technique that fixes each

| What the analysis shows | Technique |
|---|---|
| A large feature (settings, reports) inside the main bundle | Lazy loading (Section 6) |
| A big third-party library used on one rarely-visited screen | Lazy-load that screen, or `@defer` the component using it |
| A large library imported whole when only one function is used | Import only the needed function/module so tree-shaking can drop the rest |
| Duplicate libraries (two versions of the same package) | Align dependency versions; remove one |
| Unused dependencies left in `package.json` | Remove them |

### What is tree-shaking?

**Tree-shaking** is the production build's removal of code that is **never used**. It works best with modern, import-by-name code (`import { debounceTime } from 'rxjs'`) and is why the "import only what you need" habit pays off. (It's one of several production-build optimizations — Section 10.)

### Try It Yourself — Experiment: find your biggest file

Run `source-map-explorer` on your Kanban or Dessert Shop production build. Write down the three largest contributors. For each, decide: is it needed at startup? Could it be lazy-loaded, trimmed, or removed? Apply **one** fix and re-measure.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Analyzing a development build | Dev output is unminified and not tree-shaken, so sizes are misleading | Analyze a production build | Reflects what users download |
| Forgetting `--source-map` before running `source-map-explorer` | The tool has no maps to read | Build with source maps enabled first | Gives the tool the mapping it needs |
| Shipping source maps to production without thought | They can expose your original source to anyone who opens DevTools | Generate them for local analysis; decide deliberately whether to deploy them | Keeps analysis convenient without unintentionally publishing source |
| Ignoring budget warnings | Bundle growth goes unnoticed until users feel it | Treat budget warnings as failing checks | Catches regressions early |

### ✅ Knowledge Check
1. What does `source-map-explorer` show you that the file sizes in `dist/` alone don't?
2. How do budgets help prevent performance regressions over time?

---

## 8. Angular Style Guide & Code Conventions

### What is the style guide, and why follow it?

The **Angular style guide** is the framework team's set of recommended conventions for naming, file organization, and code structure. Following it isn't about taste — it makes any Angular codebase **predictable**: a new teammate can find the cart logic, the board routes, or the task form without asking, because everything lives where convention says it should. It's also what this module's third learning objective means by refactoring "to adhere to Angular style guide conventions."

> **Version note:** the official guide has been updated over time. Older projects (and most of this course's examples) name files like `dessert-card.component.ts` and classes like `DessertCardComponent`; newer guidance and CLI output may drop the redundant type suffix (e.g., `dessert-card.ts` / `DessertCard`). Neither is "wrong" — what matters is **consistency within your project** and following the version of the guide your team has adopted.

### Conventions that matter most

| Area | Convention | Example |
|---|---|---|
| File names | kebab-case, with a role/type in the name | `task-detail.component.ts`, `cart.service.ts` |
| Class names | PascalCase | `TaskDetailComponent`, `CartService` |
| Selectors | kebab-case with an app prefix, so they never collide with HTML elements | `app-dessert-card` |
| One concept per file | One component / service / pipe per file | Don't define three components in one file |
| Folder structure | Organize **by feature**, not by type | `boards/`, `tasks/`, `cart/` — each with its own components/services |
| Small, focused units | Keep components and functions small, single-purpose | Extract logic to services (Module 3) |
| Logic in services, presentation in components | Business/data logic out of components | `CartService` vs. `CartComponent` |
| Member visibility | Mark members `private`/`protected`/`readonly` where appropriate | `private readonly baseUrl = '/api/tasks'` |
| Lifecycle hooks | Implement the interface (`implements OnInit, OnDestroy`) | Module 2, Section 5 |
| Immutability | Replace, don't mutate | Modules 3, 7, 8 |

### Tooling that enforces conventions for you

- **ESLint** with Angular's lint rules (`angular-eslint`) flags convention violations and common mistakes automatically.
- **Prettier** (or your editor's formatter) removes formatting debates.
- Run both in your build/CI step (Section 11) so conventions are checked on every change, not just remembered.

### Refactoring toward the guide — a typical pass

1. Rename files/classes/selectors to match your chosen convention consistently.
2. Split any file defining multiple components/services.
3. Move business logic found in components into services.
4. Replace template getters/method calls with `computed()`/pure pipes (Sections 4–5).
5. Add missing lifecycle-interface `implements` and cleanup (`ngOnDestroy`/`takeUntil`/`async` pipe, Module 6).
6. Remove dead code, unused imports, and stale comments.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Mixing naming conventions (`.component.ts` and suffix-less names) in one project | Makes the codebase unpredictable and harder to search | Pick one convention and apply it everywhere | Predictability is the whole point |
| Organizing the whole app by type (`/components`, `/services`, `/pipes` with everything inside) | Related files for one feature end up scattered; the folders grow unmanageably | Organize by feature | Keeps related code together and easy to find or lazy-load (Section 6) |
| A 600-line component that fetches data, formats it, validates forms and renders UI | Impossible to test or reuse pieces | Split responsibilities into services/smaller components | Each piece becomes small, testable (Module 10), and reusable |

### ✅ Knowledge Check
1. Why does organizing by feature (rather than by type) also help with lazy loading?
2. Why is *consistency* more important than which of two valid naming conventions you choose?

### 🎥 Optional Video
The module's resource list includes a best-practices video for writing maintainable Angular code, framed as the foundation of refactoring: [Watch on YouTube](https://www.youtube.com/watch?v=1Fi3LtwHQkc) (title not given in the source).

---

## 9. Accessibility (a11y) Best Practices

### What is accessibility, and why is it part of "best practices"?

**Accessibility (a11y)** means building so people with disabilities — blind users with screen readers, keyboard-only users, users with low vision or color-blindness, users with motor or cognitive differences — can use your application. It's an engineering-quality concern (and in many places a legal requirement), not an optional polish step. It's also not new to this course: **you already did real accessibility work** in the Dessert Shop lab, and this section names the principles behind those choices.

### Principles, with the Dessert Shop as the worked example

| Principle | What it means | Where you already did it |
|---|---|---|
| **Use semantic HTML first** | The right element carries built-in meaning, keyboard behavior and screen-reader support | Real `<button>`s (not clickable `<div>`s), `<ul>/<li>` for lists, one `<h1>`, `<main>` and `<aside>` landmarks |
| **Everything operable by keyboard** | Every interactive control reachable with Tab and activatable with Enter/Space | Native `<button>`s are keyboard-operable by default; visible `:focus-visible` outlines |
| **Provide text alternatives** | Images need `alt`; purely decorative images get empty `alt=""` | Dessert photos had descriptive `alt`; icons used `alt="" aria-hidden="true"` |
| **Name icon-only controls** | A control with no visible text needs an accessible name | `aria-label="Increase quantity of …"` on the stepper buttons |
| **Announce dynamic changes** | Updates that happen without a page load should be announced | `aria-live="polite"` on the cart count and total |
| **Manage focus for dialogs** | Move focus into a modal; allow Escape; label it | `role="dialog" aria-modal="true" aria-labelledby`, focus on open, Escape closes |
| **Provide skip navigation** | Let keyboard users bypass repeated content | The "Skip to desserts" link |
| **Respect user preferences** | Honor reduced-motion settings | `prefers-reduced-motion` styles |

### ARIA: use it to fill gaps, not to replace semantics

**ARIA** attributes (`aria-label`, `aria-live`, `role`, …) add accessibility information when native HTML can't express it. The rule of thumb is **"no ARIA is better than bad ARIA"**: prefer a native `<button>` over `<div role="button">`, because the native element gives you keyboard behavior and semantics for free, while the ARIA version only *announces* a role and leaves you to implement everything else.

### Accessibility in the other modules' code

- **Forms (Module 5):** every input needs an associated `<label for="…">`. Show validation errors in a way assistive tech can announce (e.g., `role="alert"` on the error text, and link it to the input with `aria-describedby`; mark invalid fields with `aria-invalid="true"`). Don't rely on color alone to indicate an error.
- **Routing (Module 4):** in a single-page app, navigating doesn't reload the page, so screen-reader users get no cue that the "page" changed. Give routes a meaningful **title** (Angular's router supports a `title` property on routes) and consider moving focus to the new view's main heading after navigation.
- **Color contrast:** text must contrast sufficiently with its background — WCAG AA asks for roughly 4.5:1 for normal text and 3:1 for large text. The design tokens in the Dessert Shop style guide were chosen with this in mind; verify any colors you add.
- **Angular CDK a11y utilities:** the Angular CDK provides helpers such as focus trapping and a live announcer (`@angular/cdk/a11y`) that implement common patterns (like modal focus handling) for you. **🔒 Using the CDK in depth is outside this module** — it's worth knowing it exists rather than hand-rolling focus traps.

### How to audit accessibility

1. **Automated scan** — Lighthouse's Accessibility category, or the axe DevTools extension. These catch missing labels, contrast failures, missing `alt`, and similar issues. (Automated tools find only a *portion* of real problems — treat a high score as "no obvious failures," not "accessible.")
2. **Keyboard-only walkthrough** — unplug the mouse mentally: Tab through the whole app. Can you reach and operate everything? Is focus always visible? Does focus move sensibly when a modal opens and closes?
3. **Screen-reader spot-check** — try a screen reader (NVDA, VoiceOver, or similar) on your key flow. Do controls announce meaningful names? Are updates announced?
4. **Zoom and contrast check** — zoom to 200% and confirm nothing breaks; verify contrast of custom colors.

### Try It Yourself — Experiment: audit your own app

Run Lighthouse's Accessibility audit on your Kanban or Dessert Shop production build and record the score. Then do the keyboard-only walkthrough and write down **three** problems the automated tool did *not* report (or confirm that there are none). Fix them and re-run.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| `<div (click)="save()">Save</div>` | Not focusable, no keyboard activation, no role for screen readers | `<button type="button" (click)="save()">Save</button>` | Native semantics and keyboard support come free |
| An icon-only button with no accessible name | A screen reader announces just "button" | Add `aria-label` (or visually hidden text) describing the action | Gives the control a meaningful name |
| Removing the focus outline (`outline: none`) with no replacement | Keyboard users can't see where they are | Keep or restyle a visible `:focus-visible` indicator | Preserves orientation for keyboard users |
| Conveying status by color only (red border = error) | Color-blind users and screen readers miss it | Add text/icon and `role="alert"` messaging | Information is available through more than one channel |
| Treating a perfect Lighthouse score as proof of accessibility | Automated tools detect only a subset of issues | Combine automated scans with keyboard and screen-reader testing | Covers what tools cannot judge |

### ✅ Knowledge Check
1. Why is a native `<button>` better than `<div role="button">`?
2. Name two things in the Dessert Shop lab that were accessibility best practices, and the principle each reflects.
3. Why does a single-page app need extra care about announcing route changes?

---

## 10. Building for Production

### What does a production build do?

`ng build` compiles and bundles your app for deployment. In current Angular projects, **production is the default build configuration**, so a plain `ng build` produces an optimized build; `ng build --configuration production` makes that explicit (and is what the module's official-guide reference describes). Compared with `ng serve`'s development build, a production build applies:

- **AOT (Ahead-of-Time) compilation** — templates are compiled to JavaScript at build time, so the browser doesn't compile them at runtime. Faster startup and template errors caught at build time.
- **Minification** — removes whitespace/comments and shortens names to reduce bytes.
- **Tree-shaking and dead-code elimination** — drops unused code (Section 7).
- **Bundling and code-splitting** — combines files and emits separate chunks for lazy-loaded routes (Section 6).
- **Hashed output file names** — filenames include a content hash (e.g., `main-AB12CD34.js`), so browsers can cache files aggressively yet always fetch a new file when content changes.
- **Budgets** — size checks (Section 7).

### The commands

```bash
ng build                              # production build (default config in current projects)
ng build --configuration production   # explicit form
ng build --configuration development # unoptimized build with source maps, for debugging
```
**Where does the output go?** Typically `dist/<your-app>/`. In projects using the newer application builder, the deployable static files are in a `browser` subfolder (`dist/<your-app>/browser`) — the folder the Dessert Shop deployment files (`netlify.toml`, `vercel.json`) pointed at. In older projects, the files are directly in `dist/<your-app>/`. **Always check what your build actually produced** before configuring a host.

### Environment configuration

Real apps need different settings per environment — most commonly an API base URL (Module 9) that differs between local development and production.

```typescript
// src/environments/environment.ts            (production values / default)
export const environment = {
  production: true,
  apiUrl: 'https://api.kanbanapp.com'
};

// src/environments/environment.development.ts   (development values)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'
};
```
```typescript
import { environment } from '../environments/environment';

private readonly baseUrl = `${environment.apiUrl}/boards`;
```
In `angular.json`, a `fileReplacements` entry for the development configuration swaps `environment.ts` with `environment.development.ts` at build time, so the same import resolves to different values.

> **Version note:** older projects used `environment.ts` for development and `environment.prod.ts` for production (the file name the module's video refers to), with the replacement configured on the **production** build instead. Newer projects don't generate environment files by default; the CLI command `ng generate environments` creates them. The principle is identical — only which file is the "default" differs.

> **Security note (important):** everything in your front-end bundle — including `environment` values — is **public**. Anyone can open DevTools and read it. **Never put secrets** (private API keys, database passwords) in environment files. Public identifiers and base URLs are fine; secrets belong on a server (🔒 outside this course's scope).

### Try It Yourself — Experiment: development vs. production output

Build both configurations and compare the files in `dist/` — sizes, hashed filenames, and (for development) source maps. Then serve the production output with any static file server and confirm the app runs.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Deploying the output of a development build | Larger, slower, unoptimized | Deploy the production build output | Delivers the optimized bundles |
| Pointing the host at the wrong folder (e.g., `dist/<app>` when files are in `dist/<app>/browser`) | The host serves a folder without `index.html` at its root, producing blank pages or 404s | Check the actual build output and point the host at the folder containing `index.html` | Serves the real app entry point |
| Hard-coding the API URL in services | Can't switch between local and production without editing code | Read it from `environment` | One codebase, per-environment configuration |
| Putting secrets in environment files | They ship to every user's browser | Keep secrets server-side | Front-end code is public by nature |

### ✅ Knowledge Check
1. List three optimizations a production build applies that `ng serve` does not.
2. Why do production filenames include a content hash?
3. Why is it unsafe to store a private API key in an Angular environment file?

### 🎥 Optional Video
The module's resources include a video on production environments (`environment.prod.ts`) and build-process best practices: [Watch on YouTube](https://www.youtube.com/watch?v=OwvKBMmkXyk) (title not given in the source). Note the version note above when comparing its file names with a freshly generated project.

---

## 11. Deploying to a Hosting Platform

### What does "deploying" an Angular app actually mean?

A production Angular build is a folder of **static files** — HTML, JavaScript, CSS, images. **Deploying** means putting that folder on a web server (or a static hosting service) so people can reach it at a URL. There's no Node server required to *run* the built app, which is why so many hosts work.

### The one requirement that trips everyone up: SPA fallback routing

With client-side routing (Module 4), a URL like `/boards/42` doesn't correspond to a real file on the server. If a user refreshes on that URL or opens a shared link, the host looks for `/boards/42` on disk, finds nothing, and returns a **404** — even though your Angular app could handle it perfectly. Every host therefore needs a rule: **"for any path that isn't a real file, serve `index.html`"** and let Angular's router take over. Each platform configures this differently:

| Platform | How the fallback / config is expressed |
|---|---|
| **Netlify** | A redirect rule such as `/*  /index.html  200` (in `_redirects` or `netlify.toml`) — the rewrite configured in the Dessert Shop deployment files |
| **Vercel** | A `rewrites` entry in `vercel.json` mapping all paths to `/index.html` — also from the Dessert Shop files |
| **Firebase Hosting** | A `rewrites` rule (`"source": "**"`, `"destination": "/index.html"`) in `firebase.json`; `firebase init hosting` offers to set this up as a single-page app |
| **AWS S3 + CloudFront** | Custom error responses mapping 403/404 to `/index.html` with a 200 status |
| **Azure Static Web Apps** | A `navigationFallback` setting in `staticwebapp.config.json` |

(Exact syntax and defaults change over time — treat the table as the *concept* for each platform and confirm details in its current documentation.)

### Deployment workflows, by platform

**Firebase Hosting** — Firebase provides an Angular-specific guide (linked in Section 15). Typical flow: install the Firebase tooling, initialize hosting (choosing the build output folder as the public directory and answering "yes" to single-page-app rewrites), build, then deploy with the Firebase CLI. The `@angular/fire` package adds an `ng deploy` shortcut.

**Netlify and Vercel** — the two lowest-friction options. Either deploy from the CLI after a build, or **connect a Git repository** so the platform builds and deploys automatically on every push. You supply the build command (e.g., `npm run build`) and the output directory. The Dessert Shop project already includes configuration for both; this is the "deploy your lab" step (lab Task 8) fully explained.

**AWS S3 + CloudFront** — the "do it yourself on cloud infrastructure" option: upload the build to an S3 bucket, then serve it through a CloudFront CDN distribution (for HTTPS and global caching), adding the error-response rule above. More setup, more control. **🔒 IAM policies, cache invalidation strategy and infrastructure-as-code are outside this module.**

**Azure** — typically **Azure Static Web Apps**, commonly connected to a GitHub repository so a **CI/CD pipeline** builds and deploys on each push. **🔒 Pipeline authoring in depth is outside this module.**

The module's resource list includes walkthrough videos for each: [Vercel](https://www.youtube.com/watch?v=-WJTQcWyBBM), [AWS S3 + CloudFront](https://www.youtube.com/watch?v=dooGkvV-SwQ), and [Azure with CI/CD](https://www.youtube.com/watch?v=IuELMXSAslo) (titles not given in the source).

### Caching, briefly

Because production filenames are content-hashed (Section 10), host configuration can let browsers cache `*.js`/`*.css` files for a long time safely. `index.html` is the exception — it must stay fresh so users pick up new hashed filenames after a deploy. Most platforms handle sensible defaults; **🔒 detailed cache-header and CDN tuning is outside this module.**

### CI/CD in one paragraph

**CI/CD** (continuous integration / continuous delivery) automates the path from commit to live site. A typical pipeline: **install dependencies → lint (Section 8) → run tests (Module 10) → build (Section 10) → deploy**. Git-connected hosting (Netlify, Vercel, Azure Static Web Apps, Firebase with GitHub Actions) gives you this almost for free: pushing to the main branch triggers a build and a deploy, and a failing test or build blocks the release.

### Post-deploy checklist

- Open the live URL; confirm the app loads with no console errors.
- **Deep-link test:** open an inner route (e.g., `/boards/42`) in a new tab and refresh — it must not 404.
- Confirm API calls go to the **production** API URL (Network tab, Module 9, Section 8).
- Run Lighthouse against the live site and compare with your baseline (Section 2).
- Check the browser console and Network tab for failed requests.

### Try It Yourself — Experiment: deploy and break it on purpose

Deploy your Dessert Shop or Kanban build to Netlify or Vercel **without** the SPA fallback rule, refresh on an inner route, and see the 404. Then add the rule, redeploy, and confirm the refresh works. Seeing the failure once makes the rule unforgettable.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Deploying without a fallback-to-`index.html` rule | Refreshing or opening a deep link returns 404 | Configure the platform's SPA rewrite | Lets Angular's router handle every path |
| Pointing the host at the wrong output folder | No `index.html` at the served root | Use the folder that actually contains `index.html` | Serves the real entry point |
| Never testing the live site after deploying | Production-only problems (wrong API URL, missing rewrite) go unnoticed | Run the post-deploy checklist | Verifies the real, deployed behavior |
| Letting the browser cache `index.html` aggressively | Users keep loading old hashed filenames after a release | Keep `index.html` fresh; hash-cache everything else | New releases reach users promptly |

### ✅ Knowledge Check
1. Why does refreshing on `/boards/42` return a 404 on a host with no fallback rule, and what's the fix?
2. List the typical stages of a CI/CD pipeline for an Angular app.

---

## 12. Putting It Together: An Optimization Workflow

This is the module's live session ("Optimizing Apps") written down as a repeatable procedure you can run on any Angular app. Each step names the section that covers it.

```
1. BASELINE      Production build → Lighthouse (Performance + Accessibility)
                 → bundle analysis (source-map-explorer) → Angular DevTools profile of one slow interaction
                                                                            (Sections 2, 7)
2. LOAD WINS     Large initial bundle?  → lazy-load features (Section 6), trim/remove heavy imports (Section 7)
                 Slow first image?      → dimensions, lazy-load below the fold (Section 5)
3. RUNTIME WINS  Many components re-checked on each interaction?
                                         → OnPush, one leaf component at a time (Sections 3–4)
                 Expensive template expressions?
                                         → computed() / pure pipe / selector (Sections 4–5)
                 Long lists re-rendering?→ trackBy / track (Section 5)
4. QUALITY       Refactor to the style guide (Section 8); fix accessibility issues (Section 9)
5. SHIP          Production build, budgets passing (Section 10) → deploy with SPA fallback (Section 11)
6. VERIFY        Post-deploy checklist; re-run Lighthouse; compare against the baseline
```

### A worked mini-example: the Dessert Shop

| Observation | Cause | Fix | Evidence |
|---|---|---|---|
| Every "Add to Cart" click re-checks all nine cards | Default change detection + `AppComponent` getters returning new arrays on every pass | `computed()` signals for `cartLines`/`orderTotal`; `OnPush` on `DessertCardComponent`, `DessertListComponent`, `CartComponent` | Angular DevTools shows unrelated cards skipped |
| Dessert list re-renders every row when data refreshes | Default object-identity tracking | `track d.id` / `trackBy` | Profiler shows fewer DOM updates |
| Confirmation modal code ships on first load though few users reach it | Always-loaded component | `@defer` or lazy-load it | Separate chunk in bundle analysis |
| Lighthouse flags a layout shift | Images without reserved space | Keep `width`/`height` attributes | CLS improves |
| Deep-link refresh 404s on the live site | No SPA fallback | Add the rewrite rule (Section 11) | Refresh works on an inner route |

### 🎥 Optional Video
The module's live session models this process on a real example. The overview videos listed in Section 2 are the best written-resource-free companions to this workflow.

### ✅ Knowledge Check
1. Why does the workflow begin and end with measurement?
2. Which step would you take for a slow *first load* versus a laggy *interaction*, and why are they different?

---

## 13. Final Module Project: Optimize & Ship

### Project Requirements

Take one of your existing apps (Kanban or Dessert Shop), measure it, improve it with the techniques in this module, and deploy it — documenting before/after evidence.

### Functional Requirements

1. **Baseline report:** production-build Lighthouse scores (Performance and Accessibility), a bundle-analysis screenshot or table of the three largest contributors, and one Angular DevTools profiler observation.
2. **`OnPush`:** apply `ChangeDetectionStrategy.OnPush` to at least **two** components. For at least one, document a stale-UI bug you hit and which fix (immutable update, `async` pipe, signal, or `markForCheck()`) resolved it.
3. **Template cost:** replace at least one template getter/method call with a `computed()` signal, pure pipe, or selector.
4. **Lists:** add `trackBy` / `track` to every list rendering objects with ids.
5. **Lazy loading:** lazy-load at least one feature or component (`loadChildren`, `loadComponent`, or `@defer`); prove it with the Network tab or bundle analysis.
6. **Accessibility:** run an automated audit **and** a keyboard-only walkthrough; fix at least three issues; record the before/after.
7. **Style guide pass:** apply a consistent naming/structure convention and complete the refactoring pass from Section 8; run ESLint if configured.
8. **Production build:** build for production with budgets passing (or deliberately adjusted and justified).
9. **Environment configuration:** move any hard-coded API URL into environment files, with no secrets in them.
10. **Deployment:** deploy to a hosting platform of your choice with SPA fallback routing configured; complete the post-deploy checklist.
11. **README:** document the before/after numbers, what each technique changed, the live URL, and one thing you tried that didn't help (honest negative results are part of real performance work).

### Suggested Deliverables

```
README.md                 before/after numbers, techniques applied, live URL, lessons learned
src/environments/         environment files (no secrets)
(hosting config)          netlify.toml / vercel.json / firebase.json / etc.
```

### Required Concepts (checklist)

- [ ] Baseline measured on a **production** build
- [ ] `OnPush` on ≥ 2 components with ≥ 1 documented bug-and-fix
- [ ] A template getter/method replaced by `computed()`/pure pipe/selector
- [ ] `trackBy`/`track` on object lists
- [ ] ≥ 1 lazy-loaded feature/component, verified
- [ ] Accessibility audit (automated + keyboard) with ≥ 3 fixes
- [ ] Style-guide-consistent naming/structure
- [ ] Passing production build; environment files used
- [ ] Live deployment; deep-link refresh works
- [ ] README with before/after evidence

### Acceptance Criteria

- Lighthouse (or equivalent) numbers before and after are reported honestly, from production builds.
- At least one component is demonstrably **skipped** by change detection in the Angular DevTools profiler after the `OnPush` refactor.
- The lazy-loaded chunk does **not** appear in the initial Network requests and **does** appear when navigating to it (or when its `@defer` trigger fires).
- The live site loads without console errors, and refreshing on an inner route does not return a 404.
- No secrets appear in the bundle or in environment files.
- The `OnPush` stale-UI write-up names the specific trigger that was missing and why the chosen fix addresses it.

### Hints (if stuck)

- Add `OnPush` to **one leaf component at a time** and click through every interaction after each change (Section 4's checklist).
- If a child never updates after `OnPush`, look for in-place mutation in the parent or a plain property assigned in a subscription — those are the two most common causes.
- If the lazy chunk shows up in the initial load, search for a stray direct `import` of that component outside the route config.
- If the live site is blank, check the host's publish folder first (Section 10's mistakes table), then the browser console.
- If deep links 404, you're missing the SPA fallback rule.

### Optional Stretch Challenges

- Add a preloading strategy (`PreloadAllModules`) and measure whether it changes perceived navigation speed.
- Set a stricter bundle budget than the default and bring the app under it.
- Add a CI step (e.g., a GitHub Actions workflow) that runs lint, tests (Module 10) and a production build on every push.
- Evaluate `NgOptimizedImage` on one hero image and record the effect on LCP. (🔒 beyond this module's required depth — treat it as exploratory.)
- Research (without necessarily implementing) how server-side rendering and hydration (🔒 outside this module) would change your baseline load metrics.

---

## 14. Quick Reference Sheet

### `OnPush`
```
@Component({ changeDetection: ChangeDetectionStrategy.OnPush })

Re-checked only when:
  1. an @Input() reference (or signal input value) changes
  2. an event bound in its template fires
  3. the async pipe receives a value
  4. a signal read in its template changes
  5. you call ChangeDetectorRef.markForCheck()

Rule: never mutate — replace.   this.items = [...this.items, item];
```

### Stable references & cheap templates
```
computed(() => ...)          memoized derived value (Module 7)
pure pipe                    re-runs only when its input reference changes
NgRx selector                memoized (Module 8)

*ngFor="let x of xs; trackBy: trackById"      @for (x of xs; track x.id) { ... }
```

### Lazy loading
```
{ path: 'a', loadChildren:  () => import('./a/a.routes').then(m => m.A_ROUTES) }
{ path: 'b', loadComponent: () => import('./b/b.component').then(m => m.BComponent) }

provideRouter(routes, withPreloading(PreloadAllModules))

@defer (on viewport) { <app-heavy /> } @placeholder { <p>…</p> }
```

### Bundle analysis
```
ng build --source-map
npx source-map-explorer dist/<app>/browser/*.js
ng build --stats-json                    # stats for dedicated analyzers

"budgets": [{ "type": "initial", "maximumWarning": "500kB", "maximumError": "1MB" }]
```

### Build & environments
```
ng build                                  production (default config in current projects)
ng build --configuration production       explicit
ng build --configuration development      unoptimized, debuggable
ng generate environments                  creates environment files (newer projects)
// Never put secrets in environment files — the bundle is public.
```

### Deployment essentials
```
Static files from the build output folder (check where index.html actually is)
SPA fallback:  any non-file path → /index.html
  Netlify:  /*  /index.html  200        Vercel: rewrites in vercel.json
  Firebase: rewrites "**" → /index.html  S3+CloudFront: 403/404 → /index.html (200)
  Azure SWA: navigationFallback
Post-deploy: deep-link refresh, console errors, API URL, Lighthouse vs. baseline
```

### Accessibility essentials
```
Semantic HTML first · keyboard operable · visible focus · alt text (alt="" for decorative)
aria-label for icon-only controls · aria-live for dynamic updates · labels for form fields
role="alert" + aria-describedby for errors · focus management for dialogs · route titles
Audit: Lighthouse/axe + keyboard-only walkthrough + screen-reader spot-check
```

### Important Terminology

| Term | Definition |
|---|---|
| **Profiling** | Observing what an app actually does at load/runtime to find bottlenecks. |
| **LCP / CLS / INP / TBT** | Metrics for load speed, layout stability, interaction responsiveness, and main-thread blocking. |
| **Default (CheckAlways)** | The default change-detection behavior: check every component on every pass. |
| **`OnPush`** | A strategy that checks a component only when a defined trigger occurs. |
| **`markForCheck()`** | Marks a component to be checked on the next pass. |
| **`trackBy` / `track`** | Gives list items a stable identity so DOM/components can be reused. |
| **Lazy loading** | Deferring a feature's code until it's needed. |
| **Preloading** | Fetching lazy chunks in the background after initial load. |
| **`@defer`** | A template block that lazily loads a component on a trigger. |
| **Bundle** | A built JavaScript file the browser downloads. |
| **Tree-shaking** | Removing unused code at build time. |
| **Budget** | A configured size limit the build checks. |
| **AOT** | Compiling templates at build time rather than in the browser. |
| **SPA fallback** | Serving `index.html` for non-file paths so client-side routing works. |
| **CI/CD** | Automating build, test and deploy on each change. |
| **a11y / ARIA** | Accessibility; attributes supplying accessibility information when native HTML can't. |

### 🔒 Coming Later — Outside This Module
Server-side rendering and hydration · Zoneless change detection in depth · CDK virtual scrolling · Service workers/PWA · Custom preloading strategies · `NgOptimizedImage` in depth · Advanced CI/CD and infrastructure-as-code · CDN/cache-header tuning · CDK a11y utilities in depth

---

## 15. Source & Resource Mapping

| Module Topic | Source Resource | Knowledge Extracted |
|---|---|---|
| Performance overview, lazy loading, AOT | Angular.io — "Angular Performance" | Primary framing for Sections 3, 6, 10 |
| `OnPush` and runtime optimization | Code Magazine — "Unlocking Angular Performance Optimization Techniques" | Sections 3–5's technique selection |
| Optimization strategies incl. lazy loading and bundles | C-MARIX — "Angular Performance Optimization" | Sections 6–7's bundle/lazy-loading framing |
| Change detection (`OnPush`) and bundle analysis (video) | YouTube (title not given in source) | Reinforcement for Sections 3 and 7 |
| Lazy loading and production builds (video) | YouTube (title not given in source) | Reinforcement for Sections 6 and 10 |
| Concise top-techniques overview (video) | YouTube (title not given in source) | Quick recap across Sections 3–6 |
| Clean, performant, scalable code | Medium — "Angular Best Practices in 2025" | Section 8's conventions |
| Optimization checklist incl. `OnPush` | dev.to — "Best Practices for Angular Performance Optimization" | Sections 4–5, 8 |
| Maintainable-code best practices (video) | YouTube (title not given in source) | Section 8's foundation |
| Production build and deployment strategies | Angular.io — "Deployment" | Sections 10–11 |
| Deployment considerations | Medium — "Best Practices for Deploying Angular Applications to Production" | Section 11's checklist |
| Advanced/large-scale deployment | Medium — "Advanced Angular Deployment Techniques for Performance and Scalability" | Context for Section 11 |
| Firebase deployment | Firebase Docs — "Deploy Angular to Firebase Hosting" | Section 11's Firebase workflow |
| Production environments and build process (video) | YouTube (title not given in source) | Section 10's environment configuration |
| Vercel deployment (video) | YouTube (title not given in source) | Section 11 |
| AWS S3 + CloudFront deployment (video) | YouTube (title not given in source) | Section 11 |
| Azure deployment with CI/CD (video) | YouTube (title not given in source) | Section 11 |

**Quick links for deeper reading (optional, not required to complete this module):**
- [Angular Performance — Angular.io](https://angular.io/guide/performance)
- [Unlocking Angular Performance Optimization Techniques — Code Magazine](https://www.codemag.com/Article/2507061/Unlocking-Angular-Performance-Optimization-Techniques)
- [Angular Performance Optimization — C-MARIX](https://www.cmarix.com/blog/angular-performance-optimization/)
- [Angular Best Practices in 2025 — Medium](https://medium.com/javarevisited/angular-best-practices-in-2025-write-clean-performant-scalable-code-f8e5c23e40a3)
- [Best Practices for Angular Performance Optimization — dev.to](https://dev.to/eric_walter/best-practices-for-angular-performance-optimization-2ch9)
- [Deployment — Angular.io](https://angular.io/guide/deployment)
- [Advanced Angular Deployment Techniques — Medium](https://medium.com/codex/advanced-angular-deployment-techniques-for-performance-and-scalability-6a29abc09898)
- [Deploy Angular to Firebase Hosting](https://firebase.google.com/docs/hosting/angular)
- Videos: [overview 1](https://www.youtube.com/watch?v=tMxrY7IL-Ac) · [overview 2](https://www.youtube.com/watch?v=9kRievveGGU) · [overview 3](https://www.youtube.com/watch?v=64TMz93YMq8) · [best practices](https://www.youtube.com/watch?v=1Fi3LtwHQkc) · [production environments](https://www.youtube.com/watch?v=OwvKBMmkXyk) · [Vercel](https://www.youtube.com/watch?v=-WJTQcWyBBM) · [AWS S3 + CloudFront](https://www.youtube.com/watch?v=dooGkvV-SwQ) · [Azure + CI/CD](https://www.youtube.com/watch?v=IuELMXSAslo)

---

### Discussion Prompt (from the original module)

> Explain the difference between Angular's default (CheckAlways) and `OnPush` change detection strategies. What specific challenge might you face when refactoring a component to use `OnPush`, and how would you solve it?

Sections 3 and 4 answer this directly. Default checks every component on every pass; `OnPush` checks a component only when a trigger occurs (new input reference, a template event, the `async` pipe, a changed signal, or an explicit `markForCheck()`). The most common refactoring challenge is code that relied on Default's forgiveness — mutating an `@Input()` object in place, or assigning a plain property from a subscription — which then silently fails to update the screen. The solutions are to replace instead of mutate, and to prefer the `async` pipe or signals (reserving `markForCheck()` for edge cases). Frame your own answer around a real stale-UI bug you hit in your own app, in your own words.
