# FEM19 — Performance & Best Practices: To-Do App Refactor

Project location: `FEM19-Performance-and-Best Practices/todo-performance-app/`
Task: `task/To-Do App (Refactoring for Performance).md`. Unlike FEM12-FEM18, this lab is **not** the Kanban app: it
starts from a separate "legacy" To-Do component that is full of deliberate anti-patterns.

**Result in one paragraph:** one 170-line component became a service, a pipe and five small `OnPush` components.
Typing 30 characters used to make Angular re-run 4,396 component templates and call an expensive method 252 times;
it now runs 24 templates and calls nothing. 60 Jest tests pass. The bundle is not smaller (227 kB vs 223 kB); the
improvement is at runtime.

---

## 1. Starting point and setup (Task 1)

The provided code (`abdulrashid232/performance-and-best-practices-angular`, one file `app.ts`) is kept untouched in
`docs/legacy-todo-app.ts`. I created a fresh Angular CLI project (Angular 21, Tailwind 4 as in the original, zone.js
kept on because this lab is about *when* the zone triggers checks), and first ran the legacy component inside it
to take a baseline. I did not install the cloned repo's own `package.json`; I only used its source.

### What is wrong with the legacy code

| # | Anti-pattern in `legacy-todo-app.ts` | Why it hurts |
|---|---|---|
| 1 | Default change detection on one big component | Every event anywhere re-checks the whole template |
| 2 | `getStats()` used in many template bindings, directly and through `getProgressPercentage()` (measured: **9 calls per check**) | Methods in templates run on *every* check; each call also runs a `for (10000)` loop and filters the list |
| 3 | Two `*ngFor` loops over the **whole** list, each with `*ngIf` to hide the other half | Every todo is visited twice per check |
| 4 | No working `trackBy` (the `trackByFn` returns the object and is never used) | List changes can rebuild DOM |
| 5 | `todos: any`, `push()` onto the array, `[...this.todos]` copies only in one method | No types, mutation hides changes from `OnPush` |
| 6 | `subscribe()` + manual `unsubscribe()` in `ngOnDestroy` | Boilerplate and easy to leak |
| 7 | The simulated API runs again for every subscriber | Duplicate network calls |
| 8 | `bypassSecurityTrustHtml(serverText)` + `[innerHTML]="todo.description"` | **XSS**: turns Angular's protection off for untrusted text |
| 9 | The "script detected" check glues an HTML `<span>` onto user text | Building HTML from strings is itself fragile |
| 10 | Everything in one class | Hard to test, reuse or reason about |

### Baseline measurement

**Method.** `perf/measure.mjs` (headless Chrome, Chrome DevTools Protocol) loads the app, adds 50 tasks, then runs
four scripted interactions. For each it asks Chrome's *precise code coverage* how many times each function ran.
Angular compiles every template into a function named `<Component>_Template` and calls it once each time a
component or embedded view is change-detected, so **"template runs" = how much UI Angular re-checked**. It also
counts `getStats()` calls and Chrome's `ScriptDuration`.

**Result (legacy):** see the table in the project README. Key facts:

- **Mouse moved 200 times: 0 change-detection work.** The task asks to document CD frequency "when the mouse is
  moved". Honest finding: Angular only runs change detection after *events it has listeners for* (through zone.js).
  This page has listeners for `input`, `keyup`, `click` and `change`, but none for `mousemove`, so hovering is free
  in both versions. Typing, clicking and ticking boxes are the interactions that trigger checks, so those are what I
  measured.
- **Typing 30 characters: 4,396 template runs, 252 `getStats()` calls.** Each keystroke fires `input` + `keyup`;
  each triggers a full check of the app, which re-runs both 52-item loops and all `getStats()` bindings.

---

## 2. Change detection: `OnPush` and tracking (Task 2)

### How change detection works (short version)

After an event, a timer or an HTTP reply, zone.js tells Angular "something may have changed" and Angular walks the
component tree comparing each template binding to its previous value. Default strategy: walk **every** component
every time. `OnPush`: only check a component if one of these happened:

