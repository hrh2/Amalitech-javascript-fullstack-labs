# FEM18 — Testing & Quality Assurance with Jest: Kanban Task Management Web App

Project location: `FEM18-Testing-in-Angular/kanban-task-management-app/`
Starting point: `FEM17-HTTP-APIs/kanban-task-management-app/` (copied in, then tests added)

This document explains how the test suite is built, why each kind of test is written the way it is, and how to
defend it in a TA review. Everything described exists in the project.

**Result:** 16 test files, 143 tests, all passing. Coverage: statements 99.8 %, branches 92.1 %, functions 99.3 %,
lines 99.8 %. Both `ng build` configurations still succeed.

---

## 1. What FEM18 adds

No new features (apart from one tiny pipe, see §9). The job is to prove that the FEM17 app works and keeps working:

| Layer | What is tested | Files |
|---|---|---|
| Pure logic | validators, form factory, pipe | `task-validators.spec.ts`, `task-form.factory.spec.ts`, `status-label.pipe.spec.ts` |
| Services (with a fake network) | `TaskService`, `BoardService`, `AuthService` | `*.service.spec.ts` |
| Interceptors & guards | auth header, error mapping, 401 redirect, route guards | `interceptors.spec.ts`, `guards.spec.ts` |
| Components, services mocked | board list, board detail, add/edit task, app shell, pages | `*.component.spec.ts`, `pages.spec.ts` |
| Component with real template | `TaskFormComponent` (inputs, outputs, validation UI, snapshot) | `task-form.component.spec.ts` |
| Integration | real routes + guards + components + services + interceptors, fake network | `app.integration.spec.ts` |

### What is deliberately *not* here

- **No reducer/Effect tests and no Cypress.** Module 10's own notes mention NgRx reducers/effects and a Cypress E2E
  test, but this project has no NgRx any more (removed in FEM17 to keep HTTP simple), and the lab specification's
  tasks 1–9 and bonus only ask for Jest unit/integration tests. The equivalent of "test the state logic" is
  testing the services' signals (§5). An E2E test would be the natural next step.
- **No `PATCH` tests**, because the app never uses `PATCH` (see the FEM17 notes).

---

## 2. Why test, and the testing pyramid (Objective 1–2)

A test is code that runs your code and fails if the result isn't what you promised. They give you:
**confidence to refactor** (change internals, re-run, know nothing broke), **living documentation** (test names
describe behaviour), and **fast feedback** (seconds, not clicking through the app).

The pyramid says: many fast, small tests at the bottom; fewer, broader ones above; very few slow end-to-end tests on
top.

```
        E2E (browser, real server)        <- none in this lab
      Integration (parts together)         <- app.integration.spec.ts (7 tests)
   Unit (one thing, dependencies faked)    <- everything else (136 tests)
```

- **Unit test:** one class/function in isolation. Everything it depends on is replaced by a mock. If it fails, the
  bug is *in that unit*.
- **Integration test:** several real parts together (router + guard + component + service + interceptor); only the
  outside world (network) is faked. If it fails, something is wrong *between* parts, which unit tests can't see
  (e.g. the form emits the right event but the route is wrong).

---

## 3. Setting up Jest (Task 1)

Angular 21's CLI generates projects that use Vitest. The lab asks for Jest, so:

```bash
npm i -D jest@30 jest-preset-angular@17 jest-environment-jsdom@30 @types/jest@30 ts-node
```

| Piece | Purpose |
|---|---|
| `jest` | the test runner and assertion library (`describe`, `it`, `expect`, `jest.fn`) |
| `jest-preset-angular` | teaches Jest to compile Angular TypeScript/templates and sets up Angular's `TestBed` |
| `jest-environment-jsdom` | a fake browser (DOM) running in Node, so components can render without Chrome |
| `@types/jest` | TypeScript types for `describe`, `expect`, … |
| `ts-node` | lets Jest read `jest.config.ts` |

**`jest.config.ts`** (key parts):

```ts
preset: 'jest-preset-angular',
setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],   // runs before each test file
testEnvironment: 'jsdom',
testMatch: ['<rootDir>/src/**/*.spec.ts'],
collectCoverageFrom: ['src/app/**/*.ts', '!…routes.ts', '!…app.config.ts', '!src/app/testing/**'],
coverageThreshold: { global: { statements: 95, branches: 85, functions: 95, lines: 95 } },
```

