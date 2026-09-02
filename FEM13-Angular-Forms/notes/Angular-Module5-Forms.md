# Module 5: Angular Forms
### FEM13 — continues from FEM09 (Angular Fundamentals), FEM10 (Component Interaction & Lifecycle), FEM11 (Services & Dependency Injection), and FEM12 (Routing & Navigation)

> **Scope note:** This document covers *only* Module 5 — comparing Template-Driven and Reactive forms, building each (`FormsModule`/`ngModel`/`NgForm` for Template-Driven; `ReactiveFormsModule`/`FormControl`/`FormGroup`/`FormBuilder` for Reactive), built-in and custom validators (synchronous and asynchronous), `FormArray` for dynamic lists, and handling submission through a service. Anything beyond that — cross-field validation groups in depth, custom form control components (`ControlValueAccessor`), dynamic forms generated from metadata, form state persistence across routes, testing forms — is flagged **🔒 Coming Later — Outside This Module**.

---

## How this document is organized

Same documentation-first shape as Modules 1–4:

**What is it? → Why does Angular need it? → How does it work? → Syntax breakdown → Examples → When to use / not use → What happens behind the scenes? → How it connects to other concepts → Try It Yourself → Exercises → Common Mistakes**

Everything ties back to this module's running example: extending the Kanban app (Module 4) with real forms — creating and editing tasks within a board.

---

## Table of Contents

