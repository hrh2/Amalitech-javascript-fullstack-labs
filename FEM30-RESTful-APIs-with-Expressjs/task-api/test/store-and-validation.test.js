const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { forEach } = require('./each');
const store = require('../store');
const { parseId, validateTask } = require('../validate-task');

// These are unit tests: plain functions, no HTTP and no server.

describe('parseId', () => {
  forEach([['1', 1], ['42', 42], ['1000', 1000]], '%s -> %s', ([input, expected]) => {
    assert.equal(parseId(input), expected);
  });

  forEach(['0', '-1', '1.5', 'abc', '', ' 1', '1 ', '01', '1e3', '0x10'], '%j -> null', (input) => {
    assert.equal(parseId(input), null);
  });
});

describe('validateTask', () => {
  test('accepts a title and trims it', () => {
    assert.deepEqual(validateTask({ title: '  Hi  ' }), { value: { title: 'Hi' } });
  });

  test('is safe when the body is undefined (Express 5, no JSON body)', () => {
    assert.deepEqual(validateTask(undefined), { errors: ['Request body must be a JSON object'] });
  });

  test('reports every problem at once, not just the first', () => {
    const { errors } = validateTask({ title: '', completed: 'x' });
    assert.equal(errors.length, 2);
  });

  test('partial mode makes every field optional but still checks the ones present', () => {
    assert.deepEqual(validateTask({}, { partial: true }), { value: {} });
    assert.deepEqual(validateTask({ completed: true }, { partial: true }), { value: { completed: true } });
    assert.ok(validateTask({ title: ' ' }, { partial: true }).errors);
  });

  test('does not pass unknown fields through', () => {
    assert.deepEqual(validateTask({ title: 'x', id: 5, role: 'admin' }), { value: { title: 'x' } });
  });
});

describe('store', () => {
  beforeEach(() => store.reset());

  test('starts with three seed tasks', () => {
    assert.equal(store.list().length, 3);
  });

  test('list returns a copy: changing it does not change the store', () => {
    store.list().pop();
    assert.equal(store.list().length, 3);
  });

  test('create assigns increasing ids and defaults completed to false', () => {
    assert.deepEqual(store.create({ title: 'a' }), { id: 4, title: 'a', completed: false });
    assert.equal(store.create({ title: 'b' }).id, 5);
  });

  test('replace swaps the task, update merges, both return undefined for a missing id', () => {
    assert.deepEqual(store.replace(1, { title: 'r' }), { id: 1, title: 'r', completed: false });
    assert.deepEqual(store.update(1, { completed: true }), { id: 1, title: 'r', completed: true });
    assert.equal(store.replace(99, { title: 'x' }), undefined);
    assert.equal(store.update(99, { title: 'x' }), undefined);
  });

  test('remove returns true once, then false', () => {
    assert.equal(store.remove(1), true);
    assert.equal(store.remove(1), false);
  });
});
