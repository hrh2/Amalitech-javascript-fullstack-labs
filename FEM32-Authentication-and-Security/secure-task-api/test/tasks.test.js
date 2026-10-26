const { connect, disconnect, mongoose, startServer, call } = require('./setup');
const { test, describe, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../app');
const User = require('../models/User');
const Task = require('../models/Task');
const { registerAndLogin, createAdminAndLogin } = require('./helpers');

let server;
let base;
let alice; // normal user A
let bob;   // normal user B
let admin;

before(async () => {
  await connect();
  ({ server, base } = await startServer(app));
});
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await mongoose.connection.dropDatabase();
  await disconnect();
});
beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Task.deleteMany({})]);
  alice = await registerAndLogin(base, 'Alice');
  bob = await registerAndLogin(base, 'Bob');
  admin = await createAdminAndLogin(base);
});

const MISSING = '507f1f77bcf86cd799439011';
const create = (who, body) => call(base, 'POST', '/api/tasks', { token: who.token, body });
const aliceTask = async (title = 'Alice task') => (await create(alice, { title })).json.data.task;

describe('every task route requires authentication', () => {
  test('every method without a token is a 401 in the standard error format, and nothing changes', async () => {
    const task = await aliceTask();
    const requests = [
      ['GET', '/api/tasks'],
      ['GET', `/api/tasks/${task.id}`],
      ['POST', '/api/tasks', { title: 'x' }],
      ['PUT', `/api/tasks/${task.id}`, { title: 'x' }],
      ['PATCH', `/api/tasks/${task.id}`, { completed: true }],
      ['DELETE', `/api/tasks/${task.id}`],
    ];
    for (const [method, path, body] of requests) {
      const res = await call(base, method, path, { body });
      assert.equal(res.status, 401, `${method} ${path}`);
      assert.deepEqual(res.json, { status: 'error', message: 'Access denied. No token provided.' });
    }
    assert.equal(await Task.countDocuments(), 1);
    assert.equal((await Task.findById(task.id)).title, 'Alice task');
  });

  test('authentication is checked BEFORE anything else, even a malformed id', async () => {
    assert.equal((await call(base, 'GET', '/api/tasks/abc', { token: 'nope' })).status, 401);
  });
});

describe('a normal user manages only their own tasks', () => {
  test('POST creates a task owned by the caller: 201, the task, the owner id, createdAt, and a Location header', async () => {
    const res = await create(alice, { title: 'Learn auth' });
    assert.equal(res.status, 201);
    assert.equal(res.json.status, 'success');
    const { task } = res.json.data;
    assert.equal(task.title, 'Learn auth');
    assert.equal(task.completed, false);
    assert.equal(task.owner, alice.user.id);
    assert.ok(!Number.isNaN(Date.parse(task.createdAt)));
    assert.equal(res.headers.get('location'), `/api/tasks/${task.id}`);
  });

  test('an "owner" sent in the body is ignored: you cannot create tasks for someone else', async () => {
    const res = await create(alice, { title: 'x', owner: bob.user.id });
    assert.equal(res.json.data.task.owner, alice.user.id);
  });

  test('GET /api/tasks lists only the caller\'s tasks', async () => {
    await create(alice, { title: 'A1' });
    await create(alice, { title: 'A2' });
    await create(bob, { title: 'B1' });
    const mine = await call(base, 'GET', '/api/tasks', { token: alice.token });
    assert.equal(mine.json.data.count, 2);
    assert.deepEqual(mine.json.data.tasks.map((t) => t.title), ['A1', 'A2']);
    assert.deepEqual((await call(base, 'GET', '/api/tasks', { token: bob.token })).json.data.tasks.map((t) => t.title), ['B1']);
  });

  test('GET /api/tasks/:id returns the caller\'s task; ?completed= filters', async () => {
    const task = await aliceTask();
    await call(base, 'PATCH', `/api/tasks/${task.id}`, { token: alice.token, body: { completed: true } });
    await create(alice, { title: 'open one' });
    assert.equal((await call(base, 'GET', `/api/tasks/${task.id}`, { token: alice.token })).json.data.task.title, 'Alice task');
    assert.equal((await call(base, 'GET', '/api/tasks?completed=true', { token: alice.token })).json.data.count, 1);
    assert.equal((await call(base, 'GET', '/api/tasks?completed=false', { token: alice.token })).json.data.count, 1);
    assert.equal((await call(base, 'GET', '/api/tasks?completed=maybe', { token: alice.token })).status, 400);
  });

  test('PUT replaces and PATCH changes the caller\'s own task; the owner never changes', async () => {
    const task = await aliceTask();
    const put = await call(base, 'PUT', `/api/tasks/${task.id}`, { token: alice.token, body: { title: 'Replaced', completed: true, owner: bob.user.id } });
    assert.equal(put.status, 200);
    assert.equal(put.json.data.task.title, 'Replaced');
    assert.equal(put.json.data.task.completed, true);
    assert.equal(put.json.data.task.owner, alice.user.id);

    const patch = await call(base, 'PATCH', `/api/tasks/${task.id}`, { token: alice.token, body: { completed: false } });
    assert.equal(patch.json.data.task.completed, false);
    assert.equal(patch.json.data.task.title, 'Replaced');
  });

  test('DELETE removes the caller\'s own task', async () => {
    const task = await aliceTask();
    const res = await call(base, 'DELETE', `/api/tasks/${task.id}`, { token: alice.token });
    assert.equal(res.status, 200);
    assert.deepEqual(res.json, { status: 'success', data: { message: `Task ${task.id} deleted` } });
    assert.equal(await Task.countDocuments(), 0);
  });

  test('"User A cannot delete User B\'s task": another user\'s task is a 404 for GET, PUT, PATCH and DELETE, and is left untouched', async () => {
    const task = await aliceTask('Alice secret');
    const attempts = [
      call(base, 'GET', `/api/tasks/${task.id}`, { token: bob.token }),
      call(base, 'PUT', `/api/tasks/${task.id}`, { token: bob.token, body: { title: 'hacked' } }),
      call(base, 'PATCH', `/api/tasks/${task.id}`, { token: bob.token, body: { completed: true } }),
      call(base, 'DELETE', `/api/tasks/${task.id}`, { token: bob.token }),
    ];
    for (const res of await Promise.all(attempts)) {
      assert.equal(res.status, 404);
      assert.equal(res.json.status, 'error');
    }
    const unchanged = await Task.findById(task.id);
    assert.equal(unchanged.title, 'Alice secret');
    assert.equal(unchanged.completed, false);
  });

  test('"not yours" and "does not exist" look identical (the API does not reveal which ids exist)', async () => {
    const task = await aliceTask();
    const notYours = await call(base, 'GET', `/api/tasks/${task.id}`, { token: bob.token });
    const notThere = await call(base, 'GET', `/api/tasks/${MISSING}`, { token: bob.token });
    assert.equal(notYours.status, notThere.status);
    assert.deepEqual(Object.keys(notYours.json), Object.keys(notThere.json));
  });

  test('/dashboard counts only the caller\'s tasks', async () => {
    await create(alice, { title: 'A1' });
    await create(alice, { title: 'A2' });
    await create(bob, { title: 'B1' });
    assert.equal((await call(base, 'GET', '/dashboard', { token: alice.token })).json.data.taskCount, 2);
  });
});

