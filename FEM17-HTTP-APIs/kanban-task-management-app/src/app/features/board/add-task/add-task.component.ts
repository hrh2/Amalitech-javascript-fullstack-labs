import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { NewTask } from '../../../core/models/task.model';
import { HasUnsavedChanges } from '../../../core/guards/unsaved-changes.guard';
import { TaskService } from '../../../core/services/task-service/task.service';
import { TaskFormComponent } from '../task-form/task-form.component';
import { TaskFormValue, applyDuplicateTitleValidator, buildTaskForm } from '../task-form/task-form.factory';

/**
 * Routed at 'new-task' (nested under 'boards/:boardId'). "Smart" component:
 * it owns the FormGroup and calls TaskService; the actual form fields live
 * in the presentational TaskFormComponent this template passes the
 * FormGroup into.
 */
@Component({
  selector: 'app-add-task',
  imports: [CommonModule, TaskFormComponent],
  templateUrl: './add-task.component.html',
  styleUrl: './add-task.component.css',
})
export class AddTaskComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private taskService = inject(TaskService);

  form?: FormGroup;
  boardId!: string;
  isSaving = signal(false);
  saveError = signal<string | null>(null);

  private paramSubscription?: Subscription;

  ngOnInit(): void {
    // Reactive, not snapshot-only: the form and its duplicate-title
    // validator must be rebuilt whenever the inherited :boardId changes.
    // whenLoaded() waits for the initial GET /tasks so a deep link to this
    // route still validates against the board's real task titles.
    this.paramSubscription = this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.boardId = params.get('boardId') ?? '';
          return this.taskService.whenLoaded();
        }),
      )
      .subscribe((allTasks) => {
        this.form = buildTaskForm(this.fb);
        applyDuplicateTitleValidator(
          this.form,
          allTasks.filter((task) => task.boardId === this.boardId).map((task) => task.title),
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
    const task: NewTask = {
      boardId: this.boardId,
      title: value.title,
      description: value.description,
      status: value.status,
      dueDate: value.dueDate ? value.dueDate : null,
      subtasks: value.subtasks,
    };
    this.isSaving.set(true);
    this.saveError.set(null);
    this.taskService.createTask(task).subscribe({
      next: () => {
        // Clear dirty state before navigating away so unsavedChangesGuard
        // doesn't ask for confirmation right after a successful save.
        this.form?.markAsPristine();
        this.router.navigate(['/boards', this.boardId], { queryParams: { taskSaved: 'created' } });
      },
      error: (err: Error) => {
        this.isSaving.set(false);
        this.saveError.set(err.message);
      },
    });
  }

  cancel(): void {
    // Navigating away runs unsavedChangesGuard, which prompts if the form is dirty.
    this.router.navigate(['/boards', this.boardId]);
  }
}