**`setup-jest.ts`** has one real line, `setupZoneTestEnv()`, which boots Angular's test environment (the app uses
`zone.js`, so the zone variant is used).

Other changes: `tsconfig.spec.json` uses the `jest` types (and `esModuleInterop`), `package.json` scripts
(`test`, `test:watch`, `test:coverage`), and `tsconfig.app.json` excludes `src/app/testing/**` (the test helpers
use `jest` globals, which must not be compiled into the production build — this once broke `ng build` and is the
kind of thing to check after any tooling change).

**Why Jest compares well with Karma/Jasmine (talking point):** it runs in Node with jsdom instead of launching a
real browser, so start-up is fast; each test file runs in its own isolated worker (parallel, no shared state);
watch mode re-runs only affected files; and mocks, spies, fake timers, snapshots and coverage are built in. The
trade-off: jsdom is not a real browser, so layout/CSS can't be tested — that's what E2E tests are for.

---

## 4. Anatomy of a test

```ts
describe('TaskService', () => {          // groups tests for one thing
  beforeEach(() => { ... });             // runs before EVERY it(): fresh state, no leakage
  it('deletes the task', () => {         // one behaviour, named as a sentence
    // Arrange: set up        // Act: do the thing        // Assert: expect(...)
  });
});
```

Matchers used: `toBe` (same value/reference), `toEqual` (deep equality), `toHaveBeenCalledWith`,
`toHaveBeenCalledTimes`, `toBeNull`, `toContain`, `toHaveLength`, `toMatchObject`, `toThrow`, `.not.` variants,
`it.each([...])` (same test, many inputs).

Rule followed throughout: **test behaviour, not implementation.** Tests click buttons, type into inputs and read
the DOM or the calls made to a collaborator; they don't reach into private fields.

---

## 5. Service tests with a fake network (Task 4)

`task.service.spec.ts` and `board.service.spec.ts` use **`HttpTestingController`**, Angular's fake backend:

```ts
TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
http = TestBed.inject(HttpTestingController);

service.loadTasks();                        // the service sends a request...
const req = http.expectOne(URL);            // ...the test grabs it,
expect(req.request.method).toBe('GET');     // checks what was sent,
req.flush([makeTask()]);                    // and decides what the "server" answers
expect(service.tasks()).toEqual([makeTask()]);
```

- `provideHttpClientTesting()` replaces the real network. No request ever leaves the process.
- `flush(body)` = success. `flush('x', {status: 500, statusText: …})` = server error. `req.error(new ProgressEvent('error'))` =
  network failure (status 0).
- `afterEach(() => http.verify())` fails the test if a request was made that the test never handled — this catches
  accidental extra calls.
- `http.expectNone(URL)` proves a request was **not** sent (used to prove caching: a second `loadTasks()` after a
  success sends nothing).

What is covered (success *and* failure for each): GET fills the signal and toggles `isLoading`; failure stores
`error` and a retry works; POST appends the server's copy (with its new id); PUT replaces by id and **creates a new
array** (immutability: `expect(after).not.toBe(before)`); DELETE removes; a failed DELETE keeps the item; and
`BoardService.deleteBoard` **orders** its requests — the board DELETE must not appear until the task DELETE has
finished, tested with `expectNone` then `expectOne`.

Testing signals: they're plain function calls (`service.tasks()`), so assertions are simple. The one gotcha is that
`whenLoaded()` is built on `toObservable()`, which reacts through an Angular *effect*; in tests call
`TestBed.tick()` to run pending effects before asserting.

`firstValueFrom(observable)` turns an Observable into a Promise so a test can `await` it:
`await expect(firstValueFrom(service.deleteTasksOfBoard('99'))).resolves.toBeNull()`.

### Interceptors and guards

`interceptors.spec.ts` registers the **real** interceptors on a test `HttpClient` and inspects the captured
request: the `Authorization: Bearer …` header exists only when logged in; each status (0/404/500/400) becomes the
right friendly `Error` message; a 401 logs out, calls `router.navigate(['/login'])` **and still rejects**.
`guards.spec.ts` calls the guard functions inside `TestBed.runInInjectionContext(...)` (because they use
`inject()`), with a mocked `Router`/`window.confirm`.

---

## 6. Mocking and component tests (Tasks 2 & 3)

### What is a mock, and why?

