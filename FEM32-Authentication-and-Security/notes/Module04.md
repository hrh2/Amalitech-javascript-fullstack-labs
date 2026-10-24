# Authentication & Security

## Learners Objectives

Upon successful completion of this module, learners will be able to:

* Explain core authentication and authorization concepts (e.g., stateful vs. stateless).

* Implement user registration and login endpoints.

* Secure passwords in the database using hashing and salting (e.g., bcrypt).

* Implement JSON Web Tokens (JWT) for stateless session management.

* Create protected routes (middleware) that require a valid JWT.

After completion of this module, learners will be able to:

* Explain core concepts of scalability (vertical vs. horizontal) and containerization.

* Containerize a Node.js application and its database using Docker and Docker Compose.

* Deploy a containerized application to a cloud platform (e.g., AWS, Vercel, Railway).

* Implement environment variables for managing configuration and secrets.

## Learning Approach

This module uses a Problem-Based Learning (PrBL) approach. Now that learners have an API with data, the problem is: "How
do we protect this data and know who is making the request?" This module introduces security and authentication as the
solution.

The learning arc moves from conceptual understanding (AuthN vs. AuthZ) (Understand) to the practical application of
hashing passwords (Apply) and implementing a stateless token-based system (Apply/Create). The lab requires learners to
add a new "auth" feature to their existing API.

Active practice is centered on the "Secure API with JWT" lab. Learners receive immediate feedback from Postman (e.g.,
401 Unauthorized vs. 200 OK). All final lab submissions are then reviewed by a TA in a live code review session to
provide expert feedback on code quality, architecture, and best practices.

## Learning Activities

Live Session: Intro Session: Authentication & Security: An instructor-led session demonstrating the full flow of
registering a user, logging in to get a token, and using that token to access a protected route.

Live Session: Review & Technical Session: Authentication & Security: A hands-on technical session where the instructor
reviews the auth middleware logic and helps debug common issues with password hashing or token validation.

Hands-on Coding Lab: The central activity is the "Secure API with JWT" lab. Learners will add /register and /login
endpoints to their API. They will store hashed passwords and issue JWTs on login. Finally, they will make their CRUD
endpoints "protected." 

## Module Structure
| Lesson / Section | Main Topic                                            | Format                 | Learning Activity / Outcome                                                        |
| ---------------- | ----------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------- |
| 1                | AuthN vs. AuthZ                                       | Video + Reading        | Explain authentication, authorization, and session management.                     |
| 2                | Password Hashing                                      | Video + Reading        | Implement `bcrypt` to hash and compare passwords.                                  |
| 3                | JSON Web Tokens (JWT)                                 | Video + Reading        | Implement JWTs for user login and stateless authentication.                        |
| 4                | Protected Routes                                      | Video + Reading        | Create Express middleware to protect endpoints.                                    |
| 5                | Intro Session: Authentication & Security              | Instructor-led Session | Demonstrate the token-based authentication flow.                                   |
| 6                | Review & Technical Session: Authentication & Security | Instructor-led Session | Review authentication middleware and debug common JWT and password-hashing issues. |
| 7                | Hands-On Lab                                          | Coding Lab             | Add user registration and login to the API, and protect routes.                    |

## Learning Resources (Resource Book)
Security is paramount in modern web applications. In this module, you will learn how to secure your Node.js application by implementing industry-standard authentication and authorization flows. You will move from storing plain text passwords (a major security risk) to using cryptographic hashing, implement stateless authentication using JSON Web Tokens (JWT), and control user access using Role-Based Access Control (RBAC).

### 1. Foundations of Security (Hashing)
* Before logging users in, you must ensure their credentials are safe. This section covers why and how to hash passwords.
  * 📺 Watch:[Play Video – IBM Technology](https://www.youtube.com/watch?v=rvZ35YW4t5k)
    * Context: A conceptual overview of how access control logic works before we write the code.
* 📖 Read:
  * [How to hash passwords with bcrypt in Node.js – freeCodeCamp](https://www.freecodecamp.org/news/how-to-hash-passwords-with-bcrypt-in-nodejs/)
  * Key takeaway: Learn how to salt and hash passwords so they are never stored in plain text.

## 2. Implementing Authentication (JWT)
How does the server know who you are without asking for a password on every click? This section covers stateless authentication.

* 📺 Watch:
  * [Play Video – CodeLucky](https://www.youtube.com/watch?v=5zb2Lfhamqc)
  * Context: A quick primer on how middleware functions intercept requests to check for validity.
* 📺 Watch:
  * [Play Video – Web Dev Simplified](https://www.youtube.com/watch?v=mbsmsi7l3r4)
  * Context: This is a complete walkthrough. You will learn to generate tokens upon login and verify them on protected routes.

## 3. Authorization & Permissions (RBAC)
Authentication confirms who you are; Authorization determines what you can do. This section teaches you to restrict sensitive routes to specific users (e.g., Admins).

* 📺 Watch:[Play Video – Web Dev Simplified](https://www.youtube.com/watch?v=jI4K7L-LI58)
  * Context: Learn how to implement a permission system that checks if a user is an 'Admin' or 'Basic' user before granting access.
* 📖 Read:
  * [Implementing Role-Based Access Control (RBAC) in Node.js – Medium](https://medium.com/@techsuneel99/implementing-role-based-access-control-rbac-in-node-js-871591b80a83)
  * Key takeaway: A practical guide to middleware that checks user roles against allowed permissions.

## 4. Hands-On Challenge: The Secure Portal
Apply your skills by building a secured backend system.
* Scenario: You are building a secure employee portal where only Admins can delete users, but everyone can view their own profile.
* Prerequisites: Node.js, Express, MongoDB (or a mock database), Postman.
* Tasks:
  * User Model: Create a User schema with username, password (hashed), and role (default to "user").
  * Register: Create a POST /register endpoint that hashes the password with bcrypt before saving.
  * Login: Create a POST /login endpoint that compares the password, and if valid, returns a JWT.
  * Middleware: Create an authenticateToken middleware that verifies the JWT header.
  * Protected Route: Create a GET /dashboard that is only accessible to logged-in users.
  * Admin Route: Create a DELETE /admin/user/:id that uses an authorizeRole('admin') middleware to block non-admins.








