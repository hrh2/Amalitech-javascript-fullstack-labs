const { connect, disconnect, mongoose, startServer, call } = require('./setup');
const { test, describe, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const app = require('../app');
const User = require('../models/User');
const Task = require('../models/Task');
const { PASSWORD, registerAndLogin, createAdminAndLogin } = require('./helpers');

let server;
let base;
let admin;
let alice;
let bob;

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
  admin = await createAdminAndLogin(base);
  alice = await registerAndLogin(base, 'Alice');
  bob = await registerAndLogin(base, 'Bob');
});

const MISSING = '507f1f77bcf86cd799439011';

describe('GET /api/users ("admins can view all users")', () => {
  test('an admin gets every user, without any password hash', async () => {
    const res = await call(base, 'GET', '/api/users', { token: admin.token });
    assert.equal(res.status, 200);
    assert.equal(res.json.data.count, 3);
    assert.deepEqual(res.json.data.users.map((u) => u.email), ['root.admin@example.com', 'alice@example.com', 'bob@example.com']);
    assert.deepEqual(res.json.data.users.map((u) => u.role), ['admin', 'user', 'user']);
    assert.ok(!/password|\$2b\$/i.test(res.text));
  });

  test('a normal user is FORBIDDEN (403, not 401): they are logged in, just not allowed', async () => {
    const res = await call(base, 'GET', '/api/users', { token: alice.token });
    assert.equal(res.status, 403);
    assert.equal(res.json.status, 'error');
    assert.match(res.json.message, /requires the admin role/);
  });

  test('no token is a 401', async () => {
    assert.equal((await call(base, 'GET', '/api/users')).status, 401);
  });
});

describe('deleting users: DELETE /api/users/:id and DELETE /admin/user/:id (admin only)', () => {
  const paths = [(id) => `/api/users/${id}`, (id) => `/admin/user/${id}`];

  for (const path of paths) {
    test(`${path('<id>')}: no token is 401; a normal user is 403 and nothing is deleted`, async () => {
      assert.equal((await call(base, 'DELETE', path(bob.user.id))).status, 401);
      const res = await call(base, 'DELETE', path(bob.user.id), { token: alice.token });
      assert.equal(res.status, 403);
      assert.equal(await User.countDocuments({ _id: bob.user.id }), 1);
    });

    test(`${path('<id>')}: an admin deletes a user; their token and password stop working`, async () => {
      const res = await call(base, 'DELETE', path(bob.user.id), { token: admin.token });
      assert.equal(res.status, 200);
      assert.equal(res.json.status, 'success');
      assert.equal(await User.countDocuments({ _id: bob.user.id }), 0);
      assert.equal((await call(base, 'GET', '/dashboard', { token: bob.token })).status, 401);
      assert.equal((await call(base, 'POST', '/auth/login', { body: { email: bob.email, password: PASSWORD } })).status, 401);
    });

    test(`${path('<id>')}: 404 for an unknown user, 400 for a malformed id`, async () => {
      assert.equal((await call(base, 'DELETE', path(MISSING), { token: admin.token })).status, 404);
      assert.equal((await call(base, 'DELETE', path('abc'), { token: admin.token })).status, 400);
    });
  }

  test('deleting a user also deletes their tasks, and only theirs', async () => {
    await call(base, 'POST', '/api/tasks', { token: bob.token, body: { title: 'bob task' } });
    await call(base, 'POST', '/api/tasks', { token: alice.token, body: { title: 'alice task' } });
    await call(base, 'DELETE', `/api/users/${bob.user.id}`, { token: admin.token });
    assert.deepEqual((await Task.find()).map((t) => t.title), ['alice task']);
  });

  test('an admin cannot delete themselves (409), so the system cannot be left without one by accident', async () => {
    const res = await call(base, 'DELETE', `/api/users/${admin.user.id}`, { token: admin.token });
    assert.equal(res.status, 409);
    assert.equal(await User.countDocuments({ _id: admin.user.id }), 1);
  });

  test('the second delete of the same user is a 404', async () => {
    await call(base, 'DELETE', `/api/users/${bob.user.id}`, { token: admin.token });
    assert.equal((await call(base, 'DELETE', `/api/users/${bob.user.id}`, { token: admin.token })).status, 404);
  });
});

describe('the role is read from the DATABASE on every request, not trusted from the token', () => {
  test('a validly signed token that CLAIMS role admin does not make a normal user an admin', async () => {
    const claimed = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { subject: alice.user.id, algorithm: 'HS256' });
    assert.equal((await call(base, 'GET', '/api/users', { token: claimed })).status, 403);
  });

  test('promoting a user in the database takes effect immediately, even for a token issued earlier', async () => {
    assert.equal((await call(base, 'GET', '/api/users', { token: alice.token })).status, 403);
    await User.updateOne({ _id: alice.user.id }, { role: 'admin' });
    assert.equal((await call(base, 'GET', '/api/users', { token: alice.token })).status, 200);
  });

  test('demoting an admin takes effect immediately too', async () => {
    await User.updateOne({ _id: admin.user.id }, { role: 'user' });
    assert.equal((await call(base, 'GET', '/api/users', { token: admin.token })).status, 403);
  });
});
