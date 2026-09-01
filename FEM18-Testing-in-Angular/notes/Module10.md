# FEM18: Testing in Angular

## Learning Objectives

Upon successful completion of this module, learners will be able to:

* **Write** unit tests for Angular services and components using Jest.
* **Develop** end-to-end (E2E) tests for critical user flows using Cypress.
* **Apply** Test-Driven Development (TDD) principles to a development workflow.
* **Implement** mocks for services and dependencies to isolate units under test.
* **Test** asynchronous operations involving RxJS Observables within an Angular application.

## Learning Approach

This module uses a **Project-Based Learning (PBL)** approach. Testing is a practical discipline that requires hands-on
application. Learners will apply a comprehensive testing strategy to the "Kanban Task Management Web App" they have
built. This provides a realistic context for learning how to ensure code quality and application reliability using
**Jest**, a modern, efficient testing framework.

The module structure builds from testing small, isolated units of code (services and pipes) (Apply), to testing the
integration of components (Apply/Analyze). This mirrors a professional, layered testing strategy and encourages learners
to adopt a testing-first mindset.

Learners receive immediate feedback from their development environment. All final lab submissions are then reviewed by a
TA in a live code review session to provide expert feedback on code quality, architecture, and best practices.

## Learning Activities

* **Hands-on Coding Lab**: The core activity is the "Kanban Task Management Web App (Part V – Testing & Quality
  Assurance with Jest)." Learners will implement a robust testing suite, writing unit and integration tests for their
  Angular components, services, and pipes to ensure application reliability, maintainability, and scalability using
  Jest.
* **Formative Quiz**: An auto-graded quiz with multiple-choice questions focusing on the testing pyramid, Jest matchers,
  mocking strategies, and testing asynchronous code.

## Module Structure

| Lesson / Section | Main Topic                         | Format           | Learning Activity / Outcome                                                    |
|------------------|------------------------------------|------------------|--------------------------------------------------------------------------------|
| **1**            | **Testing Principles**             | Video + Reading  | Differentiate between unit, integration, and E2E testing.                      |
| **2**            | **Unit Testing with Jest**         | Reading + Video  | Configure Jest and write unit tests for services and components.               |
| **3**            | **Testing Asynchronous Code**      | Reading          | Implement tests for methods that return Observables.                           |
| **4**            | **Integration Testing Components** | Reading + Video  | Write integration tests for components, mocking services and dependencies.     |
| **5**            | **Knowledge Check**                | Auto-graded Quiz | Recall and identify key testing concepts and tool-specific syntax.             |
| **6**            | **Hands-On Lab**                   | Coding Lab       | Write a comprehensive test suite for the **"Kanban Task Management Web App"**. |

## Resource Book

### 1. Foundations of Angular Testing

Start with the official documentation and high-level concepts of testing in the Angular ecosystem.

* Articles / Reading:

    * [Testing | Angular.io](https://angular.io/guide/testing): The official documentation is the most important
      resource. It covers the fundamentals, utilities, and specific techniques for testing different parts of an Angular
      application.

* Video Resources:

    * [Play Video](https://www.youtube.com/watch?v=lbiOP-VLKGI)
      : This video provides a high-level overview of modern testing strategies in Angular, contrasting different types
      of tests.

    * [Play Video](https://www.youtube.com/watch?v=1GsUUP4A52E)
      : This video discusses recent improvements to Angular's testing framework, giving context to the modern tooling
      (like Jest).

### 2. Unit Testing Components & Services (Jest)

This section focuses on the "how-to" of writing unit tests, including handling dependencies (mocks) and asynchronous
(RxJS) code.

* Articles / Reading:
    * [Mastering Angular Unit Testing](https://javascript.plainenglish.io/mastering-angular-unit-testing-best-practices-and-tools-7591753681cb):
      Best Practices and Tools: This article dives into practical best practices for writing effective unit tests.
    * [Best Practices for Angular Unit Testing | Gorilla Logic](https://gorillalogic.com/blog-and-resources/best-practices-for-angular-unit-testing):
      Provides clear guidelines on what to test, how to test it, and how to **implement mocks for dependencies (LO 4)**.
    * (The [Official Angular Testing Guide](https://angular.io/guide/testing) is also the primary resource here, with
      specific sections on testing services, components, and handling **asynchronous operations (LO 5)**.)

### 3. End-to-End (E2E) Testing with Cypress

Learn how to test your application from a user's perspective using Cypress to automate real-world user flows.

* Articles / Reading:
    * [Testing Your App | Cypress.io Docs](https://docs.cypress.io/guides/end-to-end-testing/testing-your-app): The
      official Cypress documentation for E2E testing. This is the best place to learn how to write Cypress tests, select
      elements, and perform assertions.
    * [Advanced Angular Testing in 2025: Best Practices... | Medium](https://www.google.com/search?q=https://medium.com/%2540roshannavale7/advanced-angular-testing-in-2025-best-practices-for-robust-unit-and-e2e-testing-1a7e629e000b):
      This article discusses modern approaches and best practices for both unit and **E2E testing (LO 2)** in an Angular
      context.

### 4. Test-Driven Development (TDD) & Best Practices

Apply the principles of Test-Driven Development (TDD) and other best practices to improve your code quality and test
reliability.

* Articles / Reading:
    * (All the "Best Practices" articles listed in Section 2 apply here, as they inherently support the TDD
      "Red-Green-Refactor" mindset.)
      *[ Mastering Angular Unit Testing: Best Practices...](https://javascript.plainenglish.io/mastering-angular-unit-testing-best-practices-and-tools-7591753681cb):
      Following best practices is key to making TDD (LO 3) sustainable.
    * [Advanced Angular Testing in 2025: Best Practices... | Medium](https://www.google.com/search?q=https://medium.com/%2540roshannavale7/advanced-angular-testing-in-2025-best-practices-for-robust-unit-and-e2e-testing-1a7e629e000b):
      Advanced testing approaches often assume a TDD or BDD (Behavior-Driven Development) workflow.

### 5. Discussion Prompt

Explain the 'Red-Green-Refactor' cycle of Test-Driven Development (TDD). How does creating mocks (LO 4) support this TDD
process, especially when testing a component that depends on a service?

