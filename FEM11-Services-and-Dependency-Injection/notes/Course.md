# FEM11: Services & Dependency Injection
## Learning Objectives 🎯
Upon successful completion of this module, learners will be able to:
* **Develop** injectable services to encapsulate and share business logic.
* **Utilize** Angular's DI framework to provide services to components.
* **Refactor** component-based state and logic into singleton services.
* **Integrate** Angular's HttpClient within a service to manage async data.
* **Analyze** the provider hierarchy and its impact on service scope.

## Learning Approach
 This module employs a **Cognitive Apprenticeship model**. Services and Dependency Injection are core architectural patterns in Angular that represent an expert way of structuring applications. The learning materials will model the process of identifying business logic and state within components, abstracting it into a service, and providing that service back to components where needed.

The learning path begins with the fundamental concept of creating a service (Apply). It then moves to the more complex task of refactoring existing component logic into a service, a common real-world task (Apply/Analyze). The "Dessert Shop App (Part II)" lab requires learners to use a service to manage shared state across different components, solidifying the principles of DI and separation of concerns.

Active practice is centered on the lab. Learners receive immediate feedback from their development environment. All final lab submissions are then reviewed by a TA in a live code review session to provide expert feedback on code quality, architecture, and best practices.

## Learning Activities

* **Hands-on Coding Lab**: The central activity is the "Dessert Shop App (Part II – Services Integration)." Learners will extend their Dessert Shop App by introducing Angular Services and applying DI principles. They will refactor existing logic (e.g., dessert data retrieval) into reusable services and manage shared state (e.g., a shopping cart) across components, demonstrating improved maintainability and separation of concerns.
* **Formative Quiz** An auto-graded quiz with multiple-choice questions to verify understanding of decorators (@Injectable), provider scopes, and strategies for using services to share data.

## Module Structure

| Lesson / Section | Main Topic                        | Format           | Learning Activity / Outcome                                                                      |
| ---------------- | --------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------ |
| **1**            | **Understanding Services & DI**   | Video + Reading  | Explain the purpose of services and the role of dependency injection.                            |
| **2**            | **Creating & Injecting Services** | Reading + Video  | Generate a new service using the Angular CLI and inject it into components.                      |
| **3**            | **Managing State**                | Reading          | Implement a service to manage and share application state between components.                    |
| **4**            | **Service Scope & Providers**     | Reading + Video  | Analyze the provider hierarchy and distinguish between root-level and component-level providers. |
| **5**            | **Knowledge Check**               | Auto-graded Quiz | Recall and identify key concepts related to services, providers, and `@Injectable()`.            |
| **6**            | **Hands-On Lab**                  | Coding Lab       | Refactor the **"Dessert Shop App"** to manage application logic and state through services.      |

## Resource Book
### 1. Core Concepts: What Are Services & DI?
Understand the "why" behind services and Dependency Injection (DI). Learn how services help you create reusable code and manage state, and how DI (a form of Inversion of Control) makes your components cleaner and easier to test.

* Articles / Reading:
  * **Understanding Angular Dependency Injection (How it works, Best Practice) | dev.to**: A clear overview of the DI mechanism, why it's used, and common best practices. [Link](https://dev.to/artem_turlenko/understanding-angular-dependency-injection-how-it-works-best-practice-2j68)
  * **Angular Dependency Injection | Angular University**: A deep dive into the concepts of DI, the provider hierarchy, and how Angular finds the services to inject. [Link](https://blog.angular-university.io/angular-dependency-injection/)

* Video Resources:
  * **Services and Dependency Injection (Angular Team) (4 min)**: A foundational explanation directly from the Angular team, perfect for starting.
    * [Youtube vid](https://www.youtube.com/watch?v=-jRxG84AzCI)
  * Services & Dependency Injection (11 min): A practical overview of creating a service and injecting it into a component.
    * [Youtube vid](https://www.youtube.com/watch?v=l2WWB6_m5fI)

### 2. Practical Implementation: Providers & Injectors
Learn the specific syntax for making a service "injectable" (@Injectable), how to "provide" it (e.g., providedIn: 'root'), and how to use the @Inject decorator for more specific cases.

* Articles / Reading:
  * Mastering Dependency Injection in Angular 2025: The Complete Developer Guide: A modern, in-depth guide covering providedIn, provider scopes, and advanced DI patterns. [Link](https://javascript.plainenglish.io/mastering-dependency-injection-in-angular-2025-the-complete-developer-guide-e8c56af9dc55)
  * Mastering Dependency Injection in Angular: Best Practices and Examples | Medium: Provides practical examples and discusses best practices for different provider strategies. [Link](https://www.google.com/search?q=https://medium.com/%2540ashokpalla541/mastering-dependency-injection-in-angular-best-practices-and-examples-d0ee49f24592) 
* Video Resources:
  * Angular 20 Dependency Injection for Beginners (24 min): A step-by-step tutorial on how the DI system works, including providers and injectors. 
    * [Play Youtube Video](https://www.youtube.com/watch?v=6xYJK-Ih3bU) 
  * Angular service injection with @Inject Decorator (11 min): Explains the specific use case for the @Inject decorator when a type alone isn't enough (e.g., injecting non-class values). [Link](https://www.google.com/search?q=https://www.youtube.com/watch%3Fv%3D8QCUo_Wvxc8)

### 3. Services for Async Data: HttpClient
A primary use for services is to manage data fetching from external APIs. This section covers using Angular's built-in HttpClient within a service.

* Articles / Reading:
  * Communicating with backend services using HTTP | Angular.io: The official guide explaining how to set up HttpClientModule, inject the HttpClient service, and perform requests to fetch data asynchronously. [Link](https://v17.angular.io/guide/understanding-communicating-with-http)
* Video Resources:
  * Angular HttpClient Crash Course (38 min): A practical tutorial demonstrating how to use HttpClient in an Angular service to fetch data from an API and display it in a component. 
    * [Play YouTube Video](https://www.youtube.com/watch?v=ZmH3DKkahLE) 
  * Angular HTTP Client - GET POST PUT DELETE (34 min): This video covers the essential HTTP methods (GET, POST, PUT, DELETE) using HttpClient to perform full CRUD operations against a backend. 
    * [Play YouTube Video](https://www.youtube.com/watch?v=ezwqhbTQcLc)

### 4. Discussion Prompt
What is the difference between providing a service in root (using @Injectable({ providedIn: 'root' })) versus adding it to the providers array of a specific component? Describe a scenario where you might not want a service to be a singleton.