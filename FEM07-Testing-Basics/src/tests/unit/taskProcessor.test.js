/**
 * tests/unit/taskProcessor.test.js
 * -----------------------------------------------------------------------
 * Unit tests for the pure data-transformation helpers in taskProcessor.js.
 *
 * Function name mapping back to the lab spec's generic names:
 *   filterByStatus()      -> filterByStatus()
 *   calculateStatistics() -> calculateStatistics()
 *   groupByUser()         -> groupByUser()
 *   searchByProperty()    -> searchTasksByTitle()  (search by the `title` property)
 *   sortBy()              -> sortTasks()
 * -----------------------------------------------------------------------
 */

import { Task, PriorityTask } from '../../models.js';
import {
  mapTodosToTasks,
  filterByStatus,
  filterByUser,
  filterByPriority,
  filterOverdue,
  searchTasksByTitle,
  calculateStatistics,
  groupByUser,
  getUniquePriorities,
  sortTasks,
  updateTask,
} from '../../taskProcessor.js';

describe('mapTodosToTasks()', () => {
  const rawTodos = [
    { id: 1, title: 'Regular task', completed: false, userId: 1 },
    { id: 3, title: 'Promoted task', completed: false, userId: 1 },
    { id: 9, title: 'High priority task', completed: false, userId: 2 },
  ];

  it('converts plain todo objects into Task instances', () => {
    const [regular] = mapTodosToTasks(rawTodos);
    expect(regular).toBeInstanceOf(Task);
  });

  it('promotes every 3rd id to a PriorityTask', () => {
    const [, promoted] = mapTodosToTasks(rawTodos);
    expect(promoted).toBeInstanceOf(PriorityTask);
  });

  it('assigns "high" priority when id is divisible by 9', () => {
    const [, , high] = mapTodosToTasks(rawTodos);
    expect(high.priority).toBe('high');
  });

  it('returns an empty array when given an empty array', () => {
    expect(mapTodosToTasks([])).toEqual([]);
  });

  it('defaults to an empty array when called with no argument', () => {
    expect(mapTodosToTasks()).toEqual([]);
  });
});

describe('filterByStatus()', () => {
  const tasks = [
    new Task({ id: 1, title: 'a', completed: true, userId: 1 }),
    new Task({ id: 2, title: 'b', completed: false, userId: 1 }),
  ];

  it('returns only completed tasks by default', () => {
    expect(filterByStatus(tasks)).toHaveLength(1);
  });

  it('returns only pending tasks when completed=false', () => {
    const result = filterByStatus(tasks, false);
    expect(result.every((t) => !t.completed)).toBe(true);
  });

  it('returns an empty array when given an empty task list', () => {
    expect(filterByStatus([], true)).toEqual([]);
  });

  it('returns an empty array when no tasks match the requested status', () => {
    const allDone = [new Task({ id: 1, title: 'a', completed: true, userId: 1 })];
    expect(filterByStatus(allDone, false)).toEqual([]);
  });

  it('does not mutate the original array', () => {
    const copy = [...tasks];
    filterByStatus(tasks, true);
    expect(tasks).toEqual(copy);
  });
});

describe('filterByUser()', () => {
  const tasks = [
    new Task({ id: 1, title: 'a', userId: 1 }),
    new Task({ id: 2, title: 'b', userId: 2 }),
  ];

  it('returns only tasks belonging to the given userId', () => {
    expect(filterByUser(tasks, 1)).toHaveLength(1);
  });

  it('returns an empty array for a userId with no tasks', () => {
    expect(filterByUser(tasks, 99)).toEqual([]);
  });

  it('returns an empty array when given an empty task list', () => {
    expect(filterByUser([], 1)).toEqual([]);
  });
});

describe('filterByPriority()', () => {
  const tasks = [
    new PriorityTask({ id: 1, title: 'a', userId: 1, priority: 'low' }),
    new PriorityTask({ id: 2, title: 'b', userId: 1, priority: 'high' }),
    new Task({ id: 3, title: 'c', userId: 1 }),
  ];

  it('returns only tasks with the matching priority', () => {
    expect(filterByPriority(tasks, 'high')).toHaveLength(1);
  });

  it('only ever returns PriorityTask instances for a real priority value', () => {
    const result = filterByPriority(tasks, 'low');
    expect(result.every((t) => t instanceof PriorityTask)).toBe(true);
  });

  it('returns an empty array when no task matches the priority', () => {
    expect(filterByPriority(tasks, 'critical')).toEqual([]);
  });
});

