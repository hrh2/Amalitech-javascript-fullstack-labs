import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { DessertListComponent } from './components/dessert-list/dessert-list.component';
import { CartComponent } from './components/cart/cart.component';
import { OrderConfirmationModalComponent } from './components/order-confirmation-modal/order-confirmation-modal.component';
import { CartService } from './services/cart.service';
import { LoggingService } from './services/logging.service';

/**
 * Root component. No longer owns any cart state itself — that responsibility
 * lives in CartService (see services/cart.service.ts) so every component
 * that needs the cart injects the service directly instead of receiving it
 * through a chain of @Input/@Output bindings rooted here. The
 * order-confirmation modal's visibility is read straight off the service's
 * `isOrderConfirmed$` stream via the `async` pipe.
 *
 * FEM14: also keeps the browser tab title in sync with the cart's item
 * count. This is the module's one deliberate example of a *manual*
 * subscription with `takeUntil` cleanup (Technique 3) rather than the
 * `async` pipe — updating `document.title` is a side effect the class needs
 * to perform directly, not a value the template can bind to, so the
 * `async` pipe (template-only) doesn't fit here.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, DessertListComponent, CartComponent, OrderConfirmationModalComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly destroyed$ = new Subject<void>();

  constructor(readonly cartService: CartService, private readonly logger: LoggingService) {
    logger.logInfo('Dessert Shop App initialized');
  }

  ngOnInit(): void {
    this.cartService.itemCount$.pipe(takeUntil(this.destroyed$)).subscribe((count) => {
      document.title = count > 0 ? `Dessert Shop (${count})` : 'Dessert Shop';
    });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
