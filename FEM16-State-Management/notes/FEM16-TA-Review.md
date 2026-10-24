# FEM16 TA Review Prep — Kanban Task Management Web App (State Management)

Project location: `FEM16-State-Management/kanban-task-management-app/`
Starting point: `FEM13-Angular-Forms/kanban-task-management-app/` (copied in, then extended)

---

## 1. Lab Overview

### What FEM16 adds

FEM12 (routing) and FEM13 (forms) both used `BoardService` as a plain, synchronous, in-memory data holder: every
component that needed board/task data injected it and called its methods directly. That was appropriate for its
scope, but it has exactly the two problems Module 8 §8 identifies: nothing stops *any* component from mutating
shared state from anywhere, and there's no way to trace *what happened, in what order* when something looks wrong.
FEM16's job is to fix that, in two explicit stages, per the lab's own task spec:

1. **Stage 1 — a `BehaviorSubject`-backed service** (`state/board-state.service.ts`), demonstrating the simpler
   service-based pattern Module 8 §3 teaches.
2. **Stage 2 — a full NgRx refactor** (`state/board/`: actions, a reducer, an Effect, selectors), which is what the
   live app actually runs on. Every component that used to call `BoardService`/`BoardStateService` directly now
   dispatches actions and reads selectors instead.

Stage 1's service is **kept in the codebase, deliberately unused by any component** — the lab explicitly asks for
both stages to exist so their trade-offs can be compared (see §5, the required reflection); deleting it once Stage
2 was working would erase exactly the artifact that comparison depends on.

### Why state management is needed here at all

A Kanban app's boards/tasks are the textbook definition of **global state** (Module 8 §2): the board list page, the
board detail page, the add-task form, and the edit-task form all need to read and write the *same* underlying
data, and none of them has a direct parent/child relationship with the others — they only ever meet at the
`boards/:boardId` route. Before this module, `BoardService` played this role implicitly; this module makes the
"who can change this, and how" question explicit and enforced.

---

## 2. Local vs. Global State in This App (Task 1)

| State | Local or global? | Where it lives | Why |
|---|---|---|---|
| `boards` (each board's `tasks` nested inside it) | **Global** | NgRx store, `state.board.boards` | Read by `BoardListComponent`, `BoardDetailComponent`, `AddTaskComponent`, `EditTaskComponent` — four otherwise-unrelated routed components, none a parent/child of another. |
| `isLoading` / `error` (the initial board fetch's status) | **Global** | NgRx store, `state.board.isLoading`/`.error` | Both the list and detail views need to show a loading state for the *same* underlying fetch, dispatched once at the app root. |
| A task form's in-progress field values (`AddTaskComponent`/`EditTaskComponent`'s `FormGroup`) | **Local** | The routed component's own `form` property | Meaningless to any other part of the app before it's submitted; exactly Module 8 §2's "a Reactive Form's current field values" example. |
| The board list's `?sort=name\|recent` choice | **Local** (URL-scoped) | `ActivatedRoute.queryParamMap`, read only by `BoardListComponent` | Presentation-only — how *this one page* displays already-global data, not data other components need. |
| `AuthService.isLoggedIn()` | **Global, but intentionally not migrated** | `AuthService` (FEM12), unchanged | Technically shared state, and a real app might give it its own NgRx feature — but auth isn't part of this lab's required feature slice (boards/tasks), and migrating it wouldn't demonstrate anything new about *this* module's concepts. Left as-is on purpose; see §6. |

---

## 3. Stage 1 — Service-Based State (`state/board-state.service.ts`)

```typescript
private readonly boardsSubject = new BehaviorSubject<Board[]>([]);
readonly boards$: Observable<Board[]> = this.boardsSubject.asObservable();

addBoard(board: Board): void {
  this.boardsSubject.next([...this.boardsSubject.value, board]);
}
```

- **`BehaviorSubject<Board[]>([])`** — holds a current value, immediately replayed to any new subscriber, unlike a
  plain `Subject`.
- **`.asObservable()`** exposed, the raw subject kept `private` — only this service's own methods (`addBoard`,
  `removeBoard`, `updateBoardName`) can ever push a new value; nothing else can call `.next()` directly.
- Every method builds a **new** array before calling `.next(...)` — never mutates `.value` in place — the same
  immutability rule as Module 3/Module 7, now enforced for a `BehaviorSubject`.

