import { Component, EventEmitter, Output, input } from '@angular/core';

@Component({
  selector: 'app-filter-toolbar',
  imports: [],
  templateUrl: './filter-toolbar.html',
  styleUrl: './filter-toolbar.css'
})
export class FilterToolbar {
  maxCookTime = input.required<number>();
  maxCookTimeLimit = input.required<number>();
  favoritesOnly = input(false);
  hasFavorites = input(false);

  @Output() maxCookTimeChange = new EventEmitter<number>();
  @Output() favoritesOnlyToggle = new EventEmitter<void>();
  @Output() clear = new EventEmitter<void>();

  onSliderInput(value: string): void {
    this.maxCookTimeChange.emit(Number(value));
  }
}
