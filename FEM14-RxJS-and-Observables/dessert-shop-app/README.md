# Dessert Shop App — Reactive Programming with RxJS

An Angular lab project: a product-list-with-cart storefront for a dessert
shop. Shoppers browse a catalog of desserts, search/filter/sort it, add
items to a cart, adjust quantities, review a running total, and confirm an
order — all driven by composed RxJS Observable pipelines rather than
imperative subscribe/store/refresh code.

This is the **Part III** iteration of the app built in the FEM11 Services &
Dependency Injection lab. The UI and features are the same (plus a new
search box and a couple of new filter controls); what changed is how data
flows through the app — every stream of data (the catalog, search results,
the cart) is now a proper Observable, composed with RxJS operators and
consumed via Angular's `async` pipe wherever possible.

**Live demo:** _add your deployed Netlify/Vercel URL here after deploying_
**Design reference:** Frontend Mentor — "Product list with cart" challenge

## Features

- Browse the full dessert catalog with responsive images (mobile/tablet/desktop `<picture>` sources)
- Search desserts by name or category as you type, with debounced, cancel-stale-results-safe queries
- Filter the catalog by category and by a maximum price, and sort it by price or name
- Add a dessert to the cart, then increment/decrement or remove it via a quantity stepper
- Cart panel shows item count, each line's quantity/unit price/line total, and the order total —
  all updating immediately as the cart changes, anywhere in the app
- "Clear Cart" empties the cart; cart contents persist across page reloads via `localStorage`
- Empty states for both an empty catalog and an empty cart, plus a friendly error state (with a
  "Try again" retry) if the catalog fails to load
- A "Dev tools" panel to simulate a failed catalog load, for exercising the error-handling path
- Products currently in the cart are visually highlighted
- "Confirm Order" opens an accessible modal (focus-trapped, closable with `Esc`) summarizing the order, with a "Start New Order" action that resets the cart
- Fully responsive layout (mobile-first, with tablet/desktop breakpoints)
- Currency values formatted with Angular's `currency` pipe

## Tech Stack

- [Angular](https://angular.dev) 19 (standalone components, no NgModules)
- RxJS Observables for all data flow (catalog, search, cart state)
- Angular Services + Dependency Injection
- TypeScript
- Plain component-scoped CSS (no UI framework)

## Getting Started

```bash
npm install
npm start        # ng serve — runs at http://localhost:4200
```

```bash
npm run build     # production build, output in dist/dessert-shop-app
npm test          # unit tests via Karma/Jasmine
```

## Project Structure

```
dessert-shop-app/
├── src/app/
│   ├── app.component.ts/.html/.css        # Root layout; async-pipes the "order confirmed" flag,
│   │                                       # and the one deliberate manual+takeUntil subscription (doc title)
│   ├── models/dessert.model.ts            # Dessert, DessertImages, CartLine interfaces
│   ├── services/
│   │   ├── dessert-data.service.ts        # Simulated "API": of(...).pipe(delay(...)) catalog + search
│   │   ├── cart.service.ts                # BehaviorSubject-backed cart state (root-provided singleton)
│   │   ├── product.service.ts             # Filter/sort catalog logic (component-provided, still synchronous)
│   │   ├── utility.service.ts             # Shared money calculations (root-provided)
│   │   └── logging.service.ts             # App activity log (root-provided)
│   └── components/
│       ├── dessert-list/                  # desserts$ / searchResults$ / viewModels$ pipelines + controls
│       ├── dessert-card/                  # Single dessert: image, price, add/stepper controls
│       ├── cart/                          # Sidebar cart panel: async-piped lines, total, confirm/clear actions
│       ├── cart-item/                     # One cart row, reused in the cart and the confirmation modal
│       └── order-confirmation-modal/      # "Order Confirmed" dialog shown after checkout
└── public/assets/                          # Fonts and dessert images (Frontend Mentor design assets)
```

## Architecture Notes

- **Everything is an Observable:** `DessertDataService.getDesserts()`/`searchDesserts()` simulate a
  real network call (`of(...).pipe(delay(...))`, with a random delay on search specifically so a
  race condition is actually reachable in testing). `CartService` holds its state in a
  `BehaviorSubject` and exposes `cartLines$`/`itemCount$`/`orderTotal$`/`isOrderConfirmed$`.
- **`DessertListComponent`'s pipeline:** `desserts$` (catalog, with `retry`/`catchError`) is combined
  with `searchResults$` (debounced, deduplicated, `switchMap`'d search) and the live
  `filters$`/`cartService.cartLines$` via `combineLatest` into one `viewModels$` stream, rendered
  entirely through the `async` pipe — no manual subscription anywhere in that component.
- **Subscription cleanup:** the `async` pipe is used wherever a stream's value is only needed in a
  template. The one place the *component class* itself needs a stream's value (updating
  `document.title` from the cart's item count, in `AppComponent`) uses `takeUntil` with a
  `destroyed$` `Subject`, cleaned up in `ngOnDestroy`. `CartService`'s two internal subscriptions
  (loading the catalog for id lookups, persisting to `localStorage`) are root-provided singleton
  subscriptions with no `ngOnDestroy` to run — see the comments in `cart.service.ts`.
- **Dependency Injection:** `CartService` itself depends on `DessertDataService`, `LoggingService`,
  and `UtilityService` — all injected through its constructor. Angular's DI container resolves and
  provides these automatically; nothing is instantiated with `new`.
- **Provider scope:** most services use `providedIn: 'root'` (one singleton instance for the whole
  app — required for the cart, since every component must see the same state). `ProductService` is
  instead listed in `DessertListComponent`'s own `providers` array, since catalog filtering/sorting
  is only needed there — a concrete example of a component-scoped provider.
- **Local storage persistence:** `CartService` reads cart quantities from `localStorage` on
  construction and writes back on every change, so the cart survives a page reload. "Clear Cart"
  removes the stored data.
- **Reuse:** `CartItemComponent` is shared between the cart panel and the order-confirmation modal
  via a `variant` input (`'cart'` vs `'summary'`), avoiding duplicated markup.

See `notes/` in the lab root for a deeper write-up of the RxJS patterns used and the TA review prep.

## Deployment

Configured for [Vercel](https://vercel.com) via `vercel.json` (build command `npm run build`,
output directory `dist/dessert-shop-app/browser`). Deploy with the Vercel CLI or by importing the
repo in the Vercel dashboard.
