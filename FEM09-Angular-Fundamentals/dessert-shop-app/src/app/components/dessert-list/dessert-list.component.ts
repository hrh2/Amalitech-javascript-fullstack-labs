import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DessertCardComponent } from '../dessert-card/dessert-card.component';
import { Dessert } from '../../models/dessert.model';

/**
 * Renders the full dessert catalog as a grid of DessertCard components.
 * Holds no cart state of its own — quantities are supplied by the parent
 * (App) via [quantityMap], and every user action is simply re-emitted
 * upward so App remains the single source of truth for the cart.
 */
@Component({
  selector: 'app-dessert-list',
  standalone: true,
  imports: [CommonModule, DessertCardComponent],
  templateUrl: './dessert-list.component.html',
  styleUrl: './dessert-list.component.css'
})
export class DessertListComponent {
  @Input({ required: true }) desserts: Dessert[] = [];

  /** Maps dessert id -> quantity currently in the cart. */
  @Input() quantityMap: Record<number, number> = {};

  @Output() add = new EventEmitter<Dessert>();
  @Output() increment = new EventEmitter<Dessert>();
  @Output() decrement = new EventEmitter<Dessert>();

  quantityFor(dessert: Dessert): number {
    return this.quantityMap[dessert.id] ?? 0;
  }

  trackByDessertId(_index: number, dessert: Dessert): number {
    return dessert.id;
  }
}
