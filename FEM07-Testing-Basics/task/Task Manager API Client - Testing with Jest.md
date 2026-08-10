# Testing Basics: Task Manager API Client
## Learning Objectives

· Testing Fundamentals: Understand the differences between unit, integration, and end-to-end testing and when to apply each type of testing.

· Unit Testing with Jest: Write comprehensive unit tests for functions, classes, and modules using Jest testing framework.

· Mocking & Spying: Use mocks, spies, and stubs to isolate code behavior and test components independently.

· Test-Driven Practices: Understand test runners, assertions, test organization, and code coverage reporting.

· Debugging with Tests: Use tests to identify bugs, verify fixes, and prevent regression issues.

---

## Introduction

You will add comprehensive testing to your previously built Task Manager API Client using Jest. This lab focuses on writing unit tests for individual functions and classes, integration tests for modules working together, and using mocks/spies to isolate external dependencies like API calls. You'll structure tests properly, achieve good code coverage, and use testing to improve code quality.

---

## Project Setup

### 1. Install and Configure Jest:

· Install Jest as a development dependency

· Configure Jest in package.json with appropriate test scripts:

o Standard test run

o Watch mode for development

o Coverage report generation

· Set Jest environment to Node.js

· Configure coverage directory and files to collect coverage from

---

### 2. Create Test Directory Structure:

```
tests/ ├── unit/ # Unit tests for individual functions/classes ├── integration/ # Integration tests for modules working together └── __mocks__/ # Mock implementations of modules
```

---

### 3. Verify Setup:

· Create a simple test to verify Jest is working correctly

· Run the test suite to confirm configuration

---

## Tasks

### 1. Unit Testing - Model Classes (30% of tests)

#### A. Test the Task Class:

Write tests that cover:

· Constructor initialization with all properties

· The toggle() method for changing completion status

· The getStatus() method returning correct status strings

· The isOverdue() method with various date scenarios

· Edge cases: null values, undefined properties, empty strings

· Invalid input handling

Requirements:

· Minimum 8 test cases for Task class

· Use beforeEach() for test setup

· Group related tests using describe() blocks

· Test both successful operations and error conditions

---

#### B. Test the PriorityTask Class:

Write tests that cover:

· Inheritance from Task class

· Priority-specific properties (priority level, due date)

· Overridden methods that include priority information

· Date comparison logic for determining overdue status

· Priority level validation

· Integration with parent class methods

Requirements:

· Minimum 6 test cases for PriorityTask class

· Verify inheritance behavior

· Test all priority-specific functionality

---

#### C. Test the User Class:

Write tests that cover:

· Adding tasks to user

· Calculating completion rate with various task combinations

· Handling empty task arrays

· Filtering tasks by status (completed/pending)

· Edge cases: division by zero, empty arrays, null tasks

Requirements:

· Minimum 7 test cases for User class

· Test all public methods

· Cover edge cases thoroughly

---

### 2. Unit Testing - Utility Functions (25% of tests)

#### A. Test Data Processing Functions:

Write comprehensive tests for:

· filterByStatus() - filtering tasks by completion status

· calculateStatistics() - generating task statistics

· groupByUser() - grouping tasks by user ID

· searchByProperty() - searching items by property value

· sortBy() - sorting with ascending/descending order

Requirements for Each Function:

· Test with valid data

· Test with empty arrays

· Test with null/undefined inputs

· Test with invalid parameters

· Test edge cases specific to each function

· Minimum 5 test cases per function

---

#### B. Test Array Manipulation Functions:

Write tests for generic utility functions:

· Filtering functions

· Mapping functions

· Reduce operations

· Search algorithms

· Sorting algorithms

Requirements:

· Test return value correctness

· Test that original arrays are not mutated (if applicable)

· Test performance with large datasets (optional)

---

### 3. Integration Testing with Mocks (25% of tests)

#### A. Create Mock for API Client:

Create a mock implementation in tests/**mocks**/api.js:

· Mock data for users

· Mock data for todos

· Mock implementations of all API methods

· Return Promises that resolve with mock data

---

#### B. Test API Integration:

Write integration tests for the APIClient:

· Mock the global fetch function

· Test fetchUsers() method

· Test fetchTodos() method

· Test fetchUserTodos() method with specific user ID

· Verify correct API endpoints are called

· Test error handling for network failures

· Test handling of non-OK HTTP responses (404, 500, etc.)

· Test response parsing

Requirements:

· Use jest.fn() to create mock functions

· Use mockResolvedValue() and mockRejectedValue()

· Verify fetch was called with correct URLs

· Test both success and failure scenarios

· Minimum 10 integration test cases

---

#### C. Test Data Flow Integration:

Write tests that combine multiple modules:

· Fetch data from mocked API

· Transform data using processing functions

· Create model instances from API data

· Verify complete workflows from API call to final output

Requirements:

· Test at least 3 complete workflows

· Mock external dependencies

· Verify data transformations at each step

---

### 4. Testing with Spies (15% of tests)

#### A. Test Functions That Call Other Functions:

Use Jest spies to verify:

· Internal method calls within classes

· Calls to Array methods (filter, map, sort, reduce)

· Calls to console methods (log, error, warn)

· Number of times functions are called

· Arguments passed to function calls

Requirements:

· Use jest.spyOn() to create spies

· Verify functions were called with correct arguments

· Verify call counts

· Restore spies after tests using mockRestore()

· Minimum 6 test cases using spies

---

#### B. Test Logging and Side Effects:

Write tests that use spies to verify:

· Console logging behavior

· Error logging

