# FEM33 — Advanced Backend Concepts: Media Library API

Specification: `task/Media Library API.md` (the lab) and `notes/Module05.md` (module objectives). The module's hands-on challenge
is a "Product API refactor"; the lab's Media Library covers the same skills (layers, Zod, Multer, search + pagination, global
error handler), so I built the lab (`media-library-api/`), which takes priority.

## Lab requirements -> where

| Lab requirement | Where |
|---|---|
| **1. Layered architecture** routes -> controllers -> services -> repositories (+ middlewares, models, config) | `src/` folders, same names as the lab. No logic in routes; controllers only call `mediaService`; the service only calls `mediaRepository`. |
| **2. Global error handling**: `AppError`, centralised middleware registered last, standard success / error shape | `utils/AppError.js`, `middlewares/errorHandler.js`, `app.js` (last two `app.use`), `utils/responses.js` |
| Handle unhandled rejections and uncaught exceptions, log, shut down gracefully | `utils/processHandlers.js`, registered first thing in `server.js` |
| **3. Validation** with Zod: POST (title required, tags array, category enum), PUT, GET query; reusable middleware; field-level errors | `validators/mediaSchemas.js`, `middlewares/validate.js` |
| **4. Multer**: disk storage in `/uploads`, jpeg/png/pdf, 5 MB, 400 for bad type / too big, stores filePath, originalName, mimeType, fileSize, title, tags, category | `middlewares/upload.js`, `models/Media.js` |
| **5. Pagination, filtering, search**: page, limit (default 10, max 50), category, tags, search, sortBy, order; the `pagination` block | `listMediaQuery` schema, `mediaService.list`, `mediaRepository` |
| **6. async/await only**, `catchAsync`, global rejection handling, **`Promise.all`** | `utils/catchAsync.js`; `mediaService.list` runs the page query and the count together |
| Endpoints POST / GET / GET:id / PUT / DELETE under `/media` | `routes/mediaRoutes.js` |
| Test edge cases: invalid file type, oversized file, missing fields, invalid query | `test/media.test.js` (each is a test) and `media-check.sh` |
| Test with Postman / Insomnia | **not done as a collection** (see section 8): I used `media-check.sh` (curl) and an automated suite. A Postman collection is part of FEM34. |
| Optional: multiple uploads, Cloudinary/S3, auth, thumbnails, soft delete, audit log | **not done** |

**Result:** 129 tests pass against a real MongoDB (separate `media_library_test` database, temporary upload folder); the 29 curl
checks pass on a running server; SIGTERM and an unhandled rejection were both tried on real processes. Seven deliberate code
breakages were each caught by the tests (section 8).

## 1. Why layers?

Without layers, one route function does everything: read the request, check it, apply the rules, write SQL/Mongo, send JSON.
It works, but you cannot test the rules without a server, you cannot change the database without touching HTTP code, and the file
grows forever. Each layer has **one job** and only talks to the layer below:

```
request -> route -> [upload] -> [validate] -> controller -> service -> repository -> MongoDB
                                                  |            |           |
                                          HTTP in/out     the rules     queries only
```

| Layer | Job | Must NOT |
|---|---|---|
| Route | match url + method, list the middleware | contain logic |
| Controller | read `req.validated`, call the service, send the response | decide rules, call the database |
| Service | rules: paging maths, "not found is a 404", delete the record *and* the file | know about `req` / `res` or Mongo queries |
| Repository | `create`, `findById`, `find`, `count`, `updateById`, `deleteById` | know about HTTP or files |

A real benefit you can see in the tests: `mediaService` receives its repository and file storage as arguments
(`createMediaService({ repository, storage })`), so `units.test.js` tests the paging maths and the "404 touches no file" rule with
tiny fakes, no database at all.

## 2. Errors in one place

Two kinds of error:

- **Operational**: expected, with a known answer: bad input (400), missing record (404). These are `AppError(statusCode, message, details)`.
- **Bugs**: anything else (a typo, the database down). The client gets only `500 Internal Server Error`; the real error goes to the log.

