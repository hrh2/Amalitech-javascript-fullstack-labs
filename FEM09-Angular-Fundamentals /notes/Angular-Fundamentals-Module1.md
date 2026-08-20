# Angular Fundamentals — Module 1 Learning Guide
### FEM09 · Intro to Angular, CLI, Components, Templates, Data Binding, Directives, Basic Component Communication

> **Scope note:** This document covers *only* Module 1 of FEM09. Anything belonging to later modules (routing, RxJS, HTTP, DI in depth, forms, NgRx, testing, SSR, signals in depth, performance) is mentioned only briefly and clearly flagged as **🔒 Coming Later — Outside This Module**. Everything else here is meant to be studied, coded, broken, and fixed by you.

---

## How to use this document

Each concept follows the same shape, documentation-style:

**What is it? → Why does Angular need it? → How does it work? → Syntax breakdown → How do I use it? → When to use / not use → What happens behind the scenes → How it connects to other concepts → Angular vs React/Vanilla JS → Try It Yourself → Exercises → Common Mistakes**

Code blocks are always explained — never dropped without commentary. Every section ties back to the running example we build throughout: the **Dessert Shop App**.

---

## Table of Contents

1. [What Is Angular?](#1-what-is-angular)
2. [Angular vs Traditional JavaScript & vs AngularJS](#2-angular-vs-traditional-javascript--vs-angularjs)
3. [The Angular CLI](#3-the-angular-cli)
4. [Angular Project Structure](#4-angular-project-structure)
5. [Components](#5-components)
6. [Templates & Component Styles](#6-templates--component-styles)
7. [Data Binding](#7-data-binding)
8. [Built-in Directives](#8-built-in-directives)
9. [Component Communication (@Input / @Output)](#9-component-communication-input--output)
10. [A Peek at Lifecycle: ngOnInit](#10-a-peek-at-lifecycle-ngoninit)
11. [Putting It All Together: Dessert Shop Architecture](#11-putting-it-all-together-dessert-shop-architecture)
12. [Final Module Project: Dessert Shop App](#12-final-module-project-dessert-shop-app)
13. [Quick Reference Sheet](#13-quick-reference-sheet)
14. [Source & Resource Mapping](#14-source--resource-mapping)

---

## 1. What Is Angular?

### What is it?

Angular is a **TypeScript-based, component-based application framework** for building web (and mobile/desktop-via-wrapper) user interfaces. Unlike a small library that solves one problem, Angular is a **complete platform**: it ships with its own conventions for structuring UI (components), managing data flow into the view (templates + binding), organizing code (modules/standalone components), handling dependencies (dependency injection), navigating between views (router — later module), and talking to servers (HttpClient — later module).

The official framing from the Angular documentation is that Angular gives you a **platform** for building applications, not just a rendering library — that's the single biggest thing to internalize before writing any code.

### Why does Angular need to exist? (the problem it solves)

Before frameworks like Angular, building anything beyond a simple page meant manually:

- Writing DOM manipulation code (`document.querySelector`, `element.innerHTML = ...`) every time data changed.
- Manually re-running that code every time state changed, and manually removing/adding event listeners.
- Inventing your own ad-hoc structure for organizing UI pieces, with no shared convention across a team.
- Wiring up UI updates by hand whenever a value in memory changed — nothing "watched" the data for you.

As applications grow, this becomes unmanageable: the same value might need updating in five different places in the DOM, and forgetting one spot causes stale UI. Angular's answer is **declarative templates + data binding**: you describe *what* the UI should look like given the current data, and Angular takes care of *how* to update the DOM when that data changes.

### How does it work? (the core idea)

Angular applications are built from a **tree of components**. Each component is a self-contained unit with:

1. A **class** (TypeScript) that holds data and logic.
2. A **template** (HTML, with Angular-specific syntax) that describes what to render.
3. **Styles** scoped to that component.

Angular reads the template, and wherever it finds special syntax (`{{ }}`, `[ ]`, `( )`, `*ngIf`, etc.) it wires up a live connection between the class's data and the rendered DOM. When data in the class changes, Angular re-renders only what needs to change — you never manually touch the DOM.

### Angular's core building blocks (per the official docs)

| Building block | Role |
|---|---|
| **Component** | The fundamental UI building block — a piece of the screen plus the logic behind it. |
| **Template** | The HTML (with Angular syntax) that says what a component renders. |
| **Data binding** | The mechanism connecting the component's data/methods to the template. |
| **Directives** | Instructions attached to DOM elements/templates that change behavior or appearance (`*ngIf`, `*ngFor`, `ngClass`...). |
| **Dependency Injection** | 🔒 *Briefly mentioned* — Angular's built-in system for supplying a class with the objects (services) it depends on, rather than the class creating them itself. Explored in depth in a later module. |

For Module 1, you need to be comfortable with the first three deeply, and directives well — DI is only relevant here as background context (you'll see `providedIn: 'root'` in generated files and don't need to worry about it yet).

### How does this compare to plain JavaScript?

```javascript
// Vanilla JS: you manually keep the DOM in sync with data
let title = "Dessert Shop";
document.getElementById("app-title").textContent = title;

// Later, if title changes, you must remember to update the DOM again:
title = "Dessert Shop 🍰";
document.getElementById("app-title").textContent = title; // easy to forget!
```

```typescript
// Angular: you declare the relationship once...
export class AppComponent {
  title = 'Dessert Shop';
}
```
```html
<!-- ...and the template stays in sync automatically -->
<h1>{{ title }}</h1>
```
If `title` changes anywhere in the class (e.g., inside a method triggered by a button click), Angular updates the `<h1>` for you. You never write `.textContent = ...` by hand.

### How does this compare to React?

Both are component-based and both solve "keep the UI in sync with data," but the philosophy differs:

| | Angular | React |
|---|---|---|
| Nature | Full framework (opinionated, batteries-included) | UI library (you assemble the rest: routing, HTTP, state) |
| Language | TypeScript by convention | JavaScript/TypeScript, JSX |
| Template syntax | Angular template syntax (HTML superset: `{{ }}`, `[ ]`, `( )`) | JSX (JavaScript expressions inside markup-like syntax) |
| Component definition | Class (or function, in newer Angular) + decorator + separate template | Function returning JSX |
| Dependency management | Built-in Dependency Injection | Not built-in; typically plain imports or context |
| "Batteries" | Router, forms, HTTP client, animations all ship as part of the ecosystem | Ecosystem of third-party libraries you choose yourself |

We'll revisit this comparison concept-by-concept, but the headline is: **Angular gives you more structure and more built-in tools out of the box; React gives you more freedom and expects you to pick your own tools.** Neither is "better" — they're different trade-offs.

### 🎥 Optional Video

**Angular in 100 Seconds — Fireship**
[Watch on YouTube](https://www.youtube.com/watch?v=k5E2AVpwsko)
**Useful for:** A 100-second mental model refresh before diving in.
**Recommended when:** You want the "big picture" in under two minutes before reading the details above.

**Angular Crash Course — Traversy Media (1 hr)**
[Watch on YouTube](https://www.youtube.com/watch?v=3dHNOWTI7H8)
**Useful for:** Seeing CLI setup, components, templates, and binding built live.
**Recommended when:** You prefer watching something get built before reading the deep-dive sections below.

### ✅ Knowledge Check

1. Why is Angular described as a "platform" rather than just a "rendering library"?
2. What problem does declarative data binding solve compared to manual DOM manipulation?
3. Name the three things every Angular component is made of.

---

## 2. Angular vs Traditional JavaScript & vs AngularJS

### Angular vs "traditional" JavaScript frameworks/approaches

"Traditional JavaScript approaches" here means either **vanilla JS with manual DOM manipulation**, or **imperative-style libraries** where you write step-by-step instructions for changing the DOM. Angular instead asks you to describe the **desired end state** of the UI (declarative), and it figures out the steps.

Concretely:

- **Imperative (traditional):** "Find this element. Set its text. Now find that element. Add a class to it. Now remove this other element from the page."
- **Declarative (Angular):** "This paragraph should show `message` if `hasError` is true. This list should render one `<li>` per item in `items`." Angular keeps the DOM matching that description as the underlying data changes.

### Angular vs AngularJS — important historical distinction

**AngularJS** (versions 1.x) is the *predecessor* to modern Angular (versions 2+). They are, despite the similar name, essentially different frameworks:

| | AngularJS (1.x) | Angular (2+, what you're learning) |
|---|---|---|
| Language | JavaScript | TypeScript |
| Building block | Controllers + `$scope` | Components (class + template + styles) |
| Structure | Less opinionated, `$scope`-based data binding | Component-tree architecture |
| Mobile/perf story | Not designed with mobile-first performance in mind | Designed for performance, mobile, and ahead-of-time compilation |
| Status | Legacy, in long-term maintenance mode | Actively developed, current framework |

> ⚠️ If you search for Angular help online and land on a `$scope` or `ng-controller` example, that's **AngularJS**, not the Angular you're learning. The syntax you'll see in this module — `*ngFor`, `[property]`, `(event)`, `@Component` — belongs to modern Angular. AngularJS is included in the official learning path purely for historical context (understanding *why* Angular was rewritten from scratch), not because you should write `$scope` code.

### Why the rewrite happened (context, not something to memorize deeply)

AngularJS's two-way `$scope` binding worked well for small apps but became a performance and maintainability bottleneck at scale (Angular had to "watch" enormous numbers of bindings). Modern Angular was rewritten around components, a more predictable change-detection model, and TypeScript, addressing those scaling problems. You don't need AngularJS syntax to build in modern Angular — just be aware it exists so you don't accidentally follow an outdated tutorial.

### ✅ Knowledge Check

1. If a tutorial shows you `ng-controller` and `$scope`, is that Angular or AngularJS?
2. What does "declarative" mean, in your own words, using the dessert shop as an example?

---

## 3. The Angular CLI

### What is it?

The **Angular CLI** (Command Line Interface) is a command-line tool (`ng`) that automates the repetitive, error-prone parts of Angular development: creating a new project with the correct structure, generating new components/files following Angular naming conventions, running a local development server with live reload, and (later) building/testing the app.

### Why does Angular need it?

Without it, you'd hand-write boilerplate for every component (the class file, the template file, the style file, and wiring them together), hand-configure the build toolchain (bundler, TypeScript compiler, dev server), and risk inconsistent naming/structure across a team. The CLI encodes Angular's own conventions so that every generated project — yours, your teammate's, a tutorial's — looks structurally the same.

### Core commands for Module 1

```bash
ng new my-app
```
Creates a brand-new Angular project named `my-app` in a new folder. It scaffolds the entire file/folder structure (see [Section 4](#4-angular-project-structure)), installs dependencies, and sets up TypeScript/build configuration. You'll be asked a couple of setup questions (e.g., stylesheet format, whether to enable SSR) — for this module, the defaults are fine.

```bash
ng serve
```
Starts a local development server (by default at `http://localhost:4200`) and **watches your files** — any time you save a change, it rebuilds and refreshes the browser automatically. Run this from inside the project folder while you work.

```bash
ng generate component dessert-card
# short form:
ng g component dessert-card
```
Generates a new component named `dessert-card`. This is the command you will use constantly. It creates (in modern Angular CLI versions) a folder like:

```
dessert-card/
├── dessert-card.ts        (or .component.ts, depending on CLI version)
├── dessert-card.html
├── dessert-card.css
└── dessert-card.spec.ts   (test file — outside this module's scope)
```

and it **automatically registers the component** so it can be used elsewhere in the app (in older Angular versions, this means adding it to an `NgModule`'s `declarations`; in current standalone-component-first Angular, the new component is simply importable directly — no module registration step needed).

> ⚠️ **Version note:** Depending on which Angular version your resources/videos were made with, you may see components generated with an accompanying `*.module.ts` and manual registration in `declarations: [...]`. Current Angular (v17+) defaults to **standalone components** — no NgModule wiring required for a new component to be used. If your video shows `NgModule` steps and your local CLI doesn't ask for/generate them, that's expected: you're on the newer, standalone-first workflow. Both approaches produce a component with a class + template + styles; the underlying Module 1 concepts (binding, directives, communication) are identical either way.

### What developers normally modify vs. leave alone

| File | Normally modify? | Notes |
|---|---|---|
| `*.html` (template) | ✅ Yes, constantly | This is where your markup and bindings live. |
| `*.ts` (component class) | ✅ Yes, constantly | Your data properties and methods live here. |
| `*.css`/`*.scss` (styles) | ✅ Yes | Scoped styles for that component. |
| `*.spec.ts` | 🔒 Later module (testing) | Leave alone for now unless told otherwise. |
| `angular.json`, `tsconfig*.json`, `package.json` | ⚠️ Rarely, and carefully | Build/tooling configuration — changing this incorrectly can break the whole project. Don't hand-edit unless you know exactly why. |
| `main.ts` / bootstrap file | ⚠️ Rarely | Wires up the root component to the page — generated correctly by `ng new`, no reason to touch it in Module 1. |

### 🐞 Common Mistakes

- **Running `ng` commands outside the project folder.** `ng generate component ...` must be run from inside the Angular project directory (where `angular.json` lives), or the CLI won't know what project to modify.
- **Typing `ng component dessert-card`** instead of `ng generate component dessert-card` (or `ng g component ...`) — `generate`/`g` is required.
- **Forgetting `ng serve` is still running** in another terminal, then wondering why changes "don't show up" when actually a second server instance is fighting the first for the same port.
- **Manually creating component files by copy-pasting** instead of using `ng generate` — easy to mistype selectors or forget a piece, and (on module-based Angular) easy to forget the `declarations` registration.

### Try It Yourself

**Experiment: First project**
```bash
ng new dessert-shop-app
cd dessert-shop-app
ng serve
```
Open `http://localhost:4200`. You should see the default Angular welcome page. Now:
1. Stop the server (Ctrl+C is *not* needed — leave it running).
2. Open the project in your editor and find the root component's template (see next section for exactly where).
3. Change some visible text and save. Watch the browser update **without you refreshing it manually.**

This single experiment demonstrates the CLI's dev server + live reload, which you'll rely on for the rest of the module.

### ✅ Knowledge Check

1. What's the difference between `ng new` and `ng generate component`?
2. Why shouldn't you hand-edit `angular.json` casually?
3. What does `ng serve` actually do besides "start a server"?

---

## 4. Angular Project Structure

### What am I looking at?

When you run `ng new dessert-shop-app`, the CLI generates a project. Here are the pieces relevant to Module 1 (irrelevant/advanced config is intentionally omitted):

```
dessert-shop-app/
├── src/
│   ├── app/
│   │   ├── app.ts (or app.component.ts)     ← Root component class
│   │   ├── app.html (or app.component.html) ← Root component template
│   │   ├── app.css (or app.component.css)   ← Root component styles
│   │   └── app.config.ts                    ← App-level configuration (providers, etc.)
│   ├── index.html                           ← The single real HTML page the browser loads
│   ├── main.ts                              ← Bootstraps the root component into index.html
│   └── styles.css                           ← Global styles for the whole app
├── angular.json                             ← Build/CLI configuration
├── package.json                             ← Project dependencies & npm scripts
├── tsconfig.json                            ← TypeScript compiler configuration
└── node_modules/                            ← Installed dependencies (never edit directly)
```

### Purpose of each relevant piece

- **`src/index.html`** — There is only one real HTML page. Angular renders your entire application *inside* this file, typically inside a root tag like `<app-root></app-root>`. You will almost never edit this file beyond the `<title>` in Module 1.
- **`src/main.ts`** — The entry point. It tells Angular "start the app by bootstrapping this root component." You generally don't touch this in Module 1 either, but it's worth opening once to see that the connection between `index.html`'s `<app-root>` tag and your `AppComponent` class is made here.
- **`src/app/app.ts` (root component class)** — A TypeScript class decorated with `@Component`. This is the top of your component tree; every other component you build will eventually be nested inside it (directly or indirectly).
- **`src/app/app.html` (root template)** — The HTML that the root component renders. This is where you'll place your first custom components, like `<app-dessert-list></app-dessert-list>`.
- **`src/app/app.css`** — Styles scoped to the root component only (see [Section 6](#6-templates--component-styles) for exactly what "scoped" means).
- **`src/styles.css`** — Truly global styles (e.g., a CSS reset, global font) that apply across the whole app, not just one component.
- **`package.json`** — Standard npm manifest: lists dependencies (Angular packages, TypeScript, etc.) and scripts like `ng serve`/`ng build` under the hood.
- **`tsconfig.json`** — TypeScript compiler settings (e.g., strictness). Angular projects are typed by default; understanding this fully is outside Module 1 — just know it exists and controls how strict TypeScript is about types in your files.
- **`angular.json`** — Tells the Angular CLI how to build/serve/test *this specific project* (file paths, output locations, etc.). You'll rarely need to touch it in Module 1.

> ⚠️ **Version/naming note:** Older Angular CLI versions name files `app.component.ts` / `app.component.html` / `app.component.css` and wrap the class in an `AppModule` (`app.module.ts`). Newer CLI versions (v17+, standalone-first) may generate shorter names (`app.ts`, `app.html`) without a root module file. **The concepts are identical** — a class, a template, and styles, connected by a decorator — only the filenames/whether a module file exists differs. If your resource videos show `app.module.ts`, treat it as the "classic" file layout; you may not see that file in a freshly generated modern project, and that's expected, not an error.

### 🐞 Common Mistakes

- Editing `node_modules` directly (changes are wiped the moment dependencies reinstall — never edit here).
- Confusing `src/index.html` (the one real page) with a component's `*.html` template file (a fragment that gets inserted *into* `index.html` via the component tree).
- Assuming every Angular version's file layout matches a specific tutorial exactly — check whether you're looking at a module-based or standalone-based project before panicking that "the tutorial's files don't match mine."

### ✅ Knowledge Check

1. Why is there only one real `.html` page the browser loads, even though you'll write many `*.html` template files?
2. What is the practical difference between `src/styles.css` and a component's own `*.css` file?

---

## 5. Components

Components are the single most important concept in this module — almost everything else (binding, directives, communication) exists *in service of* components.

### 1. What is a component?

A **component** is a self-contained, reusable piece of UI: a class holding data/behavior, paired with a template describing what to render, and (optionally) styles scoped to it. A page is built by composing many small components into a tree, the same way a house is built from rooms rather than as one giant undivided space.

### 2. Why component-based architecture?

Without components, a big UI is one enormous template and one enormous script, where finding *anything* means scrolling through everything, and reusing a piece of UI (say, a "product card" used 20 times) means copy-pasting markup 20 times. Components let you:

- Define a piece of UI **once** (`DessertCard`) and reuse it everywhere you need a dessert displayed.
- Change that piece of UI in **one place** and have every usage update.
- Reason about a complex app as a **tree of small, understandable pieces** instead of one giant file.

### 3. What a component looks like

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-dessert-card',
  templateUrl: './dessert-card.html',
  styleUrl: './dessert-card.css'
})
export class DessertCard {
  name = 'Chocolate Cake';
}
```

```html
<!-- dessert-card.html -->
<h2>{{ name }}</h2>
```

### 4. Component class

The class (`DessertCard` above) is plain TypeScript. It holds:
- **Properties** — data the template will display (`name`).
- **Methods** — logic the template can call (e.g., in response to a click, see [Event Binding](#event-binding)).

There is nothing magical about the class itself — it becomes a *component* only because of the `@Component` decorator attached to it.

### 5. Component template

The template is HTML **plus Angular-specific syntax**. It is not a separate templating language you have to learn from zero — it's regular HTML with a few special constructs layered on top (`{{ }}`, `[ ]`, `( )`, `*ngIf`, `*ngFor`, etc., all covered in Sections 7–8).

### 6. Component styles

CSS (or SCSS) that, by default, is **scoped to this component only** — a rule you write for `.card` in `dessert-card.css` will not leak out and restyle a `.card` class used inside a completely different component. This is called *view encapsulation* — Angular achieves it by tagging the component's rendered elements with a unique attribute and scoping the CSS selectors to match only those attributes. You don't need to configure anything for this — it's the default behavior.

### 7. Component decorator

```typescript
@Component({
  selector: 'app-dessert-card',
  templateUrl: './dessert-card.html',
  styleUrl: './dessert-card.css'
})
```

`@Component(...)` is a **decorator** — a function that attaches metadata to the class immediately below it, telling Angular "this plain TypeScript class is actually a component, and here's how to use it." Breaking down the metadata object:

- **`selector: 'app-dessert-card'`** — the custom HTML tag name other templates will use to place this component: `<app-dessert-card></app-dessert-card>`. By convention, Angular selectors are prefixed (commonly `app-`) to avoid colliding with real HTML tags or other libraries' custom elements.
- **`templateUrl: './dessert-card.html'`** — points to the HTML file to use as this component's template. (Alternatively, `template: '<h2>{{ name }}</h2>'` lets you inline a small template directly instead of a separate file — fine for tiny components, but a separate file is the convention once markup grows past a line or two.)
- **`styleUrl: './dessert-card.css'`** — points to the CSS file scoped to this component. (Older Angular versions use the plural `styleUrls: ['./dessert-card.component.css']` as an array, since a component could technically have more than one stylesheet.)

### 8. How Angular connects the pieces

```
@Component decorator
        │
        ├── selector      →  what tag activates this component in a template
        ├── templateUrl   →  what HTML to render
        └── styleUrl      →  what CSS to scope to that HTML

DessertCard (class)
        │
        └── properties/methods  →  referenced from inside the template via {{ }}, [ ], ( )
```

The class doesn't "know" about the template file directly in code — the *decorator* is what links class ↔ template ↔ styles into one working component.

### 9. Creating a component with the CLI

```bash
ng generate component dessert-card
```
This creates the four files shown in [Section 3](#3-the-angular-cli) and fills in a minimal `@Component` decorator, an empty class, an (almost) empty template, and an empty stylesheet — you then fill in the actual dessert-card logic/markup.

### 10. Using one component inside another

Once generated, a component is used by writing its **selector** as a tag inside another template:

```html
<!-- app.html (root template) -->
<app-dessert-card></app-dessert-card>
```

That's it — Angular sees the custom tag, matches it to the `DessertCard` component (because its selector is `app-dessert-card`), and renders that component's template in that spot.

> ⚠️ **Standalone vs module note:** In current standalone-first Angular, using a component elsewhere also requires importing its class into the `imports: []` array of the *using* component's own `@Component` decorator:
> ```typescript
> @Component({
>   selector: 'app-root',
>   imports: [DessertCard],
>   templateUrl: './app.html'
> })
> export class App {}
> ```
> In older, module-based Angular, this registration instead happens once in a shared `NgModule`'s `declarations`, and every component in that module can then use every other one without per-component imports. Both achieve the same goal — "make this tag available here" — via different mechanisms.

### 11. Practical example: Dessert Shop skeleton

```bash
ng generate component dessert-list
ng generate component dessert-card
```

```html
<!-- app.html -->
<h1>{{ title }}</h1>
<app-dessert-list></app-dessert-list>
```

```html
<!-- dessert-list.html -->
<app-dessert-card></app-dessert-card>
<app-dessert-card></app-dessert-card>
<app-dessert-card></app-dessert-card>
```

Even before learning `*ngFor`, this alone demonstrates composition: `App` contains `DessertList`, which contains multiple `DessertCard`s.

### 12. Exercise

**Level 1 — Basic**
Generate a `profile-card` component. Give its class a `name` property and display it with interpolation in its template.

**Level 2 — Practical**
Generate a `product-list` and a `product-card` component. Place three `<app-product-card>` tags inside `product-list`'s template, and place `<app-product-list>` inside the root template.

**Level 3 — Challenge**
Build the skeleton for a **dashboard**: a root component containing a `sidebar` component and a `main-content` component, where `main-content` itself contains a `stats-card` component used three times.

### 13. Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| `<DessertCard></DessertCard>` | Angular selectors are matched exactly as defined; `selector: 'app-dessert-card'` was defined lowercase-with-dashes, and custom-element tag names must contain a dash. | `<app-dessert-card></app-dessert-card>` | Matches the selector exactly. |
| Using a component's tag without importing it into the using component's `imports: []` (standalone Angular) | Angular has no way to know the tag maps to that component. | Add the component class to `imports: []` | Registers the component as usable in that template. |
| Two components with the same `selector` | Angular can't disambiguate which one a tag refers to. | Give each component a unique selector | Selectors act like custom tag names — they must be unique app-wide. |
| Forgetting `export` on the component class | The class can't be imported anywhere else in the app. | `export class DessertCard { ... }` | Makes the class importable from other files. |

### 🎥 Optional Video
**FreeCodeCamp — Angular Course For Beginners (Components section)**
[Watch on YouTube](https://www.youtube.com/watch?v=3qBXWUpoPHo)
**Useful for:** Watching components + templates get created live with the CLI.
**Recommended when:** You want to see the class/template/style split in action before typing it yourself.


---

## 6. Templates & Component Styles

### What is a template, precisely?

A template is HTML that Angular **compiles** into instructions for creating and updating real DOM elements. It looks like ordinary HTML, and mostly *is* ordinary HTML — but wherever Angular-specific syntax appears, the compiler treats it specially (a binding, a directive, etc.) rather than as literal text/attributes.

### Why not just use plain HTML + JS to update it?

Because then *you* would be responsible for finding the right DOM node and updating it manually every time data changes (see [Section 1](#1-what-is-angular)). A template lets you write the *relationship* once ("this text should always equal `title`"), and Angular's change detection keeps it true.

### Component styles and view encapsulation, in more depth

By default, Angular wraps each component's rendered elements with a unique, auto-generated HTML attribute (something like `_ngcontent-abc-1`) and rewrites that component's CSS selectors to only match elements carrying that same attribute. Practically, this means:

```css
/* dessert-card.css */
.card {
  border: 1px solid #ddd;
  padding: 1rem;
}
```
This `.card` rule will **only** affect `.card` elements inside `DessertCard`'s own template — not a `.card` class used in some unrelated `NavBar` component, even though both stylesheets are technically part of the same global build.

### When should you put a style in `styles.css` instead?

- Truly app-wide concerns: a CSS reset, base typography, color variables/CSS custom properties meant to be shared, third-party CSS framework imports.
- Anything one specific component owns and no other component should be affected by → put it in that component's own stylesheet instead.

### 🐞 Common Mistakes

- Putting component-specific styling in the global `styles.css` "because it's easier," then being surprised when unrelated components are affected.
- Expecting a style written inside `DessertCard`'s CSS to automatically restyle a *child* component's internal elements — encapsulation means a parent's styles generally do **not** reach inside a child component's own template by default.
- Forgetting that `templateUrl`/`styleUrl` paths are **relative to the component file** — a typo'd path silently fails to load rather than throwing an obvious error in some CLI versions.

### ✅ Knowledge Check

1. In your own words, what does "view encapsulation" mean and why is it useful for a component-based app?
2. If you want one color variable to be usable by *every* component, where should you define it?

---

## 7. Data Binding

This is the heart of Module 1. Angular has **four kinds of binding**, each with a distinct **direction of data flow**. Getting the direction right for each is the single most testable concept in this module.

```
Data Binding — the big picture

Component (class)  ───────────────►  Template (view)      [Interpolation, Property Binding]
Component (class)  ◄───────────────  Template (view)      [Event Binding]
Component (class)  ◄──────────────►  Template (view)      [Two-Way Binding]
```

### 7.1 Interpolation — `{{ }}`

**What is it?** A way to insert a component's data into the *text content* of a template, as a string.

```html
<h1>{{ title }}</h1>
```

**Syntax breakdown:** `{{ title }}` tells Angular: "evaluate the expression `title` against this component's class, convert the result to a string, and place it here as text." `title` is not defined in the HTML — it's a property that must exist on the component's class:

```typescript
export class AppComponent {
  title = 'Dessert Shop';
}
```

**What can go inside `{{ }}`?** Any relatively simple TypeScript-like expression: a property (`title`), a nested property (`dessert.name`), a method call (`getDiscountedPrice()`), simple arithmetic (`price * quantity`), or a ternary (`inStock ? 'In Stock' : 'Sold Out'`).

**What generally should NOT go inside `{{ }}`?** Assignments (`x = 5`), anything with side effects, `new` expressions, and anything requiring multiple statements — interpolation expects a single expression that *produces a value to display*, not a place to run logic.

**Try It Yourself — Experiment: Interpolation**
```typescript
export class AppComponent {
  title = 'Dessert Shop';
  price = 4.5;
  dessert = { name: 'Cheesecake', inStock: true };
  toppings = ['sprinkles', 'fudge', 'cherries'];
}
```
```html
<h1>{{ title }}</h1>
<p>Price: {{ price * 2 }}</p>
<p>{{ dessert.name }} — {{ dessert.inStock ? 'Available' : 'Sold out' }}</p>
<p>First topping: {{ toppings[0] }}</p>
```
Change `title`'s value and save — watch the `<h1>` update live via `ng serve`. Then try changing `price` and observe the multiplication re-evaluate.

**What happens behind the scenes?** Angular's change detection periodically (in response to events, timers, or explicit triggers) re-checks bound expressions like `title` and, if the evaluated value differs from what's currently rendered, updates just that DOM text node — not the whole page.

**Common Mistakes**

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| `<h1>title</h1>` | No `{{ }}` — Angular treats "title" as literal text, not an expression. | `<h1>{{ title }}</h1>` | Tells Angular to evaluate `title` as an expression. |
| `<h1>{{ 'title' }}</h1>` | Renders the literal string `title`, not the property's value — quotes make it a string literal. | `<h1>{{ title }}</h1>` | Unquoted `title` refers to the class property. |
| `{{ this.title }}` | Works technically in some cases but is non-idiomatic/unnecessary — `this` isn't needed inside template expressions. | `{{ title }}` | Angular already resolves bare identifiers against the component instance. |

### 7.2 Property Binding — `[ ]`

**What is it?** A way to bind a component's data to a **DOM element property** (not just visible text) — things like whether a button is disabled, what an image's `src` is, or whether an input is read-only.

```html
<img [src]="imageUrl" [alt]="dessertName">
<button [disabled]="!isAvailable">Buy</button>
```

**Syntax breakdown:** `[src]="imageUrl"` means: "bind the element's `src` property to the current value of the class property `imageUrl`." The square brackets mark this as a *binding*, not a plain HTML attribute — without them, `src="imageUrl"` would set the image's source to the literal text `"imageUrl"`, which is almost never what you want.

**Direction of data flow:** class → template, one-way, same as interpolation — but property binding can target *any* DOM property, not just text content, and it correctly handles non-string values (booleans, objects, numbers) without you having to manually convert them to strings.

**The critical distinction: `{{ }}` vs `[ ]`**

```html
<img src="{{ imageUrl }}">
<img [src]="imageUrl">
```
Both actually work for simple string properties like `src` (interpolation inside an attribute is internally converted to a property binding by Angular). But they are **not** interchangeable in general:
- Interpolation `{{ }}` always produces a **string**, inserted as text/attribute content.
- Property binding `[ ]` passes the actual **evaluated value** (could be a boolean, number, object, array) directly to the DOM property.

This matters a lot for something like `disabled`:
```html
<!-- WRONG: sets the disabled ATTRIBUTE to the literal string "false", 
     and in HTML, the mere PRESENCE of the disabled attribute (any value) disables the button -->
<button disabled="{{ isAvailable }}">Buy</button>

<!-- CORRECT: binds the disabled PROPERTY to the actual boolean, 
     so `false` genuinely means "not disabled" -->
<button [disabled]="!isAvailable">Buy</button>
```

**When to use property binding vs interpolation:** Use interpolation for **text content**. Use property binding whenever you're setting an actual DOM property — especially booleans (`disabled`, `hidden`, `checked`), or attributes like `src`/`href` where you want the raw evaluated value rather than a naive string substitution.

**Try It Yourself — Experiment: Property Binding**
```typescript
export class DessertCard {
  imageUrl = 'https://placehold.co/150';
  dessertName = 'Brownie';
  isAvailable = true;
}
```
```html
<img [src]="imageUrl" [alt]="dessertName">
<button [disabled]="!isAvailable">Buy</button>
```
Flip `isAvailable` between `true`/`false` and observe the button becoming enabled/disabled — no manual DOM code involved.

**Common Mistakes**

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| `<button disabled="isAvailable">` | No brackets → `isAvailable` is treated as a literal string attribute value, always truthy for HTML's `disabled` presence-based attribute. | `<button [disabled]="!isAvailable">` | Square brackets bind to the real boolean property. |
| `[src]="'imageUrl'"` | Quoting `imageUrl` inside the binding makes it a string literal, not a reference to the class property. | `[src]="imageUrl"` | Refers to the actual class property. |
| Binding a property that doesn't exist on the element, e.g. `[colour]="..."` (typo of `color`) | Angular may warn/error that the property doesn't exist on that element type. | Use the correct DOM property name | Property bindings must match real DOM properties. |

### 7.3 Event Binding — `( )`

**What is it?** A way to run component logic **in response to** a DOM event (click, input, submit, etc.) — the reverse direction of interpolation/property binding.

```html
<button (click)="buyDessert()">Buy</button>
```

**Syntax breakdown:** `(click)="buyDessert()"` means: "when the `click` event fires on this element, call the `buyDessert()` method on this component." Parentheses mark this as an *event binding*.

**Direction of data flow:** template → class (user interaction flows back into your component's logic).

**Accessing the event object:**
```html
<input (input)="onInput($event)">
```
```typescript
onInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  console.log(value);
}
```
`$event` is a special variable Angular provides inside event bindings, referring to the native DOM event object.

**Try It Yourself — Experiment: Event Binding**
```typescript
export class DessertCard {
  clickCount = 0;
  buyDessert() {
    this.clickCount++;
    console.log('Bought! Total clicks:', this.clickCount);
  }
}
```
```html
<button (click)="buyDessert()">Buy ({{ clickCount }})</button>
```
Click the button repeatedly and watch the count update in both the console *and* the interpolated text — this combines event binding with interpolation, showing how bindings compose.

**Common Mistakes**

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| `<button (click)="buyDessert">` | Missing parentheses `()` — Angular treats this as trying to bind the event to the *function reference itself*, not calling it, which typically does nothing on click. | `(click)="buyDessert()"` | Actually invokes the method when the event fires. |
| `<button [click]="buyDessert()">` | Square brackets are for property binding, not events — this tries to bind a nonexistent `click` *property*, and also calls the method immediately at render time. | `(click)="buyDessert()"` | Parentheses correctly mean "run this in response to the event." |
| Forgetting `$event` when the handler needs the DOM event | Method receives no data about what happened. | `(input)="onInput($event)"` | Passes the native event object into the handler. |

### 7.4 Two-Way Binding — `[( )]`

**What is it?** A binding that combines property binding and event binding into one syntax, so data flows **both directions at once** — most commonly used with form inputs via `ngModel`.

```html
<input [(ngModel)]="dessertName">
<p>You typed: {{ dessertName }}</p>
```

**Syntax breakdown:** `[(ngModel)]="dessertName"` is literally shorthand for:
```html
<input [ngModel]="dessertName" (ngModelChange)="dessertName = $event">
```
The square brackets *set* the input's value from `dessertName` (property binding direction), and the parentheses *update* `dessertName` whenever the input changes (event binding direction) — hence "banana in a box" (`[( )]`) as a common mnemonic for the combined syntax.

**Setup requirement:** `ngModel` comes from Angular's `FormsModule`, which must be imported (in standalone Angular, added to the component's `imports: []`; in module-based Angular, imported into the relevant `NgModule`). It is **not** available by default the way interpolation/property/event binding are.

```typescript
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dessert-form',
  imports: [FormsModule],
  templateUrl: './dessert-form.html'
})
export class DessertForm {
  dessertName = '';
}
```

**When to use it:** Simple, immediate two-way sync between a form control and a class property — e.g., a search box, a simple text field. **When not to:** For anything beyond the simplest forms, later modules introduce Angular's **Reactive Forms** (🔒 outside this module), which scale better; don't feel you need to build entire complex forms with `ngModel` alone.

**Try It Yourself — Experiment: Two-Way Binding**
```typescript
export class DessertForm {
  dessertName = '';
}
```
```html
<input [(ngModel)]="dessertName" placeholder="Dessert name">
<p>Preview: {{ dessertName }}</p>
```
Type in the input and watch the preview paragraph update on every keystroke, live.

**Common Mistakes**

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| `<input [(ngModel)]="dessertName">` with no `FormsModule` imported | Angular has no idea what `ngModel` is → template error ("can't bind to ngModel"). | Import `FormsModule` and add to `imports: []` | Registers `ngModel` as usable in this component's templates. |
| `<input ([ngModel])="dessertName">` | Brackets/parentheses reversed — invalid syntax. | `[(ngModel)]="dessertName"` | "Box" (property) goes inside "banana" (event): `[( )]`. |
| Using `[(ngModel)]` when you only need one-directional display | Overkill / unnecessary `FormsModule` dependency for something interpolation could do alone. | Use `{{ }}` if you're only *displaying*, `[(ngModel)]` only if the user must also *edit* the value. | Match the binding to the actual data flow needed. |

### Binding Summary Table

| Binding | Syntax | Direction | Typical use |
|---|---|---|---|
| Interpolation | `{{ value }}` | Class → Template (as text) | Displaying text content |
| Property Binding | `[property]="value"` | Class → Template (as a DOM property) | `disabled`, `src`, `hidden`, any non-text property |
| Event Binding | `(event)="handler()"` | Template → Class | Clicks, input, submit, any user interaction |
| Two-Way Binding | `[(ngModel)]="value"` | Class ↔ Template | Form fields needing live sync both ways |

### Angular vs React — Data Binding

| Angular | React |
|---|---|
| `{{ value }}` interpolation | `{value}` inside JSX |
| `[property]="value"` property binding | `property={value}` as a JSX prop |
| `(click)="handler()"` event binding | `onClick={handler}` |
| `[(ngModel)]="value"` two-way binding | Manually: `value={value} onChange={e => setValue(e.target.value)}` — React has no built-in two-way binding shorthand; you wire the "read" and "write" halves yourself. |

The underlying *problem* (sync data to view, react to user input) is identical — Angular gives you dedicated syntax (and an automatic two-way shorthand) for each direction; React expects you to compose the read/write halves manually using props and callbacks.

### ✅ Knowledge Check

1. Given `<button [disabled]="!isAvailable" (click)="buyDessert()">Buy</button>`, explain exactly what happens when `isAvailable` is `false` and the user clicks the button.
2. Why does `<button disabled="{{ isAvailable }}">` not behave the way a beginner might expect?
3. What two "regular" bindings does `[(ngModel)]` expand into?
4. Why must `FormsModule` be imported before `ngModel` works, when `{{ }}`/`[ ]`/`( )` need no such import?

### 🎥 Optional Video
**FreeCodeCamp — Angular Course For Beginners (Data Binding section)**
[Watch on YouTube](https://www.youtube.com/watch?v=3qBXWUpoPHo)
**Useful for:** Seeing all four binding types demonstrated back-to-back with live examples.
**Recommended when:** After reading the explanations above, to reinforce with a different presentation style.


---

## 8. Built-in Directives

### What is a directive, generally?

A **directive** is an instruction attached to a DOM element or template that changes its behavior or appearance, beyond what a plain binding does. Angular has three categories:

1. **Components** — technically directives with a template (you've already been using these).
2. **Structural directives** — change the DOM's *structure*: adding/removing entire elements (`*ngIf`, `*ngFor`).
3. **Attribute directives** — change an existing element's *appearance or behavior* without adding/removing it from the DOM (`ngClass`, `ngStyle`).

### Structural vs Attribute — conceptually

- **Structural directives** decide **whether/how many** elements exist in the DOM at all. Recognizable by the leading `*`.
- **Attribute directives** decide how an **already-existing** element looks or behaves. No leading `*` — they look like a property binding, because they largely work like one.

```
Structural directive (*ngIf, *ngFor)
    → adds or removes DOM elements entirely

Attribute directive (ngClass, ngStyle)
    → element stays in the DOM, only its class/style attributes change
```

### 8.1 `*ngIf` — Conditional Rendering

**The problem it solves:** "I only want to display this message when there are no desserts left." Without `*ngIf`, you'd have to manually add/remove DOM nodes with JavaScript.

```html
<p *ngIf="desserts.length === 0">No desserts available right now.</p>
```

**Syntax breakdown:** `*ngIf="expression"` tells Angular: "only include this element (and everything inside it) in the DOM if `expression` is truthy; otherwise, remove it entirely." The leading `*` is Angular's shorthand syntax for a structural directive (it desugars to a more verbose `<ng-template>`-based form, which is outside Module 1's depth requirement — just know the `*` marks "this changes DOM structure").

**`*ngIf` with `else`:**
```html
<p *ngIf="desserts.length > 0; else noDesserts">
  We have {{ desserts.length }} desserts!
</p>
<ng-template #noDesserts>
  <p>No desserts available right now.</p>
</ng-template>
```
`#noDesserts` is a **template reference variable** naming the fallback `<ng-template>` block, which `*ngIf`'s `else` clause points to when the condition is false.

**What happens behind the scenes?** When the condition becomes false, Angular doesn't just visually hide the element (like CSS `display: none` would) — it **destroys** the element (and any component inside it) entirely, running Angular's cleanup, then **recreates** it fresh if the condition becomes true again. This matters: state inside a conditionally-rendered child component resets each time it's removed and re-added.

**When to use it:** Showing/hiding entire blocks of UI based on a condition — empty states, loading states, "logged in vs not," feature flags. **When not to:** If you need to keep an element in the DOM but just visually hide it (e.g., to preserve its internal state, or for a CSS transition), consider `[hidden]` or a style/class-based approach instead — `*ngIf` is heavier because it actually creates/destroys.

### 8.2 `*ngFor` — Rendering Lists

**The problem it solves:** "I have a list of desserts. How can I display one HTML structure for every dessert?"

```html
<div *ngFor="let dessert of desserts">
  <h3>{{ dessert.name }}</h3>
  <p>{{ dessert.price | currency }}</p>
</div>
```
*(The `| currency` above is a **pipe** — a way to format displayed values. Pipes beyond this brief mention are 🔒 outside this module's required depth; just recognize the `|` syntax if you see it in resources.)*

**Syntax breakdown:** `*ngFor="let dessert of desserts"` means: "for each item in the `desserts` array, create one copy of this element, with the local variable `dessert` bound to that item." Inside the repeated element, `dessert` behaves like a normal local variable available only within that one repetition.

**Getting the index:**
```html
<div *ngFor="let dessert of desserts; let i = index">
  {{ i + 1 }}. {{ dessert.name }}
</div>
```
`let i = index` exposes the zero-based position of the current item as `i`.

**Tracking items for performance (`trackBy`):**
```html
<div *ngFor="let dessert of desserts; trackBy: trackByDessertId">
  {{ dessert.name }}
</div>
```
```typescript
trackByDessertId(index: number, dessert: Dessert) {
  return dessert.id;
}
```
By default, when the `desserts` array reference changes (e.g., after a filter/sort), Angular may destroy and recreate every DOM element for every item, even ones that didn't actually change, since it can't otherwise tell which array items are "the same" item across updates. `trackBy` gives Angular a stable identity (here, `dessert.id`) so it can reuse existing DOM elements for items that are still present, instead of tearing everything down. Understanding *that this exists and why* is enough for Module 1; deep performance tuning is 🔒 outside this module.

**Try It Yourself — Experiment: `*ngFor`**
```typescript
export class DessertList {
  desserts = [
    { id: 1, name: 'Brownie', price: 3.5 },
    { id: 2, name: 'Cheesecake', price: 4.5 },
    { id: 3, name: 'Macaron', price: 2.0 },
  ];
}
```
```html
<div *ngFor="let dessert of desserts; let i = index">
  {{ i + 1 }}. {{ dessert.name }} — ${{ dessert.price }}
</div>
```
Add a fourth object to the `desserts` array and save — watch a new row appear automatically. Then try removing one — watch it disappear.

**Common Mistakes**

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| `<div ngFor="let dessert of desserts">` | Missing the leading `*` — Angular treats `ngFor` as a plain (nonexistent) property binding, not a structural directive. | `<div *ngFor="let dessert of desserts">` | The `*` activates structural-directive syntax. |
| `<div *ngFor="dessert of desserts">` | Missing `let` — invalid microsyntax. | `<div *ngFor="let dessert of desserts">` | `let` declares the per-item template variable. |
| Using `*ngIf` and `*ngFor` on the **same element** | Angular does not allow two structural directives on one element (ambiguous which "wins"/order of operations). | Wrap in an `<ng-container>`, e.g. `<ng-container *ngFor="let d of desserts"><div *ngIf="d.available">...</div></ng-container>` | Splits the two structural directives across separate elements; `<ng-container>` renders no extra DOM element itself. |

### 8.3 `ngClass` — Dynamic Classes

**The problem it solves:** "I want a dessert card's border to turn red when it's sold out, without writing separate CSS classes toggled manually in JS."

```html
<div [ngClass]="{ 'sold-out': !dessert.available, 'featured': dessert.isFeatured }">
  {{ dessert.name }}
</div>
```

**Syntax breakdown:** `[ngClass]="{ className: condition }"` takes an object where each **key** is a CSS class name and each **value** is a boolean expression; the class is applied whenever its condition is true, and removed when false. Note `ngClass` is used with square brackets `[ngClass]` (it's a property binding onto the `ngClass` attribute directive) — no leading `*`, because it's an attribute directive, not structural.

**Alternative forms:**
```html
<div [ngClass]="'sold-out'">        <!-- single class string -->
<div [ngClass]="['sold-out', 'dim']"> <!-- array of classes -->
```

**When to use it:** Multiple classes toggled by multiple independent conditions. **When not to:** For a single class toggled by a single condition, plain property binding directly on the `class` attribute is simpler:
```html
<div [class.sold-out]="!dessert.available">
```
This binds just the `sold-out` class to one boolean — arguably clearer than `ngClass` when you only need one condition.

### 8.4 `ngStyle` — Dynamic Inline Styles

**The problem it solves:** "I want to change an actual CSS property's value dynamically (not just toggle a predefined class) — e.g., a progress bar's width based on a number."

```html
<div [ngStyle]="{ 'width.px': stockPercentage, 'background-color': stockColor }"></div>
```

**Syntax breakdown:** `[ngStyle]="{ cssProperty: value }"` takes an object mapping CSS property names (optionally with a unit suffix like `.px`) to values. Like `ngClass`, this is an attribute directive using property-binding syntax.

**When to use it vs `ngClass`:** Use `ngClass` when you're toggling **predefined CSS classes** (better separation of concerns — style stays in your CSS files). Use `ngStyle` only when the value itself is **dynamic and computed** (e.g., a percentage-based width) and can't reasonably be expressed as a fixed set of classes. When in doubt, prefer `ngClass`/a single `[class.x]` binding — inline styles are harder to override and don't benefit from your stylesheet's cascade/media queries.

**Try It Yourself — Experiment: `ngClass` + `ngStyle`**
```typescript
export class DessertCard {
  dessert = { name: 'Donut', available: false, isFeatured: true };
}
```
```html
<div [ngClass]="{ 'sold-out': !dessert.available, 'featured': dessert.isFeatured }"
     [ngStyle]="{ 'opacity': dessert.available ? 1 : 0.4 }">
  {{ dessert.name }}
</div>
```
Toggle `available` and `isFeatured` and observe both the class list and the inline opacity respond.

**Common Mistakes**

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| `<div ngClass="{ 'sold-out': !available }">` | Missing brackets — Angular treats the whole `{ ... }` as a literal string attribute value, not an expression to evaluate. | `<div [ngClass]="{ 'sold-out': !available }">` | Brackets tell Angular to evaluate the object expression. |
| Using `*ngClass` (with a leading `*`) | `ngClass` is an attribute directive, not structural — it never takes a `*`. | `[ngClass]="..."` | Attribute directives use the same square-bracket syntax as property binding. |
| Forgetting quotes around CSS property keys with special characters, e.g. `{ width.px: value }` | Invalid object literal syntax in the template expression. | `{ 'width.px': value }` | Keys with a `.` need quoting as string literals. |

### Angular vs React — Directives

| Angular | React |
|---|---|
| `*ngIf="condition"` | `{condition && <Element/>}` or a ternary in JSX |
| `*ngFor="let x of items"` | `{items.map(x => <Element key={x.id}/>)}` |
| `[ngClass]="{ x: cond }"` | `className={cond ? 'x' : ''}` (or a helper like `classnames`) |
| `[ngStyle]="{ ... }"` | `style={{ ... }}` (React uses camelCase JS object style props directly) |

Both frameworks solve the same problems; Angular has dedicated *template directives* for them, while React expresses the same logic as plain JavaScript inside JSX (since JSX is "just JavaScript").

### Exercises

**Level 1 — Basic:** Given an array `desserts`, render each dessert's name in a `<li>` using `*ngFor`.

**Level 2 — Practical:** Add `*ngIf` so that if `desserts.length === 0`, a "no desserts" message shows instead of the list.

**Level 3 — Challenge:** Combine `*ngFor`, `*ngIf` (via `<ng-container>` or `[hidden]`), `ngClass`, and property binding to render a dessert list where sold-out items are visually dimmed (`ngClass`) and have their "Buy" button disabled (property binding), while an empty-state message shows when there are no desserts at all.

### ✅ Knowledge Check

1. Why can't you place both `*ngIf` and `*ngFor` directly on the same element?
2. In your own words, what's the structural vs attribute directive distinction, and which category does each of `*ngIf`, `*ngFor`, `ngClass`, `ngStyle` fall into?
3. When would you prefer `[class.sold-out]="condition"` over `[ngClass]="{ 'sold-out': condition }"`?

### 🎥 Optional Video
**FreeCodeCamp — Angular Course For Beginners (Directives section)**
[Watch on YouTube](https://www.youtube.com/watch?v=3qBXWUpoPHo)
**Useful for:** Seeing `*ngIf`/`*ngFor`/`ngClass`/`ngStyle` used together in a realistic list UI.

---

## 9. Component Communication (`@Input` / `@Output`)

### The problem it solves

Once you split UI into components (e.g., `DessertList` containing many `DessertCard`s), you need a way for:
- The **parent** to hand data **down** to each child (e.g., "here's *which* dessert you should display").
- The **child** to notify the **parent** when something happens **up** (e.g., "the user clicked buy on *this* dessert").

Without a defined mechanism, components would have no clean way to talk to each other at all.

### The mental model

**Parent → Child (data flows down):**
```
Parent Component (DessertList)
      |
      | data (a dessert object)
      ↓
Child Component (DessertCard)
```

**Child → Parent (events flow up):**
```
Parent Component (DessertList)
      ↑
      | event (dessert selected)
      |
Child Component (DessertCard)
```

### `@Input` — Parent passes data down

**What is it?** A decorator marking a class property as something the **parent** can set from outside, via a property binding on the child's tag.

```typescript
// dessert-card.ts
import { Component, Input } from '@angular/core';

export class DessertCard {
  @Input() dessert!: { name: string; price: number; available: boolean };
}
```

```html
<!-- dessert-card.html -->
<h3>{{ dessert.name }}</h3>
<p>${{ dessert.price }}</p>
```

```html
<!-- dessert-list.html (parent) -->
<app-dessert-card *ngFor="let d of desserts" [dessert]="d"></app-dessert-card>
```

**Syntax breakdown:** `@Input() dessert!: {...}` marks `dessert` as an input property. The `!` is a TypeScript non-null assertion telling the compiler "trust me, this will be set before it's used" (since Angular sets it *after* construction, not in the constructor) — a common, expected pattern for required inputs. On the parent's side, `[dessert]="d"` is just a **regular property binding** — the same square-bracket syntax from Section 7 — except now the "property" being bound is one the child explicitly exposed via `@Input`, rather than a native DOM property.

**This is why `@Input`/`@Output` belong right after data binding:** they don't introduce new binding syntax — they let your *own components* participate in the same `[ ]`/`( )` syntax you already know, instead of only native DOM elements being bindable.

### `@Output` + `EventEmitter` — Child notifies parent

**What is it?** A decorator marking a class property (of type `EventEmitter`) as a custom event the child can "fire," which the parent listens to using event-binding syntax.

```typescript
// dessert-card.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';

export class DessertCard {
  @Input() dessert!: { name: string; price: number };
  @Output() selected = new EventEmitter<{ name: string; price: number }>();

  onBuyClick() {
    this.selected.emit(this.dessert);
  }
}
```

```html
<!-- dessert-card.html -->
<h3>{{ dessert.name }}</h3>
<button (click)="onBuyClick()">Buy</button>
```

```html
<!-- dessert-list.html (parent) -->
<app-dessert-card
  *ngFor="let d of desserts"
  [dessert]="d"
  (selected)="onDessertSelected($event)">
</app-dessert-card>
```

```typescript
// dessert-list.ts
export class DessertList {
  desserts = [ /* ... */ ];
  onDessertSelected(dessert: { name: string; price: number }) {
    console.log('Selected:', dessert.name);
  }
}
```

**Syntax breakdown:**
- `@Output() selected = new EventEmitter<T>();` declares a custom event named `selected` that emits values of type `T`.
- `this.selected.emit(this.dessert)` fires the event, sending `this.dessert` as the payload — this is what triggers the parent's handler.
- `(selected)="onDessertSelected($event)"` on the parent's side is, again, the **same event-binding syntax** from Section 7 — `$event` here is whatever value was passed to `.emit(...)`, i.e. the dessert object, not a native DOM event.

**Why the naming looks similar to native events:** From the parent template's point of view, `(selected)="..."` looks exactly like `(click)="..."` — Angular doesn't distinguish "native DOM event" vs "custom component event" syntactically. This is intentional: your own components' outputs feel exactly like built-in DOM events to whoever uses them.

### How it all fits together — Dessert Shop example

```
DessertList (parent)
   │
   │ [dessert]="d"          ──►  DessertCard (child) reads it via @Input
   │
   │ (selected)="onDessertSelected($event)"  ◄──  DessertCard emits via @Output + EventEmitter
   ↓
DessertCard
```

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| `<app-dessert-card dessert="d">` | No brackets → passes the literal string `"d"`, not the `d` variable's value. | `<app-dessert-card [dessert]="d">` | Property binding evaluates `d` as an expression. |
| Forgetting `@Input()` on the child's property | The property becomes a normal internal property; the parent's `[dessert]="d"` binding fails/errors because Angular doesn't recognize it as bindable from outside. | Add `@Input()` above the property | Marks it as settable from a parent template. |
| Using `@Output() selected = new EventEmitter();` then trying `[selected]="..."` on the parent | Square brackets are for inputs/properties; outputs are always listened to with `( )`. | `(selected)="onDessertSelected($event)"` | Outputs are always consumed via event-binding syntax. |
| Naming an `@Output` the same as a native DOM event, e.g. `@Output() click = ...` | Can shadow/conflict with the native `click` event in confusing ways. | Give custom outputs distinct, descriptive names (`selected`, `dessertBought`, etc.) | Avoids ambiguity between native and custom events. |
| Forgetting to call `.emit(...)` inside the handler | Nothing happens — declaring an `EventEmitter` doesn't fire it by itself. | `this.selected.emit(this.dessert);` inside the click handler | Actually triggers the parent's bound handler. |

### Exercises

**Level 1 — Basic:** Give `DessertCard` an `@Input() name: string` and display it.

**Level 2 — Practical:** Add an `@Output() favorited = new EventEmitter<string>()` that emits the dessert's name when a "❤️ Favorite" button is clicked; have the parent log it.

**Level 3 — Challenge:** Build a full `DessertList` ↔ `DessertCard` pair where the parent maintains a `cart: Dessert[]` array; every time a `DessertCard` emits `selected`, the parent pushes that dessert into `cart` and displays a running cart count and total price using interpolation.

### ✅ Knowledge Check

1. Which decorator lets a parent send data to a child, and which lets a child notify a parent?
2. In `(selected)="onDessertSelected($event)"`, what does `$event` actually refer to, given this is a custom output rather than a native DOM event?
3. Why does an `@Input`-decorated property typically need a `!` or a default value in TypeScript?

### 🎥 Optional Video
No dedicated video was provided for this topic in the original resources — the official Angular docs' Component Interaction guide is the primary source; the concepts above extract and explain its `@Input`/`@Output`/`EventEmitter` content in full for this module's needs.

---

## 10. A Peek at Lifecycle: `ngOnInit`

> This section stays intentionally shallow — deep lifecycle behavior (`ngOnChanges`, `ngAfterViewInit`, `ngOnDestroy`, change-detection internals) is **🔒 Coming Later — Outside This Module**. `ngOnInit` is included because it appears in the provided Module 1 resources and is genuinely useful immediately.

### What is it?

`ngOnInit` is a method Angular calls automatically **once**, right after a component's inputs have been set for the first time and the component is otherwise ready — a natural place to do initial setup.

```typescript
import { Component, OnInit, Input } from '@angular/core';

export class DessertCard implements OnInit {
  @Input() dessert!: { name: string; price: number };

  ngOnInit() {
    console.log('DessertCard ready. Dessert is:', this.dessert.name);
  }
}
```

### Why not just put setup code in the constructor?

The constructor runs **before** Angular has finished setting `@Input()` properties from the parent. If your setup logic depends on an `@Input()` value already being present, doing it in the constructor can read `undefined`. `ngOnInit` runs *after* inputs are set, so it's the conventional, safe place for "do this once the component has its initial data."

### When to use it

- Any one-time setup that depends on `@Input()` values already being available.
- Simple initialization logic that doesn't belong in a field initializer.

### When not to (yet)

- You don't need it for something as simple as `title = 'Dessert Shop';` — a plain property initializer is enough.
- Reacting to an `@Input()` **changing** *after* the first time (not just its initial value) requires `ngOnChanges`, which is 🔒 outside this module.

### Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Reading `this.dessert.name` inside the constructor | `@Input()` values aren't guaranteed set yet at construction time. | Read it inside `ngOnInit()` instead | Angular guarantees inputs are set before `ngOnInit` runs. |
| Forgetting `implements OnInit` | Purely a TypeScript-level safety net (method name typos go undetected without it) — the method still runs at runtime even without it, but you lose compile-time checking. | `export class DessertCard implements OnInit { ngOnInit() {...} }` | TypeScript verifies you've implemented the interface's method correctly. |

### ✅ Knowledge Check

1. Why might `this.dessert` be `undefined` if you log it inside the constructor but not inside `ngOnInit`?


---

## 11. Putting It All Together: Dessert Shop Architecture

By this point you have every concept needed to understand a real, small Angular app. Here's how they combine:

```
DessertShopApp (root: App)
 │
 ├── DessertList
 │     │  - holds: desserts: Dessert[]  (the source of truth for the list)
 │     │  - holds: cart: Dessert[]
 │     │  - template uses: *ngFor to render one DessertCard per dessert
 │     │  - template uses: *ngIf for an empty-state message
 │     │  - listens for: (selected) output from each DessertCard
 │     │
 │     └── DessertCard  (repeated, once per dessert)
 │           - receives: @Input() dessert
 │           - template uses: {{ }} for name/price, [src] for image,
 │                             [disabled] for the Buy button,
 │                             [ngClass] for sold-out styling
 │           - emits: @Output() selected  when "Buy" is clicked
 │
 └── (optional) CartSummary
       - receives: @Input() cart
       - template uses: {{ }} for totals, *ngFor to list cart items
```

**Data flow, end to end:**
1. `DessertList` owns the `desserts` array (its class properties).
2. `*ngFor` in `DessertList`'s template creates one `DessertCard` per dessert, passing each one down via `[dessert]="d"` (property binding → `@Input`).
3. Each `DessertCard` displays its dessert using interpolation, property binding, and `ngClass`/`ngStyle` for conditional styling.
4. When a user clicks "Buy" inside a `DessertCard`, the card's `(click)` handler calls `emit()` on its `@Output()`, which `DessertList` catches via `(selected)="onDessertSelected($event)"`.
5. `DessertList` updates its own `cart` array in response — and, because Angular's binding is declarative, everything bound to `cart` (e.g., a cart count shown via interpolation) updates automatically.

This is the entire mental model you need for the lab — every piece has already been taught individually in Sections 5–9.

---

## 12. Final Module Project: Dessert Shop App

This project intentionally mirrors the official lab's shape without giving you the exact solution — it exists so you arrive at the real lab already comfortable with every required concept.

### Project Requirements

Build a small Angular app that displays a shop's desserts and lets a user "buy" them into a cart.

### Functional Requirements

1. A root component (`App`) displaying a page title via interpolation.
2. A `DessertList` component that:
   - Holds an array of at least 4 dessert objects (`{ id, name, price, imageUrl, available }`).
   - Renders one `DessertCard` per dessert using `*ngFor`.
   - Shows an empty-state message using `*ngIf` when there are no desserts (test this by temporarily setting the array to `[]`).
   - Tracks a `cart` array and a running total.
3. A `DessertCard` component that:
   - Receives a dessert via `@Input()`.
   - Displays name, price, and image using interpolation and property binding.
   - Disables its "Buy" button (property binding) and visually dims itself (`ngClass` or `ngStyle`) when `available` is `false`.
   - Emits a custom `@Output()` event when "Buy" is clicked, carrying the dessert as its payload.
4. `DessertList` listens for that output and adds the dessert to `cart`, updating a visible cart count/total (interpolation).
5. (Optional but encouraged) A small "clear cart" button using event binding, and a search `[(ngModel)]` input that filters the visible desserts by name.

### Suggested Component Structure

```
App
 └── DessertList
       └── DessertCard (×N, via *ngFor)
```

### Required Angular Concepts (checklist)

- [ ] Components generated via CLI (`ng generate component`)
- [ ] Interpolation
- [ ] Property binding
- [ ] Event binding
- [ ] (Optional) Two-way binding for a search box
- [ ] `*ngIf`
- [ ] `*ngFor`
- [ ] `ngClass` and/or `ngStyle`
- [ ] `@Input`
- [ ] `@Output` + `EventEmitter`
- [ ] (Optional) `ngOnInit` for any setup logic

### Acceptance Criteria

- Running `ng serve` shows a working page with all desserts rendered from data, not hard-coded per-card markup.
- Clicking "Buy" on an available dessert updates the cart total live, with no manual page refresh.
- An unavailable dessert's "Buy" button is genuinely disabled (not just styled to *look* disabled).
- Setting the desserts array to empty shows the empty-state message instead of a blank area.
- No component directly reaches into another component's internals — all communication goes through `@Input`/`@Output`.

### Hints (if stuck)

- Start with hard-coded dessert data as a class property array — you don't need a server or HTTP calls (🔒 later module) for this project.
- Build `DessertCard` first in isolation (hard-code one dessert directly inside it), get it displaying correctly, *then* add `@Input`/`@Output` and wire it into `DessertList`.
- If `[(ngModel)]` errors with "can't bind to ngModel," you forgot to add `FormsModule` to `imports: []`.

### Optional Stretch Challenges

- Add a "featured" badge using `ngClass` for desserts marked `isFeatured: true`.
- Add a `ngOnInit` log confirming each `DessertCard` received its dessert correctly.
- Sort the dessert list by price using a method called from the template (be mindful this re-runs on every change-detection cycle — fine for a small learning project, but worth noticing as a real-world performance consideration for later modules).

---

## 13. Quick Reference Sheet

### Angular CLI Commands
```
ng new <project-name>                 Create a new Angular project
ng serve                              Run the dev server with live reload (localhost:4200)
ng generate component <name>          Generate a new component (class + template + styles)
ng g component <name>                 Shorthand for the above
```

### Template Syntax
```
{{ value }}          Interpolation        Class → Template, as text
[property]="value"   Property binding     Class → Template, as a DOM property
(event)="handler()"  Event binding        Template → Class
[(ngModel)]="value"  Two-way binding       Class ↔ Template (requires FormsModule)
```

### Important Directives
```
*ngIf="condition"                     Structural — add/remove element from DOM
*ngFor="let x of items"               Structural — repeat element per array item
[ngClass]="{ className: condition }"  Attribute — toggle CSS classes dynamically
[ngStyle]="{ cssProp: value }"        Attribute — set inline CSS properties dynamically
[class.foo]="condition"               Shorthand for a single dynamic class
```

### Component Communication
```
@Input() prop: Type;                          Parent → Child data
@Output() name = new EventEmitter<Type>();    Child → Parent event
this.name.emit(value);                        Fire the custom event
(name)="handler($event)"                      Parent listens to the custom event
```

### Component Decorator
```
@Component({
  selector: 'app-x',        Custom tag name used in templates
  templateUrl: './x.html',  Path to the template file
  styleUrl: './x.css'       Path to the scoped stylesheet
})
```

### Lifecycle (Module 1 scope)
```
ngOnInit()   Runs once, after inputs are first set — good for initial setup
```

### Important Terminology

| Term | Definition |
|---|---|
| **Component** | Self-contained UI unit: class + template + styles. |
| **Template** | HTML (plus Angular syntax) describing what a component renders. |
| **Decorator** | A function (like `@Component`) that attaches metadata to a class. |
| **Selector** | The custom HTML tag name that activates a component. |
| **Binding** | A declared relationship keeping template and class in sync. |
| **Directive** | An instruction changing an element's structure or appearance/behavior. |
| **Structural directive** | A directive that adds/removes elements from the DOM (`*ngIf`, `*ngFor`). |
| **Attribute directive** | A directive that changes an existing element's look/behavior (`ngClass`, `ngStyle`). |
| **View encapsulation** | Angular's default scoping of a component's CSS to just that component. |
| **`@Input`** | Marks a property as settable by a parent component. |
| **`@Output`** | Marks a property (an `EventEmitter`) as an event a parent can listen to. |
| **`EventEmitter`** | The class used to create and fire custom component events. |
| **Change detection** | Angular's mechanism for detecting data changes and updating the DOM to match. |
| **CLI** | Angular's command-line tool (`ng`) for scaffolding and running projects. |
| **Standalone component** | A component usable without being registered in an `NgModule`. |

### 🔒 Coming Later — Outside This Module
Routing · Advanced Dependency Injection · RxJS · HttpClient (server communication) · Authentication · NgRx/state management · Reactive Forms · `ngOnChanges`/`ngAfterViewInit`/`ngOnDestroy` and deeper lifecycle · Signals in depth · Server-side rendering · Testing (`*.spec.ts`) · Performance optimization (`trackBy` beyond the basic mention above, `OnPush` change detection, etc.)

---

## 14. Source & Resource Mapping

| Module Topic | Source Resource | Knowledge Extracted |
|---|---|---|
| What is Angular / architecture | Angular.io — "What is Angular?" | Platform framing, core building blocks, component-based architecture |
| CLI & first project | Angular.io — "Getting Started" | `ng new`, `ng serve`, generated project structure |
| Angular vs AngularJS | GeeksforGeeks — "Introduction to AngularJS" | Historical context, `$scope`/controllers vs modern components (used for contrast only) |
| Components, templates, binding, directives, lifecycle intro | FreeCodeCamp — Angular Course For Beginners (full tutorial) | Practical demonstration of components, all four binding types, `*ngIf`/`*ngFor`/`ngClass`/`ngStyle`, and `ngOnInit` |
| Components deep dive | Angular.io — "Components Overview" | Component class/template/style structure, decorator metadata |
| Template syntax deep dive | Angular.io — "Template Syntax" | Precise semantics of `{{ }}`, `[ ]`, `( )`, `[( )]` |
| Directives deep dive | Angular.io — "Built-in Directives" | `*ngIf`, `*ngFor`, `ngClass`, `ngStyle` mechanics and edge cases |
| Lifecycle | Angular.io — "Lifecycle Hooks" | `ngOnInit` timing relative to `@Input` and the constructor |
| Component communication | Angular.io — "Component Interaction" | `@Input`, `@Output`, `EventEmitter` patterns |
| Quick overview / motivation | Fireship — "Angular in 100 Seconds" | High-level framing used to open Section 1 |
| Extended walkthrough | Traversy Media — "Angular Crash Course" | Secondary reinforcement for CLI/components/binding |

**Quick links for deeper reading (optional, not required to complete this module):**
- [What is Angular? — Angular.io](https://angular.io/guide/what-is-angular)
- [Getting Started — Angular.io](https://angular.io/start)
- [Angular Components Overview](https://angular.io/guide/component-overview)
- [Template Syntax](https://angular.io/guide/template-syntax)
- [Built-in Directives](https://angular.io/guide/built-in-directives)
- [Lifecycle Hooks](https://angular.io/guide/lifecycle-hooks)
- [Component Interaction](https://angular.io/guide/component-interaction)
- [Introduction to AngularJS — GeeksforGeeks](https://www.geeksforgeeks.org/angular-js/angularjs/) *(historical context only)*
- [Angular in 100 Seconds — Fireship](https://www.youtube.com/watch?v=k5E2AVpwsko)
- [Angular Crash Course — Traversy Media](https://www.youtube.com/watch?v=3dHNOWTI7H8)
- [Angular Course For Beginners — FreeCodeCamp](https://www.youtube.com/watch?v=3qBXWUpoPHo)

---

### Discussion Prompt (from the original module)

> Explain the difference between Property Binding (`[ ]`) and Interpolation (`{{ }}`) in Angular templates. When would you typically choose one over the other?

Use Section 7.1–7.2 above to answer this in your own words before your live session — you now have everything needed to answer it precisely, including the `disabled` example that shows exactly *why* the distinction matters in practice, not just in theory.
