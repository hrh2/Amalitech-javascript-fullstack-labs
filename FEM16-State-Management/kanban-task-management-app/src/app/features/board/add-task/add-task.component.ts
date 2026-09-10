import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { filter, switchMap, take } from 'rxjs/operators';
import { Task } from '../../../core/models/task.model';
import { HasUnsavedChanges } from '../../../core/guards/unsaved-changes.guard';
import { addTask } from '../../../state/board/board.actions';
import { selectBoardById, selectIsLoading } from '../../../state/board/board.selectors';
import { TaskFormComponent } from '../task-form/task-form.component';
import { TaskFormValue, applyDuplicateTitleValidator, buildTaskForm } from '../task-form/task-form.factory';

/**
 * Routed at 'new-task' (nested under 'boards/:boardId'). "Smart" component:
 * it owns the FormGroup and dispatches to the store; the actual form
 * fields live in the presentational TaskFormComponent this template
 * passes the FormGroup into.
 */
@Component({
  selector: 'app-add-task',
  imports: [CommonModule, TaskFormComponent],
  templateUrl: './add-task.component.html',
  styleUrl: './add-task.component.css',
})
export class AddTaskComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  form?: FormGroup;
  boardId!: number;
  private nextTaskId = 1;

  private paramSubscription?: Subscription;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private store: Store,
  ) {}

  ngOnInit(): void {
    // Reactive, not snapshot-only: reused across two 'new-task' visits
    // whose only difference is the inherited :boardId (see
    // BoardDetailComponent's identical reasoning), so the form and its
    // duplicate-title validator must be rebuilt whenever :boardId changes.
    // Waits for the store's initial load to finish (selectIsLoading) before
    // reading the board snapshot, since loadBoards() is now asynchronous.
    this.paramSubscription = this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.boardId = Number(params.get('boardId'));
          return this.store.select(selectIsLoading).pipe(
            filter((isLoading) => !isLoading),
            take(1),
            switchMap(() => this.store.select(selectBoardById(this.boardId)).pipe(take(1))),
          );
        }),
      )
      .subscribe((board) => {
        const tasks = board?.tasks ?? [];
        this.nextTaskId = tasks.reduce((max, task) => Math.max(max, task.id), 0) + 1;
        this.form = buildTaskForm(this.fb);
        applyDuplicateTitleValidator(
          this.form,
          tasks.map((task) => task.title),
        );
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
      id: this.nextTaskId,
      title: value.title,
      description: value.description,
      status: value.status,
      dueDate: value.dueDate ? value.dueDate : null,
      subtasks: value.subtasks,
    };
    this.store.dispatch(addTask({ boardId: this.boardId, task }));
    // Clear dirty state before navigating away so unsavedChangesGuard
    // doesn't ask for confirmation right after a successful save.
    this.form.markAsPristine();
    this.router.navigate(['/boards', this.boardId], { queryParams: { taskSaved: 'created' } });
  }

  cancel(): void {
    // No manual confirm() here: navigating away runs unsavedChangesGuard
    // automatically, which already prompts if the form is dirty.
    this.router.navigate(['/boards', this.boardId]);
  }
}
