# FEM32 — Authentication & Security: Secure Task API

Specification: `task/Task-Tracker-with-Authentication.md` (the lab), plus `notes/Module04.md` (module activities, including the
"Secure Portal" challenge). One project covers both: `secure-task-api/`, in the MVC structure the lab recommends.

## Lab requirements -> where

| Lab requirement | Where |
|---|---|
| **1. User model**: name, email, password (hashed), role (user or admin) | `models/User.js` (`password` holds the bcrypt hash, `select: false`; role defaults to "user") |
| Hash passwords with bcrypt before storing | `controllers/authController.js` + `utils/passwords.js` |
| `POST /auth/register`, `POST /auth/login` | `routes/authRoutes.js` |
| **2. JWT**: generated after login, secret in an environment variable, expiry (1h) | `utils/tokens.js`; `JWT_SECRET` / `JWT_EXPIRES_IN` in `.env` via dotenv |
| Authentication middleware: verify the Authorization header, reject, proper status codes | `middleware/authMiddleware.js` (`authenticateToken`) |
| **3. Route protection** (create/update/delete task); users only their own tasks; A cannot delete B's task | `routes/taskRoutes.js` + the owner rules in `controllers/taskController.js` |
| **4. RBAC**: admins view all users and manage all tasks | `middleware/roleMiddleware.js` (`authorizeRole('admin')`), `GET /api/users`, admin branches in the task controller |
| **5. Error handling and responses**: invalid credentials, missing token, unauthorized access, expired token; consistent JSON `{ "status": "error", "message": ... }` | `utils/responses.js`, `middleware/errorHandler.js`, one message per case (README table) |
| **6. Environment configuration**: PORT, DB_URI, JWT_SECRET, JWT_EXPIRES_IN; dotenv; no hard-coded secrets; `.env` not committed | `config/env.js`, `.env.example`, `.gitignore`; tests check all three |
| Recommended MVC project structure | `config/db.js`, `controllers/authController.js` and `taskController.js`, `middleware/authMiddleware.js` and `roleMiddleware.js`, `models/User.js` and `Task.js`, `routes/authRoutes.js` and `taskRoutes.js`, `server.js` (plus a few extra files for admin routes, utilities and tests) |
| Suggested endpoints (`/auth/*`, `/api/tasks`, owner / admin access table) | implemented as listed in the README |
| Test with Postman and validate success / unauthorized / invalid login | `postman/secure-task-api.postman_collection.json` (30 requests, 56 assertions) |
| Optional: Helmet, rate limiting | both added (`helmet`, `express-rate-limit`) |
| Optional: refresh tokens, password reset, email verification, activity logging, profile management, session invalidation, Swagger | **not done** |

Module "Secure Portal" challenge items: `GET /dashboard` and `DELETE /admin/user/:id` are also provided (the second is the same
handler as `DELETE /api/users/:id`). The challenge used a `username`; the lab (which takes priority) uses `name` + `email`.

### Two readings of the access rules (be upfront)

The lab says admins "manage all tasks", but its endpoint table says `PUT /api/tasks/:id` is "Task owner only" and `DELETE` is "Task
owner or admin". I followed the **endpoint table**: an admin can view all tasks and delete any task, but cannot edit someone
else's task (PUT/PATCH is a 404 for them). If the intended meaning is "admins may edit everything", it is a one-line change
(`ownedBy` in `taskController.js`) and one test.

**Result:** 105 tests pass against a real MongoDB; the saved request collection passes 56/56 assertions; every behaviour was also
checked with `curl` on a running server. Six deliberate code breakages (section 8) were each caught by the tests.

The module's second objectives list (scalability, Docker/Compose, cloud deployment) is not part of this lab; only its "environment
variables for configuration and secrets" item is covered here.

### Evaluation criteria (from the task file) -> evidence