This file is real, correct, compiling code — a TA can open it directly — but **nothing in `app.config.ts` or any
component injects it**. It is Stage 1 of the lab, superseded by Stage 2 below.

---

## 4. Stage 2 — NgRx (`state/board/`)

### 4.1 File layout

```
state/
├── board-state.service.ts        Stage 1 (BehaviorSubject) — kept, unused by the app, see §3
└── board/
    ├── board.actions.ts          loadBoards, loadBoardsSuccess/Failure, addBoard, addTask, updateTask
    ├── board.reducer.ts          BoardState { boards, isLoading, error } + boardReducer
    ├── board.effects.ts          BoardEffects.loadBoards$ — the one async operation in this feature
    └── board.selectors.ts        selectAllBoards, selectIsLoading, selectBoardError,
                                   selectBoardCount (composed), selectBoardById(id) (parameterized)
```

### 4.2 Actions (Task 4)

```typescript
export const loadBoards = createAction('[Board List] Load Boards');
export const loadBoardsSuccess = createAction('[Board API] Load Boards Success', props<{ boards: Board[] }>());
export const loadBoardsFailure = createAction('[Board API] Load Boards Failure', props<{ error: string }>());
export const addBoard = createAction('[Board List] Add Board', props<{ board: Board }>());
export const addTask = createAction('[Task Form] Add Task', props<{ boardId: number; task: Task }>());
export const updateTask = createAction('[Task Form] Update Task', props<{ boardId: number; task: Task }>());
```

All six follow the `'[Source] Event description'` convention. `addBoard`/`addTask`/`updateTask` all carry a
**fully-formed** entity (a whole `Board`/`Task`), not raw field values — see §4.3 for why.

### 4.3 Reducer (Task 4) — and why id/timestamp generation isn't inside it

```typescript
on(addBoard, (state, { board }) => ({ ...state, boards: [...state.boards, board] })),
on(addTask, (state, { boardId, task }) => ({
  ...state,
  boards: state.boards.map((board) => (board.id === boardId ? { ...board, tasks: [...board.tasks, task] } : board)),
})),
```

Every case returns a **brand-new** `boards` array (and a brand-new board/task object for whichever one changed) —
no in-place mutation anywhere, checked by hand across every case. A reducer must also be a **pure function**: given
the same `(state, action)`, always the same result, no `Date.now()`/`Math.random()`/id-counter side effects. The
old `BoardService.addBoard()`/`addTask()` generated `id`/`createdAt` internally — moving that logic into the
reducer would have violated purity, so instead the **dispatching component** (`BoardListComponent.createBoard()`,
`AddTaskComponent.save()`) computes the next id from the boards/tasks it already has locally and builds the whole
entity *before* dispatching. The reducer's job stays a pure, mechanical append/merge.

### 4.4 Effect (Tasks 3 & 6) — the one genuinely asynchronous case

```typescript
loadBoards$ = createEffect(() =>
  this.actions$.pipe(
    ofType(loadBoards),
    switchMap(() =>
      this.boardService.getBoards().pipe(
        map((boards) => loadBoardsSuccess({ boards })),
        catchError((error) => of(loadBoardsFailure({ error: error.message ?? 'Failed to load boards.' }))),
      ),
    ),
  ),
);
```

`BoardService.getBoards()` now returns `Observable<Board[]>` (`of(this.boards).pipe(delay(300))`) instead of a
plain array — a stand-in for a real `HttpClient` call, since this course doesn't reach `HttpClient`/a real backend
until FEM17. This is the **only** Effect in the app: `addBoard`/`addTask`/`updateTask` are local and instant (no
backend to round-trip to), so handling them as plain reducer cases is correct — wrapping an already-synchronous
value in `switchMap` would add indirection with no benefit. `BoardService` itself shrank down to exactly this one
method; every mutating method it used to have moved into the reducer (§4.3) or the duplicate-title validator (§6).

### 4.5 Selectors (Task 5)

```typescript
export const selectBoardState = createFeatureSelector<BoardState>('board');
export const selectAllBoards = createSelector(selectBoardState, (state) => state.boards);
export const selectIsLoading = createSelector(selectBoardState, (state) => state.isLoading);
export const selectBoardCount = createSelector(selectAllBoards, (boards) => boards.length);          // composed
export const selectBoardById = (boardId: number) =>
  createSelector(selectAllBoards, (boards) => boards.find((board) => board.id === boardId));          // parameterized
```

