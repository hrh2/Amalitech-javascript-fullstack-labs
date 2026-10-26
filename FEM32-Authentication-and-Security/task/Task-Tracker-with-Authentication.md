# Task Tracker with Authentication

## Overview

In this lab, learners will secure the existing backend application (Task Tracker API) by implementing authentication and authorization features.

Learners will build a secure user management system that allows users to:

- Register accounts

- Log in securely

- Access protected routes using JSON Web Tokens (JWT)

This lab also introduces important security practices such as:

- Password hashing with bcrypt

- Token-based authentication

- Role-Based Access Control (RBAC)

These concepts are essential for building production-ready APIs.

## **Learning Objectives**

By the end of this lab, learners should be able to:

- Implement user registration and login in an Express.js application.

- Hash passwords securely using bcrypt.

- Generate and verify JWTs for authenticated sessions.

- Use middleware to protect private routes.

- Implement role-based access control (RBAC).

- Apply API security best practices such as:

- environment variables

- token expiration

- secure error handling

## **Scenario**

You are extending your existing Task Tracker API.

Currently, all routes are public, meaning anyone can view or modify tasks.

To make the API production-ready, you need to implement authentication and authorization so that:

- Only registered users can log in and create tasks.

- Users can only manage their own tasks.

- Admins can view and manage all tasks.

## **Lab Requirements**

### **1. User Management**

Create a User model with fields such as:

| **Field** | **Description** |
| --- | --- |
| name | User’s full name |
| email | User email address |
| password | Hashed password |
| role | User role (user or admin) |

### **Requirements**

- Hash passwords using bcrypt before storing them.

- Implement the following routes:

| **Method** | **Endpoint** | **Description** |
| --- | --- | --- |
| POST | /auth/register | Register a new user |
| POST | /auth/login | Authenticate user and issue JWT |

### **2. JWT Authentication**

#### **Requirements**

- Generate a JWT after successful login.

- Store the JWT secret key in an environment variable.

- Set token expiration (example: 1h).

#### **Create Authentication Middleware**

The middleware should:

- Verify JWTs from the Authorization header.

- Reject unauthorized requests.

- Return proper HTTP status codes.

#### **Example Authorization Header**

Authorization: Bearer your_jwt_token
 

### **3. Route Protection**

Apply authentication middleware to secure task routes such as:

- Create task

- Update task

- Delete task

#### **Access Rules**

- Users should only access their own tasks.

- Users should not modify or delete another user’s tasks.

Example:

User A cannot delete User B's task.
 

### **4. Role-Based Access Control (RBAC)**

Extend middleware to include authorization checks.

#### **Admin Permissions**

Only users with the admin role should be allowed to:

- View all users

- Manage all tasks

#### **Example Roles**

| **Role** | **Permissions** |
| --- | --- |
| user | Manage own tasks only |
| admin | Manage all users and tasks |

### **5. Error Handling ****&**** Responses**

Return meaningful error messages for:

- Invalid credentials

- Missing tokens

- Unauthorized access

- Expired tokens

#### **Response Format Example**

{
  "status": "error",
  "message": "Unauthorized access"
}
 

Use:

- Consistent JSON responses

- Appropriate HTTP status codes

### **6. Environment Configuration**

Store sensitive data in a .env file such as:

PORT=5000
DB_URI=your_database_uri
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=1h
 

#### **Requirements**

- Use dotenv to load environment variables.

- Never hardcode secrets in the source code.

- Do not commit .env files to version control.

## **Steps to Complete the Lab**

- Set up a new authentication route file.

- Connect the User model to the database.

- Implement registration with password hashing.

- Implement login with JWT generation.

- Create middleware to verify tokens.

- Protect task routes using middleware.

- Add authorization rules for roles.

- Test endpoints using:

- Postman

- Insomnia

- Validate:

- Successful requests

- Unauthorized requests

- Invalid login attempts

# **Recommended Project Structure (MVC)**

project-root/
│
├── config/
│   └── db.js
│
├── controllers/
│   ├── authController.js
│   └── taskController.js
│
├── middleware/
│   ├── authMiddleware.js
│   └── roleMiddleware.js
│
├── models/
│   ├── User.js
│   └── Task.js
│
├── routes/
│   ├── authRoutes.js
│   └── taskRoutes.js
│
├── .env
├── server.js
└── package.json
 

# **Evaluation Criteria (100%)**

| **Criteria** | **Description** | **Weight** |
| --- | --- | --- |
| User Registration & Login | Secure signup/login with bcrypt hashing | 20% |
| JWT Authentication | Correctly issues, verifies, and expires JWTs | 20% |
| Protected Routes | Middleware restricts access to authenticated users | 20% |
| Role-Based Access Control | Proper user/admin role enforcement | 15% |
| Error Handling & Security Practices | Uses environment variables and secure responses | 15% |
| Code Organization & Documentation | Clean structure and clear documentation | 10% |

# **Suggested API Endpoints**

## **Authentication Routes**

| **Method** | **Endpoint** | **Description** |
| --- | --- | --- |
| POST | /auth/register | Register new user |
| POST | /auth/login | Login user |

## **Task Routes**

| **Method** | **Endpoint** | **Access** |
| --- | --- | --- |
| GET | /api/tasks | Authenticated users |
| POST | /api/tasks | Authenticated users |
| PUT | /api/tasks/:id | Task owner only |
| DELETE | /api/tasks/:id | Task owner or admin |

# **Optional Extension Challenges**

If you complete the lab early, try adding:

## **Advanced Security Features**

- Refresh tokens

- Password reset functionality

- Email verification

- Rate limiting

- Helmet security middleware

## **Additional Enhancements**

- Activity logging

- User profile management

- Session invalidation on logout

- API documentation with Swagger
