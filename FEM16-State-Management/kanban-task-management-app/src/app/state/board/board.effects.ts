import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { BoardService } from '../../core/services/board-service/board.service';
import { loadBoards, loadBoardsFailure, loadBoardsSuccess } from './board.actions';

/**
 * The one genuinely asynchronous operation in this feature: fetching the
 * initial board list. `addBoard`/`addTask`/`updateTask` are handled
 * entirely by the reducer (board.reducer.ts) since they're local/instant -
 * an Effect here would just be `switchMap` wrapping a value that was
 * already available synchronously, adding indirection with no benefit.
 */
@Injectable()
export class BoardEffects {
  private readonly actions$ = inject(Actions);
  private readonly boardService = inject(BoardService);

  loadBoards$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadBoards),
      switchMap(() =>
        this.boardService.getBoards().pipe(
          map((boards) => loadBoardsSuccess({ boards })),
          catchError((error: Error) => of(loadBoardsFailure({ error: error.message ?? 'Failed to load boards.' }))),
        ),
      ),
    ),
  );
}
