/**
 * tests/integration/api.test.js
 * -----------------------------------------------------------------------
 * Integration tests for APIClient. The `fetch` global is mocked with
 * jest.fn() so these tests never hit the real network, while still
 * exercising the real APIClient/APIError code paths end-to-end.
 * -----------------------------------------------------------------------
 */

import { jest } from '@jest/globals';
import { APIClient, APIError } from '../../api.js';
import { mockUsers, mockTodos, mockUserOneTodos, mockFetchResponse } from '../__mocks__/api.js';

describe('APIClient integration tests', () => {
  let client;
  let consoleErrorSpy;

  beforeEach(() => {
    client = new APIClient('https://fake-api.test');
    global.fetch = jest.fn();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete global.fetch;
  });

  describe('fetchUsers()', () => {
    it('resolves with the parsed JSON body on success', async () => {
      global.fetch.mockResolvedValue(mockFetchResponse(mockUsers));

      const result = await client.fetchUsers();

      expect(result).toEqual(mockUsers);
    });

    it('calls fetch with the correct /users endpoint', async () => {
      global.fetch.mockResolvedValue(mockFetchResponse(mockUsers));

      await client.fetchUsers();

      expect(global.fetch).toHaveBeenCalledWith('https://fake-api.test/users');
    });

    it('returns an empty array and logs an error on network failure', async () => {
      global.fetch.mockRejectedValue(new TypeError('Failed to fetch'));

      const result = await client.fetchUsers();

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('returns an empty array when the response is a 500', async () => {
      global.fetch.mockResolvedValue(mockFetchResponse(null, { ok: false, status: 500 }));

      const result = await client.fetchUsers();

      expect(result).toEqual([]);
    });
  });

  describe('fetchTodos()', () => {
    it('resolves with the parsed JSON body on success', async () => {
      global.fetch.mockResolvedValue(mockFetchResponse(mockTodos));

      const result = await client.fetchTodos();

      expect(result).toEqual(mockTodos);
    });

    it('calls fetch with the correct /todos endpoint', async () => {
      global.fetch.mockResolvedValue(mockFetchResponse(mockTodos));

      await client.fetchTodos();

      expect(global.fetch).toHaveBeenCalledWith('https://fake-api.test/todos');
    });

    it('returns an empty array on a 404 response', async () => {
      global.fetch.mockResolvedValue(mockFetchResponse(null, { ok: false, status: 404 }));

      const result = await client.fetchTodos();

      expect(result).toEqual([]);
    });
  });

  describe('fetchUserTodos(userId)', () => {
    it('calls fetch with a query string containing the userId', async () => {
      global.fetch.mockResolvedValue(mockFetchResponse(mockUserOneTodos));

      await client.fetchUserTodos(1);

      expect(global.fetch).toHaveBeenCalledWith('https://fake-api.test/todos?userId=1');
    });

    it('resolves with only the todos belonging to that user', async () => {
      global.fetch.mockResolvedValue(mockFetchResponse(mockUserOneTodos));

      const result = await client.fetchUserTodos(1);

      expect(result.every((t) => t.userId === 1)).toBe(true);
    });

    it('returns an empty array on failure rather than throwing', async () => {
      global.fetch.mockRejectedValue(new Error('timeout'));

      const result = await client.fetchUserTodos(1);

      expect(result).toEqual([]);
    });
  });

  describe('fetchAllData()', () => {
    it('fetches users and todos concurrently and returns both', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.endsWith('/users')) return Promise.resolve(mockFetchResponse(mockUsers));
        if (url.endsWith('/todos')) return Promise.resolve(mockFetchResponse(mockTodos));
        return Promise.resolve(mockFetchResponse(null, { ok: false, status: 404 }));
      });

      const result = await client.fetchAllData();

      expect(result.users).toEqual(mockUsers);
      expect(result.todos).toEqual(mockTodos);
    });

    it('calls fetch exactly twice (once per endpoint)', async () => {
      global.fetch.mockResolvedValue(mockFetchResponse([]));

      await client.fetchAllData();

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling for non-OK responses', () => {
    it('throws/handles a 400 the same way as other error statuses (fetchUsers)', async () => {
      global.fetch.mockResolvedValue(mockFetchResponse(null, { ok: false, status: 400 }));

      const result = await client.fetchUsers();

      expect(result).toEqual([]);
    });

    it('propagates an APIError with the correct endpoint when using the low-level _get() directly', async () => {
      global.fetch.mockResolvedValue(mockFetchResponse(null, { ok: false, status: 500 }));

      await expect(client._get('/broken')).rejects.toBeInstanceOf(APIError);
    });

    it('APIError from _get() includes the failing endpoint and status', async () => {
      global.fetch.mockResolvedValue(mockFetchResponse(null, { ok: false, status: 503 }));

      try {
        await client._get('/broken');
        throw new Error('expected _get to reject');
      } catch (err) {
        expect(err.status).toBe(503);
        expect(err.endpoint).toBe('/broken');
      }
    });
  });

  describe('response parsing failures', () => {
    it('wraps a JSON parse error in an APIError', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockRejectedValue(new SyntaxError('Unexpected token')),
      });

      await expect(client._get('/bad-json')).rejects.toBeInstanceOf(APIError);
    });
  });

  describe('caching behavior', () => {
    it('only calls fetch once for two requests to the same endpoint', async () => {
      global.fetch.mockResolvedValue(mockFetchResponse(mockUsers));

      await client.fetchUsers();
      await client.fetchUsers();

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('clearCache() forces a fresh network request on the next call', async () => {
      global.fetch.mockResolvedValue(mockFetchResponse(mockUsers));

      await client.fetchUsers();
      client.clearCache();
      await client.fetchUsers();

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('fetchUsersPromise() (.then()-based variant)', () => {
    it('resolves with parsed JSON on success', async () => {
      global.fetch.mockResolvedValue(mockFetchResponse(mockUsers));

      const result = await client.fetchUsersPromise();

      expect(result).toEqual(mockUsers);
    });

    it('resolves with an empty array and logs on failure (graceful .catch fallback)', async () => {
      global.fetch.mockResolvedValue(mockFetchResponse(null, { ok: false, status: 500 }));

      const result = await client.fetchUsersPromise();

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
