# FEM17: HTTP & APIs

## Learning Objectives

Upon successful completion of this module, learners will be able to:

* **Explain** the principles of the REST architectural style and the structure of HTTP requests and responses.
* **Integrate** the HttpClient service to perform GET, POST, PUT, and DELETE requests to a remote API.
* **Implement** centralized error handling for API requests using RxJS operators.
* **Construct** and manipulate HTTP headers to send authentication tokens and other metadata.
* **Analyze** network requests and responses using browser developer tools for debugging purposes.

## Learning Approach

This module follows a **Project-Based Learning (PBL)** model. Interacting with APIs is a fundamental, hands-on skill in
web development. Learners will first be introduced to the theoretical concepts of HTTP and REST through readings and
videos. They will then immediately apply this knowledge by connecting their front-end "**Kanban Task Management Web
App**" to a live backend API.

The learning process moves from understanding the concepts (What is an API?) to applying them in code (Making a GET
request) and finally to creating a fully integrated system that performs all CRUD (Create, Read, Update, Delete)
operations, a key real-world task (Create). This emphasizes separation of concerns by placing all API logic within
reusable services.

Learners receive immediate feedback from their development environment. All final lab submissions are then reviewed by a
TA in a live code review session to provide expert feedback on code quality, architecture, and best practices.

## Learning Activities

* **Live Session:** Understanding APIs: An instructor-led session where learners will analyze and interact with a live
  API (e.g., using Postman or browser tools), demonstrating the full HTTP request/response cycle and RESTful principles.
* **Hands-on Coding Lab**: T he core activity is the "Kanban Task Management Web App (Part III – HTTP & API
  Integration)."
  Learners will extend their app to interact with an external or mock API using HttpClient. They will implement data
  retrieval, creation, updating, and deletion of tasks and boards, connecting their front-end to a backend data source
  and building a reusable service architecture with robust error handling.
* **Formative Quiz**: An auto-graded quiz with multiple-choice questions focusing on REST principles, HTTP verbs (GET,
  POST, etc.), common status codes, and the syntax for using Angular's HttpClient.

## Module Structure

| Lesson / Section | Main Topic                    | Format                 | Learning Activity / Outcome                                                     |
|------------------|-------------------------------|------------------------|---------------------------------------------------------------------------------|
| **1**            | **The Web & HTTP**            | Video + Reading        | Describe the request/response cycle and the structure of HTTP messages.         |
| **2**            | **Introduction to REST APIs** | Reading + Video        | Explain the constraints of REST and how to interact with a RESTful API.         |
| **3**            | **Angular's `HttpClient`**    | Reading                | Perform CRUD operations using the `HttpClient` service.                         |
| **4**            | **Error Handling & Headers**  | Reading                | Implement global error handling with `catchError` and add custom headers.       |
| **5**            | **Understanding APIs**        | Instructor-led Session | Analyze and interact with a live API, demonstrating the request/response cycle. |
| **6**            | **Knowledge Check**           | Auto-graded Quiz       | Recall and identify key HTTP methods, status codes, and `HttpClient` syntax.    |
| **7**            | **Hands-On Lab**              | Coding Lab             | Connect the **"Kanban Task Management Web App"** to a live REST API.            |

## Resource Book

### 1. Foundations: REST and HTTP Principles

Before writing code, understand the concepts of RESTful APIs and the HTTP protocol that powers them.

* **Articles / Reading**:
    * **REST (Glossary) | MDN**: A concise definition of REST (Representational State Transfer) and its core
      constraints, such as statelessness and client-server
      architecture. [Link](https://developer.mozilla.org/en-US/docs/Glossary/REST)
    * **HTTP Messages | MDN**: Details the structure of HTTP requests and responses, explaining request methods (GET,
      POST), status codes, headers, and the message
      body. [Link](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Messages)

### 2. Implementing Angular's HttpClient Service

Learn how to set up and use Angular's built-in HttpClient to perform API requests within an injectable service.

* **Articles / Reading**:

    * **Communicating with backend services using HTTP | Angular.io**: The official guide. This is the most critical
      resource for learning how to set up HttpClientModule and inject the HttpClient service to make
      requests. [Link](https://angular.io/guide/http)

    * **Using HttpClient in Modern Angular Applications | thisdot.co**: A practical guide on modern best practices for
      using HttpClient. [Link](https://www.thisdot.co/blog/using-httpclient-in-modern-angular-applications)

    * **Angular HTTP Client - A Complete Guide | Angular University**: A comprehensive crash course covering setup, GET
      requests, error handling, and more. [Link](https://blog.angular-university.io/angular-http/)

* **Video Resources**:

    * **Angular 19 Tutorial #49 Call REST API with Services (34 min)**: A practical tutorial demonstrating how to fetch
      data from a REST API using a service.
        * [Play Video](https://www.youtube.com/watch?v=ZmH3DKkahLE)

    * **Play Video Angular 20 Tutorial for Beginners | GET API call integration (21 min)**: A very recent, step-by-step
      guide on making your first GET request.

        * [Play Video](https://www.youtube.com/watch?v=FTEo---NobQ)

### 3. Advanced Techniques: Error Handling, Headers & Modern Patterns

Move beyond basic requests to handle real-world scenarios like authentication (headers), error management, and modern
reactive patterns with Signals.

* **Articles / Reading**:
    * **Angular HTTP (Error Handling & Headers) | Angular University**: This guide provides specific sections on
      implementing centralized error handling (LO 3) using RxJS operators (like catchError) and manipulating HTTP
      headers (LO 4) (e.g., for Authorization). [Link](https://blog.angular-university.io/angular-http/)
    * **Transforming HTTP API calls with Signals | Medium**: An advanced article on integrating HttpClient with
      Angular's new reactive primitive,
      Signals. [Link](https://balramchavan.medium.com/angular-19-transforming-http-api-calls-with-signals-and-resources-ce09c8ba4af1)
* **Video Resources**:
    * **Mastering API Calls In Angular With A Reusable Service (15 min)**: This video is key for LO 3 & 4. It
      demonstrates how to build a scalable service that encapsulates logic, likely including centralized error handling
      and setting common headers.
        * [Play Video](https://www.youtube.com/watch?v=kqHFDvnjbcw)

### 4. Debugging: The Browser Network Tab

Learn how to use your browser's built-in tools to inspect and debug your API calls.

* Articles / Reading:
* Inspect network activity in Chrome DevTools | Chrome Developers: The official guide on how to use the Network panel to
  monitor requests, inspect headers, check response payloads, and analyze status
  codes. [Link](https://developer.chrome.com/docs/devtools/network)
* Video Resources:
    * How To Use The Network Tab in Chrome Developer Tools (11 min): A visual walkthrough demonstrating the key features
      of the Network tab for debugging API requests.
        * [Play Video](https://www.youtube.com/watch?v=e1gAyQuIFQo)

### 5. Discussion Prompt

Why is it considered a best practice to put all your HttpClient logic into a separate, injectable service instead of
calling it directly from the component?