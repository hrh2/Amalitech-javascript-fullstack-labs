# FEM12 TA Review Prep — Kanban Task Management Web App (Routing-Focused Build)

Project location: `FEM12-Routing-and-Navigation/kanban-task-management-app/`

---

## 1. Project Overview

The app is a simplified **Kanban task board manager**: a list of boards, a
detail view per board (with its tasks), an editable task-detail view nested
inside that board, and a settings area. Every one of those views lives at
its own URL and is reachable by typing the URL directly, refreshing the
page, or clicking a link — there is no "one big component with `*ngIf`
toggles" anywhere in the app.

**Why routing is central here, not incidental:** a Kanban tool is naturally
multi-page — "which board am I looking at" and "which task am I editing"
are exactly the kind of state that *should* live in the URL, not in a
component property, because:

- boards and tasks need to be **bookmarkable/shareable** (`/boards/2`),
- the **browser back/forward buttons** should work between them,
- **refreshing the page** on a task should not lose your place,
- and different areas (Settings vs. Boards) have different **access
  requirements**, which routing enforces at the point of navigation via
  guards, before any component is even created.

The lab exists specifically to practice: route configuration, all three
common navigation mechanisms (`routerLink`, `routerLinkActive`, the
`Router` service), reading route/query parameters reactively, nested child
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
    ├── board-detail/               '' → board layout, task list, next/prev links,
    │                                own nested <router-outlet>
    └── task-detail/                'tasks/:taskId' → editable task, CanDeactivate
```

**Responsibilities, briefly:**

- **`BoardService`** (FEM11 service) — the single source of truth for board
  and task data; every component that needs board/task data injects this
  instead of holding its own copy.
- **`AuthService`** (FEM11 service) — a deliberately simple stand-in for
  real authentication (`isLoggedIn()` is just a boolean flag). Its only job
  in this lab is to give `authGuard` something real to check.
- **`authGuard`** — decides *whether a route may be entered*.
- **`unsavedChangesGuard`** — decides *whether a route may be left*.
- **`BoardListComponent`** — the app's home page; also demonstrates
  query-parameter-driven sorting and programmatic navigation after creating
  a board.
- **`BoardDetailComponent`** — the most routing-dense component in the app:
  reads `:boardId` reactively, owns a *second*, nested `<router-outlet>`,
  and builds "next/previous board" links from service data.
- **`TaskDetailComponent`** — reads two path parameters at once
  (`:boardId` inherited + its own `:taskId`), and implements
  `HasUnsavedChanges` so `unsavedChangesGuard` can protect it.

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

`features/board/board.routes.ts` (lazily loaded, mounted under
`boards/:boardId`):

| Path (relative) | Renders | Guards | Notes |
|---|---|---|---|
| `''` | `BoardDetailComponent` | — | matches `boards/:boardId` itself |
| `'tasks/:taskId'` | `TaskDetailComponent` | `unsavedChangesGuard` (CanDeactivate) | nested child route |

Route order matters and is respected here: `'boards'` (literal) is
registered before `'boards/:boardId'` (parameterized) would ever be
ambiguous with it — they don't actually collide since `'boards'` has no
further segments — and the wildcard `'**'` is the last entry in the array,
so every more specific route above it gets first chance to match.

### 3.2 `<router-outlet>` — two of them, on purpose

`AppComponent`'s template has **one** root `<router-outlet>`. It sits
below a `<header>` that is never inside the outlet, so the header/nav stay
mounted across every navigation — only the outlet's contents swap.

`BoardDetailComponent`'s own template has a **second**, nested
`<router-outlet>`. This is what lets `tasks/:taskId` render *inside* the
board's layout (header, task list) instead of replacing it. Visiting
`/boards/1` alone leaves that inner outlet empty; visiting
`/boards/1/tasks/1` renders `TaskDetailComponent` into it while the board
header and task list above stay exactly where they were — that's the
practical benefit of nested routing, made visible.

### 3.3 Navigation — `routerLink` vs. the `Router` service

`routerLink` (declarative, in every template that has a fixed or
click-driven destination):

- Static: `<a routerLink="/boards">Boards</a>` (`AppComponent`'s nav)
- Dynamic, array form: `<a [routerLink]="['/boards', board.id]">` (board
  cards, next/previous board links, task rows)
- With query params: `<a [routerLink]="['/boards']"
  [queryParams]="{ sort: 'name' }">` (the sort toggle on the board list)

`routerLinkActive` highlights the current section in the nav bar:

```html
<a routerLink="/boards" routerLinkActive="app-nav__link--active"
   [routerLinkActiveOptions]="{ exact: true }">Boards</a>
