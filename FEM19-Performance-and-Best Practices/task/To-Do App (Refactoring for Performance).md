# Performance & Best Practices: Angular Lab

## Introduction

In this lab, you will take the provided legacy To-Do application and refactor it to meet modern Angular performance and architectural standards. The existing code contains severe anti-patterns that lead to poor performance, unnecessary change detection cycles, and poor maintainability. Your goal is to transform the application into a high-performance, maintainable, and architecturally sound Angular application.

Project Code:  [GitHub]( abdulrashid232/performance-and-best-practices-angular)

---

## Learning Objectives

By the end of this lab, you should be able to:

- Optimize change detection using the OnPush strategy and prevent DOM re-renders using trackBy with *ngFor.  
- Apply modern state management using Signals and computed() properties to efficiently handle derived state.  
- Implement efficient RxJS practices using the async pipe to manage subscriptions automatically.  
- Refactor monolithic components into reusable, dumb components and maintainable services.  
- Implement basic security best practices like input sanitization to prevent XSS vulnerabilities.  

---

## Lab Requirements

- Node.js (v18 or later)  
- Angular CLI (latest version)  
- The provided legacy-todo-app.ts code  
- Code Editor (VS Code recommended)  

---

## Lab Duration

**Estimated Time:** 4–5 hours (Hands-on Practice & Implementation)

---

## Lab Tasks

### Task 1: Baseline Diagnosis and Architectural Setup

**Initial Setup:**  
Create a new Angular standalone project and integrate the provided legacy-todo-app.ts code into the main component.

**Performance Baseline:**  
Using the browser's Profiler, capture the baseline performance. Document the frequency of Change Detection cycles when the mouse is moved over the component.

**Monolithic Refactor**

---

### Task 2: Performance Core: Change Detection and State

**Apply OnPush**

**Implement TrackBy**

**State Conversion:**  
Convert all mutable state properties (todos, newTaskDescription) within the TodoService and the main component into signal() instances.

**Improve the Methods Reactivity**

**Optimize Template Update for the binder properties**

---

### Task 3: RxJS and Security Clean-up

**RxJS Subscription Fix**

**API Caching:**  
Update the simulated API call to ensure the underlying network operation only executes once, regardless of how many times the observable is subscribed to.

**Input Sanitization:**

- Identify the vulnerability caused by using [innerHTML] to render user input.  
- Implement Angular's DomSanitizer to safely display the task descriptions while preventing Cross-Site Scripting (XSS) attacks.  

---

### Task 4: Modularity and Component Reusability

Refactor the application to make it module

---

## Assessment Criteria

| Criteria                                 | Weight |
|------------------------------------------|--------|
| Change Detection & Performance           | 30%   |
| Architectural Refactor (Services)        | 30%   |
| State Management (Signals & Immutability)| 20%   |
| RxJS & Security                         | 10%   |
| Code Quality & Modularity               | 10%   |

---

## Lab Deliverables

- Updated To-Do App codebase demonstrating a significant performance improvement.  
- Before/After screenshot comparison of the browser profiler showing the reduction in Change Detection cycles.  
- GitHub repository with clean, descriptive commits reflecting the refactoring steps.  
- Final app structure using Services, OnPush, Signals, and reusable components.
