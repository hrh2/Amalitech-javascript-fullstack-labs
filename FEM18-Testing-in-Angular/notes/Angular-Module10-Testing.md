# Module 10: Testing in Angular
### FEM18 — continues from FEM09 (Angular Fundamentals) through FEM17 (HTTP & APIs)

> **Scope note:** This document covers *only* Module 10 — the testing pyramid (unit/integration/E2E), configuring and writing unit tests with Jest for services and components, mocking dependencies, testing Observable-returning code, integration testing components, Test-Driven Development's Red-Green-Refactor cycle, and end-to-end testing with Cypress. Anything beyond that — visual regression testing, contract testing, performance/load testing, CI/CD pipeline configuration, mutation testing, accessibility test automation — is flagged **🔒 Coming Later — Outside This Module**.
>
> **This module exists to pay off nearly every deferral in this entire course.** Every prior module included a line similar to *"testing this is outside this module's scope."* Module 1 deferred `.spec.ts` files. Module 3 deferred testing services with mocks. Module 4 deferred testing guards/routed components. Module 5 deferred testing forms. Module 6 deferred marble testing. Module 8 deferred testing reducers/effects/selectors in isolation. Module 9 deferred mocking `HttpClient`. This module is where all of that finally gets addressed — using real code from those earlier modules as the actual subjects under test throughout.
>
> **A tooling note:** Angular's CLI historically defaulted to Jasmine (the assertion/test-structure library) running via Karma (the browser-based test runner). This module — and this course generally — uses **Jest** instead, reflecting Angular's modern, official support for Jest as a faster, more widely-adopted alternative that runs in Node rather than a real browser. If you encounter a codebase or tutorial using `jasmine`/`karma.conf.js`, know that the underlying *concepts* in this module (`describe`, `it`, mocks, `TestBed`) transfer almost directly — only some setup details and a few matcher-naming conventions differ.

---

## How this document is organized

Same documentation-first shape as Modules 1–9:

**What is it? → Why does Angular need it? → How does it work? → Syntax breakdown → Examples → When to use / not use → What happens behind the scenes? → How it connects to other concepts → Try It Yourself → Exercises → Common Mistakes**

Everything ties back to this module's running example: writing a comprehensive test suite for the Kanban app's services, components, and pipes — "Kanban Task Management Web App (Part V — Testing & Quality Assurance with Jest)."

---

## Table of Contents

