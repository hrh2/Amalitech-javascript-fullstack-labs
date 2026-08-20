import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-options-panel',
  imports: [],
  templateUrl: './options-panel.component.html',
  styleUrl: './options-panel.component.css',
})
export class OptionsPanelComponent {
  @Input() excludeSpaces = false;
  @Input() limitEnabled = false;
  @Input() limitValue = 300;

  @Output() excludeSpacesChange = new EventEmitter<boolean>();
  @Output() limitEnabledChange = new EventEmitter<boolean>();
  @Output() limitValueChange = new EventEmitter<number>();

  onExcludeSpacesChange(event: Event): void {
    this.excludeSpacesChange.emit((event.target as HTMLInputElement).checked);
  }

  onLimitEnabledChange(event: Event): void {
    this.limitEnabledChange.emit((event.target as HTMLInputElement).checked);
  }

  onLimitValueChange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.limitValueChange.emit(Number.isFinite(value) && value > 0 ? value : 1);
  }
}
