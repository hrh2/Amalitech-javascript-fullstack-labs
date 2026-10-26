# FEM29 — Introduction to Backend Development: my-first-server

Project: `FEM29-Introduction-to-Backend Development/my-first-server/`
Module brief: `notes/Module01.md` (hands-on challenge) and Section 6 of `Backend-Module1-Introduction-to-Backend-Development.md`
(final project and acceptance criteria). This module has no separate task file; those two are the specification.

This document explains the server line by line and connects it to the module's four learning objectives.

**Result:** a working server using only Node's built-in `http` module. `project-check.sh` reports 6 passed, 0 failed;
12 automated tests pass (`npm test`); `npm start` starts it and Ctrl + C stops it.

---

## 1. Requirements and where they are met

| Requirement (module project) | Where |
|---|---|
| Folder `my-first-server`, `npm init -y` | `package.json` (created with `npm init -y`, then given scripts) |
| `server.js` imports the native `http` module, `http.createServer()` on port 3000 | `server.js`: `require('node:http')`, `createAppServer()`, `listen(PORT)` where `PORT` defaults to 3000 |
| `GET /` -> 200 + exact text | `Hello, this is my first Node.js server!` (`text/plain`) |
| `GET /api/health` -> JSON `{"status":"ok"}` with `Content-Type: application/json` | handler for `/api/health` |
| `GET /api/greet?name=Amina` -> `{"message":"Hello, Amina!"}`, `stranger` when missing | handler for `/api/greet` |
| Any other path -> 404 with a JSON error | final `sendJson(res, 404, { error: 'Not found', path })` |
| `"start": "node server.js"` | `package.json` |
| Stretch: log one line per request | `res.on('finish', ...)` |
| Stretch: `/api/stats` request counter | `requestCount` variable |
| Stretch: `node --watch` | `npm run dev` |

Extras beyond the brief, each small and tested: a **405** with an `Allow` header for a wrong method on a known path, a
**400** if the request target can't be parsed, a friendly message when the **port is already in use**, and a blank
`?name=` treated as missing.

---

## 2. The client-server model, in this project (Objective 1)

```
browser / curl  ──  GET /api/greet?name=Amina HTTP/1.1  ──►  Node process (server.js, port 3000)
                ◄──  HTTP/1.1 200 OK  {"message":"Hello, Amina!"}  ──
```

- The **client** (browser, curl, an Angular app from FEM17) asks; the **server** answers. The server never speaks first.
- A **backend** is the program that holds logic and (later) data on the server side. Here it only greets, but the
  shape is the same as the MockAPI the Angular app called in FEM17: a URL in, a status code and a body out.
- An **API** is the agreed set of URLs and responses: `/api/health`, `/api/greet`, `/api/stats` form this server's API.
- Where things run: `server.js` runs on your machine's Node process; the browser runs the front end. They talk over
  HTTP on **host** `localhost` and **port** `3000` (host = which machine, port = which program on it).

A real response, copied from `curl -i localhost:3000/`:

```text
HTTP/1.1 200 OK                     status line: protocol, status code, reason
Content-Type: text/plain            header (tells the client how to read the body)
Date: Mon, 26 Oct 2026 15:29:26 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

Hello, this is my first Node.js server!    body
```

---

## 3. The code, line by line

```js
const http = require('node:http');
```
Loads Node's **built-in** HTTP module. Nothing to install. The `node:` prefix makes it obvious it's built in, not an npm package.

```js
const PORT = Number(process.env.PORT) || 3000;
```
`process.env` holds environment variables. `PORT=3001 npm start` overrides the default. `Number(undefined)` is `NaN`
(falsy), so `|| 3000` supplies the default. Real hosting platforms tell your app which port to use this way.

```js
function handleRequest(req, res) { ... }
http.createServer(handleRequest)
```
`createServer` takes a **request listener**: a function Node calls **once per incoming request**, with
`req` (what the client sent: method, url, headers) and `res` (how you answer). This is Node's event-driven design:
you don't loop waiting for requests, you register a handler and Node calls it when a request arrives.

```js
let url;
try { url = new URL(req.url, 'http://localhost'); } catch { return sendJson(res, 400, ...); }
```
`req.url` is only `"/api/greet?name=Amina"`. `new URL(path, base)` needs a base to build a full URL, then gives
`url.pathname` (`/api/greet`) and `url.searchParams` (`name=Amina`). A fixed base is used rather than the `Host`
header because the client controls that header. If the target can't be parsed (for example `GET //`), `URL`
throws; the `try/catch` turns that into a **400 Bad Request** instead of crashing the process.

