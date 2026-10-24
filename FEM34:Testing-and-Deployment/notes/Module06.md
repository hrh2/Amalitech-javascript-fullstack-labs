# Testing & Deployment

## Learning Objectives

By the end of this module, you will be able to:

* Test APIs manually using Postman and automate flows.
* Write unit and integration tests with Jest and Supertest.
* Configure environment variables (.env) for safe development and production.
* Use Git and GitHub for version control.
* Deploy Node.js applications to Vercel (or Render).
* Manage application logs and monitor live deployments.

## Learning Approach

This module uses a Project-Based Learning (PBL) approach. It serves as the capstone for the curriculum, answering the
final question: "How do I get my application on the internet?" The module focuses on two modern, essential skills:
containerization and cloud deployment.

The learning arc moves from conceptual understanding (What is Docker?) (Understand) to practical application (Writing a
Dockerfile) (Apply), and finally to a full, integrated deployment of their multi-service application (Create).

Active practice is centered on the "Deploying the API" lab. Learners receive immediate feedback from their Docker builds
and cloud deployment logs. All final lab submissions are then reviewed by a TA in a live code review session to provide
expert feedback on code quality, architecture, and best practices. 

## Learning Resources (Resource Book)

### 1. API Testing & Automation
Before writing code tests, learn how to verify your API behaves as expected from a user's perspective.

* 📺 Watch:
  * [Play Video – Fireship](https://www.youtube.com/watch?v=uEVmD6n8Il0)
  * (Note: The linked video is "7 Ways to Deploy", but for Postman, search for "Postman Beginner's Course" or similar if the link was mismatched. Correction: The provided link uEVmD6n8Il0 is actually "7 Ways to Deploy". Please use the correct Postman resource below.)
  * Recommended Search: "Postman API Testing for Beginners"

* 📺 Watch:
  * [Play Video – Sam Meech-Ward](https://www.youtube.com/watch?v=FKnzS_icp20)
  * Context: This is the critical video for this section. It covers setting up Jest and Supertest to automatically test your Express routes.

* 📖 Read:
  * [Using Node.js Test Runner](https://nodejs.org/en/learn/test-runner/using-test-runner) – Node.js Official Docs
  * Key takeaway: Node.js now has a built-in test runner. It's good to know it exists as a lightweight alternative to Jest.


### 2. Deployment Strategies
How do you get your code from localhost to https://myapp.com?

* 📺 Watch:
  * Play Video – Fireship
  * Context: A high-level overview of options (VPS, Serverless, Containers) to help you choose the right path.

* 📺 Watch:
  * [Play Video – Lets build together ](https://www.youtube.com/watch?v=IeM1PGqmJT4)
  * Context: A step-by-step guide to deploying Express apps specifically to Vercel, which is great for beginners.

* 📖 Read:
  * [Deploy Node Express App to Render](https://render.com/docs/deploy-node-express-app) – Render Docs 
  * Alternative: If Vercel doesn't suit your needs, Render is another excellent free-tier option for Node.js.

### 3. Logging & Monitoring
Once your app is live, how do you know if it breaks?

* 📺 Watch:
  * [Play Video – The Git Guild](https://www.youtube.com/watch?v=WZaKrzVeaO4)
  * Context: Moving beyond console.log to structured logging that helps you debug production issues.
### 4. Hands-On Challenge: The "CI/CD" Pipeline
Simulate a professional workflow: Write a test, push the code, and see it go live.

* Scenario: You have a simple API. You need to ensure it doesn't break before deploying it.
* Prerequisites: GitHub account, Vercel account, Node.js installed.
* Tasks:
  * Write a Test: In your previous "Task Manager" or "Product API" project, install jest and supertest. Write a test for GET /health that expects a 200 OK status.
  * Version Control: Initialize a git repo, create a .gitignore (exclude node_modules and .env), and push your code to a public GitHub repository.
  * Deploy: Connect your GitHub repo to Vercel. Add your environment variables (like MONGO_URI) in the Vercel dashboard settings. 
  * Verify: After deployment, visit your live URL (e.g., https://my-api.vercel.app/health) to see if it works.