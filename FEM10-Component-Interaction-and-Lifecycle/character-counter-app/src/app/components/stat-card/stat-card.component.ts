import { Component, Input } from '@angular/core';

export type StatVariant = 'purple' | 'yellow' | 'orange';

@Component({
  selector: 'app-stat-card',
  imports: [],
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.css',
})
export class StatCardComponent {
  @Input() value = 0;
  @Input() label = '';
  @Input() variant: StatVariant = 'purple';

  get cardClass(): string {
    return `stat-card stat-${this.variant}`;
  }

  get displayValue(): string {
    return this.value < 10 ? `0${this.value}` : `${this.value}`;
  }
}
