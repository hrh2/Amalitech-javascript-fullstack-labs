# FEM09: Angular Fundamentals
## Learning Objectives

Upon successful completion of this module, learners will be able to:

* Explain the role of Angular in modern web development and how it differs from traditional JavaScript frameworks.
* Set up and configure new Angular projects using the Angular CLI.
* Identify and describe the core building blocks of Angular applications — modules, components, and templates.
* Apply different forms of data binding (interpolation, property binding, event binding, and two-way binding) to manage dynamic content and user interaction.
* Use structural and attribute directives (e.g., *ngIf, *ngFor, ngClass, ngStyle) to control rendering and style dynamically.
* Organize component templates and styles following Angular conventions for maintainability.

## Learning Approach

This module is built on a Project-Based Learning (PBL) model. Angular is a comprehensive framework, and learners benefit from applying its core concepts directly to a tangible project. They will learn the fundamental building blocks—components, templates, data binding, and directives—through curated readings and videos, and then immediately apply this knowledge to build the "Dessert Shop App."

This approach ensures learners master the foundational syntax and structure of Angular before moving on to more complex topics.

Active practice is centered on the "Dessert Shop App" lab. Learners receive immediate feedback from their development environment (e.g., the browser, test runner, or CLI). All final lab submissions are then reviewed by a TA in a live code review session to provide expert feedback on code quality, architecture, and best practices.

## Learning Activities

* **Live Session: Fundamentals of Angular**: An instructor-led session where learners will analyze and build a mini-application, integrating all core concepts (components, binding, and directives).
* **Hands-on Coding Lab**: The primary activity is building the "Dessert Shop App." Learners will apply fundamental Angular concepts to develop a dynamic and interactive web application, showcasing the use of components, templates, data binding, and directives to create reusable building blocks.
* **Formative Quiz**: An auto-graded quiz with multiple-choice questions to assess understanding of component decorators, data binding, and structural vs. attribute directives.

## Module Structure

| Lesson / Section | Main Topic                  | Format                 | Learning Activity / Outcome                                           |
| ---------------- | --------------------------- | ---------------------- | --------------------------------------------------------------------- |
| **1**            | **Intro to Angular & CLI**  | Video + Reading        | Explain Angular architecture and set up a new project.                |
| **2**            | **Components & Templates**  | Reading + Video        | Describe and construct core Angular building blocks.                  |
| **3**            | **Data Binding & Events**   | Reading                | Implement one-way, two-way, and event binding.                        |
| **4**            | **Built-in Directives**     | Reading + Video        | Apply directives such as `*ngIf`, `*ngFor`, `ngClass`, and `ngStyle`. |
| **5**            | **Fundamentals of Angular** | Instructor-led Session | Analyze and build a mini-application integrating all core concepts.   |
| **6**            | **Knowledge Check**         | Auto-graded Quiz       | Recall and identify key Angular concepts, syntax, and APIs.           |
| **7**            | **Hands-On Lab**            | Coding Lab             | Build the **"Dessert Shop App"** using all foundational concepts.     |

## Resource Book

### 1. What is Angular? 🤔 (Covers LO 1)
Get started by understanding what Angular is, its architecture, and how to create your first project.

* Articles / Reading:

  * What is Angular? | Angular.io: The official documentation provides a high-level overview of Angular, its key advantages (like being component-based and platform-agnostic), and its core building blocks (components, templates, dependency injection). [Link ](https://angular.io/guide/what-is-angular)
  * Getting started with Angular | Angular.io: This official tutorial guides you through setting up your development environment and creating your first Angular application using the Angular CLI, covering the basic project structure. [Link ](https://angular.io/start)
  * Introduction to AngularJS | GeeksforGeeks: Provides context on AngularJS (the predecessor), helping to understand the evolution and some core ideas that carried over or changed in modern Angular. [Link ](https://www.geeksforgeeks.org/angular-js/angularjs/)(Note: Be mindful this covers AngularJS, not modern Angular, use for historical context).

* Video Resources:
  * Angular in 100 Seconds – Fireship (Quick Intro): A very fast-paced introduction to the essential concepts and features of Angular, great for a quick overview. 
  * [Play Video](https://www.youtube.com/watch?v=k5E2AVpwsko)
  * Angular Crash Course – Traversy Media (1hr): A practical crash course covering the fundamentals, including CLI setup, components, templates, data binding, and services. 
  * [Play Video](https://www.youtube.com/watch?v=3dHNOWTI7H8)

### 2. Core Concepts: Components, Templates, Binding & Directives 🧩 (Covers LO 2, 3, 4, 5)
Dive into the building blocks of Angular applications: components, how they display data (templates), how data flows (binding), and how to dynamically change the view (directives).

* Video Resource:
  * Angular Course For Beginners - Learn Angular From Scratch | Full Tutorial (FreeCodeCamp): This comprehensive course is the primary resource for this section. It covers:
    * Components & Templates: How to create components (the basic UI building blocks) and their associated HTML templates. 
    * Data Binding: Demonstrates Interpolation ({{ }}), Property Binding ([]), Event Binding (()), and Two-Way Binding ([()]). 
    * Directives: Explains structural directives like *ngIf and *ngFor for manipulating the DOM structure, and attribute directives like ngClass and ngStyle for changing element appearance. 
    * Component Lifecycle: Introduces lifecycle hooks like ngOnInit and explains their purpose in the component's lifecycle. 
    * [Play Video](https://www.youtube.com/watch?v=3qBXWUpoPHo)
* Articles / Reading: (Use Angular.io documentation for deeper dives)
  * Angular Components Overview: [Explore Angular Docs](https://angular.io/guide/component-overview)
  * Template Syntax: [Explore Angular Docs](https://angular.io/guide/template-syntax) (Covers Interpolation, Bindings)
  * Built-in directives: [Explore Angular Docs](https://angular.io/guide/built-in-directives) (Covers *ngIf, *ngFor, ngStyle, ngClass)

Lifecycle hooks: [Explore Angular Docs](https://angular.io/guide/lifecycle-hooks) (Covers ngOnInit etc.)

### 3. Component Communication 📢 (Covers LO 6)
Learn how parent and child components share data in Angular.

* Articles / Reading: (Use Angular.io documentation for deeper dives)
  * Component interaction: This official guide explains how to pass data into a child component using the @Input() decorator and how a child component can emit events out to its parent using the @Output() decorator and EventEmitter. [Explore Angular Docs](https://angular.io/guide/component-interaction)

### 4. Discussion Prompt
Explain the difference between Property Binding ([ ]) and Interpolation ({{ }}) in Angular templates. When would you typically choose one over the other?