# Module 3: Services & Dependency Injection
### FEM11 — continues from FEM09 (Angular Fundamentals) and FEM10 (Component Interaction & Lifecycle)

> **Scope note:** This document covers *only* Module 3 — what services are, `@Injectable()`, constructor injection, the provider hierarchy (`providedIn: 'root'` vs. component-level providers), refactoring component state into services, `@Inject`/injection tokens for non-class dependencies, and using Angular's `HttpClient` inside a service (including the minimum Observable/`subscribe` knowledge needed to use it). Anything beyond that — RxJS operators in depth, NgRx/global state libraries, HTTP interceptors, authentication, testing services with mocks/spies — is flagged **🔒 Coming Later — Outside This Module**.

---

## How this document is organized

Same documentation-first shape as Modules 1–2, with an emphasis this module specifically asked for: **every concept gets multiple worked examples**, not just one.

**What is it? → Why does Angular need it? → How does it work? → Syntax breakdown → Examples → When to use / not use → What happens behind the scenes? → How it connects to other concepts → Try It Yourself → Exercises → Common Mistakes**

Everything ties back to this module's running example: refactoring the Module 1 **Dessert Shop App** so its dessert data and cart logic live in services instead of directly inside components — "Dessert Shop App (Part II)."

---

## Table of Contents

