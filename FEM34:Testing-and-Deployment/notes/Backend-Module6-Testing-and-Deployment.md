# Module 6: Testing & Deployment
### Backend Development with JavaScript

> **Scope note:** This document covers Module 6, the capstone: testing APIs manually with **Postman** and automating those flows with **Newman**; writing **unit and integration tests with Jest and Supertest** (and the built-in Node.js test runner as an alternative); configuring **environment variables** for development, test and production; **Git and GitHub**; **deploying to Vercel (or Render)**; and **logging and monitoring** a live deployment. It ends with the Resource Book's hands-on challenge, **The "CI/CD" Pipeline**. Anything beyond — containers in depth (Module 4, Sections 11–12 introduced Docker), end-to-end browser tests, load testing, infrastructure-as-code, advanced monitoring and alerting, security audits — is flagged **🔒 Coming Later — Outside This Module**. *I have only seen the first six module files, so "later" means "not taught here."*
>
> **Things about the module file worth knowing before you start**
> 1. It has a title, objectives, a Resource Book and one challenge. It has **no module code, no lesson table, no live sessions, no quiz and no discussion prompt**, so none is shown or invented. Section 14 has practice questions of my own, labelled as such.
> 2. **The "Learning Approach" text doesn't match the rest of the file.** It says the module focuses on *containerization* ("What is Docker?", "Writing a Dockerfile") and a *"Deploying the API"* lab judged on Docker builds. The objectives, the Resource Book and the challenge are about **testing, Git, Vercel/Render and logging** — there is no Docker material in them. I followed the objectives, resources and challenge. Docker and Compose are in the Module 4 notes (Section 11), which I point to rather than repeat.
> 3. **The first Fireship link is a mix-up, and your file says so itself.** The "Postman" entry links `uEVmD6n8Il0` and then notes that this video is actually **"7 Ways to Deploy"**, not a Postman video. The *Deployment Strategies* entry has a "Fireship" video with **no link at all** and a description (an overview of VPS, serverless and containers) that matches "7 Ways to Deploy". So I placed that link under **Deployment Strategies (Section 6)**, and **no Postman video link exists in your file** — only the recommended search *"Postman API Testing for Beginners"*. If you send a Postman link, I'll add it.
> 4. Two objectives have **no resource**: *Configure environment variables for safe development and production* and *Use Git and GitHub for version control* (the challenge only uses Git in passing). Sections 4 and 5 are my own treatment, built on Module 4, Section 8.
> 5. The challenge says to use *"your previous Task Manager or Product API project"*. The notes use a compact **layered Task API** (like the ones in Modules 2–5) so every command here is concrete and was run.
> 6. **Versions** (checked November 2026): **Jest 30.5.2**, **Supertest 7.3.1**, **pino 10.4.0**, **pino-http 11.0.0**, **Newman 6.2.3**, Express 5.3.0, Git 2.43. These notes were run on **Node 22.23** (an LTS line; everything here also works on Node 24).
> 7. **What I could not run:** the actual **Vercel and Render deployments**, pushing to **GitHub**, and a **GitHub Actions** run — I have no accounts or credentials there. For those, the notes rely on the platforms' **current documentation** (read in November 2026; platforms change often, so check the docs before you rely on a detail) and say so. What I *could* check was checked: the workflow file is valid YAML, its commands were **dry-run on a clean install**, the Git workflow was run locally, and the deployment-ready code was run. Postman's graphical interface was not run, but **its test scripts were run with Newman**.

---

## How this document is organized

Same practical shape as the earlier notes: **What is it? → Why does it exist? → How does it work? → Syntax → Examples → When to use / not use → Try it yourself → Exercises → Common mistakes → Knowledge check.** One small project runs through the module — a **layered Task API** with a `GET /health` endpoint — and by the end it is **tested, version-controlled, logged and deployable**.

## Table of Contents

