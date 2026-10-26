const { connect, disconnect, mongoose, startServer, call } = require('./setup');
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const app = require('../app');
const { hashPassword, verifyPassword, verifyAgainstDummy } = require('../utils/passwords');
const { signToken, verifyToken } = require('../utils/tokens');
const { authorizeRole } = require('../middleware/roleMiddleware');
const { createAuthLimiter } = require('../middleware/rateLimiter');
const { assertEnv } = require('../config/env');
const { validateRegistration, validateLogin, parseId } = require('../utils/validators');

describe('passwords utility', () => {
  test('hashes with bcrypt, and verify accepts the right password and rejects others', async () => {
    const hash = await hashPassword('s3cret-pass');
    assert.match(hash, /^\$2b\$04\$/);
    assert.equal(await verifyPassword('s3cret-pass', hash), true);
    assert.equal(await verifyPassword('S3cret-pass', hash), false);
    assert.equal(await verifyPassword('', hash), false);
  });

  test('the same password hashes differently every time (random salt)', async () => {
    assert.notEqual(await hashPassword('same'), await hashPassword('same'));
  });

  test('the cost factor comes from BCRYPT_ROUNDS and is stored inside the hash', async () => {
    process.env.BCRYPT_ROUNDS = '5';
    try {
      assert.match(await hashPassword('x'), /^\$2b\$05\$/);
    } finally {
      process.env.BCRYPT_ROUNDS = '4';
    }
  });

  test('verifyAgainstDummy always answers false (used for unknown emails)', async () => {
    assert.equal(await verifyAgainstDummy('anything'), false);
  });
});

describe('tokens utility', () => {
  const user = { id: '507f1f77bcf86cd799439011', role: 'admin' };

  test('signs a token that verifies back to the same subject and role', () => {
    const payload = verifyToken(signToken(user));
    assert.equal(payload.sub, user.id);
    assert.equal(payload.role, 'admin');
  });

  test('JWT_EXPIRES_IN controls the lifetime', () => {
    process.env.JWT_EXPIRES_IN = '10m';
    try {
      const { iat, exp } = verifyToken(signToken(user));
      assert.equal(exp - iat, 600);
    } finally {
      delete process.env.JWT_EXPIRES_IN;
    }
  });

  test('refuses a token signed with a different algorithm or secret', () => {
    assert.throws(() => verifyToken(jwt.sign({}, process.env.JWT_SECRET, { algorithm: 'HS384' })), /invalid algorithm/);
    assert.throws(() => verifyToken(jwt.sign({}, 'another-secret-another-secret-12345')), /invalid signature/);
  });

  test('an expired token throws TokenExpiredError', () => {
    const expired = jwt.sign({}, process.env.JWT_SECRET, { expiresIn: -5 });
    assert.throws(() => verifyToken(expired), { name: 'TokenExpiredError' });
  });
});

