# Testing: Angular Testing with Jest
## Introduction

In this lab, learners will extend their **Kanban Task Management Web App** by implementing a robust testing suite using **Jest**.

The focus is on writing **unit** and **integration** tests for Angular components, services, and pipes to ensure application reliability, maintainability, and scalability.

This lab encourages learners to adopt a **testing-first mindset** and follow Angular testing best practices using Jest's modern, efficient testing framework.

## Learning Objectives

By the end of this lab, learners should be able to:

- Explain the purpose and importance of testing in Angular applications.
- Differentiate between **unit** and **integration** testing.
- Set up and configure **Jest** as the testing framework for an Angular project.
- Use Angular's **TestBed** to create isolated test environments.
- Mock dependencies and services using **Jest mocks** or **spies**.
- Write and organize **unit tests** for components, services, and pipes.
- Handle asynchronous testing using **Jest fake timers** and **async utilities**.
- Analyze test results and measure code coverage effectively.
- Apply best practices for writing modular, testable, and maintainable Angular code.

## Lab Requirements

- Node.js (v18 or later)
- Angular CLI (latest version)
- Existing **Kanban Task Management Web App** project
- Jest and jest-preset-angular
- Code Editor (VS Code recommended)
- GitHub account

**Estimated Time:** 4–5 hours

## Lab Tasks

### Task 1: Testing Environment Setup

- Replace Jasmine and Karma with **Jest** as the testing framework.
- Ensure Jest runs successfully with existing tests.
- Review the folder structure for test files and confirm the default Jest configuration works.
- Discuss how Jest improves test speed, isolation, and developer workflow compared to traditional setups.

### Task 2: Component Testing Fundamentals

Identify key UI components (e.g., board list, task details, task form).

Write tests that confirm:
- Components initialize correctly.
- Inputs and outputs behave as expected.
- Template bindings reflect underlying data changes.
- UI elements update when component state changes.

Focus on validating component behavior rather than implementation details.

### Task 3: Testing Components with Dependencies

- Select a component that depends on injected services.
- Mock those services using **Jest mock functions** or **spyOn()**.
- Verify that methods in mocked services are called correctly and with proper arguments.
- Test component logic in response to service outputs (e.g., loading data, error handling).
- Confirm that the component can be tested in isolation from its dependencies.

### Task 4: Service Testing

Review services that manage logic, data, or state (e.g., BoardService, TaskService, or LoggingService).

Write isolated tests for core service methods. Validate that:
- Methods return expected values or observables.
- Business logic behaves correctly given different inputs.
- Error-handling logic executes as intended.

Use dependency injection within the test environment to manage mock services where required.

### Task 5: Pipe Testing

- Identify any custom pipes (e.g., for formatting task status, filtering, or dates).
- Write unit tests that verify input values transform correctly into expected outputs.
- Ensure edge cases (empty, null, or invalid inputs) are handled gracefully.
- Ensure that the pipe remains pure and predictable.

### Task 6: Asynchronous Testing

- Locate any asynchronous logic (e.g., setTimeouts, Observables, Promises).
- Test these using **Jest fake timers** or **async/await** utilities.
- Validate that asynchronous operations trigger the correct outcomes and state updates.
- Ensure the test waits for asynchronous tasks to complete before making assertions.

### Task 7: Integration Testing with TestBed

- Configure **TestBed** to simulate real Angular module behavior.
- Test interactions between components and services (e.g., data flow between task list and board components).
- Validate that service data updates reflect correctly in the component UI, observables and event emitters propagate data accurately, and shared state is synchronized across dependent components.
- Discuss how integration testing provides confidence in multi-part functionality.

### Task 8: Code Coverage & Quality Metrics

- Run Jest's built-in **coverage report** command to generate a summary.
- Analyze coverage metrics for statements, branches, functions, and lines.
- Identify files or modules needing additional coverage.
- Set minimum coverage thresholds for consistent quality tracking.
- Discuss how coverage metrics complement meaningful test writing.

### Task 9: Continuous Improvement

- Add a **testing section** to your project's README that explains how to run tests and view coverage.
- Establish conventions for naming and organizing test files.
- Encourage writing tests alongside new features (TDD or test-first mindset).
- Discuss how automated testing integrates into CI/CD workflows for continuous validation.

### Bonus Task (Optional): Snapshot Testing

- Implement **Jest snapshot tests** for visual or structural consistency in UI components.
- Capture component render output and compare it across test runs.
- Use snapshots to detect unintended UI regressions during refactors.

## Assessment Criteria

| Criteria | Weight | Description |
|---|---|---|
| Component Testing | 30% | Well-structured and meaningful component test coverage. |
| Service & Pipe Testing | 25% | Effective isolation and validation of core logic and data flow. |
| Asynchronous & Integration Testing | 20% | Proper handling of async operations and multi-part interactions. |
| Code Coverage & Quality | 15% | Strong test coverage with clear metrics and organized files. |
| Testing Best Practices | 10% | Clean, maintainable test organization following Jest and Angular conventions. |

## Lab Deliverables

- Completed **test suite** using Jest for components, services, and pipes.
- Jest coverage report showing high code coverage and test quality.
- GitHub repository with updated commits and test documentation in README.
- Consistent test structure demonstrating modular and maintainable practices.
