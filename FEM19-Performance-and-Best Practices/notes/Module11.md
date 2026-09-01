# FEM19: Performance & Best Practices

## Learning Objectives

Upon successful completion of this module, learners will be able to:

* **Optimize** an Angular application's performance by implementing lazy loading and OnPush change detection.
* **Analyze** an application's bundle size and identify optimization opportunities using source map analysis tools.
* **Refactor** code to adhere to Angular style guide conventions and accessibility (a11y) best practices.
* **Build** an Angular application for a production environment using the Angular CLI.
* **Deploy** a production-ready Angular application to a modern hosting platform (e.g., Firebase, Netlify, Vercel).

## Learning Approach

This module uses a Blended approach, combining self-paced microlearning with a hands-on, instructor-led session.
Performance optimization involves a set of specific, discrete techniques. Learners first consume short, focused content
on each technique (e.g., lazy loading, OnPush).

The live session then acts as a Cognitive Apprenticeship, where the instructor models the expert process of profiling,
identifying bottlenecks, and applying optimization techniques to a real-world code example. This bridges the gap between
theory and practical application.

## Learning Activities

* **Live Session:** Optimizing Apps: An instructor-led session where learners will use browser profiling tools to
  identify performance bottlenecks in an Angular application and apply optimization techniques like OnPush and lazy
  loading.
* **Formative Quiz:** An auto-graded quiz with multiple-choice and scenario-based questions focusing on change detection
  strategies, lazy loading syntax, accessibility principles, and Angular CLI build commands.

## Module Structure

| Lesson / Section | Main Topic                    | Format                 | Learning Activity / Outcome                                                       |
|------------------|-------------------------------|------------------------|-----------------------------------------------------------------------------------|
| **1**            | **Change Detection & OnPush** | Video + Reading        | Explain Angular's change detection mechanism and implement the `OnPush` strategy. |
| **2**            | **Lazy Loading**              | Reading + Video        | Refactor an application to lazy-load feature modules.                             |
| **3**            | **Accessibility (a11y)**      | Reading                | Audit and improve an application's accessibility.                                 |
| **4**            | **Building & Deployment**     | Reading + Video        | Build an application for production and explain deployment strategies.            |
| **5**            | **Optimizing Apps**           | Instructor-led Session | Analyze and apply profiling and optimization techniques to a sample application.  |
| **6**            | **Knowledge Check**           | Auto-graded Quiz       | Recall and identify key performance concepts and deployment steps.                |

## Resource Book

### 1. Core Performance Techniques

Learn the most impactful strategies for speeding up your Angular application, including OnPush change detection, lazy
loading, and analyzing your production build.

* Articles / Reading:

    * **[Angular Performance | Angular.io](https://angular.io/guide/performance)**: The official Angular guide. This is
      the primary resource, covering Lazy Loading (LO 1), AOT (Ahead-of-Time) compilation for production builds (LO 4),
      and other key concepts.

    *
  **[Unlocking Angular Performance Optimization Techniques | Code Magazine](https://www.codemag.com/Article/2507061/Unlocking-Angular-Performance-Optimization-Techniques)**:
  This article discusses various techniques, including using OnPush change detection (LO 1) and optimizing runtime
  performance.

    * **[Angular Performance Optimization | C-MARIX](https://www.cmarix.com/blog/angular-performance-optimization/)**:
      Provides an overview of multiple optimization strategies, including Lazy Loading (LO 1) and bundle optimization
      (LO 2).

* Video Resources:
    * [Play Video](https://www.youtube.com/watch?v=tMxrY7IL-Ac)
      : This presentation covers key optimization techniques, including a deep dive into Change Detection (OnPush) (LO
      1) and analyzing bundle sizes (LO 2).

    * [Play Video](https://www.youtube.com/watch?v=9kRievveGGU)
      : This video provides practical tips, covering Lazy Loading (LO 1) and ensuring you are building for production
      (LO 4).

    * [Play Video](https://www.youtube.com/watch?v=64TMz93YMq8)
      : A concise overview of top techniques, likely including Lazy Loading (LO 1) and OnPush (LO 1).

### 2. Best Practices & Code Quality

Optimize your application by refactoring code to adhere to established style guides, accessibility standards, and clean
code principles.

* Articles / Reading:
    * [Angular Best Practices in 2025: Write Clean, Performant, Scalable Code | Medium](https://medium.com/javarevisited/angular-best-practices-in-2025-write-clean-performant-scalable-code-f8e5c23e40a3):
      This guide covers clean code principles (LO 3) that lead to better performance, such as using OnPush and proper
      module structure.
    * [Best Practices for Angular Performance Optimization | dev.to](https://dev.to/eric_walter/best-practices-for-angular-performance-optimization-2ch9):
      This article provides a checklist of best practices, including OnPush (LO 1) and other refactoring (LO 3) tips.
* Video Resources:

    * [Play Video](https://www.youtube.com/watch?v=1Fi3LtwHQkc)
      : This video covers essential best practices for writing high-quality, maintainable Angular code, which is the
      foundation of refactoring (LO 3).

### 3. Building and Deploying for Production
Learn how to build your Angular application for a production environment and deploy it to various hosting platforms.

* **Articles / Reading**:

  * [Deployment | Angular.io](https://angular.io/guide/deployment): The official guide covering the production build process (LO 4) (ng build --configuration production) and different deployment strategies.
  * [Best Practices for Deploying Angular Applications to Production | Medium](https://www.google.com/search?q=https://medium.com/%2540AmnaJavaid/best-practices-for-deploying-angular-applications-to-production-244a816f2cb9): A guide covering key considerations for a smooth deployment.
  * [Advanced Angular Deployment Techniques for Performance and Scalability | Medium](https://medium.com/codex/advanced-angular-deployment-techniques-for-performance-and-scalability-6a29abc09898): Explores more advanced strategies for deploying large-scale applications.
  * [Deploy Angular to Firebase Hosting](https://firebase.google.com/docs/hosting/angular): A specific guide for deploying to Firebase, a popular platform.
* **Video Resources (Deployment Examples)**:

  * [Play Video](https://www.youtube.com/watch?v=OwvKBMmkXyk)
  : Covers setting up production environments (environment.prod.ts) and best practices for the build process (LO 4).

  * [Play Video](https://www.youtube.com/watch?v=-WJTQcWyBBM)
  : A practical walkthrough of deploying to Vercel (LO 5).

  * [Play Video](https://www.youtube.com/watch?v=dooGkvV-SwQ)
  : A guide to deploying your application to AWS S3 and serving it via CloudFront CDN (LO 5).

  * [Play Video](https://www.youtube.com/watch?v=IuELMXSAslo)
  : Demonstrates deploying to Azure and setting up a CI/CD pipeline (LO 5).

### 4. Discussion Prompt
Explain the difference between Angular's default (CheckAlways) and OnPush change detection strategies. What specific challenge might you face when refactoring a component to use OnPush, and how would you solve it?