# Module 4: Routing & Navigation
### FEM12 — continues from FEM09 (Angular Fundamentals), FEM10 (Component Interaction & Lifecycle), and FEM11 (Services & Dependency Injection)

> **Scope note:** This document covers *only* Module 4 — client-side/SPA routing concepts, configuring the Angular Router (`provideRouter`, and the older `RouterModule.forRoot()`/`forChild()` pattern you'll still see in existing codebases and this module's own quiz), `<router-outlet>`, navigation via `routerLink`/`routerLinkActive` and the `Router` service, route parameters (path params and query params via `ActivatedRoute`), child routes, lazy loading, and `CanActivate` route guards. Anything beyond that — route resolvers, `CanDeactivate`/`CanMatch` in depth, preloading strategies, animated route transitions, testing routed components — is flagged **🔒 Coming Later — Outside This Module**.

---

## How this document is organized

Same documentation-first shape as Modules 1–3:

**What is it? → Why does Angular need it? → How does it work? → Syntax breakdown → Examples → When to use / not use → What happens behind the scenes? → How it connects to other concepts → Try It Yourself → Exercises → Common Mistakes**

Everything ties back to this module's running example: the **Kanban Task Management Web App** (a routing-focused build — boards, board detail views, task detail views, and a settings area, all reachable by URL).

---

## Table of Contents

1. From Module 3 to Module 4: What's New
2. Client-Side Routing: What and Why
3. Configuring the Angular Router
4. `<router-outlet>`
5. Navigation: `routerLink`, `routerLinkActive`, and the `Router` Service
6. Route Parameters
7. Child Routes and Lazy Loading
8. Route Guards: `CanActivate`
9. Putting It Together: Kanban App Routing Architecture
10. Final Module Project: Kanban Task Management Web App
11. Quick Reference Sheet
12. Source & Resource Mapping

---

## 1. From Module 3 to Module 4: What's New

Every app built through Module 3 was, structurally, **one screen**. The Dessert Shop App and the Character Counter App each rendered exactly one component tree, with no concept of "which page am I on" — `AppComponent`'s template was the entire visible application, always.

Real applications are almost never one screen. A Kanban app needs, at minimum: a list of boards, a detail view for one specific board, a detail view for one specific task within that board, and a settings area — each with its own URL, so the browser's back button works, links can be shared, and refreshing the page doesn't lose your place. **Routing** is the Angular feature that maps URLs to components, turning a single component tree into a genuine multi-page experience while keeping the SPA (Single Page Application) benefit of never doing a full page reload.

This module also revisits Module 3's services in a new context: route parameters and guards routinely need to ask a service "does this board exist?" or "is the user allowed here?" — routing is where services stop being an isolated topic and start being load-bearing infrastructure for an app's navigation.

### ✅ Knowledge Check
1. What did every app built in Modules 1–3 have in common, structurally, that a Kanban app with multiple boards and settings cannot get away with?

---

## 2. Client-Side Routing: What and Why

### What is it?

**Client-side routing** is the technique of changing which component is displayed based on the browser's current URL, entirely inside the already-loaded JavaScript application — without asking the server for a new HTML page. The Angular Router is the built-in feature that implements this for Angular apps.

### Why does Angular need this, instead of just using normal links to different HTML pages?

A traditional multi-page site loads a fresh HTML document, CSS, and JavaScript from the server on every navigation — the browser fully tears down and rebuilds the entire page, even for a small change like "show board B instead of board A." For a JavaScript application that's already loaded a large bundle of components and set up state (like a logged-in session or an in-memory cart), a full page reload throws all of that away and starts over, purely to swap out one section of the UI.

Client-side routing avoids this: the Angular application stays loaded, and only the URL and the relevant slice of the component tree change. The result **looks and behaves** like separate pages to the user (unique URLs, working back/forward buttons, bookmarkable links) while **performing** like a single continuously-running application (instant transitions, no flash of a blank page, state that can be preserved across navigations where appropriate).

### How does this work, at a high level?

The Angular Router intercepts navigation — both clicks on specially-marked links and programmatic navigation calls — and, instead of letting the browser make a real HTTP request for a new page, it:
1. Matches the target URL against a configured list of **routes** (URL pattern → component mappings, Section 3).
2. Updates the browser's URL bar (using the browser's History API, so back/forward and bookmarking work correctly) **without** triggering an actual page load.
3. Swaps the component displayed at a designated spot in the template — the `<router-outlet>` (Section 4) — to match the new route.

### Client-side routing vs. what you already know

| | Client-side routing (Angular Router) | A plain `<a href="...">` to a different site/page |
|---|---|---|
| Triggers a full page reload? | No | Yes |
| Preserves in-memory app state across navigation (e.g., an injected service's data)? | Yes, by default (services stay alive unless explicitly torn down) | No — everything resets |
| URL changes, back/forward works? | Yes | Yes |
| Requires a server round-trip for the new "page" itself? | No (only for data the new view needs, e.g., via `HttpClient`, Module 3) | Yes, for the whole document |

### 🎥 Optional Video

**How to route in Angular — Angular Team (4 min)**
[Watch on YouTube](https://www.youtube.com/watch?v=r5DEBMuStPw)
**Useful for:** A concise, official framing of what the Router is for, before any syntax.

**Angular routing video focusing on SPAs (6 min)**
[Watch on YouTube](https://www.youtube.com/watch?v=Sp95tZHS-AM)
**Useful for:** Placing routing specifically in the context of the SPA benefits described above.

### ✅ Knowledge Check
1. In your own words, what does the Angular Router avoid doing that a traditional multi-page website does on every navigation?
2. Why does client-side routing still update the URL bar, even though no real page request is made?

---

## 3. Configuring the Angular Router

### What is a route, precisely?

A **route** is a single entry mapping a URL path pattern to the component that should render when the current URL matches that pattern. A **routing configuration** is simply an array of these mappings.

### The modern (standalone) setup

```typescript
// app.routes.ts
import { Routes } from '@angular/router';
import { BoardListComponent } from './board-list/board-list.component';
import { BoardDetailComponent } from './board-detail/board-detail.component';
import { SettingsComponent } from './settings/settings.component';

export const routes: Routes = [
  { path: '', component: BoardListComponent },
  { path: 'boards/:boardId', component: BoardDetailComponent },
  { path: 'settings', component: SettingsComponent }
];
```

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes)
  ]
};
```

- **`Routes`** — a TypeScript type for "an array of route configuration objects"; importing it gives you autocomplete/type-checking on what each route object can contain.
- **`path: ''`** — matches the application's root URL (e.g., `https://kanban.app/`) — conventionally the "home" view.
- **`path: 'boards/:boardId'`** — matches URLs like `/boards/42`; the `:boardId` segment is a **route parameter**, covered fully in Section 6.
- **`component: BoardDetailComponent`** — which component to render when this route's path matches.
- **`provideRouter(routes)`** — registers the Router with the application, application-wide, at bootstrap — the routing equivalent of Module 3's `provideHttpClient()`.

