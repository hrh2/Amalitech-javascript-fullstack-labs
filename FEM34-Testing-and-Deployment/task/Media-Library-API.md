# **Media Library API**

---

## **Overview**

In this lab, learners will take the existing Media Library API and prepare it for production by implementing:

- Automated testing

- Environment configuration

- Git & GitHub workflows

- CI/CD pipelines

- Cloud deployment

- Structured logging

- Application monitoring

This lab bridges the gap between local development and live production systems.

## **Learning Objectives**

By the end of this lab, learners should be able to:

- Test API endpoints using Postman.

- Write unit and integration tests using Jest or Mocha/Chai.

- Configure environment variables for different environments.

- Use GitHub Actions for CI/CD pipelines.

- Deploy applications to Vercel.

- Implement structured logging and application health monitoring.

## **Scenario**

Your Media Library API currently works only on your local machine.

Your tech lead has asked you to prepare the project for production release by:

- Writing a full test suite

- Cleaning up environment configuration

- Setting up GitHub workflows

- Deploying to Vercel

- Adding logging and monitoring

## **Lab Requirements**

## **1. API Testing with Postman**

Create a Postman Collection named:

Media Library API
 

### **Include All Endpoints**

| **Method** | **Endpoint** |
| --- | --- |
| POST | /media |
| GET | /media |
| GET | /media/:id |
| PUT | /media/:id |
| DELETE | /media/:id |

## **Postman Test Assertions**

For each request, add tests that verify:

- Correct HTTP status codes

- Response body structure

- Required fields are present

### **Example Assertions**

- 200 OK

- 201 Created

- 400 Bad Request

- 404 Not Found

### **Response Structure Validation**

#### **Success**

{
  "status": "success",
  "data": {}
}
 

#### **Error**

{
  "status": "error",
  "message": "Something went wrong"
}
 

## **Postman Environments**

Create at least two environments:

| **Environment** | **Purpose** |
| --- | --- |
| Development | Localhost API |
| Production | Live Vercel deployment |

Use environment variables:

{{BASE_URL}}
{{MEDIA_ID}}
 

## **Export Collection**

Export and commit the collection JSON file under:

/postman
 

# **2. Unit Tests**

Write unit tests for:

| **Component** | **Test Requirement** |
| --- | --- |
| mediaService | Pagination calculations |
| validate middleware | Valid & invalid requests |
| catchAsync | Error forwarding to next() |
| AppError | statusCode, message, status |

## **Example Test Cases**

### **mediaService**

Verify:

- Correct totalPages

- Correct pagination metadata

### **validate Middleware**

Verify:

- Valid input passes

- Invalid input returns structured 400

### **catchAsync**

Verify:

- Rejected promises call next(error)

### **AppError**

Verify:

- message

- statusCode

- status

# **3. Integration Tests**

Use **Supertest** for endpoint testing.

## **Required Endpoint Tests**

### **POST ****/media**

Test:

- 201 for valid upload

- 400 for missing title

- 400 for unsupported file type

### **GET ****/media**

Test:

- Pagination metadata exists

- Filtering works

- Search works correctly

### **GET ****/media/:id**

Test:

- 200 for valid ID

- 404 for missing resource

### **PUT ****/media/:id**

Test:

- 200 for valid update

- 400 for invalid body

### **DELETE ****/media/:id**

Test:

- 200 for successful deletion

- 404 for invalid ID

## **Test Configuration**

Use:

- Separate test database

- In-memory database

Tests must never affect development data.

## **package.json Scripts**

{
  "scripts": {
    "test": "jest --runInBand --forceExit",
    "test:coverage": "jest --coverage"
  }
}
 

## **Coverage Requirement**

Aim for at least:

80% code coverage
 

Across:

- Services

- Middleware

# **4. Environment Variable Configuration**

Create separate environment files:

| **File** | **Purpose** |
| --- | --- |
| .env.development | Local development |
| .env.test | Testing |
| .env.production | Production |

Use:

- dotenv-flow

- or equivalent package

## **Required Variables**

