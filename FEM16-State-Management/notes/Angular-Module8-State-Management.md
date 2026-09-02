# Module 8: State Management
### FEM16 — continues from FEM09 (Angular Fundamentals) through FEM15 (Angular Signals)

> **Scope note:** This document covers *only* Module 8 — local vs. global state, building a simple state service with RxJS `BehaviorSubject`, the Redux pattern's core ideas (Store, Actions, Reducers, unidirectional data flow), NgRx Effects for side effects, NgRx Selectors for querying state, and wiring NgRx into an Angular app. Anything beyond that — NgRx entity adapters, NgRx Router Store, meta-reducers, NgRx Signal Store, testing reducers/effects/selectors, DevTools time-travel debugging in depth — is flagged **🔒 Coming Later — Outside This Module**.
>
> **This module also delivers on two deferrals from Module 6.** Module 6 explicitly kept `Subject`/`BehaviorSubject` and NgRx "outside this module's scope" while still teaching everything needed to eventually use them. This is where both get their full treatment.

---

## How this document is organized

Same documentation-first shape as Modules 1–7:

**What is it? → Why does Angular need it? → How does it work? → Syntax breakdown → Examples → When to use / not use → What happens behind the scenes? → How it connects to other concepts → Try It Yourself → Exercises → Common Mistakes**

Everything ties back to this module's running example: extending the Kanban app (Modules 4–5) with structured global state — first with a simple `BehaviorSubject`-based service, then refactored into NgRx — "Kanban Task Management Web App (Part IV)."

---

## Table of Contents

