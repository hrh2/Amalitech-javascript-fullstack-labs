# FEM11 TA Review Prep — Services & Dependency Injection

Prep notes for the Dessert Shop App (Part II) live code review. Written against what was
actually built in `dessert-shop-app/`, not a generic description of the concepts.

---

## 1. Lab Overview

**What the Dessert Shop App is:** a product-list-with-cart storefront (Frontend Mentor's
"Product list with cart" challenge). Shoppers browse a catalog of desserts, filter/sort it,
add items to a cart, adjust quantities with a stepper, review a running total, and confirm
an order via an accessible modal.

**What FEM11 focuses on:** taking the working FEM09 app and refactoring its logic so that
everything which isn't *specifically about rendering a template* — cart bookkeeping, catalog
filtering/sorting, money calculations, activity logging — lives in an Angular **service**
instead of inside a **component**. The UI and features are unchanged from FEM09; only where
the logic lives, and how components obtain it, changed.

**How it builds on FEM09:** FEM09 already had one service, `DessertDataService`, used purely
to avoid hard-coding the catalog in a template. Everything else — the `dessert id -> quantity`
map, `cartLines`/`orderTotal` getters, and every add/increment/decrement/remove/confirm method
— lived directly on `AppComponent`, which then pushed that data down to five other components
via a long chain of `@Input()`/`@Output()` bindings. FEM11 extracts that chunk of business logic
into four new services and lets each component inject exactly what it needs, directly.

---

## 2. Project Architecture

```
src/app/
├── app.component.ts/.html/.css        Root: page layout + which modal is showing. No cart state.
├── models/dessert.model.ts            Dessert, DessertImages, CartLine interfaces (unchanged from FEM09)
├── services/
│   ├── dessert-data.service.ts        Dessert catalog (unchanged from FEM09; root-provided)
│   ├── cart.service.ts                Cart state + operations (NEW; root-provided singleton)
│   ├── product.service.ts             Catalog filter/sort logic (NEW; component-provided)
│   ├── utility.service.ts             Shared money-calculation helpers (NEW; root-provided)
│   └── logging.service.ts             App activity log (NEW; root-provided)
└── components/
    ├── dessert-list/    Catalog grid + category filter + sort control
    ├── dessert-card/    One dessert: image, price, add/stepper controls
    ├── cart/            Sidebar cart panel: lines, total, confirm/clear actions
    ├── cart-item/       One cart row, reused by cart panel and confirmation modal
    └── order-confirmation-modal/   "Order Confirmed" dialog
```

**Components, after the refactor:**
- `AppComponent` — injects `CartService` only, to decide whether to show the confirmation
  modal (`*ngIf="cartService.isOrderConfirmed()"`). Owns no cart data.
- `DessertListComponent` — injects `DessertDataService` (catalog), its own private
  `ProductService` instance (filter/sort), and `CartService` (quantities + add/increment/decrement).
- `DessertCardComponent` — unchanged: still purely presentational, `@Input() dessert`/`quantity`,
  `@Output() add`/`increment`/`decrement`. It doesn't need to know a service exists.
- `CartComponent` — injects `CartService` directly for `cartLines()`, `orderTotal()`,
  `itemCount()`, `removeFromCart()`, `confirmOrder()`, `clearCart()`. No `@Input`/`@Output` left.
- `CartItemComponent` — unchanged contract (`@Input() line`/`variant`, `@Output() remove`);
  now injects `UtilityService` to compute `lineTotal` instead of inlining the multiplication.
- `OrderConfirmationModalComponent` — injects `CartService` directly for the confirmed order's
  lines/total and to call `startNewOrder()`. No `@Input`/`@Output` left.

**Models:** unchanged from FEM09 — `Dessert`, `DessertImages`, `CartLine`. No new models were
needed; the refactor is about *where logic lives*, not the shape of the data.

---

## 3. Angular Services

### `CartService` (`services/cart.service.ts`, `providedIn: 'root'`)

