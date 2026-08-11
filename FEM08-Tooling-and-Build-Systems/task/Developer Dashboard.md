# Tooling & Build Systems: Developer Dashboard
## Learning Objectives

- **Configure a Modern Front-End Project:** Set up a front-end environment using npm or Yarn to manage dependencies and scripts.
- **Automate Development and Builds:** Use Vite to bundle modules, enable hot reloading, and generate optimized production builds.
- **Enforce Code Quality Standards:** Integrate and configure ESLint to detect and prevent code inconsistencies.
- **Maintain Consistent Code Style:** Apply Prettier for automatic code formatting and alignment with team standards.
- **Analyze Build Optimization:** Examine how Vite and related build tools improve application performance and maintainability.

## Introduction

In this lab, you will create a lightweight **Developer Dashboard** web application — a simple client-side tool that displays a list of "developer resources" such as tutorials, documentation links, or tools.

The goal is to focus on **front-end tooling setup**, **build automation**, and **code quality configuration**, rather than application complexity. You will initialize and configure a **modern development workflow** using npm/Yarn, Vite, ESLint, and Prettier — simulating how professional developers manage scalable codebases efficiently.

## Project Setup

### 1. Tooling and Initialization

- **Initialize Project:** Create a new folder and initialize it with npm or Yarn (`npm init -y` or `yarn init -y`).
- **Install Vite:** Run `npm create vite@latest` and select a JavaScript or TypeScript template (e.g., Vanilla, React, or Vue).
- **Run the Dev Server:** Use `npm run dev` to confirm Vite is serving the app locally.
- **Inspect the Project Structure:** Observe the automatically created files and directories (index.html, vite.config.js, src/main.js, etc.).

## Tasks

### 2. Build Automation with Vite

- **Configure Build Settings:** Open vite.config.js and explore options such as root, build.outDir, and base.
- **Add a Custom Script:** In package.json, add scripts like `"start": "vite"`, `"build": "vite build"`, and `"preview": "vite preview"`.
- **Build for Production:** Run `npm run build` and inspect the generated dist/ folder.
- **Analyze the Output:** Compare file sizes and observe minification, bundling, and module optimization.

### 3. Enforcing Code Quality (ESLint)

- **Install ESLint:** Run `npm install eslint --save-dev`.
- **Initialize ESLint:** Use `npx eslint --init` and choose:
  - "To check syntax, find problems, and enforce code style."
  - Your preferred framework (if any).
  - "JavaScript modules (import/export)."
- **Customize Rules:** In `.eslintrc.json`, enable strict rules (e.g., `"no-unused-vars": "error"`, `"eqeqeq": "warn"`).
- **Run ESLint:** Test it with `npx eslint src/` and correct any linting errors detected.

### 4. Consistent Code Formatting (Prettier)

- **Install Prettier:** Run `npm install --save-dev prettier`.
- **Configure Prettier:** Create `.prettierrc` with your preferred settings.
- **Ignore Build Files:** Add a `.prettierignore` file to exclude /dist and node_modules.
- **Format Automatically:** Run `npx prettier --write .` and verify that all files follow a uniform format.
- **Integrate ESLint + Prettier (Optional Advanced Step):** Install eslint-config-prettier and extend ESLint configuration to include "prettier" in "extends".

### 5. Application Implementation and Analysis

- **Develop the Developer Dashboard:** In src/main.js, create an array of developer resources (objects with name, category, link) and dynamically render these resources into a list or grid using template literals.
- **Add Interactivity:** Add a search or filter input that dynamically updates the displayed resources.
- **Apply Build Tools in Context:** Run the build process again and confirm all modern optimizations are applied.
- **Reflection:** Write a short (3–5 sentence) explanation of how Vite's build process improves your app's performance and developer experience.

## Evaluation Criteria

| Criteria | Score | Description |
|---|---|---|
| Tooling & Configuration | 25 | Project initialized with npm/Yarn and correctly configured with Vite. Build scripts and outputs verified. |
| Build Process & Optimization | 20 | Demonstrates understanding of build automation, output structure, and bundling. |
| Code Quality (ESLint) | 20 | ESLint configured and functioning with meaningful rules applied and issues resolved. |
| Code Formatting (Prettier) | 15 | Prettier properly configured and applied consistently across the project. |
| Functionality & UI Implementation | 10 | Developer Dashboard displays data dynamically and interacts smoothly. |
| Reflection & Analysis | 10 | Insightful explanation of build tool benefits and performance optimizations. |
