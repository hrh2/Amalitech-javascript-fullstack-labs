import { TestBed } from '@angular/core/testing';

import { TextAnalysisService } from './text-analysis.service';

describe('TextAnalysisService', () => {
  let service: TextAnalysisService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TextAnalysisService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('counts characters, optionally excluding spaces', () => {
    expect(service.countCharacters('a b c', false)).toBe(5);
    expect(service.countCharacters('a b c', true)).toBe(3);
  });

  it('counts words, ignoring extra whitespace', () => {
    expect(service.countWords('  hello   world  ')).toBe(2);
    expect(service.countWords('')).toBe(0);
  });

  it('counts sentences by terminal punctuation', () => {
    expect(service.countSentences('One. Two! Three?')).toBe(3);
    expect(service.countSentences('   ')).toBe(0);
  });

  it('computes letter density sorted by frequency', () => {
    const density = service.getLetterDensity('aab');
    expect(density[0]).toEqual({ letter: 'a', count: 2, percent: (2 / 3) * 100 });
    expect(density[1]).toEqual({ letter: 'b', count: 1, percent: (1 / 3) * 100 });
  });

  it('formats reading time under a minute', () => {
    expect(service.formatReadingTime(50)).toBe('<1 minute');
  });

  it('formats reading time in whole minutes', () => {
    expect(service.formatReadingTime(400)).toBe('2 minutes');
    expect(service.formatReadingTime(200)).toBe('1 minute');
  });
});