- **Why it exists:** the cart — "what's in it and how much" — used to live on `AppComponent`
  and had to be threaded through `DessertList`, `DessertCard`, `Cart`, `CartItem`, and the
  confirmation modal via `@Input`/`@Output`. That's the exact problem Task 2 targets.
- **Responsibility:** owns the single source of truth for the cart: a plain `dessertId -> quantity`
  object property, and every operation that changes it.
- **What it manages:** `addToCart`, `incrementQuantity`, `decrementQuantity`, `removeFromCart`,
  `clearCart`, `confirmOrder`, `startNewOrder`; derived state `cartLines`, `orderTotal`,
  `itemCount` (plain `get` accessors, recomputed from the underlying quantities every time a
  component reads them); and `isOrderConfirmed()` for the order-confirmation flow.
- **Which components use it:** `AppComponent`, `DessertListComponent`, `CartComponent`,
  `OrderConfirmationModalComponent` — four components with no parent/child relationship to each
  other beyond the app root, all sharing one instance.
- **Why a service, not a component:** the cart isn't "how something looks" — it's a business
  rule ("decrementing below 1 removes the item," "the total is the sum of line totals") that
  several unrelated components need to read and mutate identically. Keeping it in one component
  and passing it around requires prop-drilling that gets worse every time a new component needs
  cart data; a service lets any of them ask Angular for the *same* instance directly.

### `ProductService` (`services/product.service.ts`, registered in `DessertListComponent`'s `providers`)

- **Why it exists:** Task 3 calls for a service dedicated to product-related operations —
  filtering, sorting, formatting — kept separate from cart concerns.
- **Responsibility:** pure catalog operations that don't touch the cart at all: `getCategories()`,
  `filterByCategory()`, `sort()` (by price ascending/descending, or by name).
- **What it manages:** no state of its own — every method takes the dessert array in and
  returns a new array out. It backs the category filter and "sort by" control in the catalog view.
- **Which components use it:** only `DessertListComponent`.
- **Why a service, not a component:** filtering/sorting rules ("what counts as this category,"
  "how to order by price") are logic, not markup, and keeping them in the component would mix
  "how the grid renders" with "how the list is derived." Splitting them out also means they could
  be reused or unit-tested independently of any template.

### `UtilityService` (`services/utility.service.ts`, `providedIn: 'root'`)

- **Why it exists:** Task 5 calls for a shared utility service for recurring
  formatting/calculation operations, so money math isn't repeated (and potentially drifting)
  in multiple places.
- **Responsibility:** `round2()` (avoids floating-point cent drift), `lineTotal(price, quantity)`,
  `sum(values)`.
- **Which components use it:** `CartItemComponent` (`lineTotal` getter) and `CartService`
  (`orderTotal`/`itemCount`, via `sum`/`lineTotal`) — the same rounding rule is now guaranteed
  to apply everywhere money is calculated.
- **Why a service, not a component:** these are pure functions with no UI of their own; before
  the refactor, `CartItemComponent` computed `quantity * price` inline and `AppComponent`
  computed the order total with its own separate `reduce`. Two independent implementations of
  "how do we total money" is exactly the kind of duplication a utility service prevents.

### `LoggingService` (`services/logging.service.ts`, `providedIn: 'root'`)

- **Why it exists:** Task 6 calls for a logging service to track actions/errors across the app.
- **Responsibility:** records timestamped `info`/`error` entries and writes them to the console;
  exposes `getLog()` for inspecting the full history.
- **Which components use it:** injected into `CartService` (logs every add/increment/decrement/
  remove/clear/confirm) and into `AppComponent` (logs app initialization).
- **Why a service, not a component:** logging has to be one shared history regardless of which
  component triggered the action — a component-local log would only ever see that one
  component's events, which defeats the purpose of an activity log.

### `DessertDataService` (`services/dessert-data.service.ts`, `providedIn: 'root'`) — carried over from FEM09

