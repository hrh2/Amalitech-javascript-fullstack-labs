# Task Manager API Client

An advanced JavaScript project that fetches, processes, and manages task
data from the [JSONPlaceholder](https://jsonplaceholder.typicode.com) API,
built to showcase modern ES6+ JavaScript, async programming, OOP, and
modular code architecture.

## Requirements

- Node.js 18+ (uses native `fetch`; developed/tested on Node 22)

## Setup

```bash
npm install   # installs Jest as the only dependency (dev-only)
npm start     # runs main.js
```

or simply:

```bash
node main.js
```

## Testing

This project has a full Jest test suite (unit, integration, mocks & spies).
See [`TESTING_DOCUMENTATION.md`](./TESTING_DOCUMENTATION.md) for the full
write-up (strategy, coverage analysis, challenges, key learnings).

```bash
npm test            # run the full suite once
npm run test:watch  # re-run on file changes
npm run test:coverage  # run with a coverage report (text + coverage/ dir)
```

Because the source code uses native ES modules (no bundler), tests run via
Node's experimental VM-modules support — this is already wired up in the
`test` scripts in `package.json`, so `npm test` just works.

138 tests currently pass, with 99%+ statement/line coverage (well above the
80% target) — see `TESTING_DOCUMENTATION.md` for the full breakdown.

## Project Structure

```
task-manager-app/
├── package.json
├── README.md
├── TESTING_DOCUMENTATION.md
├── api.js                        # APIClient class - all network/API logic
├── models.js                     # Task, PriorityTask, User classes
├── taskProcessor.js              # filter/map/reduce data-processing utilities
├── main.js                       # TaskManager controller + CLI entry point
└── tests/
    ├── unit/
    │   ├── models.test.js        # Task / PriorityTask / User unit tests
    │   ├── taskProcessor.test.js # data-processing function unit tests
    │   └── utils.test.js         # spies (Array methods, console) + error handling
    ├── integration/
    │   ├── api.test.js           # APIClient integration tests (mocked fetch)
    │   └── dataFlow.test.js      # full fetch -> transform -> model workflows
    └── __mocks__/
        └── api.js                # mock fixtures + mock APIClient
```

## How It Works

1. **`api.js`** — `APIClient` fetches `/users` and `/todos` from
   JSONPlaceholder. Provides both a `.then()`-based method
   (`fetchUsersPromise`) and `async/await` methods, uses `Promise.all()`
   for concurrent fetching in `fetchAllData()`, includes a closure-based
   cache to avoid redundant requests, and throws a custom `APIError` on
   failures (network errors, bad status codes, malformed JSON).

2. **`models.js`** — `Task` is the base class (`toggle()`, `isOverdue()`,
   `getStatus()`). `PriorityTask extends Task`, adding `priority` and
   `dueDate`, and overrides `isOverdue()`/`getStatus()` with
   priority-aware logic. `User` holds a list of `Task`/`PriorityTask`
   instances and computes stats like `getCompletionRate()`.

3. **`taskProcessor.js`** — Pure functions that transform raw API data
   into class instances (`mapTodosToTasks`) and derive information from
   them: filtering by status/user/priority, full-text search, sorting,
   `reduce()`-based statistics, grouping into a `Map` by user, and
   collecting unique priorities into a `Set`.

4. **`main.js`** — A `TaskManager` controller class wires the pieces
   together (load → process → expose), and a small `readline`-based CLI
   menu lets you explore the data interactively:
   - Show overall statistics
   - List all users with completion rates
   - List tasks for a specific user
   - List overdue priority tasks
   - Search tasks by title
   - Show unique priority levels in use

## Notes on Data

JSONPlaceholder's `/todos` don't include priority or due-date fields, so
`mapTodosToTasks()` deterministically promotes every 3rd todo into a
`PriorityTask` with a synthetic `dueDate`/`priority`, purely so the
inheritance and "overdue" logic have real data to operate on. Swap this
out for real fields if you point the client at a different API.

## ES6+ Features Used

Arrow functions, destructuring, template literals, spread/rest operators,
default parameters, optional chaining, `Map`/`Set`, ES modules
(`import`/`export`), classes with inheritance, `Promise.all()`, and
`async/await` throughout.

>by **Hope HIRWA RUKUNDO**
