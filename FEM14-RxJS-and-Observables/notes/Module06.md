# FEM14: RxJS & Observables

## Learning Objectives

Upon successful completion of this module, learners will be able to:

* **Explain** the Observer design pattern and the role of Observables, Observers, and Subscriptions.
* **Utilize** RxJS operators (e.g., map, filter, switchMap) to transform and manipulate asynchronous data streams.
* **Implement** robust error-handling mechanisms for data streams using operators like catchError.
* **Manage** subscriptions effectively within Angular components to prevent memory leaks.
* **Transform** synchronous data flows into reactive observable streams.

## Learning Approach

This module employs a **Cognitive Apprenticeship model**. RxJS introduces a reactive programming paradigm that requires a
different way of thinking about data flow. The learning materials model the expert thought process for handling
asynchronous streams, demonstrating how to compose operators to solve complex problems.

The learning path starts with the core theory of Observables (Understand), then moves to the practical use of operators
to manipulate data (Apply). The culminating lab requires learners to refactor existing synchronous data flows (from
their "Dessert Shop App") into a declarative, reactive style (Analyze/Create), which solidifies the benefits of the RxJS
approach.

Learners receive immediate feedback from their development environment. All final lab submissions are then reviewed by a
TA in a live code review session to provide expert feedback on code quality, architecture, and best practices.

## Learning Activities

* **Live Session**: Working with Observables: An instructor-led session where learners will analyze complex asynchronous problems and refactor them using RxJS operators and reactive patterns.
* **Hands-on Coding Lab**:  The central activity is the "Dessert Shop App (Part III – Reactive Programming with RxJS)." Learners will enhance their app by integrating RxJS to manage data reactively. They will transform existing synchronous data flows into observable streams, apply RxJS operators to transform and combine data, and implement reactive UI updates that respond automatically to data changes.
* **Formative Quiz**: An auto-graded quiz with multiple-choice questions focusing on the difference between Promises and Observables, the function of key operators (map vs. switchMap), and subscription management techniques.

## Module Structure

| Lesson / Section | Main Topic                              | Format                 | Learning Activity / Outcome                                                        |
| ---------------- | --------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------- |
| **1**            | **Thinking Reactively**                 | Video + Reading        | Explain the concepts of data streams and the Observer pattern.                     |
| **2**            | **Core RxJS Concepts**                  | Reading + Video        | Create and subscribe to Observables to handle asynchronous events.                 |
| **3**            | **Transformation Operators**            | Reading                | Apply common operators such as `map`, `filter`, and `tap` to modify data streams.  |
| **4**            | **Error Handling & Advanced Operators** | Reading + Video        | Implement `catchError` and use higher-order mapping operators such as `switchMap`. |
| **5**            | **Working with Observables**            | Instructor-led Session | Analyze and refactor asynchronous code using RxJS operators and patterns.          |
| **6**            | **Knowledge Check**                     | Auto-graded Quiz       | Recall and identify key RxJS operators and concepts.                               |
| **7**            | **Hands-On Lab**                        | Coding Lab             | Refactor the **"Dessert Shop App"** to use reactive programming with RxJS.         |
