# Module 1: Introduction to Backend Development
### Backend Development with JavaScript

> **Scope note:** This document covers *only* Module 1 of the backend course: the client-server model and the role of a backend; how Node.js compares with Python, Java and Go; what Node.js is (a runtime, its event-driven architecture, the event loop, blocking vs. non-blocking I/O, npm); setting up a local environment; and building a first HTTP server with Node's built-in `http` module. **Part 0** adds the prerequisite knowledge this module quietly assumes. Anything beyond that — web frameworks such as Express, routing libraries, REST API design, databases, authentication, validation, configuration, testing, deployment, security hardening, streams, worker threads — is flagged **🔒 Coming Later — Outside This Module**. *I have only seen this one module file, so those flagged topics mean "not taught here," not a statement about what later modules contain.*
>
> **No module code or discussion prompt:** the module file you provided has a title ("Introduction to Backend Development") but no module code and no discussion prompt, so none is shown or invented here. Its quizzes are covered by the practice questions in Section 9.

> **✅ How this document was checked.** Every code sample in this document is a real file that was **run**, and every output block is the **exact output** it produced (paths shortened, `Date:` headers and timings will differ on your machine). The document is assembled from those files, so code and output cannot drift apart.
>
> | Tool | Version used |
> |---|---|
> | Node.js / npm | v24.22.1 / 10.9.7 (Linux) |
> | Python / Go / Java | 3.12.3 / 1.22.2 / OpenJDK 21.0.12.1 |
> | curl / Yarn | 8.5.0 / 1.22.22 (Yarn Classic) |
>
> **Not verified here** (labelled again where they appear): Windows and macOS specifics, the Node installers and version managers, anything that needs a real browser, pnpm and modern Yarn, the two videos, and the libuv thread-pool behaviour (the checking environment has a single CPU core, so it cannot show it). Facts taken from documentation or articles rather than from running code are marked as **(sourced)** or **(general knowledge)**.

---

## How this document is organized

Same documentation-first shape as the Angular notes: **What is it? → Why does it exist? → How does it work? → Syntax → Examples → When to use / not use → Try it yourself → Exercises → Common mistakes → Knowledge check.** Two running threads connect everything: the module's **restaurant-kitchen analogy** for the client-server model, and the **"Hello, this is my first Node.js server!"** server you build in Section 5.

