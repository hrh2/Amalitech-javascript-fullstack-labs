import { Injectable, computed, signal } from '@angular/core';
import { CartLine, Dessert } from '../models/dessert.model';
import { DessertDataService } from './dessert-data.service';
import { LoggingService } from './logging.service';
import { UtilityService } from './utility.service';

const STORAGE_KEY = 'dessert-shop-cart';

/**
 * Single source of truth for the shopping cart. Everything that was
 * previously threaded through AppComponent as a `dessert id -> quantity`
 * map plus a pile of @Input/@Output bindings now lives here instead, so
 * any component can read or change the cart by injecting this service —
 * no prop-drilling through intermediate components required.
 *
 * State is held in signals so `cartLines`/`orderTotal`/`itemCount` stay
 * automatically in sync with the underlying quantities, the same
 * derivation the old getters on AppComponent performed by hand.
 *
 * Root-provided (`providedIn: 'root'`): the cart must be a singleton —
 * every component needs to see the exact same cart, so Angular creates
 * exactly one instance for the whole app and injects that same instance
 * everywhere it's requested.
 */
@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly dessertsById = new Map<number, Dessert>();
  private readonly quantities = signal<Record<number, number>>(this.loadStoredQuantities());
  private readonly orderConfirmed = signal(false);

  readonly isOrderConfirmed = this.orderConfirmed.asReadonly();

  readonly cartLines = computed<CartLine[]>(() =>
    Object.entries(this.quantities())
      .map(([id, quantity]) => ({ dessert: this.dessertsById.get(Number(id)), quantity }))
      .filter((line): line is CartLine => !!line.dessert && line.quantity > 0)
  );

  readonly orderTotal = computed(() =>
    this.utility.sum(this.cartLines().map((line) => this.utility.lineTotal(line.dessert.price, line.quantity)))
  );

  readonly itemCount = computed(() => this.utility.sum(this.cartLines().map((line) => line.quantity)));

  constructor(
    dessertData: DessertDataService,
    private readonly logger: LoggingService,
    private readonly utility: UtilityService
  ) {
    dessertData.getDesserts().forEach((dessert) => this.dessertsById.set(dessert.id, dessert));
  }

  quantityFor(dessertId: number): number {
    return this.quantities()[dessertId] ?? 0;
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
    const updated = { ...this.quantities() };
    delete updated[dessert.id];
    this.quantities.set(updated);
    this.persist();
    this.logger.logInfo(`Removed "${dessert.name}" from cart`);
  }

  /** Empties the cart without affecting the "order confirmed" flow. */
  clearCart(): void {
    this.quantities.set({});
    this.persist();
    this.logger.logInfo('Cart cleared');
  }

  confirmOrder(): void {
    if (this.cartLines().length === 0) {
      return;
    }
    this.orderConfirmed.set(true);
    this.logger.logInfo(`Order confirmed: ${this.itemCount()} item(s), total ${this.orderTotal()}`);
  }

  startNewOrder(): void {
    this.clearCart();
    this.orderConfirmed.set(false);
  }

  private setQuantity(dessertId: number, quantity: number): void {
    this.quantities.set({ ...this.quantities(), [dessertId]: quantity });
    this.persist();
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.quantities()));
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
