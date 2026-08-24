import { Injectable } from '@angular/core';
import { Dessert } from '../models/dessert.model';

export type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc';

/**
 * Product-catalog operations: deriving the category list, filtering by
 * category, and sorting. Deliberately NOT `providedIn: 'root'` — it holds
 * no shared state and is only ever needed by the catalog view, so it is
 * registered in `DessertListComponent`'s own `providers` array instead.
 * That gives this component (and its children) a private instance, which
 * demonstrates component-level provider scope alongside the root-level
 * services in this app.
 */
@Injectable()
export class ProductService {
  getCategories(desserts: Dessert[]): string[] {
    return Array.from(new Set(desserts.map((dessert) => dessert.category))).sort();
  }

  filterByCategory(desserts: Dessert[], category: string | null): Dessert[] {
    if (!category) {
      return desserts;
    }
    return desserts.filter((dessert) => dessert.category === category);
  }

  sort(desserts: Dessert[], option: SortOption): Dessert[] {
    const sorted = [...desserts];
    switch (option) {
      case 'price-asc':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return sorted.sort((a, b) => b.price - a.price);
      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return sorted;
    }
  }
}
