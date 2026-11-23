# FEM34 — Testing & Deployment: Media Library API, ready for production

Specification: `task/Media-Library-API.md` (the lab) and `notes/Module06.md` (module objectives + the small "CI/CD pipeline"
challenge: a test for `GET /health`, a `.gitignore`, push, deploy). The lab takes the **FEM33 Media Library API** and prepares it
for release, so `media-library-api/` here starts as a copy of FEM33's and adds what the lab asks. FEM33 is left unchanged.

## Lab requirements -> where

| Lab requirement | Where |
|---|---|
| **1. Postman collection "Media Library API"**, all 5 endpoints, assertions on status code, body structure, required fields | `postman/media-library-api.postman_collection.json` (19 requests, 57 assertions incl. 400 / 404 cases and `/health`) |
| Two Postman environments (Development, Production) with `{{BASE_URL}}`, `{{MEDIA_ID}}`; collection exported under `/postman` | `postman/development.postman_environment.json`, `production.postman_environment.json` (production URL is a placeholder until you deploy) |
| **2. Unit tests**: mediaService pagination, validate middleware, catchAsync, AppError (`statusCode`, `message`, `status`) | `src/tests/unit/` (also env, logger, schemas, process handlers). `AppError` gained a `status` field (`fail` for 4xx, `error` for 5xx) because the lab asks to test it |
| **3. Integration tests with Supertest**: every endpoint's required cases, separate test database, never affecting dev data | `src/tests/integration/media.test.js` etc. Test DB = `media_library_test`, refused otherwise (section 4) |
| `package.json` scripts `test` and `test:coverage` | present (with a Node flag, section 3) |
| **Coverage >= 80%** across services and middleware | `jest.config.js` enforces it; actual: services 100%, middleware 94%, all of `src` 98% |
| **4. Environment files** `.env.development`, `.env.test`, `.env.production`, `.env.example`; dotenv-flow; required variables; `.env*` ignored; validate at start-up (descriptive error + exit) | `src/config/env.js`, `.env.example`, `.gitignore`, `server.js`; `src/tests/unit/env.test.js` and `integration/server.test.js` |
| **5. Git / GitHub workflow**, **CI** `ci.yml`: checkout, Node, `npm ci`, `npm test`; bonus coverage artifact | `.github/workflows/ci.yml` (repository root, section 6) |
| Feature branches, pull requests, required CI checks (branch protection) | **not done** (section 8) |
| **6. Vercel**: `vercel.json`, env vars in dashboard, deploy, verify, run Postman against production, document limitations | `vercel.json` done; limitations documented (section 7). **Not deployed** (section 8) |
| **7. Structured logging** with Winston or Pino: pretty in development, JSON in production, respects `LOG_LEVEL`, the 7 required events | `src/utils/logger.js` (Winston), `src/middlewares/requestLogger.js`, `errorHandler.js`, `mediaController.js`; `integration/logging.test.js` |
| **8. `GET /health`** `{ status, uptime, timestamp }` | `src/routes/healthRoutes.js`, `integration/health.test.js` |
| **9. Monitoring (bonus)** | **not done** |

**Result:** 192 tests pass against a real MongoDB; 19 Postman requests / 57 assertions pass with Newman (Postman's own
command-line runner) against a local server; the CI steps were run on a fresh copy of the project without any `.env.*` file,
with only the variables the workflow sets (`npm ci`, `npm run test:coverage`: 192 pass, coverage met); the Vercel path
(only `src/app.js`, no `server.js`) was simulated locally. Seven deliberate code breakages were each caught by the tests.

## 1. Why test, and what kinds?

- **Manual / exploratory** (Postman): you send a request and look. Good for learning, but a person has to remember to do it.
- **Unit test**: one small piece in isolation, with fakes for its neighbours (e.g. `mediaService` with a fake repository). Fast, precise failures.
- **Integration test**: several real pieces together (Supertest sends a real HTTP request to the real Express app, which really
  uses MongoDB and the disk). Slower, but proves the pieces fit.
- **CI**: a machine runs all of it on every push, so a broken change is noticed before it is merged or deployed.

