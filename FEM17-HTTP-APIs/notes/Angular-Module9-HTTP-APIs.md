# Module 9: HTTP & APIs
### FEM17 — continues from FEM09 (Angular Fundamentals) through FEM16 (State Management)

> **Scope note:** This document covers *only* Module 9 — the HTTP request/response cycle and message structure, REST architectural principles, full CRUD with `HttpClient` inside reusable services, constructing/manipulating HTTP headers (including authentication), centralized error handling via HTTP interceptors, and debugging network requests with browser DevTools. Anything beyond that — GraphQL, WebSockets, real authentication flows (token refresh, login/session management), HTTP caching strategies, offline-first patterns, server-sent events — is flagged **🔒 Coming Later — Outside This Module**.
>
> **This module deepens, rather than introduces from scratch, two things you've already used.** Module 3 taught the basics of injecting `HttpClient` into a service and calling `.get()`/`.post()`/`.put()`/`.delete()`. Module 6 taught `catchError` for handling failures in an RxJS pipeline. This module assumes both and builds the *remaining* real-world skills around them: REST theory, the full anatomy of an HTTP message, headers/authentication, **centralized** (not per-call) error handling via interceptors — a concept Module 3 explicitly named and deferred — and reading the Network tab like a working developer does daily.

---

## How this document is organized

Same documentation-first shape as Modules 1–8:

**What is it? → Why does Angular need it? → How does it work? → Syntax breakdown → Examples → When to use / not use → What happens behind the scenes? → How it connects to other concepts → Try It Yourself → Exercises → Common Mistakes**

Everything ties back to this module's running example: connecting the Kanban app's boards and tasks to a real (or mock) backend REST API — "Kanban Task Management Web App (Part III — HTTP & API Integration)."

---

## Table of Contents