1. [From Module 2 to Module 3: What's New](#1-from-module-2-to-module-3-whats-new)
2. [What Is a Service? Why Dependency Injection?](#2-what-is-a-service-why-dependency-injection)
3. [Creating and Injecting a Service](#3-creating-and-injecting-a-service)
4. [Provider Scope: `providedIn: 'root'` vs. Component Providers](#4-provider-scope-providedin-root-vs-component-providers)
5. [Refactoring Component Logic Into a Service](#5-refactoring-component-logic-into-a-service)
6. [`@Inject` and Injection Tokens](#6-inject-and-injection-tokens)
7. [Services for Async Data: `HttpClient`](#7-services-for-async-data-httpclient)
8. [Putting It Together: Dessert Shop App (Part II) Architecture](#8-putting-it-together-dessert-shop-app-part-ii-architecture)
9. [Final Module Project: Dessert Shop App (Part II)](#9-final-module-project-dessert-shop-app-part-ii)
10. [Quick Reference Sheet](#10-quick-reference-sheet)
11. [Source & Resource Mapping](#11-source--resource-mapping)

---

## 1. From Module 2 to Module 3: What's New

Modules 1–2 gave every component in the Dessert Shop App its data and behavior directly: `AppComponent` held the `desserts` array *and* the cart-quantity map *and* the add/increment/decrement/confirm-order logic, all in one class. That worked, but it quietly created two problems this module exists to solve:

1. **The root component is doing two unrelated jobs.** It's simultaneously "the top of the UI tree" *and* "the keeper of all cart business logic." Those are different responsibilities that happen to have been forced into the same class.
2. **Nothing about that logic is reusable outside a component.** If a completely different component (say, a header showing a live cart-item badge) needed the same cart total, the only options with what you know so far would be passing it down through `@Input()` from the same root — awkward once the tree gets deep, and impossible between components that don't share a direct ancestor/descendant relationship.

A **service** is Angular's answer to both problems: a plain class that holds shared logic/state, completely independent of any one component, that any component (regardless of where it sits in the tree) can ask for and receive the *same* shared instance. **Dependency Injection (DI)** is the mechanism Angular uses to hand a component that instance without the component having to construct it manually.

### ✅ Knowledge Check
1. In the Module 1 Dessert Shop App, which two responsibilities was `AppComponent` handling that arguably don't belong in the same class?
2. Why couldn't Module 1's `@Input()`/`@Output()` alone solve the "two unrelated components need the same cart total" problem in general?

---

## 2. What Is a Service? Why Dependency Injection?

### What is a service?

A **service** is just a TypeScript class — nothing about the language changes. What makes it useful in Angular is a convention: services hold logic and state that isn't tied to any one component's template, so it can be shared, reused, and tested independently of the UI.

```typescript
// A service, at its simplest — no different from any other class
export class LoggerService {
  log(message: string): void {
    console.log(`[LOG ${new Date().toISOString()}]`, message);
  }
}
```

### Why does Angular need Dependency Injection at all?

Without DI, a component that wants to use `LoggerService` would have to construct it itself:

```typescript
// ❌ works, but the component now owns creating and managing LoggerService
export class DessertCardComponent {
  private logger = new LoggerService();

  onAdd(): void {
    this.logger.log('Dessert added to cart');
  }
}
```

This seems harmless for one tiny service, but it causes real problems as an app grows:

- **No sharing.** Every component that does `new LoggerService()` gets its **own separate instance** — if the service is meant to hold shared state (like a cart), each component would silently get a different, disconnected copy.
- **Hard-coded dependencies.** The component is now permanently wired to *this specific* `LoggerService` class. Swapping in a different implementation (e.g., a `MockLoggerService` for testing — 🔒 testing itself is a later module, but the *architectural* problem is worth understanding now) means editing every component that constructed one directly.
- **No visibility into what a component actually needs.** Buried `new X()` calls inside methods hide a component's real dependencies; a reader has to scan the whole class body instead of seeing them declared up front.

**Dependency Injection** flips this around: instead of a component *constructing* what it needs, it *declares* what it needs (usually via the constructor), and Angular — the "injector" — is responsible for creating (or reusing) the right instance and handing it over.

```typescript
// ✅ DI: the component declares what it needs; Angular supplies it
export class DessertCardComponent {
  constructor(private logger: LoggerService) {}

  onAdd(): void {
    this.logger.log('Dessert added to cart');
  }
}
```

This pattern — a class doesn't create its own dependencies, something external provides them — is a broader software design pattern called **Inversion of Control**; DI is Angular's specific implementation of it.

### Multiple worked examples of "why DI," side by side

**Example 1 — Sharing state (the cart).** Without DI, if both `DessertListComponent` and a new `CartBadgeComponent` each did `new CartService()`, they'd have two separate carts that never agree with each other. With DI, both receive **the same instance** (assuming root-level provision, [Section 4](#4-provider-scope-providedin-root-vs-component-providers)), so adding an item in one place is immediately visible everywhere else that asks for `CartService`.

**Example 2 — Swappable implementations.** A `NotificationService` interface could be backed by a real implementation that shows toast popups, or — in a later module's testing context — a fake one that just records calls for assertions. Components that depend on `NotificationService` don't need to change at all when the underlying implementation changes; only *what Angular is told to hand out* changes.

**Example 3 — Decoupled construction logic.** A service like `DessertDataService` might one day need configuration (an API base URL, an API key) to construct itself correctly. Components that inject it don't need to know or care about any of that setup — Angular (via the provider configuration) handles it once, centrally, rather than every component that uses the service needing to know how to build it correctly.

### How does this compare to plain JavaScript/React?

| Angular | Plain JS / React |
|---|---|
| A class declares dependencies in its constructor; Angular's injector supplies them | No built-in DI system; you'd typically pass shared logic down via props, or use React Context to make a value available without prop-drilling |
| One shared service instance is available anywhere it's injected, regardless of component-tree position | React Context achieves a similar "anywhere in the subtree" sharing, but nothing quite like Angular's hierarchical injector system (Section 4) exists as a language/framework-level default |
| Swapping implementations is a matter of changing *what's provided*, not editing every consumer | Achieving the same swappability in plain JS usually means manually passing a different implementation as a prop/argument everywhere it's used |

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| `private logger = new LoggerService();` inside a component that's meant to share state via that service | Every component doing this gets its own separate instance — nothing is actually shared | Inject it via the constructor instead: `constructor(private logger: LoggerService) {}` | Angular supplies the same shared instance (per Section 4's scope rules) rather than a fresh one per component |
| Treating "service" as an Angular-specific *language* feature | A service is just a class; nothing about the `class` keyword changes | Think of "service" as a *convention/role* for a class, backed by the `@Injectable()` decorator (Section 3) | Keeps the mental model accurate: Angular adds a decorator and an injector, not a new kind of class |

### ✅ Knowledge Check
1. In your own words, what problem does Dependency Injection solve that manually calling `new SomeService()` inside every component does not?
2. What is "Inversion of Control," and how does constructor injection demonstrate it?

### 🎥 Optional Video
**Services and Dependency Injection — Angular Team (4 min)**
[Watch on YouTube](https://www.youtube.com/watch?v=-jRxG84AzCI)
**Useful for:** A concise, official-source mental model before the syntax-heavy sections below.
**Recommended when:** Right now, before Section 3 — it's short and frames everything that follows.

---

## 3. Creating and Injecting a Service

### What is `@Injectable()`?

`@Injectable()` is the decorator that marks a class as one Angular's DI system is allowed to construct and hand out. It's the service equivalent of `@Component()` for components — metadata that tells Angular "this class participates in dependency injection."

```typescript
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private quantities: Record<number, number> = {};

  getQuantities(): Record<number, number> {
    return this.quantities;
  }
}
```

- **`@Injectable({...})`** — without this decorator (or with an empty `@Injectable()`), a class *can* sometimes still be injected if it has no dependencies of its own, but the decorator is what lets Angular understand the class's **own** constructor dependencies (services this service itself needs) and is required practice regardless — always add it.
- **`providedIn: 'root'`** — tells Angular to create **one single, shared instance** for the entire application (a singleton) the first time anything injects it, and hand that same instance to every subsequent injector. This is covered fully in Section 4; for now, treat it as "the normal default for a shared service."

### Generating a service with the CLI

```bash
ng generate service cart
# short form:
ng g service cart
```

This creates `cart.service.ts` (and, depending on CLI configuration, a matching `cart.service.spec.ts` test file — 🔒 testing is outside this module) with the `@Injectable({ providedIn: 'root' })` boilerplate already in place, exactly parallel to how `ng generate component` scaffolded component files in Module 1.

### Injecting a service into a component — three equivalent examples

**Example 1 — Constructor injection (the standard pattern):**
```typescript
import { Component } from '@angular/core';
import { CartService } from '../../services/cart.service';

@Component({ /* ... */ })
export class DessertListComponent {
  constructor(private cartService: CartService) {}

  addToCart(dessertId: number): void {
    this.cartService.add(dessertId);
  }
}
```
Declaring `private cartService: CartService` as a constructor parameter is enough — Angular's injector resolves it automatically; you never write `new CartService()` yourself.

**Example 2 — Using the injected service across multiple methods:**
```typescript
export class CartBadgeComponent {
  constructor(private cartService: CartService) {}

  get itemCount(): number {
    return this.cartService.getItemCount();
  }

  clear(): void {
    this.cartService.clear();
  }
}
```
Once injected, `this.cartService` behaves like any other class property — call as many methods on it as needed, from as many places in the class as needed.

**Example 3 — A component injecting *two* services at once:**
```typescript
export class DessertListComponent {
  constructor(
    private dessertData: DessertDataService,
    private cartService: CartService
  ) {}

  readonly desserts = this.dessertData.getDesserts();

  addToCart(dessertId: number): void {
    this.cartService.add(dessertId);
  }
}
```
Constructor injection scales to as many dependencies as a class genuinely needs — each one just becomes another constructor parameter.

### Why `private` in the constructor parameter?

```typescript
constructor(private cartService: CartService) {}
```
This is TypeScript's **parameter property** shorthand — it simultaneously (1) declares a constructor parameter, and (2) creates a matching `private` class property, and (3) assigns the parameter to that property — all in one line. It's exactly equivalent to the more verbose:
```typescript
private cartService: CartService;
constructor(cartService: CartService) {
  this.cartService = cartService;
}
```
Both work identically; the shorthand is simply the near-universal Angular convention because it removes repetition.

### What happens behind the scenes?

When Angular creates a component, it looks at that component's constructor parameter types. For each one (like `CartService`), it asks its **injector** (Section 4) "do I already have an instance of this?" — if yes, it hands over the existing instance; if no, it constructs one (running that service's own constructor, resolving *its* dependencies the same way, recursively) and remembers it for next time. This lookup-or-create process is what makes singleton sharing (Example 1 in Section 2) work automatically, with no manual bookkeeping on your part.

### Try It Yourself — Experiment: proving the shared instance

```typescript
@Injectable({ providedIn: 'root' })
export class CounterService {
  count = 0;
  increment(): void { this.count++; }
}
```
Inject `CounterService` into two *unrelated* components (e.g., a header component and a footer component, with no parent/child relationship between them). Call `increment()` from one component's button, and log `count` from the other. Watch the second component's logged value update even though nothing was ever passed between them via `@Input()`/`@Output()` — direct proof that both components received the same shared instance.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| `private cartService = new CartService();` | Bypasses DI entirely — creates a private, unshared instance, defeating the whole purpose of a shared service | `constructor(private cartService: CartService) {}` | Lets Angular's injector supply the shared instance instead |
| Forgetting `@Injectable()` entirely on a service that itself injects other services | Angular can't determine the service's own constructor dependencies without the decorator's metadata, and injection fails at runtime | Always add `@Injectable({ providedIn: 'root' })` (or an appropriate scope, Section 4) | Gives Angular what it needs to construct the service correctly, including its own dependencies |
| Typing the constructor parameter as `any` or omitting the type | Angular's injector matches dependencies **by type** — without a concrete class type, there's nothing for Angular to look up | `constructor(private cartService: CartService)` with the real class as the type | The type annotation *is* the lookup key the injector uses |

### ✅ Knowledge Check
1. What three things does `private cartService: CartService` in a constructor parameter accomplish at once?
2. Why does injecting the same service into two unrelated components still give them the same data?

### 🎥 Optional Video
**Services & Dependency Injection (11 min)**
[Watch on YouTube](https://www.youtube.com/watch?v=l2WWB6_m5fI)
**Useful for:** A practical, from-scratch walkthrough of generating a service and injecting it, reinforcing this section.

---

## 4. Provider Scope: `providedIn: 'root'` vs. Component Providers

### What is a "provider," precisely?

A **provider** is the configuration that tells Angular's DI system *how* to create a value for a given dependency (most commonly: "construct this class"). `providedIn: 'root'` is the most common way to register a provider, but it isn't the only place a service can be provided — and *where* it's provided determines *how widely shared* the resulting instance is.

### The provider hierarchy, conceptually

Angular's injectors form a tree that mirrors the component tree. When a component asks for a service, Angular looks for a provider starting at that component and walking **up** toward the root, using the **first** provider it finds:

```
Root injector (app-wide)
      │
      ↓  (if not found here, keep walking down toward whichever component asked)
App component injector
      │
      ↓
DessertList component injector
      │
      ↓
DessertCard component injector   ← if DessertCard asks for a service, Angular
                                     checks here first, then walks UP toward root
```

### `providedIn: 'root'` — one instance, whole application

```typescript
@Injectable({
  providedIn: 'root'
})
export class CartService { /* ... */ }
```
This registers the provider at the **root injector**. The first time *anything, anywhere* in the app injects `CartService`, Angular creates one instance there, and every subsequent injection — regardless of which component asks, or how deep in the tree it is — receives that same instance. This is the correct choice for genuinely app-wide shared state, like the Dessert Shop's cart.

### Component-level providers — one instance per component instance

```typescript
@Component({
  selector: 'app-dessert-card',
  providers: [CardHighlightService]
})
export class DessertCardComponent {
  constructor(private highlight: CardHighlightService) {}
}
```
Listing a service in a component's own `providers: [...]` array tells Angular: "create a **new, separate instance of this service for every instance of this component**." If `DessertListComponent` renders nine `DessertCardComponent`s (via `*ngFor`, as in Module 1), each one gets its **own private** `CardHighlightService` instance — none of them share state with each other, even though they're all the "same" service class.

### Three concrete examples showing the difference in practice

**Example 1 — Root-level, correctly shared (cart total):**
```typescript
@Injectable({ providedIn: 'root' })
export class CartService {
  private quantities: Record<number, number> = {};
  add(dessertId: number): void {
    this.quantities[dessertId] = (this.quantities[dessertId] ?? 0) + 1;
  }
  getTotal(): number {
    return Object.values(this.quantities).reduce((a, b) => a + b, 0);
  }
}
```
Every component that injects `CartService` — `DessertList`, `Cart`, a hypothetical header badge — sees the **same running total**. This is exactly the behavior the Dessert Shop App needs.

**Example 2 — Component-level, correctly isolated (per-card local UI state):**
```typescript
@Injectable()
export class ExpandToggleService {
  isExpanded = false;
  toggle(): void { this.isExpanded = !this.isExpanded; }
}

@Component({
  selector: 'app-dessert-card',
  providers: [ExpandToggleService]
})
export class DessertCardComponent {
  constructor(public expandToggle: ExpandToggleService) {}
}
```
Note: `@Injectable()` here has **no** `providedIn` — when a service is only ever meant to be supplied via a component's own `providers` array, `providedIn: 'root'` would be misleading (it would *also* register a root-level singleton that most apps would never intentionally use directly). Each `DessertCardComponent` gets its own `ExpandToggleService`, so expanding one dessert's detail view doesn't affect any other card's expanded state. This is the "scenario where you might not want a singleton" the module's own discussion prompt asks about.

**Example 3 — What goes wrong if these two are mixed up:**
If `CartService` were mistakenly given a component-level provider on `DessertCardComponent` instead of `providedIn: 'root'`, every single dessert card would get its **own separate cart**, each starting at zero — clicking "Add to Cart" on the Tiramisu card would never be visible to the shared `Cart` sidebar panel, because they'd no longer be the same instance. Conversely, if `ExpandToggleService` were made `providedIn: 'root'`, expanding *any one* dessert card's details would expand *all* of them simultaneously, since they'd all be reading/writing the same shared `isExpanded` flag.

### A simple decision rule

> **Ask: "If I have 9 of this component on screen at once, should they share one instance of this service, or should each have its own?"**
> Shared → `providedIn: 'root'` (or a shared ancestor's `providers` array).
> Own → that specific component's own `providers` array.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Putting shared state (like a cart) in a component-level `providers` array | Every instance of that component gets an isolated copy — nothing is actually shared across the app | Use `providedIn: 'root'` for genuinely shared/global state | Registers exactly one instance for the whole application |
| Making genuinely per-instance state (like a single card's expanded/collapsed flag) `providedIn: 'root'` | All instances end up reading/writing the same shared flag — toggling one toggles all of them | Provide it in that component's own `providers: [...]` array instead | Gives each component instance its own separate service instance |
| Assuming a component-level provider is visible to *sibling* components, not just that component and its own children | Component-level providers are only visible to the providing component and its descendants in the tree — not siblings, not ancestors | Provide at the lowest **common ancestor** if multiple related components need to share one instance | Matches the provider's visibility to exactly the part of the tree that needs it |

### ✅ Knowledge Check
1. If a service is provided in a component's own `providers` array, and that component is used nine times via `*ngFor`, how many instances of the service exist?
2. Describe, in the module's own words, a scenario where you would *not* want a service to be a singleton.

### 🎥 Optional Video
**Angular 20 Dependency Injection for Beginners (24 min)**
[Watch on YouTube](https://www.youtube.com/watch?v=6xYJK-Ih3bU)
**Useful for:** A step-by-step tutorial covering providers and injectors in more depth than the summary above.
**Recommended when:** After reading this section once — the video's pacing works well as reinforcement rather than a first introduction.

---

## 5. Refactoring Component Logic Into a Service

This section is deliberately example-heavy and "before/after" in structure, since **refactoring existing component logic into a service** is explicitly this module's core hands-on skill (and the entire second half of the Dessert Shop lab).

### The problem, concretely (Module 1's `AppComponent`)

Recall Module 1's root component:
```typescript
export class AppComponent {
  readonly desserts: Dessert[];
  quantities: Record<number, number> = {};
  isOrderConfirmed = false;

  constructor(private readonly dessertData: DessertDataService) {
    this.desserts = this.dessertData.getDesserts();
  }

  get cartLines(): CartLine[] { /* ... */ }
  get orderTotal(): number { /* ... */ }
  addToCart(dessert: Dessert): void { /* ... */ }
  incrementQuantity(dessert: Dessert): void { /* ... */ }
  decrementQuantity(dessert: Dessert): void { /* ... */ }
  removeFromCart(dessert: Dessert): void { /* ... */ }
  confirmOrder(): void { /* ... */ }
  startNewOrder(): void { /* ... */ }
}
```
`DessertDataService` was already a service (Module 1 used one purely to avoid hard-coding data in a template). Everything else — the cart's quantities, the derived totals, and every method that mutates the cart — is genuinely **business logic that has nothing to do with being a component**. None of it touches a template directly; it's all plain data and methods that *components happen to display*. That's the signal that it belongs in a service.

### Example 1 — Extracting cart state and logic into `CartService`

**Before (inside `AppComponent`):**
```typescript
quantities: Record<number, number> = {};

addToCart(dessert: Dessert): void {
  this.quantities = { ...this.quantities, [dessert.id]: 1 };
}

incrementQuantity(dessert: Dessert): void {
  const current = this.quantities[dessert.id] ?? 0;
  this.quantities = { ...this.quantities, [dessert.id]: current + 1 };
}
```

**After (a new `CartService`):**
```typescript
import { Injectable } from '@angular/core';
import { Dessert, CartLine } from '../models/dessert.model';

@Injectable({ providedIn: 'root' })
export class CartService {
  private quantities: Record<number, number> = {};

  addToCart(dessert: Dessert): void {
    this.quantities = { ...this.quantities, [dessert.id]: 1 };
  }

  incrementQuantity(dessert: Dessert): void {
    const current = this.quantities[dessert.id] ?? 0;
    this.quantities = { ...this.quantities, [dessert.id]: current + 1 };
  }

  decrementQuantity(dessert: Dessert): void {
    const current = this.quantities[dessert.id] ?? 0;
    if (current <= 1) {
      this.removeFromCart(dessert);
      return;
    }
    this.quantities = { ...this.quantities, [dessert.id]: current - 1 };
  }

  removeFromCart(dessert: Dessert): void {
    const updated = { ...this.quantities };
    delete updated[dessert.id];
    this.quantities = updated;
  }

  getCartLines(desserts: Dessert[]): CartLine[] {
    return desserts
      .filter((d) => (this.quantities[d.id] ?? 0) > 0)
      .map((d) => ({ dessert: d, quantity: this.quantities[d.id] }));
  }

  getOrderTotal(desserts: Dessert[]): number {
    return this.getCartLines(desserts).reduce(
      (sum, line) => sum + line.quantity * line.dessert.price,
      0
    );
  }

  clear(): void {
    this.quantities = {};
  }
}
```

**`AppComponent` after the refactor — now much smaller:**
```typescript
export class AppComponent {
  readonly desserts: Dessert[];
  isOrderConfirmed = false;

  constructor(
    private readonly dessertData: DessertDataService,
    private readonly cart: CartService
  ) {
    this.desserts = this.dessertData.getDesserts();
  }

  get cartLines(): CartLine[] {
    return this.cart.getCartLines(this.desserts);
  }

  get orderTotal(): number {
    return this.cart.getOrderTotal(this.desserts);
  }

  addToCart(dessert: Dessert): void {
    this.cart.addToCart(dessert);
  }

  confirmOrder(): void {
    if (this.cartLines.length === 0) return;
    this.isOrderConfirmed = true;
  }

  startNewOrder(): void {
    this.cart.clear();
    this.isOrderConfirmed = false;
  }
}
```
`AppComponent` now only holds what's genuinely about *being the root component* (which dessert catalog to show, whether the confirmation modal is open) — every cart-specific rule lives in `CartService`, reusable by any future component without touching `AppComponent` at all.

### Example 2 — What this unlocks: a header cart badge with zero new plumbing

Before this refactor, showing a live cart-item count in a totally separate header component would have required either duplicating cart logic or threading it through `@Input()` from a shared ancestor. After the refactor:

```typescript
@Component({
  selector: 'app-cart-badge',
  template: `<span class="badge">{{ itemCount }}</span>`
})
export class CartBadgeComponent {
  constructor(private cart: CartService) {}

  get itemCount(): number {
    // Note: a real getItemCount() would need access to the desserts array too,
    // or CartService could track quantities-by-id directly without needing it —
    // simplified here to illustrate the DI point, not the exact method signature.
    return Object.keys((this.cart as any).quantities ?? {}).length;
  }
}
```
This component can be placed **anywhere** in the tree — it has no parent/child relationship with `DessertList` or `Cart` at all — and it still reflects the live cart state, because it's injecting the exact same `CartService` singleton. This is the concrete payoff of Section 2's "why DI" discussion, now demonstrated end to end.

### Example 3 — A second, independent refactor: extracting order-confirmation logic

```typescript
@Injectable({ providedIn: 'root' })
export class OrderService {
  isOrderConfirmed = false;

  confirmOrder(hasItems: boolean): void {
    if (!hasItems) return;
    this.isOrderConfirmed = true;
  }

  startNewOrder(): void {
    this.isOrderConfirmed = false;
  }
}
```
This shows the refactor isn't a one-time, one-service event — any cohesive chunk of non-template logic is a candidate. A real Dessert Shop Part II might reasonably end up with `DessertDataService`, `CartService`, and possibly a small `OrderService`, each responsible for one clear thing.

### A checklist for "should this move into a service?"

- Does it hold **data** that more than one component might need (now or later)? → service.
- Is it **business logic** (rules about how the cart total is computed, how quantities change) rather than **presentation logic** (how something looks, when to show a `*ngIf` block)? → service.
- Would a **unit test** for this logic need a rendered template to run? If not, it doesn't belong in a component. (🔒 writing that test is a later module, but the question is a useful smell test now.)
- Is it purely about *this one component's own template* (e.g., "is this specific card's detail view expanded")? → probably stays in the component, or becomes a component-provided service (Section 4) at most.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| Moving *all* component state into services indiscriminately, including things like "is this dropdown open" | Over-engineers simple, component-local UI state that never needs to be shared | Keep genuinely local, presentation-only state in the component | Services are for shared/reusable logic, not a replacement for all component properties |
| Forgetting to update the constructor injection after extracting a service | Component still references its old, now-deleted local properties/methods, causing compile errors | Update the constructor to inject the new service, and replace method bodies with calls into it | Keeps the component's public API stable while its internals change |
| Copy-pasting cart logic into a new component instead of extracting a service | Two separate copies of the same logic now have to be kept in sync manually, defeating the purpose of the refactor | Extract once into `CartService`, inject it wherever needed | One source of truth, reused everywhere |

### Exercises

**Level 1 — Basic:** Take a component with a `favoriteCount = 0` property and an `incrementFavorites()` method, and extract both into a new `FavoritesService` (`providedIn: 'root'`), updating the component to inject and use it.

**Level 2 — Practical:** Extract a `SearchService` that holds a `searchTerm: string` and a `setSearchTerm(term: string)` method from a search-box component, then inject that same service into a *second*, unrelated component that displays "Currently searching for: …" — proving the shared-instance behavior end to end.

**Level 3 — Challenge:** Fully perform the `CartService` refactor shown above on your own Module 1 Dessert Shop App: move all cart-quantity state and methods out of `AppComponent` into a new `CartService`, update `AppComponent` to inject it, and confirm the app behaves identically to before the refactor (adding, incrementing, decrementing, removing, and confirming an order should all still work).

### ✅ Knowledge Check
1. What's the practical difference between "business logic" and "presentation logic," using the Dessert Shop as an example of each?
2. Why does moving cart logic into `CartService` make a brand-new `CartBadgeComponent` easy to build later, when it wouldn't have been before the refactor?

---

## 6. `@Inject` and Injection Tokens

### The problem this solves

Constructor injection so far has always used a **class** as the lookup key:
```typescript
constructor(private cartService: CartService) {}
```
This works because `CartService` is a real class/type that both exists at runtime and can serve as a unique identifier. But sometimes what you want to inject **isn't a class** — a plain string, a number, a configuration object, or a browser global — and TypeScript types (like `string` or `interface Config {...}`) don't exist at runtime the way classes do, so they can't be used as an injection lookup key by themselves.

### `InjectionToken` — creating a lookup key for non-class values

```typescript
import { InjectionToken } from '@angular/core';

export interface AppConfig {
  apiBaseUrl: string;
  currency: string;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('app.config');
```
`APP_CONFIG` is a unique, runtime-existing token that can now be used as a DI lookup key, with `AppConfig` as its associated TypeScript type for full type-checking wherever it's injected.

### Providing a value for a token

```typescript
// In the app's bootstrap configuration (app.config.ts)
import { ApplicationConfig } from '@angular/core';
import { APP_CONFIG } from './app-config.token';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: APP_CONFIG, useValue: { apiBaseUrl: 'https://api.example.com', currency: 'USD' } }
  ]
};
```
`{ provide: APP_CONFIG, useValue: {...} }` is a more explicit form of the provider concept from Section 4 — instead of Angular constructing a class, it simply hands out the exact value given.

### Injecting a token with `@Inject`

```typescript
import { Component, Inject } from '@angular/core';
import { APP_CONFIG, AppConfig } from './app-config.token';

@Component({ /* ... */ })
export class DessertListComponent {
  constructor(@Inject(APP_CONFIG) private config: AppConfig) {
    console.log('API base URL:', this.config.apiBaseUrl);
  }
}
```
`@Inject(APP_CONFIG)` is required here — without it, Angular would try to use the *type* `AppConfig` (an interface, which doesn't exist at runtime) as the lookup key and fail. `@Inject(TOKEN)` explicitly tells Angular "use this token as the lookup key," while `: AppConfig` still gives you full compile-time type-checking on the injected value.

### Three quick examples of when this comes up

**Example 1 — App-wide configuration** (as above): an API base URL, feature flags, environment name.

**Example 2 — Wrapping a browser global for testability** (a common real-world pattern, shown here at a beginner level):
```typescript
export const WINDOW = new InjectionToken<Window>('window');
// provided once, e.g.: { provide: WINDOW, useValue: window }

export class ThemeService {
  constructor(@Inject(WINDOW) private windowRef: Window) {
    const prefersDark = this.windowRef.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
```
This lets `ThemeService` depend on "a Window" rather than reaching for the true global directly, which — 🔒 in a later module covering testing — makes it possible to substitute a fake window in tests.

**Example 3 — A simple constant, for contrast with a class-based service:**
```typescript
export const MAX_CART_ITEMS = new InjectionToken<number>('max.cart.items');
// provided as: { provide: MAX_CART_ITEMS, useValue: 50 }

export class CartService {
  constructor(@Inject(MAX_CART_ITEMS) private maxItems: number) {}
}
```

### When to use this vs. a plain class-based service

- A class with its own behavior (methods, internal state) → keep using plain constructor injection with the class as the type (Sections 3–5) — this covers the large majority of this module's needs, including `CartService` and `DessertDataService`.
- A plain **value** (config object, string, number) with no behavior of its own → `InjectionToken` + `@Inject`.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| `constructor(private config: AppConfig) {}` where `AppConfig` is an interface | Interfaces don't exist at runtime — Angular has nothing to look up, and this fails at compile/runtime | `constructor(@Inject(APP_CONFIG) private config: AppConfig) {}` | Uses the runtime-existing `InjectionToken` as the lookup key, with the interface only for compile-time typing |
| Creating a new `InjectionToken` for something that's really just a class-based service's job | Adds unnecessary indirection when a plain injectable class would do the same job more simply | Reserve `InjectionToken` for genuinely non-class values | Keeps the simpler, more common pattern (Sections 3–5) as the default |
| Forgetting to actually provide a value for a token anywhere | Angular has a token to look up but no registered value for it, causing an injection error at runtime | Add a `{ provide: TOKEN, useValue: ... }` entry to some provider array (root config or a component's `providers`) | Every token needs a matching provider somewhere in the hierarchy, exactly like a class does |

### ✅ Knowledge Check
1. Why can't an interface be used directly as a dependency-injection lookup key the way a class can?
2. What does `@Inject(TOKEN)` accomplish that the type annotation alone cannot?

---

## 7. Services for Async Data: `HttpClient`

### What is it?

`HttpClient` is Angular's built-in service for making HTTP requests (GET, POST, PUT, DELETE, etc.) to a backend API. It's provided by Angular itself — you inject it into your *own* services exactly like you'd inject any other service.

### Why does Angular need a special HTTP service, instead of using the browser's `fetch` directly?

You *could* use `fetch` directly, but `HttpClient` gives you, out of the box:
- **Automatic JSON parsing** — no manual `.json()` call needed.
- **Observables** (see below) instead of raw Promises, which integrate directly with Angular's change-detection story and (🔒 in later modules) RxJS's much larger toolkit of operators.
- **Typed responses** — you can tell `HttpClient` what shape to expect back, and TypeScript will check your code against it.
- Centralized, consistent error handling and (🔒 later module) the ability to plug in interceptors for things like auth headers, applied to every request automatically.

### The absolute minimum of Observables you need for this module

`HttpClient` methods (`.get()`, `.post()`, etc.) return an **Observable** — think of it, for now, as "a value that arrives later, which you must explicitly `.subscribe()` to in order to receive." This is similar in spirit to a Promise's `.then()`, with one crucial practical difference this module needs you to know: **nothing happens until you call `.subscribe()`.** Calling `.get(...)` alone does not send the request.

```typescript
this.http.get<Dessert[]>('/api/desserts').subscribe((desserts) => {
  console.log('Received:', desserts);
});
```
🔒 Combining, transforming, and canceling Observables with RxJS operators (`map`, `switchMap`, `debounceTime`, and so on) is a large topic reserved for a later module. For Module 3, "call `.subscribe()` to actually fire the request and receive the result" is enough.

### Setting up `HttpClient` (once, at the app level)

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient()
  ]
};
```
`provideHttpClient()` registers `HttpClient` with the root injector, application-wide — done once, in the app's bootstrap configuration, never per-component.

### Example 1 — A `GET` request inside a service (the standard pattern)

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dessert } from '../models/dessert.model';

@Injectable({ providedIn: 'root' })
export class DessertDataService {
  private readonly apiUrl = 'https://api.example.com/desserts';

  constructor(private http: HttpClient) {}

  getDesserts(): Observable<Dessert[]> {
    return this.http.get<Dessert[]>(this.apiUrl);
  }
}
```
- **`private http: HttpClient`** — injected exactly like any other service, per Section 3.
- **`this.http.get<Dessert[]>(this.apiUrl)`** — the `<Dessert[]>` generic tells TypeScript what shape to expect in the response, so consumers get full autocomplete/type-checking on the result.
- **Returns an `Observable<Dessert[]>`, not a `Dessert[]` directly** — this is a meaningful, deliberate change from Module 1's `DessertDataService`, which returned a plain array synchronously. Real data from a server is never available *immediately* — it takes network time — so the method's signature must honestly reflect "this arrives later."

### Example 2 — Consuming that Observable in a component

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { DessertDataService } from '../../services/dessert-data.service';
import { Dessert } from '../../models/dessert.model';

@Component({ /* ... */ })
export class DessertListComponent implements OnInit, OnDestroy {
  desserts: Dessert[] = [];
  isLoading = true;
  errorMessage: string | null = null;

  private subscription?: Subscription;

  constructor(private dessertData: DessertDataService) {}

  ngOnInit(): void {
    this.subscription = this.dessertData.getDesserts().subscribe({
      next: (desserts) => {
        this.desserts = desserts;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Could not load desserts. Please try again.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
```
Notice how this weaves together concepts from **every** module so far:
- `ngOnInit` (Module 1/2) is the right place to *start* the request — it's one-time setup, not something that should re-fire on every change-detection cycle.
- The subscription is stored and explicitly cleaned up in `ngOnDestroy` (Module 2, Section 8) — an HTTP request that's still pending when a component is destroyed (e.g., the user navigated away quickly) would otherwise try to update a component that no longer exists.
- `isLoading`/`errorMessage` are plain component properties, displayed with `*ngIf` (Module 1) in the template — `HttpClient` doesn't change anything about how you *display* state, only how you *obtain* it.

```html
<p *ngIf="isLoading">Loading desserts…</p>
<p *ngIf="errorMessage" role="alert">{{ errorMessage }}</p>
<ul *ngIf="!isLoading && !errorMessage">
  <li *ngFor="let dessert of desserts">{{ dessert.name }}</li>
</ul>
```

### Example 3 — `POST`, `PUT`, and `DELETE`, side by side

```typescript
@Injectable({ providedIn: 'root' })
export class OrderApiService {
  private readonly apiUrl = 'https://api.example.com/orders';

  constructor(private http: HttpClient) {}

  submitOrder(order: { items: CartLine[]; total: number }): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(this.apiUrl, order);
  }

  updateOrder(orderId: string, order: { items: CartLine[]; total: number }): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${orderId}`, order);
  }

  cancelOrder(orderId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${orderId}`);
  }
}
```
- **`.post(url, body)`** — sends `body` as JSON in the request; `HttpClient` sets the `Content-Type` header automatically.
- **`.put(url, body)`** — same shape as `post`, conventionally used for "replace this existing resource entirely."
- **`.delete(url)`** — no body needed for a typical delete-by-id request.

All three, exactly like `.get()`, return Observables and **do nothing until `.subscribe()`'d**:
```typescript
this.orderApi.submitOrder({ items: this.cartLines, total: this.orderTotal }).subscribe({
  next: (response) => console.log('Order created with id:', response.id),
  error: (err) => console.error('Order submission failed', err)
});
```

### Example 4 — A component-facing service hiding all HTTP details

A key benefit of always putting `HttpClient` calls inside a service (never directly in a component) is that components stay simple and swappable:
```typescript
// Component never sees HttpClient, Observables of raw HTTP responses, or URLs —
// only a clean method that returns exactly the data it needs.
export class DessertListComponent implements OnInit {
  desserts: Dessert[] = [];
  constructor(private dessertData: DessertDataService) {}
  ngOnInit(): void {
    this.dessertData.getDesserts().subscribe((desserts) => (this.desserts = desserts));
  }
}
```
If the data source later changes — a different API, or (as in Module 1) a hard-coded array during early development — only `DessertDataService`'s internals need to change; every component injecting it keeps working unmodified. This is Section 2's "swappable implementations" benefit, made concrete.

### When to use `HttpClient`

- Any time real data comes from a server rather than being hard-coded — this is the natural evolution of Module 1's `DessertDataService`, which used a hard-coded array specifically because HTTP was out of scope at the time.

### When *not* to overuse it

- Don't inject `HttpClient` directly into components. Always wrap it in a service (Examples 1–2 above) — this keeps HTTP/URL details out of components entirely and is considered a firm best practice, not a stylistic preference.
- Don't forget to `.subscribe()` — an Observable that's never subscribed to never actually sends its request, a surprisingly common early mistake.

### 🔒 Coming Later — Outside This Module

- RxJS operators (`map`, `catchError`, `switchMap`, `debounceTime`, and the rest of the operator library) for transforming/combining/canceling Observables.
- HTTP interceptors (for attaching auth tokens or logging to every request automatically).
- Authentication flows built on top of `HttpClient`.
- Testing services that use `HttpClient` with `HttpTestingController`.

### Try It Yourself — Experiment: loading state end to end

Using any public test API (for example, `https://jsonplaceholder.typicode.com/users`), build a tiny service + component pair following Example 1–2 above: a service method returning `Observable<User[]>`, and a component that sets `isLoading = true` before subscribing, flips it to `false` in both the `next` and `error` callbacks, and displays a loading message, an error message, or the resulting list depending on state. This single exercise exercises `HttpClient`, Observables/`subscribe`, and the `*ngIf` patterns from Module 1 together.

### 🐞 Common Mistakes

| Wrong | Why it fails | Correct | Why it works |
|---|---|---|---|
| `this.http.get(this.apiUrl);` with no `.subscribe(...)` | The request is never actually sent — Observables are "lazy" and do nothing until subscribed | `this.http.get(this.apiUrl).subscribe(...)` | Subscribing is what actually triggers the HTTP call |
| Injecting `HttpClient` directly into a component and calling `.get()` there | Leaks URLs/HTTP details into components, and duplicates request logic if more than one component needs the same data | Wrap the call in a service method (`DessertDataService.getDesserts()`); inject the service, not `HttpClient`, into components | Keeps a single, reusable, testable place responsible for each API call |
| Never unsubscribing a long-lived subscription in a component that can be destroyed while the request is still pending | Can attempt to update a destroyed component's properties, and is a memory-leak pattern directly analogous to the uncancelled `setInterval` from Module 2 | Store the `Subscription` and call `.unsubscribe()` in `ngOnDestroy` | Matches Module 2's cleanup pattern — an HTTP subscription is just another resource that outlives the component unless explicitly cleaned up |
| Assuming `.get<Dessert[]>(...)`'s generic type performs runtime validation | The generic is a TypeScript-only, compile-time annotation — it does **not** check that the server actually returned that shape at runtime | Treat the generic as documentation/tooling support, not a guarantee; handle unexpected shapes defensively if the API isn't fully trusted | Keeps expectations accurate about what TypeScript generics can and can't verify |

### ✅ Knowledge Check
1. What actually happens if you call `this.http.get(url)` but never call `.subscribe()` on the result?
2. Why should `HttpClient` be injected into a service rather than directly into a component?
3. Why does an HTTP subscription need cleanup in `ngOnDestroy`, using the same reasoning as Module 2's `setInterval` example?

### 🎥 Optional Video
**Angular HttpClient Crash Course (38 min)**
[Watch on YouTube](https://www.youtube.com/watch?v=ZmH3DKkahLE)
**Useful for:** A full practical walkthrough of fetching and displaying data from an API using `HttpClient` inside a service.

**Angular HTTP Client — GET POST PUT DELETE (34 min)**
[Watch on YouTube](https://www.youtube.com/watch?v=ezwqhbTQcLc)
**Useful for:** Seeing all four HTTP methods used together against a backend, reinforcing Example 3 above.

---

## 8. Putting It Together: Dessert Shop App (Part II) Architecture

```
CartService (providedIn: 'root' — one instance, whole app)
 │  - holds: quantities: Record<number, number>
 │  - methods: addToCart, incrementQuantity, decrementQuantity, removeFromCart,
 │             getCartLines(desserts), getOrderTotal(desserts), clear
 │
DessertDataService (providedIn: 'root')
 │  - Module 1: getDesserts(): Dessert[]                (hard-coded array)
 │  - Module 3: getDesserts(): Observable<Dessert[]>    (HttpClient-backed)
 │
OrderService (providedIn: 'root', optional split from AppComponent)
 │  - holds: isOrderConfirmed
 │  - methods: confirmOrder(hasItems), startNewOrder()

AppComponent (root)
 │  - injects: DessertDataService, CartService, (optionally) OrderService
 │  - no longer owns cart quantities directly — delegates to CartService
 │  - subscribes to getDesserts() in ngOnInit; unsubscribes in ngOnDestroy
 │
 ├── DessertListComponent  → DessertCardComponent (unchanged from Module 1's
 │                            @Input()/@Output() contract — services replace
 │                            *where AppComponent's data comes from*, not how
 │                            AppComponent talks to its own children)
 │
 ├── CartComponent          (unchanged @Input()/@Output() contract)
 │
 └── (new, made possible by the refactor) CartBadgeComponent
       - injects CartService directly — no @Input() needed at all,
         despite having no parent/child relationship with DessertList or Cart
```

**The key architectural shift from Module 1:** `AppComponent`'s job changes from "own the cart state and dessert data directly" to "wire together services and pass their data down to children via the same `@Input()`/`@Output()` contracts Module 1 already established." Nothing about how `DessertCard` or `Cart` receive data changes at all — the refactor is entirely about *where the source of truth lives*, not how it reaches the templates.

---

## 9. Final Module Project: Dessert Shop App (Part II)

### Project Requirements

Refactor your Module 1 Dessert Shop App so its dessert data and cart logic live in services, and (if your environment provides a backend/mock API) fetch dessert data over HTTP instead of from a hard-coded array.

### Functional Requirements

1. Extract all cart-quantity state and cart-mutating logic out of `AppComponent` into a new `CartService`, provided in root.
2. Update `AppComponent` to inject `CartService` and delegate every cart operation to it, keeping its own class free of direct quantity bookkeeping.
3. Confirm the app's behavior is unchanged end to end (adding, incrementing, decrementing, removing, confirming, starting a new order) after the refactor — this is a refactor, not a feature change.
4. Update `DessertDataService.getDesserts()` to return `Observable<Dessert[]>` via `HttpClient` against a real or mock API endpoint (a simple `json-server` mock, a static JSON file served over HTTP, or any small public API adapted to this shape are all acceptable).
5. Update whichever component calls `getDesserts()` to handle the loading and error states explicitly (`isLoading`, `errorMessage`), using `*ngIf` to show the right UI for each state.
6. Properly store and clean up the HTTP subscription in `ngOnDestroy`.
7. (Optional but encouraged) Build a small `CartBadgeComponent`, placed somewhere with **no** parent/child relationship to `DessertList` or `Cart`, that injects `CartService` directly and displays a live item count — a direct demonstration that the refactor actually achieved cross-component sharing without prop-drilling.

### Suggested Service/Component Structure

```
services/
├── dessert-data.service.ts   (now HTTP-backed)
└── cart.service.ts           (new — extracted from AppComponent)

components/
├── app (root)                (slimmed down; delegates to services)
├── dessert-list / dessert-card   (unchanged @Input()/@Output() contracts)
├── cart                          (unchanged @Input()/@Output() contract)
└── cart-badge (optional, new)    (injects CartService directly)
```

### Required Angular Concepts (checklist)

- [ ] At least one new `@Injectable({ providedIn: 'root' })` service beyond Module 1's `DessertDataService`
- [ ] Constructor injection used to obtain every service a component needs
- [ ] A clear, correct choice of `providedIn: 'root'` (shared/global state) vs. any component-level `providers` used (per-instance state, if applicable to your extensions)
- [ ] `HttpClient` injected into a service (never directly into a component) for real async data
- [ ] Correct `.subscribe()` usage, including a `next`/`error` split
- [ ] Subscription stored and released in `ngOnDestroy`
- [ ] `*ngIf` used for loading/error/loaded states

### Acceptance Criteria

- All Module 1 functionality still works identically after the refactor.
- No component directly instantiates a service with `new`.
- `AppComponent` no longer contains cart-quantity bookkeeping logic directly.
- The dessert catalog loads asynchronously, with a visible loading state before data arrives and a visible error state if the request fails (test this by temporarily pointing at a bad URL).
- If built, `CartBadgeComponent` correctly reflects cart changes made from `DessertCard`/`DessertList`, despite no direct component relationship between them.

### Hints (if stuck)

- Do the `CartService` extraction **first**, and fully verify the app still works, *before* touching `HttpClient` — refactoring two things at once makes it much harder to isolate what broke if something does.
- If `CartBadgeComponent` doesn't seem to update, double check `CartService` is `providedIn: 'root'` and not accidentally re-provided in a component's own `providers` array somewhere in the tree (Section 4) — a stray component-level provider is the most common reason "shared" state mysteriously isn't shared.
- If nothing happens when you expect an HTTP call to fire, check for a missing `.subscribe()` first — it's the single most common reason "nothing happens."

### Optional Stretch Challenges

- Add `submitOrder`/`cancelOrder` methods to a new `OrderApiService` using `.post()`/`.delete()`, wiring "Confirm Order" to actually submit to your mock API.
- Use an `InjectionToken` to inject a small `AppConfig` (API base URL) into `DessertDataService` instead of hard-coding the URL string directly in the service.
- Add a second, independent service-backed feature (e.g., a `RecentlyViewedService` tracking the last few desserts a user clicked into) to practice the "should this be a service?" checklist from Section 5 on a feature you design yourself.

---

## 10. Quick Reference Sheet

### Service & DI Syntax
```
@Injectable({ providedIn: 'root' })     Registers one shared instance app-wide
@Injectable()                            No providedIn — must be listed in some
                                          component's own `providers: [...]`
class MyService { ... }

constructor(private myService: MyService) {}   Constructor injection
```

### CLI
```
ng generate service <name>
ng g service <name>                      Shorthand
```

### Provider Scope Decision Rule
```
"If there are 9 instances of this component on screen, should they
 share ONE instance of this service, or should each get its OWN?"

 Shared  → providedIn: 'root' (or a common ancestor's `providers` array)
 Own     → that specific component's own `providers: [...]` array
```

### Injection Tokens (for non-class dependencies)
```
export const TOKEN = new InjectionToken<Type>('description');
{ provide: TOKEN, useValue: someValue }          // registering a value
constructor(@Inject(TOKEN) private thing: Type) {}   // injecting it
```

### HttpClient
```
provideHttpClient()                       Registered once, at app bootstrap

constructor(private http: HttpClient) {}  Injected into a SERVICE, not a component

this.http.get<T>(url)                     Returns Observable<T> — GET
this.http.post<T>(url, body)              Returns Observable<T> — POST
this.http.put<T>(url, body)               Returns Observable<T> — PUT
this.http.delete<T>(url)                  Returns Observable<T> — DELETE

observable.subscribe({                    Nothing happens until you subscribe
  next: (value) => { ... },
  error: (err) => { ... }
});

// Cleanup, mirroring Module 2's ngOnDestroy pattern:
private subscription?: Subscription;
ngOnDestroy(): void { this.subscription?.unsubscribe(); }
```

### Important Terminology

| Term | Definition |
|---|---|
| **Service** | A class holding shared logic/state, independent of any one component. |
| **`@Injectable()`** | The decorator marking a class as participating in Angular's DI system. |
| **Dependency Injection (DI)** | The mechanism by which a class declares dependencies (typically via its constructor) and an external injector supplies them. |
| **Injector** | The part of Angular responsible for creating/reusing and handing out service instances. |
| **Provider** | Configuration telling an injector *how* to produce a value for a given dependency. |
| **`providedIn: 'root'`** | Registers a provider at the application's root injector — one singleton, shared everywhere. |
| **Component-level provider** | A provider listed in a specific component's own `providers: [...]` array — a new instance per component instance. |
| **Singleton** | A single, shared instance used everywhere it's requested. |
| **`InjectionToken`** | A runtime-existing lookup key for injecting non-class values (config, primitives). |
| **`@Inject(TOKEN)`** | Explicitly tells Angular which token to use as the lookup key for a constructor parameter. |
| **`HttpClient`** | Angular's built-in service for making HTTP requests, returning Observables. |
| **Observable** | A representation of a value that arrives later; does nothing until `.subscribe()`'d. |
| **`.subscribe()`** | Triggers an Observable's underlying work (e.g., actually sending an HTTP request) and receives its result(s). |

### 🔒 Coming Later — Outside This Module
RxJS operators (`map`, `catchError`, `switchMap`, `debounceTime`, etc.) · HTTP interceptors · Authentication · NgRx/global state management libraries · Testing services with `HttpTestingController`/mocks/spies · Routing-scoped providers

---

## 11. Source & Resource Mapping

| Module Topic | Source Resource | Knowledge Extracted |
|---|---|---|
| Why services/DI exist | dev.to — "Understanding Angular Dependency Injection" | The core DI rationale, Inversion of Control framing |
| DI mechanism, provider hierarchy | Angular University — "Angular Dependency Injection" | How Angular's injector tree resolves dependencies |
| Services/DI overview (official) | YouTube — Angular Team, "Services and Dependency Injection" (4 min) | Foundational framing used to open Section 2 |
| Creating/injecting a service | YouTube — "Services & Dependency Injection" (11 min) | Practical CLI + constructor-injection walkthrough |
| `providedIn`, provider scopes, advanced patterns | javascript.plainenglish.io — "Mastering Dependency Injection in Angular 2025" | `providedIn: 'root'` vs. component providers, decision framing used in Section 4 |
| DI best practices/examples | Medium — "Mastering Dependency Injection in Angular: Best Practices and Examples" | Supporting examples for provider-scope decisions |
| Provider/injector deep dive (video) | YouTube — "Angular 20 Dependency Injection for Beginners" (24 min) | Reinforcement material for Section 4 |
| `@Inject`/injection tokens | YouTube — "Angular service injection with @Inject Decorator" (11 min) | Section 6's non-class dependency pattern |
| `HttpClient` setup and usage | Angular.io — "Communicating with backend services using HTTP" (v17) | `provideHttpClient()`, `HttpClient` methods, Observable-based responses |
| `HttpClient` practical walkthrough | YouTube — "Angular HttpClient Crash Course" (38 min) | Section 7's GET example pattern |
| Full CRUD with `HttpClient` | YouTube — "Angular HTTP Client - GET POST PUT DELETE" (34 min) | Section 7's POST/PUT/DELETE example pattern |

**Quick links for deeper reading (optional, not required to complete this module):**
- [Understanding Angular Dependency Injection — dev.to](https://dev.to/artem_turlenko/understanding-angular-dependency-injection-how-it-works-best-practice-2j68)
- [Angular Dependency Injection — Angular University](https://blog.angular-university.io/angular-dependency-injection/)
- [Mastering Dependency Injection in Angular 2025 — javascript.plainenglish.io](https://javascript.plainenglish.io/mastering-dependency-injection-in-angular-2025-the-complete-developer-guide-e8c56af9dc55)
- [Communicating with backend services using HTTP — Angular.io](https://v17.angular.io/guide/understanding-communicating-with-http)
- [Services and Dependency Injection — YouTube (Angular Team)](https://www.youtube.com/watch?v=-jRxG84AzCI)
- [Services & Dependency Injection — YouTube](https://www.youtube.com/watch?v=l2WWB6_m5fI)
- [Angular 20 Dependency Injection for Beginners — YouTube](https://www.youtube.com/watch?v=6xYJK-Ih3bU)
- [Angular HttpClient Crash Course — YouTube](https://www.youtube.com/watch?v=ZmH3DKkahLE)
- [Angular HTTP Client - GET POST PUT DELETE — YouTube](https://www.youtube.com/watch?v=ezwqhbTQcLc)

---

### Discussion Prompt (from the original module)

> What is the difference between providing a service in root (using `@Injectable({ providedIn: 'root' })`) versus adding it to the `providers` array of a specific component? Describe a scenario where you might not want a service to be a singleton.

Section 4 answers this directly — `providedIn: 'root'` creates exactly one shared instance for the whole application, while a component-level `providers` entry creates a fresh instance per instance of that component. Use the `ExpandToggleService` example (each dessert card's own expand/collapse state) as your "not a singleton" scenario, or describe an equivalent one from your own extensions to the app, in your own words.
