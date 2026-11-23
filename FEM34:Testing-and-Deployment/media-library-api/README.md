# Media Library API (production-ready)

The FEM33 Media Library API prepared for release: automated tests, per-environment configuration with start-up validation,
structured logging, a health endpoint, a Postman collection, CI (GitHub Actions) and a Vercel configuration.
Endpoints and rules are unchanged from FEM33 (see `../../FEM33-Advanced-Backend-Concepts/media-library-api/README.md`);
new here: `GET /health`.

## Run it

```bash
npm install
cp .env.example .env.development     # then edit the values (MongoDB must be running)
npm run dev                           # NODE_ENV=development, pretty logs, http://localhost:4000
npm start                             # reads .env.<NODE_ENV> (default development)
npm test                              # 192 tests (needs MongoDB; uses the database media_library_test)
npm run test:coverage                 # same + coverage report in ./coverage (fails below 80%)
```

`npm test` is `node --experimental-vm-modules ... jest --runInBand --forceExit`. The flag is needed because the MongoDB driver
loads a module with a dynamic `import()` when it connects, and Jest only supports that with the flag (without it the driver's
first message to MongoDB is incomplete and the connection fails with "Missing required sub-document 'driver'").
`--runInBand` runs test files one after another because they share one test database.

## Environment variables

One file per environment, chosen by `NODE_ENV` (loaded with **dotenv-flow**): `.env.development`, `.env.test`, `.env.production`.
They are git-ignored (`.env.*`); the committed template is **`.env.example`**. Real environment variables (CI, the Vercel
dashboard) always win over files.

| Variable | Meaning |
|---|---|
| `NODE_ENV` | `development`, `test` or `production` |
| `PORT` | HTTP port |
| `DATABASE_URL` | MongoDB connection string. With `NODE_ENV=test` the database name **must end in `_test`** |
| `JWT_SECRET` | min 32 random characters. Required by the lab; reserved for the optional auth extension, **not used yet** |
| `MAX_FILE_SIZE_MB` | upload limit (1-100) |
| `UPLOAD_DIR` | where files are saved (relative to the project, or absolute; on Vercel `/tmp/uploads`) |
| `LOG_LEVEL` | `debug`, `info`, `warn` or `error` |

**Start-up validation** (`src/config/env.js`): if any variable is missing or invalid the app throws ONE error that lists every
problem (never the secret values) and `server.js` exits with code 1:

```
Invalid environment configuration:
  - PORT is missing
  - LOG_LEVEL must be one of: debug, info, warn, error
See .env.example for the expected variables.
```

## Logging (Winston)

Development: coloured lines. Production: one JSON object per line. `LOG_LEVEL` filters (`debug < info < warn < error`).
Silent in tests.

| Event | Level | Message |
|---|---|---|
| Server started | info | `Server started` (+ port, environment) |
| Incoming request | info | `Incoming request` (+ method, url) |
| Request finished | debug | `Request completed` (+ status, durationMs) |
| File uploaded | info | `File uploaded` (+ id, originalName, mimeType, fileSize) |
| Validation error | warn | `Validation error` (+ details) |
| Resource not found | warn | `Resource not found` |
| Unhandled global error | error | `Unhandled error` (+ real cause; the client only gets a generic 500) |
| Promise rejection / uncaught exception | error | `Unhandled promise rejection. Shutting down.` / `Uncaught exception. Shutting down.` |

## Health check

`GET /health` -> `200 { "status": "ok", "uptime": 123.45, "timestamp": "2026-03-31T10:00:00.000Z" }`. It does not touch the
database and is not logged as a request, so monitors can ping it often. Use it for uptime monitoring.

## Tests

`src/tests/`: **unit** (`AppError`, `catchAsync`, Zod schemas, `validate` middleware, `mediaService` paging maths and
`Promise.all`, env validation, logger, process handlers) and **integration** with Supertest (every endpoint, validation and file
errors, logging events, `/health`, and the real `server.js` started as a process). Coverage ~98% statements; services and
middleware 100% / 94% (threshold 80%, enforced by `jest.config.js`).

Tests never touch development data: the setup uses a `*_test` database (enforced in `env.js`) and a temporary upload folder.
They need a running MongoDB (CI uses a MongoDB service container).

## Postman

`postman/media-library-api.postman_collection.json` (name: **Media Library API**; 19 requests, 57 assertions: status codes,
`{status,data}` / `{status,message}` structure, required fields, 400 / 404 cases) with environments
`development.postman_environment.json` (`BASE_URL=http://localhost:4000`) and `production.postman_environment.json`
(`BASE_URL` = your Vercel URL). Run the "Media (run in order)" folder top to bottom: the first request saves `{{MEDIA_ID}}`.
Upload requests use `postman/fixtures/`; in Postman set *Settings > General > Working directory* to the `postman` folder.
Command line:

```bash
npx newman run postman/media-library-api.postman_collection.json -e postman/development.postman_environment.json --working-dir postman
```

## CI

`.github/workflows/ci.yml` lives at the **repository root** (GitHub only runs workflows from there) and is limited to this
project by a `paths` filter. On push / pull request to `main` or `dev`: checkout, Node 20 and 22, `npm ci`,
tests with coverage (MongoDB service container), coverage report uploaded as an artifact.

## Deployment (Vercel)

`vercel.json` is the one from the lab (`src/app.js` with `@vercel/node`, every route to it). `src/app.js` exports the Express app
and connects to MongoDB on the first request (`ensureDb` middleware), because there is no `server.js` on Vercel.
Steps and limitations: `../notes/FEM34-Testing-and-Deployment.md`, section 7.

## Structure

```
.github/workflows/ci.yml   (at the repository root)
postman/                   collection, 2 environments, fixtures
src/config/                env (dotenv-flow + validation), db, constants
src/controllers/ services/ repositories/ routes/ models/ validators/ middlewares/ utils/   (as in FEM33)
src/routes/healthRoutes.js GET /health
src/middlewares/           + requestLogger, ensureDb
src/utils/logger.js        Winston
src/tests/                 unit/ and integration/
server.js                  start-up: validate env, handlers, database, listen
jest.config.js  vercel.json  .env.example
```
