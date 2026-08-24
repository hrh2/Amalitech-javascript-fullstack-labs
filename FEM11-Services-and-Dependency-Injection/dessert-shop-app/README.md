# Dessert Shop App — Services & Dependency Injection

An Angular lab project: a product-list-with-cart storefront for a dessert
shop. Shoppers browse a catalog of desserts, filter/sort it, add items to a
cart, adjust quantities, review a running total, and confirm an order.

This is the **Part II** iteration of the app built in the FEM09 Angular
Fundamentals lab. The UI and features are the same; what changed is the
architecture — cart, product, formatting, and logging logic that used to
live directly in components has been extracted into injectable Angular
services, wired together with Angular's Dependency Injection system.

**Live demo:** _add your deployed Netlify/Vercel URL here after deploying_
**Design reference:** Frontend Mentor — "Product list with cart" challenge

## Features

- Browse the full dessert catalog with responsive images (mobile/tablet/desktop `<picture>` sources)
- Filter the catalog by category and sort it by price or name
- Add a dessert to the cart, then increment/decrement or remove it via a quantity stepper
- Cart panel shows item count, each line's quantity/unit price/line total, and the order total
- "Clear Cart" empties the cart; cart contents persist across page reloads via `localStorage`
- Empty states for both an empty catalog and an empty cart
- Products currently in the cart are visually highlighted
- "Confirm Order" opens an accessible modal (focus-trapped, closable with `Esc`) summarizing the order, with a "Start New Order" action that resets the cart
- Fully responsive layout (mobile-first, with tablet/desktop breakpoints)
- Currency values formatted with Angular's `currency` pipe

## Tech Stack

- [Angular](https://angular.dev) 19 (standalone components, no NgModules)
- Angular Services + Dependency Injection (signals-based shared state)
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
│   ├── app.component.ts/.html/.css        # Root component; page layout only, no cart state
│   ├── models/dessert.model.ts            # Dessert, DessertImages, CartLine interfaces
│   ├── services/
│   │   ├── dessert-data.service.ts        # Provides the dessert catalog (root-provided)
│   │   ├── cart.service.ts                # Cart state + operations (root-provided singleton)
│   │   ├── product.service.ts             # Filter/sort catalog logic (component-provided)
│   │   ├── utility.service.ts             # Shared money calculations (root-provided)
│   │   └── logging.service.ts             # App activity log (root-provided)
│   └── components/
│       ├── dessert-list/                  # Catalog grid + filter/sort controls
│       ├── dessert-card/                  # Single dessert: image, price, add/stepper controls
│       ├── cart/                          # Sidebar cart panel: lines, total, confirm/clear actions
│       ├── cart-item/                     # One cart row, reused in the cart and the confirmation modal
│       └── order-confirmation-modal/      # "Order Confirmed" dialog shown after checkout
└── public/assets/                          # Fonts and dessert images (Frontend Mentor design assets)
```

## Architecture Notes

- **Services as the source of truth:** `CartService` owns the cart state (a `dessert id -> quantity`
  signal) and exposes derived `cartLines`/`orderTotal`/`itemCount` as computed signals. Components
  inject it directly instead of receiving cart data through `@Input`/`@Output` chains.
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
- **Directives:** `*ngFor` with `trackBy` renders the dessert grid and cart lines; `*ngIf`/`else`
  (with `ng-template`) switches between the "Add to Cart" button and the quantity stepper, and
  between empty/populated states; `[ngClass]` highlights selected dessert cards; `[(ngModel)]`
  drives the category/sort controls.
- **Reuse:** `CartItemComponent` is shared between the cart panel and the order-confirmation modal
  via a `variant` input (`'cart'` vs `'summary'`), avoiding duplicated markup.

See `notes/` in the lab root for a deeper write-up of the services, the DI patterns used, and how
this project differs from the FEM09 version.

## Deployment

Configured for [Vercel](https://vercel.com) via `vercel.json` (build command `npm run build`,
output directory `dist/dessert-shop-app/browser`). Deploy with the Vercel CLI or by importing the
repo in the Vercel dashboard.
