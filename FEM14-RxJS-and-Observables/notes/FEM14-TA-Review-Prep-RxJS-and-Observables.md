# FEM14 TA Review Prep — RxJS & Observables

Prep notes for the Dessert Shop App (Part III) live code review. Written against what was
actually built in `dessert-shop-app/`, not a generic description of the concepts.

---

## 1. Lab Overview

**What changed from FEM11:** the Dessert Shop App's UI and features are the same (plus a new
search box and a max-price filter), but the way data moves through the app changed completely.
FEM11 stored the catalog as a plain array and the cart as a plain object with `get` accessors,
recomputed on every change-detection pass. FEM14 rebuilds every one of those flows as an RxJS
**Observable**, composed with operators, and consumed almost entirely through Angular's `async`
pipe instead of manual `.subscribe()` calls.

**How it builds on FEM11:** FEM11's `DessertDataService`, `CartService`, `ProductService`,
`UtilityService`, and `LoggingService` all carry over — same responsibilities, same provider
scopes. What changed inside them:
- `DessertDataService.getDesserts()` now returns `Observable<Dessert[]>` (a simulated network
  call, `of(...).pipe(delay(300))`) instead of a plain `Dessert[]`; a new `searchDesserts(term)`
  method was added for the search feature.
- `CartService` now stores its state in a `BehaviorSubject` and exposes `cartLines$` /
  `itemCount$` / `orderTotal$` / `isOrderConfirmed$` Observables instead of `get` accessors.
- `ProductService` is unchanged in kind — still pure, synchronous filter/sort functions — plus one
  new method, `filterByMaxPrice`. It's deliberately *not* converted to Observables, because it has
  no state or asynchrony of its own; it's used **inside** an RxJS `map` step (see Section 3).
- `LoggingService`/`UtilityService` are untouched — still plain synchronous services, now called
  from inside `tap()` and `map()` operators instead of directly from component methods.

---

## 2. Project Architecture

```
src/app/
├── app.component.ts        Async-pipes isOrderConfirmed$; the one manual+takeUntil subscription
│                            in the app (keeps document.title in sync with the cart's item count)
├── models/dessert.model.ts  Unchanged: Dessert, DessertImages, CartLine
├── services/
│   ├── dessert-data.service.ts   getDesserts()/searchDesserts() — both simulated API calls
│   ├── cart.service.ts           BehaviorSubject-backed cart state (root-provided singleton)
│   ├── product.service.ts        Pure filter/sort/category functions (component-provided)
│   ├── utility.service.ts        Money-calculation helpers (root-provided, unchanged)
│   └── logging.service.ts        App activity log (root-provided, unchanged)
└── components/
    ├── dessert-list/    desserts$ / searchResults$ / viewModels$ pipeline + all catalog controls
    ├── dessert-card/    Unchanged: purely presentational, @Input/@Output
    ├── cart/            cartLines$/itemCount$/orderTotal$ via async pipe
    ├── cart-item/       Unchanged: purely presentational, @Input/@Output
    └── order-confirmation-modal/   cartLines$/orderTotal$ via async pipe
```

---

## 3. The RxJS Pipelines, Piece by Piece

### `DessertDataService` — simulating a real async source

```typescript
getDesserts(): Observable<Dessert[]> {
  return of([...this.desserts]).pipe(
    delay(300),
    map((desserts) => {
      if (this.simulateFailure) { throw new Error('Network error: failed to load the dessert catalog'); }
      return desserts;
    })
  );
}
```
Using `of(...).pipe(delay(...))` instead of just returning the array matters: it means every
consumer downstream is genuinely dealing with a lazy, asynchronous, potentially-failing source —
exactly like `HttpClient.get(...)` would be — instead of something that only superficially looks
like an Observable. `setSimulateFailure(true)` (wired to a "Dev tools" checkbox in the UI) makes
the `map` step throw, which RxJS converts into a real error notification, so `catchError`
downstream has something genuine to catch.

`searchDesserts(term)` does the same thing with a **randomized** delay (150–500ms) specifically
so that typing quickly can produce out-of-order responses in practice — otherwise the
`switchMap`-vs-nested-subscribe bug would never actually be reachable during manual testing.

### `DessertListComponent` — the main composed pipeline

Three Observables, each one a `.pipe(...)` chain, combined into what the template renders:

