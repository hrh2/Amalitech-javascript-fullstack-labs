# FEM14: RxJS & Observables

## Learning Objectives

Upon successful completion of this module, learners will be able to:

* **Explain** the Observer design pattern and the role of Observables, Observers, and Subscriptions.
* **Utilize** RxJS operators (e.g., map, filter, switchMap) to transform and manipulate asynchronous data streams.
* **Implement** robust error-handling mechanisms for data streams using operators like catchError.
* **Manage** subscriptions effectively within Angular components to prevent memory leaks.
* **Transform** synchronous data flows into reactive observable streams.

## Learning Approach

This module employs a **Cognitive Apprenticeship model**. RxJS introduces a reactive programming paradigm that requires
a different way of thinking about data flow. The learning materials model the expert thought process for handling
asynchronous streams, demonstrating how to compose operators to solve complex problems.

The learning path starts with the core theory of Observables (Understand), then moves to the practical use of operators
to manipulate data (Apply). The culminating lab requires learners to refactor existing synchronous data flows (from
their "Dessert Shop App") into a declarative, reactive style (Analyze/Create), which solidifies the benefits of the RxJS
approach.

Learners receive immediate feedback from their development environment. All final lab submissions are then reviewed by a
TA in a live code review session to provide expert feedback on code quality, architecture, and best practices.

## Learning Activities

* **Live Session**: Working with Observables: An instructor-led session where learners will analyze complex asynchronous
  problems and refactor them using RxJS operators and reactive patterns.
* **Hands-on Coding Lab**:  The central activity is the "Dessert Shop App (Part III – Reactive Programming with RxJS)."
  Learners will enhance their app by integrating RxJS to manage data reactively. They will transform existing
  synchronous data flows into observable streams, apply RxJS operators to transform and combine data, and implement
  reactive UI updates that respond automatically to data changes.
* **Formative Quiz**: An auto-graded quiz with multiple-choice questions focusing on the difference between Promises and
  Observables, the function of key operators (map vs. switchMap), and subscription management techniques.

## Module Structure

| Lesson / Section | Main Topic                              | Format                 | Learning Activity / Outcome                                                        |
|------------------|-----------------------------------------|------------------------|------------------------------------------------------------------------------------|
| **1**            | **Thinking Reactively**                 | Video + Reading        | Explain the concepts of data streams and the Observer pattern.                     |
| **2**            | **Core RxJS Concepts**                  | Reading + Video        | Create and subscribe to Observables to handle asynchronous events.                 |
| **3**            | **Transformation Operators**            | Reading                | Apply common operators such as `map`, `filter`, and `tap` to modify data streams.  |
| **4**            | **Error Handling & Advanced Operators** | Reading + Video        | Implement `catchError` and use higher-order mapping operators such as `switchMap`. |
| **5**            | **Working with Observables**            | Instructor-led Session | Analyze and refactor asynchronous code using RxJS operators and patterns.          |
| **6**            | **Knowledge Check**                     | Auto-graded Quiz       | Recall and identify key RxJS operators and concepts.                               |
| **7**            | **Hands-On Lab**                        | Coding Lab             | Refactor the **"Dessert Shop App"** to use reactive programming with RxJS.         |

## Resource Book

### 1. Foundations: Observables, Observers & Subscriptions

Start here to understand the core building blocks of RxJS. This section explains what an Observable is, how to listen to
it (Observer), and how to manage the connection (Subscription).

* Articles / Reading:
    * **RxJS Overview | rxjs.dev**: The official RxJS documentation overview. This is the best place to start to
      understand the core concepts of Observables, Observers, Subscriptions, and
      Operators. [Link](https://rxjs.dev/guide/overview)
    * **Observables in Angular | Angular.io**: Angular's official guide to how Observables are used within the
      framework, providing essential context for Angular developers and practical integration
      tips. [Link](https://angular.io/guide/observables)
    * **Learn RxJS**: An interactive, community-driven site with clear explanations and examples for almost every RxJS
      concept and operator. A great reference for specific operators or concepts. [Link](https://www.learnrxjs.io/)
* Video Resources:
    * **Observables, Observers & Subscriptions (RxJS basics) (12 min)**: This video provides a clear, focused
      explanation of the three fundamental building blocks: Observables (the stream), Observers (the listener), and
      Subscriptions (the connection). This is critical for understanding how to use them and why you must unsubscribe
      (LO 4).
        * **[Play video](https://www.youtube.com/watch?v=Tux1nhBPl_w)**

### 2. Operators: Transforming Data Streams

This is the core power of RxJS. Operators are functions that allow you to modify, filter, combine, and manage the data
flowing through your Observables.

* **Articles / Reading**:
    * **Operators Overview | rxjs.dev**: The official documentation detailing how operators work and listing common
      categories (transformation, filtering, creation, etc.). [Link](https://rxjs.dev/guide/operators)
    * **Essential RxJS Operators Every Angular Developer Needs | javascript.plainenglish.io**: This article highlights
      the most frequently used RxJS operators (like map, filter, tap, switchMap) that Angular developers use daily to
      manipulate data
      streams. [Link](https://javascript.plainenglish.io/essential-rxjs-operators-every-angular-developer-needs-to-know-in-2024-2025-701f3d2491f7)
    * **Advanced RxJS Operators You Know (But Not Well Enough) | dev.to**: An article that moves beyond the basics,
      exploring advanced operators that help solve more complex asynchronous challenges. LinkAdvanced RxJS Operators You
      Know (But Not Well Enough) | dev.to: An article that moves beyond the basics, exploring advanced operators that
      help solve more complex asynchronous challenges. Link

### 3. Comprehensive Courses

These resources provide a complete walkthrough, from the basics to advanced implementation, including error handling
(LO3)
and subscription management (LO 4).

* Video Resources:
    * RxJS Mastery: Complete Beginner to Pro Series (2 hr 46 min): A complete "Beginner to Pro" series that provides a
      deep dive into RxJS. It covers everything from the basics of creating Observables to advanced operators, error
      handling, and patterns.
        * [Play Video](https://www.youtube.com/watch?v=dqY9bmvRVzc)
    * RxJs for Angular — from scratch (live workshop) (2 hr 4 min): This live workshop recording builds RxJS concepts
      from the ground up specifically for Angular developers, covering creation, operators, error handling, and
      subscription management within an Angular context.
        * [Play Video](https://www.youtube.com/watch?v=NJ9Wwotjx_Y)

### 4. Advanced Topic: Signals vs. Observables

Understand how RxJS Observables compare to Angular's newer reactivity primitive, Signals.

* Video Resources:
    * Signals vs Observables (18 min): This video compares RxJS Observables with Angular's new 'Signals' primitive,
      helping you understand the future of reactivity in Angular and when to use each.
      https://www.youtube.com/watch?v=p2JGWnUmdNw* [Play Video](https://www.youtube.com/watch?v=p2JGWnUmdNw)

### 5. Discussion Prompt

Why is managing subscriptions (e.g., using unsubscribe () or an operator like takeUntil ()) so important in Angular
components? What is a 'memory leak' in the context of RxJS, and how do lifecycle hooks like ngOnDestroy help prevent
them? (https://angular.io/guide/observables),
* [Video](https://www.youtube.com/watch?v=Tux1nhBPl_w)