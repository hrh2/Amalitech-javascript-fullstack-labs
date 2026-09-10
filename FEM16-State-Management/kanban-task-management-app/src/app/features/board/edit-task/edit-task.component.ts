import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { filter, switchMap, take } from 'rxjs/operators';
import { Task } from '../../../core/models/task.model';
import { HasUnsavedChanges } from '../../../core/guards/unsaved-changes.guard';
import { updateTask } from '../../../state/board/board.actions';
import { selectBoardById, selectIsLoading } from '../../../state/board/board.selectors';
import { TaskFormComponent } from '../task-form/task-form.component';
import {
  TaskFormValue,
  applyDuplicateTitleValidator,
  buildTaskForm,
  patchTaskIntoForm,
} from '../task-form/task-form.factory';

/**
 * Routed at 'edit/:taskId' (nested under 'boards/:boardId'), replacing
 * FEM12's inline-edit TaskDetailComponent with a dedicated route, per the
 * FEM13 spec's Task 2. Same "smart component owns the FormGroup, dispatches
 * to the store" split as AddTaskComponent.
 */
@Component({
  selector: 'app-edit-task',
  imports: [CommonModule, TaskFormComponent],
  templateUrl: './edit-task.component.html',
  styleUrl: './edit-task.component.css',
})
export class EditTaskComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  form?: FormGroup;
  boardId!: number;
  taskId!: number;

  private paramSubscription?: Subscription;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private store: Store,
  ) {}

  ngOnInit(): void {
    // Reactive, not snapshot-only: the same 'edit/:taskId' route config
    // is reused when :taskId changes, exactly like BoardDetailComponent's
    // :boardId - see that component's comment for why a snapshot read
    // would silently keep showing the first task forever. Waits for the
    // store's initial load to finish before reading the board snapshot,
    // since loadBoards() is now asynchronous.
    this.paramSubscription = this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.boardId = Number(params.get('boardId'));
          this.taskId = Number(params.get('taskId'));
          return this.store.select(selectIsLoading).pipe(
            filter((isLoading) => !isLoading),
            take(1),
            switchMap(() => this.store.select(selectBoardById(this.boardId)).pipe(take(1))),
          );
        }),
      )
      .subscribe((board) => {
        const task = board?.tasks.find((candidate) => candidate.id === this.taskId);
        if (!task) {
          this.router.navigate(['/not-found']);
          return;
        }
        this.form = buildTaskForm(this.fb);
        patchTaskIntoForm(this.fb, this.form, task);
        const otherTitles = board!.tasks.filter((t) => t.id !== this.taskId).map((t) => t.title);
        applyDuplicateTitleValidator(this.form, otherTitles);
      });
  }

  ngOnDestroy(): void {
    this.paramSubscription?.unsubscribe();
  }

  hasUnsavedChanges(): boolean {
    return this.form?.dirty ?? false;
  }

  save(): void {
    if (!this.form) {
      return;
    }
    const value = this.form.value as TaskFormValue;
    const task: Task = {
      id: this.taskId,
      title: value.title,
      description: value.description,
      status: value.status,
      dueDate: value.dueDate ? value.dueDate : null,
      subtasks: value.subtasks,
    };
    this.store.dispatch(updateTask({ boardId: this.boardId, task }));
    this.form.markAsPristine();
    this.router.navigate(['/boards', this.boardId], { queryParams: { taskSaved: 'updated' } });
  }

  cancel(): void {
    this.router.navigate(['/boards', this.boardId]);
  }
}
