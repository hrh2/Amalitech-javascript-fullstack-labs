const { connect, disconnect } = require('./setup');
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const { seedTasks } = require('../seed');

// The point of this module: data must survive the connection (and so the server process) going away.
describe('data persistence', () => {
  before(async () => {
    await connect();
    await seedTasks();
  });

  after(async () => {
    await mongoose.connection.dropDatabase();
    await disconnect();
  });

  test('a task is still there after the connection is closed and opened again', async () => {
    const created = await Task.create({ title: 'I must survive a restart' });
    await disconnect(); // like stopping the server
    assert.equal(mongoose.connection.readyState, 0);

    await connect(); // like starting it again
    const found = await Task.findById(created.id);
    assert.equal(found.title, 'I must survive a restart');
  });

  test('the schema fills defaults and trims', async () => {
    const task = await Task.create({ title: '  trimmed  ' });
    assert.equal(task.title, 'trimmed');
    assert.equal(task.completed, false);
  });

  test('the schema rejects bad data even when the API-level validation is bypassed', async () => {
    await assert.rejects(Task.create({ completed: true }), { name: 'ValidationError' });
    await assert.rejects(Task.create({ title: 'x', completed: 'definitely' }), { name: 'ValidationError' });
  });

  test('the schema silently drops fields it does not declare (strict mode)', async () => {
    const task = await Task.create({ title: 'strict', role: 'admin' });
    assert.equal(task.toObject().role, undefined);
    const raw = await mongoose.connection.collection('tasks').findOne({ _id: task._id });
    assert.equal(raw.role, undefined); // not in the database either
  });

  test('looking up or deleting an id that does not exist gives null / deletedCount 0 instead of throwing', async () => {
    const missing = '507f1f77bcf86cd799439011';
    assert.equal(await Task.findById(missing), null);
    assert.equal((await Task.deleteOne({ _id: missing })).deletedCount, 0);
  });

  test('a query result is a plain copy: changing it does not change the data', async () => {
    await seedTasks();
    const list = await Task.find();
    list.pop();
    assert.equal((await Task.find()).length, 3);
  });

  test('the completed index exists', async () => {
    await Task.init(); // make sure the declared indexes have been built
    const indexes = await Task.collection.indexes();
    assert.ok(indexes.some((index) => index.key.completed === 1));
  });
});

describe('test safety net', () => {
  test('the tests use a database whose name ends in _test', () => {
    assert.match(mongoose.connection.name, /_test$/);
  });
});
