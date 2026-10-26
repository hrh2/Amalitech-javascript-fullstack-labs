# Introduction to Backend Development

## Learning Objectives

Upon successful completion of this module, learners will be able to:

* Explain the client-server model and the role of a backend in a web application.
* Compare different backend technologies (e.g., Node.js, Python, Java) and their use cases.
* Describe the Node.js runtime, its event-driven architecture, and the event loop.
* Set up a local Node.js development environment with npm/yarn.

## Learning Approach

This module uses a Cognitive Apprenticeship model. It introduces learners to the new and abstract domain of backend
development. The self-paced materials provide the foundational "what" and "why," using analogies (like a restaurant's
kitchen) to bridge the gap from frontend to backend thinking.

The learning arc begins with core concepts (Understand), moves to comparing technologies (Analyze), and culminates in
setting up the practical environment (Apply).

Learners receive immediate feedback from formative quizzes. The final Summative Quiz is reviewed during the "Review
Session" to address common misconceptions and solidify understanding.

## Learning Activities

Live Session: Intro Session: Backend Development: An instructor-led session to introduce the client-server model and
demonstrate the role of a backend in a full-stack application.

Live Session: Review Session: Backend Development: An instructor-led review of all module topics to prepare learners for
the final quiz and answer outstanding questions.

Summative Quiz: A comprehensive quiz covering all learning objectives, including conceptual and scenario-based
questions.

## Module Structure

| Lesson / Section | Main Topic                          | Format                 | Learning Activity / Outcome                                        |
|------------------|-------------------------------------|------------------------|--------------------------------------------------------------------|
| 1                | The Client-Server Model             | Video + Reading        | Explain the request/response cycle and the role of an API.         |
| 2                | Backend Technology Landscape        | Video + Reading        | Compare Node.js with other runtimes, such as Python, Java, and Go. |
| 3                | Node.js Deep Dive                   | Video + Reading        | Describe the event loop, blocking vs. non-blocking I/O, and npm.   |
| 4                | Intro Session: Backend Development  | Instructor-led Session | Synthesize core concepts and demonstrate a simple server.          |
| 5                | Review Session: Backend Development | Instructor-led Session | Review key concepts and prepare for the summative assessment.      |
| 6                | Knowledge Check                     | Auto-graded Quiz       | Recall and identify core backend and Node.js concepts.             |
| 7                | Assessment                          | Summative Quiz         | Demonstrate understanding of all module                            |

## Learning Resources (Resource Book)

In this module, we shift focus from the client-side (Frontend) to the server-side (Backend). You will learn how to run JavaScript outside of the browser using Node.js, understand the event-driven architecture that makes it fast, and build your very first HTTP server to handle web requests.

### 1. Backend Fundamentals & Node.js Architecture
What exactly happens "on the server"? This section demystifies backend development and introduces the Node.js runtime.
* 📖 **Read:**
  * [Introduction to Node.js – Official Node.js Documentation](https://nodejs.org/en/learn/getting-started/introduction-to-nodejs)
  * Key takeaway: Understand that Node.js is a runtime environment for JavaScript, not a framework.
* 📺 **Watch:**
  * [Play Video CodeHelp](https://www.youtube.com/watch?v=fn9oKI9-TEs)
  * Context: A comprehensive overview of how the web works, the difference between client/server, and where Node.js fits in.

### 2. The Request-Response Cycle (HTTP)
The core of the web is the conversation between the client (Browser) and the server. Here, you will see how to handle that conversation using code.

* 📺 **Watch:**
  * [Play Video – The Net Ninja](https://www.youtube.com/watch?v=DQD00NAUPNk)
  * Context: This video dives into the http module, showing how to inspect incoming requests and formulate outgoing responses.

### 3. Hands-On Challenge: Your First Web Server
Apply your knowledge by initializing a project and creating a server from scratch.

* **Scenario:** You need to create a basic backend service that acknowledges a user's visit.

* **Prerequisites:** ensure Node.js is installed (node -v).

* **Tasks:**

    * Create a new folder named my-first-server.

    * Initialize the project using npm init -y to create a package.json.

    * Create a file named server.js.

    * Import the native http module.

    * Use http.createServer() to listen on port 3000.

    * Configure the response to send an HTTP 200 status and the text: "Hello, this is my first Node.js server!"

    * Run the server using node server.js and visit localhost:3000 in your browser.