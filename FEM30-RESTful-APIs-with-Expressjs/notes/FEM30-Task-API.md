# FEM30 — RESTful APIs with Express.js: The RESTful Task Tracker

Project: `FEM30-RESTful-APIs-with-Expressjs/task-api/`
Specification: `notes/Module02.md` (hands-on lab) and Section 8 of `Backend-Module2-RESTful-APIs-with-Express.md`
(final project, contract table, acceptance criteria). This module has no separate task file.

**Result:** a modular Express 5 API with the full CRUD contract, validation, request logging, central JSON error
handling, 65 automated tests, a saved request collection and an OpenAPI description. `task-api-check.sh` reports
**14 passed, 0 failed** against the running server.

---

## 1. What this adds over FEM29

FEM29's server routed by hand with `if (url.pathname === ...)` on Node's `http` module. This module builds the same
idea with **Express**, a small framework on top of that module that provides:

| Hand-written in FEM29 | Express gives you |
|---|---|
| `if (pathname === '/api/health' && method === 'GET')` | `router.get('/health', handler)` |
| `new URL(req.url, base)` and `searchParams` | `req.query`, `req.params` |
| `JSON.stringify` + `writeHead` + `end` | `res.status(201).json(obj)` |
| reading and parsing a request body yourself | `express.json()` middleware |
| a growing `if/else` for 404 | a `notFound` middleware at the end |

Express still runs on Node's event loop and the same `req`/`res` objects. It adds structure, not new powers.

---

## 2. REST in this API (Objective 1)

REST = model the system as **resources** (nouns) identified by URLs and manipulate them with the standard HTTP
**methods**; the **status code** tells the client how it went. Here the only resource is a task.

| Operation | Method + URL | Why this method | Safe? | Idempotent? |
|---|---|---|:---:|:---:|
| List | `GET /tasks` | read | yes | yes |
| Read one | `GET /tasks/3` | read | yes | yes |
| Create | `POST /tasks` | the server chooses the id | no | **no** |
| Replace | `PUT /tasks/3` | whole resource at a known URL | no | **yes** |
| Change part | `PATCH /tasks/3` | only some fields | no | (not guaranteed) |
| Delete | `DELETE /tasks/3` | remove | no | **yes** (final state) |

- **Safe** = doesn't change anything. **Idempotent** = doing it many times has the same *effect* as once.
- `PUT` twice -> same task both times (a test checks the second response equals the first). `DELETE` twice ->
  the task is gone either way, but the *response* differs (204 then 404): idempotent refers to the server state, not the
  response. `POST` twice -> **two** tasks with two ids (a test proves it).
- **Status codes used:** 200 OK, **201 Created** (+ `Location` header with the new URL), **204 No Content** (success,
  nothing to send), 400 Bad Request (client sent something invalid), 404 Not Found, 413 Payload Too Large, 500 Internal
  Server Error.
- **400 vs 404 for ids:** `/tasks/abc` is a malformed request (400); `/tasks/999` is well formed but nothing is
  there (404).
- **Stateless:** each request carries everything the server needs; the server remembers no conversation (only the
  stored tasks).

---

## 3. The code, file by file (Objective 2 and 3)

### `app.js` — the pipeline, and why order matters
```js
app.use(requestLogger);     // 1
app.use(express.json());    // 2
app.use('/tasks', tasksRouter);  // 3
app.use(notFound);          // 4
app.use(errorHandler);      // 5
```
A request goes through this list **top to bottom** until something sends a response. The logger comes first so it sees
every request; `express.json()` must come before the routes or `req.body` is empty; `notFound` is after all routes
because it means "nothing above matched"; the error handler is last because Express only sends errors forward to
handlers defined after the failing code. `app.js` only **builds** the app and exports it; `server.js` calls `listen`.
Separating them is what lets the tests start the app on a free port.

### `routes/tasks.js` — HTTP in, HTTP out
- `express.Router()` is a mini-app mounted at `/tasks`, so routes inside are written as `'/'` and `'/:id'`.
- `router.param('id', ...)` runs for every route containing `:id`, so the id is validated **once**, stored in
  `req.taskId`, and bad ids get a 400 before any route code runs.
- Each handler does the same three things: validate the input -> call the store -> turn the result into a response.
  `return res...` is used so no code runs after the response is sent.
- `res.status(201).location('/tasks/4').json(task)` — chained: status, a header, then the JSON body (this also sets
  `Content-Type: application/json`).
- `res.sendStatus(204)` for delete: status only, empty body.