```js
url.searchParams.get('name')?.trim() || 'stranger'
```
`get` returns `null` if the parameter is missing; `?.` avoids calling `.trim()` on `null`; `|| 'stranger'` covers
both missing and blank. Percent-decoding (`%20` -> space) is done for you by `URL`.

```js
res.writeHead(status, { 'Content-Type': 'application/json' });
res.end(JSON.stringify(data));
```
`writeHead` sets the status code and headers; `end` sends the body **and finishes the response**. Without `end()` the
client waits forever (the "hanging request" bug). Every code path in `handleRequest` ends in `sendJson(...)` or
`res.end(...)`, and a test sends requests to every path to prove none hangs. Building the body with
`JSON.stringify` (not string concatenation) escapes quotes and special characters, so a name like `Ana "the" <b>Dev</b>`
still produces valid JSON.

```js
res.on('finish', () => console.log(`${req.method} ${req.url} -> ${res.statusCode} (...)`));
```
`finish` fires after the response has been handed to the network, so the log shows the status code that was
actually sent, and how long it took.

```js
if (require.main === module) { createAppServer().listen(PORT, ...) }
module.exports = { createAppServer };
```
`require.main === module` is true only when you run `node server.js` directly. When a test does
`require('./server')`, the file doesn't start listening; the test creates its own server on a free port. This is
the standard way to make a server testable.

```js
server.on('error', (err) => { if (err.code === 'EADDRINUSE') ... process.exit(1) });
```
Starting a second copy gives `EADDRINUSE` (the port is taken). Without a handler Node throws an unhandled error with a
stack trace; this prints a one-line fix instead.

### Status codes used

| Code | Meaning | Used for |
|---|---|---|
| 200 OK | worked | the three GET routes |
| 400 Bad Request | the client's request is malformed | unparsable URL |
| 404 Not Found | no such resource | unknown path |
| 405 Method Not Allowed | resource exists, method doesn't apply | POST to `/api/health` (with `Allow: GET`) |

---

## 4. Node.js and its event loop (Objectives 2 and 3)

