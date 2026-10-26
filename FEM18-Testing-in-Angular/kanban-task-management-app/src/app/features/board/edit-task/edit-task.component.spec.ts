import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withRouterConfig } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { TaskService } from '../../../core/services/task-service/task.service';
import { makeTask } from '../../../testing/fixtures';
import { createTaskServiceMock } from '../../../testing/mocks';
import { EditTaskComponent } from './edit-task.component';

describe('EditTaskComponent (TaskService mocked)', () => {
  const stored = makeTask({
    id: '5',
    boardId: '2',
    title: 'Original',
    description: 'Desc',
    status: 'in-progress',
    dueDate: '2099-01-01',
    subtasks: [{ title: 'Sub', completed: true }],
  });
  let taskService: ReturnType<typeof createTaskServiceMock>;
  let harness: RouterTestingHarness;
  let router: Router;
  let el: HTMLElement;

  async function setup(url = '/boards/2/edit/5') {
    taskService = createTaskServiceMock([stored, makeTask({ id: '6', boardId: '2', title: 'Sibling' })]);
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [
            { path: 'boards/:boardId/edit/:taskId', component: EditTaskComponent },
            { path: 'boards/:boardId', children: [] },
            { path: 'not-found', children: [] },
          ],
          withRouterConfig({ paramsInheritanceStrategy: 'always' }),
        ),
        { provide: TaskService, useValue: taskService },
      ],
    });
    harness = await RouterTestingHarness.create();
    router = TestBed.inject(Router);
    const component = await harness.navigateByUrl(url, EditTaskComponent);
    el = harness.routeNativeElement as HTMLElement;
    return component;
  }

  const value = (selector: string) => el.querySelector<HTMLInputElement>(selector)!.value;
  const submit = () => {
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    harness.detectChanges();
  };
  const clickDelete = () =>
    Array.from(el.querySelectorAll('button')).find((b) => b.textContent!.includes('Delete Task'))!.click();

  afterEach(() => jest.restoreAllMocks());

  it('pre-fills the form with the stored task, including subtasks', async () => {
    await setup();
    expect(el.querySelector('h2')!.textContent).toBe('Edit Task');
    expect(value('#task-title')).toBe('Original');
    expect(value('#task-description')).toBe('Desc');
    expect(value('#task-status')).toBe('in-progress');
    expect(value('#task-due-date')).toBe('2099-01-01');
    expect(el.querySelectorAll('.subtask-row')).toHaveLength(1);
  });

  it('redirects to /not-found when the task does not exist on this board', async () => {
    await setup('/boards/2/edit/999');
    await harness.fixture.whenStable();
    expect(router.url).toBe('/not-found');
  });

  it('does not flag the task\'s own title as a duplicate, but does flag a sibling\'s', async () => {
    const component = await setup();
    const title = component.form!.get('title')!;
    expect(title.errors).toBeNull();

    title.setValue('sibling');
    expect(title.errors).toEqual({ duplicateTitle: true });
  });

  it('save calls updateTask with the full task (same id and boardId) and navigates with ?taskSaved=updated', async () => {
    const component = await setup();
    taskService.updateTask.mockReturnValue(of(stored));
    const navigate = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    component.form!.patchValue({ title: 'Renamed', status: 'done' });

    submit();

    expect(taskService.updateTask).toHaveBeenCalledWith({
      id: '5',
      boardId: '2',
      title: 'Renamed',
      description: 'Desc',
      status: 'done',
      dueDate: '2099-01-01',
      subtasks: [{ title: 'Sub', completed: true }],
    });
    expect(navigate).toHaveBeenCalledWith(['/boards', '2'], { queryParams: { taskSaved: 'updated' } });
  });

  it('shows the error and does not navigate when the update fails', async () => {
    await setup();
    taskService.updateTask.mockReturnValue(throwError(() => new Error('Server problem')));
    const navigate = jest.spyOn(router, 'navigate');

    submit();

    expect(navigate).not.toHaveBeenCalled();
    expect(el.querySelector('.field-error')!.textContent).toContain('Server problem');
  });

  it('cancel navigates back to the board, and the param subscription is released on destroy', async () => {
    const component = await setup();
    const navigate = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    component.cancel();
    expect(navigate).toHaveBeenCalledWith(['/boards', '2']);
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('does nothing on save before the form exists', async () => {
    const component = await setup();
    component.form = undefined;
    component.save();
    expect(taskService.updateTask).not.toHaveBeenCalled();
  });

  describe('delete', () => {
    it('does nothing if the user declines the confirmation', async () => {
      await setup();
      jest.spyOn(window, 'confirm').mockReturnValue(false);
      clickDelete();
      expect(taskService.deleteTask).not.toHaveBeenCalled();
    });

    it('deletes by id and navigates with ?taskSaved=deleted when confirmed', async () => {
      await setup();
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      taskService.deleteTask.mockReturnValue(of(undefined));
      const navigate = jest.spyOn(router, 'navigate').mockResolvedValue(true);

      clickDelete();

      expect(taskService.deleteTask).toHaveBeenCalledWith('5');
      expect(navigate).toHaveBeenCalledWith(['/boards', '2'], { queryParams: { taskSaved: 'deleted' } });
    });

    it('shows the error and stays when the delete fails', async () => {
      await setup();
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      taskService.deleteTask.mockReturnValue(throwError(() => new Error('That item no longer exists.')));
      const navigate = jest.spyOn(router, 'navigate');

      clickDelete();
      harness.detectChanges();

      expect(navigate).not.toHaveBeenCalled();
      expect(el.querySelector('.field-error')!.textContent).toContain('no longer exists');
    });
  });
});
