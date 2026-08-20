import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CartItemComponent } from '../cart-item/cart-item.component';
import { CartLine, Dessert } from '../../models/dessert.model';

/**
 * The sidebar cart panel: item count, line items (or an empty state),
 * order total, delivery note, and the "Confirm Order" action.
 * Purely presentational — cart state itself lives in App.
 */
@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, CartItemComponent],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent {
  @Input({ required: true }) cartLines: CartLine[] = [];
  @Input() orderTotal = 0;

  @Output() removeItem = new EventEmitter<Dessert>();
  @Output() confirmOrder = new EventEmitter<void>();

  get itemCount(): number {
    return this.cartLines.reduce((sum, line) => sum + line.quantity, 0);
  }

  trackByDessertId(_index: number, line: CartLine): number {
    return line.dessert.id;
  }
}
