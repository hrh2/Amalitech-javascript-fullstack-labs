import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

import { TextAnalysisService } from '../../services/text-analysis.service';

@Component({
  selector: 'app-text-editor',
  imports: [],
  templateUrl: './text-editor.component.html',
  styleUrl: './text-editor.component.css',
})
export class TextEditorComponent implements OnChanges {
  @Input() text = '';
  @Input() excludeSpaces = false;
  @Input() limitEnabled = false;
  @Input() limitValue = 300;
  @Output() textChange = new EventEmitter<string>();

  constructor(private readonly textAnalysis: TextAnalysisService) {}

  get isOverLimit(): boolean {
    if (!this.limitEnabled) return false;
    return this.textAnalysis.countCharacters(this.text, this.excludeSpaces) >= this.limitValue;
  }

  /**
   * The limit and exclude-spaces options live in a sibling component, so
   * when they change here (not from local typing) the current text must be
   * re-trimmed to respect the new limit. The emit is deferred to a microtask
   * because ngOnChanges runs mid change-detection: emitting synchronously
   * would mutate the parent's `text` while Angular is still checking this
   * same pass, triggering ExpressionChangedAfterItHasBeenCheckedError.
   */
  ngOnChanges(changes: SimpleChanges): void {
    const limitRelatedChange = !!(changes['limitEnabled'] || changes['limitValue'] || changes['excludeSpaces']);
    if (limitRelatedChange && !changes['text']) {
      const corrected = this.enforceLimit(this.text);
      if (corrected !== this.text) {
        Promise.resolve().then(() => this.textChange.emit(corrected));
      }
    }
  }

  onInput(event: Event): void {
    const element = event.target as HTMLTextAreaElement;
    const corrected = this.enforceLimit(element.value);
    if (corrected !== element.value) {
      element.value = corrected;
      element.setSelectionRange(corrected.length, corrected.length);
    }
    this.textChange.emit(corrected);
  }

  private enforceLimit(value: string): string {
    if (!this.limitEnabled) return value;
    const limit = this.limitValue > 0 ? this.limitValue : 0;

    if (!this.excludeSpaces) {
      return value.slice(0, limit);
    }

    let trimmed = value;
    while (this.textAnalysis.countCharacters(trimmed, true) > limit && trimmed.length > 0) {
      trimmed = trimmed.slice(0, -1);
    }
    return trimmed;
  }
}
