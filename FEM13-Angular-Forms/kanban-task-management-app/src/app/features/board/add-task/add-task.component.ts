import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { BoardService } from '../../../core/services/board.service';
import { HasUnsavedChanges } from '../../../core/guards/unsaved-changes.guard';
import { TaskFormComponent } from '../task-form/task-form.component';
import { TaskFormValue, applyDuplicateTitleValidator, buildTaskForm } from '../task-form/task-form.factory';

/**
 * Routed at 'new-task' (nested under 'boards/:boardId'). "Smart" component:
 * it owns the FormGroup and all service/router interaction; the actual
 * form fields live in the presentational TaskFormComponent this template
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

  private paramSubscription?: Subscription;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private boardService: BoardService,
  ) {}

  ngOnInit(): void {
    // Reactive, not snapshot-only: reused across two 'new-task' visits
    // whose only difference is the inherited :boardId (see
    // BoardDetailComponent's identical reasoning), so the form and its
    // duplicate-title validator must be rebuilt whenever :boardId changes.
    this.paramSubscription = this.route.paramMap.subscribe((params) => {
      this.boardId = Number(params.get('boardId'));
      this.form = buildTaskForm(this.fb);
      applyDuplicateTitleValidator(this.form, this.boardService, this.boardId);
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
    this.boardService.addTask(
      this.boardId,
      value.title,
      value.description,
      value.status,
      value.dueDate ? value.dueDate : null,
      value.subtasks,
    );
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
