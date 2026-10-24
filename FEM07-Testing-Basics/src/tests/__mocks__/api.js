/**
 * tests/__mocks__/api.js
 * -----------------------------------------------------------------------
 * Hand-written mock data + a mock APIClient-shaped object.
 * Used by integration tests that want a ready-made "fake backend"
 * without touching the real JSONPlaceholder network calls.
 * -----------------------------------------------------------------------
 */

import { jest } from '@jest/globals';

/** Small, deterministic mock user list (shape matches JSONPlaceholder /users). */
export const mockUsers = [
  { id: 1, name: 'Leanne Graham', email: 'leanne@example.com' },
  { id: 2, name: 'Ervin Howell', email: 'ervin@example.com' },
  { id: 3, name: 'Clementine Bauch', email: 'clementine@example.com' },
];

/** Small, deterministic mock todo list (shape matches JSONPlaceholder /todos). */
export const mockTodos = [
  { id: 1, title: 'Buy groceries', completed: false, userId: 1 },
  { id: 2, title: 'Write report', completed: true, userId: 1 },
  { id: 3, title: 'Fix bug in login flow', completed: false, userId: 2 }, // promoted -> PriorityTask
  { id: 4, title: 'Read a book', completed: true, userId: 2 },
  { id: 5, title: 'Plan sprint', completed: false, userId: 3 },
  { id: 6, title: 'Deploy to production', completed: false, userId: 3 }, // promoted -> PriorityTask
  { id: 9, title: 'Renew passport', completed: false, userId: 1 }, // promoted -> PriorityTask (high)
];

/** Mock todos for a single user (userId = 1), used by fetchUserTodos tests. */
export const mockUserOneTodos = mockTodos.filter((t) => t.userId === 1);

/**
 * A mock implementation of the APIClient's public surface.
 * Every method returns a Promise, mirroring the real client, but resolves
 * instantly with in-memory fixtures instead of calling `fetch`.
 */
export const createMockApiClient = () => ({
  fetchUsers: jest.fn().mockResolvedValue(mockUsers),
  fetchTodos: jest.fn().mockResolvedValue(mockTodos),
  fetchUserTodos: jest.fn((userId) =>
    Promise.resolve(mockTodos.filter((t) => t.userId === userId))
  ),
  fetchAllData: jest.fn().mockResolvedValue({ users: mockUsers, todos: mockTodos }),
  clearCache: jest.fn(),
});

/** Builds a `fetch`-compatible mock Response object. */
export const mockFetchResponse = (data, { ok = true, status = 200 } = {}) => ({
  ok,
  status,
  json: jest.fn().mockResolvedValue(data),
});
