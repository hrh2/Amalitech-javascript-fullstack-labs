# FEM13: Angular Forms

## Learning Objectives

Upon successful completion of this module, learners will be able to:

* **Differentiate** between the use cases for Template-Driven and Reactive forms in Angular.
* **Implement** two-way data binding using ngModel to build a simple Template-Driven form.
* **Construct** a complex, scalable Reactive form using FormGroup, FormControl, and FormBuilder.
* **Apply** built-in and custom validators to provide real-time user feedback on data entry.
* **Manage** the submission and processing of form data by interacting with a service.

## Learning Approach

This module follows a **Project-Based Learning** (PBL) model. Handling user input is a critical and complex part of
front-end development, and the concepts are best understood through direct application. Learners will be introduced to
Angular's two distinct approaches to forms—Template-Driven and Reactive.

They will apply this knowledge by extending their existing "Kanban Task Management Web App" to include forms for
creating and editing tasks. The module starts by comparing the two forms strategies (Analyze), then dives into the
practical implementation of each (Apply). The culminating lab requires learners to build a complete form with validation
and submission logic, a task that requires them to synthesize all the module's concepts to create a robust and
user-friendly feature (Create).

Learners receive immediate feedback from their development environment. All final lab submissions are then reviewed by a
TA in a live code review session to provide expert feedback on code quality, architecture, and best practices.

## Learning Activities

* **Hands-on Coding Lab**: The central activity is the "**Kanban Task Management Web App (Part II – Forms &
  Validation)**." Learners will extend their Kanban app by implementing forms for creating and editing tasks within
  boards. They will explore both form types, apply form validation, and handle user input to maintain data consistency
  and improve user experience, integrating the forms seamlessly with the existing architecture.
* **Formative Quiz**: An auto-graded quiz with multiple-choice questions to test knowledge of the key classes (NgForm,
  FormGroup), directives (ngModel), and validation properties.

## Module Structure

| Lesson / Section | Main Topic                        | Format           | Learning Activity / Outcome                                                 |
|------------------|-----------------------------------|------------------|-----------------------------------------------------------------------------|
| **1**            | **Introduction to Angular Forms** | Video + Reading  | Compare and contrast Template-Driven and Reactive Forms.                    |
| **2**            | **Template-Driven Forms**         | Reading + Video  | Build a simple form using `FormsModule` and `ngModel`.                      |
| **3**            | **Reactive Forms**                | Reading + Video  | Construct a form model using `ReactiveFormsModule` and `FormBuilder`.       |
| **4**            | **Form Validation**               | Reading          | Implement synchronous and asynchronous validators to ensure data integrity. |
| **5**            | **Knowledge Check**               | Auto-graded Quiz | Recall and identify key concepts for both form types and form validation.   |
| **6**            | **Hands-On Lab**                  | Coding Lab       | Build forms for the **"Kanban Task Management Web App"**.                   |

## Resource Book

### 1. Forms Overview: Template-Driven vs. Reactive

Start here to understand the two different form-building strategies in Angular and when to choose one over the other.

* **Articles / Reading**:
    * **Angular Forms Overview | Angular.io**: The official documentation providing a high-level introduction to both
      Template-Driven and Reactive forms. [Link](https://angular.io/guide/forms-overview)
    * **Master Angular Forms in 2025: Template vs Reactive | Medium**: This article gives a modern comparison of the two
      approaches and the role of two-way
      binding. [Link](https://medium.com/@priyaranjanpatraa/master-angular-forms-in-2025-template-vs-reactive-two-way-binding-a3b89a8a264d)

### 2. Template-Driven Forms

Learn the Template-Driven approach, which is simpler for basic forms and relies heavily on directives (like ngModel) in
the HTML template.

* **Articles / Reading**:
    * **Angular Forms ngForm Directive | GeeksforGeeks**: This guide explains the ngForm directive, which is the
      foundation of Template-Driven forms and works closely with
      ngModel. [Link](https://www.geeksforgeeks.org/angular-js/angular-forms-ngform-directive/)
* **Video Resources**:
    * **Angular Template Driven Forms Crash Course (22 min)**: A beginner-friendly introduction that walks through
      building a form using ngModel (two-way binding) and handling validation and submission.
        * [Play Video](https://www.youtube.com/watch?v=sj0p9O85AIg)

### 3. Reactive Forms

Dive into the Reactive approach, a more robust and scalable strategy where the form model is managed explicitly in the
component's TypeScript code.

* **Articles / Reading**:
    * **Introduction to Angular FormArray | Angular University**: This article covers a key concept for complex forms
      (LO 3): how to use FormArray to manage dynamic lists of form controls (e.g., adding multiple phone numbers,
      skills, or line items). [Link](https://blog.angular-university.io/angular-form-array/)

### 4. Discussion Prompt

Based on the resources, describe a scenario where you would strongly prefer Reactive Forms over Template-Driven Forms,
and explain why. What specific features of Reactive Forms make them better suited for that scenario?