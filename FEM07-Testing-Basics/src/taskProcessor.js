/**
 * taskProcessor.js
 * -----------------------------------------------------------------------
 * Pure data-transformation helpers. Demonstrates map/filter/reduce,
 * Map/Set data structures, arrow functions, destructuring, and spread.
 * -----------------------------------------------------------------------
 */

import { Task, PriorityTask } from './models.js';

/**
 * Turn raw JSONPlaceholder todo objects into Task instances.
 * Every 3rd task is promoted to a PriorityTask with a synthetic due
 * date so the PriorityTask branch of the app has real data to work with.
 */
export const mapTodosToTasks = (todos = []) =>
  todos.map(({ id, title, completed, userId }) => {
    if (id % 3 === 0) {
      // Spread a deterministic pseudo-random offset so due dates vary.
      const dayOffset = (id % 10) - 5; // range: -5..4 days from "today"
      const dueDate = new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000);
      const priority = id % 9 === 0 ? 'high' : id % 6 === 0 ? 'medium' : 'low';
      return new PriorityTask({ id, title, completed, userId, priority, dueDate });
    }
    return new Task({ id, title, completed, userId });
  });

/** Filter an array of Task instances by completion status. */
export const filterByStatus = (tasks, completed = true) =>
  tasks.filter((task) => task.completed === completed);

/** Filter tasks belonging to a specific user. */
export const filterByUser = (tasks, userId) => tasks.filter((task) => task.userId === userId);

/** Filter PriorityTask instances by priority level. */
export const filterByPriority = (tasks, priority) =>
  tasks.filter((task) => task.priority === priority);

/** Filter tasks that are currently overdue. */
export const filterOverdue = (tasks) => tasks.filter((task) => task.isOverdue?.());

/** Case-insensitive search over task titles. */
export const searchTasksByTitle = (tasks, query = '') => {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...tasks];
  return tasks.filter((task) => task.title.toLowerCase().includes(needle));
};

/**
 * Aggregate statistics for a list of tasks using reduce().
 * Returns totals, completion rate, and a priority breakdown.
 */
export const calculateStatistics = (tasks) => {
  const stats = tasks.reduce(
    (acc, task) => {
      acc.total += 1;
      if (task.completed) acc.completed += 1;
      else acc.pending += 1;
      if (task.isOverdue?.()) acc.overdue += 1;

      if (task instanceof PriorityTask) {
        acc.priorityBreakdown[task.priority] = (acc.priorityBreakdown[task.priority] || 0) + 1;
      }
      return acc;
    },
    { total: 0, completed: 0, pending: 0, overdue: 0, priorityBreakdown: {} }
  );

  return {
    ...stats,
    completionRate: stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100),
  };
};

/** Group tasks by userId using a Map for O(1) lookups. */
export const groupByUser = (tasks) => {
  const map = new Map();
  for (const task of tasks) {
    const bucket = map.get(task.userId) ?? [];
    bucket.push(task);
    map.set(task.userId, bucket);
  }
  return map;
};

/** Extract the set of distinct priority levels present in a task list. */
export const getUniquePriorities = (tasks) =>
  new Set(tasks.filter((t) => t instanceof PriorityTask).map((t) => t.priority));

/** Sort tasks by one or more criteria (bonus challenge). */
export const sortTasks = (tasks, { by = 'id', direction = 'asc' } = {}) => {
  const sorted = [...tasks].sort((a, b) => {
    const aVal = a[by] ?? 0;
    const bVal = b[by] ?? 0;
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
  return sorted;
};

/** Merge a partial update into a task object immutably (spread demo). */
export const updateTask = (task, updates = {}) => ({ ...task, ...updates });
