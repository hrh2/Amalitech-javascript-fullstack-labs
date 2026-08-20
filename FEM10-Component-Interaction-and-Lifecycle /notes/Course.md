# FEM10: Component Interaction & Lifecycle
## Learning Objectives
Upon successful completion of this module, learners will be able to:

* Explain the concept of component hierarchy and how data flows between parent and child components.
* Implement component communication using @Input() and @Output() decorators with EventEmitter.
* Describe the purpose and sequence of Angular lifecycle hooks (e.g., ngOnInit, ngOnChanges, ngOnDestroy).
* Apply lifecycle hooks to manage initialization, data updates, and cleanup within components.
* Analyze how change detection and component updates occur in Angular’s rendering cycle.

## Learning Approach

This module employs a **Project-Based Learning (PBL)** approach. It directly follows Module 9 and addresses the next logical challenge in application development: making components communicate. Learners will take the foundational knowledge of components and apply it to build a multi-component feature.

The module starts with the core patterns for data flow (Apply), introduces lifecycle hooks for managing component state over time (Apply), and touches on the underlying "why" with change detection (Analyze). The "Character Counter App" lab requires learners to synthesize all these concepts to build an interactive, stateful application.

Active practice is centered on the "Character Counter App" lab. Learners receive immediate feedback from their development environment (e.g., the browser, test runner, or CLI). All final lab submissions are then reviewed by a TA in a live code review session to provide expert feedback on code quality, architecture, and best practices.

## Learning Activities

* **Hands-on Coding Lab:** The central activity is the "Character Counter App." In this lab, you will build an application that helps users analyze and manage their written text. The app will display character, word, and sentence counts, enforce character limits, and provide real-time feedback using Angular’s component communication patterns. This project emphasizes component hierarchy, parent-child data flow, and the use of lifecycle hooks.
* **Formative Quiz:** An auto-graded quiz with multiple-choice and scenario-based questions to test understanding of the differences between @Input() and @Output() and the proper use cases for ngOnInit vs. ngOnChanges.

## Module Structure

| Lesson / Section | Main Topic                    | Format           | Learning Activity / Outcome                                                                  |
| ---------------- | ----------------------------- | ---------------- | -------------------------------------------------------------------------------------------- |
| **1**            | **Component Hierarchy**       | Video + Reading  | Explain the concept of parent-child component relationships.                                 |
| **2**            | **Component Interaction**     | Reading + Video  | Implement `@Input()` for receiving data and `@Output()` for emitting events.                 |
| **3**            | **Component Lifecycle Hooks** | Reading + Video  | Describe and apply key lifecycle hooks such as `ngOnInit`, `ngOnChanges`, and `ngOnDestroy`. |
| **4**            | **Change Detection**          | Reading          | Analyze the basics of Angular's change detection cycle.                                      |
| **5**            | **Knowledge Check**           | Auto-graded Quiz | Recall and identify the correct usage of `@Input()`, `@Output()`, and lifecycle hooks.       |
| **6**            | **Hands-On Lab**              | Coding Lab       | Build the **"Character Counter App"** using the concepts covered in the module.              |

## Resource Book
### 1. Component Interaction: Parent/Child Data Flow 📢
Learn how Angular's component hierarchy works and master the primary ways components share data: passing data down from a parent to a child with @Input() and sending events up from a child to a parent with @Output() and EventEmitter.

* **Articles/Reading:**
  * [Component interaction | Angular.io:](https://v17.angular.io/guide/component-interaction) The official documentation detailing how to use @Input() and @Output() for parent-child communication.
  
* Video [Play Video](https://www.youtube.com/watch?v=BGy8DdGw_WE) : A visual guide demonstrating the implementation of @Input() and @Output() decorators.

### 2. Component Lifecycle Hooks & Change Detection ⏳
Discover the sequence of events (lifecycle hooks) that Angular triggers for every component, from creation (ngOnInit) to changes (ngOnChanges) to destruction (ngOnDestroy). Understanding these hooks allows you to manage data, perform initialization, and clean up resources effectively. This also relates to how Angular's change detection mechanism knows when to update the view.

* **Articles/Reading:**
  * **[Lifecycle hooks | Angular.io:](https://v17.angular.io/guide/lifecycle-hooks)** The official guide explaining the purpose, sequence, and use cases for common component lifecycle hooks.
* Video [Play Video](https://www.youtube.com/watch?v=jFk9-zV27BE) : A detailed video walkthrough of the different lifecycle hooks, what they do, and when they fire.

## 3. Discussion Prompt
What is the key difference between the ngOnInit() and ngOnChanges() lifecycle hooks? Describe a scenario where you must use ngOnChanges() (instead of ngOnInit()) to react to data changes.