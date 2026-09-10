import { Component, EventEmitter, Output, input } from '@angular/core';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  searchTerm = input('');
  favoritesOnly = input(false);
  hasFavorites = input(false);

  @Output() searchTermChange = new EventEmitter<string>();
  @Output() favoritesOnlyToggle = new EventEmitter<void>();
}