Every failure, from any layer, ends in `errorHandler` (four parameters `(err, req, res, next)`, registered **last**, otherwise
Express would never route errors to it). It also converts library errors into AppErrors (`MulterError` -> "File too large",
bad JSON -> 400), so there is one place that writes error responses. It also deletes the uploaded file if the request failed after
Multer had saved it, so a rejected request leaves no orphan file (tests check the folder is empty after every failure).

`notFound` is an ordinary middleware just before it: if no route matched, it creates a 404 AppError.

**Process-level handlers** (`processHandlers.js`): an `unhandledRejection` (a promise failed and nobody caught it) or an
`uncaughtException` means something unexpected broke and the program's state can no longer be trusted. The safe response is to log,
stop taking new requests (`server.close`), close the database, and exit with code 1 so a process manager restarts it. A 10 s timer
forces the exit if closing hangs. `SIGTERM`/`SIGINT` use the same path with code 0.

## 3. async/await and `catchAsync`

An async function that throws returns a *rejected promise*. In Express 4 nobody caught that, so the request hung and the process got an
unhandled rejection. Express 5 forwards it to the error handler already, but `catchAsync(handler)` keeps the intent visible and works
on any version:

```js
const catchAsync = (handler) => async (req, res, next) => {
  try { await handler(req, res, next); } catch (err) { next(err); }
};
```

The lab asks for no `.then()/.catch()` chains: the code uses `await` and `try/catch` only.

**`Promise.all`** (in `mediaService.list`): the page of results and the total count are independent, so waiting for one *then* the
other wastes time. `Promise.all([find, count])` starts both and waits for both. A unit test proves it: with a fake repository it
checks that "count started" happens before "find done".

## 4. Validation with Zod

Zod does three things at once: **checks** the value, **converts** it (`"2"` -> `2`, `"a, B"` -> `['a','b']`), and **drops unknown
fields** (so a client cannot send `filePath` and have it saved). Query strings and multipart forms only carry text, hence
`z.coerce.number()` for `page` / `limit`.

`validate({ body, query, params })` runs the schemas, collects *all* problems as `{ field, message }`, and on success puts the clean
values on `req.validated`. Why not overwrite `req.query`? In Express 5 `req.query` is read-only, so the controller reads
`req.validated.*` only, which also guarantees it never sees unchecked input.

Choices worth knowing:
- `title` required; `tags` and `category` optional on POST (defaults `[]` and `other`).
- PUT accepts any of the three fields, at least one (an empty body is a 400). The lab only says "validate metadata updates".
- A missing `tags` on PUT must stay missing (not become `[]`, which would wipe the tags), so the update schema uses `.optional()`
  while the create schema uses `.default([])`. A test covers it.
- The `id` is checked with `/^[0-9a-fA-F]{24}$/` (a bad id is a clean 400, not a database error).

## 5. File uploads with Multer

A browser sends files as `multipart/form-data`, which `express.json()` cannot read; Multer parses it. Order on the POST route matters:

`upload (save file, check type + size)` -> `requireFile` -> `validate` (title, tags, category) -> controller.

- **Disk storage**: the file is written to `UPLOAD_DIR` (default `uploads/`). **The saved name is `<random uuid><.jpg|.png|.pdf>`**,
  with the extension taken from the allowed-types table, never from the client's file name (so `../../evil.png` cannot choose a
  path; the original name is only stored as text in `originalName`).
- **`fileFilter`** rejects other MIME types; **`limits.fileSize`** is 5 MB; `files: 1` means one file per request.
- The stored `filePath` is relative (`uploads/abc.png`). When deleting, only the file *name* of the stored value is used, inside the
  upload folder, so even a tampered database row cannot make the API delete another file (a test does exactly that).
- File checks run before field validation, so a bad file *and* a bad title ends with the file error first.

## 6. Pagination, filtering, search

`skip = (page - 1) * limit`, `totalPages = ceil(total / limit)`. Details:

- **Stable pages**: `_id` is added as a tie-breaker to the sort. Without it, items with the same title could appear on two pages or
  none while paging (a test pages through 7 equal titles and checks 7 distinct ids).
- **`search`** uses a MongoDB text index on `title` (`mediaSchema.index({ title: 'text' })`), built at start-up (`Media.init()`).
  It matches whole words with stemming ("reports" matches "report"). The user's text is data, never a regex.
