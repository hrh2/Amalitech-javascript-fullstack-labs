/**
 * tests/unit/utils.test.js
 * -----------------------------------------------------------------------
 * "Testing with Spies" section of the lab: jest.spyOn() used to verify
 * internal calls (Array methods, console methods) made by models.js and
 * taskProcessor.js, plus a handful of dedicated error-handling tests.
 * -----------------------------------------------------------------------
 */

import { jest } from '@jest/globals';
import { Task, PriorityTask, User } from '../../models.js';
import {
  filterByStatus,
  calculateStatistics,
  sortTasks,
  searchTasksByTitle,
} from '../../taskProcessor.js';
import { APIClient, APIError } from '../../api.js';

describe('Spies on Array.prototype methods', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('verifies filterByStatus() internally calls Array.prototype.filter', () => {
    const filterSpy = jest.spyOn(Array.prototype, 'filter');
    const tasks = [new Task({ id: 1, title: 'a', completed: true, userId: 1 })];

    filterByStatus(tasks, true);

    expect(filterSpy).toHaveBeenCalledTimes(1);
  });

  it('verifies calculateStatistics() internally calls Array.prototype.reduce', () => {
    const reduceSpy = jest.spyOn(Array.prototype, 'reduce');
    calculateStatistics([new Task({ id: 1, title: 'a', userId: 1 })]);

    expect(reduceSpy).toHaveBeenCalledTimes(1);
  });

  it('verifies sortTasks() internally calls Array.prototype.sort', () => {
    const sortSpy = jest.spyOn(Array.prototype, 'sort');
    sortTasks([new Task({ id: 2, title: 'b', userId: 1 }), new Task({ id: 1, title: 'a', userId: 1 })]);

    expect(sortSpy).toHaveBeenCalledTimes(1);
  });

  it('verifies searchTasksByTitle() internally calls Array.prototype.filter with the right array length', () => {
    const filterSpy = jest.spyOn(Array.prototype, 'filter');
    const tasks = [
      new Task({ id: 1, title: 'find me', userId: 1 }),
      new Task({ id: 2, title: 'not this one', userId: 1 }),
    ];

    searchTasksByTitle(tasks, 'find');

    expect(filterSpy).toHaveBeenCalled();
    // The spy should have been invoked on our 2-item array at some point.
    expect(filterSpy.mock.instances.some((arr) => arr.length === 2)).toBe(true);
  });

  it('restores the original Array.prototype.filter after mockRestore()', () => {
    const filterSpy = jest.spyOn(Array.prototype, 'filter');
    filterSpy.mockRestore();
    expect(Array.prototype.filter.name).toBe('filter');
  });
});

describe('Spies on console methods', () => {
  let logSpy;
  let errorSpy;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('APIClient.fetchUsers() logs an error via console.error on failure', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));
    const client = new APIClient('https://fake.test');

    const result = await client.fetchUsers();

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls[0][0]).toContain('fetchUsers error');
    expect(result).toEqual([]); // graceful fallback, not a thrown error
  });

  it('console.error is called with a message that includes the endpoint name', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('boom'));
    const client = new APIClient('https://fake.test');

    await client.fetchTodos();

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('fetchTodos error'));
  });

  it('a manual demonstration of call-count tracking with a plain jest.fn() logger', () => {
    const logger = jest.fn();
    logger('first call');
    logger('second call');

    expect(logger).toHaveBeenCalledTimes(2);
    expect(logger).toHaveBeenNthCalledWith(1, 'first call');
    expect(logger).toHaveBeenNthCalledWith(2, 'second call');
  });
});

describe('Spies verifying internal method calls within classes', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('verifies PriorityTask.getStatus() calls Task.prototype.getStatus() via super', () => {
    const superGetStatusSpy = jest.spyOn(Task.prototype, 'getStatus');
    const t = new PriorityTask({ id: 1, title: 'x', userId: 1, priority: 'low' });

    t.getStatus();

    expect(superGetStatusSpy).toHaveBeenCalledTimes(1);
  });

  it('verifies User.getCompletionRate() is invoked by summary()', () => {
    const user = new User({ id: 1, name: 'Test', email: 't@t.com' });
    const rateSpy = jest.spyOn(user, 'getCompletionRate');

    user.summary();

    expect(rateSpy).toHaveBeenCalledTimes(1);
  });
});

describe('Error handling', () => {
  it('APIError sets name, status, and endpoint correctly', () => {
    const err = new APIError('Something broke', { status: 404, endpoint: '/todos' });
    expect(err.name).toBe('APIError');
    expect(err.status).toBe(404);
    expect(err.endpoint).toBe('/todos');
    expect(err.message).toBe('Something broke');
  });

  it('APIError defaults status/endpoint to null when not provided', () => {
    const err = new APIError('Generic failure');
    expect(err.status).toBeNull();
    expect(err.endpoint).toBeNull();
  });

  it('APIError is an instance of Error and can be thrown/caught normally', () => {
    expect(() => {
      throw new APIError('boom');
    }).toThrow(Error);
  });

  it('Task constructor does not throw on completely empty data', () => {
    expect(() => new Task({})).not.toThrow();
  });

  it('User constructor throws when required fields are entirely missing (destructuring from undefined)', () => {
    expect(() => new User(undefined)).toThrow();
  });

  it('PriorityTask handles an invalid date string by producing an Invalid Date rather than throwing', () => {
    const t = new PriorityTask({ id: 1, title: 'x', userId: 1, dueDate: 'not-a-date' });
    expect(t.dueDate instanceof Date).toBe(true);
    expect(Number.isNaN(t.dueDate.getTime())).toBe(true);
  });

  it('sortTasks() does not throw when sorting an array containing plain objects', () => {
    expect(() => sortTasks([{ id: 2 }, { id: 1 }])).not.toThrow();
  });
});
