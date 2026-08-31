# FEM12 TA Review Prep — Kanban Task Management Web App (Routing-Focused Build)

Project location: `FEM12-Routing-and-Navigation/kanban-task-management-app/`

---

## 1. Project Overview

The app is a simplified **Kanban task board manager**: a list of boards, a Kanban-style detail view per board (tasks
grouped into To do / In progress / Done columns), an editable task-detail view nested inside that board, and a
settings area. Every one of those views lives at its own URL and is reachable by typing the URL directly,
refreshing the page, or clicking a link — there is no "one big component with `*ngIf` toggles" anywhere in the app.

**Why routing is central here, not incidental:** a Kanban tool is naturally multi-page — "which board am I looking
at" and "which task am I editing" are exactly the kind of state that *should* live in the URL, not in a component
property, because:

- boards and tasks need to be **bookmarkable/shareable** (`/boards/2`),
- the **browser back/forward buttons** should work between them,
- **refreshing the page** on a task should not lose your place,
- and different areas (Settings vs. Boards) have different **access requirements**, which routing enforces at the
  point of navigation via guards, before any component is even created.

The lab exists specifically to practice: route configuration, all three common navigation mechanisms
(`routerLink`, `routerLinkActive`, the `Router` service), reading route/query parameters reactively, nested child
routes, lazy loading, and route guards (`CanActivate` and `CanDeactivate`).

---

## 2. Project Structure

```
src/app/
├── app.component.ts/html/css      Root layout: persistent header/nav + <router-outlet>
├── app.routes.ts                  Top-level route configuration
├── app.config.ts                  provideRouter() registration
│
├── core/
│   ├── models/
│   │   ├── board.model.ts         Board interface
│   │   └── task.model.ts          Task interface + TaskStatus union type
│   ├── services/
│   │   ├── board.service.ts       In-memory board/task data + CRUD-ish methods
│   │   └── auth.service.ts        Hard-coded isLoggedIn()/login()/logout()
│   └── guards/
│       ├── auth.guard.ts          authGuard — CanActivate
│       └── unsaved-changes.guard.ts   unsavedChangesGuard — CanDeactivate
│
├── pages/                         Top-level routed pages (not lazy-loaded)
│   ├── board-list/                Route ''/'boards' — all boards, sort, create
│   ├── login/                     Route 'login' — guard redirect target
│   ├── settings/                  Route 'settings' — guarded
│   └── not-found/                 Route '**' — wildcard 404
│
└── features/board/                Lazily-loaded "board" feature area
    ├── board.routes.ts            BOARD_ROUTES — the lazy-loaded route table
    ├── board-detail/               '' → Kanban-column board layout, next/prev links,
    │                                own nested <router-outlet>
    └── task-detail/                'tasks/:taskId' → editable task, CanDeactivate
```

**Responsibilities, briefly:**

- **`BoardService`** (FEM11 service) — the single source of truth for board and task data; every component that
  needs board/task data injects this instead of holding its own copy.
- **`AuthService`** (FEM11 service) — a deliberately simple stand-in for real authentication (`isLoggedIn()` is
  just a boolean flag). Its only job in this lab is to give `authGuard` something real to check.
- **`authGuard`** — decides *whether a route may be entered*.
- **`unsavedChangesGuard`** — decides *whether a route may be left*.
- **`BoardListComponent`** — the app's home page; demonstrates query-parameter-driven sorting, programmatic
  navigation after creating a board, and a manually-bound (not `ngModel`) input panel.
- **`BoardDetailComponent`** — the most routing-dense component in the app: reads `:boardId` reactively, owns a
  *second*, nested `<router-outlet>`, groups its board's tasks into three Kanban columns, and builds
  "next/previous board" links from service data.
- **`TaskDetailComponent`** — reads two path parameters at once (`:boardId` inherited + its own `:taskId`), and
  implements `HasUnsavedChanges` so `unsavedChangesGuard` can protect it — again without `ngModel`.

---

