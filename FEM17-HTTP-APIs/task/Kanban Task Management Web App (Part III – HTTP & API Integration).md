# HTTP & APIs: Kanban Task Management Web App
## Introduction

In this lab, learners will extend their **Kanban Task Management Web App** to interact with external or mock APIs using Angular's **HttpClient** module.

They will implement data retrieval, creation, updating, and deletion of tasks and boards through API calls, demonstrating how to connect a frontend Angular application to a backend data source.

This lab emphasizes **separation of concerns**, **reusable service architecture**, and **robust error handling** for production-ready applications.

## Learning Objectives

By the end of this lab, learners should be able to:

- Explain the role of HttpClient in Angular applications.
- Configure and use Angular's HttpClient module to perform CRUD operations.
- Structure API calls through dedicated data services.
- Manage asynchronous data using Observables.
- Handle API errors and display appropriate feedback to users.
- Integrate form submissions with backend endpoints.
- Apply best practices for scalability, maintainability, and user experience.

## Lab Requirements

- Node.js (v18 or later)
- Angular CLI (latest version)
- Existing **Kanban Task Management Web App** project (from Forms & Validation module)
- Code Editor (VS Code recommended)
- Mock API endpoint or JSON server (if no backend is available)
- GitHub account
- Netlify or Vercel account for deployment

**Estimated Time:** 5 hours

## Lab Tasks

### Task 1: Review and Preparation

- Open the existing Kanban Task Management Web App project.
- Review the current data handling approach (in-memory or static data).
- Prepare the application to fetch and update task and board data from a remote or mock API.

### Task 2: Enable HTTP Functionality

- Ensure that Angular's HttpClient module is available within the app.
- Prepare the environment for API communication by organizing configuration settings (e.g., base URLs, endpoints).
- Confirm that the application builds successfully after setup.

### Task 3: Create a Data Service Layer

- Develop a dedicated service for managing data interactions (e.g., BoardService, TaskService).
- Centralize all HTTP operations such as fetching, creating, updating, and deleting data.
- Ensure that the services follow best practices for dependency injection and reusability.

### Task 4: Retrieve and Display Data

- Fetch board and task data from the API and display it dynamically in the relevant components.
- Ensure data is loaded efficiently and handles empty or missing states gracefully.
- Use reactive data patterns to keep the UI synchronized with API responses.

### Task 5: Integrate API with Forms

- Connect the "Add Task" and "Edit Task" forms with the API to create and update task data remotely.
- Ensure that submitting a form triggers appropriate API actions and updates the application state.
- Provide feedback to users after successful or failed submissions.

### Task 6: Implement Deletion and Updates

- Add functionality to delete tasks or boards using API calls.
- Ensure that deletions are confirmed through user interaction before proceeding.
- Update task or board data dynamically to reflect server changes without requiring a full reload.

### Task 7: Handle Errors and Loading States

- Implement error handling within the data services to manage failed requests gracefully.
- Display informative messages or indicators when API calls fail.
- Add loading indicators to improve user experience during data fetch operations.

### Task 8: Optimize Data Handling

- Explore strategies to minimize unnecessary API calls, such as caching or shared observables.
- Ensure that data updates propagate smoothly across components using services or signals.
- Discuss or demonstrate the benefits of separating API logic from UI components for scalability.

### Task 9: Testing and Verification

- Test all API interactions (GET, POST, PUT, DELETE) to ensure consistent functionality.
- Verify that forms and routes integrate correctly with backend data.
- Check that error and loading states display as expected.
- Confirm that the app builds successfully with no console errors.

### Task 10: Deployment

- Commit and push all project changes to GitHub.
- Redeploy the application to Netlify or Vercel.
- Verify that API integrations work correctly in the live environment.
- Ensure API URLs and configurations are properly set for production deployment.

### Bonus Task (Optional): Environment Configuration

- Create separate configurations for development and production environments.
- Store base URLs or API keys securely using Angular's environment files.
- Test switching between environments to confirm correct API connections.

## Assessment Criteria

| Criteria | Weight | Description |
|---|---|---|
| API Integration | 25% | Application successfully interacts with a backend API for CRUD operations. |
| Service Design | 25% | Data service layer is modular, reusable, and follows best practices. |
| Error Handling & Feedback | 20% | Application manages API errors and provides clear user feedback. |
| Data Synchronization | 20% | UI updates consistently with API responses. |
| Code Quality & Structure | 10% | Clean, maintainable, and scalable code organization. |

## Lab Deliverables

- Updated **Kanban Task Management Web App** with full HTTP and API integration.
- Organized and reusable data service structure.
- GitHub repository with clear commit history and documentation.
- Deployed app URL with live API integration.