`selectBoardCount` is composed from `selectAllBoards` and recalculates only when the boards array itself changes —
the same memoization guarantee as a chained `computed()` signal. `selectBoardById` is a selector *factory*: calling
it with an id returns a fresh, memoized selector for that specific board, used by `BoardDetailComponent`,
`AddTaskComponent`, and `EditTaskComponent`.

### 4.6 Wiring (`app.config.ts`) and DevTools (Task 7)

```typescript
provideStore({ board: boardReducer }),
provideEffects([BoardEffects]),
provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode(), connectInZone: true }),
```

The `'board'` key is exactly the string `createFeatureSelector<BoardState>('board')` reads back out. NgRx DevTools
is wired at the root (installable via the Redux DevTools browser extension) so every dispatched action and the
resulting state diff is inspectable live — deep DevTools usage (time-travel debugging) is flagged "outside this
module's depth" by Module 8's own notes, but the task spec explicitly requires installing/configuring it, so it's
wired up at the level the module actually teaches (`provideStoreDevtools(...)`, nothing more).

### 4.7 Where `loadBoards()` is dispatched

`AppComponent.ngOnInit()` dispatches it once, at the application root — **not** `BoardListComponent`. A user can
deep-link directly to `/boards/7` or `/boards/7/edit/2`, skipping the boards list page entirely; the one component
guaranteed to run first on every route is the root component, so that's where a genuinely global piece of state's
initial load belongs. `BoardDetailComponent`/`BoardListComponent`/`AddTaskComponent`/`EditTaskComponent` all
correctly handle the resulting brief `isLoading: true` window (see §4.8) rather than assuming data is already
there.

### 4.8 Handling the now-asynchronous initial load

Every component that reads board data waits for the first load to resolve before treating "board not found" as
real:

```typescript
this.store.select(selectIsLoading).pipe(
  filter((isLoading) => !isLoading),
  take(1),
  switchMap(() => this.store.select(selectBoardById(this.boardId)).pipe(take(1))),
)
```

This is a genuine behavioral difference from FEM12/13, where `BoardService` was synchronous and data was always
already there. `BoardDetailComponent` shows "Loading boards…" while `isLoading` is `true`, and only redirects to
`/not-found` once loading has finished and the board still isn't found — otherwise, every deep link would
incorrectly 404 during the ~300ms simulated fetch.

---

## 5. Required Reflection — Service vs. NgRx, In This App Specifically

