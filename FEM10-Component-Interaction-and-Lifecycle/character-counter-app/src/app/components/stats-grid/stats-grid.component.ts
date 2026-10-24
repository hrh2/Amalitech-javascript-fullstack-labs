import { Component, Input } from '@angular/core';

import { StatCardComponent } from '../stat-card/stat-card.component';

@Component({
  selector: 'app-stats-grid',
  imports: [StatCardComponent],
  templateUrl: './stats-grid.component.html',
  styleUrl: './stats-grid.component.css',
})
export class StatsGridComponent {
  @Input() totalChars = 0;
  @Input() wordCount = 0;
  @Input() sentenceCount = 0;
}
