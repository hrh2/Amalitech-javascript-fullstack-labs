# Module 5: Advanced Backend Concepts
### Backend Development with JavaScript

> **Scope note:** This document covers Module 5: structuring an API in **layers** (routes → controller → service → repository); **global error handling** with one standard response shape; validating requests with **Zod**; **file uploads** with **Multer**; **pagination, filtering and search**; and **async/await** patterns that prevent unhandled promise rejections. It finishes with the Resource Book's hands-on challenge, the **E-Commerce API Refactor**. Anything beyond — authentication on these routes (covered in Module 4), cloud/object storage for files, image processing, full-text search engines, cursor-based pagination in depth, caching, background job queues, automated testing — is flagged **🔒 Coming Later — Outside This Module**. *I have only seen the first five module files, so "later" means "not taught here."*
>
> **Things about the module file worth knowing before you start**
> 1. It has a title, learning objectives, a Resource Book and one challenge. It has **no module code, no lesson table, no live sessions, no quiz and no discussion prompt**, so none is shown or invented. Section 11 has practice questions of my own, labelled as such.
> 2. The first objective says **Controller-Service-Repository**, but the Resource Book and challenge only name controllers, services and "Data Layers". These notes teach **all three layers** and use the repository layer to show how storage can be swapped.
> 3. The last objective — **async/await patterns and preventing unhandled promise rejections** — has **no resource** in your file. Section 6 is my own treatment of it.
> 4. The Zod video mentions inferring **TypeScript** types "if you use TS". This course uses JavaScript, so TypeScript appears only as a short note (Section 3.7).
> 5. **Versions:** Zod **4.6.7** (many Zod tutorials, probably including your video, were written for **Zod 3**; Section 3.6 lists what differs), Multer **2.5.0**, Express **5.3.0**, Mongoose 9.11, Node 24.
> 6. **One thing not run:** the **Prisma** version of the repository in Section 1.5 (I had no PostgreSQL available this time; the Module 3 notes ran Prisma against PostgreSQL). Everything else — the in-memory and MongoDB repositories, Zod, Multer, pagination, error handling, async patterns — was run.

---

## How this document is organized