describe('filterOverdue()', () => {
  const past = new Date(Date.now() - 86400000).toISOString();
  const future = new Date(Date.now() + 86400000).toISOString();

  const tasks = [
    new PriorityTask({ id: 1, title: 'overdue', userId: 1, dueDate: past }),
    new PriorityTask({ id: 2, title: 'not overdue', userId: 1, dueDate: future }),
    new Task({ id: 3, title: 'plain task', userId: 1 }),
  ];

  it('returns only tasks whose isOverdue() is true', () => {
    const result = filterOverdue(tasks);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('overdue');
  });

  it('safely skips tasks without an isOverdue method using optional chaining', () => {
    const looseObjects = [{ id: 1, title: 'no method' }];
    expect(() => filterOverdue(looseObjects)).not.toThrow();
  });

  it('returns an empty array when nothing is overdue', () => {
    const notOverdue = [new PriorityTask({ id: 1, title: 'x', userId: 1, dueDate: future })];
    expect(filterOverdue(notOverdue)).toEqual([]);
  });
});

describe('searchTasksByTitle() [searchByProperty]', () => {
  const tasks = [
    new Task({ id: 1, title: 'Buy Milk', userId: 1 }),
    new Task({ id: 2, title: 'Walk the dog', userId: 1 }),
    new Task({ id: 3, title: 'Pay bills', userId: 1 }),
  ];

  it('finds tasks with a case-insensitive substring match', () => {
    expect(searchTasksByTitle(tasks, 'milk')).toHaveLength(1);
  });

  it('trims whitespace from the query before searching', () => {
    expect(searchTasksByTitle(tasks, '  dog  ')).toHaveLength(1);
  });

  it('returns a full copy of the list when the query is empty', () => {
    expect(searchTasksByTitle(tasks, '')).toEqual(tasks);
  });

  it('returns a full copy (not the same reference) when query is empty', () => {
    expect(searchTasksByTitle(tasks, '')).not.toBe(tasks);
  });

  it('returns an empty array when nothing matches', () => {
    expect(searchTasksByTitle(tasks, 'zzz-nomatch')).toEqual([]);
  });

  it('defaults to an empty-string query when none is provided', () => {
    expect(searchTasksByTitle(tasks)).toEqual(tasks);
  });
});

describe('calculateStatistics()', () => {
  const past = new Date(Date.now() - 86400000).toISOString();

  it('computes total, completed, and pending counts', () => {
    const tasks = [
      new Task({ id: 1, title: 'a', completed: true, userId: 1 }),
      new Task({ id: 2, title: 'b', completed: false, userId: 1 }),
    ];
    const stats = calculateStatistics(tasks);
    expect(stats.total).toBe(2);
    expect(stats.completed).toBe(1);
    expect(stats.pending).toBe(1);
  });

  it('computes an accurate completionRate', () => {
    const tasks = [
      new Task({ id: 1, title: 'a', completed: true, userId: 1 }),
      new Task({ id: 2, title: 'b', completed: true, userId: 1 }),
      new Task({ id: 3, title: 'c', completed: false, userId: 1 }),
      new Task({ id: 4, title: 'd', completed: false, userId: 1 }),
    ];
    expect(calculateStatistics(tasks).completionRate).toBe(50);
  });

  it('counts overdue tasks', () => {
    const tasks = [new PriorityTask({ id: 1, title: 'a', userId: 1, dueDate: past })];
    expect(calculateStatistics(tasks).overdue).toBe(1);
  });

  it('builds a priorityBreakdown map for PriorityTask instances only', () => {
    const tasks = [
      new PriorityTask({ id: 1, title: 'a', userId: 1, priority: 'high' }),
      new PriorityTask({ id: 2, title: 'b', userId: 1, priority: 'high' }),
      new Task({ id: 3, title: 'c', userId: 1 }),
    ];
    expect(calculateStatistics(tasks).priorityBreakdown).toEqual({ high: 2 });
  });

  it('handles an empty task array without division-by-zero errors', () => {
    const stats = calculateStatistics([]);
    expect(stats).toEqual({
      total: 0,
      completed: 0,
      pending: 0,
      overdue: 0,
      priorityBreakdown: {},
      completionRate: 0,
    });
  });
});