### The older, `NgModule`-based setup (`RouterModule.forRoot()`/`forChild()`)

Many existing Angular codebases — and this module's own quiz — use an older, still entirely valid pattern built on `NgModule`s rather than the standalone `provideRouter()` shown above:

```typescript
// app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BoardListComponent } from './board-list/board-list.component';

const routes: Routes = [
  { path: '', component: BoardListComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
```

- **`RouterModule.forRoot(routes)`** — used **exactly once**, in the application's root routing module, to register the *application-wide* route configuration and the Router service itself.
- **`RouterModule.forChild(routes)`** — used in every **other** routing module beyond the root (most commonly, a lazy-loaded feature module's own routes, Section 7) — it registers additional routes **without** re-registering the Router service itself a second time.

> ⚠️ **Version note, consistent with earlier modules:** `provideRouter()` (standalone) and `RouterModule.forRoot()`/`forChild()` (`NgModule`-based) solve the *same* problem — registering route configuration — using two different Angular application styles. You will not use both in the same app. This module's quiz specifically tests the `forRoot()`/`forChild()` distinction because it remains extremely common in real-world Angular codebases and interview questions, even in apps that are otherwise fully standalone elsewhere. Know both; use whichever matches the codebase you're actually working in.

### Route matching order matters

```typescript
export const routes: Routes = [
  { path: 'boards/new', component: NewBoardComponent },
  { path: 'boards/:boardId', component: BoardDetailComponent },
  { path: '**', component: NotFoundComponent }
];
```
The Router checks routes **top to bottom** and uses the **first** match. If `boards/:boardId` were listed *before* `boards/new`, a visit to `/boards/new` would incorrectly match `:boardId` (treating the literal word `"new"` as a board id) and never reach the dedicated `NewBoardComponent` route. **Specific, literal paths must come before parameterized ones that could also match them.**

### The wildcard route

```typescript
{ path: '**', component: NotFoundComponent }
```
`'**'` matches **any** URL that didn't match an earlier route — conventionally placed **last**, since routes are matched in order, to catch genuinely unmatched URLs and show a "page not found" view instead of a blank screen.

### Try It Yourself — Experiment: route matching order

Configure three routes: `boards/new` → a `NewBoardComponent` that just displays "Creating a new board"; `boards/:boardId` → a `BoardDetailComponent` that displays "Board ID: " plus whatever `:boardId` resolved to; and `'**'` → a `NotFoundComponent`. Visit `/boards/new` and confirm you see "Creating a new board." Then **swap the order** of the first two routes and reload — watch `/boards/new` now incorrectly show "Board ID: new," directly demonstrating why order matters.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Listing `boards/:boardId` before `boards/new` | The parameterized route greedily matches literal paths that were meant to be handled separately | List specific literal paths before parameterized ones that could also match them | The Router uses the first match, top to bottom |
| Placing the `'**'` wildcard route anywhere but last | Since routes match top-to-bottom and `'**'` matches everything, any route listed after it becomes unreachable | Always place `{ path: '**', ... }` as the final entry | Guarantees more specific routes get a chance to match first |
| Mixing `provideRouter()` in `app.config.ts` **and** `RouterModule.forRoot()` in an `NgModule` in the same app | Registers the Router twice via two incompatible application styles, causing configuration conflicts | Pick one application style (standalone or `NgModule`-based) consistently | Both are complete, self-sufficient ways to register routing — combining them is redundant, not additive |

### ✅ Knowledge Check
1. Why must `{ path: 'boards/new', ... }` be listed before `{ path: 'boards/:boardId', ... }`, and not after?
2. What is `RouterModule.forChild()` for, and how is it different from `RouterModule.forRoot()`?

### 🎥 Optional Video
**Angular Tutorials (General Routing) (45 min)**
[Watch on YouTube](https://www.youtube.com/watch?v=GKHQ5YOaL3Q)
**Useful for:** A full, general-purpose walkthrough of setting up routing from an empty project, reinforcing this section and Sections 4–5.

---

## 4. `<router-outlet>`

### What is it?

`<router-outlet>` is a directive/marker that tells Angular **where** in a template the currently-matched route's component should actually be rendered. It's not a component you write logic for — it's a placeholder the Router fills in dynamically as the URL changes.

### Why does Angular need this?

Something has to mark **where**, inside the persistent, always-visible parts of your layout (a header, a navigation sidebar, a footer), the route-specific content should appear. Without a designated spot, the Router would have no way to know whether a matched component should replace the entire page, get inserted into one particular `<div>`, or something else.

### Syntax breakdown

```typescript
// app.component.ts
import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.component.html'
})
export class AppComponent {}
```
```html
<!-- app.component.html -->
<header>
  <h1>Kanban</h1>
  <nav>
    <a routerLink="/">Boards</a>
    <a routerLink="/settings">Settings</a>
  </nav>
</header>

<main>
  <router-outlet></router-outlet>
</main>
```
- **`imports: [RouterOutlet, RouterLink]`** — in standalone Angular, `<router-outlet>` and `routerLink` (Section 5) are directives that must be explicitly imported into any component's template that uses them, exactly like importing a child component (Module 1) — they are not available automatically just because routing is configured.
- **`<router-outlet></router-outlet>`** — wherever this tag sits in the template, that's where the Router inserts whichever component matches the current URL. The `<header>` above it stays visible on every route, since it's outside the outlet entirely.

### What happens behind the scenes?

Every time the matched route changes (a link is clicked, `Router.navigate()` is called, or the user uses the browser's back/forward buttons), Angular:
1. Determines which component the new URL matches, from the route configuration (Section 3).
2. Destroys the component instance currently rendered inside `<router-outlet>` (running its `ngOnDestroy`, Module 2 — a real, practical reason that hook matters, since a routed-away-from component is destroyed exactly like an `*ngIf`-removed one).
3. Creates a fresh instance of the newly-matched component and renders it in that same spot.

This means **routed components go through the exact same lifecycle hooks you already know** (`ngOnChanges`, `ngOnInit`, `ngOnDestroy` from Module 2) — routing doesn't introduce a new lifecycle, it's simply another reason a component gets created or destroyed.

### Multiple outlets (brief mention)

A template can have more than one `<router-outlet>` by giving secondary ones a `name` attribute (`<router-outlet name="sidebar">`), letting you render two independent routed regions at once. This is a real Angular Router feature; a full treatment of **named/auxiliary outlets** is **🔒 outside this module's core scope** — this module's Kanban app only needs a single, primary, unnamed outlet.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Forgetting to import `RouterOutlet` into a standalone component's `imports: [...]` | `<router-outlet>` in the template has no meaning without the directive being available to that component | Add `RouterOutlet` to `imports: [...]` | Registers the directive the template is using |
| Expecting content **outside** `<router-outlet>` (like the `<header>` above) to change between routes | Only what's *inside* the outlet is swapped by the Router — everything else in the template is unaffected by navigation | Put persistent layout (headers, nav, footers) outside the outlet; put only what should change per-route inside it | Matches the outlet's actual job: marking the one region that swaps |
| Assuming a routed-out component's state (e.g., unsaved form input) survives navigating away and back | The component is destroyed (Section 4, step 2 above) when routed away from, and a fresh instance is created on return — nothing is preserved automatically | If state must survive navigation, keep it in a service (Module 3), not the component itself | Services outlive the components that inject them, exactly as established in Module 3 |

### ✅ Knowledge Check
1. If a `<header>` sits outside `<router-outlet>` in `AppComponent`'s template, does it change when the user navigates to a different route? Why or why not?
2. Why does a component rendered inside `<router-outlet>` still go through `ngOnInit`/`ngOnDestroy` exactly like any other component?

---

## 5. Navigation: `routerLink`, `routerLinkActive`, and the `Router` Service

There are two distinct ways to trigger navigation, matching two distinct situations: a user clicking a link (declarative, in the template), and code deciding to navigate as the result of some logic (programmatic, in the class).

### `routerLink` — declarative navigation from a template

```html
<nav>
  <a routerLink="/">Boards</a>
  <a routerLink="/settings">Settings</a>
  <a [routerLink]="['/boards', board.id]">{{ board.name }}</a>
</nav>
```
- **`routerLink="/settings"`** — a plain string path, used when the destination is fixed/known ahead of time. This looks like a normal HTML attribute, but `routerLink` is actually an Angular directive intercepting the click — clicking this anchor does **not** trigger a real browser navigation/page reload, even though it renders as a normal `<a>` tag (which matters for accessibility: it's still keyboard-focusable and works with "open in new tab," unlike a `(click)` handler on a `<div>` would).
- **`[routerLink]="['/boards', board.id]"`** — property binding (Module 1 syntax) is used instead of the plain string form whenever part of the path is dynamic. The array form `['/boards', board.id]` builds the path segment by segment; Angular joins them into `/boards/42`, for example.

### Why `routerLink` instead of a plain `href`?

```html
<!-- ❌ triggers a full page reload, defeating the entire point of client-side routing -->
<a href="/boards/42">Board 42</a>

<!-- ✅ Router intercepts the click, no reload -->
<a routerLink="/boards/42">Board 42</a>
```
This is one of the most consequential small details in this whole module: a plain `href` to an internal route works *visually* but throws away every SPA benefit described in Section 2 — it makes an actual server request, reloading the whole application from scratch.

### `routerLinkActive` — styling the current route's link

```html
<a routerLink="/" routerLinkActive="active-link" [routerLinkActiveOptions]="{ exact: true }">
  Boards
</a>
<a routerLink="/settings" routerLinkActive="active-link">
  Settings
</a>
```
- **`routerLinkActive="active-link"`** — automatically adds the CSS class `active-link` to this element whenever its `routerLink` matches the current URL — the routing equivalent of Module 1's `ngClass`, but driven by the current route instead of a component property.
- **`[routerLinkActiveOptions]="{ exact: true }"`** — without this, a link to `/` would count as "active" for *every* route (since every path technically starts with `/`) — `exact: true` restricts the match to exactly `/`, which is almost always what you want for a "home" link specifically.

### The `Router` service — programmatic navigation

```typescript
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({ /* ... */ })
export class BoardCreateComponent {
  constructor(private router: Router) {}

  onSave(newBoardId: number): void {
    // ... save logic (e.g., via a service, Module 3) ...
    this.router.navigate(['/boards', newBoardId]);
  }
}
```
`Router` is injected exactly like any Module 3 service (it's registered by `provideRouter()`/`RouterModule.forRoot()` behind the scenes). Use this when navigation must happen **as a result of code running**, not a direct user click on a link — the canonical example being "after successfully saving a new board, navigate to that board's detail page."

### Three concrete examples of when to choose which

**Example 1 — a static navigation link** → `routerLink`:
```html
<a routerLink="/settings">Settings</a>
```

**Example 2 — a link built from dynamic data in a `*ngFor` list** → `routerLink` with a binding:
```html
<li *ngFor="let board of boards">
  <a [routerLink]="['/boards', board.id]">{{ board.name }}</a>
</li>
```

**Example 3 — navigation after an action completes (not a direct link click)** → the `Router` service:
```typescript
onDeleteBoard(boardId: number): void {
  this.boardService.delete(boardId);
  this.router.navigate(['/']); // no link was clicked — navigation is a consequence of deleting
}
```

### Passing query parameters programmatically

```typescript
this.router.navigate(['/boards'], { queryParams: { sort: 'recent' } });
// navigates to: /boards?sort=recent
```
Covered fully alongside path parameters in Section 6.

### Try It Yourself — Experiment: `href` vs. `routerLink`

Build two links to the same internal route, one with `href="/settings"` and one with `routerLink="/settings"`. Add a `console.log('AppComponent constructed')` in `AppComponent`'s constructor. Click the `href` link and observe the log re-printing (proving a full reload happened, resetting the whole application); click the `routerLink` version and observe the log does **not** re-print (proving the application stayed alive and only the routed content changed).

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| `<a href="/boards/42">` for internal navigation | Triggers a full page reload, discarding all in-memory app state and defeating client-side routing entirely | `<a routerLink="/boards/42">` | Router intercepts the click; no reload occurs |
| `routerLink="/boards" + board.id` (string concatenation in a plain attribute) | `routerLink` as a plain (non-bound) attribute only accepts a literal string — string concatenation like this doesn't evaluate as an expression | `[routerLink]="['/boards', board.id]"` | Property binding evaluates the array expression, letting the Router build the path from dynamic values |
| Forgetting `[routerLinkActiveOptions]="{ exact: true }"` on a "home" (`/`) link | The home link appears "active" on every single route, since every path starts with `/` | Add `{ exact: true }` for links to `/` specifically | Restricts the active-match to an exact, full match rather than a prefix match |
| Calling `this.router.navigate(...)` from a template's `(click)`, when a plain `routerLink` would do | Works, but adds unnecessary component method/logic for what's really just a static link | Use `routerLink` directly for simple, direct link clicks; reserve the `Router` service for navigation that's a *consequence* of other logic | Keeps the simpler declarative tool as the default, and the imperative one for when it's actually needed |

### ✅ Knowledge Check
1. Why does a plain `href` to an internal route defeat the purpose of client-side routing, even though the link visually still "works"?
2. Give one example (different from this section's) of navigation that should use the `Router` service instead of `routerLink`, and explain why.

### 🎥 Optional Video
**Angular 17 Routing for Beginners (39 min)**
[Watch on YouTube](https://www.youtube.com/watch?v=lIb_gnleUns)
**Useful for:** A modern, practical walkthrough covering `routerLink` and route parameters together — good reinforcement heading into Section 6.

---

## 6. Route Parameters

### What is a route parameter?

A **route parameter** is a dynamic segment of a URL path — written as `:name` in the route configuration — that captures part of the actual URL as data your component can read. `boards/:boardId` matched against `/boards/42` captures `boardId = '42'`.

### Why does Angular need this, instead of a separate route per board?

Hard-coding a route per board (`boards/1`, `boards/2`, `boards/3`, ...) is obviously unworkable — the set of boards is dynamic, user-created data, not something known when the app is built. A route parameter lets **one** route definition (`boards/:boardId`) match **any** board id, with the component reading whichever specific id was actually visited.

### Reading a route parameter — two ways

**Option A — snapshot (read once)**
```typescript
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({ /* ... */ })
export class BoardDetailComponent implements OnInit {
  boardId!: string;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.boardId = this.route.snapshot.paramMap.get('boardId')!;
  }
}
```
`route.snapshot` gives you the route's parameters **as they were at the moment this component was created** — a one-time read, deliberately parallel to Module 2's `ngOnInit` (one-time setup). This is correct **only if navigating from one board directly to a different board never reuses the same component instance** — which is not always true (see Option B).

**Option B — the reactive `paramMap` Observable (react to changes)**
```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({ /* ... */ })
export class BoardDetailComponent implements OnInit, OnDestroy {
  boardId!: string;
  private subscription?: Subscription;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.subscription = this.route.paramMap.subscribe((params) => {
      this.boardId = params.get('boardId')!;
      this.loadBoard(this.boardId);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private loadBoard(id: string): void {
    // fetch/display the board with this id
  }
}
```
This should look immediately familiar: it's the **exact same Observable/`subscribe`/`ngOnDestroy` pattern Module 3, Section 7 used for `HttpClient`**, applied to route parameters instead of HTTP responses. `route.paramMap` is an Observable that emits a **new** value every time the route's parameters change — including navigating from `/boards/1` directly to `/boards/2` while Angular reuses the *same* `BoardDetailComponent` instance (a real, common optimization the Router performs, since both URLs match the identical route configuration).

### Why Option B matters: the reuse trap

If `BoardDetailComponent` only used `route.snapshot` (Option A) and the user navigated from a link on the *board detail page itself* to a *different* board (`/boards/1` → `/boards/2`), Angular may reuse the same component instance rather than destroying and recreating it — meaning `ngOnInit` does **not** run again, and a snapshot-only read would keep showing board 1's data forever, silently. This is a direct, practical echo of Module 2's core lesson (`ngOnInit` runs once; use `ngOnChanges`/an Observable subscription to react to values that change afterward) — now applied to the Router's own data instead of a parent component's `@Input()`.

> **Rule of thumb:** if the same routed component can ever be reached again with *different* parameter values without being destroyed in between (very common for detail-view patterns like a board or task viewer), use the reactive `paramMap` Observable, not the snapshot.

### Query parameters

Query parameters (`?sort=recent&filter=open`) work similarly but represent optional, non-path data — filters, sort order, pagination — rather than identifying *which* resource to show.

```typescript
// reading
this.route.queryParamMap.subscribe((params) => {
  const sort = params.get('sort'); // 'recent' or null if absent
});
```
```typescript
// writing, via routerLink
<a [routerLink]="['/boards']" [queryParams]="{ sort: 'recent' }">Recent boards</a>

// writing, programmatically
this.router.navigate(['/boards'], { queryParams: { sort: 'recent' } });
```

### Three worked examples together

**Example 1 — a board detail page reading a path parameter (reactive):**
```typescript
this.route.paramMap.subscribe((params) => {
  this.boardId = params.get('boardId')!;
});
```

**Example 2 — a task detail page nested under a board (two path parameters at once):**
```typescript
// route config: { path: 'boards/:boardId/tasks/:taskId', component: TaskDetailComponent }
this.route.paramMap.subscribe((params) => {
  this.boardId = params.get('boardId')!;
  this.taskId = params.get('taskId')!;
});
```

**Example 3 — a board list page reading an optional query parameter for sorting:**
```typescript
this.route.queryParamMap.subscribe((params) => {
  this.sortOrder = params.get('sort') ?? 'default';
});
```

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Reading `route.snapshot.paramMap` for a component that can be re-navigated to with a new parameter value without being destroyed | The value silently never updates after the first read — a direct parallel to Module 2's `ngOnInit`-only mistake | Subscribe to `route.paramMap` (or `route.queryParamMap`) instead | Emits a new value every time the relevant parameters actually change |
| Forgetting to unsubscribe from `route.paramMap`/`queryParamMap` in `ngOnDestroy` | Same resource-leak pattern as Module 2's timers and Module 3's HTTP subscriptions | Store the subscription and call `.unsubscribe()` in `ngOnDestroy` | Matches the cleanup pattern already established for every other Observable in this course |
| Using path parameters for optional, non-identifying data (like a sort order) | Bloats the path structure and conflates "which resource" with "how to display it" | Use query parameters for optional/filter-like data; reserve path parameters for identifying *which* resource | Keeps URLs meaningful: `/boards/42?sort=recent` reads clearly as "board 42, sorted recently" |
| Forgetting the `!` (or a null check) after `.get('boardId')` | `paramMap.get()` returns `string | null` — TypeScript will flag using it as a plain `string` without acknowledging the `null` case | Use `!` only when you're certain the route guarantees the parameter exists (as with a required path segment), or handle `null` explicitly otherwise | Matches the actual return type honestly |

### Exercises

**Level 1 — Basic:** Configure a route `boards/:boardId`, and in `BoardDetailComponent`, display "You are viewing board {{ boardId }}" using the snapshot approach.

**Level 2 — Practical:** Convert the above to use the reactive `paramMap` Observable instead, and add a "Next Board" link (`[routerLink]="['/boards', boardId + 1]"`) directly inside `BoardDetailComponent`'s own template, then click it repeatedly and confirm the displayed id updates correctly every time — proving the reuse trap is genuinely handled.

**Level 3 — Challenge:** Configure a nested parameter route `boards/:boardId/tasks/:taskId`, read both parameters reactively in `TaskDetailComponent`, and add a query-parameter-driven "back to board, sorted by:" link that preserves a `sort` query parameter across the navigation.

### ✅ Knowledge Check
1. What's the practical risk of using `route.snapshot.paramMap` for a component the Router might reuse across parameter changes?
2. When should you use a query parameter instead of a path parameter?

---

## 7. Child Routes and Lazy Loading

### Child (nested) routes

**What is it?** A **child route** is a route configuration nested inside a parent route, rendered inside a `<router-outlet>` that belongs to the *parent's own component* — letting a URL like `/boards/42/tasks/7` render `BoardDetailComponent`'s layout (a header showing the board name, a column layout) with `TaskDetailComponent` appearing inside *that* layout, rather than replacing it entirely.

```typescript
export const routes: Routes = [
  {
    path: 'boards/:boardId',
    component: BoardDetailComponent,
    children: [
      { path: 'tasks/:taskId', component: TaskDetailComponent }
    ]
  }
];
```
```html
<!-- board-detail.component.html -->
<h2>Board {{ boardId }}</h2>
<div class="board-columns">
  <!-- ... column/task-list markup ... -->
</div>

<!-- a SECOND, nested router-outlet, specifically for this route's children -->
<router-outlet></router-outlet>
```
`BoardDetailComponent` needs its **own** `<router-outlet>` (imported into its own `imports: [...]`, exactly as in Section 4) for the `children` array to have anywhere to render `TaskDetailComponent`. Visiting `/boards/42` alone shows just `BoardDetailComponent`, with its inner outlet empty; visiting `/boards/42/tasks/7` shows `BoardDetailComponent`'s layout **plus** `TaskDetailComponent` rendered inside it.

### Why use child routes instead of one flat route per view?

Child routes let a shared layout/frame (the board's header and column structure) stay mounted while only the more specific, nested content changes — visiting different tasks within the same board doesn't need to re-render the entire board layout each time, and the URL structure (`/boards/42/tasks/7`) honestly reflects the actual UI nesting (a task is *inside* a board).

### Lazy loading

**What is it?** **Lazy loading** defers downloading a whole feature's code (its components, and everything they import) until the user actually navigates to a route that needs it, instead of including it in the application's initial bundle.

**Why does Angular need this?** Every component, service, and dependency your app imports normally gets bundled into the JavaScript the browser must download **before** the app can start at all. For a Kanban app, the "Settings" area might be a whole feature with several components — if a user only ever looks at boards and never opens Settings, they've still paid the download cost for it on every visit, unnecessarily slowing down the *initial* load. Lazy loading defers that cost until (and unless) it's actually needed.

**Modern (standalone) lazy loading, via `loadChildren`:**
```typescript
// app.routes.ts
export const routes: Routes = [
  { path: '', component: BoardListComponent },
  {
    path: 'settings',
    loadChildren: () => import('./settings/settings.routes').then((m) => m.SETTINGS_ROUTES)
  }
];
```
```typescript
// settings/settings.routes.ts
import { Routes } from '@angular/router';
import { SettingsComponent } from './settings.component';

export const SETTINGS_ROUTES: Routes = [
  { path: '', component: SettingsComponent }
];
```
- **`loadChildren: () => import(...)`** — `import(...)` here is a **dynamic import**, a plain JavaScript/TypeScript feature (not Angular-specific) that returns a Promise resolving to a module, only actually fetched over the network the first time it's needed.
- **`.then((m) => m.SETTINGS_ROUTES)`** — once that dynamic import resolves, the Router uses the named export (`SETTINGS_ROUTES`) as this section's own routes.

**Older, `NgModule`-based lazy loading (why `forChild()` exists):**
```typescript
// settings-routing.module.ts
const routes: Routes = [{ path: '', component: SettingsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SettingsRoutingModule {}
```
```typescript
// app-routing.module.ts
const routes: Routes = [
  {
    path: 'settings',
    loadChildren: () => import('./settings/settings.module').then((m) => m.SettingsModule)
  }
];
```
This is precisely why `RouterModule.forChild()` (Section 3) exists as a *separate* method from `forRoot()`: a lazily-loaded feature module registers its **own** routes via `forChild()` without re-registering (and re-initializing) the Router service a second time — `forRoot()` is reserved for the one, application-wide root registration.

### What happens behind the scenes?

Until a user actually navigates to `/settings`, none of `SettingsComponent`'s code (or anything it imports) is included in what the browser downloads to start the app. The **first** navigation to `/settings` triggers the dynamic `import(...)`, the browser fetches that additional JavaScript chunk over the network, and *then* the Router renders the resulting component — a small, one-time delay on that first visit, in exchange for a smaller, faster initial load for everyone, including users who never visit Settings at all.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| A parent route with `children: [...]` but no second `<router-outlet>` in the parent's own template | Angular has nowhere to render the matched child route's component | Add a `<router-outlet>` inside the parent component's own template | Gives the nested route configuration a place to render |
| Using `loadChildren` but importing the component class directly elsewhere in the same file/module | Directly importing the component anywhere outside the dynamic `import()` pulls it back into the main bundle, defeating lazy loading entirely | Keep the lazily-loaded feature's components/services only ever imported *through* the dynamic `import()` path | Preserves the separate, on-demand bundle the lazy route is meant to create |
| Using `RouterModule.forRoot()` inside a lazily-loaded feature module | Re-initializes/re-registers the Router service, which should only happen once, at the true application root | Use `RouterModule.forChild()` in every routing module except the one true root | Matches each method to its actual, distinct job |

### ✅ Knowledge Check
1. Why does a parent route with `children: [...]` need its own `<router-outlet>`, separate from the root one in `AppComponent`?
2. In one sentence, what problem does lazy loading solve for a user who never visits the Settings area of the Kanban app?

### 🎥 Optional Video
This module's provided resources cover lazy loading primarily through the official Angular guide (linked in Section 12) rather than a dedicated video — the official guide's lazy-loading section is worth reading directly alongside this section for the most current dynamic-import syntax, since this is an area where Angular's recommended approach has evolved the fastest across versions.

---

## 8. Route Guards: `CanActivate`

### What is a route guard?

A **route guard** is a function (or, in older Angular, a class) that the Router consults **before** activating a route, deciding whether navigation should actually be allowed to proceed. `CanActivate` is the guard type that answers specifically: "is the user allowed to navigate **to** this route at all?"

### Why does Angular need this?

Some routes shouldn't be reachable under every condition — a Kanban app's board detail page might require the user to be "logged in" (🔒 real authentication is outside this module, but the *guard mechanism* is exactly what a later authentication module would plug into), or a board might need to actually exist before its detail page is shown. Without guards, the only way to enforce this would be scattering manual checks (and manual `Router.navigate()` redirects) inside every affected component's `ngOnInit` — guards centralize that logic in one place, run automatically by the Router itself, before the component is even created.

### The modern, functional guard pattern

```typescript
// auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
```
- **`CanActivateFn`** — a type for "a function the Router can use as a `CanActivate` guard." A guard is just a plain function, not a class needing its own `@Injectable()`/constructor injection.
- **`inject(AuthService)`** — `inject()` is a function-based way to obtain a service *outside* a constructor, valid here because guard functions run in Angular's injection context when the Router calls them. It accomplishes the same goal as constructor injection (Module 3) — obtaining a shared service instance — just with syntax appropriate for a plain function rather than a class.
- **Returning `true`** — navigation is allowed to proceed.
- **Returning `false`** (after redirecting elsewhere) — navigation to the *originally requested* route is blocked.

### Applying a guard to a route

```typescript
export const routes: Routes = [
  { path: '', component: BoardListComponent },
  {
    path: 'boards/:boardId',
    component: BoardDetailComponent,
    canActivate: [authGuard]
  },
  { path: 'settings', component: SettingsComponent, canActivate: [authGuard] }
];
```
`canActivate: [authGuard]` accepts an **array**, since more than one guard can apply to the same route — the Router runs them in order and requires **all** of them to allow navigation (`true`) before proceeding.

### The older, class-based guard pattern (still valid, still seen in existing code)

```typescript
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.isLoggedIn()) {
      return true;
    }
    this.router.navigate(['/login']);
    return false;
  }
}
```
```typescript
{ path: 'settings', component: SettingsComponent, canActivate: [AuthGuard] }
```
This is a full, `@Injectable()` service (Module 3) implementing the `CanActivate` interface, using ordinary constructor injection instead of the newer `inject()` function. Functionally equivalent to the guard above — the class-based form is what most existing tutorials/codebases (and this module's own quiz, which asks specifically about "the `CanActivate` guard interface") were written against, so recognizing both forms matters.

### Three worked guard scenarios

**Example 1 — requiring login** (shown above): redirect to `/login` if not authenticated.

**Example 2 — verifying a resource exists, using a route parameter and a service together:**
```typescript
export const boardExistsGuard: CanActivateFn = (route) => {
  const boardService = inject(BoardService);
  const router = inject(Router);
  const boardId = route.paramMap.get('boardId')!;

  if (boardService.exists(boardId)) {
    return true;
  }
  router.navigate(['/not-found']);
  return false;
};
```
Notice the guard function receives the target route as its first argument, giving it access to the same `paramMap` used in Section 6 — guards run with full knowledge of *which* specific route was requested, not just "was a route requested."

**Example 3 — a simple, always-true guard for demonstration/testing purposes:**
```typescript
export const alwaysAllowGuard: CanActivateFn = () => true;
```
Useful while first wiring up `canActivate` on a route, to confirm the guard is being called at all, before adding real logic.

### 🔒 Coming Later — Outside This Module
- `CanDeactivate` (confirming navigation *away* from a route, e.g., "you have unsaved changes")
- `CanMatch` (deciding whether a route configuration even applies, before matching)
- Route resolvers (pre-fetching data before a route activates)
- Real authentication systems (token storage, refresh, interceptor-based header attachment — Module 3's `HttpClient` interceptors were already flagged as outside that module's scope, and remain so here)

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| A guard that returns `false` with no redirect | Silently blocks navigation with no feedback to the user — they click a link and simply... nothing happens | Always pair a `false` return with a `router.navigate([...])` redirect somewhere sensible | Gives the user an actual destination instead of a dead end |
| Forgetting `canActivate: [guardName]` on the route itself | The guard function/class exists but is never actually consulted — guards do nothing unless attached to a route | Add `canActivate: [authGuard]` to every route that needs protecting | The Router only runs guards it's explicitly told about, per route |
| Using `inject()` outside a valid injection context (e.g., inside a plain, unrelated helper function called from deep inside unrelated code) | `inject()` only works within specific contexts Angular sets up for it — a guard function called by the Router is one such valid context, but arbitrary functions are not | Use `inject()` only inside guard functions (or other Angular-recognized injection contexts); use constructor injection in classes | Matches the tool to contexts Angular actually supports |
| Assuming a guard blocking one route also blocks its child routes automatically | Guards apply to the specific route they're attached to; child routes need their own `canActivate` if they also require protection (though a common pattern is to guard the parent and let children inherit access implicitly through it) | Attach guards deliberately at whichever level of the route tree actually needs protecting | Keeps guard coverage intentional rather than assumed |

### ✅ Knowledge Check
1. What should always accompany a guard's `false` return value, and why?
2. What is the practical difference between the functional (`CanActivateFn`) and class-based (`implements CanActivate`) guard patterns, and why does this module cover both?

---

## 9. Putting It Together: Kanban App Routing Architecture

```
Route configuration (app.routes.ts)
 │
 ├── path: ''                          → BoardListComponent
 │                                        (routerLink from here into a board)
 │
 ├── path: 'boards/:boardId'           → BoardDetailComponent   [canActivate: authGuard]
 │      children:
 │        path: 'tasks/:taskId'        → TaskDetailComponent
 │                                        (rendered in BoardDetailComponent's OWN
 │                                         <router-outlet>, nested inside its layout)
 │
 └── path: 'settings'                  → lazy-loaded via loadChildren   [canActivate: authGuard]
        (SettingsComponent's code isn't downloaded until this route is visited)

AppComponent (root)
 │  - persistent <header>/<nav> using routerLink + routerLinkActive
 │  - one root <router-outlet> for path '', 'boards/:boardId', and 'settings'

BoardDetailComponent
 │  - reads :boardId reactively (route.paramMap.subscribe), NOT via snapshot,
 │    since navigating board-to-board reuses this same component instance
 │  - injects BoardService (Module 3 pattern) to load that board's data
 │  - has its OWN <router-outlet> for the nested :taskId child route
 │  - "Next/Previous board" links use [routerLink] built from board.id

authGuard (functional CanActivate)
 │  - protects 'boards/:boardId' and 'settings'
 │  - injects AuthService (Module 3 pattern) via inject()
 │  - redirects to '/login' (a route outside this diagram, left as an exercise)
```

**How every prior module shows up here:** `BoardService`/`AuthService` are Module 3 services, injected via constructor injection in components and via `inject()` in the guard. `BoardDetailComponent`'s reactive parameter handling and subscription cleanup use the exact `Observable`/`subscribe`/`ngOnDestroy` pattern Module 3 established for `HttpClient`. The Router creating/destroying routed components as the user navigates exercises the same `ngOnInit`/`ngOnDestroy` lifecycle Module 2 taught, just triggered by URL changes instead of `*ngIf`.

---

## 10. Final Module Project: Kanban Task Management Web App

### Project Requirements

Build a simplified, routing-focused Kanban app: a list of boards, a board detail view, a nested task detail view, and a settings area — all reachable and shareable by URL.

### Functional Requirements

1. A root layout (`AppComponent`) with a persistent header/nav using `routerLink` and `routerLinkActive` (with `{ exact: true }` correctly applied to the "home"/board-list link), and a single root `<router-outlet>`.
2. A board-list route (`''`) showing all boards, each linking to its detail page via `[routerLink]="['/boards', board.id]"`.
3. A board-detail route (`'boards/:boardId'`) that:
   - Reads `:boardId` **reactively** (`route.paramMap.subscribe`), not via snapshot.
   - Correctly unsubscribes in `ngOnDestroy`.
   - Has its own `<router-outlet>` for a nested child route.
4. A nested task-detail child route (`'tasks/:taskId'` under the board route) reading both `:boardId` and `:taskId`.
5. A settings route (`'settings'`), lazy-loaded via `loadChildren`, so its code is not part of the initial bundle.
6. A `CanActivate` guard (functional or class-based) protecting at least one route, with a genuine redirect on denial (a simple `AuthService` with a hard-coded `isLoggedIn()` for this module's purposes is sufficient — 🔒 real authentication is a later module).
7. A wildcard (`'**'`) route showing a "not found" view for unmatched URLs.
8. Route ordering that correctly places any literal paths before parameterized ones that could otherwise conflict.

### Suggested Route Structure

```
'' → BoardListComponent
'boards/:boardId' → BoardDetailComponent (canActivate: authGuard)
    children: 'tasks/:taskId' → TaskDetailComponent
'settings' → lazy-loaded (canActivate: authGuard)
'**' → NotFoundComponent
```

### Required Angular Concepts (checklist)

- [ ] `provideRouter()` (or `RouterModule.forRoot()`) configured at the application root
- [ ] `<router-outlet>` in the root layout, plus a second, nested one in `BoardDetailComponent`
- [ ] `routerLink` for all direct link clicks; `Router.navigate()` reserved for navigation that's a consequence of other logic (e.g., after a guard redirect, or after a save/delete action)
- [ ] `routerLinkActive` with `{ exact: true }` correctly applied where needed
- [ ] Route parameters read reactively via `paramMap`, with correct `ngOnDestroy` cleanup
- [ ] At least one child (nested) route
- [ ] Lazy loading via `loadChildren` for at least one feature area
- [ ] At least one `CanActivate` guard, correctly attached via `canActivate: [...]` on a route
- [ ] A wildcard route, placed last

### Acceptance Criteria

- Every route is directly reachable by typing its URL, refreshing the page, and seeing the correct view (not a blank screen) — proof the routing configuration, not just in-app link clicks, is correct.
- Navigating between boards via an in-page "next board" style link updates the displayed board without a full page reload, and correctly updates if the component is reused (no stale data from the previous board).
- Visiting the Settings route triggers a separate network request for its JavaScript chunk (visible in the browser's Network tab) that does **not** occur on initial app load.
- A route protected by the guard correctly redirects when the guard's condition is false, and correctly allows navigation when it's true.
- Visiting a nonsense URL shows the "not found" view, not a blank page or a console error.

### Hints (if stuck)

- Build the board-list → board-detail flow first, with **no** guard and **no** lazy loading, and confirm it works end to end before adding either — each adds its own point of failure, and isolating them makes debugging far easier.
- If a "next board" link doesn't seem to update the display, you're very likely reading `route.snapshot` instead of subscribing to `route.paramMap` — this is the single most common bug in this module's lab, and Section 6 covers exactly why.
- If lazy loading doesn't seem to reduce the initial bundle, double-check that nothing outside the lazy route's own files imports the lazy-loaded component directly anywhere else — a single stray direct import anywhere else in the app pulls it back into the main bundle.

### Optional Stretch Challenges

- Add a second guard type demonstrating a different condition (e.g., a `boardExistsGuard` like Section 8's Example 2), and apply both guards together on the same route (`canActivate: [authGuard, boardExistsGuard]`).
- Add a query-parameter-driven sort/filter to the board list, preserved across navigation to a board and back.
- Add a "Create Board" flow using `Router.navigate()` programmatically after a successful save, rather than a direct `routerLink`, to practice the distinction from Section 5.

---

## 11. Quick Reference Sheet

### Router Setup
```
// Standalone (modern)
provideRouter(routes)                    In app.config.ts's providers array

// NgModule-based (older, still common)
RouterModule.forRoot(routes)             Root routing module ONLY, once
RouterModule.forChild(routes)            Every OTHER routing module (incl. lazy-loaded features)
```

### Route Configuration
```
{ path: '', component: X }               Exact match for the root URL
{ path: 'boards/:boardId', component: X }  Dynamic path parameter
{ path: 'boards/new', component: X }     Literal paths BEFORE params that could conflict
{ path: '**', component: NotFound }      Wildcard — always LAST
```

### Template
```
<router-outlet></router-outlet>          Where the matched route's component renders
<a routerLink="/settings">               Static declarative navigation
<a [routerLink]="['/boards', id]">       Dynamic declarative navigation
<a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
```

### Programmatic Navigation
```
constructor(private router: Router) {}
this.router.navigate(['/boards', id]);
this.router.navigate(['/boards'], { queryParams: { sort: 'recent' } });
```

### Reading Parameters
```
constructor(private route: ActivatedRoute) {}

// one-time (only safe if the component is never reused across param changes)
this.route.snapshot.paramMap.get('boardId')

// reactive (the default-safe choice) — mirrors Module 3's HttpClient/subscribe pattern
this.route.paramMap.subscribe(params => { ... });
this.route.queryParamMap.subscribe(params => { ... });
// + unsubscribe in ngOnDestroy
```

### Child Routes & Lazy Loading
```
{ path: 'boards/:boardId', component: X, children: [
    { path: 'tasks/:taskId', component: Y }
] }
// requires a SECOND <router-outlet> inside X's own template

{ path: 'settings', loadChildren: () => import('./settings/settings.routes')
    .then(m => m.SETTINGS_ROUTES) }
```

### Route Guards
```
// Functional (modern)
export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  return someCondition || (router.navigate(['/login']), false);
};

// Class-based (older)
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  canActivate(): boolean { ... }
}

// Applying either:
{ path: 'settings', component: X, canActivate: [authGuard] }
```

### Important Terminology

| Term | Definition |
|---|---|
| **Client-side routing** | Changing the displayed component based on the URL without a full page reload. |
| **Route** | A single URL-pattern-to-component mapping. |
| **`<router-outlet>`** | The template marker showing where the matched route's component renders. |
| **`routerLink`** | The directive for declarative, in-template navigation links. |
| **`routerLinkActive`** | Automatically applies a CSS class to a link matching the current route. |
| **`Router` service** | Injectable service for programmatic navigation. |
| **Route parameter** | A dynamic URL segment (`:name`) captured as data. |
| **`ActivatedRoute`** | Injectable service giving a routed component access to its own route's parameters. |
| **Query parameter** | Optional, non-identifying URL data (`?sort=recent`). |
| **Child (nested) route** | A route rendered inside its parent route's own `<router-outlet>`. |
| **Lazy loading** | Deferring a feature's code download until its route is actually visited. |
| **`loadChildren`** | The route property triggering a dynamic `import()` for lazy loading. |
| **Route guard** | A function/class the Router consults before allowing navigation. |
| **`CanActivate`** | The guard type answering "is this route allowed to be entered?" |

### 🔒 Coming Later — Outside This Module
`CanDeactivate` · `CanMatch` · Route resolvers · Named/auxiliary outlets in depth · Real authentication (token storage/refresh, HTTP interceptors) · Preloading strategies · Animated route transitions · Testing routed components/guards

---

## 12. Source & Resource Mapping

| Module Topic | Source Resource | Knowledge Extracted |
|---|---|---|
| Routing fundamentals, full reference | Angular.io — "Routing & Navigation" | Primary source for route configuration, `<router-outlet>`, `routerLink`, parameters, lazy loading, guards |
| Beginner-friendly routing walkthrough | dev.to — "Angular Routing and Navigation Made So Easy" | Reinforcement for Sections 3 and 5 |
| Practical routing overview | Medium — "Routing in Angular" | `RouterModule`/`routerLink` usage examples |
| Router purpose (official, concise) | YouTube — Angular Team, "How to route in Angular" (4 min) | Section 2's framing |
| SPA-specific routing explanation | YouTube — "Angular routing video focusing on SPAs" (6 min) | Section 2's SPA-benefit comparison |
| General routing setup walkthrough | YouTube — "Angular Tutorials (General Routing)" (45 min) | Reinforcement for Section 3 |
| Comprehensive router reference (params, lazy loading, guards) | angular.love — "Angular Router: Everything You Need to Know" | Cross-cutting source for Sections 6–8 |
| Modern routing + route parameters walkthrough | YouTube — "Angular 17 Routing for Beginners" (39 min) | Section 5–6 reinforcement |

**Quick links for deeper reading (optional, not required to complete this module):**
- [Routing & Navigation — Angular.io](https://angular.io/guide/router)
- [Angular Routing and Navigation Made So Easy — dev.to](https://dev.to/chukwuma1976/angular-routing-and-navigation-made-so-easy-a-child-could-do-it-4oem)
- [Routing in Angular — Medium](https://medium.com/@jaydeepvpatil225/routing-in-angular-924066bde43)
- [How to route in Angular — YouTube](https://www.youtube.com/watch?v=r5DEBMuStPw)
- [Angular routing video focusing on SPAs — YouTube](https://www.youtube.com/watch?v=Sp95tZHS-AM)
- [Angular Tutorials (General Routing) — YouTube](https://www.youtube.com/watch?v=GKHQ5YOaL3Q)
- [Angular 17 Routing for Beginners — YouTube](https://www.youtube.com/watch?v=lIb_gnleUns)

---

### Discussion Prompt (from the original module)

> What is the primary benefit of lazy loading modules in an Angular application, and how does it impact the user's initial load time and overall experience?

Section 7 covers this directly: lazy loading keeps a feature's code out of the initial bundle entirely, so users only pay its download cost if and when they actually visit it — meaning the *initial* load is smaller and faster for everyone, at the cost of a small, one-time delay the first time each lazy feature is actually opened. Frame your own answer around the Settings example from this module's Kanban app, in your own words.
