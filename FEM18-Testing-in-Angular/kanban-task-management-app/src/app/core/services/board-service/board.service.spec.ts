import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { makeBoard, makeTask } from '../../../testing/fixtures';
import { TaskService } from '../task-service/task.service';
import { BoardService } from './board.service';

const BOARDS = `${environment.apiUrl}/boards`;
const TASKS = `${environment.apiUrl}/tasks`;

describe('BoardService', () => {
  let service: BoardService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(BoardService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function loadBoards(boards = [makeBoard({ id: '1' }), makeBoard({ id: '2', name: 'Mobile' })]) {
    service.loadBoards();
    http.expectOne(BOARDS).flush(boards);
  }

  it('loadBoards GETs /boards, fills the signal and marks hasLoaded', () => {
    service.loadBoards();
    expect(service.isLoading()).toBe(true);
    http.expectOne(BOARDS).flush([makeBoard()]);

    expect(service.boards()).toEqual([makeBoard()]);
    expect(service.hasLoaded()).toBe(true);
    expect(service.isLoading()).toBe(false);
  });

  it('loadBoards is cached: a second call after success sends nothing', () => {
    loadBoards();
    service.loadBoards();
    http.expectNone(BOARDS);
  });

  it('loadBoards stores an error and can be retried', () => {
    service.loadBoards();
    http.expectOne(BOARDS).flush('x', { status: 500, statusText: 'Server Error' });
    expect(service.error()).toBeTruthy();
    expect(service.hasLoaded()).toBe(false);

    service.loadBoards();
    http.expectOne(BOARDS).flush([]);
    expect(service.error()).toBeNull();
    expect(service.hasLoaded()).toBe(true);
  });

  it('createBoard POSTs the new board and appends the server copy', () => {
    loadBoards();
    const body = { name: 'New', description: '', createdAt: '2026-10-26' };
    service.createBoard(body).subscribe();

    const req = http.expectOne(BOARDS);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ ...body, id: '3' });

    expect(service.boards().map((b) => b.id)).toEqual(['1', '2', '3']);
  });

  describe('deleteBoard', () => {
    it('deletes the board\'s tasks first, then the board, then updates the signal', () => {
      const taskService = TestBed.inject(TaskService);
      loadBoards();
      taskService.loadTasks();
      http.expectOne(TASKS).flush([makeTask({ id: '5', boardId: '1' }), makeTask({ id: '6', boardId: '2' })]);

      service.deleteBoard('1').subscribe();

      // The board DELETE must not be sent until the task DELETE has finished.
      http.expectNone(`${BOARDS}/1`);
      http.expectOne(`${TASKS}/5`).flush({});
      const boardDelete = http.expectOne(`${BOARDS}/1`);
      expect(boardDelete.request.method).toBe('DELETE');
      boardDelete.flush({});

      expect(service.boards().map((b) => b.id)).toEqual(['2']);
      expect(taskService.tasks().map((t) => t.id)).toEqual(['6']);
    });

    it('works for a board with no tasks', () => {
      TestBed.inject(TaskService);
      loadBoards();
      service.deleteBoard('2').subscribe();

      http.expectOne(`${BOARDS}/2`).flush({});
      expect(service.boards().map((b) => b.id)).toEqual(['1']);
    });

    it('does not delete the board, and surfaces the error, when a task delete fails', () => {
      const taskService = TestBed.inject(TaskService);
      loadBoards();
      taskService.loadTasks();
      http.expectOne(TASKS).flush([makeTask({ id: '5', boardId: '1' })]);
      const onError = jest.fn();

      service.deleteBoard('1').subscribe({ error: onError });
      http.expectOne(`${TASKS}/5`).flush('x', { status: 500, statusText: 'Server Error' });

      http.expectNone(`${BOARDS}/1`);
      expect(onError).toHaveBeenCalled();
      expect(service.boards()).toHaveLength(2);
    });
  });
});
