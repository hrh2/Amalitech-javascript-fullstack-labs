# Dessert Shop App — TA Review Prep Notes

Prep notes for explaining the `dessert-shop-app` lab (FEM09: Angular
Fundamentals) in a live code review. Goal: be able to explain *why* the code
is structured this way, not just that it works.

## 1. Project Overview

A single-page Angular app that recreates the Frontend Mentor "Product list
with cart" design: a dessert catalog on one side and a live shopping cart on
the other. Shoppers can add desserts to the cart, change quantities, remove
items, see a running total, confirm the order (a modal summary appears), and
start a new order (cart resets). Built entirely with standalone Angular
components — no NgModules, no external state library, no backend (the
catalog is hardcoded in a service).

## 2. Main Angular Concepts Used

| Concept | Where / How |
|---|---|
| Standalone components | Every component sets `standalone: true` and lists its own `imports` (e.g. `CommonModule`) instead of belonging to an `NgModule`. |
| Interpolation `{{ }}` | Displaying `dessert.name`, `dessert.category`, `quantity`, totals, etc. |
| Property binding `[ ]` | `[src]`, `[srcset]`, `[dessert]`, `[quantity]`, `[cartLines]`, `[ngClass]`, `[attr.aria-label]` |
| Event binding `( )` | `(click)`, and custom component events like `(add)`, `(increment)`, `(decrement)`, `(removeItem)`, `(confirmOrder)` |
| `@Input()` / `@Output()` | Every child component receives data via `@Input` and reports user actions via `@Output` + `EventEmitter`, never mutating parent state directly |
| Structural directives | `*ngIf`/`*ngElse` (via `ng-template`), `*ngFor` with `trackBy` |
| Attribute directive | `[ngClass]` to highlight a selected dessert card and to switch the cart-item variant class |
| Pipes | `currency` pipe for all price/total display |
| Dependency Injection | `DessertDataService` is `providedIn: 'root'` and injected into `AppComponent`'s constructor |
| Getters as derived state | `cartLines` and `orderTotal` on `AppComponent` are computed from `quantities`, not stored redundantly |
| Lifecycle hook | `ngAfterViewInit` in the confirmation modal moves keyboard focus into the dialog when it opens |
| `@ViewChild` | Modal grabs a reference to its own root element (`#dialog`) to focus it |
| `@HostListener` | Modal listens for `document:keydown.escape` to close itself |
| `ng-template` + template reference variables | Used for the `else` branches of `*ngIf` (empty states, add-vs-stepper toggle) |

## 3. Components and Their Responsibilities

```
AppComponent (root)
├── DessertListComponent        — catalog grid
│   └── DessertCardComponent    — one dessert (image, price, add/stepper)
├── CartComponent               — sidebar cart panel
│   └── CartItemComponent       — one cart row (variant="cart")
└── OrderConfirmationModalComponent  — "Order Confirmed" dialog
    └── CartItemComponent       — one summary row (variant="summary", reused)
```

- **`AppComponent`** — the *only* component that holds state. Owns
  `quantities: Record<number, number>` (dessert id → quantity in cart) as the
  single source of truth, plus `isOrderConfirmed`. Everything else is
  presentational.
- **`DessertListComponent`** — renders the dessert grid with `*ngFor`, shows
  an empty-catalog message via `*ngIf/else`, and simply forwards each card's
  `add`/`increment`/`decrement` events upward — it holds no cart state of its
  own.
- **`DessertCardComponent`** — displays one dessert's image (responsive
  `<picture>`), category, name, price, and either an "Add to Cart" button or
  a quantity stepper depending on whether `quantity > 0`.
- **`CartComponent`** — shows the cart heading with item count, either the
  empty-cart illustration or the list of `CartItemComponent`s, the order
  total, and the "Confirm Order" button.
- **`CartItemComponent`** — a single line item, reused in two contexts via a
  `variant: 'cart' | 'summary'` input, so the markup isn't duplicated between
  the cart panel and the confirmation modal.
- **`OrderConfirmationModalComponent`** — the post-checkout summary dialog;
  manages focus for accessibility and emits `startNewOrder` to reset
  everything.
- **`DessertDataService`** — an injectable, `providedIn: 'root'` service that
  returns the hardcoded dessert catalog (no HTTP call needed for this lab).

## 4. How Data Flows Through the App

1. `AppComponent` asks `DessertDataService` for the dessert list once, in its
   constructor, and stores it in `desserts`.
2. `AppComponent` passes `desserts` and the `quantities` map **down** into
   `DessertListComponent` via property binding.
3. `DessertListComponent` passes each individual dessert and its quantity
   **down** into a `DessertCardComponent`.
4. When the shopper clicks "Add to Cart" or the stepper buttons,
   `DessertCardComponent` emits an event **up** (`add` / `increment` /
   `decrement`) carrying the `Dessert` object — it does not change any state
   itself.
5. `DessertListComponent` just re-emits that event further **up** to
   `AppComponent`.
