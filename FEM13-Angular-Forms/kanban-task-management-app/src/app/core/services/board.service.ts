import { Injectable } from '@angular/core';
import { Board } from '../models/board.model';
import { Subtask, Task, TaskStatus } from '../models/task.model';

@Injectable({
  providedIn: 'root',
})
export class BoardService {
  private boards: Board[] = [
    {
      id: 1,
      name: 'Website Redesign',
      description: 'Revamp the marketing site for the new product launch.',
      createdAt: '2026-08-01',
      tasks: [
        {
          id: 1,
          title: 'Audit existing pages',
          description: 'List every page and note what stays, changes, or goes.',
          status: 'done',
          dueDate: '2026-08-05',
          subtasks: [
            { title: 'List every URL', completed: true },
            { title: 'Flag pages to retire', completed: true },
          ],
        },
        {
          id: 2,
          title: 'Wireframe the homepage',
          description: 'Low-fidelity layout for hero, features, and footer.',
          status: 'in-progress',
          dueDate: '2026-08-15',
          subtasks: [
            { title: 'Hero section', completed: true },
            { title: 'Feature grid', completed: false },
            { title: 'Footer', completed: false },
          ],
        },
        {
          id: 3,
          title: 'Pick a color palette',
          description: 'Two or three options for stakeholder review.',
          status: 'todo',
          dueDate: null,
          subtasks: [],
        },
      ],
    },
    {
      id: 2,
      name: 'Mobile App Launch',
      description: 'Coordinate the v1.0 release of the companion mobile app.',
      createdAt: '2026-08-10',
      tasks: [
        {
          id: 1,
          title: 'Finalize app store copy',
          description: 'Title, subtitle, and description for both stores.',
          status: 'todo',
          dueDate: '2026-09-01',
          subtasks: [],
        },
        {
          id: 2,
          title: 'Smoke test on real devices',
          description: 'Run through the core flows on iOS and Android hardware.',
          status: 'in-progress',
          dueDate: null,
          subtasks: [
            { title: 'iOS', completed: false },
            { title: 'Android', completed: false },
          ],
        },
      ],
    },
    {
      id: 3,
      name: 'Q3 Marketing Campaign',
      description: 'Plan and execute the Q3 multi-channel campaign.',
      createdAt: '2026-08-20',
      tasks: [
        {
          id: 1,
          title: 'Draft campaign brief',
          description: 'Goals, audience, budget, and key dates.',
          status: 'todo',
          dueDate: null,
          subtasks: [],
        },
      ],
    },
  ];

  private nextBoardId = 4;

  getBoards(): Board[] {
    return this.boards;
  }

  getBoardById(boardId: number): Board | undefined {
    return this.boards.find((board) => board.id === boardId);
  }

  getAdjacentBoardId(currentBoardId: number, direction: 'next' | 'previous'): number | undefined {
    const index = this.boards.findIndex((board) => board.id === currentBoardId);
    if (index === -1) {
      return undefined;
    }
    const targetIndex = direction === 'next' ? index + 1 : index - 1;
    return this.boards[targetIndex]?.id;
  }

  addBoard(name: string, description: string): Board {
    const board: Board = {
      id: this.nextBoardId++,
      name,
      description,
      createdAt: new Date().toISOString().slice(0, 10),
      tasks: [],
    };
    this.boards.push(board);
    return board;
  }

  getTaskById(boardId: number, taskId: number): Task | undefined {
    return this.getBoardById(boardId)?.tasks.find((task) => task.id === taskId);
  }

  /**
   * Case-insensitive, whitespace-trimmed title match against a board's
   * other tasks - backs the duplicate-title custom validator used by both
   * the add-task and edit-task forms. `excludeTaskId` lets the edit form
   * compare against every *other* task without flagging a task's own
   * (unchanged) title as a duplicate of itself.
   */
  isTitleTaken(boardId: number, title: string, excludeTaskId?: number): boolean {
    const board = this.getBoardById(boardId);
    if (!board) {
      return false;
    }
    const normalized = title.trim().toLowerCase();
    return board.tasks.some(
      (task) => task.id !== excludeTaskId && task.title.trim().toLowerCase() === normalized,
    );
  }

  addTask(
    boardId: number,
    title: string,
    description: string,
    status: TaskStatus,
    dueDate: string | null,
    subtasks: Subtask[],
  ): Task | undefined {
    const board = this.getBoardById(boardId);
    if (!board) {
      return undefined;
    }
    const nextTaskId = board.tasks.reduce((max, task) => Math.max(max, task.id), 0) + 1;
    const task: Task = { id: nextTaskId, title, description, status, dueDate, subtasks };
    board.tasks.push(task);
    return task;
  }

  updateTask(
    boardId: number,
    taskId: number,
    title: string,
    description: string,
    status: TaskStatus,
    dueDate: string | null,
    subtasks: Subtask[],
  ): void {
    const task = this.getTaskById(boardId, taskId);
    if (!task) {
      return;
    }
    task.title = title;
    task.description = description;
    task.status = status;
    task.dueDate = dueDate;
    task.subtasks = subtasks;
  }
}
