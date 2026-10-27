# Module 3: Data Persistence & Databases
### Backend Development with JavaScript

> **Scope note:** This document covers *only* Module 3: what databases are and how SQL (relational) and NoSQL (document) databases differ; connecting an Express API to a database; modelling data with an ORM/ODM — **Prisma** with PostgreSQL, or **Mongoose** with MongoDB; implementing persistent CRUD; debugging connection and query problems; and refactoring the Module 2 Task API from an in-memory array to a real database. Anything beyond — authentication and password storage, transactions in depth, indexing and query tuning, schema-migration strategy in teams, backups, hosting and deployment, testing against databases, caching, other database types — is flagged **🔒 Coming Later — Outside This Module**. *I have only seen the first three module files, so "later" means "not taught here."*
>
> **Things about the module file worth knowing before you start**
> 1. It has a title but **no module code, no quiz and no discussion prompt**, so none is shown or invented. Section 11 has practice questions of my own, labelled as such.
> 2. The **Resource Book is almost entirely about MongoDB and Mongoose** (plus a SQL-vs-NoSQL comparison), while the **learning objectives, lesson 2 and the lab** also include **PostgreSQL with Prisma** — and the lab lets you choose either. This document therefore teaches **both paths**: **Path A = PostgreSQL + Prisma**, **Path B = MongoDB + Mongoose**. Pick one for the lab; read both for the concepts. Your Resource Book lists no Prisma or PostgreSQL resource, so for Path A the official Prisma documentation (prisma.io/docs) is the reference *(my addition, not in your file)*.
> 3. In the Resource Book, the **Sam Meech-Ward video's title says MySQL**; your file notes this and explains it is there for the connection logic. The **Web Dev Simplified** video is listed twice (the core Mongoose video and again for `.populate()`) — it is the same link.
> 4. **Versions move fast here.** At the time of writing, the `latest` tag of the `prisma` package on npm pointed at an **8.0 release candidate**, while **7.10.1** was the previous stable line; Prisma 7 also changed its setup compared with many older tutorials (new generator, a `prisma.config.ts` file, a required database adapter — Section 3.2). These notes use **Prisma 7.10.1** with the matching `@prisma/client` and `@prisma/adapter-pg`, **Mongoose 9.11**, **PostgreSQL 16** and **Node 24**. If you install different versions, compare against the official docs for yours.
> 5. **Two commands I could not run** in my environment: `npx prisma init` and `npx prisma migrate dev` (the Prisma command-line tool downloads an engine that wasn't reachable there). For those, the notes give the files I wrote **by hand** (the Prisma client built from them was run against a real PostgreSQL database) and the documented migration workflow, clearly marked. Everything else — the Prisma Client code, the Mongoose code, the SQL, and the error messages shown — was run.

---

## How this document is organized

Same practical shape as the earlier notes: **What is it? → Why does it exist? → How does it work? → Syntax → Examples → When to use / not use → Try it yourself → Exercises → Common mistakes → Knowledge check.** The running example is the **Task API** from Module 2, which you will refactor in Section 6, plus the **Blog** (users and posts) from the Resource Book's hands-on challenge in Section 5.

## Table of Contents

- [Before You Start: Prerequisites](#before-you-start-prerequisites)
- [1. SQL vs. NoSQL](#1-sql-vs-nosql)
- [2. Connecting an Express API to a Database](#2-connecting-an-express-api-to-a-database)
- [3. Relational Databases & Prisma](#3-relational-databases--prisma)
- [4. NoSQL Databases & Mongoose](#4-nosql-databases--mongoose)
- [5. Hands-On Challenge: The "Blog" Database](#5-hands-on-challenge-the-blog-database)
- [6. The Lab: Refactor Your Task API to Use a Database](#6-the-lab-refactor-your-task-api-to-use-a-database)
- [7. Debugging Database Connection & Query Issues](#7-debugging-database-connection--query-issues)
- [8. Final Module Project: CRUD API with Database](#8-final-module-project-crud-api-with-database)
- [9. Quick Reference Sheet](#9-quick-reference-sheet)
- [10. Source & Resource Mapping](#10-source--resource-mapping)
- [11. Practice Questions](#11-practice-questions)
- [12. Glossary](#12-glossary)

---

## Before You Start: Prerequisites

This module builds directly on **Module 2**. You should be comfortable with:

| You should be able to… | Where it was taught |
|---|---|
| Build an Express API with routers, `express.json()`, validation, a 404 handler and an error-handling middleware | Backend Module 2, Sections 2–4 and 8 |
| Read the Task API's structure: `app.js`, `server.js`, `store.js`, `validate-task.js`, `routes/tasks.js`, `middleware/` | Backend Module 2, Section 8 |
| Use `async` / `await` and Promises, and know that Express 5 forwards errors from `async` handlers to the error handler | Backend Module 1 (Part 0) and Module 2, Section 2.6 |
| Read and set environment variables (`process.env.PORT`) | Backend Module 1, Sections 3.3 and 5.4 |
| Use `curl` or Postman to test endpoints | Backend Module 2, Section 6 |

**Why does the API need a database at all?** Think back to the Task API's one big limitation: *"Data lives only as long as the process does."* Restart the server and every task is gone. An in-memory array also can't be shared by two copies of the server, can't answer questions efficiently as it grows, and can't enforce rules like "emails must be unique" for you. A **database** is a separate program whose whole job is to store data **safely and permanently**, let many programs use it **at the same time**, and **query** it quickly.

**The "before and after" this module is built on.** In Module 2 your routes called `store.js`, which read and wrote an array. In this module you replace only the *inside* of `store.js` with database calls — the routes, validation, middleware and the HTTP contract stay almost exactly as they were. That is the point of separating data access from HTTP handling (Module 2, Section 8): swapping the storage doesn't ripple through the whole app.

**Prerequisite self-check** (answers in Section 11):

1. What is lost when you restart the Module 2 Task API, and why?
2. In `store.js`, which functions were synchronous in Module 2, and what must change when they talk to a database?
3. What does Express 5 do when an `async` route handler throws?
4. Why should a database password never be hard-coded in a source file?

---

## 1. SQL vs. NoSQL

*(Module lesson 1 — Video + Reading. Outcome: differentiate between relational and non-relational databases.)*

> 📖 **Reading for this lesson — [Difference between SQL and NoSQL — GeeksforGeeks](https://www.geeksforgeeks.org/sql/difference-between-sql-and-nosql/)**
> Your module file's key concept: *"SQL uses structured tables and rows (like Excel), while NoSQL uses flexible JSON-like documents."*

> 📺 **Video for this lesson — [IBM Technology](https://www.youtube.com/watch?v=OqjJjpjDRLc)**
> Your module file describes it as: *"Understanding the rigid, structured nature of SQL databases."* *(I haven't watched it; the description is from your file.)*

> 📺 **Video for this lesson — [Fireship — conceptual comparison](https://www.youtube.com/watch?v=bxsemcrY4gQ)**
> Your module file describes it as: *"A quick comparison to help you decide when to use which."* *(I haven't watched it; the description is from your file.)*

### 1.1 What does a database give you?

A database is more than "a file". It gives you:

- **Persistence** — data survives restarts and crashes.
- **Concurrency** — many requests (and many servers) read and write at once without corrupting each other's data.
- **Querying** — ask for exactly what you need ("all incomplete tasks, newest first") without loading everything.
- **Integrity** — the database itself can refuse bad data (a missing required value, a duplicate email, a reference to something that doesn't exist).

There are two dominant families, and this module teaches one of each.

### 1.2 Relational databases (SQL)

A **relational database** stores data in **tables** made of **rows** (one per thing) and **columns** (one per property) — the "like Excel" picture from your reading, with strict rules. You talk to it in **SQL** (Structured Query Language). The example database in this module is **PostgreSQL**.

Key ideas:

| Term | Meaning |
|---|---|
| **Table** | A collection of rows of one kind (`users`, `posts`) |
| **Row** | One record (one user) |
| **Column** | One property with a fixed **type** (`name TEXT`, `completed BOOLEAN`) |
| **Schema** | The definition of all tables and columns — decided *before* data goes in, and enforced by the database |
| **Primary key** | A column (usually `id`) that uniquely identifies each row |
| **Foreign key** | A column that points at another table's primary key (`posts.author_id → users.id`); the database refuses a post whose author doesn't exist |
| **Constraint** | A rule the database enforces: `NOT NULL`, `UNIQUE`, foreign keys |
| **Join** | A query that combines rows from related tables |

Here is the Blog's data as two related tables, then the four basic operations in SQL. (These statements were run against PostgreSQL 16; the output is what it printed.)

```sql
CREATE TABLE users (
  id    SERIAL PRIMARY KEY,
  name  TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE
);

CREATE TABLE posts (
  id        SERIAL PRIMARY KEY,
  title     TEXT NOT NULL,
  content   TEXT NOT NULL,
  author_id INTEGER NOT NULL REFERENCES users(id)
);
```

```sql
-- CREATE
INSERT INTO users (name, email) VALUES ('Amina', 'amina@example.com');
INSERT INTO posts (title, content, author_id)
VALUES ('My first post', 'Hello, blog!', 1), ('Second post', 'More words', 1);

-- READ, combining two tables with a JOIN
SELECT p.id, p.title, u.name AS author
FROM posts p JOIN users u ON u.id = p.author_id
ORDER BY p.id;
```
```text
 id |     title     | author
----+---------------+--------
  1 | My first post | Amina
  2 | Second post   | Amina
(2 rows)
```

```sql
-- UPDATE
UPDATE posts SET title = 'My first post (edited)' WHERE id = 1;

-- DELETE
DELETE FROM posts WHERE id = 2;
```

**The database defends your data.** These two statements were also run — both were **rejected**:

```sql
DELETE FROM users WHERE id = 1;     -- but posts still reference this user
```
```text
ERROR:  update or delete on table "users" violates foreign key constraint "posts_author_id_fkey" on table "posts"
DETAIL:  Key (id)=(1) is still referenced from table "posts".
```
```sql
INSERT INTO users (name, email) VALUES ('Other', 'amina@example.com');   -- email must be UNIQUE
```
```text
ERROR:  duplicate key value violates unique constraint "users_email_key"
DETAIL:  Key (email)=(amina@example.com) already exists.
```

Relational databases are also known for **ACID transactions** — a group of changes that either **all** succeed or **all** are undone (think of moving money between two accounts) *(general knowledge; transactions are 🔒 outside this module)*.

### 1.3 Document databases (NoSQL, e.g. MongoDB)

**NoSQL** is an umbrella for databases that are *not* tables-and-SQL. The one in this module is **MongoDB**, a **document database**. Instead of rows, it stores **documents** — JSON-like objects — grouped into **collections**:

| Term | Meaning | Relational equivalent |
|---|---|---|
| **Database** | A container of collections | database |
| **Collection** | A group of documents (`users`, `posts`) | table |
| **Document** | One JSON-like record, stored in a binary format called **BSON** | row |
| **Field** | A key in a document | column |
| **`_id`** | The unique id MongoDB adds to every document — by default an **`ObjectId`** (a 24-character hexadecimal value) | primary key |

A document looks just like the JSON your API already sends:

```json
{
  "_id": "6adf85baeb9937a65f874de2",
  "title": "Learn Mongoose",
  "completed": false,
  "createdAt": "2026-10-26T16:54:18.647Z"
}
```

The same four operations in the **MongoDB shell** (`mongosh`) *(standard shell syntax; run them in `mongosh`)*:

```javascript
db.posts.insertOne({ title: 'My first post', content: 'Hello, blog!' })     // create
db.posts.find({ title: 'My first post' })                                   // read
db.posts.updateOne({ title: 'My first post' }, { $set: { title: 'Edited' } }) // update
db.posts.deleteOne({ title: 'Edited' })                                     // delete
```

The big difference is **flexibility**: documents in one collection don't have to share the same fields, and a document can **nest** other data (an array of comments inside a post). You trade the database's strict guarantees for freedom to change shape quickly.

**Embedding vs. referencing** is the central design question in a document database:

```text
EMBED (one document holds everything)           REFERENCE (two collections, linked by id)
post = {                                         user = { _id: U1, name: 'Amina' }
  title: 'My first post',                        post = { title: 'My first post', author: U1 }
  author: { name: 'Amina' }                      // look up user U1 when you need the author
}
```
Embedding is fast to read (one lookup) but duplicates data (the author's name is copied into every post). Referencing keeps one copy but needs a second lookup — in Mongoose, `.populate()` (Section 4.5) does that lookup for you.

### 1.4 Side by side

| | **SQL (PostgreSQL)** | **NoSQL document (MongoDB)** |
|---|---|---|
| Data shape | Tables, rows, typed columns | Collections of JSON-like documents |
| Schema | Fixed and **enforced by the database** | Flexible; structure usually enforced by your **application** (Mongoose) |
| Relationships | **Foreign keys** and joins; the database enforces them | **Embedding** or **references** you manage yourself |
| Query language | SQL | Query objects (`{ completed: true }`) and an aggregation pipeline |
| Integrity rules | Constraints in the database (`NOT NULL`, `UNIQUE`, foreign keys) | Validation mostly in your code; unique indexes are the main database-level rule |
| Transactions | Core strength (ACID) | Supported in modern versions *(general knowledge)* |
| Changing the shape | A **migration** (alter the tables) | Often just change the code; old documents keep the old shape |
| Typical fit | Structured, related data where correctness matters (orders, accounts, inventory) | Varied or fast-changing shapes, nested data, rapid prototyping |
| Your ORM/ODM here | **Prisma** | **Mongoose** |
| Your task's `id` | A number (`1`, `2`, `3`) | An ObjectId string (`"6adf85ba…"`) |

### 1.5 Choosing between them

There is no universally "better" database; the real questions are *how related is the data*, *how strict must it be*, and *how likely is its shape to change?*

| If your data… | Lean toward |
|---|---|
| Is highly related (users ↔ orders ↔ products) and must stay consistent | SQL |
| Needs strong guarantees (money, inventory, bookings) | SQL |
| Has a stable, well-understood structure | SQL |
| Has a flexible or evolving shape, or lots of nesting | Document database |
| Is read as whole "documents" (a profile page, a blog post with its comments) | Document database |
| Is the same shape your JavaScript objects already have | Document database (less translation) |

**Myths to avoid** *(general knowledge)*: "NoSQL has no schema" — it has a schema; it simply lives in your code (that is what Mongoose adds). "SQL can't handle big data" / "NoSQL can't do relationships" — both can, with different trade-offs. The course's own framing — *use the right tool for the job* — is the right one; many real systems use both.

**Other NoSQL families** (key-value stores, graph databases, wide-column stores) exist for specialised needs and are 🔒 outside this module.

### Try it yourself

1. Write the Task data as a SQL table (`CREATE TABLE tasks …`) and as a MongoDB document. Which fields need a type decision in SQL? Which would Mongoose need you to declare?
2. Draw the Blog (users and posts) both ways: two related tables, and one `posts` collection that *embeds* the author. What gets duplicated in the embedded version?
3. For each project, choose SQL or a document database and justify it in one sentence: (a) a bank's ledger, (b) a personal notes app with tags and attachments, (c) an online shop's orders and stock.

### Exercises

**Level 1 — Basic:** Fill in the "Relational equivalent" column from memory for: collection, document, field, `_id`.

**Level 2 — Practical:** Write SQL to create a `tasks` table (`id`, `title`, `completed`, `created_at`) and the four statements to insert, read, update and delete one row.

**Level 3 — Challenge:** Your blog now needs **comments** on posts. Describe how you would model them (a) relationally and (b) in MongoDB, and name one advantage of each.

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| "NoSQL means no structure" | Real apps still need structure; it moves into code | Define a schema with Mongoose |
| Choosing a database because it's trendy | The data's shape and rules should decide | Ask how related and how strict the data is |
| Embedding data that many documents share and that changes (the author's name) | Updates must touch every copy | Reference it and populate |
| Treating the database as just a bigger array | You lose its best features (constraints, indexes, queries) | Let the database enforce integrity |
| Mixing up `_id` (MongoDB) and `id` (SQL) | Different names, types and formats | Know which database you're using |

### ✅ Knowledge Check
1. Name four things a database gives you that an in-memory array doesn't.
2. What is the difference between a primary key and a foreign key? What did the foreign key refuse in the `DELETE` example?
3. What is the MongoDB name for a table, for a row, and for a primary key?
4. What does "embedding vs. referencing" mean, and what does each trade away?
5. Give one situation where you'd choose SQL and one where you'd choose a document database.

---

## 2. Connecting an Express API to a Database

*(Learning objective: connect an Express API to a database using a driver or ORM. Related lesson: Intro Session — Data Persistence.)*

> 📺 **Video for this section — [Sam Meech-Ward](https://www.youtube.com/watch?v=Hej48pi_lOc)**
> Your module file notes: *"While the title says MySQL, the principles of connecting a Node app to a database are universal. Use this to understand the connection logic."* *(I haven't watched it; the description is from your file.)*

### 2.1 Driver, ORM, ODM: three layers of tooling

| | What it is | Examples | You write |
|---|---|---|---|
| **Driver** | The low-level library that speaks the database's network protocol | `pg` (PostgreSQL), `mongodb` (MongoDB) | SQL strings or raw query objects; you get back plain rows/documents |
| **ORM** (Object-Relational Mapper) | Maps **tables** to JavaScript objects and generates SQL for you | **Prisma** | Models and method calls (`prisma.task.findMany()`) |
| **ODM** (Object-Document Mapper) | Maps **documents** to JavaScript objects, adds schemas and validation | **Mongoose** | Schemas, models and method calls (`Task.find()`) |

The same question — *"all incomplete tasks"* — at each layer:

```javascript
// 1. Driver (pg): you write the SQL; $1 is a placeholder for the value
const { rows } = await pool.query('SELECT * FROM "Task" WHERE completed = $1 ORDER BY id', [false]);

// 2. ORM (Prisma): you describe the query with an object
const tasks = await prisma.task.findMany({ where: { completed: false }, orderBy: { id: 'asc' } });

// 3. ODM (Mongoose): the same idea for a document database
const tasks = await Task.find({ completed: false }).sort({ createdAt: 1 });
```

**What an ORM/ODM gives you:** a single place that defines your data's shape (the schema), consistent and readable queries, validation, helpers for relations, and — for Prisma — managed schema changes (migrations). **What it costs:** another abstraction to learn, and you still need to understand the database underneath (the error messages and the generated queries come from it).

> ⚠️ **SQL injection, in one paragraph.** If you build SQL by pasting user input into a string (`"... WHERE title = '" + title + "'"`), a user can type SQL into the input and run it. The fix is **parameterised queries** — the `$1` placeholder above sends the value separately from the SQL, so it can never be executed as SQL. Prisma and Mongoose build safe queries for you, which is one more reason to use them; if you ever write raw SQL with a driver, **always use placeholders**.

This module's lab uses an ORM/ODM (Prisma or Mongoose), as the learning objectives ask.

### 2.2 Connection basics

**The connection string.** Every database connection is described by one string — a URL:

```text
postgresql://app:secret@127.0.0.1:5432/tasks_db
 protocol    user pass  host      port database

mongodb://127.0.0.1:27017/taskdb                                  a MongoDB on your own machine
mongodb+srv://USER:PASSWORD@cluster0.example.mongodb.net/taskdb   the style a hosted Atlas cluster gives you
```

It carries the **credentials**, so treat it as a secret.

**Keep secrets out of your code.** Put the connection string in an **environment variable** and load it from a **`.env` file** that is **never committed to Git**:

```text
# .env                       <- add ".env" to .gitignore!
DATABASE_URL="postgresql://app:secret@127.0.0.1:5432/tasks_db"
MONGODB_URI=mongodb://127.0.0.1:27017/taskdb
```

Two ways to load it into `process.env`:

- **Node's built-in flag:** `node --env-file=.env server.js` (used by the Mongoose path in Section 6).
- **The `dotenv` package:** `import 'dotenv/config';` at the top of your entry file (used by the Prisma path).

Commit a **`.env.example`** with fake values so teammates know which variables to set.

**The connection lifecycle** — the pattern every database-backed API follows:

```text
1. Server starts  ->  connect to the database ONCE
                       (and stop with a clear error if it can't — "fail fast")
2. Start listening for HTTP requests
3. Every request  ->  REUSE that one connection (it is really a pool of connections)
4. Ctrl + C       ->  stop accepting requests, then close the database connection
```

- **Connect once, reuse everywhere.** Opening a connection per request is slow and can exhaust the database's connection limit. Prisma Client and Mongoose both manage a pool for you; create **one** client/connection and share it.
- **Fail fast.** If the database is down, refuse to start rather than starting a server that fails every request.
- **Shut down cleanly.** Close the connection when the process is asked to stop. The exact code for both paths is in Section 6.

**Everything is asynchronous.** A database call goes over the network, so every function returns a **Promise** — you must **`await`** it. Module 2's `store.js` functions were synchronous; the database versions are not, so the route handlers become `async`. Because Express 5 forwards a rejected Promise from an `async` handler to your error middleware (Module 2, Section 2.6), a failed database call becomes a clean `500` instead of a crash.

### 2.3 Setting up the database server

You need a database *server* running before any code can connect. Choose the path for your lab.

**Path A — PostgreSQL.** Options: install PostgreSQL on your machine (the official installer or your system's package manager), run it in a container, or use a hosted PostgreSQL service *(general options; follow the instructions for the one you pick)*. Once it is running, create a **user** and a **database** for the project using `psql`, PostgreSQL's command-line client (these commands were run on PostgreSQL 16):

```sql
CREATE USER app WITH PASSWORD 'secret' CREATEDB;
CREATE DATABASE tasks_db OWNER app;
```

(Use a real password outside of learning. The `CREATEDB` right lets Prisma's migration tool create a temporary scratch database it uses to compare schemas — see Prisma's documentation.) Check the connection from the terminal:

```bash
psql "postgresql://app:secret@127.0.0.1:5432/tasks_db" -c "select current_user, current_database();"
```
```text
 current_user | current_database
--------------+------------------
 app          | tasks_db
```

**Path B — MongoDB.** Options: install MongoDB Community Edition locally, run it in a container, or use **MongoDB Atlas**, the hosted service with a free tier *(general options)*. For Atlas you typically create a cluster, create a **database user**, add your IP address to the **Network Access** allow-list, and copy the connection string it shows you — forgetting the allow-list is the most common reason a first Atlas connection fails (Section 7). **`mongosh`** is MongoDB's interactive shell, for looking at your data directly.

### 2.4 The shape of the refactor

Module 2's `store.js` was a small contract the routes depended on. The refactor keeps the contract and changes the implementation:

| `store` function | Module 2 (in memory) | Now (database) | "Not found" means |
|---|---|---|---|
| `list(filter)` | returns an array | returns a **Promise** of an array | — |
| `get(id)` | returns a task or `undefined` | Promise of a task or `null` | `null` |
| `create(data)` | returns the new task | Promise of the new task | — |
| `replace(id, data)` | returns the task or `undefined` | Promise of the task or `null` | `null` |
| `update(id, changes)` | returns the task or `undefined` | Promise of the task or `null` | `null` |
| `remove(id)` | returns `true` / `false` | Promise of `true` / `false` | `false` |

```text
BEFORE                                      AFTER
routes/tasks.js  ──►  store.js (array)      routes/tasks.js ──► store.js (Prisma or Mongoose) ──► database
   sync calls                                  `await` every call                                   on disk
```

Everything outside `store.js` — validation, middleware, the HTTP contract — barely changes. Section 6 walks through exactly which lines.

### Try it yourself

1. Start your database server and connect with its command-line client (`psql` or `mongosh`). Create a user/database (or confirm your Atlas connection string).
2. Write your connection string in a `.env` file, add `.env` to `../../.gitignore`, and print `process.env.DATABASE_URL` (or `MONGODB_URI`) from a one-line Node script using `--env-file`.
3. Look at your Module 2 `store.js` and list which functions will become `async`.

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| Committing `.env` (or a password in the code) | Credentials leak into Git history | `../../.gitignore` the `.env`; share a `.env.example` |
| Opening a new connection inside every request handler | Slow, and can exhaust the database's connection limit | Connect once at startup and reuse it |
| Forgetting `await` on a database call | You get a Promise (or Query object) instead of data | `await` every database call |
| Building SQL with string concatenation | SQL injection | Placeholders (`$1`) or an ORM |
| Starting the server before the database is reachable | Every request then fails mysteriously | Connect first; exit with a clear message on failure |
| Never closing the connection on shutdown | Scripts hang and connections linger | Disconnect on `SIGINT`/`SIGTERM` |

### ✅ Knowledge Check
1. What is the difference between a driver and an ORM/ODM? Which one is Prisma, and which is Mongoose?
2. Why should a connection string live in an environment variable?
3. What does "connect once, reuse" mean, and why does it matter?
4. Why do the `store` functions become Promises, and what must the route handlers do?
5. What is "failing fast" at startup?

---

## 3. Relational Databases & Prisma

*(Module lesson 2 — Video + Reading. Outcome: configure a PostgreSQL database and utilize Prisma for data modeling.)*

> 📺 *Your Resource Book lists no video or reading for this lesson (its resources are about MongoDB and Mongoose). The official Prisma documentation (prisma.io/docs) is the reference for this section — my addition, not in your file. The Sam Meech-Ward video under Section 2 covers the general connection ideas.*

### 3.1 What is Prisma?

**Prisma** is an ORM for Node.js. It has three parts you will meet in this section:

| Part | What it does |
|---|---|
| **Prisma Schema** (`schema.prisma`) | One file where you declare your **models** (your tables) in Prisma's own language. It is the single source of truth for your data's shape |
| **Prisma Client** | A **generated**, type-aware query library built from your schema — what you call in your code (`prisma.task.findMany()`) |
| **Prisma Migrate** | Turns schema changes into **SQL migration files** and applies them to the database |

(There is also **Prisma Studio**, a browser-based viewer/editor for your data.) The day-to-day loop:

```text
edit schema.prisma  ->  npx prisma migrate dev  ->  npx prisma generate  ->  use the client in your code
   (describe)             (change the database)       (rebuild the client)
```

> **Version note.** The setup below is **Prisma 7** (7.10.1). It differs from many older tutorials, which show a `prisma-client-js` generator and the database URL inside `schema.prisma`. In Prisma 7: the generator is **`prisma-client`** and needs an explicit **`output`** folder (the client is generated *into your project*); the database URL moves to a **`prisma.config.ts`** file; and you create the client with a **driver adapter** (`@prisma/adapter-pg`, which uses the `pg` driver). If a tutorial's setup doesn't match, check which Prisma version it targets.

### 3.2 Install and set up (Path A)

Starting from your Module 2 project folder (or a new one):

```bash
npm install prisma@7.10.1 @prisma/client@7.10.1 @prisma/adapter-pg@7.10.1 pg dotenv
```

Pin all three Prisma packages to the **same** version: at the time of writing, plain `npm install prisma` resolved to an **8.0 release candidate** while `@prisma/client` resolved to 7.10.1 — a mismatch you don't want.

Prisma 7's generated client is **TypeScript and ESM**, so make the project an ES-module project: add `"type": "module"` to `package.json`, and use `import`/`export` instead of `require`/`module.exports` (Section 6.2 shows the Module 2 files converted). Prisma's current releases need a recent Node (the 8.0 release candidate lists Node 22.18+ or 24.11+); Node 24 was used here, which runs the generated `.ts` files directly.

Then create Prisma's starter files. The documented command is:

```bash
npx prisma init --datasource-provider postgresql
```

*(I couldn't run `init` in my environment, so rather than guess its exact output, here are the files I wrote by hand — the client generated from them was run against a real PostgreSQL 16 database. If `init` produces something slightly different for your Prisma version, follow its output and the official docs.)*

**`.env`** (and add `.env`, `node_modules` and `generated` to `../../.gitignore`):

```text
DATABASE_URL="postgresql://app:secret@127.0.0.1:5432/tasks_db"
```

**`prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model Task {
  id        Int      @id @default(autoincrement())
  title     String
  completed Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

**`prisma.config.ts`** — tells the Prisma command-line tool where the schema is and which database to use:

```typescript
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: env('DATABASE_URL') },
});
```

**`db.js`** — creates the **one shared client** your whole app uses:

```javascript
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.ts';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// ONE shared client for the whole application (it manages the connection pool).
export const prisma = new PrismaClient({ adapter });
```

Finally, **generate the client** from the schema:

```bash
npx prisma generate
```
```text
✔ Generated Prisma Client (7.10.1) to ./generated/prisma
```

How the pieces fit: the **schema** describes your models; **generate** turns it into the client code in `generated/prisma/` (it is *your* code, normally git-ignored and rebuilt on demand); the **adapter** connects that client to PostgreSQL through the `pg` driver using `DATABASE_URL`; `db.js` exports the single `prisma` object. Notice the import ends in **`.ts`** — Node 24 strips the TypeScript types and runs the file directly.

### 3.3 Defining a model, and migrating

A **model** becomes a **table**; each **field** becomes a **column**. The Task model above corresponds to this SQL — roughly what Prisma Migrate writes into a migration file *(typical output; I wrote this by hand to create the table, and the client worked against it)*:

```sql
CREATE TABLE "Task" (
  "id"        SERIAL NOT NULL,
  "title"     TEXT NOT NULL,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);
```

| Schema piece | Meaning |
|---|---|
| `Int`, `String`, `Boolean`, `DateTime` | Column types (also `Float`, `Json`, and more) |
| `@id` | The primary key |
| `@default(autoincrement())` | The database assigns 1, 2, 3, … |
| `@default(now())` | Filled with the current time on insert |
| `@default(false)` | A default value |
| `@unique` | A `UNIQUE` constraint (Section 3.5) |
| `String?` | The `?` makes a field optional (nullable) |

By default the **table is named after the model** (`Task`, with a capital — which is why raw SQL needs quotes: `"Task"`). `@@map("tasks")` can rename the table if you want the SQL-style name.

**The migration workflow** *(documented commands — I could not run Prisma Migrate in my environment)*:

| Command | When | What it does |
|---|---|---|
| `npx prisma migrate dev --name init` | During development, after editing `schema.prisma` | Compares the schema with the database, writes a **SQL migration file** into `prisma/migrations/`, applies it, and records it |
| `npx prisma generate` | After any schema change | Rebuilds the client in `generated/prisma/` — run it explicitly so the client always matches the schema |
| `npx prisma migrate deploy` | In production / CI | Applies the migrations that already exist (never creates new ones) |
| `npx prisma db push` | Quick prototyping | Pushes the schema straight to the database *without* migration files |
| `npx prisma studio` | Any time | Opens a browser UI to view and edit rows |

**Migrations are code.** Commit the `prisma/migrations/` folder: it is the history of your database's shape, so a teammate (or a server) can rebuild the same database. Never edit the database by hand and forget the schema — they will drift apart (Section 7).

### 3.4 Prisma Client: the four CRUD operations

Once the table exists, the client reads like plain JavaScript. This script was run against PostgreSQL (`node test-crud.js` style; top-level `await` works in an ES module):

```javascript
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.ts';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const created = await prisma.task.create({ data: { title: 'Learn Prisma' } });
console.log('create  ->', created.id, created.title, created.completed);

const all = await prisma.task.findMany({ orderBy: { id: 'asc' } });
console.log('findMany->', all.length, 'task(s)');

const one = await prisma.task.findUnique({ where: { id: created.id } });
console.log('findUnique ->', one?.title);

const updated = await prisma.task.update({ where: { id: created.id }, data: { completed: true } });
console.log('update  ->', updated.completed);

try {
  await prisma.task.update({ where: { id: 9999 }, data: { completed: true } });
} catch (e) {
  console.log('update missing ->', e.code, '|', e.name);
}

await prisma.task.delete({ where: { id: created.id } });
console.log('delete  -> remaining', await prisma.task.count());
await prisma.$disconnect();
```
```text
create  -> 1 Learn Prisma false
findMany-> 1 task(s)
findUnique -> Learn Prisma
update  -> true
update missing -> P2025 | PrismaClientKnownRequestError
delete  -> remaining 0
```

| CRUD | Prisma method | Returns |
|---|---|---|
| **C**reate | `prisma.task.create({ data })` | the new row |
| **R**ead many | `prisma.task.findMany({ where, orderBy, take, skip })` | an array |
| **R**ead one | `prisma.task.findUnique({ where: { id } })` | the row or **`null`** |
| **U**pdate | `prisma.task.update({ where: { id }, data })` | the updated row — or **throws `P2025`** if there is no such row |
| **D**elete | `prisma.task.delete({ where: { id } })` | the deleted row — or **throws `P2025`** |
| Count | `prisma.task.count({ where })` | a number |

Query options you will use constantly *(standard Prisma Client options; `where` and `orderBy` were run above)*:

```javascript
await prisma.task.findMany({
  where: { completed: false },                   // filter
  orderBy: { createdAt: 'desc' },                // sort
  take: 10, skip: 20,                            // pagination: 10 rows, after the first 20
  select: { id: true, title: true }              // return only some columns
});
```

**Two behaviours to notice:**

1. `findUnique` returns `null` when nothing matches — but **`update` and `delete` *throw*** an error with code **`P2025`** ("record not found"). That is why Section 6's `store.js` wraps them and turns `P2025` into "not found" (`null`), keeping the contract the routes expect.
2. Every Prisma error carries a **`code`**. The ones you will meet:

| Code | Meaning | Typical cause |
|---|---|---|
| `P2025` | Record to update/delete not found | Wrong id |
| `P2002` | Unique constraint failed | Creating a second user with the same email |
| `P2003` | Foreign key constraint failed | Deleting a user who still has posts |
| `P2021` | Table does not exist | Migration not applied |
| `P1000` | Authentication failed | Wrong user/password in `DATABASE_URL` |
| `P1001` | Can't reach the database server | Server not running, wrong host or port |
| `P1003` | Database does not exist | Wrong database name |

(`P2025`, `P2002`, `P2003`, `P2021`, `P1000`, `P1001` and `P1003` were all produced and read in these notes' testing.) Check **`error.code`**; don't depend on the shape of `error.meta`, which differs between Prisma versions — in Prisma 7 with a driver adapter, for example, the duplicate-key `meta` holds a `driverAdapterError` object rather than the older `target` list.

### 3.5 Relations: users and posts

Relational databases shine when data is related. The Blog has **one user → many posts**. In the schema you declare both sides of the relationship:

```prisma
model User {
  id    Int    @id @default(autoincrement())
  name  String
  email String @unique
  posts Post[]                       // the "many" side: a user has many posts
}

model Post {
  id       Int    @id @default(autoincrement())
  title    String
  content  String
  authorId Int                       // the real column: a foreign key
  author   User   @relation(fields: [authorId], references: [id])
}
```

- **`authorId`** is the actual column in the `Post` table (the foreign key). `@relation(fields: [authorId], references: [id])` says "`authorId` points at `User.id`".
- **`author`** and **`posts`** are **relation fields**: they are not columns, they are how Prisma lets you *navigate* between the models in code.
- **`@unique`** on `email` becomes a `UNIQUE` index — the database will refuse duplicates.

Using it (this script was run against PostgreSQL):

```javascript
// Create a user AND two posts in one call (a "nested create")
const user = await prisma.user.create({
  data: {
    name: 'Amina',
    email: 'amina@example.com',
    posts: { create: [
      { title: 'My first post', content: 'Hello, blog!' },
      { title: 'Second post', content: 'More words' }
    ] }
  },
  include: { posts: true }
});
console.log('nested create ->', user.name, 'with', user.posts.length, 'posts; first post authorId =', user.posts[0].authorId);

// Read a post together with its author:  include
const post = await prisma.post.findFirst({ where: { title: 'My first post' }, include: { author: true } });
console.log('include author ->', post.title, 'by', post.author.name, '<' + post.author.email + '>');

// Read a user together with their posts (newest first)
const withPosts = await prisma.user.findUnique({
  where: { id: user.id },
  include: { posts: { orderBy: { id: 'desc' } } }
});
console.log('user.posts ->', withPosts.posts.map((p) => p.title));

// Choose exactly which fields come back:  select
const slim = await prisma.post.findMany({ select: { title: true, author: { select: { name: true } } } });
console.log('select ->', JSON.stringify(slim));
```
```text
nested create -> Amina with 2 posts; first post authorId = 1
include author -> My first post by Amina <amina@example.com>
user.posts -> [ 'Second post', 'My first post' ]
select -> [{"title":"My first post","author":{"name":"Amina"}},{"title":"Second post","author":{"name":"Amina"}}]
```

**`include`** adds the related rows to the result (the SQL `JOIN` you wrote by hand in Section 1.2); **`select`** picks exact fields. And the database still defends the data — both of these were run:

```javascript
await prisma.user.create({ data: { name: 'Amina 2', email: 'amina@example.com' } });   // -> error code P2002 (duplicate email)
await prisma.user.delete({ where: { id: user.id } });                                  // -> error code P2003 (user still has posts)
```

### Try it yourself

1. Create the `Task` model, migrate, generate, and write a script that creates three tasks and prints them in reverse order of creation.
2. Add `description String?` to `Task`. Which two commands must you run, and what happens to existing rows?
3. Provoke each of `P2025`, `P2002` and `P2003` on purpose, and read the error each produces.

### Exercises

**Level 1 — Basic:** Write a script using `create`, `findMany`, `update` and `delete` on `Task`, printing the result of each.

**Level 2 — Practical:** Add `User` and `Post` models; create a user with two posts using a nested create; print each post with its author's name.

**Level 3 — Challenge:** Write a function `postsByAuthorEmail(email)` that returns the titles of that author's posts using a single query (`where: { author: { email } }` is one way — check the Prisma docs), and returns `[]` for an unknown email.

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| Installing `prisma` and `@prisma/client` at different versions | Version mismatch between CLI and client | Pin both (and the adapter) to the same version |
| Editing `schema.prisma` but forgetting to migrate and generate | The database and the client are out of date (`P2021`, or missing fields) | `migrate dev`, then `generate` |
| Creating a new `PrismaClient` in every file or request | Many connection pools; connections run out | Export one shared client (`db.js`) |
| Expecting `update`/`delete` to return `null` for a missing row | They **throw** `P2025` | Catch `P2025` and translate it |
| Relying on `error.meta` to read the duplicated field | Its shape varies by version | Check `error.code` |
| Writing `FROM Task` in raw SQL | The table is `"Task"` (case-sensitive, quoted) | Quote the name, or use `@@map` |
| Committing `.env` or leaving `generated/` un-ignored | Credentials leak / noisy diffs | `../../.gitignore` both |
| Using `require()` in an ES-module project (or the reverse) | Module-format errors | Use `import` with `"type": "module"` for Prisma 7 |

### ✅ Knowledge Check
1. What are the three parts of Prisma, and what does each do?
2. In the Prisma 7 setup, where does the database URL live, and what is the adapter for?
3. What is the difference between `authorId` and `author` in the `Post` model?
4. Why do `update` and `delete` need special handling that `findUnique` doesn't?
5. What do `include` and `select` do?
6. What do error codes `P2002` and `P2003` tell you?

---

## 4. NoSQL Databases & Mongoose

*(Module lesson 3 — Video + Reading. Outcome: configure a MongoDB database and utilize Mongoose for data modeling.)*

> 📺 **Video for this lesson — [Web Dev Simplified](https://www.youtube.com/watch?v=DZBGEVgL2eE)** *(the "core video for this module")*
> Your module file describes it as: *"This is the core video for this module. It covers connecting to the DB, creating Schemas, Models, and basic CRUD operations."* *(I haven't watched it; the description is from your file.)*

> 📺 **Video for this lesson — [Sam Meech-Ward](https://www.youtube.com/watch?v=Hej48pi_lOc)**
> Your module file notes: *"While the title says MySQL, the principles of connecting a Node app to a database are universal."* It is most useful for the connection ideas in Section 2.2 — see the note there.

### 4.1 What is Mongoose?

Your Resource Book calls Mongoose *"the Object Data Modeling (ODM) library that makes working with MongoDB easy. It enforces structure on your flexible data."* That last sentence is the key: MongoDB itself will store any document you give it; **Mongoose adds the structure**.

| Mongoose concept | What it is | Relational equivalent |
|---|---|---|
| **Schema** | Declares a document's fields, types, defaults and validation rules | The table definition |
| **Model** | A class built from a schema, with the query methods (`find`, `create`, …) | The table, as a JavaScript object you can query |
| **Document** | One instance of a model — one record | A row |

Install it (Mongoose 9.11 needs Node 20.19 or newer; this project is CommonJS like Module 2, and Mongoose supports both module systems):

```bash
npm install mongoose
```

### 4.2 Connecting

Keep the connection in its own file, `db.js`, so the rest of the app never worries about it (this is the file the lab uses; it was run against a MongoDB-compatible server):

```javascript
const mongoose = require('mongoose');

async function connectDB(uri = process.env.MONGODB_URI) {
  if (!uri) throw new Error('MONGODB_URI is not set');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });   // give up after 5 s instead of the 30 s default
  console.log('Connected to MongoDB database:', mongoose.connection.name);
}

module.exports = connectDB;
```

- `mongoose.connect(uri)` opens the connection (really a pool) and **returns a Promise**; `mongoose.connection` is the shared connection object.
- The database name comes from the end of the URI (`…/taskdb`). MongoDB creates the database and its collections **the first time you write to them** — there is no "create database" step.
- `serverSelectionTimeoutMS` makes a connection failure show up in 5 seconds with a clear error. Without it Mongoose waits much longer, which feels like the app has frozen (Section 7).

### 4.3 Schemas and models

A schema describes one kind of document. This is the Task API's model for the lab:

```javascript
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false }
  },
  { timestamps: true }   // adds createdAt and updatedAt automatically
);

// Make the JSON look like the Module 2 API: `id` instead of `_id`, and no `__v`.
taskSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Task', taskSchema);
```

- **`type`** — `String`, `Number`, `Boolean`, `Date`, `ObjectId`, arrays (`[String]`), nested objects.
- **Validators and setters:** `required`, `default`, `trim`, `lowercase`, `minlength`/`maxlength`, `min`/`max`, `enum`, `unique`. (`unique: true` creates a **unique index** — it is enforced by the *database*, and a duplicate produces error code `11000`, not a Mongoose validation error.)
- **`{ timestamps: true }`** — Mongoose maintains `createdAt` and `updatedAt` for you.
- **`mongoose.model('Task', taskSchema)`** — creates the model. Mongoose stores `Task` documents in a collection named **`tasks`** (lower-cased and pluralised) — you can see that in the stored data below.
- **The `toJSON` transform** — MongoDB documents have `_id` (an ObjectId) and a hidden **`__v`** version field. Without the transform your API would start returning `_id` and `__v`, quietly breaking the contract your Angular app expects (`id`). The transform runs whenever Express calls `res.json(...)` on a document, so the API keeps returning `id`.

And this is what is actually stored (read straight from the database after the lab session):

```json
{
  "_id": "6adf85baeb9937a65f874de2",
  "title": "Learn Mongoose well",
  "completed": true,
  "createdAt": "2026-10-26T16:54:18.647Z",
  "updatedAt": "2026-10-26T16:54:18.766Z",
  "__v": 0
}
```

### 4.4 CRUD with Mongoose

| CRUD | Mongoose method | Returns when nothing matches |
|---|---|---|
| **C**reate | `Task.create({ title })` | — (returns the new document) |
| **R**ead many | `Task.find({ completed: false }).sort({ createdAt: 1 })` | `[]` |
| **R**ead one | `Task.findById(id)` | **`null`** |
| **U**pdate | `Task.findByIdAndUpdate(id, changes, { returnDocument: 'after', runValidators: true })` | **`null`** |
| **D**elete | `Task.findByIdAndDelete(id)` | **`null`** |

Unlike Prisma's `update`/`delete`, Mongoose's "find and …" methods return **`null`** when there is no match instead of throwing — convenient for the "not found → 404" contract.

Two options you need on updates:

- **`returnDocument: 'after'`** — by default Mongoose hands back the document *as it was before* the update; this asks for the **updated** one.
- **`runValidators: true`** — update operations **skip schema validation by default**; this turns it on.

**The `await` gotcha.** `Task.find()` doesn't run the query when you call it — it returns a **`Query`** object, which runs when you `await` it (or call `.then`). Forgetting `await` is the classic Mongoose bug (this was run):

```javascript
const result = Task.find();
console.log(result.constructor.name, Array.isArray(result));   // Query false  <- not an array of tasks!
```

### 4.5 Relationships: references and `.populate()`

> 📺 **Video for this section — [Web Dev Simplified (continued)](https://www.youtube.com/watch?v=DZBGEVgL2eE)**
> Your module file's focus: *"Pay special attention to the sections on .populate() and referencing other schemas."* *(Same link as the core video; described in your file.)*

Real data is related: users have posts. In MongoDB you either **embed** or **reference** (Section 1.3). To *reference*, store the other document's `_id` and tell Mongoose which model it belongs to:

```javascript
const postSchema = new mongoose.Schema({
  title:   { type: String, required: true, trim: true },
  content: { type: String, required: true },
  author:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });
```

- **`type: ObjectId`** — the field holds a 24-character id.
- **`ref: 'User'`** — "that id belongs to the **User** model". This is what makes `.populate()` possible.

Without `populate`, `post.author` is just an id. **`.populate('author')`** makes Mongoose run a second query and **replace the id with the full user document**:

```javascript
const post = await Post.findOne({ title: 'My first post' }).populate('author');
console.log(post.author.name);                                  // Amina  <- a whole User document

const slim = await Post.findOne({ title: 'First' }).populate('author', 'name');
console.log(JSON.stringify(slim.author));                       // {"_id":"6adf…","name":"Amina"}  <- only chosen fields
```

(Both were run.) The second argument selects which fields to copy in. For the **reverse** direction — all posts by one user — query the posts by their reference: `Post.find({ author: user._id })`.

**Embed or reference?**

| Embed (nested inside the document) | Reference (separate collection + `ref`) |
|---|---|
| Data is **read together** and belongs to one parent (a post's comments) | Data is **shared** or large (many posts → one author) |
| Fast: one read | Needs `populate` (a second query) |
| Duplicates data if the same item appears in many places | One copy to update |

### 4.6 Mongoose errors you will handle

| Error | Cause | How to recognise it |
|---|---|---|
| **`ValidationError`** | A required field is missing/empty, or another schema rule failed | `error.name === 'ValidationError'`; `error.errors` lists the failing fields (here: `title`) |
| **`CastError`** | A value can't be converted to the schema type — typically a malformed ObjectId | `error.name === 'CastError'`; `error.kind` is `'ObjectId'` and `error.path` is `'_id'` |
| **Duplicate key** | A `unique` index was violated | `error.code === 11000` (`MongoServerError`) |

All three were produced and read: an empty `title` → `ValidationError` on `title`; `Post.findById('not-an-id')` → `CastError`; creating a second user with the same email → code `11000`. In the lab, the API checks the id format **before** calling Mongoose, so a bad id becomes a clean `400` instead of a `CastError`.

### Try it yourself

1. Connect to your database with `db.js`, define the `Task` schema, and write a script that creates, finds, updates and deletes one task.
2. Remove `await` from one call and print the result. What do you see?
3. Update a task with and without `{ returnDocument: 'after' }` and compare what comes back.
4. Try to create a task with an empty title with and without `runValidators` on an *update* — which one rejects it?

### Exercises

**Level 1 — Basic:** Define a `Note` schema (`text` required, `pinned` default `false`, timestamps) and write CRUD for it.

**Level 2 — Practical:** Add a `User` schema with a unique, lower-cased `email`; show that creating two users with the same email fails with code `11000`.

**Level 3 — Challenge:** Add `comments` to posts both ways — embedded (an array of `{ text, author }` subdocuments) and referenced (a `Comment` model with a `post` reference) — and write one query that returns a post with its comments in each design.

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| Forgetting `await` on a query | You get a `Query` object, not data | `await` every Mongoose call |
| Updating without `runValidators: true` | Invalid data slips in on updates | Pass the option (or validate in the route) |
| Expecting the updated document from `findByIdAndUpdate` | It returns the *old* one by default | `{ returnDocument: 'after' }` |
| Sending `_id` and `__v` to clients by accident | Breaks the API contract (`id`) | A `toJSON` transform |
| Passing a bad id straight to `findById` | `CastError` → a `500` | Validate the id format → `400` |
| Using `ref` with the wrong model name | `populate` returns `null` | The `ref` must match the name given to `mongoose.model(...)` |
| Relying on `unique: true` as validation | It is an index; the error is `11000`, not `ValidationError` | Handle code `11000` explicitly |
| Calling `mongoose.connect` in every module | Duplicate connections | Connect once at startup |

### ✅ Knowledge Check
1. What do a Mongoose *schema*, *model* and *document* each represent?
2. Why does `findByIdAndUpdate` need `returnDocument: 'after'` and `runValidators: true`?
3. What does `ref: 'User'` do, and what does `.populate('author')` do with it?
4. What are `_id` and `__v`, and why does the Task schema transform them?
5. When would you embed data, and when reference it?
6. Which error do you get for a malformed id, and which for a duplicate unique value?

---

## 5. Hands-On Challenge: The "Blog" Database

*(Module Resource Book, section 5. **Scenario:** you are building the backend for a blog where users can create posts. **Prerequisites:** MongoDB installed (or a MongoDB Atlas account) and Node.js installed.)*

### 5.1 The tasks, mapped to this section

| Task from the module | Where it happens |
|---|---|
| Set up a MongoDB connection using Mongoose in a `db.js` file | Step 2 |
| Create a **User** schema (name, email) and a **Post** schema (title, content, author) | Steps 3–4 |
| **Crucial:** `author` must be an `ObjectId` that references the User model | Step 4 (`ref: 'User'`) |
| Write a script that creates a User, creates a Post linked to that User's id, and finds the Post and uses `.populate('author')` | Step 5 |

### 5.2 Build it

**Step 1 — project:**

```bash
mkdir blog && cd blog
npm init -y
npm install mongoose
```

**Step 2 — `db.js`** (the connection):

```javascript
const mongoose = require('mongoose');

async function connectDB(uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/blog') {
  await mongoose.connect(uri);
  console.log('Connected to MongoDB database:', mongoose.connection.name);
}

module.exports = connectDB;
```

**Step 3 — `models/User.js`:**

```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true }
});

module.exports = mongoose.model('User', userSchema);
```

**Step 4 — `models/Post.js`** (note the `ref` — this is the "crucial step"):

```javascript
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
```

**Step 5 — `seed-blog.js`** (the script the challenge asks for):

```javascript
const mongoose = require('mongoose');
const connectDB = require('./db');
const User = require('./models/User');
const Post = require('./models/Post');

async function main() {
  await connectDB();
  await Promise.all([User.deleteMany({}), Post.deleteMany({})]);   // start clean so the script can be re-run

  // 1. Create a new User
  const user = await User.create({ name: 'Amina', email: 'amina@example.com' });
  console.log('Created user:', user.name, '| _id =', user._id.toString());

  // 2. Create a new Post linked to that User's id
  const post = await Post.create({ title: 'My first post', content: 'Hello, blog!', author: user._id });
  console.log('Created post:', post.title, '| author field holds:', post.author.toString());

  // 3. Find the Post and populate the author
  const found = await Post.findOne({ title: 'My first post' }).populate('author');
  console.log('Populated author:', found.author.name, '<' + found.author.email + '>');
  console.log('Without populate it would be just an id; with it, found.author is a', found.author.constructor.modelName, 'document');

  await mongoose.disconnect();
}

main().catch((err) => { console.error('Script failed:', err.message); process.exit(1); });
```

Run it with your MongoDB running (`node seed-blog.js`). The output (your `_id` will differ):

```text
Connected to MongoDB database: blog
Created user: Amina | _id = 6adf83f016f1c0a1fec27f33
Created post: My first post | author field holds: 6adf83f016f1c0a1fec27f33
Populated author: Amina <amina@example.com>
Without populate it would be just an id; with it, found.author is a User document
```

Read it as a story: the post's `author` field holds **the same id** as the user's `_id` (the reference); `.populate('author')` then swapped that id for the whole user document. That is the entire point of the challenge. (The script ends with `mongoose.disconnect()` — without it the connection stays open and the script never exits.)

### 5.3 The same challenge with Prisma (Path A)

If you chose PostgreSQL, the equivalent has the `User` and `Post` models from Section 3.5 and this script (it creates the user, links a post with the foreign key, and reads it back with `include`):

```javascript
import { prisma } from './db.js';

const user = await prisma.user.create({ data: { name: 'Amina', email: 'amina@example.com' } });
console.log('Created user:', user.name, '| id =', user.id);

const post = await prisma.post.create({ data: { title: 'My first post', content: 'Hello, blog!', authorId: user.id } });
console.log('Created post:', post.title, '| authorId =', post.authorId);

const found = await prisma.post.findFirst({ where: { title: 'My first post' }, include: { author: true } });
console.log('Included author:', found.author.name, '<' + found.author.email + '>');

await prisma.$disconnect();
```

| Mongoose (Path B) | Prisma (Path A) |
|---|---|
| `author: { type: ObjectId, ref: 'User' }` | `authorId Int` + `author User @relation(fields: [authorId], references: [id])` |
| `Post.create({ …, author: user._id })` | `prisma.post.create({ data: { …, authorId: user.id } })` |
| `.populate('author')` | `include: { author: true }` |
| Missing author → *your code* must check | Missing author → the **database** refuses (foreign key) |

### Exercises

**Level 1 — Basic:** Run the script, then change it to create **two** posts for the same user.

**Level 2 — Practical:** Write a second script that finds a user by email and prints the titles of all their posts (the reverse lookup: `Post.find({ author: user._id })`).

**Level 3 — Challenge:** Make `populate` return only the author's `name` (not the email), then try creating a post whose `author` is a random valid ObjectId that doesn't exist. What does Mongoose do — and what would PostgreSQL have done?

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| `author: String` in the Post schema | It's text, not a reference; `populate` can't work | `type: ObjectId, ref: 'User'` |
| `ref: 'user'` (wrong case/name) | Mongoose can't find the model | Must match `mongoose.model('User', …)` exactly |
| Forgetting `mongoose.disconnect()` in a script | The process never exits | Disconnect at the end |
| Creating the post before the user exists | No id to reference | Create the user first, then use `user._id` |
| Forgetting `await` | `post.author` is a Promise/Query, not data | `await` each call |

### ✅ Knowledge Check
1. Which line of the Post schema creates the link to the User model?
2. What does `.populate('author')` replace, and with what?
3. Why must the user be created before the post?
4. What is the Prisma equivalent of `.populate('author')`?

---

## 6. The Lab: Refactor Your Task API to Use a Database

*(The "CRUD API with Database" lab. Learners refactor their API from Module 2, replacing the in-memory array with either PostgreSQL (using Prisma) or MongoDB (using Mongoose). This section is the Intro Session's "connect a database to Express" demonstration, in full.)*

### 6.1 What changes, what doesn't

| File (Module 2) | Changes? | What happens |
|---|---|---|
| `store.js` | **Rewritten** | Array → Prisma or Mongoose calls; every function returns a Promise |
| `routes/tasks.js` | **Slightly** | Handlers become `async`; each `store.…` call gets `await` |
| `validate-task.js` | **One function** | `parseId` must accept the new kind of id (a bounded integer for Prisma; an ObjectId for Mongoose) |
| `server.js` | **Extended** | Connect to the database before listening; close it on shutdown |
| New: `db.js` (+ `models/Task.js` for Mongoose, `prisma/` for Prisma) | **Added** | The connection and the data model |
| `app.js`, `middleware/` | Unchanged *(Path A: only `require` → `import`)* | Logger, `express.json()`, router, 404 and error handler stay |

The HTTP contract — the URLs, methods and status codes from Module 2, Section 1.7 — **does not change**. A client (curl, Postman, your Angular app) can't tell the storage was swapped, except that the data now survives a restart.

### 6.2 Path A — PostgreSQL + Prisma

**Setup:** follow Section 3.2 (install, `.env`, `schema.prisma` with the `Task` model, `prisma.config.ts`, `db.js`, migrate, generate). The project is now ESM: set `"type": "module"` in `package.json` and convert the Module 2 files with this mechanical rule:

| Module 2 (CommonJS) | Now (ES modules) |
|---|---|
| `const express = require('express')` | `import express from 'express'` |
| `const store = require('../store')` | `import * as store from '../store.js'` *(note the `.js`)* |
| `const { a, b } = require('./x')` | `import { a, b } from './x.js'` |
| `module.exports = router` / `{ a, b }` | `export default router` / `export { a, b }` |

For example, `app.js` becomes:

```javascript
import express from 'express';
import requestLogger from './middleware/request-logger.js';
import tasksRouter from './routes/tasks.js';
import { notFound, errorHandler } from './middleware/errors.js';

const app = express();

app.use(requestLogger);
app.use(express.json());
app.use('/tasks', tasksRouter);
app.use(notFound);
app.use(errorHandler);

export default app;
```

**`store.js`** — the heart of the refactor. Same function names and "not found" behaviour as Module 2; the body is Prisma:

```javascript
import { prisma } from './db.js';

// Prisma throws error code P2025 when an update/delete targets a row that does not exist.
// Translate it into "not found" (null) so the routes can answer 404.
async function orNull(promise) {
  try {
    return await promise;
  } catch (error) {
    if (error.code === 'P2025') return null;
    throw error;
  }
}

export function list(filter = {}) {
  return prisma.task.findMany({ where: filter, orderBy: { id: 'asc' } });
}

export function get(id) {
  return prisma.task.findUnique({ where: { id } });
}

export function create({ title, completed = false }) {
  return prisma.task.create({ data: { title, completed } });
}

export function replace(id, { title, completed = false }) {
  return orNull(prisma.task.update({ where: { id }, data: { title, completed } }));
}

export function update(id, changes) {
  return orNull(prisma.task.update({ where: { id }, data: changes }));
}

export async function remove(id) {
  return (await orNull(prisma.task.delete({ where: { id } }))) !== null;
}
```

**`validate-task.js`** — one change, and it matters. The `id` column is a PostgreSQL `INTEGER`, which can't hold numbers above 2,147,483,647. Without a bound, `GET /tasks/99999999999` would reach the database and fail with an error; with it, the API answers a clean `400`:

```javascript
const MAX_INT4 = 2147483647;   // the largest value of a PostgreSQL INTEGER column

// "42" -> 42; anything that is not a positive integer that fits the column -> null
export function parseId(value) {
  if (!/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return id <= MAX_INT4 ? id : null;
}

// Returns { value } when the input is valid, or { errors: [...] } when it is not.
export function validateTask(body, { partial = false } = {}) {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { errors: ['Request body must be a JSON object'] };
  }

  const errors = [];
  const value = {};

  if (!partial || 'title' in body) {
    if (typeof body.title !== 'string' || body.title.trim() === '') {
      errors.push('title is required and must be a non-empty string');
    } else {
      value.title = body.title.trim();
    }
  }

  if ('completed' in body) {
    if (typeof body.completed !== 'boolean') {
      errors.push('completed must be true or false');
    } else {
      value.completed = body.completed;
    }
  }

  return errors.length ? { errors } : { value };
}
```

**`routes/tasks.js`** — Module 2's router with every handler `async` and every store call `await`ed:

```javascript
import express from 'express';
import * as store from '../store.js';
import { parseId, validateTask } from '../validate-task.js';

const router = express.Router();

router.param('id', (req, res, next, value) => {
  const id = parseId(value);
  if (id === null) {
    return res.status(400).json({ error: 'id must be a positive integer' });
  }
  req.taskId = id;
  next();
});

router.get('/', async (req, res) => {
  const { completed } = req.query;
  if (completed === undefined) {
    return res.json(await store.list());
  }
  if (completed !== 'true' && completed !== 'false') {
    return res.status(400).json({ error: 'completed must be "true" or "false"' });
  }
  res.json(await store.list({ completed: completed === 'true' }));
});

router.get('/:id', async (req, res) => {
  const task = await store.get(req.taskId);
  if (!task) {
    return res.status(404).json({ error: `Task ${req.taskId} not found` });
  }
  res.json(task);
});

router.post('/', async (req, res) => {
  const { value, errors } = validateTask(req.body);
  if (errors) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }
  const task = await store.create(value);
  res.status(201).location(`/tasks/${task.id}`).json(task);
});

router.put('/:id', async (req, res) => {
  const { value, errors } = validateTask(req.body);
  if (errors) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }
  const task = await store.replace(req.taskId, value);
  if (!task) {
    return res.status(404).json({ error: `Task ${req.taskId} not found` });
  }
  res.json(task);
});

router.patch('/:id', async (req, res) => {
  const { value, errors } = validateTask(req.body, { partial: true });
  if (errors) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }
  if (Object.keys(value).length === 0) {
    return res.status(400).json({ error: 'Validation failed', details: ['Provide at least one of: title, completed'] });
  }
  const task = await store.update(req.taskId, value);
  if (!task) {
    return res.status(404).json({ error: `Task ${req.taskId} not found` });
  }
  res.json(task);
});

router.delete('/:id', async (req, res) => {
  if (!(await store.remove(req.taskId))) {
    return res.status(404).json({ error: `Task ${req.taskId} not found` });
  }
  res.sendStatus(204);
});

export default router;
```

**`server.js`** — connect first, then listen, and close the connection on shutdown:

```javascript
import app from './app.js';
import { prisma } from './db.js';

const PORT = process.env.PORT || 3000;

await prisma.$connect();   // fail fast if the database is unreachable

const server = app.listen(PORT, (error) => {
  if (error) {
    console.error('Could not start the server:', error.message);
    process.exit(1);
  }
  console.log(`Task API listening on http://localhost:${PORT}`);
});

// On Ctrl + C: stop accepting requests, then close the database connection.
async function shutdown() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
```

Run it with `node server.js`. A full session (each line is a `curl` call; `[HTTP …]` is the status code):

```text
$ curl localhost:3000/tasks
[]  [HTTP 200]
$ curl -X POST -d '{"title":"Learn Prisma"}' localhost:3000/tasks
{"id":1,"title":"Learn Prisma","completed":false,"createdAt":"2026-10-26T16:48:14.931Z"}  [HTTP 201]
$ curl -X POST -d '{"title":"Connect Express to PostgreSQL"}' localhost:3000/tasks
{"id":2,"title":"Connect Express to PostgreSQL","completed":false,"createdAt":"2026-10-26T16:48:14.943Z"}  [HTTP 201]
$ curl -X PUT -d '{"title":"Learn Prisma well","completed":true}' localhost:3000/tasks/1
{"id":1,"title":"Learn Prisma well","completed":true,"createdAt":"2026-10-26T16:48:14.931Z"}  [HTTP 200]
$ curl -X PATCH -d '{"completed":true}' localhost:3000/tasks/2
{"id":2,"title":"Connect Express to PostgreSQL","completed":true,"createdAt":"2026-10-26T16:48:14.943Z"}  [HTTP 200]
$ curl localhost:3000/tasks/99
{"error":"Task 99 not found"}  [HTTP 404]
$ curl localhost:3000/tasks/99999999999
{"error":"id must be a positive integer"}  [HTTP 400]
$ curl -X DELETE localhost:3000/tasks/2
  [HTTP 204]
$ curl -X POST -d '{"completed":true}' localhost:3000/tasks
{"error":"Validation failed","details":["title is required and must be a non-empty string"]}  [HTTP 400]
```

(The `Content-Type: application/json` header was sent on the requests with a body; it is omitted above for readability.)

**The proof of persistence.** Stop the server with Ctrl + C, start it again, and ask for the tasks — they are still there, and you can see them directly in the database with `psql`:

```text
$ curl localhost:3000/tasks
[{"id":1,"title":"Learn Prisma well","completed":true,"createdAt":"2026-10-26T16:48:14.931Z"}]  [HTTP 200]

$ psql "$DATABASE_URL" -c 'SELECT * FROM "Task" ORDER BY id;'
 id |       title       | completed |        createdAt
----+-------------------+-----------+-------------------------
  1 | Learn Prisma well | t         | 2026-10-26 16:48:14.931
(1 row)
```

That is the "before and after" the module is built around: Module 2's tasks vanished on every restart; these don't.

### 6.3 Path B — MongoDB + Mongoose

**Setup:** `npm install mongoose` (Section 4.1), a `.env` with `MONGODB_URI=mongodb://127.0.0.1:27017/taskdb`, and `db.js` and `models/Task.js` exactly as in Sections 4.2–4.3. The project stays **CommonJS**, so the Module 2 files keep their `require`/`module.exports`.

**`store.js`** — the same six functions; each returns a Promise, and "not found" is `null`/`false` just like Module 2:

```javascript
const Task = require('./models/Task');

// Every function returns a Promise (a Mongoose query can be awaited).
// "Not found" is null (or false for remove), exactly like the in-memory store in Module 2.
module.exports = {
  list: (filter = {}) => Task.find(filter).sort({ createdAt: 1, _id: 1 }),
  get: (id) => Task.findById(id),
  create: ({ title, completed = false }) => Task.create({ title, completed }),
  replace: (id, { title, completed = false }) =>
    Task.findByIdAndUpdate(id, { title, completed }, { returnDocument: 'after', runValidators: true }),
  update: (id, changes) =>
    Task.findByIdAndUpdate(id, changes, { returnDocument: 'after', runValidators: true }),
  remove: async (id) => (await Task.findByIdAndDelete(id)) !== null
};
```

**`validate-task.js`** — `parseId` now accepts a 24-character hexadecimal ObjectId (anything else is a `400`, not a `CastError`); `validateTask` is unchanged from Module 2:

```javascript
// A MongoDB ObjectId is 24 hexadecimal characters. Anything else is a 400, not a 404.
function parseId(value) {
  return /^[0-9a-fA-F]{24}$/.test(value) ? value : null;
}
```
(and the `validateTask` function exactly as in the Path A listing above, with `module.exports = { parseId, validateTask };` at the end).

**`routes/tasks.js`** — the same router as Path A (above) with these differences only:

| Difference | Path B |
|---|---|
| Module syntax | `const express = require('express')`, `const store = require('../store')`, `module.exports = router` |
| The id error message | `'id must be a valid ObjectId (24 hex characters)'` |
| `req.taskId` | A string (the ObjectId text), not a number |
| Handlers | Identical: `async` with `await store.…` |

**`server.js`**

```javascript
const mongoose = require('mongoose');
const app = require('./app');
const connectDB = require('./db');

const PORT = process.env.PORT || 3000;

async function start() {
  await connectDB();   // fail fast if the database is unreachable

  const server = app.listen(PORT, (error) => {
    if (error) {
      console.error('Could not start the server:', error.message);
      process.exit(1);
    }
    console.log(`Task API listening on http://localhost:${PORT}`);
  });

  // On Ctrl + C: stop accepting requests, then close the database connection.
  async function shutdown() {
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  }
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((error) => {
  console.error('Startup failed:', error.message);
  process.exit(1);
});
```

In `package.json`: `"scripts": { "start": "node --env-file=.env server.js" }`, then `npm start`. A full session (ids differ on your machine):

```text
Connected to MongoDB database: taskdb
Task API listening on http://localhost:3000
$ curl localhost:3000/tasks
[]  [HTTP 200]
$ curl -X POST -d '{"title":"Learn Mongoose"}' localhost:3000/tasks
{"title":"Learn Mongoose","completed":false,"createdAt":"2026-10-26T16:54:18.647Z","updatedAt":"2026-10-26T16:54:18.647Z","id":"6adf85baeb9937a65f874de2"}  [HTTP 201]
$ curl -X PUT -d '{"title":"Learn Mongoose well","completed":true}' localhost:3000/tasks/6adf85baeb9937a65f874de2
{"title":"Learn Mongoose well","completed":true,"createdAt":"2026-10-26T16:54:18.647Z","updatedAt":"2026-10-26T16:54:18.766Z","id":"6adf85baeb9937a65f874de2"}  [HTTP 200]
$ curl localhost:3000/tasks/000000000000000000000000
{"error":"Task 000000000000000000000000 not found"}  [HTTP 404]
$ curl localhost:3000/tasks/abc
{"error":"id must be a valid ObjectId (24 hex characters)"}  [HTTP 400]
$ curl -X DELETE localhost:3000/tasks/6adf85baeb9937a65f874de3
  [HTTP 204]
$ curl -X POST -d '{"completed":true}' localhost:3000/tasks
{"error":"Validation failed","details":["title is required and must be a non-empty string"]}  [HTTP 400]
```

Note the two kinds of "bad id": `abc` is **not an ObjectId at all** → `400`; `000000000000000000000000` **is** a valid ObjectId that matches nothing → `404`. Distinguishing them is exactly why the id check happens before the database call.

**The proof of persistence:** stop the API (Ctrl + C) and start it again — the remaining task is still returned, and in `mongosh` you'd see the stored document (`use taskdb` then `db.tasks.find()`; the document shown in Section 4.3).

### 6.4 Before and after

| | Module 2 (in memory) | Module 3 (database) |
|---|---|---|
| Data after a restart | **Gone** | **Still there** |
| `store.js` | Array functions, synchronous | Database calls, `async` |
| `id` | A number the store counts up | A database-assigned integer (Path A) or ObjectId string (Path B) |
| Task JSON | `id`, `title`, `completed` | Adds **`createdAt`** (and `updatedAt` for Mongoose) |
| Rules enforced by | Your code | Your code **and** the database (types, `NOT NULL`, unique, foreign keys) |
| Several copies of the server | Each has its own data | All share one database |
| Startup | Just listen | **Connect to the database, then listen**; close it on shutdown |
| Tests | `store.reset()` | Need a **test database** (🔒 later) |

### 6.5 Side effects to be aware of

- **The task `id` type.** With Prisma it's still a number; with Mongoose it is a **string** like `"6adf85ba…"`. If your Angular `Task` interface says `id: number`, it must become `id: string` for Path B.
- **New fields.** `createdAt` (and `updatedAt`) now appear in responses; clients should ignore fields they don't use.
- **Your Postman collection.** The Module 2 collection's "id matches" test compares with `Number(taskId)`. That test passes for Path A but **fails for Path B** (an ObjectId isn't a number) — change it to compare the strings.
- **The in-memory seed data is gone** — a fresh database starts empty; add a seed script if you want sample data.

### Try it yourself

1. Do the refactor for your chosen path, then restart the server mid-session and confirm the data survives.
2. Look at your data with a database tool: `psql` or Prisma Studio (Path A), `mongosh` (Path B).
3. Break it on purpose: stop the database and start the API. Read the error (Section 7).

### Exercises

**Level 1 — Basic:** Complete the refactor so all six endpoints (`GET` list, `GET` one, `POST`, `PUT`, `PATCH`, `DELETE`) work against the database.

**Level 2 — Practical:** Add `GET /tasks?completed=true` filtering through the database (it should be a database `where`, not a filter of the full array in JavaScript).

**Level 3 — Challenge:** Add a `description` field (optional) end to end: schema (and migration for Path A), validation, store and routes — and explain what happens to the rows/documents that already exist.

### 🐞 Common mistakes

| Wrong | Why it fails | Correct |
|---|---|---|
| Forgetting `async`/`await` in the routes | You return a Promise/Query as JSON (`{}`), or the handler finishes early | `async` handlers with `await store.…` |
| Leaving `parseId` as the Module 2 version | Path B: every ObjectId is a `400`; Path A: huge ids reach the database | Update `parseId` for the new id type |
| Returning Mongoose's `_id`/`__v` | Clients break (`id` missing) | The `toJSON` transform |
| Starting the server before connecting | Requests fail with connection errors | `await` the connection, then `listen` |
| Keeping `store.reset()` in tests | It no longer exists | Use a separate test database (🔒 later) |
| Committing `.env` | Credentials leak | `../../.gitignore` it |
| Mixing `require` and `import` (Path A) | Module-format errors | One module system per project |

### ✅ Knowledge Check
1. Which files change in the refactor, and which stay the same? Why can the routes barely change?
2. Why does Path A's `store.js` catch `P2025`, while Path B's doesn't need to?
3. Why does `parseId` have to change?
4. How did you prove the data is now persistent?
5. What two things must `server.js` do that the Module 2 version didn't?

---

## 7. Debugging Database Connection & Query Issues

*(Learning activity: Review & Technical Session — the instructor reviews Prisma/Mongoose patterns and helps debug database connection and query issues. This section is the written companion.)*

### 7.1 A method for any database problem

When something fails, work **from the outside in** — most "mysterious" bugs are one of the first four steps:

```text
1. Is the database server RUNNING?                      (can you connect with psql / mongosh?)
2. Is the connection string RIGHT?                      (host, port, user, password, database name)
3. Does the database / collection / TABLE exist?        (was the migration applied?)
4. Does the app's schema MATCH the database?            (schema.prisma vs tables; regenerated client?)
5. Is the QUERY itself right?                           (missing await? wrong field? wrong id type?)
6. Is the DATA what you think it is?                    (look at it with a database tool)
```

Always **read the whole error message and its code**. The messages below were all produced on purpose and read.

### 7.2 Connection problems

| What you see | Meaning | Fix |
|---|---|---|
| **Mongoose:** `Startup failed: connect ECONNREFUSED 127.0.0.1:27018` | Nothing is listening at that host/port — MongoDB isn't running, or the port in `MONGODB_URI` is wrong | Start MongoDB; check the URI's host and port (default `27017`) |
| **Mongoose + Atlas:** server selection timed out *(general knowledge)* | Your IP isn't on Atlas's **Network Access** allow-list, or there is no network route | Add your IP address in Atlas; check the cluster hostname |
| **Mongoose + Atlas:** `bad auth` / authentication failed *(general knowledge)* | Wrong database **user** (not your Atlas login) or password | Re-check the credentials; URL-encode special characters in the password |
| **Prisma `P1000`:** *Authentication failed against the database server, the provided database credentials for `app` are not valid* | Wrong user or password in `DATABASE_URL` | Fix the credentials |
| **Prisma `P1001`:** *Can't reach database server at `127.0.0.1:5999`* | PostgreSQL isn't running, or the host/port is wrong (default `5432`) | Start PostgreSQL; check the port |
| **Prisma `P1003`:** *Database `nope_db` does not exist on the database server* | The database name in the URL is wrong or the database was never created | `CREATE DATABASE …` or fix the name |
| **Prisma `P2021`:** *The table `public.Task` does not exist in the current database* | The connection works but the **migration wasn't applied** | `npx prisma migrate dev` (dev) / `migrate deploy` (production) |
| The API starts, then every request fails | The server started *before* connecting, or lost the connection | Connect first (`await`) and fail fast |
| Everything hangs for ~30 seconds before failing (Mongoose) | Default server-selection timeout | Set `serverSelectionTimeoutMS: 5000` |
| `Cannot use import statement outside a module` / `require is not defined` | CommonJS/ES-module mix-up (Prisma 7 path) | `"type": "module"` and `import`, consistently |

**Passwords with special characters** (`@`, `:`, `/`, `#`, `%`) break a connection URL because those characters have meaning in URLs — **percent-encode** them (`@` → `%40`) *(general knowledge)*.

### 7.3 Query and data problems

| Symptom | Likely cause | Fix |
|---|---|---|
| Response body is `{}`, or you log a `Query` / `Promise` object | A missing **`await`** | `await` every database call (Section 4.4) |
| Clients receive `_id` and `__v` instead of `id` | No `toJSON` transform (Mongoose) | Add the transform (Section 4.3) |
| `CastError` / a `500` for `/tasks/abc` | A malformed id reached the database | Validate the id format first → `400` |
| `500` for `/tasks/99999999999` (Prisma) | The number exceeds the `INTEGER` column | Bound the id in `parseId` → `400` |
| `P2025` / an unhandled error on update or delete | The row doesn't exist, and Prisma **throws** | Catch it and return `404` |
| `P2002` / Mongo code `11000` | A unique value was duplicated | Return a `409`-style error (or `400`) with a clear message |
| `P2003` | A foreign key blocks the delete/insert | Delete or reassign dependents first |
| New field is `undefined` / missing from results | The **schema changed but the client wasn't regenerated** (Prisma), or the model wasn't updated (Mongoose) | `npx prisma generate` after every schema change |
| The database and `schema.prisma` disagree | Someone changed one without the other | Make changes through migrations only |
| Updates accept invalid data (Mongoose) | `runValidators` not set | Pass `runValidators: true` |
| `populate` returns `null` / an id | `ref` doesn't match the model name, or the referenced document doesn't exist | Match the `ref` string to `mongoose.model('Name', …)` |
| A script never exits | The connection is still open | `prisma.$disconnect()` / `mongoose.disconnect()` at the end |
| "Too many connections" errors | Many `PrismaClient`s (or many connections) were created | One shared client (`db.js`) |

### 7.4 Tools for looking at your data

| Tool | What for | Handy commands |
|---|---|---|
| **`psql`** (PostgreSQL) | Run SQL, inspect tables | `\dt` list tables · `\d "Task"` describe a table · `SELECT * FROM "Task";` |
| **Prisma Studio** | Browse/edit rows in a browser | `npx prisma studio` |
| **`mongosh`** (MongoDB) | Query documents | `show dbs` · `use taskdb` · `show collections` · `db.tasks.find()` |
| **MongoDB Compass** *(general knowledge)* | A GUI for MongoDB data | connect with your URI |
| Your API + `curl` | See what the API actually returns | `curl -i localhost:3000/tasks` |

**Seeing the queries your ORM runs** *(documented options; I did not run these two)*:

```javascript
const prisma = new PrismaClient({ adapter, log: ['query', 'error'] });   // Prisma: print SQL and errors
mongoose.set('debug', true);                                             // Mongoose: print every operation
```

### 7.5 A debugging checklist

- [ ] Can I connect with `psql` / `mongosh` using the **same** connection string?
- [ ] Is `.env` loaded (is `process.env.DATABASE_URL` / `MONGODB_URI` defined)?
- [ ] Did I apply the migration and run `prisma generate` (Path A)?
- [ ] Did I `await` every database call?
- [ ] Do I validate ids **before** the database call?
- [ ] Do I handle "not found" (`P2025` / `null`) and "duplicate" (`P2002` / `11000`)?
- [ ] Does the server connect **before** listening, and disconnect on shutdown?
- [ ] What does the data look like in the database tool?

### Exercises

**Level 1 — Basic:** Stop your database, start your API, and read the error. Which row of the table in 7.2 is it?

**Level 2 — Practical:** Break your connection string three ways (wrong password, wrong port, wrong database name) and record each message and code.

**Level 3 — Challenge:** Create a "bug report" — a Task API whose `PUT /tasks/:id` silently ignores a validation rule (hint: Mongoose updates and `runValidators`, or a forgotten `await`) — and write the steps that find the cause.

### ✅ Knowledge Check
1. Which error code means "can't reach the database server", and what are two likely causes?
2. Why does a Prisma app fail with `P2021` even though the connection succeeded?
3. What does a Mongoose `Query` object instead of data tell you?
4. Why might a new field be `undefined` right after you changed `schema.prisma`?
5. Name two tools for looking at the data directly.

---

## 8. Final Module Project: CRUD API with Database

The module's lab is the **"CRUD API with Database"**: refactor your Module 2 Task API, replacing the in-memory array with **either PostgreSQL (Prisma) or MongoDB (Mongoose)**. It is reviewed by a TA in a live code review, so aim for code you can explain.

### 8.1 Requirements

**Functional (the Module 2 contract, now persistent):**

1. `GET /tasks`, `GET /tasks/:id`, `POST /tasks`, `PUT /tasks/:id`, `PATCH /tasks/:id`, `DELETE /tasks/:id` behave exactly as in Module 2 — same statuses (`200`, `201` + `Location`, `204`, `400`, `404`) and the same JSON error shape.
2. **Data persists** across server restarts (prove it).
3. `GET /tasks?completed=true|false` filters **in the database**.
4. Invalid ids → `400` (before touching the database); valid-but-missing ids → `404`; unexpected database errors → a generic `500` with no internals leaked.

**Database and structure:**

5. **One path chosen** (PostgreSQL + Prisma **or** MongoDB + Mongoose), with the schema/model defined in code (Prisma schema + migration, or a Mongoose schema).
6. A single shared connection: `db.js` (plus `models/Task.js` for Mongoose); `server.js` **connects before listening**, fails fast with a clear message, and **closes the connection on shutdown**.
7. `store.js` keeps Module 2's function names and "not found" behaviour; **routes, validation and middleware are not rewritten**, only adapted (`async`/`await`, `parseId`).
8. **Secrets in `.env`**, which is git-ignored; a `.env.example` is committed.

**Evidence for the code review:**

9. Your Postman (or Insomnia) collection covering every endpoint, updated for the new id type.
10. A `README.md`: how to start the database, configure `.env`, run migrations (Path A), start the API, and one design decision you made and why.
11. A short note: "what changed from Module 2" (the table in Section 6.4 is a good start) and what you would do next.

### 8.2 Suggested structure

```text
task-api/                         Path A (Prisma)                       Path B (Mongoose)
├── .env  (git-ignored)           DATABASE_URL=…                        MONGODB_URI=…
├── .env.example
├── package.json                  "type": "module"                      "start": "node --env-file=.env server.js"
├── prisma/schema.prisma          the Task model                        (not used)
├── prisma/migrations/            committed SQL history                 (not used)
├── prisma.config.ts              database URL for the CLI              (not used)
├── db.js                         the one shared PrismaClient           connectDB()
├── models/Task.js                (not used)                            the Mongoose schema + toJSON
├── store.js                      Prisma calls                          Mongoose calls
├── validate-task.js              parseId (bounded integer)             parseId (24-hex ObjectId)
├── routes/tasks.js               async handlers                        async handlers
├── middleware/                   request-logger.js, errors.js          request-logger.js, errors.js
├── app.js                        builds the app                        builds the app
└── server.js                     connect -> listen -> clean shutdown   connect -> listen -> clean shutdown
```

### 8.3 Required concepts (checklist)

- [ ] SQL vs. NoSQL — and why you chose your path (Section 1)
- [ ] A connection string in an environment variable; one shared connection; fail fast; clean shutdown (Section 2)
- [ ] A schema/model defined with Prisma or Mongoose (Sections 3–4)
- [ ] Persistent CRUD: create, read (many/one), update, delete — all through the ORM/ODM (Sections 3.4, 4.4)
- [ ] Not-found and validation handling at the right layers (Section 6)
- [ ] `async`/`await` throughout (Section 2.2)
- [ ] You can view your data with a database tool and explain the connection errors (Section 7)

### 8.4 Acceptance criteria

- Every endpoint works against the real database, with the same status codes as Module 2.
- After stopping and restarting the server, **earlier data is still returned**.
- A wrong `DATABASE_URL` / `MONGODB_URI` makes the API exit at startup with a readable message; it does **not** start and fail every request.
- No `_id`/`__v` (Mongoose) and no password or connection string appears in any response, log line or committed file.
- You can explain, for each file, what it is responsible for and what changed from Module 2.

### 8.5 Hints

- Refactor **one function at a time**: start with `list` and `create`, test with `curl`, then `get`, `replace`, `update`, `remove`.
- Keep Module 2's habit of separating HTTP from data: the routes should still not mention Prisma or Mongoose.
- Path A: after any schema change run `migrate dev` **and** `generate`; remember `update`/`delete` throw `P2025`.
- Path B: remember `returnDocument: 'after'`, `runValidators: true`, and the `toJSON` transform.
- If an endpoint "returns nothing", look for a missing `await`.

### 8.6 Optional stretch challenges

- **Pagination and sorting:** `?limit=&offset=` and `?sort=createdAt` (Prisma `take`/`skip`/`orderBy`; Mongoose `.limit()`/`.skip()`/`.sort()`).
- **A related model:** add `Board` and make each task belong to a board (a foreign key in Prisma; a `ref` + `populate` in Mongoose), exposing `/boards/:boardId/tasks` for your Angular app.
- **A seed script** that fills an empty database with sample tasks.
- **A test database:** run the Module 2 tests against a separate database that is reset between tests.
- **Update your OpenAPI file** for the new fields (`createdAt`, and the id type).
- **Indexes:** add an index on `completed` and explain when it would help *(🔒 query tuning is outside this module)*.

---

## 9. Quick Reference Sheet

### SQL (PostgreSQL)
```sql
CREATE TABLE tasks (id SERIAL PRIMARY KEY, title TEXT NOT NULL, completed BOOLEAN NOT NULL DEFAULT false);
INSERT INTO tasks (title) VALUES ('Learn SQL');
SELECT * FROM tasks WHERE completed = false ORDER BY id;
UPDATE tasks SET completed = true WHERE id = 1;
DELETE FROM tasks WHERE id = 1;
SELECT p.title, u.name FROM posts p JOIN users u ON u.id = p.author_id;      -- JOIN
```

### MongoDB shell (`mongosh`)
```javascript
use taskdb                                     // switch/create a database
db.tasks.insertOne({ title: 'Learn Mongo' })   // create
db.tasks.find({ completed: false })            // read
db.tasks.updateOne({ title: 'Learn Mongo' }, { $set: { completed: true } })   // update
db.tasks.deleteOne({ title: 'Learn Mongo' })   // delete
```

### Connection and secrets
```text
postgresql://USER:PASSWORD@HOST:5432/DATABASE          mongodb://HOST:27017/DATABASE
.env  (git-ignored)      node --env-file=.env server.js      or      import 'dotenv/config'
lifecycle:  connect once -> listen -> reuse -> on SIGINT: server.close() + disconnect
```

### Prisma 7 (Path A)
```bash
npm install prisma@7.10.1 @prisma/client@7.10.1 @prisma/adapter-pg@7.10.1 pg dotenv    # same version for all three
npx prisma init --datasource-provider postgresql       # starter files
npx prisma migrate dev --name <name>                   # change the database from the schema (dev)
npx prisma generate                                    # rebuild the client
npx prisma migrate deploy                              # apply migrations (production)
npx prisma studio                                      # browse data
```
```javascript
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.ts';
export const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

prisma.task.create({ data })              prisma.task.findMany({ where, orderBy, take, skip, select })
prisma.task.findUnique({ where: { id } }) prisma.task.update({ where: { id }, data })   // throws P2025 if missing
prisma.task.delete({ where: { id } })     prisma.post.findMany({ include: { author: true } })
```

### Mongoose 9 (Path B)
```javascript
await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
const schema = new mongoose.Schema({ title: { type: String, required: true, trim: true } }, { timestamps: true });
const Task = mongoose.model('Task', schema);

await Task.create({ title })               await Task.find({ completed: false }).sort({ createdAt: 1 })
await Task.findById(id)                    // null if missing
await Task.findByIdAndUpdate(id, changes, { returnDocument: 'after', runValidators: true })
await Task.findByIdAndDelete(id)
author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }      await Post.findOne(...).populate('author', 'name')
```

### Error codes
```text
Prisma:    P2025 not found (update/delete) · P2002 unique · P2003 foreign key · P2021 table missing
           P1000 bad credentials · P1001 can't reach server · P1003 database missing
Mongoose:  ValidationError · CastError (bad id) · code 11000 duplicate key · connect ECONNREFUSED
```

### 🔒 Coming Later — Outside This Module
Authentication and password storage · transactions in depth · indexing and query tuning · migration strategy in teams · seeding and fixtures at scale · connection pooling configuration · backups and hosting · testing against databases · caching · other database types (key-value, graph).

---

## 10. Source & Resource Mapping

### Learning-objective coverage

| Learning objective | Where it is covered |
|---|---|
| Differentiate between SQL (PostgreSQL) and NoSQL (MongoDB) databases | Section 1 |
| Connect an Express API to a database using a driver or ORM | Sections 2 and 6 |
| Utilize an ORM (Prisma or Mongoose) to define schemas and models | Sections 3 and 4 |
| Implement persistent CRUD operations that interact with the database | Sections 3.4, 4.4, 6 and 8 |
| Hands-on challenge: the "Blog" database | Section 5 |
| Lab: "CRUD API with Database" | Sections 6 and 8 |
| Review & Technical Session: debugging connections and queries | Section 7 |

### Resources from your module file

| Module topic | Resource | Where it appears |
|---|---|---|
| SQL vs. NoSQL (reading) | [Difference between SQL and NoSQL — GeeksforGeeks](https://www.geeksforgeeks.org/sql/difference-between-sql-and-nosql/) | Section 1. *I did not open the article; Section 1 follows the key concept your file quotes.* |
| SQL vs. NoSQL (video) | [IBM Technology](https://www.youtube.com/watch?v=OqjJjpjDRLc) | Section 1 — described in your file as covering the rigid, structured nature of SQL |
| SQL vs. NoSQL (video) | [Fireship](https://www.youtube.com/watch?v=bxsemcrY4gQ) | Section 1 — "a quick comparison to help you decide when to use which" |
| Introduction to MongoDB (video) | [Sam Meech-Ward](https://www.youtube.com/watch?v=Hej48pi_lOc) | Sections 2 and 4 — the title says MySQL; it is there for the connection logic |
| Mongoose: schemas, models, CRUD (video) | [Web Dev Simplified](https://www.youtube.com/watch?v=DZBGEVgL2eE) | Section 4 — the module's core video |
| Advanced modelling & relationships (video) | [Web Dev Simplified (continued)](https://www.youtube.com/watch?v=DZBGEVgL2eE) | Section 4.5 — `.populate()` and references (same link) |
| Hands-on challenge: the "Blog" database | — | Section 5 |

*I have not watched the videos; each description is quoted from your module file.*

### Other sources

| Used for | Source |
|---|---|
| Prisma and PostgreSQL (lesson 2 has no resource in your file) | The official Prisma documentation (prisma.io/docs) is the reference; the behaviour described here comes from running Prisma 7.10.1 against PostgreSQL 16 |
| Mongoose behaviour | Running Mongoose 9.11 against a MongoDB-compatible server |
| Package versions and the Prisma release-candidate note | The npm registry, checked in October 2026 |

---

## 11. Practice Questions

Your module file lists no quiz for this module, so these questions are my own, for practice. Try them first; answers follow.

**Questions**

1. Give three things a database provides that an in-memory array doesn't.
2. What is the difference between a primary key and a foreign key?
3. What are MongoDB's names for a table, a row and a primary key?
4. Your data is highly related and must stay consistent. SQL or document database — and why?
5. What is the difference between embedding and referencing in MongoDB?
6. What is the difference between a driver and an ORM/ODM?
7. Why shouldn't you build SQL by concatenating user input into a string?
8. Why is the connection string kept in `.env`, and what must you add to `../../.gitignore`?
9. Why connect to the database once at startup instead of in each request?
10. In the Prisma 7 setup, what do `schema.prisma`, `prisma.config.ts` and the `PrismaPg` adapter each do?
11. What does `npx prisma generate` do, and when must you run it?
12. Why do `prisma.task.update` and `delete` need `P2025` handling while `findUnique` doesn't?
13. What do `include` and `select` do in Prisma?
14. What do `P2002` and `P2003` mean?
15. In Mongoose, why does `findByIdAndUpdate` need `returnDocument: 'after'` and `runValidators: true`?
16. What does `ref: 'User'` plus `.populate('author')` do?
17. Why do the Task API's Mongoose models use a `toJSON` transform?
18. `GET /tasks/abc` and `GET /tasks/000000000000000000000000` both fail — with which status codes (Path B), and why different?
19. Your route returns `{}` instead of a task. What is the most likely mistake?
20. How do you prove your API's data is persistent?

**Answer key**

*Prerequisite self-check:*

1. **All tasks** — the data lived in the process's memory, which disappears when the process stops. 2. All of them (`list`, `get`, `create`, `replace`, `update`, `remove`) were synchronous; they now return Promises, so the route handlers must `await` them (and be `async`). 3. It forwards the error to the error-handling middleware (Express 5). 4. It would be committed to Git and leaked; credentials belong in environment variables / a git-ignored `.env`.

*Practice questions:*

1. Any three of: **persistence**, **concurrent access**, **querying**, **integrity rules** (constraints).
2. A **primary key** uniquely identifies a row in its own table; a **foreign key** is a column that points at another table's primary key (and the database enforces it).
3. **Collection**, **document**, **`_id`**.
4. **SQL** — foreign keys, constraints and transactions make the database enforce consistency across related data.
5. **Embedding** nests the related data inside the document (fast reads, duplicated data); **referencing** stores the other document's id (one copy, needs a second lookup / `populate`).
6. A **driver** speaks the database's protocol (you write SQL/query objects); an **ORM/ODM** maps tables/documents to objects and builds queries for you (Prisma is an ORM; Mongoose is an ODM).
7. **SQL injection** — user input could run as SQL. Use parameterised queries (placeholders) or an ORM.
8. It holds credentials, so it must not be in source control; add **`.env`** to `../../.gitignore` (and commit a `.env.example`).
9. Opening a connection is slow and databases limit connections; Prisma/Mongoose pool connections — create one and reuse it.
10. `schema.prisma` declares the models; `prisma.config.ts` tells the CLI where the schema and database URL are; the `PrismaPg` adapter connects the generated client to PostgreSQL through the `pg` driver.
11. It rebuilds the Prisma Client from the schema; run it **after every schema change** (and after installing dependencies on a fresh checkout).
12. `update`/`delete` **throw** `P2025` when the row doesn't exist, whereas `findUnique` returns `null`; catch it and translate it to "not found".
13. **`include`** adds related records to the result (a join); **`select`** chooses exactly which fields come back.
14. `P2002` — a **unique constraint** was violated (a duplicate); `P2003` — a **foreign key constraint** failed (for example, deleting a user who still has posts).
15. By default Mongoose returns the document **before** the update, and update operations **skip validation**; these options return the updated document and turn validation on.
16. The post stores the author's ObjectId; `ref: 'User'` tells Mongoose which model it belongs to; `.populate('author')` loads that user and replaces the id with the full document.
17. To return `id` instead of `_id`, hide `__v`, and keep the API contract the same as Module 2.
18. `abc` → **400** (not a valid ObjectId, rejected before the database); the all-zeros id → **404** (a valid ObjectId that matches nothing).
19. A missing **`await`** — you serialised a Promise/Query instead of the result.
20. Create data, **stop and restart** the server, and request the data again (and look at it directly with `psql`/`mongosh`).

---

## 12. Glossary

| Term | Meaning |
|---|---|
| **Persistence** | Data that survives the process stopping |
| **Database** | A program that stores data safely, serves many clients, and answers queries |
| **SQL** | Structured Query Language — used by relational databases |
| **Relational database** | Stores data in tables of rows and typed columns (PostgreSQL) |
| **NoSQL** | Databases that are not tables-and-SQL; here, the document database MongoDB |
| **Table / row / column** | A set of records / one record / one typed property |
| **Primary key** | A column that uniquely identifies each row |
| **Foreign key** | A column referencing another table's primary key; enforced by the database |
| **Constraint** | A rule the database enforces (`NOT NULL`, `UNIQUE`, foreign key) |
| **Join** | A query combining rows from related tables |
| **ACID transaction** | A group of changes that all succeed or are all undone |
| **Collection / document** | MongoDB's equivalent of a table / a row (a JSON-like record) |
| **BSON** | The binary JSON-like format MongoDB stores |
| **`ObjectId`** | MongoDB's default 24-hex-character `_id` |
| **Embedding / referencing** | Nesting related data in a document / storing another document's id |
| **Driver** | A low-level library that speaks a database's protocol (`pg`, `mongodb`) |
| **ORM** | Object-Relational Mapper — maps tables to objects (Prisma) |
| **ODM** | Object-Document Mapper — maps documents to objects (Mongoose) |
| **Schema** | A declaration of the fields, types and rules of your data |
| **Model** | A queryable class built from a schema (a Prisma model; a Mongoose model) |
| **Migration** | A versioned change to the database's structure, stored as code (Prisma Migrate) |
| **Prisma Client** | The generated, query API built from your Prisma schema |
| **Driver adapter** | The piece that connects Prisma Client to a database driver (`@prisma/adapter-pg`) |
| **`populate`** | Mongoose's way to replace a stored id with the referenced document |
| **Connection string** | The URL carrying a database's host, port, credentials and name |
| **Connection pool** | A set of reusable database connections managed for you |
| **Environment variable / `.env`** | Configuration (and secrets) kept outside the code |
| **Fail fast** | Refusing to start when a required dependency (the database) is unavailable |
| **SQL injection** | An attack that runs user input as SQL; prevented by parameterised queries |