- **Node.js is a runtime, not a framework.** It runs JavaScript outside the browser (on Chrome's V8 engine) and adds
  server abilities (files, network, processes). Express, which comes in later modules, is a framework built on top of this
  exact `http` module.
- **Compared with Python/Java/Go:** each can write the same server (the module's Section 2.2). Node is chosen here
  because it's the language you already know, it's well suited to many simultaneous, mostly-waiting connections (I/O
  bound work), and it shares one language and JSON with the front end. It is a weaker choice for heavy CPU
  work on the main thread.
- **Event-driven, non-blocking:** Node runs your JavaScript on one thread. While a request waits on something slow
  (a disk, a network call), the thread is free to run other callbacks. The **event loop** takes finished events off a
  queue and runs their handlers one at a time. This server's handlers are tiny, so thousands of requests per second are
  fine.
- **The consequence:** a handler must never block the thread. A `while` loop that runs for 5 seconds inside a
  handler freezes *every* other request for 5 seconds, because there is only one thread. (The module's Section 3.8
  demonstrates this.) Async I/O (`fs.promises`, `fetch`) doesn't have the problem.
- **`listen` keeps the process alive:** the program would normally exit when it has nothing left to do; an open
  server socket is something to wait for, so Node stays running until you press Ctrl + C.

---

## 5. Local environment and npm (Objective 4)

- `node -v` / `npm -v` check the install (Node 22 here; the project says `engines.node >= 18`).
- `npm init -y` creates `package.json`: the project's name, version, scripts and (later) dependencies.
- **npm scripts:** `npm start` runs `node server.js`; `npm run dev` runs `node --watch server.js` (restart on file
  change); `npm test` runs Node's built-in test runner; `npm run check` runs `project-check.sh`. `start` and `test` are
  special names that don't need `run`.
- **No dependencies at all:** `http`, `URL`, `fetch`, `node:test` and `node:assert` are all built into Node 18+.
  That's why there is no `node_modules` and no `package-lock.json`, and why the whole project is four files.
- `.gitignore` already lists `node_modules` for when packages are added later.

---

## 6. Verification

| Check | Result |
|---|---|
| `bash project-check.sh` against `npm start` | 6 passed, 0 failed, exit code 0 |
| `npm test` | 12 passed, 0 failed |
| `curl -i` on `/`, `/api/greet?name=Amina`, POST `/` | 200 + correct headers; 405 + `Allow: GET` |
| Start a second server on port 3000 | one-line "Port 3000 is already in use" message, exit 1 |
| Request log in the server terminal | one `METHOD url -> status (ms)` line per request |

The tests (`server.test.js`) start the app on **port 0** (the operating system picks a free port) so they never clash with a
server you have running, and call it with `fetch()`. They cover each route's status, `Content-Type` and body; the
default and blank name; special characters in the name; the 404 body; query string not affecting routing; 405 and
`Allow`; the 400 for an unparsable target **and that the server survives it**; the request counter; and "every path
finishes".

---

## 7. Common mistakes (and how this project avoids them)

| Mistake | Symptom | Here |
|---|---|---|
| Forgetting `res.end()` on one branch | browser/curl hangs | every branch ends the response; a test hits every path |
| Starting the server twice | `EADDRINUSE` | friendly message; `PORT` override |
| Editing `server.js` and expecting the running server to change | old behaviour persists | restart, or use `npm run dev` |
| Building JSON with string concatenation | invalid JSON when input has quotes | `JSON.stringify` |
| Using `req.url` as the route | `/api/health?x=1` doesn't match | route on `url.pathname`, read the query from `searchParams` |
| Blocking the thread in a handler | every request slows down | handlers do no heavy synchronous work |
| Trusting the `Host` header | bad base URL, parse errors | fixed base for `new URL` |
| Writing the server so tests can't import it | tests start a real server on 3000 | `require.main === module` guard + port 0 |
| Returning 200 with an error message | clients can't tell success from failure | proper 404/405/400 codes |

---

## 8. TA review questions

**1. What is the client-server model?** Clients (browsers, curl, other programs) send requests; a server listens,
runs code and returns responses. Here curl/browser is the client and `server.js` the server, talking HTTP over
`localhost:3000`.

**2. What is a backend and what is an API?** A backend is the server-side program with the logic/data. An API is the
set of URLs and response shapes it offers; `/api/health` and `/api/greet` are this server's API.

**3. What does `http.createServer(handler)` do?** Creates an HTTP server and registers `handler` to be called for each
request with `(req, res)`. `listen` makes it start accepting connections.

**4. What happens if you don't call `res.end()`?** The response never completes; the client waits until it times out.

**5. Why `new URL(req.url, base)`?** `req.url` is only a path and query. `URL` parses it into `pathname` and
`searchParams` and decodes percent-escapes. The base is fixed because the `Host` header can't be trusted.

**6. Why route on `pathname`, not `req.url`?** `req.url` includes the query string, so `/api/health?x=1` wouldn't equal
`/api/health`. (A test covers this.)

**7. 404 vs 405 vs 400?** 404: no such path. 405: the path exists but not for this method (with an `Allow` header).
400: the request itself is malformed (unparsable target).

**8. What is Node.js, and is it a framework?** A JavaScript runtime (V8 plus system APIs), not a framework.
Frameworks like Express are libraries built on its `http` module.

**9. Explain the event loop in one answer.** One thread runs JavaScript; slow operations (I/O) are handed to the
system, and when they finish their callbacks are queued; the loop runs each queued callback when the thread is free.
That's how one thread serves many waiting connections.

**10. Why must handlers not block?** One thread means one slow synchronous handler delays all other requests.

**11. Blocking vs non-blocking I/O?** Blocking waits (and holds the thread) until the operation finishes;
non-blocking starts it and continues, running a callback/promise when it completes. Node's APIs are non-blocking by
default (`fs.readFile`), with `*Sync` versions that block.

**12. What does `require.main === module` do, and why use it?** True only when the file is run directly. It lets tests
import the server without it starting to listen.

**13. What does `package.json` do?** Describes the project: name, version, scripts (`npm start`/`test`/`dev`),
dependencies, engine requirement.

**14. Why port 0 in the tests?** The OS chooses a free port, so tests can't clash with a running server or each other.

**15. How does `PORT=3001 npm start` work?** The shell sets an environment variable for that command; the code reads
`process.env.PORT`, falling back to 3000.

**16. Compare Node with Python/Java/Go for a backend.** All can do it. Node: same language as the front end, great for
I/O-heavy, many-connection work, huge package ecosystem; weaker for CPU-heavy tasks on one thread. Python: readable,
strong in data/AI; Java: robust, enterprise-scale; Go: fast, compiled, built-in concurrency.

**17. What would you add next?** Reading a request body (POST with JSON), a framework (Express, next module), input
validation, persistent storage, and an automated deployment. None of those are in this module's scope.