- Still the catalog source (`getDesserts(): Dessert[]`), unchanged. Kept because it was already
  correctly implemented as a service in FEM09 — Task 1 explicitly says not to rebuild what's
  already working, only to identify *new* logic that should move into services.

---

## 4. Dependency Injection

**What DI is, in Angular:** rather than a class creating the objects it depends on with `new`,
it declares what it needs (usually as constructor parameters), and Angular's injector looks up
or creates the right instance and hands it over. The class never has to know *how* to construct
its dependency, only that it needs one.

**How it's used in this project:**
- Every service is decorated `@Injectable(...)`, which tells Angular's compiler it's allowed to
  participate in DI (and, via `providedIn: 'root'`, registers it with the app's root injector).
- Every component/service that needs one of these services declares it as a constructor
  parameter, e.g. `CartComponent`'s `constructor(readonly cartService: CartService) {}`. Angular
  sees the parameter's type, resolves a `CartService` instance, and passes it in automatically —
  the component never writes `new CartService()`.
- **Service-to-service injection:** `CartService`'s own constructor injects `DessertDataService`,
  `LoggingService`, and `UtilityService`. Services can depend on other services exactly the same
  way components do — DI isn't limited to "component asks for service."

**How services are provided:**
- `DessertDataService`, `CartService`, `UtilityService`, `LoggingService` use
  `@Injectable({ providedIn: 'root' })` — Angular's root injector creates one instance the first
  time any of them is requested, and every subsequent injection (anywhere in the app) receives
  that same instance.
- `ProductService` deliberately omits `providedIn` and is instead listed in
  `DessertListComponent`'s own `providers: [ProductService]` array. That creates a
  component-level injector scoped to `DessertListComponent` and its children, so it — and only
  it — gets its own private `ProductService` instance.

**Why DI is useful here, concretely:** before the refactor, giving `CartComponent` access to the
cart meant `AppComponent` had to own the cart and pass it down through `@Input`/`@Output`.
After the refactor, `CartComponent` just asks for `CartService` in its constructor and gets the
exact same instance every other cart-aware component gets — no intermediary has to know or care.

**Manually creating an object vs. receiving one through DI:**
```typescript
// Manual construction — this component now owns its OWN cart, not the shared one
export class CartComponent {
  private cart = new CartService(); // wrong: a private CartService can't even be built this
}                                    // way here (it itself needs 3 injected dependencies),
                                     // and even if it could, this instance would be disconnected
                                     // from every other component's cart.

// Dependency Injection — this component receives the ONE shared instance
export class CartComponent {
  constructor(readonly cartService: CartService) {}
}
```
The manual version breaks the moment two components need to see the *same* state (which is the
entire point of a shopping cart), and it also means the component has to know how to build every
transitive dependency of the service it wants — `CartService` alone would require constructing
`DessertDataService`, `LoggingService`, and `UtilityService` by hand first. DI removes both problems.

---

## 5. Data and Application Flow

- **Where data comes from:** the dessert catalog is a static, in-memory array inside
  `DessertDataService.getDesserts()` (unchanged from FEM09 — no backend/API in this lab). Cart
  state originates from user interaction (clicking "Add to Cart", the stepper, "Remove") and,
  on load, from whatever was last saved to `localStorage`.
- **How components access/modify data:** components never touch `localStorage`, the catalog
  array, or the quantities object directly — they call methods on the injected services
  (`cartService.addToCart(dessert)`, `productService.filterByCategory(...)`) and read derived
  state through the services' getters (`cartService.cartLines`, `cartService.orderTotal`).
- **How services participate:** `CartService` is the mutation boundary for the cart — every
  state change goes through one of its methods, which reassigns its internal `quantities`
  property, persists to `localStorage`, and calls `LoggingService`. `ProductService` is a pure
  transform step between the raw catalog and what `DessertListComponent` renders. `UtilityService`
  is a pure calculation step used wherever money needs totaling.
- **How parts communicate:** the *cart* is now shared purely through DI — any component that
  injects `CartService` reads its getters directly, with no `@Input`/`@Output` involved. Because
  every cart mutation happens inside a click handler or `(ngModelChange)` handler, Angular's
  default zone-based change detection re-runs after the mutation and re-evaluates those getters
  automatically — no manual "notify subscribers" step is needed. Purely local, presentational
  relationships (`DessertList` ↔ `DessertCard`, `Cart`/modal ↔ `CartItem`) still use
  `@Input`/`@Output`, since that data genuinely is local to one parent-child pair, not shared
  app-wide state.

---

## 6. Comparison with FEM09

|                                                   | FEM09                                                                                  | FEM11                                                                               |
|---------------------------------------------------|----------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------|
| Cart quantities                                   | `AppComponent.quantities` (plain object property)                                      | `CartService`'s private `quantities` property, `providedIn: 'root'`                 |
| Cart mutation methods                             | `AppComponent.addToCart/increment/decrement/removeFromCart/confirmOrder/startNewOrder` | Same operations, now methods on `CartService`                                       |
| `cartLines`/`orderTotal`                          | Getters on `AppComponent`, recomputed from `quantities` + `desserts` on every read     | Same kind of getters, now on `CartService`, shared by every injecting component     |
| Getting cart data into `Cart`/`DessertList`/modal | `@Input()` bindings from `AppComponent`, `@Output()` bubbling back up                  | Each component injects `CartService` directly                                       |
| Catalog filter/sort                               | Didn't exist                                                                           | New `ProductService`, injected only into `DessertListComponent`                     |
| Money calculations                                | Inlined (`quantity * price`) separately in `AppComponent` and `CartItemComponent`      | Centralized in `UtilityService`, used by both `CartService` and `CartItemComponent` |
| Action logging                                    | Didn't exist                                                                           | New `LoggingService`, used by `CartService` and `AppComponent`                      |
| Cart persistence                                  | None — lost on reload                                                                  | `CartService` reads/writes `localStorage` (bonus task)                              |
| `AppComponent` size/responsibility                | Owned cart state + wired the whole component tree                                      | Wires the tree only; owns no cart-related data                                      |

**Why this is better:**
- **Maintainability:** a bug in "how quantities change" now has exactly one place to fix
  (`CartService`), instead of potentially needing changes wherever `AppComponent`'s logic was
  read.
- **Reusability:** any new component (a header cart-count badge, for instance) could inject
  `CartService` and get live cart data with zero new `@Input`/`@Output` plumbing — impossible
  with the FEM09 shape unless it happened to be a direct descendant of `AppComponent`.
- **Separation of concerns:** `AppComponent` now only does what a root component should — compose
  the page and decide which top-level view (main layout vs. confirmation modal) is showing. It
  no longer also functions as "the cart's business logic," which was really two jobs forced into
  one class.
- **Testability (even though not exercised in this lab):** `CartService`, `ProductService`, and
  `UtilityService` are plain classes with no template — they could be unit tested in isolation,
  which was not true of logic embedded inside `AppComponent`.

---

## 7. Possible TA Review Questions

**Q: What is an Angular service?**
A: A plain TypeScript class, marked `@Injectable()`, that holds logic or state not tied to any
one component's template, so it can be shared and reused across the app. In this project,
`CartService` is the clearest example — it's just a class with a property and some methods; the
`@Injectable` decorator is what makes Angular's DI system able to construct and hand it out.

**Q: Why did you create `CartService`?**
A: Because in FEM09, cart quantities and every cart operation lived directly on `AppComponent`
and had to be pushed down through `@Input`/`@Output` to five other components. That's business
logic ("how does removing an item work," "what's the total"), not presentation logic, and
several unrelated components needed to read/change the exact same state — the textbook case for
a service.

**Q: Why did you create `ProductService` separately from `CartService`?**
A: They're different responsibilities — `CartService` manages cart *state* and mutation,
`ProductService` is a stateless transform over the catalog (filter/sort). Keeping them separate
means each has one clear job, and it let me demonstrate a component-scoped provider
(`ProductService` is provided in `DessertListComponent`, not root) alongside the app-wide
singletons.

**Q: What is Dependency Injection?**
A: The mechanism Angular uses to supply a class with the instances it depends on, instead of
that class constructing them itself with `new`. A component declares what it needs (as a
constructor parameter typed to the service), and Angular's injector resolves and provides it.

**Q: How is DI used in your project?**
A: Constructor injection everywhere — e.g. `CartComponent`'s constructor takes
`readonly cartService: CartService`, and `CartService`'s own constructor takes
`DessertDataService`, `LoggingService`, and `UtilityService`. No component or service in the
project ever calls `new` on another service.

**Q: Why not keep this logic inside the component?**
A: Because then only that one component (or its descendants, via manual prop-drilling) can use
it, and every unrelated component that needs the same data would have to duplicate the logic or
be forced into an awkward ancestor relationship. Moving it to a service means *any* component,
anywhere in the tree, can inject the same instance.

**Q: What does `providedIn: 'root'` mean?**
A: It registers the service with the application's root injector and tells Angular to create
exactly one instance for the entire app, the first time it's requested, and reuse that same
instance for every later injection. `CartService`, `DessertDataService`, `UtilityService`, and
`LoggingService` all use it because their whole value is being a single shared instance.

**Q: What is the difference between a component and a service?**
A: A component has a template and is about presentation — what the user sees and how they
interact with it. A service is a plain class with no template, meant to hold logic/state that
components use but don't own. `DessertCardComponent` only knows how to display one dessert and
emit events; it has no idea a `CartService` even exists.

**Q: How does Angular know which service instance to inject?**
A: It walks the injector hierarchy starting from where the request was made. If a component has
its own `providers` entry for that token (like `DessertListComponent` does for `ProductService`),
Angular uses that component-level instance. Otherwise it keeps looking up the tree until it
reaches the root injector, where `providedIn: 'root'` services live — which is why `CartService`
resolves to the same singleton no matter which component asks for it.

**Q: What would happen if `CartService` were provided at the component level instead of root?**
A: Whichever component declared it in its own `providers` array (and that component's
descendants) would get a private `CartService` instance, separate from any other component's.
`CartComponent` and `OrderConfirmationModalComponent` would each see a *different* cart — adding
an item in `DessertListComponent` would never show up in `CartComponent`. Root-level is required
here specifically because the cart must be one shared thing.

**Q: Why is `ProductService` provided at the component level instead of root, then?**
A: It holds no state — every call is a pure function of its arguments — and only
`DessertListComponent` needs it. There's no shared-state requirement pulling it toward root, so
scoping it to where it's actually used keeps the root injector from accumulating services that
don't need app-wide reach.

**Q: What advantages do services provide in larger applications?**
A: They let unrelated parts of a large component tree share the same state/logic without
prop-drilling, they centralize business rules so there's one place to fix a bug instead of many,
and they're independently testable since they carry no template. As an app grows, the
alternative — passing everything through ancestor components — gets combinatorially worse with
every new component that needs the same data.

**Q: How does `CartService` keep `cartLines`/`orderTotal`/`itemCount` in sync with the cart?**
A: The same way FEM09's `AppComponent` did: they're plain `get` accessors that recompute their
value from the current `quantities` object every time they're read, rather than being stored and
manually kept up to date. Because every cart mutation happens inside an event handler (a button
click, `(ngModelChange)`, etc.), Angular's default change detection re-checks the component tree
right after, which re-evaluates these getters and updates the template automatically — no extra
wiring needed to keep them "in sync."

**Q: Did you use `HttpClient`/an API for the dessert catalog?**
A: No — the assigned lab task list (Tasks 1–8 in `tasks/Dessert Shop App (Part II – Services
Integration).md`) doesn't call for it, and there's no backend or mock API in this lab, so
`DessertDataService` stays a synchronous, in-memory service exactly as it was in FEM09. Fetching
over HTTP from a hard-coded array with no real endpoint would be artificial complexity, not a
real requirement — I focused the refactor on what the task actually asks for: cart, product,
utility, and logging services plus provider-scope DI.

**Q: How does the bonus local-storage feature work?**
A: `CartService` reads `localStorage` once, in its constructor, to seed the initial `quantities`
property, and writes the current quantities back to `localStorage` after every mutation
(`addToCart`, `increment`/`decrementQuantity`, `removeFromCart`, `clearCart`). The "Clear Cart"
button in the cart panel calls `clearCart()`, which empties both the in-memory `quantities`
object and the stored value.

---

## 8. Key Concepts to Understand

- **A service is just a class.** `@Injectable()` doesn't change what the class *is* — it makes
  Angular's compiler willing to track it as something that can be injected/constructed by DI.
- **DI inverts who's responsible for construction.** A class that depends on a service declares
  the dependency; it never writes `new SomeService()`. Angular's injector builds/finds the
  instance and hands it over.
- **`providedIn: 'root'` = one instance, whole app.** Every place that injects that service
  (regardless of where it is in the component tree) gets the same object reference. This is
  required for genuinely shared state like the cart.
- **A component's own `providers` array = one instance per that component (and its descendants).**
  Used here for `ProductService`, since it's stateless and only needed in one place — a
  deliberate choice, not the default.
- **Constructor injection is how a class asks for its dependencies.** Both components and other
  services get their dependencies this way — DI isn't limited to "components injecting services."
- **The refactor's real goal is relocation, not new features.** Every cart operation available in
  FEM09 (add, increment, decrement, remove, confirm, start new order) behaves identically in
  FEM11 — what changed is that the logic now lives in `CartService` instead of `AppComponent`,
  and components reach it via DI instead of `@Input`/`@Output`.
- **Not everything belongs in a service.** `DessertCardComponent` and `CartItemComponent` still
  use plain `@Input`/`@Output` for their genuinely local parent-child data — services are for
  logic/state that's shared or reusable beyond one component relationship, not a blanket
  replacement for component properties.

---

## 9. Curriculum-Scope Audit

An earlier draft of `CartService` held its cart state in an Angular **signal**
(`signal<Record<number, number>>(...)`) with `computed()`-style derivations for `cartLines`,
`orderTotal`, and `itemCount`. Signals are a real Angular feature, but they aren't taught until a
module after FEM11, so that draft was refactored out in favor of the same plain-property-plus-getter
pattern FEM09's `AppComponent` already used — the state itself didn't change, only which class it
lives in. No RxJS, `Observable`, `subscribe()`, or `Subject` was ever introduced anywhere in this
project.

**✅ Concepts used, all covered by FEM09 → FEM11:**
- Components, templates, property binding, event binding, two-way binding (`[(ngModel)]`),
  structural directives (`*ngIf`, `*ngFor`, `ng-template`)
- `@Input()` / `@Output()` / `EventEmitter` for local parent-child data (`DessertCard`, `CartItem`)
- Lifecycle hooks (`AfterViewInit`/`ngAfterViewInit` in the confirmation modal, carried over from
  FEM10) and `@HostListener` for the Escape-key handler
- Plain TypeScript classes as services, `@Injectable()`, `providedIn: 'root'` vs. a component's own
  `providers` array, and constructor-based dependency injection (component-to-service and
  service-to-service)
- Plain object/boolean properties for state, with `get` accessors recomputing derived values on
  every read — relying on Angular's default zone-based change detection to re-run those getters
  after any user-triggered event, exactly as FEM09's `AppComponent` did

**❌ Concepts intentionally absent (belong to later modules):**
- Signals (`signal()`, `computed()`, `effect()`) — removed from `CartService` during this refactor
- RxJS / `Observable` / `subscribe()` / `Subject` / `BehaviorSubject` — never present in this project
- Any other reactive/state-management library — not introduced

If a later module reintroduces signals or RxJS as the taught pattern, this service is the natural
place to revisit — but for FEM11, the getter/property approach is the correct, curriculum-appropriate
choice, not a placeholder.