1. [From Module 4 to Module 5: What's New](#1-from-module-4-to-module-5-whats-new)
2. [Angular Forms Overview: Template-Driven vs. Reactive](#2-angular-forms-overview-template-driven-vs-reactive)
3. [Template-Driven Forms](#3-template-driven-forms)
4. [Reactive Forms](#4-reactive-forms)
5. [Form Validation](#5-form-validation)
6. [`FormArray`: Dynamic Lists of Controls](#6-formarray-dynamic-lists-of-controls)
7. [Handling Submission: Integrating With a Service](#7-handling-submission-integrating-with-a-service)
8. [Putting It Together: Kanban Task Forms Architecture](#8-putting-it-together-kanban-task-forms-architecture)
9. [Final Module Project: Kanban Task Management Web App (Part II — Forms & Validation)](#9-final-module-project-kanban-task-management-web-app-part-ii--forms--validation)
10. [Quick Reference Sheet](#10-quick-reference-sheet)
11. [Source & Resource Mapping](#11-source--resource-mapping)

---

## 1. From Module 4 to Module 5: What's New

Every user input handled so far has been simple: a single `<textarea>` in the Character Counter App (Module 2), a single `<input>` with `[(ngModel)]` in passing (Module 1). Nothing so far has needed **multiple related fields validated together, submitted as one unit, with real-time feedback on what's wrong and where**.

Creating or editing a Kanban task needs exactly that: a title (required, with a maximum length), a description (optional), a due date (must be a valid, perhaps future, date), and a column/status — several fields that belong together as one form, need validation individually and sometimes in combination, and should give the user feedback as they type, not just a rejection after clicking submit. Angular offers **two distinct strategies** for this — Template-Driven and Reactive — and this module's central skill is knowing both well enough to choose correctly between them.

### ✅ Knowledge Check
1. What's different about "creating a Kanban task" compared to every form of user input handled in Modules 1–4?

---

## 2. Angular Forms Overview: Template-Driven vs. Reactive

### What are the two approaches, at a glance?

| | Template-Driven Forms | Reactive Forms |
|---|---|---|
| Where does the form's structure live? | Mostly in the **template** (HTML), via directives like `ngModel` | Explicitly in the **component class** (TypeScript), as `FormGroup`/`FormControl` objects |
| How does Angular know the form's shape? | Angular infers it by watching the directives in the template | You declare it directly as a JavaScript/TypeScript object model |
| Data flow | Two-way binding (`[(ngModel)]`) | You read/write the form model's value directly; the template binds *to* that model |
| Best suited for | Small, simple forms — a single search box, a short contact form | Larger, more complex forms — dynamic fields, complex validation, forms whose structure might change at runtime |
| Testability without rendering a template | Harder — the form's structure only really exists once the template renders | Easier — the `FormGroup` is a plain object you can construct and inspect directly, no template required (🔒 actually writing those tests is a later module, but the *architectural* advantage exists now) |

### Why does Angular offer two different approaches instead of one?

Both solve "let the user fill out fields and validate what they enter," but they make a different trade-off between **simplicity** and **scalability/control**:

- **Template-Driven** trades some control for simplicity — for a two-field form, writing `[(ngModel)]` twice is less code than the Reactive equivalent, and it directly reuses two-way binding you already know from Module 1.
- **Reactive** trades a little more upfront code for a form model that's explicit, inspectable, and easier to extend — adding a fifth field to a Reactive form is a predictable, mechanical change to the `FormGroup` definition; adding a fifth field to a large Template-Driven form means growing an already-implicit structure that only "exists" inside the template.

### A concrete decision rule for this module (and the Kanban lab specifically)

> **A short, one-off form with no dynamic structure and simple validation → Template-Driven is reasonable.**
> **A form with several fields, validation logic worth unit-testing independently, or any dynamic list of fields (like a task's subtasks, using `FormArray`, Section 6) → Reactive.**

The Kanban task form (title, description, due date, status, and — as a stretch challenge — a dynamic list of subtasks) is deliberately chosen as this module's project specifically because it's realistic enough to justify Reactive Forms, while still being simple enough to also build with Template-Driven forms as a comparison exercise.

### How does this compare to React?

| Angular | React |
|---|---|
| Template-Driven: two-way `[(ngModel)]` binding, form structure implied by the template | Roughly comparable to "uncontrolled components" with refs, or simple controlled inputs with local `useState` per field |
| Reactive: an explicit `FormGroup` object model in the component class | Roughly comparable to a form-state library (e.g., Formik/React Hook Form) or a hand-rolled reducer managing all field values/errors in one object |

Neither Angular approach has a true one-to-one React equivalent — this comparison is meant to orient your existing intuition, not imply the tools are interchangeable.

### 🎥 Optional Video
This section's comparison draws on the official Angular Forms Overview guide and a 2025 comparison article (both linked in Section 11) rather than a dedicated video — reading the official guide's side-by-side framing directly is worth doing once before Sections 3–4 dive into the syntax of each.

### ✅ Knowledge Check
1. In one sentence each, what does Template-Driven trade for simplicity, and what does Reactive trade for control?
2. Why is a Kanban task form (with a potential dynamic subtask list) a better fit for Reactive Forms than a simple one-field search box would be?

---

## 3. Template-Driven Forms

### What is it?

A **Template-Driven form** is a form whose structure and validation are declared primarily through directives in the HTML template — `ngModel` for two-way binding of individual fields, and `NgForm` (created automatically on any `<form>` tag) representing the form as a whole.

### Setup: `FormsModule`

```typescript
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './task-form.component.html'
})
export class TaskFormComponent {
  title = '';
  description = '';
}
```
`FormsModule` must be imported into any standalone component using `ngModel`/`ngForm` — this is the same module Module 1 briefly introduced for `[(ngModel)]`; Module 5 is where it's used for a genuine multi-field form rather than a single input.

### `ngModel` on multiple fields, with `name`

```html
<form #taskForm="ngForm" (ngSubmit)="onSubmit(taskForm)">
  <label for="title">Title</label>
  <input id="title" name="title" [(ngModel)]="title" required />

  <label for="description">Description</label>
  <textarea id="description" name="description" [(ngModel)]="description"></textarea>

  <button type="submit" [disabled]="taskForm.invalid">Create Task</button>
</form>
```
- **`name="title"`** — every `ngModel`-bound field inside a `<form>` **must** have a unique `name` attribute. Unlike Module 1's single standalone `[(ngModel)]` example, `NgForm` uses these names internally to track each field as part of the whole form's model — omitting `name` here is a real, common error (covered in this section's mistakes table).
- **`#taskForm="ngForm"`** — a **template reference variable** (first seen conceptually in Module 1's `*ngIf`/`else` syntax) assigned to the special value `"ngForm"`, which gives you a reference to the `NgForm` directive Angular automatically attaches to any `<form>` tag inside a component using `FormsModule`. `taskForm` now exposes the whole form's aggregate state: `taskForm.valid`, `taskForm.invalid`, `taskForm.value`, `taskForm.submitted`, and so on.
- **`(ngSubmit)="onSubmit(taskForm)"`** — `ngSubmit` is a special event `NgForm` emits on submission, used instead of the native `(submit)` event because `ngSubmit` also automatically prevents the browser's default full-page-reload form submission behavior for you.
- **`[disabled]="taskForm.invalid"`** — a plain Module 1 property binding, now driven by the form's own aggregate validity rather than a component property you maintain by hand.

### Handling submission

```typescript
import { NgForm } from '@angular/forms';

export class TaskFormComponent {
  onSubmit(form: NgForm): void {
    if (form.invalid) {
      return;
    }
    console.log('Submitting:', form.value); // { title: '...', description: '...' }
    form.resetForm();
  }
}
```
- **`form.value`** — a plain object whose keys match each field's `name` attribute, and whose values are whatever the user entered — this is the entire "form model" Template-Driven forms build for you implicitly, from the template's directives.
- **`form.resetForm()`** — clears every field back to its initial state, correctly resetting not just the values but also validation/"touched" state (a plain manual reset of the component's own properties would clear values but leave stale validation-state flags behind).

### Three worked examples

**Example 1 — a minimal two-field form** (shown above).

**Example 2 — accessing individual field state, not just the whole form:**
```html
<input name="title" [(ngModel)]="title" required #titleField="ngModel" />
<p *ngIf="titleField.invalid && titleField.touched" role="alert">
  Title is required.
</p>
```
`#titleField="ngModel"` gives you a reference to *that one field's* `NgModel` directive, exposing `titleField.invalid`, `titleField.touched`, `titleField.dirty`, and so on — the field-level equivalent of `#taskForm="ngForm"`'s whole-form state, needed for per-field error messages (Section 5 covers validation display in more depth).

**Example 3 — a dropdown bound the same way as a text input:**
```html
<select name="status" [(ngModel)]="status">
  <option value="todo">To Do</option>
  <option value="in-progress">In Progress</option>
  <option value="done">Done</option>
</select>
```
`ngModel` works identically across input types (`text`, `textarea`, `select`, checkboxes, radio groups) — the two-way binding mechanism doesn't change based on which HTML control is generating the value.

### When to use Template-Driven forms

Small forms, quick to build, where the form's shape is fixed and known ahead of time and won't need to grow dynamically — matching Section 2's decision rule.

### When not to

Anything with a genuinely dynamic structure (an unknown number of fields decided at runtime — Section 6's `FormArray` scenario), complex cross-field validation you'd want to unit-test independently of the template, or a form large enough that tracking many `name`/`ngModel`/template-reference-variable pairs becomes its own source of bugs.

### Try It Yourself — Experiment: form vs. field-level state

Build the two-field form from Example 1, add `#titleField="ngModel"` per Example 2, and temporarily display both `{{ taskForm.valid }}` and `{{ titleField.valid }}` directly in the template while typing. Leave the title empty and watch both start `false`; type a single character and watch both flip to `true` — directly observing how field-level state rolls up into the form's aggregate state.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| `<input [(ngModel)]="title" />` inside a `<form>`, with no `name` attribute | `NgForm` requires a unique `name` on every `ngModel`-bound control to track it as part of the form model — omitting it throws a runtime error | `<input name="title" [(ngModel)]="title" />` | Gives `NgForm` a key to register this field under |
| Using `(submit)` instead of `(ngSubmit)` | The native `(submit)` event triggers the browser's default form submission (a full page reload) unless you manually call `event.preventDefault()` | Use `(ngSubmit)="onSubmit(taskForm)"` | `ngSubmit` already prevents the default browser behavior for you |
| Manually resetting each property (`this.title = ''; this.description = '';`) instead of `form.resetForm()` | Clears displayed values but leaves the form's internal validation/touched state stale, which can cause old error messages to flash incorrectly | Call `form.resetForm()` | Resets values **and** validation state together, correctly |
| Forgetting to import `FormsModule` into a standalone component using `ngModel` | `ngModel`/`ngForm` are directives that must be explicitly imported, exactly like `RouterOutlet` in Module 4 | Add `FormsModule` to the component's `imports: [...]` | Registers the directives the template is using |

### ✅ Knowledge Check
1. Why does every `ngModel`-bound field inside a `<form>` need a `name` attribute, when Module 1's single standalone `[(ngModel)]` example didn't?
2. What's the difference between `taskForm.valid` (from `#taskForm="ngForm"`) and `titleField.valid` (from `#titleField="ngModel"`)?

### 🎥 Optional Video
**Angular Template Driven Forms Crash Course (22 min)**
[Watch on YouTube](https://www.youtube.com/watch?v=sj0p9O85AIg)
**Useful for:** A full walkthrough building a form with `ngModel`, validation, and submission — good reinforcement immediately after this section.

---

## 4. Reactive Forms

### What is it?

A **Reactive form** represents the form's entire structure as an explicit object model in the component class — built from `FormControl` (one field) and `FormGroup` (a named collection of controls/groups) instances — with the template binding *to* that pre-built model, rather than the template *implying* the model the way Template-Driven forms do.

### Setup: `ReactiveFormsModule`

```typescript
import { Component } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './task-form.component.html'
})
export class TaskFormComponent {
  taskForm = new FormGroup({
    title: new FormControl(''),
    description: new FormControl('')
  });
}
```
- **`new FormControl('')`** — represents **one** form field; the argument (`''` here) is its initial value.
- **`new FormGroup({...})`** — represents a **named collection** of controls (or nested groups), keyed exactly like a plain object — `taskForm.controls.title` refers to the `title` `FormControl` above.
- Unlike Template-Driven forms, this entire structure exists **before the template ever renders it** — you could construct and inspect `taskForm` in isolation (🔒 actually unit-testing it that way is a later module, but the architectural point holds now: the model doesn't depend on a rendered DOM at all).

### Binding the template to the model: `formGroup` and `formControlName`

```html
<form [formGroup]="taskForm" (ngSubmit)="onSubmit()">
  <label for="title">Title</label>
  <input id="title" formControlName="title" />

  <label for="description">Description</label>
  <textarea id="description" formControlName="description"></textarea>

  <button type="submit" [disabled]="taskForm.invalid">Create Task</button>
</form>
```
- **`[formGroup]="taskForm"`** — a property binding (Module 1 syntax) connecting the `<form>` element to the `FormGroup` instance defined in the class.
- **`formControlName="title"`** — connects one `<input>` to the matching `FormControl` **by key name** inside the bound `FormGroup` — note there is **no** `[(ngModel)]`/two-way binding here at all; Reactive forms deliberately don't use `ngModel` the way Template-Driven forms do. The connection is entirely through the `FormGroup`/`FormControl` object model.

### `FormBuilder` — less repetitive construction

```typescript
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

@Component({ /* ... */ })
export class TaskFormComponent {
  private fb = inject(FormBuilder);

  taskForm = this.fb.group({
    title: [''],
    description: ['']
  });
}
```
`FormBuilder.group({...})` produces the exact same kind of `FormGroup` as manually writing `new FormGroup({ title: new FormControl(''), ... })`, just with less repetition — each key's array (`['']`) holds `[initialValue, validators?, asyncValidators?]` (validators covered fully in Section 5). `FormBuilder` is injected exactly like any Module 3 service (here shown using the `inject()` function from Module 4's guards, which works equally well in a component's property initializers as it does in a functional guard).

### Reading and writing the form's value programmatically

```typescript
// reading the whole form's current value
console.log(this.taskForm.value); // { title: '...', description: '...' }

// reading one control's value directly
console.log(this.taskForm.controls.title.value);

// setting values programmatically (e.g., pre-filling an edit form)
this.taskForm.patchValue({ title: 'Existing task title' });

// or, setting every control at once (throws if any key is missing)
this.taskForm.setValue({ title: 'Existing task title', description: 'Existing description' });
```
- **`.patchValue({...})`** — updates only the keys provided, leaving others untouched — the natural choice when pre-filling an edit form from data that might not include every field.
- **`.setValue({...})`** — requires **every** control's value to be provided, or it throws — useful as a safety net when you want to be certain nothing was accidentally left out.

### Three worked examples

**Example 1 — a minimal two-field Reactive form** (shown above).

**Example 2 — a nested `FormGroup` (grouping related fields, e.g., a task's schedule):**
```typescript
taskForm = this.fb.group({
  title: [''],
  schedule: this.fb.group({
    startDate: [''],
    dueDate: ['']
  })
});
```
```html
<div formGroupName="schedule">
  <input formControlName="startDate" />
  <input formControlName="dueDate" />
</div>
```
`formGroupName="schedule"` tells the template "everything inside this element binds to the nested `schedule` group, not the top-level `taskForm`" — directly mirroring how `taskForm.value` would now look like `{ title: '...', schedule: { startDate: '...', dueDate: '...' } }`, a nested object matching the nested model.

**Example 3 — pre-filling an edit form from existing data (a real Kanban "Edit Task" scenario):**
```typescript
export class TaskFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute); // from Module 4
  private taskService = inject(TaskService); // from Module 3's service pattern

  taskForm = this.fb.group({
    title: [''],
    description: ['']
  });

  ngOnInit(): void {
    const taskId = this.route.snapshot.paramMap.get('taskId');
    if (taskId) {
      const existingTask = this.taskService.getById(taskId);
      this.taskForm.patchValue(existingTask);
    }
  }
}
```
This one example deliberately weaves together Module 3 (service injection), Module 4 (`ActivatedRoute`, and — since this only needs to run once, on initial load of the edit form, not react to further changes — a legitimate use of `route.snapshot` rather than the reactive `paramMap` from Module 4, Section 6), and this module's `patchValue`.

### How does this compare to Template-Driven forms, concretely?

| | Template-Driven | Reactive |
|---|---|---|
| Where the model lives | Implied by the template's `ngModel`/`name` attributes | Explicit `FormGroup`/`FormControl` objects in the class |
| Getting the whole form's value | `taskForm.value` (from `#taskForm="ngForm"`) | `this.taskForm.value` (already a class property) |
| Pre-filling for an edit form | Manually assign each bound component property | `this.taskForm.patchValue({...})` in one call |
| Template binding directive | `[(ngModel)]` (two-way) | `formControlName` (connects to an existing model; no two-way binding syntax) |

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Forgetting `[formGroup]="taskForm"` on the `<form>` tag | `formControlName` directives inside have no enclosing group to resolve their names against | Always pair `[formGroup]` on the form with `formControlName` on each field | Establishes the parent-group context every `formControlName` needs |
| Mixing `[(ngModel)]` onto a field that's also using `formControlName` | Reactive forms manage the control's value directly; adding `ngModel` on top creates two competing sources of truth for the same input | Use `formControlName` alone in Reactive forms; use `[(ngModel)]` alone in Template-Driven forms — never both on the same field | Keeps exactly one mechanism responsible for a given field's value |
| Using `.setValue({...})` with only some of the form's keys provided | `setValue` requires every control to be included and throws if any are missing | Use `.patchValue({...})` when only updating a subset | `patchValue` is specifically designed for partial updates |
| Forgetting `formGroupName="schedule"` on the wrapping element for a nested group | `formControlName="startDate"` inside would otherwise be looked up against the *top-level* group, where no `startDate` key exists | Wrap nested fields in an element with `formGroupName` matching the nested group's key | Establishes the correct nested lookup context |

### Exercises

**Level 1 — Basic:** Build a two-field (`title`, `description`) Reactive form using `FormBuilder`, log `taskForm.value` on submit.

**Level 2 — Practical:** Add a nested `schedule` `FormGroup` (`startDate`, `dueDate`) using `formGroupName`, and confirm the submitted value is correctly nested.

**Level 3 — Challenge:** Build a Reactive "Edit Task" form that reads a `taskId` route parameter (Module 4), loads the existing task from a service (Module 3), and pre-fills the form via `patchValue` — reproducing Example 3 above in your own Kanban app.

### ✅ Knowledge Check
1. What does `[formGroup]="taskForm"` accomplish, and what would happen to `formControlName="title"` if it were missing?
2. Why should `[(ngModel)]` and `formControlName` never be combined on the same field?
3. When would you reach for `.patchValue()` instead of `.setValue()`?

### 🎥 Optional Video
This section's core syntax is drawn primarily from the official Angular Forms Overview guide (Section 11) — no dedicated Reactive Forms video was provided in this module's own resources, so the worked examples above are intended to stand in for that walkthrough; revisit the official guide directly for additional live examples if useful.

---

## 5. Form Validation

### What is a validator?

A **validator** is a function that inspects a control's current value and returns either `null` (valid) or an object describing what's wrong (invalid) — the mechanism behind every "this field is required," "too long," or "not a valid format" check.

### Built-in validators — Reactive forms

```typescript
import { FormBuilder, Validators } from '@angular/forms';

taskForm = this.fb.group({
  title: ['', [Validators.required, Validators.maxLength(60)]],
  description: ['', Validators.maxLength(500)],
  dueDate: ['', Validators.required]
});
```
- **`Validators.required`** — fails if the control's value is empty/null/undefined.
- **`Validators.maxLength(60)`** — fails if the value's length exceeds 60 characters.
- **A single validator** can be passed directly (`Validators.maxLength(500)`); **multiple validators** on one control are passed as an **array** (`[Validators.required, Validators.maxLength(60)]`).

Other commonly used built-ins: `Validators.minLength(n)`, `Validators.min(n)`/`Validators.max(n)` (for numeric ranges), `Validators.email`, `Validators.pattern(regex)`.

### Built-in validators — Template-Driven forms

```html
<input name="title" [(ngModel)]="title" required maxlength="60" #titleField="ngModel" />
```
Template-Driven forms apply the *same underlying validation logic* through plain-looking HTML attributes (`required`, `maxlength`) that Angular recognizes and wires up automatically — no `Validators` import needed here, since the directive-based approach reads these straight from the template.

### Reading validation state and displaying errors

**Reactive forms:**
```html
<input formControlName="title" />
<p *ngIf="taskForm.controls.title.invalid && taskForm.controls.title.touched" role="alert">
  <span *ngIf="taskForm.controls.title.errors?.['required']">Title is required.</span>
  <span *ngIf="taskForm.controls.title.errors?.['maxlength']">Title is too long.</span>
</p>
```
- **`.invalid`** — `true` if any validator on this control currently fails.
- **`.touched`** — `true` once the user has focused and then left (blurred) the field at least once — used here specifically so errors don't appear **before** the user has even had a chance to type anything (a real, common UX requirement, not just a technical detail).
- **`.errors`** — an object keyed by which validator(s) failed, e.g. `{ required: true }` or `{ maxlength: { requiredLength: 60, actualLength: 75 } }` — the `?.['required']` optional-chaining/bracket syntax safely reads a specific key without erroring if `.errors` is `null` (i.e., the control is currently valid).

**Template-Driven forms:**
```html
<input name="title" [(ngModel)]="title" required maxlength="60" #titleField="ngModel" />
<p *ngIf="titleField.invalid && titleField.touched" role="alert">
  <span *ngIf="titleField.errors?.['required']">Title is required.</span>
  <span *ngIf="titleField.errors?.['maxlength']">Title is too long.</span>
</p>
```
Structurally identical to the Reactive version — both expose the same `.invalid`/`.touched`/`.errors` shape, since both ultimately produce the same kind of underlying control object; only *how* you obtained the reference (`#titleField="ngModel"` vs. `taskForm.controls.title`) differs.

### Custom synchronous validators

```typescript
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function noWhitespaceOnlyValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value ?? '').trim();
    return value.length === 0 ? { whitespaceOnly: true } : null;
  };
}
```
```typescript
taskForm = this.fb.group({
  title: ['', [Validators.required, noWhitespaceOnlyValidator()]]
});
```
- **`ValidatorFn`** — the type for "a function usable as a validator" — a function taking an `AbstractControl` (the base type both `FormControl` and `FormGroup` share) and returning `ValidationErrors | null`.
- **Returning `{ whitespaceOnly: true }`** — the key name (`whitespaceOnly`) is arbitrary but should be descriptive; it's exactly what you'd check for in the template (`errors?.['whitespaceOnly']`), the same pattern as the built-in `required`/`maxlength` keys.
- This validator catches a case `Validators.required` alone misses: a title of `"   "` (just spaces) is technically non-empty, so `required` alone would incorrectly pass it.

### Custom cross-field validators (validating a `FormGroup`, not just one control)

```typescript
export function dueDateAfterStartValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const start = group.get('startDate')?.value;
    const due = group.get('dueDate')?.value;
    if (start && due && new Date(due) < new Date(start)) {
      return { dueBeforeStart: true };
    }
    return null;
  };
}
```
```typescript
schedule: this.fb.group(
  { startDate: [''], dueDate: [''] },
  { validators: dueDateAfterStartValidator() }
)
```
A validator attached to a `FormGroup` (via the second argument to `fb.group(...)`, as its `validators` option) receives the **whole group**, letting it compare multiple fields together — something no single-control validator could do alone, since `Validators.required` etc. only ever see one control's own value.

### Asynchronous validators (briefly)

```typescript
import { AsyncValidatorFn } from '@angular/forms';
import { map } from 'rxjs/operators'; // 🔒 RxJS operators are covered lightly here only for this one purpose

export function uniqueTaskTitleValidator(taskService: TaskService): AsyncValidatorFn {
  return (control: AbstractControl) => {
    return taskService.checkTitleExists(control.value).pipe(
      map((exists) => (exists ? { titleTaken: true } : null))
    );
  };
}
```
An **asynchronous validator** is used when checking validity requires an operation that takes time — most commonly, an `HttpClient` call (Module 3) to ask a server "does a task with this title already exist?" It has the same shape as a synchronous validator, but returns an Observable (or Promise) of the result instead of the result directly, and Angular marks the control as `PENDING` while waiting. **Full RxJS operator usage (like `map` above) remains 🔒 outside this module's depth** — this example is included only so the *existence and purpose* of async validators is recognizable; building your own beyond this pattern is not expected in this module's lab.

### Three worked "putting it together" examples

**Example 1 — a fully validated title field, Reactive:**
```typescript
title: ['', [Validators.required, Validators.maxLength(60), noWhitespaceOnlyValidator()]]
```

**Example 2 — disabling submission until the whole form (including cross-field rules) is valid:**
```html
<button type="submit" [disabled]="taskForm.invalid">Create Task</button>
```
Since `dueDateAfterStartValidator()` was attached to the `schedule` group, an invalid date range makes the **whole `taskForm`** invalid too — `FormGroup` validity rolls up from every nested control *and* group-level validator, all the way to the top-level form, exactly the way `taskForm.invalid` was already being read in Section 3–4's examples.

**Example 3 — showing a distinct message for a cross-field error:**
```html
<p *ngIf="taskForm.get('schedule')?.errors?.['dueBeforeStart']" role="alert">
  Due date cannot be before the start date.
</p>
```

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Showing validation errors immediately, with no `.touched` check | Every field appears "invalid" the instant the form loads, before the user has done anything — a poor, alarming user experience | Guard error messages with `&& field.touched` (or `.dirty`) | Only shows errors after the user has actually interacted with that field |
| Relying on `Validators.required` alone to catch "spaces-only" input | `"   "` is technically non-empty and passes `required` | Add a custom validator (like `noWhitespaceOnlyValidator`) alongside it | Catches a real gap the built-in validator doesn't cover |
| Writing a cross-field check as a validator on one individual `FormControl` | A single control's own validator only ever receives that one control's value — it has no access to a sibling field to compare against | Attach the validator to the enclosing `FormGroup` instead | Group-level validators receive the whole group, with access to every nested control |
| Treating an async validator's key exactly like a sync one, with no loading/pending state shown | The control sits in a `PENDING` state while the async check runs; ignoring this can make the UI look broken (neither valid nor clearly showing an error) during the wait | Check `control.pending` and show an appropriate "checking…" state if relevant | Matches the UI to the control's actual, real-time status |

### Exercises

**Level 1 — Basic:** Add `Validators.required` and `Validators.maxLength(60)` to a Reactive `title` control, and display a distinct error message for each failure reason.

**Level 2 — Practical:** Write and apply `noWhitespaceOnlyValidator()` to the same `title` control, alongside the built-ins from Level 1.

**Level 3 — Challenge:** Build the nested `schedule` group with `startDate`/`dueDate`, apply `dueDateAfterStartValidator()` at the group level, and display a distinct cross-field error message — reproducing Examples 2–3 above end to end in your own Kanban task form.

### ✅ Knowledge Check
1. Why does `Validators.required` alone fail to catch a "spaces-only" title, and what fixes that gap?
2. Why must a cross-field validator (like comparing a start date and due date) be attached to a `FormGroup` rather than an individual `FormControl`?
3. What's the practical difference between a synchronous and an asynchronous validator, and when would you need the latter?

---

## 6. `FormArray`: Dynamic Lists of Controls

### What is it?

A **`FormArray`** is a form model representing an **ordered, dynamically-sized list** of controls (or groups) — the Reactive Forms equivalent of Module 1's `*ngFor`, but for a list of *editable inputs* rather than read-only displayed data. This is precisely the kind of dynamic structure Section 2 flagged as a reason to prefer Reactive Forms over Template-Driven ones — a Template-Driven form has no equivalent for "an unknown number of fields, decided at runtime."

### Why does a Kanban task form need this?

A task might have a variable number of **subtasks** ("Design mockup," "Get approval," "Implement," ...) — the user should be able to add or remove as many as needed, each with its own text input, all submitted together as part of the one task form.

### Syntax breakdown

```typescript
import { FormArray, FormBuilder, Validators } from '@angular/forms';

export class TaskFormComponent {
  private fb = inject(FormBuilder);

  taskForm = this.fb.group({
    title: ['', Validators.required],
    subtasks: this.fb.array([
      this.fb.control('', Validators.required)
    ])
  });

  get subtasks(): FormArray {
    return this.taskForm.get('subtasks') as FormArray;
  }

  addSubtask(): void {
    this.subtasks.push(this.fb.control('', Validators.required));
  }

  removeSubtask(index: number): void {
    this.subtasks.removeAt(index);
  }
}
```
- **`this.fb.array([...])`** — creates a `FormArray` seeded with an initial list of controls (here, one empty subtask to start).
- **`get subtasks(): FormArray`** — a **getter** (the same TypeScript pattern from Module 2's `@Input()` setters, just without the `@Input()` decorator here) providing convenient, correctly-typed template access to the nested array, since `taskForm.get('subtasks')` alone returns the more general `AbstractControl` type.
- **`.push(control)`** — adds a new control to the end of the array at runtime.
- **`.removeAt(index)`** — removes the control at a given position.

### Rendering a `FormArray` in the template

```html
<div formArrayName="subtasks">
  <div *ngFor="let subtask of subtasks.controls; let i = index" [formGroupName]="i">
    <!-- Note: formGroupName here is used loosely to mean "this array index" —
         see the mistakes table below for the precise directive to use with
         a FormArray of plain FormControls versus FormGroups -->
  </div>
</div>
```
Corrected for a `FormArray` of plain `FormControl`s (not nested `FormGroup`s), the precise directive is `formControlName`, bound to the numeric index:
```html
<div formArrayName="subtasks">
  <div *ngFor="let subtask of subtasks.controls; let i = index">
    <input [formControlName]="i" />
    <button type="button" (click)="removeSubtask(i)">Remove</button>
  </div>
</div>
<button type="button" (click)="addSubtask()">Add Subtask</button>
```
- **`formArrayName="subtasks"`** — establishes the array context for everything nested inside, exactly parallel to `formGroupName` establishing a nested group's context in Section 4.
- **`*ngFor="let subtask of subtasks.controls; let i = index"`** — iterates the array's current controls (Module 1 syntax), tracking the index for each.
- **`[formControlName]="i"`** — binds each rendered `<input>` to the control at that numeric index — note this uses the **property-binding** form (`[formControlName]`, with brackets) rather than the plain attribute form (`formControlName="i"`) used elsewhere in this module, specifically because `i` here is a **variable** (the loop index) rather than a fixed, literal key name.

### A `FormArray` of `FormGroup`s (a more realistic subtask shape)

```typescript
subtasks: this.fb.array([
  this.fb.group({ text: ['', Validators.required], done: [false] })
])
```
```html
<div formArrayName="subtasks">
  <div *ngFor="let subtask of subtasks.controls; let i = index" [formGroupName]="i">
    <input formControlName="text" />
    <input type="checkbox" formControlName="done" />
  </div>
</div>
```
Here, each subtask is itself a small `FormGroup` (with `text` and `done` fields), so `[formGroupName]="i"` (not `formControlName`) is correct — establishing index `i` as a nested *group* context, inside which the plain `formControlName="text"`/`formControlName="done"` attribute forms work exactly as in Section 4, since their keys are fixed, literal names again at that level.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Using `formControlName="i"` (a plain attribute, quoted, with no brackets) to bind to a loop index | Without property-binding brackets, Angular treats `"i"` as the **literal string** `"i"`, not the loop variable's current value | Use `[formControlName]="i"` (bracket property binding) | Evaluates `i` as an expression, using its actual numeric value each iteration |
| Using `formControlName` for an array of nested `FormGroup`s instead of `formGroupName` | `formControlName` expects the given index to resolve to a single `FormControl`; a nested `FormGroup` needs `formGroupName` to establish its own group context first | Match the directive to what's actually at that index: `formControlName` for a plain control, `formGroupName` for a nested group | Keeps the binding directive consistent with the actual model shape at each level |
| Forgetting `formArrayName="subtasks"` on the wrapping element | Everything nested inside has no array context to resolve indices against | Always wrap a `FormArray`'s rendered items in an element with `formArrayName` matching its key | Establishes the array context the nested `[formControlName]`/`[formGroupName]` bindings need |
| Rebuilding the entire `FormArray` from scratch every time a subtask is added/removed, instead of using `.push()`/`.removeAt()` | Destroys and recreates every existing control, losing their current values/validation/touched state unnecessarily | Use the `FormArray`'s own `.push()`/`.removeAt()`/`.insert()` methods | Modifies the existing array in place, preserving every other control's state |

### ✅ Knowledge Check
1. Why does binding to a `FormArray` index require `[formControlName]="i"` (brackets) instead of `formControlName="i"`?
2. When would a `FormArray` use `formGroupName` at each index instead of `formControlName`?

### 🎥 Optional Video
This section is based directly on the **"Introduction to Angular FormArray" article (Angular University)**, linked in Section 11 — no dedicated video was provided for this specific topic in this module's resources; the article is worth reading in full alongside the examples above, since `FormArray` benefits especially from seeing several worked variations side by side.

---

## 7. Handling Submission: Integrating With a Service

### The problem this section solves

Every example so far has ended at `console.log(this.taskForm.value)`. A real form needs its submitted data to actually **do** something — create a new task, update an existing one — which means handing it off to a service (Module 3), exactly the same architectural pattern already established for the Dessert Shop's `CartService` and the Kanban app's `BoardService`.

### Example 1 — creating a new task

```typescript
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router'; // Module 4
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaskService } from '../../services/task.service'; // Module 3 pattern

@Component({ /* ... */ })
export class TaskFormComponent {
  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  private router = inject(Router);

  taskForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(60)]],
    description: ['']
  });

  onSubmit(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    this.taskService.createTask(this.taskForm.value);
    this.router.navigate(['/boards']); // Module 4 navigation, after a successful action
  }
}
```
- **`this.taskForm.markAllAsTouched()`** — if the user clicks submit while the form is still invalid, this marks every control as `touched`, which (per Section 5's `.touched` guard) immediately reveals every relevant error message at once, rather than only the ones the user happened to have already blurred past.
- **`this.taskService.createTask(...)`** — the actual business logic (deciding how to store/process the new task) lives in the **service**, not the component — the component's job is purely "gather valid input, hand it off, then navigate."
- **`this.router.navigate([...])`** — Module 4's programmatic navigation, used here exactly as originally introduced: navigation as a *consequence* of an action completing, not a direct link click.

### Example 2 — editing an existing task, combining Sections 4, 5, and Module 3/4 together

```typescript
export class TaskEditFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  taskId!: string;
  taskForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(60)]],
    description: ['']
  });

  ngOnInit(): void {
    this.taskId = this.route.snapshot.paramMap.get('taskId')!;
    const existingTask = this.taskService.getById(this.taskId);
    this.taskForm.patchValue(existingTask);
  }

  onSubmit(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }
    this.taskService.updateTask(this.taskId, this.taskForm.value);
    this.router.navigate(['/boards', /* boardId */]);
  }
}
```

### Example 3 — a service method that itself uses `HttpClient` (Module 3), returning an Observable the component subscribes to on submit

```typescript
@Injectable({ providedIn: 'root' })
export class TaskService {
  constructor(private http: HttpClient) {}

  createTask(task: { title: string; description: string }): Observable<{ id: string }> {
    return this.http.post<{ id: string }>('/api/tasks', task);
  }
}
```
```typescript
onSubmit(): void {
  if (this.taskForm.invalid) {
    this.taskForm.markAllAsTouched();
    return;
  }
  this.taskService.createTask(this.taskForm.value).subscribe({
    next: () => this.router.navigate(['/boards']),
    error: (err) => {
      this.submitError = 'Could not create the task. Please try again.';
      console.error(err);
    }
  });
}
```
This example ties together the entire course so far in one flow: Reactive Forms (this module) gather and validate input; a service (Module 3) wraps the actual `HttpClient` call; `.subscribe()`'s `next`/`error` split (Module 3, Section 7) determines whether to navigate away (Module 4) or show an inline error — with no step skipped or invented, each piece doing exactly the job it was introduced to do.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Submitting `this.taskForm.value` without first checking `.invalid` | Sends incomplete/invalid data straight to the service, bypassing every validator from Section 5 | Always guard `onSubmit()` with `if (this.taskForm.invalid) { return; }` (typically after `markAllAsTouched()`) | Ensures only genuinely valid data ever reaches the service |
| Putting the actual data-saving logic directly inside `onSubmit()`, rather than delegating to a service | Repeats Module 3's original problem — business logic trapped inside a component, unreusable and hard to reason about independently | Call a service method (`this.taskService.createTask(...)`) and let the service own how creation actually happens | Keeps the separation of concerns Module 3 established |
| Navigating away immediately after calling an `HttpClient`-backed service method, without waiting for `.subscribe()` to confirm success | The request may still be pending, or may fail entirely, while the user has already been navigated away as if it succeeded | Navigate inside the `next` callback of `.subscribe()`, not immediately after calling the service method | Matches navigation to the request's actual, confirmed outcome |

### ✅ Knowledge Check
1. Why call `markAllAsTouched()` specifically when a user submits an invalid form, rather than relying on the `.touched` state from individual field interactions alone?
2. In Example 3, why does `router.navigate(...)` happen inside the `next` callback rather than immediately after calling `createTask(...)`?

---

## 8. Putting It Together: Kanban Task Forms Architecture

```
TaskService (Module 3 pattern, providedIn: 'root')
 │  - createTask(task), updateTask(id, task), getById(id)
 │  - (optionally) HttpClient-backed, per Module 3 Section 7

TaskFormComponent (Reactive Form — create mode)
 │  - injects: FormBuilder, TaskService, Router
 │  - taskForm: FormGroup { title, description, schedule: FormGroup { startDate, dueDate },
 │                          subtasks: FormArray }
 │  - validators: Validators.required/maxLength, noWhitespaceOnlyValidator,
 │                dueDateAfterStartValidator (group-level)
 │  - onSubmit(): guards on taskForm.invalid → taskService.createTask(...) → router.navigate(...)

TaskEditFormComponent (Reactive Form — edit mode)
 │  - injects: FormBuilder, TaskService, ActivatedRoute (Module 4), Router
 │  - ngOnInit(): reads :taskId via route.snapshot (one-time; not reactive — see Section 4, Example 3)
 │                → taskService.getById(taskId) → taskForm.patchValue(existingTask)
 │  - onSubmit(): taskService.updateTask(taskId, taskForm.value) → router.navigate(...)

Routes (Module 4 pattern)
 │  'boards/:boardId/tasks/new'      → TaskFormComponent
 │  'boards/:boardId/tasks/:taskId/edit' → TaskEditFormComponent
```

**How every prior module shows up here:** `TaskService` is a Module 3 service; both form components inject it via constructor injection or `inject()`. Route parameters (`:boardId`, `:taskId`) are Module 4's `ActivatedRoute`, read via snapshot here specifically because the edit form's one-time pre-fill doesn't need to react to further parameter changes the way Module 4's board-detail reuse scenario did. `onSubmit()`'s validity guard and error display use Module 1's `*ngIf` and Module 2's understanding of when state needs to update reactively versus once.

---

## 9. Final Module Project: Kanban Task Management Web App (Part II — Forms & Validation)

### Project Requirements

Extend the Module 4 Kanban app with real forms for creating and editing tasks, using Reactive Forms as the primary approach, plus one Template-Driven form for direct comparison.

### Functional Requirements

1. A **Reactive** task-creation form (`title`, `description`, and a nested `schedule` group with `startDate`/`dueDate`) built with `FormBuilder`.
2. Validation: `title` required and length-limited, with a custom validator rejecting whitespace-only input; a group-level custom validator ensuring `dueDate` isn't before `startDate`.
3. Field-level error messages shown only after a field is `touched`, with distinct messages per failure reason.
4. A working "Create Task" submission flow: guards on `taskForm.invalid` (calling `markAllAsTouched()` otherwise), delegates the actual creation to a `TaskService` method, and navigates back to the board on success.
5. A working "Edit Task" form, pre-filled via `patchValue` from an existing task looked up by a `:taskId` route parameter, submitting via a corresponding `updateTask` service method.
6. At least one `FormArray` (subtasks) that can be dynamically added to and removed from at runtime.
7. (Comparison exercise) A small, separate **Template-Driven** form — for example, a "Quick add task" bar that only takes a title — using `ngModel`/`NgForm`/`ngSubmit`, to directly experience the contrast Section 2 describes.

### Suggested Component/Service Structure

```
services/
└── task.service.ts        (Module 3 pattern; createTask/updateTask/getById)

components/
├── task-form (Reactive)          'boards/:boardId/tasks/new'
├── task-edit-form (Reactive)     'boards/:boardId/tasks/:taskId/edit'
└── quick-add-task (Template-Driven, comparison exercise)
```

### Required Angular Concepts (checklist)

- [ ] A Reactive form built with `FormBuilder`, using `FormGroup`/`FormControl`
- [ ] At least one nested `FormGroup` (`formGroupName`)
- [ ] At least one `FormArray` (`formArrayName`, `[formControlName]`/`[formGroupName]` bound to a loop index)
- [ ] Built-in validators (`Validators.required`, `Validators.maxLength`, etc.)
- [ ] At least one custom synchronous validator
- [ ] At least one group-level (cross-field) custom validator
- [ ] Field-level error messages guarded by `.touched`
- [ ] `markAllAsTouched()` used on invalid submit attempts
- [ ] Submission delegated to a service method, not handled inline in the component
- [ ] Navigation (Module 4) after successful submission
- [ ] One comparison Template-Driven form using `ngModel`/`NgForm`/`ngSubmit`

### Acceptance Criteria

- Submitting an invalid form does not call the service and instead reveals all relevant error messages at once.
- Submitting a valid form correctly creates/updates a task via the service and navigates away.
- The due-date-before-start-date scenario is specifically, correctly rejected with a visible error message.
- Adding/removing subtasks at runtime correctly updates `taskForm.value`'s `subtasks` array without losing existing subtask values.
- The edit form correctly pre-fills every field from existing task data before the user makes any changes.
- The Template-Driven comparison form behaves correctly with its own independent validation, with no `formControlName` accidentally mixed into it.

### Hints (if stuck)

- Build the flat, two-field version of the create form first (no nested group, no `FormArray`), fully working end to end, before adding `schedule` or `subtasks` — exactly the same "prove the simple case first" advice from every prior module's project.
- If `[formControlName]="i"` inside a `FormArray` doesn't seem to bind correctly, check for the missing brackets first — this is this section's single most common mistake.
- If old error messages seem to "flash" incorrectly after a reset, check whether you're resetting values manually instead of calling the form's own reset method (`taskForm.reset()` for Reactive forms, `form.resetForm()` for Template-Driven).

### Optional Stretch Challenges

- Add an async validator (Section 5) checking a task title against existing titles on the board via `TaskService`, showing a "checking…" state while pending.
- Add a `done: boolean` checkbox to each subtask (the `FormArray` of `FormGroup`s pattern from Section 6), and compute a "X of Y subtasks complete" summary directly from `taskForm.value.subtasks`.
- Extract the due-date-after-start-date validator into its own well-documented, reusable function file, and write a plain comment-based test-case walkthrough (input → expected result) for it, as a preview of what an actual unit test (🔒 later module) would formalize.

---

## 10. Quick Reference Sheet

### Template-Driven Forms
```
imports: [FormsModule]

<form #taskForm="ngForm" (ngSubmit)="onSubmit(taskForm)">
  <input name="title" [(ngModel)]="title" required #titleField="ngModel" />
</form>

taskForm.valid / .invalid / .value / .submitted
titleField.valid / .invalid / .touched / .dirty / .errors
form.resetForm()
```

### Reactive Forms
```
imports: [ReactiveFormsModule]

taskForm = this.fb.group({
  title: ['', [Validators.required, Validators.maxLength(60)]],
  schedule: this.fb.group({ startDate: [''], dueDate: [''] })
});

<form [formGroup]="taskForm" (ngSubmit)="onSubmit()">
  <input formControlName="title" />
  <div formGroupName="schedule">
    <input formControlName="startDate" />
  </div>
</form>

taskForm.value / .invalid / .controls.title
taskForm.patchValue({...})   // partial update
taskForm.setValue({...})     // full update, throws if incomplete
taskForm.markAllAsTouched()
```

### Validators
```
Validators.required
Validators.maxLength(n) / Validators.minLength(n)
Validators.min(n) / Validators.max(n)
Validators.email
Validators.pattern(regex)

// Custom synchronous
function myValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => { ... };
}

// Custom cross-field (attached to a FormGroup, not one control)
this.fb.group({ a: [''], b: [''] }, { validators: myGroupValidator() });

// Async (returns Observable<ValidationErrors | null>)
function myAsyncValidator(): AsyncValidatorFn { ... }
```

### `FormArray`
```
taskForm = this.fb.group({
  subtasks: this.fb.array([ this.fb.control('') ])
});

get subtasks(): FormArray { return this.taskForm.get('subtasks') as FormArray; }
this.subtasks.push(this.fb.control(''));
this.subtasks.removeAt(index);

<div formArrayName="subtasks">
  <input *ngFor="let s of subtasks.controls; let i = index" [formControlName]="i" />
</div>
```

### Important Terminology

| Term | Definition |
|---|---|
| **Template-Driven form** | A form whose structure is implied by template directives (`ngModel`, `name`). |
| **Reactive form** | A form whose structure is an explicit `FormGroup`/`FormControl` object model in the class. |
| **`NgForm`** | The directive automatically attached to a `<form>` tag in a Template-Driven form. |
| **`FormControl`** | Represents one field's value/validity/state. |
| **`FormGroup`** | A named collection of controls/groups. |
| **`FormArray`** | A dynamically-sized, ordered list of controls/groups. |
| **`FormBuilder`** | A service that reduces boilerplate when constructing `FormGroup`/`FormControl`/`FormArray`. |
| **Validator** | A function returning `null` (valid) or an errors object (invalid) for a control's current value. |
| **`.touched`** | `true` once a control has been focused and then blurred at least once. |
| **`.dirty`** | `true` once a control's value has been changed from its initial value. |
| **Cross-field validator** | A validator attached to a `FormGroup`, comparing multiple nested controls together. |
| **Asynchronous validator** | A validator whose check takes time (e.g., a server round-trip), returning an Observable/Promise of the result. |

### 🔒 Coming Later — Outside This Module
`ControlValueAccessor` (custom form control components) · Dynamic forms generated from metadata/schemas · Form state persisted across route navigation · Testing forms (`ComponentFixture`, simulating user input) · Full RxJS operator usage within async validators

---

## 11. Source & Resource Mapping

| Module Topic | Source Resource | Knowledge Extracted |
|---|---|---|
| Forms overview, Template-Driven vs. Reactive | Angular.io — "Angular Forms Overview" | Core comparison framing used in Section 2 |
| Modern comparison of both approaches | Medium — "Master Angular Forms in 2025: Template vs Reactive" | Reinforcement for Section 2's decision rule |
| `NgForm`/`ngModel` foundation | GeeksforGeeks — "Angular Forms ngForm Directive" | Section 3's `NgForm`/template-reference-variable coverage |
| Template-Driven forms walkthrough (video) | YouTube — "Angular Template Driven Forms Crash Course" (22 min) | Practical reinforcement for Section 3 |
| `FormArray` for dynamic lists | Angular University — "Introduction to Angular FormArray" | Section 6's dynamic-list patterns |

**Quick links for deeper reading (optional, not required to complete this module):**
- [Angular Forms Overview — Angular.io](https://angular.io/guide/forms-overview)
- [Master Angular Forms in 2025 — Medium](https://medium.com/@priyaranjanpatraa/master-angular-forms-in-2025-template-vs-reactive-two-way-binding-a3b89a8a264d)
- [Angular Forms ngForm Directive — GeeksforGeeks](https://www.geeksforgeeks.org/angular-js/angular-forms-ngform-directive/)
- [Angular Template Driven Forms Crash Course — YouTube](https://www.youtube.com/watch?v=sj0p9O85AIg)
- [Introduction to Angular FormArray — Angular University](https://blog.angular-university.io/angular-form-array/)

---

### Discussion Prompt (from the original module)

> Based on the resources, describe a scenario where you would strongly prefer Reactive Forms over Template-Driven Forms, and explain why. What specific features of Reactive Forms make them better suited for that scenario?

The Kanban task form's dynamic subtask list (Section 6) is exactly this scenario: Template-Driven forms have no equivalent to `FormArray` for an unknown-at-build-time number of fields, and a group-level cross-field validator (Section 5's `dueDateAfterStartValidator`) is far more naturally expressed against an explicit `FormGroup` object than inferred from scattered template directives. Frame your own answer around this example, or an equivalent one from your own extensions, in your own words.
