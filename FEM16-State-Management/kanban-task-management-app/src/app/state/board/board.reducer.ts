import { createReducer, on } from '@ngrx/store';
import { Board } from '../../core/models/board.model';
import { addBoard, addTask, loadBoards, loadBoardsFailure, loadBoardsSuccess, updateTask } from './board.actions';

export interface BoardState {
  boards: Board[];
  isLoading: boolean;
  error: string | null;
}

export const initialBoardState: BoardState = {
  boards: [],
  isLoading: false,
  error: null,
};

export const boardReducer = createReducer(
  initialBoardState,

  on(loadBoards, (state) => ({ ...state, isLoading: true, error: null })),
  on(loadBoardsSuccess, (state, { boards }) => ({ ...state, boards, isLoading: false })),
  on(loadBoardsFailure, (state, { error }) => ({ ...state, isLoading: false, error })),

  on(addBoard, (state, { board }) => ({ ...state, boards: [...state.boards, board] })),

  // Every reducer case below returns a brand-new `boards` array (and a
  // brand-new board object for the one being changed) - never mutates an
  // existing Board/Task in place, for the same reference-based
  // change-detection reasons established since Module 3.
  on(addTask, (state, { boardId, task }) => ({
    ...state,
    boards: state.boards.map((board) =>
      board.id === boardId ? { ...board, tasks: [...board.tasks, task] } : board,
    ),
  })),

  on(updateTask, (state, { boardId, task }) => ({
    ...state,
    boards: state.boards.map((board) =>
      board.id === boardId
        ? { ...board, tasks: board.tasks.map((existing) => (existing.id === task.id ? task : existing)) }
        : board,
    ),
  })),
);
