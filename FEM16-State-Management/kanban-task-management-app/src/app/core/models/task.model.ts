export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Subtask {
  title: string;
  completed: boolean;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  /** ISO date string (yyyy-MM-dd), or null when the task has no due date. */
  dueDate: string | null;
  subtasks: Subtask[];
}
