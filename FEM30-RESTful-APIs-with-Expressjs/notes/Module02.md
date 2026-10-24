# RESTful APIs with Express.js

## Learning Objectives

Upon successful completion of this module, learners will be able to:

* Explain the principles of RESTful APIs and their core components.
* Construct a basic web server using Node.js and the Express framework.
* Implement routing to handle different HTTP methods (GET, POST, PUT, DELETE).
* Utilize middleware for tasks such as request parsing, logging, and error handling.
* Test API endpoints effectively using a tool like Postman or Insomnia.

## Learning Approach

This module uses a Project-Based Learning (PBL) approach. Learners immediately transition from the theory of Module 1 to
the practical skill of building. The self-paced materials provide the "how-to" for each Express feature (routing,
middleware).

The learning arc moves from building a "hello world" server (Apply) to constructing a full, in-memory RESTful API
(Apply/Create). The lab requires learners to synthesize all these concepts into a functional, testable application.

Active practice is centered on the summative lab. Learners receive immediate feedback from their development environment
(e.g., Postman and server logs). All final lab submissions are then reviewed by a TA in a live code review session to
provide expert feedback on code quality, architecture, and best practices.

Code Review: RESTful Task Tracker: A live code review with learners to understand their understanding of the lab and the
decisions they made.

## Learning Activities

Code Review: RESTful Task Tracker: A live code review with learners to understand their understanding of the lab and the
decisions they made.

Hands-on Coding Lab: The central activity is building a "Simple RESTful API" for a resource (e.g., tasks, users) that
supports all CRUD operations using an in-memory array (no database). 

## Module Structure

| Lesson / Section | Main Topic                             | Format                 | Learning Activity / Outcome                                    |
| ---------------- | -------------------------------------- | ---------------------- | -------------------------------------------------------------- |
| 1                | RESTful API Principles                 | Video + Reading        | Explain REST, HTTP methods, and status codes.                  |
| 2                | Introduction to Express                | Video + Reading        | Construct a basic Express server.                              |
| 3                | Routing                                | Video + Reading        | Implement route handlers for all common HTTP methods.          |
| 4                | Middleware                             | Video + Reading        | Utilize built-in and custom middleware for request processing. |
| 5                | Intro Session: Building Your First API | Instructor-led Session | Demonstrate building a simple API from scratch with Express.   |
| 7                | Hands-On Lab                           | Coding Lab             | Build a RESTful Task Tracker.                                  |

## Learning Resources (Resource Book)

In this module, you will move beyond simple servers to building robust, scalable RESTful APIs. You will learn the industry-standard architecture for handling data, managing routes, and processing HTTP requests using the Express.js framework.

### 1. The Fast Track – REST & Express Basics
Get a high-level overview of what REST is and how to spin up an API in minutes.

* 📺 Watch: [Play Video – Fireship](https://www.youtube.com/watch?v=-MTSQjw5DrM)
  * Context: A rapid-fire introduction to the concepts of resources, HTTP verbs, and status codes, followed by a quick coding demo.

### 2. Deep Dive – Building a Complete API
This is the core of the module. You will build a fully functional API with CRUD operations, validation, and proper architectural practices.

* 📺 Watch:Play Video – Programming with Mosh
  * Context: This comprehensive tutorial covers everything from setting up the environment to handling GET/POST/PUT/DELETE requests, input validation, and using Postman for testing.
* 📖 Read:
  * [How to create a REST API with Node.js and Express – Postman Blog](https://blog.postman.com/how-to-create-a-rest-api-with-node-js-and-express/)
  * Key Reference: A text-based guide reinforcing the concepts of routing and middleware.

### 3. Documentation & Standards
Professional APIs need documentation. Learn how to describe your API structure automatically.

* 📺 Watch: [Play Video – Maksim Ivanov](https://www.youtube.com/watch?v=S8kmHtQeflo)
* Context: Learn how to document your API endpoints using Swagger (OpenAPI), making it easier for frontend developers to consume your backend.

### 4. Hands-On Challenge: The "Task Manager" API
Build a functional API to manage a to-do list.

* **Scenario**: You are building the backend for a productivity app.
* **Prerequisites**: Node.js installed, Postman (or Thunder Client) installed.
* **Tasks**:
  * Initialize a new project and install express.
  * Create a server file (app.js) running on port 3000.
  * Implement GET /tasks to return all tasks (use a hardcoded array for now).
  * Implement GET /tasks/:id to return a specific task.
  * Implement POST /tasks to create a new task (validate that the "title" field exists).
  * Implement DELETE /tasks/:id to remove a task.
  * Use Postman to test all four endpoints and save your request collection.