- **`tags`** matches items having *any* of the tags (`$in`). The lab does not say any / all; "all" would be `$all`. A test pins "any".
- `category[$ne]=x`-style injection: Express 5 reads the query as plain text, so it is just an unknown parameter and is ignored;
  repeating a text parameter (`category=a&category=b`) is a 400.

## 7. Tests (129) and how they were checked

| File | What |
|---|---|
| `test/units.test.js` (53) | `AppError`, `catchAsync`, every Zod schema rule, `validate` middleware, service paging maths, **concurrency of `Promise.all`**, process handlers (fake `process` + fake `exit`) |
| `test/media.test.js` (76) | real server on a free port + real MongoDB + real multipart uploads: each endpoint, every validation / file error (400, **nothing left on disk**), paging, filters, search, sort, injection, 404s, the 500 path that leaks nothing |

`test/setup.js` points the app at `media_library_test` and a temp upload folder, and **throws if the database name does not end in
`_test`**, because the tests delete everything. Never touch another database.

Deliberate breakages (each one made tests fail, then reverted): removed `Promise.all` concurrency (awaiting the find first), removed
the orphan-file cleanup, removed `path.basename` when deleting, `maxLimit` 500, `$in` -> `$all`, accepted every MIME type, forgot to
delete the file on DELETE.

Also run by hand: `media-check.sh` (29 curl checks on a running server), `kill -TERM` on the running server (exits cleanly), and a real
process with an unhandled rejection (logs, closes, exit code 1).

## 8. Not done / known limits (be upfront in review)

- **No Postman/Insomnia collection yet** (the lab's last step lists them). I verified with curl + automated tests. FEM34 requires a
  Postman collection called "Media Library API" for these same endpoints.
- **The file type is the type the client declares** (the `Content-Type` of the part). A client can label a `.exe` as `image/png`. A
  production system would inspect the file's first bytes ("magic numbers"). Not done, to keep to the lab.
- Uploaded files are not served back by the API (no `GET /uploads/...`); the lab does not ask for it.
- No authentication (it is an optional extension), no multiple-file upload, no cloud storage, no thumbnails, no soft delete, no audit log.
- Files live on the server's disk. On hosts with a temporary file system (e.g. Vercel, in FEM34) they would vanish: that is what the
  cloud-storage extension is for.
- A crash between "file saved" and "record created" is cleaned up by the error handler; a hard kill (power loss) in that instant
  could still leave an orphan file.

## 9. Common mistakes (and how this project avoids them)

| Mistake | Here |
|---|---|
| Business logic in the route / controller | the service holds the rules; routes have none |
| Error handler registered before the routes | last two `app.use` lines in `app.js` |
| Trusting the client's file name | random uuid + extension from the allowed-type table |
| Forgetting that a failed validation leaves the uploaded file | the error handler deletes `req.file` |
| `req.query` overwritten in Express 5 (read-only) | clean values on `req.validated` |
| `parseInt` of a query string without checking | Zod `coerce.number().int().min().max()` with clear messages |
| Offset paging without a tie-breaker sort | `_id` added to every sort |
| Awaiting independent queries one after another | `Promise.all` |
| Swallowing `unhandledRejection` and carrying on | log, close, exit(1) |

## 10. TA review questions

1. Draw the path of `POST /media` from request to database and say what each layer is *not* allowed to do.
2. Why is the error handler registered last, and how does Express know a function is an error handler?
3. What is the difference between an operational error and a bug, and what does the client see for each?
4. What happens to an uploaded file if validation of `title` fails afterwards? Where is that handled?
5. Why is the stored file name a random uuid instead of the original name?
6. Why does `Promise.all` help in `list`, and how does the unit test prove the two calls run together?
7. Why does the update schema use `.optional()` but the create schema `.default([])` for `tags`?
8. Why is `req.validated` used instead of `req.query`?
9. What does "skip/limit" paging do and why add `_id` to the sort? What is `totalPages` when there are 0 results?
10. What does `unhandledRejection` mean, why exit instead of continuing, and who restarts the program?
11. Name two limits of this implementation (e.g. the declared MIME type is trusted; files are on local disk).
