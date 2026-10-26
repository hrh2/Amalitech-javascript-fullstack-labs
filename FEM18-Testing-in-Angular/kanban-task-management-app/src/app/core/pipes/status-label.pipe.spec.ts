import { StatusLabelPipe } from './status-label.pipe';

describe('StatusLabelPipe', () => {
  const pipe = new StatusLabelPipe();

  it.each([
    ['todo', 'Todo'],
    ['in-progress', 'Doing'],
    ['done', 'Done'],
  ])('maps %s to %s', (status, label) => {
    expect(pipe.transform(status)).toBe(label);
  });

  it('returns an empty string for null, undefined and empty input', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
  });

  it('returns unknown statuses unchanged instead of throwing', () => {
    expect(pipe.transform('archived')).toBe('archived');
  });

  it('is pure: same input always gives the same output', () => {
    expect(pipe.transform('done')).toBe(pipe.transform('done'));
  });
});
