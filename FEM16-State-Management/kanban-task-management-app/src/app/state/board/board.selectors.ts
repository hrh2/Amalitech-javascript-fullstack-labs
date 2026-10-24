import { createFeatureSelector, createSelector } from '@ngrx/store';
import { BoardState } from './board.reducer';

export const selectBoardState = createFeatureSelector<BoardState>('board');

export const selectAllBoards = createSelector(selectBoardState, (state) => state.boards);
export const selectIsLoading = createSelector(selectBoardState, (state) => state.isLoading);
export const selectBoardError = createSelector(selectBoardState, (state) => state.error);

// Composed from selectAllBoards: recalculates only when the boards array
// itself actually changes, the same memoization guarantee as Module 7's
// computed() signals.
export const selectBoardCount = createSelector(selectAllBoards, (boards) => boards.length);

// A selector factory (a function returning a selector): lets a component
// select "one board by id" without the store needing a per-board slice.
export const selectBoardById = (boardId: number) =>
  createSelector(selectAllBoards, (boards) => boards.find((board) => board.id === boardId));
