# FEM13 TA Review Prep — Kanban Task Management Web App (Forms & Validation)

Project location: `FEM13-Angular-Forms/kanban-task-management-app/`
Starting point: `FEM12-Routing-and-Navigation/kanban-task-management-app/` (copied in, then extended)

---

## 1. Lab Overview

### What the app does

The Kanban app manages **boards** (e.g. "Website Redesign") and the **tasks** inside each board, shown as a
Kanban board of three columns — **To do**, **In progress**, **Done**. A board list page shows every board with
sort/create controls; a board detail page shows a board's Kanban columns with next/previous-board navigation; each
task has a title, description, status, an optional due date, and an optional list of subtasks.

### What FEM13 adds

FEM12 finished with routing, navigation, and — deliberately — **no forms at all**: its editable fields (the
"create board" panel, the task-detail edit fields) use plain one-way binding (`[value]`) plus event handlers
(`(input)`/`(change)`/`(submit)`), specifically to avoid pulling `ngModel`/`FormsModule` into a routing-focused
module. FEM13's job is to introduce real, validated forms on top of that foundation:

- Two dedicated, routed form components — **Add Task** and **Edit Task** — replacing FEM12's inline, non-form
  task-detail editor entirely.
- A reactive form (`FormGroup`/`FormBuilder`) with built-in validators (`required`, `minLength`, `maxLength`) and
  two custom validators (no duplicate task titles on a board; due date can't be in the past).
- A `FormArray` of subtasks that can be added/removed dynamically (the lab's bonus task).
- Live, per-field error messages that appear once a field has been touched, plus a submit button that's disabled
  until the form is valid.
- Reuse of FEM12's `CanDeactivate` guard so leaving a form with unsaved edits prompts for confirmation — now driven
  by the form's own `dirty` state instead of a hand-written field comparison.
- **The first appearance of `ngModel`/`FormsModule`/`NgForm` anywhere in this project's history:** the board list's
  "create board" panel, which in FEM12 was plain manually-bound inputs, is upgraded here into a real
  **template-driven form** with validation — genuinely introducing two-way binding as a new capability, not just
  adding validators to something that already had it.

### Why forms are needed here

A Kanban board is fundamentally a **data-entry tool** — the whole point is letting a user create and edit tasks.
FEM12 could route to a task and let you type into a couple of fields, but had no real way to guarantee the data
entered was usable (an empty title, a 90-character title, two tasks with the identical name) — that's exactly the
gap Angular's forms module closes: capturing input, tracking its validity/dirty/touched state, and giving the
user feedback before bad data ever reaches `BoardService`.

---

## 2. What Changed from FEM12

### Already existed in FEM12 (reused, not rebuilt)

- `BoardService`, `AuthService` and both guards (`authGuard`, `unsavedChangesGuard`) — untouched in spirit, only
  extended where a new capability needed it (see below).
- The board list, board detail, settings, login, and not-found pages/components — reused, with the board
  list/detail templates re-skinned to match FEM13's forms and FEM12's later Kanban-column redesign (see §3 below
  on which changes are FEM13-specific vs. inherited).
- The routing structure: top-level `app.routes.ts`, the lazy-loaded `boards/:boardId` feature area, the
  `paramsInheritanceStrategy: 'always'` router config.
- The Kanban-column board layout, the overall light-mode design system (colors, spacing, cards, buttons), and the
  app shell/nav — all shared verbatim with FEM12 so the two apps read as two stages of one project, not two
  different applications. FEM13 layers its forms *into* that shared shell rather than replacing it.

### Added or changed for FEM13

| File | Change |
|---|---|
| `core/models/task.model.ts` | Added `dueDate: string \| null` and a new `Subtask { title, completed }[]` field. |
| `core/services/board.service.ts` | Added `addTask()`, extended `updateTask()` to carry `dueDate`/`subtasks`, added `isTitleTaken()` for the duplicate-title validator. Seed data updated with due dates and subtasks. |
| `core/validators/task-validators.ts` | **New.** `duplicateTitleValidator()` (factory, needs `BoardService` + `boardId`) and `dueDateNotInPastValidator` (pure). |
| `features/board/task-form/` | **New.** `TaskFormComponent` (presentational reactive form) + `task-form.factory.ts` (`buildTaskForm`, `applyDuplicateTitleValidator`, `subtaskGroup`, `patchTaskIntoForm`). |
| `features/board/add-task/` | **New.** Routed at `new-task`. Owns the `FormGroup`, calls `BoardService.addTask()`. |
| `features/board/edit-task/` | **New.** Routed at `edit/:taskId`. Replaces FEM12's manually-bound `TaskDetailComponent` entirely. |
| `features/board/task-detail/` | **Removed.** Its "inline edit, no validation" job is now done properly by `EditTaskComponent`. |
| `features/board/board.routes.ts` | `tasks/:taskId` → `new-task` and `edit/:taskId`, both `canDeactivate: [unsavedChangesGuard]`. |
| `features/board/board-detail/*` | Kanban-column task cards now link to `edit/:taskId` (was `tasks/:taskId`); added a "+ New task" link; added a dismissible success banner driven by a `?taskSaved=created\|updated` query param; task cards show due date / subtask progress. |
| `pages/board-list/*` | The existing manually-bound "Create board" panel is rebuilt as a real `NgForm`/`[(ngModel)]` **template-driven form** with `minlength`/`maxlength` validators, live error messages, and a disabled-until-valid submit button — see §3. |

---

## 3. Forms Architecture

### Which components contain forms

1. **`TaskFormComponent`** (`features/board/task-form/`) — a **presentational** reactive-forms component. It does
   not build the `FormGroup`, call `BoardService`, or navigate anywhere. It receives an already-built `FormGroup`
   via `@Input() form`, renders every field and its error messages, and reports user intent upward through two
   `@Output()`s: `formSubmit` and `formCancel`.
2. **`AddTaskComponent`** (routed at `new-task`) and **`EditTaskComponent`** (routed at `edit/:taskId`) — the
   "smart" components. Each builds its own `FormGroup` (via the shared `buildTaskForm()` factory), wires up the
   duplicate-title validator with the right `boardId`/`excludeTaskId`, passes the group down to `<app-task-form
   [form]="form">`, and handles the `(formSubmit)`/`(formCancel)` events by calling `BoardService` and navigating.
3. **`BoardListComponent`**'s "Create board" form — a **template-driven** form (`NgForm` + `[(ngModel)]`). Unlike
   the task form, this one has a real "before" state to point to: FEM12's version of this exact panel used
   `#boardNameInput`/`#boardDescriptionInput` template reference variables and a native `(submit)` handler, with no
   `FormsModule` import at all. FEM13 is the first point in this project where `ngModel` appears.

This "dumb form component fed by an `@Input() FormGroup`, smart route component owns the group" split is the same
parent/child contract FEM10 taught with `@Input()`/`@Output()` — the only difference is the value flowing through
`@Input()` is a live `FormGroup` object instead of a plain string or number.

### Which controls exist

```typescript
// task-form.factory.ts
fb.group({
  title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(60)]],
  description: ['', [Validators.maxLength(300)]],
  status: ['todo', [Validators.required]],
  dueDate: ['', [dueDateNotInPastValidator]],
  subtasks: fb.array<FormGroup>([]),   // each entry: { title, completed }
});
```

The `title` control additionally gets `duplicateTitleValidator(boardService, boardId, excludeTaskId)` added via
`control.addValidators(...)` right after the group is built — it needs `boardId` (and, in edit mode, the task's own
`id` to exclude), which aren't known until the route is resolved, so it can't live in the literal group definition
above.

### How form submission works

`TaskFormComponent.onSubmit()`:

```typescript
onSubmit(): void {
  if (this.form.invalid) {
    this.form.markAllAsTouched();   // reveal every error, not just touched fields
    return;
  }
  this.formSubmit.emit();
}
```

The parent (`AddTaskComponent`/`EditTaskComponent`) listens for `(formSubmit)`, reads `this.form.value`, converts
an empty due-date string to `null`, and calls `BoardService.addTask(...)` / `updateTask(...)`. It then calls
`this.form.markAsPristine()` (so the unsaved-changes guard doesn't fire on the navigation that's about to happen)
and `router.navigate(['/boards', boardId], { queryParams: { taskSaved: 'created' | 'updated' } })`.

### How form data is handled

`BoardService` is still the single source of truth (FEM11) — `AddTaskComponent`/`EditTaskComponent` never hold
their own copy of task data beyond what's in the form. `addTask()` computes the next id from the board's existing
tasks and pushes a new `Task`; `updateTask()` mutates the existing `Task` object's fields in place.

### How validation is configured

- **Built-in**: `Validators.required`, `Validators.minLength`, `Validators.maxLength` on `title`; `maxLength` on
  `description` and each subtask's `title`; `required` on `status`.
- **Custom**: `duplicateTitleValidator` (title) and `dueDateNotInPastValidator` (dueDate) — see §4.

### How validation errors are displayed

Every field follows the same template pattern:

```html
<input
  formControlName="title"
  [attr.aria-invalid]="title.invalid && (title.dirty || title.touched)"
  [attr.aria-describedby]="title.invalid && (title.dirty || title.touched) ? 'task-title-error' : null"
/>
<p id="task-title-error" role="alert" *ngIf="title.invalid && (title.dirty || title.touched)">
  <ng-container *ngIf="title.errors?.['required']">Title is required.</ng-container>
  ...
</p>
```

An error is shown only once a control is `dirty` or `touched` — i.e. only after the user has actually interacted
with that specific field, or after a failed submit attempt calls `markAllAsTouched()`. It's never shown on a
freshly-opened, untouched form.

---

## 4. Validation

| Rule | Field | Why | Invalid | Valid |
|---|---|---|---|---|
| `Validators.required` | `title` | A task with no name is meaningless in a Kanban board. | "Title is required." shown once the field is touched; submit stays disabled. | Error clears; if every other rule also passes, submit enables. |
| `Validators.minLength(3)` | `title` | Blocks near-empty titles like `"a"` that `required` alone wouldn't catch. | "Title must be at least 3 characters." | Error clears once 3+ characters are entered. |
| `Validators.maxLength(60)` | `title` | Keeps task cards readable in the Kanban column layout. | "Title cannot exceed 60 characters." | Clears once trimmed back under the limit. |
| `duplicateTitleValidator` (custom) | `title` | Two tasks with the same name on one board are confusing — this is the "prevent duplicate titles" rule the FEM13 spec explicitly calls out. | "A task with this title already exists on this board." — checked case-insensitively against `BoardService.isTitleTaken()`, with the task's own current title excluded in edit mode. | Clears as soon as the title is changed to something not already used on that board. |
| `Validators.maxLength(300)` | `description` | Keeps the task card readable; descriptions aren't required at all (an empty one is valid). | "Description cannot exceed 300 characters." | Clears once shortened. |
| `Validators.required` | `status` | A task must sit in exactly one Kanban column; there's no "no status" state in this board model. | "Status is required." (in practice unreachable through the UI, since the `<select>` always has a value — kept for defense-in-depth and because the FEM13 spec explicitly asks for a required-status rule.) | N/A in practice. |
| `dueDateNotInPastValidator` (custom) | `dueDate` | Due date is **optional** — an empty value is valid — but a date that's already passed isn't a useful "due" date. | "Due date cannot be in the past." | Clears once changed to today or later, or cleared back to empty. |
| `Validators.required` + `maxLength(80)` | each subtask's `title` | A subtask row that exists but has no name isn't useful; the length cap matches the same reasoning as the task title. | "Subtask title is required." / "...cannot exceed 80 characters." on that specific row only. | Clears per-row independently — other subtask rows are unaffected. |
| `required`, `minlength(3)`, `maxlength(40)` | board name (template-driven form) | Same reasoning as the task title, applied via `ngModel` + template attributes instead of a `FormGroup`. | Shown via `#boardName="ngModel"`'s `.errors`, same touched/dirty gating. | Submit (`[disabled]="boardForm.invalid"`) enables once satisfied. |

**Submission is blocked on invalid data twice, redundantly, on purpose:** the submit button carries
`[disabled]="form.invalid"` (so it usually can't even be clicked), and `onSubmit()`/`createBoard()` independently
check `form.invalid` and bail out with `markAllAsTouched()`.

**Why validation is handled in Angular, not just HTML5 `required`/native attributes:** native browser validation
messages are inconsistent across browsers, can't be styled to match the app, can't express "matches no other
task's title on this board" (there's no HTML attribute for a cross-record rule like that), and don't integrate
with Angular's `dirty`/`touched`/`invalid` state that drives the disabled submit button. `novalidate` is set on
both forms specifically to suppress the browser's own popup validation in favor of this in-app version. (Contrast
this with FEM12's plain `required` attribute on its board-name input — that native-only validation was
*appropriate* there precisely because FEM12 wasn't trying to give styled, app-consistent feedback; here it would
no longer be enough.)

---

## 5. Connection to Previous Modules

**FEM09 — Angular Fundamentals.** Every form field is built from the same fundamentals as any other template:
property binding (`[attr.aria-invalid]`), event binding (`(click)="addSubtask()"`), and `*ngIf`/`*ngFor` (via
`CommonModule`) driving which error message shows and how many subtask rows render.

**FEM10 — Component Interaction & Lifecycle.** `TaskFormComponent` is a textbook `@Input()`/`@Output()`
presentational component: `@Input() form: FormGroup` flows down from `AddTaskComponent`/`EditTaskComponent`,
`@Output() formSubmit`/`formCancel` flow user intent back up — the same contract FEM10 taught, just carrying a
`FormGroup` instead of a primitive. `ngOnInit`/`ngOnDestroy` still manage the `paramMap` subscription in both routed
form components, exactly as in FEM12's `BoardDetailComponent`.

**FEM11 — Services & Dependency Injection.** `BoardService` remains the single injected source of truth. It grew
two new methods (`addTask`, `isTitleTaken`) and an extended `updateTask`, but the *pattern* — components inject it,
nobody holds a private copy of board/task data — is unchanged from FEM11.

**FEM12 — Routing & Navigation.** `new-task` and `edit/:taskId` are proper child routes of `boards/:boardId`,
guarded by the exact same `unsavedChangesGuard`/`CanDeactivate` mechanism FEM12 introduced — only now it protects
two routes instead of one, and the "unsaved changes" check it calls (`hasUnsavedChanges()`) is powered by the
form's own `dirty` flag instead of FEM12's hand-written field comparison. The post-save
`router.navigate(..., {queryParams: {taskSaved: ...}})` reuses FEM12's query-parameter pattern. The **Kanban
column layout itself** is inherited verbatim from FEM12's later UI pass, not reinvented here.

**FEM13 — Angular Forms.** Everything in §3–4 above: `FormGroup`/`FormBuilder`/`FormArray` (reactive), `NgForm`/
`ngModel` (template-driven, on the board form — the first appearance of two-way binding in this project's
history), built-in validators, two custom validators, and the `dirty`/`touched`/`invalid` state driving both the
error messages and the disabled submit button.

---

## 6. Possible TA Questions

**Forms fundamentals**

- *What is an Angular form?* A construct that tracks a set of input controls' values and validity as a tree of
  objects (`FormControl`/`FormGroup`/`FormArray` in Reactive Forms, or an implicit `NgForm`/`NgModel` tree in
  Template-Driven Forms), instead of leaving each `<input>` to manage its own state independently.
- *Which form approach are you using, and why?* Both, deliberately, matching the module's own learning objectives:
  **Reactive Forms** for the task form, because it needs a dynamic `FormArray` of subtasks and a custom
  cross-record validator (duplicate title) that's much more natural to attach to a `FormControl` in TypeScript
  than to express purely in a template. **Template-Driven Forms** for the simpler "Create board" form (two
  fields, no dynamic list, no custom cross-record checks).
- *What is a form control?* The smallest unit Angular forms track: one input's current value plus its validation
  state (`valid`/`invalid`/`pristine`/`dirty`/`touched`/`untouched`). A `FormGroup` is a named collection of
  controls; a `FormArray` is an *indexed* collection, used here for the subtasks list because its length changes
  at runtime.
- *How does form submission work?* The `<form>`'s `(ngSubmit)` event calls a handler; that handler checks
  `form.invalid` and bails out (marking everything touched) if so, otherwise proceeds.
- *How does Angular know whether a form is valid?* Every control runs its own validators on every value change; a
  `FormGroup`/`FormArray`'s `.valid`/`.invalid` is the AND of all its children's validity, recursively up to the
  root form.

**Validation**

- *What validation rules did you implement?* See the table in §4.
- *How do you display validation errors?* Per-field, gated on `(control.dirty || control.touched)`.
- *What happens when a field is empty?* Depends on the field: `title`/`status` are `required`, so an empty value
  is invalid; `description`/`dueDate`/`subtasks` are optional, so an empty value is valid and simply gets saved as
  `''`/`null`/`[]`.
- *Why did you choose a synchronous custom validator instead of an async one for the duplicate-title check?*
  Because `BoardService`'s data lives entirely in memory, the check completes instantly — an async validator
  would add complexity for no benefit here.

**Integration & relationship to FEM12**

- *What exactly changed between FEM12's "create board" panel and FEM13's?* FEM12's used
  `#boardNameInput`/`#boardDescriptionInput` template reference variables and a native `(submit)` handler — no
  `FormsModule` at all. FEM13 rebuilt the same panel with `[(ngModel)]`, `#boardName="ngModel"`, an `#boardForm=
  "ngForm"` template reference, and real validators — the first `ngModel` in this project's history.
- *Why wasn't the task-editing feature in FEM12 just reused and "upgraded" the way the board form was?* FEM12's
  task editor needed a full rebuild anyway (dedicated routes, `FormArray` subtasks, a duplicate-title validator) —
  there wasn't a lightweight "upgrade path" the way there was for the two-field board form, so FEM13 replaces it
  outright with `AddTaskComponent`/`EditTaskComponent`.
- *How does the Kanban column layout relate to the forms in this lab?* It doesn't add any form concepts — it's the
  same display-only grouping (`tasksByStatus()`) FEM12 introduced, reused unchanged. Clicking a card in any column
  navigates to `edit/:taskId`, same as before the redesign.
- *How does routing from FEM12 interact with the form?* The route itself (`new-task` vs. `edit/:taskId`) tells the
  app which mode to build the form in. `:taskId` is how `EditTaskComponent` knows which task to load and patch
  into the form. Both routes carry the reused `CanDeactivate` guard.
- *What would happen if you removed `markAsPristine()` before navigating after a save?* The very next navigation
  away from the just-saved form would immediately hit `unsavedChangesGuard` and pop a "discard unsaved changes?"
  confirm dialog — confusing, since nothing is actually unsaved. This was caught and fixed during implementation.
- *Why did you structure the form this way (one presentational `TaskFormComponent`, two thin routed wrappers)
  instead of writing the whole form twice?* The add and edit forms are the same fields with the same validators;
  splitting the differences (where the `FormGroup` comes from, what happens on submit) into two small "smart"
  components while sharing the field markup in one "dumb" component avoids duplicating ~150 lines of template
  twice, and is a natural fit for the `@Input()`/`@Output()` pattern FEM10 already taught.

---

## 7. Things I Must Be Able to Explain (revision checklist)

- [ ] Every form in the app: the reactive task form (add + edit) and the template-driven create-board form — and
      why each uses the approach it uses.
- [ ] Every field on the task form (`title`, `description`, `status`, `dueDate`, `subtasks`) and what each one
      means for a task.
- [ ] Every validator: `required`, `minLength`, `maxLength` (built-in) and `duplicateTitleValidator`,
      `dueDateNotInPastValidator` (custom) — which field each is on, and what triggers/clears it.
- [ ] How form submission works end-to-end: `(ngSubmit)` → `onSubmit()` → valid/invalid branch →
      `formSubmit`/`formCancel` emit → parent's `save()`/`cancel()` → `BoardService` call → `markAsPristine()` →
      `router.navigate(...)`.
- [ ] How invalid states are handled: per-field error display gated on `dirty`/`touched`, the disabled submit
      button, and the `markAllAsTouched()` fallback on a submit attempt.
- [ ] How valid data reaches the application logic: `form.value` (typed as `TaskFormValue`) is read once, on
      submit, and passed straight into `BoardService.addTask()`/`updateTask()`.
- [ ] How the form interacts with components: the `@Input() form` / `@Output() formSubmit`/`formCancel` contract
      between `AddTaskComponent`/`EditTaskComponent` and `TaskFormComponent`.
- [ ] How the form interacts with services: constructor-injected `BoardService`, called only from the two submit
      handlers; the duplicate-title validator's factory-function relationship to `BoardService`.
- [ ] How routing relates to the form: `new-task` vs. `edit/:taskId` selects create vs. edit mode; `CanDeactivate`
      protects both routes.
- [ ] **Exactly what changed on the board-creation panel between FEM12 and FEM13**, and why that's the cleanest
      example of "what `ngModel` actually buys you" in this project.
- [ ] Why the implementation was structured this way: shared presentational form component to avoid duplicating
      the add/edit template and validators; `dirty` as the unsaved-changes signal instead of a manual field
      comparison; synchronous (not async) custom validators, matching the in-memory data source.

---

## 8. Verification Performed

- `ng build` succeeds with no errors; the `board-routes` lazy chunk is still separate from the initial bundle
  (FEM12's lazy loading is untouched).
- An automated headless-browser run (Playwright, driving the live `ng serve` dev server) covered, with **zero
  console/page errors** throughout:
  - `authGuard` redirect to `/login` and back for a guarded board route (unchanged from FEM12).
  - Light mode confirmed, matching FEM12 exactly (`rgb(246, 247, 251)` body background, shared `styles.css`).
  - Kanban board renders exactly 3 columns; task cards show due date and subtask progress ("1/3 subtasks" etc.).
  - Opening `new-task`: touching-then-blurring the empty `title` field shows "Title is required."; the submit
    button carries the `disabled` attribute the entire time the form is invalid.
  - Duplicate-title validator: typing an existing task's exact title shows "A task with this title already exists
    on this board."
  - Due-date validator: entering a past date shows "Due date cannot be in the past."; correcting it to a future
    date clears the error.
  - Subtasks `FormArray`: adding two subtask rows, then removing one, correctly leaves one row.
  - Submitting a fully valid form: submit button becomes enabled, navigates to `/boards/1?taskSaved=created`, and
    the board detail page shows a "Task created." banner plus the new task in the correct Kanban column.
  - Edit flow: clicking the newly created task's card navigates to `/boards/1/edit/:id` with every field correctly
    pre-filled; editing the title and saving shows a "Task updated." banner and the updated title in its column.
  - `CanDeactivate`/unsaved-changes guard: dirtying a field on the edit form and clicking "← All boards" pops the
    native confirm dialog; dismissing it keeps the user on the edit route; accepting it lets the navigation
    through.
  - Responsive layout at a 375px mobile viewport: no horizontal page overflow; the Kanban columns stack to one
    column; the task form's status/due-date row collapses to a single column.
  - The template-driven create-board form: required/minlength errors appear and clear correctly, the submit
    button is disabled while invalid and enables once valid, and a valid submission navigates to the new board.

---

## 9. Final Curriculum Audit

**✅ Allowed (FEM09–FEM13), and used throughout:** everything FEM12's own audit already covered (standalone
components, property/event/two-way binding, `*ngIf`/`*ngFor`, `@Injectable({ providedIn: 'root' })` services,
`ngOnInit`/`ngOnDestroy`, `provideRouter()`, `<router-outlet>`, `routerLink`/`routerLinkActive`, the `Router`
service, reactive `ActivatedRoute.paramMap`/`queryParamMap` via `.subscribe()`, lazy-loaded child routes,
`CanActivate`/`CanDeactivate` guards) — **plus**, newly this module: `ReactiveFormsModule`, `FormBuilder`,
`FormGroup`, `FormControl` (via `formControlName`), `FormArray` (via `formArrayName`)/`formGroupName`, built-in
validators (`Validators.required`/`minLength`/`maxLength`), custom synchronous validators (`ValidatorFn`), and
`FormsModule`/`NgForm`/`ngModel`/template reference variables (`#x="ngModel"`, `#f="ngForm"`) for the
template-driven board form. `@Input()`/`@Output()` (FEM10) is used for the `TaskFormComponent` ↔
`AddTaskComponent`/`EditTaskComponent` contract.

**❌ Not introduced:** Angular Signals (`signal()`/`computed()`/`effect()`/`input()`/`output()`), the new
`@if`/`@for`/`@switch` control-flow syntax, `AsyncValidatorFn`/async validators, `ViewChild`/`ContentChild`,
`HttpClient`, RxJS `Subject`/`BehaviorSubject`, custom Observables/operators beyond the already-in-scope
`ActivatedRoute` `.subscribe()` pattern, or any external state-management/forms library. Confirmed by grepping the
entire `src/app` tree for all of the above — zero matches.

**One inherited, already-flagged exception:** `CanDeactivate` (reused, not newly introduced, from FEM12) — see
FEM12's own TA review §11 for why it's in scope despite technically belonging to a later routing topic; FEM13 only
*extends its use* to two more routes and swaps its data source from a hand-written field comparison to the form's
own `dirty` flag, which is squarely a FEM13 (forms state) concept.

---

## Deliverables Status

| Deliverable | Status |
|---|---|
| Add Task / Edit Task forms, routed and integrated with the existing board | ✅ Done, verified live |
| Built-in + custom validation with clear, dynamic error messages | ✅ Done, verified live |
| Form submission updates `BoardService`'s task list correctly | ✅ Done, verified live |
| Editing loads existing task data and updates it without affecting other tasks | ✅ Done, verified live |
| Navigation integration (create vs. edit routes, redirect after submit/cancel) | ✅ Done, verified live |
| Confirmation before discarding unsaved changes (`CanDeactivate`) | ✅ Done, verified live |
| Accessible, responsive form layout | ✅ Done, verified live |
| Bonus: subtasks via `FormArray` | ✅ Done, verified live |
| Template-driven form (`ngModel`) demonstrated, distinct from FEM12's manual binding | ✅ Done, verified live |
| Light-mode theme, visually consistent with FEM12 | ✅ Done — shared `styles.css`, shared Kanban-column layout |
| This TA review document | ✅ `notes/FEM13-TA-Review.md` |
| Public GitHub repo with clean commit history | ⚠️ Not done by this session — requires pushing to a remote, which needs explicit authorization; the app is ready to commit whenever you'd like |
| Deployed live app URL (Netlify/Vercel) | ⚠️ Not done by this session — requires an external hosting account/deployment step outside an automated coding session's scope; `ng build` output verified clean and deploy-ready |
