import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormGroup } from '@angular/forms';
import { buildTaskForm } from './task-form.factory';
import { TaskFormComponent } from './task-form.component';

describe('TaskFormComponent', () => {
  let fixture: ComponentFixture<TaskFormComponent>;
  let component: TaskFormComponent;
  let form: FormGroup;
  let el: HTMLElement;

  const query = <T extends HTMLElement>(selector: string) => el.querySelector<T>(selector);
  const submitButton = () => query<HTMLButtonElement>('button[type="submit"]')!;
  const buttonWithText = (text: string) =>
    Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes(text));

  function type(selector: string, value: string) {
    const input = query<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TaskFormComponent] });
    fixture = TestBed.createComponent(TaskFormComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    form = buildTaskForm(TestBed.inject(FormBuilder));
    fixture.componentRef.setInput('form', form);
    fixture.componentRef.setInput('heading', 'Add New Task');
    fixture.componentRef.setInput('submitLabel', 'Create Task');
    fixture.detectChanges();
  });

  describe('rendering from inputs', () => {
    it('shows the heading and submit label it is given', () => {
      expect(query('h2')!.textContent).toBe('Add New Task');
      expect(submitButton().textContent).toContain('Create Task');
    });

    it('shows the "No subtasks yet." empty state', () => {
      expect(el.textContent).toContain('No subtasks yet.');
    });

    it('only shows the Delete button in edit mode', () => {
      expect(buttonWithText('Delete Task')).toBeUndefined();

      fixture.componentRef.setInput('mode', 'edit');
      fixture.detectChanges();
      expect(buttonWithText('Delete Task')).toBeDefined();
    });

    it('shows nothing about errors until there is one', () => {
      expect(query('.field-error')).toBeNull();

      fixture.componentRef.setInput('errorMessage', 'Cannot reach the server.');
      fixture.detectChanges();
      expect(query('.field-error')!.textContent).toContain('Cannot reach the server.');
    });

    it('disables submit and shows "Saving…" while isSaving is true', () => {
      form.patchValue({ title: 'Valid title' });
      fixture.componentRef.setInput('isSaving', true);
      fixture.detectChanges();

      expect(submitButton().disabled).toBe(true);
      expect(submitButton().textContent).toContain('Saving');
    });
  });

  describe('validation UI', () => {
    it('disables submit while the form is invalid and enables it when valid', () => {
      expect(submitButton().disabled).toBe(true);
      type('#task-title', 'Fix the bug');
      expect(submitButton().disabled).toBe(false);
    });

    it('shows the required message after the title is touched, and the length message for short titles', () => {
      type('#task-title', '');
      expect(query('#task-title-error')!.textContent).toContain('Title is required.');

      type('#task-title', 'ab');
      expect(query('#task-title-error')!.textContent).toContain('at least 3 characters');
    });

    it('shows the duplicate-title message when the control carries that error', () => {
      type('#task-title', 'Fix the bug');
      form.get('title')!.setErrors({ duplicateTitle: true });
      form.get('title')!.markAsTouched();
      fixture.detectChanges();

      expect(query('#task-title-error')!.textContent).toContain('already exists');
    });
  });

  describe('outputs', () => {
    it('emits formSubmit on a valid submit', () => {
      const spy = jest.fn();
      component.formSubmit.subscribe(spy);
      type('#task-title', 'Fix the bug');

      query('form')!.dispatchEvent(new Event('submit'));

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('does NOT emit formSubmit when invalid, and marks every field touched so errors show', () => {
      const spy = jest.fn();
      component.formSubmit.subscribe(spy);

      query('form')!.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      expect(spy).not.toHaveBeenCalled();
      expect(form.touched).toBe(true);
      expect(query('#task-title-error')).not.toBeNull();
    });

    it('emits formCancel when Cancel is clicked', () => {
      const spy = jest.fn();
      component.formCancel.subscribe(spy);
      buttonWithText('Cancel')!.click();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('emits formDelete when Delete Task is clicked (edit mode)', () => {
      const spy = jest.fn();
      component.formDelete.subscribe(spy);
      fixture.componentRef.setInput('mode', 'edit');
      fixture.detectChanges();

      buttonWithText('Delete Task')!.click();

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('subtasks', () => {
    it('adds and removes subtask rows (the FormArray and the DOM stay in sync)', () => {
      buttonWithText('Add New Subtask')!.click();
      buttonWithText('Add New Subtask')!.click();
      fixture.detectChanges();
      expect(component.subtasks.length).toBe(2);
      expect(el.querySelectorAll('.subtask-row')).toHaveLength(2);
      expect(el.textContent).not.toContain('No subtasks yet.');

      query<HTMLButtonElement>('.subtask-row__remove')!.click();
      fixture.detectChanges();
      expect(component.subtasks.length).toBe(1);
      expect(el.querySelectorAll('.subtask-row')).toHaveLength(1);
    });

    it('requires a subtask title', () => {
      type('#task-title', 'Fix the bug');
      buttonWithText('Add New Subtask')!.click();
      fixture.detectChanges();

      expect(submitButton().disabled).toBe(true);
    });
  });

  // Bonus task: snapshot of the form's structure. Review the diff when it
  // fails - update it (jest -u) only if the markup change was intentional.
  it('matches its structural snapshot (create mode)', () => {
    expect(el.querySelector('form')).toMatchSnapshot();
  });
});
