import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Custom validator: rejects a title that another task on the same board
 * already uses (case-insensitive, whitespace-trimmed).
 *
 * `existingTitles` is a plain snapshot the caller (AddTaskComponent/
 * EditTaskComponent) reads once from the NgRx store when the form is
 * built, rather than this validator injecting BoardService/the Store
 * itself - the store is now the single source of truth for task data
 * (FEM16), and a synchronous validator has no clean way to read a live
 * Observable anyway, so it takes the data it needs as plain arguments
 * instead. The edit form passes its own task's current title already
 * excluded, so saving without changing the title never flags itself.
 */
export function duplicateTitleValidator(existingTitles: string[]): ValidatorFn {
  const normalizedTitles = existingTitles.map((title) => title.trim().toLowerCase());
  return (control: AbstractControl): ValidationErrors | null => {
    const title = (control.value ?? '').trim();
    if (!title) {
      // Validators.required already reports the empty case; nothing extra to add here.
      return null;
    }
    return normalizedTitles.includes(title.toLowerCase()) ? { duplicateTitle: true } : null;
  };
}

/**
 * Custom validator: due date is optional, but when one is provided it may
 * not be in the past.
 */
export const dueDateNotInPastValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  if (!value) {
    return null;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(value);
  return dueDate.getTime() < today.getTime() ? { dueDateInPast: true } : null;
};
