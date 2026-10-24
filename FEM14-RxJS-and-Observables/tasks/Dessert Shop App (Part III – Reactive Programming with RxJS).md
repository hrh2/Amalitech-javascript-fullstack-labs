# RxJS & Observables: Dessert Shop App
## Introduction

In this lab, learners will enhance the **Dessert Shop App** by integrating **RxJS** to manage data reactively.

They will transform existing synchronous data flows into **observable streams**, apply **RxJS operators** to transform and combine data, and implement reactive UI updates that respond automatically to data changes.

By completing this lab, learners will gain hands-on experience with **reactive programming concepts** and build the foundation needed for advanced **state management** in Angular.

## Learning Objectives

By the end of this lab, learners should be able to:

- Explain the concept of **reactive programming** and why it's important in Angular.
- Use **Observables**, **Observers**, and **Subscriptions** for handling asynchronous data.
- Apply **RxJS operators** (map, filter, tap, switchMap, debounceTime, etc.) to manipulate data streams.
- Manage data reactivity in Angular components and services.
- Handle user interactions and asynchronous updates using observables.
- Combine multiple streams to synchronize data and UI.
- Prevent memory leaks using **unsubscribe patterns** or the **async pipe**.

## Lab Requirements

- Node.js (v18 or later)
- Angular CLI (latest version)
- Existing **Dessert Shop App** project (from the Services & DI lab)
- Code Editor (VS Code recommended)
- GitHub account
- Netlify or Vercel account for deployment

**Estimated Time:** 5 hours

## Lab Tasks

### Task 1: Review and Prepare for Reactive Updates

- Open the existing **Dessert Shop App** project.
- Review where data is currently stored and passed synchronously (e.g., products array, cart items).
- Identify opportunities to introduce **reactivity** (e.g., real-time updates, cart changes, filters).
- Ensure the app builds and runs correctly before adding reactive logic.

### Task 2: Introduce Observables

- Convert existing static data (like product lists or cart items) into **Observables** using RxJS.
- Expose observable streams from services (e.g., ProductService or CartService).
- Subscribe to these observables in components to display data dynamically.
- Confirm that UI updates automatically reflect observable changes.

### Task 3: Apply RxJS Operators

- Use **map**, **filter**, and **tap** to transform or react to data emitted by observables.
- Demonstrate how to filter products (e.g., by category or price range).
- Use **switchMap** or **mergeMap** to handle dependent streams (e.g., fetching updated product info).
- Use **take** or **takeUntil** for controlled stream completion.

### Task 4: Manage Reactive User Input

- Create a search or filter input that reacts to user typing.
- Use RxJS operators like **debounceTime** and **distinctUntilChanged** to limit unnecessary updates.
- Connect the filtered results to the product list dynamically.
- Confirm that the list updates smoothly in real time.

### Task 5: Combine Multiple Streams

- Create combined observables using **combineLatest**, **forkJoin**, or **withLatestFrom**.
- Synchronize data from multiple sources (e.g., products + cart updates).
- Ensure that when a product is added or removed, the UI and totals update automatically.

### Task 6: Reactive Cart Updates

- Modify the cart system to use **BehaviorSubject** for real-time updates.
- Ensure that adding, removing, or clearing items in the cart immediately updates: the displayed cart count, the total price, and the product list (if needed).
- Discuss the benefit of BehaviorSubject for maintaining the "latest value" in streams.

### Task 7: Manage Subscriptions and Cleanup

- Review where subscriptions occur within components.
- Implement **unsubscribe** logic using:
  - Subscription objects (manual unsubscribe).
  - takeUntil with a destroy notifier.
  - Or the **async pipe** (automatic unsubscribe).
- Validate that the app runs smoothly without memory leaks.

### Task 8: Reactive Error Handling

- Simulate possible observable errors (e.g., failed product load).
- Use **catchError** and **of()** to handle errors gracefully and provide fallback data.
- Display a friendly message in the UI when data fails to load.
- Discuss how RxJS helps manage predictable async flows even with failures.

### Task 9: Testing and Validation

- Confirm that all reactive updates behave correctly: product list updates on search/filter, cart count updates immediately, combined streams stay synchronized.
- Check console output for errors or subscription warnings.
- Verify that the application runs smoothly with reactive updates.

### Task 10: Deployment

- Commit and push your updated project to GitHub with a descriptive message.
- Redeploy your app using Vercel or Netlify.
- Test the live app to ensure all reactive features work correctly in production.

### Bonus Task (Optional): Simulated API Streams

- Replace static product data with a simulated API call using `of()` and `delay()`.
- Use operators like **retry** or **catchError** to handle network-like behavior.
- Demonstrate how reactive streams simplify async data flow for APIs.

## Assessment Criteria

| Criteria | Weight | Description |
|---|---|---|
| Observable Implementation | 25% | Proper conversion of static data to observable streams. |
| RxJS Operators | 25% | Effective use of operators for transformation, combination, and control. |
| Reactive UI Behavior | 20% | UI updates automatically in response to data stream changes. |
| Cleanup & Error Handling | 15% | Proper subscription management and error recovery patterns. |
| Code Organization | 15% | Clear, maintainable structure following Angular and RxJS best practices. |

## Lab Deliverables

- Updated **Dessert Shop App** demonstrating reactive programming with RxJS.
- GitHub repository with commits documenting the reactive feature implementation.
- Deployed app URL showing observable-driven UI updates.
