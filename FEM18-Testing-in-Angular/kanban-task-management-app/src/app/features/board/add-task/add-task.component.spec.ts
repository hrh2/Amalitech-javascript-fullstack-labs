import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withRouterConfig } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { TaskService } from '../../../core/services/task-service/task.service';
import { makeTask } from '../../../testing/fixtures';
import { createTaskServiceMock } from '../../../testing/mocks';
import { AddTaskComponent } from './add-task.component';

describe('AddTaskComponent (TaskService mocked)', () => {
  let taskService: ReturnType<typeof createTaskServiceMock>;
  let harness: RouterTestingHarness;
  let router: Router;
  let component: AddTaskComponent;
  let el: HTMLElement;

  async function setup() {
    taskService = createTaskServiceMock([makeTask({ id: '1', boardId: '2', title: 'Existing task' }), makeTask({ id: '2', boardId: '3', title: 'Other board task' })]);
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [
            { path: 'boards/:boardId/new-task', component: AddTaskComponent },
            { path: 'boards/:boardId', children: [] },
          ],
          withRouterConfig({ paramsInheritanceStrategy: 'always' }),
        ),
        { provide: TaskService, useValue: taskService },
      ],
    });
    harness = await RouterTestingHarness.create();
    router = TestBed.inject(Router);
    component = await harness.navigateByUrl('/boards/2/new-task', AddTaskComponent);
    el = harness.routeNativeElement as HTMLElement;
  }

  function type(selector: string, value: string) {
    const input = el.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    harness.detectChanges();
  }

  const submit = () => {
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    harness.detectChanges();
  };

  beforeEach(setup);

  it('builds the form once the tasks are available and renders it in a modal', () => {
    expect(taskService.whenLoaded).toHaveBeenCalled();
    expect(component.form).toBeDefined();
    expect(el.querySelector('h2')!.textContent).toBe('Add New Task');
  });

  it('is not dirty until the user types (so leaving needs no confirmation)', () => {
    expect(component.hasUnsavedChanges()).toBe(false);
    type('#task-title', 'Hello');
    component.form!.get('title')!.markAsDirty();
    expect(component.hasUnsavedChanges()).toBe(true);
  });

  it('rejects a title already used on THIS board, but allows one used on another board', () => {
    type('#task-title', 'existing TASK');
    expect(component.form!.get('title')!.errors).toEqual({ duplicateTitle: true });

    type('#task-title', 'Other board task');
    expect(component.form!.get('title')!.errors).toBeNull();
  });

  it('on a valid submit calls createTask with the board id and form values, then navigates with ?taskSaved=created', () => {
    taskService.createTask.mockReturnValue(of(makeTask({ id: '50' })));
    const navigate = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    type('#task-title', 'Write tests');

    submit();

    expect(taskService.createTask).toHaveBeenCalledWith({
      boardId: '2',
      title: 'Write tests',
      description: '',
      status: 'todo',
      dueDate: null,
      subtasks: [],
    });
    expect(navigate).toHaveBeenCalledWith(['/boards', '2'], { queryParams: { taskSaved: 'created' } });
    expect(component.hasUnsavedChanges()).toBe(false);
  });

  it('does not call the service for an invalid form', () => {
    submit();
    expect(taskService.createTask).not.toHaveBeenCalled();
  });

  it('on failure stays put, shows the message, and keeps what the user typed', () => {
    taskService.createTask.mockReturnValue(throwError(() => new Error('Cannot reach the server.')));
    const navigate = jest.spyOn(router, 'navigate');
    type('#task-title', 'Write tests');

    submit();

    expect(navigate).not.toHaveBeenCalled();
    expect(el.querySelector('.field-error')!.textContent).toContain('Cannot reach the server.');
    expect(component.form!.get('title')!.value).toBe('Write tests');
    expect(component.isSaving()).toBe(false);
  });

  it('does nothing on save before the form exists, and cleans up on destroy', () => {
    component.form = undefined;
    component.save();
    expect(taskService.createTask).not.toHaveBeenCalled();
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('cancel navigates back to the board', () => {
    const navigate = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    component.cancel();
    expect(navigate).toHaveBeenCalledWith(['/boards', '2']);
  });
});
