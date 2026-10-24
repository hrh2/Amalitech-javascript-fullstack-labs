import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CartItemComponent } from '../cart-item/cart-item.component';
import { CartLine } from '../../models/dessert.model';
import { CartService } from '../../services/cart.service';

/**
 * The sidebar cart panel: item count, line items (or an empty state),
 * order total, and the confirm/clear actions. Reads and mutates the cart
 * entirely through the injected CartService — it takes no @Input for cart
 * data and emits no @Output for cart actions, unlike the FEM09 version
 * which relied on AppComponent for both.
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
