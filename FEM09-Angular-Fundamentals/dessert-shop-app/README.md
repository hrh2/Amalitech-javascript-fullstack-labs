# Dessert Shop App

An Angular Fundamentals lab project: a product-list-with-cart storefront for a
dessert shop. Shoppers browse a catalog of desserts, add items to a cart,
adjust quantities, review a running total, and confirm an order — all built
with standalone Angular components, template-driven data binding, and
structural/attribute directives (no external state library).

**Live demo:** _add your deployed Vercel URL here after deploying_
**Design reference:** Frontend Mentor — "Product list with cart" challenge

## Features

- Browse the full dessert catalog with responsive images (mobile/tablet/desktop `<picture>` sources)
- Add a dessert to the cart, then increment/decrement or remove it via a quantity stepper
- Cart panel shows item count, each line's quantity/unit price/line total, and the order total
- Empty states for both an empty catalog ("No desserts are available...") and an empty cart
- Products currently in the cart are visually highlighted
- "Confirm Order" opens an accessible modal (focus-trapped, closable with `Esc`) summarizing the order, with a "Start New Order" action that resets the cart
- Fully responsive layout (mobile-first, with tablet/desktop breakpoints)
- Currency values formatted with Angular's `currency` pipe

## Tech Stack

- [Angular](https://angular.dev) 19 (standalone components, no NgModules)
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
│   ├── app.component.ts/.html/.css     # Root component; owns the cart (single source of truth)
│   ├── models/dessert.model.ts         # Dessert, DessertImages, CartLine interfaces
│   ├── services/dessert-data.service.ts# Provides the dessert catalog
│   └── components/
│       ├── dessert-list/               # Renders the catalog grid (*ngFor, empty state)
│       ├── dessert-card/                # Single dessert: image, price, add/stepper controls
│       ├── cart/                        # Sidebar cart panel: lines, total, confirm action
│       ├── cart-item/                   # One cart row, reused in the cart and the confirmation modal
│       └── order-confirmation-modal/    # "Order Confirmed" dialog shown after checkout
└── public/assets/                       # Fonts and dessert images (Frontend Mentor design assets)
```

## Architecture Notes

- **Single source of truth:** `AppComponent` owns the cart state (a `dessert id -> quantity` map) and derives `cartLines`/`orderTotal` from it. Every other component is presentational — it receives data via `@Input` and reports user intent upward via `@Output`, never mutating shared state directly.
- **Component communication:** parent → child via property binding (`[desserts]`, `[cartLines]`, `[quantityMap]`), child → parent via event binding (`(add)`, `(increment)`, `(decrement)`, `(removeItem)`, `(confirmOrder)`).
- **Directives:** `*ngFor` with `trackBy` renders the dessert grid and cart lines; `*ngIf`/`else` (with `ng-template`) switches between the "Add to Cart" button and the quantity stepper, and between empty/populated states; `[ngClass]` highlights selected dessert cards.
- **Reuse:** `CartItemComponent` is shared between the cart panel and the order-confirmation modal via a `variant` input (`'cart'` vs `'summary'`), avoiding duplicated markup.

## Deployment

Configured for [Vercel](https://vercel.com) via `vercel.json` (build command `npm run build`, output directory `dist/dessert-shop-app/browser`). Deploy with the Vercel CLI or by importing the repo in the Vercel dashboard.
