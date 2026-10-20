# FEM17 — HTTP & API Integration: Kanban Task Management Web App

Project location: `FEM17-HTTP-APIs/kanban-task-management-app/`
Starting point: `FEM16-State-Management/kanban-task-management-app/` (copied in, then changed)

This document explains what FEM17 adds, why, and exactly how the code works. Every code reference below exists in
the project; nothing here describes a feature that was not built.

---

## 1. Overview

### What changed from FEM16

In FEM16 the boards lived in a hard-coded array inside `BoardService`, and `delay(300)` pretended to be a network.
Everything after the first load (add board, add/edit task) only changed memory — refresh the page and it was gone.

In FEM17 the data lives on a **server**. The app talks to it over **HTTP**, using Angular's **`HttpClient`**:

| Operation | HTTP request | Where in the code |
|---|---|---|
| List boards | `GET /boards` | `BoardService.loadBoards()` |
| List tasks | `GET /tasks` | `TaskService.loadTasks()` |
| Create board | `POST /boards` | `BoardService.createBoard()` |
| Create task | `POST /tasks` | `TaskService.createTask()` |
| Update task | `PUT /tasks/:id` | `TaskService.updateTask()` |
| Delete task | `DELETE /tasks/:id` | `TaskService.deleteTask()` |
| Delete board | `DELETE /tasks/:id` for each of its tasks, then `DELETE /boards/:id` | `BoardService.deleteBoard()` |

### Simplifications compared with FEM16

FEM16 used NgRx (actions, reducer, effects, selectors) because that module's job was to demonstrate it. Doing the
same here would mean ~15 actions and 5 effects just to wrap 7 HTTP calls — more code about NgRx than about HTTP,
which is the thing this module teaches. So FEM17:

- **Removed NgRx** (`@ngrx/*` packages and `src/app/state/`). The state now lives in two services as **signals**
  (FEM15). The spec itself says updates should propagate "using services or signals".
