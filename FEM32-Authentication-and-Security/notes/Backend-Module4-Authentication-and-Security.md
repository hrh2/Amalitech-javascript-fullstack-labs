# Module 4: Authentication & Security
### Backend Development with JavaScript

> **Scope note:** This document covers Module 4: authentication vs. authorization, stateful vs. stateless sessions, registering users, hashing passwords with **bcrypt**, issuing and verifying **JSON Web Tokens (JWT)**, protecting routes with middleware, role-based access control (RBAC), and securing the Task API from Module 3 (the "Secure API with JWT" lab). It also covers environment variables for configuration and secrets, and — because your file lists them as objectives of this module — **scalability, Docker/Docker Compose and cloud deployment** (Sections 11–12). Anything beyond — OAuth / "log in with Google", multi-factor authentication, refresh-token rotation, email verification and password reset, account lockout policies, penetration testing, compliance — is flagged **🔒 Coming Later — Outside This Module**. *I have only seen the first four module files, so "later" means "not taught here."*
>
> **Things about the module file worth knowing before you start**
> 1. It has a title but **no module code, no quiz and no discussion prompt**, so none is shown or invented. Section 16 has practice questions of my own, labelled as such.
> 2. Its objectives are in **two blocks**. The first block (authentication, registration/login, hashing, JWT, protected routes) matches every lesson, the Resource Book and the lab. The **second block — scalability, containerization, Docker/Compose, cloud deployment, environment variables — has no lesson, no resource and no lab in this file**; it reads like objectives from a deployment module. I cover them anyway so nothing in your file is missing: **environment variables in full (Section 8)**, and a **shorter, practical introduction to scalability, Docker and deployment (Sections 11–12)**. If those belong to a separate module you'll send later, tell me and I'll trim them here.
> 3. The Resource Book teaches **RBAC** (role-based access control) although the lesson list has no RBAC lesson; it is covered in Section 5, and the hands-on challenge (the "Secure Portal") needs it.
> 4. The Resource Book's challenge says "MongoDB (or a mock database)". These notes build on **Module 3's Task API with MongoDB and Mongoose** (Path B); Section 7 gives the **PostgreSQL + Prisma** differences (Path A).
> 5. **Versions used:** Node 24, Express 5.3.0, Mongoose 9.11, **bcrypt 6.0.0**, **jsonwebtoken 9.0.3**, helmet 8.3.0, express-rate-limit 8.7.1. (`jose` is a newer JWT library some people prefer; the Resource Book's tutorials use `jsonwebtoken`, so these notes do too.)
> 6. **What I could not run:** the Docker and Docker Compose files in Section 11 (Docker isn't available in my environment) and the cloud-platform steps in Section 12. They are marked where they appear. All the Node/Express/bcrypt/JWT code and every output shown for authentication was run.
> 7. **These notes teach the fundamentals.** Real production systems need security review beyond any tutorial; where a topic is deliberately simplified, the text says so.

---

## How this document is organized

Same practical shape as the earlier notes: **What is it? → Why does it exist? → How does it work? → Syntax → Examples → When to use / not use → Try it yourself → Exercises → Common mistakes → Knowledge check.** The running example is the **Task API** from Module 3, to which you add **register**, **login**, **protected routes** and **roles**, plus the Resource Book's **Secure Portal** challenge in Section 6.

## Table of Contents

- [Before You Start: Prerequisites](#before-you-start-prerequisites)
- [1. Authentication vs. Authorization, and Sessions](#1-authentication-vs-authorization-and-sessions)
- [2. Password Hashing with bcrypt](#2-password-hashing-with-bcrypt)
- [3. JSON Web Tokens (JWT)](#3-json-web-tokens-jwt)
- [4. Protected Routes (Middleware)](#4-protected-routes-middleware)
- [5. Authorization: Roles and RBAC](#5-authorization-roles-and-rbac)
- [6. Hands-On Challenge: The Secure Portal](#6-hands-on-challenge-the-secure-portal)
- [7. The Lab: Secure API with JWT](#7-the-lab-secure-api-with-jwt)
- [8. Configuration & Secrets: Environment Variables](#8-configuration--secrets-environment-variables)
- [9. Hardening Basics](#9-hardening-basics)
- [10. Debugging Authentication Issues](#10-debugging-authentication-issues)
- [11. Scalability, Containers and Docker](#11-scalability-containers-and-docker)
- [12. Deploying to the Cloud](#12-deploying-to-the-cloud)
- [13. Final Module Project: Secure API with JWT](#13-final-module-project-secure-api-with-jwt)
- [14. Quick Reference Sheet](#14-quick-reference-sheet)
- [15. Source & Resource Mapping](#15-source--resource-mapping)
- [16. Practice Questions](#16-practice-questions)
- [17. Glossary](#17-glossary)

---

## Before You Start: Prerequisites

This module builds on the previous ones:

| You should be able to… | Where it was taught |
|---|---|
| Write Express middleware `(req, res, next)`, know that it must end the response *or* call `next()`, and register an error handler last | Backend Module 2, Section 4 |
| Return correct status codes (`200`, `201`, `204`, `400`, `404`) and JSON error bodies | Backend Module 2, Sections 1 and 8 |
| Work with a database through Mongoose (models, `create`, `find`, `findOne`, error code `11000`) — or Prisma (Path A) | Backend Module 3 |
| Use `async`/`await`, and read configuration from environment variables (`.env`, `--env-file`) | Backend Modules 1 and 3 |
| Test with `curl` or Postman | Backend Module 2, Section 6 |
| *(Optional)* How an Angular app attaches an `Authorization` header with an interceptor and uses a route guard | Angular Modules 4 and 9 |

**The problem this module solves.** Look at the Module 3 Task API: any program that can reach it can read, change or delete **every** task. It has data, but it has no idea **who** is calling or **what they are allowed to do**. Your Resource Book puts it this way: *"How do we protect this data and know who is making the request?"* Authentication and security are the answer.

**Prerequisite self-check** (answers in Section 16):

1. What must every Express middleware do?
2. Which Mongoose error code means a `unique` value was duplicated?
3. Why is the database connection string kept in an environment variable?
4. In the Angular notes, which header did the interceptor add to every request?

---

## 1. Authentication vs. Authorization, and Sessions

*(Module lesson 1 — Video + Reading. Outcome: explain authentication, authorization, and session management.)*

> 📺 **Video for this lesson — [IBM Technology](https://www.youtube.com/watch?v=rvZ35YW4t5k)**
> Your module file describes it as: *"A conceptual overview of how access control logic works before we write the code."* *(I haven't watched it; the description is from your file.)*

### 1.1 Two different questions

| | **Authentication (AuthN)** | **Authorization (AuthZ)** |
|---|---|---|
| The question | **Who are you?** | **What are you allowed to do?** |
| Happens | First — when you log in, and on every request that carries your proof of identity | After you are identified — for each action |
| Examples | Checking a password; verifying a token | "Only admins may delete users"; "you may only edit *your own* tasks" |
| When it fails | HTTP **`401`** — "I don't know who you are" | HTTP **`403`** — "I know who you are, and you may not do this" |
| In this module's code | `/register`, `/login`, `authenticateToken` | `authorizeRole('admin')`, ownership checks in the store |

**Kitchen picture** (continuing Module 1's analogy): your staff **ID badge** proves *who you are* (authentication). Which doors the badge **opens** — the walk-in freezer is managers only — is authorization. A stranger with no badge is turned away at the door (`401`); a new cook with a badge who tries the manager's office is told no (`403`).

Your Resource Book says it the same way: *"Authentication confirms who you are; Authorization determines what you can do."*

### 1.2 The status codes, precisely

| Status | Meaning here | Example in this module |
|---|---|---|
| **`401 Unauthorized`** | *Not authenticated* — no credentials, or invalid/expired ones. (The name is historical: it really means "unauthenticated".) It should include a `WWW-Authenticate` header naming the scheme (`Bearer`) | No token; a tampered token; an expired token; wrong password at login |
| **`403 Forbidden`** | *Authenticated but not permitted* | A normal user calling an admin-only route |
| **`404 Not Found`** | Used on purpose when revealing that something *exists* would leak information | Asking for **another user's** task (Section 4.4) |

### 1.3 Sessions: how does the server remember you?

HTTP is **stateless** (Module 2): each request stands alone. If you log in on request 1, request 2 must **carry something** that proves it, or you'd have to send your password on every click. There are two classic designs.

**Stateful: server-side sessions**

```text
1. POST /login (username + password)
2. Server checks the password, creates a SESSION RECORD in its own storage:
        sessions:  { "a81f…": { userId: 42, createdAt: … } }
3. Server replies with the session id (usually in a cookie)         Set-Cookie: sid=a81f…
4. Every later request carries the cookie ──►  server LOOKS UP "a81f…" ──► "that's user 42"
5. Logout = delete the record
```
*The server remembers; the client holds only a meaningless id.*

**Stateless: signed tokens (JWT)**

```text
1. POST /login (username + password)
2. Server checks the password and builds a TOKEN containing the identity,
   then SIGNS it with a secret only the server knows:
        { sub: 42, role: 'user', exp: … } + signature
3. Server replies with the token
4. Every later request carries it          Authorization: Bearer <token>
5. Server VERIFIES THE SIGNATURE (no lookup, no storage) ──► "that's user 42"
```
*The token carries the identity; the server stores nothing.*

| | **Stateful (sessions)** | **Stateless (JWT)** |
|---|---|---|
| Where the identity lives | In the **server's** storage; the client holds an id | In the **token**, which the client holds |
| Each request costs | A lookup in the session store | A signature check (no storage) |
| **Scaling** | All servers must share the session store | Any server can verify a token with the shared secret — easy to scale horizontally (Section 11) |
| **Logging out / revoking** | Immediate: delete the session | Hard: a valid token stays valid until it expires (Section 3.6) |
| Typical client | Browser with cookies | Single-page apps and mobile apps (e.g. your Angular app) sending a header |
| Main risks | Session theft; the store is a dependency | Token theft; leaked signing secret; no easy revocation |

Neither is "better": many successful systems use server-side sessions in cookies, and many use tokens. **This module teaches JWTs** because the lab and your Angular app use them — and because the contrast (*stateful vs. stateless*) is the first learning objective.

### 1.4 The full flow (what the Intro Session demonstrates)

```text
Client                                              Server
  │  POST /register  {username, password}              │  validate → HASH the password → store the hash
  │ ──────────────────────────────────────────────►    │  ◄── 201 Created (no password in the reply)
  │                                                     │
  │  POST /login     {username, password}               │  find user → compare password with the hash
  │ ──────────────────────────────────────────────►    │  → create + sign a JWT
  │ ◄──────────────────────────────  { token }          │
  │                                                     │
  │  GET /tasks   Authorization: Bearer <token>         │  authenticateToken: verify signature + expiry
  │ ──────────────────────────────────────────────►    │  → req.user = { id, role }  → the route runs
  │ ◄──────────────────────────────  200 + data         │
  │                                                     │
  │  GET /tasks   (no token / a forged token)           │  authenticateToken → 401
  │ ──────────────────────────────────────────────►    │
```

In your Angular app, the **interceptor** from the Angular notes attaches `Authorization: Bearer <token>` to each request, and a **route guard** checks the user is logged in before showing a page. The server never trusts the guard — a client can skip it — which is why the checks in this module are on the **server**.

### 1.5 What can go wrong — and where this module defends against it

Every row below is demonstrated with real requests later in the module:

| Weakness | Consequence | Defence (section) |
|---|---|---|
| Passwords stored in plain text | One database leak exposes every account (and users reuse passwords) | Hash with bcrypt (2) |
| Passwords hashed with a **fast** hash (like SHA-256) | Attackers try billions of guesses per second | A deliberately **slow, salted** hash (2) |
| A token anyone can forge | Anyone becomes anyone | Sign with a strong secret; pin the algorithm (3) |
| Routes with no authentication | Anyone reads/changes data | `authenticateToken` (4) |
| No **ownership** check | User A reads/edits user B's data (a very common real-world bug) | Scope every query to the owner (4.4) |
| Trusting the whole request body when creating a user ("mass assignment") | A client registers *as an admin* | Pick fields explicitly (5.3) |
| Unlimited login attempts | Brute-force password guessing | Rate limiting (9) |
| "No such user" vs. "wrong password" messages | Attackers learn which usernames exist | One generic message (7) |
| Secrets committed to Git | Anyone with the repo can forge tokens | Environment variables (8) |

### Try it yourself

1. Take the Module 3 Task API and list three things an anonymous caller could do today that they shouldn't.
2. For each action in the Task API (list tasks, create a task, delete a task, delete a *user*), write down: *does it need authentication? authorization? ownership?*
3. Draw the stateless flow for your own words, then draw what would change if the server used sessions.

### Exercises

**Level 1 — Basic:** For each, say `401`, `403` or `404`: (a) no token; (b) a normal user calls an admin route; (c) a user requests another user's private task and you don't want to confirm it exists.

**Level 2 — Practical:** Write a table comparing sessions and JWTs for a small single-page app on one server vs. the same app on ten servers behind a load balancer. Which would you choose for each, and why?

**Level 3 — Challenge:** A user's laptop is stolen while their JWT (valid for 7 days) is still stored in it. Describe what you can and can't do about it with a purely stateless design, and what you would add.

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| Using `401` and `403` interchangeably | Clients can't tell "log in" from "you may not" | `401` = not authenticated, `403` = not permitted |
| Relying on the frontend guard for security | The client can bypass it | Enforce everything on the server |
| Thinking a JWT is encrypted | Its contents are readable by anyone (Section 3) | Never put secrets in it |
| "Stateless means no database" | You still store users; only the *session* isn't stored | Understand what is stateless: the session |
| Treating login as one-time and forgetting every later request must be verified | Only the first request is protected | Verify on every request |

### ✅ Knowledge Check
1. What is the difference between authentication and authorization? Which status code goes with each failure?
2. How do server-side sessions and JWTs differ in *where* the identity lives?
3. Why are JWTs easier to scale horizontally, and what do you lose?
4. Why can't the Angular route guard alone protect your data?
5. Name three weaknesses from Section 1.5 and the module's defence for each.

---

## 2. Password Hashing with bcrypt

*(Module lesson 2 — Video + Reading. Outcome: implement `bcrypt` to hash and compare passwords.)*

> 📖 **Reading for this lesson — [How to hash passwords with bcrypt in Node.js — freeCodeCamp](https://www.freecodecamp.org/news/how-to-hash-passwords-with-bcrypt-in-nodejs/)**
> Your module file's key takeaway: *"Learn how to salt and hash passwords so they are never stored in plain text."* *(I did not open the article; the takeaway is quoted from your file.)*

### 2.1 Why never store the password

If your database stores passwords, then **anyone who gets the database gets every password** — a backup copy, a leaked dump, a curious employee, an SQL bug. People reuse passwords across sites, so the damage spreads beyond your app. The goal: **store something from which the password can be *checked* but not *recovered*.**

| Technique | Reversible? | For passwords? |
|---|---|---|
| **Encoding** (Base64) | Yes — anyone can decode it | ❌ It isn't protection at all |
| **Encryption** (AES) | Yes — with the key | ❌ If the key leaks, every password leaks |
| **Plain hash** (SHA-256) | No, but **very fast** to guess against | ❌ Attackers test billions of guesses per second |
| **Slow, salted password hash** (bcrypt, scrypt, Argon2) | No, and **deliberately slow** | ✅ This is the tool |

### 2.2 Hashing, salting and the cost factor

- A **hash** is a one-way function: same input → same output, but you can't run it backwards.
- A **salt** is a random value mixed into each password *before* hashing. It makes two users with the same password get **different** hashes, and defeats precomputed ("rainbow table") attacks.
- The **cost factor** (bcrypt calls it *salt rounds*) controls how slow each hash is. Each +1 **doubles** the work, so you can keep the hash slow as computers get faster.

**bcrypt does all three for you.** Install it (`bcrypt` 6.0.0 is a native addon that ships prebuilt binaries for common platforms):

```bash
npm install bcrypt
```

This program was run; the output follows:

```javascript
const bcrypt = require('bcrypt');

async function main() {
  const password = 'correct horse battery staple';

  // 1. Hash it. The number is the "cost" (salt rounds): higher = slower = harder to brute-force.
  const hash1 = await bcrypt.hash(password, 10);
  const hash2 = await bcrypt.hash(password, 10);
  console.log('hash 1:', hash1);
  console.log('hash 2:', hash2);
  console.log('same password, same hash?', hash1 === hash2);

  // 2. The hash string contains everything bcrypt needs: version, cost and the random salt.
  const [, version, cost, rest] = hash1.split('$');
  console.log('version:', version, '| cost:', cost, '| salt (22 chars):', rest.slice(0, 22), '| digest:', rest.slice(22));

  // 3. Compare: bcrypt re-hashes the candidate with the stored salt and cost.
  console.log('right password  ->', await bcrypt.compare(password, hash1));
  console.log('wrong password  ->', await bcrypt.compare('wrong guess', hash1));
}
main();
```
```text
hash 1: $2b$10$CsXZEujkaZZDVXjA2d35.ekP.KMszC6MKOCZOJKHCzgh/r5TfUx9G
hash 2: $2b$10$VTL50GbbI3ZT670.eYPbXevPEVByVkfv0yBHEnVm96nGVcEyX.t.G
same password, same hash? false
version: 2b | cost: 10 | salt (22 chars): CsXZEujkaZZDVXjA2d35.e | digest: kP.KMszC6MKOCZOJKHCzgh/r5TfUx9G
right password  -> true
wrong password  -> false
```

Read it closely:

- **The same password produced two different hashes** — each call picked a fresh random salt.
- **The hash is a self-contained string**: `$2b$` (the algorithm version), `10` (the cost), then the 22-character **salt** and the 31-character digest. That is why `bcrypt.compare(password, hash)` needs only the two values — the salt travels *inside* the hash, so you store **one column** (`passwordHash`), not a separate salt.
- **`compare`** re-hashes the candidate with the stored salt and cost and checks for a match. You never "decrypt" anything.

### 2.3 Choosing the cost

Each increase of one doubles the time. Measured on one machine (yours will differ):

| Cost (rounds) | Time for one hash |
|---|---|
| 8 | 22 ms |
| 10 | 61 ms |
| 12 | 264 ms |
| 14 | 995 ms |

The trade-off: **slow enough to hurt an attacker, fast enough not to hurt your own logins** — every login pays this cost, and an attacker pays it for *every guess*. Teams commonly tune the cost so one hash takes a noticeable fraction of a second on their server *(general guidance)*; `10` is a typical starting point for learning. Put it in configuration (`BCRYPT_ROUNDS`) so you can raise it later — existing hashes keep working because each hash records its own cost.

### 2.4 Using bcrypt in an API

```javascript
// REGISTER: hash BEFORE saving
const passwordHash = await bcrypt.hash(password, 10);
await User.create({ username, passwordHash });

// LOGIN: compare the submitted password with the stored hash
const user = await User.findOne({ username });
const ok = user ? await bcrypt.compare(password, user.passwordHash) : false;
```

Rules to follow every time:

1. **Always use the async functions** (`bcrypt.hash`, `bcrypt.compare`). The synchronous variants (`hashSync`, `compareSync`) run on the main thread and **block the event loop** for the whole hash — in a server that freezes *every* request (Backend Module 1, Section 3.8). With cost 12 that is a quarter of a second per call.
2. **Never log, return or email a password** — or its hash. The `User` model's `toJSON` removes `passwordHash` from responses (Section 7).
3. **Hash on register, compare on login.** Never hash the submitted password again and compare *hashes yourself*.
4. **Don't store any plain-text copy**, even "temporarily".

### 2.5 The 72-byte limit

bcrypt only uses the **first 72 bytes** of a password. This was run — two passwords that differ only *after* byte 72:

```javascript
const long = 'a'.repeat(72);
const h = await bcrypt.hash(long + 'X', 10);
console.log(await bcrypt.compare(long + 'Y', h));   // true   <- a DIFFERENT password was accepted
```

It silently ignores the rest. That is why the lab's registration rejects passwords longer than 72 bytes (`Buffer.byteLength(password, 'utf8') > 72`) instead of quietly accepting a password that isn't fully used. (Note *bytes*, not characters: accented letters and emoji take more than one byte.)

### 2.6 Alternatives and related ideas

- **`bcryptjs`** is a pure-JavaScript implementation with the same hash format — no native build, but slower *(general knowledge)*.
- **scrypt** (built into Node's `crypto`) and **Argon2** (the newer standard; the `argon2` package) are other good password hashes *(general knowledge)*. The module uses bcrypt, so these notes do too.
- A **pepper** (a secret value added on top of the salt, kept outside the database) and **password-strength rules/breach checks** are 🔒 outside this module.

### Try it yourself

1. Run the demo above. Hash the same password five times and confirm all five strings differ but all five `compare` to `true`.
2. Time `bcrypt.hash` at cost 8, 10, 12 and 14 on your machine. What cost makes one hash take roughly a quarter of a second?
3. Hash a password, then change one character of the *stored hash* and `compare` again. What happens, and why?

### Exercises

**Level 1 — Basic:** Write `hashPassword(plain)` and `verifyPassword(plain, hash)` helper functions around bcrypt, using the async API.

**Level 2 — Practical:** Add registration validation: at least 8 characters and at most 72 *bytes*. Test it with a 73-character password and with 30 emoji.

**Level 3 — Challenge:** A user registered with cost 8 years ago; you now use cost 12. Design the login code that, after a successful `compare`, **re-hashes at the new cost** and updates the stored hash (hint: `bcrypt.getRounds(hash)` reads the cost from a hash — check the library's documentation).

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| Storing the plain password, or Base64/AES "protection" | Reversible | A slow salted hash |
| `crypto.createHash('sha256')` for passwords | Far too fast to resist guessing | bcrypt / scrypt / Argon2 |
| `bcrypt.hashSync` in a request handler | Blocks every other request | `await bcrypt.hash` |
| Hashing the password again at login and comparing strings | Different salt → never equal | `bcrypt.compare(plain, storedHash)` |
| Storing a separate salt column | bcrypt already embeds it | One `passwordHash` column |
| A column too short for the hash (about 60 characters) | The hash gets truncated and `compare` fails *(general knowledge)* | Allow at least 60 characters (a text column) |
| Accepting passwords over 72 bytes | The tail is silently ignored | Validate the length |
| Logging `req.body` on `/login` or `/register` | Passwords end up in log files | Never log credentials |

### ✅ Knowledge Check
1. What is the difference between encoding, encryption and hashing? Which is right for passwords, and why not a plain SHA-256?
2. What is a salt, and why do two users with the same password get different hashes?
3. What does the cost factor do, and how does each +1 change the time?
4. Why does `bcrypt.compare` need only the password and the hash?
5. Why must you use `bcrypt.hash` rather than `bcrypt.hashSync` in a server?
6. What happens to a password longer than 72 bytes?

---

## 3. JSON Web Tokens (JWT)

*(Module lesson 3 — Video + Reading. Outcome: implement JWTs for user login and stateless authentication.)*

> 📺 **Video for this lesson — [Web Dev Simplified](https://www.youtube.com/watch?v=mbsmsi7l3r4)**
> Your module file describes it as: *"This is a complete walkthrough. You will learn to generate tokens upon login and verify them on protected routes."* *(I haven't watched it; the description is from your file.)* It also supports Section 4.

### 3.1 What is a JWT?

A **JSON Web Token** is a compact string that carries a few facts about a user (called **claims**) plus a **signature** proving the server issued it. The server hands one to the client at login; the client sends it back with every request. Because the token itself says who the user is and the signature proves it, the server **needs no session storage** — that is what makes the design *stateless* (Section 1.3).

A JWT is three parts joined by dots, each encoded with Base64URL:

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9 . eyJzdWIiOiI0MiIsInVzZXJuYW1lIjoiYW1pbmEi… . B3klxjxjaIFgBmbelZbQBrdw…
\_____________ header _____________/   \________________ payload ________________/   \____ signature ____/
```

Install the library the module's tutorials use:

```bash
npm install jsonwebtoken
```

This program was run; the output follows:

```javascript
const jwt = require('jsonwebtoken');
const SECRET = 'a-long-random-secret-from-the-environment';

// 1. Sign: the payload ("claims") + a secret -> a token
const token = jwt.sign({ sub: '42', username: 'amina', role: 'user' }, SECRET, { expiresIn: '1h' });
console.log('token :', token);

// 2. It is three base64url parts: header.payload.signature
const [h, p, s] = token.split('.');
console.log('header :', Buffer.from(h, 'base64url').toString());
console.log('payload:', Buffer.from(p, 'base64url').toString());
console.log('signature bytes:', Buffer.from(s, 'base64url').length);

// 3. Anyone can READ the payload (it is encoded, not encrypted) - no secret needed:
console.log('decode (no secret):', jwt.decode(token));

// 4. Verify checks the signature AND the expiry
console.log('verify OK ->', jwt.verify(token, SECRET, { algorithms: ['HS256'] }));
```
```text
token : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MiIsInVzZXJuYW1lIjoiYW1pbmEiLCJyb2xlIjoidXNlciIsImlhdCI6MTc5MzAzNTc2MSwiZXhwIjoxNzkzMDM5MzYxfQ.B3klxjxjaIFgBmbelZbQBrdwkvvl8fCY1d2_LEpabuc
header : {"alg":"HS256","typ":"JWT"}
payload: {"sub":"42","username":"amina","role":"user","iat":1793035761,"exp":1793039361}
signature bytes: 32
decode (no secret): { sub: '42', username: 'amina', role: 'user', iat: 1793035761, exp: 1793039361 }
verify OK -> { sub: '42', username: 'amina', role: 'user', iat: 1793035761, exp: 1793039361 }
```

| Part | Contents |
|---|---|
| **Header** | `{"alg":"HS256","typ":"JWT"}` — the signing algorithm. **HS256** = HMAC with SHA-256 using **one shared secret** |
| **Payload** | The claims. `sub` ("subject": the user's id), `iat` (issued at) and `exp` (expires at) are *standard* claims; **`username`** and **`role`** are *custom* claims we chose. Times are Unix seconds |
| **Signature** | A keyed hash of `header.payload` — 32 bytes here. Only someone with the secret can produce a valid one |

### 3.2 A JWT is signed, not encrypted

Look at step 3 of the program: `jwt.decode(token)` printed the whole payload **without any secret**. Base64URL is just an encoding. **Anyone who obtains a token can read what is in it.**

| Rule | Why |
|---|---|
| Put **only** what the server needs to identify the caller: an id, maybe a username and a role | The payload is public to the holder |
| **Never** put passwords, password hashes, secrets or sensitive personal data in a token | Readable by anyone |
| Remember `jwt.decode` does **not** check anything | It only reads; use `jwt.verify` for security |

What the signature gives you is **integrity**: if anyone changes a single character of the payload, verification fails.

### 3.3 Verifying: what happens when something is wrong

`jwt.verify(token, secret, options)` returns the payload if the token is valid, or **throws**. All of these cases were run (the same program, continued):

```javascript
// 5. Tampering: change the role inside the payload and keep the old signature
const forgedPayload = Buffer.from(JSON.stringify({ sub: '42', username: 'amina', role: 'admin',
                                   iat: jwt.decode(token).iat, exp: jwt.decode(token).exp })).toString('base64url');
const forged = `${h}.${forgedPayload}.${s}`;
try { jwt.verify(forged, SECRET); } catch (e) { console.log('tampered payload  ->', e.name + ':', e.message); }

// 6. Wrong secret
try { jwt.verify(token, 'some-other-secret'); } catch (e) { console.log('wrong secret      ->', e.name + ':', e.message); }

// 7. Expiry (a token created with expiresIn: '1s', checked 1.5 s later)
// 8. Garbage
try { jwt.verify('not.a.token', SECRET); } catch (e) { console.log('garbage token     ->', e.name + ':', e.message); }
try { jwt.verify('', SECRET); }            catch (e) { console.log('empty token       ->', e.name + ':', e.message); }

// 9. The classic "alg: none" attack: an UNSIGNED token. A pinned algorithm list rejects it.
const none = [Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url'), p, ''].join('.');
try { jwt.verify(none, SECRET, { algorithms: ['HS256'] }); } catch (e) { console.log('alg "none" token  ->', e.name + ':', e.message); }
```
```text
tampered payload  -> JsonWebTokenError: invalid signature
wrong secret      -> JsonWebTokenError: invalid signature
expired token     -> TokenExpiredError: jwt expired
garbage token     -> JsonWebTokenError: invalid token
empty token       -> JsonWebTokenError: jwt must be provided
alg "none" token  -> JsonWebTokenError: jwt signature is required
```

- **Changing `role` to `admin` was caught** — the signature no longer matched the payload. This is the entire security model: the client may read and even edit a token, but can't make a *valid* one without the secret.
- **Two error classes:** `TokenExpiredError` (valid signature, too old — the client should log in again) and `JsonWebTokenError` (anything else wrong). The middleware in Section 4 turns both into a `401`.
- **Always pass `algorithms: ['HS256']`** to `verify`. The `"alg": "none"` attack presents an *unsigned* token that claims no signature is needed; pinning the accepted algorithm (as above) is the defence.

### 3.4 The signing secret

With HS256 the **same secret signs and verifies**, so whoever holds it can **forge a token for any user, including an admin**. Therefore:

- Use a **long, random** secret — not a word. Generate one (this prints 128 hexadecimal characters):

  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- Keep it in an **environment variable** (`JWT_SECRET`), **never in code or Git** (Section 8). Use a different secret in each environment.
- If it leaks, rotate it — every existing token becomes invalid (everyone logs in again).
- Algorithms with a **private/public key pair** (RS256 and similar) let other services verify tokens without being able to create them; they are 🔒 outside this module.

### 3.5 Expiry — and the `expiresIn` trap

Tokens should **expire**. A stolen token is valid until `exp`, so keep access tokens short-lived. `jsonwebtoken` accepts `expiresIn` as a number of **seconds** or a **string with a unit**. Watch this (run):

```text
expiresIn: "3600" (string, no unit) -> lifetime = 3 seconds
expiresIn: 3600 (a NUMBER)          -> lifetime = 3600 seconds
expiresIn: "1h"                     -> lifetime = 3600 seconds
```

A string **without a unit is read as milliseconds** — `'3600'` gave a token that lives **3 seconds**. This bites when the value comes from an environment variable (which is always a string). **Always include the unit in configuration: `1h`, `15m`, `7d`.**

### 3.5.1 Revoking tokens (the stateless trade-off)

The server keeps nothing, so it can't "delete the session". Ways to cope *(general knowledge; all 🔒 beyond this module)*:

- **Short expiry** (minutes to an hour) so a leaked token dies quickly.
- **Refresh tokens**: a long-lived, revocable token stored server-side that is traded for new short-lived access tokens — this puts a little state back, on purpose.
- A **denylist** of revoked token ids checked on each request (which reintroduces a lookup).
- Re-checking the user in the database on sensitive routes.

### 3.6 Sending the token, and where the client keeps it

Clients send the token in the **`Authorization` header** with the **`Bearer`** scheme ("the bearer of this token is entitled to access"):

```text
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.…
```

Two rules: the header must be **exactly** `Bearer <token>` (a token with the word `Bearer ` left *inside* it is rejected as `invalid token`), and **tokens must travel over HTTPS** in production, because anyone who can read the traffic can copy the token (Section 9).

*Where the browser app stores it* is a real design decision *(general knowledge)*: in **JavaScript-accessible storage** (memory, `localStorage`) it is exposed to theft by an injected script (XSS); in an **`httpOnly` cookie** scripts can't read it, but cookies are sent automatically, which brings a different attack (CSRF) that you must defend against. Your Angular app attaches the header with an interceptor (Angular notes, Module 9); picking the storage strategy is part of 🔒 later security work.

### Try it yourself

1. Run the JWT program. Change one character in the middle of the payload and `verify` — what error do you get? Change the secret by one character — what then?
2. Sign a token with `expiresIn: '2s'`, wait three seconds, verify it, and read the error class.
3. Reproduce the `'3600'` vs `3600` vs `'1h'` experiment and print `exp - iat` for each.
4. Paste a token into any JWT decoder, or decode it with `jwt.decode`, and list everything an attacker holding the token would learn.

### Exercises

**Level 1 — Basic:** Write `signToken(user)` returning a token with `sub`, `username` and `role`, valid for 15 minutes.

**Level 2 — Practical:** Write `verifyToken(token)` that returns the payload or `null` (never throws), pinning `algorithms: ['HS256']`.

**Level 3 — Challenge:** Explain, with a concrete attack, why a payload containing `"isAdmin": true` that is *read from the token without verifying it* (using `jwt.decode`) would be a vulnerability, and show the fix.

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| Using `jwt.decode` to "check" a token | It never verifies the signature — anyone can forge it | `jwt.verify` |
| Not pinning `algorithms` | Opens the door to `alg: none` tricks | `{ algorithms: ['HS256'] }` |
| A short/guessable secret (`"secret"`) | Can be brute-forced; then anyone mints tokens | A long random secret from the environment |
| Hard-coding the secret in source or committing `.env` | Anyone with the repo can forge tokens | Environment variables, `.gitignore` |
| Putting passwords or hashes in the payload | The payload is readable | Only ids and role |
| `expiresIn: '3600'` from an env var | 3 seconds, not an hour | `'1h'` (always a unit) |
| Tokens that never expire | A leaked token works forever | Always set `expiresIn` |
| Sending the token in the URL (`?token=…`) | URLs end up in logs and browser history | The `Authorization` header |
| Sending `Authorization: <token>` or `Bearer: <token>` | Doesn't match the scheme the server parses | `Authorization: Bearer <token>` |

### ✅ Knowledge Check
1. What are the three parts of a JWT, and what does each contain?
2. Why can anyone read a token's payload, and what does the signature protect instead?
3. What did `jwt.verify` do when we changed `role` inside the payload, and why?
4. Why must `verify` be given `algorithms: ['HS256']`?
5. What lifetime does `expiresIn: '3600'` give, and how do you avoid the trap?
6. Name two ways to limit the damage of a stolen token in a stateless design.

---

## 4. Protected Routes (Middleware)

*(Module lesson 4 — Video + Reading. Outcome: create Express middleware to protect endpoints.)*

> 📺 **Video for this lesson — [CodeLucky](https://www.youtube.com/watch?v=5zb2Lfhamqc)**
> Your module file describes it as: *"A quick primer on how middleware functions intercept requests to check for validity."* *(I haven't watched it; the description is from your file.)*

> 📺 **Also for this lesson — [Web Dev Simplified](https://www.youtube.com/watch?v=mbsmsi7l3r4)** *(the walkthrough linked under Section 3)*
> Its description in your file: *"…generate tokens upon login and verify them on protected routes."*

### 4.1 Why middleware is the right tool

From Module 2: **middleware** runs *before* your route handler and can either **end the response** or **call `next()`**. That is exactly what protection needs — a gate in front of the routes:

```text
request ──► authenticateToken ──► (valid?) ──yes──► the route handler
                                    │
                                    no ──► 401, and the handler never runs
```

You write the check **once** and attach it to as many routes as you like, instead of repeating it in every handler.

### 4.2 `authenticateToken`

This is the middleware from the lab (the module's challenge calls it `authenticateToken`):

```javascript
const jwt = require('jsonwebtoken');
const config = require('../config');

// 1. AUTHENTICATION: who is calling? Reads "Authorization: Bearer <token>" and verifies it.
function authenticateToken(req, res, next) {
  const [scheme, token] = (req.get('Authorization') ?? '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    res.set('WWW-Authenticate', 'Bearer');
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    req.user = { id: payload.sub, username: payload.username, role: payload.role };
    next();
  } catch (error) {
    res.set('WWW-Authenticate', 'Bearer');
    const message = error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    res.status(401).json({ error: message });
  }
}
```

Line by line:

- **`req.get('Authorization') ?? ''`** reads the header (an empty string if absent, so `.split` is always safe), then splits it into the scheme and the token.
- **No `Bearer <token>` → `401`** with `WWW-Authenticate: Bearer` (the standard header that tells a client *which* authentication scheme is expected) and **`return`** — so the request stops here.
- **`jwt.verify(...)`** checks the signature and expiry and **throws** if anything is wrong. In the `catch`, an expired token and every other problem both become `401`; the message differs (`Token expired` lets the client know to log in again).
- **On success, `req.user = { … }`** attaches the verified identity to the request. Every later middleware and route can read `req.user.id`, `req.user.role` — **this is how the route knows who is calling.** Only `id`, `username` and `role` are copied; nothing else from the payload leaks through.
- **`next()`** passes control onwards.

### 4.3 Attaching it to routes

Three levels — attach it exactly where the protection is needed:

```javascript
// One route
app.get('/dashboard', authenticateToken, (req, res) => res.json({ user: req.user }));

// Every route in a router (the Task API uses this)
app.use('/tasks', authenticateToken, tasksRouter);

// Public routes simply don't have it
app.use(authRouter);     // POST /register and POST /login must stay open — nobody has a token yet!
```

Order matters (Module 2): `authenticateToken` must come **before** the router it protects, and the public routes (`/register`, `/login`) must **not** be behind it.

These requests were run against the secured Task API. (`[HTTP …]` is the status code; the `Content-Type: application/json` header was sent on requests with a body, omitted for readability; tokens are shortened.)

```text
$ curl -i localhost:3000/tasks                    (status line and the WWW-Authenticate header)
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer

$ curl -H 'Authorization: Bearer <garbage>' localhost:3000/tasks
{"error":"Invalid token"}  [HTTP 401]

$ curl -H 'Authorization: Bearer <alice>' localhost:3000/dashboard
{"message":"Welcome, alice!","user":{"id":"6adf8e70e518e5417ebca7df","username":"alice","role":"user"}}  [HTTP 200]
```

- No token → `401`; a bogus token → `401`; a valid token → the route runs and **`req.user`** tells it who is calling.
- A tampered token was also tried — the `role` was changed to `admin` while keeping the old signature — and was rejected the same way:

```text
$ curl -H 'Authorization: Bearer <forged-admin-token>' localhost:3000/admin/users
{"error":"Invalid token"}  [HTTP 401]
```

- And a token that has **expired** (the server was restarted with `JWT_EXPIRES_IN=1s`, the client waited two seconds):

```text
$ curl -H 'Authorization: Bearer <expired-token>' localhost:3000/dashboard
{"error":"Token expired"}  [HTTP 401]
```

### 4.4 Authentication isn't enough: ownership

Making every Task route require a token answers *"who are you?"* — but if the routes then return **all** tasks, any logged-in user can read and delete **everyone else's** data. This is one of the most common real-world access-control bugs (often called an *insecure direct object reference*). The fix is to make every query **scoped to the caller**. In the secured Task API, each task has an `owner`, and the store takes the owner's id first and *only ever touches that owner's tasks*:

```javascript
const Task = require('./models/Task');

// Every function takes the OWNER's id first and only ever touches that owner's tasks.
// "Not found" is null (or false for remove) - and it also covers "exists but belongs to someone else".
module.exports = {
  list: (ownerId, filter = {}) => Task.find({ ...filter, owner: ownerId }).sort({ createdAt: 1, _id: 1 }),
  get: (ownerId, id) => Task.findOne({ _id: id, owner: ownerId }),
  create: (ownerId, { title, completed = false }) => Task.create({ title, completed, owner: ownerId }),
  replace: (ownerId, id, { title, completed = false }) =>
    Task.findOneAndUpdate({ _id: id, owner: ownerId }, { title, completed }, { returnDocument: 'after', runValidators: true }),
  update: (ownerId, id, changes) =>
    Task.findOneAndUpdate({ _id: id, owner: ownerId }, changes, { returnDocument: 'after', runValidators: true }),
  remove: async (ownerId, id) => (await Task.findOneAndDelete({ _id: id, owner: ownerId })) !== null
};
```

The routes pass `req.user.id` (set by `authenticateToken`) — never an id from the request body. Here is Alice creating a task, and Bob (also logged in) trying to reach it:

```text
$ curl -X POST -H 'Authorization: Bearer <alice>' -d '{"title":"Alice task one"}' localhost:3000/tasks
{"title":"Alice task one","completed":false,…,"id":"6adf8e72e518e5417ebca7e3"}  [HTTP 201]

$ curl -H 'Authorization: Bearer <bob>' localhost:3000/tasks
[]  [HTTP 200]

$ curl -H 'Authorization: Bearer <bob>' localhost:3000/tasks/6adf8e72e518e5417ebca7e3
{"error":"Task 6adf8e72e518e5417ebca7e3 not found"}  [HTTP 404]

$ curl -X DELETE -H 'Authorization: Bearer <bob>' localhost:3000/tasks/6adf8e72e518e5417ebca7e3
{"error":"Task 6adf8e72e518e5417ebca7e3 not found"}  [HTTP 404]

$ curl -H 'Authorization: Bearer <alice>' localhost:3000/tasks/6adf8e72e518e5417ebca7e3
{"title":"Alice task one",…}  [HTTP 200]
```

Bob sees an **empty list**, and Alice's task is **`404` for him** — not `403`. Answering `403` would confirm "that task exists, it just isn't yours", which leaks information; `404` reveals nothing. The scoping lives in the **query** (`{ _id: id, owner: ownerId }`), so there is no code path where the wrong user's task is loaded and then "forgotten to be checked".

### 4.5 From Angular

The Angular notes' pieces now have a real server to talk to:

```typescript
// login.service.ts (Angular): POST /login, keep the token
login(username: string, password: string) {
  return this.http.post<{ token: string }>('http://localhost:3000/login', { username, password })
    .pipe(tap((res) => this.tokenService.save(res.token)));
}

// auth.interceptor.ts (Angular): attach it to every request
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(TokenService).getToken();
  return next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req);
};
```
*(Illustrative Angular code in the style of the Angular notes; the Angular side was not run here.)* A `401` from the server is what your `errorInterceptor` turns into a redirect to the login page. For the browser to be allowed to send the `Authorization` header from `localhost:4200` to `localhost:3000`, the server's CORS configuration must permit it (Backend Module 2, Section 4.5).

### Try it yourself

1. Add `authenticateToken` to one route of your Module 3 API and test: no header, `Authorization: Bearer garbage`, and a real token.
2. Move the middleware to the router level (`app.use('/tasks', authenticateToken, tasksRouter)`). Which routes must stay outside it?
3. Log in as two users and try to read, update and delete each other's tasks. What do you get?

### Exercises

**Level 1 — Basic:** Write `authenticateToken` from scratch (without looking) and protect `GET /dashboard`.

**Level 2 — Practical:** Add `GET /me` returning the caller's `id`, `username` and `role` from `req.user`.

**Level 3 — Challenge:** Change the middleware to **look the user up in the database** after verifying the token and return `401` if the user no longer exists. What does this cost, and what does it fix (hint: a deleted user's still-valid token)?

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| Forgetting `return` before `res.status(401)…` | The code continues to `next()` and runs the route anyway | `return res.status(401)…` |
| Putting `authenticateToken` behind the routes it protects | The routes run first, unprotected | Register it **before** them |
| Protecting `/login` and `/register` | Nobody can ever get a token | Keep them public |
| Using `403` for a missing token | Clients can't tell "log in" from "not allowed" | `401` |
| Reading the user id from `req.body` | The client can claim to be anyone | `req.user.id` from the verified token |
| Authenticating but not scoping queries | Any user reads/edits anyone's data | Filter every query by the owner |
| Returning `403` for another user's resource | Confirms it exists | `404` |
| Catching the error and calling `next()` anyway | Unauthenticated requests get through | Respond `401` and stop |

### ✅ Knowledge Check
1. What are the two outcomes of an authentication middleware?
2. What is `req.user`, and who sets it?
3. Why must `/register` and `/login` stay outside the protected area?
4. What is the difference between "authenticated" and "authorized to see *this* task"? How did the store enforce the second?
5. Why does the API answer `404`, not `403`, when Bob asks for Alice's task?

---

## 5. Authorization: Roles and RBAC

*(Resource Book, section 3: "Authorization & Permissions (RBAC)". Authentication confirms who you are; authorization determines what you can do.)*

> 📺 **Video for this section — [Web Dev Simplified](https://www.youtube.com/watch?v=jI4K7L-LI58)**
> Your module file describes it as: *"Learn how to implement a permission system that checks if a user is an 'Admin' or 'Basic' user before granting access."* *(I haven't watched it; the description is from your file.)*

> 📖 **Reading for this section — [Implementing Role-Based Access Control (RBAC) in Node.js — Medium](https://medium.com/@techsuneel99/implementing-role-based-access-control-rbac-in-node-js-871591b80a83)**
> Your module file's key takeaway: *"A practical guide to middleware that checks user roles against allowed permissions."* *(I did not open the article; the takeaway is quoted from your file.)*

### 5.1 What is RBAC?

**Role-Based Access Control** gives each user a **role** (`user`, `admin`) and decides what each **role** may do — instead of deciding user by user. Adding a new admin means assigning a role, not editing a list of permissions. The Secure Portal's rule — *"only Admins can delete users, but everyone can view their own profile"* — is RBAC in one sentence. A guiding principle is **least privilege**: everyone starts with the smallest set of permissions they need, and the default role is the least powerful one.

### 5.2 `authorizeRole`

`authorizeRole('admin')` is a **middleware factory**: a function that *returns* a middleware, so you can configure it per route:

```javascript
// 2. AUTHORIZATION: may THIS user do this? Returns a middleware for the allowed role(s).
function authorizeRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {                                   // authorizeRole used without authenticateToken before it
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: you do not have permission to do this' });
    }
    next();
  };
}
```

- `...allowedRoles` collects the arguments (`authorizeRole('admin', 'moderator')` allows either).
- The returned function is the real middleware; it **closes over** `allowedRoles`.
- It **depends on `authenticateToken` having run first** (that is what sets `req.user`). If it hasn't, the guard answers `401` rather than crashing.
- A role mismatch is **`403`**: identified, but not permitted.

Chain them: **authenticate first, then authorize**:

```javascript
router.delete('/user/:id', authenticateToken, authorizeRole('admin'), deleteUser);
// or for a whole router:  router.use(authenticateToken, authorizeRole('admin'));
```

Results against the running API (Alice is a normal user, *boss* an admin):

```text
$ curl localhost:3000/admin/users                                    (no token)
{"error":"Authentication required"}  [HTTP 401]

$ curl -H 'Authorization: Bearer <alice>' localhost:3000/admin/users
{"error":"Forbidden: you do not have permission to do this"}  [HTTP 403]

$ curl -H "Authorization: Bearer <boss>" localhost:3000/admin/users
[('alice', 'user'), ('bob', 'user'), ('mallory', 'user'), ('eve', 'admin'), ('boss', 'admin')]
```
*(The list shows each user's name and role; `eve` is the account created by the deliberately insecure endpoint in Section 5.3.)*

The admin routes, as the module's challenge asks (`DELETE /admin/user/:id`):

```javascript
const express = require('express');
const User = require('../models/User');
const Task = require('../models/Task');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Every route in this file: logged in AND an admin.
router.use(authenticateToken, authorizeRole('admin'));

router.get('/users', async (req, res) => {
  res.json(await User.find().sort({ createdAt: 1 }));
});

router.delete('/user/:id', async (req, res) => {
  if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
    return res.status(400).json({ error: 'id must be a valid ObjectId (24 hex characters)' });
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  await Task.deleteMany({ owner: user._id });          // their tasks go with them
  res.sendStatus(204);
});

module.exports = router;
```
```text
$ curl -X DELETE -H 'Authorization: Bearer <alice>' localhost:3000/admin/user/6adf8e71e518e5417ebca7e2
{"error":"Forbidden: you do not have permission to do this"}  [HTTP 403]

$ curl -X DELETE -H 'Authorization: Bearer <boss>' localhost:3000/admin/user/6adf8e71e518e5417ebca7e2
  [HTTP 204]

$ curl -X POST -d '{"username":"mallory","password":"password123"}' localhost:3000/login
{"error":"Invalid username or password"}  [HTTP 401]
```

The normal user is blocked with `403`, the admin deletes the account with `204`, and the deleted user can no longer log in.

### 5.3 Where do roles come from? (And the mass-assignment trap)

Roles must come from **the server**, never from the client. Look at an innocent-looking registration handler that passes the request body straight to the database — **a deliberately insecure example, run for demonstration only**:

```javascript
app.post('/register', async (req, res) => {
  const user = await User.create(req.body);   // <-- the client controls EVERY field, including role
  res.status(201).json(user);
});
```
```text
$ curl -X POST -d '{"username":"eve","passwordHash":"x","role":"admin"}' localhost:3001/register
{"username":"eve","role":"admin",…}  [HTTP 201]
```

The attacker just **registered as an admin** by adding a field the form never offered. This is called **mass assignment**. The fix is to **pick exactly the fields you accept**, and let the server decide everything else:

```javascript
// Only username and passwordHash are used. The role takes its default ('user').
const user = await User.create({ username: value.username, passwordHash });
```
```text
$ curl -X POST -d '{"username":"mallory","password":"password123","role":"admin"}' localhost:3000/register
{"username":"mallory","role":"user",…}  [HTTP 201]
```

The `role` field in the request is **ignored**; the new account is a plain `user`.

**So how does anyone become an admin?** Through a path that requires *server* access — here, a one-off script run on the server by someone who already has database access:

```javascript
// Usage: node --env-file=.env scripts/create-admin.js <username> <password>
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const config = require('../config');
const User = require('../models/User');

async function main() {
  const [username, password] = process.argv.slice(2);
  if (!username || !password) {
    console.error('Usage: node --env-file=.env scripts/create-admin.js <username> <password>');
    process.exit(1);
  }
  await mongoose.connect(config.mongodbUri, { serverSelectionTimeoutMS: 5000 });
  await User.init();
  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
  const user = await User.findOneAndUpdate(
    { username: username.toLowerCase() },
    { passwordHash, role: 'admin' },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );
  console.log(`Admin ready: ${user.username} (role: ${user.role})`);
  await mongoose.disconnect();
}

main().catch((error) => { console.error(error.message); process.exit(1); });
```
```text
$ node --env-file=.env scripts/create-admin.js boss AdminPass123
Admin ready: boss (role: admin)
```

(Later, an *admin-only* route could promote other users. Never let an ordinary registration or profile-update endpoint set `role`.)

### 5.4 A caveat: the role lives in the token

The `role` is copied into the token **at login**. If an admin is **demoted**, their existing token still says `admin` until it expires. Options *(general knowledge)*: keep tokens **short-lived**, or, on very sensitive routes, **re-read the role from the database** instead of trusting the token. It is a classic stateless trade-off (Section 3.5.1).

### 5.5 RBAC and ownership are different checks

| Rule | Kind of check | In this module |
|---|---|---|
| "Only admins may delete users" | **Role** (RBAC) | `authorizeRole('admin')` |
| "You may only edit **your own** tasks" | **Ownership** | The store filters by `owner` (Section 4.4) |
| "Everyone can view their own profile" | Authentication + identity | `GET /dashboard` uses `req.user` |

Real systems often need both, and more complicated rules (attribute-based access control) are 🔒 outside this module.

A **permission map** is a common refinement — roles map to *actions*, and routes ask for an action rather than a role name *(a variation to know about; not part of the lab)*:

```javascript
const permissions = { user: ['tasks:read', 'tasks:write'], admin: ['tasks:read', 'tasks:write', 'users:delete'] };
const can = (action) => (req, res, next) =>
  permissions[req.user?.role]?.includes(action) ? next() : res.status(403).json({ error: 'Forbidden' });
// router.delete('/user/:id', authenticateToken, can('users:delete'), deleteUser);
```

### Try it yourself

1. Add `authorizeRole('admin')` to a route and call it with a normal user's token, an admin's token and no token. Match each result to `401`/`403`/`200`.
2. Reproduce the mass-assignment bug on a throw-away endpoint, then fix it by choosing fields explicitly.
3. Create your first admin with a script, log in as them, and delete another user.

### Exercises

**Level 1 — Basic:** Add `GET /admin/stats` (admins only) returning how many users and tasks exist.

**Level 2 — Practical:** Add `PATCH /admin/user/:id/role` letting an admin change another user's role between `user` and `admin`; validate the new value.

**Level 3 — Challenge:** Prevent an admin from deleting **themselves** or demoting the **last remaining** admin, and explain why a stale `admin` token (Section 5.4) makes the second rule important.

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| `User.create(req.body)` | Mass assignment: the client sets `role` | Pick `username` and `passwordHash` explicitly |
| Letting registration accept a `role` | Anyone can become admin | Role defaults to `user`; admins come from a server-side path |
| `authorizeRole` without `authenticateToken` first | `req.user` is undefined | Chain them in order |
| Returning `401` for "not an admin" | Wrong signal | `403` |
| Checking the role only in the frontend | Bypassable | Enforce on the server |
| Trusting a long-lived token's role forever | A demoted admin keeps admin rights | Short expiry or a database re-check |
| Deleting a user but leaving their data | Orphaned records | Remove or reassign dependents (the route deletes their tasks) |
| Checking role but not ownership | One user edits another's data | Both checks where they apply |

### ✅ Knowledge Check
1. What is RBAC and what does least privilege mean for the default role?
2. Why does `authorizeRole` return a function? What does `...allowedRoles` do?
3. Why must `authenticateToken` run before `authorizeRole`?
4. What is mass assignment, and how did the two registration endpoints differ?
5. How does the first admin get created, and why not through `/register`?
6. What is the downside of storing the role in the token?

---

## 6. Hands-On Challenge: The Secure Portal

*(Module Resource Book, section 4. **Scenario:** you are building a secure employee portal where only Admins can delete users, but everyone can view their own profile. **Prerequisites:** Node.js, Express, MongoDB (or a mock database), Postman.)*

### 6.1 The tasks, mapped to this section

| Task from the module | Where it happens |
|---|---|
| **User Model:** username, password (hashed), role (default `"user"`) | Step 2 |
| **Register:** `POST /register` hashes the password with bcrypt before saving | Step 3 |
| **Login:** `POST /login` compares the password and, if valid, returns a JWT | Step 4 |
| **Middleware:** an `authenticateToken` middleware that verifies the JWT header | Section 4.2 |
| **Protected route:** `GET /dashboard`, only for logged-in users | Step 5 |
| **Admin route:** `DELETE /admin/user/:id` behind `authorizeRole('admin')` | Section 5.2 |

### 6.2 Build it

**Step 1 — project:**

```bash
mkdir secure-portal && cd secure-portal
npm init -y
npm install express mongoose bcrypt jsonwebtoken
```
Create a `.env` (and add it to `.gitignore`) — Section 8 explains why:

```text
MONGODB_URI=mongodb://127.0.0.1:27017/secureportal
JWT_SECRET=<paste the output of: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
JWT_EXPIRES_IN=1h
```

**Step 2 — the User model** (`models/User.js`). The module says "password (hashed)"; the field is named `passwordHash` so nobody mistakes it for the password:

```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },          // the bcrypt hash - NEVER the password itself
    role: { type: String, enum: ['user', 'admin'], default: 'user' }
  },
  { timestamps: true }
);

// Never send the hash (or Mongo internals) to a client.
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
```

- `role` has an **`enum`** (only `user` or `admin` are valid) and a **`default: 'user'`** — the module's "default to `user`", and least privilege.
- `unique: true` on `username` builds a unique index, so two registrations can't claim the same name even if they arrive at the same instant.
- The `toJSON` transform **deletes `passwordHash`**, so even if a handler returns a user by mistake the hash never leaves the server.

**Step 3 — register** (`POST /register`): validate → hash → save → reply *without* the hash:

```javascript
router.post('/register', async (req, res) => {
  const { value, errors } = validateRegistration(req.body);      // username + password rules (Section 7)
  if (errors) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  const passwordHash = await bcrypt.hash(value.password, 10);
  try {
    // Only username and passwordHash are used. The role takes its default ('user').
    const user = await User.create({ username: value.username, passwordHash });
    res.status(201).json(user);
  } catch (error) {
    if (error.code === 11000) {                       // the unique index on username
      return res.status(409).json({ error: 'Username already taken' });
    }
    throw error;
  }
});
```

Note **`409 Conflict`** for a duplicate username (the request is valid but conflicts with existing data), and that the handler **never reads `req.body.role`** (Section 5.3).

**Step 4 — login** (`POST /login`): find → compare → sign:

```javascript
router.post('/login', async (req, res) => {
  const username = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  const user = await User.findOne({ username });
  const passwordOk = user ? await bcrypt.compare(password, user.passwordHash) : false;

  // The SAME message and status for "no such user" and "wrong password": don't reveal which usernames exist.
  if (!passwordOk) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = jwt.sign(
    { sub: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
  res.json({ token, user });
});
```

- **One message for two failures.** "No such user" and "wrong password" both answer `401 Invalid username or password`. If they differed, an attacker could test thousands of usernames to find the real ones (*user enumeration*).
- The token's payload: `sub` (the user's id), `username`, `role`.
- `req.body?.username` is safe when the body is missing (Express 5's `undefined` body, Backend Module 2).

**Step 5 — the protected route** (`GET /dashboard`): add `authenticateToken` (Section 4.2) and read `req.user`:

```javascript
router.get('/dashboard', authenticateToken, (req, res) => {
  res.json({ message: `Welcome, ${req.user.username}!`, user: req.user });
});
```

This one route also satisfies "**everyone can view their own profile**": it returns the caller's own identity and nobody else's.

**Step 6 — the admin route:** `DELETE /admin/user/:id` behind `authenticateToken` and `authorizeRole('admin')` — the code is in Section 5.2.

### 6.3 Try the whole portal

Registration, login and the protected route, step by step (tokens shortened; the `Content-Type: application/json` header was sent on requests with a body):

```text
$ curl -X POST -d '{"username":"alice","password":"alicePass123"}' localhost:3000/register
{"username":"alice","role":"user","createdAt":"…","updatedAt":"…","id":"6adf8e70e518e5417ebca7df"}  [HTTP 201]

$ curl -X POST -d '{"username":"ALICE","password":"another-password"}' localhost:3000/register
{"error":"Username already taken"}  [HTTP 409]

$ curl -X POST -d '{"username":"alice","password":"WRONG-password"}' localhost:3000/login
{"error":"Invalid username or password"}  [HTTP 401]

$ curl -X POST -d '{"username":"nobody","password":"whatever123"}' localhost:3000/login
{"error":"Invalid username or password"}  [HTTP 401]

$ curl -X POST -d '{"username":"alice","password":"alicePass123"}' localhost:3000/login
{"token":"eyJhbGciOiJIUzI1Ni...","user":{"username":"alice","role":"user",…,"id":"6adf8e70e518e5417ebca7df"}}  [HTTP 200]

$ curl -H 'Authorization: Bearer <alice>' localhost:3000/dashboard
{"message":"Welcome, alice!","user":{"id":"6adf8e70e518e5417ebca7df","username":"alice","role":"user"}}  [HTTP 200]
```

Notice: the register response has **no `passwordHash`**, the duplicate (typed in a different case) is caught, and the two failed logins give **identical** answers.

And what is actually stored — a hash, never the password (hash shortened):

```json
{
  "_id": "6adf8e70e518e5417ebca7df",
  "username": "alice",
  "passwordHash": "$2b$10$kjpICMmXhq7ZY...",
  "role": "user",
  "createdAt": "2026-10-26T17:31:28.965Z",
  "updatedAt": "2026-10-26T17:31:28.965Z",
  "__v": 0
}
```

### 6.4 No MongoDB? A mock database

The module allows "a mock database". The routes only need three operations, so an array works for the challenge *(a sketch; I did not run this one)*:

```javascript
// userStore.js - an in-memory stand-in for the User model (data is lost when the server restarts)
const users = [];
let nextId = 1;

module.exports = {
  findByUsername: async (username) => users.find((u) => u.username === username) ?? null,
  create: async ({ username, passwordHash }) => {
    if (users.some((u) => u.username === username)) {
      const error = new Error('duplicate'); error.code = 11000; throw error;   // same "duplicate" signal the routes expect
    }
    const user = { id: String(nextId++), username, passwordHash, role: 'user' };
    users.push(user);
    return user;
  }
};
```
Swap `User.findOne({ username })` for `userStore.findByUsername(username)` and `User.create(...)` for `userStore.create(...)`. **Remember to strip `passwordHash` before replying** — with an array there is no `toJSON` transform to do it for you.

### Exercises

**Level 1 — Basic:** Build the portal exactly as above and reproduce the session in 6.3.

**Level 2 — Practical:** Add `GET /admin/users` (admins only) listing every user's `id`, `username` and `role`, and check the response never includes `passwordHash`.

**Level 3 — Challenge:** Make the `/login` handler take the **same amount of time** whether or not the username exists (hint: when no user is found, still run a `bcrypt.compare` against a fixed dummy hash). Why does this matter?

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| Naming the column `password` and storing the plain text | The whole point is lost | `passwordHash` holding the bcrypt hash |
| Hashing *after* saving | The plain password reached the database | Hash first, then `create` |
| Different errors for "unknown user" and "wrong password" | Reveals which usernames exist | One message, one status |
| Returning the user document with its hash | Leaks the hash | `toJSON` transform; never return it |
| Accepting `role` from the register body | Anyone becomes admin | Ignore it; default `user` |
| Forgetting `await` on `bcrypt.compare` | A Promise is always truthy — **everyone is logged in** | `await` it |
| Using `username` case-sensitively | `Alice` and `alice` become two accounts | Normalise (`lowercase`, `trim`) |

### ✅ Knowledge Check
1. Why is the field called `passwordHash`, and what does the `toJSON` transform do for it?
2. Why does `/login` return the same message for an unknown user and a wrong password?
3. What does the unique index on `username` guarantee, and which status does a duplicate return?
4. Which single missing word in the login handler would let *anyone* log in?
5. How does `GET /dashboard` make sure each user sees only their own profile?

---

## 7. The Lab: Secure API with JWT

*(The "Secure API with JWT" lab. Learners add `/register` and `/login` endpoints to their API, store hashed passwords, issue JWTs on login, and make their CRUD endpoints "protected." Feedback comes from Postman: `401 Unauthorized` vs. `200 OK`.)*

### 7.1 What you add, what you change

This lab takes the **Module 3 Task API (Path B: Mongoose)** and secures it. The HTTP contract of the task routes stays the same; the difference is that every task route now needs a token and works only on the **caller's own** tasks.

| File | Change |
|---|---|
| `config.js` | **New** — reads and validates environment variables once (Section 8) |
| `models/User.js` | **New** — username, `passwordHash`, `role` (Section 6) |
| `models/Task.js` | **Changed** — adds `owner` (a reference to the user) |
| `store.js` | **Changed** — every function takes the owner's id first (Section 4.4) |
| `validate-user.js` | **New** — registration rules |
| `middleware/auth.js` | **New** — `authenticateToken` and `authorizeRole` (Sections 4–5) |
| `routes/auth.js` | **New** — `/register`, `/login`, `/dashboard` |
| `routes/admin.js` | **New** — admin-only routes (Section 5.2) |
| `routes/tasks.js` | **Changed** — passes `req.user.id` to the store |
| `app.js` | **Changed** — adds security headers, mounts the new routers, protects `/tasks` |
| `server.js` | **Changed** — uses `config`, builds indexes before serving |
| `scripts/create-admin.js` | **New** — creates the first admin (Section 5.3) |

### 7.2 `config.js` and `validate-user.js`

```javascript
// config.js - Read configuration from environment variables ONCE, and stop at startup if a required one is missing.
const required = ['MONGODB_URI', 'JWT_SECRET'];
const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

module.exports = {
  port: process.env.PORT || 3000,
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',        // always include a unit: '1h', '15m', '7d'
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 10,
  loginRateLimit: Number(process.env.LOGIN_RATE_LIMIT) || 10
};
```

```javascript
// validate-user.js - Returns { value } or { errors }. The role is deliberately NOT read from the request.
function validateRegistration(body) {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { errors: ['Request body must be a JSON object'] };
  }

  const errors = [];
  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    errors.push('username must be 3-30 characters: letters, numbers or underscores');
  }
  if (password.length < 8) {
    errors.push('password must be at least 8 characters');
  }
  if (Buffer.byteLength(password, 'utf8') > 72) {
    errors.push('password must be at most 72 bytes (a bcrypt limit)');
  }

  return errors.length ? { errors } : { value: { username, password } };
}

module.exports = { validateRegistration };
```

Registration validation, run:

```text
$ curl -X POST -d '{"username":"al","password":"short"}' localhost:3000/register
{"error":"Validation failed","details":["username must be 3-30 characters: letters, numbers or underscores","password must be at least 8 characters"]}  [HTTP 400]

$ curl -X POST -d '{"username":"alice","password":"aaaa…(73 characters)…aaaa"}' localhost:3000/register
{"error":"Validation failed","details":["password must be at most 72 bytes (a bcrypt limit)"]}  [HTTP 400]

$ curl -X POST -d '{"username":"alice"' localhost:3000/register
{"error":"Expected ',' or '}' after property value in JSON at position 19 (line 1 column 20)"}  [HTTP 400]
```

Password rules are deliberately modest here (length only); stronger policies, breach checks and "forgot password" flows are 🔒 outside this module.

### 7.3 `routes/auth.js` — register, login, dashboard

This is the complete file, including a **rate limiter** (Section 9) that slows down password guessing:

```javascript
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const config = require('../config');
const { validateRegistration } = require('../validate-user');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Slow down password guessing: at most N register/login attempts per IP address per 15 minutes.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.loginRateLimit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again later.' }
});

router.post('/register', authLimiter, async (req, res) => {
  const { value, errors } = validateRegistration(req.body);
  if (errors) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  const passwordHash = await bcrypt.hash(value.password, config.bcryptRounds);
  try {
    // Only username and passwordHash are used. The role takes its default ('user').
    const user = await User.create({ username: value.username, passwordHash });
    res.status(201).json(user);
  } catch (error) {
    if (error.code === 11000) {                       // the unique index on username
      return res.status(409).json({ error: 'Username already taken' });
    }
    throw error;
  }
});

router.post('/login', authLimiter, async (req, res) => {
  const username = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  const user = await User.findOne({ username });
  const passwordOk = user ? await bcrypt.compare(password, user.passwordHash) : false;

  // The SAME message and status for "no such user" and "wrong password": don't reveal which usernames exist.
  if (!passwordOk) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = jwt.sign(
    { sub: user.id, username: user.username, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
  res.json({ token, user });
});

// Any logged-in user: their own profile.
router.get('/dashboard', authenticateToken, (req, res) => {
  res.json({ message: `Welcome, ${req.user.username}!`, user: req.user });
});

module.exports = router;
```

### 7.4 Models, routes, app and server

**`models/Task.js`** — each task now belongs to a user:

```javascript
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }   // who this task belongs to
  },
  { timestamps: true }
);

taskSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.owner;
    return ret;
  }
});

module.exports = mongoose.model('Task', taskSchema);
```

**`store.js`** — as in Section 4.4 (owner-scoped).

**`routes/tasks.js`** — the same router as Module 3, with one difference in every handler: the owner comes from the verified token, and is passed to the store. For example:

```javascript
router.get('/:id', async (req, res) => {
  const task = await store.get(req.user.id, req.taskId);     // was: store.get(req.taskId)
  if (!task) {
    return res.status(404).json({ error: `Task ${req.taskId} not found` });
  }
  res.json(task);
});

router.post('/', async (req, res) => {
  const { value, errors } = validateTask(req.body);
  if (errors) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }
  const task = await store.create(req.user.id, value);       // was: store.create(value)
  res.status(201).location(`/tasks/${task.id}`).json(task);
});
```
Do the same for `list`, `replace`, `update` and `remove`: insert `req.user.id` as the first argument.

**`app.js`** — the whole wiring in one place:

```javascript
const express = require('express');
const helmet = require('helmet');
const requestLogger = require('./middleware/request-logger');
const { authenticateToken } = require('./middleware/auth');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const tasksRouter = require('./routes/tasks');
const { notFound, errorHandler } = require('./middleware/errors');

const app = express();

app.use(requestLogger);
app.use(helmet());                       // a bundle of safe default security headers
app.use(express.json());

app.use(authRouter);                                 // POST /register, POST /login, GET /dashboard
app.use('/admin', adminRouter);                      // admin only
app.use('/tasks', authenticateToken, tasksRouter);   // every task route now requires a valid token

app.use(notFound);
app.use(errorHandler);

module.exports = app;
```

**`server.js`** — as in Module 3, with `config` and index building:

```javascript
const mongoose = require('mongoose');
const config = require('./config');
const app = require('./app');
const connectDB = require('./db');
const User = require('./models/User');
const Task = require('./models/Task');

async function start() {
  await connectDB();                       // fail fast if the database is unreachable
  await Promise.all([User.init(), Task.init()]);   // make sure the unique/other indexes exist before serving requests

  const server = app.listen(config.port, (error) => {
    if (error) {
      console.error('Could not start the server:', error.message);
      process.exit(1);
    }
    console.log(`Secure Task API listening on http://localhost:${config.port}`);
  });

  async function shutdown() {
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  }
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((error) => {
  console.error('Startup failed:', error.message);
  process.exit(1);
});
```

Start it with `node --env-file=.env server.js`. (`User.init()` waits for the unique index on `username` to exist — otherwise two simultaneous registrations right after a fresh start could both succeed.)

### 7.5 Path A — PostgreSQL + Prisma: what's different

*(An adaptation of the Module 3 Prisma code; the Prisma pieces it uses — creating rows, `P2002`, relations — were run in Module 3, but I did **not** run this specific adaptation. The Mongoose version above is the one that was run end to end.)*

```prisma
model User {
  id           Int    @id @default(autoincrement())
  username     String @unique
  passwordHash String
  role         String @default("user")
  tasks        Task[]
}

model Task {
  id        Int      @id @default(autoincrement())
  title     String
  completed Boolean  @default(false)
  createdAt DateTime @default(now())
  ownerId   Int
  owner     User     @relation(fields: [ownerId], references: [id], onDelete: Cascade)
}
```

| Topic | Mongoose (above) | Prisma |
|---|---|---|
| Duplicate username | error `code === 11000` | error `code === 'P2002'` |
| Find for login | `User.findOne({ username })` | `prisma.user.findUnique({ where: { username } })` |
| Owner-scoped read | `Task.findOne({ _id, owner })` | `prisma.task.findFirst({ where: { id, ownerId } })` |
| Owner-scoped delete | `findOneAndDelete({ _id, owner })` | `prisma.task.deleteMany({ where: { id, ownerId } })` and check `count > 0` |
| Owner-scoped update | `findOneAndUpdate({ _id, owner }, …)` | `findFirst` for ownership, then `update({ where: { id }, data })` |
| Remove a user's tasks | `Task.deleteMany({ owner })` | `onDelete: Cascade` on the relation |
| User id in the token (`sub`) | a string (ObjectId) | convert: `Number(payload.sub)` before using it as `ownerId` |

Prisma's `update` and `delete` need a *unique* `where`, which is why ownership is checked with `findFirst`/`deleteMany` instead — the idea (**scope every query to the owner**) is identical.

### 7.6 Testing it — what Postman should show

The lab's feedback loop is Postman: **`401 Unauthorized` vs. `200 OK`**. A workable setup *(Postman is a graphical app; these steps describe the standard workflow and I did not run Postman itself)*:

1. Create a collection. Add **Register** (`POST /register`) and **Login** (`POST /login`) requests with JSON bodies.
2. In **Login**'s **Tests** tab, save the token into a collection variable:

   ```javascript
   pm.test('login returns a token', () => pm.response.to.have.status(200));
   pm.collectionVariables.set('token', pm.response.json().token);
   ```
3. On the **collection's Authorization** tab choose **Bearer Token** and enter `{{token}}`; every request in the collection now sends `Authorization: Bearer <the saved token>`.
4. Add the task requests (`GET /tasks`, `POST /tasks`, `GET/PUT/PATCH/DELETE /tasks/:id`) and the admin request.
5. Test each outcome on purpose: **no token** → `401`; a **normal user** on the admin route → `403`; **another user's task** → `404`; **correct token** → `200`/`201`/`204`.

The same checks work from `curl` — everything in Sections 3–5 was done that way.

### Exercises

**Level 1 — Basic:** Secure your Module 3 API end to end and prove: no token → `401`, valid token → `200`.

**Level 2 — Practical:** Make `GET /tasks` support `?completed=true` for the owner's tasks only, and write the `curl` calls that show two users get different results.

**Level 3 — Challenge:** Add `PATCH /me/password`: an authenticated user sends `{ currentPassword, newPassword }`; verify the current one with bcrypt, validate the new one, store the new hash. What should happen to tokens issued before the change (hint: Section 3.5.1)?

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| Protecting `/tasks` but forgetting to scope the queries | Any user reaches everyone's tasks | Owner-scoped store functions |
| Taking the owner from the request body | A user can create tasks "as" anyone | `req.user.id` from the token |
| Building indexes lazily (no `User.init()`) | Rare race: duplicate usernames right after startup | Await `init()` before listening |
| Reading `JWT_SECRET` from different places in different files | Sign and verify with different secrets → `invalid signature` | One `config.js` |
| Returning the whole `user` document including the hash | Leaks the hash | `toJSON` transform |
| Prisma: using the token's `sub` (a string) as `ownerId` (an `Int`) | Type error | `Number(payload.sub)` |
| Starting the server with no `JWT_SECRET` | Tokens can't be signed (or are signed with `undefined`) | `config.js` stops at startup |

### ✅ Knowledge Check
1. List the files you add and the files you change in the lab, and why `routes/tasks.js` barely changes.
2. Where does the owner id in `store.create(req.user.id, value)` come from, and why is that safe?
3. Why does the server call `User.init()` before listening?
4. In Postman, how does the token from `/login` reach every other request?
5. What are the differences between the Mongoose and Prisma ownership checks?

---

## 8. Configuration & Secrets: Environment Variables

*(Learning objective: implement environment variables for managing configuration and secrets.)*

### 8.1 Configuration vs. secrets

| | Examples | Rule |
|---|---|---|
| **Configuration** | `PORT`, `JWT_EXPIRES_IN`, `BCRYPT_ROUNDS`, `LOGIN_RATE_LIMIT` | Changes between environments (your laptop, staging, production) — keep it **out of the code** so one build runs anywhere |
| **Secrets** | `JWT_SECRET`, `MONGODB_URI` (it contains a password), API keys | Must **never** be in source code, Git, logs, or error messages |

An **environment variable** is a named string supplied to the process from the outside (your shell, a `.env` file, the hosting platform, a container). The same code reads `process.env.NAME` wherever it runs — the idea behind the "twelve-factor" style of apps *(general knowledge)*. This is what the previous modules used for `PORT` and the database URL; now the stakes are higher, because **a leaked `JWT_SECRET` lets anyone forge a token for any user, including an admin.**

### 8.2 Where the values come from

```text
.env                  (git-ignored; for your machine)           JWT_SECRET=0a18039a…
.env.example          (committed; fake values; documents the names)
the shell / platform  (production: set in the host's dashboard, the container, the CI system)
```

```text
# .env.example  - copy to .env and fill in real values
MONGODB_URI=mongodb://127.0.0.1:27017/secureportal
JWT_SECRET=                      # generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_EXPIRES_IN=1h
BCRYPT_ROUNDS=10
LOGIN_RATE_LIMIT=10
```

Load the file with Node's built-in flag, no package needed:

```bash
node --env-file=.env server.js
```
(`package.json`: `"start": "node --env-file=.env server.js"`.) The `dotenv` package (`import 'dotenv/config'`) does the same job and is what Module 3's Prisma path used.

**Real environment variables win over the file.** This was observed: `.env` said `LOGIN_RATE_LIMIT=100`, but starting the server with `LOGIN_RATE_LIMIT=5 node --env-file=.env server.js` gave a limit of 5 — the sixth login attempt got a `429`. That is exactly what you want in production, where the platform's settings override whatever file is present.

### 8.3 Read them in one place, and fail fast

Scattering `process.env.X` through the code makes typos invisible (`process.env.JWT_SCRET` is just `undefined`). The lab's `config.js` (Section 7.2) reads everything **once**, applies defaults, converts types, and **stops the server at startup** if a required value is missing. Starting with an empty environment:

```text
$ node server.js          (no JWT_SECRET, no MONGODB_URI)
Missing required environment variables: MONGODB_URI, JWT_SECRET
exit code: 1
```

That is far better than starting happily and then signing tokens with `undefined` (Section 10). Two details to remember:

- **Environment variables are always strings.** `Number(process.env.PORT)` converts; and `process.env.DEBUG === 'false'` is a *string* — the string `'false'` is **truthy** in JavaScript, so `if (process.env.DEBUG)` would be `true`. Compare strings explicitly.
- **Units for durations:** `JWT_EXPIRES_IN=1h`, never `3600` as a string (Section 3.5).

### 8.4 Keeping secrets secret

| Do | Don't |
|---|---|
| `.gitignore` the `.env` **before** your first commit | Commit it "just this once" — Git remembers forever |
| Use a different secret in every environment | Reuse the development secret in production |
| Generate secrets randomly (the one-liner above) | Invent a memorable one (`"supersecret"`) |
| Set production values in the platform's secret/environment settings | Paste secrets into chat, tickets or screenshots |
| Keep secrets out of logs and error responses | `console.log(process.env)` or `console.log(req.body)` on login |
| Rotate a secret if it might have leaked (all tokens then become invalid) | Hope nobody saw it |

**If you commit a secret by accident, treat it as compromised:** rotate it. Deleting the file in a later commit does not remove it from history.

### Try it yourself

1. Create `.env` and `.env.example`, add `.env` to `.gitignore`, and confirm `git status` doesn't list `.env`.
2. Start the server with `JWT_SECRET` missing and read the message. Then start it with `LOGIN_RATE_LIMIT=2` in the shell and confirm it overrides the file.
3. Set `JWT_EXPIRES_IN=3600` (no unit) and measure the token's lifetime with `jwt.decode`. Fix it.

### Exercises

**Level 1 — Basic:** Move every hard-coded constant in your API (port, bcrypt cost, token lifetime) into `config.js` with sensible defaults.

**Level 2 — Practical:** Make `config.js` refuse to start if `JWT_SECRET` is shorter than 32 characters, with a clear message.

**Level 3 — Challenge:** Add `NODE_ENV` handling so that, in `production`, the server refuses to start with the example secret from `.env.example`, and error responses never include internal messages.

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| Committing `.env` | Secrets leak into Git history | `.gitignore` + `.env.example` |
| Hard-coding the secret "for now" | It stays; it gets committed | Always read from the environment |
| `process.env.JWT_SCRET` (a typo) | Silently `undefined` | One `config.js` that validates names |
| Starting without validating required variables | Mysterious failures later | Fail fast at startup |
| Treating `'false'` as `false` | Non-empty strings are truthy | Compare to the string, or parse explicitly |
| A duration without a unit | `'3600'` = 3 seconds | `'1h'` |
| Logging environment variables | Secrets end up in log storage | Never log them |

### ✅ Knowledge Check
1. What is the difference between configuration and a secret? Give two examples of each.
2. Which wins when a variable is set both in the shell and in `.env`?
3. Why does `config.js` stop the process at startup when `JWT_SECRET` is missing?
4. Why is `if (process.env.DEBUG)` wrong for a variable set to `false`?
5. What do you do if a secret was committed to Git?

---

## 9. Hardening Basics

*(Supporting the module's "Authentication & Security" theme. Authentication is one layer; these are the cheap, high-value ones to add around it.)*

### 9.1 Use HTTPS

A token or password sent over plain HTTP can be read by anyone on the network path. In production, **always serve over HTTPS**. You normally don't configure TLS inside the Node process: the hosting platform or a reverse proxy in front of it terminates HTTPS and forwards requests to your app *(general knowledge; Section 12)*. The `Strict-Transport-Security` header below tells browsers to insist on HTTPS for your domain.

### 9.2 Security headers with `helmet`

**`helmet`** sets a bundle of protective HTTP response headers with one line:

```javascript
const helmet = require('helmet');
app.use(helmet());
```

Selected headers from a real response of the secured API (long values shortened):

```text
$ curl -i localhost:3000/dashboard
Content-Security-Policy: default-src 'self';base-uri 'self';font-src 'self' https: data:;…
Cross-Origin-Opener-Policy: same-origin
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
(no X-Powered-By header: helmet removed it)
```

| Header | What it does *(general knowledge)* |
|---|---|
| `Strict-Transport-Security` | Browsers must use HTTPS for this site from now on |
| `X-Content-Type-Options: nosniff` | Stops browsers guessing a file's type (a class of attacks) |
| `X-Frame-Options` | Controls whether the site may be shown inside another site's frame (clickjacking) |
| `Content-Security-Policy` | Limits where scripts, styles and images may load from — mostly relevant to HTML pages, less to a JSON API |
| `Referrer-Policy` | Limits what URL information is sent to other sites |
| `X-Powered-By` (removed) | Announced "Express" to the world (Backend Module 2) |

`helmet` is a sensible default, not a complete security solution. Order it near the top, before your routes.

### 9.3 Rate limiting: slowing down password guessing

Without limits, an attacker can try millions of passwords against `/login`. **`express-rate-limit`** caps how many requests one client (identified by IP address) may make in a time window. The lab applies it to `/register` and `/login`:

```javascript
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,        // the time window: 15 minutes
  limit: 5,                        // at most 5 requests per window per client (from config in the lab)
  standardHeaders: 'draft-8',      // tell clients their remaining allowance in standard headers
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again later.' }
});
router.post('/login', authLimiter, loginHandler);
```

Seven wrong-password attempts in a row, with the limit set to 5:

```text
attempt 1 -> 401
attempt 2 -> 401
attempt 3 -> 401
attempt 4 -> 401
attempt 5 -> 401
attempt 6 -> 429
attempt 7 -> 429
last response body: {"error":"Too many attempts. Try again later."}

HTTP/1.1 429 Too Many Requests
RateLimit: "5-in-15min"; r=0; t=900
RateLimit-Policy: "5-in-15min"; q=5; w=900; pk=:MTJjYTE3YjQ5YWYy:
Retry-After: 900
```

The sixth attempt gets **`429 Too Many Requests`**, and the headers tell a well-behaved client how long to wait (`Retry-After: 900` seconds). Points to remember:

- It is **per IP address**: many users behind one office network share a limit, and an attacker can spread attempts across addresses. Rate limiting *slows* guessing; it doesn't make weak passwords safe.
- Behind a **proxy or load balancer** the app sees the proxy's address unless you tell Express to trust the proxy header (`app.set('trust proxy', …)`) — check the documentation for your setup *(general knowledge)*.
- By default the counters live **in the server's memory**. With several servers (Section 11) each keeps its own count, so a shared store such as Redis is needed — 🔒 outside this module.
- Account lockout after repeated failures is another technique — 🔒 later.

### 9.4 More habits that matter

| Habit | Why |
|---|---|
| **Validate every input** (types, lengths, formats) | Done in Modules 2–4; never trust the client |
| **Limit body size** | `express.json()` already rejects huge bodies (Backend Module 2) |
| **Generic error messages to clients; details in logs** | Stack traces and internal messages help attackers |
| **Allow only your frontend's origin in CORS** | `cors({ origin: 'https://your-app.example' })`; CORS is not access control (Backend Module 2) |
| **Never log credentials, tokens or hashes** | Logs are often widely readable |
| **Keep dependencies updated; run `npm audit`** *(general knowledge)* | Known vulnerabilities in libraries are a common way in |
| **Least privilege everywhere** | Default role `user`; a database user with only the rights the app needs |

### 9.5 What this module doesn't cover (🔒)

Multi-factor authentication · OAuth and "log in with Google/GitHub" · refresh-token rotation · password reset and email verification · account lockout policies · CSRF protection for cookie-based sessions · security testing and audits · compliance requirements.

### Try it yourself

1. Add `helmet()` and compare the response headers before and after with `curl -i`.
2. Set the login limit to 3 and trigger a `429`. Read the `Retry-After` header.
3. Find the `X-Powered-By` header before `helmet`, and confirm it is gone afterwards.

### Exercises

**Level 1 — Basic:** Add `helmet` to your API and list three headers it added.

**Level 2 — Practical:** Apply a *stricter* limiter to `/login` than to `/register`, each with its own counter.

**Level 3 — Challenge:** Explain why a limit of "5 attempts per IP" is both too strict for a university campus and too lenient for an attacker with 1,000 addresses, and propose one additional defence.

### ✅ Knowledge Check
1. Why must tokens and passwords only travel over HTTPS?
2. What does `helmet` do, and why isn't it enough by itself?
3. What status does a rate-limited request receive, and which header says when to retry?
4. Why does an in-memory rate limiter stop working correctly with several servers?

---

## 10. Debugging Authentication Issues

*(Learning activity: Review & Technical Session — the instructor reviews the authentication middleware logic and helps debug common issues with password hashing or token validation. This section is the written companion.)*

### 10.1 A method

```text
1. WHAT STATUS CODE?     401 (not authenticated)  /  403 (not permitted)  /  404  /  500 (a bug)
2. WHAT DID THE CLIENT SEND?   the Authorization header — exactly "Bearer <token>"?
3. WHAT IS IN THE TOKEN?       decode it (jwt.decode) and read sub, role, exp
4. WHAT DOES THE SERVER BELIEVE?   the same JWT_SECRET for signing and verifying? loaded at all?
5. WHICH MIDDLEWARE RAN, IN WHAT ORDER?
6. WHAT IS IN THE DATABASE?    does the hash look like $2b$10$…? is the role what you expect?
```

A temporary helper for step 3 — it **never prints the secret or the full token**:

```javascript
const jwt = require('jsonwebtoken');
console.log('claims:', jwt.decode(token));            // reads the payload without verifying
console.log('expires in (s):', jwt.decode(token).exp - Math.floor(Date.now() / 1000));
```

### 10.2 Error messages you will actually see

Every message below was produced on purpose by the code shown:

| Message | Where | Cause | Fix |
|---|---|---|---|
| `data and hash arguments required` | `bcrypt.compare(undefined, hash)` or `compare(plain, undefined)` | One side is `undefined`: the body wasn't parsed (no `Content-Type: application/json`), or the user's field is named differently (`user.password` vs `user.passwordHash`) | Check `req.body` and the field name |
| `data and salt arguments required` | `bcrypt.hash(undefined, 10)` | `req.body.password` is `undefined` | Validate the body before hashing |
| `compare()` is always `false` | `bcrypt.compare('secret123', 'secret123')` | The "hash" in the database is actually a **plain-text password** (or truncated/garbled) | Re-register; check the stored value starts with `$2b$` |
| `secretOrPrivateKey must have a value` | `jwt.sign(payload, undefined)` | `JWT_SECRET` isn't loaded (`.env` not read, typo) | `node --env-file=.env …`; use `config.js` |
| `secret or public key must be provided` | `jwt.verify(token, undefined)` | Same, on the verifying side | Same |
| `invalid token` | `jwt.verify("Bearer " + token, secret)` or garbage | The word `Bearer ` is part of the token string, or the header was mangled | Split the header on the space and verify only the token |
| `invalid signature` | Wrong secret, or a tampered token | Signed with one secret, verified with another (different environments, a regenerated random secret on each restart, two servers with different `.env`) — or an attacker | Use one stable secret per environment |
| `jwt expired` | Token older than `exp` | Normal expiry — or `expiresIn: '3600'` (3 seconds!) | Log in again; fix the unit |
| `jwt must be provided` | `jwt.verify('', secret)` | Empty token (`Authorization: Bearer ` with nothing after) | Check how the client builds the header |

### 10.3 HTTP-level symptoms

| Symptom | Likely cause |
|---|---|
| **`401` on every request**, even right after logging in | The header isn't being sent: Postman's `{{token}}` variable is empty; the Angular interceptor isn't registered; the header name or scheme is wrong |
| **Login works, but `/dashboard` is `401 Invalid token`** | Signed and verified with different secrets — frequently two environments or two server copies |
| **`401 Token expired` shortly after login** | `JWT_EXPIRES_IN` has no unit (`3600` as a string = 3 seconds) |
| **Unexpected `403`** | The token's `role` isn't what you think (a token issued **before** the role changed); `authorizeRole` placed without `authenticateToken` |
| **`404` for a resource you just created** | Ownership mismatch: the stored `owner` and the token's `sub` don't match (or are different types, e.g. ObjectId vs. string; Prisma `Int` vs. string) |
| **A browser CORS error only on authenticated requests** | The server's CORS settings don't allow the `Authorization` header (or the preflight `OPTIONS` request is being blocked by auth middleware) — the `OPTIONS` preflight carries no token |
| **Works locally, fails in a container or on the host** | Environment variables weren't passed to it (`JWT_SECRET`, `MONGODB_URI`) — check `config.js`'s startup message |
| **Everyone seems logged in** | A missing `await` on `bcrypt.compare` — a Promise is always truthy |
| **`500` on `/register`** | Not awaiting `bcrypt.hash`, or an unhandled error from the database (duplicate key → should be `409`) |

### 10.4 Common root causes, ranked by frequency

1. **A missing `await`** on `bcrypt.hash`, `bcrypt.compare` or a database call.
2. **A different secret** between signing and verifying.
3. **The `Authorization` header format** (`Bearer` + one space + token).
4. **Environment variables not loaded** (the `.env` file isn't in the working directory, or the flag is missing).
5. **Middleware order** (auth after the routes, or `authorizeRole` before `authenticateToken`).
6. **A stale token** (issued before a change you made).

### Try it yourself

1. Produce each error in the table on purpose with a three-line script, and match it to its message.
2. Take a token and decode its payload with `jwt.decode` — find `exp` and say how many minutes remain.
3. Break your API by moving `authenticateToken` below the router it protects. What do you observe?

### Exercises

**Level 1 — Basic:** Your login always returns `401` for a correct password. List four places to look, in order.

**Level 2 — Practical:** A teammate reports "`/tasks` works for me but returns `401 Invalid token` on staging". Write the three questions you'd ask first.

**Level 3 — Challenge:** Add **safe** debug logging to `authenticateToken`: log the failure *kind* (`TokenExpiredError`, `JsonWebTokenError`) and the request path, but never the token or the secret. Explain why not.

### ✅ Knowledge Check
1. What does `invalid signature` usually mean, and what are three possible causes?
2. Why does `bcrypt.compare` throw `data and hash arguments required`?
3. Which two mistakes cause "login works but the next request is `401`"?
4. Why does a CORS preflight `OPTIONS` request interact badly with authentication middleware?

---

## 11. Scalability, Containers and Docker

*(From the second block of objectives in your module file: explain core scalability concepts (vertical vs. horizontal) and containerization, and containerize a Node.js app and its database with Docker and Docker Compose. Your file lists no lesson or resource for these, so this is a practical introduction.)*

> ⚠️ **Not run.** Docker isn't available in my environment, so the Dockerfile and Compose files below are **unrun**: they follow standard practice, and the Node application inside them is the code that *was* run. If a command or image tag behaves differently on your Docker version, trust Docker's documentation.

### 11.1 Scalability: vertical vs. horizontal

**Scalability** is an application's ability to handle more load — more users, more requests, more data.

| | **Vertical scaling ("scale up")** | **Horizontal scaling ("scale out")** |
|---|---|---|
| What you do | Give **one** server more power (CPU, memory) | Run **more copies** of the server |
| Picture | A bigger kitchen with the same chef | More kitchens, each with a chef, and a host sending customers to them |
| Pros | Simple; no code changes | No single ceiling; survives one copy failing |
| Cons | A hardware limit; one point of failure; downtime to resize | Needs a **load balancer**; your app must be **stateless**; more moving parts |

A **load balancer** is a front door that spreads incoming requests across the copies:

```text
                     ┌──► API copy 1 ─┐
Clients ──► Load     ├──► API copy 2 ─┼──► ONE shared database
            balancer └──► API copy 3 ─┘
```

**This is where the stateless design of Section 1 pays off.** A request can land on *any* copy, so no copy may keep per-user information that the others lack:

| Works unchanged with many copies | Breaks with many copies *(general knowledge)* |
|---|---|
| **JWT verification** — every copy has the same secret and needs no lookup | **Server-side sessions** stored in each copy's memory (need a shared store) |
| Data in the **shared database** | An **in-memory rate limiter** (each copy counts separately — Section 9.3) |
| Reading configuration from environment variables | Files saved on one copy's disk; in-memory caches; "run once a day" jobs that would run on every copy |

Also remember the database is the shared bottleneck: each API copy keeps its own **connection pool**, so *copies × pool size* must stay below the database's connection limit (Module 3, Section 7).

### 11.2 What is containerization?

A **container** packages an application **with everything it needs to run** — the Node version, the dependencies, the files — so it runs the same on your laptop, a teammate's machine and a server. It is the cure for "it works on my machine".

| Term | Meaning |
|---|---|
| **Image** | A read-only blueprint: your app + its runtime + its dependencies, built from a `Dockerfile` |
| **Container** | A running instance of an image — a lightweight, isolated process |
| **Dockerfile** | The recipe for building an image |
| **Registry** | A place images are stored and shared (Docker Hub and others) |
| **Volume** | Storage that **outlives** a container — essential for a database's files |
| **Docker Compose** | A tool that describes and starts **several containers together** (your API + its database) from one file |

Containers are **not virtual machines**: they share the host's operating-system kernel, so they start fast and use less memory *(general knowledge)*. **Containers are disposable** — you stop and replace them freely — which is why data goes in volumes and configuration comes from environment variables, never baked into the image.

### 11.3 Containerizing the API

**`Dockerfile`** — the recipe for the API's image:

```dockerfile
FROM node:24-slim

WORKDIR /app

# Install dependencies first, so Docker can cache this layer when only your code changes
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
EXPOSE 3000

USER node
CMD ["node", "server.js"]
```

Line by line:

- **`FROM node:24-slim`** — start from an image with Node 24 on a small Debian base. (The `bcrypt` package ships prebuilt binaries for common Linux systems; Alpine-based images use a different C library and may need extra build tools — one reason `-slim` is a safer default *(general knowledge)*.)
- **`COPY package*.json` then `RUN npm ci --omit=dev`** — installs exactly the locked, production-only dependencies. Doing this *before* copying your code lets Docker reuse the cached layer unless your dependencies change.
- **`COPY . .`** — copies the application code.
- **`USER node`** — runs the app as a non-root user (least privilege).
- **`CMD ["node", "server.js"]`** — note there is **no `--env-file`**: inside a container the configuration is *provided to* the container (Compose or the platform), not read from a file baked into the image.

**`.dockerignore`** — keep junk and **secrets** out of the image:

```text
node_modules
.env
.git
npm-debug.log
```

**Build and run:**

```bash
docker build -t task-api .
docker run --rm -p 3000:3000 --env-file .env task-api
```

`-p 3000:3000` publishes the container's port on your machine; `--env-file .env` passes the variables in. **A trap:** inside a container, **`127.0.0.1` means the container itself**, so `MONGODB_URI=mongodb://127.0.0.1:27017/…` won't reach a database on your machine or in another container. That is what Compose solves.

### 11.4 The API and its database together: Docker Compose

**`compose.yaml`** *(MongoDB version)* — two services on a private network, where each service's name is its hostname:

```yaml
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      MONGODB_URI: mongodb://mongo:27017/secureportal      # "mongo" is the other service's name
      JWT_SECRET: ${JWT_SECRET}                             # taken from your shell or a .env file next to this file
      JWT_EXPIRES_IN: 1h
    depends_on:
      mongo:
        condition: service_healthy                          # wait until the database answers

  mongo:
    image: mongo:8
    volumes:
      - mongo-data:/data/db                                 # the database's files live in a volume
    healthcheck:
      test: ["CMD", "mongosh", "--quiet", "--eval", "db.adminCommand('ping')"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  mongo-data:
```

```bash
docker compose up --build       # build the API image and start both containers
docker compose logs -f api      # follow the API's logs
docker compose down             # stop and remove the containers (the volume — your data — stays)
```
(`docker compose down -v` also removes the volume: **that deletes your database.**)

Key ideas:

- **`mongo` as the hostname.** Compose puts both services on one network where each can reach the other by service name, so the API connects to `mongodb://mongo:27017/…`.
- **`volumes`** keep the database files when the container is replaced.
- **`healthcheck` + `depends_on`** make the API wait for a database that is actually ready — recall that the server **fails fast** if it can't connect at startup.
- **Secrets come from the environment**, not the file: `${JWT_SECRET}` is substituted from your shell or a git-ignored `.env`, so the secret is never committed.

**The PostgreSQL + Prisma variant** replaces the database service and the connection string:

```yaml
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: tasks_db
    volumes:
      - pg-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d tasks_db"]
      interval: 5s
      timeout: 5s
      retries: 10
```
with `DATABASE_URL: postgresql://app:${POSTGRES_PASSWORD}@postgres:5432/tasks_db` on the API service. Applying migrations (`npx prisma migrate deploy`) needs the Prisma command-line package inside the image — which `npm ci --omit=dev` would skip if it is a dev dependency — so run migrations as a separate step or install it as a regular dependency *(a common gotcha; check Prisma's deployment guide)*.

### Try it yourself

1. Draw the horizontal-scaling diagram for your API and mark which parts of *your* code (sessions? rate limiting? files?) would break with three copies.
2. Write the `Dockerfile` and `.dockerignore`, build the image, run it, and test `/register` with `curl`.
3. Write the Compose file, run `docker compose up`, create a user, then `docker compose down` and `up` again — is the user still there? Why?

### Exercises

**Level 1 — Basic:** Explain vertical vs. horizontal scaling to a non-programmer, with one analogy.

**Level 2 — Practical:** Containerize your API and database with Compose, with the database's data in a volume.

**Level 3 — Challenge:** Add a `GET /health` endpoint and a Compose `healthcheck` for the **API** service that uses it. What should the endpoint check?

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| `MONGODB_URI` pointing at `127.0.0.1` inside a container | That's the container itself | The database service's name (`mongo`) |
| Copying `.env` into the image | Secrets baked into a shareable image | `.dockerignore` it; pass variables at run time |
| No volume for the database | Data vanishes when the container is replaced | A named volume |
| `docker compose down -v` out of habit | Deletes the volume and your data | `down` (without `-v`) |
| Copying all files before `npm ci` | Every code change reinstalls dependencies | Copy `package*.json`, install, then copy the code |
| In-memory sessions/rate limits with several copies | Each copy has its own state | Stateless design or a shared store |
| API starts before the database is ready | Startup fails (fail-fast) | `healthcheck` + `depends_on: condition: service_healthy` |

### ✅ Knowledge Check
1. What is the difference between vertical and horizontal scaling, and what does horizontal scaling require of your code?
2. Why do JWTs suit horizontal scaling better than in-memory sessions?
3. What is the difference between an image and a container?
4. Why does the API reach the database at `mongo:27017` and not `localhost:27017` inside Compose?
5. What is a volume for, and what does `docker compose down -v` do?

---

## 12. Deploying to the Cloud

*(From the second block of objectives: deploy a containerized application to a cloud platform (e.g., AWS, Vercel, Railway).)*

> ⚠️ **Not run.** I haven't deployed anything to these platforms here. This section is a platform-neutral checklist and a general comparison *(general knowledge)*; each platform's current documentation is the authority, because their interfaces and pricing change.

### 12.1 What "deploying" means

Deploying means running your app **on a machine that is always on and reachable from the internet**, with its own HTTPS address, its own database and its own configuration. The steps are the same everywhere; the buttons differ.

### 12.2 The checklist

| Step | Why |
|---|---|
| **Listen on `process.env.PORT`** | The platform chooses the port (your `config.js` already does this) |
| **Set every variable in the platform's settings**: `JWT_SECRET` (a *new* random one!), `MONGODB_URI` or `DATABASE_URL`, `JWT_EXPIRES_IN`, `NODE_ENV=production` | Nothing secret in Git or the image |
| **A hosted database** with its own connection string | Your laptop's `localhost` database isn't reachable; use MongoDB Atlas, a managed PostgreSQL, or a database service on the same platform |
| **HTTPS** | Usually provided by the platform (Section 9.1) |
| **A start command** (or a Dockerfile) | `node server.js` or `npm start` |
| **A health endpoint** | Lets the platform know the app is alive |
| **CORS set to your deployed frontend's origin** | So the Angular app is allowed to call the API |
| **Run migrations** (Prisma: `migrate deploy`) | The production database needs its tables |
| **Check the logs** | Where you'll see `Missing required environment variables…` or a connection error first |

A minimal health endpoint (register it **before** the protected routes and keep it public):

```javascript
app.get('/health', (req, res) => res.json({ status: 'ok' }));
```

### 12.3 The platforms named in your file *(general knowledge — verify each in its docs)*

| Platform | Typical fit | Notes |
|---|---|---|
| **Railway** | Beginner-friendly: connect a Git repository (or a Dockerfile), set variables in a dashboard, add a database service | Quick path to a running API plus a database |
| **AWS** | A large catalogue: virtual machines (EC2), container services (ECS, App Runner), managed platforms (Elastic Beanstalk), managed databases | Most control and most to learn; you configure networking, permissions and HTTPS yourself |
| **Vercel** | Best known for frontends and **serverless functions** | A long-running Express server holding a persistent database connection is **not** its usual model; check its documentation for running an API there |

Many other platforms follow the same pattern as Railway.

### 12.4 A typical flow (Railway-style)

```text
1. Push your code to a Git repository (with .gitignore protecting .env)
2. Create a project on the platform from that repository (it detects Node or uses your Dockerfile)
3. Add a database (or create one on Atlas) and copy its connection string
4. Set the environment variables in the platform's settings
5. Deploy, then watch the build and runtime logs
6. Smoke-test with curl against the public URL:
      curl https://your-api.example/health
      curl -X POST https://your-api.example/register …        (201)
      curl https://your-api.example/tasks                       (401 without a token)
7. Point the Angular app's environment.apiUrl at the deployed URL; set CORS to the frontend's origin
```

### 12.5 After the first deploy

- **Never reuse your development `JWT_SECRET`** in production; generate a new one.
- **Create the first admin** (Section 5.3's script) against the production database from a trusted machine, or through the platform's console.
- **Watch the logs** and set up alerts *(🔒 monitoring is outside this module)*.
- **Back up the database** *(🔒 outside this module)*.

### Try it yourself

1. Write the checklist for your own API: every environment variable, the start command, the port, the database.
2. Add `/health`, run the API locally, and call it with `curl`.
3. If you have an account, deploy to one platform and smoke-test with the three `curl` calls above.

### Exercises

**Level 1 — Basic:** List every value your API reads from the environment, and mark each as configuration or secret.

**Level 2 — Practical:** Deploy the API and database to a platform of your choice, then register, log in and call a protected route against the live URL.

**Level 3 — Challenge:** Write a short runbook: how to rotate `JWT_SECRET` in production, what users will experience, and how to do it with the least disruption.

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| Hard-coding the port | The platform assigns it | `process.env.PORT` |
| Deploying with the development secret | A secret that lived on laptops is no longer secret | A fresh random secret per environment |
| Pointing `MONGODB_URI` at `localhost` | The host has no database there | The hosted database's URI |
| Forgetting CORS for the deployed frontend | The browser blocks the Angular app's calls | Allow the frontend's origin |
| Forgetting migrations (Prisma) | `P2021: table does not exist` | `prisma migrate deploy` |
| Testing only in the browser | Hides which layer failed | `curl` the public URL first |

### ✅ Knowledge Check
1. Why must the app read its port from `process.env.PORT`?
2. Which values should be set in the platform's settings, and which should never be in Git?
3. Why can't a deployed API use your laptop's `localhost` database?
4. Which `curl` calls give a quick smoke test of a deployed auth API, and what should each return?

---

## 13. Final Module Project: Secure API with JWT

The module's lab is the **"Secure API with JWT"**: add `/register` and `/login` to your API, store **hashed** passwords, issue **JWTs** on login, and make the CRUD endpoints **protected** — reviewed by a TA in a live code review. This project is that lab, taken to a standard you can explain line by line.

### 13.1 Requirements

**Authentication:**

1. `POST /register` — validates input (username 3–30 letters/numbers/underscores; password 8+ characters and at most 72 bytes), **hashes the password with bcrypt**, stores only the hash, and returns `201` with the user (**never** the hash). A duplicate username → `409`.
2. `POST /login` — returns `200` and a **signed JWT** (with `sub`, `username`, `role`, and an expiry) for correct credentials; a wrong password **and** an unknown username both return the **same** `401` message.
3. `GET /dashboard` — a protected route returning the caller's own identity.

**Authorization and protection:**

4. An **`authenticateToken`** middleware verifies `Authorization: Bearer <token>` (pinning `HS256`) and sets `req.user`. Missing/invalid/expired → `401` with a `WWW-Authenticate: Bearer` header.
5. **Every CRUD endpoint is protected** and works **only on the caller's own data** (ownership scoping). Another user's resource → `404`.
6. A **role** (`user` by default, `admin`) and an **`authorizeRole('admin')`** middleware; `DELETE /admin/user/:id` is admin-only (`403` for a normal user). Registration **never** accepts a `role`; the first admin is created by a server-side script.

**Configuration and hardening:**

7. All configuration and secrets come from **environment variables**, read in one `config.js` that **stops the server at startup** if a required variable is missing. `.env` is git-ignored; `.env.example` is committed.
8. `helmet()` is enabled and **rate limiting** protects `/login` and `/register`.
9. Error responses never leak internals; no password, hash, token or secret is logged or returned.

**Evidence for the code review:**

10. A Postman (or Insomnia) collection that demonstrates **`401`, `403`, `404` and `200`** outcomes, with the token saved automatically after login.
11. A `README.md`: how to run it, the environment variables, how to create the first admin, and **one security decision** you made and why.
12. A short written comparison: *stateful sessions vs. stateless JWTs*, and why this API can run as several copies behind a load balancer.

### 13.2 Suggested structure

```text
secure-api/
├── .env                      (git-ignored)      .env.example (committed)
├── package.json              "start": "node --env-file=.env server.js"
├── config.js                 reads + validates environment variables
├── db.js                     connects to the database
├── server.js                 connect -> build indexes -> listen -> clean shutdown
├── app.js                    helmet, parsers, routers, 404, error handler
├── models/                   User.js (passwordHash, role)   Task.js (owner)
├── store.js                  owner-scoped data access
├── validate-user.js          registration rules           validate-task.js
├── middleware/               auth.js (authenticateToken, authorizeRole)   errors.js   request-logger.js
├── routes/                   auth.js   admin.js   tasks.js
└── scripts/create-admin.js   the first admin
```

### 13.3 Required concepts (checklist)

- [ ] Authentication vs. authorization; stateful vs. stateless (Section 1)
- [ ] bcrypt hashing with a salt and a cost factor; async API; the 72-byte limit (Section 2)
- [ ] A signed JWT with an expiry; `verify` with a pinned algorithm (Section 3)
- [ ] `authenticateToken`, `req.user`, correct `401`/`403`/`404` (Sections 4–5)
- [ ] Ownership checks inside the queries (Section 4.4)
- [ ] Roles, `authorizeRole`, no mass assignment (Section 5)
- [ ] Environment variables validated at startup (Section 8)
- [ ] helmet and rate limiting (Section 9)

### 13.4 Acceptance criteria

You should be able to demonstrate, with `curl` or Postman:

| Request | Expected |
|---|---|
| `POST /register` with a valid body | `201`, and no `passwordHash` in the response |
| `POST /register` again with the same username | `409` |
| `POST /register` with `"role":"admin"` | `201`, but the new user's role is `user` |
| `POST /login` wrong password; `POST /login` unknown user | Both `401`, **identical** message |
| `POST /login` correct | `200` + a token whose payload (`jwt.decode`) shows `sub`, `username`, `role`, `exp` |
| `GET /tasks` with no token / a garbage token / an expired token | `401` each (with `WWW-Authenticate`) |
| `GET /tasks` with a valid token | `200`, only **your** tasks |
| User B requests user A's task id | `404` |
| A token with its payload edited | `401` |
| A normal user calls `DELETE /admin/user/:id` | `403` |
| An admin calls it | `204` |
| Start with `JWT_SECRET` missing | The process exits with a clear message |
| The sixth login attempt in the rate-limit window | `429` |

Also: the database holds **only bcrypt hashes** (they start with `$2b$`), and nothing secret is in Git.

### 13.5 Hints

- Build in layers and test each with `curl`: **hashing → register → login → verify middleware → protect one route → ownership → roles → config/hardening**.
- If every request is `401`, read Section 10 before changing code: print `jwt.decode(token)` and check the header format and the secret.
- Reuse Module 3's structure: keep HTTP in the routes, data in the store.
- Test the failure cases as hard as the happy path — a security feature is only proven when the attack is *rejected*.

### 13.6 Optional stretch challenges

- **Refresh tokens:** short-lived access tokens plus a revocable refresh token stored server-side; a `/refresh` endpoint. (🔒 outside this module — a good extension.)
- **Logout that actually revokes:** a denylist of token ids until their expiry.
- **Change password:** `PATCH /me/password` verifying the current password first.
- **Account lockout** after repeated failures, and a per-account (not just per-IP) limit.
- **Automated tests** with Node's built-in test runner (Backend Module 2, Section 6.6): register, login, ownership, roles and expiry (set `JWT_EXPIRES_IN=1s`).
- **Containerize it** (Section 11) and **deploy it** (Section 12); then connect your **Angular** app: a login page, the interceptor, a guard and an error interceptor reacting to `401`.
- **Move to an asymmetric algorithm (RS256)** so other services can verify tokens without being able to create them.

---

## 14. Quick Reference Sheet

### Concepts
```text
AuthN = who are you?            AuthZ = what may you do?
401 = not authenticated         403 = authenticated but not permitted        404 = hide existence (other user's data)
Stateful: server stores the session, client holds an id          Stateless (JWT): token carries identity, server stores nothing
```

### bcrypt
```javascript
const hash = await bcrypt.hash(password, 10);          // register: store ONLY the hash  ($2b$10$<22-char salt><digest>)
const ok   = await bcrypt.compare(password, hash);     // login: true / false
// async only (never *Sync in a server) · cost +1 = twice the work · only the first 72 BYTES count
```

### JWT
```javascript
const token   = jwt.sign({ sub: user.id, username, role }, SECRET, { expiresIn: '1h' });   // ALWAYS a unit: '1h', '15m', '7d'
const payload = jwt.verify(token, SECRET, { algorithms: ['HS256'] });                       // throws: JsonWebTokenError / TokenExpiredError
jwt.decode(token);                                                                          // reads only; NEVER a security check
// header.payload.signature · the payload is readable by anyone · secret: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Middleware
```javascript
// authenticate: 401 if no/invalid token, else req.user = {id, username, role}
// authorize:    403 if req.user.role is not allowed
app.use('/tasks', authenticateToken, tasksRouter);
router.use(authenticateToken, authorizeRole('admin'));         // authenticate FIRST
// ownership: scope every query by the caller:  Task.findOne({ _id: id, owner: req.user.id })
```

### Security checklist
```text
hash with bcrypt · pick fields explicitly (no mass assignment) · role defaults to 'user' · same error for unknown user / wrong password
pin algorithms · short expiry · secret in env only · helmet() · rate-limit /login /register · HTTPS · never log credentials
```

### Environment
```text
node --env-file=.env server.js       real environment variables WIN over the file
config.js reads once, validates, exits if required variables are missing       .env -> .gitignore · .env.example -> committed
```

### curl
```text
curl -X POST -H 'Content-Type: application/json' -d '{"username":"a","password":"…"}' localhost:3000/login
curl -H "Authorization: Bearer $TOKEN" localhost:3000/tasks
curl -i localhost:3000/tasks                      # status line + WWW-Authenticate
```

### Docker *(not run)*
```text
docker build -t task-api .            docker run --rm -p 3000:3000 --env-file .env task-api
docker compose up --build             docker compose down            (down -v also DELETES the data volume)
inside Compose the database host is the SERVICE NAME (mongo / postgres), not localhost
```

### Errors
```text
bcrypt: "data and hash arguments required" (an argument is undefined)      jwt: "invalid signature" (wrong secret / tampered)
jwt: "jwt expired"  ·  "invalid token" (garbled, or "Bearer " left in)      jwt.sign: "secretOrPrivateKey must have a value" (secret not loaded)
```

### 🔒 Coming Later — Outside This Module
OAuth / social login · multi-factor authentication · refresh-token rotation · password reset and email verification · account lockout policies · CSRF defences for cookie sessions · asymmetric JWT algorithms in depth · shared rate-limit stores · security testing, monitoring and compliance.

---

## 15. Source & Resource Mapping

### Learning-objective coverage

| Learning objective | Where it is covered |
|---|---|
| Explain core authentication and authorization concepts (stateful vs. stateless) | Section 1 |
| Implement user registration and login endpoints | Sections 6–7 |
| Secure passwords with hashing and salting (bcrypt) | Section 2 |
| Implement JWT for stateless session management | Section 3 |
| Create protected routes (middleware) requiring a valid JWT | Sections 4–5 |
| *(Second block)* Explain scalability (vertical vs. horizontal) and containerization | Section 11 |
| *(Second block)* Containerize a Node.js app and its database with Docker and Docker Compose | Section 11 *(not run)* |
| *(Second block)* Deploy a containerized app to a cloud platform | Section 12 *(not run)* |
| *(Second block)* Environment variables for configuration and secrets | Section 8 |
| Hands-on challenge: the Secure Portal | Section 6 |
| Lab: Secure API with JWT | Sections 7 and 13 |
| Review & Technical Session: debugging hashing and token issues | Section 10 |

### Resources from your module file

| Module topic | Resource | Where it appears |
|---|---|---|
| Foundations of security — access control logic (video) | [IBM Technology](https://www.youtube.com/watch?v=rvZ35YW4t5k) | Section 1 |
| Password hashing (reading) | [How to hash passwords with bcrypt in Node.js — freeCodeCamp](https://www.freecodecamp.org/news/how-to-hash-passwords-with-bcrypt-in-nodejs/) | Section 2 — *I did not open the article; the key takeaway is quoted from your file* |
| JWT: middleware primer (video) | [CodeLucky](https://www.youtube.com/watch?v=5zb2Lfhamqc) | Section 4 |
| JWT: complete walkthrough (video) | [Web Dev Simplified](https://www.youtube.com/watch?v=mbsmsi7l3r4) | Sections 3 and 4 |
| RBAC (video) | [Web Dev Simplified](https://www.youtube.com/watch?v=jI4K7L-LI58) | Section 5 |
| RBAC (reading) | [Implementing Role-Based Access Control (RBAC) in Node.js — Medium](https://medium.com/@techsuneel99/implementing-role-based-access-control-rbac-in-node-js-871591b80a83) | Section 5 — *I did not open the article; the key takeaway is quoted from your file* |
| Hands-on challenge: the Secure Portal | — | Section 6 |

*I have not watched the videos or opened the two articles; each description is quoted from your module file.*

### Other sources

| Used for | Source |
|---|---|
| bcrypt, JSON Web Token, helmet and rate-limiting behaviour; every authentication output shown | Running the libraries (bcrypt 6.0.0, jsonwebtoken 9.0.3, helmet 8.3.0, express-rate-limit 8.7.1) against Express 5.3.0 and a MongoDB-compatible server |
| Package versions | The npm registry, checked in October 2026 |
| Docker, Docker Compose and cloud deployment (Sections 11–12) | General knowledge — **not run**; Docker's and each platform's documentation are the authority |

---

## 16. Practice Questions

Your module file lists no quiz for this module, so these questions are my own, for practice. Try them first; answers follow.

**Questions**

1. What is the difference between authentication and authorization? Which status code goes with each failure?
2. How do stateful sessions and stateless JWTs differ in where the identity lives, and which scales horizontally more easily?
3. Give two reasons not to store plain-text passwords and one reason not to use plain SHA-256 for them.
4. What is a salt, and why do two users with the same password get different bcrypt hashes?
5. What do the parts of `$2b$10$<22 chars><31 chars>` mean, and why does `bcrypt.compare` need only the password and the hash?
6. What does bcrypt's cost factor do, and how does each +1 change the work?
7. Why must a server use `bcrypt.hash` and not `bcrypt.hashSync`?
8. What happens to a password longer than 72 bytes, and how does the lab handle it?
9. What are the three parts of a JWT? Is the payload encrypted?
10. A client edits a token's payload to say `"role":"admin"`. What happens at `jwt.verify`, and why?
11. Why should `verify` be called with `algorithms: ['HS256']`?
12. What lifetime does `expiresIn: '3600'` produce, and how do you avoid the trap?
13. Write the exact header a client sends with a token.
14. What does `authenticateToken` set on success, and what does it return on failure?
15. A logged-in Bob requests Alice's task. Which status does the API return — `401`, `403` or `404` — and why?
16. What is mass assignment? How does the register endpoint avoid it, and how does the first admin get created?
17. What does `authorizeRole('admin')` return, and why must `authenticateToken` run first?
18. Why do `/login` failures for an unknown username and a wrong password return the same message?
19. What is the downside of storing the role inside the token?
20. After login, the next request returns `401 invalid signature`. Give two likely causes.
21. What is the difference between vertical and horizontal scaling, and why does horizontal scaling need a stateless app?
22. In Docker Compose, why does the API reach the database at `mongo:27017` instead of `localhost:27017`?

**Answer key**

*Prerequisite self-check:*

1. It must either **end the response** or **call `next()`**. 2. **`11000`**. 3. It holds credentials and differs per environment, so it must not be committed to source control. 4. **`Authorization: Bearer <token>`**.

*Practice questions:*

1. **Authentication** = who you are (failure → **401**); **authorization** = what you may do (failure → **403**).
2. Sessions keep the identity in **server-side storage** (the client holds an id); JWTs carry it **in the token** (the server stores nothing). **JWTs** scale horizontally more easily because any copy can verify a token with the shared secret; sessions need a shared store.
3. A database leak would expose every password (and people reuse passwords); anyone with access could read them; a **plain SHA-256** is so fast that attackers can try billions of guesses per second.
4. A **salt** is a random value mixed into each password before hashing; each hash uses a fresh salt, so identical passwords produce different hashes and precomputed tables don't work.
5. `2b` = the algorithm version, `10` = the cost, then the 22-character **salt** and the 31-character digest. The salt and cost are **inside** the hash, so `compare` can re-hash the candidate the same way.
6. It makes each hash deliberately slower; each +1 **doubles** the work.
7. `hashSync` runs on the main thread and **blocks the event loop**, freezing every other request; the async version doesn't.
8. Only the **first 72 bytes** are used (the rest is silently ignored); the lab **rejects** passwords over 72 bytes at registration.
9. **Header, payload, signature**. The payload is only Base64URL-**encoded**, **not encrypted** — anyone can read it.
10. `verify` throws **`invalid signature`**: the signature was computed over the original payload, and the client can't produce a new valid one without the secret.
11. To stop attacks that present a token claiming a different (or no — `alg: none`) algorithm; pinning accepts only the one you expect.
12. A string with no unit is read as **milliseconds** → **3 seconds**. Always include a unit (`'1h'`) or use a number of seconds.
13. **`Authorization: Bearer <token>`**.
14. On success it sets **`req.user`** (`id`, `username`, `role`) and calls `next()`; on failure it returns **`401`** with a `WWW-Authenticate: Bearer` header (and does not call `next()`).
15. **`404`** — the store only searches the caller's own tasks, so Alice's task "doesn't exist" for Bob; `403` would confirm that it exists.
16. **Mass assignment** = passing the whole request body to the database so the client sets fields like `role`. The endpoint **picks `username` and `passwordHash` explicitly** and lets `role` default to `user`. The first admin is created by a **server-side script** (`create-admin.js`), not through `/register`.
17. It returns a **middleware function** that checks `req.user.role` against the allowed roles (`403` on a mismatch). `req.user` is set by `authenticateToken`, so it must run first.
18. So an attacker can't learn **which usernames exist** (user enumeration).
19. The role is a **snapshot until the token expires** — a demoted admin keeps admin rights until then. Use short expiry, or re-check the database on sensitive routes.
20. **Signing and verifying with different secrets** (different environments/servers, a secret regenerated on restart), or the token was **tampered with**.
21. **Vertical** = a bigger single server; **horizontal** = more copies behind a load balancer. A request can hit **any** copy, so no copy may hold per-user state the others lack.
22. Inside Compose, each service is reachable by its **service name** on a private network; **`localhost` inside the API container is the API container itself**.

---

## 17. Glossary

| Term | Meaning |
|---|---|
| **Authentication (AuthN)** | Establishing *who* a caller is |
| **Authorization (AuthZ)** | Deciding *what* an identified caller may do |
| **`401 Unauthorized`** | Not authenticated (missing/invalid/expired credentials) |
| **`403 Forbidden`** | Authenticated, but not permitted |
| **Session (stateful)** | Server-side record of a logged-in user, referenced by an id the client sends |
| **Stateless authentication** | The request carries signed proof of identity; the server stores no session |
| **Hash** | A one-way function: same input → same output; can't be reversed |
| **Salt** | A random value mixed into each password before hashing |
| **Cost factor (salt rounds)** | bcrypt's work setting; +1 doubles the time |
| **bcrypt** | A slow, salted password-hashing algorithm |
| **JWT** | JSON Web Token — a signed, compact token: header.payload.signature |
| **Claim** | A fact in a token's payload (`sub`, `exp`, `role`) |
| **`sub` / `iat` / `exp`** | Subject (user id) / issued-at / expiry — standard claims |
| **HS256** | HMAC-SHA256: sign and verify with one shared secret |
| **Bearer token** | A token sent as `Authorization: Bearer <token>`; whoever holds it gets access |
| **Middleware** | A function `(req, res, next)` in the request pipeline |
| **`req.user`** | The verified identity attached to the request by `authenticateToken` |
| **RBAC** | Role-Based Access Control — permissions granted by role |
| **Least privilege** | Give the minimum access needed (default role = `user`) |
| **Ownership check** | Scoping each query so a user only reaches their own data |
| **Mass assignment** | Letting the client set fields (like `role`) by passing the whole body to the database |
| **User enumeration** | Learning which usernames exist from differing error messages |
| **Rate limiting** | Capping requests per client per time window (`429 Too Many Requests`) |
| **helmet** | Middleware that sets protective HTTP headers |
| **HTTPS / TLS** | Encrypted transport; required so tokens and passwords can't be read in transit |
| **Environment variable** | Configuration or a secret supplied to the process from outside |
| **Secret** | A value that must stay private (`JWT_SECRET`, a database password) |
| **Vertical / horizontal scaling** | A bigger single server / more copies of the server |
| **Load balancer** | Spreads requests across several copies of the app |
| **Container / image** | A running isolated process / the blueprint it starts from |
| **Dockerfile / Docker Compose** | A recipe for an image / a file that runs several containers together |
| **Volume** | Storage that outlives a container (for database files) |
