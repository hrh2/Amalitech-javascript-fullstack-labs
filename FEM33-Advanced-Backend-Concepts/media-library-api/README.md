# Media Library API

Upload images and PDFs with metadata, then list, search, filter, update and delete them. Express 5 + MongoDB (Mongoose),
validated with Zod, uploads handled by Multer.

## Run it

```bash
npm install
cp .env.example .env     # PORT, DB_URI (MongoDB must be running), UPLOAD_DIR
npm start                # http://localhost:4000
npm test                 # 129 tests (needs MongoDB; uses the separate database media_library_test)
npm run check            # 29 curl checks against a RUNNING server (npm start in another terminal)
```

## Endpoints

| Method | Path | What it does | Success |
|---|---|---|---|
| POST | `/media` | Upload one file (`multipart/form-data`: field `file` + `title`, `tags`, `category`) | 201 |
| GET | `/media` | List with `page`, `limit`, `category`, `tags`, `search`, `sortBy`, `order` | 200 |
| GET | `/media/:id` | One item | 200 |
| PUT | `/media/:id` | Update metadata (JSON: any of `title`, `tags`, `category`, at least one) | 200 |
| DELETE | `/media/:id` | Delete the record **and** the file | 200 |

Every response is `{ "status": "success", "data": ... }` or `{ "status": "error", "message": "...", "details": [...] }`.

```bash
curl -F file=@logo.png -F title="Company logo" -F tags=brand,logo -F category=design localhost:4000/media
curl 'localhost:4000/media?category=design&tags=logo&search=company&sortBy=title&order=asc&page=1&limit=10'
curl -X PUT -H 'Content-Type: application/json' -d '{"title":"New title"}' localhost:4000/media/<id>
curl -X DELETE localhost:4000/media/<id>
```

List response: `{ "status":"success", "data": { "results": [...], "pagination": { "total": 84, "page": 2, "limit": 10, "totalPages": 9 } } }`.
Validation error: `{ "status":"error", "message":"Validation failed", "details":[{ "field":"title", "message":"Title is required" }] }`.

### Rules

- **Files:** `image/jpeg`, `image/png`, `application/pdf`, at most 5 MB, one per request. Anything else is a 400.
- **Fields:** `title` required (1-200 chars); `tags` optional, comma-separated (`a,b`) or repeated fields, lower-cased, max 10;
  `category` one of `marketing, product, design, documentation, other` (default `other`).
- **List:** `page` default 1; `limit` default 10, max 50; `tags` matches items with **any** of the tags; `search` is a MongoDB
  full-text search on the title (whole words, so `report` finds "Annual reports" but `rep` does not);
  `sortBy` is `createdAt` (default), `title`, `fileSize` or `category`; `order` is `desc` (default) or `asc`.
  A page past the end is `200` with an empty list.
- **Stored per item:** `filePath` (`uploads/<random-uuid>.png`, relative), `originalName`, `mimeType`, `fileSize`, `title`, `tags`,
  `category`, `createdAt`, `updatedAt`.

## Structure (routes -> controllers -> services -> repositories)

```
server.js                          starts: process handlers, database, HTTP server
src/app.js                         the Express app (error handler registered last)
src/routes/mediaRoutes.js          url + method -> middleware -> controller. No logic.
src/controllers/mediaController.js request in / response out. Calls the service.
src/services/mediaService.js       business rules: paging maths, Promise.all, 404s, deleting the file
src/repositories/mediaRepository.js the ONLY code that talks to MongoDB
src/models/Media.js                schema + indexes
src/validators/mediaSchemas.js     Zod schemas (create, update, id, list query)
src/middlewares/validate.js        reusable: validate({ body, query, params }) -> req.validated
src/middlewares/upload.js          Multer: disk storage, type + size limits
src/middlewares/errorHandler.js    notFound + the one central error handler
src/utils/                         AppError, catchAsync, responses, logger, fileStorage, processHandlers
src/config/                        env (dotenv), db, constants
uploads/                           saved files (git-ignored)
test/                              node:test: unit tests + end-to-end tests with real uploads
media-check.sh                     curl checks against a running server
```

Learning notes: `../notes/FEM33-Media-Library-API.md`.
