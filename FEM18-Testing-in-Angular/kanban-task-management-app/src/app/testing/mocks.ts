import { signal } from '@angular/core';
import { of } from 'rxjs';
import { Board } from '../core/models/board.model';
import { Task } from '../core/models/task.model';

/**
 * Hand-written stand-ins for BoardService/TaskService. They expose the same
 * public surface (writable signals so a test can change the data, jest.fn()
 * for every method so a test can assert on calls), and never touch HTTP.
 */
export function createTaskServiceMock(tasks: Task[] = []) {
  return {
    tasks: signal(tasks),
    isLoading: signal(false),
    error: signal<string | null>(null),
    loadTasks: jest.fn(),
    whenLoaded: jest.fn(() => of(tasks)),
    createTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
  };
}

export function createBoardServiceMock(boards: Board[] = []) {
  return {
    boards: signal(boards),
    hasLoaded: signal(true),
    isLoading: signal(false),
    error: signal<string | null>(null),
    loadBoards: jest.fn(),
    createBoard: jest.fn(),
    deleteBoard: jest.fn(),
  };
}