```

`{ exact: true }` matters here because `/boards/1` and `/boards/1/tasks/1`
both technically start with `/boards` — without `exact: true` the Boards
link would look "active" even while on a board detail page too broadly;
`exact: true` restricts it to exactly `/boards`.

The `Router` service (programmatic, injected via the constructor, used
only when navigation is a *consequence* of something happening in code,
not a direct link click):

| Where | Why programmatic, not `routerLink` |
|---|---|
| `BoardListComponent.createBoard()` | Navigating to the new board only makes sense *after* it's successfully saved — there's no link to click for a board that doesn't exist yet. |
| `authGuard` | Redirecting to `/login` happens *inside* a guard function, not from a template. |
| `BoardDetailComponent`/`TaskDetailComponent` (invalid id) | If a board/task id doesn't exist, the component redirects to the not-found route as a side effect of a failed lookup. |
| `SettingsComponent.logout()` | Logging out and leaving Settings happens together, as one action. |
| `LoginComponent.login()` | Sends the user back to `returnUrl` after a successful login. |

### 3.4 Route parameters

**`:boardId`** (`BoardDetailComponent`) is read **reactively**, not via
`route.snapshot`:

```typescript
this.paramSubscription = this.route.paramMap.subscribe((params) => {
  this.boardId = Number(params.get('boardId'));
  this.loadBoard();
});
```

This matters concretely in this app: clicking "Next board"/"Previous
board" navigates from `/boards/1` to `/boards/2`, which matches the exact
same route configuration — Angular **reuses** the same
`BoardDetailComponent` instance instead of destroying and recreating it.
`ngOnInit` does **not** run again on that second visit. A
`route.snapshot.paramMap.get('boardId')` read (one-time, on init) would
keep showing board 1's data forever. Subscribing to `route.paramMap`
is what lets the automated test in this project prove the "next board"
link actually updates the displayed content (see §4).

The subscription is torn down in `ngOnDestroy`:

```typescript
ngOnDestroy(): void {
  this.paramSubscription?.unsubscribe();
}
```

**`:taskId`** (`TaskDetailComponent`) is read the same way, alongside the
inherited `:boardId`, from the *same* `paramMap`:

```typescript
this.paramSubscription = this.route.paramMap.subscribe((params) => {
  this.boardId = Number(params.get('boardId'));
  this.taskId = Number(params.get('taskId'));
  this.loadTask();
});
```

**Query parameters** (`?sort=name`/`?sort=recent`) drive the board list's
sort order, read via `queryParamMap`:

```typescript
this.route.queryParamMap.subscribe((params) => {
  this.sortOrder = (params.get('sort') as SortOrder) ?? 'recent';
  this.applySort();
});
```

**`returnUrl`** (`LoginComponent`) is a query parameter too — `authGuard`
sets it when it redirects, and `LoginComponent` reads it to send the user
back where they were headed.

> **A router-configuration detail worth knowing:** by default, Angular
> only passes a parent route's params down to a child route if the
> *child's own* path is empty (`paramsInheritanceStrategy: 'emptyOnly'`).
> Because `tasks/:taskId` has a non-empty path of its own, it would **not**
> automatically receive `:boardId` from its ancestor under the default
> setting. `app.config.ts` sets
> `provideRouter(routes, withRouterConfig({ paramsInheritanceStrategy: 'always' }))`
> so `TaskDetailComponent.route.paramMap` reliably contains **both**
> `:boardId` and `:taskId`. This was found and fixed during testing (see
> §9) — it's a real, well-known Router gotcha with nested parameterized
> routes, not a hypothetical.

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

`TaskDetailComponent` is a **child** of `BoardDetailComponent`'s route, not
a sibling top-level route — the URL (`/boards/1/tasks/1`) and the UI
nesting (task form appears *inside* the board's own layout) both reflect
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

The entire "board" feature — `BoardDetailComponent`, `TaskDetailComponent`,
and everything they import — is **not** part of the app's initial
JavaScript bundle. It's only downloaded the first time a user actually
navigates into a specific board. Confirmed two ways during verification
(§9): the production build (`ng build`) lists a separate
`board-routes` lazy chunk outside the initial bundle, and a live network
trace shows a genuinely new JS request firing only after clicking into a
board — never during the initial `/boards` page load.

### 3.7 Route guards

**`authGuard`** (`CanActivate`, functional):

```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
```

Applied to `'boards/:boardId'` and `'settings'`. On denial it doesn't just
return `false` silently — it redirects to `/login`, carrying the
originally-requested URL as `returnUrl`, so logging in sends the user
straight back where they meant to go.

**`unsavedChangesGuard`** (`CanDeactivate`, functional):

```typescript
export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => {
  if (!component.hasUnsavedChanges()) {
    return true;
  }
  return window.confirm('You have unsaved changes. Leave this page and discard them?');
};
```

Applied to `'tasks/:taskId'`. `TaskDetailComponent` implements
`hasUnsavedChanges()` by comparing its editable form fields against the
underlying `Task` object; the guard only prompts when there's an actual
difference. This protects the user from silently losing an in-progress
edit, whether they click away, use a `routerLink`, or hit the browser's
back button.

### 3.8 Wildcard route

```typescript
{ path: '**', component: NotFoundComponent }
```

Placed last in `app.routes.ts` (after `'boards'`, `'boards/:boardId'`,
`'settings'`, `'login'`), so it only ever catches URLs that genuinely
matched nothing above it — including a `boardId`/`taskId` that parses but
doesn't correspond to a real record (`BoardDetailComponent` and
`TaskDetailComponent` both `router.navigate(['/not-found'])` when a
lookup comes back empty, which itself falls through to the wildcard since
no literal `'not-found'` route is registered).

---

## 4. Navigation Flow — realistic user paths through the app

**Browsing into a board, as a logged-out user:**
> User lands on `/` → redirected to `/boards` → sees three board cards →
> clicks "Website Redesign" → Angular Router matches `boards/:boardId` →
> `authGuard` runs first, finds `isLoggedIn()` is `false` → redirects to
> `/login?returnUrl=%2Fboards%2F1`, and the original navigation to the
> board is blocked → user clicks "Log in" → `AuthService.login()` sets the
> flag → `LoginComponent` reads `returnUrl` and calls
> `router.navigateByUrl('/boards/1')` → **this time** `authGuard` allows
> it → the `'boards/:boardId'` chunk downloads (first time only) →
> `BoardDetailComponent` renders with board 1's data.

**Moving between boards without losing routing state:**
> On `/boards/1`, user clicks "Next board →" → `[routerLink]="['/boards', nextBoardId]"`
> navigates to `/boards/2` → same route config matches, so Angular
> **reuses** the existing `BoardDetailComponent` instance rather than
> destroying/recreating it → `route.paramMap` emits a new value →
> the reactive subscription re-runs `loadBoard()` → the header, task list,
> and next/previous links all update to board 2's data, with no full page
> reload and no stale board 1 content left behind.

**Opening and editing a task (nested route):**
> On `/boards/1`, user clicks "Wireframe the homepage" → relative
> `[routerLink]="['tasks', task.id]"` resolves to `/boards/1/tasks/2` →
> `BoardDetailComponent`'s own nested `<router-outlet>` renders
> `TaskDetailComponent` *underneath* the still-visible board header and
> task list → user edits the title → `hasUnsavedChanges()` now returns
> `true` → user clicks "← All boards" → the Router calls
> `unsavedChangesGuard` *before* actually navigating → `window.confirm(...)`
> pops up → cancelling keeps the user on the task page with their edit
> intact; confirming lets the navigation through and the edit is
> discarded.

**Hitting a URL that doesn't exist:**
> User types `/boards/999` → no board with that id →
> `BoardDetailComponent.loadBoard()` finds `undefined` →
> `router.navigate(['/not-found'])` → no literal `'not-found'` route is
> registered, so the wildcard `'**'` route matches instead →
> `NotFoundComponent` renders with a link back to `/boards`.

---

## 5. Connection to Previous Modules

**FEM09 — Angular Fundamentals.** Every routed view is an ordinary
standalone component with a template, styles, property binding
(`{{ board.name }}`), event binding (`(click)="createBoard()"`), and
two-way binding (`[(ngModel)]` on the new-board and task-edit forms).
`*ngIf`/`*ngFor` (via `CommonModule`) drive conditional rendering and
lists throughout — e.g. the board grid, the task list, the previous/next
board links only appearing when they exist.

**FEM10 — Component Interaction & Lifecycle.** `ngOnInit`/`ngOnDestroy`
are used everywhere a route-parameter subscription needs setup/cleanup —
this is the same lifecycle contract from FEM10, just triggered by the
Router creating/destroying (or reusing) a routed component instead of an
`*ngIf` toggling a component in and out. No `@Input()`/`@Output()`
parent-child wiring was needed here because the "component interaction"
in this app happens *through routes* (a board id passed via the URL)
rather than through a direct parent-child template relationship — a
deliberate, routing-appropriate alternative to `@Input()` for this kind of
data.

**FEM11 — Services & Dependency Injection.** `BoardService` and
`AuthService` are both `@Injectable({ providedIn: 'root' })` singletons,
injected via constructor injection into every component and (via
`inject()`) into both guards. `BoardService` is the single shared source
of board/task data — no component holds its own duplicate copy — which is
exactly the "sharing logic/data through services" principle FEM11
introduced, now load-bearing for routing: guards and routed components
both depend on it to decide what to show or whether navigation is allowed.

**FEM12 — Routing & Navigation.** Everything in §3 above: route
configuration, `<router-outlet>` (including a nested one), `routerLink` /
`routerLinkActive`, the `Router` service, reactive route/query parameters,
a lazily-loaded child route module, and both `CanActivate` and
`CanDeactivate` guards.

---

## 6. Important Angular Concepts — revision

- **Route** — one URL-pattern-to-component mapping (`{ path, component }`).
- **`<router-outlet>`** — marks where the Router renders the currently
  matched component; a template can have more than one (a root one, and a
  nested one owned by a parent-routed component).
- **`routerLink`** — declarative navigation; intercepts the click so no
  full page reload happens, unlike a plain `href`.
- **`routerLinkActive`** — applies a CSS class to a link matching the
  current URL; `{ exact: true }` restricts a "home"-style link from
  matching every route that happens to start with the same prefix.
- **`Router` service** — injectable, used for navigation that's a
  *consequence* of code running (after a save, after a guard denial),
  rather than a direct click.
- **Route parameter (`:name`)** — a dynamic URL segment captured as data;
  read reactively via `ActivatedRoute.paramMap.subscribe(...)` whenever the
  same component might be reused across different parameter values (the
  "reuse trap").
- **Query parameter** — optional, non-identifying URL data (`?sort=...`),
  read via `queryParamMap`, for things like sorting/filtering rather than
  "which resource."
- **Child (nested) route** — a route rendered inside its *parent's own*
  `<router-outlet>`, letting a shared layout stay mounted while only the
  nested part changes.
- **`loadChildren` / lazy loading** — defers a whole feature's code
  (and its transitive imports) until a route that needs it is actually
  visited, shrinking the app's initial download.
- **`CanActivate`** — a guard answering "is entering this route allowed?" —
  runs *before* the routed component is even created.
- **`CanDeactivate`** — a guard answering "is leaving this route allowed?"
  — consulted whenever navigation would remove the currently active
  component, letting it (e.g., via unsaved-changes state) block or confirm
  the departure.
- **Wildcard route (`'**'`)** — matches anything unmatched by earlier
  entries; must be listed last, since routes are matched top-to-bottom and
  the first match wins.

---

## 7. Possible TA Questions

**General**

- *What is Angular Router?* The built-in Angular feature that maps the
  current browser URL to a component to render, entirely client-side —
  no full page reload — by intercepting navigation, matching it against a
  configured route table, updating the URL via the History API, and
  swapping the component shown inside a `<router-outlet>`.
- *What is a route?* A single entry mapping a URL path pattern to the
  component that should render when the URL matches it (plus optional
  guards, children, or lazy-loading config).
- *What is `router-outlet`?* A template marker showing *where* the
  matched route's component gets rendered; everything outside it in a
  template is unaffected by navigation.
- *How does Angular decide which component to display?* It checks the
  route array top to bottom and uses the **first** match — which is why
  `'boards'` is listed before the wildcard, and why literal paths must
  precede parameterized ones that could also match the same URL.

**Navigation**

- *`routerLink` vs. programmatic navigation?* `routerLink` is declarative,
  for direct clicks in a template, with a fixed or data-bound destination
  known at render time. The `Router` service is imperative, for navigation
  triggered by logic running in a component or guard — e.g. redirecting
  after `authGuard` denies access, or navigating to a newly created board
  right after `BoardService.addBoard()` returns.
- *Why did you use `routerLink` here and the `Router` service there?*
  See the table in §3.3 — every programmatic call in this app is a
  consequence of something else happening (a guard decision, a completed
  save, a logout), never a substitute for a plain link click.

**Parameters**

- *What are route parameters?* Dynamic URL segments (`:name`) that let one
  route definition match many different resources, with the actual value
  read from the matched URL.
- *How do you access a route parameter?* Inject `ActivatedRoute`, then
  either `route.snapshot.paramMap.get('name')` (one-time) or subscribe to
  `route.paramMap` (reactive, updates on every match — used throughout
  this app).
- *Why a route parameter instead of storing the value somewhere else
  (e.g., a service field)?* The value needs to live in the URL so the
  page is bookmarkable, shareable, survives a refresh, and works with
  back/forward — none of which a plain in-memory service field gives you.
- *Why did `TaskDetailComponent` need special router configuration to read
  `:boardId`?* Because by default Angular only inherits a parent route's
  params into a child whose *own* path is empty — see §3.4's callout and
  §9 — `withRouterConfig({ paramsInheritanceStrategy: 'always' })` fixes
  it globally.

**Structure**

- *What is a wildcard route, and why does its position matter?* `'**'`
  matches any URL nothing earlier matched; since matching is top-to-bottom
  and first-match-wins, anything listed after it would be unreachable —
  so it's always last.
- *What is nested routing, and why use it here?* A child route rendered
  inside its parent's own outlet — used for `tasks/:taskId` inside
  `boards/:boardId` so the board's layout (header, task list) stays
  visible and mounted while only the task-editing panel appears/changes
  underneath it.
- *How does navigation affect the URL?* The Router updates the address bar
  via the History API on every successful navigation — real URL changes,
  working back/forward — without an actual server round-trip for the page
  itself.
- *What happens when the user refreshes a routed page?* The browser makes
  a real request for that exact URL; the Angular app boots fresh and its
  route configuration matches the URL immediately, rendering the correct
  component — this is exactly what the deep-link tests in §9 verify (e.g.
  loading `/boards/1/tasks/1` directly).
- *How does routing interact with components and services?* Routed
  components go through the normal `ngOnInit`/`ngOnDestroy` lifecycle
  (created/destroyed, or reused, as the URL changes); guards and routed
  components alike inject services (`BoardService`, `AuthService`) the
  same way any other component would, via constructor injection or
  `inject()`.
- *Why is a task routed rather than shown via `*ngIf`?* So a specific task
  has its own shareable/bookmarkable/refreshable URL, and so
  `unsavedChangesGuard` has a real navigation event to intercept — an
  `*ngIf` toggle has no such event to hook into.

---

## 8. Things I Must Be Able to Explain (checklist)

- [ ] I can explain the full route configuration in `app.routes.ts` and
      `features/board/board.routes.ts`, including why the wildcard is last.
- [ ] I can explain what `<router-outlet>` does, and why
      `BoardDetailComponent` has its own second one.
- [ ] I can explain the difference between `routerLink` and calling
      `Router.navigate()`/`navigateByUrl()`, with a real example of each
      from this app.
- [ ] I can explain `routerLinkActive` and why `{ exact: true }` is on the
      Boards link specifically.
- [ ] I can explain route parameters: how `:boardId` and `:taskId` are
      declared, read reactively, and why snapshot-only reading would have
      broken the "next board" feature.
- [ ] I can explain query parameters and point to where `sort` and
      `returnUrl` are used.
- [ ] I can explain the `paramsInheritanceStrategy` fix and why it was
      necessary for the nested task route.
- [ ] I can explain child routes: why `tasks/:taskId` is nested under
      `boards/:boardId` instead of being a flat sibling route.
- [ ] I can explain lazy loading: what `loadChildren` does, and how I
      confirmed it (build output + network trace) in §9.
- [ ] I can explain both guards: what `authGuard` checks and where it
      redirects on denial; what `unsavedChangesGuard` checks and how a
      component opts into it via `HasUnsavedChanges`.
- [ ] I can explain how the app moves from one page/view to another for
      each of the four user flows in §4, in my own words, without reading
      the code.
- [ ] I can explain how routing works together with `BoardService` and
      `AuthService` (FEM11) and with the `ngOnInit`/`ngOnDestroy`
      lifecycle (FEM10).

---

## 9. Verification performed

- `ng build` succeeds; production output shows `board-routes` as a
  separate lazy chunk, not part of the initial bundle.
- An automated headless-browser run (Playwright) drove the live dev server
  through 17 checks — all passing, zero console errors — covering: the
  `/` → `/boards` redirect, board list rendering, `?sort=` query-param
  reordering, the unauthenticated-deep-link → `/login?returnUrl=...`
  redirect, login → return-to-original-URL, board detail content,
  next/previous board navigation (including the reactive-paramMap "reuse
  trap" check), nested task route rendering inside the still-mounted board
  layout, the `CanDeactivate` confirm dialog on both dismiss and accept,
  the settings guard in both directions (logged in vs. logged out), the
  wildcard 404 route, and a direct deep-link to a guarded nested route.
- A separate network-trace run confirmed the board feature's JS chunk is
  requested only after navigating into a board, never during the initial
  `/boards` load.
- Responsive layout checked at a 375px mobile viewport for both the board
  list and board detail views (grid collapses to a single column, nav
  wraps, forms remain usable).
- **Bug found and fixed during verification:** the nested `:taskId` route
  initially couldn't read its parent's `:boardId` (Angular's default
  `paramsInheritanceStrategy` doesn't propagate params through a
  non-empty-path child), which was silently redirecting every task click
  to the 404 page. Fixed via `withRouterConfig({ paramsInheritanceStrategy: 'always' })`
  in `app.config.ts` — see §3.4.

---

## 10. Final Curriculum Audit

**✅ Allowed (FEM09–FEM12), and used throughout:**
Standalone components with `imports: [...]`, property/event/two-way
binding, `*ngIf`/`*ngFor` via `CommonModule`, `@Injectable({ providedIn:
'root' })` services with constructor injection, `ngOnInit`/`ngOnDestroy`,
`provideRouter()` + `Routes`, `<router-outlet>` (including nested),
`routerLink`/`routerLinkActive`, the `Router` service, `ActivatedRoute`
(`paramMap`/`queryParamMap`, read reactively via `.subscribe()` +
`ngOnDestroy` unsubscribe — this specific Observable/subscribe usage is
explicitly taught in this module's own notes, Section 6, as the correct
way to read router-provided parameters), child routes, `loadChildren`
lazy loading, and `CanActivate` guards.

**❌ Not introduced:** RxJS `Subject`/`BehaviorSubject`, custom
Observables, RxJS operators (`map`/`switchMap`/etc.), `HttpClient`,
Angular Signals (`signal()`/`computed()`/`effect()`/`input()`/`output()`),
the new `@if`/`@for`/`@switch` control-flow syntax (classic
`*ngIf`/`*ngFor` structural directives were used instead, to match this
module's own notes), or any external state-management library. Confirmed
by grepping the entire `src/app` tree for all of the above — zero matches.

**One deliberate, flagged exception:** `CanDeactivate` (the
`unsavedChangesGuard`) is marked "🔒 Coming Later — Outside This Module" in
this module's own reference notes, but is **explicitly required** by
Task 7 of the actual lab specification ("Add deactivation guards to
prevent users from losing unsaved changes when navigating away"). Since
the task specification is the source of truth, and `CanDeactivate` is
structurally the same mechanism as the already-in-scope `CanActivate`
(a functional guard consulted by the Router, returning `true`/`false`)
just answering "can I leave" instead of "can I enter" — not a new
paradigm like RxJS operators or Signals would be — it was implemented
using the exact same functional-guard pattern this module teaches for
`CanActivate`. This is worth being able to explain plainly to a TA if
asked why it appears despite the notes' scope flag.

---

## Deliverables status

| Deliverable | Status |
|---|---|
| Kanban app with routing/navigation implemented | ✅ Done, verified live |
| Organized routing structure, nav links, and guards | ✅ Done |
| Public GitHub repo with clean history/documentation | ⚠️ Not done by this session — requires pushing to a GitHub remote, which needs explicit authorization; the app is ready to commit whenever you'd like |
| Deployed live app URL (Netlify/Vercel) | ⚠️ Not done by this session — requires an external hosting account/deployment step outside an automated coding session's scope; app builds cleanly and is deploy-ready (`ng build` output verified) |
