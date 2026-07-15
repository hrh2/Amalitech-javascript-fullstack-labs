/**
 * api.js
 * -----------------------------------------------------------------------
 * Handles all communication with the JSONPlaceholder API.
 * Demonstrates: async/await, Promise-based methods, Promise.all(),
 * template literals, default parameters, optional chaining, and
 * robust error handling for network requests.
 * -----------------------------------------------------------------------
 */

const DEFAULT_BASE_URL = 'https://jsonplaceholder.typicode.com';

/** Custom error used for anything that goes wrong talking to the API. */
export class APIError extends Error {
  constructor(message, { status = null, endpoint = null } = {}) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.endpoint = endpoint;
  }
}

export class APIClient {
  /**
   * @param {string} baseUrl - Base URL for the API (default parameter demo).
   */
  constructor(baseUrl = DEFAULT_BASE_URL) {
    this.baseUrl = baseUrl;
    // Simple in-memory cache implemented with a closure-friendly Map.
    this._cache = new Map();
  }

  /**
   * Low level GET helper shared by every public fetch method.
   * Uses async/await and template literals to build the URL.
   */
  async _get(endpoint) {
    const url = `${this.baseUrl}${endpoint}`;

    // Closure-based cache: avoid redundant network calls (bonus challenge).
    if (this._cache.has(url)) {
      return this._cache.get(url);
    }

    let response;
    try {
      response = await fetch(url);
    } catch (networkError) {
      // fetch() itself throws on network-level failures (DNS, offline, etc.)
      throw new APIError(`Network error while requesting ${endpoint}: ${networkError.message}`, {
        endpoint,
      });
    }

    if (!response?.ok) {
      throw new APIError(`Request to ${endpoint} failed with status ${response?.status}`, {
        status: response?.status,
        endpoint,
      });
    }

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      throw new APIError(`Failed to parse JSON from ${endpoint}: ${parseError.message}`, {
        endpoint,
      });
    }

    this._cache.set(url, data);
    return data;
  }

  /** Fetch all users (Promise-based `.then()` style, per requirements). */
  fetchUsersPromise() {
    return fetch(`${this.baseUrl}/users`)
      .then((res) => {
        if (!res.ok) {
          throw new APIError(`Failed to fetch users: ${res.status}`, {
            status: res.status,
            endpoint: '/users',
          });
        }
        return res.json();
      })
      .catch((err) => {
        console.error(`[APIClient] fetchUsersPromise error: ${err.message}`);
        return []; // graceful fallback
      });
  }

  /** Fetch all users (async/await style). */
  async fetchUsers() {
    try {
      return await this._get('/users');
    } catch (err) {
      console.error(`[APIClient] fetchUsers error: ${err.message}`);
      return []; // fallback: empty list rather than crashing the app
    }
  }

  /** Fetch all todos (tasks). */
  async fetchTodos() {
    try {
      return await this._get('/todos');
    } catch (err) {
      console.error(`[APIClient] fetchTodos error: ${err.message}`);
      return [];
    }
  }

  /** Fetch todos belonging to a single user. */
  async fetchUserTodos(userId) {
    try {
      return await this._get(`/todos?userId=${userId}`);
    } catch (err) {
      console.error(`[APIClient] fetchUserTodos(${userId}) error: ${err.message}`);
      return [];
    }
  }

  /**
   * Fetch users and todos concurrently using Promise.all().
   * Returns a destructured, ready-to-use object.
   */
  async fetchAllData() {
    try {
      const [users, todos] = await Promise.all([this.fetchUsers(), this.fetchTodos()]);
      return { users, todos };
    } catch (err) {
      throw new APIError(`fetchAllData failed: ${err.message}`);
    }
  }

  /** Clear the internal cache (useful for tests / long-running CLIs). */
  clearCache() {
    this._cache.clear();
  }
}
