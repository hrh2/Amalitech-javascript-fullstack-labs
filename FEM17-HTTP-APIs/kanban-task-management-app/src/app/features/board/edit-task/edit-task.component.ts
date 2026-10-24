import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Task } from '../../../core/models/task.model';
import { HasUnsavedChanges } from '../../../core/guards/unsaved-changes.guard';
import { TaskService } from '../../../core/services/task-service/task.service';
import { TaskFormComponent } from '../task-form/task-form.component';
import {
  TaskFormValue,
  applyDuplicateTitleValidator,
  buildTaskForm,
  patchTaskIntoForm,
} from '../task-form/task-form.factory';

/**
 * Routed at 'edit/:taskId' (nested under 'boards/:boardId'). Same "smart
 * component owns the FormGroup, calls the service" split as AddTaskComponent,
 * plus a delete action.
 */
@Component({
  selector: 'app-edit-task',
  imports: [CommonModule, TaskFormComponent],
  templateUrl: './edit-task.component.html',
  styleUrl: './edit-task.component.css',
})
export class EditTaskComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private taskService = inject(TaskService);

  form?: FormGroup;
  boardId!: string;
  taskId!: string;
  isSaving = signal(false);
  saveError = signal<string | null>(null);

  private paramSubscription?: Subscription;

  ngOnInit(): void {
    // Reactive, not snapshot-only: the same 'edit/:taskId' route config is
    // reused when :taskId changes. whenLoaded() waits for the initial
    // GET /tasks so a deep link to this route still finds its task.
    this.paramSubscription = this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.boardId = params.get('boardId') ?? '';
          this.taskId = params.get('taskId') ?? '';
          return this.taskService.whenLoaded();
        }),
      )
      .subscribe((allTasks) => {
        const boardTasks = allTasks.filter((task) => task.boardId === this.boardId);
        const task = boardTasks.find((candidate) => candidate.id === this.taskId);
        if (!task) {
          this.router.navigate(['/not-found']);
          return;
        }
        this.form = buildTaskForm(this.fb);
        patchTaskIntoForm(this.fb, this.form, task);
        applyDuplicateTitleValidator(
          this.form,
          boardTasks.filter((t) => t.id !== this.taskId).map((t) => t.title),
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
      id: this.taskId,
      boardId: this.boardId,
      title: value.title,
      description: value.description,
      status: value.status,
      dueDate: value.dueDate ? value.dueDate : null,
      subtasks: value.subtasks,
    };
    this.isSaving.set(true);
    this.saveError.set(null);
    this.taskService.updateTask(task).subscribe({
      next: () => {
        this.form?.markAsPristine();
        this.router.navigate(['/boards', this.boardId], { queryParams: { taskSaved: 'updated' } });
      },
      error: (err: Error) => {
        this.isSaving.set(false);
        this.saveError.set(err.message);
      },
    });
  }

  delete(): void {
    if (!window.confirm('Delete this task? This cannot be undone.')) {
      return;
    }
    this.isSaving.set(true);
    this.saveError.set(null);
    this.taskService.deleteTask(this.taskId).subscribe({
      next: () => {
        this.form?.markAsPristine();
        this.router.navigate(['/boards', this.boardId], { queryParams: { taskSaved: 'deleted' } });
      },
      error: (err: Error) => {
        this.isSaving.set(false);
        this.saveError.set(err.message);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/boards', this.boardId]);
  }
}
