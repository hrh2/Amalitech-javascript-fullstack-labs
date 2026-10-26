# my-first-server

A first backend: a web server written with only Node.js's built-in `http` module (no packages to install).

## Run it

```bash
npm start            # node server.js  ->  http://localhost:3000
npm run dev          # same, restarts automatically when you edit a file (node --watch)
PORT=3001 npm start  # use another port
npm test             # 12 tests with Node's built-in test runner (no server needs to be running)
npm run check        # bash project-check.sh: 6 checks against a RUNNING server
```

Requires Node.js 18 or newer (`node -v`). Stop the server with Ctrl + C.

## What it answers

| Request | Status | Body |
|---|---|---|
| `GET /` | 200 | `Hello, this is my first Node.js server!` (`text/plain`) |
| `GET /api/health` | 200 | `{"status":"ok"}` (`application/json`) |
| `GET /api/greet?name=Amina` | 200 | `{"message":"Hello, Amina!"}` |
| `GET /api/greet` (no or blank name) | 200 | `{"message":"Hello, stranger!"}` |
| `GET /api/stats` | 200 | `{"requestsHandled":N}` since the server started |
| any other path | 404 | `{"error":"Not found","path":"/the/path"}` |
| a known path with a method other than GET | 405 | `{"error":"Method not allowed"}` plus `Allow: GET` |
| a request target that cannot be parsed | 400 | `{"error":"Bad request"}` |

Every request is logged to the terminal when its response is sent: `GET /api/health -> 200 (1 ms)`.

## Try it with curl

```bash
curl -i localhost:3000/                        # -i shows the status line and headers
curl "localhost:3000/api/greet?name=Amina"
curl -i -X POST localhost:3000/api/health      # 405 + Allow: GET
```

Real response for `curl -i localhost:3000/`:

```text
HTTP/1.1 200 OK                      <- status line (protocol, status code, reason)
Content-Type: text/plain             <- header
Date: Mon, 26 Oct 2026 15:29:26 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

Hello, this is my first Node.js server!      <- body
```

## Files

```
server.js          the server (routing + handlers); only listens when run directly
server.test.js     tests: start the server on a free port, call it with fetch()
project-check.sh   the module's self-check script (needs a running server and curl)
package.json       npm scripts: start, dev, test, check
```

Learning notes: `../notes/FEM29-Backend-First-Server.md`.
