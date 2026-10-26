export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Subtask {
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  /** Which board owns this task (a foreign key into /boards). */
  boardId: string;
  title: string;
  description: string;
  status: TaskStatus;
  /** ISO date string (yyyy-MM-dd), or null when the task has no due date. */
  dueDate: string | null;
  subtasks: Subtask[];
}

/** What the client sends to create a task - the server assigns the id. */
export type NewTask = Omit<Task, 'id'>;