- **Dropped the unused `BoardStateService`** (FEM16's Stage 1 comparison artifact).
- **Kept** everything that is not about state: routing, guards, the reactive task form, the template-driven board
  form, the validators, the design and responsive layout.

If a TA asks "why did you remove NgRx?": the lab spec doesn't require it, and for CRUD on two resources a service
holding signals is the simplest design that is still easy to trace. NgRx pays off when many unrelated parts of a
big app share complex state.

### The data model changed slightly

A real API stores boards and tasks as **separate resources**. So tasks are no longer nested inside boards:

```ts
interface Board { id; name; description; createdAt }          // no tasks[] any more
interface Task  { id; boardId; title; description; status; dueDate; subtasks }
```

`Task.boardId` is a **foreign key**: it says which board owns the task. Task ids are now unique across all boards
(in FEM16 every board restarted its task ids at 1). `NewBoard`/`NewTask` are `Omit<…, 'id'>` — what the client
sends when creating something, because the **server** assigns the id.

---

## 2. Why HTTP and APIs? (Task 1)

A browser app cannot keep data permanently on its own: memory is wiped on refresh and is private to one user. A
**backend** stores the data; the frontend asks it for data and tells it about changes. They talk over **HTTP**,
as **requests** and **responses**:

```
Browser (Angular)                         Server (MockAPI)
   |  GET /boards  ───────────────────────►  |
   |  ◄──────────────  200 OK  [ {...}, … ]  |
   |  POST /tasks  {title:"x",…} ─────────►  |
   |  ◄───────  201 Created {id: 7, title…}  |
```

- **Method** says what you want: `GET` read, `POST` create, `PUT` replace, `PATCH` partial update, `DELETE` remove.
- **URL** says which resource: `/tasks` (the collection) or `/tasks/7` (one task).
- **Status code** says how it went: `2xx` success, `4xx` your mistake (404 not found, 401 not logged in),
  `5xx` the server's mistake, and `0` in Angular means "no response at all" (server down, network, CORS).

This style (resources as URLs, methods as verbs) is **REST**. The mock API follows it, which is why the service
methods are so short.

### The mock API: MockAPI (mockapi.io)

No backend was provided, so the project uses a hosted mock API from [mockapi.io](https://mockapi.io). It has two
resources, `boards` and `tasks`, and gives each a full REST interface (`GET/POST /boards`, `PUT/DELETE
/boards/:id`, and the same for `/tasks`). Data is stored on their server, so it survives a refresh and is the same
for everyone using the project URL.

- Base URL (in `src/environments/`): `https://6a783bdcf0f1cdf392243b73.mockapi.io/api/v1`.
- It allows cross-origin calls (CORS) including the `Authorization` header, which is why the browser can call it
  from `localhost:4200` and from a deployed site.
- Because it is a hosted service, **no local server is needed** and the deployed app uses the same API (Task 10).
- **Ids are strings** (`"1"`, `"2"`, …), assigned by MockAPI, so `Board.id`, `Task.id` and `Task.boardId` are
  typed `string`. Route params are strings already, so no `Number(...)` conversion is needed.
- MockAPI adds its own `createdAt` field to tasks. The app ignores it.
- **No cascade delete.** Deleting a board does not remove its tasks on the server, so `deleteBoard()` first deletes
  each of the board's tasks (`forkJoin` of `DELETE /tasks/:id`) and then the board (see §4).
- Seed data: 3 boards and 6 tasks (the same ones FEM16 hard-coded). If it gets messy, delete the records in
  the MockAPI dashboard and re-create them.

---

## 3. Setting up `HttpClient` (Task 2)

`HttpClient` is Angular's built-in service for HTTP. It is not available until you register it. In
`src/app/app.config.ts`:

```ts
provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
```

- `provideHttpClient()` makes `HttpClient` injectable everywhere. (Older Angular used `HttpClientModule`; modern
  standalone apps use this provider function.)
- `withInterceptors([...])` is optional extra configuration — see §7.

Forgetting this line gives `NullInjectorError: No provider for HttpClient`.

### Environment configuration (Task 2 + Bonus)

The API address must not be hard-coded in services, because it differs between your laptop and production.
`ng generate environments` created:

| File | Used when | Contents |
|---|---|---|
| `src/environments/environment.development.ts` | `ng serve` / `ng build --configuration development` | MockAPI base URL |
| `src/environments/environment.ts` | production build (`ng build`) | MockAPI base URL (same project; point it at a different MockAPI project to separate dev and prod data) |

`angular.json` has a `fileReplacements` entry on the development configuration that swaps `environment.ts` for
`environment.development.ts` at build time. Services always import `environment` from `environment.ts`; which
file's contents they actually get depends on the build. This is the bonus task's "separate dev and prod config".

> **Be honest about the token:** `authToken` in these files is a fake demo value. Anything in an Angular bundle is
> readable by every visitor, so a real secret must never go in an environment file.

---

## 4. The service layer (Task 3)

All HTTP lives in two services, so components never see `HttpClient`:

```
Component  ──calls──►  BoardService / TaskService  ──HttpClient──►  API
    ▲                          │
    └────reads signals─────────┘  (service updates its signals from the response)
```

Files: `core/services/board-service/board.service.ts`, `core/services/task-service/task.service.ts`.

### The shape of each service

```ts
@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/tasks`;

  private readonly tasksState = signal<Task[]>([]);     // private, writable
  readonly tasks = this.tasksState.asReadonly();        // public, read-only
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  ...
}
```

- `providedIn: 'root'` → one shared instance for the whole app (FEM11). That single instance is what makes the
  data shared between the sidebar, the board list, the board page, and the forms.
- `inject(HttpClient)` is the modern form of constructor injection.
- **Private writable signal, public read-only signal**: only the service can change the data, components can only
  read it. This is the same encapsulation idea as FEM16's `BehaviorSubject.asObservable()`.
- `isLoading` and `error` are the loading/error state (§8).

### Two kinds of methods

**Loading** methods subscribe inside the service, because the service owns the result:

```ts
loadTasks(): void {
  if (this.hasLoadedState() || this.isLoading()) return;   // caching, see §9
  this.isLoading.set(true);
  this.error.set(null);
  this.http.get<Task[]>(this.url).subscribe({
    next: (tasks) => { this.tasksState.set(tasks); this.hasLoadedState.set(true); this.isLoading.set(false); },
    error: (err: Error) => { this.error.set(err.message); this.isLoading.set(false); },
  });
}
```

**Writing** methods return an `Observable` and let the *component* subscribe, because only the component knows
what to do next (navigate, show a message, re-enable a button):

```ts
createTask(task: NewTask): Observable<Task> {
  return this.http.post<Task>(this.url, task).pipe(
    tap((created) => this.tasksState.update((all) => [...all, created])),
  );
}
```

`tap` runs a side effect without changing the value. Here the side effect is *updating the local copy with what the
server returned*. Because it's inside the service, no component can forget to do it.

> **Observables are lazy.** `this.http.post(...)` on its own sends nothing. The request only goes out when
> something calls `.subscribe()`. Forgetting that on a delete is a classic "nothing happens" bug.

### Typing the response

`this.http.get<Task[]>(url)` — the `<Task[]>` tells TypeScript what the JSON will look like. It's a promise to the
compiler, **not a runtime check**: if the server sends something else, TypeScript will not notice.

### Why `NewTask` for creating?

A new task has no `id` yet; the server makes one and returns the complete `Task`. Typing the request body as
`Task` would wrongly demand an id. `NewTask = Omit<Task, 'id'>` states exactly what the client has.

### `PUT` vs `PATCH`

`updateTask` uses `PUT /tasks/:id` and sends the **whole** task, replacing the stored one. `PATCH` would send only
the changed fields. The edit form always has every field, so `PUT` is the natural fit; no feature in this app
changes a single field in isolation, so no `PATCH` is implemented (adding one just to have it would be unused
code).

### Board deletion touches two services

MockAPI doesn't delete a board's tasks for you, so `BoardService.deleteBoard()` does it in order:

```ts
return this.taskService.deleteTasksOfBoard(id).pipe(              // DELETE /tasks/:id for each task
  switchMap(() => this.http.delete<void>(`${this.url}/${id}`)),   // then DELETE /boards/:id
  tap(() => this.boardsState.update((all) => all.filter((b) => b.id !== id))),
);
```

`deleteTasksOfBoard` runs the task deletions in parallel with `forkJoin` (each one already removes itself from the
local `tasks` signal), and uses `of(null)` when the board has no tasks because `forkJoin([])` would complete
without emitting and the board would never be deleted. If a task deletion fails, the board is **not** deleted and
the user sees the error. The dependency goes one way (Board → Task), so there's no circular injection.

---

## 5. Retrieving and displaying data (Task 4)

### Who starts the load?

`AppComponent.ngOnInit()` calls `boardService.loadBoards()` and `taskService.loadTasks()` once. The app shell is
the only component that exists on every route, so even a deep link straight to `/boards/2/edit/5` triggers it.

### How data reaches the screen

```
GET /boards ─► BoardService.boardsState.set(...) ─► boards signal ─► templates re-render
```

Components don't copy the data into their own fields. They derive what they need with `computed()`, which
recalculates automatically when the signals it reads change:

```ts
// BoardDetailComponent
private boardId = toSignal(this.route.paramMap.pipe(map(p => p.get('boardId') ?? '')), { initialValue: '' });
board = computed(() => this.boardService.boards()[this.boardIndex()]);
tasks = computed(() => this.taskService.tasks().filter(t => t.boardId === this.boardId()));
```

- `toSignal(observable)` (from `@angular/core/rxjs-interop`) turns the router's observable into a signal.
  The route param is read **reactively** (not from `route.snapshot`) because the "Next/Previous board" links reuse
  the same component instance with a different `:boardId`.
- In templates a signal is **called**: `boards()`, `isLoading()`. Writing `boards` instead of `boards()` is the
  most common mistake with signals (and the compiler flags it, e.g. `sortOrder === 'name'` on a signal).

### Empty and missing states

- Board list: `No boards yet.` shows only when loading finished, there was no error, and the list is empty.
- Each Kanban column shows `No tasks.` when empty.
- A board id that doesn't exist (`/boards/99`): `BoardDetailComponent` has an `effect()` that, once boards have
  loaded (`hasLoaded()`), navigates to `/not-found` if `board()` is `undefined`. Checking `hasLoaded` first
  avoids a false "not found" during the initial fetch.

### Why `whenLoaded()` exists

The add/edit task forms need the existing tasks to (a) fill the form (edit) and (b) check duplicate titles. On a
deep link or refresh the tasks haven't arrived yet. `TaskService.whenLoaded()` returns an observable that emits
the tasks once they're loaded:

```ts
this.route.paramMap.pipe(switchMap((params) => { ...; return this.taskService.whenLoaded(); }))
```

`switchMap` (FEM14) cancels the previous inner observable if the route param changes again.

---

## 6. Forms + API (Task 5) and deletion (Task 6)

### Create / edit flow, step by step (Add Task)

1. User fills the form (`TaskFormComponent`, presentational) and clicks **Create Task**.
2. `TaskFormComponent.onSubmit()` checks validity, then emits `formSubmit`.
3. `AddTaskComponent.save()` builds a `NewTask` and calls `taskService.createTask(task)`.
4. It sets `isSaving` → the button shows "Saving…" and is disabled (prevents double submit).
5. `POST /tasks` goes out. On success, `tap` adds the server's task (with its new id) to `tasks`.
6. `next` runs: the form is marked pristine (so `unsavedChangesGuard` doesn't prompt), then navigates to
   `/boards/:id?taskSaved=created`.
7. `BoardDetailComponent` is already showing the `tasks` signal, so the card appears immediately, and a
   "Task created." banner is shown from the query parameter.
8. On failure, `error` runs instead: `isSaving` is reset and `saveError` shows the message inside the form. The
   user's input is **not lost**, so they can retry.

Edit Task is the same with `PUT`, and the banner says "Task updated."

`TaskFormComponent` got three additions: inputs `isSaving` and `errorMessage`, and an output `formDelete` (shown
as the **Delete Task** button only in edit mode). It still knows nothing about HTTP — the parent passes state in
and listens for events out.

### Creating a board

The template-driven board form in `BoardListComponent` follows the same pattern: `createBoard()` →
`boardService.createBoard()` → on success close the modal and navigate to the new board (using the `id` the server
returned); on failure show the error inside the modal.

### Deleting (with confirmation)

- **Task:** edit modal → **Delete Task** → `window.confirm(...)` → `DELETE /tasks/:id` → remove from the signal →
  navigate back with `?taskSaved=deleted` → "Task deleted." banner.
- **Board:** board page header → **Delete Board** → `window.confirm(...)` (mentions that its tasks go too) →
  `DELETE /tasks/:id` for each of its tasks, then `DELETE /boards/:id` → both removed locally → navigate to `/boards`.

Nothing is deleted if the user cancels the confirm dialog. No page reload is needed because the signals update.

### "Pessimistic" updates

The UI changes only **after the server confirms**. The alternative (optimistic: change the UI first, undo if the
request fails) is snappier but needs rollback logic. Pessimistic is simpler and always matches the server.

---

## 7. Interceptors: headers and central error handling (Module notes §5–6)

An **interceptor** is a function that sees every request on the way out and every response/error on the way back,
so you write that logic once instead of in every service method. Both are in `core/interceptors/`.

### `authInterceptor` — adds the header

```ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();
  if (!token) return next(req);
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
```

- `req` is **immutable**; `req.clone({...})` makes a modified copy.
- `next(...)` passes the request on. If you forget to call it, the request silently never leaves.
- `AuthService.getToken()` returns the (demo) token only while logged in.
- MockAPI ignores the header; it's there to demonstrate the mechanism. In the Network tab, `POST`, `PUT` and
  `DELETE` requests show `Authorization: Bearer kanban-demo-token`.
- Honest limitation: the two initial `GET`s fire when the app starts, before the user has clicked **Log in**
  (the route guard redirects, but `AppComponent` already requested the data), so those show no `Authorization`
  header. A real API would need the load to wait for login.

### `errorInterceptor` — one place for failures

```ts
catchError((error: HttpErrorResponse) => {
  console.error(...);
  if (error.status === 401) { authService.logout(); router.navigate(['/login']); }
  return throwError(() => new Error(messageFor(error.status)));
})
```

- It **logs** the real error (for developers, visible in the console).
- On **401** it logs the user out and redirects to `/login` — no component needs its own 401 code.
- It **re-throws** a new `Error` with a **user-friendly message** (`messageFor`): status `0` → "Cannot reach the
  server. Is the API reachable?", `404` → "That item no longer exists.", `5xx` → "The server had a
  problem…". Re-throwing matters: if it swallowed the error, the component's `error:` callback would never run and
  the user would see nothing.
- Consequence: services and components only ever receive an `Error` whose `.message` is safe to display. They never
  look at status codes.

Order in `withInterceptors([auth, error])`: requests go through `auth` first then `error`; responses come back in
reverse.

---

## 8. Loading and error states (Task 7)

Each service exposes `isLoading` and `error` signals.

| Where | Loading | Error |
|---|---|---|
| Board list | "Loading boards…" while `GET /boards` runs | Red banner with the message and a **Retry** button |
| Board detail | "Loading board…" (boards or tasks loading) | Same banner + Retry |
| Add/Edit task form | Submit button disabled and reads "Saving…" | Red message inside the form |
| Create board modal | Button reads "Creating…" | Red message inside the modal |
| Delete board / delete task | Button disabled ("Deleting…" for boards) | Banner (board) / form message (task) |

**Retry:** `loadBoards()`/`loadTasks()` return early only if data has loaded or a request is running. After a
failure neither is true, so calling them again (the Retry button) genuinely re-requests.

Try it: go offline (DevTools → Network → Offline), reload — you get "Cannot reach the server…" instead of a blank page; go back online
and press Retry.

Why signals for these flags: the template reads `isLoading()` and Angular re-renders when it changes — no manual
subscription or `ngOnDestroy` cleanup (FEM16's components needed both).

---

## 9. Optimizing data handling (Task 8)

- **Fetch once, cache in the service.** Boards and tasks are fetched a single time, at startup. Navigating
  between pages never re-requests them; every component reads the same signals. (The `hasLoaded` guard in
  `loadBoards/loadTasks` is what prevents repeats.)
- **Update locally from responses** instead of re-fetching the whole list after each write.
- **One shared instance** (`providedIn: 'root'`) means every component sees an update the moment it happens: edit
  a task and the board page, counts on the board list, and the sidebar are all consistent.
- **Separation of concerns** (the module's discussion prompt): components don't know URLs, `HttpClient`, or
  headers. If the API address, a header, or the endpoint shape changes, one service (or interceptor) changes, and
  the same service can be reused by any component and mocked in tests.

Trade-off to be able to explain: caching all tasks in memory is fine for a small app, but with thousands of tasks
you'd fetch per board (`GET /tasks?boardId=1`) or paginate, and the cache could go stale if another user edits the
same data (there is no refresh).

---

## 10. Reading the Network tab (verification)

In Chrome DevTools → Network → filter **Fetch/XHR**:

- Page load: `GET /boards`, `GET /tasks` (200).
- Create task: `POST /tasks` (201), Request Payload is the JSON, Response includes the new `id`.
- Edit: `PUT /tasks/7` (200). Delete: `DELETE /tasks/7` (200). Delete board: one `DELETE /tasks/:id` per task, then `DELETE /boards/:id`.
- Headers tab on a write request: `Authorization: Bearer kanban-demo-token`.
- Stop the API → requests show as failed (status 0) and the red banner appears.

---

## 11. How it was verified

- `ng build` (production) and `ng build --configuration development` complete with no errors or warnings.
- A scripted browser run against `ng serve` talking to the real MockAPI project (headless Chrome) exercised: login → boards list
  (3 boards, status counts) → create board → add task (banner + card) → edit task (status changed) → delete task →
  delete board (cascade). All steps passed with **zero console errors**. The recorded requests were exactly
  `GET`, `GET`, `POST /boards`, `POST /tasks`, `PUT /tasks/7`, `DELETE /tasks/7`,
  `DELETE /boards/4`, with `Authorization` on all writes.
- `/boards/99` redirects to `/not-found`; with the API stopped the board list shows the "Cannot reach the server"
  banner (checked at a 390px mobile width too).
- There are no unit tests in this lab (`*.spec.ts` count is 0); testing is the next module (FEM18).

---

## 12. Task 10 — Deployment

Because the API is hosted, deployment is just the frontend: `vercel.json` (SPA rewrite) is unchanged from FEM16,
and the production `environment.ts` already points at the MockAPI URL, so a deployed build talks to the same API.
Steps: commit and push, redeploy on Vercel, then open the live URL and repeat the Network-tab checks from §10.
The push and redeploy themselves were **not** done here (they use your GitHub/Vercel accounts), so the live URL is
still to be verified by you. MockAPI's free tier limits requests, which is fine for a demo.

---

## 13. Common mistakes (and how this project avoids them)

| Mistake | Symptom | Here |
|---|---|---|
| Forgetting `provideHttpClient()` | `NullInjectorError: No provider for HttpClient` | Registered in `app.config.ts` |
| Not subscribing | Request never appears in the Network tab | Services' load methods subscribe; components subscribe to the returned observables |
| Calling `HttpClient` in a component | Duplicated URLs/error code, hard to reuse | Only services use it |
| Hard-coded API URL | Breaks in production | `environment.apiUrl` |
| Mutating the signal's array (`push`) | UI may not update | `update(all => [...all, x])`, `map`, `filter` create new arrays |
| Using `boards` instead of `boards()` in a template | Wrong value / compile error | Signals are called |
| Swallowing errors in an interceptor | Component never shows the error | `throwError` re-throws |
| `route.snapshot` for `:boardId` | Stale data when navigating board→board | `toSignal(paramMap)` |
| Navigating before the save succeeds | UI shows data the server rejected | Navigate inside `next:` |
| Forgetting `markAsPristine()` before navigating | "Unsaved changes" prompt after a successful save | Done in `next:` |
| Trusting `get<Task[]>` as validation | Runtime shape mismatch goes unnoticed | It is only a compile-time hint |

---

## 14. TA review questions

**1. Why put `HttpClient` in a service instead of the component?**
One place for URLs, one place to change if the API changes, reusable by several components, and components stay
about the UI. Here `TaskService` is used by the board list, board page, add form and edit form; none of them knows
a URL.

**2. What does `provideHttpClient()` do and where is it?**
It registers `HttpClient` (and the optional interceptors) with Angular's DI. It's in `app.config.ts`. Without it
injecting `HttpClient` throws.

**3. Why do the write methods return an Observable but `loadTasks()` subscribes itself?**
Loading is owned by the service (nobody else needs the result — they read the signal). Writes need the caller to
react (navigate, show a message), so the caller subscribes. In both cases the service updates its own state.

**4. What happens if you never call `.subscribe()`?**
Nothing: `HttpClient` observables are cold/lazy, no request is sent.

**5. Walk me through "Add Task" from click to screen.**
Form submit → `AddTaskComponent.save()` → `TaskService.createTask` → `POST /tasks` → response (with id) → `tap`
appends it to `tasks` signal → `next` navigates back → `BoardDetailComponent`'s `computed` `tasks` re-evaluates
→ card renders, banner shows from `?taskSaved=created`. See §6.

**6. How does the UI stay in sync after an edit without reloading?**
The service replaces the task in the shared `tasks` signal with the server's response. Every `computed()` reading
it recalculates, so every view updates.

**7. What's the difference between `PUT` and `PATCH`? Which did you use?**
`PUT` replaces the whole resource, `PATCH` changes only some fields. I used `PUT` for the edit form because it
submits every field. No feature changes one field alone, so I didn't add an unused `PATCH`.

**8. Why an error interceptor if the services handle errors?**
The interceptor handles what is the same for every request (log it, redirect on 401, turn the status into a
friendly message) once. Services/components only decide what to *show* where. Thanks to `throwError` they still
receive the error.

**9. Why re-throw in the interceptor?**
If it returned a value instead, the component's `error:` callback wouldn't run and the UI couldn't show a failure.

**10. How do you handle a failed request in the UI?**
`error` signals/callbacks: banner with Retry for loads; inline message plus re-enabled buttons for saves and
deletes (input is kept).

**11. How do you prevent double submits?**
`isSaving` disables the submit/delete button while a request is in flight.

**12. How do you avoid unnecessary API calls?**
Fetch once at startup and keep it in the service; update from write responses; guards in `loadBoards/loadTasks`
stop repeated fetches. Drawback: stale if other clients edit the data.

**13. Why did you remove NgRx?**
It's FEM16's topic, the FEM17 spec doesn't require it, and it would add actions/effects larger than the HTTP code
being taught. Signals in a service are the simplest traceable option for two resources.

**14. Why are `tasks` and `boards` separate resources with `boardId`?**
That's how a REST API models related data; it lets each be created/updated/deleted independently via its own URL,
instead of rewriting a whole board to change one task.

**15. What does the `environment` file do? What would you change for production?**
It supplies `apiUrl` per build; Angular swaps the file via `fileReplacements`. For production set the real API URL
in `environment.ts`. Secrets must not go in it (it ships to the browser).

**16. Why `toSignal(route.paramMap)` instead of `route.snapshot`?**
The Previous/Next links reuse the same component instance, so a snapshot read would go stale.

**17. The tasks aren't loaded yet when someone opens an edit link directly. What happens?**
`whenLoaded()` holds the form building until `GET /tasks` completes; then it finds the task or redirects to
`/not-found`.

**18. What are the weaknesses of this implementation? (Be upfront.)**
- The `authToken` is a demo constant and MockAPI doesn't check it; the first two `GET`s are sent before login.
- Login state is in memory (refresh logs out) — inherited from FEM12.
- Anyone with the MockAPI URL can read/write the data (no real auth); fine for a demo, not for production.
- Everything is loaded in memory, no pagination or refresh.
- Without the API running the app shows an error state (by design) but can't do anything else.
- No automated tests yet (FEM18).