## 3. Routing Architecture

### 3.1 Full route table

`app.routes.ts` (top level):

| Path | Renders | Guards | Notes |
|---|---|---|---|
| `''` | — | — | `redirectTo: 'boards'` (bonus task: sensible default route) |
| `'boards'` | `BoardListComponent` | — | public — anyone can browse the list |
| `'boards/:boardId'` | *(lazy)* `BOARD_ROUTES` | `authGuard` | see below |
| `'settings'` | `SettingsComponent` | `authGuard` | protected |
| `'login'` | `LoginComponent` | — | the guard's redirect target |
| `'**'` | `NotFoundComponent` | — | wildcard, **must stay last** |

`features/board/board.routes.ts` (lazily loaded, mounted under `boards/:boardId`):

| Path (relative) | Renders | Guards | Notes |
|---|---|---|---|
| `''` | `BoardDetailComponent` | — | matches `boards/:boardId` itself |
| `'tasks/:taskId'` | `TaskDetailComponent` | `unsavedChangesGuard` (CanDeactivate) | nested child route |

Route order matters and is respected here: `'boards'` (literal) is registered before `'boards/:boardId'`
(parameterized) would ever be ambiguous with it, and the wildcard `'**'` is the last entry in the array, so every
more specific route above it gets first chance to match.

### 3.2 `<router-outlet>` — two of them, on purpose

`AppComponent`'s template has **one** root `<router-outlet>`, below a `<header>` that stays mounted across every
navigation. `BoardDetailComponent`'s own template has a **second**, nested `<router-outlet>` — what lets
`tasks/:taskId` render *inside* the board's Kanban layout (header, columns) instead of replacing it. Visiting
`/boards/1` alone leaves that inner outlet empty; visiting `/boards/1/tasks/1` renders `TaskDetailComponent` into
it while the board header and columns above stay exactly where they were.

### 3.3 Navigation — `routerLink` vs. the `Router` service

`routerLink` (declarative, in every template that has a fixed or click-driven destination):

