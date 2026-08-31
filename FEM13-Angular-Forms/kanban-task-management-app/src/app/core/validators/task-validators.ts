import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { BoardService } from '../services/board.service';

/**
 * Custom validator: rejects a title that another task on the same board
 * already uses (case-insensitive, whitespace-trimmed). `excludeTaskId` lets
 * the edit form compare against every *other* task without flagging a
 * task's own unchanged title as a duplicate of itself.
 *
 * Data lives in BoardService's in-memory array, so the check can run
 * synchronously - no HTTP round-trip means no async validator is needed.
 */
export function duplicateTitleValidator(
  boardService: BoardService,
  boardId: number,
  excludeTaskId?: number,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const title = (control.value ?? '').trim();
    if (!title) {
      // Validators.required already reports the empty case; nothing extra to add here.
      return null;
    }
    return boardService.isTitleTaken(boardId, title, excludeTaskId) ? { duplicateTitle: true } : null;
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
