import { FormControl } from '@angular/forms';
import { duplicateTitleValidator, dueDateNotInPastValidator } from './task-validators';

describe('duplicateTitleValidator', () => {
  const validate = (value: string | null, existing = ['Design Homepage']) =>
    duplicateTitleValidator(existing)(new FormControl(value));

  it('flags a title that already exists', () => {
    expect(validate('Design Homepage')).toEqual({ duplicateTitle: true });
  });

  it('ignores case and surrounding whitespace', () => {
    expect(validate('  design HOMEPAGE ')).toEqual({ duplicateTitle: true });
  });

  it('accepts a new title', () => {
    expect(validate('Something else')).toBeNull();
  });

  it('leaves empty/null values to Validators.required', () => {
    expect(validate('')).toBeNull();
    expect(validate('   ')).toBeNull();
    expect(validate(null)).toBeNull();
  });

  it('accepts anything when there are no existing titles', () => {
    expect(validate('Design Homepage', [])).toBeNull();
  });
});

describe('dueDateNotInPastValidator', () => {
  const validate = (value: string | null) => dueDateNotInPastValidator(new FormControl(value));
  const iso = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  };

  it('treats the date as optional', () => {
    expect(validate('')).toBeNull();
    expect(validate(null)).toBeNull();
  });

  it('rejects a past date', () => {
    expect(validate(iso(-3))).toEqual({ dueDateInPast: true });
  });

  it('accepts a future date', () => {
    expect(validate(iso(3))).toBeNull();
  });
});