```typescript
// 1. The catalog itself — reload$ (a BehaviorSubject) doubles as a manual "reload/retry" trigger.
private readonly desserts$: Observable<Dessert[]> = this.reload$.pipe(
  switchMap(() => this.dessertData.getDesserts().pipe(
    retry(1),
    tap(() => this.loadError$.next(null)),
    map((desserts) => desserts.map((d) => ({ ...d, price: this.utility.round2(d.price) }))),
    catchError((error) => {
      this.logger.logError(`Failed to load desserts: ${error.message}`);
      this.loadError$.next("We couldn't load the dessert menu. Please try again.");
      return of([] as Dessert[]);
    })
  )),
  tap((desserts) => this.logger.logInfo(`Dessert catalog ready: ${desserts.length} item(s)`))
);

// 2. Search — debounced, deduplicated, switchMap'd to a (simulated) search request.
private readonly searchResults$: Observable<Dessert[] | null> = this.searchTerm$.pipe(
  map((term) => term.trim()),
  filter((term) => term.length === 0 || term.length >= 2),
  debounceTime(300),
  distinctUntilChanged(),
  tap((term) => this.logger.logInfo(term ? `Searching desserts for "${term}"` : 'Search cleared')),
  switchMap((term) => term
    ? this.dessertData.searchDesserts(term).pipe(catchError(() => of([] as Dessert[])))
    : of(null))
);

// 3. Everything combined into what the template actually renders.
this.viewModels$ = combineLatest([this.desserts$, this.searchResults$, this.filters$, this.cartService.cartLines$]).pipe(
  map(([desserts, searchResults, filters, cartLines]) => {
    const base = searchResults ?? desserts;
    const byCategory = this.productService.filterByCategory(base, filters.category);
    const byPrice = this.productService.filterByMaxPrice(byCategory, filters.maxPrice);
    const sorted = this.productService.sort(byPrice, filters.sort);
    const quantityByDessertId = new Map(cartLines.map((line) => [line.dessert.id, line.quantity]));
    return sorted.map((dessert) => ({ dessert, quantity: quantityByDessertId.get(dessert.id) ?? 0 }));
  })
);
```

The template holds no manual subscription at all — `*ngIf="viewModels$ | async as items"` (with
`categories$ | async` and `loadError$ | async` alongside it) is the entire consumption story.

### `CartService` — `BehaviorSubject` as the cart's source of truth

```typescript
private readonly quantities$ = new BehaviorSubject<Record<number, number>>(this.loadStoredQuantities());

readonly cartLines$ = this.quantities$.pipe(map((q) => this.toCartLines(q)));
readonly itemCount$ = this.cartLines$.pipe(map((lines) => this.utility.sum(lines.map((l) => l.quantity))));
readonly orderTotal$ = this.cartLines$.pipe(map((lines) => this.utility.sum(lines.map((l) => this.utility.lineTotal(l.dessert.price, l.quantity)))));
```
Every mutation method (`addToCart`, `incrementQuantity`, `removeFromCart`, `clearCart`, ...) calls
`this.quantities$.next(...)` with a new object. Because `cartLines$`/`itemCount$`/`orderTotal$`
are all `.pipe(map(...))` derivations of the *same* `quantities$` source, one `.next()` call is
enough to bring every one of them (and everything downstream, like `DessertListComponent`'s
`viewModels$`, via `combineLatest`) up to date — this is the concrete mechanism behind "adding an
item updates the cart count, the total, and the product list's steppers immediately."

---

## 4. Where Each Required Operator/Technique Is Used

