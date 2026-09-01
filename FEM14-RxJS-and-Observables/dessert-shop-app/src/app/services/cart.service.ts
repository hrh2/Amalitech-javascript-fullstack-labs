import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, take } from 'rxjs';
import { CartLine, Dessert } from '../models/dessert.model';
import { DessertDataService } from './dessert-data.service';
import { LoggingService } from './logging.service';
import { UtilityService } from './utility.service';

const STORAGE_KEY = 'dessert-shop-cart';

/**
 * Single source of truth for the shopping cart, now backed by a
 * `BehaviorSubject` (FEM14) instead of a plain field with getter properties
 * (FEM11). Every component that needs cart data now reads one of the
 * `*$` Observables below — via the `async` pipe wherever possible — instead
 * of re-invoking a getter on every change-detection pass.
 *
 * `BehaviorSubject` (rather than a plain `Subject`) matters specifically
 * because it always holds — and immediately hands a new subscriber — its
 * *current* value: a component mounted well after the cart already has
 * items (e.g. the confirmation modal, opened later in the flow) still sees
 * the up-to-date cart the instant it subscribes, with no need to wait for
 * the next mutation. It also exposes `.value` synchronously, which is what
 * lets `incrementQuantity`/`decrementQuantity` compute a delta from the
 * current state below without a nested subscription.
 *
 * Root-provided (`providedIn: 'root'`): the cart must be a singleton, so
 * the constructor's one-time catalog subscription (see below) and the
 * localStorage-persistence subscription are both left uncleaned deliberately
 * — a root-provided service lives for the entire app, so there is no
 * `ngOnDestroy` moment to unsubscribe at, unlike a component.
 */
@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly dessertsById = new Map<number, Dessert>();
  private readonly quantities$ = new BehaviorSubject<Record<number, number>>(this.loadStoredQuantities());
  private readonly orderConfirmed$ = new BehaviorSubject<boolean>(false);

  /** The cart's line items, recomputed reactively every time quantities change. */
  readonly cartLines$: Observable<CartLine[]> = this.quantities$.pipe(
    map((quantities) => this.toCartLines(quantities))
  );

  /** Total number of items in the cart (sum of quantities). */
  readonly itemCount$: Observable<number> = this.cartLines$.pipe(
    map((lines) => this.utility.sum(lines.map((line) => line.quantity)))
  );

  /** Total price of the cart, rounded to the cent. */
  readonly orderTotal$: Observable<number> = this.cartLines$.pipe(
    map((lines) => this.utility.sum(lines.map((line) => this.utility.lineTotal(line.dessert.price, line.quantity))))
  );

  readonly isOrderConfirmed$: Observable<boolean> = this.orderConfirmed$.asObservable();

  constructor(
    dessertData: DessertDataService,
    private readonly logger: LoggingService,
    private readonly utility: UtilityService,
  ) {
    // One-time lookup of the catalog so cart lines can resolve a dessert id to
    // its full details. `take(1)` documents that only the first emission is
    // wanted, even though this particular source already completes on its
    // own after one value — it keeps this subscription safe to leave running
    // with no explicit unsubscribe.
    dessertData.getDesserts().pipe(take(1)).subscribe({
      next: (desserts) => {
        desserts.forEach((dessert) => this.dessertsById.set(dessert.id, dessert));
        // Re-emit the current quantities so cartLines$ (and everything derived
        // from it) recomputes now that dessertsById is actually populated —
        // relevant for a returning shopper whose cart was restored from
        // localStorage before the catalog finished "loading".
        this.quantities$.next(this.quantities$.value);
      },
      error: () => this.logger.logError('CartService: failed to load the dessert catalog for cart lookups'),
    });

    // Persist to localStorage on every change. Deliberately a plain
    // `.subscribe()` with no stored Subscription — see the class doc comment.
    this.quantities$.subscribe((quantities) => this.persist(quantities));
  }

  addToCart(dessert: Dessert): void {
    this.setQuantity(dessert.id, 1);
    this.logger.logInfo(`Added "${dessert.name}" to cart`);
  }

  incrementQuantity(dessert: Dessert): void {
    const next = this.quantityFor(dessert.id) + 1;
    this.setQuantity(dessert.id, next);
    this.logger.logInfo(`Increased "${dessert.name}" quantity to ${next}`);
  }

  decrementQuantity(dessert: Dessert): void {
    const current = this.quantityFor(dessert.id);
    if (current <= 1) {
      this.removeFromCart(dessert);
      return;
    }
    this.setQuantity(dessert.id, current - 1);
    this.logger.logInfo(`Decreased "${dessert.name}" quantity to ${current - 1}`);
  }

  removeFromCart(dessert: Dessert): void {
    const updated = { ...this.quantities$.value };
    delete updated[dessert.id];
    this.quantities$.next(updated);
    this.logger.logInfo(`Removed "${dessert.name}" from cart`);
  }

  /** Empties the cart without affecting the "order confirmed" flow. */
  clearCart(): void {
    this.quantities$.next({});
    this.logger.logInfo('Cart cleared');
  }

  confirmOrder(): void {
    const lines = this.toCartLines(this.quantities$.value);
    if (lines.length === 0) {
      return;
    }
    this.orderConfirmed$.next(true);
    const total = this.utility.sum(lines.map((line) => this.utility.lineTotal(line.dessert.price, line.quantity)));
    const count = this.utility.sum(lines.map((line) => line.quantity));
    this.logger.logInfo(`Order confirmed: ${count} item(s), total ${total}`);
  }

  startNewOrder(): void {
    this.clearCart();
    this.orderConfirmed$.next(false);
  }

  private quantityFor(dessertId: number): number {
    return this.quantities$.value[dessertId] ?? 0;
  }

  private setQuantity(dessertId: number, quantity: number): void {
    this.quantities$.next({ ...this.quantities$.value, [dessertId]: quantity });
  }

  private toCartLines(quantities: Record<number, number>): CartLine[] {
    return Object.entries(quantities)
      .map(([id, quantity]) => ({ dessert: this.dessertsById.get(Number(id)), quantity }))
      .filter((line): line is CartLine => !!line.dessert && line.quantity > 0);
  }

  private persist(quantities: Record<number, number>): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(quantities));
    } catch {
      this.logger.logError('Unable to persist cart to local storage');
    }
  }

  private loadStoredQuantities(): Record<number, number> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }
}