Same practical shape as the earlier notes: **What is it? → Why does it exist? → How does it work? → Syntax → Examples → When to use / not use → Try it yourself → Exercises → Common mistakes → Knowledge check.** One project runs through everything: a **Product API** that starts as one messy file (the challenge's "before") and ends as a layered, validated, error-safe API with uploads, search and pagination.

## Table of Contents

- [Before You Start: Prerequisites](#before-you-start-prerequisites)
- [1. Layered Architecture: Controller, Service, Repository](#1-layered-architecture-controller-service-repository)
- [2. Global Error Handling and Standardized Responses](#2-global-error-handling-and-standardized-responses)
- [3. Validation with Zod](#3-validation-with-zod)
- [4. File Uploads with Multer](#4-file-uploads-with-multer)
- [5. Pagination, Filtering and Search](#5-pagination-filtering-and-search)
- [6. async/await Patterns and Unhandled Rejections](#6-asyncawait-patterns-and-unhandled-rejections)
- [7. Hands-On Challenge: The E-Commerce API Refactor](#7-hands-on-challenge-the-e-commerce-api-refactor)
- [8. Final Module Project: Production-Ready Product API](#8-final-module-project-production-ready-product-api)
- [9. Quick Reference Sheet](#9-quick-reference-sheet)
- [10. Source & Resource Mapping](#10-source--resource-mapping)
- [11. Practice Questions](#11-practice-questions)
- [12. Glossary](#12-glossary)

---

## Before You Start: Prerequisites

| You should be able to… | Where it was taught |
|---|---|
| Build an Express API with routers, `express.json()`, middleware, a 404 handler and a four-parameter error handler registered last | Backend Module 2, Sections 3–4 |
| Know that Express 5 forwards an error thrown in an `async` handler to the error handler, and that `req.body` is `undefined` when no parser matched | Backend Module 2, Section 2.6 |
| Keep data access in a separate module (`store.js`) behind a small interface | Backend Modules 2–3 |
| Use Mongoose (and optionally Prisma) for CRUD | Backend Module 3 |
| Use `async`/`await` and understand that a server has one thread (blocking hurts everyone) | Backend Module 1, Sections 3.6–3.8 |
| *(Optional)* Protect routes with `authenticateToken` | Backend Module 4 |

**Why this module?** Your Resource Book puts it plainly: *"Building an API is one thing; building one that is scalable, maintainable, and robust is another."* Modules 2–4 got an API working. This module is about the habits that keep it working as it grows: **structure** (so a change touches one place), **validation** (so bad input never reaches your logic), **consistent errors** (so clients and developers always know what happened), **files**, **big lists**, and **async code that can't silently crash the server**.

**Prerequisite self-check** (answers in Section 11):

1. In the Module 3 Task API, which file played the role of the "data layer"?
2. How many parameters does an Express error-handling middleware have?
3. What does Express 5 do when an `async` route handler throws?
4. What is `req.body` on Express 5 when the request had no JSON body?

---

## 1. Layered Architecture: Controller, Service, Repository

*(Resource Book, section 1 — "Architecture & Error Handling". Moving away from putting all logic in `routes.js`: structure your app for growth and stability. Objective: implement Layered Architecture (Controller-Service-Repository) for scalable codebases.)*

> 📖 **Reading for this section — [Layered Architecture in Node.js — Medium](https://medium.com/@ankitpartap24/layered-architecture-in-node-js-5ef94e846ec4)**
> Your module file's key concept: *"Separation of concerns. Routes handle HTTP, Services handle Logic, Data Layers handle the Database."* *(I did not open the article; the key concept is quoted from your file.)*

### 1.1 The problem: everything in one file

This is the challenge's starting point — a tiny "Product API" where routing, validation (there is none), data and responses are all mixed together:

```javascript
// BEFORE: everything in one file - routing, "validation", data and responses all mixed together.
const express = require('express');
const app = express();
app.use(express.json());

const products = [
  { id: 1, name: 'Phone', price: 299, category: 'electronics' },
  { id: 2, name: 'T-Shirt', price: 15, category: 'clothing' }
];

app.get('/products', (req, res) => {
  res.json(products);                                              // returns EVERYTHING, always
});

app.post('/products', (req, res) => {
  const { name, price, category } = req.body;                      // crashes if there is no body
  const product = { id: products.length + 1, name, price, category };   // no validation at all
  products.push(product);
  res.send(product);                                               // one response style here...
});

app.get('/products/:id', (req, res) => {
  const product = products.find((p) => p.id == req.params.id);
  if (!product) return res.status(404).send('not found');          // ...plain text there
  res.json(product);
});

app.listen(process.env.PORT || 3000, () => console.log('before app listening'));
```

It works on the happy path — and fails everywhere else. These requests were run against it:

```text
$ curl -X POST -H 'Content-Type: application/json' -d '{"name":"","price":"abc","category":"nonsense"}' localhost:3000/products
{"id":4,"name":"","price":"abc","category":"nonsense"}  [HTTP 200]

$ curl -X POST localhost:3000/products        (no body, no Content-Type)
<!DOCTYPE html> … <pre>TypeError: Cannot destructure property 'name' of 'req.body' as it is undefined.
   at /…/before/app.js:16:11   at Layer.handleRequest (/…/node_modules/router/lib/layer.js:152:17) …</pre>

$ curl localhost:3000/products/99
not found  [HTTP 404]
```

| What went wrong | Why it matters |
|---|---|
| **A product with an empty name, price `"abc"` and a made-up category was accepted** (`200`) | Garbage in the data; every later feature has to defend against it |
| **A request with no body crashed the handler**, and the client got an **HTML page with file paths and a stack trace** | A bug becomes a crash *and* an information leak |
| **Different response styles**: `res.send(object)`, `res.json(...)`, plain text `not found` | Clients can't write one piece of code to handle responses |
| **`GET /products` returns everything** | Fine for 2 products, not for 10,000 (Section 5) |
| **No place for rules**: where would "a product's price can't change by more than 50%" go? Inside a route handler, next to HTTP code | Logic tangled with transport can't be reused or tested |

### 1.2 The layers

**Separation of concerns** means each piece of code has **one job**. A layered API splits the job of "handle a request for products" into four:

```text
HTTP request
    │
    ▼
 routes        URL + method  ──►  which middleware and which controller function        (the menu)
    │
    ▼
 controller    HTTP in/out:  read the validated request, call the service, shape the response   (the waiter)
    │
    ▼
 service       the BUSINESS rules and orchestration: no req/res, no SQL/Mongo              (the chef)
    │
    ▼
 repository    DATA access: the queries; the only layer that knows how data is stored       (the pantry)
    │
    ▼
 database / array
```

(The kitchen analogy from Module 1 still works: the **route** is the menu entry, the **controller** is the waiter taking and delivering the order, the **service** is the chef applying the recipe, and the **repository** is whoever fetches ingredients from the pantry.) Your Resource Book states the same split: *"Routes handle HTTP, Services handle Logic, Data Layers handle the Database."*

| Layer | Responsible for | Must **not** |
|---|---|---|
| **Routes** | Mapping `METHOD /path` to middleware (validation, upload, auth) and a controller function | Contain logic |
| **Controller** | Reading `req.validated…`/`req.file`, calling **one** service function, choosing the status code and response shape | Contain business rules, or talk to the database |
| **Service** | Business rules (deleting a product also deletes its image; "not found" is an error), combining several repository calls, computing derived values (pagination meta) | Import Express, read `req`/`res`, or know whether data lives in an array, MongoDB or PostgreSQL |
| **Repository** | Reading and writing data; translating the app's needs into queries | Contain business rules, or know about HTTP |

**The dependency rule:** each layer only calls the layer **directly below** it. Controllers call services; services call repositories; **nothing calls upward**, and the service never sees `req` or `res`. That is what makes each layer replaceable and testable on its own.

### 1.3 The structure (the challenge's files)

```text
product-api/
├── server.js                       starts the server (and, if needed, the database connection)
├── app.js                          builds the Express app: parsers, routes, 404, error handler
├── routes/productRoutes.js         URL -> middleware -> controller
├── controllers/productController.js
├── services/productService.js
├── repositories/
│   ├── index.js                    chooses which repository to use
│   ├── productRepository.js        in-memory data
│   └── mongoProductRepository.js   MongoDB data (same functions)
├── schemas/productSchemas.js       Zod schemas (Section 3)
├── middleware/                     validate.js · upload.js · errorHandler.js
├── errors/AppError.js              custom error classes (Section 2)
├── models/Product.js               the Mongoose model (used only by the Mongo repository)
└── uploads/                        uploaded thumbnails (git-ignored)
```

### 1.4 Each layer in code

**`routes/productRoutes.js`** — only wiring. Notice the *order* of the middleware on `POST` (explained in Section 4.3):

```javascript
const express = require('express');
const controller = require('../controllers/productController');
const validate = require('../middleware/validate');
const { uploadThumbnail, checkImageSignature } = require('../middleware/upload');
const { createProductSchema, listQuerySchema, idParamsSchema } = require('../schemas/productSchemas');

const router = express.Router();

router.get('/', validate(listQuerySchema, 'query'), controller.list);
router.get('/:id', validate(idParamsSchema, 'params'), controller.getOne);

// Order matters: Multer parses the multipart body FIRST (so req.body exists), then we check the file, then validate the fields.
router.post('/', uploadThumbnail, checkImageSignature, validate(createProductSchema, 'body'), controller.create);

router.delete('/:id', validate(idParamsSchema, 'params'), controller.remove);

module.exports = router;
```

**`controllers/productController.js`** — thin. Every function reads the request, calls the service, shapes the response, nothing more:

```javascript
const productService = require('../services/productService');

// The HTTP layer: read the (already validated) request, call the service, shape the response. Nothing else.

async function list(req, res) {
  const { items, meta } = await productService.listProducts(req.validated.query);
  res.json({ status: 'success', data: items, meta });
}

async function getOne(req, res) {
  const product = await productService.getProduct(req.validated.params.id);
  res.json({ status: 'success', data: product });
}

async function create(req, res) {
  const product = await productService.createProduct(req.validated.body, req.file);
  res.status(201).location(`/products/${product.id}`).json({ status: 'success', data: product });
}

async function remove(req, res) {
  await productService.deleteProduct(req.validated.params.id);
  res.sendStatus(204);
}

module.exports = { list, getOne, create, remove };
```

**`services/productService.js`** — the business rules. No `req`, no `res`, no database syntax:

```javascript
const fs = require('node:fs');
const path = require('node:path');
const repository = require('../repositories');
const { NotFoundError } = require('../errors/AppError');
const { UPLOAD_DIR } = require('../middleware/upload');

// The BUSINESS layer: rules and orchestration. It knows nothing about req/res (HTTP) or SQL/Mongo (storage).

async function listProducts(query) {
  const { items, total } = await repository.findAll(query);
  const totalPages = Math.max(1, Math.ceil(total / query.limit));
  return {
    items,
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages,
      hasNext: query.page < totalPages,
      hasPrev: query.page > 1
    }
  };
}

async function getProduct(id) {
  const product = await repository.findById(id);
  if (!product) throw new NotFoundError(`Product ${id} not found`);
  return product;
}

async function createProduct(data, file) {
  // Rule: the stored thumbnail is a public URL path, never a file-system path.
  const thumbnail = file ? `/uploads/${file.filename}` : null;
  return repository.create({ ...data, thumbnail });
}

async function deleteProduct(id) {
  const product = await repository.remove(id);
  if (!product) throw new NotFoundError(`Product ${id} not found`);
  // Rule: deleting a product also deletes its image file.
  if (product.thumbnail) {
    await fs.promises.unlink(path.join(UPLOAD_DIR, path.basename(product.thumbnail))).catch(() => {});
  }
}

module.exports = { listProducts, getProduct, createProduct, deleteProduct };
```

Look at what the service does that neither the route nor the repository could: it turns "no such product" into a **`NotFoundError`** (a business meaning), computes the **pagination meta**, and encodes two **rules** (a thumbnail is stored as a URL path; deleting a product removes its file). It throws errors **instead of sending responses** — the global error handler (Section 2) decides what HTTP says.

**`repositories/productRepository.js`** — the data layer (here, an array; the first lines are the seed data):

```javascript
// The DATA layer. This version keeps products in an array; mongoProductRepository.js has the same
// functions backed by MongoDB. Nothing above this layer knows (or cares) which one is in use.
const products = [
  { id: 1, name: 'iPhone 15 Phone', price: 799, category: 'electronics' },
  { id: 2, name: 'Android Phone X', price: 499, category: 'electronics' },
  { id: 3, name: 'Phone Case Leather', price: 19.99, category: 'electronics' },
  { id: 4, name: 'Noise Cancelling Headphones', price: 199, category: 'electronics' },
  { id: 5, name: 'Cotton T-Shirt', price: 15, category: 'clothing' },
  { id: 6, name: 'Denim Jacket', price: 69.5, category: 'clothing' },
  { id: 7, name: 'Running Shoes', price: 89, category: 'clothing' },
  { id: 8, name: 'JavaScript: The Good Parts', price: 24.99, category: 'books' },
  { id: 9, name: 'Node.js Design Patterns', price: 39.9, category: 'books' },
  { id: 10, name: 'Desk Lamp', price: 29, category: 'home' },
  { id: 11, name: 'Ceramic Mug Set', price: 18.5, category: 'home' },
  { id: 12, name: 'Phone Stand', price: 12, category: 'home' }
].map((p, i) => ({ ...p, thumbnail: null, createdAt: new Date(Date.UTC(2026, 0, 1 + i)).toISOString() }));

let nextId = products.length + 1;

async function findAll({ search, category, sort, order, page, limit }) {
  let result = products.filter((p) =>
    (!category || p.category === category) &&
    (!search || p.name.toLowerCase().includes(search.toLowerCase()))
  );
  const direction = order === 'desc' ? -1 : 1;
  result = [...result].sort((a, b) => (a[sort] > b[sort] ? 1 : a[sort] < b[sort] ? -1 : 0) * direction);
  const total = result.length;
  const items = result.slice((page - 1) * limit, page * limit);
  return { items, total };
}

async function findById(id) {
  return products.find((p) => p.id === Number(id)) ?? null;
}

async function create({ name, price, category, thumbnail }) {
  const product = { id: nextId++, name, price, category, thumbnail, createdAt: new Date().toISOString() };
  products.push(product);
  return product;
}

async function remove(id) {
  const index = products.findIndex((p) => p.id === Number(id));
  if (index === -1) return null;
  return products.splice(index, 1)[0];
}

module.exports = { findAll, findById, create, remove };
```

Every function is `async` **even though an array doesn't need it** — on purpose: every repository must have the same interface, and a database one *has* to be asynchronous. A function that returns "nothing found" returns `null`; it does **not** throw — deciding that "missing" is an error is the service's job.

**How one request flows** — `GET /products?search=phone&limit=3`:

```text
route         matches GET /products, runs validate(listQuerySchema, 'query')  -> req.validated.query = { page:1, limit:3, search:'phone', … }
controller    list(): calls productService.listProducts(req.validated.query)
service       listProducts(): calls repository.findAll(query), then computes totalPages / hasNext
repository    findAll(): filters, sorts, slices — returns { items, total }
service       returns { items, meta }      controller sends { status:'success', data, meta }
```

### 1.5 The payoff: swap the repository, change nothing else

`repositories/index.js` picks the implementation once:

```javascript
// Choose the data layer once. The rest of the app just does require('./repositories').
module.exports = process.env.DB === 'mongo'
  ? require('./mongoProductRepository')
  : require('./productRepository');
```

The MongoDB version has the **same four functions with the same inputs and outputs**:

```javascript
const mongoose = require('mongoose');
const Product = require('../models/Product');

// User input must never become a regular expression: escape the special characters first.
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function findAll({ search, category, sort, order, page, limit }) {
  const filter = {};
  if (category) filter.category = category;
  if (search) filter.name = { $regex: escapeRegex(search), $options: 'i' };   // case-insensitive "contains"

  // The page of items and the total count are independent: run them IN PARALLEL.
  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort({ [sort]: order === 'desc' ? -1 : 1, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter)
  ]);
  return { items, total };
}

async function findById(id) {
  if (!mongoose.isValidObjectId(id)) return null;        // a malformed id simply "doesn't exist"
  return Product.findById(id);
}

async function create(data) {
  return Product.create(data);
}

async function remove(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  return Product.findByIdAndDelete(id);
}

module.exports = { findAll, findById, create, remove };
```

Started with `DB=mongo`, the **same requests return the same pages and the same search results** — the service, controller and routes didn't change a line. These two requests returned **identical output** from the in-memory and the MongoDB repository:

```text
$ curl 'localhost:3000/products?page=2&limit=5'
names: ['Denim Jacket', 'Running Shoes', 'JavaScript: The Good Parts', 'Node.js Design Patterns', 'Desk Lamp']
meta : {"page": 2, "limit": 5, "total": 12, "totalPages": 3, "hasNext": true, "hasPrev": true}

$ curl 'localhost:3000/products?search=phone'
names: ['iPhone 15 Phone', 'Android Phone X', 'Phone Case Leather', 'Noise Cancelling Headphones', 'Phone Stand']
meta : {"page": 1, "limit": 10, "total": 5, "totalPages": 1, "hasNext": false, "hasPrev": false}
```

The Mongoose repository also shows two things you will meet again: a **regex-escaping** helper for search (Section 5.5) and **`Promise.all`** to fetch a page and its total in parallel (Section 6).

**The Prisma version (PostgreSQL)** *(adapted from the Module 3 Prisma setup; I did not run this one)*:

```javascript
// repositories/prismaProductRepository.js - assumes the Prisma 7 db.js from Module 3 and a Product model:
//   model Product { id Int @id @default(autoincrement())  name String  price Float  category String
//                   thumbnail String?  createdAt DateTime @default(now()) }
import { prisma } from '../db.js';

export async function findAll({ search, category, sort, order, page, limit }) {
  const where = {
    ...(category && { category }),
    ...(search && { name: { contains: search, mode: 'insensitive' } })   // case-insensitive "contains"; values are parameterised
  };
  const [items, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy: { [sort]: order }, skip: (page - 1) * limit, take: limit }),
    prisma.product.count({ where })
  ]);
  return { items, total };
}
// findById / create / remove follow the Module 3 pattern; remove "not found" (P2025) is translated to null.
```
(Money in real systems should be stored as integer cents or a decimal type, not a float — 🔒 outside this module.)

### 1.6 Where do validation, authentication and logging go?

They are **cross-cutting concerns** — they apply to many routes and belong in **middleware**, not inside controllers or services:

| Concern | Where | In this module |
|---|---|---|
| Validating input | `validate(schema, source)` middleware, *before* the controller | Section 3 |
| Parsing uploads | `uploadThumbnail` middleware | Section 4 |
| Authentication / roles | `authenticateToken`, `authorizeRole` in the route chain | Module 4 |
| Logging | A logger middleware at the top of `app.js` | Module 2 |
| Turning errors into responses | The global error handler, registered last | Section 2 |

The service can then **trust** its input: if it is called, the data has already been validated.

### 1.7 When *not* to add layers

Layers are a tool, not a goal. For a 30-line script or a three-route prototype, the layers cost more than they give. Add them when **logic is being repeated or tangled** — when a route handler has grown past "read request, call something, respond", when you need to change storage, or when you want to test business rules without HTTP. Watch for **pass-through layers** (a service function that only calls the repository and adds nothing) — they are fine as a seam you expect to grow, but don't create a file per function just to look professional.

### Try it yourself

1. Take your Module 3 Task API and label each file with the layer it belongs to. Which file mixes two layers?
2. In the layered Product API, find the one line that decides a missing product is an *error*. In which layer is it, and why not in the repository?
3. Run the API with the in-memory repository, then with `DB=mongo`, and compare the same request's results.

### Exercises

**Level 1 — Basic:** Split the "before" `app.js` into `routes/`, `controllers/` and `services/` folders, keeping the in-memory array in the service for now.

**Level 2 — Practical:** Add a **repository** layer to your split: move the array and every `find`/`push`/`splice` into `repositories/productRepository.js`, and make the service call it.

**Level 3 — Challenge:** Add a business rule to the service — "a product named `X` can't be created twice in the same category" — and decide which error it throws and which layer detects it. Why can't the controller or repository own that rule?

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| Business rules in the controller | They can't be reused or tested without HTTP | Move them to the service |
| The service importing Express (`req`, `res`) | It is now tied to HTTP | Pass plain values in, return plain values or throw errors |
| The service sending the response | Two layers deciding the response shape | The service throws; the controller (and error handler) respond |
| The controller calling the repository directly | Skips the rules; layers leak | Controller → service → repository |
| Database syntax outside the repository | Changing databases touches the whole app | Keep queries in the repository |
| A repository that throws "not found" | Mixes data access with business meaning | Return `null`; the service decides |
| One giant `utils.js` | Not a layer — just a junk drawer | Put each responsibility in its layer |

### ✅ Knowledge Check
1. What is "separation of concerns", and what does each of the four layers do?
2. What is the dependency rule? Which layer must never see `req` or `res`?
3. Which layer should decide that "product not found" is an error, and why?
4. What did swapping the in-memory repository for the MongoDB one require changing above the repository?
5. Where do validation, authentication and logging belong, and why?

---

## 2. Global Error Handling and Standardized Responses

*(Resource Book, section 1 — "Architecture & Error Handling". Objective: handle global errors and standardize API responses.)*

> 📺 **Video for this section — [Procademy](https://www.youtube.com/watch?v=WXa1yzLR3hw)**
> Your module file describes it as: *"Learn how to catch errors from anywhere in your app and send a clean, consistent response to the client."* *(I haven't watched it; the description is from your file.)*

### 2.1 Why one place for errors?

Errors come from everywhere: a bad request body, a missing record, a full disk, a bug. If each route handles its own, you get what the "before" app showed — HTML stack traces, plain-text messages, inconsistent shapes, and the occasional crash. A **global error handler** gives you three guarantees:

1. **One place** where every error becomes a response (so you can't forget one).
2. **One shape**, so every client can handle every failure with the same code.
3. **No leaks**: details go to the log, never to the client.

The pieces you already know make this possible: Express routes errors to the **four-parameter** error-handling middleware registered last (Module 2), and Express 5 sends errors from `async` handlers there automatically.

### 2.2 One response shape

The challenge specifies the error shape: `{ status: "error", message: "..." }`. Pair it with a matching success shape and every response in the API looks the same:

```text
SUCCESS   { "status": "success", "data": <the result>, "meta": { …pagination… } }     (meta only on lists)
ERROR     { "status": "error",   "message": "Validation failed",
            "errors": [ { "field": "price", "message": "price must be greater than 0" } ] }   (errors only when there are field details)
```

| Situation | Status | `message` |
|---|---|---|
| Invalid request data (Zod) | `400` | `Validation failed` (+ an `errors` list) |
| Malformed JSON body | `400` | the parser's message |
| Bad upload (wrong type, wrong field) | `400` | a clear explanation |
| Upload too large | `413` | `File too large (maximum 2 MB)` |
| Resource not found / unknown route | `404` | `Product 999 not found` / `Route not found: GET /nope` |
| A bug or an unexpected failure | `500` | **always** `Internal Server Error` — never the real cause |

The `errors` array is optional detail; the **`status` and `message` are always present**, so a client can always show `message`.

### 2.3 Custom error classes

Instead of sending responses from deep inside the app, code **throws** an error that *describes the problem*, and the handler decides how to answer. A small hierarchy does this:

```javascript
// Errors we EXPECT and want to report to the client (bad input, not found...), as opposed to bugs.
class AppError extends Error {
  constructor(message, statusCode = 500, details) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') { super(message, 404); }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed', details) { super(message, 400, details); }
}

module.exports = { AppError, NotFoundError, ValidationError };
```

- **`AppError`** carries an HTTP `statusCode` and optional `details`.
- **`NotFoundError`** and **`ValidationError`** are specialisations — a service writes `throw new NotFoundError('Product 7 not found')` and **never touches `res`**.
- Errors are **operational** (expected: bad input, missing data — you tell the client) or **programmer errors** (bugs — you log them and tell the client nothing). `AppError` marks the first kind; everything else is treated as the second.

### 2.4 The global error handler

This is the whole mechanism — four branches, from most specific to least:

```javascript
const fs = require('node:fs');
const multer = require('multer');
const { AppError } = require('../errors/AppError');

function notFound(req, res) {
  res.status(404).json({ status: 'error', message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function send(res, statusCode, message, errors) {
  const body = { status: 'error', message };
  if (errors) body.errors = errors;
  res.status(statusCode).json(body);
}

// The ONE place where every error becomes a response. Registered LAST.
async function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  // A file may have been saved before something else failed: don't leave it behind.
  if (req.file) await fs.promises.unlink(req.file.path).catch(() => {});

  // 1. Errors we raised on purpose (not found, validation...)
  if (err instanceof AppError) {
    return send(res, err.statusCode, err.message, err.details);
  }

  // 2. Upload errors from Multer
  if (err instanceof multer.MulterError) {
    const tooBig = err.code === 'LIMIT_FILE_SIZE';
    return send(res, tooBig ? 413 : 400, tooBig ? 'File too large (maximum 2 MB)' : `Upload error: ${err.code}`);
  }

  // 3. Errors raised by Express/body-parser itself (malformed JSON, body too large) carry their own 4xx status
  if (err.status >= 400 && err.status < 500) {
    return send(res, err.status, err.message);
  }

  // 4. Anything else is a BUG: log the details for us, send nothing sensitive to the client.
  console.error(err);
  send(res, 500, 'Internal Server Error');
}

module.exports = { notFound, errorHandler };
```

How it works:

- **The signature has four parameters** `(err, req, res, next)` — that is how Express recognises it. It is registered **last** (after the routes and the 404 handler) in `app.js`.
- **Branch 1** handles your own errors, using the status and details they carry.
- **Branch 2** handles Multer's upload errors (Section 4).
- **Branch 3** handles the 4xx errors Express and `body-parser` raise themselves (malformed JSON → `400`). They carry a `status` property, so the handler reuses it.
- **Branch 4 is the safety net.** Anything unrecognised is a bug: `console.error(err)` records the full error **server-side**, and the client gets only `Internal Server Error`.
- **`res.headersSent`** — if a response has already started, sending another is impossible; the error is handed to Express's default handler.
- **The `req.file` cleanup** deletes a half-processed upload when *any* error occurs after Multer saved it (Section 4.5).

### 2.4.1 Seeing it work

Each of these was run. (`[HTTP …]` is the status; the JSON `Content-Type` header was sent on requests with a body.)

```text
$ curl localhost:3000/products/999
{"status":"error","message":"Product 999 not found"}  [HTTP 404]

$ curl localhost:3000/nope
{"status":"error","message":"Route not found: GET /nope"}  [HTTP 404]

$ curl -X POST -d '{"name":"Broken"' localhost:3000/products
{"status":"error","message":"Expected ',' or '}' after property value in JSON at position 16 (line 1 column 17)"}  [HTTP 400]

$ curl -X POST -d '{"name":"","price":-5,"category":"toys"}' localhost:3000/products
{"status":"error","message":"Validation failed","errors":[{"field":"name","message":"name is required"},{"field":"price","message":"price must be greater than 0"},{"field":"category","message":"Invalid option: expected one of \"electronics\"|\"clothing\"|\"books\"|\"home\""}]}  [HTTP 400]

$ curl -X POST localhost:3000/products        (no body at all)
{"status":"error","message":"Validation failed","errors":[{"field":"body","message":"Invalid input: expected object, received undefined"}]}  [HTTP 400]
```

Notice the last one: with **no body**, `req.body` is `undefined` (Express 5) — the "before" app *crashed* on exactly this request; the layered API answers a clean `400`, because validation runs first and treats `undefined` as invalid.

**And the bug path** — a handler that throws an error containing a secret, and an `async` handler that rejects:

```javascript
app.get('/boom', () => { throw new Error('connection to db.internal:5432 refused (password=hunter2)'); });
app.get('/boom-async', async () => { await Promise.reject(new TypeError('cannot read properties of undefined')); });
app.use(errorHandler);
```
```text
GET /boom       -> 500 {"status":"error","message":"Internal Server Error"}
GET /boom-async -> 500 {"status":"error","message":"Internal Server Error"}

what the SERVER LOG got (stderr):
Error: connection to db.internal:5432 refused (password=hunter2)
TypeError: cannot read properties of undefined
```

The **client** learns nothing about the host or the password; the **developer** sees the full error in the log. And the `async` handler's rejection reached the same place — no `try/catch` in the route.

### 2.5 Express 4 needs a wrapper

Everything above relies on Express 5 forwarding a rejected Promise to the error handler. On **Express 4** that doesn't happen (Module 2 showed an `async` throw *crashing* the server), so older code wraps every async handler:

```javascript
// Express 4 only: catch the rejection and pass it to next(), by hand
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
router.get('/', asyncHandler(controller.list));
```
You will see this `asyncHandler` (or the `express-async-errors` package) in many tutorials, including some that your Procademy-style videos may use. **On Express 5 you don't need it** — but it is harmless if you meet it.

### 2.6 What a global handler does *not* catch

It handles errors that travel through Express. It cannot catch a **promise rejection that nobody awaited** (an un-awaited call inside a handler), or an exception thrown in a timer callback — those escape Express entirely and can crash the process. Section 6 covers them, and the `unhandledRejection` safety net in `server.js`.

### Try it yourself

1. Add a route `GET /products/boom` that throws an `Error`. Request it and compare the client's response with your terminal's log.
2. Throw a `NotFoundError` from a service and confirm the client gets your `message` and a `404`.
3. Remove the error handler and trigger a validation error. What does the client receive now?

### Exercises

**Level 1 — Basic:** Add a `ConflictError` (`409`) to `AppError.js` and throw it when a product with the same name already exists.

**Level 2 — Practical:** Make the handler log `err.stack` for `500`s **with the request method and URL**, and nothing for `4xx` errors. Why log the URL?

**Level 3 — Challenge:** Add an `errorId` (a random UUID) to every `500` response *and* to the log line, so a user can quote it in a bug report and you can find the exact log entry.

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| Sending `err.message` or `err.stack` to the client for unexpected errors | Leaks internals (hosts, queries, file paths, sometimes secrets) | A generic message; details to the log |
| Sending responses from services (`res.status(404)…`) | The service is now tied to HTTP and the shape is inconsistent | Throw `NotFoundError`; the handler responds |
| Registering the error handler before the routes | It never sees their errors | Last |
| An error handler with three parameters | Express treats it as ordinary middleware | Four parameters, even if `next` is unused |
| `catch (e) { console.log(e) }` and then carrying on | The error is swallowed; the request may hang | Rethrow or call `next(e)` |
| Different shapes in different routes | Clients need special cases | One `send()` function |
| Forgetting the 404 handler | Unknown URLs get Express's HTML page | `notFound` before `errorHandler` |

### ✅ Knowledge Check
1. What three guarantees does a global error handler give?
2. How does Express recognise an error-handling middleware, and where is it registered?
3. Why does a service **throw** `NotFoundError` instead of sending a `404` response?
4. What does the client receive for an unexpected bug, and where do the details go?
5. Why does the "before" app crash on a request with no body while the layered API returns `400`?
6. Name one kind of failure a global Express error handler *cannot* catch.

---

## 3. Validation with Zod

*(Resource Book, section 2 — "Data Integrity & Validation". Never trust user input: strictly enforce data schemas before they reach your logic. Objective: validate complex request bodies using Zod.)*

> 📺 **Video for this section — [Web Dev Simplified](https://www.youtube.com/watch?v=L6BE-U3oy80)**
> Your module file describes it as: *"Zod is the modern standard for validation. Learn how to verify request bodies and even infer TypeScript types (if you use TS)."* *(I haven't watched it; the description is from your file.)*

### 3.1 Why validate, and where

Everything that arrives in a request — body, query string, URL parameters, headers, uploaded fields — comes from **outside your control**. The "before" app accepted a price of `"abc"`. Validation answers one question at the **boundary** of your app: *is this data in the shape and range I expect?* If not, the request is rejected with a `400` **before** it reaches the controller, service or database.

A **schema** describes the expected shape declaratively; a validation library checks data against it. **Zod** is the library your module uses:

```bash
npm install zod
```

Validating in **middleware** keeps the layers clean: the controller and service receive already-valid data and don't re-check it. (A database's own constraints from Module 3 — `NOT NULL`, `UNIQUE` — are a second, separate line of defence.)

### 3.2 Zod basics

The challenge asks for a product with a **name (string), price (number, positive) and category (enum)**. As a Zod schema:

```javascript
const { z } = require('zod');

const CATEGORIES = ['electronics', 'clothing', 'books', 'home'];
const productSchema = z.object({
  name: z.string().trim().min(1, 'name is required'),
  price: z.number().positive('price must be greater than 0'),
  category: z.enum(CATEGORIES)
});
```

`schema.safeParse(input)` checks the data and **never throws**: it returns `{ success: true, data }` or `{ success: false, error }`. (`schema.parse(input)` returns the data or **throws** a `ZodError`.) Results, run with a helper that prints each case:

```text
valid                          -> OK {"name":"Phone","price":299,"category":"electronics"}
missing name                   -> FAIL [{"path":"name","message":"Invalid input: expected string, received undefined"}]
blank name                     -> FAIL [{"path":"name","message":"name is required"}]
price as a string "299"        -> FAIL [{"path":"price","message":"Invalid input: expected number, received string"}]
negative price                 -> FAIL [{"path":"price","message":"price must be greater than 0"}]
bad category                   -> FAIL [{"path":"category","message":"Invalid option: expected one of \"electronics\"|\"clothing\"|\"books\"|\"home\""}]
extra field "isAdmin"          -> OK {"name":"Phone","price":5,"category":"books"}
not an object (null)           -> FAIL [{"path":"","message":"Invalid input: expected object, received null"}]
```

What to learn from it:

- **`.trim()` transforms the data too** — the valid result is `"Phone"` even if the input was `"  Phone  "`. `result.data` is the **cleaned** value; use it, not the raw input.
- **Types are strict:** `"299"` (a string) is **not** a number and fails.
- **Custom messages** are the second argument (`'name is required'`); otherwise Zod's defaults apply (`Invalid input: expected string, received undefined`).
- **`z.enum([...])`** restricts a value to a fixed list — the challenge's `category`.
- **Each problem is an "issue"** with a `path` (which field) and a `message`.

### 3.3 Unknown keys are dropped — a free defence

Look at the `extra field "isAdmin"` line: validation **succeeded**, and the result **doesn't contain `isAdmin`**. By default, `z.object` **strips keys that aren't in the schema**. That means a client can't smuggle extra fields (like a `role`) into your database through the validated data — the "mass assignment" attack from Module 4. If you would rather **reject** unknown keys, use `z.strictObject`:

```javascript
const strict = z.strictObject({ name: z.string() });
strict.safeParse({ name: 'x', extra: 1 });      // fails: [{ code: 'unrecognized_keys', message: 'Unrecognized key: "extra"' }]
```

### 3.4 Query strings and multipart fields are *always strings*

This trips everyone up. JSON keeps numbers as numbers, but **query strings** (`?page=2`) and **multipart/form-data** fields (an upload form) deliver **everything as text**. A plain `z.number()` would reject `"299"` coming from a form. Use **coercion**:

```javascript
const formSchema = z.object({
  name: z.string().min(1),
  price: z.coerce.number().positive(),       // "299" -> 299
  category: z.enum(CATEGORIES)
});
```
```text
price="299"      -> OK price=299
price="19.99"    -> OK price=19.99
price=""         -> FAIL Too small: expected number to be >0
price="abc"      -> FAIL Invalid input: expected number, received NaN
price=undefined  -> FAIL Invalid input: expected number, received NaN
price="-3"       -> FAIL Too small: expected number to be >0
```

- `z.coerce.number()` converts with JavaScript's `Number(...)`: `"299"` becomes `299`, `"abc"` becomes `NaN` (rejected), a missing value becomes `NaN` (rejected).
- **An empty string `""` coerces to `0`** — which is why it failed `.positive()`. If your rule were `min(0)` instead, an empty field would *pass*; always pair coercion with a range check.

For **query strings with defaults and limits** (used by the list endpoint in Section 5):

```javascript
const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional()
});
```
```text
{}                    -> {"page":1,"limit":10}
{page:"2",limit:"5"}  -> {"page":2,"limit":5,"search":"phone"}      (input ' phone ' was trimmed)
{limit:"500"}         -> FAIL Too big: expected number to be <=100
{page:"0"}            -> FAIL Too small: expected number to be >=1
{page:"1.5"}          -> FAIL Invalid input: expected int, received number
```

`.default(...)` fills in a missing value; **`max(100)` caps the page size**, so no client can ask for a million rows.

### 3.5 The `validate` middleware

A reusable middleware validates `req.body`, `req.query` or `req.params` against a schema and passes the **cleaned data** down the chain:

```javascript
const { ValidationError } = require('../errors/AppError');

// validate(schema, 'body' | 'query' | 'params')
// The parsed (trimmed, coerced, defaulted) data goes to req.validated[source].
// NOTE: we do NOT write it back to req.query - in Express 5 that assignment silently does nothing.
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || source,
        message: issue.message
      }));
      return next(new ValidationError('Validation failed', details));
    }
    req.validated = { ...req.validated, [source]: result.data };
    next();
  };
}

module.exports = validate;
```

- It is a **middleware factory** (like `authorizeRole` in Module 4): `validate(schema, 'query')` returns the real middleware.
- On failure it builds a list of `{ field, message }` from Zod's `issues` and calls **`next(new ValidationError(...))`** — the global handler (Section 2) turns it into the standard `400`.
- On success it stores the cleaned data at **`req.validated.body` / `.query` / `.params`**.

**The Express 5 gotcha behind that comment.** Many Express 4 tutorials overwrite the request: `req.query = schema.parse(req.query)`. On **Express 5 that assignment silently does nothing** — no error, and `req.query` keeps its original strings. This was run:

```javascript
app.get('/overwrite', (req, res) => {
  req.query = querySchema.parse(req.query);                       // looks fine...
  res.json({ page: req.query.page, type: typeof req.query.page });
});
app.get('/validated', (req, res) => {
  req.validated = querySchema.parse(req.query);                   // ...store it somewhere you CAN write
  res.json({ page: req.validated.page, type: typeof req.validated.page });
});
```
```text
/overwrite?page=3      200 {"ok":true,"page":"3","type":"string"}     <- still the original STRING: the assignment was ignored
/validated?page=3      200 {"ok":true,"page":3,"type":"number"}       <- the coerced NUMBER
```

So the code in this module reads `req.validated.query`, never `req.query`, after validation.

### 3.6 Complex request bodies

Real bodies nest objects and arrays. Zod composes. This order schema was run:

```javascript
const orderSchema = z.object({
  customer: z.object({
    email: z.email('a valid email is required'),
    address: z.object({
      street: z.string().min(1),
      city: z.string().min(1),
      postalCode: z.string().regex(/^[0-9]{4,6}$/, 'postal code must be 4-6 digits')
    })
  }),
  items: z.array(z.object({
    productId: z.coerce.number().int().positive(),
    quantity: z.number().int().min(1).max(10)
  })).min(1, 'an order needs at least one item'),
  coupon: z.string().optional(),
  price: z.number().positive(),
  discountPrice: z.number().positive().optional()
}).refine((o) => o.discountPrice === undefined || o.discountPrice < o.price, {
  message: 'discountPrice must be lower than price',
  path: ['discountPrice']
});
```

With several things wrong at once (bad email, bad postal code, two bad items), Zod reports **every** problem with a **path** that points into the structure:

```text
customer.email               | a valid email is required
customer.address.postalCode  | postal code must be 4-6 digits
items.0.productId            | Invalid input: expected number, received NaN
items.0.quantity             | Too big: expected number to be <=10
items.1.quantity             | Too small: expected number to be >=1

empty items -> an order needs at least one item
```

- **Paths** (`items.0.quantity`) tell the client exactly which array element and field failed — your `validate` middleware joins them into the `field` property.
- **`z.array(...).min(1)`** requires a non-empty list; **`.optional()`** makes a field omittable.
- **`.refine(fn, { message, path })`** adds a rule across several fields (here: a discount must be lower than the price). **Notice that the `discountPrice` rule did not appear in the error list above even though `discountPrice` (150) was greater than `price` (100):** Zod runs `.refine()` rules only **after** the basic field checks pass. Fix the field errors and the refinement then runs.

### 3.7 Zod 4 vs. Zod 3, and TypeScript

Many tutorials were written for **Zod 3**. Two differences that matter, both checked:

| | Zod 3 tutorials | Zod 4 (4.6.7, used here) |
|---|---|---|
| Reading the failures | `error.errors` | **`error.issues`** (`error.errors` is gone — it is `undefined`) |
| Email validator | `z.string().email()` | **`z.email()`** (the old form **still works**) |
| Formatting helpers | `error.format()` / `flatten()` | `z.flattenError(error)` and `z.prettifyError(error)` |

```text
flattenError : {"formErrors":[],"fieldErrors":{"name":["name is required"],"price":["price must be greater than 0"], …}}
prettifyError:
✖ name is required
  → at name
✖ price must be greater than 0
  → at price
```
This module reads `error.issues` (it works in both). The Zod documentation lists the other changes if a tutorial's code doesn't run.

**TypeScript (optional).** If you use TypeScript, `z.infer` derives the type from the schema — one source of truth. This was run through the TypeScript compiler:

```typescript
export const productSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  category: z.enum(['electronics', 'books'])
});

export type Product = z.infer<typeof productSchema>;      // { name: string; price: number; category: 'electronics' | 'books' }

const bad: Product = { name: 'Phone', price: '299', category: 'toys' };   // the compiler rejects both fields:
// error TS2322: Type 'string' is not assignable to type 'number'.
// error TS2322: Type '"toys"' is not assignable to type '"books" | "electronics"'.
```
(Compile-time types and runtime validation are different things: the schema *checks* data when the program runs; the inferred type only *informs* the compiler.)

### 3.8 The schemas for this module's API

`schemas/productSchemas.js` — all three, in one file:

```javascript
const { z } = require('zod');

const CATEGORIES = ['electronics', 'clothing', 'books', 'home'];

// Creating a product. multipart/form-data fields arrive as STRINGS, so the price is coerced to a number.
const createProductSchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(100, 'name must be at most 100 characters'),
  price: z.coerce.number().positive('price must be greater than 0'),
  category: z.enum(CATEGORIES)
});

// GET /products?page=1&limit=10&search=phone  (query-string values are strings too)
const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().min(1).optional(),
  category: z.enum(CATEGORIES).optional(),
  sort: z.enum(['name', 'price', 'createdAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('asc')
});

const idParamsSchema = z.object({
  id: z.string().min(1)
});

module.exports = { CATEGORIES, createProductSchema, listQuerySchema, idParamsSchema };
```

Two design points: the create schema uses **`z.coerce.number()`** because the same schema validates both JSON (a real number) and multipart (a string) — coercion accepts either; and the list schema's **`sort` is an enum**, so a client can only sort by a field you allow (never an arbitrary column name).

### Try it yourself

1. Run `schema.safeParse` on valid and invalid products and print `result.error.issues`. Which part of each issue tells you *where* the problem is?
2. Send a price as a string through a JSON route with plain `z.number()` and then with `z.coerce.number()`. What changes?
3. Add `isAdmin: true` to a body and show it never reaches the controller. Then switch to `z.strictObject` and see it rejected.

### Exercises

**Level 1 — Basic:** Write a Zod schema for a user registration: `username` (3–20 chars), `email` (valid email), `age` (integer 13–120, optional).

**Level 2 — Practical:** Add `minPrice` and `maxPrice` query parameters (coerced numbers) to `listQuerySchema`, and a `.refine` that `minPrice <= maxPrice`.

**Level 3 — Challenge:** Validate an order with an `items` array where every `productId` must be unique (hint: `.refine` on the array). Why does the refinement not run while other fields are invalid?

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| `z.number()` for a query-string or multipart value | It arrives as a string | `z.coerce.number()` plus a range check |
| `req.query = schema.parse(req.query)` (Express 5) | The assignment is silently ignored | Store the result in `req.validated.query` |
| Using the raw `req.body` after validation | You skip trimming/coercion/stripping | Use `req.validated.body` |
| `z.coerce.number().min(0)` for a required field | An empty string coerces to `0` and passes | `.positive()`, or reject empty strings first |
| No upper bound on `limit` | A client can request every row | `.max(100)` |
| `error.errors` from a Zod 3 tutorial | `undefined` in Zod 4 | `error.issues` |
| Sending Zod's raw error object to the client | Verbose and inconsistent | Map `issues` to `{ field, message }` |
| Trusting validation alone for security | It only checks shape and range | Also authenticate, authorise and use database constraints |

### ✅ Knowledge Check
1. What is the difference between `parse` and `safeParse`?
2. Why must a multipart or query-string number be coerced, and what does an empty string become?
3. What does Zod do with an unknown key by default, and how does that help against mass assignment?
4. Why does the `validate` middleware store its result in `req.validated` instead of overwriting `req.query`?
5. How does a nested error such as `items.1.quantity` tell the client where the problem is?
6. Why didn't a `.refine()` rule report an error while other fields were invalid?

---

## 4. File Uploads with Multer

*(Resource Book, section 3 — "Handling Files (Multer)". JSON is easy, but what about images? Objective: handle file uploads using Multer.)*

> 📺 **Video for this section — [The Full Stack Junkie](https://www.youtube.com/watch?v=EVOFt8Its6I)**
> Your module file describes it as: *"A breakdown of how to process multipart/form-data and store files on your server."* *(I haven't watched it; the description is from your file.)*

### 4.1 Why JSON can't carry a file

`express.json()` parses text. A file is **binary data** — an image's bytes aren't valid JSON text. Browsers (and tools like `curl -F` or Postman's *form-data*) send files with a different encoding, **`multipart/form-data`**: the body is split into **parts**, separated by a boundary string, and each part has its own headers and content:

```text
POST /products
Content-Type: multipart/form-data; boundary=----abc123

------abc123
Content-Disposition: form-data; name="name"

Phone Stand Pro
------abc123
Content-Disposition: form-data; name="thumbnail"; filename="pixel.png"
Content-Type: image/png

<the raw bytes of the image>
------abc123--
```

`express.json()` ignores this kind of body. **Multer** is the middleware that parses it: it saves each file part (to disk or memory) and exposes:

- **`req.file`** — information about the uploaded file (`filename`, `path`, `size`, `mimetype`, `originalname`);
- **`req.body`** — the **text** parts of the form. **They are all strings** — `price` arrives as `"24.5"`, which is why Section 3 coerces it.

```bash
npm install multer
```

### 4.2 Configuring Multer

`middleware/upload.js` — storage, limits, a type filter and a content check:

```javascript
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const multer = require('multer');
const { ValidationError } = require('../errors/AppError');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const ALLOWED_TYPES = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp' };

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  // Never trust the client's file name: generate our own, with an extension we chose.
  filename: (req, file, cb) => cb(null, crypto.randomUUID() + ALLOWED_TYPES[file.mimetype])
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },          // 2 MB, one file
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES[file.mimetype]) {
      return cb(new ValidationError('Only PNG, JPEG or WebP images are allowed'));
    }
    cb(null, true);
  }
});

// The "Content-Type" of a file part is just a string the CLIENT chose. Check the file's first bytes too.
const SIGNATURES = {
  '.png': (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  '.jpg': (b) => b.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])),
  '.webp': (b) => b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP'
};

async function checkImageSignature(req, res, next) {
  if (!req.file) return next();
  const handle = await fs.promises.open(req.file.path, 'r');
  try {
    const head = Buffer.alloc(12);
    await handle.read(head, 0, 12, 0);
    if (!SIGNATURES[path.extname(req.file.filename)](head)) {
      throw new ValidationError('The uploaded file is not a valid image');
    }
    next();
  } finally {
    await handle.close();
  }
}

module.exports = { uploadThumbnail: upload.single('thumbnail'), checkImageSignature, UPLOAD_DIR };
```

| Piece | What it does |
|---|---|
| **`multer.diskStorage({ destination, filename })`** | Saves files to a folder (`uploads/`) with the name your function returns. (The alternative, `multer.memoryStorage()`, keeps the file as a `Buffer` in memory — for passing it on to cloud storage or image processing, 🔒 later.) |
| **`crypto.randomUUID() + extension`** | A random, unique file name. **Never use `file.originalname`** — it is client-controlled and can contain `../` path tricks, spaces, or collide with another upload |
| **`limits`** | `fileSize` (bytes) and `files` (count). An oversized file is rejected with a `LIMIT_FILE_SIZE` error |
| **`fileFilter`** | Decides per file: `cb(null, true)` accepts; `cb(new Error(...))` rejects. Here: an **allow-list** of three image types |
| **`upload.single('thumbnail')`** | Middleware that accepts **one file** in the form field named **`thumbnail`** (the challenge's field). Other helpers: `.array('photos', 5)` (many files, one field) and `.fields([...])` (several named fields) |

The route does not need Multer for JSON requests: `upload.single(...)` passes non-multipart requests straight through, so `POST /products` accepts **both** a JSON body (no thumbnail) and a multipart form (with one).

### 4.3 Middleware order on the route

```javascript
router.post('/', uploadThumbnail, checkImageSignature, validate(createProductSchema, 'body'), controller.create);
```

The order is not a style choice:

1. **`uploadThumbnail` (Multer) first** — only after Multer parses the multipart body does `req.body` contain the text fields and `req.file` the file. `express.json()` can't.
2. **`checkImageSignature`** — verify the file is really an image.
3. **`validate(createProductSchema, 'body')`** — Zod checks the (string) text fields, coercing the price.
4. **`controller.create`** — runs only if everything passed.

### 4.4 Security: don't trust the file

A file upload is one of the riskiest features an API can have. Rules this module's code follows (and why):

| Rule | Why |
|---|---|
| **Generate the file name yourself** | `originalname` is attacker-controlled (path traversal, overwriting other files) |
| **Limit the size** (`fileSize`) | Otherwise one request can fill your disk or memory |
| **Allow-list the types** | Reject everything that isn't a known image |
| **Don't trust the declared type — check the bytes** | The `Content-Type` of a file part is *whatever the client says*. A text file labelled `image/png` passes the `fileFilter`; the **signature check** (the first bytes of a real PNG are `89 50 4E 47 0D 0A 1A 0A`) catches it |
| **Clean up when something later fails** | A rejected request must not leave orphan files (the error handler deletes `req.file`) |
| **Store a URL path, not a disk path** | The database holds `/uploads/<uuid>.png`, which reveals nothing about your server's folders |
| **Never serve user uploads as executable or HTML** | The static route serves files with the type their extension implies; since we only ever write `.png`/`.jpg`/`.webp`, nothing active is served |

Things deliberately **not** covered (🔒): virus scanning, re-encoding or resizing images (which also strips hidden data), storing files in cloud object storage instead of the server's disk (a server with several copies — Module 4, Section 11 — can't share a local folder), and authentication on the upload route (Module 4's `authenticateToken` can be added to the chain).

Serving the files is one line in `app.js`:

```javascript
app.use('/uploads', express.static(UPLOAD_DIR));     // uploaded thumbnails are served from here
```

### 4.5 Uploading, end to end

Every request below was run. A successful upload — three text fields plus the file (`-F` sends `multipart/form-data`; `@pixel.png` attaches a file):

```text
$ curl -X POST -F name='Phone Stand Pro' -F price=24.5 -F category=home -F thumbnail=@pixel.png localhost:3000/products
{"status":"success","data":{"id":14,"name":"Phone Stand Pro","price":24.5,"category":"home","thumbnail":"/uploads/6e3da9d5-7115-4be7-a4ac-4ee87852f3bc.png","createdAt":"2026-11-04T08:28:25.483Z"}}  [HTTP 201]
```

- The **price is the number `24.5`** in the response, although it arrived as the string `"24.5"` — Zod's coercion did that.
- The **thumbnail** field holds a **URL path** with a random name, not the client's file name.

The file really is on disk and is served back with the right headers:

```text
$ ls uploads/
<uuid>.png

$ curl -i localhost:3000/uploads/6e3da9d5-7115-4be7-a4ac-4ee87852f3bc.png
HTTP/1.1 200 OK
Content-Type: image/png
Content-Length: 70
```
(70 bytes — exactly the size of the original `pixel.png`.)

**The error paths**, each a different layer catching a different problem:

```text
$ curl -X POST -F name=Fake -F price=5 -F category=books -F 'thumbnail=@notes.txt;type=image/png' localhost:3000/products
{"status":"error","message":"The uploaded file is not a valid image"}  [HTTP 400]
      ^ a TEXT file that CLAIMS to be a PNG: the fileFilter passed it, the byte-signature check caught it

$ curl -X POST -F name=Text -F price=5 -F category=books -F 'thumbnail=@notes.txt;type=text/plain' localhost:3000/products
{"status":"error","message":"Only PNG, JPEG or WebP images are allowed"}  [HTTP 400]
      ^ honest about being text: rejected by the fileFilter

$ curl -X POST -F name=Big -F price=5 -F category=books -F 'thumbnail=@big.bin;type=image/png' localhost:3000/products
{"status":"error","message":"File too large (maximum 2 MB)"}  [HTTP 413]
      ^ a 3 MB file: Multer's LIMIT_FILE_SIZE, mapped to 413 by the error handler

$ curl -X POST -F name=Wrong -F price=5 -F category=books -F image=@pixel.png localhost:3000/products
{"status":"error","message":"Upload error: LIMIT_UNEXPECTED_FILE"}  [HTTP 400]
      ^ the file was sent in a field called "image", not "thumbnail"

$ curl -X POST -F name= -F price=abc -F category=books -F thumbnail=@pixel.png localhost:3000/products
{"status":"error","message":"Validation failed","errors":[{"field":"name","message":"name is required"},{"field":"price","message":"Invalid input: expected number, received NaN"}]}  [HTTP 400]
      ^ a VALID image with INVALID text fields
```

That last case is the cleanup rule at work. The image was valid, so Multer **saved it** before Zod rejected the fields — and the error handler then deleted it:

```text
files in uploads/ before those five failures: 1 | after: 1   (nothing left behind)
```

Finally, deleting the product removes its image too (the service's rule from Section 1):

```text
$ curl -X DELETE localhost:3000/products/14
  [HTTP 204]
files in uploads/ after deleting the product: 0
```

### 4.6 Testing and using uploads

- **`curl`:** `-F field=value` for text, `-F field=@path` for a file, `;type=...` to set the declared type. **Do not set `Content-Type` yourself** — `curl` adds the multipart header and its boundary.
- **Postman** *(a graphical app; these are the standard steps, not run here)*: **Body → form-data**; add the keys `name`, `price`, `category` as **Text** and `thumbnail` as **File** (use the dropdown on the key). Postman sets the `Content-Type` header for you.
- **From Angular** *(illustrative; not run)*: build a `FormData` and let the browser set the header:

  ```typescript
  const form = new FormData();
  form.append('name', name);
  form.append('price', String(price));
  form.append('category', category);
  form.append('thumbnail', fileInput.files![0]);      // the field name must match upload.single('thumbnail')
  this.http.post('/products', form);                   // do NOT set Content-Type yourself: the boundary would be lost
  ```

### Try it yourself

1. Upload a real PNG, then open the returned `thumbnail` URL in your browser.
2. Upload a text file renamed to `.png` with its type set to `image/png`. Which check stops it? Remove `checkImageSignature` from the route and repeat — what is saved now?
3. Change `fileSize` to 100 bytes and upload `pixel.png` (70 bytes) and a bigger file.

### Exercises

**Level 1 — Basic:** Add a `thumbnail` field to your Product model/repository and make `POST /products` accept (but not require) an image.

**Level 2 — Practical:** Allow up to three images per product (`upload.array('images', 3)`), store all their URL paths, and delete them all when the product is deleted.

**Level 3 — Challenge:** Replace the signature check with a function that reads the **first 12 bytes** and returns the detected type (`png`/`jpg`/`webp`/`null`), and make the stored extension come from the **detected** type rather than the declared `Content-Type`. Why is that safer?

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| Sending the form as JSON | `express.json()` can't carry a file | `multipart/form-data` |
| Setting `Content-Type: multipart/form-data` by hand (curl, Angular) | The boundary is missing; Multer can't parse | Let the tool/browser set it |
| A different field name than `upload.single('…')` expects | `LIMIT_UNEXPECTED_FILE` | Match the names exactly |
| Putting `express.json()`/`validate` *before* Multer and expecting `req.body` fields | Multipart text fields aren't there yet | Multer first |
| Using `file.originalname` as the stored name | Path tricks and collisions | A generated name |
| Trusting `file.mimetype` | Client-controlled | Allow-list **and** check the bytes |
| No `limits.fileSize` | Disk/memory exhaustion | Always set a limit |
| Leaving orphan files when validation fails | Disk fills with unused uploads | Delete `req.file` on error |
| Expecting `req.body.price` to be a number | It is a string | `z.coerce.number()` |

### ✅ Knowledge Check
1. Why can't `express.json()` handle a file upload, and what does Multer provide?
2. Why are the text fields in `req.body` strings, and how does the module deal with that?
3. Why must `uploadThumbnail` come before `validate` on the route?
4. Why is `file.mimetype` not enough to trust an upload, and what extra check was used?
5. Which error code did the 3 MB file produce, and which status did the handler map it to?
6. What happens to an already-saved file when Zod rejects the other fields?

---

## 5. Pagination, Filtering and Search

*(Resource Book, section 4 — "Advanced Data Retrieval". Don't return 10,000 records at once: paginate and filter data efficiently. Objective: implement pagination, filtering and search for large datasets.)*

> 📺 **Video for this section — [Web Dev Simplified](https://www.youtube.com/watch?v=ZX3qt0UWifc)**
> Your module file describes it as: *"The basics of using limit and skip to create pages of data."* *(I haven't watched it; the description is from your file.)*

> 📺 **Video for this section — [CyberWolves](https://www.youtube.com/watch?v=0T4GsMYnVN4)**
> Your module file describes it as: *"Combining multiple query parameters to build a robust search feature."* *(I haven't watched it; the description is from your file.)*

### 5.1 Why not return everything?

`GET /products` returning every row is fine for 12 rows and a disaster for 100,000: slow database work, a huge response, memory pressure on the server, a slow client, a page nobody can read. Instead the client asks for **a page at a time**, optionally **narrowed** by filters or a search term, and the API answers with just that slice **plus enough information to ask for the next one**.

The challenge's contract: `GET /products?page=1&limit=10&search=phone`.

### 5.2 Offset pagination: `page` and `limit`

Two numbers define a page: **`limit`** (how many items per page) and **`page`** (which page, starting at 1). Databases think in **`skip`** (how many to jump over) and **`limit`/`take`**:

| Quantity | Formula | Example (`page=3`, `limit=5`) |
|---|---|---|
| **skip** | `(page − 1) × limit` | `(3 − 1) × 5 = 10` |
| **items** | rows `skip` … `skip + limit − 1` | rows 11–15 |
| **totalPages** | `ceil(total ÷ limit)` | 12 items → `ceil(12 ÷ 5) = 3` |

In each layer of this module:

```javascript
// in memory (the array repository)
const items = result.slice((page - 1) * limit, page * limit);

// MongoDB / Mongoose
Product.find(filter).sort(...).skip((page - 1) * limit).limit(limit);

// PostgreSQL / Prisma
prisma.product.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit });
```

**The response carries the paging information.** A list that only returns an array leaves the client guessing whether there's a next page. The service builds a **`meta`** object (Section 1.4):

```text
$ curl 'localhost:3000/products'
names: ['iPhone 15 Phone', 'Android Phone X', 'Phone Case Leather', 'Noise Cancelling Headphones', 'Cotton T-Shirt', 'Denim Jacket', 'Running Shoes', 'JavaScript: The Good Parts', 'Node.js Design Patterns', 'Desk Lamp']
meta : {"page": 1, "limit": 10, "total": 12, "totalPages": 2, "hasNext": true, "hasPrev": false}

$ curl 'localhost:3000/products?page=2&limit=5'
names: ['Denim Jacket', 'Running Shoes', 'JavaScript: The Good Parts', 'Node.js Design Patterns', 'Desk Lamp']
meta : {"page": 2, "limit": 5, "total": 12, "totalPages": 3, "hasNext": true, "hasPrev": true}

$ curl 'localhost:3000/products?page=99'
names: []
meta : {"page": 99, "limit": 10, "total": 12, "totalPages": 2, "hasNext": false, "hasPrev": true}
```

(The `names:` line is a summary of the `data` array for readability; the real response is `{ "status": "success", "data": [ …product objects… ], "meta": { … } }`.)

- **Defaults:** with no parameters, `page = 1` and `limit = 10` (Zod's `.default`).
- **`total`** is the number of items that match the filters **before** paging; **`hasNext`/`hasPrev`** save the client from doing arithmetic.
- **A page past the end** isn't an error — it returns an empty `data` array with correct `meta`. (Some APIs prefer `404`; pick one and document it.)

### 5.3 Validate the paging parameters

The paging inputs are **user input** like any other, and a careless implementation is easy to abuse (`?limit=100000000`, `?page=-5`, `?page=abc`). The schema from Section 3 handles it; invalid values never reach the repository:

```text
$ curl 'localhost:3000/products?limit=500'
{"status":"error","message":"Validation failed","errors":[{"field":"limit","message":"Too big: expected number to be <=100"}]}  [HTTP 400]

$ curl 'localhost:3000/products?page=abc&category=toys'
{"status":"error","message":"Validation failed","errors":[{"field":"page","message":"Invalid input: expected number, received NaN"},{"field":"category","message":"Invalid option: expected one of \"electronics\"|\"clothing\"|\"books\"|\"home\""}]}  [HTTP 400]
```

The `max(100)` ceiling on `limit` is a **safety limit** you choose; it protects the server from a client asking for a million rows.

### 5.4 Filtering and sorting: combining query parameters

**Filtering** narrows by exact values (`category=electronics`); **sorting** orders the result (`sort=price&order=desc`). They combine freely with search and paging — each parameter is **optional**, and only the ones present change the query. This is what your CyberWolves video describes as combining query parameters:

```text
$ curl 'localhost:3000/products?search=PHONE&category=electronics&sort=price&order=desc&limit=3'
names: ['iPhone 15 Phone', 'Android Phone X', 'Noise Cancelling Headphones']
meta : {"page": 1, "limit": 3, "total": 4, "totalPages": 2, "hasNext": true, "hasPrev": false}

$ curl 'localhost:3000/products?category=books&sort=name'
names: ['JavaScript: The Good Parts', 'Node.js Design Patterns']
meta : {"page": 1, "limit": 10, "total": 2, "totalPages": 1, "hasNext": false, "hasPrev": false}
```

In the first request: `search` and `category` filter (4 products match), `sort`/`order` order them by price, highest first, and `limit=3` takes the first page of three. Notice **`total` is 4** (matches before paging), **`totalPages` is 2**, and `hasNext` is `true`.

Design rules the schema enforces:

- **`sort` is an enum** (`name`, `price`, `createdAt`): the client can't sort by an arbitrary field (or inject something into a database query).
- **`category` is an enum** too — an unknown category is a `400`, not "no results".
- Every parameter has a **default** or is **optional**, so `GET /products` alone still works.

### 5.5 Search

The challenge's `search=phone` means "products whose **name contains** *phone*, ignoring case". The in-memory repository does `p.name.toLowerCase().includes(search.toLowerCase())`; MongoDB uses a case-insensitive **regular expression**; Prisma uses `contains` with `mode: 'insensitive'`.

```text
$ curl 'localhost:3000/products?search=phone'
names: ['iPhone 15 Phone', 'Android Phone X', 'Phone Case Leather', 'Noise Cancelling Headphones', 'Phone Stand']
meta : {"page": 1, "limit": 10, "total": 5, "totalPages": 1, "hasNext": false, "hasPrev": false}
```

Two things to notice:

1. **It is case-insensitive** — `search=PHONE` found the same products.
2. **"Headphones" matched `phone`** — this is **substring** search: any name that contains the letters. Real search often wants *word* matching, typo tolerance and ranking; that is what **full-text search** (database text indexes, or a search engine) adds — 🔒 outside this module. Substring search is the right starting point for a small catalogue.

**Never put user input into a regular expression unescaped.** In the MongoDB repository the search text goes through `escapeRegex` first. Why it matters (both requests were run):

```text
$ curl 'localhost:3000/products?search=.'
names: ['Node.js Design Patterns']             (only the name that contains a literal dot)

$ curl 'localhost:3000/products?search=.*'
names: []                                       (nothing contains the literal characters ".*")
```

Without the escaping, `.` and `.*` are regex wildcards that would match **every** product — and a carefully crafted pattern can make the database work extremely hard (a "regex denial of service"). Escaping turns the user's text into plain characters. (Prisma's `contains` builds a parameterised query, so the same protection comes built in.)

### 5.6 Count and page in parallel

A paginated list needs two things: **the page of items** and **the total count** (for `totalPages`). They don't depend on each other, so run them **together** (Section 6):

```javascript
const [items, total] = await Promise.all([
  Product.find(filter).sort(...).skip((page - 1) * limit).limit(limit),
  Product.countDocuments(filter)          // the SAME filter, so the count matches the search
]);
```
Two awaits in a row would take roughly the sum of both queries; `Promise.all` takes the longer of the two.

### 5.7 Limits of offset pagination

`skip`/`limit` is simple but has known weaknesses *(general knowledge)*:

- **Deep pages are slow**: skipping 1,000,000 rows still means the database walks past them.
- **Pages can shift**: if a row is inserted or deleted between two requests, an item can appear twice or be skipped.
- **Indexes** on the fields you filter and sort by make queries faster — 🔒 outside this module.
- **Cursor-based ("keyset") pagination** — "give me the 10 items after *this* one" — avoids both problems and suits infinite scrolling — 🔒 outside this module.

For catalogues of ordinary size, offset pagination is the standard answer, and it is what the challenge asks for.

### 5.8 Using it from Angular

A table component reads the user's choices and calls the API with them *(illustrative; not run)*:

```typescript
getProducts(page: number, limit: number, search?: string) {
  let params = new HttpParams().set('page', page).set('limit', limit);
  if (search) params = params.set('search', search);
  return this.http.get<{ data: Product[]; meta: Meta }>('/products', { params });
}
```
`meta.totalPages` drives the page buttons; `hasNext`/`hasPrev` enable or disable them. Debounce the search box (Angular notes, Module 6) so you don't send a request per keystroke.

### Try it yourself

1. Request every page of `?limit=5` until `hasNext` is `false`. How many requests, and how many items did you see in total?
2. Combine `search`, `category`, `sort`, `order` and `limit` in one request and predict `total` before you run it.
3. Ask for `?limit=1000`, `?page=0` and `?sort=password`. Which layer rejects each, and with what message?

### Exercises

**Level 1 — Basic:** Add `minPrice` and `maxPrice` filters to the list endpoint and its schema.

**Level 2 — Practical:** Make search match the product's **name or category**, and show that `total` stays correct.

**Level 3 — Challenge:** Implement *cursor* pagination for `GET /products?after=<id>&limit=5` (ordered by id), returning `nextCursor` in `meta`, and explain what it fixes compared with `page`.

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| No upper bound on `limit` | One request can ask for the whole table | `.max(100)` in the schema |
| `skip = page * limit` | Off by one page (page 1 skips a page) | `(page − 1) * limit` |
| Counting with a *different* filter than the page query | `total` and `totalPages` are wrong | The **same** filter for both |
| Returning only an array | The client can't tell whether there's a next page | Return `meta` |
| Searching with an unescaped user string in a regex | Wildcards and slow patterns | Escape it, or use `contains` |
| Sorting by whatever field the client names | Information leaks or errors | An allow-list (`z.enum`) |
| Paginating without a stable sort order | Items repeat or vanish between pages | Always sort (add a tie-breaker like `_id`) |
| Treating page numbers as strings | `"2" - 1` works by accident, `"2" + 1` doesn't | Coerce and validate numbers |
| Doing the count and the page one after the other | Twice the waiting | `Promise.all` |

### ✅ Knowledge Check
1. What are `skip` and `limit`, and how do you get `skip` from `page` and `limit`?
2. What does the `meta` object tell the client, and what is `total` counting?
3. Why is `limit` capped, and where is the cap enforced?
4. Why did `search=phone` also return "Noise Cancelling Headphones"?
5. Why must a search term be escaped before it is used in a regular expression?
6. Why are the page query and the count query run with `Promise.all`?

---

## 6. async/await Patterns and Unhandled Rejections

*(Objective: apply async/await patterns effectively and prevent unhandled promise rejections. Your file lists no resource for this objective, so this section is my own, built from small programs that were run.)*

### 6.1 Recap: what `async` and `await` really do

An **`async` function always returns a Promise**. `await promise` pauses *that function* (not the whole server — Backend Module 1) until the Promise settles, then continues with the value, or **throws** if it rejected. Two consequences drive everything below:

- A **rejected** Promise is an error; if nothing handles it, it becomes an **unhandled rejection** (Section 6.5).
- `await` makes code *look* sequential, so it is easy to write code that is **needlessly slow** (6.2) or that **isn't waiting at all** (6.3).

### 6.2 Sequential vs. parallel

Three independent 200 ms tasks, awaited one after another and then together:

```javascript
await time('three awaits in a row', async () => [await sleep(200, 'a'), await sleep(200, 'b'), await sleep(200, 'c')]);
await time('Promise.all([...])',    () => Promise.all([sleep(200, 'a'), sleep(200, 'b'), sleep(200, 'c')]));
```
```text
three awaits in a row                601 ms -> ["a","b","c"]
Promise.all([...])                   201 ms -> ["a","b","c"]
```

**Three awaits in a row cost the sum (600 ms); `Promise.all` costs the longest (200 ms).** The rule:

- If step 2 **needs the result** of step 1 → `await` them in sequence.
- If the steps are **independent** → start them together with `Promise.all`. The repository's `Promise.all([find, countDocuments])` (Section 5.6) is exactly this.

### 6.3 Loops and arrays: `forEach` does not wait

```javascript
const viaForEach = [];
items.forEach(async (n) => { await sleep(50); viaForEach.push(n); });
console.log(viaForEach);                  // []   <- forEach started three async callbacks and moved on immediately
```
```text
right after forEach        -> [] (still empty!)
100 ms later               -> [1,2,3]
await Promise.all(map(...))-> [2,4,6]
for...of with await        -> [1,2,3]
```

`Array.prototype.forEach` **ignores the Promises its callback returns** — it doesn't wait. The three correct patterns:

| You want | Use |
|---|---|
| All items **at the same time**, then the results | `await Promise.all(items.map(async (x) => …))` |
| One item **after another**, each depending on the last (or order matters) | `for (const x of items) { await … }` |
| To not overwhelm something (10,000 items at once) | Process in batches — 🔒 concurrency control is outside this module |

### 6.4 `Promise.all` vs. `Promise.allSettled`, and `finally`

`Promise.all` **fails fast**: the first rejection rejects the whole thing and you lose the other results. `Promise.allSettled` waits for everything and tells you what happened to each:

```text
Promise.all rejected with  -> task B failed (the other results are lost)
Promise.allSettled         -> [{"status":"fulfilled","value":"ok"},{"status":"rejected","reason":"task B failed"},{"status":"fulfilled","value":"ok too"}]
```

Use `Promise.all` when **everything must succeed** (a page *and* its count); use `allSettled` when you want **partial success** (send five notifications and report which failed).

`try`/`catch`/`finally` works with `await` exactly as with synchronous code, and `finally` always runs — the place for cleanup (closing a file, releasing a lock):

```javascript
try { await fail(10, 'database down'); }
catch (e) { console.log('caught ->', e.message); }
finally { console.log('finally always runs -> cleanup here'); }
```

### 6.5 Unhandled promise rejections

A Promise that **rejects with nobody attached to handle it** (no `await` in a `try/catch`, no `.catch`) is an **unhandled rejection**. In current Node.js this is **fatal by default**. This was run:

```javascript
console.log('start');
Promise.reject(new Error('nobody handled this rejection'));   // no await, no .catch
setTimeout(() => console.log('timer fired: the process is still alive'), 200);
```
```text
start
/…/unhandled.js:2
Promise.reject(new Error('nobody handled this rejection'));   // no await, no .catch
               ^

Error: nobody handled this rejection
    at Object.<anonymous> (/…/unhandled.js:2:16)
exit code: 1
```

The process **printed the error and exited with code 1** — the "timer fired" line never appeared. On a server, that is an outage.

**A last-resort handler.** Node lets you register a listener for the event:

```javascript
process.on('unhandledRejection', (reason) => {
  console.log('safety net logged:', reason.message);
});
```
```text
start
safety net logged: nobody handled this rejection
timer fired: the process is still alive
exit code: 0
```

With a listener, the process **survives**. That is *not* a licence to ignore the bug: a rejection nobody handled means **something failed that your code didn't plan for**, and the program may now be in an unknown state. The recommended policy, used in this module's `server.js`, is **log it, then exit** and let a process manager (or the platform) start a clean copy:

```javascript
// Last line of defence: log anything that escaped, then exit so a process manager can restart us cleanly.
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
  process.exit(1);
});
```
(A similar `process.on('uncaughtException', …)` exists for synchronous exceptions nobody caught; the same "log and exit" policy applies.)

### 6.6 How they happen in an Express app

Express 5 handles the rejection of the **handler's own** Promise (Section 2). It cannot help with a Promise your handler **starts and doesn't wait for** — "fire and forget" — such as sending a welcome email. Both versions below were run:

```javascript
const sendWelcomeEmail = async () => { await new Promise((r) => setTimeout(r, 50)); throw new Error('SMTP server unreachable'); };

app.get('/register-bad', async (req, res) => {
  sendWelcomeEmail();                       // BUG: not awaited, no .catch  -> an unhandled rejection later
  res.json({ ok: true });
});

app.get('/register-good', async (req, res) => {
  sendWelcomeEmail().catch((err) => console.error('email failed (handled):', err.message));   // fire-and-forget, SAFELY
  res.json({ ok: true });
});
```
```text
=== fire-and-forget WITHOUT a catch ===
GET /register-bad    -> {"ok":true} [HTTP 200]
GET /ping            ->  [HTTP 000](connection failed)
server still running: NO (the process exited)
--- server log:
Error: SMTP server unreachable

=== fire-and-forget WITH a catch ===
GET /register-good   -> {"ok":true} [HTTP 200]
GET /ping            -> pong [HTTP 200]
server still running: yes
--- server log:
email failed (handled): SMTP server unreachable
```

The "bad" request got a perfect `200` — and **50 milliseconds later the whole server was dead**, so the *next* request failed. The email's failure was nobody's problem *until it killed the process*. Two correct choices:

- **`await` it** if the response should depend on it (the global error handler then covers a failure);
- or **fire-and-forget with a `.catch`** if the response shouldn't wait (log the failure; never let it escape).

### 6.7 A checklist

- [ ] Every Promise is **awaited, returned, or has a `.catch`**.
- [ ] No `async` callback inside `forEach` — use `for...of` or `Promise.all(map(...))`.
- [ ] **Independent** work runs in parallel (`Promise.all`); **dependent** work in sequence.
- [ ] `Promise.allSettled` when partial success is acceptable.
- [ ] Fire-and-forget work always has a `.catch`.
- [ ] Cleanup goes in `finally`.
- [ ] `process.on('unhandledRejection')` is registered as a **log-and-exit** safety net — not as a place to hide bugs.

### Try it yourself

1. Time three `await`s in a row against `Promise.all` for any three independent calls in your project.
2. Reproduce the `forEach` surprise: what does the array contain immediately afterwards?
3. Write a route with an un-awaited failing promise, watch the server die, then fix it two ways (`await`, and `.catch`).

### Exercises

**Level 1 — Basic:** Rewrite `items.forEach(async …)` as `for...of`, then as `Promise.all(items.map(…))`. When is each right?

**Level 2 — Practical:** Send a notification to five recipients using `Promise.allSettled` and return `{ sent: n, failed: m }`.

**Level 3 — Challenge:** Add a `GET /products/:id/full` endpoint that needs the product, its reviews and its related products. Decide which of the three lookups can run in parallel, and which (if any) must wait for another.

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| `items.forEach(async …)` and then using the results | `forEach` doesn't wait | `for...of` or `Promise.all(map)` |
| `await a(); await b();` for independent work | Slower than necessary | `Promise.all([a(), b()])` |
| `Promise.all` when one failure shouldn't hide the rest | The other results are lost | `Promise.allSettled` |
| Calling an async function without `await` or `.catch` | Unhandled rejection → crash | Await it or attach a `.catch` |
| `return somePromise` inside `try { } catch { }` without `await` | The `catch` never sees its rejection | `return await somePromise` inside a `try` |
| Swallowing errors: `.catch(() => {})` everywhere | Failures vanish silently | Log them (or rethrow) |
| `process.on('unhandledRejection', () => {})` that does nothing | Hides real bugs and leaves the app in an unknown state | Log and exit |
| `async` function that never awaits anything | Pointless overhead, misleading | Make it a normal function (unless it must return a Promise) |

### ✅ Knowledge Check
1. What does an `async` function return, and what does `await` do inside it?
2. Why did three awaits in a row take 601 ms but `Promise.all` only 201 ms? When is sequential the right choice?
3. Why does `forEach(async …)` not wait, and what are two correct alternatives?
4. What happens by default when a Promise rejects and nothing handles it?
5. Why did the "bad" fire-and-forget route answer `200` and still take the server down?
6. What is the recommended policy in an `unhandledRejection` handler, and why?

---

## 7. Hands-On Challenge: The E-Commerce API Refactor

*(Module Resource Book, section 5. **Scenario:** you have a basic `app.js` file with all logic mixed together. You need to professionalize it. Refactor a simple "Product API" into a professional, production-ready system.)*

### 7.1 The tasks, mapped to this document

| Task from the module | Where it is built |
|---|---|
| **Restructure:** move logic into `controllers/productController.js` and `services/productService.js` | Section 1 (and the repository layer beneath them) |
| **Validation:** Zod — a new Product has a `name` (string), `price` (number, positive) and `category` (enum) | Section 3 — `schemas/productSchemas.js`, `middleware/validate.js` |
| **File Upload:** `POST /products` accepts an image file for the thumbnail, using Multer | Section 4 — `middleware/upload.js` |
| **Search & Paginate:** `GET /products` accepts `?page=1&limit=10&search=phone` | Section 5 |
| **Global Error Handler:** a middleware that catches any crash or validation error and returns `{ status: "error", message: "..." }` | Section 2 — `middleware/errorHandler.js` |

### 7.2 Build it, step by step

**Step 0 — start from the "before"** (Section 1.1): one `app.js` with the array, three routes and no validation. Run it and reproduce its failures so you know what you're fixing.

**Step 1 — set up the project:**

```bash
mkdir product-api && cd product-api
npm init -y
npm install express zod multer            # add mongoose too if you want the MongoDB repository
mkdir routes controllers services repositories schemas middleware errors uploads
```
Add `uploads/` and `.env` to `.gitignore` (uploaded files and secrets don't belong in Git).

**Step 2 — restructure into layers** (Section 1.4). Create, in this order, working from the bottom up so each layer has something to call: the **repository** (move the array and the `find`/`push`/`splice` calls here), the **service**, the **controller**, then the **routes**.

**Step 3 — the standard errors** (Section 2): `errors/AppError.js` and `middleware/errorHandler.js` (`notFound` + `errorHandler`).

**Step 4 — validation** (Section 3): `schemas/productSchemas.js` and `middleware/validate.js`; add `validate(...)` to each route.

**Step 5 — uploads** (Section 4): `middleware/upload.js`; add `uploadThumbnail` and `checkImageSignature` to `POST /products` **before** `validate`; serve `/uploads` statically.

**Step 6 — search and pagination** (Section 5): the `listQuerySchema`, the repository's `findAll`, and the service's `meta`.

**Step 7 — wire it together.** `app.js` builds the app (note the order: parsers → static files → routes → 404 → error handler):

```javascript
const express = require('express');
const productRoutes = require('./routes/productRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { UPLOAD_DIR } = require('./middleware/upload');

const app = express();

app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));     // uploaded thumbnails are served from here
app.use('/products', productRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
```

and `server.js` starts it (connecting to MongoDB only when that repository is selected) and registers the async safety net from Section 6:

```javascript
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 3000;

async function start() {
  if (process.env.DB === 'mongo') {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB database:', mongoose.connection.name);
  }
  app.listen(PORT, (error) => {
    if (error) { console.error('Could not start the server:', error.message); process.exit(1); }
    console.log(`Product API listening on http://localhost:${PORT} (data layer: ${process.env.DB === 'mongo' ? 'MongoDB' : 'in-memory'})`);
  });
}

// Last line of defence: log anything that escaped, then exit so a process manager can restart us cleanly.
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
  process.exit(1);
});

start().catch((error) => { console.error('Startup failed:', error.message); process.exit(1); });
```

Run it: `node server.js` (in-memory) or `DB=mongo MONGODB_URI=mongodb://127.0.0.1:27017/shop node server.js`.

### 7.3 Prove it works: a checklist

Every row below was run against this exact code. If your result differs, compare against the section named.

| Request | Expected | See |
|---|---|---|
| `GET /products` | `200`, 10 products, `meta.total = 12`, `totalPages = 2` | 5.2 |
| `GET /products?page=2&limit=5` | `200`, five products, `hasPrev: true` | 5.2 |
| `GET /products?search=phone` | `200`, 5 products (including "Headphones") | 5.5 |
| `GET /products?limit=500` | `400`, `Too big: expected number to be <=100` | 5.3 |
| `GET /products/999` | `404`, `{ "status": "error", "message": "Product 999 not found" }` | 2.4.1 |
| `POST /products` JSON, valid | `201`, trimmed name, **`isAdmin` dropped** | 3.3 |
| `POST /products` JSON, invalid | `400` with an `errors` array (field + message) | 3.2 |
| `POST /products` with no body | `400` `expected object, received undefined` (the "before" app crashed here) | 2.4.1 |
| `POST /products` malformed JSON | `400` | 2.4.1 |
| `POST /products` multipart with a PNG | `201`, `thumbnail: "/uploads/<uuid>.png"`, file on disk | 4.5 |
| …with a text file labelled `image/png` | `400` `not a valid image` | 4.5 |
| …with a 3 MB file | `413` `File too large` | 4.5 |
| …with a valid image but invalid fields | `400`, and **no file left in `uploads/`** | 4.5 |
| `DELETE /products/:id` | `204`, and the image file is deleted | 4.5 |
| `GET /nope` | `404` in the standard error shape | 2.4.1 |
| A handler that throws a bug | `500`, `Internal Server Error`, details only in the log | 2.4.1 |

And the **same results with `DB=mongo`** (the repository swap, Section 1.5).

### 7.4 Testing with Postman

The Postman steps from Backend Module 2 apply, with two additions *(Postman is a graphical app; these are the standard steps, not run)*: for the upload request choose **Body → form-data** (`thumbnail` as a **File** key; don't set `Content-Type` yourself), and for the list request use the **Params** table (`page`, `limit`, `search`). Save the requests in a collection, with at least one `400`, one `404` and one `413` case.

### Exercises

**Level 1 — Basic:** Complete the refactor so all five checklist areas work; run the checklist.

**Level 2 — Practical:** Add `PATCH /products/:id` for partial updates, using `createProductSchema.partial()` for validation (and a service rule: you can't set a price of zero).

**Level 3 — Challenge:** Run the API against **both** repositories and write down the **only** files that differ between the two runs.

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| Registering `express.json()` after the router | `req.body` is `undefined` for JSON requests | Parsers before routes |
| Putting `errorHandler` before `notFound` or the routes | It never sees their errors | Routes → `notFound` → `errorHandler` |
| Forgetting `express.static` for `/uploads` | Stored URLs return `404` | Serve the upload folder |
| Putting `validate` before the upload middleware | The multipart fields aren't parsed yet | `uploadThumbnail`, then `validate` |
| Importing the database model in the service | The service is tied to one database | Only the repository knows the model |
| Committing `uploads/` | Git fills with user files | `.gitignore` it |

### ✅ Knowledge Check
1. Which layer owns each of the challenge's five tasks?
2. In what order are `app.js`'s middleware registered, and why?
3. Which request in the checklist crashed the "before" app, and what does the new API do instead?
4. What would you have to change to run the API on a database you haven't used yet?

---

## 8. Final Module Project: Production-Ready Product API

The challenge in Section 7 is the module's lab. This project states the same work as **requirements you can be reviewed against** — your Resource Book frames it as turning *"a simple Product API into a professional, production-ready system"*.

### 8.1 Requirements

**Architecture:**

1. **Four layers** — routes, controllers, services, repositories — each with one job. Controllers contain no business rules; the service never imports Express or touches `req`/`res`; only the repository knows how data is stored.
2. **Two repositories** behind one interface (in-memory and a database of your choice), selected by an environment variable, with **no change** above the repository when you switch.

**Validation and errors:**

3. **Zod** validates the body (`name` string, `price` positive number, `category` enum), the query string and the URL parameters. Unknown keys are dropped; numbers from forms/queries are coerced.
4. A **global error handler** returns `{ status: "error", message }` (plus `errors` for field details) for **every** failure — validation, parsing, not found, upload, unknown route — and a **generic** `500` for bugs, with details only in the log.

**Features:**

5. `POST /products` accepts **JSON** or **multipart** with an optional image `thumbnail` (Multer): size limit, allow-listed types, generated file names, byte-signature check, and **no orphan files** after a failure.
6. `GET /products` supports **`page`, `limit` (max 100), `search`**, plus `category`, `sort` (allow-listed) and `order`, and returns `meta` (`page`, `limit`, `total`, `totalPages`, `hasNext`, `hasPrev`).
7. `GET /products/:id`, `DELETE /products/:id` (also removes the image).

**Async hygiene:**

8. No promise is left un-awaited without a `.catch`; independent work uses `Promise.all`; `server.js` registers an `unhandledRejection` **log-and-exit** handler.

**Configuration and evidence:**

9. `PORT`, the repository choice and the database URL come from environment variables; `.env` and `uploads/` are git-ignored.
10. A saved **Postman collection** covering every endpoint and at least one `400`, `404` and `413` case.
11. A `README.md`: how to run it with each repository, the endpoint table, and one **architecture decision** you made and why.

### 8.2 Acceptance criteria

| Check | Expected |
|---|---|
| The checklist in Section 7.3 | Every row matches, with **both** repositories |
| A new request type you invent (for example `GET /products?sort=password`) | `400` in the standard shape — never a crash, never HTML |
| An invalid-field upload | Rejected, and `ls uploads/` shows nothing new |
| A forced bug (temporarily throw inside the service) | Client sees only `Internal Server Error`; the log shows the real error |
| An un-awaited failing promise | Does **not** crash the server (it is awaited or has a `.catch`) |
| Search for `.*` against the database repository | Treated as plain text (no regex wildcard behaviour) |
| `git status` after running everything | No `.env`, no `uploads/*` |

### 8.3 Hints

- Build **bottom-up**: repository → service → controller → routes; test each layer with `curl` before adding the next.
- Keep every layer's interface *small* and *the same for both repositories* (`findAll`, `findById`, `create`, `remove`).
- Validate **at the boundary** and then trust the data inside; don't re-validate in the service.
- If an upload route misbehaves, check the **middleware order** and the **field name** first.
- If something returns `{}` or a Query/Promise object, look for a missing `await`.

### 8.4 Optional stretch challenges

- **Protect it with Module 4's auth:** `authenticateToken` on `POST`/`DELETE`, and `authorizeRole('admin')` for deletes.
- **`PATCH /products/:id`** with a partial schema; reject an empty update.
- **Price range filters** (`minPrice`, `maxPrice`) with a cross-field refinement.
- **Multiple images** per product (`upload.array`).
- **Cursor pagination** (`?after=<id>`) alongside page-based paging.
- **Automated tests** with Node's built-in test runner (Backend Module 2, Section 6.6): the service with a fake repository, and the routes with a real one.
- **Containerize and deploy** it (Backend Module 4, Sections 11–12), with the uploads folder on a volume — and discuss why several copies of the server would need shared file storage.
- **Document it** with OpenAPI (Backend Module 2, Section 7), including the multipart upload.

---

## 9. Quick Reference Sheet

### Layers
```text
routes       METHOD /path -> middleware -> controller            (the menu)
controller   read req.validated / req.file -> call ONE service fn -> shape the response   (the waiter)
service      business rules, throws AppError subclasses; NO req/res, NO database syntax    (the chef)
repository   queries only; returns data or null; same interface for every storage          (the pantry)
rule: each layer calls only the one below it
```

### Standard responses and errors
```text
success  { "status": "success", "data": …, "meta": { page, limit, total, totalPages, hasNext, hasPrev } }
error    { "status": "error",   "message": "…", "errors": [ { "field": "price", "message": "…" } ] }
400 validation / bad JSON / bad upload     404 not found / unknown route     413 file too large     500 bug (generic message!)
class NotFoundError extends AppError { … }   // throw anywhere; app.use(notFound); app.use(errorHandler)  <- 4 params, LAST
```

### Zod 4
```javascript
const schema = z.object({
  name: z.string().trim().min(1),
  price: z.coerce.number().positive(),          // query / multipart values are STRINGS
  category: z.enum(['electronics', 'books']),
  page: z.coerce.number().int().min(1).default(1)
});
const r = schema.safeParse(input);               // { success, data } | { success:false, error } ; parse() throws
r.error.issues  // [{ path, message }]  (NOT error.errors)      unknown keys are stripped (z.strictObject rejects)
.refine(fn, { message, path })                   // cross-field rule; runs only after the basic checks pass
req.validated.query                              // Express 5: do NOT assign to req.query (silently ignored)
type T = z.infer<typeof schema>                  // TypeScript
```

### Multer
```javascript
multer({ storage: multer.diskStorage({ destination, filename }), limits: { fileSize: 2*1024*1024, files: 1 }, fileFilter })
upload.single('thumbnail')   // req.file + req.body (text fields = strings)       .array('photos', 3)   .fields([...])
router.post('/', upload, checkSignature, validate(schema, 'body'), controller.create);     // Multer FIRST
generate the file name · limit the size · allow-list types · check the first bytes · delete the file if a later step fails
MulterError: LIMIT_FILE_SIZE (-> 413) · LIMIT_UNEXPECTED_FILE (wrong field name)
```

### Pagination, filtering, search
```text
skip = (page - 1) * limit        totalPages = ceil(total / limit)       cap the limit (max 100)
[items, total] = await Promise.all([ find(filter).sort().skip().limit(), count(filter) ])    // SAME filter
search: case-insensitive "contains"; ESCAPE user input before building a regex       sort/category: allow-list with z.enum
```

### async/await
```text
independent work -> Promise.all        dependent -> await in sequence        partial success -> Promise.allSettled
forEach(async …) does NOT wait -> use for...of or Promise.all(map)            cleanup -> finally
unhandled rejection = FATAL by default (exit code 1)  ->  always await / return / .catch (fire-and-forget needs a .catch)
process.on('unhandledRejection', log then process.exit(1))
```

### 🔒 Coming Later — Outside This Module
Cloud/object storage for files · image resizing and virus scanning · full-text search engines · cursor pagination in depth · indexes and query tuning · caching · background job queues · automated test suites · API versioning · rate limiting per user.

---

## 10. Source & Resource Mapping

### Learning-objective coverage

| Learning objective | Where it is covered |
|---|---|
| Implement Layered Architecture (Controller-Service-Repository) | Section 1 |
| Handle global errors and standardize API responses | Section 2 |
| Validate complex request bodies using Zod | Section 3 |
| Handle file uploads using Multer | Section 4 |
| Implement pagination, filtering and search | Section 5 |
| Apply async/await patterns effectively and prevent unhandled promise rejections | Section 6 |
| Hands-on challenge: the E-Commerce API Refactor | Sections 7 and 8 |

### Resources from your module file

| Module topic | Resource | Where it appears |
|---|---|---|
| Layered architecture (reading) | [Layered Architecture in Node.js — Medium](https://medium.com/@ankitpartap24/layered-architecture-in-node-js-5ef94e846ec4) | Section 1 — *I did not open the article; the key concept is quoted from your file* |
| Global error handling (video) | [Procademy](https://www.youtube.com/watch?v=WXa1yzLR3hw) | Section 2 |
| Validation with Zod (video) | [Web Dev Simplified](https://www.youtube.com/watch?v=L6BE-U3oy80) | Section 3 |
| File uploads with Multer (video) | [The Full Stack Junkie](https://www.youtube.com/watch?v=EVOFt8Its6I) | Section 4 |
| Pagination — `limit` and `skip` (video) | [Web Dev Simplified](https://www.youtube.com/watch?v=ZX3qt0UWifc) | Section 5 |
| Search — combining query parameters (video) | [CyberWolves](https://www.youtube.com/watch?v=0T4GsMYnVN4) | Section 5 |
| Hands-on challenge: The E-Commerce API Refactor | — | Sections 7 and 8 |

*I have not watched the videos or opened the article; each description is quoted from your module file. Your file lists **no resource for the async/await objective**; Section 6 is my own.*

### Other sources

| Used for | Source |
|---|---|
| Layered Product API, Zod 4.6.7, Multer 2.5.0, Express 5.3.0, Mongoose 9.11, error handling, uploads, pagination, search, async patterns, and every output shown | Running the code described, against the in-memory repository and a MongoDB-compatible server |
| Package versions | The npm registry, checked in November 2026 |
| The Prisma repository (Section 1.5) | Adapted from the Module 3 Prisma setup — **not run** |

---

## 11. Practice Questions

Your module file lists no quiz for this module, so these questions are my own, for practice. Try them first; answers follow.

**Questions**

1. What is "separation of concerns", and what does each of the four layers do?
2. State the dependency rule. Which layer must never see `req` or `res`?
3. Why does a service throw `NotFoundError` instead of sending a `404` response?
4. What should a repository return when nothing is found, and why not throw?
5. What are the two shapes of the standard JSON response in this module?
6. How does Express recognise an error-handling middleware, and where is it registered?
7. What does the client receive for an unexpected bug, and where do the details go?
8. What is the difference between Zod's `parse` and `safeParse`?
9. Why must numbers from multipart forms and query strings be coerced, and what does an empty string become?
10. What does `z.object` do with unknown keys, and how do you reject them instead?
11. Why does the `validate` middleware store its result in `req.validated` rather than overwriting `req.query` on Express 5?
12. Why didn't a `.refine()` rule report an error while other fields were invalid?
13. Why are the text fields Multer puts in `req.body` strings?
14. Why must Multer run before `validate`, and why check a file's first bytes instead of trusting `mimetype`?
15. Which Multer error code does an oversized file produce, and which HTTP status does the handler send?
16. What is `skip` for `page=3`, `limit=5`? How many `totalPages` for 12 items at `limit=5`?
17. Why is `limit` capped, and why must the page query and the count query use the same filter?
18. Why did `search=phone` return "Noise Cancelling Headphones", and why must search text be escaped before it is used in a regular expression?
19. Three independent 200 ms awaits in a row vs. `Promise.all` — how long does each take, and when is sequential correct?
20. Why doesn't `forEach(async …)` wait? What happens by default when a Promise rejects with nothing handling it, and what policy do you apply in an `unhandledRejection` handler?

**Answer key**

*Prerequisite self-check:*

1. **`store.js`** (the data-access module). 2. **Four**: `(err, req, res, next)`. 3. It forwards the error to the **error-handling middleware**. 4. **`undefined`**.

*Practice questions:*

1. Each piece of code has **one job**: **routes** map URLs to middleware and controllers; **controllers** handle HTTP in/out; **services** hold business rules; **repositories** do data access.
2. Each layer calls only the layer **directly below** it, never upward. The **service** (and repository) must never see `req`/`res`.
3. So the service stays independent of HTTP; it describes the problem and the **global handler** decides the response (consistent shape, one place).
4. **`null`** (or an empty result): "missing" is a **business meaning**, decided by the service, not a data-access failure.
5. **Success:** `{ status: "success", data, meta? }`. **Error:** `{ status: "error", message, errors? }`.
6. It has **four parameters** `(err, req, res, next)`; it is registered **last**, after the routes and the 404 handler.
7. A generic **`500 Internal Server Error`**; the real error is **logged server-side**.
8. **`safeParse`** returns `{ success, data | error }` and never throws; **`parse`** returns the data or **throws** a `ZodError`.
9. They arrive as **strings**; use `z.coerce.number()`. An empty string coerces to **`0`**, so pair coercion with a range check like `.positive()`.
10. It **strips** unknown keys by default; **`z.strictObject`** rejects them.
11. In Express 5, assigning to `req.query` is **silently ignored**, so the cleaned (coerced) data would be lost.
12. Zod runs `.refine()` rules only **after** the basic field checks pass.
13. Multipart form data is **text** until you parse it; the file is separate, and Zod coerces the text fields.
14. Multer parses the multipart body so `req.body` exists; the declared `mimetype` is **chosen by the client**, so a text file can claim to be a PNG — the real image's **signature bytes** tell the truth.
15. **`LIMIT_FILE_SIZE`**, mapped to **`413`**.
16. `skip = (3 − 1) × 5 = 10`; `totalPages = ceil(12 ÷ 5) = 3`.
17. To stop a client requesting a huge number of rows; with a **different** filter the `total`/`totalPages` wouldn't match the items.
18. Search is **substring**-based ("Headphones" contains "phone"). Unescaped, characters like `.` and `*` act as **regex wildcards** (matching everything, or causing very slow patterns).
19. Sequential: about **600 ms**; `Promise.all`: about **200 ms**. Use sequential when each step **needs the previous result**.
20. `forEach` ignores the Promises its callback returns, so it doesn't wait. An unhandled rejection is **fatal by default** (the process exits with code 1). Policy: **log it, then exit** so a process manager restarts a clean copy.

---

## 12. Glossary

| Term | Meaning |
|---|---|
| **Separation of concerns** | Giving each piece of code one job |
| **Layered architecture** | Splitting an app into routes, controllers, services and repositories |
| **Controller** | The layer that reads the request, calls a service and shapes the response |
| **Service** | The layer holding business rules; independent of HTTP and the database |
| **Repository** | The layer that reads and writes data; the only one that knows how it is stored |
| **Business rule** | A requirement of the domain (for example "deleting a product deletes its image") |
| **Cross-cutting concern** | Something many routes need (validation, auth, logging), implemented as middleware |
| **Global error handler** | The single four-parameter middleware, registered last, that turns every error into a response |
| **Operational error** | An expected problem (bad input, not found) reported to the client |
| **Programmer error (bug)** | An unexpected failure: logged, shown to the client only as a generic `500` |
| **Schema** | A declaration of the shape and rules data must follow |
| **Zod** | A JavaScript/TypeScript library for validating data against schemas |
| **Coercion** | Converting a value to the expected type (`"299"` → `299`) |
| **`safeParse` / `parse`** | Validate without throwing / validate and throw on failure |
| **Refinement (`.refine`)** | A custom (often cross-field) validation rule |
| **`multipart/form-data`** | The encoding browsers and tools use to send files and fields together |
| **Multer** | Express middleware that parses `multipart/form-data` and saves uploaded files |
| **Magic bytes / file signature** | The first bytes of a file, which identify its real type |
| **Pagination** | Returning data in pages instead of all at once |
| **`skip` / `limit`** | How many rows to jump over / how many to return |
| **`meta`** | Paging information in a response (`page`, `total`, `totalPages`, `hasNext`…) |
| **Offset vs. cursor pagination** | Paging by position (`skip`) vs. by "after this item" |
| **Regex escaping** | Turning special characters in user text into literal characters |
| **`Promise.all`** | Runs promises in parallel; rejects on the first failure |
| **`Promise.allSettled`** | Waits for all promises and reports each outcome |
| **Unhandled rejection** | A rejected Promise nothing handles; fatal by default in Node |
| **Fire-and-forget** | Starting async work without waiting for it (needs a `.catch`) |
| **Process manager** | A tool that restarts a crashed process |