describe('groupByUser()', () => {
  it('groups tasks into a Map keyed by userId', () => {
    const tasks = [
      new Task({ id: 1, title: 'a', userId: 1 }),
      new Task({ id: 2, title: 'b', userId: 2 }),
      new Task({ id: 3, title: 'c', userId: 1 }),
    ];
    const grouped = groupByUser(tasks);
    expect(grouped).toBeInstanceOf(Map);
    expect(grouped.get(1)).toHaveLength(2);
    expect(grouped.get(2)).toHaveLength(1);
  });

  it('returns an empty Map for an empty task list', () => {
    expect(groupByUser([]).size).toBe(0);
  });

  it('returns undefined for a userId with no tasks', () => {
    const grouped = groupByUser([new Task({ id: 1, title: 'a', userId: 1 })]);
    expect(grouped.get(999)).toBeUndefined();
  });

  it('preserves task order within each user bucket', () => {
    const t1 = new Task({ id: 1, title: 'first', userId: 1 });
    const t2 = new Task({ id: 2, title: 'second', userId: 1 });
    const grouped = groupByUser([t1, t2]);
    expect(grouped.get(1)).toEqual([t1, t2]);
  });
});

describe('getUniquePriorities()', () => {
  it('returns a Set of distinct priority levels', () => {
    const tasks = [
      new PriorityTask({ id: 1, title: 'a', userId: 1, priority: 'low' }),
      new PriorityTask({ id: 2, title: 'b', userId: 1, priority: 'low' }),
      new PriorityTask({ id: 3, title: 'c', userId: 1, priority: 'high' }),
    ];
    const result = getUniquePriorities(tasks);
    expect(result).toBeInstanceOf(Set);
    expect([...result].sort()).toEqual(['high', 'low']);
  });

  it('ignores plain Task instances without a priority', () => {
    const tasks = [new Task({ id: 1, title: 'a', userId: 1 })];
    expect(getUniquePriorities(tasks).size).toBe(0);
  });

  it('returns an empty Set for an empty task list', () => {
    expect(getUniquePriorities([]).size).toBe(0);
  });
});

describe('sortTasks() [sortBy]', () => {
  const tasks = [
    new Task({ id: 3, title: 'c', userId: 1 }),
    new Task({ id: 1, title: 'a', userId: 1 }),
    new Task({ id: 2, title: 'b', userId: 1 }),
  ];

  it('sorts ascending by id by default', () => {
    expect(sortTasks(tasks).map((t) => t.id)).toEqual([1, 2, 3]);
  });

  it('sorts descending when direction is "desc"', () => {
    expect(sortTasks(tasks, { direction: 'desc' }).map((t) => t.id)).toEqual([3, 2, 1]);
  });

  it('sorts by an arbitrary property (title)', () => {
    expect(sortTasks(tasks, { by: 'title' }).map((t) => t.title)).toEqual(['a', 'b', 'c']);
  });

  it('does not mutate the original array', () => {
    const original = [...tasks];
    sortTasks(tasks, { direction: 'desc' });
    expect(tasks).toEqual(original);
  });

  it('handles an empty array without throwing', () => {
    expect(sortTasks([])).toEqual([]);
  });

  it('treats a missing sort property as 0 via nullish coalescing', () => {
    const withMissing = [
      new Task({ id: 1, title: 'a', userId: 1 }),
      new Task({ id: 2, title: 'b', userId: 1 }),
    ];
    expect(() => sortTasks(withMissing, { by: 'nonexistentProp' })).not.toThrow();
  });
});

describe('updateTask() [immutable update]', () => {
  it('merges updates into a new object without mutating the original', () => {
    const original = { id: 1, title: 'old', completed: false };
    const updated = updateTask(original, { title: 'new' });
    expect(updated.title).toBe('new');
    expect(original.title).toBe('old');
  });

  it('returns a new object reference, not the same one', () => {
    const original = { id: 1, title: 'old' };
    expect(updateTask(original, {})).not.toBe(original);
  });

  it('defaults to an empty update object when none is provided', () => {
    const original = { id: 1, title: 'old' };
    expect(updateTask(original)).toEqual(original);
  });
});
