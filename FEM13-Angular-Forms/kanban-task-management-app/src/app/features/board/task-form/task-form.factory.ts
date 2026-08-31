import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subtask, Task, TaskStatus } from '../../../core/models/task.model';
import { BoardService } from '../../../core/services/board.service';
import { duplicateTitleValidator, dueDateNotInPastValidator } from '../../../core/validators/task-validators';

/**
 * Shared shape both AddTaskComponent and EditTaskComponent build with
 * FormBuilder, and the presentational TaskFormComponent renders. Keeping
 * the group construction here (instead of duplicated in both routed
 * components) is the only thing shared between add/edit besides the
 * template - it's a plain function, not a service or another component.
 */
export function buildTaskForm(fb: FormBuilder): FormGroup {
  return fb.group({
    title: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(60)],
      // Sync validator: BoardService's data is in-memory, so no async validator is needed here.
    ],
    description: ['', [Validators.maxLength(300)]],
    status: ['todo' as TaskStatus, [Validators.required]],
    dueDate: ['', [dueDateNotInPastValidator]],
    subtasks: fb.array<FormGroup>([]),
  });
}

export function applyDuplicateTitleValidator(
  form: FormGroup,
  boardService: BoardService,
  boardId: number,
  excludeTaskId?: number,
): void {
  const titleControl = form.get('title')!;
  titleControl.addValidators(duplicateTitleValidator(boardService, boardId, excludeTaskId));
  titleControl.updateValueAndValidity();
}

export function subtaskGroup(fb: FormBuilder, subtask?: Subtask): FormGroup {
  return fb.group({
    title: [subtask?.title ?? '', [Validators.required, Validators.maxLength(80)]],
    completed: [subtask?.completed ?? false],
  });
}

export function patchTaskIntoForm(fb: FormBuilder, form: FormGroup, task: Task): void {
  form.patchValue({
    title: task.title,
    description: task.description,
    status: task.status,
    dueDate: task.dueDate ?? '',
  });
  const subtasks = form.get('subtasks') as FormArray;
  task.subtasks.forEach((subtask) => subtasks.push(subtaskGroup(fb, subtask)));
}

export interface TaskFormValue {
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: string;
  subtasks: Subtask[];
}
