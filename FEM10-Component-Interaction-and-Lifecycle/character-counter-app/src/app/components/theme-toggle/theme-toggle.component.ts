import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Theme } from '../../models/theme';

@Component({
  selector: 'app-theme-toggle',
  imports: [],
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.css',
})
export class ThemeToggleComponent {
  @Input() theme: Theme = 'dark';
  @Output() themeChange = new EventEmitter<Theme>();

  toggle(): void {
    this.themeChange.emit(this.theme === 'light' ? 'dark' : 'light');
  }
}
