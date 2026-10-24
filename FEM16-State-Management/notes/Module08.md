# FEM16: State Management

## Learning Objectives

Upon successful completion of this module, learners will be able to:

* **Differentiate** between local component state and global application state.
* **Implement** a simple state management service using RxJS Subjects.
* **Explain** the principles of Redux and the NgRx store (actions, reducers, effects, selectors).
* **Develop** NgRx actions, reducers, and effects to manage complex state and side effects.
* **Utilize** NgRx selectors to efficiently query and derive data from the store.
* **Refactor** the Kanban app to use NgRx for structured global state handling

## Learning Approach

This module uses a **Cognitive Apprenticeship model**. Advanced state management is an architectural pattern that
requires a new mental model. The module first contrasts simple service-based state (using RxJS Subjects) with the more
robust, predictable pattern of NgRx. The learning materials will model the expert process of designing a state slice,
defining actions, writing reducers, and handling side effects.

The learning path starts by identifying state management needs (Analyze), explores a simple service-based solution
(Apply), and then introduces the more scalable NgRx pattern (Understand/Apply). The culminating lab requires learners to
analyze their existing application's state and refactor it to use NgRx, demonstrating the full lifecycle of predictable
state management (Create).

Learners receive immediate feedback from their development environment. All final lab submissions are then reviewed by a
TA in a live code review session to provide expert feedback on code quality, architecture, and best practices.

## Learning Activities

* **Live Session:** Managing State Like A Pro: An instructor-led session that compares and contrasts state management
  strategies (e.g., Service-based with Subjects vs. NgRx) by live-coding solutions to common state-sharing problems.
* **Hands-on Coding Lab:** The central activity is the "Kanban Task Management Web App (Part IV – State Management)."
  Learners will extend their app by implementing state management for boards and tasks. They will explore the difference
  between local and global state, apply service-based state principles, and then integrate NgRx for structured,
  predictable, and scalable global state handling.
* **Formative Quiz:** An auto-graded quiz with multiple-choice questions focused on the unidirectional data flow and the
  specific roles of Actions, Reducers, Effects, and Selectors.

## Module Structure

| Lesson / Section | Main Topic                        | Format                 | Learning Activity / Outcome                                                                                  |
|------------------|-----------------------------------|------------------------|--------------------------------------------------------------------------------------------------------------|
| **1**            | **The Need for State Management** | Video + Reading        | Differentiate between local, component, and global state.                                                    |
| **2**            | **Service-Based State**           | Reading + Video        | Implement a simple state service using RxJS `BehaviorSubject`.                                               |
| **3**            | **Intro to Redux & NgRx**         | Reading                | Explain the Redux pattern, including Store, Actions, and Reducers.                                           |
| **4**            | **NgRx Effects & Selectors**      | Reading + Video        | Implement Effects for side effects and create Selectors to query state.                                      |
| **5**            | **Managing State Like a Pro**     | Instructor-led Session | Compare and contrast state management strategies, such as service-based state and NgRx, through live coding. |
| **6**            | **Knowledge Check**               | Auto-graded Quiz       | Recall and identify the roles of major NgRx building blocks.                                                 |
| **7**            | **Hands-On Lab**                  | Coding Lab             | Refactor the **"Kanban Task Management Web App"** to use NgRx.                                               |

## Resource Book

### 1. Foundations of State Management

Before diving into large libraries, it's crucial to understand what state is, the difference between local and global
state, and how to manage simple global state using an RxJS-based service.

* Articles / Reading:
    * **State management | Angular.io**: The official Angular guide. This is essential reading that differentiates
      local/component state from global/application state (LO 1) and explains how to create a simple state management
      service using an RxJS BehaviorSubject (LO 2).
        * [Link](https://angular.io/guide/state-management)
    * **Angular State Management in 2025**: A Complete Breakdown | Nx Blog: This article provides a modern overview of
      the state management landscape, comparing simple services, NgRx, and other options, which helps reinforce when to
      choose global state (LO 1).
        * [Link](https://nx.dev/blog/angular-state-management-2025)

### 2. Introduction to NgRx: Core Concepts

Learn the principles of NgRx, a powerful state management library inspired by Redux, designed for complex Angular
applications. This section focuses on the "why" and the core pattern: Actions, Reducers, Effects, and Selectors.

* **Articles / Reading**:
    * **Introduction to NgRx | ngrx.io**: The official documentation is the best place to understand the core principles
      of NgRx (LO 3), its architecture, and the role of each piece (Store, Actions, Reducers, Effects, Selectors).
        * [Link](https://ngrx.io/docs)
    * **Angular NgRx Store and Effects**: The Complete Crash Course | Angular University: This blog post provides a
      comprehensive "crash course" that clearly explains the Redux pattern and the flow of data in NgRx (LO 3),
      specifically how Actions, Reducers, and Effects work together.
        * [Link](https://blog.angular-university.io/angular-ngrx-store-and-effects-crash-course/)
* **Video Resources**:
    * **Angular NgRX: Course Overview | State Management in Angular (5 min)**: A concise overview that answers the "why"
      of NgRx and introduces the core concepts (LO 3), setting the stage for the practical tutorial.
        * [Play Video](https://www.youtube.com/watch?v=QOrzi5jjc7E)

### 3. Practical NgRx: Implementation

Move from theory to practice. This section focuses on the "how" of implementing NgRx in an application, from handling
data (CRUD) to querying the store.

* **Video Resources**:
    * **Angular with NgRx CRUD** – Complete Tutorial for Beginners (2 hr 41 min): This is a comprehensive, practical
      tutorial. It walks you through building a full CRUD (Create, Read, Update, Delete) application, showing you
      exactly how to develop Actions and Reducers for state changes (LO 4), implement Effects for side effects (LO 4)
      (like API calls), and use Selectors to get data (LO 5).
        * [Play Video](https://www.youtube.com/watch?v=97RYIl86g5o)

### 4. Discussion Prompt

NgRx introduces a lot of 'boilerplate' (actions, reducers, effects) compared to just using an RxJS service. Based on the
resources, describe a scenario where the complexity of NgRx is justified over a simple service. What specific problems
does NgRx solve that a simple service does not? (https://angular.io/guide/state-management),

* [Play Video](https://www.youtube.com/watch?v=QOrzi5jjc7E)