| Concept | Where | Why there |
|---|---|---|
| **Observable creation** (`of`, `delay`) | `DessertDataService.getDesserts()`/`searchDesserts()` | Simulates a real network call, so every consumer is dealing with genuine asynchrony |
| **`map`** | Price rounding in `desserts$`; building `DessertViewModel[]` in `viewModels$`; every `cartLines$`/`itemCount$`/`orderTotal$` derivation | Transforms each emitted value; never used for a side effect |
| **`filter`** | `searchResults$`, on the search-term string itself (`term.length === 0 \|\| term.length >= 2`) | The one stream in this app that emits *individual values* (search-term strings) rather than a whole array per emission — the scenario the module's notes call out as the correct level for RxJS's `filter`, as opposed to filtering *inside* a `map` when a stream emits a whole array (used for category/price filtering instead, via `ProductService`) |
| **`tap`** | Logging in `desserts$` (load success) and `searchResults$` (search term); resetting `loadError$` before a reload | Side effects only — nothing downstream ever sees a value changed by `tap` |
| **`switchMap`** | `desserts$` (reload/retry trigger → fetch), `searchResults$` (search term → search request) | Cancels the previous in-flight request the instant a newer one starts — verified manually by typing "w" → "wa" → "waf" rapidly and confirming only "waf"'s results ever render |
| **`debounceTime` + `distinctUntilChanged`** | `searchResults$` | Waits for a pause in typing (300ms) and skips re-querying when the (trimmed) term hasn't actually changed |
| **`combineLatest`** | `viewModels$` (catalog + search + filters + cart lines) | All four sources are long-lived and any one of them changing should refresh the view — `forkJoin` doesn't fit (it waits for every source to *complete*, which none of these do); `combineLatest` is the option built for "recombine whenever any input changes" |
| **`BehaviorSubject`** | `CartService.quantities$`/`orderConfirmed$`; `DessertListComponent.reload$`/`filters$`/`searchTerm$`/`loadError$` | Always holds (and immediately replays to a new subscriber) its current value, and exposes `.value` synchronously — both matter for the cart specifically (see Section 5) |
| **`catchError`** | `desserts$` (falls back to `of([])`, sets `loadError$`), `searchResults$`'s inner search call (falls back to `of([])` silently) | Intercepts an error mid-pipeline and substitutes a fallback Observable so the subscriber never sees an unhandled error |
| **`retry`** | `desserts$`, wrapping the `getDesserts()` call | Gives a transient failure one automatic second attempt before `catchError` gives up and shows the error banner |
| **`take`** | `CartService`'s constructor, loading the catalog once for id lookups | Documents "only the first emission matters" even though this particular source already completes on its own — a defensive, self-documenting guard |
| **`takeUntil` + `Subject`** | `AppComponent`, syncing `document.title` to the cart's item count | The one place a component's *class* (not just its template) needs a stream's value — see Section 5 |
| **`async` pipe** | `DessertListComponent`, `CartComponent`, `OrderConfirmationModalComponent`, `AppComponent` | The default everywhere a stream's value is only needed for display — zero manual subscriptions, zero `ngOnDestroy` in any of these four components |

---

## 5. Subscription Management — the Full Picture

This app has exactly two places where something is subscribed **without** the `async` pipe, and
both are deliberate, documented exceptions:

1. **`AppComponent`'s `document.title` sync** — `cartService.itemCount$.pipe(takeUntil(this.destroyed$)).subscribe(...)`.
   Updating `document.title` is a side effect the component's TypeScript class must perform
   directly; there's no template binding for "the browser tab title," so the `async` pipe (which
   only unwraps a value *for the template*) doesn't apply. `destroyed$` is a `Subject<void>`
   that's `.next()`'d and `.complete()`'d in `ngOnDestroy`, and `takeUntil(this.destroyed$)` on
   the subscription means it's torn down the instant that happens — Technique 3 from the module,
   used exactly where the module's own guidance says to reach for it ("the class genuinely needs
   the value too, not just display").

2. **`CartService`'s two internal subscriptions** (loading the catalog once for id lookups;
   persisting `quantities$` to `localStorage` on every change) — both are plain `.subscribe()`
   calls with no stored `Subscription` and no cleanup. This is intentional, not an oversight:
   `CartService` is `providedIn: 'root'`, so it's a singleton that lives exactly as long as the
   application itself. There is no `ngOnDestroy` moment for a root-provided service to unsubscribe
   at (Angular doesn't tear down the root injector during normal app usage), so a subscription
   that's meant to live "for as long as the app runs" needs no cleanup at all — the same way the
   `async` pipe needs none for a component that's meant to live "for as long as its template is
   shown." Both are documented with a comment in `cart.service.ts` explaining exactly this.

Everywhere else — `DessertListComponent`, `CartComponent`, `OrderConfirmationModalComponent` —
every stream is read exclusively through the `async` pipe. No component in the app has a
subscription that's missing cleanup of *some* kind (manual+`takeUntil`, root-singleton-lifetime,
or `async` pipe).

---

## 6. Reactive Error Handling, End to End

- `DessertDataService.setSimulateFailure(true)` is wired to a checkbox inside a `<details>`
  "Dev tools" panel at the bottom of the catalog view — purely a testing affordance, so the
  failure path can be exercised from the running app instead of only by editing code.
