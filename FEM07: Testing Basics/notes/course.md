# FEM07: Testing Basics

## Learning Objectives

Upon successful completion of this module, learners will be able to:

* Differentiate between unit, integration, and end-to-end testing and their respective use cases.
* Write effective unit tests for JavaScript functions using the Jest testing framework.
* Implement integration tests to verify the interactions between multiple software components.
* Apply Test-Driven Development (TDD) principles to write tests before application code.
* Configure a testing environment for a front-end application, including setting up and running tests.

## Learning Approach

This module adopts a **Cognitive Apprenticeship** approach. Testing is a discipline that involves a specific mindset and workflow. Learners are first introduced to the theory and structure of tests through readings and video examples, where experts model how to think about and write effective tests.

The learning path starts with the fundamental "what" and "why" of testing (Understand). It quickly moves to the practical application of writing unit tests for isolated functions (Apply). The complexity increases as learners are required to test the integration between different parts of an application. The final lab requires them to apply a Test-Driven Development (TDD) workflow, a key professional practice (Apply/Analyze).

Active practice is centered on the hands-on lab where learners write a suite of tests for an existing project. Learners receive immediate feedback from their development environment. All final lab submissions are then reviewed by a TA in a live code review session to provide expert feedback on code quality, architecture, and best practices.

## Learning Activities

* **Hands-on Coding Lab:** The core activity is the "Task Manager API Client - Testing with Jest." Learners will write a full suite of unit tests for the JavaScript logic created in the "Task Manager API Client" lab (Module 3). This will involve testing data manipulation functions and, crucially, mocking the fetch API to write integration tests for the API client module.
* **Formative Quiz:** An auto-graded quiz with multiple-choice questions to test understanding of testing types, Jest's API (describe, it, expect), and the TDD workflow.

## Module Structure

| Lesson / Section | Main Topic | Format (video, reading, exercise, live session) | Learning Activity / Outcome |
|---|---|---|---|
| 1 | Introduction to Software Testing | Video + Reading | Explain the importance of testing and describe the different levels of the testing pyramid. |
| 2 | Getting Started with Jest | Reading + Video | Set up a Jest testing environment and write basic assertions. |
| 3 | Unit & Integration Testing | Reading | Implement unit tests for individual functions and integration tests for component interactions. |
| 4 | Introduction to TDD | Reading | Describe the Red-Green-Refactor cycle of Test-Driven Development. |
| 5 | Knowledge Check | Auto-graded Quiz | Recall and identify key testing concepts, Jest syntax, and TDD principles. |
| 6 | Hands-On Lab | Coding Lab | Write a comprehensive test suite for the "Task Manager API Client" JavaScript logic. |

## Resource Book

### 1. Understanding Testing Concepts 🧐
Start with the foundational concepts: why we test and the different levels of testing.

* Article: Why test? | Jest Documentation

    * This official Jest documentation explains the core motivations behind writing tests, emphasizing benefits like preventing regressions, improving code quality, and enabling confident refactoring.

    * [Link](https://jestjs.io/docs/getting-started#why-test)

* Article: What is Unit Testing? | AWS

    * This AWS article defines unit testing as testing individual, isolated components or units of code. It helps clarify the scope and purpose of the most fundamental testing level.

    * [Link](https://aws.amazon.com/what-is/unit-testing/#:~:text=Unit)

* Video: Unit Testing vs Integration Testing vs End to End Testing by Continuous Delivery

    * This video provides a clear visual explanation and comparison of the three main levels of software testing: Unit Testing (testing individual pieces), Integration Testing (testing how pieces work together), and End-to-End Testing (testing the complete user workflow). Understanding these distinctions is crucial for building a solid testing strategy.
    * [Video Youtube](https://www.youtube.com/watch?v=IPiUDhwnZxA)

### 2. Getting Started with Jest 

Learn how to use Jest, a popular JavaScript testing framework, to write and run your unit tests.

* Video: Jest Crash Course - Unit Testing in JavaScript by Traversy Media 

    * This video serves as a practical introduction to Jest. It covers setting up Jest, writing basic unit tests for JavaScript code, using matchers for assertions, and running tests.
    * [Play Video](https://www.youtube.com/watch?v=7r4xVDI2vho)
* Video: Jest Crash Course by freeCodeCamp.org

    * Another excellent crash course focusing on getting started with Jest for unit testing in JavaScript, covering setup, writing tests, matchers, and common patterns.
    * [Play Video](https://www.youtube.com/watch?v=IPiUDhwnZxA)

### 3. Test-Driven Development (TDD) 🔄
Explore the TDD approach where tests are written before the actual code.

* Article: What is Test Driven Development (TDD)? | BrowserStack

    * This guide explains the Test-Driven Development (TDD) methodology, detailing its Red-Green-Refactor cycle (write a failing test, write code to pass, refactor). It covers the benefits of TDD, such as improved design and code quality.
    * [Link](https://www.browserstack.com/guide/what-is-test-driven-development)

### 4. Discussion Prompt
What are the key differences between Unit, Integration, and End-to-End tests in terms of scope, speed, and what they aim to verify? Why is having a mix of these test types (often visualized as a 'testing pyramid') generally recommended?