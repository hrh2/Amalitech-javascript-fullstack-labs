const { connect, disconnect, mongoose, startServer, call } = require('./setup');
const { test, describe, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { forEach } = require('./each');
const app = require('../app');
const User = require('../models/User');
const { PASSWORD, registerAndLogin } = require('./helpers');

let server;
let base;

before(async () => {
  await connect();
  await User.init(); // build the unique index before the duplicate tests
  ({ server, base } = await startServer(app));
});
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await mongoose.connection.dropDatabase();
  await disconnect();
});
beforeEach(() => User.deleteMany({}));

const register = (body) => call(base, 'POST', '/auth/register', { body });
const login = (body) => call(base, 'POST', '/auth/login', { body });
const AMINA = { name: 'Amina Yusuf', email: 'amina@example.com', password: PASSWORD };

describe('POST /auth/register', () => {
  test('creates a user: 201, { status: "success" }, the profile, role "user", and NO password or hash', async () => {
    const res = await register(AMINA);
    assert.equal(res.status, 201);
    assert.equal(res.json.status, 'success');
    const { user } = res.json.data;
    assert.equal(user.name, 'Amina Yusuf');
    assert.equal(user.email, 'amina@example.com');
    assert.equal(user.role, 'user');
    assert.match(user.id, /^[0-9a-f]{24}$/);
    assert.ok(!/password|\$2b\$/i.test(res.text), `response leaks credentials: ${res.text}`);
  });

  test('stores a bcrypt HASH in the password field, not the password; the hash is salted and not exposed by normal queries', async () => {
    await register(AMINA);
    await register({ ...AMINA, email: 'bola@example.com' }); // same password, other user

    const raw = await mongoose.connection.collection('users').find().sort({ _id: 1 }).toArray();
    const [a, b] = raw.map((u) => u.password);
    assert.match(a, /^\$2b\$04\$.{53}$/); // bcrypt, cost 4 (test setting), 60 characters
    assert.ok(!a.includes(PASSWORD));
    assert.notEqual(a, b); // same password, different salt, different hash

    assert.equal((await User.findOne({ email: 'amina@example.com' })).password, undefined); // select: false
  });

  test('ignores a "role" sent in the body: nobody can register as an admin (mass assignment)', async () => {
    const res = await register({ ...AMINA, role: 'admin', isAdmin: true });
    assert.equal(res.status, 201);
    assert.equal(res.json.data.user.role, 'user');
    assert.equal((await User.findOne({ email: AMINA.email })).role, 'user');
  });

  test('the email is stored lower-case and trimmed; the same email in other capitals is a 409', async () => {
    const first = await register({ ...AMINA, email: '  Amina@Example.COM ' });
    assert.equal(first.json.data.user.email, 'amina@example.com');
    const dup = await register({ ...AMINA, email: 'AMINA@example.com' });
    assert.equal(dup.status, 409);
    assert.deepEqual(dup.json, { status: 'error', message: 'Email is already registered' });
    assert.equal(await User.countDocuments(), 1);
  });

  forEach([
    ['a missing name', { email: 'a@example.com', password: PASSWORD }],
    ['a blank name', { name: '   ', email: 'a@example.com', password: PASSWORD }],
    ['a name over 100 characters', { name: 'x'.repeat(101), email: 'a@example.com', password: PASSWORD }],
    ['an invalid email', { name: 'A', email: 'not-an-email', password: PASSWORD }],
    ['a missing email', { name: 'A', password: PASSWORD }],
    ['a non-string email', { name: 'A', email: 42, password: PASSWORD }],
    ['a missing password', { name: 'A', email: 'a@example.com' }],
    ['a too-short password', { name: 'A', email: 'a@example.com', password: 'short' }],
    ['a non-string password', { name: 'A', email: 'a@example.com', password: 12345678 }],
    ['a password over bcrypt\'s 72-byte limit', { name: 'A', email: 'a@example.com', password: 'x'.repeat(73) }],
    ['a password over 72 BYTES made of 2-byte characters', { name: 'A', email: 'a@example.com', password: 'é'.repeat(37) }],
  ], '%s is a 400 and creates nothing', async ([, body]) => {
    const res = await register(body);
    assert.equal(res.status, 400);
    assert.equal(res.json.status, 'error');
    assert.equal(res.json.message, 'Validation failed');
    assert.ok(Array.isArray(res.json.errors) && res.json.errors.length > 0);
    assert.equal(await User.countDocuments(), 0);
  });

  test('a missing body and malformed JSON are 400s in the same error format', async () => {
    const none = await call(base, 'POST', '/auth/register');
    assert.equal(none.status, 400);
    assert.equal(none.json.status, 'error');
    const bad = await call(base, 'POST', '/auth/register', { body: '{"name": ' });
    assert.equal(bad.status, 400);
    assert.equal(bad.json.message, 'Malformed JSON in the request body');
  });

  test('a body over 10 kB is refused with 413', async () => {
    assert.equal((await register({ ...AMINA, name: 'x'.repeat(20 * 1024) })).status, 413);
  });
});

