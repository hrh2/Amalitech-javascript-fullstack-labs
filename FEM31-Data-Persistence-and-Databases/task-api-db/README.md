# Task API with MongoDB (FEM31 lab: "CRUD API with Database")

The FEM30 Task API with its in-memory array replaced by **MongoDB**, using **Mongoose**. Same endpoints and error
behaviour; the difference is that data now survives a restart.

## Run it

You need MongoDB running locally (`mongod`, default port 27017) or a MongoDB Atlas connection string.

```bash
npm install
cp .env.example .env     # optional: MONGODB_URI and PORT (defaults: mongodb://127.0.0.1:27017/task_api_dev, 3000)
npm run seed             # empties the tasks collection and inserts 3 sample tasks
npm start                # http://localhost:3000
npm test                 # 46 tests against a separate database, task_api_test (dropped afterwards)
bash task-api-check.sh   # the module's 14 checks against the RUNNING server
```

Stop the server and start it again: the tasks are still there. If MongoDB is not running, the server prints
`Could not connect to MongoDB ...` and exits instead of failing on every request.

## What changed from FEM30

| FEM30 (in memory) | FEM31 (MongoDB) |
|---|---|
| `store.js`: a `tasks` array and an id counter | `models/task.js`: a Mongoose schema; `store.js`: the same function names, now async, calling the model |
| `id` is a number | `id` is a 24-character ObjectId string made by MongoDB |
| routes are synchronous | routes `await` the store (Express 5 forwards rejected promises to the error handler) |
| `parseId` accepted positive integers | `parseId` accepts 24 hex characters (400 otherwise) |
| validation only in the API | the **schema** also validates (`required`, `trim`, `maxlength`); Mongoose errors become 400 |
| - | `createdAt` / `updatedAt` added by `timestamps: true` |
| - | `db.js` connection, `seed.js`, `.env` support, a startup check that the database is reachable |

Endpoints, status codes and the JSON error format are unchanged (see `../../FEM30-RESTful-APIs-with-Expressjs/task-api/README.md`).

## Structure

```
server.js               connects to MongoDB, then listens
app.js                  middleware order (unchanged from FEM30)
db.js                   mongoose.connect / disconnect, MONGODB_URI
models/task.js          the Task schema and model
store.js                data functions (list/get/create/replace/update/remove/reset)
validate-task.js        id and body validation
routes/tasks.js         the /tasks router (async)
middleware/             request logger, notFound + errorHandler (now also maps Mongoose errors)
seed.js                 npm run seed
test/                   HTTP tests, persistence/schema tests; setup.js refuses to run on a non-"_test" database
postman/                saved request collection for this API
```

## Design decision

**Only the store changed.** The routes already talked to a small interface (`store.get(id)`, `store.create(data)`, ...), so
swapping the array for MongoDB meant rewriting `store.js` and adding `await` in the routes; the validation, error
handling and API contract stayed the same, and the old test suite could be adapted rather than rewritten.
