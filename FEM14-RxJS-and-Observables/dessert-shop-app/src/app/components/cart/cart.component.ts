import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CartItemComponent } from '../cart-item/cart-item.component';
import { CartLine } from '../../models/dessert.model';
import { CartService } from '../../services/cart.service';

/**
 * The sidebar cart panel: item count, line items (or an empty state),
 * order total, and the confirm/clear actions. Reads the cart entirely
 * through CartService's `cartLines$`/`itemCount$`/`orderTotal$` Observables,
 * consumed in the template via the `async` pipe — no manual `.subscribe()`,
 * no stored `Subscription`, no `ngOnDestroy` needed here at all.
 */
@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, CartItemComponent],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent {
  constructor(readonly cartService: CartService) {}

  trackByDessertId(_index: number, line: CartLine): number {
    return line.dessert.id;
  }
}
