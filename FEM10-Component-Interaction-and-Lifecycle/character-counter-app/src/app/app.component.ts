import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { LetterDensityComponent } from './components/letter-density/letter-density.component';
import { OptionsPanelComponent } from './components/options-panel/options-panel.component';
import { StatsGridComponent } from './components/stats-grid/stats-grid.component';
import { TextEditorComponent } from './components/text-editor/text-editor.component';
import { ThemeToggleComponent } from './components/theme-toggle/theme-toggle.component';
import { Theme } from './models/theme';
import { TextAnalysisService } from './services/text-analysis.service';

interface PersistedState {
  text: string;
  excludeSpaces: boolean;
  limitEnabled: boolean;
  limitValue: number;
  theme: Theme;
}

const STORAGE_KEY = 'character-counter-app-state';

const DEFAULT_TEXT =
  'Design is the silent ambassador of your brand. Simplicity is key to effective communication, ' +
  'creating clarity in every interaction. A great design transforms complex ideas into elegant solutions, ' +
  'making them easy to understand. It blends aesthetics and functionality seamlessly.';

@Component({
  selector: 'app-root',
  imports: [
    ThemeToggleComponent,
    TextEditorComponent,
    OptionsPanelComponent,
    StatsGridComponent,
    LetterDensityComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, OnDestroy {
  text = DEFAULT_TEXT;
  excludeSpaces = false;
  limitEnabled = false;
  limitValue = 300;
  theme: Theme = 'dark';

  private readonly persist$ = new Subject<void>();
  private persistSubscription?: Subscription;

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly textAnalysis: TextAnalysisService,
  ) {}

  get totalChars(): number {
    return this.textAnalysis.countCharacters(this.text, this.excludeSpaces);
  }

  get wordCount(): number {
    return this.textAnalysis.countWords(this.text);
  }

  get sentenceCount(): number {
    return this.textAnalysis.countSentences(this.text);
  }

  get readingTime(): string {
    return this.textAnalysis.formatReadingTime(this.wordCount);
  }

  ngOnInit(): void {
    this.restoreState();
    this.applyTheme();

    // Debounce writes so every keystroke doesn't hit localStorage; the
    // subscription is cleaned up in ngOnDestroy to avoid leaking it.
    this.persistSubscription = this.persist$.pipe(debounceTime(300)).subscribe(() => this.saveState());
  }

  ngOnDestroy(): void {
    this.persistSubscription?.unsubscribe();
  }

  onTextChange(value: string): void {
    this.text = value;
    this.queuePersist();
  }

  onExcludeSpacesChange(value: boolean): void {
    this.excludeSpaces = value;
    this.queuePersist();
  }

  onLimitEnabledChange(value: boolean): void {
    this.limitEnabled = value;
    this.queuePersist();
  }

  onLimitValueChange(value: number): void {
    this.limitValue = value;
    this.queuePersist();
  }

  onThemeChange(theme: Theme): void {
    this.theme = theme;
    this.applyTheme();
    this.queuePersist();
  }

  private applyTheme(): void {
    this.document.documentElement.setAttribute('data-theme', this.theme);
  }

  private queuePersist(): void {
    this.persist$.next();
  }

  private restoreState(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      this.theme = this.document.defaultView?.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark';
      return;
    }

    try {
      const saved = JSON.parse(raw) as Partial<PersistedState>;
      this.text = saved.text ?? this.text;
      this.excludeSpaces = !!saved.excludeSpaces;
      this.limitEnabled = !!saved.limitEnabled;
      this.limitValue = saved.limitValue ?? this.limitValue;
      this.theme = saved.theme === 'light' ? 'light' : 'dark';
    } catch {
      // Corrupted storage; fall back to the defaults already set above.
    }
  }

  private saveState(): void {
    const state: PersistedState = {
      text: this.text,
      excludeSpaces: this.excludeSpaces,
      limitEnabled: this.limitEnabled,
      limitValue: this.limitValue,
      theme: this.theme,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}