A **mock** is a stand-in that records how it was called. Component tests should not hit HTTP or depend on a service's
internals, so `src/app/testing/mocks.ts` builds `createTaskServiceMock()` / `createBoardServiceMock()`:

```ts
{ tasks: signal(tasks), isLoading: signal(false), error: signal(null),
  loadTasks: jest.fn(), createTask: jest.fn(), ... }
```

Same public surface as the real service, but the data are writable signals (the test can change them) and every
method is `jest.fn()` (the test can assert calls). A test then says:

```ts
{ provide: TaskService, useValue: taskServiceMock }          // dependency injection swaps real for fake
taskService.createTask.mockReturnValue(of(makeTask()));      // success path
taskService.createTask.mockReturnValue(throwError(() => new Error('Server down')));   // failure path
expect(taskService.createTask).toHaveBeenCalledWith({ boardId: '2', title: 'Write tests', ... });
```

- `jest.fn()` – a fake function. `mockReturnValue(...)` – what it returns. `toHaveBeenCalledWith(...)` – verify the
  arguments (this is how "the component asks the service to do the right thing" is proven).
- `jest.spyOn(obj, 'method')` – wraps a real method to observe it. Used for `router.navigate` (so no real
  navigation happens and the test can assert the URL/query params), `window.confirm` (answer yes/no) and
  `console.error`. Restore with `jest.restoreAllMocks()` in `afterEach`.
- `src/app/testing/fixtures.ts` has `makeBoard()` / `makeTask()` builders so each test overrides only the field it
  cares about.

This proves each component works **in isolation from its dependencies** (Task 3): `AddTaskComponent` is tested with
a fake `TaskService` and has no idea there is HTTP at all.

### Rendering components: `TestBed`, `ComponentFixture`, `RouterTestingHarness`

- `TestBed.configureTestingModule({...})` builds a tiny Angular environment for the test. `TestBed.createComponent`
  renders the real template and gives a `fixture`.
- `fixture.componentRef.setInput('form', form)` sets an `@Input`; **`fixture.detectChanges()` must be called after
  changing state** or the DOM isn't updated — the most common mistake.
