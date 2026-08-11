# FEM08: Tooling & Build Systems
## Learning Objectives
Upon successful completion of this module, learners will be able to:

* Configure a modern front-end project using a package manager like npm or Yarn.
* Automate the development and build process by bundling modules with Vite.
* Enforce code quality standards by integrating ESLint into a project workflow.
* Format code automatically using Prettier to maintain a consistent style across a codebase.
* Analyze the role of build tools in optimizing applications for production environments.


## Learning Approach

This module is structured as a **Cognitive Apprenticeship**. The topic involves a specific professional workflow for setting up and maintaining a development environment, which is best learned by observing an expert model and then replicating it. The learning materials will demonstrate the "how" and "why" behind each tool.

Learners begin by understanding the purpose of each tool in isolation (Understand). They then apply this knowledge by configuring each tool within a sample project (Apply). The final lab requires them to integrate all the tools into a cohesive, automated workflow, mirroring a real-world project setup (Apply/Analyze). Learners receive immediate feedback from their development environment. All final lab submissions are then reviewed by a TA in a live code review session to provide expert feedback on code quality, architecture, and best practices.

 ## Learning Activities

**Hands-on Coding Lab**: The central activity is the "Developer Dashboard" lab. In this lab, you will create a lightweight Developer Dashboard web application — a simple client-side tool that displays a list of “developer resources” such as tutorials, documentation links, or tools. The goal is to focus on front-end tooling setup, build automation, and code quality configuration, rather than application complexity. You will initialize and configure a modern development workflow using npm/Yarn, Vite, ESLint, and Prettier — simulating how professional developers manage scalable codebases efficiently.

**Formative Quiz:** An auto-graded quiz with multiple-choice questions focused on the commands and configuration files (package.json, vite.config.js, .eslintrc, .prettierrc) for the tools covered.

## Module Structure

| Lesson / Section | Main Topic            | Format (video, reading, exercise, live session) | Learning Activity / Outcome                                                      |
| ---------------- | --------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------- |
| 1                | The Tooling Ecosystem | Video + Reading                                 | Explain the purpose of package managers, bundlers, linters, and formatters.      |
| 2                | Package Management    | Reading + Video                                 | Initialize a project and manage dependencies using npm or Yarn.                  |
| 3                | Module Bundling       | Reading                                         | Set up a development server and bundle an application for production using Vite. |
| 4                | Code Quality          | Reading + Video                                 | Integrate ESLint and Prettier to automatically check and format code.            |
| 5                | Knowledge Check       | Auto-graded Quiz                                | Recall and identify the commands and configuration options for key tools.        |
| 6                | Hands-On Lab          | Coding Lab                                      | Build the "Developer Dashboard" with a full tooling setup.                       |

## Resource Book

### 1. Package Management: npm & Yarn 📦
Learn how package managers help you manage project dependencies (external libraries and tools).

* Articles:

    * **About npm:** Official documentation explaining what npm (Node Package Manager) is, its role in the Node.js ecosystem, and how it manages packages. [Link](https://docs.npmjs.com/about-npm)

    * **Yarn** - Getting Started: Official documentation for Yarn, an alternative package manager, covering its installation and basic usage. [Link](https://yarnpkg.com/getting-started)

* **Video: npm vs Yarn - Which Package Manager Should You Use?** by Web Dev Simplified

    * This video compares npm and Yarn, discussing their features, differences, and helping you understand when you might choose one over the other.
    * [Video](https://www.youtube.com/watch?v=BiBjuphZQxA)

### 2. Build Tools & Bundlers: Vite & Webpack ⚡🧱
Understand how build tools process your code (like JavaScript, CSS, TypeScript) and bundle it for efficient delivery to the browser.

* Articles:

    * Vite - Guide: Official Vite documentation explaining its fast development server, build process, and how it leverages modern browser features. [Link](https://vite.dev/guide/)

    * Webpack - Guides: Official Webpack documentation. While Vite is often preferred for new projects, understanding Webpack provides context as it's a widely used and powerful bundler. [Link](https://webpack.js.org/guides/)

* Video: Vite Crash Course – Frontend Build Tool by freeCodeCamp.org

    * A practical introduction to Vite, demonstrating how to set up different types of projects (Vanilla JS, React, Vue), use its development server features, and build an application for production.
    * [Video](https://www.youtube.com/watch?v=do62-z3z6FM)

### 3. Code Quality & Formatting: ESLint, Prettier & More ✨💅
Learn how to use linters like ESLint to find errors, formatters like Prettier for consistent style, and tools like Husky and Lint-Staged to automate these checks.

* Article: Configure ESLint: Official ESLint documentation explaining how to configure rules and environments for your project.[ Link](https://eslint.org/docs/latest/use/configure/)

* Video: Setup ESLint, Prettier, Husky & Lint-Staged in React | TypeScript + Vite Best Practices by IterateX

    * This comprehensive video shows how to integrate multiple code quality tools: ESLint (linting), Prettier (formatting), Husky (Git hooks), and Lint-Staged (run checks on staged files) within a modern React/Vite/TypeScript project for automated quality control.
    * [Video](https://www.youtube.com/watch?v=kbvL7SWvjY0)

### 4. Discussion Prompt
Vite is known for its fast development server compared to older bundlers like Webpack. What architectural choices allow Vite to achieve this speed during development?