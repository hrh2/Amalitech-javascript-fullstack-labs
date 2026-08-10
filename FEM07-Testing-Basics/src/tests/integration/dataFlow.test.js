/**
 * tests/integration/dataFlow.test.js
 * -----------------------------------------------------------------------
 * "Test Data Flow Integration" section of the lab: complete workflows
 * that combine the mocked APIClient, taskProcessor transformations, and
 * the model classes, verifying data at each step of the pipeline.
 * -----------------------------------------------------------------------
 */

import { User } from '../../models.js';
import { mapTodosToTasks, groupByUser, calculateStatistics, filterOverdue } from '../../taskProcessor.js';
import { createMockApiClient, mockUsers, mockTodos } from '../__mocks__/api.js';

describe('Workflow 1: fetch todos -> transform into Task/PriorityTask instances', () => {
  it('fetches todos from the mock API and maps them into model instances', async () => {
    const api = createMockApiClient();

    const todos = await api.fetchTodos();
    const tasks = mapTodosToTasks(todos);

    expect(api.fetchTodos).toHaveBeenCalledTimes(1);
    expect(tasks).toHaveLength(mockTodos.length);
    expect(tasks[0].title).toBe(mockTodos[0].title);
  });

  it('produces a mix of Task and PriorityTask instances matching the id%3 rule', async () => {
    const api = createMockApiClient();
    const todos = await api.fetchTodos();

    const tasks = mapTodosToTasks(todos);
    const promotedIds = tasks.filter((t) => t.priority !== undefined).map((t) => t.id);

    expect(promotedIds).toEqual(mockTodos.filter((t) => t.id % 3 === 0).map((t) => t.id));
  });
});

describe('Workflow 2: fetch users + todos -> build User instances with attached tasks', () => {
  it('builds a complete Map of User instances, each holding their own tasks', async () => {
    const api = createMockApiClient();

    const { users, todos } = await api.fetchAllData();
    const tasks = mapTodosToTasks(todos);
    const byUser = groupByUser(tasks);

    const userInstances = new Map(
      users.map((raw) => [raw.id, new User({ ...raw, tasks: byUser.get(raw.id) ?? [] })])
    );

    expect(userInstances.size).toBe(mockUsers.length);
    const user1 = userInstances.get(1);
    expect(user1.tasks.length).toBeGreaterThan(0);
    expect(user1.tasks.every((t) => t.userId === 1)).toBe(true);
  });

  it('computes a correct completion rate for each constructed user', async () => {
    const api = createMockApiClient();
    const { users, todos } = await api.fetchAllData();
    const tasks = mapTodosToTasks(todos);
    const byUser = groupByUser(tasks);

    const user2 = new User({ ...users[1], tasks: byUser.get(2) ?? [] });
    const expectedRate = Math.round(
      (user2.tasks.filter((t) => t.completed).length / user2.tasks.length) * 100
    );

    expect(user2.getCompletionRate()).toBe(expectedRate);
  });

  it('handles a user with no assigned tasks gracefully (0% completion, empty list)', async () => {
    const api = createMockApiClient();
    const { todos } = await api.fetchAllData();
    const tasks = mapTodosToTasks(todos);
    const byUser = groupByUser(tasks);

    const orphanUser = new User({ id: 999, name: 'No Tasks', email: 'none@x.com', tasks: byUser.get(999) ?? [] });

    expect(orphanUser.tasks).toEqual([]);
    expect(orphanUser.getCompletionRate()).toBe(0);
  });
});

describe('Workflow 3: fetch -> transform -> aggregate statistics', () => {
  it('produces overall statistics consistent with the mock fixture data', async () => {
    const api = createMockApiClient();
    const todos = await api.fetchTodos();
    const tasks = mapTodosToTasks(todos);

    const stats = calculateStatistics(tasks);

    expect(stats.total).toBe(mockTodos.length);
    expect(stats.completed + stats.pending).toBe(stats.total);
  });

  it('flows overdue detection through from raw todos to filtered PriorityTasks', async () => {
    const api = createMockApiClient();
    const todos = await api.fetchTodos();
    const tasks = mapTodosToTasks(todos);

    const overdue = filterOverdue(tasks);

    // Every result must actually be overdue when re-checked directly.
    expect(overdue.every((t) => t.isOverdue())).toBe(true);
  });

  it('verifies fetchUserTodos() integrates correctly with mapTodosToTasks() for a single user', async () => {
    const api = createMockApiClient();

    const rawTodos = await api.fetchUserTodos(3);
    const tasks = mapTodosToTasks(rawTodos);

    expect(api.fetchUserTodos).toHaveBeenCalledWith(3);
    expect(tasks.every((t) => t.userId === 3)).toBe(true);
  });
});
