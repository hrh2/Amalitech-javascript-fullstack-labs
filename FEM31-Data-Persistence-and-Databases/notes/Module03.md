# Data Persistence & Databases

## Learning Objectives

Upon successful completion of this module, learners will be able to:

* Differentiate between SQL (e.g., PostgreSQL) and NoSQL (e.g., MongoDB) databases.
* Connect an Express API to a database using a driver or ORM.
* Utilize an ORM (Prisma or Mongoose) to define data schemas and models.
* Implement persistent CRUD (Create, Read, Update, Delete) operations that interact with the database.

## Learning Activities

Live Session: Intro Session: Data Persistence: An instructor-led session comparing SQL and NoSQL and demonstrating how
to connect a database to an Express API.

Live Session: Review & Technical Session: Data Persistence: A hands-on technical session where the instructor reviews
Prisma/Mongoose patterns and helps debug database connection and query issues.

Hands-on Coding Lab: The central activity is the "CRUD API with Database" lab. Learners will refactor their API from
Module 2, replacing the in-memory array with either PostgreSQL (using Prisma) or MongoDB (using Mongoose).

## Learning Approach

This module uses a Project-Based Learning (PBL) approach. It directly extends the previous module's lab, replacing the
in-memory array with a persistent database. This "refactoring" approach provides a clear "before-and-after" and
demonstrates the value of a database.

The learning arc moves from conceptual database theory (Analyze) to the practical skill of connecting the database
(Apply) and then to the abstract, higher-level skill of using an ORM to manage data models (Apply/Create).

Active practice is centered on the "CRUD API with Database" lab. Learners receive immediate feedback from their API
tests and database client. All final lab submissions are then reviewed by a TA in a live code review session to provide
expert feedback on code quality, architecture, and best practices. 

## Module Structure

| Lesson / Section | Main Topic                                   | Format                 | Learning Activity / Outcome                                              |
| ---------------- | -------------------------------------------- | ---------------------- | ------------------------------------------------------------------------ |
| 1                | SQL vs. NoSQL                                | Video + Reading        | Differentiate between relational and non-relational databases.           |
| 2                | Relational DBs & Prisma                      | Video + Reading        | Configure a PostgreSQL database and utilize Prisma for data modeling.    |
| 3                | NoSQL DBs & Mongoose                         | Video + Reading        | Configure a MongoDB database and utilize Mongoose for data modeling.     |
| 4                | Intro Session: Data Persistence              | Instructor-led Session | Compare database types and demonstrate connecting a database to Express. |
| 5                | Review & Technical Session: Data Persistence | Instructor-led Session | Review ORM/ODM patterns and debug common database connection issues.     |
| 6                | Hands-On Lab                                 | Coding Lab             | Refactor the API to use a persistent database (PostgreSQL or MongoDB).   |

## Learning Resources (Resource Book) 
### 1. The Database Landscape (SQL vs. NoSQL)
Before writing code, it is critical to choose the right tool for the job. This section explores the two dominant database paradigms.
* 📖 Read:
  * [Difference between SQL and NoSQL – GeeksforGeeks](https://www.geeksforgeeks.org/sql/difference-between-sql-and-nosql/)
  * Key Concept: SQL uses structured tables and rows (like Excel), while NoSQL uses flexible JSON-like documents.
* 📺 Watch:
  * [Play Video – IBM Technology](https://www.youtube.com/watch?v=OqjJjpjDRLc)
  * Context: Understanding the rigid, structured nature of SQL databases.
  * [Play Video – Fireship (Note: Conceptual comparison)](https://www.youtube.com/watch?v=bxsemcrY4gQ)
  * Context: A quick comparison to help you decide when to use which.
### 2. Introduction to MongoDB
We will focus on MongoDB, the most popular database for Node.js developers due to its JSON-like structure.

* 📺 Watch:
  * [Play Video – Sam Meech-Ward](https://www.youtube.com/watch?v=Hej48pi_lOc)
  * Note: While the title says MySQL, the principles of connecting a Node app to a database are universal. Use this to understand the connection logic.
### 3. Mongoose – Schemas, Models, & CRUD
Mongoose is the "Object Data Modeling" (ODM) library that makes working with MongoDB easy. It enforces structure on your flexible data.

* **Watch:**
* [Play Video– Web Dev Simplified](https://www.youtube.com/watch?v=DZBGEVgL2eE)
* Context: This is the core video for this module. It covers connecting to the DB, creating Schemas, Models, and basic CRUD operations.

### 4. Advanced Data Modeling & Relationships
Real applications have related data (e.g., Users have Posts). Here, you will learn how to link documents together.

* 📺 Watch:
  * [Play Video – Web Dev Simplified (Continued)](https://www.youtube.com/watch?v=DZBGEVgL2eE)
  * Focus: Pay special attention to the sections on .populate() and referencing other schemas.
### 5. Hands-On Challenge: The "Blog" Database
Apply your skills by building the data layer for a blogging platform.

* **Scenario**: You are building the backend for a blog where users can create posts.
* **Prerequisites**: MongoDB installed (or MongoDB Atlas account), Node.js installed.
* **Tasks**:
  * Setup a MongoDB connection using Mongoose in a db.js file.
  * Create a User Schema (name, email) and a Post Schema (title, content, author).
  * Crucial Step: The author field in the Post Schema must be an ObjectId that references the User model.
  * Write a script to:
  * Create a new User.
  * Create a new Post linked to that User's ID.
  * Find the Post and use .populate('author') to retrieve the user's details along with the post.







