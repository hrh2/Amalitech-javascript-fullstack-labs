import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DessertListComponent } from './components/dessert-list/dessert-list.component';
import { CartComponent } from './components/cart/cart.component';
import { OrderConfirmationModalComponent } from './components/order-confirmation-modal/order-confirmation-modal.component';
import { DessertDataService } from './services/dessert-data.service';
import { CartLine, Dessert } from './models/dessert.model';

/**
 * Root component. Owns the cart as the single shared source of truth
 * (Task 5: "keep shared data organized within parent components") and
 * passes it down to DessertList/Cart/OrderConfirmationModal via @Input,
 * reacting to whatever they emit back up via @Output.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, DessertListComponent, CartComponent, OrderConfirmationModalComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  readonly desserts: Dessert[];

  /** Maps dessert id -> quantity in the cart. The single source of truth for cart state. */
  quantities: Record<number, number> = {};

  /** Whether the "Order Confirmed" modal is currently shown. */
  isOrderConfirmed = false;

  constructor(private readonly dessertData: DessertDataService) {
    this.desserts = this.dessertData.getDesserts();
  }

  /** Derives the cart's line items from the dessert catalog + quantity map. */
  get cartLines(): CartLine[] {
    return this.desserts
      .filter((dessert) => (this.quantities[dessert.id] ?? 0) > 0)
      .map((dessert) => ({ dessert, quantity: this.quantities[dessert.id] }));
  }

  get orderTotal(): number {
    return this.cartLines.reduce((sum, line) => sum + line.quantity * line.dessert.price, 0);
  }

  addToCart(dessert: Dessert): void {
    this.quantities = { ...this.quantities, [dessert.id]: 1 };
  }

  incrementQuantity(dessert: Dessert): void {
    const current = this.quantities[dessert.id] ?? 0;
    this.quantities = { ...this.quantities, [dessert.id]: current + 1 };
  }

  decrementQuantity(dessert: Dessert): void {
    const current = this.quantities[dessert.id] ?? 0;
    if (current <= 1) {
      this.removeFromCart(dessert);
      return;
    }
    this.quantities = { ...this.quantities, [dessert.id]: current - 1 };
  }

  removeFromCart(dessert: Dessert): void {
    const updated = { ...this.quantities };
    delete updated[dessert.id];
    this.quantities = updated;
  }

  confirmOrder(): void {
    if (this.cartLines.length === 0) {
      return;
    }
    this.isOrderConfirmed = true;
  }

  startNewOrder(): void {
    this.quantities = {};
    this.isOrderConfirmed = false;
  }
}