1. [From Module 8 to Module 9: What's New](#1-from-module-8-to-module-9-whats-new)
2. [HTTP Fundamentals: The Request/Response Cycle](#2-http-fundamentals-the-requestresponse-cycle)
3. [REST: Principles of a RESTful API](#3-rest-principles-of-a-restful-api)
4. [Full CRUD With `HttpClient`, Revisited](#4-full-crud-with-httpclient-revisited)
5. [HTTP Headers & Authentication](#5-http-headers--authentication)
6. [Centralized Error Handling: HTTP Interceptors](#6-centralized-error-handling-http-interceptors)
7. [Why Put HTTP Logic in a Service?](#7-why-put-http-logic-in-a-service)
8. [Debugging With the Network Tab](#8-debugging-with-the-network-tab)
9. [Putting It Together: Kanban App HTTP Architecture](#9-putting-it-together-kanban-app-http-architecture)
10. [Final Module Project: Kanban Task Management Web App (Part III — HTTP & API Integration)](#10-final-module-project-kanban-task-management-web-app-part-iii--http--api-integration)
11. [Quick Reference Sheet](#11-quick-reference-sheet)
12. [Source & Resource Mapping](#12-source--resource-mapping)

---

## 1. From Module 8 to Module 9: What's New

Every `HttpClient` call across this entire course so far has quietly assumed you already understood HTTP itself — Module 3 showed `.get<Dessert[]>(url)` and moved straight to Observables; Module 8's NgRx Effects called `this.boardService.getBoards()` without ever asking *what actually travels over the network* when that happens, or *why* it's shaped the way it is. This module fills that gap directly: what an HTTP request and response actually contain, why REST APIs are organized the way they are, and the two pieces of real-world `HttpClient` usage no prior module needed — headers (for authentication) and centralized error handling (interceptors, explicitly deferred back in Module 3).

### ✅ Knowledge Check
1. Name two places earlier in this course where `HttpClient` was used without explaining what an HTTP request/response actually is.

---

## 2. HTTP Fundamentals: The Request/Response Cycle

### What is HTTP?

**HTTP (HyperText Transfer Protocol)** is the protocol — an agreed-upon set of rules — that web browsers (and `HttpClient`) use to communicate with servers. Every `HttpClient` call this course has made (`.get()`, `.post()`, etc., Module 3) is, underneath, constructing and sending an HTTP **request**, and every Observable value you've received back (`Dessert[]`, `Board[]`, ...) came from parsing an HTTP **response**.

### The request/response cycle

```
Client (your Angular app, via HttpClient)
   │
   │  1. sends an HTTP REQUEST
   ↓
Server (the API)
   │
   │  2. processes the request, sends back an HTTP RESPONSE
   ↓
Client
   │  3. HttpClient parses the response, emits it through the Observable
```
This is the same shape as every `HttpClient` call already made throughout this course (Modules 3, 6, 8) — this section simply opens up what's actually inside steps 1 and 2.

### Anatomy of an HTTP request

```
GET /api/boards/42/tasks HTTP/1.1
Host: api.kanbanapp.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json
Accept: application/json

(request body — empty for GET; a JSON object for POST/PUT)
```
- **Method (`GET`)** — what kind of operation this is (Section 3 covers the meaning of each method in a RESTful context).
- **Path (`/api/boards/42/tasks`)** — which resource is being addressed.
- **Headers** (`Host`, `Authorization`, `Content-Type`, `Accept`) — metadata about the request, covered fully in Section 5.
- **Body** — the data being sent, present for `POST`/`PUT`/`PATCH`, empty for `GET`/`DELETE` (by convention).

### Anatomy of an HTTP response

```
HTTP/1.1 200 OK
Content-Type: application/json

[
  { "id": "1", "title": "Design mockup", "done": false },
  { "id": "2", "title": "Implement API", "done": false }
]
```
- **Status code (`200`) and reason phrase (`OK`)** — a three-digit number, grouped by first digit, telling you broadly what happened:

| Range | Meaning | Common examples |
|---|---|---|
| 2xx | Success | `200 OK`, `201 Created`, `204 No Content` |
| 3xx | Redirection | `301 Moved Permanently`, `304 Not Modified` |
| 4xx | Client error — the request itself was wrong | `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found` |
| 5xx | Server error — the request was fine, the server failed | `500 Internal Server Error`, `503 Service Unavailable` |

- **Response headers** — metadata about the response (e.g., `Content-Type` telling the client how to interpret the body).
- **Response body** — the actual data, most commonly JSON for a REST API, which `HttpClient` automatically parses into a JavaScript object/array for you (Module 3's "automatic JSON parsing" benefit, now explained: this is specifically what it refers to).

### Why does this matter for writing Angular code, specifically?

Every `.subscribe({ next, error })`/`catchError` pattern from Modules 3 and 6 is fundamentally about **status codes**: a "success" callback fires for 2xx responses; an "error" path fires for 4xx/5xx ones. Section 6's centralized error handling and Section 5's headers are both, at their core, about correctly shaping the **request** side and correctly reacting to the **response** side of this exact cycle — nothing in this module introduces a new mechanism beyond what Module 3 already gave you; it gives the existing mechanism its full, real-world context.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Treating any non-crash response as "it worked" | A `404` or `500` response is still a completed HTTP cycle — the request *reached* the server and got an answer, just not a successful one | Check the status code (via `.subscribe()`'s `error` callback/`catchError`, Modules 3 and 6) rather than assuming a response arriving means success | Matches your code's behavior to what actually happened, not just "did a response come back at all" |
| Assuming a `GET` request can carry a meaningful body the way `POST`/`PUT` do | By convention (and in many server implementations), `GET` request bodies are ignored or unsupported | Pass data needed for a `GET` via the URL path or query parameters (Module 4) instead | Matches real-world HTTP/REST convention |
| Confusing a 4xx (client error — something about the request was wrong) with a 5xx (server error — the server itself failed) | Leads to debugging the wrong side of the interaction — a 401 is not a bug in your backend's server code, and a 500 is not something you can fix by changing what you send | Read the status code's leading digit as a strong hint about *where* to look for the actual problem | Status code ranges are a genuine, standardized signal about the nature of a failure |

### ✅ Knowledge Check
1. What does a `Content-Type: application/json` response header tell `HttpClient`, and why does that matter for what you receive in `.subscribe()`?
2. What's the practical difference between a 4xx and a 5xx status code, in terms of where the underlying problem likely is?

---

## 3. REST: Principles of a RESTful API

### What is REST?

**REST (Representational State Transfer)** is an architectural style for designing web APIs — a set of conventions and constraints that, when followed, make an API predictable to use without needing to memorize each endpoint's quirks individually. A **RESTful API** is one that follows these conventions closely enough to be recognizable as such.

### Why does Angular (or any client) benefit from an API following REST conventions?

Every `HttpClient` call this course has made has, without saying so explicitly, relied on REST conventions to guess correctly what a URL/method combination *should* do: `GET /api/desserts` fetches desserts; `POST /api/tasks` creates a task. If every API designed its endpoints in a completely ad-hoc way, no such reasonable guess would be possible, and every integration would require memorizing an entirely bespoke set of rules. REST's core value is exactly this **predictability**.

### Core REST constraints, explained with the Kanban API

**1. Client-server separation.** The frontend (your Angular app) and backend (the API) are independent — the frontend doesn't need to know how the backend stores data, and the backend doesn't need to know anything about Angular. `HttpClient` communicating purely over HTTP, with no shared in-process state (Module 3), is this constraint in practice.

**2. Statelessness.** Each request must contain **everything** the server needs to process it — the server does not remember anything about previous requests from the same client "in between" them. This is why an `Authorization` header (Section 5) must be sent on **every** request that needs it, rather than "logging in once" and having the server silently remember who you are for later requests.

**3. Resources, identified by URLs.** Everything the API manages is a **resource**, addressed by a URL — `/boards`, `/boards/42`, `/boards/42/tasks`, `/boards/42/tasks/7`. Notice how this directly mirrors Module 4's route parameter patterns (`boards/:boardId/tasks/:taskId`) — REST's resource-based URL design and Angular's own routing conventions share the same underlying idea: a URL identifies *which thing* you're talking about.

**4. A uniform interface — HTTP methods have consistent, predictable meaning:**

| Method | Meaning | Kanban example |
|---|---|---|
| `GET` | Retrieve a resource (or collection) — must never change anything on the server | `GET /boards/42/tasks` — fetch all tasks on board 42 |
| `POST` | Create a new resource | `POST /boards/42/tasks` — create a new task on board 42 |
| `PUT` | Replace an existing resource **entirely** | `PUT /boards/42/tasks/7` — replace task 7's full data |
| `PATCH` | Update **part** of an existing resource | `PATCH /boards/42/tasks/7` — update just task 7's `done` flag |
| `DELETE` | Remove a resource | `DELETE /boards/42/tasks/7` — delete task 7 |

**5. Representations.** The client and server exchange **representations** of a resource's current state — almost always JSON in modern REST APIs — not the resource itself (there is no literal "task 7 object" traveling over the wire; there's a JSON representation of its current data, which `HttpClient` parses into a plain JavaScript object, Section 2).

### `PUT` vs. `PATCH` — a distinction worth getting right

```typescript
// PUT — must include the ENTIRE task, even fields that aren't changing
this.http.put(`/api/tasks/${taskId}`, {
  title: 'Design mockup',
  description: 'Create the initial design',
  done: true
});

// PATCH — only the fields that are actually changing
this.http.patch(`/api/tasks/${taskId}`, { done: true });
```
Using `PUT` with only a partial object risks the server interpreting missing fields as "clear this field," since `PUT`'s contract is "replace entirely." `PATCH` exists specifically for partial updates — the Kanban app's "toggle task done" feature (a single-field change) is a textbook `PATCH` use case, not a `PUT` one.

### Idempotency — a REST concept worth knowing by name

An operation is **idempotent** if performing it multiple times has the same effect as performing it once. `GET`, `PUT`, and `DELETE` are conventionally idempotent (fetching, replacing with the same data, or deleting an already-deleted resource repeatedly doesn't cause additional changes); `POST` is conventionally **not** (posting the same "create a task" request twice creates two tasks). This matters practically: it's why retry logic (🔒 not covered in depth in this module) is generally considered safe to apply automatically to a failed `GET`, but risky to apply automatically to a failed `POST` without additional safeguards.

### Three worked examples mapping Kanban features to REST design

**Example 1 — listing boards:** `GET /api/boards` → an array of boards.

**Example 2 — creating a task on a specific board:** `POST /api/boards/42/tasks`, body `{ title: 'New task' }` → the newly created task, including its server-assigned `id`.

**Example 3 — partially updating a task's status:** `PATCH /api/boards/42/tasks/7`, body `{ done: true }` → the updated task.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Designing a URL as an action, e.g. `POST /api/createTask` | Breaks REST's resource-based convention — URLs should name *things* (`/tasks`), with the HTTP method (not the URL) expressing the action | `POST /api/tasks` (the method already means "create") | Keeps the method and the resource each doing their own, distinct job |
| Using `GET` for a request that changes server data | Violates REST's expectation that `GET` is always safe to call repeatedly with no side effects — this can cause serious bugs with caching, prefetching, or browser/proxy behavior that assumes `GET` is always safe | Use `POST`/`PUT`/`PATCH`/`DELETE` for anything that changes data | Matches real client/browser/proxy assumptions about what `GET` is allowed to do |
| Sending a full object via `PUT` when only one field actually changed, without including every other existing field | Risks the server treating omitted fields as intentionally cleared, since `PUT`'s contract is full replacement | Use `PATCH` for partial updates | Matches the HTTP method's actual, conventional contract |
| Assuming a REST API's URL structure must exactly mirror the frontend's own route structure (Module 4) | The two are related but independent design decisions — a frontend route and a backend resource URL solve different problems and don't have to match one-to-one | Design frontend routes around what the *user* needs to see; design API URLs around what *resources* the server manages | Keeps each concern (frontend navigation vs. backend resource modeling) appropriately separate |

### ✅ Knowledge Check
1. Why is `POST /api/createTask` considered poor REST design compared to `POST /api/tasks`?
2. What's the practical difference between `PUT` and `PATCH`, and which would you use to toggle a single task's `done` flag?
3. Why is `POST` conventionally *not* idempotent, while `GET`/`PUT`/`DELETE` conventionally are?

---

## 4. Full CRUD With `HttpClient`, Revisited

### What's actually new here versus Module 3?

Module 3 already showed the *shape* of every `HttpClient` method (`.get()`, `.post()`, `.put()`, `.delete()`) and the `.subscribe({ next, error })` pattern. This section doesn't reintroduce that — it shows them used **together, completely, and realistically** inside one service, now informed by Section 3's REST conventions (choosing the right method/URL for each operation) and setting up what Sections 5–6 build on top of (headers, interceptors).

### A complete `TaskService`

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);
  private readonly baseUrl = '/api/boards';

  getTasks(boardId: string): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.baseUrl}/${boardId}/tasks`);
  }

  getTask(boardId: string, taskId: string): Observable<Task> {
    return this.http.get<Task>(`${this.baseUrl}/${boardId}/tasks/${taskId}`);
  }

  createTask(boardId: string, task: Partial<Task>): Observable<Task> {
    return this.http.post<Task>(`${this.baseUrl}/${boardId}/tasks`, task);
  }

  updateTask(boardId: string, taskId: string, task: Task): Observable<Task> {
    return this.http.put<Task>(`${this.baseUrl}/${boardId}/tasks/${taskId}`, task);
  }

  patchTaskStatus(boardId: string, taskId: string, done: boolean): Observable<Task> {
    return this.http.patch<Task>(`${this.baseUrl}/${boardId}/tasks/${taskId}`, { done });
  }

  deleteTask(boardId: string, taskId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${boardId}/tasks/${taskId}`);
  }
}
```
Notice every method:
- Uses the HTTP method matching Section 3's REST conventions for what it's actually doing (`get`/`post`/`put`/`patch`/`delete`).
- Returns an `Observable<T>`, never subscribes internally — consuming components/Effects (Modules 3, 6, 8) decide *when* and *how* to subscribe.
- Builds its URL from `boardId`/`taskId`, exactly mirroring Module 4's route-parameter-driven URLs (`boards/:boardId/tasks/:taskId`).

### Consuming full CRUD from a component — tying together Modules 3, 4, and 6

```typescript
export class TaskDetailComponent implements OnInit {
  private taskService = inject(TaskService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  task$ = this.route.paramMap.pipe(
    switchMap((params) =>
      this.taskService.getTask(params.get('boardId')!, params.get('taskId')!)
    )
  );

  onToggleDone(boardId: string, taskId: string, currentlyDone: boolean): void {
    this.taskService.patchTaskStatus(boardId, taskId, !currentlyDone).subscribe();
  }

  onDelete(boardId: string, taskId: string): void {
    this.taskService.deleteTask(boardId, taskId).subscribe({
      next: () => this.router.navigate(['/boards', boardId]),
      error: (err) => console.error('Failed to delete task:', err)
    });
  }
}
```
This single component genuinely combines: Module 4's `ActivatedRoute`/`Router`, Module 6's `switchMap` (correctly canceling a stale in-flight request if the route parameters change again quickly), and this module's `TaskService` — nothing here is a new pattern; it's every prior module's tool applied to a complete, realistic feature.

### `Partial<Task>` — a small but important TypeScript detail

```typescript
createTask(boardId: string, task: Partial<Task>): Observable<Task> {
```
`Partial<Task>` marks every property of `Task` as optional — appropriate here because a newly-created task's payload typically doesn't include a server-assigned `id` yet (the server generates it and returns the full `Task`, `id` included, in the response). Using the full, non-partial `Task` type for the request body would incorrectly demand an `id` the client doesn't have yet.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Calling `HttpClient` methods directly from a component, bypassing a service | Repeats the exact problem Module 3 first identified — no reuse, no single place to add headers/error handling later | Always wrap `HttpClient` calls in a service method, as shown above (Section 7 covers *why* in full depth) | Keeps one, reusable, testable place per API interaction |
| Using `Task` (not `Partial<Task>`) as the type for a creation payload that doesn't yet include a server-generated `id` | TypeScript will demand a value for `id` that doesn't exist yet on the client side | Use `Partial<Task>` (or a dedicated `NewTask` type omitting server-generated fields) for creation payloads | Accurately types what the client actually has available to send |
| Forgetting `.subscribe()` on a `patch`/`delete` call whose result isn't needed for display | The request is never actually sent — Module 3's "Observables are lazy" rule applies identically to every HTTP method, not just `GET` | Always `.subscribe()` (even with no callback, `.subscribe()`, if truly nothing needs to happen with the result) | Every `HttpClient` method returns a lazy Observable, regardless of which HTTP verb it uses |

### Exercises

**Level 1 — Basic:** Add a `getBoards(): Observable<Board[]>` and `createBoard(board: Partial<Board>): Observable<Board>` to a `BoardService`.

**Level 2 — Practical:** Add `updateBoard`/`deleteBoard`, and wire a `BoardSettingsComponent` to call all four CRUD operations, correctly handling success/error for each.

**Level 3 — Challenge:** Build the complete `TaskService` shown above against your own Kanban app's mock/real API, and wire `TaskDetailComponent`'s toggle-done and delete actions end to end, confirming the correct HTTP method (verified in the Network tab, Section 8) is used for each operation.

### ✅ Knowledge Check
1. Why does `createTask` accept `Partial<Task>` rather than `Task`?
2. In `TaskDetailComponent`, why is `switchMap` the correct choice for turning route parameters into a task-fetching Observable, rather than a plain `map`?

---

## 5. HTTP Headers & Authentication

### What is an HTTP header?

An **HTTP header** is a key-value pair of metadata attached to a request or response, separate from the actual body/payload — Section 2 already showed several (`Content-Type`, `Authorization`, `Accept`) without explaining how to set them from Angular. This section covers exactly that.

### Why does Angular need a dedicated way to construct headers, instead of a plain object?

`HttpClient` requires headers to be passed via its own `HttpHeaders` class (not a plain `{ key: value }` object) specifically because `HttpHeaders` is **immutable** — every "modification" method returns a **new** `HttpHeaders` instance rather than mutating the existing one. This should feel immediately familiar: it's the exact same immutability discipline Modules 3, 7, and 8 established for `@Input()` objects, signals, and reducer state, now applied to HTTP headers as well.

### Setting headers on a single request

```typescript
import { HttpClient, HttpHeaders } from '@angular/common/http';

getTasks(boardId: string): Observable<Task[]> {
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${this.authToken}`,
    'X-Client-Version': '1.0.0'
  });

  return this.http.get<Task[]>(`${this.baseUrl}/${boardId}/tasks`, { headers });
}
```
- **`new HttpHeaders({...})`** — constructs an immutable headers object from a plain object of key-value pairs.
- **`{ headers }`** — passed as part of the **options object**, the second (for `GET`/`DELETE`) or third (for `POST`/`PUT`/`PATCH`, after the body) argument to any `HttpClient` method.
- **`Authorization: Bearer ${token}`** — the conventional header/format for sending an authentication token — `Bearer` is a keyword (part of the standard, not Angular-specific) indicating the token type, followed by the actual token value.

### Building headers incrementally (demonstrating immutability directly)

```typescript
let headers = new HttpHeaders();
headers = headers.set('Authorization', `Bearer ${token}`);
headers = headers.set('X-Client-Version', '1.0.0');
```
Each `.set(...)` call returns a **new** `HttpHeaders` instance — this is why the result must be reassigned (`headers = headers.set(...)`) rather than expecting `.set(...)` to modify `headers` in place. Forgetting this (calling `.set(...)` without capturing its return value) is a very close cousin of Module 3's "mutating an `@Input()` object in place" mistake — the object *looks* unchanged because nothing actually happened to it.

### Query parameters — a related, frequently-paired concept

```typescript
import { HttpParams } from '@angular/common/http';

getTasks(boardId: string, sort?: string): Observable<Task[]> {
  let params = new HttpParams();
  if (sort) {
    params = params.set('sort', sort);
  }
  return this.http.get<Task[]>(`${this.baseUrl}/${boardId}/tasks`, { params });
}
```
`HttpParams` works identically to `HttpHeaders` (immutable, `.set()` returns a new instance) but builds the URL's **query string** (`?sort=recent`) instead of request headers — directly parallel to Module 4's `router.navigate([...], { queryParams: {...} })`, just constructed for a raw HTTP call rather than client-side navigation.

### Three worked examples

**Example 1 — an `Authorization` header for every authenticated request** (shown above).

**Example 2 — a `Content-Type` override for a non-JSON payload (briefly, for completeness):**
```typescript
const headers = new HttpHeaders({ 'Content-Type': 'text/plain' });
this.http.post('/api/logs', 'plain text log entry', { headers, responseType: 'text' });
```
`HttpClient` defaults to assuming JSON in both directions; `responseType: 'text'` and an explicit `Content-Type` are needed when a request/response genuinely isn't JSON — included here only so the option is recognizable, not as a pattern this module's lab requires.

**Example 3 — combining headers and params in one call:**
```typescript
getTasks(boardId: string, sort: string, token: string): Observable<Task[]> {
  const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  const params = new HttpParams().set('sort', sort);
  return this.http.get<Task[]>(`${this.baseUrl}/${boardId}/tasks`, { headers, params });
}
```

### The problem with Example 1, at scale — a preview of Section 6

Notice Example 1 requires manually constructing the `Authorization` header inside **every single method** that needs it — every `TaskService` method, every `BoardService` method, anything requiring authentication. This is exactly the kind of repeated, easy-to-forget-in-one-spot logic Section 6's **interceptors** exist to centralize — read Section 6 as the direct continuation of this exact problem.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| `headers.set('Authorization', token)` with no reassignment (`headers = headers.set(...)`) | `HttpHeaders` is immutable — `.set()` returns a new instance rather than mutating the existing one, so the original `headers` variable is left completely unchanged | Always reassign: `headers = headers.set(...)` | Matches `HttpHeaders`' actual, immutable API contract |
| Passing a plain object (`{ Authorization: token }`) directly where `HttpHeaders` is expected | `HttpClient`'s options object expects an actual `HttpHeaders` instance (or, in some overloads, a plain object is coerced, but explicit construction is the clearer, more reliable pattern) | Construct headers explicitly with `new HttpHeaders({...})` | Matches the API's expected shape and behavior precisely |
| Manually adding an `Authorization` header inside every single service method that needs authentication | Repetitive, and a single forgotten method silently sends an unauthenticated request | Use an HTTP interceptor (Section 6) to attach it centrally, once | Removes the repetition and the risk of a missed spot entirely |

### ✅ Knowledge Check
1. Why must `headers.set(...)`'s return value be reassigned rather than relying on `.set()` to mutate the existing `headers` variable?
2. What problem does manually adding an `Authorization` header to every service method create at scale, and what does Section 6 do about it?

---

## 6. Centralized Error Handling: HTTP Interceptors

### What is an HTTP interceptor?

An **HTTP interceptor** is a function that sits **between** every `HttpClient` call your app makes and the actual network — able to inspect, modify, or react to **every** outgoing request and incoming response, in one central place, without touching the individual service methods (`TaskService`, `BoardService`, ...) that initiate them. This is precisely the concept Module 3, Section 7 named and explicitly deferred ("HTTP interceptors... 🔒 outside this module").

### Why does Angular need this, given `catchError` (Module 6) already handles errors?

`catchError` (Module 6, Section 7) handles an error **at the specific call site** where it's used — you'd need to add it to *every* method in *every* service that makes an HTTP call, exactly the same repetition problem Section 5 just identified for headers. An interceptor solves both problems **once, centrally**: attach the `Authorization` header to every outgoing request, and/or react to every failing response (e.g., redirect to a login page on a `401`, log every `5xx` for diagnostics) — without editing `TaskService`, `BoardService`, or any other service at all.

### Syntax breakdown — a functional interceptor (modern Angular)

```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token) {
    const authorizedReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(authorizedReq);
  }

  return next(req);
};
```
- **`HttpInterceptorFn`** — a type for "a function usable as an interceptor" — directly parallel to Module 4's `CanActivateFn` for route guards, both being plain functions rather than classes, both usable with `inject()` inside them.
- **`req`** — the outgoing `HttpRequest` object, **immutable** exactly like `HttpHeaders`/`HttpParams` (Section 5) — you cannot modify it directly.
- **`req.clone({ setHeaders: {...} })`** — produces a **new** request object with the given header(s) added/overridden, leaving the original `req` untouched — the same "clone with changes, never mutate" pattern as everywhere else in this course.
- **`next(authorizedReq)`** — passes the (possibly modified) request along to the next interceptor in the chain, or to the actual network if this is the last one. **Every interceptor must call `next(...)` exactly once** (or deliberately short-circuit by returning something else entirely, e.g., for caching — 🔒 outside this module) for the request to actually proceed.

### A second interceptor — centralized error handling

```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        router.navigate(['/login']);
      } else if (error.status >= 500) {
        console.error('Server error:', error);
      }
      return throwError(() => error);
    })
  );
};
```
- **`next(req).pipe(catchError(...))`** — this should look immediately familiar from Module 6, Section 7 — `next(req)` returns an Observable of the eventual response, and `catchError` intercepts a failure exactly as it always has, just centralized here instead of repeated in every service method.
- **`router.navigate(['/login'])` on a 401** — Module 4's programmatic navigation, now triggered centrally by *any* request receiving an unauthorized response, anywhere in the app, without each service needing its own redirect logic.
- **`return throwError(() => error)`** — re-throws the error after handling the side effect (Module 6, Section 7's `throwError` pattern), so the original calling code's own `.subscribe()`'s `error` callback (if any) still runs too — the interceptor adds centralized behavior *in addition to*, not *instead of*, whatever the calling code itself does with the error.

### Registering interceptors

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';
import { errorInterceptor } from './interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]))
  ]
};
```
`withInterceptors([...])` registers interceptors **in order** — `req` passes through `authInterceptor` first, then `errorInterceptor`, then the network; the response passes back through in reverse. This directly extends Module 3's `provideHttpClient()` — interceptors are additional configuration for the same provider, not a separate system.

### The payoff: `TaskService` no longer needs to think about auth or errors at all

```typescript
@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);

  getTasks(boardId: string): Observable<Task[]> {
    return this.http.get<Task[]>(`/api/boards/${boardId}/tasks`); // no headers, no catchError — handled centrally
  }
}
```
Compare this directly to Section 5's Example 1, which manually built an `Authorization` header inside the method itself — the interceptor now does that (and centralized error handling) for **every** call, to **every** endpoint, automatically, with `TaskService` reduced back to purely describing *which* resource it wants.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Forgetting to call `next(req)` (or `next(modifiedReq)`) inside an interceptor | The request never actually proceeds — it silently goes nowhere, with no error thrown to explain why | Always call `next(...)` exactly once (per non-branching path) with whichever request should proceed | Interceptors form a chain; skipping this link breaks the chain entirely |
| Mutating `req` directly (e.g., trying `req.headers = ...`) instead of `req.clone({...})` | `HttpRequest` is immutable, exactly like `HttpHeaders`/`HttpParams` — direct mutation attempts fail or are silently ignored | Use `req.clone({ setHeaders: {...} })` to produce a new, modified request | Matches the immutable API contract consistently applied throughout this module |
| Forgetting to register an interceptor via `withInterceptors([...])` | A correctly-written interceptor that's never registered simply never runs — directly parallel to Module 8's "an Effect that's never registered via `provideEffects` never runs" | Always add new interceptors to the `withInterceptors([...])` array | Registration, not just correct code, is what actually activates any interceptor |
| Using `catchError` inside an interceptor to fully swallow every error with no `throwError` re-throw | The calling code's own `.subscribe()`'s `error` callback never fires, even though it might have its own, legitimate reason to react (e.g., showing a specific inline message) | Re-throw with `throwError(() => error)` after handling the interceptor's own centralized concern | Lets centralized *and* call-site-specific error handling coexist correctly |

### ✅ Knowledge Check
1. Why must an interceptor call `next(...)` for a request to actually proceed?
2. Using Section 5's repeated-`Authorization`-header problem as the example, explain exactly what an interceptor centralizes that individual service methods previously had to repeat.
3. Why does `errorInterceptor` re-throw the error with `throwError(...)` instead of simply handling it and stopping there?

### 🎥 Optional Video
**Mastering API Calls In Angular With A Reusable Service (15 min)**
[Watch on YouTube](https://www.youtube.com/watch?v=kqHFDvnjbcw)
**Useful for:** Seeing a scalable service pattern with centralized headers/error handling built live, reinforcing Sections 5–6 together.

---

## 7. Why Put HTTP Logic in a Service?

This section directly and specifically answers this module's own discussion prompt — expanding on a point Module 3 first raised, now with this module's full context (headers, interceptors, REST design) to make the argument concrete rather than abstract.

### The four concrete reasons, each tied to something this module just built

**Reason 1 — a single, reusable place per resource.** `TaskService`'s six methods (Section 4) are used by `TaskDetailComponent`, and would be equally reusable by any future component/Effect (Module 8) needing task data — writing the same `http.get<Task[]>('/api/boards/' + boardId + '/tasks')` call directly inside every component that needs it would duplicate the URL, the method choice, and (before Section 6) the header-handling logic, everywhere it's needed.

**Reason 2 — one place to add cross-cutting concerns without touching every call site.** Section 6's interceptors handle headers/errors *centrally*, but the service methods themselves are still the one place URL construction, method choice (`GET` vs `PATCH`, Section 3), and payload typing (`Partial<Task>`, Section 4) live. If the API's base URL changes, or an endpoint's path changes, exactly one file needs updating — every component calling that service method keeps working unmodified.

**Reason 3 — components stay focused on presentation, not HTTP mechanics.** A component injecting `TaskService` and calling `.getTasks(boardId)` never needs to know the actual URL, HTTP method, or response shape's raw JSON structure — it works with a typed `Observable<Task[]>`, exactly the same separation of concerns Module 3 established for `CartService`/`DessertDataService`, now specifically justified by everything this module added on top (headers, REST conventions, error interceptors) that a component genuinely should not need to know about.

**Reason 4 — testability (🔒 writing the actual tests is outside this module, but the architectural point holds now).** A service method with a clear input/output contract (`getTasks(boardId: string): Observable<Task[]>`) can be tested in isolation, with a mocked `HttpClient`, without rendering any component template at all — directly parallel to Module 5's testability argument for Reactive Forms' explicit `FormGroup` model over Template-Driven forms' implicit, template-embedded one.

### A concrete scenario making the case directly

> The Kanban app's API base URL changes from `/api` to `/api/v2` as the backend team ships a new API version. If every component made its own `HttpClient` calls directly, this would mean finding and editing every single `this.http.get('/api/...')` call scattered across the codebase — a search-and-replace exercise with real risk of missing one. Because every call goes through `TaskService`/`BoardService`, exactly one `private readonly baseUrl` property per service needs updating, and every component/Effect using those services continues working, completely unaware anything changed.

### ✅ Knowledge Check
1. Restate, in your own words, the four reasons this section gives for keeping `HttpClient` logic inside a service rather than calling it directly from components.
2. Using the "API base URL changed" scenario, explain concretely what would go wrong if components called `HttpClient` directly.

---

## 8. Debugging With the Network Tab

### What is it?

The **Network tab** (in Chrome DevTools, or the equivalent panel in any modern browser) shows every HTTP request the current page has made — including every `HttpClient` call your Angular app issues — along with its method, URL, status code, headers, and response body, all inspectable **after the fact**, without adding any `console.log` to your own code.

### Why does this matter as its own skill, distinct from reading your own code?

Every concept in this module — the request/response cycle (Section 2), REST conventions (Section 3), headers (Section 5), interceptors (Section 6) — can be **directly observed** in the Network tab, which makes it the fastest way to answer real debugging questions: "did my `Authorization` header actually get attached?" "what method did this request actually use?" "what did the server actually send back, exactly?" — questions that are often faster to answer by looking at the real network traffic than by adding logging to your own TypeScript.

### What to look for, mapped directly to this module's sections

- **Method and URL** (Section 3) — confirm a "create task" action actually sent a `POST` to the URL you expect, not accidentally a `GET` or a typo'd path.
- **Status code** (Section 2) — a `401` confirms an authentication problem; a `404` confirms the URL itself is wrong; a `500` confirms the problem is server-side, not something to keep debugging in your Angular code.
- **Request headers** (Section 5) — confirm your `authInterceptor` (Section 6) actually attached the `Authorization` header — if it's missing here, the interceptor either isn't registered, isn't matching this request, or the token itself was empty/undefined when it ran.
- **Request payload** (Section 3/4) — confirm a `POST`/`PATCH` body actually contains the fields you expect, in the shape you expect (catching a common bug: accidentally sending `undefined` for a field, or the wrong key name).
- **Response body** (Section 2) — confirm the actual JSON shape the server returned matches what your `Observable<T>`'s type claims — a real, common source of bugs is a TypeScript type that no longer matches what the API actually sends.

### A practical debugging workflow

1. Reproduce the issue in the browser with the Network tab open (and, typically, "Preserve log" enabled if the action involves navigation, Module 4).
2. Find the relevant request (filter by name/type if there's a lot of traffic).
3. Check the status code first — it tells you broadly *where* to look next (Section 2's 4xx-vs-5xx guidance).
4. If the status is unexpected, check the request itself (method, URL, headers, payload) before assuming the backend is at fault.
5. If the request looks correct but the response is wrong/unexpected, the issue is most likely server-side, or a mismatch between your assumed response shape and the API's actual one.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Adding `console.log` throughout a service to debug a failing request, before checking the Network tab at all | Slower, and only shows what your own code did with a response — not what was actually sent/received over the wire | Check the Network tab first — it shows the ground truth of the actual request/response, independent of your code's assumptions | Often immediately reveals whether the problem is in your request, the server's response, or how your code is interpreting a correct response |
| Assuming a request that "doesn't seem to do anything" was never sent at all | It may have been sent and received a response your code simply didn't handle visibly (e.g., a forgotten `.subscribe()`, Module 3, or an unhandled error) | Check the Network tab to confirm whether the request was sent, and what status code came back, before assuming nothing happened | Separates "the request never fired" from "the request fired but the response wasn't handled" — two very different bugs |
| Debugging a missing `Authorization` header by adding logging inside `authInterceptor`, before checking the Network tab's request headers directly | Slower than directly inspecting the actual header that was sent | Check the Network tab's request headers first — it shows definitively whether the header made it into the actual request | Directly answers "did this work" without needing to add and later remove debugging code |

### ✅ Knowledge Check
1. Given a task-creation button that "doesn't seem to work," what should you check in the Network tab first, and why?
2. Why is checking the Network tab often faster than adding `console.log` statements throughout your service/component code?

### 🎥 Optional Video
**How To Use The Network Tab in Chrome Developer Tools (11 min)**
[Watch on YouTube](https://www.youtube.com/watch?v=e1gAyQuIFQo)
**Useful for:** A visual walkthrough of exactly the workflow described above, in the real DevTools interface.

---

## 9. Putting It Together: Kanban App HTTP Architecture

```
app.config.ts
 └── provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]))

interceptors/
├── auth.interceptor.ts     attaches Authorization header to every outgoing request
└── error.interceptor.ts    redirects to /login on 401; logs 5xx centrally; re-throws

services/
├── board.service.ts        getBoards/getBoard/createBoard/updateBoard/deleteBoard
│                            — no headers, no catchError — handled by interceptors
└── task.service.ts         getTasks/getTask/createTask/updateTask/patchTaskStatus/deleteTask
                             — same clean separation

components/
├── board-list              injects BoardService; dispatches to NgRx (Module 8) or
│                            subscribes directly, depending on which module's
│                            state-management approach this component was built under
├── board-detail             injects TaskService; reads :boardId via ActivatedRoute (Module 4)
└── task-detail               injects TaskService; switchMap over :boardId/:taskId (Module 4/6);
                              onToggleDone/onDelete call TaskService methods directly
```

**How every prior module shows up here:** the services themselves are unchanged in *shape* from Module 3 — what's new is everything **around** them: REST-conventional method/URL choices (Section 3), no manual header code (moved to `authInterceptor`, Section 6), no manual `catchError` for auth/server errors (moved to `errorInterceptor`, also Section 6), and every consuming component still using exactly the Module 4 (`ActivatedRoute`/`Router`) and Module 6 (`switchMap`/Observables) patterns already established.

---

## 10. Final Module Project: Kanban Task Management Web App (Part III — HTTP & API Integration)

### Project Requirements

Connect the Kanban app to a real or mock REST API, with full CRUD for boards and tasks, centralized authentication headers, and centralized error handling.

### Functional Requirements

1. A `BoardService` and `TaskService`, each with methods for every CRUD operation that feature needs, using REST-conventional HTTP methods (Section 3) and URLs mirroring the resource hierarchy (`/boards`, `/boards/:boardId/tasks`, `/boards/:boardId/tasks/:taskId`).
2. An `authInterceptor` attaching an `Authorization` header (a hard-coded or simply-stored token is sufficient for this module's purposes — 🔒 real login/session management is outside this module) to every outgoing request.
3. An `errorInterceptor` centrally handling at least a `401` (redirect to a login route, Module 4) and logging `5xx` errors, correctly re-throwing so call-site `.subscribe()`/`catchError` handling still runs where present.
4. Both interceptors correctly registered via `provideHttpClient(withInterceptors([...]))`.
5. At least one component using `PATCH` for a genuinely partial update (e.g., toggling a task's `done` status) rather than `PUT`.
6. A verified, working debugging pass using the Network tab: confirm the `Authorization` header is present on an authenticated request, and confirm the correct HTTP method is used for at least one create, one partial update, and one delete operation.

### Suggested Structure

```
interceptors/
├── auth.interceptor.ts
└── error.interceptor.ts

services/
├── board.service.ts
└── task.service.ts

app.config.ts   (provideHttpClient(withInterceptors([...])))
```

### Required Angular Concepts (checklist)

- [ ] Full CRUD (`GET`/`POST`/`PUT` or `PATCH`/`DELETE`) implemented across `BoardService`/`TaskService`
- [ ] REST-conventional method choice for each operation (no `GET` that mutates data, `PATCH` used for partial updates)
- [ ] `HttpHeaders`/`HttpParams` used correctly (with reassignment, given their immutability) wherever headers/query params are needed directly
- [ ] At least one functional interceptor (`HttpInterceptorFn`) attaching headers centrally
- [ ] At least one functional interceptor centrally handling errors, correctly re-throwing
- [ ] Both interceptors registered via `withInterceptors([...])`
- [ ] No service method manually repeating header-attachment or auth-error-handling logic the interceptors already cover

### Acceptance Criteria

- Every CRUD operation uses the REST-conventional HTTP method for what it's actually doing, verified in the Network tab.
- A simulated `401` response (e.g., temporarily returning one from a mock API) correctly triggers the interceptor's redirect to `/login`, without any individual component needing its own `401`-handling code.
- The `Authorization` header is visibly present, with the correct value, on every authenticated request in the Network tab.
- No service method contains its own manual `Authorization` header construction or duplicate auth-error redirect logic — all of that is centralized in the interceptors.

### Hints (if stuck)

- Build and verify one full CRUD service (e.g., `TaskService`) working with no interceptors at all first, then add `authInterceptor`, then `errorInterceptor`, confirming each addition works before layering the next — the same incremental approach every prior module's project has recommended.
- If a header doesn't seem to be attached, check the Network tab's request headers directly (Section 8) before assuming the interceptor's code is wrong — confirm first whether the interceptor is even registered.
- If `errorInterceptor`'s redirect doesn't fire, confirm the error is actually reaching `catchError` inside it — a call-site `catchError` (if any) that fully swallows the error *before* it reaches the interceptor chain would prevent this (though in the standard interceptor chain, interceptors process the response before it reaches the original call site's own operators).

### Optional Stretch Challenges

- Add a third interceptor logging every request's method/URL/duration to the console, purely for diagnostic purposes, and reason about (in a comment) the order-dependence of `withInterceptors([...])` for this addition.
- Research (and document in a comment, without necessarily implementing) how retry logic might safely be added for failed `GET` requests specifically, connecting back to Section 3's idempotency discussion for *why* `GET` is a safer candidate for automatic retries than `POST`.
- Extend `errorInterceptor` to distinguish `403 Forbidden` (authenticated, but not permitted) from `401 Unauthorized` (not authenticated at all), handling each with a distinct, appropriate user-facing response.

---

## 11. Quick Reference Sheet

### HTTP Status Codes
```
2xx  Success           200 OK, 201 Created, 204 No Content
3xx  Redirection       301 Moved Permanently, 304 Not Modified
4xx  Client error      400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found
5xx  Server error      500 Internal Server Error, 503 Service Unavailable
```

### REST Method Conventions
```
GET     Retrieve — must never change server data
POST    Create a new resource — NOT idempotent
PUT     Replace a resource ENTIRELY — idempotent
PATCH   Update PART of a resource
DELETE  Remove a resource — idempotent
```

### Full CRUD Service Pattern
```
getItems(): Observable<Item[]>              this.http.get<Item[]>(url)
getItem(id): Observable<Item>                this.http.get<Item>(`${url}/${id}`)
createItem(item: Partial<Item>): Observable<Item>   this.http.post<Item>(url, item)
updateItem(id, item: Item): Observable<Item>        this.http.put<Item>(`${url}/${id}`, item)
patchItem(id, partial: Partial<Item>): Observable<Item>  this.http.patch<Item>(`${url}/${id}`, partial)
deleteItem(id): Observable<void>             this.http.delete<void>(`${url}/${id}`)
```

### Headers & Params (immutable — always reassign)
```
let headers = new HttpHeaders();
headers = headers.set('Authorization', `Bearer ${token}`);

let params = new HttpParams();
params = params.set('sort', 'recent');

this.http.get<T>(url, { headers, params });
```

### HTTP Interceptors
```
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authorizedReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  return next(authorizedReq);   // MUST call next() exactly once
};

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError(error => {
      if (error.status === 401) { router.navigate(['/login']); }
      return throwError(() => error);   // re-throw so call-site handling still runs
    })
  );
};

// Registration:
provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]))
```

### Important Terminology

| Term | Definition |
|---|---|
| **HTTP** | The protocol governing request/response communication between client and server. |
| **Status code** | A three-digit number in a response indicating the outcome (2xx success, 4xx client error, 5xx server error). |
| **REST** | An architectural style for APIs built around resources, URLs, and a uniform HTTP-method interface. |
| **Idempotent** | An operation that has the same effect whether performed once or multiple times. |
| **`HttpHeaders`/`HttpParams`** | Immutable classes for constructing request headers/query parameters. |
| **HTTP interceptor** | A function sitting between every `HttpClient` call and the network, able to modify requests/react to responses centrally. |
| **`HttpInterceptorFn`** | The type for a functional interceptor. |
| **`req.clone({...})`** | Produces a new, modified `HttpRequest`, since the original is immutable. |
| **Network tab** | The browser DevTools panel showing every HTTP request/response the page has made. |

### 🔒 Coming Later — Outside This Module
GraphQL · WebSockets · Real authentication flows (login, token refresh/expiry, session management) · HTTP caching strategies · Offline-first patterns · Server-sent events · Retry logic (`retry`/`retryWhen` operators, beyond the conceptual idempotency discussion in Section 3)

---

## 12. Source & Resource Mapping

| Module Topic | Source Resource | Knowledge Extracted |
|---|---|---|
| REST fundamentals | MDN — "REST (Glossary)" | Section 3's core REST constraints |
| HTTP message structure | MDN — "HTTP Messages" | Section 2's request/response anatomy |
| `HttpClient` setup and usage (official) | Angular.io — "Communicating with backend services using HTTP" | Section 4's full CRUD patterns |
| Modern `HttpClient` best practices | thisdot.co — "Using HttpClient in Modern Angular Applications" | Section 4/6's modern, functional patterns |
| Comprehensive `HttpClient` crash course | Angular University — "Angular HTTP Client - A Complete Guide" | Cross-cutting reference for Sections 4–6 |
| Practical REST API integration (video) | YouTube — "Angular 19 Tutorial #49 Call REST API with Services" (34 min) | Section 4's service-based CRUD reinforcement |
| First GET request walkthrough (video) | YouTube — "Angular 20 Tutorial for Beginners \| GET API call integration" (21 min) | Section 4's introductory reinforcement |
| Error handling & headers in depth | Angular University — "Angular HTTP (Error Handling & Headers)" | Sections 5–6's core patterns |
| HttpClient + Signals (forward-looking) | Medium — "Transforming HTTP API calls with Signals" | Context connecting this module to Module 7's `toSignal()` |
| Reusable service with headers/error handling (video) | YouTube — "Mastering API Calls In Angular With A Reusable Service" (15 min) | Sections 5–7's combined reinforcement |
| Network tab debugging (official) | Chrome Developers — "Inspect network activity in Chrome DevTools" | Section 8's debugging workflow |
| Network tab walkthrough (video) | YouTube — "How To Use The Network Tab in Chrome Developer Tools" (11 min) | Section 8's visual reinforcement |

**Quick links for deeper reading (optional, not required to complete this module):**
- [REST (Glossary) — MDN](https://developer.mozilla.org/en-US/docs/Glossary/REST)
- [HTTP Messages — MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Messages)
- [Communicating with backend services using HTTP — Angular.io](https://angular.io/guide/http)
- [Using HttpClient in Modern Angular Applications — thisdot.co](https://www.thisdot.co/blog/using-httpclient-in-modern-angular-applications)
- [Angular HTTP Client - A Complete Guide — Angular University](https://blog.angular-university.io/angular-http/)
- [Transforming HTTP API calls with Signals — Medium](https://balramchavan.medium.com/angular-19-transforming-http-api-calls-with-signals-and-resources-ce09c8ba4af1)
- [Inspect network activity in Chrome DevTools — Chrome Developers](https://developer.chrome.com/docs/devtools/network)

---

### Discussion Prompt (from the original module)

> Why is it considered a best practice to put all your `HttpClient` logic into a separate, injectable service instead of calling it directly from the component?

Section 7 answers this directly and in full: a single, reusable place per resource; one place to add cross-cutting concerns (now handled even more cleanly via Section 6's interceptors) without touching every call site; components that stay focused on presentation rather than HTTP mechanics; and a genuinely more testable architecture. Frame your own answer around the "API base URL changed" scenario in Section 7, or an equivalent one from your own Kanban app extensions, in your own words.
