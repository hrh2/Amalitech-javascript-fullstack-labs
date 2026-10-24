# FEM12: Routing & Navigation

## Learning Objectives

Upon successful completion of this module, learners will be able to:

* Configure the Angular Router to map URL paths to components.
* Implement navigation between views.
* Utilize route parameters to pass dynamic data to components.
* Develop modular route structures using child routes and lazy-loaded modules for a scalable design.
* Protect application routes from unauthorized access using route guards.

## Learning Approach

This module is built on a **Project-Based Learning (PBL) model**. Routing is the key to transforming a single-view
application into a multi-page user experience. Learners will apply routing concepts directly to build a "**Kanban Task
Management Web App**" from scratch. This provides a clear, practical context for designing a clean SPA architecture.

The learning is scaffolded, starting with the configuration of basic routes (Apply). Complexity is then added by
introducing dynamic routes with parameters (Apply/Analyze), modularizing routes into feature modules, and finally,
protecting routes with guards, a more advanced and abstract concept (Apply/Create). This approach allows learners to
build a feature-rich, scalable, and secure SPA step-by-step.

Learners receive immediate feedback from their development environment. All final lab submissions are then reviewed by a
TA in a live code review session to provide expert feedback on code quality, architecture, and best practices.

## Learning Activities

* **Live Session**: Understanding Routing: An instructor-led session where learners will analyze and design the routing
  architecture for a sample application, discussing nested routes, dynamic parameters, and programmatic navigation.
* **Hands-on Coding Lab**: The core activity is the "Kanban Task Management Web App (Routing-Focused Build)." Learners
  will develop a simplified Kanban app, configuring routes, implementing navigation, creating modular route structures
  (e.g., for different boards or user settings), and securing paths with route guards. This lab focuses on building a
  clean, scalable SPA architecture.
* **Formative Quiz**: An auto-graded quiz with multiple-choice questions focusing on RouterModule.forRoot () vs.
  RouterModule.forChild (), the syntax for routerLink and route parameters, the purpose of <router-outlet>, and the
  CanActivate guard interface.

## Module Structure

| Lesson / Section | Main Topic                         | Format                 | Learning Activity / Outcome                                                          |
|------------------|------------------------------------|------------------------|--------------------------------------------------------------------------------------|
| **1**            | **Introduction to SPA Routing**    | Video + Reading        | Explain the concept of client-side routing and its benefits.                         |
| **2**            | **Configuring the Angular Router** | Reading + Video        | Set up the Angular Router and define a basic routing configuration.                  |
| **3**            | **Navigation**                     | Reading                | Implement navigation using the `routerLink` directive and the `Router` service.      |
| **4**            | **Route Parameters**               | Reading + Video        | Pass and retrieve dynamic data from a URL using route parameters.                    |
| **5**            | **Understanding Routing**          | Instructor-led Session | Analyze and design routing architecture for a sample application.                    |
| **6**            | **Knowledge Check**                | Auto-graded Quiz       | Recall and identify key routing concepts, syntax, and APIs.                          |
| **7**            | **Hands-On Lab**                   | Coding Lab             | Build the **"Kanban Task Management Web App"** with a complete routing architecture. |

## Resource Book

### 1. Foundations of Angular Routing

Understand the core concepts of the Angular Router, how it enables a Single Page Application (SPA) experience, and how
to configure basic navigation.

* **Articles / Reading**:
    * **Routing & Navigation | Angular.io**: The official, comprehensive guide. This is the primary resource for all
      routing concepts, from basic setup to advanced features like lazy loading and
      guards. [Link](https://angular.io/guide/router)
    * **Angular Routing and Navigation Made So Easy | dev.to**: A beginner-friendly article that breaks down the
      fundamentals of setting up routes and navigating between
      them. [Link](https://dev.to/chukwuma1976/angular-routing-and-navigation-made-so-easy-a-child-could-do-it-4oem)
    * **Routing in Angular | Medium**: A practical overview of how routing works, including setting up RouterModule and
      using routerLink. [Link](https://medium.com/@jaydeepvpatil225/routing-in-angular-924066bde43)

* Video Resources:
    * **How to route in Angular (Angular Team) (4 min)**: A foundational, high-level explanation of the Angular Router's
      purpose directly from the Angular team.
        * [Play Video](https://www.youtube.com/watch?v=r5DEBMuStPw)
    * **Angular routing video focusing on SPAs (6 min)**: This video explains the concept of routing within the context
      of a Single Page Application (SPA) and how Angular handles it.
        * [Play Video](https://www.youtube.com/watch?v=Sp95tZHS-AM)
    * Angular Tutorials (General Routing) (45 min): A general tutorial covering the setup and implementation of routing
      in an Angular application.
        * [Play Video](https://www.youtube.com/watch?v=GKHQ5YOaL3Q)

### 2. Practical Routing: Parameters & Advanced Patterns

Learn to pass dynamic data to routes (e.g., user IDs) and structure your application for scalability using lazy loading
and route guards.

* **Articles / Reading**:
    * **Angular Router**: Everything You Need to Know: A comprehensive article that covers basic routing, route
      parameters, child routes, lazy loading, and route guards, touching on all learning
      objectives. [Link](https://www.google.com/search?q=https://angular.love/angular-router-everything-you-need-to-know)
    * (Refer back to the **Official Angular Guide** [Link](https://angular.io/guide/router) for the most detailed
      documentation on Route Parameters, Lazy Loading, and Route Guards.)
* Video Resources:
    * Angular 17 Routing for Beginners (39 min): A modern, practical guide that walks through setting up routing,
      navigating with routerLink, and specifically covers using Route Parameters to pass data.
        * [Play Video](https://www.youtube.com/watch?v=lIb_gnleUns)

### 3. Discussion Prompt

What is the primary benefit of lazy loading modules in an Angular application, and how does it impact the user's initial
load time and overall experience?