describe('POST /auth/login', () => {
  beforeEach(() => register(AMINA));

  test('returns { status: "success" } with a Bearer token, its lifetime and the user, and never the hash', async () => {
    const res = await login({ email: AMINA.email, password: PASSWORD });
    assert.equal(res.status, 200);
    assert.equal(res.json.status, 'success');
    assert.equal(res.json.data.tokenType, 'Bearer');
    assert.equal(res.json.data.expiresIn, '1h');
    assert.equal(res.json.data.user.email, 'amina@example.com');
    assert.ok(!/password|\$2b\$/i.test(res.text));
    assert.match(res.json.data.token, /^[\w-]+\.[\w-]+\.[\w-]+$/); // header.payload.signature
  });

  test('the token carries sub = user id, role, iat and exp (one hour, from JWT_EXPIRES_IN), signed with HS256', async () => {
    const res = await login({ email: AMINA.email, password: PASSWORD });
    const { header, payload } = jwt.decode(res.json.data.token, { complete: true });
    assert.equal(header.alg, 'HS256');
    assert.equal(payload.sub, res.json.data.user.id);
    assert.equal(payload.role, 'user');
    assert.equal(payload.exp - payload.iat, 3600);
    assert.deepEqual(Object.keys(payload).sort(), ['exp', 'iat', 'role', 'sub']); // no password, no email
  });

  test('the email is matched case-insensitively', async () => {
    assert.equal((await login({ email: 'AMINA@Example.com', password: PASSWORD })).status, 200);
  });

  test('a wrong password and an unknown email get the SAME 401 response (no user enumeration)', async () => {
    const wrongPassword = await login({ email: AMINA.email, password: 'not the password' });
    const unknown = await login({ email: 'nobody@example.com', password: PASSWORD });
    assert.equal(wrongPassword.status, 401);
    assert.equal(unknown.status, 401);
    assert.deepEqual(wrongPassword.json, unknown.json);
    assert.deepEqual(wrongPassword.json, { status: 'error', message: 'Invalid email or password' });
  });

  test('the password is case-sensitive', async () => {
    assert.equal((await login({ email: AMINA.email, password: PASSWORD.toUpperCase() })).status, 401);
  });

  test('a bad request body is a 400, and operator objects cannot be used for NoSQL injection', async () => {
    assert.equal((await login({ email: AMINA.email })).status, 400);
    // {"email": {"$ne": null}} would match any user if passed straight to MongoDB
    const inject = await login({ email: { $ne: null }, password: { $ne: null } });
    assert.equal(inject.status, 400);
    assert.equal(inject.json.data, undefined);
  });

  test('a short password still reaches the comparison at login (rules apply at registration only)', async () => {
    assert.equal((await login({ email: AMINA.email, password: 'short' })).status, 401);
  });

  test('JWT_EXPIRES_IN is read from the environment', async () => {
    process.env.JWT_EXPIRES_IN = '15m';
    try {
      const res = await login({ email: AMINA.email, password: PASSWORD });
      const { iat, exp } = jwt.decode(res.json.data.token);
      assert.equal(exp - iat, 900);
      assert.equal(res.json.data.expiresIn, '15m');
    } finally {
      delete process.env.JWT_EXPIRES_IN;
    }
  });
});

describe('end to end: register -> login -> use the token', () => {
  test('the token from /auth/login opens /dashboard', async () => {
    const { token } = await registerAndLogin(base, 'Amina');
    const res = await call(base, 'GET', '/dashboard', { token });
    assert.equal(res.status, 200);
    assert.equal(res.json.data.user.name, 'Amina');
  });
});
