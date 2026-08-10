# Testing Documentation — Task Manager API Client

## Testing Strategy

The goal was to build confidence in three layers of the app independently, then verify the layers work together correctly.

**Approach:**
- **Unit tests** target pure logic in isolation: model classes (`Task`, `PriorityTask`, `User`) and the data-processing functions in `taskProcessor.js`. These have no network dependency, so they run instantly and deterministically.
- **Integration tests** target `APIClient`, which does depend on the outside world (`fetch`). Rather than hitting the real JSONPlaceholder API (slow, flaky, and rate-limited), `global.fetch` is replaced with `jest.fn()` for every test, so the real `APIClient` code runs against a controlled fake network.
- **Data-flow tests** go one level higher and simulate the whole pipeline — fetch → transform → model — using a hand-written mock API client (`tests/__mocks__/api.js`) so the wiring between modules is verified without any real I/O.

**Deciding what to test:** every public method on every class, every exported function in `taskProcessor.js`, and every code path in `api.js` (success, network failure, non-OK HTTP status, malformed JSON, caching). Edge cases (empty arrays, missing fields, invalid dates, division-by-zero) were treated as first-class test cases, not afterthoughts, since that's usually where real bugs hide.

## Test Types Implemented

### Unit Tests — `tests/unit/models.test.js`
- **Task**: constructor (all fields, defaults, missing fields), `toggle()`, `getStatus()`, `isOverdue()` (always false at the base class), `toString()`, and edge cases (empty title, null id).
- **PriorityTask**: inheritance checks (`instanceof` for both classes), priority/due-date defaults, the overdue date-comparison logic (past/future/completed/no-date), the overridden `getStatus()`/`toString()` that call into the parent via `super`, and priority-level handling.
- **User**: constructor and array-copy semantics, `addTask()` (single/multiple via rest params, chaining), `getCompletionRate()` (including the 0-task division-by-zero guard and rounding), `getTasksByStatus()`, and `summary()`.

Rationale: these classes carry the core domain logic and inheritance behavior called out in the lab spec, so they got the deepest coverage.

### Unit Tests — `tests/unit/taskProcessor.test.js`
Every exported function is tested with valid data, empty arrays, and edge cases:
`mapTodosToTasks`, `filterByStatus`, `filterByUser`, `filterByPriority`, `filterOverdue`, `searchTasksByTitle` (the lab's "searchByProperty"), `calculateStatistics`, `groupByUser`, `getUniquePriorities`, `sortTasks` (the lab's "sortBy"), and `updateTask`. Immutability is explicitly checked (`filterByStatus`, `sortTasks`, `updateTask` never mutate their inputs).

### Unit Tests — `tests/unit/utils.test.js` (spies + error handling)
- Spies on `Array.prototype.filter/reduce/sort` verify that `taskProcessor.js` functions actually delegate to native array methods rather than hand-rolled loops.
- Spies on `console.log`/`console.error` verify `APIClient`'s graceful-fallback logging without printing to the real console during test runs.
- A spy on `Task.prototype.getStatus` verifies `PriorityTask.getStatus()` genuinely calls `super.getStatus()` instead of duplicating logic.
- A spy on `user.getCompletionRate` verifies `summary()` reuses it instead of recomputing the rate inline.
- Dedicated error-handling tests cover `APIError`'s shape, throwing/catching behavior, and constructor edge cases (empty data, invalid date strings, `undefined` input).

### Integration Tests — `tests/integration/api.test.js`
`global.fetch` is mocked per test. Covers: `fetchUsers`, `fetchTodos`, `fetchUserTodos` (correct query string), `fetchAllData` (`Promise.all` concurrency, exactly 2 fetch calls), non-OK responses (400/404/500/503), network-level rejections, malformed-JSON responses, the internal cache (`clearCache()` forces a refetch), and the `.then()`-based `fetchUsersPromise()` variant.

**Mocking strategy:** `global.fetch` is stubbed directly rather than mocking the whole `api.js` module, because the object under test *is* `APIClient` — only its one external dependency (the network) needs faking. `tests/__mocks__/api.js` exports a `mockFetchResponse()` helper that builds a fetch-shaped `{ ok, status, json() }` object, plus static fixture data (`mockUsers`, `mockTodos`).

### Integration Tests — `tests/integration/dataFlow.test.js`
Three complete workflows, each starting from a mocked `APIClient` (`createMockApiClient()`) and ending at fully-built model instances:
1. Fetch todos → `mapTodosToTasks()` → verify `Task`/`PriorityTask` split matches the `id % 3` rule.
2. Fetch users + todos → `groupByUser()` → construct `User` instances with attached tasks → verify per-user completion rates and the "no tasks assigned" edge case.
3. Fetch → transform → `calculateStatistics()` / `filterOverdue()`, and a single-user fetch (`fetchUserTodos`) piped through the same transform.

## Test Coverage Analysis

```
------------------|---------|----------|---------|---------|-------------------
File              | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
------------------|---------|----------|---------|---------|-------------------
All files         |   99.28 |    98.57 |     100 |   99.15 |                   
 api.js           |   97.67 |       90 |     100 |   97.67 | 132               
 models.js        |     100 |      100 |     100 |     100 |                   
 taskProcessor.js |     100 |      100 |     100 |     100 |                   
------------------|---------|----------|---------|---------|-------------------
Test Suites: 5 passed, 5 total
Tests:       138 passed, 138 total
Snapshots:   0 total
Time:        1.389 s
```
*(Terminal coverage summary from `npm run test:coverage`, captured in lieu of a GUI screenshot since this environment has no browser to screenshot the HTML report — the same numbers are in `coverage/lcov-report/index.html` after running the command.)*

