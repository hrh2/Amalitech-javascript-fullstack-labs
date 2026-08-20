import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

import { LetterDensityItem, TextAnalysisService } from '../../services/text-analysis.service';

const PREVIEW_COUNT = 5;

@Component({
  selector: 'app-letter-density',
  imports: [],
  templateUrl: './letter-density.component.html',
  styleUrl: './letter-density.component.css',
})
export class LetterDensityComponent implements OnChanges {
  @Input() text = '';

  density: LetterDensityItem[] = [];
  expanded = false;
  readonly previewCount = PREVIEW_COUNT;

  constructor(private readonly textAnalysis: TextAnalysisService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['text']) {
      this.density = this.textAnalysis.getLetterDensity(this.text);
    }
  }

  toggleExpanded(): void {
    this.expanded = !this.expanded;
  }
}
