# Advanced JavaScript: Task Manager API Client
## Learning Objectives

* **ES6+ JavaScript Mastery:** Use arrow functions, destructuring, spread/rest operators, template literals, and array methods (`map`, `filter`, `reduce`).
* **Asynchronous Programming:** Handle API requests using Promises and `async/await`, manage multiple concurrent requests with `Promise.all()`.
* **Class-Based Architecture:** Implement OOP principles with classes and inheritance to model tasks and users.
* **Module System:** Organize code using ES6 modules with proper `import`/`export` structure.
* **Error Handling:** Implement robust error handling for network requests and data processing.
* **Data Manipulation:** Transform and aggregate API data using modern array methods and data structures (`Map`, `Set`).

## Introduction

You will build a Task Manager API Client that fetches, processes, and manages task data from the JSONPlaceholder API. The focus is on modern ES6+ JavaScript practices, asynchronous programming patterns, object-oriented design, and modular code architecture. This project emphasizes backend-style JavaScript logic over UI implementation.

## Project Setup

### 1. Plan Your Architecture

* Identify the main modules needed: API client, task models, data processor, and main controller.
* Design class hierarchies for `Task`, `PriorityTask`, and `User`.
* Plan data flow from API → processing → output.

### 2. Set Up the JavaScript Codebase

* Structure code using ES6 modules (`api.js`, `models.js`, `taskProcessor.js`, `main.js`).
* Configure Node.js environment for running the application.
* Set up `package.json` with necessary dependencies.

### 3. Plan Your Features

* List core functionalities: fetch tasks, filter data, calculate statistics, display results.
* Identify opportunities to use different ES6+ features.
* Sketch out the data flow and module interactions.

## Tasks

### 1. JavaScript Functionality Implementation

#### A. API Integration (Async Operations)

* Create an `APIClient` class with methods to fetch users and todos from JSONPlaceholder API.
* Implement both Promise-based and `async/await` approaches.
* Use `Promise.all()` to fetch multiple resources concurrently.
* Handle network errors and invalid responses gracefully.

#### B. Class-Based Models

**Task Base Class**

* Properties: `id`, `title`, `completed`, `userId`
* Methods: `toggle()`, `isOverdue()`, `getStatus()`

**PriorityTask Extended Class**

* Inherits from `Task`
* Additional properties: `priority`, `dueDate`
* Overridden methods with priority-specific logic

**User Class**

* Properties: `id`, `name`, `email`, `tasks`
* Methods: `addTask()`, `getCompletionRate()`, `getTasksByStatus()`

#### C. Data Processing

* Use `map()` to transform API data into class instances.
* Use `filter()` to implement task filtering by status, user, or priority.
* Use `reduce()` to calculate statistics (completion rates, task counts).
* Implement caching using closures to demonstrate scope concepts.

#### D. Advanced Features

* Group tasks by user using `Map` data structure.
* Extract unique tags/categories using `Set`.
* Implement task search functionality.
* Create a statistics generator with aggregated metrics.

### 2. ES6+ Feature Implementation

Apply modern syntax throughout:

* **Arrow Functions:** Use in all callbacks (`.map()`, `.filter()`, `.then()`).
* **Destructuring:** Extract properties from API responses and function parameters.
* **Template Literals:** Format output strings and API URLs.
* **Spread/Rest Operators:**

  * Spread: Merge task objects, clone arrays
  * Rest: Handle variable function parameters
* **Default Parameters:** Provide fallback values in functions.
* **Optional Chaining:** Safely access nested API response properties.

### 3. Module Organization

Split code into ES6 modules:

**api.js**

```js
export class APIClient {
  async fetchUsers() { ... }
  async fetchTodos() { ... }
  async fetchUserTodos(userId) { ... }
}
```

**models.js**

```js
export class Task { ... }
export class PriorityTask extends Task { ... }
export class User { ... }
```

**taskProcessor.js**

```js
export const filterByStatus = (tasks, status) => { ... }
export const calculateStatistics = (tasks) => { ... }
export const groupByUser = (tasks) => { ... }
```

**main.js**

```js
import { APIClient } from './api.js';
import { Task, PriorityTask, User } from './models.js';
import * as processor from './taskProcessor.js';
```

### 4. Error Handling Implementation

Implement robust error management:

* Use `try/catch` blocks with `async/await`.
* Create custom error messages for different failure scenarios.
* Implement fallback behaviors when API calls fail.
* Log errors appropriately for debugging.
* Handle edge cases (empty responses, malformed data, network timeouts).

### 5. Command-Line Interface (Simple UI)

* Implement a basic CLI menu system for interaction.
* Display formatted output using template literals.
* Show task lists, user statistics, and filtered results.
* Keep UI minimal to maintain focus on JavaScript fundamentals.

## Evaluation Criteria

| Criteria                           | Score | Description                                                                                                                                                                        |
| ---------------------------------- | ----: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Use of ES6+ Features               |   25% | Effectively uses ES6+ features like arrow functions, destructuring, spread/rest operators, template literals, and optional chaining to write cleaner, more concise code.           |
| Asynchronous Programming           |   25% | Successfully implements async operations using both Promises and async/await, demonstrates `Promise.all()` for concurrent requests, and handles errors appropriately.              |
| Class-Based Architecture           |   20% | Demonstrates proper OOP principles with well-designed classes and meaningful inheritance relationships between Task, PriorityTask, and User classes.                               |
| Code Organization & Modules        |   20% | Demonstrates clear code structure with well-organized ES6 modules and proper use of `import`/`export` to ensure modular, maintainable, and reusable code.                          |
| Data Manipulation & Error Handling |   10% | Effectively uses array methods (`map`, `filter`, `reduce`) and data structures (`Map`, `Set`) to transform data, plus implements robust error handling throughout the application. |

## Bonus Challenges (Optional)

* Implement a caching system to avoid redundant API calls (demonstrates closure and scope).
* Add task sorting with multiple criteria using `.sort()` with custom comparators.
* Create a `TaskManager` controller class that orchestrates all operations.
* Implement rate limiting for API requests using Promises.
* Add data export functionality (JSON format).
* Build a simple web interface to visualize the data.
