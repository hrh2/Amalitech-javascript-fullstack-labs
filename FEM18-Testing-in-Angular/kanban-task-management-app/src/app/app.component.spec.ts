import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AppComponent } from './app.component';
import { AuthService } from './core/services/auth-service/auth.service';
import { BoardService } from './core/services/board-service/board.service';
import { TaskService } from './core/services/task-service/task.service';
import { makeBoard } from './testing/fixtures';
import { createBoardServiceMock, createTaskServiceMock } from './testing/mocks';

describe('AppComponent (shell)', () => {
  const boards = [makeBoard({ id: '1', name: 'Alpha' }), makeBoard({ id: '2', name: 'Beta' })];
  let boardService: ReturnType<typeof createBoardServiceMock>;
  let taskService: ReturnType<typeof createTaskServiceMock>;

  function create() {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    boardService = createBoardServiceMock(boards);
    taskService = createTaskServiceMock();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'boards/:boardId', children: [] }, { path: 'boards', children: [] }]),
        { provide: BoardService, useValue: boardService },
        { provide: TaskService, useValue: taskService },
      ],
    });
    // jsdom has no matchMedia; the component only calls it when no theme is saved.
    window.matchMedia = jest.fn().mockReturnValue({ matches: false }) as unknown as typeof window.matchMedia;
  });

  it('starts the initial data load for boards and tasks exactly once', () => {
    create();
    expect(boardService.loadBoards).toHaveBeenCalledTimes(1);
    expect(taskService.loadTasks).toHaveBeenCalledTimes(1);
  });

  it('lists every board in the sidebar with a count', () => {
    const el: HTMLElement = create().nativeElement;
    const sidebar = el.querySelector('.sidebar')!;
    expect(sidebar.textContent).toContain('All Boards (2)');
    expect(Array.from(sidebar.querySelectorAll('.sidebar__board:not(.sidebar__board--create)')).map((a) => a.textContent!.trim())).toEqual(['Alpha', 'Beta']);
  });

  it('updates the sidebar when the boards signal changes', () => {
    const fixture = create();
    boardService.boards.set([...boards, makeBoard({ id: '3', name: 'Gamma' })]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sidebar').textContent).toContain('Gamma');
  });

  describe('theme', () => {
    it('uses the saved theme', () => {
      localStorage.setItem('kanban-theme', 'dark');
      create();
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('falls back to the OS preference when nothing is saved', () => {
      (window.matchMedia as jest.Mock).mockReturnValue({ matches: true });
      create();
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('toggling flips the attribute and persists the choice', () => {
      const fixture = create();
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');

      fixture.nativeElement.querySelector('.theme-switch').click();

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(localStorage.getItem('kanban-theme')).toBe('dark');
    });
  });

  describe('current board name (mobile header)', () => {
    it('shows "Boards" when not on a board', () => {
      const el: HTMLElement = create().nativeElement;
      expect(el.querySelector('.mobile-topbar__trigger')!.textContent).toContain('Boards');
    });

    it('shows the board name after navigating to /boards/:id', async () => {
      const fixture = create();
      await TestBed.inject(Router).navigateByUrl('/boards/2');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.mobile-topbar__trigger').textContent).toContain('Beta');
    });
  });

  describe('sidebar auth links', () => {
    it('offers "Log in" when logged out and "Signed in" when logged in', () => {
      const fixture = create();
      const text = () => fixture.nativeElement.querySelector('.sidebar__utility-nav').textContent;
      expect(text()).toContain('Log in');

      TestBed.inject(AuthService).login();
      fixture.detectChanges();
      expect(text()).toContain('Signed in');
    });
  });

  it('toggles the mobile menu open and closed', () => {
    const fixture = create();
    const el: HTMLElement = fixture.nativeElement;
    el.querySelector<HTMLButtonElement>('.mobile-topbar__trigger')!.click();
    fixture.detectChanges();
    expect(el.querySelector('.mobile-menu')).not.toBeNull();

    el.querySelector<HTMLButtonElement>('.mobile-topbar__trigger')!.click();
    fixture.detectChanges();
    expect(el.querySelector('.mobile-menu')).toBeNull();
  });

  it('hides and shows the sidebar', () => {
    const fixture = create();
    const el: HTMLElement = fixture.nativeElement;
    el.querySelector<HTMLButtonElement>('.sidebar__hide-btn')!.click();
    fixture.detectChanges();
    expect(el.querySelector('.sidebar')).toBeNull();

    el.querySelector<HTMLButtonElement>('.sidebar-show-btn')!.click();
    fixture.detectChanges();
    expect(el.querySelector('.sidebar')).not.toBeNull();
  });
});
