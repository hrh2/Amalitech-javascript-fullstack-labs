# FEM15: Angular Signals

## Learning Objectives

Upon successful completion of this module, learners will be able to:

* **Explain** the concept of reactive state and how Angular Signals simplify change detection.
* **Differentiate** between Signals and Observables in terms of behavior, purpose, and syntax.
* **Create** reactive variables using signal () and update their values using .set (), .update (), and .mutate ().
* **Implement** computed signals with computed () to derive reactive state efficiently.
* **Use** effect () to respond to signal changes and perform side effects safely.
* **Refactor** a small component from using @Input () or RxJS to using Signals for simpler state management.

## Learning Approach

* This module employs a **Cognitive Apprenticeship** model. Angular Signals represents a new mental model for
  reactivity. The self-paced materials will model the "why" and "how" of this new pattern, directly contrasting it with
  the RxJS concepts learners just mastered.
* The learning path starts with the core concepts (Understand), moves to the practical application of the new primitives
  (Apply), and culminates in a lab where learners must build a feature from scratch thinking in Signals (Create). The
  live session provides a guided opportunity to practice this new thinking.
* Active practice is centered on the "Reactive Recipe Finder" lab. Learners receive immediate feedback from their
  development environment (e.g., the browser, test runner, or CLI). All final lab submissions are then reviewed by a TA
  in a live code review session to provide expert feedback on code quality, architecture, and best practices.

## Learning Activities

* **Live Session**: Exploring Angular Signals: An instructor-led session where learners will analyze and refactor
  existing component state (e.g., built with RxJS or plain properties) to use the new Signals-based reactivity model.
* **Hands-on Coding Lab**: The central activity is the "Reactive Recipe Finder." Learners will build a simplified Recipe
  Finder application using Angular Signals to manage reactive state. The project focuses on creating a responsive,
  interactive interface where users can search and filter recipes — all powered by signal (), computed (), and effect
  ().
* **Formative Quiz**: An auto-graded quiz with multiple-choice and scenario-based questions to ensure learners can
  differentiate Signals from Observables and choose the correct API.

## Module Structure

| Lesson / Section | Main Topic                    | Format                 | Learning Activity / Outcome                                                   |
|------------------|-------------------------------|------------------------|-------------------------------------------------------------------------------|
| **1**            | **The "Why" of Signals**      | Video + Reading        | Explain reactive state and differentiate **Signals** from **Observables**.    |
| **2**            | **Writable Signals**          | Reading + Video        | Create signals and update their values using `.set()` and `.update()`.        |
| **3**            | **Computed Signals**          | Reading + Video        | Implement `computed()` to derive reactive state from other signals.           |
| **4**            | **Effects**                   | Reading                | Use `effect()` to run side effects in response to signal changes.             |
| **5**            | **Exploring Angular Signals** | Instructor-led Session | Analyze and refactor state logic using Signals, `computed()`, and `effect()`. |
| **6**            | **Knowledge Check**           | Auto-graded Quiz       | Recall and identify the correct Signal APIs for given scenarios.              |
| **7**            | **Hands-On Lab**              | Coding Lab             | Build the **"Reactive Recipe Finder"** application.                           |

## Resource Book

### 1. Foundations: What Are Signals?

Start here to understand the core concepts behind Signals: what they are, why they were introduced, and how they
fundamentally improve Angular's change detection.

* **Articles / Reading**:
    * **Introduction to Signals | Angular.dev**: The official documentation. This is the best place to start. It
      explains what signals are, why they are needed, and how they provide fine-grained
      reactivity. [Link](https://angular.dev/guide/signals)
* **Video Resources**:
    * Angular Signals: The Future of Reactivity in Angular? (Fireship) (3 min): A very fast, high-level overview of the
      "why" behind Signals and how they simplify reactivity compared to traditional methods.
        * [Play video](https://www.youtube.com/watch?v=Qy-oUc5eB2M)

### 2. The Signals API: Writable, Computed, and Effects

This section covers the "how-to" of Signals. You'll learn the practical API for creating signals that you can directly
change (writable), signals that derive their value from other signals (computed), and how to run code in response to
signal changes (effect).

* **Articles / Reading:**
    * (Refer back to the **Introduction to Signals | Angular.dev** guide, as its sub-pages cover writable signals,
      computed (), and effect () in detail.) [Link](https://angular.dev/guide/signals)
* **Video Resources**:
    * Angular Signals - A Deep Dive (Angular University) (31 min): This video provides a comprehensive, practical
      walkthrough of the Signals API. It covers how to create writable signals (signal ()), update them (.set (),
      .update ()), and create derived values (computed ()) and side effects (effect ()).
        * [Play Video](https://www.youtube.com/watch?v=n1a2eQ0Zyls)

### 3. Signals vs. Observables

Signals and Observables both deal with reactivity, but they are not the same. This section clarifies the key differences
in their behavior, syntax, and appropriate use cases.

* **Articles / Reading**:
    * **Angular Signals | Angular University Blog**: This blog post provides an excellent deep dive, contrasting the
      "pull" mechanism of Signals (synchronous) with the "push" mechanism of RxJS Observables (often asynchronous). [Link](https://blog.angular-university.io/angular-signals/)
* **Video Resources**:
    * (Refer back to the **Angular Signals (Fireship)** video, as it also provides a concise comparison of Signals and
      Observables.)
    * [Play Video (Change etection and Angular signal)](https://www.youtube.com/watch?v=Qy-oUc5eB2M) 
