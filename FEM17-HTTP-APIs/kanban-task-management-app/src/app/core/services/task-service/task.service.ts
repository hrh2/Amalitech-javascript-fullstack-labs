import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, filter, forkJoin, map, of, take, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { NewTask, Task } from '../../models/task.model';

/**
 * All HTTP calls for tasks live here, and so does the in-memory copy of the
 * result. Components read the `tasks` signal and call the methods below;
 * they never touch HttpClient.
 *
 * Every task is fetched once (GET /tasks) and kept in `tasks`. Each write
 * then updates that copy from the server's response, so the UI changes
 * without a reload and without re-fetching the whole list.
 */
@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/tasks`;

  private readonly tasksState = signal<Task[]>([]);
  private readonly hasLoadedState = signal(false);

  readonly tasks = this.tasksState.asReadonly();
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  private readonly hasLoaded$ = toObservable(this.hasLoadedState);

  /** GET /tasks - only hits the network the first time (or after a failure). */
  loadTasks(): void {
    if (this.hasLoadedState() || this.isLoading()) {
      return;
    }
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<Task[]>(this.url).subscribe({
      next: (tasks) => {
        this.tasksState.set(tasks);
        this.hasLoadedState.set(true);
        this.isLoading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.isLoading.set(false);
      },
    });
  }

  /** Emits the loaded tasks once, waiting for the first GET if it is still running. */
  whenLoaded(): Observable<Task[]> {
    return this.hasLoaded$.pipe(
      filter(Boolean),
      take(1),
      map(() => this.tasksState()),
    );
  }

  /** POST /tasks */
  createTask(task: NewTask): Observable<Task> {
    return this.http.post<Task>(this.url, task).pipe(tap((created) => this.tasksState.update((all) => [...all, created])));
  }

  /** PUT /tasks/:id - sends the whole task, replacing the stored one. */
  updateTask(task: Task): Observable<Task> {
    return this.http
      .put<Task>(`${this.url}/${task.id}`, task)
      .pipe(tap((saved) => this.tasksState.update((all) => all.map((t) => (t.id === saved.id ? saved : t)))));
  }

  /** DELETE /tasks/:id */
  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`).pipe(tap(() => this.tasksState.update((all) => all.filter((t) => t.id !== id))));
  }

  /** Deletes every task of a board (one DELETE each - the API has no cascade). */
  deleteTasksOfBoard(boardId: string): Observable<unknown> {
    const requests = this.tasksState()
      .filter((t) => t.boardId === boardId)
      .map((t) => this.deleteTask(t.id));
    // forkJoin([]) completes without emitting, so a board with no tasks needs of().
    return requests.length > 0 ? forkJoin(requests) : of(null);
  }
}
