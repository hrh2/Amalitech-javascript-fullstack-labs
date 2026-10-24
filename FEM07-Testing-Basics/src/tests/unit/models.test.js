/**
 * tests/unit/models.test.js
 * -----------------------------------------------------------------------
 * Unit tests for Task, PriorityTask, and User (models.js).
 * -----------------------------------------------------------------------
 */

import { Task, PriorityTask, User } from '../../models.js';

describe('Task', () => {
  let task;

  beforeEach(() => {
    task = new Task({ id: 1, title: 'Write tests', completed: false, userId: 42 });
  });

  describe('constructor', () => {
    it('initializes all properties from the provided data', () => {
      expect(task.id).toBe(1);
      expect(task.title).toBe('Write tests');
      expect(task.completed).toBe(false);
      expect(task.userId).toBe(42);
    });

    it('defaults `completed` to false when omitted', () => {
      const t = new Task({ id: 2, title: 'No status given', userId: 1 });
      expect(t.completed).toBe(false);
    });

    it('accepts an explicit `completed: true`', () => {
      const t = new Task({ id: 3, title: 'Done already', completed: true, userId: 1 });
      expect(t.completed).toBe(true);
    });

    it('stores undefined title/userId as-is rather than throwing', () => {
      const t = new Task({ id: 4 });
      expect(t.title).toBeUndefined();
      expect(t.userId).toBeUndefined();
    });
  });

  describe('toggle()', () => {
    it('flips completed from false to true', () => {
      task.toggle();
      expect(task.completed).toBe(true);
    });

    it('flips completed from true back to false', () => {
      task.toggle();
      task.toggle();
      expect(task.completed).toBe(false);
    });

    it('returns `this` to support chaining', () => {
      const result = task.toggle();
      expect(result).toBe(task);
    });
  });

  describe('getStatus()', () => {
    it('returns "Pending" when not completed', () => {
      expect(task.getStatus()).toBe('Pending');
    });

    it('returns "Completed" when completed', () => {
      task.toggle();
      expect(task.getStatus()).toBe('Completed');
    });
  });

  describe('isOverdue()', () => {
    it('always returns false for a base Task (no due date concept)', () => {
      expect(task.isOverdue()).toBe(false);
    });

    it('returns false even when completed is true', () => {
      task.toggle();
      expect(task.isOverdue()).toBe(false);
    });
  });

  describe('toString()', () => {
    it('formats id, title, and status', () => {
      expect(task.toString()).toBe('[#1] Write tests - Pending');
    });
  });

  describe('edge cases', () => {
    it('handles an empty string title without throwing', () => {
      const t = new Task({ id: 5, title: '', userId: 1 });
      expect(t.title).toBe('');
      expect(() => t.toString()).not.toThrow();
    });

    it('handles null id gracefully', () => {
      const t = new Task({ id: null, title: 'x', userId: 1 });
      expect(t.id).toBeNull();
    });
  });
});

describe('PriorityTask', () => {
  const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
  const past = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

  let priorityTask;

  beforeEach(() => {
    priorityTask = new PriorityTask({
      id: 10,
      title: 'Ship the feature',
      completed: false,
      userId: 1,
      priority: 'high',
      dueDate: future,
    });
  });

  describe('inheritance', () => {
    it('is an instance of both PriorityTask and Task', () => {
      expect(priorityTask).toBeInstanceOf(PriorityTask);
      expect(priorityTask).toBeInstanceOf(Task);
    });

    it('inherits toggle() from Task and it still works', () => {
      priorityTask.toggle();
      expect(priorityTask.completed).toBe(true);
    });
  });

  describe('priority-specific properties', () => {
    it('stores the priority level', () => {
      expect(priorityTask.priority).toBe('high');
    });

    it('parses dueDate into a Date instance', () => {
      expect(priorityTask.dueDate).toBeInstanceOf(Date);
    });

    it('defaults priority to "medium" when not provided', () => {
      const t = new PriorityTask({ id: 11, title: 'x', userId: 1 });
      expect(t.priority).toBe('medium');
    });

    it('defaults dueDate to null when not provided', () => {
      const t = new PriorityTask({ id: 12, title: 'x', userId: 1 });
      expect(t.dueDate).toBeNull();
    });
  });

  describe('isOverdue() date comparison logic', () => {
    it('returns false when the due date is in the future', () => {
      expect(priorityTask.isOverdue()).toBe(false);
    });

    it('returns true when the due date is in the past and task is incomplete', () => {
      const overdue = new PriorityTask({ id: 13, title: 'x', userId: 1, dueDate: past });
      expect(overdue.isOverdue()).toBe(true);
    });

    it('returns false when overdue by date but already completed', () => {
      const overdue = new PriorityTask({
        id: 14,
        title: 'x',
        userId: 1,
        completed: true,
        dueDate: past,
      });
      expect(overdue.isOverdue()).toBe(false);
    });

    it('returns false when there is no due date at all', () => {
      const t = new PriorityTask({ id: 15, title: 'x', userId: 1, dueDate: null });
      expect(t.isOverdue()).toBe(false);
    });
  });

  describe('getStatus() overriding parent behavior', () => {
    it('includes the priority level in the status string', () => {
      expect(priorityTask.getStatus()).toContain('priority: high');
    });

    it('includes "OVERDUE" when the task is overdue', () => {
      const overdue = new PriorityTask({ id: 16, title: 'x', userId: 1, dueDate: past });
      expect(overdue.getStatus()).toContain('OVERDUE');
    });

    it('still starts with the base status ("Pending"/"Completed")', () => {
      expect(priorityTask.getStatus().startsWith('Pending')).toBe(true);
    });
  });

  describe('priority level validation', () => {
    it.each(['low', 'medium', 'high'])('accepts a valid priority level: %s', (level) => {
      const t = new PriorityTask({ id: 17, title: 'x', userId: 1, priority: level });
      expect(t.priority).toBe(level);
    });

    it('does not throw for an unrecognized priority string (no validation enforced)', () => {
      expect(() => new PriorityTask({ id: 18, title: 'x', userId: 1, priority: 'urgent!' })).not.toThrow();
    });
  });

  describe('toString() integration with parent class', () => {
    it('includes the parent toString() output plus the due date', () => {
      const str = priorityTask.toString();
      expect(str).toContain('Ship the feature');
      expect(str).toContain('due:');
    });

    it('shows "no due date" when dueDate is null', () => {
      const t = new PriorityTask({ id: 19, title: 'x', userId: 1, dueDate: null });
      expect(t.toString()).toContain('no due date');
    });
  });
});

