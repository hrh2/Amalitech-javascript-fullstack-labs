# Services & Dependency Injection: Dessert Shop App
## Introduction

In this lab, learners will extend their **Dessert Shop App** by introducing **Angular Services** and applying **Dependency Injection (DI)** principles.

They will refactor existing logic into reusable services, understand the role of injectable classes and providers, and manage shared state across components using Angular's DI system.

By completing this lab, learners will demonstrate the ability to organize application logic for improved maintainability, scalability, and separation of concerns.

## Learning Objectives

By the end of this lab, learners should be able to:

- Explain the concept and purpose of Angular services.
- Create and organize custom services to handle reusable logic.
- Define injectable classes using the @Injectable() decorator.
- Inject services into components or other services using Angular's DI system.
- Differentiate between singleton and multiple-instance service scopes.
- Apply best practices such as separation of concerns, encapsulation, and reusability.
- Demonstrate how services can be used for shared state management and utility operations.

## Lab Requirements

- Node.js (v18 or later)
- Angular CLI (latest version)
- Existing **Dessert Shop App** project from the previous module
- Code Editor (VS Code recommended)
- GitHub account
- Netlify or Vercel account for deployment

**Estimated Time:** 5 hours

## Lab Tasks

### Task 1: Review and Identify Shared Logic

- Open the existing Dessert Shop App project.
- Review where logic is duplicated or embedded directly within components.
- Identify parts of the application that should be moved into services for cleaner separation of concerns.
- Confirm the project runs successfully before refactoring.

### Task 2: Create and Configure Core Services

- Create a service dedicated to managing cart-related functionality.
- Move existing cart logic (adding, removing, clearing items) into this service.
- Inject and use the service within relevant components to centralize cart operations.
- Confirm the cart features continue to function correctly after refactoring.

### Task 3: Create a Product Service

- Create a separate service to handle product-related operations such as filtering, sorting, or formatting.
- Inject the service into components that display or process product data.
- Ensure the product logic is reusable and well-structured.

### Task 4: Understand and Apply Dependency Injection

- Explore how Angular automatically provides services through its DI system.
- Review the purpose of the @Injectable() decorator and the `providedIn` property.
- Discuss the difference between singleton and multiple-instance service scopes.
- Demonstrate how service providers can be registered at different levels (root, module, component).

### Task 5: Create a Shared Utility Service

- Develop a utility service that provides general-purpose methods used throughout the application.
- Use it for recurring operations such as data formatting or calculations.
- Integrate it into relevant components to simplify their logic and promote reuse.

### Task 6: Logging and State Management

- Develop a logging service to track actions, errors, or user activities across the app.
- Use services to maintain shared application state such as cart totals or item counts.
- Discuss how service-based state management improves performance and maintainability.

### Task 7: Testing and Validation

- Verify that all created services are properly injected and functional.
- Ensure that logic previously inside components now resides in appropriate services.
- Confirm consistent behavior across the application and successful project build with no errors.

### Task 8: Deployment

- Stage, commit, and push all updates to your GitHub repository.
- Redeploy the updated project using your chosen hosting platform (Netlify or Vercel).
- Record the live application URL for submission.

### Bonus Task (Optional): Local Storage Integration

Enhance the cart functionality by using **local storage** to persist data between sessions.

- Store cart items when changes occur.
- Load existing cart data when the app starts.
- Allow users to clear stored data when needed.

## Assessment Criteria

| Criteria                    | Weight  | Description                                                           |
|-----------------------------|---------|-----------------------------------------------------------------------|
| Service Implementation      | 25%     | Services created and used appropriately for shared or reusable logic. |
| Dependency Injection        | 25%     | Correct use of Angular's DI system and provider configuration.        |
| Separation of Concerns      | 20%     | Components delegate logic effectively to services.                    |
| Reusability & Scalability   | 20%     | Code structure supports reuse and maintainability.                    |
| Code Quality & Organization | 10%     | Clear naming conventions, consistency, and structure.                 |

## Lab Deliverables

- Refactored **Dessert Shop App** integrating Angular services.
- Public GitHub repository with updated commits and documentation.
- Deployed live application URL.
