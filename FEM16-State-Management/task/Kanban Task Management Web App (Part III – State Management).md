# State Management: Management Web App
## Introduction

In this lab, learners will extend the **Kanban Task Management Web App** by implementing **state management** to maintain consistent data flow across the application.

They will explore the difference between **local component state** and **global application state**, apply service-based state management using RxJS subjects, and integrate **NgRx** for structured global state handling.

This lab focuses on building scalable, maintainable, and predictable data management patterns for modern Angular applications.

## Learning Objectives

By the end of this lab, learners should be able to:

- Explain the concept of application state and its importance.
- Differentiate between **local state** (within components) and **global state** (shared across the app).
- Use Angular services with **BehaviorSubject** or **ReplaySubject** to manage shared state.
- Understand key **NgRx** concepts — Store, Actions, Reducers, Selectors, and Effects.
- Implement a simple **NgRx store** to manage tasks or boards in the Kanban app.
- Organize state files and feature modules following best practices.
- Debug state using **NgRx DevTools** and monitor state transitions.
- Evaluate when to use service-based vs NgRx-based state management based on project needs.

## Lab Requirements

- Node.js (v18 or later)
- Angular CLI (latest version)
- Existing **Kanban Task Management Web App** project (from HTTP & API Integration module)
- Code Editor (VS Code recommended)
- GitHub account
- Netlify or Vercel account for deployment
- NgRx libraries installed

**Estimated Time:** 5–6 hours

## Lab Tasks

### Task 1: Review and Define Application State

- Review the current application and identify areas where state is managed locally within components (e.g., task lists, active boards).
- Define what data should be treated as **global state** and shared across the app (e.g., user boards, selected tasks, app settings).
- Discuss the benefits of centralizing state for maintainability and scalability.

### Task 2: Implement Service-Based State Management

- Use an existing or new Angular service to manage shared application state.
- Replace direct component-level data handling with service-managed state using observables.
- Introduce **BehaviorSubject** or **ReplaySubject** to store and stream reactive data.
- Ensure that components subscribe to and update this shared state consistently.
- Validate that changes in one component reflect accurately across the app.

### Task 3: Transition to NgRx Store

- Introduce the **NgRx** library for global application state management.
- Configure the NgRx Store in the project and connect it to the root module.
- Create a simple feature store (e.g., Task Store or Board Store) to manage data retrieved from the API.
- Replace service-based state (where appropriate) with store-managed data flow.
- Confirm that the store updates and shares state consistently across all views.

### Task 4: Define Actions and Reducers

- Identify the main **actions** that represent user or system events (e.g., Load Boards, Add Task, Update Task, Delete Task).
- Create **reducers** to determine how the application state should change in response to each action.
- Organize actions and reducers in a feature-specific state folder.
- Test that dispatched actions result in expected state updates.

### Task 5: Create and Use Selectors

- Define **selectors** to extract and derive specific slices of state (e.g., get all tasks, get selected board).
- Use selectors in components to access state efficiently and keep presentation logic minimal.
- Verify that selectors provide accurate, updated data as state changes occur.

### Task 6: Manage Side Effects with Effects

- Introduce **NgRx Effects** to handle asynchronous operations such as fetching or updating data from the API.
- Define effects that listen for specific actions and trigger corresponding API calls.
- Ensure that successful responses or errors update the state through additional actions.
- Review the data flow pattern from action → effect → reducer → component.

### Task 7: Debugging and DevTools

- Install and configure **NgRx DevTools** for runtime debugging.
- Monitor action dispatches and state transitions in real time.
- Inspect the sequence of actions and confirm that the state updates predictably.
- Discuss how DevTools improve traceability and performance debugging in complex applications.

### Task 8: Optimize and Organize State

- Refactor and organize state files following the best modular structure (e.g., store/actions, store/reducers, store/selectors).
- Explore using NgRx **EntityAdapter** to simplify handling of collections like tasks or boards.
- Evaluate whether to combine or separate feature states (e.g., board, task, user).
- Ensure state organization aligns with Angular's feature module architecture.

### Task 9: Testing and Verification

- Verify that all state interactions (load, add, update, delete) work as expected.
- Confirm that data consistency is maintained across components and routes.
- Check that effects trigger appropriate API calls and reducers update the store correctly.
- Validate that DevTools accurately reflect all state transitions.

### Task 10: Deployment

- Commit and push the updated project to GitHub with clear commit messages.
- Redeploy the application to Netlify or Vercel.
- Verify that state management continues to function correctly in the deployed environment.

### Bonus Task (Optional): Hybrid State Strategy

- Combine service-based and NgRx-based state management where appropriate (e.g., NgRx for boards, service-based for UI state).
- Discuss trade-offs between both approaches in terms of complexity, scalability, and developer productivity.
- Document your chosen approach in the project README.

## Assessment Criteria

| Criteria | Weight | Description |
|---|---|---|
| State Management Implementation | 25% | Proper setup of NgRx store and/or service-based state. |
| Action & Reducer Structure | 20% | Correct use of actions and reducers to manage state updates. |
| Effects & Async Handling | 20% | Effective use of NgRx Effects for API interactions. |
| Debugging & DevTools | 15% | Clear state transitions and use of NgRx DevTools for debugging. |
| Code Organization & Scalability | 10% | Well-structured and modular state management files. |
| Overall Functionality | 10% | Application functions consistently with reactive, predictable state. |

## Lab Deliverables

- Updated **Kanban Task Management Web App** with state management implemented.
- Organized NgRx or service-based state files for maintainable architecture.
- Public GitHub repository with clear commit history and documentation.
- Deployed app URL demonstrating state-driven functionality.