- **Overall: 99.28% statements / 98.57% branches / 100% functions / 99.15% lines** — well above the 80/75/85/80 targets.
- `models.js` and `taskProcessor.js` are at 100% across every metric.
- The single uncovered line is `api.js:132`, the `throw new APIError(...)` inside `fetchAllData()`'s `catch` block. **Intentionally uncovered:** `fetchAllData()` calls `this.fetchUsers()` and `this.fetchTodos()`, both of which already catch every possible error internally and resolve with `[]` instead of rejecting — so the `catch` in `fetchAllData()` is unreachable through the public API. It's kept as defensive coding (e.g., in case a future refactor removes the inner try/catch), not as dead code to delete.
- `main.js` (the CLI entry point / `TaskManager` orchestrator) is excluded from coverage collection (`collectCoverageFrom` excludes it in `package.json`) because it's an interactive `readline` CLI with a top-level side effect (`main()` runs on import), which isn't practical to unit test in the same way as the pure/async modules — testing it thoroughly would require driving a full interactive session, which is out of scope for this lab's deliverables.

## Challenges & Solutions

1. **Challenge — Jest + native ES modules.** The project uses `import`/`export` directly (no bundler/Babel). Jest's default CommonJS-oriented pipeline doesn't understand that out of the box.
   **Solution:** set `"type": "module"` in `package.json` and run Jest with Node's experimental VM modules flag (`node --experimental-vm-modules node_modules/.bin/jest`), with `transform: {}` in the Jest config so nothing tries to re-transpile the ESM source.
   **Lesson:** test tooling needs to match the module system of the app; retrofitting Babel just to satisfy the test runner would have added a build step the app itself doesn't need.

2. **Challenge — `jest` globals not defined inside non-test ESM files.** `tests/__mocks__/api.js` and other helper modules threw `ReferenceError: jest is not defined` even though the same globals worked fine directly inside `*.test.js` files.
   **Solution:** explicitly `import { jest } from '@jest/globals'` in any non-test-file module that needs `jest.fn()`/`jest.spyOn()`. Jest only auto-injects its globals into the files it directly treats as test files under pure-ESM mode; helper modules need the explicit import.
   **Lesson:** under ESM, don't assume Jest's implicit globals are available everywhere — import them explicitly wherever they're used outside a `*.test.js` file.

3. **Challenge — a self-defeating test assertion.** An early version of the `filterByPriority()` test called `filterByPriority(tasks, undefined)` expecting it to exclude plain `Task` instances, but plain `Task` objects have `priority === undefined`, so they matched `undefined` and the assertion failed.
   **Solution:** rewrote the test to filter by a concrete, realistic priority value (`'low'`) and assert every result actually is a `PriorityTask`, which is the behavior that actually matters.
   **Lesson:** when a test fails, check the test's own logic before assuming the source code is wrong — `undefined` matching `undefined` was correct behavior, not a bug.

## Key Learnings

- **Unit testing** works best when the code under test has no side effects — `models.js` and `taskProcessor.js` were fast and easy to test exhaustively precisely because they're pure/deterministic.
- **Integration testing** is really about faking the *boundary* of the system (here, `fetch`) rather than mocking everything — stubbing `global.fetch` let the real `APIClient` logic (caching, error wrapping, retries-via-fallback) run genuinely, which caught more than a fully-mocked `APIClient` would have.
- **Mocking and spying** are different tools for different jobs: mocks replace a dependency's behavior entirely (mock `fetch` responses); spies observe real behavior without replacing it (verifying `Array.prototype.filter` was actually called, or that `super.getStatus()` really runs).
- Writing tests surfaced a real design question: `fetchAllData()`'s `catch` block is unreachable given how its two callees already swallow their own errors — a good example of tests revealing dead/defensive code rather than bugs.
- Best practice reinforced repeatedly: **one behavior per test**, restore/clear mocks in `afterEach`, and prefer testing *observable behavior* (return values, calls made) over internal implementation details wherever possible — except where the lab specifically asked to verify internal calls (spies), which is a deliberate, narrower exception.

## Differences Between Test Types (with examples from this project)

| Type | Scope | Speed | What it verifies | Example here |
|---|---|---|---|---|
| **Unit** | One function/class/method in isolation | Milliseconds, no I/O | The unit's own logic is correct for all inputs it can receive | `PriorityTask.isOverdue()` returns the right boolean for past/future/no-date/completed combinations |
| **Integration** | Two or more real modules working together, external dependencies faked at the boundary | Fast, but slower than pure unit tests (async, more setup) | The modules cooperate correctly — right calls, right data shape, right error propagation | `APIClient.fetchUserTodos(1)` calls the mocked `fetch` with `.../todos?userId=1` and returns only that user's todos |
| **End-to-end (E2E)** | The entire real system, including the real network/UI | Slowest, least deterministic | The user-facing outcome works against the real, live system | *(not implemented here — would mean running `main.js`'s CLI against the real JSONPlaceholder API and asserting on printed output)* |

**When to use each:** unit tests first and most often (cheap, pinpoint failures precisely); integration tests wherever two pieces must agree on a contract (a class calling an API, a processor consuming API-shaped data); E2E sparingly, for the handful of critical user journeys, since they're expensive to write and maintain and tell you *something* is broken without saying exactly what.
