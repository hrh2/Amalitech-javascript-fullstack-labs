# Advanced Backend Concepts
## Learning Objectives
By the end of this module, you will be able to:
* Implement Layered Architecture (Controller-Service-Repository) for scalable codebases.
* Handle global errors and standardize API responses.
* Validate complex request bodies using Zod.
* Handle file uploads using Multer.
* Implement Pagination, Filtering, and Search for large datasets.
* Apply async/await patterns effectively and prevent unhandled promise rejections.

## Learning Resources (Resource Book)
Building an API is one thing; building one that is scalable, maintainable, and robust is another. In this module, you will learn the advanced patterns that distinguish junior projects from professional architecture. You will refactor your code into a layered architecture, implement global error handling to prevent crashes, handle complex data like file uploads, and optimize data retrieval with pagination and search.

### 1. Architecture & Error Handling
Moving away from putting all logic in routes.js. Learn to structure your app for growth and stability.

* 📖 Read:
  * [Layered Architecture in Node.js – Medium](https://medium.com/@ankitpartap24/layered-architecture-in-node-js-5ef94e846ec4)
  * Key Concept: Separation of concerns. Routes handle HTTP, Services handle Logic, Data Layers handle the Database.
* 📺 Watch:
  * [Play Video – Procademy](https://www.youtube.com/watch?v=WXa1yzLR3hw)
  * Context: Learn how to catch errors from anywhere in your app and send a clean, consistent response to the client.

### 2. Data Integrity & Validation
Never trust user input. Learn how to strictly enforce data schemas before they reach your logic.

* 📺 Watch:
  * [Play Video – Web Dev Simplified](https://www.youtube.com/watch?v=L6BE-U3oy80)
  * Context: Zod is the modern standard for validation. Learn how to verify request bodies and even infer Typescript types (if you use TS).

### 3. Handling Files (Multer)
JSON is easy, but what about images? Learn how to accept file uploads.

* 📺 Watch:
  * [Play Video – The Full Stack Junkie](https://www.youtube.com/watch?v=EVOFt8Its6I)
  * Context: A breakdown of how to process multipart/form-data and store files on your server.
### 4. Advanced Data Retrieval
Don't return 10,000 records at once. Learn to paginate and filter data efficiently.

* 📺 Watch:
  * [Play Video – Web Dev Simplified](https://www.youtube.com/watch?v=ZX3qt0UWifc)
  * Context: The basics of using limit and skip to create pages of data.
  * [Play Video – CyberWolves](https://www.youtube.com/watch?v=0T4GsMYnVN4)
  * Context: Combining multiple query parameters to build a robust search feature.

### 5. Hands-On Challenge: The E-Commerce API Refactor
Refactor a simple "Product API" into a professional, production-ready system.
* Scenario: You have a basic app.js file with all logic mixed together. You need to professionalize it.
* Tasks:
  * Restructure: Move logic into controllers/productController.js and services/productService.js.
  * Validation: Use Zod to validate that a new Product has a name (string), price (number, positive), and category (enum).
  * File Upload: Add a route POST /products that accepts an image file for the product thumbnail using Multer.
  * Search & Paginate: Update the GET /products route to accept query params: ?page=1&limit=10&search=phone.
  * Global Error Handler: Create a middleware that catches any crash or validation error and returns a standard JSON: { status: "error", message: "..." }.