A good suite has many unit tests and fewer, broader integration tests. Test names state the behaviour ("404 when deleting the
same item twice"), so a failure reads like a bug report.

## 2. Postman

A collection is a saved, ordered set of requests, each with a **test script** (JavaScript using `pm.*`). Example:

```js
pm.test('Status code is 201 Created', () => pm.response.to.have.status(201));
pm.test('Required fields are present', () => ['id','title','tags'].forEach(f => pm.expect(body.data.media).to.have.property(f)));
pm.environment.set('MEDIA_ID', body.data.media.id);   // pass the id to the next requests
```

An **environment** is a set of variables you can switch: `{{BASE_URL}}` is `http://localhost:4000` in *Development* and the Vercel
URL in *Production*, so the same collection tests both. The first request saves `{{MEDIA_ID}}`; the later ones read it. File
uploads use *form-data* with type **File** (`postman/fixtures/`).

I ran the collection with **Newman** (the same engine as the Postman app, from the command line) so the result is repeatable:
19 requests, 57 assertions, 0 failures, twice in a row. I have not clicked through the Postman desktop app itself.

## 3. Jest + Supertest

`jest` runs the tests; `supertest` calls the Express `app` directly (`request(app).get('/media')`) without you choosing a port.
`jest.config.js` sets the test folder, a setup file, and the coverage rules.

- **`src/tests/setup/env.js`** runs before every test file: it sets `NODE_ENV=test`, defaults for the required variables (so a
  fresh clone or CI works without `.env.test`), and a **temporary upload folder**.
- **`helpers.js`**: `upload(fields, file)` builds the multipart request; `seed([...])` creates items through the API;
  `reset()` empties the collection and the folder before each test.
- **Two Jest details worth knowing**
  - *`--experimental-vm-modules`*: the npm script is `node --experimental-vm-modules ... jest ...`. The MongoDB driver uses a
    dynamic `import()` while connecting; Jest only allows that with this flag. Without it the connection fails with the confusing
    "Missing required sub-document 'driver'". I found this by experiment; it is the one place the script differs from the lab's
    `jest --runInBand --forceExit`.
  - *`--runInBand`* (tests one after another) because every file shares the same test database; *`--forceExit`* because the
    MongoDB driver can keep a socket open for a moment after the last test.
- **A test that starts the real `server.js`** (`integration/server.test.js`) checks what unit tests cannot: that a missing variable
  stops the program with exit code 1 and a clear message, that production logs `Server started` as JSON, that `/health` answers,
  and that SIGTERM exits cleanly (code 0).
- **Spies** (`jest.spyOn(logger, 'warn')`) check that the right events are logged at the right level without printing anything.

**Separate test database vs in-memory database:** the lab lists both. I used a separate real database (`media_library_test`) on
the same local MongoDB, and in CI a MongoDB container. Reason: the text index behind `?search=` and real Mongoose behaviour are
exactly what we want to test. An in-memory server (`mongodb-memory-server`) is an alternative; it needs to download a MongoDB
binary and was not used.

## 4. Environment configuration

Why: the same code runs on your laptop, in CI and in production, with different database addresses, secrets and log levels.
Settings live **outside the code**, in environment variables, and **secrets are never committed**.

- `dotenv-flow` loads `.env`, `.env.local`, `.env.<NODE_ENV>`, `.env.<NODE_ENV>.local` (later wins). Real environment variables
  (CI, Vercel dashboard) override files.
- `.gitignore` has `.env.*` and `!.env.example`: only the template is committed. (Consequence: a fresh clone has no
  `.env.development` or `.env.test`; copy the example. The tests and CI do not need them.)
- **Validation at start-up** (`loadEnv`): collects *every* problem, throws one readable error, never prints secret values;
  `server.js` prints it and exits 1. "Fail fast" beats a mysterious crash on the first request. `loadEnv(source)` takes the
  variables as a parameter so it is unit tested with plain objects.
- **Safety rule inside the validation:** with `NODE_ENV=test` the database name must end in `_test`, so a wrong
  `DATABASE_URL` cannot let the tests delete development data. Tested in unit and in the real-process test.
- `JWT_SECRET` is required by the lab but the API has no authentication yet. It is validated (min 32 characters, not the
  `replace-me` placeholder) and otherwise unused: it is reserved for the "authentication" extension.
- `MAX_FILE_SIZE_MB` and `UPLOAD_DIR` replace the hard-coded 5 MB and `uploads/` of FEM33.

## 5. Structured logging and the health check

`console.log` is free text for humans. **Structured** logs are fields (`level`, `message`, `timestamp`, `method`, `status`...)
so tools can search and filter them (e.g. "all `error` entries for `POST /media` today"). Winston gives levels and formats:

- development: `10:11:30 info File uploaded {"id":"6b03...","originalName":"sample.png"}`
- production: `{"level":"info","message":"File uploaded","id":"6b03...","timestamp":"..."}` (one JSON object per line)

`LOG_LEVEL=warn` hides `debug` and `info`. Levels used: **info** = normal events, **warn** = the client did something wrong
(validation error, unknown id) and the server is fine, **error** = our fault (unhandled error, rejected promise).
A detail that bit me: Winston merges a metadata field named `message` into the log line, so the cause is logged as `reason`.
There is no `console.log` left in `src/` (`server.js` uses `console.error` once, only for a configuration error that happens before
the logger can be built).

`GET /health` is the heartbeat for monitors: no database call, not logged, always `{ status, uptime, timestamp }`.

## 6. Git, GitHub and CI

**Clean history:** small commits grouped by purpose: initial setup, environment configuration, logging + health, test suite,
Postman, CI, deployment configuration (see the table at the end of `media-library-api/README.md` / the commit list in the repo).
**Branches and PRs:** the habit is a feature branch -> pull request -> CI must pass -> merge. *Branch protection* ("require CI to
pass") is a GitHub repository setting, not code; it is not enabled (section 8).

**The workflow** (`.github/workflows/ci.yml`):

1. triggers on push and pull request to `main` and `dev`, only when this project's files change (`paths`);
2. starts a **MongoDB 7 service container** (the tests need a database);
3. sets the required variables with `env:` (the `.env.*` files are not in the repository);
4. `actions/checkout`, `actions/setup-node` (Node 20 and 22, npm cache), `npm ci` (exact versions from the lock file),
5. `npm run test:coverage` (runs the same tests as `npm test`, plus enforces the 80% threshold),
6. bonus: uploads the `coverage/` folder as an artifact.

**Why the file is not inside the project folder:** the lab's layout puts `.github/workflows/ci.yml` in the project root, but GitHub only
reads workflows from the **repository** root and this repository holds many lab projects. So it sits at the root and is limited to this
project by `paths` + `working-directory`. The folder name contains a colon (`FEM34:Testing-and-Deployment`); it works in the workflow
paths, but it is unusual, so keep it quoted.

**Honest status:** I could not see the workflow run on GitHub from here (it runs after you push). I verified it by running its
steps on a clean copy with only its variables.

## 7. Deployment to Vercel

`vercel.json` (from the lab) tells Vercel to build `src/app.js` with `@vercel/node` and send every URL to it. On Vercel there is
no long-running `server.js` calling `listen`: each request starts (or reuses) a **serverless function** that runs the exported
Express app. Two consequences, both handled:
- `app.js` must **export** the app (it does);
- the database connects on the first request of each instance and the connection is reused: `ensureDb` middleware +
  `connectDB` that is safe to call many times.

### Steps (you need your Vercel and MongoDB Atlas accounts)

1. **A production MongoDB**: a free **MongoDB Atlas** cluster, a database user, network access allowing Vercel (Atlas -> Network
   Access -> `0.0.0.0/0`; Vercel has no fixed IP), and the connection string `mongodb+srv://USER:PASSWORD@cluster.../media_library_prod`.
2. **Link the project**: in `media-library-api/` run `vercel login`, then `vercel link` (or import the GitHub repository in the
   dashboard and set *Root Directory* to `FEM34:Testing-and-Deployment/media-library-api`).
3. **Environment variables** (Vercel dashboard -> Settings -> Environment Variables -> *Production*, or `vercel env add NAME production`):

   | Name | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `4000` (required by the validation; Vercel ignores it) |
   | `DATABASE_URL` | your Atlas string |
   | `JWT_SECRET` | a new random string (e.g. `openssl rand -hex 32`) |
   | `MAX_FILE_SIZE_MB` | `4` (see limits below) |
   | `UPLOAD_DIR` | `/tmp/uploads` |
   | `LOG_LEVEL` | `info` |

4. **Deploy**: `vercel --prod`. Open `https://<your-app>.vercel.app/health`.
5. **Test production**: put the URL in `postman/production.postman_environment.json` (`BASE_URL`), then
   `npx newman run postman/media-library-api.postman_collection.json -e postman/production.postman_environment.json --working-dir postman`.
   All 57 assertions should pass.

### Vercel limitations (be upfront in review)

| Limit | Effect on this API | What I would do in production |
|---|---|---|
| **Ephemeral file system**: only `/tmp` is writable, and it is per function instance and temporary | uploaded files disappear (or are not seen by another instance) while their database records remain, so `filePath` points to nothing | store files in **object storage**: AWS S3, Cloudinary (or Vercel Blob); save the returned URL in the record; the service's `storage` object is the one place to change |
| **Request body limit ~4.5 MB** for serverless functions | the 5 MB upload limit cannot be reached (Vercel answers 413 first), hence `MAX_FILE_SIZE_MB=4` | let the browser upload **directly to S3 / Cloudinary** with a pre-signed URL; the API only stores the metadata |
| Cold starts and a new database connection per instance | the first request after idle is slower; many instances can open many connections | connection reuse (done), a pooled Atlas tier, keep `maxPoolSize` small |
| Function time limit | long operations (thumbnails, big files) would be cut off | background jobs / a queue |
| The process model: `unhandledRejection` handlers and graceful `SIGTERM` in `server.js` do not apply to serverless | errors are still logged by the error handler; the platform recycles instances | none needed |

An alternative host that keeps a normal server and disk is Render (mentioned in the module notes), but its disk is also
ephemeral on free plans.

## 8. Not done / known limits (be upfront in review)

- **Not deployed.** The Vercel CLI here is not logged in, and a production database is needed (Atlas). Everything for it is
  prepared (`vercel.json`, `.vercelignore`, env table, steps above). So the "Postman production tests" requirement is **not yet
  met**: the production environment has a placeholder URL, and nothing was run against a live deployment. The Vercel path was
  simulated locally (only `src/app.js` loaded, JSON production logs, `UPLOAD_DIR=/tmp/...`).
- **CI not yet seen running on GitHub**, and **branch protection / required checks / pull-request flow are not set up** (GitHub
  settings; I did not change your repository settings). Commits go to `dev`.
- **Monitoring (bonus)** not done: after deploying, add `GET /health` to UptimeRobot or Better Uptime (a free monitor that calls the
  URL every few minutes and alerts on failure).
- **In-memory database** not used (section 3).
- The Postman collection was run with Newman, not the desktop app.
- `JWT_SECRET` is validated but unused (no authentication in this API).
- The file-type limits from FEM33 remain: the declared MIME type is trusted; files are on local disk (see the Vercel table).

## 9. Common mistakes (and how this project avoids them)

| Mistake | Here |
|---|---|
| Tests hitting the development database | `_test` name enforced at start-up; temp upload folder |
| Committing `.env` with secrets | `.env.*` ignored; only `.env.example`; CI/Vercel variables set outside Git |
| App crashes later with "undefined" config | all variables validated at start-up with one clear message |
| `console.log` everywhere | one Winston logger; JSON in production; levels |
| Logging an `Error` object (it prints as `{}`) | `errorFields(err)` -> `{ error, stack }` |
| Health check that depends on the database | `/health` is independent and unlogged |
| CI that passes "on my machine" | clean-copy run with only CI variables; MongoDB service container |
| Relying on local disk in serverless | documented limit + the S3/Cloudinary plan |

## 10. TA review questions

1. What is the difference between a unit test and an integration test? Give one example of each from this project.
2. Why does `mediaService` get its repository passed in? How does the pagination test use that?
3. Why do the tests use `media_library_test`, and what stops them from running against the development database?
4. Why is `--runInBand` used? Why does the npm script need `--experimental-vm-modules`?
5. What does Supertest do that `fetch` against a running server does not need?
6. What is `dotenv-flow` loading for `NODE_ENV=production`? Which wins: a variable in `.env.production` or one set in the Vercel dashboard?
7. What happens when `PORT` is missing at start-up? Why is it better than failing on the first request?
8. Why log validation errors as `warn` but an unexpected exception as `error`?
9. What does `LOG_LEVEL=warn` hide? Why is JSON better than text in production?
10. Why does `/health` not call the database, and who uses it?
11. Walk through `ci.yml`: when does it run, what does the MongoDB service do, why `npm ci`, what is uploaded?
12. Why is `ci.yml` at the repository root and not in the project folder?
13. Name three Vercel limitations that affect this API and how you would solve the file-storage one.
14. What is branch protection and what would you set to "require CI to pass"?
