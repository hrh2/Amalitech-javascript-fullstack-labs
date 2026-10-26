import { Board } from '../core/models/board.model';
import { Task } from '../core/models/task.model';

/** Builders with sensible defaults; a test overrides only what it cares about. */
export function makeBoard(overrides: Partial<Board> = {}): Board {
  return { id: '1', name: 'Website Redesign', description: 'Revamp the site.', createdAt: '2026-08-01', ...overrides };
}

export function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: '1',
    boardId: '1',
    title: 'Audit pages',
    description: 'List every page.',
    status: 'todo',
    dueDate: null,
    subtasks: [],
    ...overrides,
  };
}