1. [From Module 9 to Module 10: What's New](#1-from-module-9-to-module-10-whats-new)
2. [Testing Principles: The Testing Pyramid](#2-testing-principles-the-testing-pyramid)
3. [Unit Testing Services With Jest](#3-unit-testing-services-with-jest)
4. [Mocking Dependencies](#4-mocking-dependencies)
5. [Testing Asynchronous Code & Observables](#5-testing-asynchronous-code--observables)
6. [Unit & Integration Testing Components](#6-unit--integration-testing-components)
7. [Test-Driven Development: Red-Green-Refactor](#7-test-driven-development-red-green-refactor)
8. [End-to-End Testing With Cypress](#8-end-to-end-testing-with-cypress)
9. [Putting It Together: Kanban App Testing Architecture](#9-putting-it-together-kanban-app-testing-architecture)
10. [Final Module Project: Kanban Task Management Web App (Part V — Testing & Quality Assurance with Jest)](#10-final-module-project-kanban-task-management-web-app-part-v--testing--quality-assurance-with-jest)
11. [Quick Reference Sheet](#11-quick-reference-sheet)
12. [Source & Resource Mapping](#12-source--resource-mapping)

---

## 1. From Module 9 to Module 10: What's New

Nine modules have built an entire, real application — components (Module 1), services (Module 3), routing (Module 4), forms (Module 5), RxJS (Module 6), Signals (Module 7), NgRx (Module 8), and HTTP integration (Module 9) — and every single one of them explicitly deferred one question: **how do you know any of it actually works, without manually clicking through the app after every change?** This module answers that question directly, and because it comes last, nearly every example in it is a **real** piece of code from an earlier module, not a new toy example — you'll test an actual `CartService` (Module 3), an actual reducer (Module 8), an actual component using `HttpClient` (Module 9), and more.

### ✅ Knowledge Check
1. Name three specific things from earlier modules that were explicitly deferred to this one.

---

## 2. Testing Principles: The Testing Pyramid

### What is the testing pyramid?

The **testing pyramid** is a model for how a healthy test suite's tests should be distributed across three levels, shaped like a pyramid specifically because of how many tests you typically want at each level:

```
        ▲
       ╱ ╲        E2E (End-to-End) — few, slow, high confidence,
      ╱   ╲        test real user flows through the whole running app
     ╱─────╲
    ╱       ╲     Integration — some, medium speed,
   ╱         ╲     test how several pieces work together
  ╱───────────╲
 ╱             ╲  Unit — many, fast, test one small piece in isolation
╱───────────────╲
```

### The three levels, defined precisely

- **Unit tests** — test **one** piece of code (a single service method, a single component's logic, a single pure function/pipe) in complete isolation from everything it depends on, using **mocks** (Section 4) to stand in for any real dependencies.
- **Integration tests** — test how **several** pieces work together — most commonly in Angular, a component together with its actual template, verifying that clicking a button really does call the right method and really does update what's displayed, still with external dependencies (like `HttpClient`) usually mocked.
- **End-to-end (E2E) tests** — test a **complete user flow** through the real, running application in a real browser, with no mocking at all (or minimal mocking, e.g., of a backend API) — the closest thing to "a real person clicking through the app," and consequently the slowest and most expensive to run and maintain.

### Why the pyramid shape, specifically — why not equal numbers of each?

Each level trades **speed and cost** for **realism and confidence**. A unit test runs in milliseconds and pinpoints exactly what broke, but tells you nothing about whether the pieces actually work *together*. An E2E test gives you the strongest confidence the app genuinely works for a real user, but is slow, can be flaky (failing for reasons unrelated to an actual bug, like timing), and is expensive to write and maintain. The pyramid shape reflects a practical strategy: **rely mostly on many fast, precise unit tests**, use **some** integration tests to verify key component/service interactions, and reserve **E2E tests for your most critical user flows only** (e.g., the Kanban app's "create a board and add a task" flow) rather than trying to E2E-test every possible interaction.

### Mapping this course's own modules onto the pyramid

| Level | Example from this course |
|---|---|
| Unit | `CartService.addToCart()` (Module 3) computing the right quantities, in isolation |
| Unit | `boardReducer` (Module 8) producing the correct next state for a given action, with no store/component involved at all |
| Integration | `DessertCard` (Module 1) — clicking "Add to Cart" in its real template actually calls `onAdd()` and emits the right event |
| Integration | `TaskDetailComponent` (Module 9) — verifying it calls `TaskService.deleteTask()` with the right arguments when its delete button is clicked, with `TaskService` itself mocked |
| E2E | A full Cypress flow: open the Kanban app, create a board, add a task, mark it done, confirm it now shows as completed — through the real, running app |

### 🎥 Optional Video
This section draws on the official **Testing guide (Angular.io)**, linked in Section 12, alongside a general testing-strategy overview video from this module's own resources — both worth a first pass before Section 3's hands-on Jest syntax begins.

### ✅ Knowledge Check
1. Why does the testing pyramid recommend **many** unit tests but only a **few** E2E tests, rather than an equal number of each?
2. Classify each of the following as unit, integration, or E2E: (a) testing that `boardReducer` returns the correct state for a given action; (b) testing that clicking "Confirm Order" in the Dessert Shop's real template calls the right method; (c) testing that a user can actually complete a full checkout in the real, running app.

---

## 3. Unit Testing Services With Jest

### What is a Jest test, structurally?

A Jest test file (conventionally named `*.spec.ts`) is organized using two functions: `describe(...)` groups related tests together (typically, all tests for one class/feature), and `it(...)` (or its alias `test(...)`) defines one individual test case, containing **assertions** made with `expect(...)`.

### A first, minimal example: testing `CartService` (Module 3)

```typescript
import { CartService } from './cart.service';
import { Dessert } from '../models/dessert.model';

describe('CartService', () => {
  let service: CartService;
  const waffle: Dessert = {
    id: 1,
    name: 'Waffle with Berries',
    category: 'Waffle',
    price: 6.5,
    image: { thumbnail: '', mobile: '', tablet: '', desktop: '' }
  };

  beforeEach(() => {
    service = new CartService();
  });

  it('should start with an empty cart', () => {
    expect(service.getCartLines([waffle])).toEqual([]);
  });

  it('should add a dessert with quantity 1 when added for the first time', () => {
    service.addToCart(waffle);
    expect(service.getCartLines([waffle])).toEqual([{ dessert: waffle, quantity: 1 }]);
  });

  it('should increment quantity when the same dessert is added again', () => {
    service.addToCart(waffle);
    service.incrementQuantity(waffle);
    expect(service.getCartLines([waffle])[0].quantity).toBe(2);
  });
});
```
- **`describe('CartService', () => {...})`** — groups every test related to `CartService` under one readable label, shown in test output.
- **`beforeEach(() => {...})`** — runs **before every single `it(...)` in this `describe` block** — here, creating a **fresh** `CartService` instance for each test, so no test's changes leak into another test (a critical practice: tests must be independent of each other and able to run in any order).
- **`it('should ...', () => {...})`** — one test case; the string argument should read as a plain-English description of the expected behavior — a well-written test suite's `it` descriptions, read together, effectively document the service's behavior.
- **`expect(actual).toEqual(expected)`** — a Jest **matcher**; `toEqual` performs a deep equality check (correct for comparing objects/arrays by their contents, as here) — contrasted with `toBe`, which checks strict reference/primitive equality (correct for comparing numbers, strings, booleans, or intentionally checking that two variables point to the *exact same* object reference).

### Common Jest matchers, with concrete Kanban/Dessert Shop examples

```typescript
expect(service.getOrderTotal([waffle])).toBe(0);           // toBe: primitive equality
expect(cartLines).toEqual([{ dessert: waffle, quantity: 1 }]); // toEqual: deep object/array equality
expect(cartLines.length).toBeGreaterThan(0);                // numeric comparison
expect(board.name).toContain('Kanban');                      // substring/array-membership check
expect(() => service.removeFromCart(unknownDessert)).not.toThrow(); // doesn't throw
expect(errorMessage).toBeNull();                              // exact null check
expect(isLoading).toBe(false);                                // boolean check
```

### Testing a pure function directly — no service/class needed at all

```typescript
// dessert.utils.ts
export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}
```
```typescript
// dessert.utils.spec.ts
import { formatPrice } from './dessert.utils';

describe('formatPrice', () => {
  it('should format a whole number with two decimal places', () => {
    expect(formatPrice(5)).toBe('$5.00');
  });

  it('should round to two decimal places', () => {
    expect(formatPrice(5.999)).toBe('$6.00');
  });
});
```
This is the simplest possible unit test — a plain function, no Angular-specific setup (`TestBed`, Section 6) needed at all, since there's no dependency injection or template involved.

### Testing a reducer (Module 8) — another dependency-free, pure-function example

```typescript
import { boardReducer, initialBoardState } from './board.reducer';
import { addBoard } from './board.actions';

describe('boardReducer', () => {
  it('should add a board to an empty state', () => {
    const newBoard = { id: '1', name: 'Sprint Planning' };
    const result = boardReducer(initialBoardState, addBoard({ board: newBoard }));
    expect(result.boards).toEqual([newBoard]);
  });

  it('should not mutate the original state object', () => {
    const action = addBoard({ board: { id: '1', name: 'Sprint Planning' } });
    const result = boardReducer(initialBoardState, action);
    expect(result).not.toBe(initialBoardState); // different reference — Module 8's immutability rule, verified
  });
});
```
The second test directly verifies Module 8's core reducer-purity rule (never mutate, always return a new object) — `.not.toBe(...)` checks the results are **different references**, exactly the property NgRx's change detection depends on.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Using `toBe` to compare two objects/arrays with the same contents but different references | `toBe` checks strict reference equality — two separately-created objects with identical contents are **not** the same reference, so this fails even when the data is "correct" | Use `toEqual` for deep, contents-based comparison of objects/arrays | Matches the comparison method to what's actually being checked: values, not identity |
| Reusing one `service`/state instance across multiple `it(...)` blocks without `beforeEach` resetting it | One test's changes (e.g., adding an item to the cart) leak into the next test, making results depend on test **order** — a fragile, hard-to-debug test suite | Use `beforeEach` to create a fresh instance before every test | Guarantees each test starts from the same known state, independent of any other test |
| Writing a vague test description (`it('works', () => {...})`) | Gives no information when it fails, and doesn't document the expected behavior for future readers | Write descriptions as a plain-English statement of expected behavior (`it('should increment quantity when the same dessert is added again', ...)`) | A failing test's name alone should tell you what broke, without reading its body |

### ✅ Knowledge Check
1. Why does testing `boardReducer`'s purity require `.not.toBe(...)` rather than `.not.toEqual(...)`?
2. Why does `beforeEach` matter for keeping tests independent of execution order?

### 🎥 Optional Video
This section's core Jest syntax (`describe`/`it`/`expect`/matchers) is common to virtually every modern Jest tutorial; the official **Testing guide (Angular.io)** and this module's own "Mastering Angular Unit Testing" article (Section 12) are worth reading directly alongside these examples for additional matcher coverage.

---

## 4. Mocking Dependencies

### What is a mock?

A **mock** is a fake, controlled stand-in for a real dependency (a service, `HttpClient`, the Router) used specifically so a unit test can test **one** piece of code in isolation, without actually running (or depending on the real behavior of) whatever it depends on.

### Why does testing need this, given services already work correctly?

Consider testing `TaskDetailComponent` (Module 9), which injects a real `TaskService` that makes actual `HttpClient` calls. A test using the **real** `TaskService` would need a real backend API available, running, and returning predictable data every time the test suite runs — slow, fragile (network issues, backend downtime), and no longer testing `TaskDetailComponent`'s own logic in isolation, since a failure could just as easily mean "the backend was briefly down" as "the component has a real bug." Mocking `TaskService` replaces it with a fake version **you fully control**, so the test is fast, reliable, and genuinely isolated to `TaskDetailComponent`'s own behavior.

### Creating a mock with `jest.fn()`

```typescript
import { TaskDetailComponent } from './task-detail.component';
import { TaskService } from '../../services/task.service';
import { of } from 'rxjs';

describe('TaskDetailComponent', () => {
  let component: TaskDetailComponent;
  let mockTaskService: Partial<TaskService>;

  beforeEach(() => {
    mockTaskService = {
      getTask: jest.fn().mockReturnValue(of({ id: '7', title: 'Design mockup', done: false })),
      patchTaskStatus: jest.fn().mockReturnValue(of({ id: '7', title: 'Design mockup', done: true })),
      deleteTask: jest.fn().mockReturnValue(of(undefined))
    };

    component = new TaskDetailComponent(mockTaskService as TaskService, /* ...other mocked deps... */);
  });

  it('should call patchTaskStatus with the toggled done value', () => {
    component.onToggleDone('42', '7', false);
    expect(mockTaskService.patchTaskStatus).toHaveBeenCalledWith('42', '7', true);
  });
});
```
- **`jest.fn()`** — creates a **mock function**: a fake function that records how it was called (arguments, number of times) and can be configured to return whatever you want.
- **`.mockReturnValue(of({...}))`** — configures the mock function to return a specific value whenever called — here, `of(...)` (Module 6) produces a fake, immediately-resolving Observable, standing in for what a real `HttpClient`-backed method would eventually emit.
- **`Partial<TaskService>`** — marks the mock as only needing to implement whichever methods this particular test actually uses, rather than every method the real `TaskService` has — a pragmatic, common pattern (cast to the full type, `as TaskService`, when passing it where the real type is expected).
- **`expect(mockTaskService.patchTaskStatus).toHaveBeenCalledWith('42', '7', true)`** — a Jest matcher specific to mock functions, verifying **exactly what arguments** the mock was called with — this is how you verify `TaskDetailComponent`'s logic (computing `!currentlyDone`) is correct, without needing a real service to actually process anything.

### Mock verification matchers

```typescript
expect(mockTaskService.deleteTask).toHaveBeenCalled();          // called at all, regardless of arguments
expect(mockTaskService.deleteTask).toHaveBeenCalledTimes(1);     // called exactly once
expect(mockTaskService.deleteTask).toHaveBeenCalledWith('42', '7'); // called with these exact arguments
expect(mockTaskService.getTask).not.toHaveBeenCalled();          // NOT called — useful for verifying conditional logic
```

### A mocked Router and mocked ActivatedRoute (Module 4), for a component using both

```typescript
const mockRouter = { navigate: jest.fn() };
const mockActivatedRoute = {
  snapshot: { paramMap: { get: jest.fn().mockReturnValue('42') } }
};

component = new TaskDetailComponent(mockTaskService as TaskService, mockRouter as any, mockActivatedRoute as any);

it('should navigate back to the board after a successful delete', () => {
  component.onDelete('42', '7');
  expect(mockRouter.navigate).toHaveBeenCalledWith(['/boards', '42']);
});
```
This directly tests the exact interaction from Module 9, Section 4's `TaskDetailComponent.onDelete()` — confirming it navigates correctly on success, with **no** real HTTP call, no real routing, and no real DOM ever involved.

### Three worked examples, together

**Example 1 — mocking `CartService` for a component test** (conceptually parallel to the `TaskService` example above, applied to Module 1/3's Dessert Shop).

**Example 2 — mocking a simulated failure, to test error-handling logic:**
```typescript
mockTaskService.deleteTask = jest.fn().mockReturnValue(throwError(() => new Error('Network error')));

it('should log an error and NOT navigate if deletion fails', () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  component.onDelete('42', '7');
  expect(consoleSpy).toHaveBeenCalled();
  expect(mockRouter.navigate).not.toHaveBeenCalled();
});
```
`throwError(() => ...)` (Module 6) simulates a failing Observable — this is how you deliberately test your component's `error` callback path without needing a real failing backend. `jest.spyOn(console, 'error')` is a **spy** — similar to a mock, but wrapping an **existing** real function (here, `console.error`) to observe calls to it while (via `.mockImplementation(() => {})`) suppressing its real behavior for the duration of the test.

**Example 3 — a mock for NgRx's `Store` (Module 8):**
```typescript
const mockStore = { select: jest.fn().mockReturnValue(of([])), dispatch: jest.fn() };
```

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Testing a component with the **real** service (making real HTTP calls) instead of a mock | Slow, unreliable (depends on network/backend availability), and no longer isolates the component's own logic as the thing being tested | Mock every injected dependency for a true unit test | Keeps the test fast, deterministic, and focused only on the component under test |
| Mocking a method to return a plain value instead of an Observable, when the real method returns one | The component's code (expecting to call `.subscribe()` or use `\| async`) breaks against a mock that doesn't match the real method's actual return type | Use `of(value)` (Module 6) to produce a fake but real Observable | Matches the mock's shape to the real dependency's actual contract |
| Forgetting to reset/reconfigure mocks between tests (relying on a mock's configuration from a previous test) | Leaks test-specific setup across tests, causing order-dependent, fragile failures — the mock equivalent of Section 3's shared-state mistake | Reconfigure or recreate mocks in `beforeEach`, exactly like real service instances | Keeps every test's mock behavior independent and explicit |
| Only checking `toHaveBeenCalled()` when the actual arguments matter for correctness | Passes even if the component called the mock with completely wrong arguments, since `toHaveBeenCalled()` alone doesn't check them | Use `toHaveBeenCalledWith(...)` whenever the specific arguments are part of what's being verified | Matches the assertion's strictness to what actually needs to be correct |

### ✅ Knowledge Check
1. Why would testing `TaskDetailComponent` with the real `TaskService` be a poor choice for a unit test?
2. What's the difference between `toHaveBeenCalled()` and `toHaveBeenCalledWith(...)`, and when does the distinction matter?
3. Why must a mocked method that stands in for a real Observable-returning method also return an Observable (e.g., via `of(...)`), rather than a plain value?

---

## 5. Testing Asynchronous Code & Observables

### The problem this section solves

Every example in Sections 3–4 so far has used `of(...)` (Module 6) specifically because it emits **synchronously** — the test can `expect(...)` its result immediately, with no waiting. Real async code (a genuine `setTimeout`-based delay, or an Observable that doesn't emit immediately) needs the test itself to **wait** correctly, or the assertion runs before the value ever arrives — a very common source of "flaky" (unreliably passing/failing) tests for beginners.

### Testing a synchronously-emitting Observable — no special handling needed

```typescript
it('should return the dessert catalog', () => {
  const desserts$ = service.getDesserts(); // if backed by of(...) or a synchronous mock
  let result: Dessert[] = [];
  desserts$.subscribe((desserts) => (result = desserts));
  expect(result.length).toBeGreaterThan(0);
});
```
Because `of(...)`-backed (or otherwise synchronous) Observables emit **immediately** upon subscription, the assignment inside `.subscribe(...)` has already happened by the time `expect(...)` runs on the next line — no waiting required.

### Testing genuinely asynchronous code — `async`/`await` with `firstValueFrom`

```typescript
import { firstValueFrom } from 'rxjs';

it('should eventually resolve with the dessert catalog', async () => {
  const desserts = await firstValueFrom(service.getDesserts());
  expect(desserts.length).toBeGreaterThan(0);
});
```
- **`async () => {...}`** — marks the test function itself as asynchronous, letting it use `await` inside.
- **`firstValueFrom(observable)`** — converts an Observable into a Promise that resolves with its **first** emitted value (and rejects if the Observable errors first) — the standard, modern bridge for `await`-ing a single Observable value inside a test.
- **`await`** — pauses the test until that Promise resolves, **before** the `expect(...)` line runs — this is what correctly avoids the "asserting before the value arrives" problem.

### Testing error cases with async Observables

```typescript
it('should reject if the dessert catalog fails to load', async () => {
  mockHttpClient.get = jest.fn().mockReturnValue(throwError(() => new Error('Network error')));
  await expect(firstValueFrom(service.getDesserts())).rejects.toThrow('Network error');
});
```
`.rejects.toThrow(...)` is Jest's matcher form specifically for a Promise that's expected to **reject** — pairing naturally with `firstValueFrom` on an Observable that errors instead of emitting.

### Testing NgRx Effects (Module 8) — combining Sections 4 and 5 directly

```typescript
import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of } from 'rxjs';
import { BoardEffects } from './board.effects';
import { loadBoards, loadBoardsSuccess } from './board.actions';

describe('BoardEffects', () => {
  let actions$: Observable<any>;
  let effects: BoardEffects;
  let mockBoardService: Partial<BoardService>;

  beforeEach(() => {
    mockBoardService = {
      getBoards: jest.fn().mockReturnValue(of([{ id: '1', name: 'Sprint Planning' }]))
    };

    TestBed.configureTestingModule({
      providers: [
        BoardEffects,
        provideMockActions(() => actions$),
        { provide: BoardService, useValue: mockBoardService }
      ]
    });

    effects = TestBed.inject(BoardEffects);
  });

  it('should dispatch loadBoardsSuccess when getBoards succeeds', (done) => {
    actions$ = of(loadBoards());
    effects.loadBoards$.subscribe((resultAction) => {
      expect(resultAction).toEqual(loadBoardsSuccess({ boards: [{ id: '1', name: 'Sprint Planning' }] }));
      done();
    });
  });
});
```
- **`provideMockActions(() => actions$)`** — a testing utility specific to `@ngrx/effects`, letting a test control exactly which action(s) the Effect "sees" as input, rather than needing a real, running Store.
- **`{ provide: BoardService, useValue: mockBoardService }`** — this is `TestBed`'s own dependency-injection override mechanism, previewed here and covered fully in Section 6 — it tells Angular's test injector "whenever anything asks for `BoardService`, hand it this mock instead."
- **`(done) => {...}` / `done()`** — an alternative, older-style way to signal "this async test is finished" to Jest, used here because the Effect's Observable is subscribed to directly rather than awaited — calling `done()` inside the subscription's callback tells Jest the test can now finish and check whether any assertions inside failed.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Writing `expect(...)` immediately after subscribing to a genuinely asynchronous Observable, with no `await`/`done` | The assertion runs before the value has actually arrived, either failing incorrectly or (worse) passing for the wrong reason (e.g., checking a variable still at its initial value) | Use `await firstValueFrom(...)` (for a single value) or the `done` callback pattern (for Observables/Effects) | Ensures the assertion only runs after the asynchronous value has genuinely arrived |
| Forgetting `async` on a test function that uses `await` inside it | A syntax/runtime error — `await` is only valid inside an `async` function | Mark the test callback itself as `async () => {...}` | Matches the language's own requirement for using `await` |
| Testing an Effect by trying to invoke it as a plain function, rather than subscribing to the Observable it produces | Effects (Module 8) are RxJS pipelines, not plain callable functions with a return value to check directly | Subscribe to `effects.someEffect$` and assert on what it emits, using `done()` or an async pattern | Matches the actual, Observable-based shape of an NgRx Effect |

### ✅ Knowledge Check
1. Why is `of(...)`-backed test data "easier" to test than genuinely asynchronous code, and what specifically becomes necessary once code is genuinely async?
2. What does `firstValueFrom` do, and why does `await`-ing it prevent the "asserting too early" problem?

---

## 6. Unit & Integration Testing Components

### The problem: components need Angular's own machinery to render correctly

Unlike `CartService` or `boardReducer` (Section 3), a component's template involves data binding, directives (`*ngIf`/`*ngFor`), and — as of Module 1 — potentially child components, all of which need Angular's actual rendering machinery to process correctly. `TestBed` is Angular's testing utility providing exactly that: a way to compile and create real component instances (with a real, rendered template) inside a test.

### Unit testing a component's class in isolation (no template rendering)

For component logic that doesn't depend on the template being rendered at all (as in Section 4's `TaskDetailComponent` examples), plain construction with mocked dependencies — no `TestBed` needed — is often simplest, exactly as shown in Section 4.

### Integration testing a component with its real template — `TestBed` and `ComponentFixture`

```typescript
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { DessertCardComponent } from './dessert-card.component';

describe('DessertCardComponent (integration)', () => {
  let fixture: ComponentFixture<DessertCardComponent>;
  let component: DessertCardComponent;

  const waffle: Dessert = {
    id: 1, name: 'Waffle with Berries', category: 'Waffle', price: 6.5,
    image: { thumbnail: '', mobile: '', tablet: '', desktop: '' }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DessertCardComponent] // standalone components are imported, not declared
    });

    fixture = TestBed.createComponent(DessertCardComponent);
    component = fixture.componentInstance;
    component.dessert = waffle;
    fixture.detectChanges(); // triggers Angular's change detection, rendering the template
  });

  it('should display the dessert name in the template', () => {
    const nameElement: HTMLElement = fixture.nativeElement.querySelector('.dessert-card__name');
    expect(nameElement.textContent).toContain('Waffle with Berries');
  });

  it('should emit the add event when the "Add to Cart" button is clicked', () => {
    const addSpy = jest.spyOn(component.add, 'emit');
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.btn--add-to-cart');
    button.click();
    expect(addSpy).toHaveBeenCalledWith(waffle);
  });
});
```
- **`TestBed.configureTestingModule({ imports: [...] })`** — sets up a minimal testing environment, registering whichever standalone components/modules this test needs — the test-specific equivalent of an application's real `app.config.ts`.
- **`TestBed.createComponent(DessertCardComponent)`** — creates a **real** instance of the component, with a **real**, compiled template — this is what makes this an *integration* test (Section 2) rather than a unit test: the component's class and its actual template are both genuinely involved.
- **`fixture.componentInstance`** — direct access to the component class instance, for setting `@Input()`s directly (`component.dessert = waffle`) exactly as Module 1 taught they're normally set by a parent.
- **`fixture.detectChanges()`** — manually triggers Angular's change detection (Module 2, Section 9) — necessary because, unlike a real running app, a test doesn't have anything else triggering it automatically; you must call this after changing any bound `@Input()`/property the template depends on.
- **`fixture.nativeElement.querySelector(...)`** — reaches into the actual rendered DOM the test created, letting you assert on real, rendered HTML content — proof the template (not just the class) behaves correctly.
- **`jest.spyOn(component.add, 'emit')`** — spies specifically on the component's own `@Output()` `EventEmitter`'s `.emit()` method, letting the test verify a **real** button click (`button.click()`, on the real rendered DOM) correctly results in the expected event being emitted with the expected payload.

### Mocking a child component for a "shallow" integration test

```typescript
TestBed.configureTestingModule({
  imports: [DessertListComponent],
}).overrideComponent(DessertListComponent, {
  set: { imports: [MockDessertCardComponent] } // a lightweight stand-in, not the real DessertCardComponent
});
```
When testing `DessertListComponent`, you may not want its **child** `DessertCardComponent`'s own full template/logic involved at all (that's `DessertCardComponent`'s *own* test's job, per Section 2's "one piece in isolation" unit-testing principle) — substituting a minimal mock/stub child component keeps the test focused specifically on `DessertListComponent`'s own responsibilities (does it render the right number of cards, does it correctly forward events). **🔒 Building fully-fledged mock components like this in depth is a more advanced technique this module only introduces conceptually** — the pattern is worth recognizing, even if your own lab tests mostly use real child components for simplicity.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Setting `component.dessert = waffle` but forgetting `fixture.detectChanges()` afterward | The template was already rendered *before* the input was set, and won't automatically re-render just because a property changed in a test — unlike a real running app's automatic change detection | Always call `fixture.detectChanges()` after changing any input/property the template depends on | Manually triggers exactly the update step Angular's real change-detection cycle would normally handle |
| Querying the DOM for an element using a CSS class that's been renamed/removed without updating the test | The test silently finds `null` and subsequent assertions fail confusingly (or, worse, pass incorrectly if not carefully written) | Keep test selectors in sync with the actual template, and consider `data-testid` attributes (🔒 a common convention not covered in depth here) for selectors that are more resilient to styling-class changes | Reduces false failures/passes caused by selectors drifting out of sync with the real template |
| Testing every child component's full behavior again inside a parent's integration test | Duplicates coverage the child's own test file already provides, and makes the parent's test slower and more tightly coupled to the child's internals | Focus a component's own test on its own responsibilities; consider mocking genuinely complex children | Keeps each test's scope matched to what it's actually meant to verify, per the testing pyramid's "isolate what you're testing" principle |

### ✅ Knowledge Check
1. Why is `TestBed.createComponent(...)` considered integration testing rather than unit testing, in this module's terms?
2. Why must `fixture.detectChanges()` be called manually after setting a component's `@Input()` property directly in a test?

### 🎥 Optional Video
This section's official reference is the **Testing guide (Angular.io)**, linked in Section 12 — its component-testing sections cover `TestBed`/`ComponentFixture` in additional depth worth reading directly alongside these examples.

---

## 7. Test-Driven Development: Red-Green-Refactor

### What is TDD?

**Test-Driven Development (TDD)** is a development workflow where you write a **failing test first**, for behavior that doesn't exist yet, then write the **minimum code** needed to make it pass, then improve the code's structure while keeping the test passing. This is the **Red-Green-Refactor** cycle this module's discussion prompt asks you to explain directly.

### The three steps, precisely

```
🔴 RED       Write a test for behavior that doesn't exist yet. Run it. It FAILS
              (because the code doesn't exist, or doesn't do this yet).
              
🟢 GREEN     Write the SIMPLEST possible code that makes the test pass —
              not the most elegant, not the most complete; just enough.

🔵 REFACTOR  With the safety net of a passing test, improve the code's
              structure, naming, or efficiency — WITHOUT changing its
              observable behavior. Re-run the test to confirm it still passes.
```

### Why write the test *before* the code, rather than after?

Writing the test first forces you to think concretely about **what "correct" actually means** for a piece of behavior *before* getting absorbed in how to implement it — and guarantees the test genuinely exercises the intended behavior (a test written *after* the code sometimes accidentally tests "whatever the code happens to currently do" rather than "what it's actually supposed to do," especially if the implementation has a subtle bug the after-the-fact test never questions).

### A worked TDD example: adding a `getBoardCount()` method to a service

**🔴 Red — write the failing test first:**
```typescript
describe('BoardService', () => {
  it('should return the number of boards', () => {
    const service = new BoardService();
    service.addBoard({ id: '1', name: 'Sprint Planning' });
    service.addBoard({ id: '2', name: 'Bug Triage' });
    expect(service.getBoardCount()).toBe(2);
  });
});
```
Running this now fails — `getBoardCount` doesn't exist yet.

**🟢 Green — the simplest code that passes:**
```typescript
export class BoardService {
  private boards: Board[] = [];

  addBoard(board: Board): void {
    this.boards.push(board); // not yet worrying about immutability — just making the test pass
  }

  getBoardCount(): number {
    return this.boards.length;
  }
}
```
This passes the test — deliberately not yet worrying about Module 3/8's immutability conventions, since "make it pass, simply" is this step's entire job.

**🔵 Refactor — improve without changing behavior:**
```typescript
export class BoardService {
  private boards: Board[] = [];

  addBoard(board: Board): void {
    this.boards = [...this.boards, board]; // now immutable, matching Module 3/8's conventions
  }

  getBoardCount(): number {
    return this.boards.length;
  }
}
```
Re-running the same, unchanged test confirms this refactor didn't break anything — this is precisely what "the safety net of a passing test" means in practice.

### How mocking (Section 4) specifically supports TDD — this module's own discussion prompt

Consider writing `TaskDetailComponent` **before** `TaskService` even fully exists yet, TDD-style: you can write `TaskDetailComponent`'s test first, **mocking** `TaskService` entirely (Section 4) with exactly the methods/return shapes you've decided it *should* have — `getTask`, `patchTaskStatus`, `deleteTask` — and get `TaskDetailComponent`'s own Red-Green-Refactor cycle fully working **before** `TaskService`'s real implementation (and its real `HttpClient` calls, Module 9) is even written. The mock effectively **specifies the contract** the real service will eventually need to fulfill — mocking isn't just "a workaround for not having the real dependency yet," it's what makes TDD-ing a component in isolation from its dependencies possible **at all**, especially when — as is common in real teams — the component and the service it depends on might even be built by different people, in parallel, agreeing on the mocked contract ahead of time.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Writing the "Green" step's implementation to be fully complete/polished immediately | Skips the deliberate, incremental discipline TDD is built around, and often means writing more code than the current test actually demands before verifying it | Write the **minimum** code that passes the current test, saving elegance for the Refactor step | Keeps each step focused on exactly one concern at a time |
| Skipping the "Refactor" step once a test passes | Leaves quick-and-simple Green-step code as the permanent implementation, missing the chance to apply this course's own conventions (immutability, clear naming, etc.) safely | Always take the Refactor step, using the passing test as your safety net | Realizes TDD's actual long-term benefit: continuous, low-risk improvement |
| Writing a test *after* the implementation and considering that "TDD" | Reverses the defining order of the cycle — Red must come first, precisely so the test's ability to actually fail (and thus actually test something) is verified before any code exists to make it trivially pass | Write the failing test first, confirm it fails for the right reason, then implement | The R in TDD refers to a specific ordering, not merely "having tests at all" |

### ✅ Knowledge Check
1. Walk through the Red-Green-Refactor cycle in your own words, using the `getBoardCount()` example (or one of your own).
2. Directly address this module's own discussion prompt: how does mocking a dependency support TDD, especially for a component that depends on a service?

---

## 8. End-to-End Testing With Cypress

### What is Cypress?

**Cypress** is an E2E testing tool that runs your **actual, real application** in a real browser and automates a real user's interactions with it — clicking, typing, navigating — then asserts on what actually appears on screen, with **no mocking of your own application code** (a real backend, or a controlled test backend, is typically still involved).

### Why is this fundamentally different from Sections 3–6's Jest tests?

Every test so far has been a **unit** or **integration** test (Section 2) — testing pieces of the application in isolation, with dependencies mocked, running in Node (via Jest) rather than a real browser. Cypress tests operate at the **top of the pyramid**: the complete, real application, running in a real browser, exercising a genuine user flow end to end — the strongest possible confidence that a feature actually works, at the cost of being slower and more expensive to write/maintain, exactly as Section 2's pyramid predicts.

### A basic Cypress test — the Kanban app's "create a board" flow

```typescript
describe('Creating a board', () => {
  it('should let a user create a new board and see it in the list', () => {
    cy.visit('/');
    cy.get('[data-testid="new-board-button"]').click();
    cy.get('[data-testid="board-name-input"]').type('Sprint Planning');
    cy.get('[data-testid="save-board-button"]').click();
    cy.contains('Sprint Planning').should('be.visible');
  });
});
```
- **`cy.visit('/')`** — loads the real application in a real (headless or visible) browser, at the given route (Module 4).
- **`cy.get('[data-testid="..."]')`** — finds an element by a dedicated test attribute (the convention hinted at in Section 6's mistakes table) — deliberately **not** a CSS class used for styling, so the test doesn't break if the class is renamed for purely visual reasons.
- **`.type('Sprint Planning')`** — simulates real keystrokes into an input, exercising the actual `[(ngModel)]`/`formControlName` binding (Module 5) exactly as a real user's typing would.
- **`.click()`** — simulates a real mouse click, exercising the actual `(click)` event binding (Module 1) and everything it triggers — actual component logic, actual service calls, actual (or test-configured) HTTP requests (Module 9), and actual routing (Module 4) if the flow navigates anywhere.
- **`cy.contains('Sprint Planning').should('be.visible')`** — asserts the new board's name genuinely appears, visibly, in the rendered page — proof the **entire** flow, front to back, worked.

### A second example — verifying a critical, cross-cutting flow (auth + routing, Modules 4 & 9)

```typescript
describe('Accessing a protected route', () => {
  it('should redirect an unauthenticated user to login', () => {
    cy.visit('/settings');
    cy.url().should('include', '/login');
  });

  it('should allow a logged-in user to reach settings', () => {
    cy.visit('/login');
    cy.get('[data-testid="username-input"]').type('testuser');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="login-button"]').click();
    cy.visit('/settings');
    cy.url().should('include', '/settings');
  });
});
```
This single pair of tests verifies Module 4's `CanActivate` guard and Module 9's `authInterceptor`/`errorInterceptor` are correctly wired together, **through the real, running application** — a genuinely different, complementary kind of confidence from any unit test of the guard or interceptor in isolation.

### When to use E2E tests, given how expensive they are

Reserve Cypress specifically for **critical user flows** — the handful of things that, if broken, would mean the application is fundamentally not working for real users (creating a board, completing a purchase, logging in). Don't try to E2E-test every possible interaction or edge case — that's exactly what the many unit/integration tests lower in the pyramid are for; Section 2's pyramid shape is a direct, practical guide to how much E2E coverage is actually appropriate.

### 🔒 Coming Later — Outside This Module
Visual regression testing, custom Cypress commands/plugins in depth, CI pipeline integration for running Cypress automatically on every commit, testing across multiple real browsers/devices, accessibility test automation.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Trying to E2E-test every component's every edge case | Extremely slow test suite, and duplicates coverage far better handled by fast unit/integration tests | Reserve E2E tests for critical, complete user flows only | Matches E2E's actual cost/confidence trade-off, per the testing pyramid |
| Selecting elements by CSS classes used for styling | Brittle — a purely visual class rename breaks the test even though the feature itself didn't change | Use dedicated `data-testid` attributes (or equivalent) for test selectors | Decouples "what the test looks for" from "what CSS happens to style the element" |
| Writing a Cypress test that depends on a specific, existing, mutable database record that might not be present in every test run | Flaky — the test's success depends on external test-data state that Cypress itself isn't in control of | Set up known, controlled test data at the start of the test (or via a test-specific backend/fixture) | Keeps E2E tests as self-contained and deterministic as unit tests, despite testing the real app |

### ✅ Knowledge Check
1. Why does a Cypress test typically avoid mocking, unlike every test in Sections 3–6?
2. Why shouldn't you try to E2E-test every possible interaction, given Cypress's strengths?

### 🎥 Optional Video
This section's core patterns are drawn from the official **Cypress documentation ("Testing Your App")**, linked in Section 12 — read it directly for hands-on setup instructions and additional command reference beyond `cy.visit`/`cy.get`/`cy.contains` shown here.

---

## 9. Putting It Together: Kanban App Testing Architecture

```
Unit tests (many, fast — Jest, no TestBed needed for pure logic)
├── cart.service.spec.ts         Module 3's CartService, tested with real instances, no mocks needed
├── board.reducer.spec.ts        Module 8's reducer, pure-function testing, verifying immutability
├── dessert.utils.spec.ts        Plain pipes/utility functions
└── task-detail.component.spec.ts (class-only)  Module 9's component, with TaskService/Router/
                                                  ActivatedRoute all MOCKED (Section 4)

Integration tests (some, medium speed — Jest + TestBed)
├── dessert-card.component.spec.ts   Real template rendered via TestBed; real button click →
│                                     real @Output() emission verified
├── dessert-list.component.spec.ts   Real template; correct number of DessertCards rendered
│                                     from a given @Input() array (Section 6)
└── board.effects.spec.ts            Module 8's Effect, tested with provideMockActions +
                                      a mocked BoardService (Section 5)

E2E tests (few, slow — Cypress, real browser, real app)
├── create-board.cy.ts            Full flow: visit → click "new board" → type name → save → verify
├── add-and-complete-task.cy.ts    Full flow: create board → add task → mark done → verify
└── protected-route-redirect.cy.ts Full flow: unauthenticated visit to /settings → redirected to /login
```

**How this maps back to the testing pyramid (Section 2):** the largest number of files sit in the "unit tests" group — testing services, reducers, and component *logic* (with dependencies mocked) in fast isolation. A smaller number of integration tests verify real templates render and respond correctly. A deliberately small handful of Cypress tests cover only the Kanban app's most critical, complete user flows — exactly the shape Section 2's pyramid diagram predicts, applied to a real application built across this entire course.

---

## 10. Final Module Project: Kanban Task Management Web App (Part V — Testing & Quality Assurance with Jest)

### Project Requirements

Write a layered test suite for the Kanban app, covering unit tests for services/reducers, integration tests for key components, and at least one Cypress E2E test for a critical flow.

### Functional Requirements

1. Unit tests for at least one service (e.g., `BoardService`/`TaskService`), covering both successful and failing cases (using mocked `HttpClient` responses, Module 9/Section 4).
2. Unit tests for at least one NgRx reducer (Module 8), explicitly verifying immutability (`.not.toBe(...)`) alongside correct resulting state.
3. At least one component tested with dependencies fully mocked (Section 4) — verifying method calls, arguments, and (where relevant) navigation — with no real `TestBed`/template rendering required for this one.
4. At least one component tested via `TestBed`/`ComponentFixture` (Section 6) — verifying real rendered template content and real event emission from a real, simulated click.
5. At least one test for asynchronous/Observable-returning code using `firstValueFrom` (Section 5), covering both a success and a failure (rejection) case.
6. At least one NgRx Effect tested using `provideMockActions` (Section 5).
7. At least one Cypress E2E test covering a complete, critical user flow (e.g., creating a board and adding a task).
8. A short written reflection (a comment block or short markdown note) walking through one instance of the Red-Green-Refactor cycle you actually followed while building a test in this project, and directly addressing this module's discussion prompt about how mocking supported that process.

### Suggested Structure

```
services/
├── board.service.spec.ts
└── task.service.spec.ts

state/
├── board.reducer.spec.ts
└── board.effects.spec.ts

components/
├── task-detail.component.spec.ts       (class-only, mocked deps)
└── dessert-card.component.spec.ts      (TestBed/ComponentFixture — or your Kanban equivalent)

cypress/e2e/
└── create-board.cy.ts
```

### Required Angular Concepts (checklist)

- [ ] `describe`/`it`/`expect` with a range of matchers (`toBe`, `toEqual`, `toHaveBeenCalledWith`, etc.)
- [ ] `beforeEach` used to reset state/mocks between tests
- [ ] At least one service/reducer unit test with no `TestBed` involved at all
- [ ] `jest.fn()`/`jest.spyOn()` used to mock at least one dependency
- [ ] `TestBed`/`ComponentFixture`/`fixture.detectChanges()` used for at least one integration test
- [ ] `firstValueFrom` (or an equivalent async pattern) used for at least one genuinely asynchronous test
- [ ] `provideMockActions` used for at least one NgRx Effect test
- [ ] At least one Cypress E2E test using `cy.visit`/`cy.get`/`cy.contains` (or equivalents)
- [ ] A written Red-Green-Refactor reflection directly addressing the discussion prompt

### Acceptance Criteria

- The full unit/integration test suite passes when run via Jest.
- The Cypress E2E test passes against the real, running application.
- At least one reducer test explicitly verifies immutability, not just correct resulting values.
- At least one component test verifies a real, rendered DOM element's content or a real simulated click's effect (not only class-level method calls).
- The written reflection specifically references a real test you wrote in this project, not only Section 7's abstract example.

### Hints (if stuck)

- Start with the simplest, dependency-free unit tests (a pure utility function, or a reducer) before moving to component tests that require mocks or `TestBed` — the same "prove the simple case first" advice every prior module's project has given, now applied to testing itself.
- If a component integration test's assertion on rendered DOM content fails unexpectedly, check for a missing `fixture.detectChanges()` call after setting inputs — this is this section's single most common mistake.
- If a Cypress test is flaky (passes/fails inconsistently), check whether it's relying on a CSS class selector instead of a `data-testid`, or on pre-existing data state instead of data it sets up itself.

### Optional Stretch Challenges

- Add a unit test specifically verifying `HttpHeaders`/interceptor behavior from Module 9 (e.g., confirming a request built by a service includes the expected header, without needing a real interceptor chain — 🔒 fully testing an interceptor's own registration/chaining is more advanced and outside this module's required depth).
- Convert one existing test to follow a strict Red-Green-Refactor cycle explicitly, committing (or clearly marking, if not using version control for this exercise) the Red and Green states separately before the Refactor step, as a deliberate practice exercise.
- Research (and document in a comment, without necessarily implementing) how testing a Signal-based component (Module 7) might differ from testing an `@Input()`-based one, given signals are read via function calls rather than needing `ngOnChanges`/`SimpleChanges` inspection.

---

## 11. Quick Reference Sheet

### The Testing Pyramid
```
E2E (few, slow, real browser)          — Cypress; critical user flows only
Integration (some, medium)             — TestBed + real template rendering
Unit (many, fast, isolated)            — Jest; one piece, dependencies mocked
```

### Jest Basics
```
describe('ClassName', () => { ... })          Groups related tests
beforeEach(() => { ... })                      Runs before every test in this block
it('should ...', () => { ... })                One test case
expect(actual).toBe(expected)                  Strict/reference equality
expect(actual).toEqual(expected)               Deep object/array equality
expect(fn).toHaveBeenCalled()                  Mock was called at all
expect(fn).toHaveBeenCalledWith(...)            Mock was called with these exact arguments
expect(fn).not.toHaveBeenCalled()               Mock was NOT called
```

### Mocking
```
const mock = { method: jest.fn().mockReturnValue(of(value)) };   // stand-in for a real dependency
jest.spyOn(obj, 'method')                                         // wrap an existing real method
```

### Testing Async/Observables
```
await firstValueFrom(observable$)                          // await a single emitted value
await expect(firstValueFrom(observable$)).rejects.toThrow() // assert a rejection/error
```

### Component Testing (TestBed)
```
TestBed.configureTestingModule({ imports: [MyComponent] });
const fixture = TestBed.createComponent(MyComponent);
const component = fixture.componentInstance;
component.someInput = value;
fixture.detectChanges();                        // REQUIRED after changing inputs
fixture.nativeElement.querySelector('.selector') // real, rendered DOM
```

### NgRx Effects Testing
```
provideMockActions(() => actions$)     // controls exactly which action(s) an Effect "sees"
```

### TDD — Red, Green, Refactor
```
🔴 Red       Write a failing test for behavior that doesn't exist yet
🟢 Green     Write the SIMPLEST code that makes it pass
🔵 Refactor  Improve the code's structure; re-run the test to confirm it still passes
```

### Cypress (E2E)
```
cy.visit('/path')
cy.get('[data-testid="..."]')
cy.get('[data-testid="..."]').type('text')
cy.get('[data-testid="..."]').click()
cy.contains('text').should('be.visible')
cy.url().should('include', '/path')
```

### Important Terminology

| Term | Definition |
|---|---|
| **Testing pyramid** | A model recommending many fast unit tests, some integration tests, and few slow E2E tests. |
| **Unit test** | A test of one piece of code in isolation, with dependencies mocked. |
| **Integration test** | A test of several pieces working together, e.g., a component with its real template. |
| **E2E (end-to-end) test** | A test of a complete user flow through the real, running application. |
| **Mock** | A fake, controlled stand-in for a real dependency, used to isolate a unit test. |
| **Spy** | A wrapper around an existing real function/method that records calls to it. |
| **`TestBed`** | Angular's utility for configuring and creating real component instances in tests. |
| **`ComponentFixture`** | The object `TestBed.createComponent(...)` returns, providing access to the component instance and its rendered DOM. |
| **TDD (Test-Driven Development)** | Writing a failing test first, then the minimum code to pass it, then refactoring. |
| **Red-Green-Refactor** | TDD's three-step cycle. |
| **Cypress** | An E2E testing tool running the real application in a real browser. |

### 🔒 Coming Later — Outside This Module
Visual regression testing · Contract testing · Performance/load testing · CI/CD pipeline configuration for automated test runs · Mutation testing · Accessibility test automation · Testing Signal-based components/interceptors in full depth

---

## 12. Source & Resource Mapping

| Module Topic | Source Resource | Knowledge Extracted |
|---|---|---|
| Testing fundamentals (official) | Angular.io — "Testing" | Core framing across Sections 2–6 |
| Modern testing strategy overview (video) | YouTube (unnamed in source, linked) | Section 2's testing-pyramid framing |
| Angular testing tooling context (video) | YouTube (unnamed in source, linked) | Context for this module's modern Jest-based tooling note |
| Unit testing best practices | javascript.plainenglish.io — "Mastering Angular Unit Testing" | Section 3's practices and conventions |
| Mocking dependencies | Gorilla Logic — "Best Practices for Angular Unit Testing" | Section 4's mocking patterns |
| E2E testing (official) | Cypress.io Docs — "Testing Your App" | Section 8's core Cypress syntax |
| Modern unit/E2E testing approaches | Medium — "Advanced Angular Testing in 2025" | Cross-cutting reinforcement for Sections 6 and 8 |

**Quick links for deeper reading (optional, not required to complete this module):**
- [Testing — Angular.io](https://angular.io/guide/testing)
- [Mastering Angular Unit Testing: Best Practices and Tools](https://javascript.plainenglish.io/mastering-angular-unit-testing-best-practices-and-tools-7591753681cb)
- [Best Practices for Angular Unit Testing — Gorilla Logic](https://gorillalogic.com/blog-and-resources/best-practices-for-angular-unit-testing)
- [Testing Your App — Cypress.io Docs](https://docs.cypress.io/guides/end-to-end-testing/testing-your-app)

---

### Discussion Prompt (from the original module)

> Explain the 'Red-Green-Refactor' cycle of Test-Driven Development (TDD). How does creating mocks (LO 4) support this TDD process, especially when testing a component that depends on a service?

Section 7 answers both halves of this directly: Red-Green-Refactor is write-a-failing-test → write-the-simplest-passing-code → improve-without-breaking-the-test, and mocking supports TDD specifically by letting you write and fully green-light a component's own tests using an agreed-upon, mocked contract for its dependencies **before** those dependencies' real implementations even exist — exactly the situation Section 7's `TaskDetailComponent`/`TaskService` example walks through. Frame your own answer around a real test from your own project (per the project's own reflection requirement), in your own words.
