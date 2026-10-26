import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, switchMap, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Board, NewBoard } from '../../models/board.model';
import { TaskService } from '../task-service/task.service';

/**
 * All HTTP calls for boards, plus the in-memory copy of the result - the
 * same shape as TaskService (see the comment there).
 */
@Injectable({ providedIn: 'root' })
export class BoardService {
  private readonly http = inject(HttpClient);
  private readonly taskService = inject(TaskService);
  private readonly url = `${environment.apiUrl}/boards`;

  private readonly boardsState = signal<Board[]>([]);

  readonly boards = this.boardsState.asReadonly();
  readonly hasLoaded = signal(false);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  /** GET /boards - only hits the network the first time (or after a failure). */
  loadBoards(): void {
    if (this.hasLoaded() || this.isLoading()) {
      return;
    }
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<Board[]>(this.url).subscribe({
      next: (boards) => {
        this.boardsState.set(boards);
        this.hasLoaded.set(true);
        this.isLoading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.isLoading.set(false);
      },
    });
  }

  /** POST /boards */
  createBoard(board: NewBoard): Observable<Board> {
    return this.http.post<Board>(this.url, board).pipe(tap((created) => this.boardsState.update((all) => [...all, created])));
  }

  /** Deletes the board's tasks first (DELETE /tasks/:id each), then DELETE /boards/:id. */
  deleteBoard(id: string): Observable<void> {
    return this.taskService.deleteTasksOfBoard(id).pipe(
      switchMap(() => this.http.delete<void>(`${this.url}/${id}`)),
      tap(() => this.boardsState.update((all) => all.filter((b) => b.id !== id))),
    );
  }
}