NODE_ENV=
PORT=
DATABASE_URL=
JWT_SECRET=
MAX_FILE_SIZE_MB=
UPLOAD_DIR=
LOG_LEVEL=
 

## **Additional Requirements**

- Add .env* files to .gitignore

- Commit .env.example

- Validate environment variables at startup

### **Startup Validation**

If a required variable is missing:

- Throw descriptive error

- Exit the application

# **5. Git, GitHub ****&**** CI/CD**

# **Git Workflow**

Maintain a clean commit history.

### **Suggested Commit Groups**

- Initial setup

- Feature implementation

- Test suite

- Environment configuration

- CI pipeline

- Deployment configuration

## **Branch Protection**

- Use feature branches

- Open pull requests before merging

- Require CI checks to pass

# **GitHub Actions CI Pipeline**

Create:

.github/workflows/ci.yml
 

## **Workflow Requirements**

On every push or PR to main:

- Checkout code

- Setup Node.js

- Install dependencies

npm ci
 

- Run tests

npm test
 

## **Bonus**

Upload coverage reports as workflow artifacts.

# **6. Deployment to Vercel**

Install and configure the Vercel CLI.

## **Create ****vercel.json**

{
  "version": 2,
  "builds": [
    {
      "src": "src/app.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/app.js"
    }
  ]
}
 

## **Deployment Requirements**

- Add production environment variables through the Vercel dashboard

- Deploy successfully

- Verify all endpoints work

## **Postman Production Tests**

Run the exported Postman collection against the deployed Vercel URL.

All tests should pass.

## **Document Vercel Limitations**

Example:

- Ephemeral filesystem

- Upload persistence issues

Describe how you would handle this in production:

- AWS S3

- Cloudinary

- External storage

# **7. Structured Logging**

Replace all console.log statements with:

- Winston

- or Pino

## **Logger Requirements**

### **Development**

- Pretty printed logs

### **Production**

- JSON structured logs

## **Respect LOG_LEVEL**

Supported levels:

debug
info
warn
error
 

## **Required Logged Events**

| **Event** | **Level** |
| --- | --- |
| Server started | info |
| Incoming request | info |
| File uploaded | info |
| Validation error | warn |
| Resource not found | warn |
| Unhandled global error | error |
| Promise rejection | error |

# **8. Health Check Endpoint**

Create:

GET /health
 

### **Response**

{
  "status": "ok",
  "uptime": 123.45,
  "timestamp": "2026-03-31T10:00:00.000Z"
}
 

Use this endpoint for deployment monitoring.

# **9. Monitoring (Bonus)**

Integrate monitoring tools such as:

- Vercel Analytics

- Better Uptime

- UptimeRobot

Monitor:

GET /health
 

# **Steps to Complete the Lab**

- Configure environment files.

- Set up Jest and Supertest.

- Write unit tests.

- Write integration tests.

- Verify coverage.

- Create Postman collection.

- Configure logging.

- Add /health endpoint.

- Configure GitHub Actions CI.

- Deploy to Vercel.

- Test production endpoints.

- (Bonus) Add uptime monitoring.

# **Suggested Project Structure**

project-root/
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── postman/
│   └── media-library-api.postman_collection.json
│
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── repositories/
│   ├── routes/
│   ├── services/
│   ├── tests/
│   ├── utils/
│   └── app.js
│
├── uploads/
├── .env.development
├── .env.test
├── .env.production
├── .env.example
├── .gitignore
├── jest.config.js
├── package.json
├── server.js
└── vercel.json
 

# **Evaluation Criteria (100%)**

| **Criteria** | **Description** | **Weight** |
| --- | --- | --- |
| Postman Collection | Endpoints covered with assertions and environments | 15% |
| Unit Tests | Core utilities and middleware tested | 20% |
| Integration Tests | Full API endpoint testing with Supertest | 20% |
| Environment Configuration | Proper env setup and validation | 15% |
| Git Workflow & CI/CD | Clean Git workflow and passing CI pipeline | 15% |
| Deployment & Logging | Live deployment, logging, and health endpoint | 15% |
