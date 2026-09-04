import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { BoardService } from '../../../core/services/board-service/board.service';
import { HasUnsavedChanges } from '../../../core/guards/unsaved-changes.guard';
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
 * FEM13 spec's Task 2. Same "smart component owns the FormGroup, passes it
 * to the presentational TaskFormComponent" split as AddTaskComponent.
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
    private boardService: BoardService,
  ) {}

  ngOnInit(): void {
    // Reactive, not snapshot-only: the same 'edit/:taskId' route config
    // is reused when :taskId changes, exactly like BoardDetailComponent's
    // :boardId - see that component's comment for why a snapshot read
    // would silently keep showing the first task forever.
    this.paramSubscription = this.route.paramMap.subscribe((params) => {
      this.boardId = Number(params.get('boardId'));
      this.taskId = Number(params.get('taskId'));
      this.loadTask();
    });
  }

  ngOnDestroy(): void {
    this.paramSubscription?.unsubscribe();
  }

  private loadTask(): void {
    const task = this.boardService.getTaskById(this.boardId, this.taskId);
    if (!task) {
      this.router.navigate(['/not-found']);
      return;
    }
    this.form = buildTaskForm(this.fb);
    patchTaskIntoForm(this.fb, this.form, task);
    applyDuplicateTitleValidator(this.form, this.boardService, this.boardId, this.taskId);
  }

  hasUnsavedChanges(): boolean {
    return this.form?.dirty ?? false;
  }

  save(): void {
    if (!this.form) {
      return;
    }
    const value = this.form.value as TaskFormValue;
    this.boardService.updateTask(
      this.boardId,
      this.taskId,
      value.title,
      value.description,
      value.status,
      value.dueDate ? value.dueDate : null,
      value.subtasks,
    );
    this.form.markAsPristine();
    this.router.navigate(['/boards', this.boardId], { queryParams: { taskSaved: 'updated' } });
  }

  cancel(): void {
    this.router.navigate(['/boards', this.boardId]);
  }
}
