# **Media Library API**

# **Overview**

In this lab, learners will build a production-grade Media Library API using Node.js and Express.js.

The API will allow users to:

- Upload media assets (images and PDFs)

- Manage uploaded files

- Search and filter media records

- Retrieve paginated results

This lab focuses on real-world backend engineering practices including:

- Layered architecture

- Global error handling

- Request validation

- File uploads with Multer

- Pagination, filtering, and search

- Async/await best practices

# **Learning Objectives**

By the end of this lab, learners should be able to:

- Implement a layered architecture:

- routes → controllers → services → repositories

- Handle global errors using centralized middleware.

- Validate requests using Joi or Zod.

- Handle single and multiple file uploads with Multer.

- Implement pagination, filtering, and search functionality.

- Use async/await effectively and manage unhandled promise rejections.

# **Scenario**

You are building the backend for a Media Library platform used by a content team to organize uploaded files.

Currently, files are stored manually without:

- Structure

- Search capability

- Metadata tracking

You have been tasked with building a RESTful API that:

- Accepts file uploads with metadata.

- Allows searching and filtering uploaded assets.

- Validates all incoming input.

- Returns consistent responses for both success and failure cases.

# **Lab Requirements**

## **1. Layered Architecture**

Structure your project using a four-layer architecture:

src/
├── routes/          # Express route definitions
├── controllers/     # Request/response logic
├── services/        # Business logic
├── repositories/    # Database operations
├── middlewares/     # Validation, upload, error handling
├── models/          # Database models/schemas
└── config/          # Environment and app configuration
 

### **Requirements**

- No business logic inside route files.

- Controllers must delegate business logic to services.

- Services must delegate database operations to repositories.

## **2. Global Error Handling ****&**** Structured Responses**

Create centralized error-handling middleware and register it last in the Express app.

### **Create a Reusable ****AppError**** Class**

Handle operational errors such as:

- 404 Not Found

- 400 Bad Request

### **Standard Response Format**

#### **Success Response**

{
  "status": "success",
  "data": {}
}
 

#### **Error Response**

{
  "status": "error",
  "message": "Validation failed",
  "details": []
}
 

### **Additional Requirements**

- Handle unhandled promise rejections.

- Handle uncaught exceptions.

- Log errors and shut down gracefully when necessary.

## **3. Request Validation**

Use **Joi** or **Zod** for request validation.

### **Validation Requirements**

#### **POST ****/media**

Validate:

- title → required

- tags → array

- category → valid enum

#### **PUT ****/media/:id**

Validate metadata updates.

#### **GET ****/media**

Validate query parameters:

- page

- limit

- category

- search

- sortBy

- order

### **Validation Middleware**

Create a reusable validation middleware.

### **Requirements**

- Validation runs before controller logic.

- Return structured field-level errors.

### **Example Validation Error**

{
  "status": "error",
  "message": "Validation failed",
  "details": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
 

## **4. File Uploads with Multer**

Configure Multer to:

- Use disk storage

- Save files to /uploads

### **File Restrictions**

| **Requirement** | **Value** |
| --- | --- |
| Accepted Types | image/jpeg, image/png, application/pdf |
| Max File Size | 5MB |

## **Upload Endpoint**

### **POST ****/media**

Accept:

- A single uploaded file (file)

- Metadata fields:

- title

- tags

- category

### **Store the Following Information**

| **Field** | **Description** |
| --- | --- |
| filePath | Saved file path |
| originalName | Original uploaded filename |
| mimeType | File MIME type |
| fileSize | File size |
| title | Media title |
| tags | Associated tags |
| category | Media category |

### **Error Handling**

Return 400 Bad Request for:

- Unsupported file types

- Oversized files

## **5. Pagination, Filtering ****&**** Search**

Implement the GET /media endpoint with support for:

| **Query Parameter** | **Description** |
| --- | --- |
| page | Page number (default: 1) |
| limit | Results per page (default: 10, max: 50) |
| category | Filter by category |
| tags | Filter by comma-separated tags |
| search | Full-text search on title |
| sortBy | Field to sort by |
| order | asc or desc |

## **Example Pagination Response**

{
  "status": "success",
  "data": {
    "results": [],
    "pagination": {
      "total": 84,
      "page": 2,
      "limit": 10,
      "totalPages": 9
    }
  }
}
 

## **6. Async/Await ****&**** Promise Rejection Handling**

### **Requirements**

- Use async/await throughout the application.

- Do not use .then() or .catch() chains.

### **Create a ****catchAsync**** Utility**

Example:

router.get('/', catchAsync(mediaController.getAll));
 

### **Additional Requirements**

- Handle uncaught promise rejections globally.

- Demonstrate at least one use of Promise.all().

Example use case:

- Fetching media records and total count simultaneously.

# **API Endpoints Summary**

| **Method** | **Endpoint** | **Description** |
| --- | --- | --- |
| POST | /media | Upload a media file |
| GET | /media | Get all media with filters |
| GET | /media/:id | Get single media item |
| PUT | /media/:id | Update media metadata |
| DELETE | /media/:id | Delete media item and file |

# **Steps to Complete the Lab**

- Initialize the project.

- Install dependencies:

- express

- multer

- joi or zod

- dotenv

- database driver

- Configure the Express app.

- Create the Media model.

- Build repository layer CRUD operations.

- Build service layer business logic.

- Build controllers using catchAsync.

- Configure routes and validation middleware.

- Configure Multer upload restrictions.

- Implement global error handling.

- Add process-level rejection/exception handlers.

- Test all endpoints using:

- Postman

- Insomnia

### **Test Edge Cases**

- Invalid file type

- Oversized file

- Missing fields

- Invalid query parameters

# **Evaluation Criteria (100%)**

| **Criteria** | **Description** | **Weight** |
| --- | --- | --- |
| Layered Architecture | Proper separation of concerns | 20% |
| Global Error Handling | Centralized middleware and AppError usage | 20% |
| Request Validation | Joi/Zod validation with reusable middleware | 15% |
| File Upload Handling | Correct Multer setup and metadata storage | 20% |
| Pagination, Filtering & Search | Query features fully functional | 15% |
| Async/Await & Promise Handling | catchAsync and Promise.all() usage | 10% |

# **Suggested Project Structure**

project-root/
│
├── src/
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   │   └── mediaController.js
│   │
│   ├── services/
│   │   └── mediaService.js
│   │
│   ├── repositories/
│   │   └── mediaRepository.js
│   │
│   ├── routes/
│   │   └── mediaRoutes.js
│   │
│   ├── middlewares/
│   │   ├── errorHandler.js
│   │   ├── validate.js
│   │   └── upload.js
│   │
│   ├── models/
│   │   └── Media.js
│   │
│   ├── utils/
│   │   ├── AppError.js
│   │   └── catchAsync.js
│   │
│   └── app.js
│
├── uploads/
├── .env
├── server.js
└── package.json
 

# **Optional Extension Challenges**

If you complete the lab early, try adding:

## **Additional Features**

- Multiple file uploads

- Cloud storage integration:

- Cloudinary

- AWS S3

- Authentication and authorization

- Image thumbnail generation

- Soft delete functionality

- Audit logging

|  |  |  |
| --- | --- | --- |
