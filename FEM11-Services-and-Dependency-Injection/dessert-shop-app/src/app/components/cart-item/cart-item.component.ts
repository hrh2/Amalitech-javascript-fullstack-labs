import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CartLine, Dessert } from '../../models/dessert.model';
import { UtilityService } from '../../services/utility.service';

/**
 * A single cart row. Reused in two places with slightly different
 * presentation, controlled by the `variant` input:
 *  - 'cart'     -> the sidebar cart: name + qty/price + a remove (x) button
 *  - 'summary'  -> the order-confirmation modal: thumbnail + name + total,
 *                  no remove button (the order is already placed)
 *
 * `lineTotal` is delegated to UtilityService instead of computing
 * `quantity * price` inline, so the same rounding rule used for the
 * cart's order total (in CartService) is used here too.
 */
@Component({
  selector: 'app-cart-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart-item.component.html',
  styleUrl: './cart-item.component.css'
})
export class CartItemComponent {
  @Input({ required: true }) line!: CartLine;
  @Input() variant: 'cart' | 'summary' = 'cart';

  @Output() remove = new EventEmitter<Dessert>();

  constructor(private readonly utility: UtilityService) {}

  get lineTotal(): number {
    return this.utility.lineTotal(this.line.dessert.price, this.line.quantity);
  }

  onRemove(): void {
    this.remove.emit(this.line.dessert);
  }
}
