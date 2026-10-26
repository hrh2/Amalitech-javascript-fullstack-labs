# Persistent Task Tracker API (FEM31 lab: "Task Tracker - Database")

The FEM30 Task Tracker (Express, MVC) with its in-memory array replaced by **MongoDB**, using **Mongoose**. Same endpoints
and error behaviour; the difference is that data now survives a restart.

## Run it

You need MongoDB running locally (`mongod`, default port 27017) or a MongoDB Atlas connection string.

```bash
npm install
cp .env.example .env     # PORT and DB_URI (default database: task_tracker_db)
npm run seed             # empties the tasks collection and inserts 3 sample tasks
npm start                # http://localhost:3000
npm test                 # 46 tests against a separate database, task_tracker_db_test (dropped afterwards)
bash task-api-check.sh   # the module's 14 checks against the RUNNING server
```

Stop the server and start it again: the tasks are still there. If MongoDB is not running, the server prints
`Could not connect to MongoDB ...` and exits instead of failing on every request.

## Task record (as the lab specifies)

| Field | Description | In this API |
|---|---|---|
| `id` | unique database-generated identifier | MongoDB's `_id` (24-character ObjectId), exposed as the string `id` |
| `title` | task name or description (required) | required, trimmed, 1-200 characters |
| `completed` | completion status | Boolean, default `false` |
| `createdAt` | when the task was created | set by Mongoose (`timestamps: true`), together with `updatedAt` |

## Lab requirements -> where

| Requirement | Where |
|---|---|
| Connect Express to a database (MongoDB) | `config/db.js` (`mongoose.connect`), called in `server.js` before `listen` |
| Database named `task_tracker_db` | the default in `config/env.js` / `.env.example`: `mongodb://127.0.0.1:27017/task_tracker_db` |
| Data model / schema | `models/Task.js` |
| CRUD with persistent storage | `controllers/taskController.js` (`find`, `findById`, `create`, `save`, `deleteOne`) |
| Environment variables for database configuration | `DB_URI` and `PORT` in `.env` (loaded by dotenv in `config/env.js`; `.env` is git-ignored) |
| async/await and error handling | every handler is `async` and `await`s; Express 5 forwards a rejection to `middleware/errors.js`, which answers a generic JSON 500 and logs the details only on the server; Mongoose validation/cast errors become 400 |

## What changed from FEM30

| FEM30 (in memory) | FEM31 (MongoDB) |
|---|---|
| `models/taskModel.js`: an array and an id counter | `models/Task.js`: a Mongoose schema and model |
| controller functions are synchronous | controller functions are `async` and `await` the model |
| `id` is a number | `id` is a 24-character ObjectId string made by MongoDB |
| `parseId` accepts positive integers | `parseId` accepts 24 hex characters (400 otherwise) |
| validation only in the API | the **schema** also validates (`required`, `trim`, `maxlength`); Mongoose errors become 400 |
| - | `createdAt` / `updatedAt`, `config/db.js`, `seed.js`, a start-up check that the database is reachable |

Endpoints, status codes and the JSON error format are unchanged (see `../../FEM30-RESTful-APIs-with-Expressjs/task-api/README.md`).

## Structure (MVC)

```
server.js                      connects to MongoDB, then listens
app.js                         middleware order (unchanged from FEM30)
config/env.js                  dotenv + PORT, DB_URI
config/db.js                   mongoose.connect / disconnect
models/Task.js                 M: the Task schema and model
controllers/taskController.js  C: async handlers
routes/taskRoutes.js           URL + method -> controller function (and the :id check)
validators/taskValidator.js    id and body validation
middleware/                    request logger, notFound + errorHandler (also maps Mongoose errors)
seed.js                        npm run seed (and the tests' starting data)
test/                          HTTP tests, persistence/schema tests; setup.js refuses to run on a non-"_test" database
postman/                       saved request collection for this API
```

## Design decision

**The controller and model layers from FEM30 made the swap small.** Routes did not change at all, the controller functions
gained `async`/`await`, and the model changed from an array to a Mongoose schema. Validation, error handling and the API
contract stayed the same, and the old test suite could be adapted rather than rewritten.
