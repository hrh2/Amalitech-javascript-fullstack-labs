// Shared set-up: a SEPARATE database and test-only settings. Must be required before the app.
process.env.NODE_ENV = 'test'; // switches the request logger off
process.env.DB_URI = process.env.TEST_DB_URI || 'mongodb://127.0.0.1:27017/task_tracker_auth_test';
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-123456'; // only for tests
process.env.BCRYPT_ROUNDS = '4';           // the minimum: real hashing is deliberately slow, tests do not need that
process.env.AUTH_RATE_LIMIT_MAX = '1000';  // so the many register/login calls in the tests are not rate limited

const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const { env } = require('../config/env');

// These tests delete all users and tasks: refuse to run against anything that is not clearly a test database.
const dbName = new URL(env.DB_URI).pathname.slice(1);
if (!dbName.endsWith('_test')) {
  throw new Error(`Refusing to run tests against database "${dbName}": its name must end with "_test".`);
}

async function startServer(app) {
  const server = app.listen(0); // port 0 = any free port
  await new Promise((resolve) => server.once('listening', resolve));
  return { server, base: `http://localhost:${server.address().port}` };
}

async function call(base, method, path, { body, token, headers = {} } = {}) {
  const options = { method, headers: { ...headers } };
  if (token) options.headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  const res = await fetch(`${base}${path}`, options);
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = undefined; }
  return { status: res.status, headers: res.headers, text, json };
}

module.exports = { connect: connectDB, disconnect: disconnectDB, mongoose, startServer, call };
