# Module 2: RESTful APIs with Express.js
### Backend Development with JavaScript

> **Scope note:** This document covers *only* Module 2: the principles of RESTful APIs (resources, URIs, HTTP methods, status codes); building a server with the Express framework; routing for GET, POST, PUT and DELETE; middleware for request parsing, logging and error handling; testing endpoints with a tool such as Postman or Insomnia; documenting an API with OpenAPI (Swagger); and building an in-memory Task Manager / Task Tracker API with no database. Anything beyond — databases, authentication and password handling, validation libraries, security hardening, deployment, pagination, caching, file uploads, WebSockets — is flagged **🔒 Coming Later — Outside This Module**. *I have only seen the first two module files, so "later" means "not taught here."*
>
> **Four things about the module file itself:**
> 1. It has a title but **no module code, no discussion prompt, and no quiz** is listed, so none is shown or invented. Section 11 offers practice questions of my own, clearly labelled as such.
> 2. Its lesson numbering goes 1, 2, 3, 4, 5, **7** — there is no lesson 6. I have not guessed what it was.
> 3. The lab is described as a **"RESTful Task Tracker" with all CRUD operations** (which includes `PUT`), but the Resource Book's hands-on challenge lists **four** endpoints with no `PUT`. This document builds the four-endpoint challenge first (Section 5) and the complete CRUD version as the final project (Section 8).
> 4. The "Programming with Mosh" video entry has no link, and I have **not watched any of the videos**; they are described only as your module file describes them.

