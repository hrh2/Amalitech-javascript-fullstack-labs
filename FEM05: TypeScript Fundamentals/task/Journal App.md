# TypeScript Fundamentals: Journal App
## Learning Objectives

· Analyze and Demonstrate Type Safety: Understand the purpose and benefits of using TypeScript by identifying and resolving type-related compilation errors.

· Configure and Compile TypeScript: Set up and configure a TypeScript project using tsconfig.json, and successfully compile the source code into runnable JavaScript.

· Design Type-Safe Data Models: Apply Interfaces, Enums, and Generics to strictly define data structures for improved code scalability and clarity.

· Perform Type-Safe DOM CRUD Operations: Apply strong typing to dynamically Create, Read, Update, and Delete elements in the Document Object Model, ensuring data integrity throughout the application lifecycle.

## Introduction

You will build a dynamic, client-side Journal Application. This app allows a user to write and save personal journal entries; each associated with a specific mood.

The primary focus is mastering TypeScript's type system, interfaces, and tooling. You must use TypeScript to define strict data contracts that ensure the application is robust and scalable before any code is executed in the browser.

## Project Setup

### 1. Tooling and Configuration

· Initialize TypeScript: Create a new Node project and install typescript and ts-node as development dependencies.

· Create tsconfig.json: Use npx tsc --init and configure the compiler options:

o Enable "strict": true to enforce maximum type safety.

o Set appropriate rootDir and outDir (e.g., ./src and ./dist).

o Set the target to a modern standard (e.g., "es2020").

### 2. Codebase Structure

The application logic must be written in TypeScript (.ts files) and compiled into JavaScript.

· index.html: The main entry point (links to the compiled .js files in the dist directory).

· src/journal.ts: Core application logic and event handlers.

· src/storage.ts: Handles type-safe data serialization/deserialization with localStorage.

· src/ui.ts: Handles all type-safe DOM manipulation.

## Tasks

### 1. Data Typing and Modeling

· Define Core Interface: Create a required JournalEntry interface that dictates the exact structure of a single entry:

interface JournalEntry { id: string; title: string; content: string; mood: Mood; // Must use the Mood Enum timestamp: number; }

· Use Enums: Create a required Mood Enum to define the possible mood categories (e.g., HAPPY, SAD, MOTIVATED, STRESSED, CALM).

· Define Type Alias (Optional Challenge): Create a type alias for the collection: type Journal = JournalEntry[];

### 2. Generic and Type-Safe Functionality

(Covers: Work with types, interfaces, and generics)

· Generic Utility Function: Implement a reusable function in journal.ts that uses a Generic Type Parameter <T> to safely find an item by a property (e.g., ID) within any array of objects.

function findByProperty<T>(list: T[], key: keyof T, value: T[keyof T]): T | undefined { /* ... */ }

· Type Assertion for Storage: In storage.ts, ensure that data loaded from localStorage is correctly parsed and asserted to be a JournalEntry[]. Handle the null case from localStorage gracefully and type-safely.

· Type-Safe Mutations: Write the addEntry function to accept a partial entry and enforce the JournalEntry interface upon creation, ensuring all fields are present and correctly typed before saving.

### 3. Application Integration and Compilation

(Covers: Apply TypeScript concepts in small applications & Compilation)

· Implement Core Logic: Implement the full business logic (add, edit, delete, filter) within journal.ts, ensuring all function parameters and return values are explicitly typed using the defined Interfaces and Enums.

· DOM Manipulation: Use template literals and modern DOM methods in ui.ts to render the entries, ensuring the data passed to the rendering function is always of type JournalEntry[].

· Compilation: Demonstrate successful compilation by running the npx tsc command and testing the resulting JavaScript files in the browser. Trainees should note where the compiler prevented runtime errors.

### 4. UI Implementation and Responsiveness

· UI/UX Design: Implement the custom-designed UI using clean HTML and CSS, including the input form and filtering mechanism.

· Responsiveness: Ensure the application is fully mobile responsive for usability on all devices.

You can see here we have a list of typescripts, and in terms of types: Interfaces, TypeUnions, TypeIntersections, and Intersections. We have a plan of some kind of work on it.

QGY was clean and responsive. QOOL was Organizable and was modular using ESSIMports and ESPORTS. It had the general.ts and ts files as well. The little improvement there was refactoring his code into subfiles and modularizing them as well, as a lot of the content was left in one file. The code was functional. The building was functional. I think a few implementations were done there, but everything was functional and clear.

TS Configuration and struct would be enabled. He also understood the use of the struct mode being enabled when I used the tsconfig file.

A few things that he can do is understand type utility slides like omit, the peek, the return type, the keyoff, and other stuff. I think he needs to look more into it to understand the building concept over there. But overall, fundamental graphs in TypeScript were clear, and he understood which ones to use.

He also had a few issues with NNU. Upon walking through him to log his kit, he planned to download it, but he did apply his code to improve. But overall, his application was clear and functional