- [Before You Start: Prerequisites](#before-you-start-prerequisites)
- [1. API Testing and Automation with Postman](#1-api-testing-and-automation-with-postman)
- [2. Automated Tests with Jest and Supertest](#2-automated-tests-with-jest-and-supertest)
- [3. The Built-in Node.js Test Runner](#3-the-built-in-nodejs-test-runner)
- [4. Environment Variables: Development, Test and Production](#4-environment-variables-development-test-and-production)
- [5. Version Control with Git and GitHub](#5-version-control-with-git-and-github)
- [6. Deployment Strategies](#6-deployment-strategies)
- [7. Deploying to Vercel](#7-deploying-to-vercel)
- [8. Deploying to Render](#8-deploying-to-render)
- [9. Logging and Monitoring](#9-logging-and-monitoring)
- [10. Hands-On Challenge: The CI/CD Pipeline](#10-hands-on-challenge-the-cicd-pipeline)
- [11. Final Module Project: A Tested, Logged and Deployed API](#11-final-module-project-a-tested-logged-and-deployed-api)
- [12. Quick Reference Sheet](#12-quick-reference-sheet)
- [13. Source & Resource Mapping](#13-source--resource-mapping)
- [14. Practice Questions](#14-practice-questions)
- [15. Glossary](#15-glossary)

---

## Before You Start: Prerequisites

| You should be able to… | Where it was taught |
|---|---|
| Build an Express API with routers, middleware, status codes and a global error handler | Backend Modules 2 and 5 |
| Split an app into layers (route → service → repository) | Backend Module 5, Section 1 |
| Test an endpoint by hand with `curl` or Postman, and run a Postman collection with Newman | Backend Module 2, Section 6 |
| Read configuration from environment variables with a `config.js` that fails fast, and keep secrets out of Git | Backend Module 4, Section 8 |
| Use `async`/`await` and know that an unhandled rejection crashes the process | Backend Module 5, Section 6 |
| Know what Docker and Compose are, and the deployment checklist (port from `PORT`, variables in the platform, a hosted database, a health endpoint) | Backend Module 4, Sections 11–12 |
| *(Optional)* How Angular's tests were organized (Jest, the test pyramid) | Angular Module 10 |

**Why this module?** Your Resource Book frames it as the capstone: *"How do I get my application on the internet?"* — and the challenge adds the discipline that makes that safe: *"You need to ensure it doesn't break before deploying it."* So the order of the module is the order of a professional workflow: **verify** (tests) → **record** (Git) → **ship** (deploy) → **observe** (logs and monitoring).

**Prerequisite self-check** (answers in Section 14):

1. What does an Express app need to export so that a test (or a serverless platform) can use it without opening a port?
2. Which status code should an unknown route return, and in what JSON shape (from Module 5)?
3. Where do secrets belong, and where must they never go?
4. What happens, by default, when a Promise rejects and nothing handles it?

---

## 1. API Testing and Automation with Postman

*(Resource Book, section 1 — "API Testing & Automation". Before writing code tests, learn how to verify your API behaves as expected from a user's perspective. Objective: test APIs manually using Postman and automate flows.)*

> ⚠️ **No usable video link for this section.** The Fireship link in your file's Postman entry (`https://www.youtube.com/watch?v=uEVmD6n8Il0`) is described by your file's own note as *"7 Ways to Deploy"*, not a Postman video, so it appears under **Section 6** instead. The file's recommended search for this section is **"Postman API Testing for Beginners"**. *(I haven't watched any video; if you send a Postman link I'll place it here.)*

### 1.1 Manual testing: what it is and why do it first

**Manual API testing** means sending requests yourself and reading the responses — "from a user's perspective", as your Resource Book puts it. You did this with `curl` in earlier modules; **Postman** is a graphical tool for it: you build requests, save them in **collections**, and inspect responses without typing commands. Manual testing is the fastest way to **explore** (does this endpoint behave the way I think?) and to **reproduce a bug** someone reports.

Its weakness: it depends on a person remembering to do it. That is what automation (the rest of this section, and Section 2) fixes.

### 1.2 The pieces of Postman

| Piece | What it is |
|---|---|
| **Request** | A method, a URL, headers, a body — e.g. `POST {{baseUrl}}/tasks` |
| **Collection** | A saved, ordered group of requests (and their tests) — the unit you share and automate |
| **Environment** | A named set of **variables** for one target — `local` (`baseUrl = http://localhost:3000`), `production` (`baseUrl = https://my-api.vercel.app`). Switching environment re-points every request |
| **Variables** | `{{baseUrl}}` in a request is replaced by the active value. Scopes (collection, environment, global) decide where a value lives |
| **Tests** | JavaScript run *after* the response arrives, using the `pm` object — this is where "manual" becomes "automated" |
| **Collection Runner** | Runs a whole collection in order and reports passes and failures |

The key habit: **never hard-code the host**. Put it in an environment variable so the *same* collection tests your laptop and your live deployment.

### 1.3 Writing tests in Postman

A request's **Tests** tab runs after the response. These scripts were run (with Newman, Section 1.4) against the Task API:

```javascript
// Health check
pm.test('status is 200', () => pm.response.to.have.status(200));
pm.test('body says ok', () => pm.expect(pm.response.json().status).to.eql('ok'));
pm.test('responds quickly (< 500 ms)', () => pm.expect(pm.response.responseTime).to.be.below(500));

// Create task
pm.test('status is 201', () => pm.response.to.have.status(201));
const task = pm.response.json();
pm.collectionVariables.set('taskId', task.id);          // chain: later requests use this id

// Get task            (URL: {{baseUrl}}/tasks/{{taskId}})
pm.test('status is 200', () => pm.response.to.have.status(200));
pm.test('title matches', () => pm.expect(pm.response.json().title).to.eql('Learn CI/CD'));
```

- **`pm.test(name, fn)`** defines one assertion; it passes if `fn` doesn't throw.
- **`pm.response`** is the response: `.to.have.status(...)`, `.json()`, `.responseTime`, `.headers`.
- **`pm.expect(value).to...`** is a Chai-style assertion (`.to.eql`, `.to.be.below`).
- **`pm.collectionVariables.set(name, value)`** stores a value for later requests — the way to **chain** requests (use the id returned by *Create* in *Get* and *Delete*).

### 1.4 Automating a flow: collection → Runner → Newman

A **flow** is a sequence of requests that depend on each other. This collection (five requests, eight assertions) was run:

| # | Request | Assertions | Sets / uses |
|---|---|---|---|
| 1 | `GET {{baseUrl}}/health` | 200; body `status` is `ok`; response under 500 ms | — |
| 2 | `POST {{baseUrl}}/tasks` `{"title":"Learn CI/CD"}` | 201 | **sets** `taskId` |
| 3 | `GET {{baseUrl}}/tasks/{{taskId}}` | 200; title matches | **uses** `taskId` |
| 4 | `DELETE {{baseUrl}}/tasks/{{taskId}}` | 204 | uses `taskId` |
| 5 | `GET {{baseUrl}}/tasks/{{taskId}}` | 404 (it is gone) | uses `taskId` |

In Postman, the **Collection Runner** runs it from the app. To run the same collection **without the app** — from a terminal, a script or a CI pipeline — use **Newman**, Postman's command-line runner (Module 2, Section 6 introduced it):

```bash
npm install --save-dev newman
npx newman run flow.postman_collection.json -e local.postman_environment.json
```

(`flow.postman_collection.json` is the collection exported from Postman; `local.postman_environment.json` is the exported environment holding `baseUrl`.) The output:

```text
Task API smoke flow

→ Health check
  GET http://localhost:3000/health [200 OK, 268B, 26ms]
  ✓  status is 200
  ✓  body says ok
  ✓  responds quickly (< 500 ms)

→ Create task
  POST http://localhost:3000/tasks [201 Created, 308B, 9ms]
  ✓  status is 201

→ Get task
  GET http://localhost:3000/tasks/1 [200 OK, 283B, 3ms]
  ✓  status is 200
  ✓  title matches

→ Delete task
  DELETE http://localhost:3000/tasks/1 [204 No Content, 175B, 2ms]
  ✓  status is 204

→ Get deleted task
  GET http://localhost:3000/tasks/1 [404 Not Found, 289B, 3ms]
  ✓  status is 404

│              requests │               5 │               0 │
│            assertions │               8 │               0 │
exit code: 0
```

Notice `taskId` flowed through: the id returned by *Create* (`1`) is the one *Get* and *Delete* used. **The exit code is the key to automation**: `0` means every assertion passed. When I changed the *Create* test to expect `200` instead of `201`:

```text
│            assertions │               8 │               1 │

  #  failure         detail
 1.  AssertionError  status is 200
                     expected response to have status code 200 but got 201
                     inside "Create task"
exit code: 1
```

Newman **names the failing assertion and the request**, and exits **`1`**. A CI pipeline treats a non-zero exit code as "the build failed" — so a broken flow stops a deploy. For CI systems that display test results, Newman can also write a **JUnit XML report** (`--reporters cli,junit --reporter-junit-export results.xml`); that was run too and produced a valid report.

**The same collection, a different target.** Because the host is `{{baseUrl}}`, running the flow against your **deployed** API is just another environment (`production`, with the live URL) — exactly the "Verify" step of the challenge (Section 10).

### 1.5 Exploratory testing checklist

Before (or alongside) automated tests, try the things users and attackers do:

- **Happy path:** valid input → the right status and body.
- **Validation:** missing fields, wrong types, empty strings, boundary values (0, −1, huge numbers).
- **Malformed input:** invalid JSON, wrong `Content-Type`, no body at all.
- **Missing or wrong IDs:** `/tasks/99`, `/tasks/abc`.
- **Unknown routes and methods.**
- **Auth (if present):** no token, expired token, another user's data (Module 4).
- **Repeat it:** create the same thing twice; delete twice.
- **Read the error shape:** is it the standard JSON, never an HTML stack trace?

### Try it yourself

1. In Postman (or with `curl`), create an environment with `baseUrl`, build the five requests above and add the test scripts. Run the collection in the **Collection Runner**.
2. Export the collection and environment and run them with `npx newman run`. Break one assertion on purpose and read the failure and the exit code (`echo $?`).
3. Change `baseUrl` to point at a different port and see which requests fail.

### Exercises

**Level 1 — Basic:** Add a request `GET {{baseUrl}}/nope` with a test that expects `404` and a JSON `status` of `error`.

**Level 2 — Practical:** Add a *Create* request with an empty title and tests that expect `400` and the message `title is required`.

**Level 3 — Challenge:** Make the collection runnable in CI: a script `npm run test:api` that starts the API on a free port, runs Newman against it, stops the API, and exits with Newman's exit code.

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| Hard-coding `http://localhost:3000` in every request | You can't reuse the collection against production | `{{baseUrl}}` from an environment |
| Tests that never assert (just sending requests) | Nothing can fail, so nothing is verified | `pm.test` with explicit expectations |
| Using a stale `taskId` | Later requests hit the wrong item | Set the variable in the test of the request that creates it |
| Assuming Newman "succeeded" because it printed output | A run can print failures and still be ignored | Check the **exit code** (`0` = all passed) |
| Committing an environment file with real tokens or passwords | Secrets leak (Module 4) | Keep secrets out of exported files; use `.gitignore` |
| Testing only the happy path | The bugs are in the error paths | Use the exploratory checklist |

### ✅ Knowledge Check
1. What is the difference between a Postman *request*, *collection* and *environment*?
2. Why use `{{baseUrl}}` instead of the literal address?
3. How does one request pass a value (like an id) to the next?
4. What does Newman return when an assertion fails, and why does that matter for automation?
5. What's the advantage of running the *same* collection against the deployed URL?

---

## 2. Automated Tests with Jest and Supertest

*(Resource Book, section 1. Objective: write unit and integration tests with Jest and Supertest.)*

> 📺 **Video for this section — [Sam Meech-Ward](https://www.youtube.com/watch?v=FKnzS_icp20)**
> Your module file describes it as: *"This is the critical video for this section. It covers setting up Jest and Supertest to automatically test your Express routes."* *(I haven't watched it; the description is from your file.)*

### 2.1 Why automated tests, and which kinds

Postman flows verify the API *from outside*, when someone runs them. **Code tests** live in your repository and run **on every change** — in seconds, with no server to start by hand. They catch a broken route *before* it is deployed, which is exactly the challenge's scenario.

| Kind | What it checks | In this API | Speed |
|---|---|---|---|
| **Unit test** | One piece of logic **in isolation** — its dependencies replaced by fakes | `taskService.createTask` with a **mock** repository | Fastest |
| **Integration test** | Several pieces **working together** | A real HTTP request through route → service → (in-memory) repository | Fast |
| **End-to-end test** | The whole system, often through a real browser | 🔒 outside this module (Cypress/Playwright, Angular Module 10) | Slowest |

A healthy suite has **many unit tests, a good number of integration tests and few end-to-end tests** (the "test pyramid" from the Angular notes). The layered architecture of Module 5 makes the first two easy: the service has no HTTP in it, and the app can be driven without a network.

Two tools do the work:

- **Jest** — the test **runner**: it finds your test files, runs them, provides `describe`/`it`/`expect`, mocking, and reports results.
- **Supertest** — sends HTTP requests **to your Express `app` object directly** (it starts a temporary server internally), with assertions on the response. No `app.listen`, no port conflicts.

### 2.2 Make the app testable: export it, don't start it

A test must be able to `require` your app **without** it opening a port. So the code is split in two files — and this split is also what serverless platforms want (Section 7):

```javascript
// src/app.js - builds and EXPORTS the Express app. It does not listen.
const express = require('express');
const pinoHttp = require('pino-http');
const logger = require('./logger');
const taskRoutes = require('./tasks/taskRoutes');
const { notFound, errorHandler } = require('./errorHandler');

const app = express();

app.use(pinoHttp({ logger }));          // one structured log line per request
app.use(express.json());

// Health check: used by you, by uptime monitors and by hosting platforms.
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptimeSeconds: Math.round(process.uptime()) });
});

app.use('/tasks', taskRoutes);

app.use(notFound);
app.use(errorHandler);

// Export the app WITHOUT listening: tests and serverless platforms import it; src/start.js listens locally.
module.exports = app;
```

```javascript
// src/start.js - the ONLY file that opens a port (for running locally or on a server platform).
const app = require('./app');
const config = require('./config');
const logger = require('./logger');

const server = app.listen(config.port, () => {
  logger.info({ port: config.port, env: config.nodeEnv }, 'server started');
});

// Log anything that escaped, then exit so the platform can restart a clean copy.
process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'unhandled rejection');
  process.exit(1);
});

function shutdown(signal) {
  logger.info({ signal }, 'shutting down');
  server.close(() => process.exit(0));
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
```

The rest of the Task API is the layered code from Module 5 in miniature — a repository with `reset()` (so tests can start clean), a service with the business rules, thin routes:

```javascript
// src/tasks/taskRepository.js - an in-memory data layer; reset() exists so tests can start from a known state
let tasks = [];
let nextId = 1;

module.exports = {
  async findAll() { return [...tasks]; },
  async findById(id) { return tasks.find((t) => t.id === id) ?? null; },
  async create({ title }) {
    const task = { id: nextId++, title, completed: false };
    tasks.push(task);
    return task;
  },
  async remove(id) {
    const index = tasks.findIndex((t) => t.id === id);
    return index === -1 ? null : tasks.splice(index, 1)[0];
  },
  reset() { tasks = []; nextId = 1; }
};
```
```javascript
// src/tasks/taskService.js - business rules; no req/res, no storage details
const repository = require('./taskRepository');
const { NotFoundError, ValidationError } = require('../errors');

async function listTasks() {
  return repository.findAll();
}

async function getTask(id) {
  const task = await repository.findById(id);
  if (!task) throw new NotFoundError(`Task ${id} not found`);
  return task;
}

async function createTask({ title }) {
  if (typeof title !== 'string' || title.trim() === '') {
    throw new ValidationError('title is required');
  }
  return repository.create({ title: title.trim() });
}

async function deleteTask(id) {
  const removed = await repository.remove(id);
  if (!removed) throw new NotFoundError(`Task ${id} not found`);
}

module.exports = { listTasks, getTask, createTask, deleteTask };
```
```javascript
// src/tasks/taskRoutes.js
const express = require('express');
const service = require('./taskService');

const router = express.Router();

router.get('/', async (req, res) => {
  res.json(await service.listTasks());
});

router.get('/:id', async (req, res) => {
  res.json(await service.getTask(Number(req.params.id)));
});

router.post('/', async (req, res) => {
  const task = await service.createTask(req.body ?? {});
  res.status(201).location(`/tasks/${task.id}`).json(task);
});

router.delete('/:id', async (req, res) => {
  await service.deleteTask(Number(req.params.id));
  res.sendStatus(204);
});

module.exports = router;
```
(The error classes and the error handler are the Module 5 ones: `NotFoundError` → `404`, `ValidationError` → `400`, any bug → a generic `500`, all in `{ status: "error", message }`.)

### 2.3 Setup

```bash
npm install --save-dev jest supertest
```

`package.json`:

```json
{
  "scripts": {
    "start": "node src/start.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "jest": {
    "testEnvironment": "node",
    "setupFiles": ["./jest.setup.js"],
    "testMatch": ["<rootDir>/tests/**/*.test.js"],
    "collectCoverageFrom": ["src/**/*.js", "!src/start.js"]
  }
}
```

- **`"test": "jest"`** — so `npm test` runs the suite (this is also what CI and the challenge will call).
- **`testEnvironment: "node"`** — a Node environment, not a browser one.
- **`testMatch`** — which files are tests. Pinning it to `tests/` matters (Section 3.3 shows what goes wrong when you don't).
- **`setupFiles`** — code that runs before each test file:

  ```javascript
  // jest.setup.js - keep the logger quiet so test output stays readable
  process.env.LOG_LEVEL = 'silent';
  ```
- **`NODE_ENV`** — Jest sets it to **`test`** automatically. This was checked: inside a test, `process.env.NODE_ENV` is `test` and `LOG_LEVEL` is `silent`. Your code can use that to behave differently under test (Section 4).

Jest finds files named `*.test.js` (or `*.spec.js`) and runs each in isolation.

### 2.4 The first test: `GET /health` (the challenge's test)

```javascript
const request = require('supertest');
const app = require('../src/app');

describe('GET /health', () => {
  it('responds 200 OK with status "ok"', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.headers['content-type']).toMatch(/json/);
  });
});
```

```text
PASS tests/health.test.js
  GET /health
    ✓ responds 200 OK with status "ok" (4 ms)
```

Anatomy:

| Piece | Meaning |
|---|---|
| `describe('name', () => { … })` | Groups related tests |
| `it('does something', async () => { … })` (alias `test`) | One test; it fails if anything inside throws or rejects |
| `request(app).get('/health')` | Supertest: send `GET /health` straight to the Express app; returns a Promise of the response |
| `await` | Wait for the response. **Always await** (see 2.9) |
| `expect(actual).toBe(expected)` | An assertion. `toBe` compares with `Object.is` (primitives); **`toEqual`** compares objects/arrays by content; `toMatch` tests a regular expression |

A good test follows **Arrange – Act – Assert**: set up the situation, perform one action, check the result.

### 2.5 Integration tests for the routes

An **integration test** sends a real HTTP request through the real route → service → repository chain:

```javascript
const request = require('supertest');
const app = require('../src/app');
const repository = require('../src/tasks/taskRepository');

beforeEach(() => repository.reset());          // every test starts from the same empty state

describe('/tasks', () => {
  it('starts with an empty list', async () => {
    const res = await request(app).get('/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('creates a task: 201, a Location header and the new task', async () => {
    const res = await request(app).post('/tasks').send({ title: '  Write tests  ' });

    expect(res.status).toBe(201);
    expect(res.headers.location).toBe('/tasks/1');
    expect(res.body).toEqual({ id: 1, title: 'Write tests', completed: false });
  });

  it('rejects a task without a title: 400', async () => {
    const res = await request(app).post('/tasks').send({ completed: true });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ status: 'error', message: 'title is required' });
  });

  it('rejects malformed JSON: 400', async () => {
    const res = await request(app).post('/tasks').set('Content-Type', 'application/json').send('{"title": ');
    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  it('returns 404 for a task that does not exist', async () => {
    const res = await request(app).get('/tasks/99');
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Task 99 not found');
  });

  it('supports a whole flow: create -> read -> delete -> gone', async () => {
    await request(app).post('/tasks').send({ title: 'Flow' }).expect(201);
    await request(app).get('/tasks/1').expect(200).expect((res) => expect(res.body.title).toBe('Flow'));
    await request(app).delete('/tasks/1').expect(204);
    await request(app).get('/tasks/1').expect(404);
  });

  it('answers unknown routes with the standard JSON error', async () => {
    const res = await request(app).get('/nope');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ status: 'error', message: 'Route not found: GET /nope' });
  });
});
```

- **`request(app).post('/tasks').send({...})`** sends a JSON body (Supertest sets the header). **`.set('Header', 'value')`** sets a header; the malformed-JSON test sends a raw string.
- **`beforeEach(() => repository.reset())`** is the most important line: **tests must not depend on each other**. Each starts from a known state, so they pass in any order.
- **`.expect(201)`** is Supertest's own shortcut for a status assertion; chained calls make a **flow** test read like the Postman flow in Section 1 — create, read, delete, confirm it's gone.
- The second test checks the **contract**, including the `Location` header the API promises (Module 2).

### 2.6 Unit tests with mocks

A **unit test** checks one piece in isolation. The service's only dependency is the repository, so we replace it with a **mock** — a fake whose answers we control — and test the rules alone, with no HTTP and no data layer:

```javascript
jest.mock('../src/tasks/taskRepository');       // replace the real repository with an auto-mock
const repository = require('../src/tasks/taskRepository');
const service = require('../src/tasks/taskService');
const { NotFoundError, ValidationError } = require('../src/errors');

beforeEach(() => jest.clearAllMocks());

describe('taskService.getTask', () => {
  it('returns the task the repository finds', async () => {
    repository.findById.mockResolvedValue({ id: 7, title: 'Found', completed: false });
    await expect(service.getTask(7)).resolves.toEqual({ id: 7, title: 'Found', completed: false });
    expect(repository.findById).toHaveBeenCalledWith(7);
  });

  it('throws NotFoundError when the repository returns null', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(service.getTask(7)).rejects.toThrow(NotFoundError);
  });
});

describe('taskService.createTask', () => {
  it('trims the title before saving', async () => {
    repository.create.mockImplementation(async (data) => ({ id: 1, ...data, completed: false }));
    const task = await service.createTask({ title: '  padded  ' });
    expect(repository.create).toHaveBeenCalledWith({ title: 'padded' });
    expect(task.title).toBe('padded');
  });

  it.each([[undefined], [''], ['   '], [42]])('rejects the title %p without touching the repository', async (title) => {
    await expect(service.createTask({ title })).rejects.toThrow(ValidationError);
    expect(repository.create).not.toHaveBeenCalled();
  });
});
```

| Tool | What it does |
|---|---|
| **`jest.mock(path)`** | Replaces a module with an **auto-mock**: every exported function becomes a mock function that returns `undefined` until you tell it otherwise |
| **`.mockResolvedValue(x)`** | Makes the mock function return a Promise that resolves to `x` (for `async` functions) |
| **`.mockImplementation(fn)`** | Replaces the mock's behaviour with your function |
| **`expect(mock).toHaveBeenCalledWith(args)` / `.not.toHaveBeenCalled()`** | Asserts how the code **used** its dependency — here that invalid titles never reach the data layer |
| **`await expect(promise).resolves…` / `.rejects.toThrow(Class)`** | Asserts on a Promise's outcome |
| **`it.each([...])`** | Runs one test body for several inputs (the `%p` formats each value in the test name) |
| **`jest.clearAllMocks()`** | Resets call history between tests |

The whole suite, run verbosely:

```text
PASS tests/tasks.api.test.js
  /tasks
    ✓ starts with an empty list (70 ms)
    ✓ creates a task: 201, a Location header and the new task (11 ms)
    ✓ rejects a task without a title: 400 (3 ms)
    ✓ rejects malformed JSON: 400 (4 ms)
    ✓ returns 404 for a task that does not exist (4 ms)
    ✓ supports a whole flow: create -> read -> delete -> gone (15 ms)
    ✓ answers unknown routes with the standard JSON error (5 ms)

PASS tests/taskService.test.js
  taskService.getTask
    ✓ returns the task the repository finds (1 ms)
    ✓ throws NotFoundError when the repository returns null (4 ms)
  taskService.createTask
    ✓ trims the title before saving
    ✓ rejects the title undefined without touching the repository (4 ms)
    ✓ rejects the title "" without touching the repository (4 ms)
    ✓ rejects the title "   " without touching the repository
    ✓ rejects the title 42 without touching the repository (1 ms)

PASS tests/errorHandler.test.js
  errorHandler
    ✓ hides the details of a bug from the client (sync) (5 ms)
    ✓ handles errors from async handlers too (Express 5) (3 ms)

PASS tests/health.test.js
  GET /health
    ✓ responds 200 OK with status "ok" (4 ms)

Test Suites: 4 passed, 4 total
Tests:       17 passed, 17 total
```

**Unit vs. integration, side by side:**

| | Unit (`taskService.test.js`) | Integration (`tasks.api.test.js`) |
|---|---|---|
| What runs | The service only | Route + service + repository |
| Dependencies | Mocked | Real (an in-memory repository) |
| Finds | Wrong business rules | Wrong wiring: routes, status codes, JSON shape, middleware order |
| Breaks when | The service's logic changes | Anything in the request path changes |

You need both: the unit tests pin down the rules precisely, and the integration tests prove the pieces are connected correctly. (This is the payoff of Module 5's layers — you can swap the repository in tests without touching anything else.)

### 2.7 Testing the error paths

Errors are behaviour too. A tiny app with a route that throws a bug checks the global error handler:

```javascript
const express = require('express');
const request = require('supertest');
const { errorHandler } = require('../src/errorHandler');

function buildAppThatThrows() {
  const app = express();
  app.get('/boom', () => { throw new Error('db password is hunter2'); });
  app.get('/boom-async', async () => { throw new Error('async secret detail'); });
  app.use(errorHandler);
  return app;
}

describe('errorHandler', () => {
  it('hides the details of a bug from the client (sync)', async () => {
    const res = await request(buildAppThatThrows()).get('/boom');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ status: 'error', message: 'Internal Server Error' });
    expect(JSON.stringify(res.body)).not.toContain('hunter2');
  });

  it('handles errors from async handlers too (Express 5)', async () => {
    const res = await request(buildAppThatThrows()).get('/boom-async');
    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Internal Server Error');
  });
});
```

The `not.toContain('hunter2')` line **tests a security property**: the secret in the error must never reach the client.

### 2.8 Reading results: failures and coverage

**A failing test** tells you what and where:

```text
FAIL tests/failing.test.js
  ✕ creates a task with the right title (77 ms)

  ● creates a task with the right title

    expect(received).toBe(expected) // Object.is equality

    Expected: 200
    Received: 201

      3 | it('creates a task with the right title', async () => {
      4 |   const res = await request(app).post('/tasks').send({ title: 'Hello' });
    > 5 |   expect(res.status).toBe(200);                       // WRONG on purpose: the API returns 201
        |                      ^
```

Read it from the top: **which test** (`●` line), **what was expected vs. received**, then the **line** (`>` marker). And remember the outcome has two possibilities — either the *code* is wrong or the *test* is (here the test was).

**Coverage** shows which code the tests executed (`npm run test:coverage`):

```text
--------------------|---------|----------|---------|---------|-------------------
File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------------|---------|----------|---------|---------|-------------------
All files           |   97.53 |    66.66 |     100 |     100 |
 src                |   97.43 |    57.89 |     100 |     100 |
  app.js            |     100 |      100 |     100 |     100 |
  config.js         |     100 |       50 |     100 |     100 | 2,8
  errorHandler.js   |    92.3 |     87.5 |     100 |     100 | 10
 src/tasks          |   97.61 |    78.57 |     100 |     100 |
  taskService.js    |   92.85 |     87.5 |     100 |     100 | 24
--------------------|---------|----------|---------|---------|-------------------
```
*(Some rows omitted.)* **Statements/lines** = code that ran; **branches** = both sides of each `if`/`?:`/`??` — note branch coverage is only 66.66% even though lines are 100%. **Coverage tells you what is *not* tested; it doesn't prove what is tested well.** 100% is not the goal — meaningful assertions on the behaviour that matters are.

During development, `npm run test:watch` re-runs the affected tests whenever you save.

### 2.9 Problems you will meet

**1. "Jest did not exit one second after the test run has completed."** A test started a real server and never closed it:

```javascript
it('starts a server for no good reason', async () => {
  app.listen(0);                                       // BUG: never closed
  expect(true).toBe(true);
});
```
```text
PASS tests/leaky.test.js
Jest did not exit one second after the test run has completed.
```
The test *passed*, but Jest kept waiting for the open server — and a CI job would hang. With **Supertest you don't need `app.listen` at all**; if you really need a real server, close it when the tests finish:

```javascript
let server;
beforeAll((done) => { server = app.listen(0, done); });
afterAll((done) => { server.close(done); });          // FIX: close it when the tests are done
```

**2. A forgotten `await`.** If a test starts an asynchronous action and finishes **before** its assertion runs, the result depends on timing. This was run:

```javascript
it('FIX 2: expect.assertions(n) fails the test if it ends before the assertions ran', () => {
  expect.assertions(1);
  request(app).get('/health').then((res) => { expect(res.status).toBe(200); });
});
```
```text
✕ FIX 2: expect.assertions(n) fails the test if it ends before the assertions ran
    expect.assertions(1)
    Expected one assertion to be called but received zero assertion calls.
```
The test returned immediately, so **zero assertions had run when it ended**. (In the same file, a similarly un-awaited test happened to be caught in this run, simply because the response arrived quickly — **that is luck, not a guarantee**.) The rules: **`await` every Promise** (or `return` it), mark the test function `async`, and use `expect.assertions(n)` when a test involves callbacks or promises you can't easily await.

**3. Shared state between tests.** Without `beforeEach(reset)`, the second test sees the first one's tasks and the suite passes or fails depending on order.

**4. Noisy output.** The logger printing in every test drowns the results — set `LOG_LEVEL=silent` in `jest.setup.js`.

**5. Testing against a real database.** Prefer the in-memory repository (as here) or a **separate test database** — never your development or production data. (Starting a throw-away in-memory MongoDB for tests is a common technique — 🔒 outside this module, and not run here.)

**6. Default timeout.** A test that doesn't finish in 5 seconds fails; a hang usually means a Promise that never resolves, not a timeout that's too short.

### Try it yourself

1. Set up Jest and Supertest in your Task or Product API and write the `GET /health` test. Run `npm test`.
2. Break the test on purpose (expect `500`) and read the failure message. Fix it.
3. Write one **unit** test (with `jest.mock`) and one **integration** test for the same feature. Which bug would each catch that the other wouldn't?
4. Run `npm run test:coverage` and find one line your tests never executed. Write the test that covers it.

### Exercises

**Level 1 — Basic:** Add tests for `GET /tasks/:id` returning the created task and `DELETE` returning `204`.

**Level 2 — Practical:** Add `PATCH /tasks/:id` (toggle `completed`) with unit tests for the service rule and integration tests for the route, including the `404` and `400` cases.

**Level 3 — Challenge:** Make the app's auth middleware (Module 4) testable: write tests that send **no token**, a **garbage token** and a **valid token** (signed in the test with the same secret) and assert `401`, `401` and `200`.

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| `app.listen(...)` inside `app.js` | Tests (and serverless) can't import the app without opening a port | Export `app`; listen in a separate `start.js` |
| Forgetting `await` before `request(app)…` | The test can finish before the assertion runs | `async` test + `await` (and `expect.assertions` for callbacks) |
| Tests that depend on each other's data | Pass or fail by order | Reset state in `beforeEach` |
| Mocking everything, including the code under test | The test proves nothing | Mock **dependencies**, test the real unit |
| Asserting only the status code | A wrong body passes | Also assert the body/headers that matter |
| Testing against the development database | Destroys your data; flaky | In-memory repository or a dedicated test database |
| Treating 100% coverage as "done" | Lines ran ≠ behaviour verified | Assert behaviour; read the *branch* column |
| Leaving a real server open | "Jest did not exit…"; CI hangs | Use Supertest; close servers in `afterAll` |
| One giant test | A failure doesn't say what broke | Small tests with clear names |

### ✅ Knowledge Check
1. What is the difference between a unit test and an integration test? Give one example of each from this API.
2. Why must the app be exported from `app.js` and started from a different file?
3. What does `beforeEach(() => repository.reset())` protect against?
4. What does `jest.mock('../src/tasks/taskRepository')` do, and why is it useful in a unit test?
5. What does Supertest do that makes `app.listen` unnecessary in tests?
6. Why can lines be 100% covered while branches are only 66%, and what does that tell you?
7. What does "Jest did not exit one second after the test run has completed" mean, and how do you fix it?

---

## 3. The Built-in Node.js Test Runner

*(Resource Book, section 1. Node.js has a built-in test runner — a lightweight alternative to Jest.)*

> 📖 **Reading for this section — [Using Node.js Test Runner — Node.js Official Docs](https://nodejs.org/en/learn/test-runner/using-test-runner)**
> Your module file's key takeaway: *"Node.js now has a built-in test runner. It's good to know it exists as a lightweight alternative to Jest."* *(I did not open the page; the takeaway is quoted from your file.)*

### 3.1 What it is

Node ships with two modules that need **no installation**: **`node:test`** (a test runner with `describe`, `it`, hooks) and **`node:assert`** (assertions). You run them with `node --test`. Supertest works with it exactly as with Jest, because Supertest only sends requests and returns responses — it doesn't care who runs the test.

The same style of test, run by the built-in runner (this was run):

```javascript
// The same kind of Supertest test, run by Node's built-in test runner instead of Jest.
process.env.LOG_LEVEL = 'silent';
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const repository = require('../src/tasks/taskRepository');

describe('node:test + Supertest', () => {
  beforeEach(() => repository.reset());

  it('GET /health responds 200 with status ok', async () => {
    const res = await request(app).get('/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
  });

  it('POST /tasks creates a task', async () => {
    const res = await request(app).post('/tasks').send({ title: 'Built-in runner' });
    assert.equal(res.status, 201);
    assert.deepEqual(res.body, { id: 1, title: 'Built-in runner', completed: false });
  });
});
```
```bash
node --test --test-reporter=spec node-tests/api.test.js
```
```text
▶ node:test + Supertest
  ✔ GET /health responds 200 with status ok (28.165639ms)
  ✔ POST /tasks creates a task (17.137255ms)
✔ node:test + Supertest (50.518863ms)
ℹ tests 2
ℹ pass 2
ℹ fail 0
```

### 3.2 Jest and `node:test` compared

| | **Jest** | **`node:test`** |
|---|---|---|
| Installation | `npm install --save-dev jest` | None (built in) |
| Run | `npx jest` / `npm test` | `node --test` |
| Structure | `describe`, `it`/`test`, `beforeEach`… | The same names, imported from `node:test` |
| Assertions | `expect(x).toBe(y)`, `toEqual`, `rejects.toThrow`… | `assert.equal(x, y)`, `assert.deepEqual`, `assert.rejects`… from `node:assert` |
| Mocking | `jest.mock`, `jest.fn` (rich, automatic) | Its own `mock` helpers (check the docs for what your Node version supports) |
| Extras | Watch mode, coverage reports and snapshot tests out of the box | Fewer built-in extras |
| Best for | The course default; rich mocking; the tutorials you'll find | Zero-dependency projects; small libraries; when you want to avoid a large dev dependency |

These notes use **Jest** because your module's video and challenge do. Knowing `node:test` exists means you won't be surprised in a project that uses it.

### 3.3 Don't let the two runners collide

If both kinds of test files live in one project, Jest will try to run the `node:test` file too — and fail, because that file isn't written for Jest. This is what really happened in the CI dry run for these notes (Section 5.8): on a clean machine `npm test` printed

```text
FAIL node-tests/api.test.js
    Your test suite must contain at least one test.
Test Suites: 1 failed, 4 passed, 5 total
Tests:       17 passed, 17 total
npm test exit code: 1
```

All 17 real tests passed, but the **stray file made the whole run fail** (exit code `1`) — which would block a deploy. The fix is the `testMatch` setting from Section 2.3, which tells Jest to look **only** in `tests/`:

```json
"jest": { "testMatch": ["<rootDir>/tests/**/*.test.js"] }
```
After it, `npm test` exited `0` with four suites and 17 tests. Two practical notes: **pass a file or a pattern to `node --test`, not a directory** (on the Node version used here, `node --test node-tests/` failed with `MODULE_NOT_FOUND`; behaviour can differ by version), and **pick one runner per project** unless you have a reason not to.

### Try it yourself

1. Write the `GET /health` test with `node:test` and run it with `node --test`.
2. Port one of your Jest tests to `node:test`. What did you have to change besides `expect` → `assert`?
3. Put both kinds of test in one project, run `npm test`, and read the failure. Fix it with `testMatch`.

### Exercises

**Level 1 — Basic:** Translate the `/tasks` creation test from Jest to `node:test`.

**Level 2 — Practical:** List what you'd lose by switching a project from Jest to `node:test`, and what you'd gain.

**Level 3 — Challenge:** Make `npm test` run **both** runners (`jest && node --test node-tests/api.test.js`) and exit non-zero if either fails.

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| Putting `node:test` files where Jest looks | Jest fails: "must contain at least one test" | `testMatch` pinned to the Jest folder |
| `node --test some-folder/` on some Node versions | Treated as a module path | A file path or a glob pattern |
| Using `expect(...)` in a `node:test` file | `expect` is a Jest global | `assert` from `node:assert` |
| Mixing runners without noticing | Confusing results | One runner per project |

### ✅ Knowledge Check
1. What two built-in modules make up Node's test tooling, and how do you run them?
2. Why does Supertest work with either runner?
3. Name two things Jest gives you that `node:test` gives less of.
4. What went wrong when a `node:test` file sat in a Jest project, and what fixed it?

---

## 4. Environment Variables: Development, Test and Production

*(Learning objective: configure environment variables (`.env`) for safe development and production. Your file lists no resource for it; this section builds on Backend Module 4, Section 8.)*

### 4.1 One program, several places to run

Your code now runs in **at least three situations**, and they must not behave identically:

| Environment | Where | What it needs |
|---|---|---|
| **Development** | Your laptop | Chatty logs, a local database, forgiving settings |
| **Test** | Jest, or a CI machine | Silent logs, a throw-away database (or none), **no real secrets** |
| **Production** | The platform (Vercel, Render…) | Real secrets, the production database, quiet structured logs, strict CORS, no internal error details |
| *(Preview / staging)* | A temporary deployment per branch or pull request | A copy of production's shape, with *non-production* data and keys |

The only way to run **one codebase** in all of them is **configuration from the environment** (Module 4, Section 8): the code reads `process.env`, and each place supplies different values.

### 4.2 `NODE_ENV`

`NODE_ENV` is the conventional variable that says *which* environment this is: `development`, `test` or `production`.

- **Jest sets it to `test` for you** — checked: inside a test, `process.env.NODE_ENV` is `test`.
- **Your hosting platform** typically runs with `production`. Guides for Render (a third-party source, not Render's own documentation) suggest setting `NODE_ENV=production` yourself in the service's environment settings; check the platform you use.
- **Locally**, unset means "development" by convention — your `config.js` should treat an unset value that way.

Use it **sparingly**, for *defaults*, not scattered `if (isProduction)` branches through the code. The project's `config.js` (the single place that reads the environment) does exactly that:

```javascript
// src/config.js - Read configuration from the environment ONCE.
const NODE_ENV = process.env.NODE_ENV || 'development';

module.exports = {
  nodeEnv: NODE_ENV,
  isProduction: NODE_ENV === 'production',
  port: Number(process.env.PORT) || 3000,
  logLevel: process.env.LOG_LEVEL || (NODE_ENV === 'production' ? 'info' : 'debug')
};
```

- `PORT` comes from the environment (the platform assigns it; locally it defaults to 3000).
- `logLevel` defaults to `info` in production and `debug` otherwise, **and an explicit `LOG_LEVEL` always wins** — which is how `jest.setup.js` silences logs in tests.

(The fail-fast validation of *required* variables from Module 4 — exit at startup with a clear message if `JWT_SECRET` or `MONGODB_URI` is missing — belongs in the same file once your app needs those.)

### 4.3 What typically differs between environments

| Setting | Development | Test | Production |
|---|---|---|---|
| Database URL | Local database | A throw-away test database, or the in-memory repository | The hosted database (a secret) |
| Log level / format | `debug`, pretty-printed (Section 9) | `silent` | `info`, structured JSON |
| CORS origin | `http://localhost:4200` | not applicable | Your deployed frontend's origin only |
| Secrets (`JWT_SECRET`, API keys) | A development value | A fixed fake value | Real, random, **different from every other environment** |
| Error responses | Same generic `500` everywhere — details only in logs | Same | Same |
| Rate limiting, HTTPS | Usually off | Off | On |

### 4.4 Where the values live

```text
development   .env  (git-ignored)           loaded with:  node --env-file=.env src/start.js
test          jest.setup.js                 sets harmless values:  process.env.LOG_LEVEL = 'silent'
production    the PLATFORM's settings       Vercel: project Environment Variables  ·  Render: the service's Environment section
documentation .env.example  (COMMITTED)     the names, with no real values
```

`.env.example` documents what the app needs, so a new developer knows which variables to create:

```text
# Copy to .env and fill in real values. .env is NEVER committed.
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
MONGODB_URI=
```

Rules (all from Module 4, now with higher stakes because the app goes public):

- **`.env` is in `.gitignore` before the first commit** (Section 5.4 shows what happens if it isn't).
- **Production values are set in the platform's dashboard**, never in a file in the repository. The challenge says exactly this: *"Add your environment variables (like `MONGO_URI`) in the Vercel dashboard settings."*
- **Real environment variables win over the `.env` file** (observed in Module 4) — so the platform's settings take priority.
- **A different secret per environment.** If a development secret leaks, production must be unaffected.
- **Be consistent about names.** Your challenge calls the database variable **`MONGO_URI`**; the earlier notes used `MONGODB_URI`. Either is fine — but the name in your **code**, your **`.env.example`** and the **dashboard** must match exactly. A mismatch means `process.env.X` is `undefined` and the app can't connect (fail-fast config turns that into a clear startup message).
- **After changing a variable in a platform's dashboard, redeploy** — running instances were started with the old values *(general knowledge; check your platform)*.

### 4.5 Keep tests away from real data

A test should **never** be able to touch production. Two safeguards: tests use the **in-memory repository** or a dedicated **test database name**, and `jest.setup.js` supplies fake values so a developer's real `.env` isn't even read:

```javascript
// jest.setup.js
process.env.LOG_LEVEL = 'silent';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/app_test';   // only if a test needs a database; never a real one
```

### Try it yourself

1. Run your app with `NODE_ENV=production` and again unset; print `config.logLevel` each time.
2. Run it with `LOG_LEVEL=warn node src/start.js` and confirm the explicit variable wins over the default.
3. Add `.env.example`, `.env` and `.gitignore`; confirm `git status` shows `.env.example` but not `.env`.

### Exercises

**Level 1 — Basic:** List every value your API reads from the environment and mark each as *configuration* or *secret*.

**Level 2 — Practical:** Make `config.js` throw at startup in production if `LOG_LEVEL` is `debug`, and explain why you'd want that.

**Level 3 — Challenge:** Write a table for your project: for each variable, its value in development, test and production, and where each value is stored.

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| Reusing the development secret in production | A leaked laptop secret compromises production | A new random secret per environment |
| Different variable names in code, `.env` and the dashboard | `undefined` in production | One name everywhere |
| Scattering `process.env.X` through the code | Typos are invisible; hard to review | One `config.js` |
| Putting production values in a committed file | Secrets are public (especially on a public repo) | The platform's settings |
| Tests that read the developer's real `.env` | A test could hit a real database | Set fake values in `jest.setup.js` |
| Forgetting to redeploy after editing a variable | The running app has the old value | Redeploy |
| `if (NODE_ENV === 'production')` everywhere | Behaviour is scattered and untestable | Decide defaults once, in `config.js` |

### ✅ Knowledge Check
1. Name three environments your code runs in and one setting that differs between them.
2. Who sets `NODE_ENV` under Jest, and to what?
3. Where do production values live, and where must they never live?
4. Which wins when a variable is set both in the platform and in `.env`?
5. Why must the variable name match in code, `.env.example` and the dashboard?

---

## 5. Version Control with Git and GitHub

*(Learning objective: use Git and GitHub for version control. The challenge's task: initialize a git repo, create a `.gitignore` excluding `node_modules` and `.env`, and push the code to a public GitHub repository. Your file lists no resource for this objective; this section is my own.)*

### 5.1 What and why

**Version control** records the history of your project so you can see what changed, why, and by whom — and **go back** if something breaks. **Git** is the tool that runs on your computer; **GitHub** is a website that hosts Git repositories so you can back them up, share them, collaborate (pull requests) and — in this module — **trigger deployments and tests automatically** when you push.

| | **Git** | **GitHub** |
|---|---|---|
| What | A program on your machine | A hosting service (and platform) built around Git |
| Needs the internet? | No — everything is local until you push | Yes |
| Does | Tracks changes; branches; merges | Stores a remote copy; pull requests; Actions (CI); connects to Vercel/Render |

### 5.2 Core ideas

```text
 working folder  --git add-->  staging area  --git commit-->  local history  --git push-->  GitHub (remote)
 (your files)                  (what the next                 (commits on     
                                commit will contain)           your branches)  <--git pull--
```

| Term | Meaning |
|---|---|
| **Repository (repo)** | The project plus its history (the hidden `.git` folder) |
| **Commit** | A saved snapshot with a message and an id (hash) |
| **Staging area** | Where you choose *which* changes go into the next commit (`git add`) |
| **Branch** | A line of work. `main` is the default; feature branches let you work without disturbing it |
| **Merge** | Combining one branch into another |
| **Remote / `origin`** | A copy of the repo elsewhere (GitHub); `origin` is its conventional name |
| **Clone / push / pull** | Copy a remote repo / send commits to it / bring its commits to you |

### 5.3 A first repository — run for real

```bash
git init -b main                                    # create the repository, main branch
git config user.name "Your Name"                    # who you are (once per machine/repo)
git config user.email "you@example.com"
git add -A                                          # stage everything that isn't ignored
git commit -m "Initial commit: layered Task API with health check and tests"
git log --oneline                                   # the history
```
```text
fe09ba9 Initial commit: layered Task API with health check and tests
```

A **feature branch**, merged back (all run):

```bash
git switch -c feature/uptime-in-health              # create and switch to a new branch
# ...edit files...
git commit -am "Add version to the health response"
git switch main
git merge --no-ff feature/uptime-in-health -m "Merge feature/uptime-in-health"
git log --oneline --graph
git branch -d feature/uptime-in-health              # delete the finished branch
```
```text
*   9dc5695 Merge feature/uptime-in-health
|\  
| * 6361c06 Add version to the health response
|/  
* fe09ba9 Initial commit: layered Task API with health check and tests
```

The most-used commands:

| Command | Does |
|---|---|
| `git status` (`-s` for short) | What changed, what's staged, what's untracked |
| `git add -A` / `git add file` | Stage changes |
| `git commit -m "message"` | Record a commit |
| `git log --oneline [--graph]` | Show history |
| `git diff` | Show unstaged changes |
| `git switch -c name` / `git switch name` | Create / change branch |
| `git merge name` | Merge a branch into the current one |
| `git remote add origin URL` / `git remote -v` | Connect / list remotes |
| `git push -u origin main` | Send `main` to GitHub (and remember it) |
| `git pull` | Fetch and merge new commits from the remote |
| `git clone URL` | Copy a remote repo |

**Good commits:** small, one purpose each, a message that says **what and why** in the imperative ("Add health endpoint", not "stuff" or "fixed it"). Commit **often**; a project with one giant commit can't be debugged or reviewed.

### 5.4 `.gitignore`: what never goes into Git

A `.gitignore` file lists patterns Git should **not track**. The challenge requires excluding `node_modules` and `.env`; a practical file for this project:

```text
node_modules/
.env
.env.*
!.env.example
coverage/
*.log
```

- **`node_modules/`** — thousands of files that `npm install` recreates from `package.json`. Never commit them.
- **`.env` and `.env.*`** — secrets. **`!.env.example`** is an *exception* (the `!` re-includes it): the example file **is** committed.
- **`coverage/`, `*.log`** — generated output.
- **Do commit `package-lock.json`** — it pins exact dependency versions, and `npm ci` (used by CI and many platforms) **requires** it.

Check what Git will ignore, and what would be committed:

```bash
git check-ignore -v .env node_modules coverage
git status --short
```
```text
.gitignore:2:.env	.env
.gitignore:1:node_modules/	node_modules
.gitignore:5:coverage/	coverage

A  .env.example
A  .gitignore
A  package.json
A  src/app.js
A  tests/health.test.js
…                       (no .env, no node_modules)
```

`.env` is ignored, `.env.example` is staged.

### 5.5 The accident: committing `.env` first

The order matters. This was run in a scratch repository:

```bash
echo 'JWT_SECRET=super-secret-value' > .env
git add -A && git commit -m "first commit (oops: includes .env)"      # .env is committed
echo ".env" > .gitignore && git add .gitignore && git commit -m "add .gitignore"
echo 'JWT_SECRET=changed-value' > .env
git status --short
```
```text
 M .env
```

Even after adding `.env` to `.gitignore`, Git **still tracks it** — `.gitignore` only affects files Git isn't tracking yet. The fix stops tracking it:

```bash
git rm --cached .env             # remove from Git's tracking, keep the file on disk
git commit -m "stop tracking .env"
git status --short               # now clean: .env is ignored
```

**But the secret is still in the history:**

```bash
git log --oneline -- .env
git show $(git rev-list --max-parents=0 HEAD):.env
```
```text
962850c stop tracking .env
c5f6315 first commit (oops: includes .env)
JWT_SECRET=super-secret-value
```

Anyone with the repository — **and especially on a public GitHub repository** — can read the original secret from the first commit. **The only real fix is to treat the secret as compromised and rotate it** (generate a new one, update every environment). Rewriting history exists but is risky and doesn't help if the repo was already public or cloned. **Prevention:** create `.gitignore` and `.env.example` *before* `git add`.

### 5.6 Branches and pull requests (the team workflow)

On real teams, nobody commits straight to `main`:

1. Create a **branch** for the change (`feature/add-search`).
2. Commit your work; **push** the branch to GitHub.
3. Open a **pull request (PR)**: a request to merge your branch into `main`, where teammates **review** it and automatic checks (Section 5.8) run.
4. When it is approved and the checks pass, **merge** it.
5. **Main always stays deployable.** With Vercel or Render connected, merging to `main` deploys it.

This is the "professional workflow" your challenge's scenario simulates.

### 5.7 GitHub: pushing your code

*(GitHub is a website; I can't create repositories or push from here, so these are the standard steps, not run.)*

1. **Create a repository** on GitHub (New repository). Do **not** tick "add a README/.gitignore" if you already have a local repo — you'll push your own.
2. **Connect and push:**

   ```bash
   git remote add origin https://github.com/YOUR-USERNAME/your-repo.git
   git remote -v                  # (run) lists the address you just added
   git push -u origin main
   ```
   The remote step was run; it shows the address twice, once for fetching and once for pushing:

   ```text
   origin	https://github.com/YOUR-USERNAME/ci-demo.git (fetch)
   origin	https://github.com/YOUR-USERNAME/ci-demo.git (push)
   ```
3. **Authentication.** GitHub doesn't accept your account password for pushes over HTTPS: you use a **personal access token**, an **SSH key**, or the **GitHub CLI** (`gh auth login`) *(general knowledge; follow GitHub's current instructions)*.
4. **Refresh the page** — your files should be there, **without** `.env` or `node_modules`. Check this *before* anything else.

**Public vs. private:** your challenge asks for a **public** repository: *anyone in the world can read every file and every commit.* That is fine for a learning project **provided no secret was ever committed**, since history is public too (Section 5.5). When in doubt, use a private repository — Vercel and Render can connect to private repos too *(check each platform's current plan limits)*.

### 5.8 Continuous Integration with GitHub Actions

**Continuous Integration (CI)** means every push (and pull request) automatically **builds the project and runs the tests** on a clean machine, so a break is noticed within minutes. **GitHub Actions** is GitHub's built-in way to do it: a YAML file in `.github/workflows/` describes what to run. This is the "make sure it doesn't break before deploying" half of your challenge's pipeline.

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
```

| Line | Meaning |
|---|---|
| `on: push (main), pull_request` | Run on every push to `main` and on every pull request |
| `runs-on: ubuntu-latest` | A fresh Linux machine each time — **nothing from your laptop exists there** |
| `actions/checkout@v4` | Download your repository's code onto that machine |
| `actions/setup-node@v4` (`node-version: 22`, `cache: npm`) | Install Node and cache `npm` downloads *(check the current major versions of these actions)* |
| `npm ci` | A **clean, exact install** from `package-lock.json` — stricter and more reproducible than `npm install` |
| `npm test` | Runs Jest; **a non-zero exit code fails the job** |

*(I can't run GitHub Actions from here. What I could do: I checked that the file is **valid YAML** and parses to one job with the four steps `checkout → setup-node → npm ci → npm test`, and I **dry-ran the same commands on this machine** after deleting `node_modules`.)* The dry run is worth reading, because it caught a real problem:

```text
$ rm -rf node_modules && npm ci && npm test
FAIL node-tests/api.test.js            <- a test file written for a DIFFERENT runner
Test Suites: 1 failed, 4 passed, 5 total
Tests:       17 passed, 17 total
npm test exit code: 1                  <- on GitHub, this red cross would block the merge
```

That is **CI doing its job**: a "works on my machine" mistake found before it reached production. The fix is in Section 3.3, and the same command then passed (exit code `0`).

**From CI to CD.** CI = *test on every push*. **Continuous Deployment (CD)** = *deploy automatically when the tests pass*. With Vercel or Render connected to GitHub, a push to `main` deploys by itself — that is the "CD" half. Teams normally also make GitHub **require the CI check to pass before merging** (a repository setting; *general knowledge*).

### Try it yourself

1. Create a repo with a `.gitignore` *first*, then your code; confirm `git status` shows no `.env` and no `node_modules`.
2. Make a feature branch, commit twice, merge it, and read `git log --oneline --graph`.
3. In a scratch repo, commit a fake `.env`, ignore it, and use `git log -- .env` to see that the history still has it.
4. Run `rm -rf node_modules && npm ci && npm test` — your local version of what CI will do.

### Exercises

**Level 1 — Basic:** Write a `.gitignore` for your project and prove with `git check-ignore -v` that `.env` and `node_modules` are ignored.

**Level 2 — Practical:** Push your project to a new public GitHub repository and check on github.com that `.env` isn't there. Add the CI workflow, push it, and open the **Actions** tab.

**Level 3 — Challenge:** Make the CI job also run Newman against a started copy of the API (Section 1.4) and fail if the flow fails.

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| Committing before creating `.gitignore` | `.env` is in history forever | `.gitignore` and `.env.example` first |
| Believing `.gitignore` untracks a committed file | It only affects untracked files | `git rm --cached file`, then commit — and **rotate** the secret |
| Committing `node_modules/` | Slow, huge, pointless | Ignore it; `npm ci` rebuilds it |
| Ignoring `package-lock.json` | `npm ci` fails; installs aren't reproducible | Commit it |
| `git add -A` without looking at `git status` | You may stage something you shouldn't | Always read `git status` first |
| Vague messages ("stuff", "fix") | History is useless | "Add health endpoint" |
| Working directly on `main` in a team | No review; a broken push breaks everyone | Branch → PR → merge |
| Pushing secrets to a **public** repo | Instantly readable by everyone (bots scan GitHub for keys) | Never commit secrets; rotate if you did |
| Passing locally, never run on a clean machine | "Works on my machine" | CI with `npm ci && npm test` |

### ✅ Knowledge Check
1. What is the difference between Git and GitHub?
2. What are the working folder, the staging area and the commit history?
3. Why are `.env` and `node_modules` ignored, but `.env.example` and `package-lock.json` committed?
4. You committed `.env` and then added it to `.gitignore`. Is the secret safe? What must you do?
5. What does CI do on every push, and what makes the job fail?
6. What is the difference between `npm install` and `npm ci`, and why does CI use the latter?

---

## 6. Deployment Strategies

*(Resource Book, section 2 — "Deployment Strategies". How do you get your code from localhost to `https://myapp.com`?)*

> 📺 **Video for this section — [Fireship](https://www.youtube.com/watch?v=uEVmD6n8Il0)**
> Your module file describes this entry as: *"A high-level overview of options (VPS, Serverless, Containers) to help you choose the right path."* *(That entry has no link in your file. The link above is the Fireship URL from the Postman entry, which your file's own note identifies as "7 Ways to Deploy" — an overview video — so I placed it here. I haven't watched it. If it isn't the intended video, tell me and I'll correct it.)*

### 6.1 What "deploying" requires

To put an API on the internet, something must be true that is not true on your laptop:

- A machine that is **always on** and reachable from the internet.
- A **public address with HTTPS**.
- Your **code and dependencies installed**, started with a known command.
- **Configuration and secrets** supplied from outside (Section 4).
- A **database** reachable from that machine (a hosted one; your laptop's `localhost` isn't).
- A way to **update** it (push new code) and to **see what it is doing** (logs, Section 9).

The strategies below differ in **who handles which of those**.

### 6.2 The main options *(general knowledge — details vary by provider; verify before choosing)*

| Strategy | How it works | You manage | Typical examples | Good for |
|---|---|---|---|---|
| **VPS / virtual machine** | You rent a Linux server and run your app on it | Everything: OS updates, firewall, HTTPS certificates, keeping the process alive, scaling | A rented cloud server | Maximum control; learning how servers work |
| **PaaS (platform as a service) — long-running server** | You connect a Git repo; the platform builds it and runs it as a server | Your code and settings; the platform handles the machine and HTTPS | **Render**, Railway | Most APIs; the simplest "real server" path |
| **Serverless functions** | Your code runs **on demand** in short-lived instances that are created and destroyed as requests arrive | Your code; the platform handles scaling to zero and up | **Vercel** (Express runs as a Vercel Function, Section 7) | Spiky or low traffic; frontends with a few API routes |
| **Containers** | You package the app and its runtime in an image (Docker, Module 4, Section 11) and run it anywhere that runs containers | The image; the platform (or you) runs it | Container services on the big clouds, or a PaaS that accepts a Dockerfile | Reproducibility; moving between providers; multi-service apps |
| **Static hosting** | Plain files served from a CDN | Nothing server-side | Your built Angular app | Frontends (not APIs) |

### 6.3 Choosing — serverless vs. a long-running server

Where students get surprised is that *an Express app is not just an Express app*: **how** it runs changes what works.

| | **Long-running server** (Render, VPS, container) | **Serverless** (Vercel Functions) |
|---|---|---|
| In-memory state (an array, a cache) | Lives as long as the process; lost on restart/redeploy | **Not reliable** — each request may hit a different, short-lived instance |
| Database connections | One pool, kept open | Created per instance; **reuse them** (Section 7.4) and keep the count low |
| Files written to disk | Lost on restart unless you attach a persistent disk | Ephemeral — use object storage instead (🔒) |
| Idle behaviour | Always running (paid) — or *spins down* on free tiers (Render) | Scales down to nothing between requests; the next one may be slower (a "cold start") |
| Background work, WebSockets | Natural | A poor fit |
| Setup effort | Slightly more (a start command) | Often minimal ("zero configuration") |

For this course: **Vercel** is the easiest for a stateless API backed by a hosted database (your challenge); **Render** is the choice when you want a classic always-on server. The Module 5 Product API's **local file uploads** and `express.static('/uploads')` are an example of what does *not* carry over to serverless (Section 7.5).

### 6.4 Environments and deployments

Modern platforms deploy **on every push**:

- A push to **`main`** deploys to **production**.
- A push to another branch or a pull request can produce a **preview deployment** with its own URL — Vercel's guide to shipping an Express app lists preview deployments among its built-in features. It's a safe place to try a change before merging.
- A **bad deploy** can usually be undone by redeploying an earlier version ("rollback") *(general knowledge; check your platform)*.

The stateless habits from Module 4 — configuration from the environment, no per-user state in memory, a shared database — are what make any of these work.

### Try it yourself

1. List the six requirements in 6.1 for your own API and mark which ones your laptop meets.
2. For three apps you know (a blog, a chat, a nightly report), pick a deployment strategy and say why.
3. Look at your project: which parts (in-memory arrays, uploaded files, long-lived connections) would break on a serverless platform?

### Exercises

**Level 1 — Basic:** Explain VPS, PaaS, serverless and containers to a non-programmer in one sentence each.

**Level 2 — Practical:** Fill the serverless vs. long-running table for your own project: what would you change to move it from one to the other?

**Level 3 — Challenge:** Your API stores uploaded images on disk and keeps a login rate-limit counter in memory. Decide which deployment options are viable as-is and what you'd change for the others.

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| Assuming "deploy" = "copy the folder to a server" | Missing HTTPS, config, process management | Use a platform, or learn what a VPS needs |
| Putting in-memory state in a serverless app | Each instance has its own memory | A database |
| Writing uploads to local disk on serverless | Ephemeral filesystem | Object storage (🔒) |
| Choosing the fanciest option for a simple API | Complexity with no benefit | The simplest option that meets the need |
| Expecting a free tier to behave like production | Free instances may spin down or sleep | Read the plan's limits |

### ✅ Knowledge Check
1. Name four things a deployed API needs that your laptop provides differently.
2. How do a long-running server and a serverless function differ for in-memory state and database connections?
3. Which of VPS, PaaS, serverless and containers leaves *you* the most to manage?
4. What is a preview deployment, and why is it useful?

---

## 7. Deploying to Vercel

*(Resource Book, section 2 — "Deployment Strategies". Objective: deploy Node.js applications to Vercel (or Render).)*

> 📺 **Video for this section — [Lets build together](https://www.youtube.com/watch?v=IeM1PGqmJT4)**
> Your module file describes it as: *"A step-by-step guide to deploying Express apps specifically to Vercel, which is great for beginners."* *(I haven't watched it; the description is from your file. Vercel's Express support has changed over time — if the video shows configuration files that these notes don't mention, compare with Vercel's current documentation, summarised below.)*

> ⚠️ **What was and wasn't run.** I can't create a Vercel account or deploy from here. This section is based on **Vercel's current documentation** (its Express framework page and its guide to shipping an Express app, read in November 2026). Everything about **your code** — the app/start split, the health endpoint, the database-connection reuse, the smoke test — was run; the **Vercel dashboard steps** were not. Platforms change quickly: treat the docs as the authority.

### 7.1 How Vercel runs an Express app

Vercel is built around **serverless functions**. Per its documentation:

- You can deploy an Express app to Vercel with **zero configuration** — no build command and no output directory to set.
- Your Express application becomes **a single Vercel Function** (running on what Vercel calls Fluid compute) that **scales up and down automatically with traffic**.
- You deploy **from Git**: push to GitHub, GitLab or Bitbucket, import the repository at `vercel.com/new`, and Vercel **detects Express automatically**. (A command-line tool, `vercel`, also exists.)
- Every push can produce a **preview deployment**, and the docs list built-in observability — Section 9.

What this means for you: **there is no long-running server you control.** Vercel receives a request, runs your Express `app` to answer it, and may then pause or discard that instance. That is why the **export-don't-listen** split of Section 2.2 was worth doing.

### 7.2 Making the project deploy-ready

**1. An entry file Vercel can find.** Vercel looks for a file that **imports `express`** at one of these names — `app`, `index` or `server`, with a `.js`, `.cjs`, `.mjs` or `.ts` extension — **at the project root or inside `src/`**.

**2. That file must export the app** (a default export; in CommonJS that is `module.exports = app`) **or** start it with a port listener (`app.listen`) — the docs say Vercel detects either pattern. The project's `src/app.js` already does the first:

```javascript
// src/app.js (the end of the file)
// Export the app WITHOUT listening: tests and serverless platforms import it; src/start.js listens locally.
module.exports = app;
```

My own precaution, not a documented requirement: the file that calls `app.listen` for **local** use is named `src/start.js` — **not** `app`, `index` or `server` — so there is exactly **one** file for Vercel to detect, and no doubt about which is the entry.

**3. `package.json`.** The docs note that CommonJS projects use `"type": "commonjs"` (the default); an ES-module project would use `"type": "module"` with `export default app`. No build step is needed for plain JavaScript.

**4. Static files.** Per the docs, **`express.static()` is ignored on Vercel** — static assets must live in a **`public/`** directory, which Vercel serves from its CDN.

**5. Errors.** The docs recommend an **error-handling middleware** so a thrown error doesn't leave the function in an undefined state. You already have one (`errorHandler`, Module 5).

**6. Limits.** All **Vercel Functions limits** apply to your Express app — for example, the application is bundled as **one function whose size must fit within 250 MB**.

### 7.3 Deploying — the steps *(from the docs; not run)*

1. **Push** your project to GitHub (Section 5.7) — with `.env` and `node_modules` ignored.
2. In Vercel, **Add New → Project** (`vercel.com/new`) and **import** the GitHub repository (the first time you must authorise Vercel to read your repos).
3. Vercel **detects Express** and pre-fills the settings. There should be **nothing to change** (no build command, no output directory).
4. Open **Environment Variables** and add every variable your app needs — for the challenge, **`MONGO_URI`** (or whatever name your code reads) — before the first deploy. Values here are encrypted secrets; this is where production configuration lives (Section 4).
5. Click **Deploy** and watch the build log. Vercel gives you a URL like `https://my-api.vercel.app`.
6. **Verify** (Section 7.6). Every later **push to `main` deploys again automatically**; pushes to other branches create **preview** URLs.

If you add or change a variable *after* a deployment exists, **redeploy** so new instances get the new value.

### 7.4 The database: create a connection once and reuse it

An API with a database needs a **hosted** database (your laptop's `localhost` isn't reachable): **MongoDB Atlas** for MongoDB, or a managed PostgreSQL. The connection string goes in a Vercel environment variable. Because serverless instances are created and destroyed often, **connect once per instance and reuse the connection** — don't open a new one on every request. This module-level cache was run against a MongoDB-compatible server:

```javascript
// src/db.js
const mongoose = require('mongoose');

// One connection PER INSTANCE, created on first use and reused by every later request.
let connectionPromise = null;

function connectDB() {
  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 3000 })
      .catch((error) => {
        connectionPromise = null;          // a failed attempt must not be cached forever: allow a retry
        throw error;
      });
  }
  return connectionPromise;
}

module.exports = connectDB;
```
```text
10 simultaneous connectDB() calls -> connections opened: 1
2 more calls later              -> connections opened: 1 (reused)
same Promise every time? true

first attempt (database unreachable) -> failed: MongooseServerSelectionError
second attempt (URI fixed)          -> connected: the failure was not cached
```

- **Ten requests arriving together on a cold instance opened exactly one connection** — the cached *Promise* is shared, so they all wait for the same attempt.
- A **failed** attempt is **not** cached: `connectionPromise` is reset, so the next request retries instead of failing forever.

Use it as a small middleware in front of the routes that need the database (Express 5 sends a rejection to the error handler automatically):

```javascript
// in app.js, before the routes that use the database (not before /health)
app.use('/tasks', async (req, res, next) => { await connectDB(); next(); });
```
*(This wiring is the standard pattern; the **connection-reuse logic** above is what I ran.)* Keep **`/health` independent of the database**, so it answers "is the app up?" even when the database is down.

**Atlas network access.** Atlas only accepts connections from IP addresses you allow. Serverless functions don't come from one fixed address, so tutorials often allow **access from anywhere (`0.0.0.0/0`)**. That works but removes a layer of protection — your **strong password and a least-privilege database user** become the only defence. Tighter options exist (🔒 outside this module); read Atlas's and Vercel's current guidance.

### 7.5 What changes for a serverless app

| Your code | On Vercel | Do this |
|---|---|---|
| **In-memory data** (the Task API's array) | Each instance has its own memory, and instances come and go | Use the database repository (Module 5) |
| **Files saved to disk** (Module 5 uploads) | The function's filesystem isn't durable storage | Object storage (🔒 outside this module) |
| **`express.static('/uploads')`** | Ignored | `public/` for your own assets; storage for user uploads |
| **Per-process state** (an in-memory rate limiter, a session map) | Not shared across instances | A shared store, or stateless design |
| **A new DB connection per request** | Can exhaust the database's connection limit | The cached connection above |
| **Long background work** | Functions are short-lived | A queue or a long-running server (🔒) |
| **The first request after idle** | May be slower (a cold start) | Expect it; keep startup light |

### 7.6 Verify the deployment

**1. The browser or `curl`:**

```bash
curl https://my-api.vercel.app/health
# {"status":"ok","uptimeSeconds":12}
```

**2. A scripted smoke test.** A **smoke test** is a few quick checks that the deployment is alive and the main path works. This script takes the base URL as an argument (and defaults to local), so the **same** script checks your laptop and your live URL:

```bash
#!/bin/bash
# Usage: bash scripts/smoke-test.sh https://my-api.vercel.app      (defaults to http://localhost:3000)
BASE=${1:-http://localhost:3000}
fail=0

check() {   # check "description" expected_status actual_status
  if [ "$2" = "$3" ]; then echo "PASS  $1"; else echo "FAIL  $1 (expected $2, got $3)"; fail=1; fi
}
status() { curl -s -o /dev/null -m 15 -w '%{http_code}' "$@"; }

check "GET /health -> 200" 200 "$(status "$BASE/health")"

body=$(curl -s -m 15 "$BASE/health")
if [[ "$body" == *'"status":"ok"'* ]]; then echo "PASS  /health body says ok"; else echo "FAIL  /health body: $body"; fail=1; fi

created=$(curl -s -m 15 -X POST -H 'Content-Type: application/json' -d '{"title":"smoke test"}' -w '\n%{http_code}' "$BASE/tasks")
check "POST /tasks -> 201" 201 "$(echo "$created" | tail -n 1)"
id=$(echo "$created" | head -n 1 | grep -o '"id":[0-9]*' | cut -d: -f2)

check "GET /tasks/$id -> 200" 200 "$(status "$BASE/tasks/$id")"
check "DELETE /tasks/$id -> 204" 204 "$(status -X DELETE "$BASE/tasks/$id")"
check "GET an unknown route -> 404" 404 "$(status "$BASE/definitely-not-here")"

if [ $fail -eq 0 ]; then echo "ALL CHECKS PASSED"; else echo "SOME CHECKS FAILED"; fi
exit $fail
```

Run against a healthy local server, then against an address where **nothing** is running:

```text
$ bash scripts/smoke-test.sh
PASS  GET /health -> 200
PASS  /health body says ok
PASS  POST /tasks -> 201
PASS  GET /tasks/4 -> 200
PASS  DELETE /tasks/4 -> 204
PASS  GET an unknown route -> 404
ALL CHECKS PASSED                          (exit code 0)

$ bash scripts/smoke-test.sh http://localhost:3999
FAIL  GET /health -> 200 (expected 200, got 000)
FAIL  /health body:
FAIL  POST /tasks -> 201 (expected 201, got 000)
FAIL  GET /tasks/ -> 200 (expected 200, got 000)
FAIL  DELETE /tasks/ -> 204 (expected 204, got 000)
FAIL  GET an unknown route -> 404 (expected 404, got 000)
SOME CHECKS FAILED                         (exit code 1)
```

`000` is what `curl` reports when it couldn't connect at all. The exit code (`0` / `1`) means a pipeline can run this script after a deploy and stop if it fails. **Or** run your Newman collection (Section 1.4) with an environment whose `baseUrl` is the live URL.

### 7.7 Troubleshooting a deployment *(general knowledge; confirm against the platform's logs)*

| Symptom | Likely cause | Where to look / fix |
|---|---|---|
| **Build fails** | A dependency or a script problem | The build log; is every package in `dependencies` (not only `devDependencies`)? Did you commit `package-lock.json`? |
| **A 404 from Vercel itself** (not your JSON) | Vercel didn't find an entry file | Section 7.2: file name, location, and that it exports the app |
| **A 500 / "function invocation failed"** | The code crashed — often at startup | The **runtime logs** (Section 9.6): a missing environment variable, a failed `require` |
| **`/health` works but `/tasks` fails** | The database: wrong URI variable name, Atlas network access, wrong password | The runtime log for the error; compare the variable name in code and dashboard |
| **Works locally, fails deployed** | A missing environment variable, a different Node version, an ignored file | Compare environments (Section 4); check the logs |
| **Data disappears between requests** | In-memory storage on serverless | Use the database repository |
| **A CORS error in the browser** | The deployed frontend's origin isn't allowed | Set `CORS_ORIGIN` to the frontend URL (Module 2) |
| **Slow first request** | Cold start | Expected; keep startup light |

### Try it yourself

1. Confirm `src/app.js` exports the app and that no other file named `app`, `index` or `server` exists.
2. Run `bash scripts/smoke-test.sh` against your local server, then deliberately stop the server and run it again. What changes?
3. Follow the dashboard steps with your own repo and note any step that differs from the docs.

### Exercises

**Level 1 — Basic:** Deploy the Task API with only `/health` and confirm the live `/health` URL answers `200`.

**Level 2 — Practical:** Connect a hosted MongoDB, add `MONGO_URI` in the dashboard, switch to the Mongo repository (Module 5), and run the smoke test against the live URL.

**Level 3 — Challenge:** Explain, with the table in 7.5, which of the Module 5 Product API's features (uploads, static files, in-memory data) would break on Vercel and how you'd redesign each.

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| Calling `app.listen` inside the file you export | Tests and platforms get a surprise port | Export `app`; listen in `start.js` |
| Several files named `app`/`index`/`server` | Ambiguous entry | One entry file for the platform |
| Relying on in-memory data | Instances don't share memory | A database |
| Forgetting the environment variables in the dashboard | `undefined` at runtime → crash | Add them before deploying; redeploy after changes |
| A new DB connection per request | Exhausts the database's connections | Reuse one per instance |
| `express.static` for assets | Ignored on Vercel | `public/` |
| Putting `/health` behind the database | A DB outage looks like an app outage | Keep it independent |
| Only checking the homepage | The broken part is elsewhere | A smoke test of the main flow |

### ✅ Knowledge Check
1. What does Vercel do with your Express app, and what does "zero configuration" mean?
2. What must the entry file do for Vercel to detect it, and why is the app exported instead of started?
3. Where do production environment variables go, and when must you redeploy?
4. Why cache the database connection, and what happens if a connection attempt fails?
5. Why does an in-memory array of tasks fail on a serverless platform?
6. What is a smoke test, and why does the exit code matter?

---

## 8. Deploying to Render

*(Resource Book, section 2. The alternative to Vercel when it doesn't suit.)*

> 📖 **Reading for this section — [Deploy Node Express App to Render — Render Docs](https://render.com/docs/deploy-node-express-app)**
> Your module file's note: *"Alternative: If Vercel doesn't suit your needs, Render is another excellent free-tier option for Node.js."* *(I did not open that page; I read Render's current Web Services documentation instead, summarised below. I could not deploy to Render from here, so the steps are not run.)*

### 8.1 How Render runs an Express app

Where Vercel runs functions on demand, **Render's web service is a long-running server**: it builds your code, then runs your **start command** as a normal Node process that stays up and listens on a port. This is the model you've used locally, so there is no serverless adaptation: in-memory state lives as long as the process, and one database pool serves every request.

### 8.2 The settings

From Render's Web Services documentation: in the Dashboard choose **New → Web Service**, then **Build and deploy from a Git repository**, connect your GitHub repo, and fill in:

| Setting | What to enter for this project |
|---|---|
| **Language** | Node |
| **Build Command** | `npm install` (the docs' example for Node) — or `npm ci` for an exact, lock-file install |
| **Start Command** | `npm start` (the docs' example) — which runs `node src/start.js` via your `package.json` script |
| **Instance type** | The Free type has limitations (8.4) |
| **Environment** (under *Advanced*) | Your variables (`MONGO_URI`…) and secrets; the same *Advanced* section also lets you set a **health check path** and add a **persistent disk** |
| **Health Check Path** | `/health` — the endpoint from this module |

Your **`package.json` must have a `start` script** — that is what `npm start` runs:

```json
"scripts": {
  "start": "node src/start.js",
  "test": "jest"
}
```

Then **Create Web Service**: Render builds, starts the app and shows an `onrender.com` URL; with **auto-deploy** enabled, later pushes to the connected branch deploy automatically.

### 8.3 Port binding

Render's documentation says every web service **must bind to a port on host `0.0.0.0`** to serve HTTP, that Render forwards inbound requests to that port, and that you should bind to the port in the **`PORT` environment variable**. Render sets `PORT` for you (another Render-related guide mentions a default of `10000`) — **don't hard-code a port**. The project's `config.js` and `start.js` already do the right thing:

```javascript
port: Number(process.env.PORT) || 3000          // config.js: the platform's PORT, else 3000 locally
app.listen(config.port, () => { … });           // start.js: no host given, so Node listens on all interfaces
```

### 8.4 Free-tier behaviour

Render's documentation describes free web services as **spinning down after inactivity**; the first request after that has to wait for the service to start again. One third-party guide puts numbers on it — 15 minutes idle, then a 30–60 second wake-up — **treat the numbers as an unconfirmed, possibly outdated figure** and read Render's *Free instances* page. Practical consequences:

- A free API is fine for learning and demos, but **a slow first request is normal**.
- **In-memory state is lost** when the service spins down, restarts or redeploys — use the database.
- The container's **file system isn't permanent** unless you attach a **persistent disk** (the docs offer one under *Advanced*; check pricing).

### 8.5 Vercel or Render?

| | **Vercel** | **Render** |
|---|---|---|
| Runs your app as | A serverless function (scales automatically) | A normal long-running server |
| Setup for Express | Zero configuration; an exported `app` | Build command + start command + `PORT` |
| In-memory state, long-lived connections | Not reliable | Fine while the process lives |
| File uploads to local disk | Not suitable | Lost on restart unless you add a persistent disk |
| Idle behaviour | Scales down; occasional cold starts | Free instances spin down; first request waits |
| Best fit | Stateless APIs with a hosted database; frontends | A classic always-on API; background work; WebSockets |

Both deploy **from GitHub on every push** and both keep secrets in the dashboard. The challenge uses Vercel; the rest of this module — tests, Git, health checks, logs — works identically on either.

### Try it yourself

1. Add a `start` script to your project and confirm `npm start` runs your app locally.
2. Print `process.env.PORT` on startup and run with `PORT=4567 npm start` to prove you aren't hard-coding the port.
3. Follow the steps with a free account and compare what you see with the table.

### Exercises

**Level 1 — Basic:** List the five Render settings above and the value you'd use for each in your project.

**Level 2 — Practical:** Deploy the API to Render, set the health check path to `/health`, and run the smoke test against the `onrender.com` URL.

**Level 3 — Challenge:** Measure the slow first request after idle on a free instance; describe how you'd explain it to a user, and what a paid instance or an external uptime ping would change.

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| No `start` script in `package.json` | The platform doesn't know how to run the app | `"start": "node src/start.js"` |
| Hard-coding the port | The platform's port isn't used; requests never arrive | `process.env.PORT` |
| Binding to `localhost` only | Not reachable from outside the container | Listen without a host (or `0.0.0.0`) |
| Building with dev tooling missing | Build/test steps fail | Install dev dependencies in the build step if you need them |
| Expecting free-tier uptime | First request after idle is slow | Read the plan; consider a paid instance |
| Storing data in memory or on local disk | Lost on restart | Database / persistent disk |

### ✅ Knowledge Check
1. How is a Render web service different from a Vercel function?
2. What do the **Build Command** and **Start Command** each do?
3. Why must the app listen on `process.env.PORT`?
4. What happens to a free instance when nobody uses it, and what does that mean for in-memory data?

---

## 9. Logging and Monitoring

*(Resource Book, section 3 — "Logging & Monitoring". Once your app is live, how do you know if it breaks? Objective: manage application logs and monitor live deployments.)*

> 📺 **Video for this section — [The Git Guild](https://www.youtube.com/watch?v=WZaKrzVeaO4)**
> Your module file describes it as: *"Moving beyond console.log to structured logging that helps you debug production issues."* *(I haven't watched it. I don't know which logging library it uses; these notes use **pino**, a widely used Node.js logger, and what is run below is pino's behaviour.)*

### 9.1 Why logs?

On your laptop you can set a breakpoint or add a `console.log`. In production **you can't attach to the running app** — the only evidence of what happened is what it **wrote down**. Logs are how you answer "what went wrong, when, for which request?" after the fact.

`console.log('user 42 logged in from 10.0.0.5')` has real limits: it is **free text** (hard to search and filter), has **no severity**, no standard **timestamp**, no shared **context**, and you can't turn it off without editing code. **Structured logging** fixes that: each log entry is a **JSON object on one line** with named fields.

### 9.2 pino: structured logging

```bash
npm install pino pino-http
npm install --save-dev pino-pretty       # readable output for development only
```

```javascript
// src/logger.js
const pino = require('pino');
const config = require('./config');

const logger = pino({
  level: config.logLevel,
  // Never write credentials to the logs.
  redact: ['req.headers.authorization', 'req.headers.cookie']
});

module.exports = logger;
```

Using it — this program was run with `LOG_LEVEL=debug`:

```javascript
console.log('console.log:  user 42 logged in from 10.0.0.5');                         // free text: hard to search
logger.info({ userId: 42, ip: '10.0.0.5' }, 'user logged in');                         // structured: searchable fields
logger.debug({ step: 'cache lookup' }, 'only visible at the debug level');
logger.warn({ attempt: 3 }, 'slow response');

const requestLogger = logger.child({ requestId: 'req-123' });                          // every line carries requestId
requestLogger.info('handling request');
requestLogger.error({ err: new Error('database unreachable') }, 'request failed');
logger.info({ req: { headers: { authorization: 'Bearer secret-token', accept: 'application/json' } } }, 'redaction test');
```
```text
console.log:  user 42 logged in from 10.0.0.5
{"level":30,"userId":42,"ip":"10.0.0.5","msg":"user logged in"}
{"level":20,"step":"cache lookup","msg":"only visible at the debug level"}
{"level":40,"attempt":3,"msg":"slow response"}
{"level":30,"requestId":"req-123","msg":"handling request"}
{"level":50,"requestId":"req-123","err":{"type":"Error","message":"database unreachable","stack":"…565 characters…"},"msg":"request failed"}
{"level":30,"req":{"headers":{"authorization":"[Redacted]","accept":"application/json"}},"msg":"redaction test"}
```
*(Real lines also carry `time`, `pid` and `hostname`; omitted here for readability.)*

What to learn from it:

- **The first line is ordinary text** (`console.log`); every other line is **JSON with fields** you can search: "all lines where `userId` is 42", "all `level` ≥ 50".
- **Levels are numbers:** `20` debug, `30` info, `40` warn, `50` error (pino also has `10` trace and `60` fatal). Meanings: **debug** — detail for developers; **info** — normal events (server started, request completed); **warn** — something odd that didn't fail; **error** — an operation failed; **fatal** — the process can't continue.
- **Context goes in the object, the message stays constant** (`'user logged in'` with `{ userId: 42 }`), which makes logs groupable.
- **A child logger** (`logger.child({ requestId })`) stamps every line it writes with that context.
- **Errors keep their stack** when logged as `{ err }` — pino serialises the type, message and stack.
- **Redaction:** the `Authorization` header was replaced by `[Redacted]` automatically, because of the `redact` list. Secrets in logs are a common, serious leak.

**The level is a switch.** The same program with `LOG_LEVEL=warn` writes **only** the warn and error lines (the `info` and `debug` lines disappear). That is the point of levels: **chatty in development, quiet in production, and one environment variable to change it** — no code edits (Section 4.2's `config.logLevel` default is `info` in production and `debug` otherwise).

### 9.3 Development vs. production output

JSON is for machines; during development you want something readable. **`pino-pretty`** reformats the same logs:

```bash
LOG_LEVEL=debug node logging-demo.js | npx pino-pretty        # logging-demo.js = the program above
```
```text
[time] INFO (586): user logged in
    userId: 42
    ip: "10.0.0.5"
[time] DEBUG (586): only visible at the debug level
    step: "cache lookup"
[time] WARN (586): slow response
    attempt: 3
[time] ERROR (586): request failed
    requestId: "req-123"
    err: { "type": "Error", "message": "database unreachable", … }
```

**Production keeps the JSON**: hosting platforms and log tools parse it. A common rule: pretty-print only through a pipe (or a dev-only setting) in development, and write plain JSON to **stdout** in production. Writing to **stdout** (not to log files on disk) is what platforms expect — they collect it (Section 9.6).

### 9.4 Logging every request: `pino-http`

```javascript
app.use(pinoHttp({ logger }));          // one structured log line per request
```
Three requests sent to the API (`/health` with an `Authorization` header, a missing task, and an invalid create), summarised:

```text
{"level":30,"msg":"request completed","req":{"id":1,"method":"GET","url":"/health"},"res.statusCode":200,"responseTimeMs":3,"req.headers.authorization":"[Redacted]"}
{"level":30,"msg":"request completed","req":{"id":2,"method":"GET","url":"/tasks/99"},"res.statusCode":404,"responseTimeMs":1}
{"level":30,"msg":"request completed","req":{"id":3,"method":"POST","url":"/tasks"},"res.statusCode":400,"responseTimeMs":9}
```

- **One line per request** with the method, URL, **status code** and **response time** — the basic questions of operating an API ("how many 500s? what's slow?").
- **The `Authorization` header is redacted** here too — the same `redact` setting applies.
- Notice the `404` and `400` lines are **level 30 (info)**: by default, *client errors are logged as ordinary requests*. If you want 4xx at `warn` and 5xx at `error`, pino-http has a `customLogLevel` option *(documented; not run here)*.

**A request id ties everything together.** `pino-http` gives each request an id (`1`, `2`, `3` above) and a logger, `req.log`, that stamps it on every line written during that request. You can **use the caller's own id** — so one id follows a request from the browser through your logs — and send it back in a response header. This was run:

```javascript
app.use(pinoHttp({
  logger,
  genReqId: (req, res) => { const id = req.headers['x-request-id'] || crypto.randomUUID(); res.setHeader('X-Request-Id', id); return id; }
}));
app.get('/ping', (req, res) => { req.log.info({ step: 'inside the handler' }, 'doing work'); res.send('pong'); });
```
```text
(request sent with the header  X-Request-Id: trace-abc-123)
response header:  X-Request-Id: trace-abc-123
{"level":30,"msg":"doing work","req":{"id":"trace-abc-123",…},"step":"inside the handler"}
{"level":30,"msg":"request completed","req":{"id":"trace-abc-123",…},"res.statusCode":200,"responseTimeMs":1}
```
Every line for that request carries **`trace-abc-123`** — including the line written *inside* the handler. When a user reports "my request failed", the id in the response header lets you find **every** log line for it.

### 9.5 What to log, and what never to log

| Log | Why |
|---|---|
| **Startup and shutdown** (`server started` with port and environment; `shutting down`) | Confirms a deploy came up and which settings it used |
| **Each request** (method, URL, status, time) | The basis of monitoring |
| **Errors, with the stack** — once, where they're handled | The route to the cause |
| **Important business events** (a user registered, an order placed) at `info` | An audit trail |
| **Warnings** (slow query, retry) | Early signs of trouble |

| **Never** log | Why |
|---|---|
| Passwords, tokens, API keys, `Authorization`/`Cookie` headers | Logs are widely readable and kept for a long time |
| Full request bodies on `/login` or `/register` | They contain passwords |
| Payment details and unnecessary personal data | Privacy and legal exposure |
| The same error at every layer | Noise; log it **once**, in the global error handler |

The global error handler is where a bug is logged (full detail, in the log) while the **client gets only** `Internal Server Error` (Section 2 of Module 5; test of it in 2.7 above). That pairing — **details to the log, nothing to the client** — is the model for all error handling.

Also log **process-level failures** before dying. `start.js` registers the safety net from Module 5 and a graceful shutdown:

```javascript
process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'unhandled rejection');
  process.exit(1);
});

function shutdown(signal) {
  logger.info({ signal }, 'shutting down');
  server.close(() => process.exit(0));
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));      // platforms typically send SIGTERM before stopping a server
```
(`server.close` stops accepting new connections and lets in-flight requests finish.)

### 9.6 Where the logs go in production

Your app writes to **stdout/stderr**; **the platform captures it**. Both Vercel and Render show a service's logs in their dashboards *(general knowledge: look for "Logs" / "Runtime Logs" in the project or service view; the exact location and how long logs are kept depend on the platform and plan — check yours)*. Because your logs are JSON, you can search and filter them by field, and platforms or external log services can parse them. **Retention on free plans is often short** — if you need history, use a log service (🔒 outside this module).

### 9.7 Monitoring: knowing before your users do

Logging records what happened; **monitoring** watches the app **continuously** and tells you when something is wrong.

**The health endpoint** — a cheap route that answers "is the app up?":

```javascript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptimeSeconds: Math.round(process.uptime()) });
});
```
It is used by **you** (`curl`), by **hosting platforms** (Render's *Health Check Path* — Section 8.2), and by **uptime monitors**. Keep it fast and dependency-free (Section 7.4). Some teams add a second, deeper check that also tests the database *(general knowledge)*.

**Uptime monitoring** *(general knowledge)* — an external service that requests your `/health` URL every few minutes and **alerts you** (email, chat) when it fails. Many offer free plans. It is also a way to notice a service has spun down. 

**Platform metrics** *(general knowledge)* — dashboards typically show request counts, error rates, response times and resource use. Learn where yours are.

**A post-deploy routine:** (1) wait for the deployment to finish; (2) run the **smoke test** (Section 7.6); (3) **read the logs** for errors; (4) glance at the error rate and response times for the next few minutes.

**Beyond this module (🔒):** error-tracking services that collect and group exceptions, metrics and tracing systems, alerting rules, dashboards, on-call practices.

### 9.8 Debugging a live problem

```text
1. REPRODUCE      curl the failing endpoint; note the status code, the body and the X-Request-Id header.
2. FIND THE LOGS  search the platform logs for that request id (or the time window).
3. READ THE ERROR the level-50 line carries the message and the stack.
4. REPRODUCE LOCALLY  run the app with the same environment variables (a copy, never production secrets) and the same request.
5. FIX + TEST     write a test that fails, fix the bug, watch it pass (Section 2).
6. SHIP + VERIFY  push, let the pipeline run, smoke-test the live URL, watch the logs.
```

### Try it yourself

1. Replace three `console.log`s in your project with `logger.info`/`logger.error` calls with context objects.
2. Run with `LOG_LEVEL=warn`, then `debug`, and watch which lines appear.
3. Send a request with an `Authorization` header and confirm the log shows `[Redacted]`.
4. Send a request with `X-Request-Id: my-test-1` and find every log line it produced.

### Exercises

**Level 1 — Basic:** Add pino and pino-http to your API and log one line per request.

**Level 2 — Practical:** Add a `redact` entry for `req.body.password`, send a login request, and prove the password never appears in the log.

**Level 3 — Challenge:** Use `customLogLevel` (see pino-http's documentation) so 4xx responses log at `warn`, 5xx at `error`, and health checks aren't logged at all.

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| `console.log` everywhere | No levels, no structure, no redaction | A logger (pino) |
| Logging passwords, tokens, full bodies | Secrets in the logs | `redact`; never log credentials |
| `debug` level in production | Noise, cost, possible data exposure | `info` (or `warn`) via `LOG_LEVEL` |
| Pretty-printing in production | Platforms need JSON | Plain JSON to stdout |
| Logging the same error at every layer | Duplicate noise | Log once, in the error handler |
| Sending error details to the client | Leaks internals | Details to the log, a generic message to the client |
| A `/health` that depends on the database | A DB blip marks the app "down" | Keep it independent |
| Writing logs to a file on a server platform | Lost on restart; not collected | stdout |
| No request ids | You can't connect a user's report to your logs | `pino-http` ids / `X-Request-Id` |

### ✅ Knowledge Check
1. Why is structured JSON logging better than `console.log` for a production API?
2. What do the levels debug, info, warn and error mean, and how does `LOG_LEVEL` change what you see?
3. What does `redact` do, and why does it matter?
4. How does a request id help when a user reports a problem?
5. What is a health endpoint for, and who uses it?
6. Name three things you should never write to a log.

---

## 10. Hands-On Challenge: The CI/CD Pipeline

*(Module Resource Book, section 4. **Scenario:** simulate a professional workflow — write a test, push the code, and see it go live. You have a simple API; you need to ensure it doesn't break before deploying it. **Prerequisites:** a GitHub account, a Vercel account, Node.js installed.)*

### 10.1 The tasks, mapped to this document

| Task from the module | Where it is built |
|---|---|
| **Write a Test:** in your previous "Task Manager" or "Product API" project, install `jest` and `supertest`; write a test for `GET /health` that expects a `200 OK` | Sections 2.2–2.4 |
| **Version Control:** initialize a git repo, create a `.gitignore` (exclude `node_modules` and `.env`), push to a **public** GitHub repository | Section 5 |
| **Deploy:** connect your GitHub repo to Vercel; add your environment variables (like `MONGO_URI`) in the Vercel dashboard settings | Sections 4 and 7 |
| **Verify:** visit your live URL (e.g., `https://my-api.vercel.app/health`) | Sections 7.6 and 9 |

### 10.2 Step by step

**Step 0 — a deployable shape.** Your project needs an exported `app` and a separate listener (Section 2.2), a `/health` route, and a `package.json` with `test` and `start` scripts. Layout of the project used in these notes:

```text
ci-demo/
├── .github/workflows/ci.yml        CI: npm ci && npm test on every push and PR      (Section 5.8)
├── .gitignore                      node_modules/  .env  .env.*  !.env.example  coverage/  *.log
├── .env.example                    names of the variables, committed
├── .env                            real values, NEVER committed
├── jest.setup.js                   silences the logger in tests
├── package.json                    scripts: start, test, test:watch, test:coverage; "jest" config
├── scripts/smoke-test.sh           the post-deploy check                              (Section 7.6)
├── src/
│   ├── app.js                      builds + EXPORTS the Express app (Vercel entry)
│   ├── start.js                    the only file that listens (local / Render)
│   ├── config.js  logger.js  errors.js  errorHandler.js
│   └── tasks/ taskRoutes.js  taskService.js  taskRepository.js
└── tests/                          health.test.js  tasks.api.test.js  taskService.test.js  errorHandler.test.js
```

**Step 1 — write the test** (the challenge's `GET /health` test, Section 2.4) and run it:

```bash
npm install --save-dev jest supertest
npm test
```
```text
PASS tests/health.test.js
  GET /health
    ✓ responds 200 OK with status "ok" (4 ms)
```

**Step 2 — version control** (Section 5): `.gitignore` **first**, then:

```bash
git init -b main
git add -A
git status --short             # READ IT: no .env, no node_modules
git commit -m "Initial commit: Task API with health check and tests"
```

**Step 3 — push to a public GitHub repository** *(not run)*:

```bash
# after creating an empty repository on github.com:
git remote add origin https://github.com/YOUR-USERNAME/ci-demo.git
git push -u origin main
```
Open the repository on github.com and confirm **`.env` is not there**.

**Step 4 — add CI** (optional but it *is* the "CI" in "CI/CD"): create `.github/workflows/ci.yml` (Section 5.8), commit and push; open the **Actions** tab and watch `npm ci && npm test` pass.

**Step 5 — deploy to Vercel** *(not run; Section 7.3)*: import the repo at `vercel.com/new`; check the detected framework; add **`MONGO_URI`** (and any other variable) under **Environment Variables**; **Deploy**.

**Step 6 — verify** (Section 7.6):

```bash
curl https://my-api.vercel.app/health
bash scripts/smoke-test.sh https://my-api.vercel.app
```

**Step 7 — close the loop: change → push → live.** Make a small change (e.g. add a field to the health response), update the test, push:

```bash
git switch -c feature/health-version
# edit src/app.js and tests/health.test.js
npm test                                       # green locally
git commit -am "Add version to the health response"
git push -u origin feature/health-version      # open a pull request: CI runs; Vercel makes a preview URL
# merge the pull request  ->  CI runs on main, Vercel deploys to production
curl https://my-api.vercel.app/health          # the live response now has the new field
```
That sequence — **test → push → CI → deploy → verify** — is the pipeline the challenge asks you to simulate.

### 10.3 Evidence checklist

What was run for these notes, and what is left for you:

| Check | Status |
|---|---|
| `npm test` — 4 suites, 17 tests pass; exit code `0` | **Run** |
| `GET /health` test passes (the challenge's test) | **Run** |
| `.gitignore` ignores `.env` and `node_modules`; `.env.example` is committed | **Run** (`git check-ignore -v`, `git status`) |
| Local commit, branch and merge | **Run** |
| `rm -rf node_modules && npm ci && npm test` (what CI does) | **Run** — it first *failed* because of a stray test file, then passed after the fix (Section 3.3) |
| `ci.yml` is valid YAML with the four expected steps | **Run** (parsed; **not** executed on GitHub) |
| `scripts/smoke-test.sh` passes locally and fails against a dead URL | **Run** |
| Newman flow passes; a broken assertion exits `1` | **Run** |
| Push to GitHub; GitHub Actions run | **You** (needs your GitHub account) |
| Vercel import, environment variables, deploy, live `/health` | **You** (needs your Vercel account) |

### Exercises

**Level 1 — Basic:** Complete Steps 1–3 and send the link to your repository's page, showing that `.env` is absent.

**Level 2 — Practical:** Complete the whole challenge. Then break the `/health` test on a branch, push it, and watch CI **block** the change.

**Level 3 — Challenge:** Add a CI step that runs the smoke test (or Newman) against the **preview** deployment's URL before merging.

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| Deploying before the tests pass | A broken change goes live | Tests (and CI) first |
| `.env` pushed to the public repo | The secret is public forever (Section 5.5) | `.gitignore` before the first commit; rotate if it happened |
| Variables added to the dashboard *after* the deploy, without redeploying | The running app still lacks them | Redeploy |
| `MONGO_URI` in the dashboard but `MONGODB_URI` in the code | `undefined` → connection error | One name everywhere |
| Testing only the home page after deploy | The broken part is elsewhere | The smoke test or Newman flow |
| No `/health` | Nothing cheap to check or monitor | Add it (it is also the challenge's test) |

### ✅ Knowledge Check
1. Put the pipeline steps in order: test, push, CI, deploy, verify. What stops a broken change from reaching production?
2. What must be true of the repository before the first push?
3. Where do `MONGO_URI` and other secrets go for the deployed app?
4. How do you verify a deployment beyond opening the home page?

---

## 11. Final Module Project: A Tested, Logged and Deployed API

The challenge in Section 10 is the module's hands-on work. This project states it as **requirements you can be reviewed against**, and it is the **capstone of the whole backend course**: take an API you built earlier (the Task API, or the Module 5 Product API) and make it something you'd be comfortable running in production.

### 11.1 Requirements

**Testing:**

1. **Jest + Supertest.** The app is **exported** from `app.js` and started from a separate file. `npm test` runs the whole suite and **exits `0` on a clean install** (`rm -rf node_modules && npm ci && npm test`).
2. **A `GET /health` test** (the challenge's) — status `200` and a JSON body with `status: "ok"`.
3. **Unit tests** for the service's rules with the repository **mocked** (including the error cases), and **integration tests** for **every route**: success, validation failure (`400`), not found (`404`), malformed JSON, and one **full flow** (create → read → delete → `404`).
4. **An error-path test:** a bug in a handler returns the generic `500` **without** leaking the error's message.
5. Tests are **independent** (state reset in `beforeEach`), use **no real database or secrets**, and silence the logger.

**Postman / Newman:**

6. A **Postman collection** for the same flow with **assertions**, a `{{baseUrl}}` **environment** for `local` and `production`, run with **Newman** (non-zero exit code on failure).

**Configuration and security:**

7. All configuration comes from **environment variables** through one `config.js`; `.env` is git-ignored and `.env.example` is committed; **production values live only in the platform's dashboard**; names match in code, `.env.example` and the dashboard.

**Git, GitHub and CI:**

8. A GitHub repository with a proper `.gitignore` (excluding `node_modules` and `.env`), a committed `package-lock.json`, **small commits with clear messages**, and at least one **feature branch merged through a pull request**.
9. A **GitHub Actions** workflow that runs `npm ci && npm test` on every push and pull request — and you have **seen it fail** (on a deliberately broken test) and pass.

**Deployment:**

10. Deployed from GitHub to **Vercel (or Render)**, with environment variables set in the dashboard and a **live `/health`** URL. If you use a database, it is a hosted one with a **connection reused** per instance (serverless) or per process (Render).

**Logging and monitoring:**

11. **Structured logging with pino**: one line per request with a request id, a `LOG_LEVEL` switch, **credentials redacted**, errors logged **once** with the stack while clients get a generic `500`, a process-level `unhandledRejection` log-and-exit, and a graceful `SIGTERM` shutdown.
12. A **post-deploy routine**: a smoke-test script (or the Newman collection against the production environment) that you run after every deploy, and you can show where the live logs are.

**Evidence for the code review:**

13. A **README** with: how to run and test it, the environment variables (matching `.env.example`), the pipeline in one paragraph (*test → push → CI → deploy → verify*), links to the repository and the live URL, and **one decision** you made and why (for example, Vercel vs. Render).

### 11.2 Acceptance criteria

| Check | Expected |
|---|---|
| `rm -rf node_modules && npm ci && npm test` | Passes, exit code `0` |
| `git check-ignore -v .env node_modules` | Both ignored; `.env.example` and `package-lock.json` tracked |
| The repository on github.com | No `.env`; commit history is readable; a merged pull request exists |
| A pull request with a **failing** test | The Actions check is red and blocks (or at least flags) the merge |
| `curl <live-url>/health` | `200` and `{"status":"ok",…}` |
| `bash scripts/smoke-test.sh <live-url>` | `ALL CHECKS PASSED`, exit code `0` |
| Newman against the production environment | Exit code `0`; a deliberately wrong assertion exits `1` |
| A request with `X-Request-Id: my-check-1` | The response header echoes it, and the live logs contain that id |
| A request with an `Authorization` header | Logged as `[Redacted]` |
| A forced bug in a handler | Client sees only `Internal Server Error`; the log has the stack |
| Dashboard variable name vs. code | Identical |

### 11.3 Hints

- **Order of work:** make it testable (export `app`) → tests → `.gitignore` and Git → CI → deploy → logging polish → smoke test. Each step is small and checkable.
- **A red CI run is information, not failure.** Read the log from the top; reproduce with `npm ci && npm test` locally.
- Reproduce **platform problems locally first**: same environment variables, same Node version, same start command.
- **Check the logs before changing code** when a deploy misbehaves — a missing variable shows up there in seconds.
- Keep `/health` **fast and dependency-free**.

### 11.4 Optional stretch challenges

- **Coverage threshold:** make `npm run test:coverage` fail if coverage drops below a number you choose (Jest has a `coverageThreshold` setting; check its documentation).
- **CI runs Newman** against a started copy of the API and publishes the JUnit report.
- **Docker in CI:** build the image from Module 4 (Section 11) as a pipeline step to prove it builds.
- **Branch protection:** require the CI check to pass before merging to `main`.
- **A deeper health check** (`/health/ready`) that also verifies the database, kept separate from the simple `/health`.
- **External uptime monitoring** pointed at `/health`, with an email alert.
- **Error tracking** with a hosted service — 🔒 outside this module.
- **Deploy the same app to both Vercel and Render** and write down what had to change (Section 8.5).

---

## 12. Quick Reference Sheet

### The pipeline
```text
write a test  ->  commit  ->  push  ->  CI runs  npm ci && npm test  ->  deploy (Vercel / Render)  ->  smoke test  ->  watch the logs
a failing test / non-zero exit code stops the pipeline
```

### Make it testable
```javascript
// app.js:   module.exports = app;        (never app.listen here)
// start.js: const server = app.listen(config.port, ...);    + unhandledRejection + SIGTERM handlers
```

### Jest + Supertest
```javascript
const request = require('supertest');
const app = require('../src/app');
beforeEach(() => repository.reset());                      // independent tests
it('creates', async () => {                                // async + await EVERYTHING
  const res = await request(app).post('/tasks').send({ title: 'x' });
  expect(res.status).toBe(201);
  expect(res.body).toEqual({ id: 1, title: 'x', completed: false });     // toBe: primitives · toEqual: objects/arrays
});
await request(app).get('/tasks/1').expect(404);            // Supertest's own status shortcut
jest.mock('../src/tasks/taskRepository');                  // unit test: mock the dependency
repository.findById.mockResolvedValue(null);               await expect(fn()).rejects.toThrow(NotFoundError);
expect(mockFn).toHaveBeenCalledWith(7);                    it.each([...])(...)       expect.assertions(n)
// package.json: "test": "jest", "jest": { "testEnvironment": "node", "testMatch": ["<rootDir>/tests/**/*.test.js"] }
// NODE_ENV is 'test' under Jest · npm run test:coverage · npm run test:watch
// "Jest did not exit..." = a server/handle left open -> use Supertest, close servers in afterAll
```

### node:test
```javascript
const { describe, it, beforeEach } = require('node:test'); const assert = require('node:assert/strict');
// node --test path/to/file.test.js   (a file or pattern, not a directory, on the Node version used here)
```

### Postman / Newman
```text
request -> collection -> environment ({{baseUrl}})      pm.test('…', () => pm.response.to.have.status(201));
pm.collectionVariables.set('taskId', pm.response.json().id);          // chain requests
npx newman run flow.postman_collection.json -e local.postman_environment.json      exit 0 = all passed, 1 = a failure
--reporters cli,junit --reporter-junit-export results.xml                           (CI report)
```

### Environment
```text
.env (ignored)  ·  .env.example (committed)  ·  platform dashboard (production)  ·  jest.setup.js (tests)
config.js reads once: NODE_ENV, PORT, LOG_LEVEL ...      real env vars WIN over .env      same variable NAME in code, .env.example and dashboard
redeploy after changing a dashboard variable
```

### Git
```bash
git init -b main · git add -A · git status --short · git commit -m "Add health endpoint" · git log --oneline --graph
git switch -c feature/x · git merge feature/x · git remote add origin URL · git push -u origin main · git pull · git clone URL
.gitignore: node_modules/  .env  .env.*  !.env.example  coverage/  *.log        commit package-lock.json
committed a secret? .gitignore doesn't untrack it; git rm --cached stops tracking but HISTORY keeps it -> ROTATE the secret
```

### GitHub Actions (CI)
```yaml
on: { push: { branches: [main] }, pull_request: {} }
jobs: { test: { runs-on: ubuntu-latest, steps: [ { uses: actions/checkout@v4 }, { uses: actions/setup-node@v4, with: { node-version: 22, cache: npm } }, { run: npm ci }, { run: npm test } ] } }
```

### Vercel vs. Render
```text
Vercel   serverless function · zero config · entry app|index|server (root or src/) exporting the app (or app.listen) · express.static ignored (use public/)
         no durable memory/disk -> hosted database; reuse the DB connection per instance · env vars in the project settings · redeploy after changes
Render   long-running server · Build: npm install (or npm ci) · Start: npm start · listen on process.env.PORT (0.0.0.0) · Health Check Path /health
         free tier spins down when idle · env vars in the service's Environment settings
```

### Logging
```javascript
logger.info({ userId: 42 }, 'user logged in');     // context in the object, constant message        levels: 20 debug · 30 info · 40 warn · 50 error (10 trace · 60 fatal)
logger.child({ requestId });   redact: ['req.headers.authorization']    LOG_LEVEL=warn    pino-pretty (dev only)    JSON to stdout in production
app.use(pinoHttp({ logger, genReqId }));           // one line per request, req.id, req.log
never log passwords, tokens, Authorization/Cookie, request bodies of /login
```

### Smoke test and monitoring
```text
bash scripts/smoke-test.sh https://my-api.vercel.app        PASS/FAIL lines + exit code      curl status 000 = could not connect
/health: fast, no dependencies · used by you, the platform and uptime monitors
after every deploy: smoke test -> read the logs -> check error rate and response times
```

### 🔒 Coming Later — Outside This Module
End-to-end browser tests · load and performance testing · test databases in depth · Docker-based deployment pipelines · infrastructure as code · log aggregation, tracing and metrics systems · error-tracking services · alerting and on-call · blue/green and canary deployments · cloud object storage for uploads.

---

## 13. Source & Resource Mapping

### Learning-objective coverage

| Learning objective | Where it is covered |
|---|---|
| Test APIs manually using Postman and automate flows | Section 1 |
| Write unit and integration tests with Jest and Supertest | Sections 2 and 3 |
| Configure environment variables (`.env`) for safe development and production | Section 4 |
| Use Git and GitHub for version control | Section 5 |
| Deploy Node.js applications to Vercel (or Render) | Sections 6, 7 and 8 |
| Manage application logs and monitor live deployments | Section 9 |
| Hands-on challenge: the "CI/CD" Pipeline | Sections 10 and 11 |

### Resources from your module file

| Module topic | Resource | Where it appears |
|---|---|---|
| API testing — Postman | **No usable link.** The Fireship link in this entry is, by your file's note, the "7 Ways to Deploy" video; the file recommends searching *"Postman API Testing for Beginners"* | Section 1 (no video) |
| Jest and Supertest (video) | [Sam Meech-Ward](https://www.youtube.com/watch?v=FKnzS_icp20) | Section 2 |
| Node.js test runner (reading) | [Using Node.js Test Runner — Node.js Official Docs](https://nodejs.org/en/learn/test-runner/using-test-runner) | Section 3 — *I did not open the page; the takeaway is quoted from your file* |
| Deployment strategies (video) | Fireship — the entry has no link; [the Fireship URL from the Postman entry](https://www.youtube.com/watch?v=uEVmD6n8Il0) is identified by your file's note as "7 Ways to Deploy" | Section 6 — *placed here by my judgement; please confirm* |
| Deploying Express to Vercel (video) | [Lets build together](https://www.youtube.com/watch?v=IeM1PGqmJT4) | Section 7 |
| Deploying to Render (reading) | [Deploy Node Express App to Render — Render Docs](https://render.com/docs/deploy-node-express-app) | Section 8 — *I did not open that page; I read Render's Web Services documentation instead* |
| Logging and monitoring (video) | [The Git Guild](https://www.youtube.com/watch?v=WZaKrzVeaO4) | Section 9 |
| Hands-on challenge: the "CI/CD" Pipeline | — | Sections 10 and 11 |

*I have not watched the videos or opened the two linked pages; each description is quoted from your module file. Your file lists **no resource** for the environment-variables and Git/GitHub objectives; Sections 4 and 5 are my own.*

### Other sources

| Used for | Source |
|---|---|
| Jest 30.5.2, Supertest 7.3.1, pino 10.4.0, pino-http 11.0.0, Newman 6.2.3, Express 5.3.0, Git 2.43 behaviour, and every output shown for them | Running the code described (Node 22.23) |
| Package versions | The npm registry, checked in November 2026 |
| Vercel's handling of Express (zero configuration, entry files, default export or `app.listen`, one Vercel Function, `public/` instead of `express.static`, the 250 MB function limit, preview deployments) | Vercel's documentation — the *Express on Vercel* framework page and the guide *How to ship an Express app on Vercel* — read November 2026 |
| Render's web-service settings (build and start commands, `PORT`/`0.0.0.0`, health check path, persistent disk, free instances spinning down) | Render's *Web Services* documentation, read November 2026; the specific idle numbers (15 minutes, 30–60 seconds) come from a **third-party guide** and are flagged as unconfirmed in the text |
| GitHub steps, GitHub Actions execution, Vercel and Render dashboards, Postman's graphical interface | **Not run** — described from the platforms' documentation and general knowledge; the workflow file was validated and its commands dry-run locally |

---

## 14. Practice Questions

Your module file lists no quiz for this module, so these questions are my own, for practice. Try them first; answers follow.

**Questions**

1. Why is the Express app exported from `app.js` and started from a different file?
2. What is the difference between a unit test and an integration test? Give an example of each.
3. What does `jest.mock('../src/tasks/taskRepository')` do, and what does `mockResolvedValue` add?
4. Why does each test start with `beforeEach(() => repository.reset())`?
5. What can go wrong if you forget `await` before `request(app)…` in a test, and what does `expect.assertions(n)` do about it?
6. What does "Jest did not exit one second after the test run has completed" mean, and how do you fix it?
7. A coverage report shows 100% lines but 66% branches. What does that tell you?
8. What is the difference between `npm install` and `npm ci`, and why does CI use `npm ci`?
9. What does `testMatch` protect against when a `node:test` file is in the project?
10. What do Newman's exit codes mean, and why does that matter in a pipeline?
11. Why use `{{baseUrl}}` in a Postman collection, and how does one request pass a value (such as an id) to the next?
12. Who sets `NODE_ENV` under Jest, and to what? Which wins when a variable is set both in the shell and in `.env`?
13. Where do production environment variables live? What goes wrong if the variable is called `MONGO_URI` in the dashboard and `MONGODB_URI` in the code?
14. You added `.env` to `.gitignore` after committing it. Is the secret safe? What must you do?
15. What does each line of a GitHub Actions workflow with `checkout`, `setup-node`, `npm ci` and `npm test` do, and what makes the job fail?
16. How does Vercel run an Express app, and what must the entry file do?
17. How does Render's web service differ from Vercel's model, and which settings does it need (build, start, port)?
18. Why does an in-memory array of tasks (and local file uploads) fail on a serverless platform, and what do you use instead?
19. Why cache the database connection in a serverless function, and what must happen if a connection attempt fails?
20. Give three advantages of structured (JSON) logging over `console.log`, and explain what `redact` and a request id do.
21. What is a health endpoint, who uses it, and what is a smoke test?
22. Put the pipeline in order — test, push, CI, deploy, verify — and say what stops a broken change from reaching production.

**Answer key**

*Prerequisite self-check:*

1. The **`app`** (`module.exports = app`), with the code that calls `app.listen` in a separate file. 2. **`404`** with `{ "status": "error", "message": "Route not found: METHOD /path" }`. 3. In **environment variables** (the platform's dashboard in production; a git-ignored `.env` locally) — **never** in Git. 4. In current Node.js it is **fatal**: the process prints the error and exits with code **1**.

*Practice questions:*

1. Tests (and serverless platforms) need to **import the app without opening a port**; Supertest sends requests straight to the `app` object, and `start.js` is the only file that listens.
2. A **unit** test checks one piece in isolation with its dependencies faked (the service with a **mock repository**); an **integration** test checks several pieces together (a real HTTP request through route → service → in-memory repository).
3. It replaces the module with an **auto-mock** whose functions return `undefined`; **`mockResolvedValue(x)`** makes an async mock function resolve to `x`.
4. Tests must be **independent**: each starts from a known empty state, so results don't depend on test order.
5. The test may **finish before the assertion runs**, so the result depends on timing (an assertion can be missed). `expect.assertions(n)` **fails the test** if fewer than `n` assertions ran.
6. A test left something open (usually a **server started with `app.listen`**). Use Supertest instead, or close the server in `afterAll`.
7. Every line ran at least once, but **not every branch** (`if`/`else`, `??`) was exercised — some paths are untested.
8. `npm ci` installs **exactly** what `package-lock.json` says, from scratch (and fails if the lock file doesn't match); `npm install` may update versions. CI wants **reproducible** installs.
9. Without it, Jest also tries to run the `node:test` file and fails ("must contain at least one test"), making `npm test` exit non-zero. `testMatch` limits Jest to the `tests/` folder.
10. **`0`** = every assertion passed; **non-zero** (1) = a failure. A pipeline treats non-zero as "the build failed".
11. So the same collection runs against any environment (local, production) by switching the environment. A request's **test script** sets a **collection variable** (`pm.collectionVariables.set('taskId', …)`) that later requests read as `{{taskId}}`.
12. **Jest** sets it to **`test`**. The **real environment variable wins** over `.env`.
13. In the **platform's dashboard** settings (never a committed file). With mismatched names `process.env.MONGODB_URI` is **`undefined`**, so the app can't connect.
14. **No.** `.gitignore` doesn't untrack a committed file, and the secret is in the **history** (and public if the repo is). `git rm --cached .env` stops tracking, but you must **rotate** the secret.
15. `checkout` downloads the code; `setup-node` installs Node (with an npm cache); `npm ci` does a clean install; `npm test` runs Jest. The job **fails when a step exits non-zero** (for example a failing test).
16. As **a single Vercel Function** that scales automatically (zero configuration). The entry file (named `app`, `index` or `server`, at the root or in `src/`) must **import `express` and export the app** (or call `app.listen`).
17. Render runs a **long-running server** built from your repo: **Build Command** (`npm install`), **Start Command** (`npm start`), and the app must **listen on `process.env.PORT`** (host `0.0.0.0`).
18. Instances have their **own, short-lived memory** and a **non-durable file system**; use a **hosted database** and **object storage**.
19. To avoid opening a **new connection on every request** (exhausting the database); a **failed** attempt must **not be cached**, so the next request retries.
20. Searchable fields, **levels** you can switch with `LOG_LEVEL`, machine-parseable output (also timestamps/context, error stacks). **`redact`** replaces sensitive fields (e.g. `Authorization`) with `[Redacted]`; a **request id** ties every log line of one request together.
21. A **health endpoint** (`/health`) is a cheap route answering "is the app up?", used by you, hosting platforms and uptime monitors. A **smoke test** is a quick scripted check of the main path after a deploy.
22. **test → push → CI → deploy → verify.** A failing test (non-zero exit) makes **CI fail**, which blocks the merge/deploy, so the broken change never goes live.

---

## 15. Glossary

| Term | Meaning |
|---|---|
| **Unit test** | A test of one piece of logic in isolation, with dependencies replaced by fakes |
| **Integration test** | A test of several pieces working together (e.g. HTTP → route → service → repository) |
| **End-to-end test** | A test of the whole system, often through a real browser |
| **Jest** | A JavaScript test runner with assertions and mocking |
| **Supertest** | A library that sends HTTP requests to an Express `app` for testing, with assertions on the response |
| **Mock** | A fake replacement for a dependency, with controllable behaviour |
| **Assertion (`expect`)** | A statement a test checks (`expect(res.status).toBe(200)`) |
| **Coverage** | A measure of which code your tests executed |
| **`node:test`** | Node's built-in test runner |
| **Postman / collection / environment** | An API client app / a saved group of requests / a set of variables for one target |
| **Newman** | Postman's command-line runner; its exit code reports pass/fail |
| **Smoke test** | A few quick checks that a deployment is alive and the main path works |
| **`NODE_ENV`** | The conventional variable naming the environment (`development`, `test`, `production`) |
| **Environment variable** | A value supplied to the process from outside the code |
| **`.env` / `.env.example`** | Local values (never committed) / the list of variable names (committed) |
| **Git / GitHub** | Version-control software on your machine / a hosting service for Git repositories |
| **Commit / branch / merge** | A saved snapshot / a line of work / combining two lines |
| **Remote / `origin`** | A copy of the repository elsewhere / its conventional name |
| **`.gitignore`** | A file listing patterns Git should not track |
| **Pull request (PR)** | A request to merge a branch, reviewed and checked before merging |
| **CI (Continuous Integration)** | Automatically building and testing on every push |
| **CD (Continuous Deployment)** | Automatically deploying when the checks pass |
| **GitHub Actions** | GitHub's built-in CI/CD, configured by YAML workflow files |
| **`npm ci`** | A clean, exact install from `package-lock.json` |
| **Serverless function** | Code run on demand in short-lived instances (Vercel Functions) |
| **Long-running server (PaaS)** | A process that stays up and listens on a port (Render web service) |
| **Cold start** | The extra delay when an idle instance must start for a request |
| **Preview deployment** | A temporary deployment of a branch or pull request with its own URL |
| **Structured logging** | Writing logs as machine-readable records (JSON) with named fields |
| **Log level** | The severity of a log entry (debug, info, warn, error, fatal) |
| **pino / pino-http** | A fast Node.js logger / its Express middleware that logs each request |
| **Redaction** | Automatically hiding sensitive fields in logs |
| **Request id** | An identifier attached to every log line of one request |
| **Health endpoint** | A cheap route (`/health`) answering "is the app up?" |
| **Uptime monitor** | An external service that checks your URL regularly and alerts on failure |
| **Graceful shutdown** | Finishing in-flight requests before the process exits (on `SIGTERM`) |
