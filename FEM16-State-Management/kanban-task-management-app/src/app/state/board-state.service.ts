import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Board } from '../core/models/board.model';

/**
 * STAGE 1 of this module's lab, kept intentionally alongside the NgRx
 * version in `state/board/` for comparison - see `notes/FEM16-TA-Review.md`
 * §2 for the full reflection this lab asks for. Nothing in the running
 * app injects this service; it was superseded by the `state/board/*`
 * actions/reducer/effects/selectors once Stage 2 (NgRx) replaced it, per
 * this module's own task spec ("update every component that previously
 * used the BehaviorSubject service to instead dispatch actions").
 *
 * It demonstrates the exact pattern Module 8 §3 teaches: a private
 * BehaviorSubject holds the current value and replays it to late
 * subscribers; only `.asObservable()` is exposed publicly, so every
 * change to `boards` is forced through this service's own methods rather
 * than a consumer calling `.next()` directly.
 */
@Injectable({ providedIn: 'root' })
export class BoardStateService {
  private readonly boardsSubject = new BehaviorSubject<Board[]>([]);

  readonly boards$: Observable<Board[]> = this.boardsSubject.asObservable();

  setBoards(boards: Board[]): void {
    this.boardsSubject.next(boards);
  }

  addBoard(board: Board): void {
    this.boardsSubject.next([...this.boardsSubject.value, board]);
  }

  removeBoard(boardId: number): void {
    this.boardsSubject.next(this.boardsSubject.value.filter((board) => board.id !== boardId));
  }

  updateBoardName(boardId: number, name: string): void {
    this.boardsSubject.next(
      this.boardsSubject.value.map((board) => (board.id === boardId ? { ...board, name } : board)),
    );
  }
}