- Checking it and clicking "Reload catalog" pushes into `reload$`, which re-runs
  `dessertData.getDesserts()`. The service's `map` step throws; `retry(1)` gives it one more
  attempt (which also fails, since the flag is still set); `catchError` then logs the error via
  `LoggingService`, sets a friendly message on `loadError$`, and returns `of([])`.
- The template shows a red error banner (`*ngIf="loadError$ | async as error"`) with the message
  and a "Try again" button that calls the same `reload()` method. The grid itself falls back to
  the empty-catalog message underneath (suppressed specifically when an error is active, so the
  two messages don't both show at once and confuse "no results" with "failed to load").
- Unchecking the box and reloading recovers cleanly — verified manually (see Section 8).

---

## 7. Comparison with FEM11

|                                    | FEM11                                                                 | FEM14                                                                                   |
|------------------------------------|------------------------------------------------------------------------|-------------------------------------------------------------------------------------------|
| Dessert catalog                   | `DessertDataService.getDesserts(): Dessert[]`, synchronous            | `Observable<Dessert[]>`, simulated network delay, can fail                                |
| Cart state                        | Plain `quantities` object + `get cartLines()/orderTotal()/itemCount()` | `BehaviorSubject<Record<number, number>>` + `cartLines$`/`itemCount$`/`orderTotal$`       |
| How components read the cart      | Call a getter, re-evaluated by change detection                       | `async` pipe subscribes to an Observable                                                  |
| Catalog filter/sort                | Re-run manually inside `applyFilters()`, replacing a plain array field | Flows through `combineLatest`/`map` as part of `viewModels$`                              |
| Search                            | Didn't exist                                                          | New: debounced, `switchMap`-based, race-condition-safe                                    |
| Error handling for a failed load  | Didn't exist — data was synchronous and couldn't fail                 | `catchError` + `retry` + a friendly UI message + a dev toggle to test it                  |
| Subscription cleanup              | Not applicable — nothing was ever subscribed                          | `async` pipe by default; `takeUntil` for the one class-level subscription; documented root-singleton exceptions |
| `AppComponent`                    | Reads `cartService.isOrderConfirmed()` (method call)                  | Reads `cartService.isOrderConfirmed$ \| async`; also syncs `document.title` reactively    |

**Why this is better:**
- **Cancellation is now real.** In FEM11 there was nothing to cancel — everything was
  synchronous. In FEM14, a slow/stale search request or catalog reload is genuinely aborted by
  `switchMap`, not just ignored after the fact.
- **One mutation, every dependent view updates.** `CartService.quantities$.next(...)` is the only
  place cart state changes; every consumer (`cartLines$`, `itemCount$`, `orderTotal$`, and
  anything `combineLatest`-ing over `cartLines$`) recomputes from that single source, instead of
  each component independently re-reading a getter.
- **Failure has a defined, testable path.** FEM11's synchronous data literally could not fail.
  FEM14's simulated network calls can, and there's now a real, demonstrable
  fetch → fail → recover loop instead of an untested hypothetical.
- **Declarative over imperative.** The FEM11 `applyFilters()` method mutated a `visibleDesserts`
  field by hand every time a control changed; FEM14 expresses "the visible list is a function of
  the catalog, the search, the filters, and the cart" as one composed pipeline that the `async`
  pipe re-renders from automatically.

---

## 8. Manual Verification Performed

Before calling this done, the running app was driven end-to-end (headless Chromium) and confirmed:
- Initial load shows a brief "Loading desserts…" state, then the full grid (matches FEM11's design).
- Adding desserts to the cart updates the cart panel's count and total immediately, with no
  page refresh or manual re-fetch.
- Typing "w" → "wa" → "waf" in rapid succession (faster than the debounce window, and with a
  randomized network delay that can resolve out of order) settled on exactly the "waf" results —
  no stale/incorrect intermediate result ever rendered, confirming `switchMap` is doing its job.
- Enabling "Simulate a failed load" and reloading produced the red error banner with the expected
  message, and the two expected `console.error` log lines (one for the initial attempt, one for
  the `retry`) — no *unexpected* console errors or Angular subscription warnings appeared.
  Unchecking the box and clicking "Try again" recovered the grid cleanly.
- "Confirm Order" opened the modal with the same line items/total as the cart panel; "Start New
  Order" closed it and cleared the cart back to empty, confirmed via the cart heading updating to
  "Your Cart (0)".
- `ng build` completes cleanly (Angular's strict template type-checking is enabled in this
  project) with no errors or warnings.

---

## 9. Possible TA Review Questions

**Q: Why does `DessertDataService` use `of(...).pipe(delay(...))` instead of just returning the array?**
A: So the rest of the app is built against a genuinely asynchronous, potentially-failing
Observable — the same shape `HttpClient.get(...)` would return — rather than something that's
only Observable-shaped on the surface. It's what makes the loading state, the error-handling path,
and the search race condition all real, testable behaviors instead of things that could never
actually happen with synchronous data.

**Q: Walk me through what happens when I type quickly in the search box.**
A: Each keystroke pushes the raw value into `searchTerm$` (a `BehaviorSubject`). The pipeline
trims it, `filter`s out 1-character terms, `debounceTime(300)`s to wait for a pause in typing,
`distinctUntilChanged()`s so an unchanged term doesn't re-query, then `switchMap`s into
`dessertData.searchDesserts(term)`. If another keystroke starts a new search before the previous
one resolves, `switchMap` unsubscribes from (cancels) the previous one — so even though the
simulated network delay is randomized and a slower, older request could resolve *after* a newer
one, its result can never reach `.subscribe()` because that inner Observable was already canceled.

**Q: Why `combineLatest` here and not `forkJoin` or `withLatestFrom`?**
A: `forkJoin` waits for every source Observable to *complete* and only then emits once — none of
`desserts$`, `searchResults$`, `filters$`, or `cartLines$` ever complete (they're long-lived,
recomputing streams), so `forkJoin` would never emit at all. `withLatestFrom` was a real
alternative — it would work if I wanted `cartLines$` changes to *not* independently trigger a
recompute, only tag along whenever `desserts$` emits — but I specifically want *any* of the four
sources changing (adding a cart item included) to refresh what's rendered, which is exactly what
`combineLatest` is for.

**Q: Why does `CartService` use `BehaviorSubject` instead of a plain `Subject`?**
A: Two reasons, both concrete in this app. First, a `BehaviorSubject` always holds its current
value and hands it to any *new* subscriber immediately — so a component that starts observing the
cart after it already has items (the confirmation modal, effectively, since it's only rendered
once an order exists) still sees the correct state right away, instead of an empty cart until the
next mutation. A plain `Subject` has no memory — a late subscriber would see nothing until the
next `.next()` call. Second, `BehaviorSubject` exposes `.value` synchronously, which is what lets
`incrementQuantity`/`decrementQuantity` read the current quantity and compute a delta without a
nested subscription.

**Q: Isn't `CartService` reading `.value` synchronously working around "the reactive way" of doing things?**
A: No — `.value` is a documented, intentional part of `BehaviorSubject`'s API, specifically for
cases like this: a mutation method needs to compute a *new* state from the *current* state, and
doing that via a nested `.subscribe()`/`.unsubscribe()` just to read one value would be more
convoluted, not more "reactive," for no benefit. The Observable side (`cartLines$`/`itemCount$`/
`orderTotal$`) is still how every consumer *reads* the cart — `.value` is only used internally, by
the service that owns the state, to perform a mutation.

**Q: This module's own notes say `combineLatest`/`BehaviorSubject` are "outside the module's
required depth" — why are they all over this implementation?**
A: See Section 10 below — the task specification (`tasks/Dessert Shop App (Part III).md`, Tasks 5
and 6) explicitly requires both by name ("Combine multiple streams using combineLatest, forkJoin,
or withLatestFrom" / "Modify the cart system to use BehaviorSubject"), which is a more specific
instruction than the general module notes' scope banner. Both are used here in the minimal way the
task asks for — deriving state and combining streams — not "in depth": no custom operators, no
marble testing, no schedulers, no NgRx.

**Q: What's the difference between `map` (RxJS) and `Array.prototype.map`, and where does this
project use both?**
A: RxJS's `map` transforms each *value an Observable emits*; `Array.prototype.map` transforms each
*element of an array*. `desserts$`'s `map((desserts) => desserts.map((d) => ({ ...d, price:
... })))` uses both in one line, deliberately: the outer `map` is the RxJS operator, reacting to
the one array-of-desserts value the Observable emits; the inner `.map(...)` is the plain JS array
method, transforming each dessert inside that array. They share a name because they share a
concept, not an implementation.

**Q: Why is RxJS's `filter` operator used on `searchTerm$` but not for category/price filtering?**
A: It comes down to what each stream actually emits. `searchTerm$` emits one search-term *string*
at a time — a single value per emission — so RxJS's `filter` (deciding whether that one emitted
value passes through at all) is the right level. `desserts$` emits one *array* of desserts per
value; filtering "which desserts in that array match this category" has to happen with the plain
`Array.prototype.filter` method (used inside `ProductService.filterByCategory`, itself called from
inside an outer RxJS `map` in `viewModels$`), because RxJS's `filter` would only ever be deciding
whether to let the *whole array* through, not narrowing what's inside it.

**Q: Why is `tap` used for logging instead of doing it in `.subscribe()`?**
A: `tap` lets the pipeline log/side-effect at the exact point in the chain where something
happened (e.g., right after a successful fetch, before any further transformation), without
changing what flows downstream — and it works the same way regardless of how many places
eventually subscribe to that Observable. Putting the same logging in every `.subscribe()` call
would duplicate it and couple it to the *subscriber* instead of the *pipeline*.

**Q: How would you demonstrate that `switchMap` is actually preventing a real bug, not just
"the right operator to use in theory"?**
A: `DessertDataService.searchDesserts()`'s delay is deliberately randomized (150–500ms) rather
than fixed, specifically so a slower response to an *earlier* keystroke can resolve *after* a
faster response to a *later* one. Typing "choc" then quickly "chocolate" and confirming the
results always end up being "chocolate"'s — never a stale flash of "choc"'s results overwriting
them — is the concrete, repeatable test (this was run manually; see Section 8).

**Q: Where would you have needed a nested `.subscribe()` if you hadn't used `switchMap`?**
A: The naive version would be: subscribe to `searchTerm$`, and inside that callback, call
`dessertData.searchDesserts(term).subscribe(...)` to set the results. If the user types again
before the first search resolves, both requests are now in flight, and whichever happens to
resolve *last* wins — not necessarily the one matching what's currently in the search box.
`switchMap` structurally prevents this by canceling the first inner Observable the moment a new
outer value (a new search term) arrives.

**Q: Why does the loading state show "Loading desserts…" instead of just an empty grid on first load?**
A: `*ngIf="viewModels$ | async as items; else loading"` — before `viewModels$` has emitted its
first value (which, on a fresh page load, takes as long as the simulated 300ms delay), the `async`
pipe returns `null`, the `*ngIf` is falsy, and the `#loading` template renders instead of an empty
`<ul>`. This distinguishes "still loading" from "loaded, but zero results" (which shows "No
desserts match the selected filters" instead), and from "failed to load" (the red error banner).

**Q: Are you deploying this?**
A: The app builds cleanly and was manually verified end-to-end locally (Section 8); committing and
pushing to GitHub and redeploying to Netlify/Vercel (Task 10) is a deliberately separate, final
step — not run automatically as part of the code changes, since it publishes to a shared/external
service.

---

## 10. Curriculum-Scope Audit

The module notes (`Angular-Module6-RxJS-Observables.md`) open with an explicit scope banner:
Observables/Observers/Subscriptions, `of`/`from`/`fromEvent`/`interval`/`HttpClient` as creation
sources, `map`/`filter`/`tap`, `switchMap` (with `mergeMap`/`concatMap` mentioned only for
contrast), `catchError`, the four subscription-cleanup techniques (manual, combined, `takeUntil`,
`async` pipe), and a high-level Signals-vs-Observables comparison — flagging `Subject`/
`BehaviorSubject`/`ReplaySubject` **in depth**, `combineLatest`/`forkJoin`/`mergeMap`/`concatMap`
**in depth**, custom operators, marble testing, schedulers, and NgRx as "🔒 Coming Later — Outside
This Module."

The **task specification** (`tasks/Dessert Shop App (Part III – Reactive Programming with
RxJS).md`), however, explicitly requires two of those "outside this module" items by name:
- Task 5: "Create combined observables using **combineLatest**, **forkJoin**, or **withLatestFrom**."
- Task 6: "Modify the cart system to use **BehaviorSubject** for real-time updates... Discuss the
  benefit of BehaviorSubject for maintaining the 'latest value' in streams."

This implementation resolves that tension by using both, but only to the minimal depth the task
actually asks for — not the "full treatment" the notes defer:
- **`BehaviorSubject`** is used exactly as the notes' own Section 8 already introduces it (as
  `takeUntil`'s trigger `Subject`, and as the minimal "an Observable you can also `.next()` into"
  concept), extended to back `CartService`'s state and a few UI-control streams in
  `DessertListComponent`. No `ReplaySubject`, no multicasting configuration beyond the default, no
  custom Subject subclassing.
