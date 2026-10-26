import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { makeTask } from '../../../testing/fixtures';
import { NewTask } from '../../models/task.model';
import { TaskService } from './task.service';

const URL = `${environment.apiUrl}/tasks`;

describe('TaskService', () => {
  let service: TaskService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(TaskService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  /** Loads the given tasks so write-method tests start from a populated service. */
  function loadWith(tasks = [makeTask({ id: '1' }), makeTask({ id: '2', boardId: '2' })]) {
    service.loadTasks();
    http.expectOne(URL).flush(tasks);
  }

  describe('loadTasks', () => {
    it('GETs /tasks, fills the signal and clears isLoading', () => {
      service.loadTasks();
      expect(service.isLoading()).toBe(true);

      const req = http.expectOne(URL);
      expect(req.request.method).toBe('GET');
      req.flush([makeTask()]);

      expect(service.tasks()).toEqual([makeTask()]);
      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBeNull();
    });

    it('does not request again once loaded, or while a request is running', () => {
      service.loadTasks();
      service.loadTasks(); // still in flight
      http.expectOne(URL).flush([]);
      service.loadTasks(); // already loaded
      http.expectNone(URL);
    });

    it('stores the error message on failure and allows a retry', () => {
      service.loadTasks();
      http.expectOne(URL).flush('boom', { status: 500, statusText: 'Server Error' });

      expect(service.error()).toContain('500');
      expect(service.isLoading()).toBe(false);
      expect(service.tasks()).toEqual([]);

      service.loadTasks(); // retry
      expect(service.error()).toBeNull();
      http.expectOne(URL).flush([makeTask()]);
      expect(service.tasks()).toHaveLength(1);
    });
  });

  describe('whenLoaded', () => {
    it('emits the tasks once the first GET has completed', async () => {
      const result = firstValueFrom(service.whenLoaded());
      service.loadTasks();
      http.expectOne(URL).flush([makeTask({ id: '9' })]);
      TestBed.tick(); // flushes the effect behind toObservable()

      await expect(result).resolves.toEqual([makeTask({ id: '9' })]);
    });
  });

  describe('asynchronous behaviour with fake timers', () => {
    afterEach(() => jest.useRealTimers());

    it('whenLoaded() does not emit while the server is slow, and emits once the reply arrives', async () => {
      jest.useFakeTimers();
      const emitted = jest.fn();
      service.whenLoaded().subscribe(emitted);

      service.loadTasks();
      const req = http.expectOne(URL);
      setTimeout(() => req.flush([makeTask()]), 300); // pretend network latency

      jest.advanceTimersByTime(299);
      TestBed.tick();
      expect(emitted).not.toHaveBeenCalled();
      expect(service.isLoading()).toBe(true);

      jest.advanceTimersByTime(1);
      TestBed.tick();
      expect(emitted).toHaveBeenCalledWith([makeTask()]);
      expect(service.isLoading()).toBe(false);
    });
  });

  describe('createTask', () => {
    const newTask: NewTask = { ...makeTask(), title: 'New one' };

    it('POSTs the body and appends the server response (with its id) to the signal', () => {
      loadWith();
      const { id: _ignored, ...body } = newTask;
      let created: unknown;
      service.createTask(body).subscribe((t) => (created = t));

      const req = http.expectOne(URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush({ ...body, id: '77' });

      expect(created).toMatchObject({ id: '77', title: 'New one' });
      expect(service.tasks().map((t) => t.id)).toEqual(['1', '2', '77']);
    });

    it('leaves the signal untouched and surfaces the error when the POST fails', () => {
      loadWith();
      const { id: _ignored, ...body } = newTask;
      const onError = jest.fn();
      service.createTask(body).subscribe({ error: onError });

      http.expectOne(URL).flush('nope', { status: 500, statusText: 'Server Error' });

      expect(onError).toHaveBeenCalledTimes(1);
      expect(service.tasks()).toHaveLength(2);
    });
  });

  describe('updateTask', () => {
    it('PUTs the whole task to /tasks/:id and replaces it in the signal', () => {
      loadWith();
      const edited = makeTask({ id: '1', title: 'Edited', status: 'done' });
      service.updateTask(edited).subscribe();

      const req = http.expectOne(`${URL}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(edited);
      req.flush(edited);

      expect(service.tasks().find((t) => t.id === '1')).toEqual(edited);
      expect(service.tasks()).toHaveLength(2);
    });

    it('returns a new array rather than mutating the old one', () => {
      loadWith();
      const before = service.tasks();
      service.updateTask(makeTask({ id: '1', title: 'x' })).subscribe();
      http.expectOne(`${URL}/1`).flush(makeTask({ id: '1', title: 'x' }));

      expect(service.tasks()).not.toBe(before);
      expect(before[0].title).toBe('Audit pages');
    });
  });

  describe('deleteTask', () => {
    it('DELETEs /tasks/:id and removes the task from the signal', () => {
      loadWith();
      service.deleteTask('1').subscribe();

      const req = http.expectOne(`${URL}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});

      expect(service.tasks().map((t) => t.id)).toEqual(['2']);
    });

    it('keeps the task when the server refuses', () => {
      loadWith();
      service.deleteTask('1').subscribe({ error: () => undefined });
      http.expectOne(`${URL}/1`).flush('no', { status: 404, statusText: 'Not Found' });

      expect(service.tasks()).toHaveLength(2);
    });
  });

  describe('deleteTasksOfBoard', () => {
    it('deletes only that board\'s tasks, one request each', async () => {
      loadWith([makeTask({ id: '1', boardId: '1' }), makeTask({ id: '2', boardId: '1' }), makeTask({ id: '3', boardId: '2' })]);
      const done = firstValueFrom(service.deleteTasksOfBoard('1'));

      http.expectOne(`${URL}/1`).flush({});
      http.expectOne(`${URL}/2`).flush({});
      http.expectNone(`${URL}/3`);
      await done;

      expect(service.tasks().map((t) => t.id)).toEqual(['3']);
    });

    it('still emits when the board has no tasks (so the board delete can continue)', async () => {
      loadWith();
      await expect(firstValueFrom(service.deleteTasksOfBoard('99'))).resolves.toBeNull();
    });
  });
});
