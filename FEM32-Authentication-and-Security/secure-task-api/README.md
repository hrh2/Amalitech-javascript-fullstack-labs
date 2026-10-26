# Task Tracker with Authentication (FEM32)

The MongoDB-backed Task Tracker API (FEM31) secured with **registration, login, bcrypt password hashing, JWT
authentication, protected routes and role-based access control (RBAC)**, in the MVC structure the lab recommends. It also
covers the module's "Secure Portal" challenge (`/dashboard`, `DELETE /admin/user/:id`).

## Run it

Needs MongoDB (`mongod` on 27017) and Node 20.12+.

```bash
npm install
cp .env.example .env
#  edit .env: set JWT_SECRET to a long random value, for example
#  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
npm run create-admin -- "Root Admin" root.admin@example.com 'Admin-pass-123'   # the only way to get an admin
npm start                                                                       # http://localhost:5000
npm test                                                                        # 105 tests, separate database task_tracker_auth_test
```

`.env` (loaded with dotenv; **never committed**):

```
PORT=5000
DB_URI=mongodb://127.0.0.1:27017/task_tracker_auth_db
JWT_SECRET=<long random string>
JWT_EXPIRES_IN=1h
```

The server refuses to start without a real `JWT_SECRET` (missing, shorter than 32 characters, or the placeholder from
`.env.example`).

## Endpoints

| Method | Endpoint | Access | Result |
|---|---|---|---|
| POST | `/auth/register` | public | 201 `{ user }`; 400 invalid; 409 email already registered |
| POST | `/auth/login` | public | 200 `{ token, tokenType: "Bearer", expiresIn, user }`; 401 `Invalid email or password` |
| GET | `/dashboard` | any logged-in user | their own profile and task count |
| GET | `/api/tasks` | logged-in | a user sees **their own** tasks; an **admin sees all** (`?completed=true\|false`) |
| GET | `/api/tasks/:id` | owner or admin | the task (404 for anyone else) |
| POST | `/api/tasks` | logged-in | 201; the task is owned by the caller |
| PUT, PATCH | `/api/tasks/:id` | **task owner only** | the updated task (404 for anyone else, admins included) |
| DELETE | `/api/tasks/:id` | **task owner or admin** | 200 message |
| GET | `/api/users` | **admin** | all users (never with password hashes) |
| DELETE | `/api/users/:id`, `/admin/user/:id` | **admin** | 200 message; also deletes that user's tasks; 409 if deleting yourself |

Send the token on every protected request: `Authorization: Bearer <token>`.

**Responses always have the same shape**: `{ "status": "success", "data": { ... } }` or
`{ "status": "error", "message": "Unauthorized access" }` (validation errors add `"errors": [...]`).

| Situation | Status | `message` |
|---|---|---|
| no token | 401 | `Access denied. No token provided.` |
| bad / tampered token | 401 | `Invalid token.` |
| expired token | 401 | `Token expired. Please log in again.` |
| wrong email or password | 401 | `Invalid email or password` |
| logged in but wrong role | 403 | `Forbidden. This action requires the admin role.` |
| another user's task | 404 | `Task <id> not found` |

```bash
curl -X POST -H "Content-Type: application/json" -d '{"name":"Amina","email":"amina@example.com","password":"correct horse battery"}' localhost:5000/auth/register
curl -X POST -H "Content-Type: application/json" -d '{"email":"amina@example.com","password":"correct horse battery"}' localhost:5000/auth/login
curl -H "Authorization: Bearer <token>" localhost:5000/api/tasks
```

## Structure (MVC, as recommended by the lab)

```
server.js, app.js                 start-up (fail-fast config), middleware and route mounting
config/env.js, config/db.js       dotenv settings, mongoose connection
models/User.js, models/Task.js    User: name, email, password (the bcrypt HASH), role (default "user"); Task adds owner
controllers/authController.js     register, login, dashboard
controllers/taskController.js     the CRUD handlers and the owner / admin rules
controllers/userController.js     list users, delete user (admin)
middleware/authMiddleware.js      authenticateToken
middleware/roleMiddleware.js      authorizeRole('admin')
middleware/rateLimiter.js         brute-force limiter for /auth/*
middleware/errorHandler.js        notFound + errorHandler (no internals leaked)
middleware/requestLogger.js
routes/                           authRoutes, taskRoutes, userRoutes, dashboardRoutes
utils/                            passwords (bcrypt), tokens (JWT), validators, responses (the standard shape)
scripts/create-admin.js           creates or promotes an admin
test/                             105 tests; setup.js refuses to run on a database not ending in "_test"
postman/                          saved request collection (30 requests, 56 assertions)
.env.example                      the settings
```

## Request collection

Import `postman/secure-task-api.postman_collection.json` and run the folders in order (register/login, protected routes,
ownership, admin, error cases). It needs the admin from `npm run create-admin` above. `/auth/*` is limited to 10 requests
per 15 minutes per IP (`AUTH_RATE_LIMIT_MAX`), so wait or raise the limit if you run it several times in a row.

## Design decisions

1. **The user is loaded from the database on every request**, not trusted from the token. A deleted user's token stops
   working at once and a role change takes effect immediately, at the cost of one query per request.
2. **The role can never come from the request body.** `/auth/register` always creates a plain user; admins are made with
   `npm run create-admin`.
3. **Tasks are scoped in the query itself** (`{ _id, owner }`), so another user's task id simply returns 404.
4. **Where the lab's text pulls two ways, the endpoint table wins:** it says `PUT /api/tasks/:id` is "task owner only", so even an
   admin cannot rewrite someone else's task (admins can view and delete all tasks, and manage all users).

Learning notes: `../notes/FEM32-Authentication-and-Security.md`.