1. one of its inputs got a **new reference** (or a signal input changed),
2. an event handler in its own template (or a child's) ran,
3. a signal it reads in its template changed,
4. an `async` pipe received a value,
5. someone called `markForCheck()`.

Otherwise the component and its whole subtree are **skipped**. Every component in the refactor is
`ChangeDetectionStrategy.OnPush` (and a test per component asserts it, so nobody removes it by accident).

### Why OnPush is safe here (the stale-UI trap)

`OnPush` breaks code that mutates data in place, because the reference doesn't change (trigger 1 never fires). The
legacy `this.todos.push(newTodo)` is exactly that bug. The refactor never mutates:

```ts
this.todosState.update((todos) => [...todos, newTodo]);                      // add
todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))     // toggle: new object only for the changed item
todos.filter((t) => t.id !== id)                                            // delete
```

Tests prove it: `todo.service.spec.ts` asserts a new array each time **and** that the untouched todo keeps its
old object reference (`expect(newSecond).toBe(second)`). That second part is what lets an `OnPush`
`TodoItemComponent` be skipped when a *different* item changes.

### `track` (the `trackBy` of Angular's new control flow)

```html
@for (todo of todos(); track todo.id) { <app-todo-item [todo]="todo" ... /> }
```

Without a stable key Angular assumes identity = object reference; when a list is replaced by a new array of
new-looking objects, it can destroy and rebuild every row. `track todo.id` says "same id = same row", so the DOM
node and component instance are reused and only changed bindings are updated.
`todo-section.component.spec.ts` proves it: after the list is replaced with a *new array containing a new object*,
`rows[0]` is still the **same DOM element** (`toBe`). `@for` requires a `track` expression (it is the modern
replacement for `*ngFor ... trackBy`; both do the same job, and the old `*ngFor` form would be
`*ngFor="let t of todos(); trackBy: trackById"` with `trackById = (_, t) => t.id`).

### Why measured work dropped

After the change a keystroke only dirties `AddTodoFormComponent` (its `ngModel` listener) and the root that holds
it: **24 template runs for 30 characters** (two components x 12 checks because `eventCoalescing` merges
`input`+`keyup` events into fewer passes), versus 4,396. Ticking a box re-renders the two affected rows and the
stats, while the 50 other rows are not re-rendered (`TodoItemComponent_Template` ran 2 times).
What remains: `TodoSectionComponent_For_4_Template` ran 53 times when a tick happened: that is the cheap per-row
wrapper that passes inputs to each child; the expensive child templates were skipped.

### 2a. Angular DevTools profiler: before and after

Screenshots taken in Chrome with Angular DevTools (Profiler tab), same typing in both runs (39 characters), one cycle
selected in each so the per-component breakdown is visible.

| | Before (`perf/profiler-before.png`) | After (`perf/profiler-after.png`) |
|---|---|---|
| Cycles recorded | 84 | 42 |
| Selected cycle | 0.9 ms | 0.6 ms |
| Checked in that cycle | `_App` 0.7 ms, `_NgModel` 0.1 ms, `_NgForOf` 0.1 ms | `_App` 0.4 ms, `_NgModel` 0.1 ms |

![Before](../todo-performance-app/perf/profiler-before.png)
![After](../todo-performance-app/perf/profiler-after.png)

How to read it: **`OnPush` doesn't make Angular run fewer cycles for the same events, it makes each cycle check fewer
components.** The evidence is the selected cycle: `_NgForOf` (the todo lists) is checked on every keystroke before and
absent after. The cycle count dropping from 84 to 42 is what the profiler recorded for the same typing; I did not verify
the cause (legacy code gets an `input` and a `keyup` cycle per character; a likely but unconfirmed explanation).
Caveat: these runs used only the 2 seed todos, so the time difference per cycle (0.9 vs 0.6 ms) is small. With 52 todos
the script measurement shows the large gap (section 1). The sanitiser warning visible in the "after" DevTools issues
badge is Angular's expected message that it stripped the `<script>` from the welcome message.

---

## 3. State with signals and `computed()` (Task 2)

`TodoService` holds the only copy of the data:

```ts
private readonly todosState = signal<Todo[]>([...]);
readonly todos = this.todosState.asReadonly();      // read-only to everyone else
readonly activeTodos    = computed(() => this.todos().filter(t => !t.completed));
readonly completedTodos = computed(() => this.todos().filter(t => t.completed));
readonly total          = computed(() => this.todos().length);
readonly completedCount = computed(() => this.completedTodos().length);
readonly pendingCount   = computed(() => this.activeTodos().length);
readonly progress       = computed(() => total === 0 ? 0 : Math.round(completedCount / total * 100));
```

- **`signal()`** is a value Angular can watch. Reading it (`todos()`) inside a template or `computed` subscribes
  that consumer; writing it (`set`/`update`) notifies exactly those consumers.
- **`computed()`** derives a value, **caches** it, and recalculates lazily only when a signal it read changed.
  This replaces the legacy `getStats()`/`getProgressPercentage()`: the maths (and filtering) now happens **once per
  list change**, not 9+ times per check. `expect(service.activeTodos()).toBe(service.activeTodos())` in the tests
  shows the cache returns the very same array, which also keeps `OnPush` inputs stable.
- **`newTaskDescription`** became a `signal('')` inside `AddTodoFormComponent` and is bound with
  `[(ngModel)]="description"` (two-way binding to a signal works from Angular 17.2). After the Task 4 split it is
  local UI state of the form rather than state of the main component. The old `nextId` counter field is gone: the next
  id is computed as `max(id) + 1` when adding, so there is no extra mutable state to keep in sync.
- Typed with a real `Todo` interface instead of `any`.

### Template optimisation

- Two filtered `*ngIf` loops over everything -> two `computed` lists, each rendered once.
- `[style.width]="getProgressPercentage()"` (a string from a method) -> `[style.width.%]="progress()"`
  (a number from an input, only re-evaluated when it changes).
- Hover/completed styles toggle with `[class.x]` bindings in one template instead of two near-duplicate blocks.

---

## 4. RxJS clean-up (Task 3)

### Subscription fix: the `async` pipe

Legacy: `subscribe(...)` in `ngOnInit`, assign a field, `unsubscribe()` in `ngOnDestroy` (and forgetting either is a
bug). Now `WelcomeHeaderComponent` exposes the observable and the template does the work:

```html
[innerHTML]="(message$ | async) ?? 'Todo App' | sanitizeHtml"
```

`async` subscribes when the view is created, **unsubscribes when it is destroyed**, and tells an `OnPush`
component to re-check when a value arrives (trigger 4). The component has no `ngOnInit`/`ngOnDestroy` at all.
`welcome-header.component.spec.ts` shows "Todo App" first, then (after the fake timer) the message.

### API caching: `shareReplay`

```ts
readonly message$ = defer(() => { console.log('API Call ...'); return of(HTML).pipe(delay(300)); })
  .pipe(shareReplay({ bufferSize: 1, refCount: false }));
```

An Observable is a *recipe*: every `subscribe()` normally re-runs it (a second network call). `shareReplay` runs it
once, shares that run with all subscribers and **replays** the last value to late ones. `defer` keeps it lazy (the
"call" starts only on the first subscription). `refCount: false` keeps the cached value even when all subscribers
leave. `welcome.service.spec.ts` proves: three subscribers -> one call; a late subscriber gets the value
immediately; after everyone unsubscribes a new subscriber still doesn't call again; nothing happens until someone
subscribes. (I added `delay(300)` to make the simulated request take time like a real one.)

---

## 5. Security: sanitising HTML (Task 3)

**XSS (cross-site scripting)**: an attacker gets their JavaScript to run in your page by getting it into the DOM —
here via a task title such as `<img src=x onerror="stealCookies()">` or text returned by an API.

**The vulnerabilities in the legacy app**

1. `[innerHTML]="welcomeMessage"` where the message was passed through `bypassSecurityTrustHtml(...)`. That method
   tells Angular "trust this completely" and skips all sanitising. The server text even contained a `<script>`.
2. `[innerHTML]="todo.description"` for user-typed text, plus HTML glued into the description string.

(Angular sanitises plain strings bound to `[innerHTML]` by default; point 1 is what defeated that, and any
`bypassSecurityTrust*` call on untrusted text is the classic way people reintroduce XSS.)

**The fix** (`core/pipes/sanitize-html.pipe.ts`):

```ts
this.sanitizer.sanitize(SecurityContext.HTML, value ?? '') ?? ''
```

`DomSanitizer.sanitize` parses the HTML and removes anything dangerous (scripts, `on*=` handlers, `iframe`s,
`style` attributes with URLs) while keeping harmless markup (`<b>`); `javascript:` links get an `unsafe:` prefix so
the browser won't run them. It is applied to **both** the welcome message and every task description, `bypassSecurityTrust*`
is never used, and the pipe is **pure**, so it only re-runs when the text changes.

Evidence: `sanitize-html.pipe.spec.ts` (script, `onerror`, `onload`, `iframe`, style payloads, javascript link,
null/empty, harmless markup kept), `todo-item.component.spec.ts`, and an App-level test that adds
`<img onerror="window.__pwned = true"><script>…` and asserts nothing executed. In a real browser
(`perf/check-ui.mjs`) the same payloads produced zero alert dialogs.

Details worth knowing:

- A task made only of a script sanitises to an empty string; the UI shows "(content removed for safety)"
  instead of an invisible row.
- `<img src=x>` is allowed by the sanitiser (images are harmless without `onerror`) so it shows as a broken image.
- The **safest** way to show user text is plain interpolation `{{ description }}`, which escapes everything and needs
  no sanitiser. `[innerHTML]` + sanitiser is used here because the lab asks for DomSanitizer and to allow simple
  formatting; if rich text isn't a requirement, prefer interpolation.
- The server-style message's colour used an inline `style`, which the sanitiser strips; it now uses Tailwind
  classes (`class` is allowed).

---

## 6. Modularity (Task 4)

```
App (OnPush)                      shell: reads service signals, passes plain values down
 ├─ WelcomeHeaderComponent        async pipe + sanitize pipe, WelcomeService
 ├─ AddTodoFormComponent          local signal for the text; output add(text)
 ├─ TodoStatsComponent            signal inputs: total/completed/pending/progress
 └─ TodoSectionComponent x2       inputs: heading, todos, emptyMessage; outputs toggle/remove
      └─ TodoItemComponent        input: todo; outputs toggle(id)/remove(id)
core: TodoService, WelcomeService, SanitizeHtmlPipe, Todo model
```

- **"Dumb" (presentational) components** only receive inputs and emit outputs; they know nothing about services
  (except the header's service for its one stream and the pipe). They are reusable (one `TodoSection` shows both
  lists) and trivially testable with `setInput`.
- **Smart/shell:** `App` is the only one that talks to `TodoService`.
- **Signal inputs** (`input()`, `output()`): the modern API; changing a signal input marks an `OnPush` component dirty
  automatically.
- Events carry **ids**, not whole objects, so the shell never trusts a possibly stale object from the child.
- Services are `providedIn: 'root'` singletons (one list for the whole app).

---

## 7. Tests (verification of the refactor)

Jest (`npm test`), 9 files, 60 tests, 100% statements/lines/functions, 91.7% branches. Highlights: service
immutability/ids/stats; `computed` caching; pipe XSS table; one-call API caching with fake timers; each component's
rendering, outputs and an `OnPush` assertion; `@for` row reuse; end-to-end page tests (add, toggle, delete,
malicious input, empty-state messages) that confirm the `OnPush` tree still updates after every interaction — i.e. the
refactor didn't introduce stale-UI bugs.

---

## 8. Common mistakes (from this lab)

| Mistake | Consequence | Avoided by |
|---|---|---|
| `array.push()` into data passed to `OnPush` components | UI doesn't update | immutable `update()`; tests on references |
| Calling methods/getters in templates | runs every check, new arrays defeat `OnPush` | `computed()` signals |
| `bypassSecurityTrustHtml` on untrusted text | XSS | `sanitize` pipe; no bypass anywhere |
| Plain property assigned in `subscribe` under `OnPush` | view stays stale | `async` pipe |
| Manual `subscribe` without `unsubscribe` | leak | `async` pipe |
| `shareReplay()` with default `refCount` semantics unconsidered | cache dropped or kept unexpectedly | explicit `{ bufferSize: 1, refCount: false }` |
| `track $index` or tracking by object | rows rebuilt / wrong reuse | `track todo.id` |
| Optimising without measuring | guessing | `perf/measure.mjs` before and after |

## 9. What was NOT done (be upfront in review)

- **No Lighthouse scores.** Runtime work was measured with a script (template-run counts and script time) and with the
  Angular DevTools profiler screenshots in section 2a.
- **No deployment** (not requested by this lab's tasks) and no ESLint setup.
- Lazy loading and a full accessibility audit (module project items) don't apply to this single-page lab; I only
  added `aria-label` on the input and a `progressbar` role with `aria-valuenow`.
- The bundle got 4 kB bigger, not smaller.
- Stale-UI bugs: because everything was built on immutable updates, signals and `async`, I did not hit one while
  migrating to `OnPush`; the in-place `push` in the legacy code is the one that *would* have broken, which is why
  the immutability tests exist.

## 10. TA review questions

**1. What triggers change detection, and why didn't mouse movement matter?**
zone.js reports completed events/timers/XHR to Angular, which then checks components. Only events with Angular-
registered listeners count; the page has none for `mousemove`, so hovering did 0 work in both versions (measured).

**2. What does `OnPush` do and what are its triggers?**
Skips a component (and subtree) unless an input reference/signal input changed, an event fired inside it, a signal it
reads changed, an `async` pipe emitted, or `markForCheck()` was called.

**3. Why must data be immutable with `OnPush`?**
`OnPush` compares references. `push()` keeps the same array reference, so no trigger fires and the view is stale.
Creating a new array/object signals the change; unchanged items keep their reference so their rows are skipped.

**4. Why is calling `getStats()` in the template bad, and what replaced it?**
It runs on every check (9 times per check here, each with a pointless loop), and returning new objects/arrays defeats
`OnPush`. `computed()` caches and recalculates only when its source signals change.

**5. What does `track` do?**
Gives list items a stable identity (`todo.id`) so Angular reuses DOM/components for unchanged items instead of
rebuilding. Proven by a test that the same DOM node survives a list replacement.

**6. Signals vs RxJS here?**
Signals for synchronous state and derived values (the list, stats); RxJS for asynchronous streams (the API call). The
bridge is the `async` pipe in templates.

**7. Why the `async` pipe instead of subscribe?**
Auto-unsubscribes, marks `OnPush` components dirty, less code, no leak risk.

**8. What does `shareReplay` solve, and why `refCount: false`?**
Without it each subscriber re-runs the observable (another API call). `shareReplay` runs once and replays the value.
`refCount: false` keeps the cached value after all subscribers leave.

**9. Explain the XSS and your fix.**
User/server text reached `[innerHTML]` and the header used `bypassSecurityTrustHtml`, so injected HTML/JS could
run. Now text goes through `DomSanitizer.sanitize(SecurityContext.HTML, …)` in a pure pipe, never bypassed; the
safest alternative is interpolation. Tests and a browser run prove payloads stay inert.

**10. Why is `bypassSecurityTrustHtml` dangerous?**
It disables Angular's protection for that value; if the value is untrusted it is a direct XSS hole. Only for
content you fully control.

**11. Why split into components? Smart vs dumb?**
Smaller units are reusable, individually `OnPush`-skippable and easy to test. Dumb components take inputs and emit
outputs; one smart shell owns the service.

**12. How do you prove performance improved?**
Measure before/after on the same scenario: `perf/measure.mjs` template-run counts (4,396 -> 24 for typing),
`getStats()` calls (252 -> 0), script time (37.3 -> 5.1 ms). Not Lighthouse; and the bundle didn't shrink.

**13. What would you check next?**
Lighthouse on a production build, Angular DevTools profiler screenshots, ESLint, a bundle budget, virtual scrolling
if lists reach thousands of rows.
