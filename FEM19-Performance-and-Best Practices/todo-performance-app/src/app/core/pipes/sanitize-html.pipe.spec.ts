import { TestBed } from '@angular/core/testing';
import { SanitizeHtmlPipe } from './sanitize-html.pipe';

describe('SanitizeHtmlPipe', () => {
  let pipe: SanitizeHtmlPipe;

  beforeEach(() => {
    // Angular logs a console warning each time the sanitiser strips something.
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    TestBed.configureTestingModule({});
    pipe = TestBed.runInInjectionContext(() => new SanitizeHtmlPipe());
  });

  afterEach(() => jest.restoreAllMocks());

  it.each([
    ['<script>alert(1)</script>Buy milk', 'script'],
    ['<img src=x onerror="alert(1)">', 'onerror'],
    ['<svg onload="alert(1)"></svg>', 'onload'],
    ['<iframe src="https://evil.example"></iframe>', 'iframe'],
    ['<p style="background:url(javascript:alert(1))">x</p>', 'javascript:'],
  ])('removes the dangerous part of %s', (payload, forbidden) => {
    expect(pipe.transform(payload).toLowerCase()).not.toContain(forbidden);
  });

  it('neutralises a javascript: link by prefixing "unsafe:" so the browser will not run it', () => {
    expect(pipe.transform('<a href="javascript:alert(1)">click</a>')).toBe('<a href="unsafe:javascript:alert(1)">click</a>');
  });

  it('keeps the harmless text around a stripped script', () => {
    expect(pipe.transform('Buy <script>alert(1)</script>milk')).toContain('Buy');
    expect(pipe.transform('Buy <script>alert(1)</script>milk')).toContain('milk');
  });

  it('keeps harmless formatting', () => {
    expect(pipe.transform('Do <b>this</b> now')).toBe('Do <b>this</b> now');
  });

  it('leaves plain text unchanged', () => {
    expect(pipe.transform('Buy milk')).toBe('Buy milk');
  });

  it('returns an empty string for null, undefined and empty input', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
  });

  it('returns an empty string when nothing safe is left', () => {
    expect(pipe.transform('<script>alert(1)</script>')).toBe('');
  });
});