1. [From Module 7 to Module 8: What's New](#1-from-module-7-to-module-8-whats-new)
2. [Local State vs. Global State](#2-local-state-vs-global-state)
3. [Service-Based State With `BehaviorSubject`](#3-service-based-state-with-behaviorsubject)
4. [The Redux Pattern: Store, Actions, Reducers](#4-the-redux-pattern-store-actions-reducers)
5. [NgRx Effects: Handling Side Effects](#5-ngrx-effects-handling-side-effects)
6. [NgRx Selectors: Querying the Store](#6-ngrx-selectors-querying-the-store)
7. [Wiring NgRx Into an Angular App](#7-wiring-ngrx-into-an-angular-app)
8. [Why NgRx Over a Simple Service?](#8-why-ngrx-over-a-simple-service)
9. [Choosing Among Signals, Service-State, and NgRx](#9-choosing-among-signals-service-state-and-ngrx)
10. [Putting It Together: Kanban App (Part IV) NgRx Architecture](#10-putting-it-together-kanban-app-part-iv-ngrx-architecture)
11. [Final Module Project: Kanban Task Management Web App (Part IV — State Management)](#11-final-module-project-kanban-task-management-web-app-part-iv--state-management)
12. [Quick Reference Sheet](#12-quick-reference-sheet)
13. [Source & Resource Mapping](#13-source--resource-mapping)

---

## 1. From Module 7 to Module 8: What's New

Module 3 introduced services as the place shared state lives instead of components (`CartService`). Module 7 introduced Signals as a simpler way to represent reactive state, generally scoped to one component or a small, direct relationship between components. Neither module asked a question this one has to: **what happens when an application's shared state itself becomes complex enough that "a service with a few properties and methods" starts to strain** — many different features reading and writing the same state, non-trivial async side effects tied to state changes, and a real need to trace *exactly* why a piece of state changed, after the fact, in a growing team's codebase?

This module answers that question two ways, deliberately in order of increasing structure: first, a **service-based** approach using RxJS's `BehaviorSubject` (a more capable evolution of Module 3's plain-property services); then **NgRx**, a full implementation of the **Redux pattern** for Angular, adding significant structure and predictability at the cost of more code to write for any single change. The module's own discussion prompt asks you to articulate exactly when that trade-off is worth it — Section 8 is built to answer it directly.

### ✅ Knowledge Check
1. What did Module 3's `CartService` and Module 7's Signals both leave unanswered about *very large, shared, complex* application state specifically?

---

## 2. Local State vs. Global State

### What is the distinction?

**Local (component) state** is data that belongs to, and is only ever needed by, one component (or a small, direct parent/child relationship) — a dropdown's open/closed flag, a form's current input value before submission. **Global (application) state** is data that many, often unrelated, parts of the application need to read and/or change — the Kanban app's current user, the full set of boards and tasks, or (from Module 1) the Dessert Shop's cart contents.

### Concrete examples from this course so far

| State | Local or global? | Where it lived |
|---|---|---|
| The Character Counter's live word count (Module 2) | Local | A component property, recalculated via `ngOnChanges` |
| A single `DessertCard`'s "is this one card's detail expanded" flag (Module 3, Section 4) | Local | Correctly isolated via a component-level provider |
| The Dessert Shop's cart contents (Module 3) | **Global** | `CartService`, `providedIn: 'root'`, shared by every component that injects it |
| A Reactive Form's current field values, before submission (Module 5) | Local | The component's own `FormGroup` |
| The Kanban app's boards/tasks (Modules 4–5) | **Global** | A `BoardService`/`TaskService`, injected wherever needed |

### Why does this distinction matter enough to be this module's first topic?

Choosing the wrong scope for a piece of state causes two different, equally real problems:
- **Treating global state as local** (e.g., keeping the cart only in `AppComponent`, per Module 1, before Module 3's refactor) means other components that need it can't get it without awkward `@Input()`/`@Output()` threading through components that don't otherwise care about it.
- **Treating local state as global** (e.g., putting every dropdown's open/closed flag into a shared, `providedIn: 'root'` service) needlessly complicates simple, self-contained UI concerns, and can cause completely unrelated dropdowns to affect each other if the state isn't correctly isolated per instance.

### The decision rule, extended from Module 3

Module 3, Section 4 already established: *"if there are 9 instances of this component, should they share one instance of this service, or should each get its own?"* This module's local-vs-global question is the same judgment call, one level up: *"does this data belong to one feature/component's own concerns, or does it represent something the wider application needs to agree on?"* Global state is a strong candidate for the more structured approaches this module builds toward (Sections 3–7) specifically because more than one, often distant, part of the app depends on it staying consistent.

### 🎥 Optional Video
This section draws on the official **"State management" guide (Angular.io)**, linked in Section 13 — read it directly for the canonical local/global framing this section summarizes, alongside the **Nx Blog's "Angular State Management in 2025"** article for a broader landscape view of when global state solutions are actually warranted.

### ✅ Knowledge Check
1. Using the table above, explain in your own words why the Dessert Shop's cart is global state while a single dropdown's open/closed flag is local.
2. What goes wrong, specifically, if local state is mistakenly managed as if it were global?

---

## 3. Service-Based State With `BehaviorSubject`

### What is a `BehaviorSubject`?

A **`BehaviorSubject`** is a special kind of Observable (Module 6) that (1) **always holds a current value**, readable synchronously via `.value`, (2) **requires an initial value** at creation, and (3) **immediately emits its current value to any new subscriber**, even one that subscribes long after the value was last set. This combination — "an Observable, but with a current value you can always ask for" — is exactly what Module 3's plain-property services (`CartService`) were missing: a way for late-arriving subscribers (a component created *after* the cart already had items in it) to immediately receive the cart's current state, not just future changes.

### Why is this better than Module 3's plain-property + method pattern for genuinely shared, evolving state?

Module 3's `CartService` exposed plain methods (`getCartLines()`, `getOrderTotal()`) that a component had to **call** to get a value — there was no way for a component to be **automatically notified** when the cart changed elsewhere, short of re-calling those methods on every change-detection cycle (wasteful) or wiring up some ad-hoc notification mechanism by hand. A `BehaviorSubject`-backed service can `.subscribe()` (or, more idiomatically, expose the stream for the `async` pipe, Module 6, or `toSignal()`, Module 7) to be notified the instant the state changes, anywhere in the app.

### Syntax breakdown

```typescript
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Board } from '../models/board.model';

@Injectable({ providedIn: 'root' })
export class BoardStateService {
  private readonly boardsSubject = new BehaviorSubject<Board[]>([]);

  // Expose as a plain Observable — consumers should never be able to call
  // .next() themselves; only this service controls how the state changes.
  readonly boards$: Observable<Board[]> = this.boardsSubject.asObservable();

  addBoard(board: Board): void {
    const current = this.boardsSubject.value;
    this.boardsSubject.next([...current, board]); // immutable update — same rule as Modules 3 & 7
  }

  removeBoard(boardId: string): void {
    const current = this.boardsSubject.value;
    this.boardsSubject.next(current.filter((b) => b.id !== boardId));
  }
}
```
- **`new BehaviorSubject<Board[]>([])`** — creates the subject with an initial value of an empty array; the generic type (`Board[]`) matches Module 3's typing discipline for `EventEmitter`/services generally.
- **`.value`** — synchronously reads the *current* value, no subscription needed — genuinely new capability compared to a plain Observable (Module 6), which has no equivalent synchronous read.
- **`.next(newValue)`** — pushes a new value to every current and future subscriber — the `BehaviorSubject`-specific method for "update the state," conceptually similar to Module 7's `.set()` for a writable signal, but operating within RxJS's push-based model rather than Signals' pull-based one.
- **`.asObservable()`** — deliberately exposes only the read side (`boards$`) to consumers, hiding the subject's own `.next()` method — an important encapsulation habit: **only the service itself** should ever be able to push new values; components should only ever be able to read/react to them, never bypass the service's own methods (`addBoard`, `removeBoard`) to mutate state directly.
- **Immutable updates** — exactly the rule established in Module 3 (`@Input()` objects) and reinforced in Module 7 (Signals' removed `.mutate()`): `.next([...current, board])`, never mutating the existing array in place.

### Consuming the service — three equivalent patterns, all previously taught

```typescript
// 1. async pipe (Module 6) — the default choice for template-only consumption
export class BoardListComponent {
  boards$ = this.boardState.boards$;
}
```
```html
<li *ngFor="let board of boards$ | async">{{ board.name }}</li>
```

```typescript
// 2. toSignal() (Module 7) — bridging into Signals at the display boundary
export class BoardListComponent {
  boards = toSignal(this.boardState.boards$, { initialValue: [] });
}
```

```typescript
// 3. Manual subscription with cleanup (Module 6) — when the class itself needs the value, not just the template
export class BoardListComponent implements OnInit, OnDestroy {
  boards: Board[] = [];
  private destroyed$ = new Subject<void>();

  ngOnInit(): void {
    this.boardState.boards$.pipe(takeUntil(this.destroyed$)).subscribe((boards) => {
      this.boards = boards;
    });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
```
Every one of these three patterns is **exactly** what Modules 6–7 already taught — nothing new is required to *consume* a `BehaviorSubject`-backed service; the only new material in this section is the service's own internal use of `BehaviorSubject` to hold and push state changes correctly.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Exposing the raw `BehaviorSubject` itself as a public property (`boardsSubject` instead of `boards$`) | Any consumer could call `.next(...)` directly, bypassing the service's own methods (`addBoard`/`removeBoard`) and any validation/logic they contain | Expose only `.asObservable()`, and require all changes to go through the service's own methods | Keeps a single, controlled path for how state can actually change |
| Mutating `this.boardsSubject.value` in place before calling `.next()` with the same reference | Same reference-based change-detection problem established in Modules 3 and 7 — subscribers may not reliably notice | Always construct a new array/object and pass it to `.next(...)` | Guarantees a genuinely new reference for every state change |
| Using a plain `Subject` (not `BehaviorSubject`) for state a late-subscribing component needs to read immediately | A plain `Subject` has no concept of a "current value" — a component that subscribes after the last emission gets nothing until the *next* change | Use `BehaviorSubject` specifically when "what's the current state right now" matters, which is nearly always true for shared application state | `BehaviorSubject`'s defining feature — replaying its current value to new subscribers — is exactly what state services need |

### Exercises

**Level 1 — Basic:** Build a `CounterStateService` using a `BehaviorSubject<number>`, with `increment()`/`decrement()` methods and an exposed `count$` Observable.

**Level 2 — Practical:** Convert Module 3's `CartService` (plain properties/methods) into a `BehaviorSubject`-backed version, exposing a `cartLines$` Observable, and update the Dessert Shop's `Cart` component to consume it via the `async` pipe.

**Level 3 — Challenge:** Build a `BoardStateService` for the Kanban app as shown above, with `addBoard`/`removeBoard`/`updateBoard` methods, and wire `BoardListComponent` to consume it via all three patterns shown (in different, temporary branches or comments) to directly compare them.

### ✅ Knowledge Check
1. What capability does `BehaviorSubject` add on top of a plain Observable, and why does that matter for state services specifically?
2. Why should a state service expose `.asObservable()` rather than the raw `BehaviorSubject` itself?

### 🎥 Optional Video
This section's core pattern is drawn directly from the official **"State management" guide (Angular.io)**, linked in Section 13 — its `BehaviorSubject`-based example is worth reading in full alongside the code above.

---

## 4. The Redux Pattern: Store, Actions, Reducers

### What is Redux, and what is NgRx?

**Redux** is a state-management pattern (originally from the React ecosystem, but not tied to any one framework) built around one central rule: **all application state lives in a single object (the "store"), and the only way to change it is by dispatching a plain, descriptive object (an "action") that a pure function (a "reducer") uses to compute the *next* version of the state.** **NgRx** is Angular's official, RxJS-powered implementation of this pattern.

### Why would an app need this much more structure than Section 3's `BehaviorSubject` service?

Section 3's service works well, but as an app grows, two things become harder to keep track of with services alone: **who is allowed to change this state, from where** (any method on any injected service could technically call `.next(...)`), and **what actually happened, in what order, when debugging a wrong final state.** Redux's answer is to make **every single state change** go through one uniform, traceable path: dispatch a named action → a reducer computes new state from it → the store updates → everything subscribed re-renders. Every state change in the entire application becomes a **describable event** (the action) rather than an arbitrary method call buried somewhere in a service.

### Unidirectional data flow — the core mental model

```
Component
   │  dispatches an Action (a plain, descriptive object: { type: 'Board Added', board })
   ↓
Store
   │  routes the action to the Reducer(s)
   ↓
Reducer (a pure function)
   │  computes and returns a brand-new state object — never mutates the old one
   ↓
Store
   │  holds the new state; notifies every subscriber
   ↓
Component (via a Selector, Section 6)
   │  reads the relevant slice of the new state, template re-renders
```
Data only ever flows in **one direction** around this loop — a component never directly reaches into the store and changes a value; it only ever *describes what happened* (dispatches an action) and *reads* the result (via a selector). This single rule is what this module's own quiz specifically names ("the unidirectional data flow").

### Actions — describing what happened

```typescript
import { createAction, props } from '@ngrx/store';
import { Board } from '../models/board.model';

export const addBoard = createAction(
  '[Board List] Add Board',
  props<{ board: Board }>()
);

export const removeBoard = createAction(
  '[Board List] Remove Board',
  props<{ boardId: string }>()
);
```
- **`createAction(type, props<T>())`** — a helper producing an **action creator**: a function that, when called (`addBoard({ board: newBoard })`), produces a plain object `{ type: '[Board List] Add Board', board: newBoard }`.
- **`'[Board List] Add Board'`** — the action's `type`, conventionally written as `'[Source] Event description'` — the bracketed source (here, which part of the UI/feature triggered it) and a plain-English description of what happened. This convention exists specifically to make actions **readable as a log of real events** when debugging (e.g., with NgRx DevTools — 🔒 covered only in passing, not in depth, in this module).
- **`props<{ board: Board }>()`** — declares the **payload** shape this action carries — here, the actual board being added.

### Reducers — pure functions computing the next state

```typescript
import { createReducer, on } from '@ngrx/store';
import { addBoard, removeBoard } from './board.actions';
import { Board } from '../models/board.model';

export interface BoardState {
  boards: Board[];
}

export const initialBoardState: BoardState = {
  boards: []
};

export const boardReducer = createReducer(
  initialBoardState,
  on(addBoard, (state, { board }) => ({
    ...state,
    boards: [...state.boards, board]
  })),
  on(removeBoard, (state, { boardId }) => ({
    ...state,
    boards: state.boards.filter((b) => b.id !== boardId)
  }))
);
```
- **`createReducer(initialState, on(action, handler), ...)`** — declares a reducer as a list of "when this action happens, compute the next state like this" pairs, starting from `initialBoardState`.
- **`on(addBoard, (state, { board }) => ({...}))`** — for the `addBoard` action specifically, receives the **current state** and the action's payload (destructured directly, `{ board }`), and must **return a brand-new state object** — never mutate `state` directly. This is, once again, the exact same immutability principle from Modules 3 and 7 — now enforced as an absolute requirement of how reducers must be written, not just a best practice.
- **A reducer must be a *pure function*** — given the same `state` and action, it must always return the same result, with **no side effects** (no HTTP calls, no logging, no reading `Date.now()` or `Math.random()` directly inside it) — side effects belong in Effects instead (Section 5), mirroring exactly the pure-vs-side-effecting distinction Module 7 drew between `computed()` and `effect()`.

### The Store — where state actually lives

```typescript
import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { addBoard } from '../state/board.actions';

@Component({ /* ... */ })
export class BoardListComponent {
  private store = inject(Store);

  onAddBoard(board: Board): void {
    this.store.dispatch(addBoard({ board }));
  }
}
```
- **`inject(Store)`** — the `Store` is itself injected exactly like any Module 3 service — NgRx doesn't introduce a new dependency-injection mechanism, it uses the one you already know.
- **`this.store.dispatch(addBoard({ board }))`** — dispatching an action is the **only** way a component participates in changing state — notice there's no method here that directly manipulates a `boards` array; the component only describes *what happened*, and the reducer (registered separately, Section 7) decides how state should respond.

### Three worked examples, together

**Example 1 — the full add-board flow, action through reducer** (shown above, combined).

**Example 2 — an action with no payload:**
```typescript
export const clearBoards = createAction('[Board List] Clear All Boards');
// ...
on(clearBoards, (state) => ({ ...state, boards: [] }))
```
Not every action needs a payload — `createAction` without `props<T>()` simply produces `{ type: '...' }` with no additional data.

**Example 3 — a reducer handling an update, preserving everything else in an object:**
```typescript
export const updateBoardName = createAction(
  '[Board Settings] Update Board Name',
  props<{ boardId: string; name: string }>()
);
// ...
on(updateBoardName, (state, { boardId, name }) => ({
  ...state,
  boards: state.boards.map((b) => (b.id === boardId ? { ...b, name } : b))
}))
```

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Mutating `state` directly inside a reducer (e.g., `state.boards.push(board); return state;`) | Violates the core Redux/reducer contract — NgRx (and the wider ecosystem's tooling, like DevTools time-travel debugging) relies on genuinely new state object references to detect changes correctly | Always return a **new** object (`{ ...state, boards: [...state.boards, board] }`) | Matches the same reference-based-detection principle already established in Modules 3 and 7 |
| Putting an HTTP call, a `console.log` used for real logic, or `Date.now()`/`Math.random()` directly inside a reducer | Breaks purity — the same input (state + action) would no longer reliably produce the same output, and side effects have no well-defined place in the unidirectional flow | Move any side effect into an Effect (Section 5); keep reducers pure calculations only | Reducers and Effects have a clean, deliberate division of labor, directly parallel to `computed()`/`effect()` in Module 7 |
| Dispatching an action with a vague, generic type (e.g., `'update'`) instead of a descriptive one (`'[Board Settings] Update Board Name'`) | Makes the action log (crucial for debugging a complex app) nearly meaningless — "update" gives no information about what actually happened or where it came from | Follow the `'[Source] Event description'` convention consistently | Keeps the action log genuinely useful as a readable history of real events |
| Calling a service method directly from a component to change global state, alongside also having that state managed by NgRx | Creates two competing paths for the same state to change — defeats the entire purpose of "all changes go through dispatched actions" | Once state is managed by NgRx, **all** changes to it must go through `store.dispatch(...)`, with no side-channel mutations | Preserves the unidirectional flow's core guarantee: every change is traceable to a dispatched action |

### ✅ Knowledge Check
1. Describe the unidirectional data flow loop, in your own words, from a component dispatching an action to the template re-rendering.
2. Why must a reducer be a pure function, and what's the practical consequence of putting an HTTP call directly inside one?

### 🎥 Optional Video
**Angular NgRX: Course Overview | State Management in Angular (5 min)**
[Watch on YouTube](https://www.youtube.com/watch?v=QOrzi5jjc7E)
**Useful for:** A concise "why NgRx" framing before the syntax-heavy sections, directly setting up this section and Section 8.

---

## 5. NgRx Effects: Handling Side Effects

### What is an Effect, in the NgRx sense?

An **NgRx Effect** is a class (or function) that listens for **dispatched actions** and, in response, performs a **side effect** (most commonly, an `HttpClient` call, Module 3) — and, typically, dispatches a **new** action once that side effect completes, feeding the result back into the reducer through the normal unidirectional flow.

> ⚠️ **Naming collision, worth addressing directly:** "Effect" here is an entirely different concept from Module 7's `effect()` function, despite the shared name. Module 7's `effect()` reacts to **Signal** changes for side effects local to a component. An NgRx Effect reacts to **dispatched actions** for side effects tied to the **global store**. They solve a conceptually similar problem (running side effects in response to state-adjacent changes) in two entirely separate systems — don't assume code/syntax transfers between them.

### Why can't the side effect just happen inside the reducer?

Section 4 established reducers must be pure, synchronous functions — no side effects allowed. But real applications constantly need side effects *tied to* state changes: dispatching `loadBoards` should trigger an actual `HttpClient` GET request; once that request resolves, its result needs to become **new state** via a dispatched success action. Effects are NgRx's dedicated, separate home for exactly this category of work, keeping reducers honestly pure while still letting the app respond to actions with real async work.

### Syntax breakdown

```typescript
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { BoardService } from '../services/board.service';
import { loadBoards, loadBoardsSuccess, loadBoardsFailure } from './board.actions';

@Injectable()
export class BoardEffects {
  private actions$ = inject(Actions);
  private boardService = inject(BoardService);

  loadBoards$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadBoards),
      switchMap(() =>
        this.boardService.getBoards().pipe(
          map((boards) => loadBoardsSuccess({ boards })),
          catchError((error) => of(loadBoardsFailure({ error: error.message })))
        )
      )
    )
  );
}
```
- **`Actions`** — an injectable Observable-like stream of **every action dispatched anywhere in the app** — the raw material Effects filter and react to.
- **`ofType(loadBoards)`** — an operator (specific to `@ngrx/effects`, alongside the general RxJS operators from Module 6) narrowing the stream to only the one action type this Effect cares about.
- **`switchMap(...)`** — this should look immediately familiar from Module 6, Section 6: exactly the same "cancel the previous, switch to the new" behavior, now applied to "if `loadBoards` is dispatched again before the first request finishes, cancel the stale one" — the identical reasoning as Module 4's route-parameter example, just triggered by a dispatched action instead of a route change.
- **`this.boardService.getBoards()`** — a completely ordinary Module 3 service call, returning an `Observable<Board[]>` exactly as always.
- **`map((boards) => loadBoardsSuccess({ boards }))`** — on success, **transforms the raw data into a new action** (`loadBoardsSuccess`) — the Effect's job is to turn "an async operation resolved" into "a new action was dispatched," which a reducer (registered to handle `loadBoardsSuccess`) then uses to actually update state.
- **`catchError((error) => of(loadBoardsFailure({...})))`** — exactly Module 6, Section 7's pattern: intercept the error and produce a **fallback Observable** — here, one emitting a `loadBoardsFailure` action instead of letting the Effect's own stream die.
- **`createEffect(() => ...)`** — registers the whole pipeline as an Effect; by default, whatever the pipeline emits (here, either `loadBoardsSuccess` or `loadBoardsFailure`) is **automatically dispatched back into the store** — you don't call `store.dispatch(...)` manually inside an Effect for this common case.

### The matching actions and reducer additions

```typescript
export const loadBoards = createAction('[Board List] Load Boards');
export const loadBoardsSuccess = createAction('[Board API] Load Boards Success', props<{ boards: Board[] }>());
export const loadBoardsFailure = createAction('[Board API] Load Boards Failure', props<{ error: string }>());
```
```typescript
export const boardReducer = createReducer(
  initialBoardState,
  on(loadBoards, (state) => ({ ...state, isLoading: true, error: null })),
  on(loadBoardsSuccess, (state, { boards }) => ({ ...state, boards, isLoading: false })),
  on(loadBoardsFailure, (state, { error }) => ({ ...state, isLoading: false, error }))
);
```
This is the complete round trip: a component dispatches `loadBoards` → the reducer immediately sets `isLoading: true` → the Effect notices `loadBoards`, calls the service, and dispatches either `loadBoardsSuccess`/`loadBoardsFailure` → the reducer handles whichever one arrives, updating `boards`/`error` and clearing `isLoading`. **Every one of these steps is a dispatched action handled by a reducer** — the Effect never touches state directly; it only ever produces further actions.

### Three worked examples

**Example 1 — the full load flow** (shown above, combined).

**Example 2 — a "fire and forget" Effect with no resulting action (rare, but valid):**
```typescript
logBoardAdded$ = createEffect(
  () =>
    this.actions$.pipe(
      ofType(addBoard),
      tap(({ board }) => console.log('Board added:', board.name))
    ),
  { dispatch: false }
);
```
`{ dispatch: false }` tells NgRx this Effect's output should **not** be automatically dispatched as a new action — necessary whenever an Effect's purpose is purely a side effect (logging here) with no follow-up state change to trigger.

**Example 3 — an Effect reacting to a successful save, then navigating (Module 4):**
```typescript
saveTaskSuccess$ = createEffect(
  () =>
    this.actions$.pipe(
      ofType(saveTaskSuccess),
      tap(() => this.router.navigate(['/boards']))
    ),
  { dispatch: false }
);
```

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Putting an `HttpClient` call directly inside a reducer | Violates reducer purity (Section 4) — reducers must be synchronous and side-effect-free | Move the call into an Effect, dispatching a new action with the result | Keeps reducers pure while still enabling real async work in response to actions |
| Forgetting `{ dispatch: false }` on an Effect that doesn't produce a meaningful follow-up action | NgRx assumes every Effect's output should be dispatched as a new action; without this flag, whatever the `tap`/tap-like pipeline "emits" may be mistakenly dispatched | Add `{ dispatch: false }` for Effects that only perform a side effect with no new action to raise | Correctly tells NgRx this Effect isn't meant to feed anything back into the store |
| Nesting `.subscribe()` inside an Effect instead of composing operators through `.pipe()` | Reintroduces Module 6, Section 6's nested-subscribe race-condition bug, now inside NgRx's own infrastructure | Use `switchMap`/`mergeMap`/`concatMap` (Module 6) exactly as you would anywhere else | Effects are still just RxJS pipelines — every Module 6 lesson about composing Observables correctly still applies |
| Confusing an NgRx Effect with Module 7's `effect()` function due to the shared name | Leads to expecting Signal-reading syntax or automatic dependency tracking inside an NgRx Effect, neither of which applies | Treat them as two separate, same-named concepts in two separate systems (actions/store vs. Signals) | Avoids incorrectly transferring assumptions between unrelated APIs |

### ✅ Knowledge Check
1. Why can't the `HttpClient` call for loading boards live directly inside `boardReducer`?
2. What does `{ dispatch: false }` do, and when is it necessary?
3. In your own words, how is an NgRx Effect different from Module 7's `effect()` function, despite the shared name?

---

## 6. NgRx Selectors: Querying the Store

### What is a selector?

A **selector** is a function that reads a specific, often derived, slice of data out of the store's overall state — the NgRx equivalent of Module 7's `computed()`: given the store's current state, it *derives* a value, and — critically — **memoizes** its result, only recalculating when the specific pieces of state it depends on actually change.

### Why not just read `state.boards` directly wherever it's needed?

A component reaching directly into the store's raw shape (`store.select((state) => state.board.boards)`) works, but scatters the knowledge of the store's exact internal structure across every component that needs any piece of it — if that structure ever changes (a common, expected occurrence as an app grows), **every** place reading it directly needs updating. Selectors centralize "how to get this particular piece of derived data" in one place, so components depend on a stable, named selector rather than the store's raw internal shape.

### Syntax breakdown

```typescript
import { createSelector, createFeatureSelector } from '@ngrx/store';
import { BoardState } from './board.reducer';

export const selectBoardState = createFeatureSelector<BoardState>('board');

export const selectAllBoards = createSelector(
  selectBoardState,
  (state) => state.boards
);

export const selectIsLoading = createSelector(
  selectBoardState,
  (state) => state.isLoading
);

export const selectBoardCount = createSelector(
  selectAllBoards,
  (boards) => boards.length
);
```
- **`createFeatureSelector<BoardState>('board')`** — selects this feature's entire state slice out of the overall store, keyed by the name it was registered under (Section 7 covers registration) — the starting point every other selector for this feature builds on.
- **`createSelector(selectBoardState, (state) => state.boards)`** — takes one or more **input selectors** (here, just `selectBoardState`) and a **projector function** computing the derived result from their combined output — directly parallel to Module 7's `computed(() => ...)` reading other signals.
- **`selectBoardCount`, built from `selectAllBoards`** — selectors can be **composed from other selectors**, exactly like Module 7's chained `computed()` signals (Section 4 there) — `selectBoardCount` automatically stays correct whenever `selectAllBoards`'s result changes, with no manual wiring.

### Using a selector in a component

```typescript
import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectAllBoards, selectIsLoading } from '../state/board.selectors';

@Component({ /* ... */ })
export class BoardListComponent {
  private store = inject(Store);

  boards$ = this.store.select(selectAllBoards);
  isLoading$ = this.store.select(selectIsLoading);

  // Or, bridged into a signal (Module 7):
  boards = toSignal(this.store.select(selectAllBoards), { initialValue: [] });
}
```
`store.select(selector)` returns an Observable — everything Modules 6–7 taught about consuming Observables (the `async` pipe, `toSignal()`, manual subscription with cleanup) applies identically here, exactly as it did for Section 3's `BehaviorSubject`-backed service.

### Three worked examples

**Example 1 — the composed selectors above** (shown in full).

**Example 2 — a selector taking a parameter, using a selector factory:**
```typescript
export const selectBoardById = (boardId: string) =>
  createSelector(selectAllBoards, (boards) => boards.find((b) => b.id === boardId));
```
```typescript
board$ = this.store.select(selectBoardById(this.boardId));
```
Since selectors are plain functions, wrapping one in another function that accepts a parameter (`boardId` here) is a natural, common pattern for "select one specific item by id."

**Example 3 — combining two independent selectors for a combined view:**
```typescript
export const selectBoardsWithLoadingState = createSelector(
  selectAllBoards,
  selectIsLoading,
  (boards, isLoading) => ({ boards, isLoading })
);
```
`createSelector` accepts **multiple** input selectors before the final projector function — the projector receives each one's result as a separate argument, in order.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Reading `store.select((state) => state.board.boards)` inline in a component, instead of a named, exported selector | Scatters knowledge of the store's internal shape across every component, making future restructuring far riskier | Always define and export a named selector (`selectAllBoards`) and import it where needed | Centralizes the store's internal shape behind a stable, reusable interface |
| Recomputing a derived value with a plain method instead of `createSelector` | Loses memoization — the derivation reruns on every read rather than only when its actual dependencies change | Use `createSelector`, composing from other selectors as needed | Matches Module 7's `computed()` memoization behavior, now for store-derived data |
| Confusing a selector's projector function with a reducer's state-update function | A selector's projector only ever **reads and derives**, returning a value — it never produces a new *state* object the way a reducer does | Keep the distinction clear: reducers compute new state in response to actions; selectors compute derived *views* of existing state | Matches each piece of NgRx to its actual, distinct role in the unidirectional flow |

### ✅ Knowledge Check
1. Why does `selectBoardCount` (built from `selectAllBoards`) update correctly without any additional wiring when the underlying boards change?
2. Why is a named, exported selector preferable to reading the store's shape inline in a component?

### 🎥 Optional Video
**Angular with NgRx CRUD — Complete Tutorial for Beginners (2 hr 41 min)**
[Watch on YouTube](https://www.youtube.com/watch?v=97RYIl86g5o)
**Useful for:** A full, practical build covering Actions, Reducers, Effects, and Selectors together against a real CRUD application — the single best reinforcement for Sections 4–6 as a connected whole.

---

## 7. Wiring NgRx Into an Angular App

### Registering the root store

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { boardReducer } from './state/board.reducer';
import { BoardEffects } from './state/board.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideStore({ board: boardReducer }),
    provideEffects([BoardEffects])
  ]
};
```
- **`provideStore({ board: boardReducer })`** — registers the root store, application-wide, exactly parallel in spirit to Module 3's `provideHttpClient()` and Module 4's `provideRouter()`. The key (`board`) becomes the name this feature's state slice is stored under — the same string `createFeatureSelector<BoardState>('board')` (Section 6) refers back to.
- **`provideEffects([BoardEffects])`** — registers the Effects class so its `createEffect(...)`-defined streams actually start listening for dispatched actions.

### Feature-level registration (for a lazy-loaded route, tying back to Module 4)

```typescript
// settings/settings.routes.ts
import { Routes } from '@angular/router';
import { provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { settingsReducer } from './state/settings.reducer';
import { SettingsEffects } from './state/settings.effects';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    component: SettingsComponent,
    providers: [
      provideState({ name: 'settings', reducer: settingsReducer }),
      provideEffects([SettingsEffects])
    ]
  }
];
```
This directly combines Module 4's lazy-loading pattern (`loadChildren`) with NgRx's `provideState`/`provideEffects` — the Settings feature's state slice is only registered (and its Effects only start listening) once the Settings route is actually visited, matching the same "don't pay for what you don't use" principle Module 4's lazy loading established, now applied to state registration as well as code loading.

### 🔒 Coming Later — Outside This Module
NgRx DevTools configuration (`provideStoreDevtools()`) for visual, time-travel debugging of the action log; entity adapters (`@ngrx/entity`) for normalized collection state; meta-reducers; testing reducers/effects/selectors in isolation; NgRx Signal Store (a newer, Signals-based alternative API within the NgRx ecosystem itself).

### ✅ Knowledge Check
1. What does `provideStore({ board: boardReducer })` actually register, and what does the key `'board'` correspond to elsewhere in your code?
2. Why would a feature's state registration be placed inside a lazy-loaded route's own `providers`, rather than the application root?

---

## 8. Why NgRx Over a Simple Service?

This section exists specifically to answer this module's own discussion prompt directly and thoroughly — not just to gesture at "NgRx is more structured."

### What a `BehaviorSubject` service (Section 3) genuinely does well

For a single, moderately-sized feature's shared state, a `BehaviorSubject`-backed service is simple, requires far less code per change, and is easy for one developer (or a small team) to hold entirely in their head. Nothing in this module suggests it's a poor choice in general — Section 9 gives it a real, permanent place in the decision tree.

### The specific problems that emerge as an app scales, that a plain service does not solve

**Problem 1 — no enforced, single path for state changes.** Any method on any injected service can call `.next(...)`. As more features and developers touch the same shared state service, tracing *which* method, called from *where*, produced a specific incorrect final value becomes progressively harder — nothing stops a change from happening somewhere unexpected. NgRx's answer: **every** change must be an explicitly dispatched, named action, giving you a readable, centralized log of everything that happened, in order (this is exactly what NgRx DevTools' time-travel debugging, 🔒 outside this module's depth, is built on top of).

**Problem 2 — side effects and state updates aren't clearly separated.** A service method can freely mix "call the API" and "update the subject" in the same function, with no structural pressure to separate them. As logic grows, this tends to produce large, hard-to-test methods doing several things at once. NgRx's answer: reducers (pure, synchronous) and Effects (side-effecting, asynchronous) are **structurally forced apart** — you cannot accidentally put an HTTP call inside a reducer, because reducers have no way to perform one purely (Section 4/5's purity discussion).

**Problem 3 — many independent features sharing/depending on overlapping state.** A Kanban app might eventually need boards, tasks, the current user, and notification state, all cross-referencing each other (e.g., "how many tasks does the current user have across all boards"). Composed selectors (Section 6) are specifically designed for combining state from multiple feature slices into derived views, in a way that stays consistent and doesn't require each service to know about every other service's internals.

**Problem 4 — predictability and testability at scale.** Because reducers are pure functions and actions are plain objects, testing "given this state and this action, is the resulting state correct" (🔒 actually writing these tests is outside this module, but the architectural benefit is real right now) requires no mocking of services, HTTP, or component rendering at all — a meaningfully different, simpler testing story than a service with injected dependencies and internal side effects.

### A concrete scenario where NgRx's added structure is worth it

> The Kanban app grows to include: multiple boards, each with tasks; a notifications feature that needs to know "did a task I'm watching just get moved"; and a settings feature that needs to know "how many total boards does this user have," across a team of several developers working on different features simultaneously. Tracing an incorrect task count on the dashboard back to *exactly* which state change caused it — across board state, task state, and notification state, potentially touched by code several different people wrote — is precisely the situation NgRx's dispatched-action log and enforced separation of reducers/Effects are built to make tractable, where a handful of independent `BehaviorSubject` services with their own internal update logic would leave you manually auditing each one's code by hand.

### The trade-off, honestly stated

NgRx requires writing an action, (often) a reducer case, and sometimes an Effect for changes that a `BehaviorSubject` service could handle in a single method — genuinely more code for the same single feature, in isolation. The payoff is not "less code," it's **traceability and enforced structure that pays off specifically as complexity and team size grow** — which is exactly why this module introduces it only *after* Section 3's simpler alternative, and why Section 9 gives both a real, ongoing place rather than treating NgRx as a strict upgrade.

### ✅ Knowledge Check
1. In your own words, restate the four problems this section identifies that a plain `BehaviorSubject` service doesn't structurally solve.
2. Using your own extensions to the Kanban app (or a hypothetical one), describe a scenario where you'd specifically reach for NgRx over a simple service — this is directly the module's own discussion prompt.

---

## 9. Choosing Among Signals, Service-State, and NgRx

Three modules (7, and this one's Sections 3 and 4–8) have now each introduced a way to manage state. This section exists purely to place all three in one decision framework, since choosing between them is a genuine, recurring judgment call in real Angular development.

| | Signals (Module 7) | Service + `BehaviorSubject` (Section 3) | NgRx (Sections 4–8) |
|---|---|---|---|
| Best scope | Local component state, or simple, direct cross-component sharing | Moderate, single-feature shared state | Large, cross-feature, multi-developer shared state |
| Traceability of changes | Not a primary design goal | Depends entirely on service discipline | Built in — every change is a named, dispatched action |
| Boilerplate per change | Minimal | Low | Higher (action + reducer case + sometimes an Effect) |
| Async side-effect handling | `effect()`, or bridging via `toSignal()` from a service | Handled directly in service methods | Structurally separated into Effects |
| When it stops being enough | State needs to be shared broadly, traced, or coordinated across many features | The service's internal logic becomes large, tangled, or hard to trace across a growing team | Rarely "not enough" — the concern at this end of the spectrum is unnecessary overhead for genuinely simple cases, not missing capability |

### A practical decision rule

> **Start with the simplest tool that honestly fits: Signals for local/simple state, a `BehaviorSubject` service once state is genuinely shared across a feature. Reach for NgRx specifically when Section 8's four problems start showing up in practice** — not preemptively, and not because NgRx is presumed "more correct" by default.

### ✅ Knowledge Check
1. Given a brand-new, small feature's local UI state, which of the three would you start with, and why?
2. What's the actual trigger this module recommends for migrating from a service to NgRx — is it "the app got bigger," or something more specific?

---

## 10. Putting It Together: Kanban App (Part IV) NgRx Architecture

```
state/
├── board.actions.ts      loadBoards, loadBoardsSuccess, loadBoardsFailure,
│                         addBoard, removeBoard, updateBoardName
├── board.reducer.ts      boardReducer — pure functions computing BoardState from actions
├── board.effects.ts      BoardEffects — loadBoards$ (HttpClient via BoardService, Module 3)
└── board.selectors.ts    selectAllBoards, selectIsLoading, selectBoardCount,
                          selectBoardById(id) — composed, memoized derivations

app.config.ts
├── provideStore({ board: boardReducer })
└── provideEffects([BoardEffects])

BoardListComponent
 │  boards$ = this.store.select(selectAllBoards)      ← Section 6
 │  isLoading$ = this.store.select(selectIsLoading)    ← Section 6
 │  ngOnInit(): this.store.dispatch(loadBoards())       ← Section 4, triggers Section 5's Effect
 │  onAddBoard(board): this.store.dispatch(addBoard({ board }))

BoardDetailComponent (Module 4's routed component, revisited)
 │  board$ = this.store.select(selectBoardById(this.route.snapshot.paramMap.get('boardId')!))
 │  (Module 4's route-parameter reading combines directly with Section 6's parameterized selector)
```

**How every prior module shows up here:** `BoardService`'s `HttpClient` calls (Module 3) are unchanged — only *where* their results end up differs (dispatched as actions, rather than directly assigned to a component property). `BoardEffects`' `switchMap`/`catchError` usage is precisely Module 6's operator composition, applied inside NgRx's infrastructure instead of directly in a component. `BoardDetailComponent` still reads `:boardId` via `ActivatedRoute` exactly as Module 4 taught — only the *destination* of that id (a parameterized selector, rather than a direct service call) has changed.

---

## 11. Final Module Project: Kanban Task Management Web App (Part IV — State Management)

### Project Requirements

Extend the Kanban app with structured global state — first via a `BehaviorSubject`-backed service, then refactored into NgRx for boards and tasks.

### Functional Requirements

1. Identify at least one piece of state in your existing Kanban app that is genuinely **global** (shared across otherwise-unrelated components) versus at least one that is genuinely **local**, and briefly document which is which and why (Section 2).
2. Build a `BoardStateService` using `BehaviorSubject`, exposing a read-only `boards$` Observable and methods (`addBoard`, `removeBoard`, `updateBoardName`) that are the **only** way to change it (Section 3).
3. Refactor that same feature into full NgRx: actions, a reducer, at least one Effect performing a real `HttpClient` call (via your existing `BoardService`), and at least two selectors — one plain, one composed from another (Sections 4–6).
4. Register the store and Effects at the application root (Section 7).
5. Update every component that previously used the `BehaviorSubject` service to instead dispatch actions and read from selectors.
6. Write a short reflection (a comment block or short markdown note) directly answering this module's discussion prompt: describe a scenario, ideally from your own app, where NgRx's structure is genuinely worth its added boilerplate compared to the service you built in step 2.

### Suggested Structure

```
services/
└── board.service.ts           (Module 3 pattern; unchanged HttpClient calls)

state/  (new)
├── board.actions.ts
├── board.reducer.ts
├── board.effects.ts
└── board.selectors.ts

app.config.ts                  (provideStore, provideEffects)

components/
├── board-list                 (dispatches loadBoards/addBoard; reads via selectors)
└── board-detail               (reads via a parameterized selector + Module 4's ActivatedRoute)
```

### Required Angular Concepts (checklist)

- [ ] A clear, documented local-vs-global state distinction for at least two pieces of your app's state
- [ ] A working `BehaviorSubject`-backed service, with the raw subject kept private (`.asObservable()` exposed instead)
- [ ] At least three NgRx actions, following the `'[Source] Event description'` naming convention
- [ ] A pure reducer handling all three actions, with no direct state mutation anywhere
- [ ] At least one Effect performing a real async operation, correctly using `switchMap` and `catchError`
- [ ] At least two selectors, with at least one composed from another
- [ ] The store and Effects correctly registered via `provideStore`/`provideEffects`
- [ ] Every component previously reading/writing the service directly now dispatches actions and reads selectors instead

### Acceptance Criteria

- No component in the refactored feature calls a state-changing method directly on a service anymore — every change goes through `store.dispatch(...)`.
- Loading boards correctly shows a loading state (via `isLoading` in the reducer's state) before data arrives, and correctly handles a simulated failure (via `catchError` in the Effect).
- Selectors correctly return memoized, derived data — verified by confirming a composed selector (e.g., `selectBoardCount`) updates correctly whenever its underlying selector's data changes.
- The written reflection directly and specifically answers the module's discussion prompt, referencing your own app's structure rather than only repeating Section 8's abstract framing.

### Hints (if stuck)

- Build and fully verify the `BehaviorSubject` service version first, exactly as in step 2, before starting the NgRx refactor — having a known-working simpler version makes it much easier to verify the NgRx version behaves identically.
- If a reducer's state doesn't seem to update, check for direct mutation (`state.boards.push(...)`) first — this is the single most common reducer bug, and NgRx will often not error loudly when it happens, just silently fail to notify subscribers correctly.
- If an Effect never seems to fire, confirm it's registered via `provideEffects([...])` — a correctly-written Effect that was never registered simply never runs, with no error.

### Optional Stretch Challenges

- Add a second, related feature's state slice (e.g., tasks) with its own actions/reducer/selectors, and write one selector that **composes across both** feature slices (e.g., "task count for the currently selected board").
- Research (and document in a comment, without necessarily implementing) how `@ngrx/entity` — 🔒 outside this module's required depth — might simplify the `boards` array's update logic in your reducer, as a preview of a related, more advanced NgRx API.
- Add `provideStoreDevtools()` (🔒 configuration details outside this module's depth) and use the resulting DevTools panel to visually inspect the action log your refactored feature now produces, connecting this module's "traceability" argument (Section 8) to something you can actually see.

---

## 12. Quick Reference Sheet

### Local vs. Global State
```
Local:  belongs to one component / a direct parent-child relationship
Global: needed by many, often unrelated, parts of the application
```

### `BehaviorSubject`-Backed Service
```
private readonly stateSubject = new BehaviorSubject<T>(initialValue);
readonly state$ = this.stateSubject.asObservable();   // expose read-only

stateSubject.value            Synchronous current-value read
stateSubject.next(newValue)   Push a new value (ALWAYS a new reference for objects/arrays)
```

### NgRx — Actions
```
export const addBoard = createAction(
  '[Board List] Add Board',       // '[Source] Event description' convention
  props<{ board: Board }>()        // payload shape (optional)
);
```

### NgRx — Reducers
```
export const boardReducer = createReducer(
  initialState,
  on(addBoard, (state, { board }) => ({ ...state, boards: [...state.boards, board] }))
  // MUST be pure: no HTTP, no logging-as-logic, no Date.now()/Math.random(), no mutation
);
```

### NgRx — Store (in a component)
```
private store = inject(Store);
this.store.dispatch(addBoard({ board }));      // the ONLY way to change state
this.store.select(selectAllBoards);             // returns an Observable
```

### NgRx — Effects
```
loadBoards$ = createEffect(() =>
  this.actions$.pipe(
    ofType(loadBoards),
    switchMap(() => this.boardService.getBoards().pipe(
      map(boards => loadBoardsSuccess({ boards })),
      catchError(error => of(loadBoardsFailure({ error: error.message })))
    ))
  )
);
// { dispatch: false } — for Effects with no follow-up action (e.g., logging, navigation)
```

### NgRx — Selectors
```
export const selectBoardState = createFeatureSelector<BoardState>('board');
export const selectAllBoards = createSelector(selectBoardState, state => state.boards);
export const selectBoardCount = createSelector(selectAllBoards, boards => boards.length);
export const selectBoardById = (id: string) =>
  createSelector(selectAllBoards, boards => boards.find(b => b.id === id));
```

### Wiring
```
// app.config.ts
provideStore({ board: boardReducer })
provideEffects([BoardEffects])

// lazy-loaded feature route
providers: [ provideState({ name: 'settings', reducer: settingsReducer }), provideEffects([SettingsEffects]) ]
```

### Important Terminology

| Term | Definition |
|---|---|
| **Local state** | Data belonging to one component or a direct parent-child relationship. |
| **Global state** | Data shared across many, often unrelated, parts of the application. |
| **`BehaviorSubject`** | An Observable that holds a current value, readable synchronously, replayed to new subscribers. |
| **Redux pattern** | All state in one store, changed only via dispatched actions handled by pure reducers. |
| **Unidirectional data flow** | Component dispatches an action → reducer computes new state → store notifies subscribers → component reads via a selector. |
| **Action** | A plain, descriptive object naming what happened, optionally carrying a payload. |
| **Reducer** | A pure function computing the next state from the current state and an action. |
| **Store** | The single object holding the application's entire managed state. |
| **NgRx Effect** | A class reacting to dispatched actions with side effects (e.g., HTTP calls), typically dispatching a follow-up action. |
| **Selector** | A memoized function deriving a specific value from the store's state. |

### 🔒 Coming Later — Outside This Module
NgRx DevTools (`provideStoreDevtools()`) and time-travel debugging · `@ngrx/entity` · Meta-reducers · NgRx Signal Store · Testing reducers/effects/selectors in isolation · NgRx Router Store

---

## 13. Source & Resource Mapping

| Module Topic | Source Resource | Knowledge Extracted |
|---|---|---|
| Local vs. global state, `BehaviorSubject` services | Angular.io — "State management" | Section 2's framing and Section 3's `BehaviorSubject` pattern |
| When global state solutions are actually warranted | Nx Blog — "Angular State Management in 2025" | Section 2's decision-rule context |
| NgRx core principles (Store, Actions, Reducers) | ngrx.io — "Introduction to NgRx" | Section 4's core Redux/NgRx framing |
| Redux pattern and data flow in NgRx | Angular University — "Angular NgRx Store and Effects: The Complete Crash Course" | Section 4's unidirectional-flow explanation |
| NgRx overview, the "why" (video) | YouTube — "Angular NgRX: Course Overview" (5 min) | Section 4's opening framing and Section 8's motivation |
| Full practical NgRx CRUD build (video) | YouTube — "Angular with NgRx CRUD – Complete Tutorial for Beginners" (2 hr 41 min) | Sections 4–6's combined, practical reinforcement |

**Quick links for deeper reading (optional, not required to complete this module):**
- [State management — Angular.io](https://angular.io/guide/state-management)
- [Angular State Management in 2025 — Nx Blog](https://nx.dev/blog/angular-state-management-2025)
- [Introduction to NgRx — ngrx.io](https://ngrx.io/docs)
- [Angular NgRx Store and Effects: The Complete Crash Course — Angular University](https://blog.angular-university.io/angular-ngrx-store-and-effects-crash-course/)
- [Angular NgRX: Course Overview — YouTube](https://www.youtube.com/watch?v=QOrzi5jjc7E)
- [Angular with NgRx CRUD – Complete Tutorial for Beginners — YouTube](https://www.youtube.com/watch?v=97RYIl86g5o)

---

### Discussion Prompt (from the original module)

> NgRx introduces a lot of 'boilerplate' (actions, reducers, effects) compared to just using an RxJS service. Based on the resources, describe a scenario where the complexity of NgRx is justified over a simple service. What specific problems does NgRx solve that a simple service does not?

Section 8 answers this directly and in full: untraceable state changes from any method on any service, side effects and state updates that aren't structurally separated, difficulty composing state across many independent features, and a harder testing story as a service's internal logic grows. Frame your own answer around a concrete scenario from your own Kanban app extensions, in your own words, rather than only restating Section 8's framing.