· Warning messages

· Function call sequences

Requirements:

· Mock console methods to prevent actual output during tests

· Verify log messages contain expected information

· Clean up mocks after each test

---

### 5. Error Handling Tests (5% of tests)

Write tests specifically for error scenarios:

· Invalid constructor arguments

· Null and undefined inputs

· Type mismatches

· Boundary conditions

· API failures

· Data validation failures

Requirements:

· Use expect().toThrow() for error assertions

· Test specific error messages

· Verify graceful degradation

· Minimum 8 error handling test cases

---

### 6. Test Coverage Requirements

Achieve Minimum Coverage Targets:

· Overall Code Coverage: 80% minimum

· Statement Coverage: 80% minimum

· Branch Coverage: 75% minimum

· Function Coverage: 85% minimum

· Line Coverage: 80% minimum

---

### Coverage Analysis:

· Run coverage report

· Identify uncovered lines

· Write additional tests to improve coverage

· Document any intentionally uncovered code with justification

---

## Test Organization Requirements:

### File Organization:

· One test file per source file

· Clear naming convention: filename.test.js

· Group related tests with describe() blocks

· Logical test ordering (simple to complex)

---

### Test Structure:

· Use beforeEach() and afterEach() for setup/teardown

· Use beforeAll() and afterAll() where appropriate

· Clear, descriptive test names that explain what is being tested

· One logical assertion per test (or closely related assertions)

---

### Test Quality:

· Each test should be independent and not rely on other tests

· Tests should be deterministic (same result every run)

· Mock external dependencies to ensure test isolation

· Clean up resources after tests

---

## Evaluation Criteria

Criteria Score Description

Unit Test Coverage 30% Comprehensive unit tests for all functions, classes, and methods. Tests cover normal cases, edge cases, and error scenarios. Minimum 80% code coverage achieved.

Integration Testing 25% Successfully writes integration tests that verify modules work together correctly. Proper use of mocks to isolate external dependencies. Tests complete data workflows.

Mocking & Spying 25% Effectively uses Jest mocks and spies to isolate code behavior. Demonstrates understanding of when and how to mock dependencies. Properly manages mock lifecycle.

Test Organization & Quality 15% Well-organized test files with clear structure. Descriptive test names. Proper use of Jest features (describe, beforeEach, afterEach). Tests are independent and maintainable.

Understanding Testing Types 5% Demonstrates clear understanding of unit vs integration testing through proper test implementation and documentation.

---

## Deliverables

### 1. Test Files (Minimum Required):

· tests/unit/models.test.js - Tests for Task, PriorityTask, and User classes

· tests/unit/taskProcessor.test.js - Tests for data processing functions

· tests/unit/utils.test.js - Tests for utility functions with spies

· tests/integration/api.test.js - API integration tests with mocks

· tests/integration/dataFlow.test.js - Complete workflow tests

Minimum Test Count:

· Total: 60+ test cases

· Unit tests: 40+ test cases

· Integration tests: 15+ test cases

· Tests using spies: 5+ test cases

---

### 2. Mock Files:

· tests/**mocks**/api.js - Mock implementation of API client with sample data

---

### 3. Test Coverage Report:

· Run coverage report and ensure 80% minimum coverage

· Include screenshot of coverage summary in documentation

· Document any areas below 80% with explanation

---

### 4. TESTING_DOCUMENTATION.md:

Create comprehensive testing documentation including:

### Testing Strategy Section:

· Explanation of your overall approach to testing

· Why you chose specific testing strategies

· How you decided what to test

---

### Test Types Implemented Section:

· Unit Tests:

o List of all classes and functions tested

o Key test cases and scenarios covered

o Rationale for test selection

· Integration Tests:

o List of module interactions tested

o Explanation of mocking strategy

o Complete workflows tested

· Mocks & Spies:

o What external dependencies were mocked

o What function calls were spied on

o Justification for mocking decisions

---

### Test Coverage Analysis Section:

· Screenshot of coverage report

· Overall coverage percentage

· Analysis of areas with low coverage

· Actions taken to improve coverage

· Any intentionally uncovered code with justification

---

### Challenges & Solutions Section:

· Minimum 3 challenges encountered during testing

· Detailed explanation of how each challenge was resolved

· Lessons learned from each challenge

---

### Key Learnings Section:

· What you learned about unit testing

· What you learned about integration testing

· What you learned about mocking and spying

· How testing improved your code quality

· Best practices discovered

---

### Differences Between Test Types Section:

· Clear explanation of unit vs integration vs E2E testing

· When to use each type of test

· Examples from your project illustrating each type

---

## 5. All Tests Must Pass:

· Run npm test - all tests should pass with no failures

· No skipped tests unless documented with valid reason

· No test warnings or errors in console output

---

## 6. Updated package.json:

· Proper Jest configuration

· Test scripts for running tests, watch mode, and coverage

· All necessary dependencies listed

---

## Submission Checklist:

· [ ] Jest installed and configured correctly

· [ ] Test directory structure created properly

· [ ] Minimum 60 test cases written and passing

· [ ] 80%+ code coverage achieved

· [ ] All unit tests for classes completed

· [ ] All unit tests for utility functions completed

· [ ] Integration tests with proper mocking completed

· [ ] Spy tests implemented

· [ ] Error handling tests implemented

· [ ] Mock files created

· [ ] Coverage report generated

· [ ] TESTING_DOCUMENTATION.md completed with all required sections

· [ ] All tests pass without failures

· [ ] Code follows test organization requirements

· [ ] Repository contains all test files
