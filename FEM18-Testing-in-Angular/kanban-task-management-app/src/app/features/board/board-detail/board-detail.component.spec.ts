import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { BoardService } from '../../../core/services/board-service/board.service';
import { TaskService } from '../../../core/services/task-service/task.service';
import { makeBoard, makeTask } from '../../../testing/fixtures';
import { createBoardServiceMock, createTaskServiceMock } from '../../../testing/mocks';
import { BoardDetailComponent } from './board-detail.component';

describe('BoardDetailComponent (services mocked)', () => {
  const boards = [makeBoard({ id: '1', name: 'First' }), makeBoard({ id: '2', name: 'Second' }), makeBoard({ id: '3', name: 'Third' })];
  const tasks = [
    makeTask({ id: '1', boardId: '2', title: 'Todo A', status: 'todo' }),
    makeTask({ id: '2', boardId: '2', title: 'Doing A', status: 'in-progress', dueDate: '2026-09-01', subtasks: [{ title: 's', completed: true }, { title: 't', completed: false }] }),
    makeTask({ id: '3', boardId: '2', title: 'Done A', status: 'done' }),
    makeTask({ id: '4', boardId: '1', title: 'Other board', status: 'todo' }),
  ];

  let boardService: ReturnType<typeof createBoardServiceMock>;
  let taskService: ReturnType<typeof createTaskServiceMock>;
  let harness: RouterTestingHarness;
  let router: Router;
  let el: HTMLElement;

  async function setup(url = '/boards/2') {
    boardService = createBoardServiceMock(boards);
    taskService = createTaskServiceMock(tasks);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'boards', children: [] },
          { path: 'boards/:boardId', component: BoardDetailComponent },
          { path: 'not-found', children: [] },
        ]),
        { provide: BoardService, useValue: boardService },
        { provide: TaskService, useValue: taskService },
      ],
    });
    harness = await RouterTestingHarness.create();
    router = TestBed.inject(Router);
    const component = await harness.navigateByUrl(url, BoardDetailComponent);
    el = harness.routeNativeElement as HTMLElement;
    return component;
  }

  const column = (n: number) => el.querySelectorAll('.kanban-column')[n] as HTMLElement;
  const cards = (n: number) => Array.from(column(n).querySelectorAll('.kanban-card__title')).map((c) => c.textContent!.trim());

  it('shows the board name and only that board\'s tasks, grouped into Todo / Doing / Done', async () => {
    await setup();
    expect(el.querySelector('h1')!.textContent).toBe('Second');
    expect(column(0).querySelector('h2')!.textContent).toContain('Todo (1)');
    expect(column(1).querySelector('h2')!.textContent).toContain('Doing (1)');
    expect(column(2).querySelector('h2')!.textContent).toContain('Done (1)');
    expect(cards(0)).toEqual(['Todo A']);
    expect(cards(1)).toEqual(['Doing A']);
    expect(el.textContent).not.toContain('Other board');
  });

  it('shows due date and subtask progress on a card', async () => {
    await setup();
    expect(column(1).textContent).toContain('Due 2026-09-01');
    expect(column(1).textContent).toContain('1/2 subtasks');
  });

  it('links each card to its edit route', async () => {
    await setup();
    expect(column(0).querySelector('a')!.getAttribute('href')).toBe('/boards/2/edit/1');
  });

  it('shows "No tasks." in empty columns and updates when the service data changes', async () => {
    await setup();
    taskService.tasks.set([]);
    harness.detectChanges();

    expect(el.querySelectorAll('.empty-state--column')).toHaveLength(3);

    taskService.tasks.set([makeTask({ id: '9', boardId: '2', title: 'Fresh', status: 'done' })]);
    harness.detectChanges();
    expect(cards(2)).toEqual(['Fresh']);
  });

  it('offers Previous and Next links based on the board\'s position in the list', async () => {
    await setup('/boards/2');
    const links = Array.from(el.querySelectorAll('.board-subnav__adjacent a')).map((a) => a.getAttribute('href'));
    expect(links).toEqual(['/boards/1', '/boards/3']);
  });

  it('omits Previous on the first board and Next on the last', async () => {
    await setup('/boards/1');
    expect(el.querySelectorAll('.board-subnav__adjacent a')).toHaveLength(1);
    expect(el.querySelector('.board-subnav__adjacent a')!.textContent).toContain('Next');
  });

  it('reacts to a :boardId change on the same component instance', async () => {
    const component = await setup('/boards/2');
    await harness.navigateByUrl('/boards/3');
    expect(el.querySelector('h1')!.textContent).toBe('Third');
    expect(component.board()?.id).toBe('3');
  });

  describe('feedback and states', () => {
    it.each([
      ['created', 'Task created.'],
      ['updated', 'Task updated.'],
      ['deleted', 'Task deleted.'],
    ])('shows a banner for ?taskSaved=%s and lets the user dismiss it', async (param, message) => {
      await setup(`/boards/2?taskSaved=${param}`);
      expect(el.querySelector('.banner--success')!.textContent).toContain(message);

      el.querySelector<HTMLButtonElement>('.banner__dismiss')!.click();
      harness.detectChanges();
      expect(el.querySelector('.banner--success')).toBeNull();
    });

    it('shows a loading message while the services load', async () => {
      await setup();
      taskService.isLoading.set(true);
      harness.detectChanges();
      expect(el.textContent).toContain('Loading board');
    });

    it('shows a load error with a Retry that reloads boards and tasks', async () => {
      await setup();
      taskService.error.set('Cannot reach the server.');
      harness.detectChanges();
      expect(el.querySelector('.banner--error')!.textContent).toContain('Cannot reach the server.');

      el.querySelector<HTMLButtonElement>('.banner--error button')!.click();
      expect(boardService.loadBoards).toHaveBeenCalled();
      expect(taskService.loadTasks).toHaveBeenCalled();
    });

    it('redirects to /not-found for an unknown board id once boards have loaded', async () => {
      await setup('/boards/99');
      await harness.fixture.whenStable();
      expect(router.url).toBe('/not-found');
    });
  });

  describe('deleting the board', () => {
    const clickDelete = () =>
      Array.from(el.querySelectorAll('button')).find((b) => b.textContent!.includes('Delete Board'))!.click();

    afterEach(() => jest.restoreAllMocks());

    it('asks for confirmation and does nothing if the user cancels', async () => {
      await setup();
      jest.spyOn(window, 'confirm').mockReturnValue(false);
      clickDelete();
      expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Second'));
      expect(boardService.deleteBoard).not.toHaveBeenCalled();
    });

    it('deletes the board by id and navigates to /boards on success', async () => {
      await setup();
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      boardService.deleteBoard.mockReturnValue(of(undefined));
      const navigate = jest.spyOn(router, 'navigate').mockResolvedValue(true);

      clickDelete();

      expect(boardService.deleteBoard).toHaveBeenCalledWith('2');
      expect(navigate).toHaveBeenCalledWith(['/boards']);
    });

    it('stays on the page and shows the error if the delete fails', async () => {
      await setup();
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      boardService.deleteBoard.mockReturnValue(throwError(() => new Error('Server problem')));
      const navigate = jest.spyOn(router, 'navigate');

      clickDelete();
      harness.detectChanges();

      expect(navigate).not.toHaveBeenCalled();
      expect(el.textContent).toContain('Server problem');
    });
  });
});
