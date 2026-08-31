# Angular Forms: Kanban Task Management Web App
## Introduction

In this lab, learners will extend the **Kanban Task Management Web App** by implementing **forms** for creating and editing tasks within boards.

They will explore both **template-driven** and **reactive forms**, apply **form validation**, and handle user input to maintain data consistency and improve the user experience.

This lab focuses on building clean, interactive, and user-friendly forms that integrate seamlessly with Angular's routing structure and component architecture.

## Learning Objectives

By the end of this lab, learners should be able to:

- Explain the purpose of Angular forms and the difference between template-driven and reactive forms.
- Build form interfaces that allow users to add and edit tasks.
- Apply built-in and custom validation rules to ensure data accuracy.
- Display clear validation messages to guide user input.
- Manage form data flow between components using binding and events.
- Reset, update, and submit forms while maintaining clean state management.
- Follow best practices for organizing form logic within Angular applications.

## Lab Requirements

- Node.js (v18 or later)
- Angular CLI (latest version)
- Existing **Kanban Task Management Web App** project from the Routing & Navigation module
- Code Editor (VS Code recommended)
- GitHub account
- Netlify or Vercel account for deployment

**Estimated Time:** 5 hours

## Lab Tasks

### Task 1: Review and Setup

- Open the existing Kanban Task Management Web App project.
- Review existing routes and components to identify where forms will be integrated (e.g., "Add Task" or "Edit Task" views).
- Prepare the application to support new form components while maintaining the current routing structure.

### Task 2: Create Task Form Components

- Create a dedicated component for adding new tasks and another for editing existing tasks.
- Integrate both into the routing system using appropriate routes (e.g., `/board/:id/new-task` and `/board/:id/edit/:taskId`).
- Ensure that the form components are structured for clarity and reusability.

### Task 3: Build the Form Structure

- Design forms that capture all necessary task details such as title, description, status, and due date.
- Use Angular's form controls to manage input fields and organize them logically within the template.
- Ensure form fields align with the Kanban board's task structure and design consistency.

### Task 4: Apply Form Validation

- Define validation rules for required fields such as title and status.
- Apply both **built-in** and **custom** validators to enforce constraints (e.g., preventing duplicate titles or enforcing length limits).
- Display user-friendly error messages when validation fails.
- Ensure validation feedback updates dynamically as the user interacts with the form.

### Task 5: Handle Form Submission and State

- Implement logic to handle user submission of the form.
- Ensure that valid data updates the board's task list correctly.
- Provide visual feedback or notifications upon successful submission or error.
- Maintain a consistent form state, including clearing or resetting after submission.

### Task 6: Edit and Update Existing Tasks

- Enable the ability to load existing task details into the edit form.
- Ensure that users can update task data and save changes without affecting other tasks.
- Maintain proper data flow between the board view and the form component.

### Task 7: Integrate Forms with Navigation

- Configure navigation to direct users to the form pages when adding or editing tasks.
- Use route parameters to determine whether the form is for creating or editing.
- Ensure users are redirected appropriately after submitting or cancelling a form action.

### Task 8: User Experience Enhancements

- Implement confirmation messages before discarding unsaved changes.
- Optionally, apply a CanDeactivate guard to warn users if they attempt to navigate away from a form with unsaved edits.
- Refine the form layout for accessibility and responsiveness.

### Bonus Task (Optional): Subtasks and Multi-Field Controls

- Extend the task form to include a subtask section where users can add or remove multiple items dynamically.
- Apply validation to ensure each subtask has a valid name or status.
- Experiment with advanced form controls such as FormArrays.

### Task 9: Testing and Verification

- Verify that both "Add Task" and "Edit Task" forms function as expected.
- Confirm that validation rules trigger correctly and prevent invalid submissions.
- Ensure that form navigation (including redirects and guards) behaves as intended.
- Test the application's responsiveness and data flow.

### Task 10: Deployment

- Commit and push updates to your GitHub repository.
- Redeploy the application to your hosting platform (Netlify or Vercel).
- Validate that all routes, forms, and navigation work correctly in the deployed environment.

## Assessment Criteria

| Criteria | Weight | Description |
|---|---|---|
| Form Structure & Design | 25% | Forms are logically organized and visually aligned with the project design. |
| Validation Implementation | 25% | Proper use of validation rules with clear, user-friendly feedback. |
| Data Management | 20% | Correct handling of form data and integration with existing components. |
| Navigation Integration | 15% | Seamless routing between form and board views. |
| Code Quality & Best Practices | 10% | Clean structure, maintainability, and consistent naming. |
| User Experience | 5% | Clear feedback, accessibility, and responsiveness. |

## Lab Deliverables

- Updated **Kanban Task Management Web App** with working task creation and editing forms.
- Public GitHub repository with clear commit history and descriptive README.
- Deployed live app URL.