| Criterion (weight) | Evidence |
|---|---|
| User registration and login, bcrypt (20%) | `auth.test.js`: hash stored (not the password), salted, role not assignable, unique email, same error for unknown email / wrong password |
| JWT authentication (20%) | `protected.test.js`: issued with `sub`/`role`/`exp`, expiry, tampering, `alg: none`, wrong secret, expired message |
| Protected routes (20%) | `tasks.test.js`: every task route is 401 without a token; ownership rules |
| RBAC (15%) | `users.test.js`, admin sections of `tasks.test.js`: 403 for users, admin powers, DB-checked roles |
| Error handling and security practices (15%) | standard error shape on every path, no internals in 500s, env-only secrets, helmet, rate limiting |
| Code organisation and documentation (10%) | MVC structure, README, this document |

---

## 1. Authentication vs authorization; stateful vs stateless (Objective 1)

- **Authentication (AuthN):** proving **who you are** (email + password -> a token). Failure = **401 Unauthorized**.
- **Authorization (AuthZ):** deciding **what you may do** once we know who you are (only admins delete users; you only see
  your own tasks). Failure = **403 Forbidden**.
- The status codes are named confusingly: 401 really means "unauthenticated", 403 "authenticated but not permitted". The test for
  `DELETE /admin/user/:id` asserts 401 without a token and 403 for a normal user.

**Stateful sessions** keep a record on the server ("session 8f3 belongs to Amina") and give the browser a cookie with
that id. **Stateless tokens (JWT)** put the identity inside a signed token the client sends every time; the server stores
nothing per session, only checks the signature. Trade-offs:

| | Server sessions | JWT |
|---|---|---|
| Server memory/db per login | yes | no |
| Scaling to many servers | needs a shared session store | any server can verify with the secret |
| Logging someone out / revoking | delete the session: instant | token stays valid until it expires (unless you add a check) |
| Where the client keeps it | cookie | usually the `Authorization` header |

**This project's compromise:** the token is stateless, but `authenticateToken` also loads the user from MongoDB on each request,
so deleting a user or changing a role works immediately (section 5). That is "mostly stateless", chosen on purpose.

---

## 2. Passwords: hashing and salting (Objective 3)

**Never store passwords, not even encrypted.** A database leak must not reveal them. Store a **hash**: a one-way function
(you can compute hash(password) but not recover the password from a hash).

Why plain fast hashes (MD5/SHA-256) aren't enough: attackers try billions of guesses per second, and identical passwords give
identical hashes (so a precomputed "rainbow table" cracks many at once). **bcrypt** fixes both:

- **Salt:** a random value generated per password and stored inside the hash string, so two users with the same password
  get different hashes (`test: same password, different salt, different hash`).
- **Cost factor (work factor):** deliberately slow; each +1 doubles the time. Production default here is **12** (a noticeable
  fraction of a second per hash, on purpose); the tests set it to 4 (the minimum) via `BCRYPT_ROUNDS` so 105 tests don't spend minutes hashing.

A bcrypt hash looks like this (real example from the dev database):

```
$2b$12$Zs9zkRXfKPHKwm2itfkW3eb1EP0j8d4UzT1719f9.PZYvCaoXf24.
 │  │  └─ 22-character salt + 31-character hash
 │  └─ cost factor (2^12 rounds)
 └─ algorithm version
```

- `bcrypt.hash(plain, rounds)` creates it; `bcrypt.compare(plain, hash)` re-hashes with the embedded salt and compares in
  constant time. Both are async (they take real time), so they are `await`ed.
- **72-byte limit:** bcrypt ignores everything after 72 bytes. Rather than silently cutting a long passphrase, registration
  **rejects** passwords over 72 *bytes* (measured with `Buffer.byteLength`, since `é` is 2 bytes; a test covers it).
- **Password rules:** at least 8 characters. They are checked at registration only; at login only "a password was provided" is
  checked (rules may have changed since the user registered).