6. `AppComponent`'s handler (`addToCart`, `incrementQuantity`, etc.) updates
   `quantities` **immutably** (spreads a new object rather than mutating the
   old one, which plays well with Angular's change detection).
7. Because `cartLines` and `orderTotal` are **getters**, they're recomputed
   automatically the next time the template reads them — there's no manual
   "recalculate total" step.
8. The new `cartLines`/`orderTotal` flow back **down** into `CartComponent`
   and (when open) `OrderConfirmationModalComponent`, updating the UI.
9. Removing an item or confirming/resetting the order follows the same
   up-then-down pattern: child emits intent, `AppComponent` is the only place
   that decides what that intent means for the shared state.

This is essentially unidirectional data flow: state lives in one place
(`AppComponent`), flows down through inputs, and change requests flow back up
through outputs.

## 5. Key Features Implemented

- Responsive dessert grid with per-breakpoint images (`<picture>` +
  `srcset`/`media` for mobile/tablet/desktop)
- Add-to-cart → quantity stepper toggle per dessert card
- Live-updating cart: item count, per-line quantity/price/subtotal, order total
- Visual highlight (`ngClass`) on any dessert currently in the cart
- Empty states for both "no desserts available" and "cart is empty"
- Order confirmation modal (focus-managed, `Esc`-to-close) summarizing the
  order, with a "Start New Order" action that clears the cart
- Currency formatting via Angular's built-in `currency` pipe
- Fully responsive, mobile-first CSS with breakpoints at 600px (tablet) and
  1024px (desktop)
- Accessibility touches throughout: `aria-live` regions for count/total
  updates, `aria-label`s on icon-only buttons, a skip link, `role="dialog"`
  + `aria-modal` on the confirmation modal

**Not implemented (optional bonus task):** a transient "item added to cart"
success message/toast. The spec lists this as an optional enhancement, not a
core requirement — worth mentioning if asked, but it doesn't affect the base
grade.

## 6. Important Files and Their Purposes

| File | Purpose |
|---|---|
| `src/app/app.component.ts` | Root component; owns cart state (`quantities`), derives `cartLines`/`orderTotal`, handles all cart mutations |
| `src/app/models/dessert.model.ts` | `Dessert`, `DessertImages`, `CartLine` TypeScript interfaces — the app's data shapes |
| `src/app/services/dessert-data.service.ts` | Hardcoded dessert catalog, injected wherever needed |
| `src/app/components/dessert-list/*` | Catalog grid + empty-catalog state |
| `src/app/components/dessert-card/*` | Single product card + add/stepper controls |
| `src/app/components/cart/*` | Sidebar cart panel |
| `src/app/components/cart-item/*` | Reusable cart row (two variants) |
| `src/app/components/order-confirmation-modal/*` | Post-checkout summary dialog |
| `vercel.json` | Deployment config for Vercel (build command + output dir + SPA rewrite) |
| `README.md` | Project overview, setup instructions, structure, and architecture notes |

## 7. Likely TA Questions & Answers

**Q: Why does only `AppComponent` hold state, and not the individual cards or the cart component?**
A: To have a single source of truth. If quantity lived inside each
`DessertCardComponent`, the cart panel would have no way to know about it
without some separate synchronization mechanism. Keeping state in the common
ancestor and passing it down via `@Input`/derived getters means the cart and
the catalog are always looking at the same data — there's no risk of them
drifting out of sync.

**Q: How does adding an item in `DessertCardComponent` end up updating the cart in `CartComponent`, since they're siblings?**
A: They don't talk to each other directly. `DessertCardComponent` emits an
`add` event up to `DessertListComponent`, which re-emits it up to
`AppComponent`. `AppComponent` updates its `quantities` map, and its getter
`cartLines` recomputes. That new `cartLines` value is then passed down into
`CartComponent` via `[cartLines]`. It's parent-mediated sibling
communication — the standard Angular pattern for this lab's scope (no
services-as-state-store or RxJS `Subject` needed for something this small).

**Q: Why are `cartLines` and `orderTotal` getters instead of stored properties?**
A: So there's no way for them to become stale. If they were stored fields,
every place that changes `quantities` would also have to remember to
recompute and reassign them. As getters, they're always derived fresh from
`quantities` + `desserts` at read time — a single source of truth with no
duplicate state to keep in sync.

**Q: Why does `quantities` get reassigned with a spread (`{ ...this.quantities, ... }`) instead of just doing `this.quantities[id] = x`?**
A: Immutable updates. Mutating the object in place would still work with
Angular's default change detection here (since the getters re-run on every
check), but replacing the reference is the more idiomatic/safe pattern —
it avoids accidental shared-reference bugs and matches how you'd need to do
it under `OnPush` change detection, which is a natural next optimization for
this component tree.

**Q: What's the difference between `*ngIf` and `[ngClass]`? Why use one over the other in a given spot?**
A: `*ngIf` is a *structural* directive — it adds or removes elements from the
DOM entirely (e.g. showing either the "Add to Cart" button or the stepper,
never both). `[ngClass]` is an *attribute* directive — the element stays in
the DOM, only its CSS classes change (e.g. highlighting a dessert card that's
in the cart, without removing/re-adding the card itself).