*(Directly answers this module's discussion prompt: "describe a scenario where the complexity of NgRx is justified
over a simple service.")*

This app is genuinely small enough that Stage 1's `BoardStateService` would have worked fine forever, in isolation
— that's an honest admission, not a dodge. The concrete reason Stage 2 is worth its extra ceremony **here** is
`AddTaskComponent`/`EditTaskComponent`'s duplicate-title validator (§6): it needs to know the *current* set of task
titles on a board at the exact moment a form is built, and that data is also being changed, from a completely
different route, by `BoardListComponent`'s create-board flow and by the *other* task form. With a plain service,
nothing would visibly stop a future change from calling a mutating method directly from a template event, a
guard, or a hastily-added `console.log`-and-fix in the wrong place — the only enforcement is developer discipline.
With NgRx, `addTask`/`updateTask` are the *only* two actions whose reducer cases touch `board.tasks`, and every
dispatch site is a single `grep -r "addTask\|updateTask" src/app` away from being found. As this app's board/task
model has already grown once per module (routing → forms → now state), the specific, concrete payoff of switching
here is: the next feature that needs to touch task data (say, a future bulk "mark all done" action) has one
obvious, traceable place to add a case, rather than one more component quietly reaching into a shared array.

---

## 6. What Changed From FEM13

| File | Change |
|---|---|
| `core/services/board-service/board.service.ts` | Reduced to a single method, `getBoards(): Observable<Board[]>` (simulated latency via `delay(300)`). Every mutating method (`addBoard`, `addTask`, `updateTask`, `isTitleTaken`, `getAdjacentBoardId`) removed — that logic now lives in the reducer (§4.3) or the calling component. |
| `core/validators/task-validators.ts` | `duplicateTitleValidator` changed from `(boardService, boardId, excludeTaskId)` to a pure `(existingTitles: string[])` — see below. |
| `features/board/task-form/task-form.factory.ts` | `applyDuplicateTitleValidator` simplified to match — takes `existingTitles: string[]` instead of injecting `BoardService`. |
| `state/board-state.service.ts` | **New.** Stage 1, see §3. |
| `state/board/*.ts` | **New.** Stage 2, see §4. |
| `app.config.ts` | Added `provideStore`, `provideEffects`, `provideStoreDevtools`. |
| `app.component.ts` | Dispatches `loadBoards()` once in `ngOnInit` (§4.7). |
| `pages/board-list/board-list.component.ts` | Reads `selectAllBoards`/`selectIsLoading` instead of calling `BoardService` directly; `createBoard()` builds the full `Board` and dispatches `addBoard`. |
| `features/board/board-detail/*` | Reads board/adjacency from `selectAllBoards` combined with route params; shows a loading state (§4.8). |
| `features/board/add-task/*`, `features/board/edit-task/*` | Read the target board via `selectBoardById`/`selectIsLoading`; dispatch `addTask`/`updateTask` instead of calling `BoardService`. |

### Why the duplicate-title validator's signature changed

FEM13's validator injected `BoardService` and called `boardService.isTitleTaken(boardId, title, excludeTaskId)` —
a live, synchronous read against the service's own array. Now that the NgRx store is the single source of truth,
that array no longer exists on `BoardService` at all (§4.4), and a synchronous `ValidatorFn` has no clean way to
read a live Observable mid-keystroke. So the validator became a pure function taking a plain `string[]` of titles
to check against; the smart component (`AddTaskComponent`/`EditTaskComponent`) reads that list once, from the
store, when the form is built — the same timing FEM13's version used, just sourced from a selector snapshot
instead of a service call.

---

## 7. Design Alignment

A dedicated visual-fidelity pass (after this module's state-management work was already complete and verified)
brought this app's UI, and FEM12/13's, up to a much closer match against every image in `task/sample-design-imgs/`
— see FEM12's TA review §5.1 for the full, pixel-sampled reasoning (exact colors read via Python/Pillow, why the
column-header dot was removed on evidence, etc.), which applies here identically: the sidebar, the dark/light
theme toggle, the mobile board-switcher dropdown, and true modal-style Add New Task/Edit Task/Add New Board forms
are all implemented, matching the reference screens directly rather than approximating them.

**Why this was safe to do without touching this module's actual scope:** every one of those changes is CSS/template
markup around components whose *behavior* (dispatching actions, reading selectors, the Effect, the guards) is
untouched. `AppComponent`'s sidebar reads boards via `store.select(selectAllBoards)` — the same selector
`BoardListComponent` already used — so adding the sidebar didn't introduce a new data path, just a second place
that reads the existing one. No action, reducer case, selector, or Effect changed as part of this pass.

**Still deliberately not implemented**, exactly as before: per-board custom columns (the "Add new board" modal's
"Board Columns" list) — a data-model change, not a visual one, and outside this module's task/checklist. The
existing fixed todo/doing/done model is what `BoardState`/the reducer/selectors are built around.

---

## 8. Connection to Previous Modules

**FEM09–FEM11.** Unaffected: standalone components, property/event binding, `*ngIf`/`*ngFor`, and
`@Injectable({ providedIn: 'root' })` services (now just `BoardService`, `AuthService`) are all exactly as before.

**FEM12 — Routing & Navigation.** Every routed component still reads `:boardId`/`:taskId` reactively via
`ActivatedRoute.paramMap`, exactly as FEM12 established — only *what* they do with that id changed (select from the
store instead of calling a service method). Guards (`authGuard`, `unsavedChangesGuard`) are completely unchanged;
neither is state-management-adjacent enough to be part of this module's scope.

**FEM13 — Angular Forms.** `TaskFormComponent`'s `@Input() form`/`@Output() formSubmit`/`formCancel` contract is
untouched. The duplicate-title/due-date validators still run exactly as before; only how the duplicate-title check
gets its data changed (§6).

**FEM16 — State Management.** Everything in §3–5 above: local vs. global state identified, a `BehaviorSubject`
service built and deliberately superseded, a full NgRx refactor (actions/reducer/Effect/selectors), root-level
store/Effects/DevTools registration, and every previously service-coupled component migrated to
dispatch-and-select.

---

## 9. Possible TA Questions

**Foundations**

- *What's the difference between local and global state in this app?* See §2's table — the concrete test used
  throughout is "does more than one, otherwise-unrelated routed component need to read/write this."
- *Why didn't you migrate `AuthService` to NgRx too?* It's genuinely shared state, but migrating it wouldn't
  exercise any concept this module didn't already cover with boards/tasks, and it's outside this lab's required
  feature slice — see §2's last row.

**Stage 1 vs. Stage 2**

- *Why does `BoardStateService` still exist if nothing uses it?* The lab explicitly asks for both stages to be
  demonstrable, and the required reflection (§5) depends on having a real, working Stage 1 to compare Stage 2
  against — not a description of one.
- *What's the concrete trade-off, in this specific app?* See §5 — traceability of every write to `boards`/`tasks`,
  concretely motivated by the duplicate-title validator's cross-component dependency on the same data.

**NgRx mechanics**

- *Walk me through what happens when "Create task" is clicked.* `AddTaskComponent.save()` builds a full `Task`
  (computing the next id from the board snapshot already held) → dispatches `addTask({ boardId, task })` → the
  reducer's `on(addTask, ...)` case returns a new `boards` array with that board's `tasks` extended → every
  subscriber of `selectBoardById(boardId)`/`selectAllBoards` re-emits → `BoardDetailComponent`'s Kanban columns
  re-render with the new task.
- *Why is `loadBoards` an Effect but `addTask`/`addBoard` aren't?* Only `loadBoards` does something genuinely
  asynchronous (`BoardService.getBoards()`, standing in for a real API call); `addTask`/`addBoard` are local,
  instant, in-memory changes, so a plain reducer case is the correct, simpler tool — see §4.4.
- *Why do `addBoard`/`addTask`/`updateTask` carry a whole entity in their payload, instead of raw field values?* A
  reducer must be pure — no `Date.now()`/id-counter side effects — so the caller assigns the id/timestamp *before*
  dispatching; see §4.3.
- *What would happen if you dispatched `loadBoards()` from `BoardListComponent` instead of `AppComponent`?* A user
  deep-linking straight to `/boards/3` would never trigger it, and `BoardDetailComponent` would sit on
  `isLoading: false, boards: []` forever, immediately (and incorrectly) redirecting to `/not-found` — see §4.7.
- *Why does the duplicate-title validator take a plain array instead of injecting the Store?* A synchronous
  `ValidatorFn` has no clean way to read a live Observable mid-keystroke; the smart component reads a one-time
  snapshot from the store instead and hands the validator plain data — see §6.

**Selectors**

- *Why is `selectBoardCount` "composed"?* It's built from `selectAllBoards` rather than reading `state.board.boards`
  directly — it recalculates only when `selectAllBoards`'s result actually changes, and stays correct automatically
  if `BoardState`'s shape ever changes elsewhere.
- *What is `selectBoardById` doing, structurally, that the other selectors aren't?* It's a selector **factory** — a
  function that takes a `boardId` and *returns* a selector, rather than being a selector itself.

**DevTools**

- *What does `provideStoreDevtools` actually do here?* Connects the store to the Redux DevTools browser extension
  so every dispatched action and the resulting state diff can be inspected live; `logOnly: !isDevMode()` keeps it
  read-only outside a dev build.

---

## 10. Things I Must Be Able to Explain (checklist)

- [ ] Local vs. global state in this specific app (§2), with the concrete test used to decide.
- [ ] Stage 1: `BoardStateService`'s `BehaviorSubject` pattern, why `.asObservable()` is exposed instead of the raw
      subject, and why it's still in the codebase despite being unused (§3).
- [ ] Stage 2: every action (§4.2), why the reducer never generates ids/timestamps itself (§4.3), why only
      `loadBoards` is an Effect (§4.4), every selector and which one is composed vs. parameterized (§4.5).
- [ ] The full unidirectional flow for at least one action, end to end, from a template event to a re-rendered
      template (worked in §9's "Create task" walkthrough).
- [ ] Why `loadBoards()` is dispatched from `AppComponent`, not `BoardListComponent` (§4.7), and how every
      board-reading component correctly waits out the resulting async load instead of assuming data is instant
      (§4.8).
- [ ] Why the duplicate-title validator's signature changed from FEM13, specifically (§6).
- [ ] The required reflection (§5): a concrete, app-specific reason NgRx's structure earns its extra code here,
      not just a restatement of the module's general argument.
- [ ] How the sidebar/dark-mode toggle/modal forms (§7) were added without touching any action, reducer, selector,
      or Effect, and the one design detail (per-board custom columns) deliberately left as a future concern.

---

## 11. Verification Performed

- `npm install @ngrx/store@21.1.1 @ngrx/effects@21.1.1 @ngrx/store-devtools@21.1.1` — versions pinned to match this
  project's Angular 21 (the latest `@ngrx/*` major requires Angular 22, not yet what this app is on).
- `ng build` succeeds with no errors; `board-routes` remains a separate lazy chunk (FEM12's lazy loading, untouched).
- A headless-Chrome/CDP driven `ng serve` session, zero console errors throughout:
  - Boards list loads via the NgRx Effect after the simulated 300ms delay; a "Loading boards…" state is briefly
    visible first.
  - Board detail loads correctly (both via a direct deep link and via next/previous-board navigation), including
    the loading-state handling in §4.8.
  - **Duplicate-title validator**, now store-driven: opening "Add task" and typing an existing task's exact title
    ("Pick a color palette") shows "A task with this title already exists on this board." and keeps "Create task"
    disabled; correcting it to a unique title clears the error and enables submission.
  - Submitting a new task dispatches `addTask`, and the new task appears immediately in the correct Kanban column
    with the count updated (verified: "To do (1)" → "To do (2)"), plus the "Task created." banner.
  - Editing an existing task loads its current values via `selectBoardById`, confirming the store (not
    `BoardService`) is now the read path.
  - Creating a new board dispatches `addBoard`, navigates to it via `Router.navigate`, and the new board correctly
    shows up as the last board in "Previous/Next board" adjacency, computed from the live store data.
  - `authGuard`/`unsavedChangesGuard` behavior unchanged from FEM13 (neither reads/writes board state).

---

## 12. Final Curriculum Audit

**✅ Allowed (FEM09–FEM16), and used throughout:** everything FEM12/13's own audits already covered, **plus**,
newly this module: `BehaviorSubject`/`.asObservable()` (Stage 1), `@ngrx/store` (`createAction`, `props`,
`createReducer`, `on`, `createFeatureSelector`, `createSelector`, `provideStore`, `Store.dispatch`/`.select`),
`@ngrx/effects` (`createEffect`, `Actions`, `ofType`, `provideEffects`), `@ngrx/store-devtools`
(`provideStoreDevtools`). RxJS operators used inside the Effect and components (`switchMap`, `catchError`, `map`,
`filter`, `take`, `combineLatest`) are all already-in-scope Module 6 material, applied here to NgRx/store-adjacent
streams instead of `HttpClient` responses.

**❌ Not introduced:** `@ngrx/entity` (`EntityAdapter`) — considered per Task 8, but the module's own notes flag it
"outside this module's required depth," and the lab's stretch challenge frames it as "document, without
necessarily implementing" (see §7's reasoning for why it wasn't needed at this app's current scale either); NgRx
Router Store; meta-reducers; NgRx Signal Store; reducer/effect/selector unit tests (flagged "outside this module");
any actual `HttpClient`/real backend (still FEM17); per-board custom columns (§7).

---

## Deliverables Status

| Deliverable | Status |
|---|---|
| Local vs. global state identified and documented | ✅ Done — §2 |
| `BoardStateService` (`BehaviorSubject`), read-only `boards$`, `addBoard`/`removeBoard`/`updateBoardName` | ✅ Done — §3 |
| Full NgRx refactor: actions, reducer, ≥1 Effect, ≥2 selectors (1 composed) | ✅ Done — §4 (5 selectors, 1 composed + 1 parameterized) |
| Store/Effects registered at the application root | ✅ Done — §4.6 |
| Every component migrated from the service to dispatch/select | ✅ Done — §4, §6 |
| NgRx DevTools installed and configured | ✅ Done — §4.6 |
| Written reflection on service vs. NgRx trade-offs, specific to this app | ✅ Done — §5 |
| UI faithfully reproduces the Kanban design reference images | ✅ Sidebar, dark/light theme, and modal-style forms implemented and pixel-checked, matching FEM12/13; no store/action/reducer/selector touched to do it (§7) |
| Public GitHub repo with clean commit history | ⚠️ Not done by this session — requires pushing to a remote, which needs explicit authorization |
| Deployed live app URL (Netlify/Vercel) | ⚠️ Not done by this session — requires an external hosting account/deployment step; `ng build` output verified clean and deploy-ready |
