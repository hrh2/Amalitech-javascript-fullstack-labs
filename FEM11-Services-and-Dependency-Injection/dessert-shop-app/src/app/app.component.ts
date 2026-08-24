import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DessertListComponent } from './components/dessert-list/dessert-list.component';
import { CartComponent } from './components/cart/cart.component';
import { OrderConfirmationModalComponent } from './components/order-confirmation-modal/order-confirmation-modal.component';
import { CartService } from './services/cart.service';
import { LoggingService } from './services/logging.service';

/**
 * Root component. No longer owns any cart state itself — that responsibility
 * moved to CartService (see services/cart.service.ts) so every component
 * that needs the cart injects the service directly instead of receiving it
 * through a chain of @Input/@Output bindings rooted here. AppComponent's
 * only remaining job is page layout and deciding when to show the
 * order-confirmation modal, which it reads straight off the service.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, DessertListComponent, CartComponent, OrderConfirmationModalComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  constructor(readonly cartService: CartService, logger: LoggingService) {
    logger.logInfo('Dessert Shop App initialized');
  }
}
