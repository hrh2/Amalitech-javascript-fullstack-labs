/**
 * models.js
 * -----------------------------------------------------------------------
 * Class-based domain models: Task, PriorityTask (inheritance), and User.
 * Demonstrates: classes, inheritance, method overriding, getters,
 * destructuring, default parameters, and optional chaining.
 * -----------------------------------------------------------------------
 */

/** Base class representing a single task/todo item. */
export class Task {
  /**
   * @param {object} data
   * @param {number} data.id
   * @param {string} data.title
   * @param {boolean} [data.completed]
   * @param {number} data.userId
   */
  constructor({ id, title, completed = false, userId }) {
    this.id = id;
    this.title = title;
    this.completed = completed;
    this.userId = userId;
  }

  /** Flip the completed flag. Returns `this` to allow chaining. */
  toggle() {
    this.completed = !this.completed;
    return this;
  }

  /**
   * Base tasks from JSONPlaceholder have no due date, so they are
   * never considered "overdue" - subclasses override this.
   */
  isOverdue() {
    return false;
  }

  /** Human readable status string. */
  getStatus() {
    return this.completed ? 'Completed' : 'Pending';
  }

  /** Convenient string representation used by the CLI. */
  toString() {
    return `[#${this.id}] ${this.title} - ${this.getStatus()}`;
  }
}

/** A Task with a priority level and a due date. */
export class PriorityTask extends Task {
  /**
   * @param {object} data
   * @param {'low'|'medium'|'high'} [data.priority]
   * @param {string|Date} [data.dueDate] - ISO date string or Date instance.
   */
  constructor({ priority = 'medium', dueDate = null, ...taskData }) {
    super(taskData);
    this.priority = priority;
    this.dueDate = dueDate ? new Date(dueDate) : null;
  }

  /** Overridden: a priority task is overdue if the due date has passed. */
  isOverdue() {
    if (!this.dueDate || this.completed) return false;
    return this.dueDate.getTime() < Date.now();
  }

  /** Overridden: status also reflects urgency/priority. */
  getStatus() {
    const base = super.getStatus();
    if (this.isOverdue()) return `${base} (OVERDUE, priority: ${this.priority})`;
    return `${base} (priority: ${this.priority})`;
  }

  toString() {
    const due = this.dueDate ? this.dueDate.toISOString().split('T')[0] : 'no due date';
    return `${super.toString()} | due: ${due}`;
  }
}

/** Represents a user and the tasks assigned to them. */
export class User {
  /**
   * @param {object} data
   * @param {number} data.id
   * @param {string} data.name
   * @param {string} data.email
   * @param {Task[]} [data.tasks]
   */
  constructor({ id, name, email, tasks = [] }) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.tasks = [...tasks];
  }

  /** Add one or more tasks to this user (rest parameter demo). */
  addTask(...newTasks) {
    this.tasks = [...this.tasks, ...newTasks];
    return this;
  }

  /** Percentage (0-100) of this user's tasks that are completed. */
  getCompletionRate() {
    if (this.tasks.length === 0) return 0;
    const completedCount = this.tasks.reduce((count, t) => (t.completed ? count + 1 : count), 0);
    return Math.round((completedCount / this.tasks.length) * 100);
  }

  /** Returns tasks matching a given completion status. */
  getTasksByStatus(completed = true) {
    return this.tasks.filter((t) => t.completed === completed);
  }

  /** Short summary used by the CLI. */
  summary() {
    return `${this.name} <${this.email}> - ${this.tasks.length} task(s), ${this.getCompletionRate()}% complete`;
  }
}
