import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  Observable,
  of,
  retry,
  switchMap,
  tap,
} from 'rxjs';
import { DessertCardComponent } from '../dessert-card/dessert-card.component';
import { Dessert } from '../../models/dessert.model';
import { CartService } from '../../services/cart.service';
import { DessertDataService } from '../../services/dessert-data.service';
import { ProductService, SortOption } from '../../services/product.service';
import { LoggingService } from '../../services/logging.service';
import { UtilityService } from '../../services/utility.service';

/** A dessert paired with its current cart quantity, ready for the template. */
export interface DessertViewModel {
  dessert: Dessert;
  quantity: number;
}

interface CatalogFilters {
  category: string | null;
  sort: SortOption;
  maxPrice: number | null;
}

/**
 * Renders the dessert catalog: a category filter, a max-price filter, a sort
 * control, a search box, and the resulting grid of DessertCard components.
 *
 * FEM14 rewrite — everything here is now one composed, declarative
 * `.pipe(...)` chain instead of an imperative "load once, refilter on every
 * control change" flow:
 *
 * - `desserts$`  — the catalog itself, re-fetched via `reload$` (a
 *   BehaviorSubject used as a manual "reload/retry" trigger) each time it's
 *   asked to. `retry(1)` gives a transient failure one automatic second
 *   attempt; `catchError` falls back to an empty list and populates
 *   `loadError$` with a user-facing message so the failure is never silent.
 * - `searchResults$` — the search box's value, debounced and deduplicated,
 *   then `switchMap`'d into a simulated search request. `switchMap` is what
 *   guarantees that typing "choc" then quickly "chocolate" can never have
 *   "choc"'s (slower) response overwrite "chocolate"'s.
 * - `viewModels$` — `combineLatest`s the catalog, the search results, the
 *   category/price/sort filters, and the cart's live line items into the
 *   single list the template renders, so adding/removing a cart item is
 *   reflected in the grid's quantity steppers immediately, with no manual
 *   refresh step anywhere.
 *
 * All three are consumed via the `async` pipe in the template — this
 * component holds no manual `Subscription`, calls no `.subscribe()`, and
 * needs no `ngOnDestroy`.
 */
@Component({
  selector: 'app-dessert-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DessertCardComponent],
  providers: [ProductService],
  templateUrl: './dessert-list.component.html',
  styleUrl: './dessert-list.component.css'
})
export class DessertListComponent {
  selectedCategory: string | null = null;
  sortOption: SortOption = 'default';
  maxPrice: number | null = null;
  searchTerm = '';
  simulateFailure = false;

  readonly categories$: Observable<string[]>;
  readonly loadError$ = new BehaviorSubject<string | null>(null);
  readonly viewModels$: Observable<DessertViewModel[]>;

  private readonly reload$ = new BehaviorSubject<void>(undefined);
  private readonly filters$ = new BehaviorSubject<CatalogFilters>({
    category: null,
    sort: 'default',
    maxPrice: null,
  });
  private readonly searchTerm$ = new BehaviorSubject<string>('');

  private readonly desserts$: Observable<Dessert[]> = this.reload$.pipe(
    switchMap(() =>
      this.dessertData.getDesserts().pipe(
        retry(1),
        tap(() => this.loadError$.next(null)),
        map((desserts) => desserts.map((dessert) => ({ ...dessert, price: this.utility.round2(dessert.price) }))),
        catchError((error: Error) => {
          this.logger.logError(`Failed to load desserts: ${error.message}`);
          this.loadError$.next("We couldn't load the dessert menu. Please try again.");
          return of([] as Dessert[]);
        })
      )
    ),
    tap((desserts) => this.logger.logInfo(`Dessert catalog ready: ${desserts.length} item(s)`))
  );

  /**
   * `null` means "no active search" (show the full catalog); an array means
   * "these are the search results" (even if empty). The RxJS `filter` below
   * operates on this stream's individual string values one at a time — the
   * scenario the module's notes call out as the right level for it, unlike
   * `desserts$` above, which emits one whole array per value.
   */
  private readonly searchResults$: Observable<Dessert[] | null> = this.searchTerm$.pipe(
    map((term) => term.trim()),
    filter((term) => term.length === 0 || term.length >= 2),
    debounceTime(300),
    distinctUntilChanged(),
    tap((term) => this.logger.logInfo(term ? `Searching desserts for "${term}"` : 'Search cleared')),
    switchMap((term) =>
      term
        ? this.dessertData.searchDesserts(term).pipe(catchError(() => of([] as Dessert[])))
        : of(null)
    )
  );

  constructor(
    private readonly dessertData: DessertDataService,
    private readonly productService: ProductService,
    private readonly logger: LoggingService,
    private readonly utility: UtilityService,
    readonly cartService: CartService,
  ) {
    this.categories$ = this.desserts$.pipe(map((desserts) => this.productService.getCategories(desserts)));

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
  }

  applyFilters(): void {
    this.filters$.next({ category: this.selectedCategory, sort: this.sortOption, maxPrice: this.maxPrice });
  }

  onSearchInput(): void {
    this.searchTerm$.next(this.searchTerm);
  }

  reload(): void {
    this.reload$.next();
  }

  toggleSimulateFailure(): void {
    this.dessertData.setSimulateFailure(this.simulateFailure);
  }

  onAdd(dessert: Dessert): void {
    this.cartService.addToCart(dessert);
  }

  onIncrement(dessert: Dessert): void {
    this.cartService.incrementQuantity(dessert);
  }

  onDecrement(dessert: Dessert): void {
    this.cartService.decrementQuantity(dessert);
  }

  trackByDessertId(_index: number, item: DessertViewModel): number {
    return item.dessert.id;
  }
}