- Routed components (board list/detail, add/edit) need the router. `RouterTestingHarness.create()` +
  `harness.navigateByUrl('/boards/2/edit/5', EditTaskComponent)` navigates a real test router to a route and renders
  the component with its real `:boardId`/`:taskId` params. Test routes mirror the real ones, including
  `withRouterConfig({ paramsInheritanceStrategy: 'always' })` (needed so a child can read its parent's `:boardId`).

### What each component spec proves

| Component | Highlights (all via the DOM or via mocked-service calls) |
|---|---|
| `TaskFormComponent` | renders `heading`/`submitLabel`; Delete button only in edit mode; submit disabled while invalid or `isSaving`; error text shows; invalid submit emits nothing but marks fields touched; valid submit/cancel/delete emit the right `@Output`; adding/removing subtasks keeps FormArray and DOM in sync |
| `BoardListComponent` | cards sorted by `?sort=`; counts per status; loading / empty / error+Retry states; create-board modal → `createBoard(...)` called with trimmed values → navigates to the new id; too-short name blocked; failure keeps modal open with message; `?create=1` opens the modal |
| `BoardDetailComponent` | only this board's tasks, split into Todo/Doing/Done; due date + subtask progress; Previous/Next links; reacts when `:boardId` changes; success banners (`?taskSaved=`) and dismissal; unknown id → `/not-found`; delete-board confirm / success / failure |
| `AddTaskComponent` | duplicate-title rule is per board; valid submit calls `createTask` with the exact payload then navigates with `?taskSaved=created`; failure shows the message and keeps the user's input |
| `EditTaskComponent` | form pre-filled from the stored task; own title isn't a "duplicate"; save sends the full task with the same ids; delete confirm/success/failure; missing task → `/not-found` |
| `AppComponent` | triggers the initial load once; sidebar follows the boards signal; theme saved/OS-default/toggle persisted; mobile board name from the URL; menu toggles |

---

## 7. Asynchronous testing (Task 6)

The app's asynchronous code is Observables/HTTP and signals (it has no `setTimeout`s of its own). Techniques used:

1. **Synchronous flushing** – `HttpTestingController` makes HTTP deterministic; no waiting.
2. **`await` + `firstValueFrom`** – for Observables that emit later (`whenLoaded`, `deleteTasksOfBoard`).
3. **`await harness.fixture.whenStable()`** – waits for router navigation and pending Angular work before
   asserting (e.g. after the redirect to `/not-found`).
4. **Jest fake timers** – `task.service.spec.ts` simulates a *slow server*:

   ```ts
   jest.useFakeTimers();
   setTimeout(() => req.flush([task]), 300);     // the "server" answers after 300 ms
   jest.advanceTimersByTime(299);  TestBed.tick();
   expect(emitted).not.toHaveBeenCalled();       // still waiting, isLoading() is true
   jest.advanceTimersByTime(1);    TestBed.tick();
   expect(emitted).toHaveBeenCalledWith([task]); // arrives exactly at 300 ms
   ```

   Fake timers let the test control time instead of really waiting, so it is instant and never flaky. Always
   `jest.useRealTimers()` in `afterEach` so other tests are unaffected.

Rule: **always make the test wait for the async work *before* the assertion**, otherwise it passes or fails by
accident.

---

## 8. Integration testing (Task 7)

`app.integration.spec.ts` uses the **real** `routes` (guards, lazy-loaded board routes), real components, real
`BoardService`/`TaskService`, and the real interceptors. Only the network is fake. Scenarios:

1. Logged out → `/boards` redirects to `/login?returnUrl=%2Fboards` (the real `authGuard` on the real routes).
2. Unknown URL → 404 page.
3. Server data → list cards and status counts (shows "Loading boards" first, then data).
4. Network failure → friendly message from the error interceptor; **Retry** recovers.
5. Open a board through the lazy route, open the add-task modal, type a title, submit: the test checks the
   `POST /tasks` request (method, `Authorization` header, body with `boardId`), answers it, and then checks the
   **screen**: URL has `?taskSaved=created`, the success banner shows, and the new card is in the column.
6. Delete a task from its edit form → `DELETE /tasks/1` → card disappears, banner shows.
7. A 401 response → logged out and redirected to `/login`.

Why it matters: unit tests with mocks can all pass while the real wiring is wrong (a wrong route, a signal not
updated, a header missing). Scenario 5 verifies the whole chain *user input → form → service → HTTP → response →
signal → DOM* in one test. Trade-off: they are slower and, when they fail, the cause is less obvious than in a unit
test — so there are few of them.

---

## 9. Pipe testing and the TDD cycle that built it (Task 5 + Red-Green-Refactor reflection)

The app had no custom pipe, and Task 5 needs one, so one was added with a real purpose: the board page used to
keep a private list of `{ status: 'in-progress', label: 'Doing' }` pairs. `StatusLabelPipe`
(`core/pipes/status-label.pipe.ts`) now owns that mapping (`todo → Todo`, `in-progress → Doing`, `done → Done`) and
the column headings use `{{ status | statusLabel }}`.

### The actual Red → Green → Refactor sequence

1. **RED.** I wrote `status-label.pipe.spec.ts` first (the mapping, `null`/`undefined`/`''` → `''`, unknown status
   returned unchanged, purity). Running Jest gave:
   `FAIL … Cannot find module './status-label.pipe'` — a failing test, for the right reason (nothing exists yet).
2. **GREEN.** I wrote the smallest pipe that passes: a lookup table, `if (!status) return ''`, and `?? status`
   for unknowns. Jest: 6 passed.
3. **REFACTOR.** With the test as a safety net I removed the duplicated label list and the `StatusColumn` interface
   from `BoardDetailComponent`, replacing them with a plain `statuses: TaskStatus[]` and the pipe in the template.
   Re-ran Jest and `ng build`: still green.

### Discussion prompt: how did mocking support TDD?

The pipe is a pure function, so it needed **no mocks** — that's why it is the easiest place to start TDD. Mocking
matters for the parts that have dependencies: because `TaskService` is replaced by `createTaskServiceMock()`, I can
write the `AddTaskComponent` tests (what it must call and with what) **before** any real HTTP exists, and make the
error path testable on demand (`throwError(...)`) instead of waiting for a real failure. Mocks let tests fail for
the right reason (the unit's own logic), run in milliseconds, and force the design to depend on a small interface
(the service's methods) rather than on `HttpClient` details.

### Pipe test design (the "edge cases" the lab asks for)

Null, undefined, empty string, a status the app doesn't know, and a repeat call with the same input (a pure pipe
must be deterministic — `@Pipe` defaults to `pure: true`, so Angular only re-runs it when the input changes).

---

## 10. Coverage and quality metrics (Task 8)

Run `npm run test:coverage`. Current numbers:

| Metric | Result | Threshold |
|---|---|---|
| Statements | 99.79 % (480/481) | 95 % |
| Branches | 92.1 % (105/114) | 85 % |
| Functions | 99.29 % (141/142) | 95 % |
| Lines | 99.75 % (412/413) | 95 % |

- **Statements / lines**: how much code ran. **Functions**: how many functions were called at least once.
  **Branches**: both sides of every `if`, `?:`, `??`, `&&` — the strictest, and where gaps hide.
- `jest.config.ts` has `coverageThreshold`; if coverage falls below, `npm run test:coverage` exits non-zero, so a CI
  job would fail. Thresholds are a floor, not a goal.
- Excluded from measurement: route tables, `app.config.ts` (pure wiring) and `src/app/testing/` (helpers).
- The HTML report (`coverage/lcov-report/index.html`) is git-ignored.
- **Coverage ≠ quality.** A line can be "covered" by a test with no assertions. To check the tests really bite, I
  temporarily broke the code twice and confirmed the suite failed, then reverted: (a) made `updateTask` stop
  replacing the task in the signal → 2 tests failed; (b) changed the interceptor's `401` check to `403` → 2 tests
  failed. If those had stayed green, the tests would have been worthless.
- What remains uncovered are defensive `??` / `?.` fallbacks (e.g. a missing route param, a browser without `matchMedia`).

---

## 11. Snapshot testing (bonus)

`task-form.component.spec.ts` ends with `expect(el.querySelector('form')).toMatchSnapshot()`. Jest serialises the
rendered form's DOM into `__snapshots__/task-form.component.spec.ts.snap`; on later runs the DOM must match it.

- **Good for:** noticing *unintended* structural changes during a refactor (a missing label, a renamed class).
- **Risks:** a huge or noisy snapshot gets blindly updated with `jest -u`, hiding real regressions. Rules used here:
  snapshot one small, stable element; read the diff before updating; keep the behavioural tests as the real safety
  net. The snapshot file is committed to git so changes are visible in code review.

---

## 12. Continuous improvement and CI (Task 9)

- **README** has a Testing section: commands, coverage report location, thresholds, conventions.
- **Naming/organisation:** `thing.ts` ↔ `thing.spec.ts` side by side; `*.integration.spec.ts` for cross-part
  tests; shared helpers in `src/app/testing/`; test names are sentences ("does X when Y").
- **Test alongside the feature** (TDD where practical): write a failing test, make it pass, refactor — as with the
  pipe in §9. For a bug fix: reproduce it with a failing test first so it can never silently return.
- **CI/CD:** a pipeline (e.g. GitHub Actions) would run on every push/pull request: `npm ci`, `npm run test:coverage`
  (fails below the thresholds), `npm run build`, and only then deploy (Vercel can be set to wait for the checks).
  This workflow file is **not** part of this lab (CI configuration is outside the module), so it is only described
  here, not implemented.

---

## 13. Common mistakes (and where this project avoids them)

| Mistake | Symptom | Here |
|---|---|---|
| Forgetting `fixture.detectChanges()` after changing state | DOM assertion sees old content | called after every state change |
| Not restoring spies | one test's mock leaks into the next | `jest.restoreAllMocks()` in `afterEach`; mocks rebuilt in `beforeEach` |
| Asserting before async work finishes | flaky pass/fail | `flush`, `await`, `whenStable()`, fake timers |
| Forgetting `http.verify()` | unexpected requests go unnoticed | in `afterEach` of every HTTP spec |
| Testing implementation details | tests break on harmless refactors | tests click/type/read the DOM and check calls to collaborators |
| Only testing the happy path | errors untested | every service/form has a failure test |
| Test depends on another test | passes alone, fails together | fresh `TestBed` per test (`beforeEach`), no shared mutable state |
| Date-dependent tests | passes today, fails next week | date validator tests compute dates relative to "today" |
| Using real `window.confirm` | test hangs / jsdom "not implemented" | `jest.spyOn(window, 'confirm')` |
| Test helpers compiled into the app build | `ng build` fails with "Cannot find name 'jest'" | `src/app/testing/**` excluded in `tsconfig.app.json` |
| Chasing 100 % coverage | tests without assertions | verified tests actually fail when code is broken (§10) |

---

## 14. TA review questions

**1. Why Jest instead of Karma/Jasmine?**
It's what the lab specifies, and it runs in Node with jsdom (no browser launch), isolates each file, parallelises,
and has mocks, fake timers, snapshots and coverage built in. Downside: jsdom isn't a real browser.

**2. Unit vs integration test — give an example from this project.**
Unit: `AddTaskComponent` with a mocked `TaskService`, asserting `createTask` was called with the right payload.
Integration: `app.integration.spec.ts` scenario 5 — real routes, components, services and interceptors with only the
network faked, asserting the new card appears on screen.

**3. What does `TestBed` do?**
It creates a miniature Angular module/injector for a test, so components can be created with real templates and
dependency injection — and so dependencies can be swapped with `{ provide: X, useValue: fake }`.

**4. How do you mock a service?**
A plain object with the same public members, `jest.fn()` for methods and writable signals for data
(`testing/mocks.ts`), provided via `useValue`. Return values are set per test (`of(...)` / `throwError(...)`).

**5. How do you test HTTP without a server?**
`provideHttpClientTesting()` + `HttpTestingController`: `expectOne(url)` captures the request so I can check
method/body/headers, and `flush()` answers it. `verify()` in `afterEach` fails on unhandled requests.

**6. How did you test error handling?**
Services: flush a 500 and assert `error()` is set and data unchanged. Interceptor: each status maps to the right
message; 401 logs out and redirects but still re-throws. Components: mock the service with `throwError` and assert
the message shows, the user stays on the page, and their input is kept.

**7. How do you test asynchronous code?**
Deterministically: flush HTTP, `await firstValueFrom(...)`, `await whenStable()`, and Jest fake timers for latency
(`advanceTimersByTime(299)` → not yet; `+1` → arrived). Never real waiting.

**8. Why is `fixture.detectChanges()` needed?**
Angular only updates the DOM when change detection runs; in tests nothing triggers it automatically, so the test
must, after setting inputs or changing state.

**9. How do you test an `@Output`?**
Subscribe a `jest.fn()` to the `EventEmitter` and trigger it through the real DOM (click Cancel, dispatch `submit`),
then `expect(spy).toHaveBeenCalledTimes(1)`. Also assert it is *not* emitted when invalid.

**10. What do the coverage numbers mean, and are they enough?**
Statements/lines/functions/branches executed by tests. They show untested code, not test quality. So thresholds are
a floor in `jest.config.ts`, and I verified tests fail when I deliberately break code (§10).

**11. Where would you not trust coverage?**
Branches with trivial fallbacks, and any test with weak assertions. A covered line proves it ran, not that its
result was checked.

**12. Why a custom pipe test with null/unknown input?**
Pipes sit in templates, where values can be undefined while data loads; a pipe that throws would break rendering.
The tests lock in "null → empty string, unknown → unchanged".

**13. What is a pure pipe, and how did you test it?**
Angular only re-evaluates it when its input changes, so it must always return the same output for the same input
and have no side effects. Test: call twice with the same input and compare; no mocks needed.

**14. What's snapshot testing good and bad for?**
Good at catching unintended structure changes; bad when large/noisy and updated without reading the diff. I snapshot
one small form and keep behaviour tests as the real protection.

**15. Walk me through the TDD cycle you actually did.**
§9: failing spec for the pipe ("Cannot find module") → minimal implementation → refactor `BoardDetailComponent` to use
it while tests stay green.

**16. How would tests run in CI/CD?**
On every push: install, `npm run test:coverage` (fails under thresholds), build, then deploy. Described, not
implemented (out of scope for the lab).

**17. What isn't tested, and why?**
No Cypress/E2E (not required by the lab spec; would be the next layer), no real-browser layout/CSS (jsdom can't),
no live MockAPI contract test (tests use a fake network so they're fast and don't change shared data), and no
NgRx tests (NgRx was removed in FEM17).

**18. A test passes alone but fails with the others — what do you check?**
Shared state: module-level variables, mocks not reset (`restoreAllMocks`/`mockReset`), `localStorage`, `document`
attributes, fake timers not restored, or the `TestBed` not being reset. Each spec here rebuilds its mocks/TestBed in
`beforeEach` (the AppComponent spec also clears `localStorage` and the `data-theme` attribute).
