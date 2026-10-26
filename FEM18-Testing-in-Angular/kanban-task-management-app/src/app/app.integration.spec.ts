import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router, withRouterConfig } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { AuthService } from './core/services/auth-service/auth.service';
import { BoardService } from './core/services/board-service/board.service';
import { TaskService } from './core/services/task-service/task.service';
import { makeBoard, makeTask } from './testing/fixtures';

const BOARDS = `${environment.apiUrl}/boards`;
const TASKS = `${environment.apiUrl}/tasks`;

/**
 * Integration tests: the REAL routes, guards, components, services and
 * interceptors working together. Only the network is replaced
 * (HttpTestingController), so every assertion is about data flowing
 * server response -> service signal -> routed component -> DOM, and back.
 */
describe('Kanban app integration (real services, fake network)', () => {
  let harness: RouterTestingHarness;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withRouterConfig({ paramsInheritanceStrategy: 'always' })),
        provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    harness = await RouterTestingHarness.create();
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    http.verify();
    jest.restoreAllMocks();
  });

  /** What AppComponent does on start-up, answered with the given server data. */
  function startAppWith(boards = [makeBoard({ id: '1', name: 'Alpha' })], tasks = [makeTask({ id: '1', boardId: '1', title: 'Existing' })]) {
    TestBed.inject(BoardService).loadBoards();
    TestBed.inject(TaskService).loadTasks();
    http.expectOne(BOARDS).flush(boards);
    http.expectOne(TASKS).flush(tasks);
  }

  const el = () => harness.routeNativeElement as HTMLElement;

  it('redirects a logged-out visitor from /boards to /login (authGuard on the real routes)', async () => {
    await harness.navigateByUrl('/boards');
    expect(router.url).toBe('/login?returnUrl=%2Fboards');
    expect(el().querySelector('h1')!.textContent).toBe('Log in');
  });

  it('unknown URLs render the 404 page', async () => {
    await harness.navigateByUrl('/definitely/not/here');
    expect(el().querySelector('h1')!.textContent).toBe('404');
  });

  describe('when logged in', () => {
    beforeEach(() => TestBed.inject(AuthService).login());

    it('server data reaches the board list and the per-status counts', async () => {
      // AppComponent starts the load before any routed page renders.
      TestBed.inject(BoardService).loadBoards();
      TestBed.inject(TaskService).loadTasks();
      await harness.navigateByUrl('/boards');
      expect(el().textContent).toContain('Loading boards');

      http.expectOne(BOARDS).flush([makeBoard({ id: '1', name: 'Alpha' }), makeBoard({ id: '2', name: 'Beta', createdAt: '2026-09-01' })]);
      http.expectOne(TASKS).flush([makeTask({ id: '1', boardId: '1', status: 'done' }), makeTask({ id: '2', boardId: '1', status: 'done' })]);
      harness.detectChanges();

      expect(Array.from(el().querySelectorAll('.board-card__title')).map((t) => t.textContent!.trim())).toEqual(['Beta', 'Alpha']);
      expect(el().textContent).toContain('2 done');
      expect(el().textContent).not.toContain('Loading boards');
    });

    it('a failed load shows the friendly message from the error interceptor, and Retry recovers', async () => {
      await harness.navigateByUrl('/boards');
      TestBed.inject(BoardService).loadBoards();
      TestBed.inject(TaskService).loadTasks();
      http.expectOne(BOARDS).error(new ProgressEvent('error'));
      http.expectOne(TASKS).error(new ProgressEvent('error'));
      harness.detectChanges();

      expect(el().querySelector('.banner--error')!.textContent).toContain('Cannot reach the server');

      el().querySelector<HTMLButtonElement>('.banner--error button')!.click();
      http.expectOne(BOARDS).flush([makeBoard({ id: '1', name: 'Alpha' })]);
      http.expectOne(TASKS).flush([]);
      harness.detectChanges();

      expect(el().querySelector('.banner--error')).toBeNull();
      expect(el().querySelectorAll('.board-card')).toHaveLength(1);
    });

    it('opening a board through the lazy-loaded route shows its tasks; adding a task round-trips through the API', async () => {
      await harness.navigateByUrl('/boards');
      startAppWith();
      harness.detectChanges();

      // list -> board (lazy route + real :boardId param)
      el().querySelector<HTMLAnchorElement>('.board-card__link')!.click();
      await harness.fixture.whenStable();
      harness.detectChanges();
      expect(router.url).toBe('/boards/1');
      expect(el().querySelector('h1')!.textContent).toBe('Alpha');
      expect(el().textContent).toContain('Existing');

      // board -> add-task modal (nested child route)
      await router.navigateByUrl('/boards/1/new-task');
      await harness.fixture.whenStable();
      harness.detectChanges();
      const title = el().querySelector<HTMLInputElement>('#task-title')!;
      title.value = 'Brand new task';
      title.dispatchEvent(new Event('input'));
      harness.detectChanges();
      el().querySelector('form')!.dispatchEvent(new Event('submit'));

      // the request the user's click caused
      const post = http.expectOne(TASKS);
      expect(post.request.method).toBe('POST');
      expect(post.request.headers.get('Authorization')).toBe(`Bearer ${environment.authToken}`);
      expect(post.request.body).toMatchObject({ boardId: '1', title: 'Brand new task', status: 'todo' });
      post.flush({ ...post.request.body, id: '77' });

      await harness.fixture.whenStable();
      harness.detectChanges();

      // the response made it all the way back to the screen
      expect(router.url).toBe('/boards/1?taskSaved=created');
      expect(el().querySelector('.banner--success')!.textContent).toContain('Task created.');
      expect(Array.from(el().querySelectorAll('.kanban-card__title')).map((t) => t.textContent!.trim())).toEqual(['Existing', 'Brand new task']);
    });

    it('deleting a task from its edit form removes it from the board without a reload', async () => {
      await harness.navigateByUrl('/boards/1');
      startAppWith();
      harness.detectChanges();
      jest.spyOn(window, 'confirm').mockReturnValue(true);

      await router.navigateByUrl('/boards/1/edit/1');
      await harness.fixture.whenStable();
      harness.detectChanges();
      Array.from(el().querySelectorAll('button')).find((b) => b.textContent!.includes('Delete Task'))!.click();

      const del = http.expectOne(`${TASKS}/1`);
      expect(del.request.method).toBe('DELETE');
      del.flush({});
      await harness.fixture.whenStable();
      harness.detectChanges();

      expect(el().textContent).toContain('Task deleted.');
      expect(el().querySelectorAll('.kanban-card')).toHaveLength(0);
    });

    it('a 401 from the API logs the user out and sends them to /login', async () => {
      await harness.navigateByUrl('/boards');
      TestBed.inject(BoardService).loadBoards();
      http.expectOne(BOARDS).flush('no', { status: 401, statusText: 'Unauthorized' });
      await harness.fixture.whenStable();

      expect(TestBed.inject(AuthService).isLoggedIn()).toBe(false);
      expect(router.url).toBe('/login');
    });
  });
});