### `store.js` — the data, with no HTTP in it
An array and an id counter in module scope, with `list/get/create/replace/update/remove/reset`. It takes and returns
plain values, never `req`/`res`. Details: `list()` returns a **copy** so callers can't change the data behind its
back; ids come from a counter, so they are **never reused** after a delete (a test checks it);
`replace` builds a **new** object (PUT semantics: unspecified fields reset) while `update` merges (PATCH semantics).

### `validate-task.js` — validation as plain functions
- `parseId('42')` -> `42`, everything else -> `null`. A regular expression is used because `Number('')` is `0` and
  `Number('1e3')` is `1000`, both of which would wrongly pass.
- `validateTask(body, { partial })` returns `{ value }` or `{ errors }`. `partial: true` is PATCH mode.
- **Express 5 detail:** when a request has no JSON body, `req.body` is `undefined`, and `req.body.title` would throw.
  The very first check is therefore `typeof body !== 'object' || body === null || Array.isArray(body)`.
- Only **known fields are copied** into `value`: a client sending `{ "id": 99, "admin": true }` can't choose the id or
  smuggle fields in (tests prove both).

### `middleware/request-logger.js`
Middleware is a function `(req, res, next)`. It records the start time, registers a `finish` listener (fires when the
response has been sent, so the status code is the real one), and calls `next()` — **forgetting `next()` makes every
request hang**. Output: `POST /tasks 201 8.5ms`.

### `middleware/errors.js`
- `notFound(req, res)` -> JSON 404 naming the route.
- `errorHandler(err, req, res, next)` — Express recognises an error handler **only by its four parameters** (even
  though `next` is rarely used). Rules implemented: if headers were already sent, delegate to Express; use `err.status`
  when it is a 4xx (body-parser sets 400 for malformed JSON and 413 for too large); for anything else send a generic
  `500 Internal Server Error` and log the real error **only on the server**, so internals never leak (a test throws
  `"secret database password…"` from inside the store and checks it is absent from the response).
- Express 5 forwards errors thrown in route handlers (including rejected promises from `async` handlers) to this
  handler automatically; Express 4 needed `try/catch` + `next(err)`.

### `server.js`
Reads `PORT` from the environment (default 3000). In Express 5 the `listen` callback also receives start-up errors, so it
checks `error` first: a port that's already in use prints a one-line fix and exits with code 1 instead of falsely
printing "listening". (I hit exactly this while testing: the first version printed both messages.)

---

## 4. Testing the API (Objective 5)

### Automated: `npm test` (65 tests, Node's built-in runner, no extra packages)
- `test/tasks.test.js` starts the real app on **port 0** and uses `fetch`. `beforeEach(store.reset)` gives every test the
  same three seed tasks, so tests are independent.
- Covered: every endpoint's success path; filters; every error path (bad id values such as `abc 0 -1 1.5 1e3`, blank or
  non-string title, wrong `completed` type, array body, JSON primitives, malformed JSON, form-encoded body, no body, 413
  too large, unknown route); `Location` header; `204` empty body; **idempotency** of PUT and non-idempotency of POST;
  ids not reused; PUT resets defaults and can't change the id; PATCH changes only supplied fields; the **500 doesn't
  leak** and is logged; and "no response is ever HTML".
- `test/store-and-validation.test.js`: plain unit tests of `parseId`, `validateTask` and the store, no HTTP.
- `test/each.js`: `node:test` has no table-driven helper, so a 10-line `forEach(cases, title, fn)` registers one
  test per case.

### Manual / tool-based
- **`task-api-check.sh`** (from the module): `npm start` in one terminal, `npm run check` in another: **14 passed, 0
  failed**.
- **Saved request collection** `postman/task-api.postman_collection.json` (the lab's "save your request collection"
  deliverable): 16 requests in two folders (happy path + 9 error cases), with test scripts and a `taskId` variable
  saved by the Create request and reused by Get/Put/Patch/Delete. I could not run the real Postman app here, so I
  verified the collection by executing every request against the running server with a small script that evaluates the
  same `pm.*` assertions: 24/24 assertions passed. Importing into Postman is the remaining manual step.
- `curl -i` was used to inspect raw headers (201 + `Location`, 413, 400 for form data).

---

## 5. Documentation (module Section 7)

`openapi.yaml` describes every path, parameter, request body, response and the shared error schema in OpenAPI 3.0.
I checked it is valid YAML with all `$ref`s resolving; I did not serve Swagger UI inside the app (that is an
optional stretch, and would add a dependency). You can paste the file into https://editor.swagger.io to browse it.