> **✅ How this document was checked.** Every code sample is a real file that was **run**; every output block is the **exact output** it produced (paths shortened; `Date:` headers and timings will differ on your machine). The document is assembled from those files. Versions used:
>
> | Tool | Version |
> |---|---|
> | Node.js | v24.22.1 |
> | Express | **5.3.0** (the current release); **4.22.3** (the final 4.x line) used for side-by-side comparison |
> | morgan / cors | 1.12.1 / 2.8.6 |
> | swagger-ui-express / yaml / swagger-parser | 5.0.1 / 2.9.1 / 13.1.0 |
> | Newman (Postman's command-line runner) | 6.2.3 |
>
> **Not verified here** (labelled where they appear): the **Postman and Insomnia apps themselves** (they are graphical; their steps are described, and the same collection was run with Newman instead), importing the collection into either app, how a real **browser** enforces CORS, Windows/macOS specifics, and the videos.
>
> **A warning about the module's own written resource.** The Postman blog article in your resource list builds a user API with a database, JWT login and role checks — well beyond this module. If you follow it, do **not** copy two things from its code: it stores passwords as a plain SHA-256 hash (passwords need a slow, salted algorithm — a topic for the authentication module), and it hard-codes the JWT secret as `'your-secret-key'` and returns the user record (including the stored password hash) from the login response. For *this* module, use it for its routing, router-file layout, middleware and error-handler ideas only.

---

## How this document is organized

Same documentation-first shape as before: **What is it? → Why does it exist? → How does it work? → Syntax → Examples → When to use / not use → Try it yourself → Exercises → Common mistakes → Knowledge check.** One thread runs through it all: the **Task API** — first as the four-endpoint challenge (Section 5), then as the complete, modular, tested API (Section 8) — and the contract it keeps with the Angular `TaskService` from the Angular notes.

## Table of Contents

- [Before You Start: Prerequisites](#before-you-start-prerequisites)
- [1. RESTful API Principles](#1-restful-api-principles)
- [2. Introduction to Express](#2-introduction-to-express)
- [3. Routing](#3-routing)
- [4. Middleware](#4-middleware)
- [5. Hands-On Challenge: The Task Manager API](#5-hands-on-challenge-the-task-manager-api)
- [6. Testing API Endpoints](#6-testing-api-endpoints)
- [7. Documenting Your API with OpenAPI (Swagger)](#7-documenting-your-api-with-openapi-swagger)
- [8. Final Module Project: The RESTful Task Tracker](#8-final-module-project-the-restful-task-tracker)
- [9. Quick Reference Sheet](#9-quick-reference-sheet)
- [10. Source & Resource Mapping](#10-source--resource-mapping)
- [11. Practice Questions](#11-practice-questions)
- [12. Glossary](#12-glossary)

---

## Before You Start: Prerequisites

This module assumes **Module 1**. If these are comfortable, begin; if not, revisit the pointer.

| You should be able to… | Where it was taught |
|---|---|
| Run a Node file (`node file.js`), stop it with Ctrl + C, and read a stack trace's first lines | Backend Module 1, Sections 3–5 |
| Run `npm init -y`, `npm install <package>`, and read `package.json` | Backend Module 1, Section 3.10 |
| Send a request with `curl` and read `curl -i` output (status line, headers, body) | Backend Module 1, Sections 1.7 and 5 |
| Explain what a status code and a header are; recognise 200, 404 | Backend Module 1, Sections 1.7 and 5.6 |
| Read and write JSON (`JSON.parse`, `JSON.stringify`), arrow functions, destructuring, `async`/`await` | Backend Module 1, Part 0 |

**Why Express at all?** In Module 1 you built servers with Node's raw `http` module, and it worked — but look at what you had to do by hand: pick the handler with a growing `if / else if` chain on `req.method` and the URL, parse the query string and the JSON body yourself, set `Content-Type` yourself, and write your own 404. Every one of those chores repeats in every project. **Express** is a small framework that does them for you, so your code can say *what the API does* instead of *how to plumb a request*.

**A 60-second refresher on the request/response shape** (every REST example below uses these parts):

| Part | Request (client → server) | Response (server → client) |
|---|---|---|
| First line | Method + path: `POST /tasks` | Status code: `201 Created` |
| Headers | `Content-Type: application/json`, `Authorization: …` | `Content-Type: application/json`, `Location: /tasks/4` |
| Body | Optional (JSON for `POST`/`PUT`/`PATCH`) | Usually JSON; none for `204` |

**JSON rules worth knowing** (the #1 source of "my body is empty / invalid" bugs): keys and strings use **double quotes** (`{"title":"x"}`, not `{'title':'x'}`); no trailing commas; no comments. The requests in this document are written that way.

**Prerequisite self-check** (answers in Section 11):

1. In the raw `http` module, what two things had to be written by hand to support `GET /api/greet?name=Amina`?
2. What does the status code `404` mean, and who chooses it — the client or the server?
3. Is `{'a': 1}` valid JSON?
4. What does `npm install express` change in your project folder?
5. Why must the server send `Content-Type: application/json` along with a JSON body?

---

## 1. RESTful API Principles

*(Module lesson 1 — Video + Reading. Outcome: explain REST, HTTP methods, and status codes.)*

> 📺 **Video for this lesson — [Fireship](https://www.youtube.com/watch?v=-MTSQjw5DrM)**
> Your module file describes it as: *"A rapid-fire introduction to the concepts of resources, HTTP verbs, and status codes, followed by a quick coding demo."* *(I have not watched it; the description is quoted from your file.)*
> It covers this section (resources, HTTP verbs, status codes) and then Section 2 (the quick coding demo).

### 1.1 What is REST?

**REST** (REpresentational State Transfer) is an **architectural style** — a set of design principles — for networked applications, described by Roy Fielding in his 2000 doctoral dissertation *(general knowledge)*. In everyday use, a **RESTful API** is a web API that uses HTTP in a disciplined way: the API exposes **resources** (things like tasks or boards), each identified by a **URL**, and clients act on them with the standard **HTTP methods**, exchanging **representations** (usually JSON).

REST is not a library or a protocol you install; it is a way of *shaping* an API so that it is predictable. You have already consumed one: the Angular notes' `TaskService` called `GET /api/boards/42/tasks`, `POST …`, `PATCH …`, `DELETE …`. This module is where you build the other side.

### 1.2 The core components

| Component | What it is | In the Task API |
|---|---|---|
| **Resource** | A "thing" the API manages | A *task* |
| **URI / URL** | The address that identifies a resource (or a collection of them) | `/tasks` (the collection), `/tasks/4` (one task) |
| **Representation** | The data format used to describe a resource's current state | JSON: `{"id":4,"title":"Learn Express","completed":false}` |
| **HTTP method** | The action requested on the resource | `GET`, `POST`, `PUT`, `PATCH`, `DELETE` |
| **Status code** | The outcome of the request | `200`, `201`, `204`, `400`, `404` … |
| **Headers** | Metadata about the request or response | `Content-Type`, `Location` |
| **Statelessness** | Each request carries everything the server needs | The server does not remember "the previous request" |

### 1.3 The constraints behind the style

REST is usually described by a handful of constraints *(general knowledge, from Fielding's dissertation)*. Here is what each means for the API you are about to write:

| Constraint | Meaning | What it means for you |
|---|---|---|
| **Client-server** | UI and data/logic are separate concerns | The Angular app and the Express API are separate programs that only meet at the contract |
| **Stateless** | No client session is stored between requests; every request is self-contained | Anything the server needs to know (who is calling, which task) arrives *in the request* — which is why Angular's interceptor attached an `Authorization` header to every call |
| **Cacheable** | Responses can say whether they may be reused | Responses carry headers (Express adds an `ETag` automatically — you will see one) |
| **Uniform interface** | The same few verbs and URL conventions everywhere | `GET /tasks` and `GET /boards` behave alike; no custom "getAllTasksNow" endpoints |
| **Layered system** | A client can't tell whether it talks to the real server or an intermediary | Proxies and gateways can sit in between (🔒 later) |
| **Code on demand** *(optional)* | The server may send executable code | Rarely used; ignore for now |

### 1.4 Designing URLs: name the *thing*, not the action

| Good (a noun — the resource) | Poor (a verb — the action) |
|---|---|
| `GET /tasks` | `GET /getAllTasks` |
| `POST /tasks` | `POST /createTask` |
| `GET /tasks/4` | `GET /getTaskById?id=4` |
| `DELETE /tasks/4` | `POST /deleteTask` |
| `GET /tasks?completed=true` | `GET /getCompletedTasks` |

Conventions that keep an API predictable:

- **Plural nouns** for collections (`/tasks`, not `/task`), and the id after the collection (`/tasks/4`).
- **The HTTP method carries the verb**, so the URL doesn't need one.
- **Hierarchy shows ownership** when it helps: `/boards/42/tasks` means "the tasks of board 42" (Section 3.7 builds a nested route).
- **Query parameters filter, sort and page** a collection: `?completed=true`.
- Be **consistent** — pick one style and use it everywhere.

### 1.5 HTTP methods and what they promise

Two properties matter to API designers *(general knowledge, from the HTTP specification)*:

- **Safe** — the request doesn't change anything on the server. (`GET` is safe.)
- **Idempotent** — making the *same* request several times leaves the server in the *same state* as making it once. (This is about **server state**, not whether the response bytes are identical — a repeated `DELETE` can return a different status the second time yet still leave the same state.)

| Method | Typical meaning | Safe? | Idempotent? | Typical success status |
|---|---|---|---|---|
| `GET` | Read a resource or collection | Yes | Yes | `200 OK` |
| `POST` | **Create** a resource in a collection (the server picks the id) | No | **No** | `201 Created` (+ a `Location` header) |
| `PUT` | **Replace** a whole resource | No | **Yes** | `200 OK` |
| `PATCH` | Change **part** of a resource | No | Not guaranteed *(depends on the change)* | `200 OK` |
| `DELETE` | Remove a resource | No | **Yes** | `204 No Content` |

**Why idempotency matters:** networks fail. If a client sends `PUT` and doesn't get a reply, it can safely send it again; if it does the same with `POST`, it might create a duplicate. Here are the verified results from the Task API built later in this module (Sections 5 and 8) — the same requests sent twice:

```text
--- POST twice with the SAME body: two different tasks are created ---
$ curl -X POST -H 'Content-Type: application/json' -d '{"title":"Same body"}' 'localhost:3000/tasks'
{"id":4,"title":"Same body","completed":false}
[HTTP 201]

$ curl -X POST -H 'Content-Type: application/json' -d '{"title":"Same body"}' 'localhost:3000/tasks'
{"id":5,"title":"Same body","completed":false}
[HTTP 201]

--- PUT twice with the SAME body: the same result ---
$ curl -X PUT -H 'Content-Type: application/json' -d '{"title":"Redesigned","completed":true}' 'localhost:3000/tasks/1'
{"id":1,"title":"Redesigned","completed":true}
[HTTP 200]

$ curl -X PUT -H 'Content-Type: application/json' -d '{"title":"Redesigned","completed":true}' 'localhost:3000/tasks/1'
{"id":1,"title":"Redesigned","completed":true}
[HTTP 200]

--- DELETE twice: 204 the first time, then 404 (but the server state is the same) ---
$ curl -X DELETE 'localhost:3000/tasks/1'

[HTTP 204]

$ curl -X DELETE 'localhost:3000/tasks/1'
{"error":"Task 1 not found"}
[HTTP 404]
```

- **`POST` twice → two different tasks** (ids 4 and 5): *not* idempotent.
- **`PUT` twice → the same result** both times: idempotent.
- **`DELETE` twice → `204`, then `404`**: the *response* differs, but the *state* after each call is the same (task 1 is gone) — that is what idempotent means.

### 1.6 Status codes

A status code is a three-digit summary of the outcome, in families:

| Family | Meaning | Examples |
|---|---|---|
| **2xx** | Success | `200 OK`, `201 Created`, `204 No Content` |
| **3xx** | Redirection | *(not used in this module)* |
| **4xx** | The **client** made a mistake | `400 Bad Request`, `404 Not Found` |
| **5xx** | The **server** failed | `500 Internal Server Error` |

| Code | Use it when… | Seen in this module |
|---|---|---|
| `200 OK` | A read or update succeeded and there is a body | `GET`, `PUT`, `PATCH` |
| `201 Created` | A `POST` created a resource (also send a `Location` header) | `POST /tasks` |
| `204 No Content` | Success, and there is nothing to send back | `DELETE` |
| `400 Bad Request` | The request is malformed or fails validation | missing `title`; malformed JSON; `/tasks/abc` |
| `404 Not Found` | No such resource or route | `GET /tasks/99`; an unknown path |
| `413 Content Too Large` | The body exceeds the server's limit | oversized JSON body (Section 4.6) |
| `500 Internal Server Error` | The server hit a bug or failure | a handler that throws |

Others you will meet later — `401 Unauthorized` (not logged in), `403 Forbidden` (logged in but not allowed), `409 Conflict` — belong to the authentication and data modules *(general knowledge)*. **Rule of thumb:** 4xx means "fix your request"; 5xx means "the problem is on our side."

### 1.7 Design first: the Task API contract

Before writing code, write down the API. This table *is* the menu from Module 1's kitchen analogy:

| Method & URL | Purpose | Success | Typical errors |
|---|---|---|---|
| `GET /tasks` | List tasks (optionally `?completed=true\|false`) | `200` + array | `400` bad filter |
| `GET /tasks/:id` | Get one task | `200` + task | `400` bad id, `404` missing |
| `POST /tasks` | Create a task | `201` + task + `Location` | `400` invalid body |
| `PUT /tasks/:id` | Replace a task | `200` + task | `400`, `404` |
| `PATCH /tasks/:id` | Update part of a task | `200` + task | `400`, `404` |
| `DELETE /tasks/:id` | Delete a task | `204` | `400`, `404` |

**Task representation:** `{ "id": 4, "title": "Learn Express", "completed": false }`.
**Error representation:** `{ "error": "Task 99 not found" }`, and for validation failures `{ "error": "Validation failed", "details": ["title is required and must be a non-empty string"] }`.

(`:id` in a URL pattern is a *placeholder* for the real id — Section 3.2.)

### 1.8 "RESTful" in practice

Many production "REST" APIs follow only part of the style. A common yardstick is the **Richardson maturity model**, which grades APIs from "one URL with everything" up to "hypermedia-driven" *(general knowledge)*; the API you build here sits at the practical middle — **resources, proper methods and proper status codes**. The top level, **HATEOAS** (responses that include links telling the client what it can do next), is 🔒 outside this module.

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| Verbs in URLs (`/createTask`) | The method already says "create"; the API becomes inconsistent | `POST /tasks` |
| `GET` that changes data | `GET` is meant to be safe; browsers, caches and crawlers may repeat or prefetch it | Use `POST`/`PUT`/`PATCH`/`DELETE` for changes |
| `200 OK` with `{"error": …}` for failures | Clients that only check the status code think it worked | Use the right 4xx/5xx status *and* an error body |
| `POST` to update an existing resource | Not idempotent; retries create duplicates | `PUT` or `PATCH` on `/tasks/:id` |
| Returning `201` without saying where the new resource is | The client can't find it without guessing | Send a `Location: /tasks/4` header |
| Using `404` for "your request is invalid" | `404` means *no such resource* | `400` for malformed input |

### ✅ Knowledge Check
1. Name four of the core components of a RESTful API and give a Task-API example of each.
2. What does *stateless* mean, and how did the Angular notes' `HttpClient` code cooperate with it?
3. Which methods are idempotent? Why does it matter when a network request times out?
4. Which status code should a successful `POST /tasks` return, and which header should accompany it?
5. Rewrite `POST /deleteTask?id=4` as a RESTful request.

---

## 2. Introduction to Express

*(Module lesson 2 — Video + Reading. Outcome: construct a basic Express server.)*

> 📺 **Video for this lesson — [Fireship](https://www.youtube.com/watch?v=-MTSQjw5DrM)**
> Your module file describes it as: *"A rapid-fire introduction to the concepts of resources, HTTP verbs, and status codes, followed by a quick coding demo."* *(I have not watched it; the description is quoted from your file.)*
> The "quick coding demo" part of this video corresponds to this section; its first half is Section 1.

### 2.1 What is Express?

**Express** is a minimal, unopinionated **web framework** for Node.js. Recall the vocabulary from Module 1: Node.js is the *runtime*; Express is a *library built on top of it* that gives you routing, request and response helpers, and a **middleware** system (Section 4). It does not add a database, authentication or a template for your whole app — you add only what you need.

It sits directly on the `http` module you already know. In fact an Express application is just a function `(req, res)`, so Node's own `http.createServer` can use it as its request listener — verified here, along with two other facts used later in this document:

```javascript
const express = require('express');
const http = require('node:http');

async function main() {
  // 1. An Express app is just a function (req, res), so Node's http module can use it directly
  const a = express();
  a.get('/', (req, res) => res.send('plain http.createServer(app)'));
  const server = http.createServer(a);
  await new Promise((r) => server.listen(0, r));
  const res1 = await fetch(`http://localhost:${server.address().port}/`);
  console.log('1. http.createServer(app):', res1.status, await res1.text(), '| typeof app =', typeof a);
  server.close();

  // 2. Hiding the X-Powered-By header
  const b = express();
  b.disable('x-powered-by');
  b.get('/', (req, res) => res.send('x'));
  const s2 = b.listen(0);
  await new Promise((r) => s2.on('listening', r));
  const res2 = await fetch(`http://localhost:${s2.address().port}/`);
  console.log('2. X-Powered-By header after app.disable:', res2.headers.get('x-powered-by'));
  s2.close();

  // 3. express.json() default body-size limit
  const c = express();
  c.use(express.json());
  c.post('/', (req, res) => res.json({ ok: true }));
  c.use((err, req, res, next) => res.status(err.status ?? 500).json({ error: err.message }));
  const s3 = c.listen(0);
  await new Promise((r) => s3.on('listening', r));
  for (const kb of [90, 99, 101, 110]) {
    const body = JSON.stringify({ t: 'a'.repeat(kb * 1000 - 8) });   // roughly kb kilobytes (1 KB = 1000 bytes here)
    const r = await fetch(`http://localhost:${s3.address().port}/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    console.log(`3. JSON body of ${body.length} bytes ->`, r.status);
  }
  s3.close();
  process.exit(0);
}
main();
```

```text
1. http.createServer(app): 200 plain http.createServer(app) | typeof app = function
2. X-Powered-By header after app.disable: null
3. JSON body of 90000 bytes -> 200
3. JSON body of 99000 bytes -> 200
3. JSON body of 101000 bytes -> 200
3. JSON body of 110000 bytes -> 413
exit code: 0
```

1. `http.createServer(app)` worked: Express *is* a request listener, and `typeof app` is `function`.
2. `app.disable('x-powered-by')` removed the `X-Powered-By` header (`null` = absent). Section 2.4 shows why you may want that.
3. `express.json()` accepted JSON bodies up to 101,000 bytes and answered **`413`** for 110,000 bytes. That matches its documented default limit of `100kb` — which is **102,400** bytes, not 100,000 *(the limit is documented behaviour; the byte counts are what I measured)*.

### 2.2 Raw `http` vs. Express

In Module 1 you wrote a routing server with the raw `http` module (an `if / else if` chain, `new URL(...)` for the query, `JSON.stringify` and headers for every reply). Here is the **same three routes** in Express:

```javascript
const express = require('express');
const app = express();

app.get('/', (req, res) => res.send('Welcome to my first API'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/greet', (req, res) => {
  const name = req.query.name ?? 'stranger';
  res.json({ message: `Hello, ${name}!` });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
```

| Chore | Raw `http` (Module 1) | Express |
|---|---|---|
| Choose the handler | `if (req.method === 'GET' && url.pathname === '/…')` | `app.get('/…', handler)` |
| Read the query string | `new URL(req.url, …).searchParams.get('name')` | `req.query.name` |
| Send JSON | `res.writeHead(200, {'Content-Type': 'application/json'}); res.end(JSON.stringify(x))` | `res.json(x)` |
| Set a status | part of `writeHead` | `res.status(404).json(…)` |
| Read a JSON body | collect chunks, `JSON.parse` by hand | `app.use(express.json())`, then `req.body` |
| Unknown route | your own final `else` | a built-in default (Section 2.4), or your own middleware |

The requests below behave exactly as the raw version did:

```text
$ curl 'localhost:3000/api/greet?name=Amina'
{"message":"Hello, Amina!"}
[HTTP 200]

$ curl 'localhost:3000/api/greet'
{"message":"Hello, stranger!"}
[HTTP 200]
```

### 2.3 Install it

In an empty folder (named `task-manager` here):

```bash
npm init -y
npm install express
```

```text
$ npm install express

added 65 packages, and audited 66 packages in 3s

29 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities

$ npm ls express
hello-express@1.0.0 ~/task-manager
`-- express@5.3.0
```

`package.json` gained a dependency entry — the caret range from Module 1, Section 3.10:

```text
  "dependencies": {
    "express": "^5.3.0"
  }
}
```

**Version note.** `npm install express` installs the **current** release, which is **Express 5** (5.3.0 when this was checked; it requires Node 18 or newer). Express 4.22.3 is the last 4.x line. A lot of tutorials, videos and Stack Overflow answers were written for Express 4, and **four differences catch people out** — Section 2.6 shows each one running on both versions.

### 2.4 Hello, Express

The smallest useful Express program:

```javascript
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello from Express!');
});

app.listen(3000, () => {
  console.log('Express server listening on http://localhost:3000');
});
```

Run it with `node x1-hello-express.js`; the terminal prints the `listen` message and stays busy (stop it with Ctrl + C):

```text
Express server listening on http://localhost:3000
```

and `curl -i localhost:3000/` shows the full response:

```text
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/html; charset=utf-8
Content-Length: 19
ETag: W/"13-tsbq4e7agwVV6r9iE+Lb/lLwlzw"
Date: Mon, 26 Oct 2026 08:24:00 GMT
Connection: keep-alive
Keep-Alive: timeout=5

Hello from Express!
```

**Line by line**

- `require('express')` loads the framework; calling it — `express()` — creates an **application** object, conventionally named `app`.
- `app.get('/', handler)` registers a **route**: "when a `GET` request arrives for `/`, run this function". The handler receives `req` and `res`, just like the raw `http` listener, but **Express's own, richer versions** of them.
- `res.send('…')` sends the body and **ends the response** — no separate `res.end()` needed.
- `app.listen(3000, callback)` starts the server (it calls `http.createServer(app).listen(…)` for you).

**What Express added that you didn't ask for** (look at the headers):

- `Content-Type: text/html; charset=utf-8` — `res.send(<a string>)` assumes HTML. For JSON, use `res.json(…)`, which sets `application/json`.
- `ETag` — a fingerprint of the body, so a client can ask "has it changed?" (the **cacheable** constraint from Section 1.3).
- `X-Powered-By: Express` — announces the framework. That tells an attacker what to target, so many apps remove it with `app.disable('x-powered-by')` (verified above; fuller hardening is 🔒 later).

**An unmatched route.** We never wrote a handler for `/nope`. Express answered anyway:

```text
HTTP/1.1 404 Not Found
X-Powered-By: Express
Content-Security-Policy: default-src 'none'
X-Content-Type-Options: nosniff
Content-Type: text/html; charset=utf-8
Content-Length: 143
Date: Mon, 26 Oct 2026 08:24:00 GMT
Connection: keep-alive
Keep-Alive: timeout=5

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Error</title>
</head>
<body>
<pre>Cannot GET /nope</pre>
</body>
</html>
```

By default an unknown URL gets an **HTML** 404 page (`Cannot GET /nope`). An API should answer in **JSON**; Section 4.6 replaces this with your own 404 and error responses.

### 2.5 The two objects you'll use constantly

| `req` (the request) | What it gives you |
|---|---|
| `req.method`, `req.originalUrl` | `GET`, `/tasks?completed=true` |
| `req.params` | Route parameters (`/tasks/:id` → `req.params.id`) — always **strings** |
| `req.query` | The query string, parsed (`?a=1&b=2` → `{ a: '1', b: '2' }`) |
| `req.body` | The parsed request body — **only after** a body-parsing middleware ran (Section 4.2) |
| `req.get('Header-Name')` | A request header |

| `res` (the response) | What it does |
|---|---|
| `res.json(obj)` | Sends JSON (`Content-Type: application/json`) and ends the response |
| `res.send(text)` | Sends text/HTML and ends the response |
| `res.status(code)` | Sets the status code — **chainable**: `res.status(404).json({…})` |
| `res.sendStatus(204)` | Sends the status with its standard text as the body, and ends |
| `res.location(url)` | Sets the `Location` header |
| `res.set(name, value)` | Sets any header |

### 2.6 Express 4 vs. Express 5: four differences that bite

Each was run on **both** versions (the same file, `express@4` in one folder and `express@5` in another).

**① An error inside an `async` handler.** This handler throws from an `async` function and the app has an error handler:

```javascript
const express = require('express');
const app = express();

app.get('/boom', async (req, res) => {
  throw new Error('async failure');          // a rejected Promise inside an async handler
});

app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`listening on ${PORT}`));
```

On **Express 5** the rejected Promise is forwarded to the error handler automatically:

```text
$ curl 'localhost:3000/boom'
{"error":"async failure"}
[HTTP 500]
```

On **Express 4** nothing catches it — the whole server **crashed**:

```text
$ curl -m 3 localhost:3000/boom
curl: (52) Empty reply from server
(curl exit code: 52)
server process still running: NO — it crashed
--- server output (first lines) ---
listening on 3000
~/my-api/v1-async-error.js:5
  throw new Error('async failure');          // a rejected Promise inside an async handler
        ^

Error: async failure
    at ~/my-api/v1-async-error.js:5:9
```

This is the biggest practical difference: on Express 4 you had to wrap every `async` handler in `try/catch` and call `next(err)`; on Express 5 you can just throw (or `await` something that fails).

**② Wildcard routes.** The "catch everything" route from older tutorials:

```javascript
const express = require('express');
const app = express();

app.get('*', (req, res) => {                 // the classic "catch everything" route from older tutorials
  res.send('caught: ' + req.path);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`listening on ${PORT}`));
```

On **Express 4** it works:

```text
$ curl localhost:3000/anything/here
caught: /anything/here
```

On **Express 5** the server **won't even start** — wildcards must be *named* now:

```text
~/my-api/node_modules/path-to-regexp/dist/index.js:108
                    throw new PathError(`Missing parameter name at index ${index}`, str);
                    ^

PathError [TypeError]: Missing parameter name at index 1: *; visit https://git.new/pathToRegexpError for info
    at consumeUntil (~/my-api/node_modules/path-to-regexp/dist/index.js:108:27)
    at parse (~/my-api/node_modules/path-to-regexp/dist/index.js:140:26)
    at process (~/my-api/node_modules/path-to-regexp/dist/index.js:263:56)
    at pathToRegexp (~/my-api/node_modules/path-to-regexp/dist/index.js:274:5)
    at Object.match (~/my-api/node_modules/path-to-regexp/dist/index.js:225:30)
    at matcher (~/my-api/node_modules/router/lib/layer.js:86:23)
    at new Layer (~/my-api/node_modules/router/lib/layer.js:93:62)
```

The Express 5 form names the wildcard (`/*splat`), and `req.params.splat` is an **array** of the matched segments:

```javascript
const express = require('express');
const app = express();

app.get('/*splat', (req, res) => {           // Express 5: a wildcard must have a name
  res.json({ path: req.path, splat: req.params.splat });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`listening on ${PORT}`));
```

```text
$ curl 'localhost:3000/a/b/c'
{"path":"/a/b/c","splat":["a","b","c"]}
[HTTP 200]
```

**③ `req.body` when there is no JSON body.** This route echoes what the body parser produced, for a request that is *not* JSON (curl's `-d x=1` sends a form-style body):

```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.post('/echo', (req, res) => {
  res.json({ bodyType: typeof req.body, body: req.body ?? null });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`listening on ${PORT}`));
```

Express 5:

```text
$ curl -X POST -d x=1 localhost:3000/echo
{"bodyType":"undefined","body":null}
```

Express 4:

```text
$ curl -X POST -d x=1 localhost:3000/echo
{"bodyType":"object","body":{}}
```

On Express 5 `req.body` is **`undefined`** when no parser handled the request; on Express 4 it was always at least `{}`. So `const { title } = req.body;` **throws a `TypeError`** when a client forgets the JSON header or sends no body. **Always guard** (`req.body?.title`) or validate first — the Task API's validation (Section 8) does exactly that.

**④ `app.listen` reports a failure to its callback.** This program tries to listen on port 3000 while another program already holds it:

```javascript
const express = require('express');
const app = express();

app.listen(3000, (error) => {
  if (error) {
    console.log('listen failed with code:', error.code);
    process.exit(1);
  }
  console.log('listening on 3000');
});
```

Express 5 passes the error to the callback, so you can handle it:

```text
listen failed with code: EADDRINUSE
exit code: 1
```

On Express 4 the same program crashed instead, with an **unhandled `'error'` event**:

```text
node:events:505
    throw er; // Unhandled 'error' event
    ^

Error: listen EADDRINUSE: address already in use 0.0.0.0:3000
    at Server.setupListenHandle [as _listen2] (node:net:2390:16)
    at listenInCluster (node:net:2499:12)
    at Server.listen (node:net:2624:7)
    at app.listen (~/my-api/node_modules/express/lib/application.js:635:24)
exit code: 1
```

(Other Express 5 changes exist — for example some long-deprecated methods were removed; the official migration guide lists them. I did not run those, so I don't describe them here.)

### 2.7 A sensible way to start the server

```javascript
const PORT = process.env.PORT || 3000;
app.listen(PORT, (error) => {
  if (error) {
    console.error('Could not start the server:', error.message);
    process.exit(1);
  }
  console.log(`Listening on http://localhost:${PORT}`);
});
```

`process.env.PORT || 3000` lets the environment choose the port (Module 1, Section 5.4) and the callback handles a failed start (Express 5 behaviour, verified above).

### Try it yourself

1. Create `task-manager/`, install Express, and run the Hello-Express file. Open `localhost:3000` in a browser and in `curl -i`: what differs?
2. Change `res.send('Hello…')` to `res.json({ message: 'Hello…' })` and compare the `Content-Type` header.
3. Request a URL you didn't define and read the default 404. Where does that HTML come from? (You'll replace it in Section 4.6.)

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| `res.send(obj)` and expecting a specific type | Works for objects too, but `res.json(obj)` states the intent and sets the right header | Use `res.json` for JSON |
| Calling `res.json(...)` *and* `res.send(...)` for one request | The second call throws "Cannot set headers after they are sent" | One response per request; `return res.json(...)` in early exits |
| Copying an Express 4 tutorial's `app.get('*', …)` | It crashes at startup on Express 5 | `app.get('/*splat', …)` or a plain `app.use((req, res) => …)` fallback |
| Wrapping every `async` handler in `try/catch` out of habit | Unnecessary on Express 5 (still fine, just noisy) | Let errors reach the error handler (Section 4.6) |
| Reading `req.body.title` without a guard | `TypeError` when the body is `undefined` (Express 5) | `req.body?.title`, then validate |
| Starting the server twice | `EADDRINUSE` | Stop the first (Ctrl + C) or use another `PORT` |

### ✅ Knowledge Check
1. Why is an Express `app` usable by `http.createServer`?
2. Which header did `res.send('text')` set, and what should you use for JSON?
3. List the four Express 4 → 5 differences shown above and what each causes if you copy an old tutorial.
4. Why is `req.body?.title` safer than `req.body.title` on Express 5?
5. What does the default Express 404 look like, and why is that a problem for an API?

---

## 3. Routing

*(Module lesson 3 — Video + Reading. Outcome: implement route handlers for all common HTTP methods.)*

> 📺 **Video for this lesson — Programming with Mosh** *(no link: your module file lists this entry as plain text, "Play Video – Programming with Mosh", without a URL — send me the link and I will add it)*
> Your module file describes it as: *"This comprehensive tutorial covers everything from setting up the environment to handling GET/POST/PUT/DELETE requests, input validation, and using Postman for testing."* *(not watched by me)*
> Relevant here: handling GET/POST/PUT/DELETE requests.

> 📖 **Reading for this lesson — [How to create a REST API with Node.js and Express — Postman Blog](https://blog.postman.com/how-to-create-a-rest-api-with-node-js-and-express/)**
> Your module file notes: *"A text-based guide reinforcing the concepts of routing and middleware."*
> I read it in full. Use it for **routing, router files, middleware and the error handler** only — see the warning at the top of this document about its authentication and password code.

### 3.1 What is routing?

**Routing** means choosing which code runs for a given **method + path**. In Express each route is `app.METHOD(path, handler)`:

```javascript
app.get('/tasks', handler);        // read
app.post('/tasks', handler);       // create
app.put('/tasks/:id', handler);    // replace
app.patch('/tasks/:id', handler);  // update part
app.delete('/tasks/:id', handler); // delete
```

Here is a throw-away server with every common method, so you can see each in action:

```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.get('/ping', (req, res) => res.send('pong'));

// route parameters (always strings!)
app.get('/users/:userId/books/:bookId', (req, res) => res.json(req.params));
app.get('/numbers/:n', (req, res) => {
  res.json({ raw: req.params.n, type: typeof req.params.n, asNumber: Number(req.params.n) });
});

// query string
app.get('/search', (req, res) => res.json(req.query));

// request bodies and the other methods
app.post('/echo', (req, res) => res.status(201).json({ youSent: req.body }));
app.put('/things/:id', (req, res) => res.json({ replaced: req.params.id, with: req.body }));
app.patch('/things/:id', (req, res) => res.json({ patched: req.params.id, changes: req.body }));
app.delete('/things/:id', (req, res) => res.sendStatus(204));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`listening on ${PORT}`));
```

```text
$ curl 'localhost:3000/ping'
pong
[HTTP 200]

$ curl 'localhost:3000/users/7/books/42'
{"userId":"7","bookId":"42"}
[HTTP 200]

$ curl 'localhost:3000/numbers/42'
{"raw":"42","type":"string","asNumber":42}
[HTTP 200]

$ curl 'localhost:3000/search?q=express&page=2'
{"q":"express","page":"2"}
[HTTP 200]

$ curl 'localhost:3000/search?tag=a&tag=b'
{"tag":["a","b"]}
[HTTP 200]

$ curl -X POST -H 'Content-Type: application/json' -d '{"title":"Learn Express"}' 'localhost:3000/echo'
{"youSent":{"title":"Learn Express"}}
[HTTP 201]

$ curl -X PUT -H 'Content-Type: application/json' -d '{"title":"Replaced"}' 'localhost:3000/things/5'
{"replaced":"5","with":{"title":"Replaced"}}
[HTTP 200]

$ curl -X PATCH -H 'Content-Type: application/json' -d '{"completed":true}' 'localhost:3000/things/5'
{"patched":"5","changes":{"completed":true}}
[HTTP 200]

$ curl -X DELETE 'localhost:3000/things/5'

[HTTP 204]
```

Reading that session:

- **Route parameters.** `/users/:userId/books/:bookId` captured `{"userId":"7","bookId":"42"}` in `req.params`. The names after `:` become the keys.
- **Parameters are always strings.** `/numbers/42` gave `"type":"string"` — convert deliberately (`Number(req.params.n)`) and validate the result.
- **Query strings.** `?q=express&page=2` became `req.query` — again strings. A repeated key (`tag=a&tag=b`) became an **array**, so don't assume a single string.
- **Bodies.** `POST`, `PUT` and `PATCH` read the JSON body from `req.body` (parsed by `express.json()`, Section 4.2). The `POST` answered **`201`**.
- **`DELETE` answered `204`** with no body (`res.sendStatus(204)`).

### 3.2 `req.params` vs. `req.query` vs. `req.body`

| | Where it appears | Use it for | Example |
|---|---|---|---|
| `req.params` | In the **path** | *Identifying* a resource | `/tasks/4` → `{ id: '4' }` |
| `req.query` | After the `?` | *Filtering, sorting, paging* | `/tasks?completed=true` |
| `req.body` | In the **request body** | The **data** for a create or update | `{ "title": "Learn Express" }` |

### 3.3 Order matters: the first matching route wins

Express checks routes **in the order you registered them**. This is a classic bug — a general route registered before a specific one:

```javascript
const express = require('express');
const app = express();

if (process.env.ORDER === 'good') {
  app.get('/tasks/stats', (req, res) => res.json({ route: 'stats' }));       // specific route FIRST
  app.get('/tasks/:id', (req, res) => res.json({ route: 'by id', id: req.params.id }));
} else {
  app.get('/tasks/:id', (req, res) => res.json({ route: 'by id', id: req.params.id }));
  app.get('/tasks/stats', (req, res) => res.json({ route: 'stats' }));       // never reached!
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`listening on ${PORT}`));
```

With the parameter route first, `/tasks/stats` is swallowed by `/tasks/:id` (treating `"stats"` as an id):

```text
$ curl 'localhost:3000/tasks/stats'
{"route":"by id","id":"stats"}
[HTTP 200]
```

With the **specific route first** it works:

```text
$ curl 'localhost:3000/tasks/stats'
{"route":"stats"}
[HTTP 200]
```

**Rule:** register specific paths (`/tasks/stats`) before parameterised ones (`/tasks/:id`).

### 3.4 Express Routers: splitting routes into modules

A single file with every route gets unmanageable. An **`express.Router`** is a mini-application for a group of related routes, mounted at a path prefix with `app.use`. It also lets you nest resources — here `/api/boards/:boardId/tasks`, the shape the Angular Kanban `TaskService` used:

```javascript
const express = require('express');
const app = express();

// A router is a mini-app that can be mounted at a path prefix.
const tasks = express.Router();
tasks.get('/', (req, res) => res.json({ list: 'all tasks' }));
tasks.get('/:id', (req, res) => res.json({ task: req.params.id }));
app.use('/tasks', tasks);

// Nested resources: mergeParams lets the child router see the parent's :boardId
const boardTasks = express.Router({ mergeParams: true });
boardTasks.get('/', (req, res) => res.json({ board: req.params.boardId, list: 'tasks on this board' }));
boardTasks.get('/:taskId', (req, res) => res.json({ board: req.params.boardId, task: req.params.taskId }));
app.use('/api/boards/:boardId/tasks', boardTasks);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`listening on ${PORT}`));
```

```text
$ curl 'localhost:3000/tasks'
{"list":"all tasks"}
[HTTP 200]

$ curl 'localhost:3000/tasks/5'
{"task":"5"}
[HTTP 200]

$ curl 'localhost:3000/api/boards/42/tasks'
{"board":"42","list":"tasks on this board"}
[HTTP 200]

$ curl 'localhost:3000/api/boards/42/tasks/7'
{"board":"42","task":"7"}
[HTTP 200]
```

- `app.use('/tasks', tasks)` — every route in the router is **prefixed** with `/tasks`, so `tasks.get('/:id')` answers `/tasks/5`.
- `express.Router({ mergeParams: true })` — by default a child router **cannot see** parameters from the path it was mounted at; `mergeParams: true` makes `:boardId` available in `req.params` inside the child. (Without it `req.params.boardId` is `undefined` — documented behaviour; I did not run the version without it.)

The full Task API in Section 8 puts its routes in `routes/tasks.js` exactly this way.

### 3.5 Path patterns in Express 5

Express 5 changed how patterns with wildcards and optional parts are written. Both forms below were run:

```javascript
const express = require('express');
const app = express();

app.get('/files/*path', (req, res) => res.json({ matched: 'wildcard', path: req.params.path }));
app.get('/users{/:id}', (req, res) => res.json({ matched: 'optional id', id: req.params.id ?? null }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`listening on ${PORT}`));
```

```text
$ curl 'localhost:3000/files/a/b/c'
{"matched":"wildcard","path":["a","b","c"]}
[HTTP 200]

$ curl 'localhost:3000/users'
{"matched":"optional id","id":null}
[HTTP 200]

$ curl 'localhost:3000/users/7'
{"matched":"optional id","id":"7"}
[HTTP 200]
```

- **Named wildcard:** `/files/*path` matched `/files/a/b/c`, and `req.params.path` is an array of segments.
- **Optional segment:** `/users{/:id}` matched both `/users` and `/users/7` (the braces mark the optional part). Older tutorials used `/users/:id?`, which I believe is **not** valid in Express 5 *(my recollection of the migration notes — I only ran the new forms, so confirm before relying on it)*.

### 3.6 Unmatched routes become 404s

If no route matches, the request falls through to whatever you registered **last**. The conventional last route is a JSON 404 (built in Section 4.6 and used in the Task API).

### Try it yourself

1. Add `app.get('/tasks/:id/comments', …)` to the routing demo and request `/tasks/3/comments`. Which `req.params` do you get?
2. Reproduce the route-order bug, then fix it two ways: reorder, and make the parameter route stricter (a regex check on `req.params.id`).
3. Mount a router at `/api/v1` and confirm every route inside it moved.

### Exercises

**Level 1 — Basic:** Write routes `GET /ping`, `GET /greet/:name` and `GET /sum?a=1&b=2` (return JSON; convert `a` and `b` to numbers).

**Level 2 — Practical:** Add `POST /greet` that reads `{ "name": … }` from the body and returns `201` with `{ "message": "Hello, <name>!" }`; return `400` if `name` is missing.

**Level 3 — Challenge:** Build a nested router for `/boards/:boardId/tasks/:taskId` that returns both ids, using `mergeParams`. Then make `GET /boards/abc/tasks` return `400` because `boardId` isn't a number.

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| `/tasks/:id` registered before `/tasks/stats` | The parameter route captures `stats` as an id | Specific routes first |
| Assuming `req.params.id` is a number | Params are strings | `Number(...)`, then validate |
| Reading `req.query.tag` as a string when it may be an array | Repeated keys produce arrays | Normalise (`[].concat(tag)`) or validate |
| A child router that reads `req.params.boardId` without `mergeParams` | `undefined` | `express.Router({ mergeParams: true })` |
| Reusing Express 4 patterns (`'*'`, `'/users/:id?'`) on Express 5 | Startup error or no match | Named wildcard `/*splat`; optional `{/:id}` |
| Forgetting to end the response in some branch | The client hangs | Every path ends with `res.json/send/sendStatus` |

### ✅ Knowledge Check
1. What is the difference between `req.params`, `req.query` and `req.body`, and which is each URL/body fragment in `POST /boards/42/tasks?notify=true` with body `{"title":"x"}`?
2. Why did `/tasks/stats` return `{"route":"by id","id":"stats"}` in the first demo?
3. What does `mergeParams: true` do?
4. Which status code did the `DELETE` handler send, and with what body?
5. How do you write an optional path segment in Express 5?

---

## 4. Middleware

*(Module lesson 4 — Video + Reading. Outcome: utilize built-in and custom middleware for request processing — request parsing, logging and error handling.)*

> 📖 **Reading for this lesson — [How to create a REST API with Node.js and Express — Postman Blog](https://blog.postman.com/how-to-create-a-rest-api-with-node-js-and-express/)**
> Your module file notes: *"A text-based guide reinforcing the concepts of routing and middleware."*
> I read it in full. Use it for **routing, router files, middleware and the error handler** only — see the warning at the top of this document about its authentication and password code.
> Its middleware and error-handler steps match Sections 4.2 and 4.6.

> 📺 The **Programming with Mosh** entry (no link in your file — see Section 3) is also described as covering input validation, which Sections 5 and 8 practise.

### 4.1 What is middleware?

**Middleware** is a function with the signature `(req, res, next)` that sits **between** the incoming request and your route handler. Each middleware can read or change `req` and `res`, **end the response itself**, or call **`next()`** to pass control to the next function in the chain. An Express application is really *a pipeline of middleware*, and a route handler is simply the last link.

**Kitchen picture:** an order ticket passes along a row of stations — the expediter checks it, the grill station adds its part, the garnish station finishes — and each station either hands the ticket on or sends the plate out. A station that forgets to pass the ticket on stalls the whole order.

```javascript
const express = require('express');
const app = express();

app.use((req, res, next) => {
  console.log('1. first middleware');
  next();                                    // pass control to the next function in the chain
});

app.use((req, res, next) => {
  console.log('2. second middleware');
  next();
});

app.get('/', (req, res) => {
  console.log('3. route handler (ends the cycle)');
  res.send('done');
});

app.use((req, res) => {
  console.log('4. fallback (only reached if nothing above responded)');
  res.status(404).send('no route');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`listening on ${PORT}`));
```

I requested `/` (which has a route) and `/nothing-here` (which doesn't). The server's log shows the path each request took:

```text
listening on 3000
1. first middleware
2. second middleware
3. route handler (ends the cycle)
1. first middleware
2. second middleware
4. fallback (only reached if nothing above responded)
```

- Request 1 (`/`): middleware 1 → middleware 2 → the route handler, which **ended the cycle** (`res.send`), so the fallback never ran.
- Request 2 (`/nothing-here`): both middleware ran, **no route matched**, and the request fell through to the final fallback.
- **`app.use(fn)`** registers middleware for *every* method and path; **`app.get(path, fn)`** registers a handler for one method and path. Both are "functions in a chain".

> **The one rule:** every middleware must do exactly one of two things — **end the response** (`res.send`, `res.json`, `res.sendStatus`…) **or call `next()`**. Do neither and the client waits forever (the same bug as Module 1's missing `res.end()`).

### 4.2 Built-in middleware: parsing requests

Express ships with the middleware you need for most bodies and static files:

```javascript
const express = require('express');
const app = express();

app.use(express.json());                              // parses JSON bodies  (Content-Type: application/json)
app.use(express.urlencoded({ extended: true }));      // parses HTML-form bodies (application/x-www-form-urlencoded)
app.use(express.static('public'));                    // serves files from the ./public folder

app.post('/echo', (req, res) => res.json({ contentType: req.get('Content-Type'), body: req.body }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`listening on ${PORT}`));
```

```text
$ curl -X POST -H "Content-Type: application/json" -d '{"a":1}' localhost:3000/echo
{"contentType":"application/json","body":{"a":1}}
$ curl -X POST -d "name=Amina&city=Lisbon" localhost:3000/echo   (an HTML-form style body)
{"contentType":"application/x-www-form-urlencoded","body":{"name":"Amina","city":"Lisbon"}}
$ curl localhost:3000/hello.txt   (served from ./public)
Hello from a static file
```

| Middleware | What it does |
|---|---|
| **`express.json()`** | Parses bodies with `Content-Type: application/json` into `req.body` |
| **`express.urlencoded({ extended: true })`** | Parses HTML-form bodies (`application/x-www-form-urlencoded`) into `req.body` |
| **`express.static('public')`** | Serves files from a folder (`/hello.txt` came from `./public/hello.txt`) |

Three things to know about the JSON parser:

1. **It only acts when the `Content-Type` matches.** A JSON string sent without `Content-Type: application/json` is *not* parsed and, on Express 5, `req.body` stays `undefined` (Section 2.6 ③).
2. **It has a size limit** — `100kb` by default (measured in Section 2.1: accepted at 101,000 bytes, rejected with `413` at 110,000). This is the safety net that Module 1's hand-written body reader lacked.
3. **A malformed body is an error** (`400`), handled in Section 4.6.

You may still see `body-parser` in older tutorials (`app.use(bodyParser.json())`); `express.json()` is the built-in replacement *(general knowledge)*.

### 4.3 Writing your own middleware: a request logger

Logging each request is the classic first custom middleware:

```javascript
const express = require('express');
const app = express();

function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {                   // 'finish' fires when the response has been sent
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start} ms)`);
  });
  next();
}

app.use(requestLogger);

app.get('/hello', (req, res) => res.send('hi'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`listening on ${PORT}`));
```

I requested `/hello` (exists) and `/missing` (doesn't):

```text
listening on 3000
GET /hello -> 200 (7 ms)
GET /missing -> 404 (6 ms)
```

- It records a start time, then registers a listener for the response's **`'finish'`** event — which fires when the response has been sent — so the log line can include the **status code** and **duration**. Logging *before* calling the next function couldn't know the status yet.
- It then calls **`next()`** so the request continues. (Forgetting that line is the commonest custom-middleware bug.)

### 4.4 Order matters

Middleware runs in registration order, so *where* you place it decides what it sees. Here the logger is registered **between** two routes:

```javascript
const express = require('express');
const app = express();

app.get('/early', (req, res) => res.send('registered BEFORE the logger'));

app.use((req, res, next) => {
  console.log('logger saw:', req.method, req.url);
  next();
});

app.get('/late', (req, res) => res.send('registered AFTER the logger'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`listening on ${PORT}`));
```

I requested `/early` then `/late`:

```text
listening on 3000
logger saw: GET /late
```

`/early` is **not logged**: it was matched and answered *before* the logger was reached. Register middleware that should see everything **first**.

### 4.5 Third-party middleware

The npm registry has middleware for most jobs. Two you will meet immediately:

**`morgan`** — a ready-made request logger (a production-grade version of Section 4.3):

```javascript
const express = require('express');
const morgan = require('morgan');
const app = express();

app.use(morgan('dev'));                      // ready-made request logger

app.get('/hello', (req, res) => res.send('hi'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`listening on ${PORT}`));
```

```text
listening on 3000
GET /hello 200 1.724 ms - 2
GET /missing 404 1.290 ms - 146
```

Each line is `METHOD URL STATUS time - size`; the `'dev'` format is meant for development (it colours the status code — the raw log contained terminal colour codes, which I removed from the output above).

**`cors`** — adds the headers that let a *browser app on a different origin* call your API. This matters to you directly: your Angular app runs at `http://localhost:4200` and your API at `http://localhost:3000` — different **origins** (different ports) — and browsers block such cross-origin calls unless the server opts in. This server allows only the Angular dev server's origin:

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: 'http://localhost:4200' }));   // allow ONLY the Angular dev server's origin

app.get('/tasks', (req, res) => res.json([{ id: 1, title: 'Design the API' }]));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`listening on ${PORT}`));
```

```text
$ curl -i -H "Origin: http://localhost:4200" localhost:3000/tasks   (headers of interest)
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:4200
Vary: Origin

$ curl -i -H "Origin: http://evil.example" localhost:3000/tasks
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:4200
Vary: Origin
(the server still answered 200 and still names the ONE origin it allows; deciding what to do about the mismatch is the BROWSER job)

$ curl -i -X OPTIONS -H "Origin: http://localhost:4200" -H "Access-Control-Request-Method: PUT" -H "Access-Control-Request-Headers: content-type" localhost:3000/tasks   (a CORS "preflight")
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:4200
Vary: Origin, Access-Control-Request-Headers
Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE
Access-Control-Allow-Headers: content-type
```

Reading the result carefully, because it is easy to misunderstand:

- The server answers the allowed origin with `Access-Control-Allow-Origin: http://localhost:4200` — it names the one origin it trusts.
- For a request from a different origin (`evil.example`) the server **still answered `200`** and **still named `localhost:4200`**. The server doesn't refuse anything; it just states who is allowed. **The browser compares that header with the page's own origin and refuses to hand the response to the page's JavaScript if they don't match.**
- The third request is a **preflight**: before a "non-simple" request (for example `PUT`, or `POST` with a JSON `Content-Type`), the browser first sends an `OPTIONS` request asking what is allowed, and the `cors` middleware answers it (`204`, with the allowed methods and headers).

**Therefore:** CORS is a **browser rule, not server security**. `curl`, Postman and other servers ignore it entirely — it does *not* keep anyone out of your API. And I tested the headers with `curl`; **I did not test a real browser**, so that last step (the browser enforcing the mismatch) is documented behaviour, not something observed here. (Authentication is how an API actually restricts who may call it — 🔒 later.)

### 4.6 Error handling

**What happens by default?** If a handler throws and you've done nothing, Express answers with its own HTML error page. Here is that page in **development** (no `NODE_ENV` set) and with `NODE_ENV=production`:

```javascript
const express = require('express');
const app = express();

app.get('/boom', (req, res) => {
  throw new Error('something broke in my handler');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`listening on ${PORT}`));
```

Default behaviour — development:

```text
HTTP/1.1 500 Internal Server Error
X-Powered-By: Express
Content-Security-Policy: default-src 'none'
X-Content-Type-Options: nosniff
...

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Error</title>
</head>
<body>
<pre>Error: something broke in my handler<br> &nbsp; &nbsp;at ~/my-api/m7a-default-errors.js:5:9<br> &nbsp; &nbsp;at Layer.handleRequest (~/my-api/node_modules/router/lib/layer.js:152:17)<br> &nbsp; &nbsp;at next (~/my-api/node_modules/router/lib/route.js:157:13)<br> &nbsp; &nbsp;at Route.dispatch (~/my-api/node_modules/router/lib/route.js:117:3)<br> &nbsp; &nbsp;at handle (~/my-api/node_modules/router/index.js:435:11)<br> &nbsp; &nbsp;at Layer.handleRequest (~/my-api/node_modules/router/lib/layer.js:152:17)<br> &nbsp; &nbsp;at ~/my-api/node_modules/router/index.js:295:15<br> &nbsp; &nbsp;at processParams (~/my-api/node_modules/router/index.js:582:12)<br> &nbsp; &nbsp;at next (~/my-api/node_modules/router/index.js:291:5)<br> &nbsp; &nbsp;at router.handle (~/my-api/node_modules/router/index.js:186:3)</pre>
```

Default behaviour — production:

```text
HTTP/1.1 500 Internal Server Error
...

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Error</title>
</head>
<body>
<pre>Internal Server Error</pre>
</body>
</html>
```

**In development, the response contains a stack trace** — file paths and line numbers of your server — which is exactly what you must not show strangers. With `NODE_ENV=production` Express sends only `Internal Server Error`. *(Observed difference; setting `NODE_ENV=production` on deployed servers is the standard practice.)* Either way it is **HTML**, not JSON.

**A JSON error strategy.** Replace the defaults with two pieces of middleware **registered last**: a **404 handler** for unmatched routes and an **error-handling middleware** — which Express recognises by its **four parameters** `(err, req, res, next)`:

```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.post('/tasks', (req, res) => res.status(201).json({ received: req.body }));
app.get('/boom', (req, res) => { throw new Error('secret internal detail'); });
app.get('/boom-async', async (req, res) => { throw new Error('secret async detail'); });

// 404: no route matched
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Error-handling middleware: Express recognises it by its FOUR parameters
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.status ?? err.statusCode ?? 500;
  if (status >= 500) console.error('SERVER ERROR:', err.message);
  res.status(status).json({ error: status >= 500 ? 'Internal Server Error' : err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`listening on ${PORT}`));
```

I sent a malformed JSON body, an oversized body, two failing routes (one `async`) and an unknown URL:

```text
$ curl -X POST -H 'Content-Type: application/json' -d '{"title":' 'localhost:3000/tasks'
{"error":"Unexpected end of JSON input"}
[HTTP 400]

$ curl -X POST -H "Content-Type: application/json" --data-binary @200KB-file.json localhost:3000/tasks
{"error":"request entity too large"}
[HTTP 413]

$ curl 'localhost:3000/boom'
{"error":"Internal Server Error"}
[HTTP 500]

$ curl 'localhost:3000/boom-async'
{"error":"Internal Server Error"}
[HTTP 500]

$ curl 'localhost:3000/nope'
{"error":"Route not found: GET /nope"}
[HTTP 404]
```

and the server's own log recorded the details the client never saw:

```text
listening on 3000
SERVER ERROR: secret internal detail
SERVER ERROR: secret async detail
```

What this shows:

- **Body-parser errors already carry the right status.** Malformed JSON became `400` and the oversized body `413` because the parser's error object has a `status` property, and the handler uses `err.status ?? 500`. The `400` message here (*"Unexpected end of JSON input"*) comes from the JSON parser, so don't rely on its exact wording.
- **Unexpected errors become a generic `500`.** The client got `Internal Server Error`, while the log recorded `secret internal detail` — **log details server-side, never send them to the client**.
- **The `async` handler's error was caught too** (`/boom-async` → `500`) — Express 5 forwards rejected Promises to the error handler.
- **`res.headersSent`** — if a response has already started, you can't send a new one; the handler hands the error on with `next(err)` (Express's default handler then closes the connection *— documented behaviour; I did not run this case*).
- **A throw, a rejected Promise, and `next(err)` all end up in the same place.** `next(new Error('…'))` is the explicit way to raise an error from code that can't simply throw — such as a callback. I checked it with a handler that calls `next(err)` from inside a timer:

```javascript
const express = require('express');
const app = express();

app.get('/via-next', (req, res, next) => {
  setTimeout(() => next(new Error('raised with next(err) from a callback')), 10);   // not a throw: a callback
});
app.use((err, req, res, next) => res.status(500).json({ handledBy: 'error middleware', message: err.message }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`listening on ${PORT}`));
```

```text
$ curl 'localhost:3000/via-next'
{"handledBy":"error middleware","message":"raised with next(err) from a callback"}
[HTTP 500]
```

### 4.7 The recommended order

```text
app.use(requestLogger);        // 1. log every request (so even failures are logged)
app.use(express.json());       // 2. parsers
app.use('/tasks', tasksRouter);// 3. your routes
app.use(notFound);             // 4. nothing matched -> JSON 404
app.use(errorHandler);         // 5. LAST: anything that threw or called next(err)
```
An error handler must be registered **after** the routes whose errors it should catch.

### Try it yourself

1. Add the Section 4.3 logger to the routing demo from Section 3 and make five different requests. Read the log.
2. Move the logger to the *bottom* of the file. Which requests disappear from the log, and why?
3. Throw an error in a route with no error handler, then run with and without `NODE_ENV=production` and compare the response.
4. Send JSON to a route with and without `-H 'Content-Type: application/json'` and print `req.body` each time.

### Exercises

**Level 1 — Basic:** Write a middleware `addRequestTime` that sets `req.receivedAt = Date.now()` and calls `next()`; use it in a route to return how many milliseconds the handler took.

**Level 2 — Practical:** Write `requireJson` middleware that returns `415` with an error when a `POST`/`PUT`/`PATCH` request doesn't have `Content-Type: application/json`. (`415` = Unsupported Media Type.)

**Level 3 — Challenge:** Build a central error handler that maps your own `NotFoundError` (404) and `ValidationError` (400) classes to JSON responses and everything else to a generic `500`, logging only the 5xx errors.

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| Middleware that neither responds nor calls `next()` | The request hangs | End the response *or* call `next()` |
| Calling `next()` **and** sending a response | "Cannot set headers after they are sent" (or double handling) | One or the other — use `return next()` / `return res.json(...)` |
| Registering `express.json()` *after* the routes | `req.body` is `undefined` in those routes | Parsers before routes |
| Registering the error handler *before* the routes | It never sees their errors | Last |
| An error handler with **three** parameters | Express treats it as ordinary middleware, not an error handler | Four parameters `(err, req, res, next)`, even if `next` is unused |
| Sending `err.message` or `err.stack` for 500s | Leaks internals | Generic message to the client; details to the log |
| Thinking CORS protects your API | It is a browser rule; `curl` ignores it | Use authentication for access control (🔒 later) |
| Relying on development error pages in production | Stack traces leak | `NODE_ENV=production` and your own error handler |

### ✅ Knowledge Check
1. What are the two things every middleware function must do one of?
2. Why did `/early` not appear in the log in Section 4.4?
3. What makes Express treat a function as an *error-handling* middleware?
4. Which header must a JSON request carry for `express.json()` to parse it, and what is `req.body` on Express 5 if it is missing?
5. In the CORS demo, why did the server answer `200` for the disallowed origin, and who actually blocks the call?
6. Why should the client receive `Internal Server Error` while the log keeps the real message?

---

## 5. Hands-On Challenge: The Task Manager API

*(Module Resource Book, section 4. **Scenario:** you are building the backend for a productivity app. **Prerequisites:** Node.js installed; Postman (or Thunder Client). **Intro Session — "Building Your First API":** this section is the build-from-scratch walkthrough.)*

> 📺 **Video for this lesson — Programming with Mosh** *(no link: your module file lists this entry as plain text, "Play Video – Programming with Mosh", without a URL — send me the link and I will add it)*
> Your module file describes it as: *"This comprehensive tutorial covers everything from setting up the environment to handling GET/POST/PUT/DELETE requests, input validation, and using Postman for testing."* *(not watched by me)*
> It is the module's "complete API" tutorial, so it is the natural companion for this challenge.

> 📖 **Reading for this lesson — [How to create a REST API with Node.js and Express — Postman Blog](https://blog.postman.com/how-to-create-a-rest-api-with-node-js-and-express/)**
> Your module file notes: *"A text-based guide reinforcing the concepts of routing and middleware."*
> I read it in full. Use it for **routing, router files, middleware and the error handler** only — see the warning at the top of this document about its authentication and password code.

### 5.1 The tasks, mapped to this section

| Task from the module | Where it happens |
|---|---|
| Initialize a new project and install express | Step 1 |
| Create a server file (`app.js`) running on port 3000 | Steps 2–3 |
| `GET /tasks` — return all tasks (hardcoded array) | Step 3 |
| `GET /tasks/:id` — return one task | Step 3 |
| `POST /tasks` — create a task, **validating that `title` exists** | Step 3 |
| `DELETE /tasks/:id` — remove a task | Step 3 |
| Use Postman to test all four endpoints and **save your request collection** | Section 6 |

### 5.2 Build it

**Step 1 — project:**

```bash
mkdir task-manager
cd task-manager
npm init -y
npm install express
```

**Steps 2–3 — `app.js`** (save this as `app.js`; it is the exact file that was run):

```javascript
const express = require('express');
const app = express();

app.use(express.json());

// A hardcoded array for now (the module says: no database yet)
let tasks = [
  { id: 1, title: 'Design the API', completed: true },
  { id: 2, title: 'Write the routes', completed: false },
  { id: 3, title: 'Test with Postman', completed: false }
];
let nextId = 4;

app.get('/tasks', (req, res) => {
  res.json(tasks);
});

app.get('/tasks/:id', (req, res) => {
  const task = tasks.find((t) => t.id === Number(req.params.id));
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(task);
});

app.post('/tasks', (req, res) => {
  const title = req.body?.title;
  if (typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'title is required' });
  }
  const task = { id: nextId++, title: title.trim(), completed: false };
  tasks.push(task);
  res.status(201).json(task);
});

app.delete('/tasks/:id', (req, res) => {
  const index = tasks.findIndex((t) => t.id === Number(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  tasks.splice(index, 1);
  res.sendStatus(204);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Task Manager API running on http://localhost:${PORT}`));
```

Start it:

```bash
node app.js
```

```text
Task Manager API running on http://localhost:3000
```

### 5.3 Try it: a full session

Each request below was sent with `curl` (the `[HTTP …]` line is added by curl's `-w` option to show the status code):

```text
$ curl 'localhost:3000/tasks'
[{"id":1,"title":"Design the API","completed":true},{"id":2,"title":"Write the routes","completed":false},{"id":3,"title":"Test with Postman","completed":false}]
[HTTP 200]

$ curl 'localhost:3000/tasks/2'
{"id":2,"title":"Write the routes","completed":false}
[HTTP 200]

$ curl 'localhost:3000/tasks/99'
{"error":"Task not found"}
[HTTP 404]

$ curl -X POST -H 'Content-Type: application/json' -d '{"title":"Learn Express"}' 'localhost:3000/tasks'
{"id":4,"title":"Learn Express","completed":false}
[HTTP 201]

$ curl -X POST -H 'Content-Type: application/json' -d '{"completed":true}' 'localhost:3000/tasks'
{"error":"title is required"}
[HTTP 400]

$ curl -X DELETE 'localhost:3000/tasks/2'

[HTTP 204]

$ curl 'localhost:3000/tasks'
[{"id":1,"title":"Design the API","completed":true},{"id":3,"title":"Test with Postman","completed":false},{"id":4,"title":"Learn Express","completed":false}]
[HTTP 200]
```

Read it top to bottom — the API's whole life in seven calls:

1. `GET /tasks` — all three starting tasks, `200`.
2. `GET /tasks/2` — one task, `200`.
3. `GET /tasks/99` — **`404`** with `{"error":"Task not found"}`.
4. `POST` with a title — **`201`** and the new task (id `4`, `completed: false`).
5. `POST` with **no title** — **`400`** and `{"error":"title is required"}` (the validation the challenge asks for).
6. `DELETE /tasks/2` — **`204`**, no body.
7. `GET /tasks` — task 2 is gone; task 4 is there. (The data lives in an array in memory, so it **resets every time you restart** the server.)

### 5.4 How the code works

- **`app.use(express.json())`** — turns a JSON request body into `req.body` (Section 4.2).
- **`let tasks = [...]` and `let nextId = 4`** — the "database": a hardcoded array, plus a counter so every new task gets a unique id. (The module says: no database yet.)
- **`GET /tasks/:id`** — `Number(req.params.id)` converts the string parameter; `tasks.find(...)` looks it up; `return res.status(404).json(...)` stops early when it isn't found. The **`return`** matters: without it the function would carry on and try to send a second response.
- **`POST /tasks` validation** — `req.body?.title` is safe even when `req.body` is `undefined` (Express 5, Section 2.6 ③); the check demands a **non-empty string**, and `.trim()` removes surrounding spaces. A bad body gets `400`, not a crash.
- **`201`** — "created", the correct success code for `POST`.
- **`DELETE`** — `findIndex` + `splice` removes the task; **`res.sendStatus(204)`** replies "success, nothing to send".

### 5.5 What this first version deliberately leaves out

| Gap | Fixed in |
|---|---|
| `PUT` (replace) and `PATCH` (update) | Section 8 |
| `GET /tasks/abc` returns `404` (`Number('abc')` is `NaN`, which matches nothing) rather than the more accurate `400` | Section 8 |
| No request logging, no JSON 404/500 responses | Sections 4 and 8 |
| Everything in one file | Section 8 (routes, middleware, data and validation in separate modules) |
| Data lost on restart | 🔒 a database (a later module) |

### Exercises

**Level 1 — Basic:** Build the API exactly as above and confirm each of the seven calls in 5.3.

**Level 2 — Practical:** Make `POST /tasks` also accept an optional `completed` boolean (default `false`) and return `400` if it is present but not a boolean.

**Level 3 — Challenge:** Add `PUT /tasks/:id` that replaces a task's `title` and `completed`, returning `404` if the id doesn't exist. Test that sending the same `PUT` twice gives the same result.

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| Forgetting `app.use(express.json())` | `req.body` is `undefined` for every route | Register it before the routes |
| Comparing `t.id === req.params.id` | A number never equals a string | `Number(req.params.id)` |
| No `return` before `res.status(404).json(...)` | Execution continues; a second send throws | `return res.status(404).json(...)` |
| Sending `200` for a created resource | Loses the "created" signal | `201` |
| Sending a body with `204` | `204` means *no content* | `res.sendStatus(204)` |
| Posting JSON without `Content-Type: application/json` | The body isn't parsed | Add the header |
| Using single quotes inside the JSON body | Not valid JSON | Double quotes for keys and strings |

### ✅ Knowledge Check
1. Which two status codes does `GET /tasks/:id` use, and when?
2. Why must the not-found branch `return`?
3. Why does `POST /tasks` read `req.body?.title` rather than `req.body.title`?
4. What happens to the tasks when you stop and restart the server, and why?
5. Which HTTP status should `DELETE` return on success, and what should the body be?

---

## 6. Testing API Endpoints

*(Module learning objective: test API endpoints effectively using a tool like Postman or Insomnia.)*

> 📺 **Video for this lesson — Programming with Mosh** *(no link: your module file lists this entry as plain text, "Play Video – Programming with Mosh", without a URL — send me the link and I will add it)*
> Your module file describes it as: *"This comprehensive tutorial covers everything from setting up the environment to handling GET/POST/PUT/DELETE requests, input validation, and using Postman for testing."* *(not watched by me)*
> Relevant here: using Postman for testing.

> 📖 **Reading for this lesson — [How to create a REST API with Node.js and Express — Postman Blog](https://blog.postman.com/how-to-create-a-rest-api-with-node-js-and-express/)**
> Your module file notes: *"A text-based guide reinforcing the concepts of routing and middleware."*
> I read it in full. Use it for **routing, router files, middleware and the error handler** only — see the warning at the top of this document about its authentication and password code.
> Its Postman tips (collections, environments, test scripts) match this section.

### 6.1 What does "testing an endpoint" mean?

Send a request and check **four things**: the **status code**, the **headers** (`Content-Type`, `Location`), the **body**, and — just as important — the **error cases** (missing field, unknown id, malformed JSON). Testing only the happy path is how bugs reach production. You have already been testing with `curl`; this section adds the tools the module names, plus automation.

### 6.2 Postman (and Insomnia, Thunder Client)

*(The Postman and Insomnia apps are graphical; I could not run them here. These steps describe the standard workflow — your own Postman may look slightly different. The same collection **was** run with Newman, below.)*

1. **Start your server** (`node app.js`). Postman can't test a server that isn't running.
2. In Postman, create a **Collection** named *Task Manager API* — a folder that groups related requests, which is what the module means by "save your request collection".
3. **Add a request**: choose the method (`GET`), enter `http://localhost:3000/tasks`, press **Send**. Read the **status**, **time** and **body** under the request.
4. For `POST`: choose `POST`, open **Body → raw → JSON**, paste `{"title": "Learn Express"}`, press **Send**. (Postman sets the `Content-Type` header for you when you pick JSON.)
5. For `GET /tasks/:id` and `DELETE /tasks/:id`, use a real id from the previous responses.
6. **Save** each request into the collection.
7. Use a **variable** for the base URL (for example `{{baseUrl}}`) so you can point the whole collection at another server by changing one value.
8. In a request's **Tests** tab you can write assertions that run after the response arrives (shown below).
9. **Export** the collection as a JSON file — that is your saved, shareable "request collection".

Insomnia and the VS Code Thunder Client extension (named in the module's prerequisites) follow the same pattern: requests, a body editor, a response viewer. Insomnia can import Postman collections *(general knowledge; not run here)*.

### 6.3 A ready-made collection with tests

`task-manager.postman_collection.json` (provided alongside this document) contains eight requests — list, create, create-with-missing-title, get by id, replace, patch, delete, and get-after-delete — each with **test scripts**. Here is one request as stored in the file (the "Create task" request, with its tests):

```json
{
  "name": "Create task",
  "request": {
    "method": "POST",
    "header": [
      {
        "key": "Content-Type",
        "value": "application/json"
      }
    ],
    "url": {
      "raw": "{{baseUrl}}/tasks",
      "host": [
        "{{baseUrl}}"
      ],
      "path": [
        "tasks"
      ]
    },
    "body": {
      "mode": "raw",
      "raw": "{\n  \"title\": \"Learn Express\",\n  \"completed\": false\n}",
      "options": {
        "raw": {
          "language": "json"
        }
      }
    }
  },
  "event": [
    {
      "listen": "test",
      "script": {
        "type": "text/javascript",
        "exec": [
          "pm.test('status is 201', () => pm.response.to.have.status(201));",
          "pm.test('Location header points at the new task', () => pm.expect(pm.response.headers.get('Location')).to.match(/^\\/tasks\\/\\d+$/));",
          "const task = pm.response.json();",
          "pm.test('title was saved', () => pm.expect(task.title).to.eql('Learn Express'));",
          "pm.collectionVariables.set('taskId', task.id);   // remember the id for the next requests"
        ]
      }
    }
  ]
}
```

- `{{baseUrl}}` is a collection variable (`http://localhost:3000`), so the URL isn't hard-coded.
- The **`event` / `test`** block is the Tests tab: `pm.test(name, fn)` defines a check, `pm.response` is the response, and `pm.expect(...)` is an assertion.
- **`pm.collectionVariables.set('taskId', task.id)`** stores the new task's id so the *next* requests (`GET /tasks/{{taskId}}`, `PUT`, `PATCH`, `DELETE`) can use it — requests chain together this way.

### 6.4 Running the collection from the command line: Newman

**Newman** is Postman's command-line runner: it executes a collection and prints the results, no app needed. With the Task API running on port 3000:

```bash
npx newman run task-manager.postman_collection.json
```

```text
newman

Task Manager API

→ List tasks
  GET http://localhost:3000/tasks [200 OK, 397B, 54ms]
  ✓  status is 200
  ✓  body is an array

→ Create task
  POST http://localhost:3000/tasks [201 Created, 310B, 16ms]
  ✓  status is 201
  ✓  Location header points at the new task
  ✓  title was saved

→ Create task - missing title (expect 400)
  POST http://localhost:3000/tasks [400 Bad Request, 336B, 5ms]
  ✓  status is 400
  ✓  error message present

→ Get task by id
  GET http://localhost:3000/tasks/4 [200 OK, 285B, 3ms]
  ✓  status is 200
  ✓  id matches

→ Replace task (PUT)
  PUT http://localhost:3000/tasks/4 [200 OK, 289B, 3ms]
  ✓  status is 200
  ✓  task was replaced

→ Update part of a task (PATCH)
  PATCH http://localhost:3000/tasks/4 [200 OK, 290B, 6ms]
  ✓  status is 200
  ✓  only completed changed

→ Delete task
  DELETE http://localhost:3000/tasks/4 [204 No Content, 175B, 3ms]
  ✓  status is 204

→ Get deleted task (expect 404)
  GET http://localhost:3000/tasks/4 [404 Not Found, 270B, 5ms]
  ✓  status is 404

┌─────────────────────────┬──────────────────┬──────────────────┐
│                         │         executed │           failed │
├─────────────────────────┼──────────────────┼──────────────────┤
│              iterations │                1 │                0 │
├─────────────────────────┼──────────────────┼──────────────────┤
│                requests │                8 │                0 │
├─────────────────────────┼──────────────────┼──────────────────┤
│            test-scripts │                8 │                0 │
├─────────────────────────┼──────────────────┼──────────────────┤
│      prerequest-scripts │                0 │                0 │
├─────────────────────────┼──────────────────┼──────────────────┤
│              assertions │               15 │                0 │
├─────────────────────────┴──────────────────┴──────────────────┤
│ total run duration: 294ms                                     │
├───────────────────────────────────────────────────────────────┤
│ total data received: 490B (approx)                            │
├───────────────────────────────────────────────────────────────┤
│ average response time: 11ms [min: 3ms, max: 54ms, s.d.: 16ms] │
└───────────────────────────────────────────────────────────────┘
exit code: 0
```

All eight requests ran in order; each `✓` is a passing assertion (15 in total), the id from "Create task" flowed into the later requests, and the process exited with code `0`. (Newman is documented to exit non-zero when an assertion fails, which is what makes it usable in automated pipelines; I only observed the passing case.) The timings will differ on your machine.

### 6.5 `curl` — the always-available tool

Everything in this document was driven with `curl`, which needs no installation or account. A Postman request maps directly to a `curl` command, which is also how you reproduce a problem for a teammate. Its limit is that it checks nothing for you — you read the output yourself.

### 6.6 Automated tests with Node's built-in test runner *(a bonus beyond the module)*

The module asks for manual API testing; once an API has more than a few endpoints, **automated tests** catch regressions instantly. Node ships a test runner (`node --test`), and `fetch` is built in. The trick that makes an Express app testable is to **separate the app from the code that listens**: `app.js` builds and exports the app, `server.js` calls `listen`. A test can then start the app on **port 0** (any free port) without clashing with a running server. This is the test file for the Task API of Section 8:

```javascript
process.env.NODE_ENV = 'test';   // set BEFORE the app is loaded: it silences the request logger

const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../app');
const store = require('../store');

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => { server = app.listen(0, resolve); });   // port 0 = pick any free port
  baseUrl = `http://localhost:${server.address().port}`;
});
after(() => server.close());
beforeEach(() => store.reset());

async function call(method, path, body) {
  const res = await fetch(baseUrl + path, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  return { status: res.status, location: res.headers.get('location'), body: text ? JSON.parse(text) : null };
}

test('GET /tasks returns the three seeded tasks', async () => {
  const res = await call('GET', '/tasks');
  assert.equal(res.status, 200);
  assert.equal(res.body.length, 3);
});

test('GET /tasks?completed=true filters the list', async () => {
  const res = await call('GET', '/tasks?completed=true');
  assert.deepEqual(res.body.map((t) => t.id), [1]);
});

test('POST /tasks creates a task: 201 plus a Location header', async () => {
  const res = await call('POST', '/tasks', { title: '  Learn Express  ' });
  assert.equal(res.status, 201);
  assert.equal(res.location, `/tasks/${res.body.id}`);
  assert.deepEqual(res.body, { id: res.body.id, title: 'Learn Express', completed: false });
});

test('POST /tasks without a title returns 400', async () => {
  const res = await call('POST', '/tasks', { completed: true });
  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'Validation failed');
});

test('POST /tasks with malformed JSON returns 400', async () => {
  const res = await fetch(baseUrl + '/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"title": '
  });
  assert.equal(res.status, 400);
});

test('GET /tasks/:id returns 404 for a task that does not exist', async () => {
  const res = await call('GET', '/tasks/999');
  assert.equal(res.status, 404);
});

test('GET /tasks/abc returns 400 (invalid id)', async () => {
  const res = await call('GET', '/tasks/abc');
  assert.equal(res.status, 400);
});

test('PUT replaces a task, and repeating it gives the same result (idempotent)', async () => {
  const first = await call('PUT', '/tasks/2', { title: 'Rewrite the routes', completed: true });
  const second = await call('PUT', '/tasks/2', { title: 'Rewrite the routes', completed: true });
  assert.equal(first.status, 200);
  assert.deepEqual(first.body, second.body);
});

test('DELETE removes a task: 204 the first time, 404 the second', async () => {
  assert.equal((await call('DELETE', '/tasks/3')).status, 204);
  assert.equal((await call('DELETE', '/tasks/3')).status, 404);
});

test('an unknown route returns a JSON 404', async () => {
  const res = await call('GET', '/nope');
  assert.equal(res.status, 404);
  assert.match(res.body.error, /Route not found/);
});
```

```text
✔ GET /tasks returns the three seeded tasks (72.997597ms)
✔ GET /tasks?completed=true filters the list (11.933747ms)
✔ POST /tasks creates a task: 201 plus a Location header (53.272716ms)
✔ POST /tasks without a title returns 400 (21.564603ms)
✔ POST /tasks with malformed JSON returns 400 (11.227916ms)
✔ GET /tasks/:id returns 404 for a task that does not exist (3.924467ms)
✔ GET /tasks/abc returns 400 (invalid id) (6.891291ms)
✔ PUT replaces a task, and repeating it gives the same result (idempotent) (13.819362ms)
✔ DELETE removes a task: 204 the first time, 404 the second (10.734379ms)
✔ an unknown route returns a JSON 404 (2.889261ms)
ℹ tests 10
ℹ suites 0
ℹ pass 10
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 433.798209
exit code: 0
```

Ten tests, all passing. Notes:

- `app.listen(0, …)` + `server.address().port` — start on a free port; `after(() => server.close())` shuts down.
- `beforeEach(() => store.reset())` — every test starts from the same three seeded tasks, so tests don't depend on each other's leftovers.
- The first line sets `NODE_ENV = 'test'` *before* the app loads, which silences the request logger so the test output stays readable.
- The tests cover the **error paths** (400, 404) and **idempotency** (Section 1.5), not just the happy path.

### 6.7 Reading the server's log

When a request misbehaves, the server's terminal is your second tool: with a logger (Section 4) each request is one line — method, URL, status, duration. Compare what the client received with what the log says the server *thought* it sent.

### Exercises

**Level 1 — Basic:** Reproduce the Section 5.3 session in Postman (or Thunder Client) and save the six requests to a collection.

**Level 2 — Practical:** Add a **Tests** script to "Get task by id" that checks the status is `200` and the response has the three properties `id`, `title`, `completed`.

**Level 3 — Challenge:** Write a `node --test` test that proves `GET /tasks/abc` returns `400`, and another that proves a `POST` with an empty-string title returns `400`.

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| Testing in Postman with the server not running | "Could not connect" | Start the server first |
| Wrong body type in Postman (Text, or form-data) | The server's JSON parser doesn't parse it; `req.body` is `undefined` | Body → raw → **JSON** |
| Hard-coding an id in saved requests | It stops existing after a restart (in-memory data) | Create first, then store the id in a variable |
| Testing only successes | Errors are where bugs hide | Test 400, 404 and malformed input too |
| Tests that depend on each other's data | Order-dependent, flaky failures | Reset the data before each test |
| Calling `listen` inside the module you export | Tests can't start/stop the app on their own port | Export the app; call `listen` in `server.js` |

### ✅ Knowledge Check
1. What four things should an endpoint test check?
2. What is a Postman *collection*, and what does `{{baseUrl}}` give you?
3. How does the id returned by "Create task" reach the later requests in the collection?
4. Why does the test file start the app on port `0`, and why does that require separating `app.js` from `server.js`?
5. Which body type must you choose in Postman to send JSON?

---

## 7. Documenting Your API with OpenAPI (Swagger)

*(Module Resource Book, section 3 — "Documentation & Standards".)*

> 📺 **Video for this lesson — [Maksim Ivanov](https://www.youtube.com/watch?v=S8kmHtQeflo)**
> Your module file describes it as: *"Learn how to document your API endpoints using Swagger (OpenAPI), making it easier for frontend developers to consume your backend."* *(I have not watched it; the description is quoted from your file.)*
> This section is built from running the tools themselves, not from the video.

### 7.1 Why document an API?

Your API is a **contract** (Section 1). A contract nobody can read isn't useful: the Angular developer consuming it needs to know every URL, method, parameter, body shape and possible status code. Written documentation drifts out of date; a **machine-readable description** can be checked, rendered, and used to generate tests and client code.

### 7.2 What is OpenAPI?

The **OpenAPI Specification** is a standard, language-neutral format — written in **YAML or JSON** — for describing an HTTP API: its paths, methods, parameters, request and response bodies, and status codes. It was formerly called the Swagger specification, and "Swagger" is now mostly used for the tools around it, such as **Swagger UI**, which renders a spec as an interactive web page *(general knowledge)*.

### 7.3 The Task API, described

This is a complete OpenAPI 3.0.3 description of the Task API from Section 1.7. It is long, so it is collapsed — open it and read the structure:

<details>
<summary><strong>openapi.yaml</strong> (click to expand)</summary>

```yaml
openapi: 3.0.3
info:
  title: Task Manager API
  version: 1.0.0
  description: A small in-memory RESTful API for managing tasks.
servers:
  - url: http://localhost:3000
paths:
  /tasks:
    get:
      summary: List tasks
      parameters:
        - name: completed
          in: query
          required: false
          description: Only return tasks with this completion state.
          schema:
            type: boolean
      responses:
        '200':
          description: A list of tasks.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Task'
        '400':
          $ref: '#/components/responses/ValidationFailed'
    post:
      summary: Create a task
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TaskInput'
      responses:
        '201':
          description: The task that was created.
          headers:
            Location:
              description: URL of the new task.
              schema:
                type: string
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Task'
        '400':
          $ref: '#/components/responses/ValidationFailed'
  /tasks/{id}:
    parameters:
      - name: id
        in: path
        required: true
        description: The task's id (a positive integer).
        schema:
          type: integer
          minimum: 1
    get:
      summary: Get one task
      responses:
        '200':
          description: The task.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Task'
        '400':
          $ref: '#/components/responses/ValidationFailed'
        '404':
          $ref: '#/components/responses/NotFound'
    put:
      summary: Replace a task
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TaskInput'
      responses:
        '200':
          description: The replaced task.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Task'
        '400':
          $ref: '#/components/responses/ValidationFailed'
        '404':
          $ref: '#/components/responses/NotFound'
    patch:
      summary: Update part of a task
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TaskPatch'
      responses:
        '200':
          description: The updated task.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Task'
        '400':
          $ref: '#/components/responses/ValidationFailed'
        '404':
          $ref: '#/components/responses/NotFound'
    delete:
      summary: Delete a task
      responses:
        '204':
          description: Deleted. No body.
        '400':
          $ref: '#/components/responses/ValidationFailed'
        '404':
          $ref: '#/components/responses/NotFound'
components:
  schemas:
    Task:
      type: object
      required: [id, title, completed]
      properties:
        id:
          type: integer
          example: 4
        title:
          type: string
          example: Learn Express
        completed:
          type: boolean
          example: false
    TaskInput:
      type: object
      required: [title]
      properties:
        title:
          type: string
          minLength: 1
        completed:
          type: boolean
          default: false
    TaskPatch:
      type: object
      minProperties: 1
      properties:
        title:
          type: string
          minLength: 1
        completed:
          type: boolean
    Error:
      type: object
      required: [error]
      properties:
        error:
          type: string
        details:
          type: array
          items:
            type: string
  responses:
    ValidationFailed:
      description: The request was invalid.
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    NotFound:
      description: No task with that id.
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
```

</details>

How to read it:

- **`openapi`, `info`, `servers`** — the spec version, the API's title/version, and where it runs.
- **`paths`** — one entry per URL; under each, one entry per **method** (`get`, `post`, `put`, `patch`, `delete`). `/tasks/{id}` uses `{id}` for the placeholder (OpenAPI's spelling of Express's `:id`).
- **`parameters`** — inputs outside the body: here the `completed` query filter and the `id` path parameter (with `type: integer`, `minimum: 1`).
- **`requestBody`** — what a client sends. **`responses`** — every status code the operation can return, with the body shape for each (including the `201` `Location` header).
- **`components`** — shared definitions, referenced with **`$ref`**: the `Task`, `TaskInput`, `TaskPatch` and `Error` schemas and the reusable `NotFound` and `ValidationFailed` responses. Reuse keeps the file consistent.

Notice how directly it mirrors the contract table in Section 1.7 — designing first (Section 1) made this almost mechanical.

### 7.4 Validating a spec

A spec can have mistakes like any other file. The `swagger-parser` package validates one; this script reports the result (it exits non-zero when the spec is invalid):

```javascript
const SwaggerParser = require('@apidevtools/swagger-parser');

const file = process.argv[2] || 'openapi.yaml';

SwaggerParser.validate(file)
  .then((api) => {
    console.log(`OK: ${file} is a valid OpenAPI ${api.openapi} document: "${api.info.title}" v${api.info.version}, ${Object.keys(api.paths).length} paths`);
  })
  .catch((err) => {
    console.log(`INVALID: ${file}`);
    console.log(err.message.split('\n').slice(0, 3).join('\n'));
    process.exit(1);
  });
```

I ran it on the real spec and on a deliberately broken one whose `200` response has no `description` (a required field):

```text
$ node validate-openapi.js openapi.yaml
OK: openapi.yaml is a valid OpenAPI 3.0.3 document: "Task Manager API" v1.0.0, 2 paths
$ node validate-openapi.js openapi-broken.yaml
INVALID: openapi-broken.yaml
Swagger schema validation failed.
  #/paths/~1tasks/get/responses/200 must have required property 'description'
  #/paths/~1tasks/get/responses/200 must have required property '$ref'
exit code: 1
```

### 7.5 Serving interactive documentation

`swagger-ui-express` turns the spec into a live page. This small server serves the page at `/docs` and the raw spec at `/openapi.json`:

```javascript
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yaml');
const fs = require('node:fs');
const path = require('node:path');

const spec = YAML.parse(fs.readFileSync(path.join(__dirname, 'openapi.yaml'), 'utf8'));
const app = express();

app.get('/openapi.json', (req, res) => res.json(spec));     // the spec itself, machine-readable
app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));   // an interactive page generated from it

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API docs at http://localhost:${PORT}/docs`));
```

With it running on port 3000:

```text
$ curl -s localhost:3000/docs/ | grep -o "<title>[^<]*</title>"
<title>Swagger UI</title>
$ curl -s -o /dev/null -w "%{http_code} %{content_type}\n" localhost:3000/docs/
200 text/html; charset=utf-8
$ curl -s localhost:3000/openapi.json   (first characters)
{"openapi":"3.0.3","info":{"title":"Task Manager API","version":"1.0.0","description":"A small in-memory RESTful API for managing tasks."},"servers":[{"url":"ht
```

The page is served (`200`, an HTML document titled **Swagger UI**) and the spec is available as JSON. Open `http://localhost:3000/docs` in a browser to explore it — Swagger UI normally offers a **"Try it out"** button on each operation that sends a real request *(general knowledge; I verified the page and spec are served but did not view it in a browser)*. In a real project you would mount this on the same Express app as the API (`app.use('/docs', …)`) — a good stretch exercise.

### 7.6 Keeping the documentation honest

A spec **describes** the API; nothing forces the code to **match** it. They can drift. Ways to keep them aligned *(general knowledge; not covered further here)*:

- Test the **real behaviour** against the contract — the self-check script in Section 8 and the tests in Section 6.6 do this by hand.
- Tools exist that validate requests and responses against an OpenAPI spec automatically, and that generate the spec from code comments or generate client code from the spec — 🔒 outside this module.

### Exercises

**Level 1 — Basic:** Add a `GET /health` operation to `openapi.yaml` that returns `200` with `{ "status": "ok" }`, then validate the file.

**Level 2 — Practical:** Break the spec three different ways (remove a `description`, reference a schema that doesn't exist with `$ref`, use an invalid `type`) and note what the validator says each time.

**Level 3 — Challenge:** Mount the Swagger UI on the Section 8 Task API at `/docs` and confirm the documented `curl` examples match real responses.

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| Documenting an endpoint but not its error responses | Clients don't know what `400`/`404` mean | Document every status code the endpoint can return |
| Using `:id` in an OpenAPI path | OpenAPI uses `{id}` | `/tasks/{id}` plus a path parameter definition |
| Copy-pasting schemas instead of `$ref` | The copies drift apart | One definition in `components`, referenced everywhere |
| Never validating the spec | Errors surface later in tools or clients | Validate it (Section 7.4) |
| Treating the spec as proof the code is correct | A spec only *describes* | Test the behaviour as well |

### ✅ Knowledge Check
1. What problem does an OpenAPI document solve for the Angular developer consuming your API?
2. In `/tasks/{id}`, what is `{id}`, and how is it declared?
3. What does `$ref: '#/components/schemas/Task'` do?
4. Why can a spec and the code disagree, and how would you detect it?

---

## 8. Final Module Project: The RESTful Task Tracker

The module's lab is a **"Simple RESTful API" for a resource, supporting all CRUD operations, using an in-memory array (no database)**, reviewed by a TA in a live code review. This project is that lab, built to professional shape: the complete contract from Section 1.7, a modular structure, validation, logging, JSON errors, tests and documentation.

### 8.1 Requirements

**Functional (the full CRUD contract):**

1. `GET /tasks` → `200` with a JSON array; optional filter `?completed=true|false` (invalid value → `400`).
2. `GET /tasks/:id` → `200` with the task; non-integer id → `400`; missing → `404`.
3. `POST /tasks` → `201`, the created task, and a `Location: /tasks/<id>` header; missing/blank `title` or malformed JSON → `400`.
4. `PUT /tasks/:id` → `200` with the **replaced** task (requires `title`); `400`/`404` as above. Repeating it must give the same result.
5. `PATCH /tasks/:id` → `200` with the updated task (any of `title`, `completed`); an empty body → `400`.
6. `DELETE /tasks/:id` → `204`, no body; a second `DELETE` → `404`.
7. Every error response is **JSON** (`{ "error": … }`), including unknown routes (`404`) and unexpected failures (`500`, with no internals leaked).
8. Data lives in an **in-memory array** (no database).

**Structure and quality:**

9. **Modular**: the app, the server start-up, the router, the data store, validation and middleware live in **separate files**; `app.js` exports the app and `server.js` calls `listen`.
10. A **request logger** middleware and a central **error handler** (Section 4).
11. **Validation** that is safe when `req.body` is `undefined` (Section 2.6 ③).
12. An `npm start` script; the port comes from `process.env.PORT` with a default of `3000`.

**Evidence (what you submit for the code review):**

13. A saved **request collection** (Postman or Insomnia export) covering every endpoint, including at least two error cases.
14. A short `README.md`: how to run it, the endpoint table, and one design decision you made and why.

### 8.2 Suggested structure

```text
task-api/
├── package.json
├── server.js                  listens on the port        (the only file that calls listen)
├── app.js                     builds and exports the Express app
├── store.js                   the in-memory data and the functions that use it
├── validate-task.js           id parsing and body validation
├── routes/
│   └── tasks.js               the /tasks router (all five operations)
├── middleware/
│   ├── request-logger.js
│   └── errors.js              notFound + errorHandler
└── test/
    └── tasks.test.js          automated tests
```

### 8.3 Required concepts (checklist)

- [ ] REST design: nouns for URLs, correct methods and status codes (Section 1)
- [ ] An Express app, routes for GET / POST / PUT / PATCH / DELETE (Sections 2–3)
- [ ] A router mounted at `/tasks`; route parameters and query parameters (Section 3)
- [ ] `express.json()`, a custom middleware, and an error-handling middleware in the right order (Section 4)
- [ ] Validation with accurate `400`/`404` responses (Sections 5, 8)
- [ ] Every endpoint exercised in a saved request collection (Section 6)
- [ ] Separation of concerns: HTTP handling vs. data vs. validation

### 8.4 Acceptance criteria

- `bash task-api-check.sh` reports **14 passed, 0 failed** against your running API.
- Every endpoint behaves as in the contract table, and **no response is HTML**.
- Malformed JSON, a non-JSON body, a bad id and an unknown route each return the right 4xx **without crashing the server**.
- You can explain, for any file, what it is responsible for and why it is separate.
- You can explain why `PUT` and `DELETE` are idempotent and `POST` is not, using your own API's behaviour.

### 8.5 Check your work: `task-api-check.sh`

Start your API (`npm start`), then run `bash task-api-check.sh` in another terminal (it needs `curl`; pass another base URL as an argument if you use a different port). It creates, reads, replaces and deletes a task and prints one line per check:

```bash
#!/bin/bash
# Usage: start your API (npm start), then in another terminal:  bash task-api-check.sh [base-url]
BASE=${1:-http://localhost:3000}
pass=0; fail=0
TMP=$(mktemp)

ok()   { echo "PASS  $1"; pass=$((pass+1)); }
bad()  { echo "FAIL  $1   ($2)"; fail=$((fail+1)); }

# request METHOD PATH [JSON_BODY]  -> sets STATUS and BODY, and LOCATION when present
request() {
  local method=$1 path=$2 data=$3
  if [ -n "$data" ]; then
    curl -s -i -m 5 -X "$method" -H 'Content-Type: application/json' -d "$data" "$BASE$path" > "$TMP"
  else
    curl -s -i -m 5 -X "$method" "$BASE$path" > "$TMP"
  fi
  tr -d '\r' < "$TMP" > "$TMP.clean"
  STATUS=$(head -n 1 "$TMP.clean" | awk '{print $2}')
  LOCATION=$(grep -i '^location:' "$TMP.clean" | head -n 1 | awk '{print $2}')
  CTYPE=$(grep -i '^content-type:' "$TMP.clean" | head -n 1)
  BODY=$(awk 'BEGIN{b=0} b{print} /^$/{b=1}' "$TMP.clean")
}

expect() { # expect "description" expected_status [expected_text_in_body]
  if [ "$STATUS" = "$2" ] && { [ -z "$3" ] || [[ "$BODY" == *"$3"* ]]; }; then ok "$1"; else bad "$1" "status $STATUS, expected $2${3:+ containing: $3}"; fi
}

request GET /tasks;                                                      expect "GET /tasks -> 200 and a JSON array" 200 "["
[[ "$CTYPE" == *application/json* ]] && ok "GET /tasks sends Content-Type: application/json" || bad "GET /tasks Content-Type" "$CTYPE"

request POST /tasks '{"title":"Check task","completed":false}';         expect "POST /tasks -> 201 with the created task" 201 '"title":"Check task"'
[[ "$LOCATION" =~ ^/tasks/[0-9]+$ ]] && ok "POST /tasks sends a Location header ($LOCATION)" || bad "POST /tasks Location header" "got '$LOCATION'"
TASK_ID=$(echo "$BODY" | grep -o '"id":[0-9]*' | head -n 1 | cut -d: -f2)
TASK_PATH=/tasks/$TASK_ID

request POST /tasks '{"completed":true}';                                expect "POST without a title -> 400" 400
request POST /tasks '{"title": ';                                        expect "POST with malformed JSON -> 400" 400

request GET "$TASK_PATH";                                                expect "GET one task -> 200" 200 '"title":"Check task"'
request GET /tasks/999999;                                               expect "GET a missing task -> 404" 404
request PUT "$TASK_PATH" '{"title":"Changed title","completed":true}';   expect "PUT replaces the task -> 200" 200 '"completed":true'
FIRST=$BODY
request PUT "$TASK_PATH" '{"title":"Changed title","completed":true}'
if [ "$STATUS" = 200 ] && [ "$BODY" = "$FIRST" ] && [[ "$BODY" == *'"completed":true'* ]]; then ok "repeating the same PUT gives the same 200 result (idempotent)"; else bad "PUT idempotency" "status $STATUS; the repeated PUT must also return 200 with the same body"; fi
request DELETE "$TASK_PATH";                                             expect "DELETE -> 204" 204
request DELETE "$TASK_PATH";                                             expect "DELETE again -> 404" 404
request GET "$TASK_PATH";                                                expect "GET the deleted task -> 404" 404
request GET /does-not-exist;                                             expect "unknown route -> 404" 404

echo "$pass passed, $fail failed"
rm -f "$TMP" "$TMP.clean"
[ "$fail" -eq 0 ]
```

**A passing run** — against the reference solution below:

```text
PASS  GET /tasks -> 200 and a JSON array
PASS  GET /tasks sends Content-Type: application/json
PASS  POST /tasks -> 201 with the created task
PASS  POST /tasks sends a Location header (/tasks/4)
PASS  POST without a title -> 400
PASS  POST with malformed JSON -> 400
PASS  GET one task -> 200
PASS  GET a missing task -> 404
PASS  PUT replaces the task -> 200
PASS  repeating the same PUT gives the same 200 result (idempotent)
PASS  DELETE -> 204
PASS  DELETE again -> 404
PASS  GET the deleted task -> 404
PASS  unknown route -> 404
14 passed, 0 failed
exit code: 0
```

**A failing run** — the same script against the *four-endpoint* challenge from Section 5, which lacks `Location`, `PUT` and `PATCH`. Read the FAIL lines: they name the missing behaviour and what was expected:

```text
PASS  GET /tasks -> 200 and a JSON array
PASS  GET /tasks sends Content-Type: application/json
PASS  POST /tasks -> 201 with the created task
FAIL  POST /tasks Location header   (got '')
PASS  POST without a title -> 400
PASS  POST with malformed JSON -> 400
PASS  GET one task -> 200
PASS  GET a missing task -> 404
FAIL  PUT replaces the task -> 200   (status 404, expected 200 containing: "completed":true)
FAIL  PUT idempotency   (status 404; the repeated PUT must also return 200 with the same body)
PASS  DELETE -> 204
PASS  DELETE again -> 404
PASS  GET the deleted task -> 404
PASS  unknown route -> 404
11 passed, 3 failed
exit code: 1
```

(An earlier version of this script let the idempotency check *pass by accident* on the four-endpoint API, because two identical 404 pages are "the same result". It now requires `200` both times — a reminder that a check that can pass for the wrong reason is worse than none.)

### 8.6 What the finished API does

A walkthrough against the reference solution. First the raw headers of a `POST` — note the **`201`** and the **`Location`** header:

```text
$ curl -i -X POST -H "Content-Type: application/json" -d '{"title":"Learn Express"}' localhost:3000/tasks
HTTP/1.1 201 Created
X-Powered-By: Express
Location: /tasks/4
Content-Type: application/json; charset=utf-8
Content-Length: 50
ETag: W/"32-hnv+d7KkmsmlpNngJlHodbYbMN8"
Date: Mon, 26 Oct 2026 08:24:33 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"id":4,"title":"Learn Express","completed":false}
```

Then the rest of the contract, including the error cases (task 4 exists because of the `POST` above; the form-encoded `POST` is the case where Express 5's `undefined` body would crash naive code, and the validation turns it into a `400`):

```text
$ curl 'localhost:3000/tasks?completed=false'
[{"id":2,"title":"Write the routes","completed":false},{"id":3,"title":"Test with Postman","completed":false},{"id":4,"title":"Learn Express","completed":false}]
[HTTP 200]

$ curl 'localhost:3000/tasks/abc'
{"error":"id must be a positive integer"}
[HTTP 400]

$ curl -X POST -H 'Content-Type: application/json' -d '{"completed":true}' 'localhost:3000/tasks'
{"error":"Validation failed","details":["title is required and must be a non-empty string"]}
[HTTP 400]

$ curl -X POST -H 'Content-Type: application/json' -d '{"title":' 'localhost:3000/tasks'
{"error":"Unexpected end of JSON input"}
[HTTP 400]

$ curl -X POST -d 'title=oops' 'localhost:3000/tasks'   (form body, NOT JSON: Express leaves req.body undefined)
{"error":"Validation failed","details":["Request body must be a JSON object"]}
[HTTP 400]

$ curl -X PUT -H 'Content-Type: application/json' -d '{"title":"Rewrite the routes","completed":true}' 'localhost:3000/tasks/2'
{"id":2,"title":"Rewrite the routes","completed":true}
[HTTP 200]

$ curl -X PATCH -H 'Content-Type: application/json' -d '{"completed":false}' 'localhost:3000/tasks/2'
{"id":2,"title":"Rewrite the routes","completed":false}
[HTTP 200]

$ curl -X PATCH -H 'Content-Type: application/json' -d '{}' 'localhost:3000/tasks/2'
{"error":"Validation failed","details":["Provide at least one of: title, completed"]}
[HTTP 400]

$ curl -X DELETE 'localhost:3000/tasks/3'

[HTTP 204]

$ curl -X DELETE 'localhost:3000/tasks/3'
{"error":"Task 3 not found"}
[HTTP 404]

$ curl 'localhost:3000/nope'
{"error":"Route not found: GET /nope"}
[HTTP 404]
```

and the server's log of that session (one line per request, written by the logger middleware):

```text
Task API listening on http://localhost:3000
POST /tasks 201 14.2ms
GET /tasks?completed=false 200 1.7ms
GET /tasks/abc 400 0.8ms
POST /tasks 400 1.6ms
POST /tasks 400 3.1ms
POST /tasks 400 0.6ms
PUT /tasks/2 200 1.1ms
PATCH /tasks/2 200 1.2ms
PATCH /tasks/2 400 2.0ms
DELETE /tasks/3 204 1.3ms
DELETE /tasks/3 404 3.0ms
GET /nope 404 2.5ms
```

### 8.7 Hints (try before opening the solution)

- Build in this order: store and validation (plain functions you can reason about) → the router → `app.js` → `server.js`. Test each layer before adding the next.
- Keep **HTTP concerns** (status codes, `req`/`res`) in the router and **data concerns** in the store; the store should know nothing about Express.
- `router.param('id', …)` runs for every route that has `:id` — a good place to validate the id **once**.
- Register the 404 handler and then the error handler **last** (Section 4.7).
- If a request hangs, a code path never responds (Section 4.1's one rule).

<details>
<summary><strong>Reference solution</strong> (open only after you have tried)</summary>

**`server.js`**

```javascript
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, (error) => {
  if (error) {
    console.error('Could not start the server:', error.message);
    process.exit(1);
  }
  console.log(`Task API listening on http://localhost:${PORT}`);
});
```

**`app.js`**

```javascript
const express = require('express');
const requestLogger = require('./middleware/request-logger');
const tasksRouter = require('./routes/tasks');
const { notFound, errorHandler } = require('./middleware/errors');

const app = express();

// Skip request logging while the automated tests run, to keep their output readable.
if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger);   // 1. log every request
}
app.use(express.json());      // 2. parse JSON bodies

app.use('/tasks', tasksRouter);   // 3. the routes

app.use(notFound);            // 4. nothing matched -> 404
app.use(errorHandler);        // 5. anything that threw or called next(err)

module.exports = app;
```

**`routes/tasks.js`**

```javascript
const express = require('express');
const store = require('../store');
const { parseId, validateTask } = require('../validate-task');

const router = express.Router();

// Runs for every route that contains :id — validates it once.
router.param('id', (req, res, next, value) => {
  const id = parseId(value);
  if (id === null) {
    return res.status(400).json({ error: 'id must be a positive integer' });
  }
  req.taskId = id;
  next();
});

router.get('/', (req, res) => {
  const { completed } = req.query;
  if (completed === undefined) {
    return res.json(store.list());
  }
  if (completed !== 'true' && completed !== 'false') {
    return res.status(400).json({ error: 'completed must be "true" or "false"' });
  }
  res.json(store.list({ completed: completed === 'true' }));
});

router.get('/:id', (req, res) => {
  const task = store.get(req.taskId);
  if (!task) {
    return res.status(404).json({ error: `Task ${req.taskId} not found` });
  }
  res.json(task);
});

router.post('/', (req, res) => {
  const { value, errors } = validateTask(req.body);
  if (errors) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }
  const task = store.create(value);
  res.status(201).location(`/tasks/${task.id}`).json(task);
});

router.put('/:id', (req, res) => {
  const { value, errors } = validateTask(req.body);
  if (errors) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }
  const task = store.replace(req.taskId, value);
  if (!task) {
    return res.status(404).json({ error: `Task ${req.taskId} not found` });
  }
  res.json(task);
});

router.patch('/:id', (req, res) => {
  const { value, errors } = validateTask(req.body, { partial: true });
  if (errors) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }
  if (Object.keys(value).length === 0) {
    return res.status(400).json({ error: 'Validation failed', details: ['Provide at least one of: title, completed'] });
  }
  const task = store.update(req.taskId, value);
  if (!task) {
    return res.status(404).json({ error: `Task ${req.taskId} not found` });
  }
  res.json(task);
});

router.delete('/:id', (req, res) => {
  if (!store.remove(req.taskId)) {
    return res.status(404).json({ error: `Task ${req.taskId} not found` });
  }
  res.sendStatus(204);
});

module.exports = router;
```

**`store.js`**

```javascript
// In-memory data store. The data lives only as long as the process does.
let tasks = [];
let nextId = 1;

function seed() {
  tasks = [
    { id: 1, title: 'Design the API', completed: true },
    { id: 2, title: 'Write the routes', completed: false },
    { id: 3, title: 'Test with Postman', completed: false }
  ];
  nextId = 4;
}
seed();

module.exports = {
  list(filter = {}) {
    if (typeof filter.completed === 'boolean') {
      return tasks.filter((t) => t.completed === filter.completed);
    }
    return [...tasks];
  },
  get(id) {
    return tasks.find((t) => t.id === id);
  },
  create({ title, completed = false }) {
    const task = { id: nextId++, title, completed };
    tasks.push(task);
    return task;
  },
  replace(id, { title, completed = false }) {
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return undefined;
    tasks[index] = { id, title, completed };
    return tasks[index];
  },
  update(id, changes) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return undefined;
    Object.assign(task, changes);
    return task;
  },
  remove(id) {
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return false;
    tasks.splice(index, 1);
    return true;
  },
  reset: seed
};
```

**`validate-task.js`**

```javascript
// "42" -> 42, anything that is not a positive integer -> null
function parseId(value) {
  return /^[1-9]\d*$/.test(value) ? Number(value) : null;
}

// Returns { value } when the input is valid, or { errors: [...] } when it is not.
// With { partial: true } (for PATCH) every field is optional.
function validateTask(body, { partial = false } = {}) {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { errors: ['Request body must be a JSON object'] };   // also covers req.body === undefined
  }

  const errors = [];
  const value = {};

  if (!partial || 'title' in body) {
    if (typeof body.title !== 'string' || body.title.trim() === '') {
      errors.push('title is required and must be a non-empty string');
    } else {
      value.title = body.title.trim();
    }
  }

  if ('completed' in body) {
    if (typeof body.completed !== 'boolean') {
      errors.push('completed must be true or false');
    } else {
      value.completed = body.completed;
    }
  }

  return errors.length ? { errors } : { value };
}

module.exports = { parseId, validateTask };
```

**`middleware/request-logger.js`**

```javascript
function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(1)}ms`);
  });
  next();
}

module.exports = requestLogger;
```

**`middleware/errors.js`**

```javascript
// Runs when no route matched.
function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Error-handling middleware: Express recognises it by its FOUR parameters.
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const status = err.status ?? err.statusCode ?? 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: status >= 500 ? 'Internal Server Error' : err.message
  });
}

module.exports = { notFound, errorHandler };
```

**`package.json`**

```json
{
  "name": "task-api",
  "version": "1.0.0",
  "private": true,
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "test": "node --test --test-reporter=spec"
  },
  "dependencies": {
    "express": "^5.3.0"
  }
}
```

Design notes: the **store** owns the data and knows nothing about HTTP; **validation** returns `{ value }` or `{ errors }` instead of throwing, so the route decides the response; **`router.param`** validates `:id` once; the **status mapping** (`err.status ?? 500`) lets body-parser errors keep their `400`/`413`; and `app.js` only *builds* the app — which is what let the tests in Section 6.6 start it on a free port.

</details>

### 8.8 Optional stretch challenges

- **Nested resource for the Angular app:** expose the same tasks under `/api/boards/:boardId/tasks` using a router with `mergeParams` (Section 3.4), so the Angular `TaskService` from the earlier notes could call your API unchanged. (You will also need CORS — Section 4.5.)
- **Documentation:** mount Swagger UI on the API at `/docs` (Section 7).
- **Filtering and paging:** support `?search=` on the title and `?limit=&offset=` on the list, with validation.
- **Persistence without a database:** save the tasks to a JSON file with `fs.promises` — and think about what happens if two requests write at once.
- **More tests:** add `PATCH` tests and a test that a `500` never leaks the error message.

---

## 9. Quick Reference Sheet

### Setup
```bash
npm init -y
npm install express            # Express 5 (current); needs Node 18+
node app.js                    # run (add "start": "node server.js" to package.json scripts for npm start)
```

### A minimal API
```javascript
const express = require('express');
const app = express();
app.use(express.json());                                  // parse JSON bodies

app.get('/tasks', (req, res) => res.json(tasks));
app.get('/tasks/:id', (req, res) => { /* req.params.id is a string */ });
app.post('/tasks', (req, res) => res.status(201).location(`/tasks/${id}`).json(task));
app.put('/tasks/:id', handler);       // replace
app.patch('/tasks/:id', handler);     // partial update
app.delete('/tasks/:id', (req, res) => res.sendStatus(204));

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));        // 404
app.use((err, req, res, next) => res.status(err.status ?? 500).json({ error: '…' })); // errors (4 params, LAST)

app.listen(process.env.PORT || 3000, (error) => { if (error) throw error; });
```

### Request / response helpers
```text
req.params   path parameters (strings)        req.query    ?key=value (strings; repeats -> arrays)
req.body     parsed body (undefined if no parser matched — Express 5)     req.get('Header')
res.json(x)  JSON + end      res.send(x)  text/HTML + end      res.status(n)  chainable
res.sendStatus(204)  status + end            res.location(url)  /  res.set(name, value)
```

### Middleware
```text
(req, res, next) => { …; next(); }     do exactly ONE of: end the response  OR  call next()
app.use(fn)                             runs for every request, in registration order
express.json()  express.urlencoded({ extended: true })  express.static('public')     built in
morgan('dev')   cors({ origin: 'http://localhost:4200' })                            npm packages
order:  logger -> parsers -> routes -> 404 -> error handler (4 params, last)
```

### Routers
```javascript
const router = express.Router({ mergeParams: true });    // mergeParams to see the parent's :params
router.get('/', list);  router.get('/:id', one);
app.use('/tasks', router);                                // mounts it at the /tasks prefix
```

### REST cheat sheet
```text
GET    /tasks        200 list            POST   /tasks      201 + Location     (not idempotent)
GET    /tasks/4      200 | 404           PUT    /tasks/4    200 replace        (idempotent)
PATCH  /tasks/4      200 partial         DELETE /tasks/4    204 | 404          (idempotent)
400 bad request (invalid input)   404 not found   413 body too large   500 server error (generic message!)
```

### Express 4 -> 5 differences seen in this module
| Topic | Express 4 | Express 5 |
|---|---|---|
| Error in an `async` handler | Crashed the server | Forwarded to the error handler |
| Wildcard route | `app.get('*', …)` | `app.get('/*splat', …)` (named) |
| `req.body` with no matching parser | `{}` | `undefined` |
| `app.listen` failure | Unhandled `'error'` event | Passed to the callback |

### Testing
```text
curl -i localhost:3000/tasks                                         headers + body
curl -X POST -H 'Content-Type: application/json' -d '{"title":"x"}' localhost:3000/tasks
npx newman run task-manager.postman_collection.json                  run a Postman collection
node --test                                                          Node's built-in test runner (app.listen(0) in tests)
node validate-openapi.js openapi.yaml                                validate an OpenAPI spec
```

### 🔒 Coming Later — Outside This Module
Databases · authentication, authorization and password hashing · validation libraries · security hardening (helmet, rate limiting) · deployment and process managers · pagination and caching design · file uploads · WebSockets · HATEOAS · generating OpenAPI specs or clients from code · TypeScript on the server.

---

## 10. Source & Resource Mapping

### Learning-objective coverage

| Learning objective | Where it is covered |
|---|---|
| Explain the principles of RESTful APIs and their core components | Section 1 |
| Construct a basic web server using Node.js and the Express framework | Section 2 |
| Implement routing for GET, POST, PUT, DELETE | Section 3 (and Sections 5 and 8) |
| Utilize middleware for request parsing, logging and error handling | Section 4 |
| Test API endpoints with a tool like Postman or Insomnia | Section 6 |
| Hands-on lab / challenge: Task Manager / Task Tracker | Sections 5 and 8 |
| Documentation & standards (Resource Book section 3) | Section 7 |

### Resources from your module file

| Module topic | Resource | How it was used |
|---|---|---|
| REST & Express basics (video) | [**Fireship** video](https://www.youtube.com/watch?v=-MTSQjw5DrM) | **Not watched.** The module describes a fast introduction to resources, HTTP verbs, status codes and a quick coding demo — it matches Sections 1–2 |
| Building a complete API (video) | **Programming with Mosh** | **Not watched; the module gives no link.** Described as covering setup, GET/POST/PUT/DELETE, input validation and Postman testing — it matches Sections 3, 5, 6 and 8 |
| Building a complete API (reading) | [**How to create a REST API with Node.js and Express — Postman Blog**](https://blog.postman.com/how-to-create-a-rest-api-with-node-js-and-express/) | **Read.** Used for the router-file layout, middleware and error-handler ideas, and the Postman workflow. **Its auth and database sections are outside this module, and two details in its code should not be copied** (SHA-256 password hashing; a hard-coded JWT secret and returning the stored password hash) — see the note at the top |
| Documentation & standards (video) | [**Maksim Ivanov** video](https://www.youtube.com/watch?v=S8kmHtQeflo) | **Not watched.** The module describes documenting endpoints with Swagger (OpenAPI) for frontend developers — Section 7 covers the same ground by running the tools |

### How the facts in this document were established

| Kind of claim | How |
|---|---|
| Express behaviour, Express 4 vs 5 differences, status codes, headers, middleware order, error handling, CORS headers, tests, OpenAPI validation and serving, Newman results | **Run** (outputs in this document) |
| Package versions | npm registry, checked October 2026 |
| HTTP semantics (safe/idempotent), REST constraints, the history of Swagger/OpenAPI, Postman/Insomnia workflow | General knowledge, labelled where it appears |
| Browser enforcement of CORS; the Postman and Insomnia apps; the videos | **Not verified here** |

*I did not read the official Express documentation pages while writing this; the Express behaviour described is what the running code showed, and anything beyond that is labelled.*

### Links

- How to create a REST API with Node.js and Express (Postman Blog) — <https://blog.postman.com/how-to-create-a-rest-api-with-node-js-and-express/>
- Fireship video — <https://www.youtube.com/watch?v=-MTSQjw5DrM>
- Maksim Ivanov video — <https://www.youtube.com/watch?v=S8kmHtQeflo>

---

## 11. Practice Questions

Your module file lists no quiz for this module, so these questions are my own, for practice. Try them first; answers follow.

**Questions**

1. Which HTTP method creates a new resource in a collection, and what status code (plus header) should a successful call return?
2. Which of `GET`, `POST`, `PUT`, `DELETE` are idempotent? Explain why that matters when a request times out.
3. Rewrite `GET /getTaskById?id=4` as a RESTful request.
4. In `POST /boards/42/tasks?notify=true` with body `{"title":"x"}`, what are the route parameter, the query parameter and the body?
5. Why must you convert `req.params.id` before comparing it to a number?
6. When does `express.json()` parse a body, and what is `req.body` on Express 5 when it doesn't?
7. Why did `GET /tasks/stats` return `{"route":"by id","id":"stats"}` when `/tasks/:id` was registered first?
8. State the signature of a middleware function and the two things it must do one of.
9. What makes a function an error-handling middleware, and where must it be registered?
10. What changed for an `async` route handler that throws between Express 4 and Express 5?
11. What does `app.use('/tasks', router)` do to a route defined as `router.get('/:id', …)`?
12. What does `mergeParams: true` do, and why would you need it?
13. A handler fails with `new Error('db password is hunter2')`. What should the client receive, and where should the real message go?
14. A colleague says "CORS keeps strangers out of our API." Correct them.
15. What is a Postman collection, and what does Newman do with it?
16. Why does the Task API export the app from `app.js` and call `listen` in `server.js`?
17. You send `PUT /tasks/2` twice with the same body, then `POST /tasks` twice with the same body. Describe the difference in server state.
18. A client sends `{"title":"x"}` without the `Content-Type` header. What reaches your route as `req.body` on Express 5, and what should your handler respond?
19. Which status code should `DELETE /tasks/99` return when task 99 doesn't exist, and why not `200`?
20. What does an OpenAPI document describe, and how did this module validate and serve one?

**Answer key**

*Prerequisite self-check:*

1. Any two of: choosing the handler with an `if / else if` on the method and path, parsing the query string (for example with `new URL(...).searchParams`), and serialising the JSON reply with the right `Content-Type`. 2. "Not found" — the **server** chooses the status code. 3. No — JSON keys and strings need **double quotes**. 4. It downloads Express into `node_modules/`, adds a `dependencies` entry to `package.json` (a caret range such as `^5.3.0`), and creates or updates `package-lock.json`. 5. So the client knows to parse the body as JSON rather than treat it as plain text or HTML.

*Practice questions:*

1. **`POST`**; **`201 Created`** with a **`Location`** header pointing at the new resource.
2. **`GET`, `PUT`, `DELETE`.** If a request times out the client can't know whether it succeeded; an idempotent request can simply be sent again with no extra effect, whereas repeating a `POST` may create a duplicate.
3. **`GET /tasks/4`** (the id is part of the path, the method already says "get").
4. Route parameter: `boardId = "42"` (from `:boardId`); query parameter: `notify = "true"`; body: `{"title":"x"}` (all parameters are strings).
5. Route parameters are **strings**; `"4" === 4` is `false`. Convert with `Number(...)` and validate the result.
6. Only when the request has **`Content-Type: application/json`**; otherwise `req.body` is **`undefined`** on Express 5 (it was `{}` on Express 4).
7. Express uses the **first matching route**; `/tasks/:id` matched `stats` as an id. Register `/tasks/stats` first.
8. `(req, res, next)`; it must **end the response *or* call `next()`**.
9. **Four parameters** `(err, req, res, next)`; it must be registered **after** the routes whose errors it should handle (last).
10. On Express 4 the error crashed the server (an unhandled rejection); on Express 5 it is **forwarded to the error handler**.
11. It **prefixes** the route: it now answers `/tasks/:id`.
12. It makes the **parent path's parameters** (for example `:boardId`) available in `req.params` inside the child router — needed for nested resources like `/boards/:boardId/tasks`.
13. A **generic** `500 Internal Server Error` message; the real message goes to the **server log** only.
14. **CORS is a browser rule**, not access control: `curl` and other servers ignore it. Keeping strangers out takes authentication.
15. A **collection** is a saved, shareable group of requests (with variables and test scripts); **Newman** runs a collection from the command line and reports the assertions.
16. So a test can start the app on a **free port** (`listen(0)`) without clashing with a running server; `app.js` only *builds* the app.
17. After repeating `PUT` the state is **the same** as after one `PUT`; after repeating `POST` there are **two new tasks** (two ids).
18. **`undefined`** (nothing parsed it). The handler should validate defensively and return **`400`** with an explanatory error, not crash.
19. **`404 Not Found`** — the resource doesn't exist, and `200` would claim a success that didn't happen (the client could mistake it for a deletion).
20. It describes an API's **paths, methods, parameters, bodies and responses** in YAML/JSON. Here it was **validated** with `swagger-parser` and **served** as interactive docs with `swagger-ui-express`.

---

## 12. Glossary

| Term | Meaning |
|---|---|
| **REST** | An architectural style for networked APIs built on resources, URLs and HTTP methods |
| **RESTful API** | A web API that follows REST principles |
| **Resource** | A "thing" an API manages (a task) |
| **Representation** | A description of a resource's state in a format such as JSON |
| **Stateless** | Each request carries everything the server needs; the server keeps no per-client session between requests |
| **Safe method** | One that doesn't change server state (`GET`) |
| **Idempotent** | Repeating the same request leaves the server in the same state as doing it once (`GET`, `PUT`, `DELETE`) |
| **CRUD** | Create, Read, Update, Delete — the four basic data operations |
| **Express** | A minimal web framework for Node.js |
| **Route** | A method + path + handler (`app.get('/tasks', …)`) |
| **Route parameter** | A `:name` placeholder in a path, available in `req.params` (always a string) |
| **Query string** | The `?key=value` part of a URL, available in `req.query` |
| **Router** | An `express.Router()` — a mini-application for a group of routes, mounted at a prefix |
| **Middleware** | A function `(req, res, next)` that runs in the request pipeline |
| **`next()`** | Passes control to the next middleware or route |
| **Error-handling middleware** | Middleware with four parameters `(err, req, res, next)` |
| **Body parser** | Middleware that turns a request body into `req.body` (`express.json()`) |
| **CORS** | Cross-Origin Resource Sharing — headers that tell *browsers* which other origins may read a response |
| **Preflight** | An `OPTIONS` request a browser sends before certain cross-origin requests |
| **Postman collection** | A saved group of API requests (with variables and tests), exportable as JSON |
| **Newman** | Postman's command-line collection runner |
| **OpenAPI** | A standard YAML/JSON format for describing an HTTP API |
| **Swagger UI** | A tool that renders an OpenAPI document as an interactive page |
| **In-memory store** | Data kept in a variable; it disappears when the process stops |
| **`201 Created`** | Success status for a request that created a resource |
| **`204 No Content`** | Success with no response body |
| **`400` / `404` / `413` / `500`** | Bad request / not found / body too large / server error |
