import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { Board } from '../../core/models/board.model';
import { BoardService } from '../../core/services/board-service/board.service';
import { TaskService } from '../../core/services/task-service/task.service';
import { makeBoard, makeTask } from '../../testing/fixtures';
import { createBoardServiceMock, createTaskServiceMock } from '../../testing/mocks';
import { BoardListComponent } from './board-list.component';

describe('BoardListComponent (services mocked)', () => {
  const boards: Board[] = [
    makeBoard({ id: '1', name: 'Bravo', createdAt: '2026-08-20' }),
    makeBoard({ id: '2', name: 'Alpha', createdAt: '2026-08-01' }),
  ];
  const tasks = [
    makeTask({ id: '1', boardId: '1', status: 'todo' }),
    makeTask({ id: '2', boardId: '1', status: 'done' }),
    makeTask({ id: '3', boardId: '1', status: 'done' }),
  ];

  let boardService: ReturnType<typeof createBoardServiceMock>;
  let harness: RouterTestingHarness;
  let router: Router;
  let el: HTMLElement;

  async function setup(url = '/boards') {
    boardService = createBoardServiceMock(boards);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'boards', component: BoardListComponent }, { path: 'boards/:id', children: [] }]),
        { provide: BoardService, useValue: boardService },
        { provide: TaskService, useValue: createTaskServiceMock(tasks) },
      ],
    });
    harness = await RouterTestingHarness.create();
    router = TestBed.inject(Router);
    const component = await harness.navigateByUrl(url, BoardListComponent);
    el = harness.routeNativeElement as HTMLElement;
    return component;
  }

  const titles = () => Array.from(el.querySelectorAll('.board-card__title')).map((t) => t.textContent!.trim());

  it('renders one card per board, most recently created first by default', async () => {
    await setup();
    expect(titles()).toEqual(['Bravo', 'Alpha']);
  });

  it('re-sorts by name when ?sort=name is in the URL', async () => {
    await setup('/boards?sort=name');
    expect(titles()).toEqual(['Alpha', 'Bravo']);

    // The service data changing re-renders in the same sort order.
    boardService.boards.set([makeBoard({ id: '9', name: 'Zed', createdAt: '2030-01-01' }), ...boards]);
    harness.detectChanges();
    expect(titles()).toEqual(['Alpha', 'Bravo', 'Zed']);
  });

  it('shows per-status task counts from the TaskService data', async () => {
    await setup();
    const bravoCounts = el.querySelectorAll('.board-card')[0].querySelector('.board-card__counts')!.textContent!;
    expect(bravoCounts).toContain('1 todo');
    expect(bravoCounts).toContain('0 doing');
    expect(bravoCounts).toContain('2 done');
  });

  it('hides the counts row for a board with no tasks', async () => {
    await setup();
    expect(el.querySelectorAll('.board-card')[1].querySelector('.board-card__counts')).toBeNull();
  });

  it('shows the loading text while loading, instead of the cards', async () => {
    await setup();
    boardService.isLoading.set(true);
    harness.detectChanges();

    expect(el.textContent).toContain('Loading boards');
    expect(el.querySelector('.board-grid')).toBeNull();
  });

  it('shows an empty state when there are no boards', async () => {
    await setup();
    boardService.boards.set([]);
    harness.detectChanges();
    expect(el.textContent).toContain('No boards yet.');
  });

  it('shows the load error and a Retry button that asks both services to load again', async () => {
    const component = await setup();
    const taskLoad = TestBed.inject(TaskService).loadTasks as jest.Mock;
    boardService.error.set('Cannot reach the server.');
    harness.detectChanges();

    expect(el.querySelector('.banner--error')!.textContent).toContain('Cannot reach the server.');
    boardService.loadBoards.mockClear();
    el.querySelector<HTMLButtonElement>('.banner--error button')!.click();

    expect(boardService.loadBoards).toHaveBeenCalledTimes(1);
    expect(taskLoad).toHaveBeenCalled();
    expect(component).toBeTruthy();
  });

  describe('creating a board', () => {
    async function fillAndSubmit(name: string) {
      el.querySelector<HTMLButtonElement>('.page-header button')!.click();
      harness.detectChanges();
      await harness.fixture.whenStable();

      const input = el.querySelector<HTMLInputElement>('#board-name')!;
      input.value = name;
      input.dispatchEvent(new Event('input'));
      harness.detectChanges();
      await harness.fixture.whenStable();
      harness.detectChanges();

      el.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
      harness.detectChanges();
    }

    it('opens the modal, calls createBoard with the trimmed values, then navigates to the new board', async () => {
      await setup();
      boardService.createBoard.mockReturnValue(of(makeBoard({ id: '42', name: 'Fresh' })));
      const navigate = jest.spyOn(router, 'navigate').mockResolvedValue(true);

      await fillAndSubmit('  Fresh  ');

      expect(boardService.createBoard).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Fresh', description: '', createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) }),
      );
      expect(navigate).toHaveBeenCalledWith(['/boards', '42']);
      expect(el.querySelector('.modal-backdrop')).toBeNull();
    });

    it('does not call the service when the name is too short', async () => {
      await setup();
      await fillAndSubmit('ab');

      expect(boardService.createBoard).not.toHaveBeenCalled();
      expect(el.querySelector('.modal-backdrop')).not.toBeNull();
    });

    it('keeps the modal open and shows the error when the request fails', async () => {
      await setup();
      boardService.createBoard.mockReturnValue(throwError(() => new Error('Server down')));
      const navigate = jest.spyOn(router, 'navigate');

      await fillAndSubmit('Fresh');

      expect(navigate).not.toHaveBeenCalled();
      expect(el.querySelector('.modal-backdrop')!.textContent).toContain('Server down');
    });

    it('opens the modal straight away for ?create=1 (the sidebar link)', async () => {
      await setup('/boards?create=1');
      expect(el.querySelector('.modal-backdrop')).not.toBeNull();
    });
  });
});