If you worked through the Angular notes, you have already seen the *client* side of everything here. Where that helps, the text points back to it (for example, Angular's `HttpClient` calls are exactly what a backend answers).

## Table of Contents

- [Part 0 — Prerequisites: What You Need Before You Start](#part-0--prerequisites-what-you-need-before-you-start)
- [1. The Client-Server Model](#1-the-client-server-model)
- [2. The Backend Technology Landscape](#2-the-backend-technology-landscape)
- [3. Node.js Deep Dive](#3-nodejs-deep-dive)
- [4. Setting Up Your Local Environment](#4-setting-up-your-local-environment)
- [5. Hands-On Challenge: Your First Web Server](#5-hands-on-challenge-your-first-web-server)
- [6. Final Module Project: `my-first-server`](#6-final-module-project-my-first-server)
- [7. Quick Reference Sheet](#7-quick-reference-sheet)
- [8. Source & Resource Mapping](#8-source--resource-mapping)
- [9. Summative Practice Questions](#9-summative-practice-questions)
- [10. Glossary](#10-glossary)

---

## Part 0 — Prerequisites: What You Need Before You Start

You can start this module if you are comfortable with the four things below. Skim each subsection; if a "you should be able to" line doesn't describe you yet, work through that subsection with the examples before moving on. A short self-check is at the end (answers are in Section 9).

| Prerequisite | You should be able to… | Subsection |
|---|---|---|
| The command line | Open a terminal, move between folders, create files and folders, stop a running program | P1 |
| URLs, hosts and ports | Read a URL and say what each part means; explain what `localhost:3000` refers to | P2 |
| Everyday JavaScript | Read and write modern JavaScript: `const`/`let`, arrow functions, objects/arrays, destructuring, JSON, Promises and `async`/`await`, `import`/`require` | P3 |
| A few tools | Use a code editor, the browser's Network tab, and (optionally) `curl` | P4 |

### P1. Command-line basics

**What it is.** The terminal (also called the command line or shell) is a text interface where you type commands. **Why backend work needs it:** you start your server with a command, stop it with a keystroke, install packages with a command (`npm`), and read its log output in the terminal. There is no "run" button.

**The handful of commands you need:**

| What you want | macOS / Linux (bash, zsh) | Windows (PowerShell) *(not run here)* |
|---|---|---|
| Where am I? | `pwd` | `pwd` |
| List files | `ls` | `ls` (or `dir`) |
| Make a folder | `mkdir demo-folder` | `mkdir demo-folder` |
| Go into a folder | `cd demo-folder` | `cd demo-folder` |
| Go up one level | `cd ..` | `cd ..` |
| Write text to a file | `echo "hello" > notes.txt` | `echo "hello" > notes.txt` |
| Show a file | `cat notes.txt` | `cat notes.txt` (or `type`) |
| Delete a folder and its contents | `rm -r demo-folder` | `rm -r demo-folder` |

Here is a short session, run in a throw-away folder:

```bash
pwd
mkdir demo-folder
cd demo-folder
echo "hello" > notes.txt
ls
cat notes.txt
cd ..
ls
rm -r demo-folder
ls
```

and what it printed:

```text
~/work/cli
notes.txt
hello
demo-folder
```

Read it line by line: `pwd` printed where we were; `ls` showed the new file; `cat` printed its contents; after `cd ..` and `rm -r`, the last `ls` printed nothing because the folder was gone. (PowerShell's aliases make the Windows column mostly identical, but I did not run it on Windows.)

**Habits that save time:** press **Tab** to auto-complete names; press **↑** to recall earlier commands; press **Ctrl + C** to stop a program that is running in the terminal (you will use this every time you stop your server).

**Common mistakes**

| Wrong | Why it fails | Correct |
|---|---|---|
| Running `node server.js` from the wrong folder | Node looks for `server.js` in the *current* folder, so it reports that it can't find it | `pwd` to see where you are, `cd` to the project folder, then run it |
| Typing a command, then closing the terminal to "stop" it | The program may keep running in the background | Press **Ctrl + C** in the terminal where it is running |
| Pasting commands that start with `$` | The `$` in tutorials just shows the prompt; it is not part of the command | Type or paste the command without the leading `$` |

### P2. URLs, hosts and ports

**Why it matters here:** a server is *found* by an address, and the very first thing you will configure is which **port** your server listens on.

A URL has parts. Node can take one apart for us:

```javascript
const url = new URL('http://localhost:3000/products/42?sort=price&page=2#reviews');

console.log('protocol:', url.protocol);
console.log('hostname:', url.hostname);
console.log('port    :', url.port);
console.log('pathname:', url.pathname);
console.log('search  :', url.search);
console.log('hash    :', url.hash);
console.log('sort    :', url.searchParams.get('sort'));
console.log('page    :', url.searchParams.get('page'));
```

```text
protocol: http:
hostname: localhost
port    : 3000
pathname: /products/42
search  : ?sort=price&page=2
hash    : #reviews
sort    : price
page    : 2
```

| Part | Example above | Meaning |
|---|---|---|
| Protocol | `http:` | The language the two sides speak (HTTP here; `https:` is HTTP with encryption) |
| Host | `localhost` | *Which machine.* `localhost` always means "this computer" (it points at the loopback address `127.0.0.1`) |
| Port | `3000` | *Which program on that machine.* A machine can run many servers at once; each listens on its own port number |
| Path | `/products/42` | *Which thing* the client is asking for |
| Query string | `?sort=price&page=2` | Optional extra parameters, as `key=value` pairs separated by `&` |
| Fragment | `#reviews` | A position inside the page, used by the browser — **it is not sent to the server** (you will see this in Section 1.7) |

**Ports in one paragraph.** Think of the machine as an apartment building and each server as a flat: the host finds the building, the port finds the flat. Browsers assume port 80 for `http://` and 443 for `https://` when none is written *(general knowledge)*, and on Linux/macOS those low-numbered ports normally require administrator rights, which is why development servers use higher numbers such as `3000` (Node examples) or `4200` (the Angular dev server in the Angular notes) *(general knowledge)*.

### P3. The JavaScript you need

Backend JavaScript is the same language you already use — plus a few things that matter more on a server. Everything below was run; if any line surprises you, practise it before continuing.

**P3.1 Core syntax, objects and JSON.** Variables, template literals, functions, destructuring, spread, array methods, optional chaining (`?.`) and nullish coalescing (`??`), and JSON.

```javascript
// variables and template literals
const course = 'Backend Development';
let students = 25;
students += 1;
console.log(`${course} has ${students} students`);

// functions
function double(n) { return n * 2; }
const triple = (n) => n * 3;
console.log(double(4), triple(4));

// objects, destructuring, optional chaining, nullish coalescing
const user = { id: 1, name: 'Amina', roles: ['admin', 'editor'], address: { city: 'Lisbon' } };
const { name, roles: [firstRole] } = user;
console.log(name, firstRole);
console.log(user.address?.city, user.phone?.number ?? 'no phone');

// spread: copy-and-change without mutating the original
const updated = { ...user, name: 'Amina K.' };
console.log(updated.name, '/', user.name);

// array methods
const prices = [4.5, 12, 7.25];
console.log(prices.map((p) => p * 2));
console.log(prices.filter((p) => p > 5));
console.log(prices.reduce((sum, p) => sum + p, 0));

// JSON
const text = JSON.stringify(user);
console.log(text);
console.log(JSON.parse(text).address.city);
```

```text
Backend Development has 26 students
8 12
Amina admin
Lisbon no phone
Amina K. / Amina
[ 9, 24, 14.5 ]
[ 12, 7.25 ]
23.75
{"id":1,"name":"Amina","roles":["admin","editor"],"address":{"city":"Lisbon"}}
Lisbon
```

Why a backend cares: servers receive and send **JSON** constantly (`JSON.parse` / `JSON.stringify`); you will copy-and-change objects with spread instead of mutating them (the same habit as in the Angular notes); and `?.` / `??` keep one missing field from crashing a request.

**P3.2 Asynchronous code: callbacks, Promises, `async`/`await`.** A server spends most of its time *waiting* (for files, databases, other services), so asynchronous code is the normal case, not the exception. The same "get a user later" idea written three ways:

```javascript
// 1. callback style
function getUserCallback(id, callback) {
  setTimeout(() => callback(null, { id, name: 'Amina' }), 100);
}
getUserCallback(1, (err, user) => {
  if (err) return console.error(err);
  console.log('callback   :', user.name);
});

// 2. Promise style
function getUserPromise(id) {
  return new Promise((resolve) => setTimeout(() => resolve({ id, name: 'Amina' }), 200));
}
getUserPromise(1).then((user) => console.log('promise    :', user.name));

// 3. async/await style (the same Promises underneath)
async function main() {
  const user = await getUserPromise(1);
  console.log('async/await:', user.name);

  try {
    await Promise.reject(new Error('something failed'));
  } catch (err) {
    console.log('caught     :', err.message);
  }
}
main();

console.log('this line runs first');
```

```text
this line runs first
callback   : Amina
promise    : Amina
async/await: Amina
caught     : something failed
```

Notice that `this line runs first` printed **before** any of the results, even though `main()` was called earlier in the file: asynchronous work is *scheduled*, the current code carries on, and the results arrive later. Section 3 explains the machinery (the event loop) behind this ordering. `async`/`await` is just Promise code that reads top-to-bottom; `try`/`catch` handles a rejected Promise.

**P3.3 Modules: CommonJS and ES modules.** Node supports two module systems. You will meet both in tutorials, so recognise both. The two small pairs of files below were run as shown:

```javascript
function add(a, b) { return a + b; }
module.exports = { add };
```
```javascript
const { add } = require('./cjs-math.js');
console.log('CommonJS   :', add(2, 3));
```
```javascript
export function add(a, b) { return a + b; }
```
```javascript
import { add } from './esm-math.mjs';
console.log('ES modules :', add(2, 3));
```

```text
CommonJS   : 5
ES modules : 5
```

| | CommonJS | ES modules |
|---|---|---|
| Export | `module.exports = { add }` | `export function add(…)` |
| Import | `const { add } = require('./cjs-math.js')` | `import { add } from './esm-math.mjs'` |
| File extension | `.js` (the default unless told otherwise) | `.mjs`, **or** `.js` when `package.json` contains `"type": "module"` |

Both examples print the same result; which one a project uses is a configuration choice. This document uses CommonJS (`require`) for most examples and shows the ES-module version of the first server, because the module's own challenge says "import the native `http` module" — both are valid.

### P4. Tools you will use

| Tool | What it's for | Notes |
|---|---|---|
| A code editor | Writing `.js` files | Any editor works; one with a built-in terminal is convenient |
| A terminal | Running `node`, `npm`, `curl` | P1 |
| A browser + DevTools **Network** tab | Seeing the requests your browser sends and the responses it gets | You met this in the Angular notes (HTTP module) |
| `curl` | Sending requests from the terminal and printing the raw response (`curl -i` shows headers) | Used throughout this document. It ships with macOS and most Linux systems; recent Windows versions include a `curl.exe` *(general knowledge, not verified here)* |
| *(optional)* Postman or similar | Point-and-click API testing | Not required; `curl` is enough for this module |

### P5. If you worked through the Angular notes

You already know the *client* half of this module. Here is the other half of each thing you did:

| In the Angular notes (client side) | What the backend does (server side) |
|---|---|
| `http.get<Task[]>('/api/boards/42/tasks')` (`HttpClient`) | Receives `GET /api/boards/42/tasks` and decides what to send back |
| Reading `error.status === 401` in an interceptor | The server chooses the status code (`401`, `404`, `500`…) |
| `Authorization: Bearer …` header added by an interceptor | The server reads `req.headers.authorization` and decides whether to trust it |
| `JSON` request bodies in `post()`/`put()` | The server reads the body and parses it (Section 5.5) |
| `ng serve` on port 4200 | Your Node server on port 3000 — a *different* program on a *different* port |
| A service holding data and logic | A server module holding data and logic (the same separation-of-concerns idea) |

> 🔒 **Heads-up (not covered here):** when an Angular app served from `localhost:4200` calls an API on `localhost:3000`, browsers apply **cross-origin (CORS)** rules, and the server must opt in. That is a topic for later; it is mentioned now only so the error doesn't surprise you.

### P6. Prerequisite self-check

Answer these without looking anything up. If you miss more than two, revisit the matching subsection. (Answers: Section 9.)

1. Which command shows the folder you are currently in?
2. What does `cd ..` do?
3. In `http://localhost:3000/products/42?sort=price`, what are the host, the port, the path and the query string?
4. Which part of a URL is never sent to the server?
5. What does `localhost` mean?
6. What is the output order of: `console.log('A'); setTimeout(() => console.log('B'), 0); console.log('C');`?
7. Rewrite `const user = { name: 'Amina', age: 30 }; const name = user.name;` using destructuring.
8. What does `JSON.parse('{"a":1}').a` evaluate to?
9. What is the difference between `require` and `import`, and which file extension makes Node treat a file as an ES module without any other configuration?
10. In an `async` function, what happens at the line `const user = await getUser(1);`?

---

## 1. The Client-Server Model

*(Module lesson 1 — Video + Reading. Outcome: explain the request/response cycle and the role of an API.)*

### 1.1 What is the client-server model?

The **client-server model** is the way most of the web is organised: one program — the **client** — *asks* for something, and another program — the **server** — *listens* for requests and *answers* them.

- A **client** is anything that sends requests: a web browser, a mobile app, an Angular application running in the browser, a command-line tool such as `curl`.
- A **server** is a program that waits for requests and responds. People also use "server" for the *machine* it runs on, but the model is about **programs**: your own laptop can run a server (that is what `localhost` is for).
- A **backend** is the server-side part of an application — the code that runs on a machine you control, out of the user's sight. The **frontend** is the part that runs on the user's device (in the Angular notes, everything you built).

**The kitchen analogy** (the module's own framing) maps neatly onto the model:

| In the restaurant | In a web application |
|---|---|
| The diner | The **client** (browser or app) |
| The menu — what you may order and how | The **API** — the list of requests a client may make and the shape of each |
| An order ticket | An HTTP **request** |
| The waiter carrying orders and plates | The network and the **HTTP** protocol |
| The kitchen, out of the diner's sight | The **backend** |
| The pantry and fridge | The **database** (where data is stored) |
| The chef's rules: allergies, portion sizes, "we don't serve that" | **Business logic** and **validation** |
| "Staff only" door, checking who is allowed in | **Authentication** and **authorization** |
| The plated dish | The HTTP **response** |

The diner never walks into the kitchen, and doesn't need to know how the pasta is made — only what is on the menu. That separation is the whole idea.

### 1.2 Why have a backend at all?

Why can't the frontend do everything? Four reasons:

1. **Trust and security.** Code running in the browser can be read and altered by the person using it. Secrets (database passwords, payment keys) and rules ("is this price really €5?") must live somewhere users cannot change. This is why *frontend validation is for convenience; backend validation is for correctness* — the form validation you wrote in the Angular notes helps the user, but the server must still check.
2. **Shared data.** Many users need the *same* Kanban board. That data cannot live inside one person's browser; it needs one authoritative place.
3. **Privileged or heavy work.** Talking directly to databases, sending email, charging a card, calling other services with secret credentials — these belong on the server.
4. **Many clients, one source of truth.** A website, a mobile app and a partner's script can all use the same backend instead of each reimplementing the rules.

### 1.3 The request/response cycle

Every interaction follows the same loop:

```
Client (browser / app)                              Server (your Node program)
        │                                                    │
        │  1. something happens (click, page load) and the   │
        │     client builds a REQUEST                        │
        │ ───────────────  HTTP request  ──────────────────► │
        │     GET /api/boards/42/tasks                       │  2. the server receives it and
        │                                                    │     runs code: checks, reads
        │                                                    │     the database, decides
        │ ◄──────────────  HTTP response  ────────────────── │  3. the server builds a RESPONSE
        │     200 OK  +  a JSON body                         │
        │  4. the client uses the response                   │
        │     (renders the UI, shows an error, …)            │
```

Two properties of this loop matter later:

- **The client starts every exchange.** In plain HTTP the server answers; it does not call the browser on its own. (Techniques where the server pushes data, such as WebSockets, are 🔒 outside this module.)
- **Each request stands alone.** HTTP does not remember earlier requests; anything the server needs to know ("who is this user?") must arrive *with* the request — which is why the Angular notes' interceptor attached an `Authorization` header to every call.

Underneath, before the request is sent, the browser works out the server's network address from its name (DNS), opens a connection (TCP, plus TLS for `https`) and then sends the request *(general knowledge, simplified)*. You will not have to manage any of that; Node does it.

### 1.4 What does a backend actually do?

| Responsibility | Example in the Kanban app |
|---|---|
| **Receive and route requests** | Decide that `POST /api/boards/42/tasks` means "create a task" |
| **Business logic** | A task title can't be empty; a done task can't be edited |
| **Validate input** | Reject a request whose body isn't valid JSON or lacks a title |
| **Store and fetch data** | Save tasks, read all tasks for board 42 |
| **Authentication / authorization** | Check who is calling and whether they may touch this board |
| **Talk to other systems** | Send an email when a task is assigned |
| **Shape the response** | Return the right status code and a clean JSON body |

In this module you build only the first and last rows — receive a request and answer it — because everything else rests on them. The rest (storage, authentication, validation rules…) is 🔒 later work.

### 1.5 What is an API?

An **API** (application programming interface) is a **contract**: it states which requests a client may send and what comes back. A *web API* (HTTP API) is that contract expressed as URLs, HTTP methods and data formats — usually JSON.

You have already *used* one. In the Angular notes, a service called:

```text
GET    /api/boards/42/tasks        → list the tasks on board 42
POST   /api/boards/42/tasks        → create a task
PATCH  /api/boards/42/tasks/7      → update part of task 7
DELETE /api/boards/42/tasks/7      → delete task 7
```

Those four lines *are* the menu. The Angular app is the diner; the program that answers them is the backend you are learning to build. The client does not care *how* the answer is produced (Node, Python, Java, Go — Section 2 shows the same server in all four), only that it keeps the contract.

### 1.6 Where does each piece of code run?

| Code | Runs on | Who controls it |
|---|---|---|
| Your Angular app (HTML/CSS/JavaScript/TypeScript) | The **user's browser** | The user can inspect and modify it |
| Your Node.js server | A **machine you control** (your laptop now; a hosted server later) | You |
| The database | A machine you control | You |

A **full-stack** developer works on both sides. Node.js's headline benefit for you is that the server side can be written in the *same language* you already use in the browser (Section 2.4).

### 1.7 A real request and response, from the server's point of view

Section 5 builds a small "inspector" server that prints what it receives. For now, just read the result. This is a request sent with `curl -v` (so the request lines, marked `>`, and the response lines, marked `<`, are both visible):

```text
> GET /products/42?sort=price HTTP/1.1
> Host: localhost:3000
> User-Agent: curl/8.5.0
> Accept: */*
> X-Demo: hello
> 
< HTTP/1.1 200 OK
< Content-Type: application/json
< Date: Sat, 24 Oct 2026 11:39:57 GMT
< Connection: keep-alive
< Keep-Alive: timeout=5
< Transfer-Encoding: chunked
< 
```

**Reading the request** (the lines starting with `>`):

- `GET /products/42?sort=price HTTP/1.1` is the **request line**: the *method*, the *target* (path plus query string) and the protocol version. We asked for `…#reviews` too, but **the `#reviews` fragment is absent** — it never left the client (this confirms the P2 table).
- `Host`, `User-Agent`, `Accept` and our custom `X-Demo` are **headers**: metadata about the request. `User-Agent` shows `curl/8.5.0` — the client announcing itself. `Host` says which site is being asked for (one server can host several).
- The blank line ends the headers. A `GET` has no body.

**Reading the response** (the lines starting with `<`):

- `HTTP/1.1 200 OK` is the **status line**: the protocol, a three-digit **status code** (200 = success) and a reason phrase.
- `Content-Type: application/json` tells the client how to read the body. `Date` and `Connection`/`Keep-Alive` are connection housekeeping.
- `Transfer-Encoding: chunked` means the body's length was not announced up front, so Node sent it in pieces. You don't need to manage that yet; it is what Node chose here.

The body itself (what the server saw, echoed back as JSON) and the server's own log:

```text
{
  "method": "GET",
  "url": "/products/42?sort=price",
  "headers": {
    "host": "localhost:3000",
    "user-agent": "curl/8.5.0",
    "accept": "*/*",
    "x-demo": "hello"
  }
}
```

```text
inspector running on http://localhost:3000
GET /products/42?sort=price  (HTTP/1.1)
  host      : localhost:3000
  user-agent: curl/8.5.0
GET /products/42?sort=price  (HTTP/1.1)
  host      : localhost:3000
  user-agent: curl/8.5.0
```

The server saw exactly what the client sent — and the log lines were printed by *your* code running on the server. The browser equivalent of all this is the **Network** tab you used in the Angular notes.

### 🐞 Common misconceptions

| Misconception | Reality |
|---|---|
| "The frontend already validated it, so the backend needn't." | Anyone can send a request without your frontend at all (as `curl` just did). The server must validate. |
| "The backend *is* the database." | A database is one thing a backend talks to. The backend is the program with the logic. |
| "A server is a special kind of computer." | A server is a **program**. Your laptop runs one at `localhost`. |
| "The server can message the browser whenever it likes." | In plain HTTP the client asks first. Server push needs other techniques (🔒 later). |
| "The `#fragment` in the URL reaches the server." | It doesn't — shown above. |

### ✅ Knowledge Check
1. In the kitchen analogy, what plays the role of the API, and what plays the role of the backend?
2. Give two reasons validation must happen on the server even if the frontend already validates.
3. Who always starts a request/response exchange?
4. In `GET /products/42?sort=price HTTP/1.1`, name the method, the path and the query string.
5. Why does the Angular `HttpClient` code you wrote need a backend that keeps a *contract*?

---

## 2. The Backend Technology Landscape

*(Module lesson 2 — Video + Reading. Outcome: compare Node.js with other runtimes such as Python, Java and Go.)*

### 2.1 What does "backend technology" mean?

People mix several different things under one name. Keep them apart:

| Term | Meaning | Example for JavaScript | Example for Python | Example for Java |
|---|---|---|---|---|
| **Language** | The syntax and rules you write | JavaScript (and TypeScript) | Python | Java |
| **Runtime** | The program that *runs* the language | **Node.js** | CPython | The JVM |
| **Framework** | A library that structures your app (routing, middleware…) | Express, Fastify, NestJS 🔒 | Django, Flask, FastAPI | Spring Boot |
| **Package manager** | Installs shared libraries | npm | pip | Maven / Gradle |

The module's key takeaway about Node.js: **Node.js is a runtime environment for JavaScript, not a framework.** It lets JavaScript run *outside* the browser and gives it tools a server needs (networking, files); frameworks such as Express are separate libraries built *on* Node. (Go is slightly different: it compiles your program into a native executable, so the "runtime" is built into the program.)

### 2.2 The same server in four languages

The best way to compare is to build the *same thing*: a server on port 3000 that answers every request with one sentence. I ran each of these; the output after each is the real response (`curl -i`).

**Node.js** (the one you will build in Section 5):

```javascript
const http = require('node:http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello, this is my first Node.js server!');
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000/');
});
```

**Python** — standard library only (`python3 hello.py`):

```python
from http.server import BaseHTTPRequestHandler, HTTPServer

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/plain')
        self.end_headers()
        self.wfile.write(b'Hello, this is my first Python server!')

HTTPServer(('', 3000), Handler).serve_forever()
```

```text
HTTP/1.0 200 OK
Server: BaseHTTP/0.6 Python/3.12.3
Date: Sat, 24 Oct 2026 11:41:36 GMT
Content-Type: text/plain

Hello, this is my first Python server!
```

**Go** — standard library only (`main.go`; I compiled with `go build` and ran the binary, and `go run main.go` does both in one step):

```go
package main

import (
	"fmt"
	"net/http"
)

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, "Hello, this is my first Go server!")
	})
	http.ListenAndServe(":3000", nil)
}
```

```text
HTTP/1.1 200 OK
Date: Sat, 24 Oct 2026 11:41:52 GMT
Content-Length: 34
Content-Type: text/plain; charset=utf-8

Hello, this is my first Go server!
```

**Java** — the JDK's built-in simple HTTP server (`java Server.java`, which compiles and runs a single file in recent JDKs):

```java
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;

public class Server {
    public static void main(String[] args) throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress(3000), 0);
        server.createContext("/", exchange -> {
            byte[] body = "Hello, this is my first Java server!".getBytes();
            exchange.getResponseHeaders().add("Content-Type", "text/plain");
            exchange.sendResponseHeaders(200, body.length);
            exchange.getResponseBody().write(body);
            exchange.close();
        });
        server.start();
    }
}
```

```text
HTTP/1.1 200 OK
Date: Sat, 24 Oct 2026 11:42:00 GMT
Content-type: text/plain
Content-length: 36

Hello, this is my first Java server!
```

**What this shows**

- All four are doing the *same* job — listen, receive a request, send a response — so the client cannot tell which language answered except through small clues. Look at the headers: Python's built-in server announced itself with a `Server:` header and replied with `HTTP/1.0`; Go set `Content-Length` itself and added `charset=utf-8` to the content type *even though the code never mentioned a content type*; Java sent a `Content-length` header. Node (Section 1.7) used chunked transfer encoding.
- They differ in *ceremony*: Node and Python are short and dynamic; Go and Java are statically typed and a little more explicit.
- These are all **built-in, demo-grade servers**. Python's own documentation describes its `http.server` module as not meant for production *(general knowledge)*; real projects use a framework or production-grade server for each language (🔒 later).

### 2.3 Comparing the four

> **Read this table as a summary of general characteristics, not a benchmark.** It comes from general knowledge, and I did **not** measure performance. How fast a backend is depends far more on how it is designed (queries, caching, blocking) than on its language.

| | **Node.js** | **Python** | **Java** | **Go** |
|---|---|---|---|---|
| Language & typing | JavaScript — dynamic (TypeScript adds optional static types) | Python — dynamic (optional type hints) | Java — static | Go — static |
| How code runs | V8 engine runs JavaScript | Interpreted by CPython (compiled to bytecode first) | Compiled to bytecode that runs on the JVM | Compiled to a native executable |
| Typical concurrency model | One JavaScript thread plus an **event loop** and asynchronous I/O (Section 3) | Threads (the standard CPython build uses a global interpreter lock) and/or `asyncio` | Threads; Java 21 added lightweight *virtual threads* | **Goroutines** scheduled by the Go runtime |
| Common web frameworks | Express, Fastify, NestJS | Django, Flask, FastAPI | Spring Boot | Standard library `net/http`; Gin, Echo, Chi |
| Package ecosystem | npm registry | PyPI (via pip) | Maven Central (via Maven/Gradle) | Go modules |
| Often chosen for | I/O-heavy APIs, real-time features, teams sharing one language across frontend and backend | Data/ML-adjacent services, scripting, quick development | Large, long-lived enterprise systems with mature tooling | High-throughput network services, small deployable binaries, cloud tooling |
| Typical caution | CPU-heavy work on the main thread blocks every request (Section 3.8) | CPU-bound threads are limited by the GIL in the standard build | More verbose; heavier to start (general tendency) | Smaller web-framework ecosystem than the others (general tendency) |

Python has been adding optional builds without the GIL, so check Python's current documentation before quoting that row. Other widely used backend stacks exist too — for example C# with ASP.NET Core, PHP with Laravel, and Ruby with Rails.

### 2.4 Choosing a technology — and why Node.js here

There is no "best" backend language. Teams usually decide on **who will maintain it, what the ecosystem offers, and what the problem looks like**, not on a language's reputation.

| Scenario | A reasonable default | Why (general reasoning) |
|---|---|---|
| A REST API for the Kanban frontend, built by the same small team | **Node.js** | Same language as the frontend; huge npm ecosystem; I/O-bound work suits the event loop |
| Real-time notifications to many connected users | **Node.js** or **Go** | Many mostly-idle connections are what event-driven or goroutine models handle well |
| A service that serves machine-learning models | **Python** | The ML libraries live there |
| A core banking system maintained by a very large team for decades | **Java** | Mature tooling, strong typing, a deep enterprise ecosystem |
| A tiny network service shipped as one binary | **Go** | Compiles to a single executable |

**Why this course uses Node.js** (consistent with the module's own resource): millions of frontend developers already write JavaScript, so Node lets them write server code **without learning a different language**; Node's standard library has first-class networking; and its non-blocking design handles many concurrent connections without you managing threads.

**When Node.js needs care:** CPU-heavy work (image processing, big computations) on the main thread blocks *every* request — Section 3.8 demonstrates this with a real timing. Such work is normally moved elsewhere (🔒 worker threads and other techniques are outside this module).

### Exercises

**Level 1 — Basic:** Without looking, fill in a blank table with the headings *Language*, *Runtime*, *Framework*, *Package manager* for Node.js, Python and Java, then check it against Section 2.1.

**Level 2 — Practical:** For each scenario, pick a backend technology and write two sentences of reasoning: (a) a student-project API consumed by an Angular app; (b) a nightly job that trains a model on sales data; (c) a chat service with 50,000 open connections.

**Level 3 — Challenge:** Run the Python server above and the Node server from Section 5 (one at a time, on port 3000), request each with `curl -i localhost:3000`, and write down three differences in the response headers. Then explain why a browser user would never notice them.

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| "Node.js is a framework" | Node is a **runtime**; frameworks are separate libraries on top | Say "Node.js runtime" and "Express framework" |
| "Node.js is a programming language" | The language is JavaScript; Node is the environment that runs it outside the browser | JavaScript is the language, Node.js the runtime |
| "Language X is always faster" | Real speed depends on design, I/O and caching far more than language | Compare for the specific workload, and measure |
| Choosing a stack only because it is popular | Team skills, ecosystem and the problem matter more | Decide on maintainability and fit |

### ✅ Knowledge Check
1. Name the language, runtime, framework and package manager in the "JavaScript on the server" stack.
2. Why is it correct to say "Node.js is a runtime, not a framework"?
3. In Section 2.2, how could you tell the Python server's response apart from the Go server's, even though both said "Hello"?
4. Give one workload where Node.js is a natural fit and one where it needs special care.
5. Why can't a table like the one in Section 2.3 settle "which language is fastest"?

---

## 3. Node.js Deep Dive

*(Module lesson 3 — Video + Reading. Outcome: describe the event loop, blocking vs. non-blocking I/O, and npm.)*

### 3.1 What Node.js is

**Node.js is an open-source, cross-platform JavaScript *runtime environment*** that runs JavaScript outside the browser. According to the official introduction (the first resource in your module), it runs the **V8** JavaScript engine — the same engine at the core of Google Chrome — and a Node app runs in a **single process, without creating a new thread for every request**. Its standard library provides **asynchronous I/O** building blocks, so blocking is "the exception rather than the norm," which lets one server handle many concurrent connections without you managing threads.

```text
        Your JavaScript code
                │
        ┌───────┴─────────────── Node.js ──────────────────────────────┐
        │  Standard library: http · fs · events · crypto · path · …    │
        │  libuv: the event loop, asynchronous I/O, a small thread pool│
        │  V8: executes the JavaScript                                 │
        └───────────────────────────────┬──────────────────────────────┘
                                        │
                     Operating system: network, files, timers
```

| Node.js **is** | Node.js is **not** |
|---|---|
| A **runtime** that executes JavaScript outside a browser | A programming language (the language is JavaScript) |
| A standard library for networking, files, crypto and more | A web framework (Express and others are separate libraries) |
| Bundled with **npm**, the package manager (Section 3.10) | Something that gives you a web page, a database or authentication automatically |

### 3.2 Node.js vs. the browser

Same language, different environment. This tiny script asks "what exists here?" — run with Node:

```javascript
console.log('window     :', typeof window);
console.log('document   :', typeof document);
console.log('process    :', typeof process);
console.log('fetch      :', typeof fetch);
console.log('globalThis :', typeof globalThis);
console.log('Node       :', process.version);
console.log('platform   :', process.platform);
```

```text
window     : undefined
document   : undefined
process    : object
fetch      : function
globalThis : object
Node       : v24.22.1
platform   : linux
```

| | Browser | Node.js |
|---|---|---|
| `window`, `document` (the page) | Exist | **Don't exist** (`undefined` above) |
| `process` (info about the running program) | Doesn't exist | **Exists** |
| `fetch` | Exists | Exists (it printed `function`) |
| Can read files and open network *servers* | No (sandboxed) | **Yes** — that is the point |
| Which JavaScript version you get | Whatever the user's browser supports | **You choose** by choosing the Node version |
| DOM, CSS, clicking, rendering | Yes | None of it |

This is why Angular code (which manipulates the DOM) can't run in Node as-is, and why a server can do things — read a database, open a port — a browser is forbidden to.

### 3.3 Running code and talking to the process

You run a file with `node filename.js`. Running `node` with no file opens an interactive prompt (the REPL) for experiments *(not demonstrated here)*. The global `process` object lets a program read what was passed to it:

```javascript
console.log('args    :', process.argv.slice(2));
console.log('GREETING:', process.env.GREETING ?? '(not set)');
```

Run as `GREETING=hello node c2-process.js one two` (on Windows PowerShell, set the variable first with `$env:GREETING = "hello"`) *(the Windows form was not run)*:

```text
args    : [ 'one', 'two' ]
GREETING: hello
```

- `process.argv.slice(2)` — the **arguments** after the script name.
- `process.env.GREETING` — an **environment variable**: configuration supplied from *outside* the code. In Section 5 you will use one (`PORT`) so the same code can run on different ports without being edited.

### 3.4 Modules: `require`, `import` and the `node:` prefix

Section P3.3 showed CommonJS and ES modules. One more detail you will see in every modern example: the **`node:` prefix** (`node:http`, `node:fs`) explicitly marks a *built-in* module, so it can never be confused with an npm package of the same name. It refers to exactly the same module:

```javascript
console.log('require("http") === require("node:http") ->', require('http') === require('node:http'));
```

```text
require("http") === require("node:http") -> true
```

So `require('http')` and `require('node:http')` both work; the prefix is the recommended explicit form, and this document uses it.

### 3.5 Event-driven architecture

Node is **event-driven**: instead of running top to bottom and finishing, a program *registers listeners* ("when X happens, run this function") and the runtime calls them when events occur. Node's building block for this is the **`EventEmitter`**:

```javascript
const EventEmitter = require('node:events');
const http = require('node:http');

const kitchen = new EventEmitter();
kitchen.on('order', (dish) => console.log('cooking:', dish));
kitchen.on('order', (dish) => console.log('logging:', dish));
kitchen.emit('order', 'pasta');

const server = http.createServer();
console.log('http server is an EventEmitter?', server instanceof EventEmitter);
server.on('request', (req, res) => res.end('hi'));
console.log('listeners for "request":', server.listenerCount('request'));
```

```text
cooking: pasta
logging: pasta
http server is an EventEmitter? true
listeners for "request": 1
```

- `kitchen.on('order', fn)` registers a listener; `kitchen.emit('order', 'pasta')` fires the event, and *both* listeners ran, in the order they were registered.
- **The HTTP server is itself an event emitter** (`true` above). The function you pass to `http.createServer(handler)` is simply the listener for the server's **`'request'` event** — `server.on('request', …)` has the same effect. Every incoming request is an event; your handler is the recipe the kitchen follows each time a ticket arrives.

### 3.6 Blocking vs. non-blocking I/O

**Blocking** means the program *stops and waits* for an operation to finish before running the next line. **Non-blocking** means it *starts* the operation, carries on, and is *called back* when the operation completes. The same file read, both ways:

```javascript
const fs = require('node:fs');

console.log('--- blocking: readFileSync ---');
console.log('before');
const data = fs.readFileSync(__filename, 'utf8');
console.log('read', data.length, 'characters');   // runs only AFTER the read has finished
console.log('after');

console.log('--- non-blocking: readFile ---');
console.log('before');
fs.readFile(__filename, 'utf8', (err, text) => {
  if (err) throw err;
  console.log('read', text.length, 'characters');  // runs LATER, called back by the event loop
});
console.log('after');
```

```text
--- blocking: readFileSync ---
before
read 529 characters
after
--- non-blocking: readFile ---
before
after
read 529 characters
```

In the blocking half, `read…` printed *between* `before` and `after`: the program waited. In the non-blocking half, `after` printed **before** `read…`: the read was started, the program moved on, and the callback ran later.

Node offers three styles of the same API, and `fs` is a good example:

| Style | Example | Blocks? |
|---|---|---|
| Synchronous | `fs.readFileSync(path)` | **Yes** |
| Callback | `fs.readFile(path, callback)` | No |
| Promise (use with `await`) | `await fs.promises.readFile(path)` or `require('node:fs/promises')` | No |

The Promise style reads like blocking code but isn't — only *this function* waits, not the whole program:

```javascript
const fs = require('node:fs/promises');

async function main() {
  console.log('before');
  const text = await fs.readFile(__filename, 'utf8');   // waits WITHOUT blocking the event loop
  console.log('read', text.length, 'characters');
  console.log('after');
}

main();
console.log('main() has been called');
```

```text
before
main() has been called
read 311 characters
after
```

`main() has been called` printed **before** `read…`: `await` paused `main()` only, and the rest of the program carried on.

**Rule of thumb:** in code that handles requests, use the callback or Promise form and avoid the `…Sync` functions. A `…Sync` call is fine at *startup* (for example, reading a config file once before the server starts listening), because nothing else is waiting yet. Section 3.8 shows what goes wrong otherwise.

### 3.7 The event loop

**The event loop is what lets Node do non-blocking I/O even though your JavaScript runs on a single thread.** It hands slow work (network, files, timers) to the operating system and the runtime, and when that work finishes it queues a callback; the loop runs your callbacks **one at a time**.

**Kitchen picture:** one chef (the single JavaScript thread) works through order tickets one at a time. Slow jobs — waiting for the oven, a delivery — are handled by helpers outside the kitchen (the operating system), who put a ticket back on the rail when done. The chef never *waits* by the oven; but if the chef spends two hours chopping on one ticket, **no other ticket moves** (Section 3.8).

**The phases.** According to the official event-loop documentation, each pass of the loop moves through these phases, each with its own queue of callbacks:

```text
   timers  ──►  pending callbacks  ──►  idle, prepare  ──►  poll  ──►  check  ──►  close callbacks
     ▲                                                                                   │
     └───────────────────────────────────────────────────────────────────────────────────┘
```

| Phase | What runs there |
|---|---|
| **timers** | Callbacks from `setTimeout` / `setInterval` whose time has come |
| **pending callbacks** | Some deferred system-level callbacks (for example certain TCP errors) |
| **idle, prepare** | Internal use only |
| **poll** | New I/O events and most I/O callbacks — incoming requests and data, finished file reads. The loop may *wait* here when nothing else is ready |
| **check** | `setImmediate` callbacks |
| **close callbacks** | `'close'` events, for example from an abruptly closed socket |

Two details from the documentation worth knowing: a timer's delay is a **minimum threshold**, not a promise ("no sooner than 100 ms" — a busy thread makes it later), and since Node 20 (libuv 1.45) timers are checked after the poll phase in each pass. An incoming HTTP request is an I/O event handled in the **poll** phase, which is when your `'request'` handler runs.

**Outside the phases:** `process.nextTick` callbacks and Promise callbacks (`.then`, code after `await`) run *between* operations, not in a phase of their own — the documentation notes `nextTick` isn't technically part of the loop at all. The order below was measured, not just read.

**Experiment 1 — CommonJS script:**

```javascript
console.log('1. script start (synchronous)');

setTimeout(() => console.log('   setTimeout 0   (timers phase)'), 0);
setImmediate(() => console.log('   setImmediate   (check phase)'));
Promise.resolve().then(() => console.log('4. promise .then (microtask)'));
process.nextTick(() => console.log('3. process.nextTick'));

console.log('2. script end (synchronous)');
```

```text
1. script start (synchronous)
2. script end (synchronous)
3. process.nextTick
4. promise .then (microtask)
   setImmediate   (check phase)
   setTimeout 0   (timers phase)
```

I ran it 30 times:

```text
distinct outputs for the first four lines across 30 runs (count, fingerprint):
     30 96a34606
order of the last two lines across 30 runs:
     24 setImmediate>setTimeout 0
      6 setTimeout 0>setImmediate
```

- The **first four lines were identical in all 30 runs**: synchronous code first, then `process.nextTick`, then the Promise callback.
- `setTimeout 0` vs `setImmediate` is **not guaranteed** when both are scheduled from the main script. The official documentation says the order is non-deterministic there; on this machine `setImmediate` happened to come first 24 times out of 30 and `setTimeout` first 6 times. Don't write code that depends on it.

**Experiment 2 — the same code as an ES module (`.mjs`):**

```text
1. script start (synchronous)
2. script end (synchronous)
4. promise .then (microtask)
3. process.nextTick
   setImmediate   (check phase)
   setTimeout 0   (timers phase)
```

```text
ES module, 20 runs: order of the nextTick and promise lines
     20 promise .then>process.nextTick
```

**In an ES module, the Promise callback ran *before* `process.nextTick`** — all 20 runs — the opposite of the CommonJS result. The usual explanation is that an ES module's top-level code itself runs as part of Promise handling, so the Promise queue drains first *(an explanation, not something I tested separately)*. The practical lesson: **don't build logic that depends on the relative order of `nextTick` and Promise callbacks**, and know that module type can change it. The official documentation recommends using `setImmediate` in all cases rather than `nextTick`, because it is easier to reason about.

**Experiment 3 — inside an I/O callback:**

```javascript
const fs = require('node:fs');

fs.readFile(__filename, () => {
  setTimeout(() => console.log('timeout'), 0);
  setImmediate(() => console.log('immediate'));
});
```

```text
immediate
timeout
```

```text
order inside an I/O callback, 30 runs:
     30 immediate>timeout
```

Here the order **is** guaranteed: from inside an I/O callback, `setImmediate` runs before any timer — 30 out of 30 here, matching the documentation. (The loop is in the poll phase when your callback runs, and the check phase — where `setImmediate` runs — comes next.)

**Summary of what runs when:**

| Order | What | Notes |
|---|---|---|
| 1 | The synchronous code of your script | Always runs to completion first |
| 2 | Microtask-style callbacks: `process.nextTick` and Promise `.then` | Between operations. Relative order differs between CommonJS and ES modules (measured above) |
| 3 | Event-loop phases: timers → pending → poll → check → close | `setTimeout`/`setImmediate` order is only guaranteed inside an I/O callback |

### 3.8 Seeing blocking hurt

Reading about "don't block the event loop" is easy to forget; measuring it is not. This server has three routes: `/fast` answers instantly; `/blocking` burns the CPU for 2 seconds; `/waiting` also takes 2 seconds but only *waits* on a timer:

```javascript
const http = require('node:http');

function busyWait(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) { /* burn CPU: nothing else can run meanwhile */ }
}

const server = http.createServer((req, res) => {
  if (req.url === '/blocking') {
    busyWait(2000);                                           // blocks the ONE thread for 2 s
    res.end('done blocking\n');
  } else if (req.url === '/waiting') {
    setTimeout(() => res.end('done waiting\n'), 2000);        // also 2 s, but does NOT block
  } else {
    res.end('fast\n');
  }
});

server.listen(3000, () => console.log('listening on http://localhost:3000'));
```

With the server running, I started a slow request, 0.3 s later made a `/fast` request, and timed it — once while `/blocking` was running and once while `/waiting` was pending:

```text
fast request while /blocking is running : 1.710609s
fast request while /waiting is pending  : 0.000761s
```

*(Your numbers will differ; the pattern won't.)*

- **While `/blocking` ran, a request for `/fast` took about 1.7 seconds.** The single thread was busy in a loop, so it couldn't even *accept* the second request until the loop finished. One slow handler froze the server for everyone.
- **While `/waiting` was pending, `/fast` answered in under a millisecond.** A timer wait is not work — the thread was free, so other requests were served in the meantime.

**Lessons:**

1. **Asynchronous ≠ parallel.** Your callbacks still run one at a time; "non-blocking" only means the thread isn't stuck *waiting*.
2. **Keep every request handler short.** Slow I/O is fine (use async APIs); slow CPU work is not.
3. **CPU-heavy work does not belong on the main thread** — it is normally moved elsewhere (🔒 worker threads and other techniques are outside this module).

### 3.9 "But isn't Node single-threaded?"

The precise answer: **your JavaScript runs on one thread, but Node as a whole is not limited to one thread.**

- Network I/O is handled by the operating system, which tells Node when data arrives.
- Some operations that the OS can't do asynchronously — certain **file-system** calls, `dns.lookup`, some **crypto** (such as `pbkdf2`, `scrypt`) and **zlib** compression — run on a small **libuv thread pool**, which by default has **4 threads** and can be changed with the `UV_THREADPOOL_SIZE` environment variable *(sourced from several articles; I could not demonstrate it here because the checking environment has one CPU core)*. Your *callback* still runs on the main thread.
- True parallel JavaScript uses **worker threads** (🔒 outside this module).

### 3.10 npm and `package.json`

**npm** is Node's package manager and the registry of shared libraries; Node installers include it. A **package** is a folder of code plus a `package.json` describing it. (Node installers include npm *(general knowledge)*; on the checking machine `npm -v` printed a version — Section 4.1.) Every Node project has a `package.json`: it is the project's identity card and its list of dependencies.

**Creating one — `npm init -y`.** In an empty folder (named `npm-demo` here), I ran this and got:

```text
Wrote to ~/my-first-server/package.json:

{
  "name": "npm-demo",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}
```

(`-y` means "answer yes to every question with the default".) The fields:

| Field | Meaning |
|---|---|
| `name`, `version` | The project's name (taken from the folder) and version |
| `description`, `keywords`, `author`, `license` | Metadata; `ISC` is npm's default license |
| `main` | The default entry file (used when this project is imported as a package) |
| `scripts` | Named shortcut commands — see next |

Other npm versions may add or default a few fields differently (for example around module type), so don't worry if yours isn't identical.

**Scripts.** I added two with `npm pkg set` (editing the file by hand does the same):

```json
{
  "name": "npm-demo",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}
```

Now `npm start` runs `node server.js`. With the first-server code saved as `server.js`:

```text

> npm-demo@1.0.0 start
> node server.js

Server running at http://localhost:3000/
```

and, from another terminal, `curl localhost:3000/` returned:

```text
Hello, this is my first Node.js server!
```

`start` and `test` have shortcuts (`npm start`, `npm test`); any other script is run with `npm run <name>` — so `npm run dev` would run `node --watch server.js` *(general knowledge; `node --watch` itself is demonstrated in Section 4.5)*.

**Installing a dependency.** I installed a tiny library, `ms`, which converts time strings to milliseconds:

```text

added 1 package, and audited 2 packages in 926ms

found 0 vulnerabilities
```

`package.json` now has a new section:

```json
{
  "name": "npm-demo",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "ms": "^2.1.3"
  }
}
```

and the folder gained two things:

```text
node_modules
package-lock.json
package.json
server.js
```

- **`node_modules/`** — the downloaded code. It can be large and is *recreated from `package.json`*, so it is normally **not** committed to Git.
- **`package-lock.json`** — records the *exact* versions installed, so everyone gets identical dependencies.

`npm ls` shows the dependency tree, and we can use the package:

```text
npm-demo@1.0.0 ~/my-first-server
`-- ms@2.1.3
```

```text
172800000 ms
```

**Version ranges (semver).** `"ms": "^2.1.3"` uses the **caret**: *allow updates that don't change the major version* — here anything from `2.1.3` up to (but not including) `3.0.0`. Major versions signal breaking changes. Another package, `semver`, can test a version against a range. Running it with **`npx`** (which runs a package's command without installing it permanently) shows it:

```text
$ npx semver 2.3.4 -r "^2.0.0"
2.3.4
$ npx semver 3.0.0 -r "^2.0.0"  (no output = does not satisfy; exit code below)
exit code: 1
```

`2.3.4` satisfies `^2.0.0` and was printed; `3.0.0` does not, so nothing was printed and the exit code was `1`. (The `~` form, which only allows patch-level updates, and `--save-dev` for tools needed only during development, are covered in npm's documentation *(general knowledge, not run here)*.)

**Treat dependencies as code you are running.** Installing a package means running someone else's code on your machine; check the name carefully (look-alike names exist) and prefer well-known, maintained packages *(general advice)*.

**npm, Yarn and pnpm.** The module says "npm/yarn". They solve the same problem with similar commands. I ran **Yarn Classic (1.22.22)** to confirm the Yarn column's basics:

```text
1.22.22
warning The yes flag has been set. This will automatically answer yes to all questions, which may have security implications.
success Saved package.json
Done in 0.02s.
success Saved 1 new dependency.
info Direct dependencies
└─ ms@2.1.3
info All dependencies
└─ ms@2.1.3
Done in 0.29s.
node_modules
package.json
yarn.lock
```

| Task | npm | Yarn Classic |
|---|---|---|
| Create `package.json` | `npm init -y` | `yarn init -y` *(verified)* |
| Add a dependency | `npm install ms` | `yarn add ms` *(verified)* |
| Install everything listed | `npm install` | `yarn install` *(not run)* |
| Remove a dependency | `npm uninstall ms` | `yarn remove ms` *(not run)* |
| Run a script | `npm run dev` | `yarn dev` or `yarn run dev` *(not run)* |
| Lock file | `package-lock.json` | `yarn.lock` *(verified)* |

pnpm is another alternative (it uses `pnpm-lock.yaml`) *(general knowledge; not run)*. Newer Yarn versions (2 and later) are configured per project and differ from Classic — also not run here. **Use one package manager per project and don't mix their lock files.**

### Try it yourself

1. Run `c5-blocking-server.js`, then in two terminals request `/blocking` and `/fast` as above. Change `2000` to `4000` and predict the new `/fast` time before measuring.
2. Run the ordering script (`c3-eventloop-order.js`) five times. Which lines never change place? Which can?
3. In a new folder: `npm init -y`, `npm install ms`, then write a script that prints `ms('1h')`. Delete `node_modules` and run `npm install` again — what is restored, and from which file?

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| Using `fs.readFileSync` inside a request handler | Blocks the one thread — every other request waits | Use `fs.promises.readFile` with `await`, or the callback form |
| Assuming `setTimeout(fn, 0)` runs "right now" | It's a minimum threshold, scheduled for a later loop turn; synchronous code and microtasks go first | Use it only to *defer*, never to order things precisely |
| Relying on `setTimeout` vs `setImmediate` order in the main script | Not guaranteed (measured: it varied) | Only inside an I/O callback is `setImmediate` first guaranteed |
| Assuming `nextTick` always beats Promises | True in CommonJS, **false** in ES modules (measured) | Don't depend on the order |
| Doing heavy CPU work in a handler | Blocks every request (Section 3.8) | Keep handlers short; move heavy work off the main thread (🔒 later) |
| Committing `node_modules` | Huge, and recreated from `package.json` + the lock file | Commit `package.json` and the lock file; ignore `node_modules` |
| Mixing `npm install` and `yarn add` in one project | Two lock files drift apart | Pick one package manager |

### ✅ Knowledge Check
1. What makes Node.js a *runtime* rather than a framework, and which engine does it embed?
2. What object do you attach a listener to in order to run code on every HTTP request?
3. In the blocking half of Section 3.6, why did `read…` print before `after`, while in the non-blocking half it printed after?
4. In Section 3.8, why was `/fast` slow while `/blocking` ran but instant while `/waiting` was pending?
5. Which runs first in a CommonJS script: a `process.nextTick` callback or a Promise `.then`? Does that hold in an ES module?
6. What does `^2.1.3` allow, and what does it not?
7. What is `package-lock.json` for, and why is `node_modules` normally not committed?

---

## 4. Setting Up Your Local Environment

*(Module learning objective: set up a local Node.js development environment with npm/yarn.)*

### 4.1 What you need installed

Three things: **Node.js** (the runtime), **npm** (installed together with Node), and a **code editor**. Plus a terminal and, optionally, `curl` (Part 0, P4). First, find out what you already have:

```bash
node -v
npm -v
```

On the machine used to check this document, they printed:

```text
$ node -v
v24.22.1
$ npm -v
10.9.7
```

If both commands print a version number, Node and npm are installed. If you see "command not found," see the troubleshooting table in Section 4.7.

### 4.2 Which Node.js version should you use?

Node.js publishes numbered **release lines**. Some become **LTS** (Long-Term Support), which means a long window of security fixes and stability; production applications are advised to use an *Active* or *Maintenance* LTS line. As of **24 October 2026** *(sourced from the Node.js release schedule as reported by the Node.js blog and several summaries; confirm on the "previous releases" page of nodejs.org before you decide)*:

| Release line | Status on 24 Oct 2026 | End of life |
|---|---|---|
| Node.js 20 | **End of life** (since 30 April 2026) — don't use for anything new | 30 Apr 2026 |
| Node.js 22 | Maintenance LTS | 30 Apr 2027 |
| Node.js 24 | **Active LTS** | 30 Apr 2028 |
| Node.js 26 | Current; **enters LTS on 28 October 2026** | 30 Apr 2029 |
| Node.js 27 | Not released yet (alpha starts October 2026) | — |

**A change you should know about:** the release model changes from October 2026. Node.js 26 is the **last** line under the old model (two releases a year, only even-numbered ones become LTS). Starting with Node.js 27, there is **one major release per year** (April), promoted to LTS in October, and **every** release becomes LTS.

**What to choose:** for learning, use the **current LTS** — Node.js 24 today, and Node.js 26 once it reaches LTS in a few days. Every example in this document was run on **v24.22.1** and uses long-established features; the one feature worth double-checking on an older Node is `--watch` (Section 4.5) — it worked on 24.22.1, and `node --help` on your machine lists it if it is available.

### 4.3 Installing Node.js

*(Not run here — this subsection describes steps I could not execute in the checking environment.)*

There are two common routes:

1. **The official installer** from nodejs.org's download page — a normal installer for Windows and macOS, with packages and instructions for Linux. Simple; installs one version.
2. **A Node version manager** — a tool (well-known ones include nvm, fnm and Volta) that installs *several* Node versions side by side and lets you switch per project. The official Node.js learning site has a page on version managers. This is useful as soon as two projects need different versions.

After installing, **open a new terminal window** (an already-open terminal may not see the new program) and run `node -v` and `npm -v`.

### 4.4 Editor, terminal and `curl`

Any editor is fine; use one you like (many people use Visual Studio Code — my suggestion, not a requirement of the module). A built-in terminal inside the editor saves switching windows. `curl` is how this document checks every server, so try `curl --version` too (Part 0, P4).

### 4.5 Your project folder, `package.json` and automatic restarts

Create a folder, enter it, and let npm create the project file (the output of this exact command is shown in Section 3.10):

```bash
mkdir my-first-server
cd my-first-server
npm init -y
```

Then create `server.js` (Section 5 has the code). A running Node program does **not** notice when you edit its file — you must stop it (**Ctrl + C**) and start it again. Node can do that for you with the **`--watch`** flag. I started the first server under `--watch`, then edited the file's message and requested the page again; this is the server's log and the two responses:

```text
Server running at http://localhost:3000/
Change detected in '~/work/watch-demo.js'
Restarting '~/work/watch-demo.js'
Server running at http://localhost:3000/
```

```text
before edit: Hello, this is my first Node.js server!
after edit : Hello, this is my EDITED server!
```

`Change detected` / `Restarting` shows Node restarting the program on its own, and the second response shows the new message was live without any manual restart. (This is also what `npm run dev` runs if you add the script `"dev": "node --watch server.js"`, as in Section 3.10.)

### 4.6 npm or Yarn?

Both work for everything in this module; the command table in Section 3.10 maps one to the other, and the Yarn Classic commands there were verified. The practical rule: **choose one per project, and don't mix them.**

### 4.7 Troubleshooting

| Symptom | Likely cause | What to do |
|---|---|---|
| `node: command not found` | Node isn't installed, or the terminal opened before the install and doesn't see it *(general knowledge)* | Install Node, then open a **new** terminal and run `node -v` |
| `node -v` shows an unexpected version | Another Node earlier on your `PATH`, or a version manager has a different version active *(general knowledge)* | Check which version your version manager has selected; check `which node` (macOS/Linux) or `where node` (Windows) |
| `npm` fails with permission errors when installing globally | Global install location needs administrator rights *(general knowledge)* | Avoid global installs for this module — you don't need any |
| In Windows PowerShell, `npm` is blocked by a script-execution policy | A known PowerShell setting that can block `npm.ps1` *(general knowledge; not run here)* | Look up PowerShell's execution policy, or use a different terminal |
| `Error: listen EADDRINUSE …:3000` | Another program (often your *previous* server) is using port 3000 | See Section 5.7 |
| You edited the file but the page didn't change | The old process is still running | Stop it with **Ctrl + C** and restart, or use `node --watch` |

### Try it yourself — environment checklist

- [ ] `node -v` prints a version that is a current LTS line.
- [ ] `npm -v` prints a version.
- [ ] `my-first-server/package.json` exists (created by `npm init -y`).
- [ ] `curl --version` prints a version (or you know which alternative you'll use).
- [ ] You can stop a running program with Ctrl + C.

### ✅ Knowledge Check
1. Which two commands confirm Node and npm are installed?
2. Why does this document recommend an LTS release for anything you intend to keep running?
3. What does the `--watch` flag do, and what would you otherwise have to do after every edit?
4. Why open a *new* terminal after installing Node?

---

## 5. Hands-On Challenge: Your First Web Server

*(Module Resource Book, section 3. **Scenario:** you need a basic backend service that acknowledges a user's visit. **Prerequisite:** Node.js installed — `node -v` works.)*

### 5.1 The tasks, mapped to this section

| Task from the module | Where it happens |
|---|---|
| Create a folder named `my-first-server` | Step 1 below |
| Initialise with `npm init -y` to create `package.json` | Step 2 (output shown in Section 3.10) |
| Create a file named `server.js` | Step 3 |
| Import the native `http` module | Step 4 (line 1 of the code) |
| Use `http.createServer()` to listen on port 3000 | Step 5 |
| Respond with HTTP 200 and the text "Hello, this is my first Node.js server!" | Step 6 |
| Run with `node server.js` and visit `localhost:3000` | Step 7 |

### 5.2 Build it

**Steps 1–2** (terminal):

```bash
mkdir my-first-server
cd my-first-server
npm init -y
```

**Steps 3–6** — create `server.js` with this content (this is the exact file that was run):

```javascript
const http = require('node:http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello, this is my first Node.js server!');
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000/');
});
```

**Step 7** — start it:

```bash
node server.js
```

The terminal prints the message from the `listen` callback and then **stays busy** — that is correct: the server is running and waiting for requests (stop it with **Ctrl + C**):

```text
Server running at http://localhost:3000/
```

Now visit `http://localhost:3000` in a browser — or, to see the raw HTTP, from a second terminal:

```bash
curl -i localhost:3000
```

```text
HTTP/1.1 200 OK
Content-Type: text/plain
Date: Sat, 24 Oct 2026 11:39:53 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

Hello, this is my first Node.js server!
```

You built a backend. A client asked, your code answered `200 OK` with the sentence you wrote. (`Date` will show the current time on your machine.)

### 5.3 What each line does

```text
const http = require('node:http');
```
Loads Node's **built-in `http` module** (Section 3.4 explained the `node:` prefix). Nothing to install — it ships with Node. This is the "import the native http module" task.

```text
const server = http.createServer((req, res) => { … });
```
`createServer` creates an **HTTP server object** and takes a function — the **request listener**. Node calls it **once for every incoming request** (it is the handler for the server's `'request'` event, Section 3.5), passing two objects:
- **`req`** (the request): what the client sent — method, URL, headers, body. This example ignores it.
- **`res`** (the response): how you answer.

```text
res.writeHead(200, { 'Content-Type': 'text/plain' });
```
Sets the **status code** (`200` = OK) and **headers** in one call. `Content-Type: text/plain` tells the client the body is plain text, not HTML or JSON. (Equivalent: `res.statusCode = 200; res.setHeader('Content-Type', 'text/plain');` — that is the form the official Node.js introduction uses.)

```text
res.end('Hello, this is my first Node.js server!');
```
Sends the body **and finishes the response**. Calling `end` is **not optional** — Section 5.7 shows what happens if you forget it.

```text
server.listen(3000, () => { … });
```
Starts **listening on port 3000**. The second argument runs once the server is ready. The `listen` call is also what keeps the program alive: the process only exits when nothing is left to wait for (Section 3.7).

**The same server as an ES module** (save as `server.mjs`, run `node server.mjs`) — only the import line changes:

```javascript
import { createServer } from 'node:http';

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello, this is my first Node.js server!');
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000/');
});
```

It returns exactly the same response:

```text
Hello, this is my first Node.js server!
```

**What happens when you open it in a browser?** The browser sends `GET /`, your handler answers, and the browser shows the text. Browsers commonly also request `/favicon.ico` for the tab icon *(general knowledge; not observed here, since this was tested with `curl`)* — your handler never looks at `req.url`, so it would answer that request with the same sentence. Section 5.5 shows how to answer different URLs differently.

### 5.4 Make it configurable: port and host

Hard-coding `3000` is fine for a first server, but real deployments choose the port from the outside. Two changes: read the port from an **environment variable** (Section 3.3) with a default, and choose the **host** to listen on:

```javascript
const http = require('node:http');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(`Hello from port ${PORT}\n`);
});

server.listen(PORT, HOST, () => {
  console.log('listening on', server.address());
});
```

Run normally, then with `PORT=4000` (PowerShell: `$env:PORT=4000; node s5-env-port.js`, not run here):

```text
listening on { address: '127.0.0.1', family: 'IPv4', port: 3000 }
```

```text
Hello from port 3000
```

```text
listening on { address: '127.0.0.1', family: 'IPv4', port: 4000 }
```

```text
Hello from port 4000
```

**About the host.** `127.0.0.1` means *only this machine* can connect — the safest choice while developing (the official Node.js example does the same). If you leave the host out, Node listens on **all network interfaces**, so other devices on your network can reach the server. On the checking machine, that default looked like this:

```text
{ address: '0.0.0.0', family: 'IPv4' }
```

(`0.0.0.0` = every IPv4 interface. My recollection of the Node.js documentation is that when IPv6 is available the default is the IPv6 equivalent, `::`, and that the IPv4 form appears otherwise — the checking environment showed the IPv4 form. *I did not re-read that documentation page here and did not observe the IPv6 case, so confirm it if it matters to you.*) Exposing a half-finished server to a whole network is rarely what you want, so prefer `127.0.0.1` until you have a reason not to.

### 5.5 Look at what arrives: an inspector server

Section 1.7 showed the result; this is the code that produced it. It prints parts of each request to the terminal and sends back everything it saw as JSON:

```javascript
const http = require('node:http');

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}  (HTTP/${req.httpVersion})`);
  console.log('  host      :', req.headers.host);
  console.log('  user-agent:', req.headers['user-agent']);

  const seen = { method: req.method, url: req.url, headers: req.headers };
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(seen, null, 2));
});

server.listen(3000, () => console.log('inspector running on http://localhost:3000'));
```

Run it and make a request with `curl 'http://localhost:3000/products/42?sort=price#reviews' -H 'X-Demo: hello'`; the output is exactly what is shown in Section 1.7 (the server log, the JSON, and the absent `#reviews`).

- `req.method` — `GET`, `POST`…
- `req.url` — the path **plus query string** (not the host, not the fragment)
- `req.headers` — an object of lower-cased header names; `req.headers.host` and `req.headers['user-agent']` above

### 5.6 Answer different URLs differently — routing by hand

A real service must respond differently to different requests. Without a framework you look at `req.method` and the URL yourself. This version returns plain text at `/`, JSON at `/api/health` and `/api/greet`, and a proper `404` for everything else:

```javascript
const http = require('node:http');

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Welcome to my first API');
  } else if (req.method === 'GET' && url.pathname === '/api/health') {
    sendJson(res, 200, { status: 'ok' });
  } else if (req.method === 'GET' && url.pathname === '/api/greet') {
    const name = url.searchParams.get('name') ?? 'stranger';
    sendJson(res, 200, { message: `Hello, ${name}!` });
  } else {
    sendJson(res, 404, { error: 'Not found', path: url.pathname });
  }
});

server.listen(3000, () => console.log('API running on http://localhost:3000'));
```

Each request below was made with `curl -i`:

```text
$ curl -i localhost:3000/
HTTP/1.1 200 OK
Content-Type: text/plain
Date: Sat, 24 Oct 2026 11:39:58 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

Welcome to my first API

$ curl -i localhost:3000/api/health
HTTP/1.1 200 OK
Content-Type: application/json
Date: Sat, 24 Oct 2026 11:39:58 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

{"status":"ok"}

$ curl -i localhost:3000/api/greet?name=Amina
HTTP/1.1 200 OK
Content-Type: application/json
Date: Sat, 24 Oct 2026 11:39:58 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

{"message":"Hello, Amina!"}

$ curl -i localhost:3000/api/greet
HTTP/1.1 200 OK
Content-Type: application/json
Date: Sat, 24 Oct 2026 11:39:58 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

{"message":"Hello, stranger!"}

$ curl -i localhost:3000/nope
HTTP/1.1 404 Not Found
Content-Type: application/json
Date: Sat, 24 Oct 2026 11:39:58 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

{"error":"Not found","path":"/nope"}
```

Things to notice:

- **Status codes carry meaning**: `200` for success, **`404 Not Found`** for an unknown path — the client can tell success from failure without reading the body.
- **`Content-Type` matches the body**: `application/json` when we send JSON (`JSON.stringify`), `text/plain` for text.
- **`new URL(req.url, …)`** parses the path and the query string for us (the `URL` class from Part 0, P2): `url.searchParams.get('name')` read `?name=Amina`, and `?? 'stranger'` supplied a default when it was missing.
- **The pattern doesn't scale**: every new route is another `else if`. That growing pile is exactly the problem web frameworks solve — they are 🔒 outside this module, but now you know what they are replacing.

### 5.7 Read a request body (a `POST`)

`GET` requests carry no body, but `POST`s do — this is what your Angular `TaskService.createTask()` sent. A request body arrives as a **stream of pieces**, so the server collects them before parsing:

```javascript
const http = require('node:http');

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/echo') {
    let body = '';
    for await (const chunk of req) body += chunk;   // the body arrives in pieces (a stream)

    try {
      const data = JSON.parse(body);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ received: data }));
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Body must be valid JSON' }));
    }
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(3000, () => console.log('echo server running on http://localhost:3000'));
```

```text
$ curl -i -X POST -H "Content-Type: application/json" -d '{"title":"Design mockup"}' localhost:3000/api/echo
HTTP/1.1 201 Created
Content-Type: application/json
Date: Sat, 24 Oct 2026 11:39:59 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

{"received":{"title":"Design mockup"}}

$ curl -i -X POST -d "not json" localhost:3000/api/echo
HTTP/1.1 400 Bad Request
Content-Type: application/json
Date: Sat, 24 Oct 2026 11:39:59 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

{"error":"Body must be valid JSON"}
```

- Valid JSON → **`201 Created`** and the data echoed back. Invalid JSON → **`400 Bad Request`** with an error message. The *server* chooses these statuses, which is what the Angular interceptors in the earlier notes were reacting to.
- ⚠️ This is a **teaching demo**: it reads the *entire* body into memory with **no size limit**, so a huge request could exhaust memory, and it assumes text. Real servers cap the body size and use proven libraries (🔒 later).

### 5.8 When things go wrong

**(a) The port is already in use.** Start the first server in one terminal, then start it again in another:

```text
node:events:505
    throw er; // Unhandled 'error' event
    ^

Error: listen EADDRINUSE: address already in use 0.0.0.0:3000
    at Server.setupListenHandle [as _listen2] (node:net:2390:16)
    at listenInCluster (node:net:2499:12)
    at Server.listen (node:net:2624:7)
    at Object.<anonymous> (~/my-first-server/s1-first-server.js:8:8)
    at Module._compile (node:internal/modules/cjs/loader:1929:14)
    at Object..js (node:internal/modules/cjs/loader:2060:10)
    at Module.load (node:internal/modules/cjs/loader:1651:32)
    at Module._load (node:internal/modules/cjs/loader:1443:12)
    at wrapModuleLoad (node:internal/modules/cjs/loader:261:19)
exit code: 1
```

`EADDRINUSE` = *address already in use*: something (usually your own earlier server, still running) already owns port 3000, and the second program exits with code 1. **Fix:** stop the first one (**Ctrl + C**), or run the second on another port (`PORT=4000 …`, Section 5.4).

**(b) You forget `res.end()`.** This handler writes some text but never finishes the response:

```javascript
const http = require('node:http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.write('Hello...');
  // BUG: res.end() is never called, so the response is never finished
});

server.listen(3000, () => console.log('listening on http://localhost:3000'));
```

```text
$ curl -m 3 -i localhost:3000/
curl: (28) Operation timed out after 3002 milliseconds with 8 bytes received
HTTP/1.1 200 OK
Content-Type: text/plain
Date: Sat, 24 Oct 2026 11:43:32 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

Hello...
(curl exit code: 28  -> 28 means: timed out waiting for the end of the response)
```

The client received the status line, the headers and the 8 bytes `Hello...` — and then **waited**, because the response was never completed; `curl` gave up after 3 seconds (exit code 28 = timed out). A browser would show a spinner until it timed out. **Every code path in a handler must end the response.**

**(c) A bug in your handler crashes the whole server.** This server throws an error when asked for `/boom`:

```javascript
const http = require('node:http');

const server = http.createServer((req, res) => {
  if (req.url === '/boom') {
    throw new Error('unexpected bug in my handler');
  }
  res.end('ok\n');
});

server.listen(3000, () => console.log('listening on http://localhost:3000'));
```

```text
$ curl localhost:3000/
ok
$ curl localhost:3000/boom
curl: (52) Empty reply from server
(curl exit code: 52)
$ curl localhost:3000/
curl: (7) Failed to connect to localhost port 3000 after 0 ms: Couldn't connect to server
(curl exit code: 7)
```

```text
listening on http://localhost:3000
~/my-first-server/s6-crash.js:5
    throw new Error('unexpected bug in my handler');
    ^

Error: unexpected bug in my handler
    at Server.<anonymous> (~/my-first-server/s6-crash.js:5:11)
    at Server.emit (node:events:514:28)
    at parserOnIncoming (node:_http_server:1293:12)
    at HTTPParser.parserOnHeadersComplete (node:_http_common:125:17)

Node.js v24.22.1
server process exit code: 1
```

The first request worked. The `/boom` request threw an uncaught exception: the client got *Empty reply from server*, and then the **entire Node process exited** (exit code 1) — so the *next* request found nobody listening ("Failed to connect"). **One bug on one request took down the server for everyone.** This is a direct consequence of "one process, one thread" (Section 3.1), and it is why real servers handle errors deliberately and run under a process manager that restarts them (🔒 both outside this module).

### Exercises

**Level 1 — Basic:** Build `my-first-server` exactly as in Section 5.2. Change the greeting and the port (use `PORT`). Confirm both with `curl -i`.

**Level 2 — Practical:** Add `/api/time` to the routing server so it returns `{ "time": "<current ISO time>" }` as JSON with status 200 (`new Date().toISOString()`), and make sure an unknown path still returns your 404 JSON.

**Level 3 — Challenge:** Add `POST /api/echo` to the routing server (reuse Section 5.7). Return `400` for invalid JSON **and** for valid JSON that is missing a `title` string. Test all three outcomes with `curl`. Which status code would you pick for "valid JSON, wrong shape," and why?

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| Forgetting `res.end()` | The response never finishes; the client hangs (Section 5.8b) | End the response on **every** path |
| Editing `server.js` and refreshing the browser | The old process is still running the old code | Restart (Ctrl + C, then `node server.js`) or use `node --watch` |
| Starting a second server on the same port | `EADDRINUSE` (Section 5.8a) | Stop the first, or use another port |
| Sending JSON without `Content-Type: application/json` | The client may not treat it as JSON | Set the header and use `JSON.stringify` |
| Calling `res.end(object)` | `end` expects a string or buffer, not an object | `res.end(JSON.stringify(object))` |
| Reading the whole body with no limit and calling it production-ready | A very large request can exhaust memory | Treat it as a demo; real servers cap size (🔒 later) |
| Ignoring `req.method` in a route | A `POST` to `/` would be handled like a `GET` | Check the method **and** the path |
| Letting any handler throw | An uncaught exception ends the process (Section 5.8c) | Handle expected errors; supervise the process (🔒 later) |

### ✅ Knowledge Check
1. What are the two arguments of a request listener, and what is each used for?
2. Why must `res.end()` be called, and what did the client experience when it wasn't?
3. What does `EADDRINUSE` mean, and what are two ways to resolve it?
4. In Section 5.6, which status code is returned for an unknown path, and why does a client benefit from it?
5. Why did one `/boom` request stop *every* later request?
6. What is the difference between listening on `127.0.0.1` and omitting the host?

---

## 6. Final Module Project: `my-first-server`

This project takes the module's hands-on challenge and extends it just far enough to practise everything in Sections 1–5, with a **self-check script** so you can verify your own work before a code review.

### Requirements

**Core (the module's challenge):**
1. A folder named `my-first-server`, initialised with `npm init -y`.
2. A file `server.js` that imports Node's built-in `http` module and uses `http.createServer()` to listen on **port 3000**.
3. `GET /` responds with status **200** and the exact text **`Hello, this is my first Node.js server!`**.
4. Start it with `node server.js` and verify it in the browser at `localhost:3000`.

**Extension (practises routing, status codes and JSON):**
5. `GET /api/health` → status 200, JSON body `{"status":"ok"}`, header `Content-Type: application/json`.
6. `GET /api/greet?name=Amina` → 200, JSON `{"message":"Hello, Amina!"}`; with no `name`, the message uses `stranger`.
7. Any other path → status **404** with a JSON body containing an error message.
8. An npm script `"start": "node server.js"` so `npm start` runs the server.

### Concepts this project exercises

- [ ] The client-server request/response cycle (Section 1)
- [ ] `http.createServer`, `req`, `res`, `listen` (Section 5)
- [ ] Status codes and `Content-Type` headers (Sections 1.7, 5.6)
- [ ] Parsing a URL and its query string with `new URL` (Part 0 P2, Section 5.6)
- [ ] `package.json` and an npm script (Section 3.10)
- [ ] Stopping and restarting a server (Sections 4.5, 5.2)

### Check your work: `project-check.sh`

Start your server in one terminal; in another, run `bash project-check.sh` (it needs `curl`, and accepts a different base URL as an argument). It prints one PASS/FAIL line per requirement:

```bash
#!/bin/bash
# Usage: start your server (node server.js) in one terminal, then run in another:  bash project-check.sh
BASE=${1:-http://localhost:3000}
pass=0; fail=0

check() {   # check "description" expected_status expected_text path
  local desc=$1 want_status=$2 want_text=$3 path=$4
  local status
  status=$(curl -s -m 5 -o /tmp/pc-body -w '%{http_code}' "$BASE$path")
  if [ "$status" = "$want_status" ] && grep -qF -- "$want_text" /tmp/pc-body; then
    echo "PASS  $desc"; pass=$((pass+1))
  else
    echo "FAIL  $desc (status $status, expected $want_status containing: $want_text)"; fail=$((fail+1))
  fi
}

check "GET /                      -> 200 and the greeting"       200 "Hello, this is my first Node.js server!" /
check "GET /api/health            -> 200 and status ok"          200 '"status":"ok"'                            /api/health
check "GET /api/greet?name=Amina  -> greets by name"             200 "Hello, Amina!"                            "/api/greet?name=Amina"
check "GET /api/greet             -> default greeting"           200 "Hello, stranger!"                         /api/greet
check "GET /does-not-exist        -> 404 with an error message"  404 "Not found"                                /does-not-exist

ctype=$(curl -s -m 5 -o /dev/null -w '%{content_type}' "$BASE/api/health")
if [[ "$ctype" == application/json* ]]; then echo "PASS  /api/health sends Content-Type: application/json"; pass=$((pass+1))
else echo "FAIL  /api/health Content-Type is '$ctype', expected application/json"; fail=$((fail+1)); fi

echo "$pass passed, $fail failed"
[ "$fail" -eq 0 ]
```

**What a passing server looks like** — this is the output against the reference solution below:

```text
PASS  GET /                      -> 200 and the greeting
PASS  GET /api/health            -> 200 and status ok
PASS  GET /api/greet?name=Amina  -> greets by name
PASS  GET /api/greet             -> default greeting
PASS  GET /does-not-exist        -> 404 with an error message
PASS  /api/health sends Content-Type: application/json
6 passed, 0 failed
exit code: 0
```

**What a failing server looks like** — this is the same script run against *only* the Section 5.2 server (which answers every path with the greeting). Read the FAIL lines: they tell you which requirement is missing and what was expected:

```text
PASS  GET /                      -> 200 and the greeting
FAIL  GET /api/health            -> 200 and status ok (status 200, expected 200 containing: "status":"ok")
FAIL  GET /api/greet?name=Amina  -> greets by name (status 200, expected 200 containing: Hello, Amina!)
FAIL  GET /api/greet             -> default greeting (status 200, expected 200 containing: Hello, stranger!)
FAIL  GET /does-not-exist        -> 404 with an error message (status 200, expected 404 containing: Not found)
FAIL  /api/health Content-Type is 'text/plain', expected application/json
1 passed, 5 failed
exit code: 1
```

### Acceptance criteria

- `bash project-check.sh` reports **6 passed, 0 failed** against your server.
- `npm start` starts the server and `Ctrl + C` stops it.
- You can explain, line by line, what `server.js` does (Section 5.3) and why `res.end()` is on every path.
- You can show the raw request and response for one call using `curl -i` and point to the status line, a header and the body.

### Hints (try before opening the solution)

- Start from Section 5.2 (the plain greeting) and get **core** requirement 3 working first; then add routing from Section 5.6.
- If the check fails with a "status 000"–style message, your server probably isn't running or is on another port.
- `url.searchParams.get('name')` returns `null` when the parameter is missing; `??` supplies a default.
- If a request hangs, you have a code path that never calls `res.end()` (Section 5.8b).

<details>
<summary><strong>Reference solution</strong> (open only after you have tried)</summary>

```javascript
const http = require('node:http');

const PORT = Number(process.env.PORT) || 3000;

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello, this is my first Node.js server!');
  } else if (req.method === 'GET' && url.pathname === '/api/health') {
    sendJson(res, 200, { status: 'ok' });
  } else if (req.method === 'GET' && url.pathname === '/api/greet') {
    const name = url.searchParams.get('name') ?? 'stranger';
    sendJson(res, 200, { message: `Hello, ${name}!` });
  } else {
    sendJson(res, 404, { error: 'Not found', path: url.pathname });
  }
});

server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}/`));
```

Differences from Section 5.6: the root route returns the module's greeting, and the port can be changed with `PORT`. Everything else is the same routing pattern.

</details>

### Optional stretch challenges

- Log one line per request — method, path and the status code you sent (hint: `res.on('finish', …)` fires when the response is done — try it and check it with `curl`).
- Add `GET /api/stats` returning how many requests the server has handled since it started (keep a counter in a variable).
- Run `node --watch server.js` and change a message while it runs.
- Write the same greeting server in Python (Section 2.2) and run `project-check.sh` against it — which checks pass without any changes, and why?

---

## 7. Quick Reference Sheet

### Terminal
```text
pwd · ls · cd <folder> · cd .. · mkdir <name> · cat <file> · rm -r <folder>
Ctrl + C   stop the running program        Tab   auto-complete        ↑   previous command
```

### Node.js
```text
node -v                    Node version             node file.js        run a file
node --watch file.js       restart on file changes  node:http           built-in module (the `node:` prefix = built-in)
process.argv.slice(2)      command-line arguments   process.env.NAME    environment variable
```

### The `http` module in one screen
```javascript
const http = require('node:http');

const server = http.createServer((req, res) => {
  // req.method, req.url (path + query), req.headers  → what the client sent
  res.writeHead(200, { 'Content-Type': 'text/plain' });   // status + headers
  res.end('body');                                        // finish the response — ALWAYS
});

server.listen(3000, () => console.log('ready'));          // port; callback when ready
```

### Status codes seen in this module
```text
200 OK            success                               201 Created         POST that created something
400 Bad Request   the request itself was wrong          404 Not Found       no such path
(500 Internal Server Error — the server failed; the Section 5.8c crash had no response at all)
```

### What runs when (event loop summary)
```text
1. synchronous code of the script
2. process.nextTick / Promise callbacks (microtasks)   — nextTick first in CommonJS, Promise first in ES modules (measured)
3. event-loop phases: timers → pending → poll → check → close
   setTimeout vs setImmediate: order guaranteed only inside an I/O callback (setImmediate first)
```
Blocking = the thread waits (`…Sync`, busy loops). Non-blocking = start now, callback/Promise later. **Keep handlers short.**

### npm
```text
npm init -y                create package.json            npm install <pkg>     add a dependency (^version range)
npm install                install everything listed      npm uninstall <pkg>   remove one
npm start / npm test       shortcuts for those scripts    npm run <script>      run any other script
npm ls                     dependency tree                npx <pkg>             run a package's command without installing it
```
Commit `package.json` and `package-lock.json`; ignore `node_modules`. Yarn Classic: `yarn init -y`, `yarn add <pkg>`, `yarn.lock`.

### curl
```text
curl localhost:3000                      body only             curl -i localhost:3000       with response headers
curl -v localhost:3000                   request + response    curl -m 3 localhost:3000     give up after 3 s
curl -X POST -H "Content-Type: application/json" -d '{"a":1}' localhost:3000/api/echo
```

### 🔒 Coming Later — Outside This Module
Web frameworks (Express and similar) · routing libraries · REST API design · databases · authentication and authorization · validation libraries · configuration and secrets management · testing · deployment and process managers · security hardening · streams · worker threads · TLS/HTTPS · WebSockets · CORS · TypeScript on the server.

---

## 8. Source & Resource Mapping

### Learning-objective coverage

| Learning objective | Where it is covered |
|---|---|
| Explain the client-server model and the role of a backend | Section 1 (and P5 for Angular learners) |
| Compare backend technologies (Node.js, Python, Java…) and use cases | Section 2 |
| Describe the Node.js runtime, its event-driven architecture, and the event loop | Section 3 (3.1 runtime, 3.5 events, 3.6 blocking, 3.7 event loop, 3.8 demo, 3.9 threads) |
| Set up a local Node.js environment with npm/yarn | Section 4 and Section 3.10 |
| Hands-on challenge: first web server | Sections 5 and 6 |
| Knowledge check and summative quiz | Section 9 |

### Resources from your module file

| Module topic | Resource | How it was used |
|---|---|---|
| Backend fundamentals & Node.js architecture | **Introduction to Node.js** — official Node.js documentation | **Read in full.** Basis for Section 3.1 (runtime, V8, single process, asynchronous I/O) and for the structure of the first server in Section 5 |
| Backend fundamentals (video) | **CodeHelp** video | **Not watched.** The module describes it as an overview of how the web works, client vs. server, and where Node.js fits — it matches Sections 1 and 3.1 |
| Request-response cycle (video) | **The Net Ninja** video | **Not watched.** The module describes it as diving into the `http` module, inspecting incoming requests and forming responses — it matches Sections 1.7 and 5 |

### Other sources used (not on your list)

| Used for | Source | Notes |
|---|---|---|
| Event-loop phases, `nextTick`, `setImmediate` vs. `setTimeout` | **The Node.js Event Loop** — official Node.js documentation | Read in full; paraphrased, and every ordering claim was then **measured** (Section 3.7) |
| Node release lines and the October 2026 release-model change | Node.js release schedule, as reported by the Node.js blog and several summaries | Secondary reporting; confirm on nodejs.org (Section 4.2) |
| libuv thread pool (default size 4, `UV_THREADPOOL_SIZE`, what uses it) | Several articles | Secondary; not demonstrable in the checking environment (Section 3.9) |

### Links

- Introduction to Node.js — <https://nodejs.org/en/learn/getting-started/introduction-to-nodejs>
- The Node.js Event Loop — <https://nodejs.org/learn/asynchronous-work/event-loop-timers-and-nexttick>
- CodeHelp video — <https://www.youtube.com/watch?v=fn9oKI9-TEs>
- The Net Ninja video — <https://www.youtube.com/watch?v=DQD00NAUPNk>

---

## 9. Summative Practice Questions

The module's quizzes cover all four learning objectives with conceptual and scenario-based questions. These practise the same ground. Try them first; answers follow.

**Questions**

1. In the kitchen analogy, the **menu** corresponds to: (a) the database (b) the API (c) the browser (d) the event loop.
2. A user edits the page's JavaScript in DevTools so an item costs 0.01 and submits an order. What stops the wrong price being accepted?
3. True or false: with plain HTTP, the server may start a conversation with the browser whenever it wants.
4. In `http://localhost:3000/items?id=7#top`, which part is **not** sent to the server?
5. Node.js is best described as: (a) a framework (b) a runtime (c) a database (d) a language.
6. Which trio is correctly labelled *language / runtime / framework*? (a) Express / JavaScript / Node.js (b) JavaScript / Node.js / Express (c) Node.js / Express / JavaScript.
7. An Angular team needs an API fast; the work is mostly database queries and network waiting. Which technology is the most defensible default here, and why?
8. Give one workload where Node.js needs care, and say why.
9. What does the event loop let Node do with a single JavaScript thread?
10. What prints? `console.log(1); setTimeout(() => console.log(2), 0); Promise.resolve().then(() => console.log(3)); console.log(4);`
11. Which of these **blocks** the event loop? (a) `fs.readFileSync` (b) `fs.readFile` with a callback (c) `await fs.promises.readFile`.
12. In the Section 3.8 demo, why did `/fast` take about 1.7 seconds while `/blocking` was running?
13. In a **CommonJS** script, which runs first: a `process.nextTick` callback or a Promise `.then` callback? Is that also true in an ES module?
14. Inside an `fs.readFile` callback, which runs first: `setTimeout(fn, 0)` or `setImmediate(fn)`?
15. What does `res.end()` do, and what does the client experience if you forget it?
16. In Section 5.6, which status code did the server send for an unknown path, and which in Section 5.7 for invalid JSON?
17. What does `"ms": "^2.1.3"` in `package.json` allow?
18. Which file records the exact versions npm installed?
19. What does `EADDRINUSE` mean, and what are two ways to fix it?
20. What does `node --watch server.js` do?

**Answer key**

*Part 0 self-check (P6):*

1. `pwd` (macOS/Linux/PowerShell); 2. moves up one folder; 3. host `localhost`, port `3000`, path `/products/42`, query string `?sort=price`; 4. the `#fragment`; 5. "this computer" (the loopback address `127.0.0.1`); 6. `A`, `C`, `B` (the timer callback runs later); 7. `const { name } = user;`; 8. `1`; 9. `require` is CommonJS and `import` is ES modules; a file with the **`.mjs`** extension is treated as an ES module (or `.js` with `"type": "module"` in `package.json`); 10. `getUser(1)`'s Promise is awaited: this function pauses until it settles, the rest of the program keeps running, and `user` receives the resolved value.

*Practice questions:*

1. **(b)** — the menu lists what a client may order and how: the API.
2. **Server-side validation.** Anyone can send a request without your frontend; the server must check the price itself.
3. **False** — the client starts each exchange (server push needs other techniques, 🔒 later).
4. **`#top`** — the fragment stays in the client.
5. **(b)** — a runtime for JavaScript, not a framework.
6. **(b)** — JavaScript (language) / Node.js (runtime) / Express (framework).
7. **Node.js** — same language as the frontend, and the workload is I/O-bound (waiting), which the event loop handles well. (Other answers are defensible if justified — Section 2.4.)
8. **CPU-heavy work** (e.g. image processing): it runs on the main thread and blocks every request (Section 3.8).
9. **Non-blocking I/O** — start slow operations, keep running, and handle results when they finish.
10. **`1 4 3 2`** — synchronous lines first, then the Promise callback (a microtask), then the timer.
11. **(a)** — `readFileSync` makes the thread wait; (b) and (c) don't.
12. The single thread was busy in a 2-second loop and couldn't accept or answer the second request until it finished.
13. **CommonJS: `nextTick` first.** **ES module: the Promise callback first** — measured in Section 3.7, so don't depend on the order.
14. **`setImmediate`** — guaranteed from inside an I/O callback (30 of 30 runs).
15. It sends the body and **finishes** the response. Without it the client waits until it times out (`curl` exit code 28 in Section 5.8b).
16. **404** for an unknown path; **400** for invalid JSON.
17. Any version from `2.1.3` up to, but **not including**, `3.0.0` (same major version).
18. **`package-lock.json`**.
19. *Address already in use* — another program (often your earlier server) owns the port. Fix: stop that program (Ctrl + C), or use another port (e.g. `PORT=4000`).
20. It **restarts the program automatically when a file changes**, so you don't stop and start it by hand.

---

## 10. Glossary

| Term | Meaning |
|---|---|
| **Client** | A program that sends requests (browser, mobile app, `curl`, an Angular app) |
| **Server** | A program that listens for requests and answers them (also used for the machine it runs on) |
| **Backend** | The server-side part of an application, running on a machine you control |
| **Frontend** | The part that runs on the user's device (the Angular app in the earlier notes) |
| **API** | A contract describing which requests a client may make and what comes back; a *web API* does this over HTTP |
| **HTTP** | The protocol clients and servers use to exchange requests and responses |
| **Request / response** | The message a client sends, and the server's reply |
| **Header** | Metadata in a request or response (`Content-Type`, `Host`, …) |
| **Status code** | A three-digit number in a response: 2xx success, 4xx the request was wrong, 5xx the server failed |
| **Port** | A number identifying *which program on a machine* receives a connection |
| **`localhost`** | This computer (loopback address `127.0.0.1`) |
| **Runtime** | The program that executes a language (Node.js runs JavaScript outside a browser) |
| **Framework** | A library that structures an application (Express, Django, Spring Boot) |
| **V8** | The JavaScript engine inside Chrome and Node.js |
| **libuv** | The C library behind Node's event loop and asynchronous I/O |
| **Event-driven** | A style where code registers listeners that the runtime calls when events occur |
| **`EventEmitter`** | Node's class for emitting and listening to named events |
| **Blocking** | The thread waits for an operation to finish before continuing |
| **Non-blocking** | The operation is started and the program continues; a callback or Promise handles the result |
| **Event loop** | The mechanism that runs queued callbacks one at a time, letting a single JavaScript thread do non-blocking I/O |
| **Microtask** | A callback (`process.nextTick`, Promise `.then`) run between operations, outside the event-loop phases |
| **Thread pool (libuv)** | A small set of worker threads for operations the OS can't do asynchronously (default 4 threads) |
| **CommonJS / ES modules** | Node's two module systems (`require` / `import`) |
| **npm** | Node's package manager and the registry of shared packages |
| **`package.json`** | A project's description file: metadata, scripts and dependencies |
| **`package-lock.json`** | Records the exact dependency versions installed |
| **semver** | Semantic versioning: `major.minor.patch`; `^` allows changes that keep the same major version |
| **LTS** | Long-Term Support — a Node release line with an extended window of fixes |
| **`npx`** | Runs a package's command without installing it permanently |