describe('an admin sees and manages all tasks (per the lab\'s access table)', () => {
  test('GET /api/tasks returns EVERY user\'s tasks, with their owners', async () => {
    await create(alice, { title: 'A1' });
    await create(bob, { title: 'B1' });
    const res = await call(base, 'GET', '/api/tasks', { token: admin.token });
    assert.equal(res.json.data.count, 2);
    assert.deepEqual(res.json.data.tasks.map((t) => [t.title, t.owner]).sort(), [['A1', alice.user.id], ['B1', bob.user.id]]);
  });

  test('GET /api/tasks/:id works for any user\'s task', async () => {
    const task = await aliceTask();
    const res = await call(base, 'GET', `/api/tasks/${task.id}`, { token: admin.token });
    assert.equal(res.status, 200);
    assert.equal(res.json.data.task.owner, alice.user.id);
  });

  test('DELETE /api/tasks/:id works for any user\'s task ("task owner or admin")', async () => {
    const task = await aliceTask();
    const res = await call(base, 'DELETE', `/api/tasks/${task.id}`, { token: admin.token });
    assert.equal(res.status, 200);
    assert.equal(await Task.countDocuments(), 0);
  });

  test('PUT and PATCH are "task owner only" (per the lab\'s endpoint table): an admin cannot rewrite someone else\'s task', async () => {
    const task = await aliceTask();
    assert.equal((await call(base, 'PUT', `/api/tasks/${task.id}`, { token: admin.token, body: { title: 'edited by admin' } })).status, 404);
    assert.equal((await call(base, 'PATCH', `/api/tasks/${task.id}`, { token: admin.token, body: { completed: true } })).status, 404);
    assert.equal((await Task.findById(task.id)).title, 'Alice task');
  });

  test('an admin\'s own tasks work like anyone else\'s, and the filter applies to the admin view too', async () => {
    await create(admin, { title: 'admin task' });
    await create(alice, { title: 'A1' });
    const open = await call(base, 'GET', '/api/tasks?completed=false', { token: admin.token });
    assert.equal(open.json.data.count, 2);
  });
});

describe('validation and errors (with a valid token) use the standard format', () => {
  test('400 for bad bodies and ids', async () => {
    const noTitle = await create(alice, { completed: true });
    assert.equal(noTitle.status, 400);
    assert.deepEqual(Object.keys(noTitle.json).sort(), ['errors', 'message', 'status']);
    assert.equal((await create(alice, { title: '   ' })).status, 400);
    assert.equal((await call(base, 'GET', '/api/tasks/abc', { token: alice.token })).status, 400);
    assert.equal((await call(base, 'PATCH', `/api/tasks/${MISSING}`, { token: alice.token, body: {} })).status, 400);
  });

  test('a 201-character title is rejected as a 400', async () => {
    assert.equal((await create(alice, { title: 'x'.repeat(201) })).status, 400);
  });

  test('every error response (even 404 for an unknown route) has { status: "error", message }', async () => {
    const responses = await Promise.all([
      call(base, 'GET', '/nope'),
      call(base, 'GET', '/api/tasks/abc', { token: alice.token }),
      call(base, 'POST', '/api/tasks', { token: alice.token, body: '{bad' }),
      call(base, 'DELETE', `/api/tasks/${MISSING}`, { token: alice.token }),
    ]);
    for (const res of responses) {
      assert.match(res.headers.get('content-type'), /^application\/json/);
      assert.equal(res.json.status, 'error');
      assert.equal(typeof res.json.message, 'string');
    }
  });

  test('a database failure is a generic 500 and does not leak the internal message', async (t) => {
    t.mock.method(console, 'error', () => {});
    t.mock.method(Task, 'find', () => {
      throw new Error('connect ECONNREFUSED mongodb://admin:hunter2@db.internal:27017');
    });
    const res = await call(base, 'GET', '/api/tasks', { token: alice.token });
    assert.equal(res.status, 500);
    assert.deepEqual(res.json, { status: 'error', message: 'Internal Server Error' });
    assert.ok(!res.text.includes('hunter2'));
    assert.equal(console.error.mock.callCount(), 1);
  });
});
