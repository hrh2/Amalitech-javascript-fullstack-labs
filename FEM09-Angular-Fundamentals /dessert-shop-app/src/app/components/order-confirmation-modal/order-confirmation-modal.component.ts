import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild
} from '@angular/core';
import { CartItemComponent } from '../cart-item/cart-item.component';
import { CartLine } from '../../models/dessert.model';

/**
 * Modal dialog shown after "Confirm Order" is clicked. Reuses CartItemComponent
 * (variant="summary") to display the same line items without duplicating markup.
 *
 * Note: moving focus into the dialog on open (AfterViewInit) and returning it to
 * the trigger on close are accessibility behaviors that go slightly beyond this
 * module's core lifecycle scope (ngOnInit), but they're included here because a
 * dialog that doesn't manage focus is not truly keyboard/screen-reader accessible.
 */
@Component({
  selector: 'app-order-confirmation-modal',
  standalone: true,
  imports: [CommonModule, CartItemComponent],
  templateUrl: './order-confirmation-modal.component.html',
  styleUrl: './order-confirmation-modal.component.css'
})
export class OrderConfirmationModalComponent implements AfterViewInit {
  @Input({ required: true }) cartLines: CartLine[] = [];
  @Input() orderTotal = 0;

  @Output() startNewOrder = new EventEmitter<void>();

  @ViewChild('dialog') private dialogRef?: ElementRef<HTMLElement>;

  trackByDessertId(_index: number, line: CartLine): number {
    return line.dessert.id;
  }

  ngAfterViewInit(): void {
    this.dialogRef?.nativeElement.focus();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.startNewOrder.emit();
  }
}
