import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { subtaskGroup } from './task-form.factory';

/**
 * Presentational reactive-forms component: it does not build the
 * FormGroup, call BoardService, or navigate - it only renders whatever
 * FormGroup its parent (AddTaskComponent/EditTaskComponent) passes in via
 * @Input and reports user intent back up via @Output. This is the same
 * @Input/@Output parent-child contract from FEM10, now carrying a
 * reactive form instead of a plain value.
 */
@Component({
  selector: 'app-task-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.css',
})
export class TaskFormComponent {
  @Input({ required: true }) form!: FormGroup;
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() heading = '';
  @Input() submitLabel = 'Save';

  @Output() formSubmit = new EventEmitter<void>();
  @Output() formCancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);

  get title() {
    return this.form.get('title')!;
  }

  get description() {
    return this.form.get('description')!;
  }

  get status() {
    return this.form.get('status')!;
  }

  get dueDate() {
    return this.form.get('dueDate')!;
  }

  get subtasks(): FormArray {
    return this.form.get('subtasks') as FormArray;
  }

  addSubtask(): void {
    this.subtasks.push(subtaskGroup(this.fb));
  }

  removeSubtask(index: number): void {
    this.subtasks.removeAt(index);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      // Reveal every field's validation state at once, even fields the
      // user never focused - this is the "show errors on a failed submit
      // attempt" half of the validation UX (the other half, showing an
      // error as soon as a single field is touched/blurred, is handled
      // per-field in the template).
      this.form.markAllAsTouched();
      return;
    }
    this.formSubmit.emit();
  }

  onCancel(): void {
    this.formCancel.emit();
  }
}