- Static: `<a routerLink="/boards">Boards</a>` (`AppComponent`'s nav)
- Dynamic, array form: `<a [routerLink]="['/boards', board.id]">` (board cards, next/previous board links, Kanban
  task cards)
- With query params: `<a [routerLink]="['/boards']" [queryParams]="{ sort: 'name' }">` (the sort toggle on the
  board list)

`routerLinkActive` highlights the current section in the nav bar:

```html
<a routerLink="/boards" routerLinkActive="app-nav__link--active" [routerLinkActiveOptions]="{ exact: true }">Boards</a>
```

`{ exact: true }` matters here because `/boards/1` and `/boards/1/tasks/1` both technically start with `/boards` —
`exact: true` restricts the "Boards" link to matching only `/boards` exactly.

The `Router` service (programmatic, injected via the constructor, used only when navigation is a *consequence* of
something happening in code, not a direct link click):

| Where | Why programmatic, not `routerLink` |
|---|---|
| `BoardListComponent.onCreateSubmit()` | Navigating to the new board only makes sense *after* it's successfully saved — there's no link to click for a board that doesn't exist yet. |
| `authGuard` | Redirecting to `/login` happens *inside* a guard function, not from a template. |
| `BoardDetailComponent`/`TaskDetailComponent` (invalid id) | If a board/task id doesn't exist, the component redirects to the not-found route as a side effect of a failed lookup. |
| `SettingsComponent.logout()` | Logging out and leaving Settings happens together, as one action. |
| `LoginComponent.login()` | Sends the user back to `returnUrl` after a successful login. |

### 3.4 Route parameters

**`:boardId`** (`BoardDetailComponent`) is read **reactively**, not via `route.snapshot`:

```typescript
this.paramSubscription = this.route.paramMap.subscribe((params) => {
  this.boardId = Number(params.get('boardId'));
  this.loadBoard();
});
```

Clicking "Next board"/"Previous board" navigates from `/boards/1` to `/boards/2`, which matches the exact same
route configuration — Angular **reuses** the same `BoardDetailComponent` instance instead of destroying and
recreating it. `ngOnInit` does **not** run again on that second visit, so a `route.snapshot` read (one-time) would
keep showing board 1's data forever. The subscription is torn down in `ngOnDestroy`.

**`:taskId`** (`TaskDetailComponent`) is read the same way, alongside the inherited `:boardId`, from the *same*
`paramMap`.

**Query parameters** (`?sort=name`/`?sort=recent`) drive the board list's sort order, read via `queryParamMap`.

> **A router-configuration detail worth knowing:** by default, Angular only passes a parent route's params down to
> a child route if the *child's own* path is empty (`paramsInheritanceStrategy: 'emptyOnly'`). Because
> `tasks/:taskId` has a non-empty path of its own, it would **not** automatically receive `:boardId` from its
> ancestor under the default setting. `app.config.ts` sets
> `provideRouter(routes, withRouterConfig({ paramsInheritanceStrategy: 'always' }))` so
> `TaskDetailComponent.route.paramMap` reliably contains **both** `:boardId` and `:taskId`.

### 3.5 Child (nested) routes

```typescript
// features/board/board.routes.ts
export const BOARD_ROUTES: Routes = [
  {
    path: '',
    component: BoardDetailComponent,
    children: [
      { path: 'tasks/:taskId', component: TaskDetailComponent, canDeactivate: [unsavedChangesGuard] },
    ],
  },
];
```

`TaskDetailComponent` is a **child** of `BoardDetailComponent`'s route, not a sibling top-level route — the URL
(`/boards/1/tasks/1`) and the UI nesting (the edit panel appears *inside* the board's own layout) both reflect
that a task is conceptually part of a board.

### 3.6 Lazy loading

```typescript
// app.routes.ts
{
  path: 'boards/:boardId',
  canActivate: [authGuard],
  loadChildren: () => import('./features/board/board.routes').then((m) => m.BOARD_ROUTES),
}
```

The entire "board" feature — `BoardDetailComponent`, `TaskDetailComponent`, and everything they import — is
**not** part of the app's initial JavaScript bundle. It's only downloaded the first time a user actually navigates
into a specific board. Confirmed via the production build (`ng build` lists a separate `board-routes` lazy chunk
outside the initial bundle) — see §9.

### 3.7 Route guards

**`authGuard`** (`CanActivate`, functional) — protects `'boards/:boardId'` and `'settings'`. On denial it redirects
to `/login`, carrying the originally-requested URL as `returnUrl`.

**`unsavedChangesGuard`** (`CanDeactivate`, functional) — protects `'tasks/:taskId'`. `TaskDetailComponent`
implements `hasUnsavedChanges()` by comparing its editable fields against the underlying `Task` object; the guard
only prompts when there's an actual difference.

> **Why `CanDeactivate` appears here at all, despite this module's own reference notes flagging it "🔒 Coming
> Later — Outside This Module":** the task specification (`task/Kanban Task Management Web App
> (Routing-Focused Build).md`, Task 7) explicitly requires "deactivation guards to prevent users from losing
> unsaved changes." Since the task specification is the source of truth, and `CanDeactivate` is structurally the
> same mechanism as the already-in-scope `CanActivate` (a functional guard consulted by the Router, returning
> `true`/`false`) just answering "can I leave" instead of "can I enter" — not a new paradigm like RxJS operators or
> Signals would be — it's implemented using the exact same functional-guard pattern this module teaches for
> `CanActivate`.

### 3.8 Wildcard route

```typescript
{ path: '**', component: NotFoundComponent }
```

Placed last in `app.routes.ts`, so it only ever catches URLs that genuinely matched nothing above it.

---

## 4. Why There Is No `FormsModule`/`ngModel` Anywhere In This App

This is worth being able to explain clearly, because it's a deliberate scoping decision, not an oversight.

**The situation:** Task 7 requires a `CanDeactivate` guard protecting against "losing unsaved changes." For that
requirement to mean anything at all, *something* on the task-detail view has to be editable. Two ways exist to
make a field editable in Angular:

1. **Two-way binding via `[(ngModel)]`**, which requires importing `FormsModule` — this is explicitly a **FEM13
   (Forms)** concept; FEM13's own module notes list "Implement two-way data binding using ngModel to build a
   simple Template-Driven form" as one of *its* learning objectives, not this module's.
2. **Plain one-way property binding (`[value]`) plus an event handler (`(input)`/`(change)`)** — ordinary FEM09
   template syntax, no forms module of any kind required.

This app uses **only** option 2. `TaskDetailComponent`'s title/description/status fields, and `BoardListComponent`'s
"create board" name/description fields, are all wired up like this:

```html
<input [value]="title" (input)="onTitleInput($any($event.target).value)" />
```

```typescript
onTitleInput(value: string): void {
  this.title = value;
}
```

This is exactly the manual pattern `[(ngModel)]` is syntactic sugar *over* — the component still has a plain
`title` field, and `hasUnsavedChanges()` still compares it against the loaded `Task`, giving `unsavedChangesGuard`
real state to protect. Nothing about the guard's behavior changes; only the *mechanism* wiring the input to that
state does.

The "create board" panel on the board list goes one step further and avoids even needing live component state for
its inputs: it reads values straight off `#boardNameInput`/`#boardDescriptionInput` template reference variables at
the moment the native `(submit)` event fires, with `event.preventDefault()` replacing Angular's `(ngSubmit)` (which
is only available once `FormsModule` registers the `NgForm` directive). A plain `required` HTML attribute gives the
board-name field basic native browser validation — ordinary HTML5, not Angular-specific, and free of any forms-module
dependency.

**The payoff:** the *next* module (FEM13, Forms & Validation) revisits this exact app and upgrades these same two
spots — the board-creation panel becomes a proper `NgForm`/`ngModel` template-driven form, and task editing is
replaced by a dedicated `FormGroup`/`FormBuilder` reactive form — so `ngModel` and the Forms API arrive as a
genuinely *new* capability in that module, not something quietly already present here.

---

## 5. Kanban Column Layout (UI)

The board detail view groups `board.tasks` into three columns — **To do**, **In progress**, **Done** — via a small
`tasksByStatus(status)` helper that filters the same array `BoardDetailComponent` already has:

```typescript
readonly statusColumns = [
  { status: 'todo', label: 'To do' },
  { status: 'in-progress', label: 'In progress' },
  { status: 'done', label: 'Done' },
];

tasksByStatus(status: TaskStatus): Task[] {
  return this.board?.tasks.filter((task) => task.status === status) ?? [];
}
```

This is presentation only — no new data, no new routing concept, just `*ngFor`/`*ngIf` and a plain array `filter()`
(both already-covered FEM09/10-level tools) applied three times instead of once. Each column is a CSS grid track on
tablet/desktop; below 860px the grid collapses to a single stacked column so nothing is ever squeezed sideways or
requires horizontal scrolling on a phone.

The whole app (this project and FEM13's) shares one **light-mode-only** design system (`styles.css`): a single set
of CSS custom properties for color/spacing/radius/shadow, with no `prefers-color-scheme: dark` override anywhere.

---

## 6. Navigation Flow — realistic user paths through the app

**Browsing into a board, as a logged-out user:**
> User lands on `/` → redirected to `/boards` → sees board cards → clicks "Website Redesign" → Angular Router
> matches `boards/:boardId` → `authGuard` runs first, finds `isLoggedIn()` is `false` → redirects to
> `/login?returnUrl=%2Fboards%2F1` → user clicks "Log in" → `AuthService.login()` sets the flag → `LoginComponent`
> reads `returnUrl` and calls `router.navigateByUrl('/boards/1')` → **this time** `authGuard` allows it → the
> `'boards/:boardId'` chunk downloads (first time only) → `BoardDetailComponent` renders board 1's Kanban columns.

**Moving between boards without losing routing state:**
> On `/boards/1`, user clicks "Next board →" → navigates to `/boards/2` → Angular **reuses** the existing
> `BoardDetailComponent` instance → `route.paramMap` emits a new value → the reactive subscription re-runs
> `loadBoard()` → the header and all three columns update to board 2's data, with no full page reload.

**Opening and editing a task (nested route):**
> On `/boards/1`, user clicks a task card in the "To do" column → `[routerLink]="['tasks', task.id]"` resolves to
> `/boards/1/tasks/2` → `BoardDetailComponent`'s nested `<router-outlet>` renders `TaskDetailComponent` *underneath*
> the still-visible Kanban columns → user edits the title (plain `(input)` handler, no `ngModel`) →
> `hasUnsavedChanges()` now returns `true` → user clicks "← All boards" → the Router calls `unsavedChangesGuard`
> *before* actually navigating → `window.confirm(...)` pops up → cancelling keeps the user on the task page with
> their edit intact; confirming discards it and lets the navigation through.

**Hitting a URL that doesn't exist:**
> User types `/boards/999` → no board with that id → `BoardDetailComponent.loadBoard()` finds `undefined` →
> `router.navigate(['/not-found'])` → the wildcard `'**'` route matches → `NotFoundComponent` renders with a link
> back to `/boards`.

---

## 7. Connection to Previous Modules

**FEM09 — Angular Fundamentals.** Every routed view is an ordinary standalone component with a template, styles,
property binding (`{{ board.name }}`, `[value]="title"`), and event binding (`(click)="createBoard()"`,
`(input)="onTitleInput(...)"`). `*ngIf`/`*ngFor` (via `CommonModule`) drive conditional rendering and lists
throughout — the Kanban columns, the board grid, the previous/next board links only appearing when they exist.
Template reference variables (`#boardNameInput`) read raw DOM values for the create-board panel.

**FEM10 — Component Interaction & Lifecycle.** `ngOnInit`/`ngOnDestroy` manage every route-parameter subscription's
setup/cleanup — the same lifecycle contract from FEM10, now triggered by the Router creating/destroying (or
reusing) a routed component instead of an `*ngIf` toggling a component in and out.

**FEM11 — Services & Dependency Injection.** `BoardService` and `AuthService` are both
`@Injectable({ providedIn: 'root' })` singletons, injected via constructor injection into every component and (via
`inject()`) into both guards. `BoardService` is the single shared source of board/task data.

**FEM12 — Routing & Navigation.** Everything in §3 above: route configuration, `<router-outlet>` (including a
nested one), `routerLink`/`routerLinkActive`, the `Router` service, reactive route/query parameters, a
lazily-loaded child route module, and both `CanActivate` and `CanDeactivate` guards.

---

## 8. Possible TA Questions

**General**

- *What is Angular Router?* The built-in Angular feature that maps the current browser URL to a component to
  render, entirely client-side, by matching it against a configured route table and swapping the component shown
  inside a `<router-outlet>`.
- *How does Angular decide which component to display?* It checks the route array top to bottom and uses the
  **first** match — which is why `'boards'` is listed before the wildcard, and why literal paths precede
  parameterized ones that could also match the same URL.

**Navigation**

- *`routerLink` vs. programmatic navigation?* `routerLink` is declarative, for direct clicks with a fixed or
  data-bound destination. The `Router` service is imperative, for navigation triggered by logic — e.g. redirecting
  after `authGuard` denies access, or navigating to a newly created board right after `BoardService.addBoard()`
  returns. See the table in §3.3 for every concrete example in this app.

**Parameters**

- *How do you access a route parameter?* Inject `ActivatedRoute`, then either `route.snapshot.paramMap.get('name')`
  (one-time) or subscribe to `route.paramMap` (reactive, updates on every match — used throughout this app).
- *Why did `TaskDetailComponent` need special router configuration to read `:boardId`?* See §3.4's callout —
  `withRouterConfig({ paramsInheritanceStrategy: 'always' })` fixes the default "only empty-path children inherit
  parent params" behavior globally.

**Forms-adjacent (the part TAs are most likely to probe, given this module's name)**

- *Why doesn't this app use `ngModel`?* See §4 in full — two-way binding and the Forms API are FEM13 concepts;
  this app only needs *some* editable field to give `CanDeactivate` something real to protect, which plain
  property + event binding provides without borrowing anything from the next module.
- *Isn't the "create board" panel a form?* It's a `<form>` element (for the free native `(submit)`/`required`
  behavior), but it has no `FormsModule`, no `ngModel`, no validation feedback UI, and no `NgForm`/`FormGroup`
  tracking `dirty`/`touched`/`valid` state — the actual markers of "an Angular form" as FEM13 defines it. It's
  closer to "a couple of inputs with a submit button" than a form in the FEM13 sense.
- *What would break if `ngModel` were used here instead?* Nothing would visibly break — it would still work — but
  it would blur the line between what this module teaches and what FEM13 teaches, which is exactly what this
  review avoided on purpose.

**Structure**

- *What is a wildcard route, and why does its position matter?* `'**'` matches any URL nothing earlier matched;
  since matching is top-to-bottom and first-match-wins, anything listed after it would be unreachable.
- *What is nested routing, and why use it here?* A child route rendered inside its parent's own outlet — used for
  `tasks/:taskId` inside `boards/:boardId` so the board's Kanban layout stays visible while only the task-editing
  panel appears/changes underneath it.
- *How does routing interact with components and services?* Routed components go through the normal
  `ngOnInit`/`ngOnDestroy` lifecycle; guards and routed components alike inject services the same way any other
  component would.

---

## 9. Things I Must Be Able to Explain (checklist)

- [ ] The full route configuration in `app.routes.ts` and `features/board/board.routes.ts`, including why the
      wildcard is last.
- [ ] What `<router-outlet>` does, and why `BoardDetailComponent` has its own second one.
- [ ] The difference between `routerLink` and calling `Router.navigate()`/`navigateByUrl()`, with a real example of
      each from this app.
- [ ] `routerLinkActive` and why `{ exact: true }` is on the Boards link specifically.
- [ ] Route parameters: how `:boardId` and `:taskId` are declared, read reactively, and why snapshot-only reading
      would have broken the "next board" feature.
- [ ] Query parameters, and where `sort` and `returnUrl` are used.
- [ ] The `paramsInheritanceStrategy` fix and why it was necessary for the nested task route.
- [ ] Child routes: why `tasks/:taskId` is nested under `boards/:boardId` instead of a flat sibling route.
- [ ] Lazy loading: what `loadChildren` does, and how it's confirmed (build output) in §10.
- [ ] Both guards: what `authGuard` checks and where it redirects on denial; what `unsavedChangesGuard` checks and
      how a component opts into it via `HasUnsavedChanges`.
- [ ] **Why this app has no `FormsModule`/`ngModel` anywhere**, and what it uses instead (§4) — this is the
      question most likely to come up given the app's name and the presence of editable fields.
- [ ] The Kanban column layout: that it's a display-only grouping of the same task data, not a new concept.
- [ ] How routing works together with `BoardService`/`AuthService` (FEM11) and the `ngOnInit`/`ngOnDestroy`
      lifecycle (FEM10).

---

## 10. Verification Performed

- `ng build` succeeds; production output shows `board-routes` as a separate lazy chunk, not part of the initial
  bundle.
- `grep -rl "FormsModule\|ngModel\|ReactiveFormsModule\|FormGroup\|FormBuilder\|FormArray\|Validators" src/app` —
  the only matches are explanatory *comments* stating these are deliberately not used; zero actual usages.
- An automated headless-browser run (Playwright, against the live `ng serve` dev server), with **zero
  console/page errors** throughout:
  - Light mode confirmed (`getComputedStyle(document.body).backgroundColor` = `rgb(246, 247, 251)`, no dark
    override present).
  - Kanban board renders exactly 3 columns; next/previous board navigation updates all three columns' contents
    without a page reload.
  - Opening a task, editing its title via the manually-bound input, confirms the "Save changes" button goes from
    disabled → enabled and the "unsaved changes" hint appears — all without `ngModel`.
  - `CanDeactivate`: dirtying the title then clicking "← All boards" pops the native confirm dialog; dismissing it
    keeps the user on the task route with the edit intact; saving first and *then* navigating away triggers **no**
    prompt (confirms `hasUnsavedChanges()` correctly goes back to `false` once the underlying `Task` is updated).
  - Create-board panel: submitting empty is blocked by the native `required` attribute (no navigation occurs);
    filling in a valid name and submitting creates the board and programmatically navigates to it.
  - Responsive layout at a 375px mobile viewport: the three Kanban columns stack to one column, full width, no
    horizontal page overflow.
- **Bug watch:** none found in this session's redesign pass; the refactor (dropping `FormsModule`, adding Kanban
  columns) was verified against the exact same functional checks the app already had, plus the new column-layout
  checks above.

---

## 11. Final Curriculum Audit

**✅ Allowed (FEM09–FEM12), and used throughout:** standalone components with `imports: [...]`, property/event
binding (including manual `[value]`/`(input)` field wiring and template reference variables), two-way binding is
**not** used anywhere (see §4), `*ngIf`/`*ngFor` via `CommonModule`, `@Injectable({ providedIn: 'root' })` services
with constructor injection, `ngOnInit`/`ngOnDestroy`, `provideRouter()` + `Routes`, `<router-outlet>` (including
nested), `routerLink`/`routerLinkActive`, the `Router` service, `ActivatedRoute` (`paramMap`/`queryParamMap`, read
reactively via `.subscribe()` + `ngOnDestroy` unsubscribe), child routes, `loadChildren` lazy loading, and
`CanActivate` guards.

**❌ Not introduced:** `FormsModule`, `ReactiveFormsModule`, `ngModel`, `FormGroup`/`FormControl`/`FormBuilder`/
`FormArray`, any built-in or custom `Validators` — all explicitly FEM13 territory, confirmed removed by the grep in
§10. Also confirmed absent: RxJS `Subject`/`BehaviorSubject`, custom Observables, RxJS operators, `HttpClient`,
Angular Signals (`signal()`/`computed()`/`effect()`/`input()`/`output()`), the new `@if`/`@for`/`@switch` control-flow
syntax (classic `*ngIf`/`*ngFor` used throughout instead), `ViewChild`/`ContentChild`, and any external
state-management library.

**One deliberate, flagged exception:** `CanDeactivate` (the `unsavedChangesGuard`) is marked "🔒 Coming Later —
Outside This Module" in this module's own reference notes, but is **explicitly required** by Task 7 of the actual
lab specification. Since the task specification is the source of truth, and `CanDeactivate` is structurally the
same mechanism as the already-in-scope `CanActivate`, it was implemented using the exact same functional-guard
pattern this module teaches for `CanActivate` — see §3.7.

---

## Deliverables status

| Deliverable | Status |
|---|---|
| Kanban app with routing/navigation implemented | ✅ Done, verified live |
| Organized routing structure, nav links, and guards | ✅ Done |
| Redesigned, light-mode, Kanban-column UI shared with FEM13 | ✅ Done, verified live |
| No FEM13 (Forms) concepts leaking into this build | ✅ Verified via grep + manual review (§4, §10) |
| Public GitHub repo with clean history/documentation | ⚠️ Not done by this session — requires pushing to a GitHub remote, which needs explicit authorization; the app is ready to commit whenever you'd like |
| Deployed live app URL (Netlify/Vercel) | ⚠️ Not done by this session — requires an external hosting account/deployment step outside an automated coding session's scope; app builds cleanly and is deploy-ready (`ng build` output verified) |
