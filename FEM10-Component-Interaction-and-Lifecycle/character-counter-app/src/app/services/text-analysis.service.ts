import { Injectable } from '@angular/core';

export interface LetterDensityItem {
  letter: string;
  count: number;
  percent: number;
}

const WORDS_PER_MINUTE = 200;

/**
 * Pure text-analysis calculations shared by every component that needs to
 * derive stats from the raw text, so the math lives in one tested place
 * instead of being duplicated across components.
 */
@Injectable({
  providedIn: 'root',
})
export class TextAnalysisService {
  countCharacters(text: string, excludeSpaces: boolean): number {
    return excludeSpaces ? text.replace(/\s/g, '').length : text.length;
  }

  countWords(text: string): number {
    const trimmed = text.trim();
    return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
  }

  countSentences(text: string): number {
    if (!text.trim()) return 0;
    return text.split(/[.!?]+/).filter((sentence) => sentence.trim() !== '').length;
  }

  getLetterDensity(text: string): LetterDensityItem[] {
    const counts: Record<string, number> = {};
    let totalLetters = 0;

    for (const char of text.toLowerCase()) {
      if (/[a-z]/.test(char)) {
        counts[char] = (counts[char] ?? 0) + 1;
        totalLetters++;
      }
    }

    return Object.entries(counts)
      .map(([letter, count]) => ({
        letter,
        count,
        percent: totalLetters ? (count / totalLetters) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }

  formatReadingTime(wordCount: number): string {
    const minutes = wordCount / WORDS_PER_MINUTE;
    if (minutes < 1) return '<1 minute';
    const rounded = Math.round(minutes);
    return `${rounded} minute${rounded === 1 ? '' : 's'}`;
  }
}
