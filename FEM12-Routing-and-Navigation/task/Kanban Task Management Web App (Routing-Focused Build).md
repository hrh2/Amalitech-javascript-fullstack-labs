# Routing & Navigation: Kanban Task Management Web App (Routing - Focused Build)
## Introduction

In this lab, learners will develop a simplified version of a **Kanban Task Management Web App** to apply **Angular Routing and Navigation** concepts.

They will configure routes, implement different navigation methods, create modular route structures, and secure navigation paths using route guards.

This lab focuses on building a **Single Page Application (SPA)** architecture with clean route organization and scalable design patterns for larger Angular applications.

## Learning Objectives

By the end of this lab, learners should be able to:

- Explain the purpose of Angular Router in creating SPAs.
- Define and organize routes using the Angular RouterModule.
- Implement navigation through links, active route indicators, and programmatic routing.
- Use route and query parameters for dynamic navigation.
- Configure child routes and lazy-loaded modules for modular scalability.
- Apply route guards such as CanActivate and CanDeactivate for route protection.
- Follow best practices for structuring routes in medium-to-large Angular projects.

## Lab Requirements

- Node.js (v18 or later)
- Angular CLI (latest version)
- Code Editor (VS Code recommended)
- GitHub account
- Netlify or Vercel account for deployment
- Reference design assets for layout guidance

**Estimated Time:** 5 hours

## Lab Tasks

### Task 1: Project Setup

- Create a new Angular project for the Kanban Task Management Web App.
- Clean up the initial structure by removing unnecessary files and preparing it for routing configuration.
- Ensure the application runs successfully before proceeding.

### Task 2: Configure the Angular Router

- Set up Angular routing for the application.
- Define routes for key pages such as: a main boards view, a board details view, a settings page, and a fallback route for undefined paths.
- Ensure each route corresponds to the correct page component.
- Test route navigation using the browser and confirm expected behavior.

### Task 3: Create Core Components and Routes

- Create components to represent the main sections of the application (boards, board details, settings, and not-found).
- Connect these components to the defined routes.
- Establish a simple layout or navigation bar to move between different sections of the app.
- Verify navigation between pages without reloading the browser.

### Task 4: Implement Navigation

- Add navigation links to the application using Angular's routing features.
- Highlight the active link within the UI for better user experience.
- Implement programmatic navigation to switch between routes based on user actions.
- Discuss navigation events such as route start, completion, and error handling.

### Task 5: Work with Route Parameters

- Create routes that accept dynamic parameters (e.g., a route for viewing a specific board).
- Use these parameters to control the displayed content.
- Include optional query parameters for additional functionality such as filtering or sorting.
- Verify that the application responds correctly when parameters change.

### Task 6: Advanced Routing Patterns

- Add a feature module for the board section and configure it to load lazily.
- Define child routes within the feature module to represent nested content (e.g., specific columns or tasks).
- Discuss advanced patterns such as route preloading and auxiliary routes for multi-view layouts.
- Ensure that lazy-loaded routes improve modularity and reduce the initial bundle size.

### Task 7: Implement Route Guards

- Create guards to protect specific routes and control navigation flow.
- Apply authentication guards to restrict access to certain pages.
- Add deactivation guards to prevent users from losing unsaved changes when navigating away.
- Review how route guards enhance application security and user experience.

### Task 8: Testing and Verification

- Test all route configurations to ensure correct navigation between pages.
- Verify that lazy-loaded modules load only when needed.
- Confirm that guards function properly by blocking or allowing navigation as configured.
- Ensure the active route is visually indicated and the SPA navigation experience is seamless.

### Task 9: Deployment

- Commit and push the routing-enabled application to GitHub.
- Deploy the project to Netlify or Vercel.
- Confirm that all routes work correctly in the deployed environment, including fallback routes and navigation between pages.

### Bonus Task (Optional): Nested Layout and Redirects

- Create a shared layout that includes elements such as a persistent sidebar or header across all routes.
- Add redirect rules to handle default routes (e.g., redirecting `/` to `/boards`).
- Implement a custom "Page Not Found" view for undefined routes.

## Assessment Criteria

| Criteria | Weight | Description |
|---|---|---|
| Route Configuration | 25% | Routes are properly defined and organized. |
| Navigation Implementation | 20% | Clear and functional navigation using routerLink and programmatic routing. |
| Advanced Routing Patterns | 25% | Implementation of lazy loading, child routes, and route parameters. |
| Route Guards & Security | 20% | Effective use of route guards for access control and user protection. |
| Code Structure & Best Practices | 10% | Clean, modular, and maintainable routing configuration. |

## Lab Deliverables

- Simplified **Kanban Task Management Web App** with routing and navigation implemented.
- Organized routing structure with navigation links and guards.
- Public GitHub repository with clean commit history and documentation.
- Deployed live app URL.
