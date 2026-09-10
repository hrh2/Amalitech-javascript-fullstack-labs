import { createAction, props } from '@ngrx/store';
import { Board } from '../../core/models/board.model';
import { Task } from '../../core/models/task.model';

/**
 * Every action follows the '[Source] Event description' convention: the
 * bracketed source is which part of the UI triggered it, so the action
 * log reads as a history of real events, not a list of setter calls.
 */

// Loading the initial board list (async - see board.effects.ts).
export const loadBoards = createAction('[Board List] Load Boards');
export const loadBoardsSuccess = createAction('[Board API] Load Boards Success', props<{ boards: Board[] }>());
export const loadBoardsFailure = createAction('[Board API] Load Boards Failure', props<{ error: string }>());

// Creating a board is local/instant (no backend to round-trip to), so it's
// a plain, synchronous reducer case rather than an Effect. The caller
// (BoardListComponent) assigns the new id/createdAt before dispatching -
// a reducer must stay a pure function of (state, action), so it can't
// call `Date.now()` or maintain its own id counter itself.
export const addBoard = createAction('[Board List] Add Board', props<{ board: Board }>());

// Creating/editing a task - same reasoning: local and instant, so the
// smart components (AddTaskComponent/EditTaskComponent) build the full
// Task (assigning a new id when adding) before dispatching.
export const addTask = createAction('[Task Form] Add Task', props<{ boardId: number; task: Task }>());
export const updateTask = createAction('[Task Form] Update Task', props<{ boardId: number; task: Task }>());