- The hash is stored in the `password` field (the lab's field name, a bcrypt hash and never the plain text), with `select: false` so no normal query returns
  it, and the JSON `transform` deletes it as a second guard. A test checks no response ever contains `$2b$` or "hash".

---

## 3. JSON Web Tokens (Objective 4)

A JWT is `header.payload.signature`, each part base64url-encoded:

```
header    { "alg": "HS256", "typ": "JWT" }
payload   { "role": "user", "sub": "6adf7768a62c75e5e0d29c1a", "iat": 1792511592, "exp": 1792515192 }
signature HMAC-SHA256(header + "." + payload, JWT_SECRET)
```

- **Encoded, not encrypted:** anyone can decode the payload (a test decodes one). So it never contains passwords, hashes or
  secrets; only `sub` (subject = user id), `role`, `iat` (issued at) and `exp` (expiry, 1 hour by default).
- The **signature** proves the payload wasn't changed and was made by someone who knows `JWT_SECRET`. Change one character of the
  payload (say `"role":"admin"`) and verification fails (tested).
- **Verification** (`utils/tokens.js`) pins `algorithms: ['HS256']`. Without that, a token may choose its own algorithm:
  - `alg: "none"` = "no signature needed" (tested: rejected);
  - switching to another algorithm (tested with HS512: rejected).
- Expiry limits the damage of a stolen token. A real system adds **refresh tokens** (short access token + long-lived,
  revocable refresh token); not implemented here.
- The secret comes from the environment, must be at least 32 characters, and the server **refuses to start** otherwise, including with
  the placeholder from `.env.example` (so copying the file unchanged can never produce a "secure" server with a known secret).

---

## 4. The login flow, end to end

```
POST /auth/register {name,email,password}  -> validate -> bcrypt.hash -> save {name, email, password: <hash>, role:"user"} -> 201 (no hash)
POST /auth/login    {email,password}       -> find user -> bcrypt.compare -> sign JWT -> 200 {token}
GET  /dashboard  Authorization: Bearer ... -> authenticateToken -> req.user -> handler
```

Details that matter in `controllers/authController.js`:

1. **The role is never read from the request body.** If it were, `{"name":"x","email":"...","password":"...","role":"admin"}` would
   make anyone an admin (**mass assignment**). A test posts exactly that and checks the user is `user` in the response and in
   the database. Admins are created with `npm run create-admin` (or by promoting an existing user).
2. **Same error for "no such email" and "wrong password"** (`401 Invalid email or password`), so an attacker can't use the login
   form to find which emails are registered. For an unknown email the server still performs one bcrypt comparison against a dummy
   hash, so the two cases also take about the same **time**. Registration necessarily reveals a taken email (409); that is a
   known, accepted trade-off.
3. **NoSQL injection:** `{"email": {"$ne": null}, "password": {"$ne": null}}` would, if passed straight to MongoDB, match any
   user. Validation requires `email` and `password` to be **strings** (anything else is a 400), so the query operators never
   reach the database (tested).
4. Emails are trimmed and lower-cased and have a unique index (a duplicate in different capitals is a 409); passwords must be 8-72 bytes.

### One response shape for everything (`utils/responses.js`)
```json
{ "status": "success", "data": { "user": { ... } } }
{ "status": "error", "message": "Unauthorized access" }
{ "status": "error", "message": "Validation failed", "errors": ["password must be at least 8 characters"] }
```
Every controller and every middleware (authentication, roles, rate limiting, 404, the error handler) answers through the same two
helpers, so clients never have to guess. A test checks `status` and `message` on the error paths, including an unknown route.

---

## 5. Middleware: `authenticateToken` and `authorizeRole` (Objective 5)

Recall middleware = `(req, res, next)`; it can respond or call `next()` to continue. Routes run a chain of them.

### `authenticateToken`
1. Reads `Authorization: Bearer <token>`: missing -> `401 Access denied. No token provided.` (+ `WWW-Authenticate: Bearer`);
   wrong scheme/shape -> 401.
2. `verifyToken`: an **expired** token -> `401 Token expired. Please log in again.` (the lab asks for a distinct expired-token
   message, and "please log in again" reveals nothing sensitive); anything else (bad signature, wrong algorithm, malformed) ->
   `401 Invalid token.`, which doesn't tell an attacker which check failed.
3. **Loads the user from the database** using the token's `sub`. If the user no longer exists -> 401.
4. Sets `req.user = { id, name, email, role }` and calls `next()`.

Why step 3 (the design decision): trusting the token's `role` would mean a demoted or deleted user keeps full power until the token
expires. Reading from the database makes changes immediate: tests show a validly signed token that *claims* `admin` still gets
403 if the database says `user`; promoting the user in the database makes the same old token work as admin at once; deleting the
user makes their token fail at once. Cost: one query per request (the price of not being purely stateless).

### `authorizeRole(...roles)`
A **middleware factory**: `authorizeRole('admin')` returns the middleware. It runs after `authenticateToken` and checks
`req.user.role`; otherwise **403** `Forbidden. This action requires the admin role.` If it is ever used without authentication in
front of it, it answers 401 instead of crashing (tested).

### Using them
```js
router.use(authenticateToken, authorizeRole('admin'));   // every /api/users and /admin route: logged in AND admin; order matters
router.use(authenticateToken);                           // every /tasks route: logged in
```

---

## 6. Authorization of data: ownership and the admin exception

Roles say what kind of user you are; **ownership** says which records are yours. Every task has an `owner` set by the server from
`req.user.id` (a body `owner` is ignored; tested). The access rules from the lab are implemented as small query filters in
`controllers/taskController.js`:

| Action | Who | Query |
|---|---|---|
| list / read | owner, or admin (sees all) | `{ owner }` for users, `{}` for admins |
| create | any logged-in user | `owner` = the caller |
| PUT / PATCH | **owner only** (lab table) | `{ _id, owner }` |
| DELETE | **owner or admin** | `{ _id, owner }` for users, `{ _id }` for admins |

Consequences:

- The list shows only your tasks (admins see everyone's); `/dashboard` counts only yours.
- Someone else's task id gives **404, not 403**, so the API doesn't reveal that the id exists (a test shows the 404 for "not
  yours" has the same shape as for "doesn't exist").
- An admin can read and delete anything but cannot rewrite someone else's task (the lab's endpoint table says "owner only"). A test
  documents that choice.
- Missing the owner check is called **IDOR / broken object-level authorization** and is the most common API vulnerability: a logged-in
  user just changes the id in the URL.
- Deleting a user (`DELETE /api/users/:id` or `/admin/user/:id`) also deletes their tasks so no records point at a missing owner. An
  admin cannot delete themselves (409), to avoid accidentally leaving no admin.

---

## 7. Extra hardening (beyond the module's minimum)

| Measure | Why | Where / test |
|---|---|---|
| **helmet** | sets security headers (`X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, ...) and removes `X-Powered-By` | `app.js`; header test |
| **Rate limiting** on `/auth/*` (10 per 15 min per IP) | slows password guessing; returns JSON 429 | `middleware/rateLimiter.js`; tests with a 3-request limiter and on the real app |
| **10 kB JSON body limit** | these bodies are tiny; refuses large payloads (413) | `app.js`; test |
| **Fail-fast config** | no secret, no start | `config/env.js`; tests |
| **Generic 500s** | no stack traces or driver errors to clients | `middleware/errorHandler.js` |
| **Secrets only from the environment** | not in code or git | `.env` ignored, `.env.example` committed |

Limits: the rate limiter keeps counts in this process's memory (several servers would need a shared store); it counts *all*
attempts per IP including successful ones, which is also why the Postman collection warns about re-running it quickly.

---

## 8. Tests (105) and how they were checked

Test files: `auth.test.js` (register/login), `protected.test.js` (token attacks, dashboard), `tasks.test.js` (authentication, owner
rules, admin rules, error format), `users.test.js` (admin routes, DB-checked roles), `units.test.js` (passwords, tokens, env
configuration, validators, `authorizeRole`, rate limit, headers). They run against a real MongoDB database `task_tracker_auth_test`
that is **dropped afterwards**, and `setup.js` refuses to run on a database whose name doesn't end in `_test`.

Token attacks covered: no header; wrong scheme; missing token; extra parts; garbage; a token signed with another secret; expired
(with its own message); `alg: none`; HS512; tampered payload; no `sub`; user deleted after the token was issued.

Environment rules covered by tests: start-up fails without a (real) `JWT_SECRET`; `.env.example` lists every setting; `.env` is in
`.gitignore`; defaults for `PORT` (5000) and the database name; no source file passes a literal string to `jwt.sign`.

**Do the tests really protect anything?** I deliberately broke the code six ways and ran the suite each time (then restored it):

| Deliberate bug | Tests that failed |
|---|---|
| removed the `algorithms` pin in `verifyToken` | 2 |
| removed the `owner` filter when reading / deleting tasks | 3 |
| let an admin PUT someone else's task (loosened `ownedBy`) | 1 |
| took `role` from `req.body` in `/auth/register` | 1 |
| skipped the "user still exists" check in `authenticateToken` | 4 |
| reported expired tokens as plain "invalid" | 1 |

The suite was back to 105/105 passing afterwards.

**Also checked by hand** on a running server: startup refuses with no secret and with the copied placeholder; `create-admin`
works; register/login/dashboard/tasks/403 flow with `curl`; the stored hash in the `password` field in MongoDB is `$2b$12$...`; once 10 requests from one IP
(register, login and wrong-password attempts) had been made, the next ones got `429`; the 404 response carries `Strict-Transport-Security`, `X-Content-Type-Options` and no `X-Powered-By`.

---

## 9. Not done / known limits (be upfront in review)

- **No refresh tokens, no token revocation list.** A stolen token works until it expires (1 hour), except that deleting/demoting the
  user is immediate because of the database check.
- **HTTPS is required in production**: tokens and passwords travel in plain text over HTTP. Local development uses HTTP.
- **Where the client stores the token** (memory vs `localStorage` vs an httpOnly cookie) is the front end's choice and a classic
  XSS-vs-CSRF trade-off; this API uses the `Authorization` header, which is not sent automatically by browsers, so it is not
  exposed to CSRF.
- No password reset, email verification, account lockout, multi-factor authentication or password-strength checking beyond length.
- No CORS (a browser app on another origin would need it).
- The rate limiter is per process and per IP (shared NAT users share a counter).
- Docker/Compose, scaling and cloud deployment are not part of this module's activities.

---

## 10. Common mistakes (and how this project avoids them)

| Mistake | Consequence | Here |
|---|---|---|
| Storing plain-text or fast-hashed passwords | a leak exposes every password | bcrypt, salted, cost 12 |
| Putting secrets in the JWT payload | anyone can read it | only `sub`, `role`, `iat`, `exp` |
| Not pinning the JWT algorithm | `alg: none` / algorithm confusion | `algorithms: ['HS256']` |
| Hard-coding or committing the JWT secret | anyone can forge tokens | env variable, min length, placeholder rejected |
| Taking `role` from the request body | anyone becomes admin | role never read from the body |
| 403 vs 401 mixed up | confusing clients | 401 no/invalid token, 403 not allowed |
| Different messages for unknown email / wrong password | account enumeration | one message + dummy compare |
| Only checking the role in the token | stale permissions | role read from the database each request |
| Only authenticating, not checking ownership (IDOR) | users read each other's data | owner in every query, 404 for others |
| Passing `req.body` straight into a Mongo query | NoSQL injection | strings only, validated |
| Forgetting `await` on bcrypt | `compare` returns a Promise, which is truthy: **every login succeeds** | all bcrypt calls awaited; wrong-password test |
| Returning the user document with the hash | hash leak | `select: false` + `toJSON` transform + test |
| Putting `authorizeRole` before `authenticateToken` | `req.user` undefined | order enforced in `router.use(...)`, 401 fallback |
| Unlimited login attempts | password guessing | rate limiter |
| Long passwords silently truncated by bcrypt | two different passwords act the same | rejected over 72 bytes |

---

## 11. TA review questions

**1. Authentication vs authorization?** AuthN = who you are (login, 401). AuthZ = what you may do (roles/ownership, 403).

**2. Why hash passwords, and why bcrypt and not SHA-256?** So a database leak doesn't reveal passwords. bcrypt is deliberately slow
(cost factor) and adds a random salt, making brute force and rainbow tables impractical; SHA-256 is fast, so guesses are cheap.

**3. What are a salt and a cost factor?** Salt: random per-password data stored inside the hash so equal passwords differ. Cost: how
many rounds (2^cost); raise it as hardware gets faster.

**4. How does `bcrypt.compare` work without storing the salt separately?** The salt and cost are inside the hash string; compare
extracts them, hashes the candidate the same way, and compares.

**5. What is a JWT, and can the user read it?** Signed `header.payload.signature`. Yes, the payload is readable; it is signed (tamper-
proof), not encrypted. So no secrets in it.

**6. How does the server know a token is genuine?** It recomputes the HMAC with `JWT_SECRET` and compares; only someone with the
secret can produce a valid signature. It also checks `exp` and the pinned algorithm.

**7. Why pin the algorithm?** Otherwise attackers can use `alg: none` or another algorithm to bypass the check. A test sends both.

**8. Stateless vs stateful: what did you choose?** Stateless tokens, plus a database lookup per request for user/role freshness. That
gives immediate revocation on delete/role change at the cost of one query.

**9. Walk through `authenticateToken`.** Read header -> verify token -> load the user -> `req.user` -> `next()`; any failure is a 401
with a generic message.

**10. What does `authorizeRole('admin')` return and why is it a function that returns a function?** A middleware; the outer function
takes configuration (allowed roles), the inner function is the actual `(req, res, next)` Express calls.

**11. 401 vs 403 vs 404 in your API?** 401 not authenticated; 403 authenticated but wrong role; 404 for another user's task (don't reveal
it exists).

**12. How do you stop a user registering as an admin?** The role is never read from the body; `/auth/register` always makes `user`; admins are
created with `create-admin`. A test sends `role: "admin"`.

**13. What is IDOR and how do you prevent it?** Accessing someone else's object by changing an id. Every task query includes the owner
(`{ _id, owner }`), so other users' ids don't match.

**14. How do you prevent account enumeration and timing leaks at login?** Same 401 message for both failures, and a dummy bcrypt
comparison when the user doesn't exist.

**15. What is NoSQL injection and how did you stop it?** Passing objects like `{ "$ne": null }` to a Mongo query. Credentials must be
strings, otherwise 400, so operators never reach the query.

**16. What happens if the token is stolen?** It works until it expires (1 h). Mitigations: short expiry, HTTPS, refresh-token rotation and a
revocation list (not implemented); deleting or demoting the user is immediate here.

**17. How are secrets managed?** In environment variables / `.env` (ignored by git), validated at start-up (min 32 characters, placeholder
rejected); nothing sensitive is logged, and error responses never include secrets or stack traces.

**18. What does rate limiting protect against, and what are its limits?** Password guessing on `/auth/login` and `/auth/register` (429 after 10
attempts per 15 minutes per IP). Per-process memory and per-IP counting are limitations.

**19. Why does helmet matter for an API?** Hardening headers (`nosniff`, HSTS, etc.) and no `X-Powered-By` reduce information leaks and
browser-based attacks.

**20. What is missing before this is production-ready?** HTTPS, refresh tokens/revocation, password reset and email verification, MFA,
CORS configuration, shared rate-limit store, audit logging, and a security review.