- **`combineLatest`** is used once, for exactly the scenario Task 5 names (synchronizing the
  catalog with cart updates). `forkJoin`/`withLatestFrom` were considered and explicitly rejected
  in code comments/Section 9 above, rather than reached for reflexively — no attempt was made to
  demonstrate all three "for completeness."

Everything the general notes flag as fully out of scope and *not* named by the task was left out:
no `mergeMap`/`concatMap` usage (the task allows `switchMap` **or** `mergeMap`; `switchMap` was
chosen and used for both places a higher-order mapping operator was needed), no custom operators,
no marble testing, no schedulers, no NgRx or other state-management library, and no Signals.

**✅ Concepts used, all covered by the module notes or explicitly required by the task:**
- Observable creation: `of`, `delay` (simulated async sources)
- `map`, `filter`, `tap`, `.pipe(...)` composition
- `switchMap` (search + reload/retry), including the specific stale-response race condition it
  prevents
- `retry` (the notes' own "optional stretch" operator, used for the catalog load)
- `catchError`, paired with `of(...)` fallbacks
- `debounceTime`, `distinctUntilChanged` (reactive user input)
- `take` (one-time catalog lookup), `takeUntil` + `Subject` (the one class-level subscription)
- The `async` pipe as the default subscription-management technique
- `BehaviorSubject` and `combineLatest`, used narrowly and explicitly justified against the task's
  own required deliverables (Tasks 5 and 6), not used "in depth"

**❌ Concepts intentionally absent (genuinely outside this module, and not required by the task):**
- `mergeMap`, `concatMap` — mentioned only in code comments for contrast, never used
- `forkJoin`, `withLatestFrom` — considered, explicitly not the right fit for this app's long-lived
  streams (see Section 9)
- `ReplaySubject`, custom operators, marble testing, schedulers
- NgRx or any other Observable-based state-management library
- Angular Signals — the module notes place these firmly in a later module; nothing in this project
  uses `signal()`/`computed()`/`effect()`

If a later module reintroduces `Subject`/`combineLatest`/`forkJoin` as fully-taught topics in their
own right, this is the natural place to revisit — but for FEM14, the scope above is the correct,
task-driven line, not an accident of over-reach.

---

## 11. Key Concepts to Understand

- **An Observable is lazy.** Nothing in `DessertDataService` runs until something subscribes
  (directly, or via the `async` pipe) — assigning `desserts$ = ...` in a constructor does not
  itself trigger the simulated network call.
- **Operators return new Observables; they never mutate the source.** Every `.pipe(...)` chain in
  this app builds a new, derived Observable — `desserts$` itself is never altered by the `map`/
  `catchError` steps applied to it.
- **`switchMap`'s defining behavior is cancellation, not "map to an Observable."** The reason to
  reach for it over a nested `.subscribe()` is specifically that a new outer value cancels the
  previous inner Observable — demonstrated concretely by the search feature.
- **`BehaviorSubject.value` is a legitimate synchronous escape hatch for a service that owns its
  own state**, not a violation of "the reactive way" — it's how `CartService`'s mutation methods
  compute new state from current state without a nested subscription.
- **Prefer the `async` pipe; reach for manual subscription only when the class itself needs the
  value.** This project follows that rule precisely — `AppComponent`'s `document.title` sync is
  the one place a stream's value is needed outside a template binding.
- **A root-provided (`providedIn: 'root'`) service's subscriptions don't need `ngOnDestroy`
  cleanup**, because the service itself lives exactly as long as the app does — there's no
  "component destroyed, subscription should stop" moment to hook into.
- **The task's explicit requirements can outrank a module's general scope guidance when they
  conflict** — `BehaviorSubject`/`combineLatest` are used here specifically because Tasks 5–6 name
  them, not despite the module notes flagging them as advanced; Section 10 documents exactly how
  far that goes and where the line was still held.