---

## 6. Common mistakes (and how this project avoids them)

| Mistake | Symptom | Here |
|---|---|---|
| Forgetting `next()` in middleware | requests hang | logger calls `next()`; tests exercise every path |
| `express.json()` placed after the routes | `req.body` is `undefined` | registered before the router |
| Reading `req.body.title` when the body is missing | 500 crash (Express 5: `undefined`) | `validateTask` checks the body's type first |
| `Number(req.params.id)` without a check | `'abc'` -> `NaN` silently matches nothing; `''`->0 | `parseId` with a regex, 400 |
| Returning 200 with an error body | clients can't tell failure | proper 400/404/413/500 |
| HTML error pages from Express's default handler | clients expecting JSON break | `notFound` + `errorHandler` send JSON |
| Leaking error messages in 500s | security risk | generic message, details only in the log |
| Trusting the body's fields | client sets `id`, `admin` | only validated known fields are copied |
| Sending two responses / code after `res.json` | "Cannot set headers after they are sent" | `return res...` everywhere |
| Putting `listen` in `app.js` | tests can't start their own server | `app.js` exports, `server.js` listens |
| Error handler with three params | never called | four parameters |
| Mutating the array returned by `list()` | store corrupted | `list()` returns a copy |
| Test depending on previous test | passes alone, fails together | `reset()` before each test |

---

## 7. TA review questions

**1. What is REST?** An architectural style: resources are nouns with URLs, standard HTTP methods are the verbs,
status codes report the outcome, and requests are stateless.

**2. Why `POST /tasks` and not `POST /createTask`?** URLs name resources; the method carries the action.

**3. PUT vs PATCH?** PUT replaces the whole task (so unspecified fields reset; `title` required). PATCH changes only
the fields sent. This API's PUT resets `completed` to false if omitted; a test shows it.

**4. Which methods are idempotent and how does your API show it?** GET, PUT, DELETE. PUT twice gives identical
responses and state; DELETE twice ends in the same state (although the second response is 404); POST twice creates two
tasks. All three behaviours are tested.

**5. Why 201 and a `Location` header on POST?** 201 says "created", `Location` tells the client where the new
resource lives (`/tasks/4`).

**6. Why 204 for delete, and 404 the second time?** Nothing to return after deleting; the second time the task
doesn't exist.

**7. 400 vs 404?** 400: the request is malformed or invalid (`/tasks/abc`, missing title). 404: well-formed but the
resource isn't there (`/tasks/999`).

**8. What is middleware, and why does order matter?** A function `(req, res, next)` that can act on the request,
respond, or pass on with `next()`. Express runs them in registration order, so the JSON parser must precede the routes
and the error handler must come last.

**9. How does Express know a function is an error handler?** It has four parameters `(err, req, res, next)`.

**10. What happens to a malformed JSON body?** `express.json()` raises a parse error with status 400; the error
handler turns it into `{ "error": "Malformed JSON in the request body" }`.

**11. What changed in Express 5 that affects validation?** `req.body` is `undefined` if no JSON body was parsed, so
validation must check it is an object before reading properties; and async/rejected errors reach the error handler
automatically.

**12. Why separate `app.js` and `server.js`?** So tests can import the app and listen on a free port; only
`server.js` binds the real port.

**13. Why keep `store.js` free of Express?** Separation of concerns: HTTP in the router, data in the store,
rules in validation. Each can be understood and unit-tested alone, and the store could later be swapped for a database
without touching the routes.

**14. What is `router.param('id')` for?** Runs once for every route with `:id`: validates and parses the id in one
place.

**15. Why do 500 responses say only "Internal Server Error"?** Error messages can reveal internals (file paths, SQL,
secrets). The real error is logged on the server; the client gets a generic message (tested).

**16. How do you stop a client setting the task id?** Validation copies only `title` and `completed` into the value;
ids come from the store's counter.

**17. What are the limits of this API?** Data is lost on restart and not shared between processes; no authentication;
no pagination; ids are a simple counter; no CORS (a browser app on another origin couldn't call it without adding it);
concurrency isn't an issue with one thread and synchronous in-memory operations but would be with a real database.

**18. How would the Angular app from FEM17 use this?** Point its `apiUrl` at this server, add CORS, and map
`/api/boards/:boardId/tasks` (a stretch challenge in the module); the status codes already match what the Angular
interceptors expect.