describe('environment configuration (.env / dotenv)', () => {
  const withSecret = (value, fn) => {
    const saved = process.env.JWT_SECRET;
    if (value === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = value;
    try { fn(); } finally { process.env.JWT_SECRET = saved; }
  };

  test('start-up fails fast without a JWT_SECRET, with a short one, or with the .env.example placeholder', () => {
    withSecret(undefined, () => assert.throws(assertEnv, /JWT_SECRET/));
    withSecret('too-short', () => assert.throws(assertEnv, /at least 32/));
    withSecret('replace-me-with-at-least-32-random-characters', () => assert.throws(assertEnv, /JWT_SECRET/));
  });

  test('a long random secret is accepted, and the error message never contains the secret itself', () => {
    withSecret('x'.repeat(48), () => assert.doesNotThrow(assertEnv));
    withSecret('short-secret', () => {
      try { assertEnv(); } catch (e) { assert.ok(!e.message.includes('short-secret')); }
    });
  });

  test('the defaults: port 5000 and a database named task_tracker_auth_db (overridden to a _test database in tests)', () => {
    const { env } = require('../config/env');
    const saved = { PORT: process.env.PORT, DB_URI: process.env.DB_URI };
    delete process.env.PORT;
    delete process.env.DB_URI;
    try {
      assert.equal(env.PORT, 5000);
      assert.match(env.DB_URI, /\/task_tracker_auth_db$/);
    } finally {
      if (saved.PORT !== undefined) process.env.PORT = saved.PORT;
      process.env.DB_URI = saved.DB_URI;
    }
  });

  test('.env.example documents every setting the app reads, and .env is git-ignored', () => {
    const fs = require('node:fs');
    const example = fs.readFileSync(`${__dirname}/../.env.example`, 'utf8');
    for (const key of ['PORT', 'DB_URI', 'JWT_SECRET', 'JWT_EXPIRES_IN']) assert.match(example, new RegExp(`^${key}=`, 'm'));
    assert.match(fs.readFileSync(`${__dirname}/../.gitignore`, 'utf8'), /^\.env$/m);
  });

  test('no source file hard-codes a secret: JWT_SECRET is only read from the environment', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.name === 'node_modules' || e.name === 'test' ? [] : e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith('.js') ? [path.join(dir, e.name)] : []);
    for (const file of walk(path.join(__dirname, '..'))) {
      const code = fs.readFileSync(file, 'utf8');
      assert.ok(!/jwt\.sign\([^)]*['"][A-Za-z0-9]{16,}['"]/.test(code), `${file} seems to hard-code a secret`);
    }
  });
});

describe('validators', () => {
  test('registration normalises name and email and keeps the password untouched (no trimming)', () => {
    assert.deepEqual(validateRegistration({ name: ' Amina ', email: ' Amina@Example.COM ', password: '  spaces kept  ' }), {
      value: { name: 'Amina', email: 'amina@example.com', password: '  spaces kept  ' },
    });
  });

  test('registration reports all problems at once', () => {
    assert.equal(validateRegistration({ name: '', email: 'x', password: 'y' }).errors.length, 3);
  });

  test('login only checks the shape: strings that are present', () => {
    assert.ok(validateLogin({ email: 'a@b.co', password: 'x' }).value);
    assert.ok(validateLogin({ email: 'a@b.co', password: '' }).errors);
    assert.ok(validateLogin({ email: { $ne: null }, password: 'x' }).errors);
  });

  test('parseId accepts only 24 hex characters (and not a 12-character string)', () => {
    assert.ok(parseId('507f1f77bcf86cd799439011'));
    for (const bad of ['abc', 'abcdefghijkl', '507f1f77bcf86cd79943901', 'zzzzzzzzzzzzzzzzzzzzzzzz', '']) assert.equal(parseId(bad), null);
  });
});

describe('authorizeRole middleware', () => {
  const run = (middleware, user) => {
    const result = { nextCalled: false };
    const res = { status(code) { result.status = code; return this; }, json(body) { result.body = body; return this; } };
    middleware({ user }, res, () => { result.nextCalled = true; });
    return result;
  };

  test('calls next() for an allowed role, or any of several', () => {
    assert.equal(run(authorizeRole('admin'), { role: 'admin' }).nextCalled, true);
    assert.equal(run(authorizeRole('admin', 'moderator'), { role: 'moderator' }).nextCalled, true);
  });

  test('answers 403 in the standard format for a role that is not allowed', () => {
    const result = run(authorizeRole('admin'), { role: 'user' });
    assert.equal(result.nextCalled, false);
    assert.equal(result.status, 403);
    assert.equal(result.body.status, 'error');
  });

  test('answers 401 if it runs without authenticateToken before it (no req.user)', () => {
    const result = run(authorizeRole('admin'), undefined);
    assert.equal(result.nextCalled, false);
    assert.equal(result.status, 401);
  });
});

describe('rate limiting (brute-force protection)', () => {
  test('after the limit, further attempts get 429 in the standard format with RateLimit headers', async () => {
    const tiny = express();
    tiny.use(createAuthLimiter({ windowMs: 60_000, limit: 3 }));
    tiny.post('/login', (req, res) => res.status(401).json({ status: 'error', message: 'nope' }));
    const { server, base } = await startServer(tiny);
    try {
      for (let i = 0; i < 3; i++) assert.equal((await call(base, 'POST', '/login')).status, 401);
      const blocked = await call(base, 'POST', '/login');
      assert.equal(blocked.status, 429);
      assert.deepEqual(blocked.json, { status: 'error', message: 'Too many attempts. Please try again later.' });
      assert.ok(blocked.headers.get('ratelimit') || blocked.headers.get('ratelimit-policy'));
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('the real app limits /auth/* but not /api/tasks', async () => {
    await connect();
    const { server, base } = await startServer(app);
    try {
      const login = await call(base, 'POST', '/auth/login', { body: { email: 'nobody@example.com', password: 'x' } });
      assert.ok(login.headers.get('ratelimit') || login.headers.get('ratelimit-policy'), 'login should send RateLimit headers');
      assert.equal((await call(base, 'GET', '/api/tasks')).headers.get('ratelimit'), null);
    } finally {
      await new Promise((resolve) => server.close(resolve));
      await disconnect();
    }
  });
});

describe('security headers (helmet)', () => {
  let server;
  let base;
  before(async () => {
    await connect();
    ({ server, base } = await startServer(app));
  });
  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await mongoose.connection.dropDatabase();
    await disconnect();
  });

  test('responses carry hardening headers and do not advertise Express', async () => {
    const res = await call(base, 'GET', '/nope');
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.ok(res.headers.get('strict-transport-security'));
    assert.equal(res.headers.get('x-powered-by'), null);
  });

  test('an unknown route is a JSON 404 in the standard format', async () => {
    const res = await call(base, 'GET', '/nope');
    assert.equal(res.status, 404);
    assert.deepEqual(res.json, { status: 'error', message: 'Route not found: GET /nope' });
  });
});
