import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DessertCardComponent } from '../dessert-card/dessert-card.component';
import { Dessert } from '../../models/dessert.model';
import { CartService } from '../../services/cart.service';
import { DessertDataService } from '../../services/dessert-data.service';
import { ProductService, SortOption } from '../../services/product.service';

/**
 * Renders the dessert catalog: a category filter, a sort control, and the
 * resulting grid of DessertCard components.
 *
 * Gets its data and behaviour entirely through injected services instead
 * of @Input/@Output — it asks DessertDataService for the catalog, uses its
 * own ProductService instance (registered in `providers` below, so it is
 * scoped to this component rather than shared app-wide) to filter/sort it,
 * and calls CartService directly for quantities and cart actions.
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
  private readonly allDesserts: Dessert[];

  readonly categories: string[];
  visibleDesserts: Dessert[];

  selectedCategory: string | null = null;
  sortOption: SortOption = 'default';

  constructor(
    dessertData: DessertDataService,
    private readonly productService: ProductService,
    readonly cartService: CartService
  ) {
    this.allDesserts = dessertData.getDesserts();
    this.categories = this.productService.getCategories(this.allDesserts);
    this.visibleDesserts = this.allDesserts;
  }

  quantityFor(dessert: Dessert): number {
    return this.cartService.quantityFor(dessert.id);
  }

  applyFilters(): void {
    const filtered = this.productService.filterByCategory(this.allDesserts, this.selectedCategory);
    this.visibleDesserts = this.productService.sort(filtered, this.sortOption);
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

  trackByDessertId(_index: number, dessert: Dessert): number {
    return dessert.id;
  }
}