**Q: Why use `ng-template` with `*ngIf; else`?**
A: It lets you define the "false" branch's markup once, next to the `*ngIf`,
without wrapping everything in a second `*ngIf="!condition"` block (which
would evaluate the condition twice and duplicate logic). It's Angular's
built-in if/else for templates.

**Q: What does `trackBy` do in the `*ngFor` loops, and why bother?**
A: It tells Angular how to identify which DOM element corresponds to which
data item (here, by `dessert.id`) across re-renders. Without it, Angular
would default to identity/index-based diffing and could destroy and recreate
DOM nodes unnecessarily whenever the array reference changes — costing
performance and potentially resetting element state (like focus or CSS
transitions) on every cart update.

**Q: Why is `CartItemComponent` reused for both the cart panel and the confirmation modal instead of writing two templates?**
A: DRY — a cart row's shape (name, quantity, price, total) is the same in
both places; only a couple of visual details differ (a thumbnail image and no
remove button in the modal). A `variant: 'cart' | 'summary'` input lets one
component's template branch on `*ngIf="variant === ..."` instead of
maintaining two near-duplicate components.

**Q: Why is `DessertDataService` a plain injectable instead of using `HttpClient`?**
A: There's no real backend for this lab — the catalog is static, hardcoded
data. Wrapping it in an injectable service still follows Angular's
dependency-injection pattern and keeps `AppComponent` decoupled from *how*
the data is sourced, which would make it straightforward to swap in an
`HttpClient`-based implementation later without touching any component that
consumes the service.

**Q: How would you make this reactive/observable-based instead (e.g. if the catalog came from an API)?**
A: `DessertDataService.getDesserts()` would return an `Observable<Dessert[]>`
(via `HttpClient.get`), and `AppComponent` would subscribe to it (or use the
`async` pipe in the template) instead of calling it synchronously in the
constructor. The rest of the data-flow design (state in `AppComponent`,
`@Input`/`@Output` down/up) wouldn't need to change.

**Q: What's `@HostListener` doing in the confirmation modal, and why not just add a `(keydown.escape)` binding in the template?**
A: `@HostListener('document:keydown.escape')` listens on the *document*, so
`Esc` closes the modal no matter what element currently has focus inside it.
A template-bound `(keydown.escape)` on the modal's root element would only
fire if that specific element (or a descendant) already had focus.

**Q: Why move focus into the modal on open (`ngAfterViewInit` + `@ViewChild`)?**
A: Accessibility. A dialog that appears without moving focus into it leaves
keyboard and screen-reader users still "inside" the underlying page, unaware
a modal opened. `ngAfterViewInit` is used (rather than `ngOnInit`) because
the `#dialog` element only exists in the DOM once the view has been
rendered — `ngOnInit` runs too early to access it via `@ViewChild`.

**Q: How is currency formatting handled, and could it be localized?**
A: Via Angular's built-in `currency` pipe (`{{ price | currency }}`), which
by default formats using the app's active locale (USD by default without
extra locale configuration). It could be pointed at another currency/locale
by passing pipe arguments (e.g. `| currency:'EUR'`) or by registering a
different `LOCALE_ID` provider for the whole app.

**Q: Is this app using Angular Signals or NgModules?**
A: No — it deliberately uses the classic `@Input`/`@Output` + plain class
fields pattern with standalone components (no `NgModule` declarations),
which matches this lab's scope (Angular Fundamentals: components, templates,
binding, directives). Signals-based state (`signal()`, `computed()`) would be
a natural refactor of the `quantities` field and the `cartLines`/`orderTotal`
getters in a more advanced lab.

## 8. Angular Concepts to Be Ready to Explain in General

- The difference between **structural** directives (`*ngIf`, `*ngFor`,
  change the DOM structure) and **attribute** directives (`ngClass`,
  `ngStyle`, change an existing element's appearance/behavior).
- The four kinds of **data binding**: interpolation (`{{ }}`, one-way,
  component→template), property binding (`[ ]`, one-way, component→DOM
  property), event binding (`( )`, one-way, template→component), and
  two-way binding (`[( )]`/`ngModel` — not used in this lab, but be ready to
  say why: there's no plain form input here that needs it).
- **Component communication**: `@Input()` for parent→child data,
  `@Output()` + `EventEmitter` for child→parent events; understand this is
  the base-level pattern, and that a shared service (or Signals/RxJS store)
  is the usual next step once sibling components need to talk without a
  common parent mediating every single interaction.
- **Standalone components** vs. the older `NgModule`-based bootstrapping —
  standalone is the current Angular default (this project uses Angular 19).
- **Change detection basics**: why immutable state updates (spreading
  objects/arrays) are a safer default habit, even under the default
  (non-`OnPush`) strategy.
- **Dependency Injection**: what `providedIn: 'root'` means (a single,
  app-wide singleton instance is created and injected wherever requested).