describe('User', () => {
  let user;

  beforeEach(() => {
    user = new User({ id: 1, name: 'Ada Lovelace', email: 'ada@example.com' });
  });

  describe('constructor', () => {
    it('initializes id, name, and email', () => {
      expect(user.id).toBe(1);
      expect(user.name).toBe('Ada Lovelace');
      expect(user.email).toBe('ada@example.com');
    });

    it('defaults tasks to an empty array when omitted', () => {
      expect(user.tasks).toEqual([]);
    });

    it('copies (does not alias) the tasks array passed in', () => {
      const initialTasks = [new Task({ id: 1, title: 't', userId: 1 })];
      const u = new User({ id: 2, name: 'x', email: 'x@x.com', tasks: initialTasks });
      u.tasks.push(new Task({ id: 2, title: 't2', userId: 2 }));
      expect(initialTasks).toHaveLength(1);
    });
  });

  describe('addTask()', () => {
    it('adds a single task', () => {
      const t = new Task({ id: 1, title: 'New task', userId: 1 });
      user.addTask(t);
      expect(user.tasks).toContain(t);
    });

    it('adds multiple tasks via rest parameters', () => {
      const t1 = new Task({ id: 1, title: 'a', userId: 1 });
      const t2 = new Task({ id: 2, title: 'b', userId: 1 });
      user.addTask(t1, t2);
      expect(user.tasks).toHaveLength(2);
    });

    it('returns `this` to support chaining', () => {
      const result = user.addTask(new Task({ id: 1, title: 'a', userId: 1 }));
      expect(result).toBe(user);
    });
  });

  describe('getCompletionRate()', () => {
    it('returns 0 for an empty task array (no division by zero error)', () => {
      expect(user.getCompletionRate()).toBe(0);
    });

    it('returns 100 when all tasks are completed', () => {
      user.addTask(
        new Task({ id: 1, title: 'a', completed: true, userId: 1 }),
        new Task({ id: 2, title: 'b', completed: true, userId: 1 })
      );
      expect(user.getCompletionRate()).toBe(100);
    });

    it('returns 0 when no tasks are completed', () => {
      user.addTask(new Task({ id: 1, title: 'a', completed: false, userId: 1 }));
      expect(user.getCompletionRate()).toBe(0);
    });

    it('rounds partial completion rates to the nearest whole percentage', () => {
      user.addTask(
        new Task({ id: 1, title: 'a', completed: true, userId: 1 }),
        new Task({ id: 2, title: 'b', completed: false, userId: 1 }),
        new Task({ id: 3, title: 'c', completed: false, userId: 1 })
      );
      expect(user.getCompletionRate()).toBe(33);
    });
  });

  describe('getTasksByStatus()', () => {
    beforeEach(() => {
      user.addTask(
        new Task({ id: 1, title: 'done', completed: true, userId: 1 }),
        new Task({ id: 2, title: 'pending', completed: false, userId: 1 })
      );
    });

    it('defaults to filtering for completed tasks', () => {
      const result = user.getTasksByStatus();
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('done');
    });

    it('returns pending tasks when passed false', () => {
      const result = user.getTasksByStatus(false);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('pending');
    });

    it('returns an empty array when no tasks match the requested status', () => {
      const onlyDone = new User({ id: 2, name: 'x', email: 'x@x.com' });
      onlyDone.addTask(new Task({ id: 1, title: 'a', completed: true, userId: 2 }));
      expect(onlyDone.getTasksByStatus(false)).toEqual([]);
    });
  });

  describe('summary()', () => {
    it('includes name, email, task count, and completion rate', () => {
      user.addTask(new Task({ id: 1, title: 'a', completed: true, userId: 1 }));
      expect(user.summary()).toBe('Ada Lovelace <ada@example.com> - 1 task(s), 100% complete');
    });
  });
});
