import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Dessert } from '../../models/dessert.model';

/**
 * Displays a single dessert: image, category, name, price, and either
 * an "Add to Cart" button (quantity === 0) or a quantity stepper
 * (quantity > 0). This component owns no cart state itself — it only
 * reports user intent upward via @Output, and the parent (DessertList,
 * which forwards to App) is the single source of truth for the cart.
 */
@Component({
  selector: 'app-dessert-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dessert-card.component.html',
  styleUrl: './dessert-card.component.css'
})
export class DessertCardComponent {
  /** The dessert to display. Required — always provided by the parent's *ngFor. */
  @Input({ required: true }) dessert!: Dessert;

  /** How many of this dessert are currently in the cart (0 = not added yet). */
  @Input() quantity = 0;

  /** Emitted when the shopper clicks "Add to Cart" for the first unit. */
  @Output() add = new EventEmitter<Dessert>();

  /** Emitted when the shopper clicks the "+" stepper button. */
  @Output() increment = new EventEmitter<Dessert>();

  /** Emitted when the shopper clicks the "-" stepper button. */
  @Output() decrement = new EventEmitter<Dessert>();

  onAdd(): void {
    this.add.emit(this.dessert);
  }

  onIncrement(): void {
    this.increment.emit(this.dessert);
  }

  onDecrement(): void {
    this.decrement.emit(this.dessert);
  }
}
