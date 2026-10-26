# Task API

A RESTful Task Tracker built with Express 5. Data lives in an in-memory array (no database), so it resets when the
server restarts.

## Run it

```bash
npm install
cp .env.example .env     # optional: PORT
npm start               # http://localhost:3000   (PORT=3001 npm start for another port)
npm run dev             # restarts on file changes
npm test                # 65 tests, no server needs to be running
npm run check           # bash task-api-check.sh: 14 checks against a RUNNING server
```

Requires Node.js 18+ (`node -v`).

## Endpoints

| Method | Path | Success | Errors |
|---|---|---|---|
| GET | `/tasks` | 200 + array. Optional `?completed=true\|false` | 400 invalid `completed` |
| GET | `/tasks/:id` | 200 + task | 400 bad id, 404 not found |
| POST | `/tasks` | **201** + task + `Location: /tasks/<id>` | 400 invalid / malformed JSON / no JSON body, 413 body too large |
| PUT | `/tasks/:id` | 200 + the replaced task (`title` required) | 400, 404 |
| PATCH | `/tasks/:id` | 200 + updated task (any of `title`, `completed`) | 400 (also for `{}`), 404 |
| DELETE | `/tasks/:id` | **204**, no body | 400, 404 (also when deleting twice) |
| any | anything else | – | 404 `{"error":"Route not found: GET /nope"}` |

A task is `{ "id": 4, "title": "Learn Express", "completed": false }`. **Every response is JSON**, errors look like
`{ "error": "..." }` (validation errors add `"details": [...]`). An unexpected failure is `500 { "error": "Internal
Server Error" }` and its details go only to the server log. The same contract is described in `openapi.yaml`
(paste it into https://editor.swagger.io to browse it).

```bash
curl -i -X POST -H "Content-Type: application/json" -d '{"title":"Learn Express"}' localhost:3000/tasks
curl 'localhost:3000/tasks?completed=false'
curl -X PATCH -H "Content-Type: application/json" -d '{"completed":true}' localhost:3000/tasks/2
curl -i -X DELETE localhost:3000/tasks/3
```

## Structure (MVC)

```
server.js                   the only file that calls listen (and reports start-up errors)
app.js                      builds and exports the Express app (middleware order lives here)
config/env.js               loads .env with dotenv and exports PORT / NODE_ENV
models/taskModel.js         M: the in-memory data and the functions that use it; knows nothing about HTTP
controllers/taskController.js  C: one function per request type (read request -> call the model -> send response)
routes/taskRoutes.js        which URL + method goes to which controller function (and the :id check)
validators/taskValidator.js id parsing and body validation; returns { value } or { errors }
middleware/                 request-logger.js (one line per request), errors.js (notFound + errorHandler)
test/                       node:test suites (HTTP tests, and plain unit tests for model/validation)
postman/                    saved request collection (16 requests incl. 9 error cases)
task-api-check.sh           the module's self-check script
openapi.yaml                API description
.env.example                the settings (copy to .env)
```

**Where is the "V" (view)?** This is a JSON API, so there are no HTML templates: the JSON the controller sends *is* the
view layer. Everything else is the usual MVC split.

## Configuration (dotenv)

Copy `.env.example` to `.env` and edit it (`PORT=3000`). `config/env.js` loads it with the `dotenv` package before anything
else reads `process.env`. A real environment variable (`PORT=3001 npm start`) overrides the file, and `.env` is
git-ignored.

## Request collection

`postman/task-api.postman_collection.json`: import it into Postman (or Insomnia/Thunder Client). It has two folders:
**Happy path** (create, read, replace, patch, delete, with `taskId` saved between requests) and **Error cases**
(missing title, malformed JSON, bad id, unknown id, deleted id, empty PATCH, bad filter, unknown route). Run the
folders in that order. Each request has test scripts for the status code and key fields.

## One design decision

**Validation returns data instead of throwing.** `validateTask(body)` returns `{ value }` or `{ errors }`, and the
router decides the response. The validation can then be unit tested with plain function calls (no server), it reports
*all* problems in one response, and the router stays the only place that knows about status codes. It also handles
Express 5's `req.body === undefined` (no JSON body) safely, because the first thing it checks is that the body is an
object.

Learning notes: `../notes/FEM30-Task-API.md`.
