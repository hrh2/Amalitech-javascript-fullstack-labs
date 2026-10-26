const { connect, disconnect, mongoose, startServer, call } = require('./setup');
const { test, describe, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { forEach } = require('./each');
const app = require('../app');
const User = require('../models/User');
const { registerAndLogin } = require('./helpers');

let server;
let base;
let user;
let token;

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
  await User.deleteMany({});
  ({ user, token } = await registerAndLogin(base, 'Amina'));
});

const SECRET = process.env.JWT_SECRET;
const dashboard = (headers) => call(base, 'GET', '/dashboard', { headers });
const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');

describe('GET /dashboard (protected route)', () => {
  test('a valid token gets the user\'s own profile and task count', async () => {
    const res = await call(base, 'GET', '/dashboard', { token });
    assert.equal(res.status, 200);
    assert.equal(res.json.status, 'success');
    assert.equal(res.json.data.message, 'Welcome, Amina');
    assert.deepEqual(res.json.data.user, { id: user.id, name: 'Amina', email: 'amina@example.com', role: 'user' });
    assert.equal(res.json.data.taskCount, 0);
  });

  test('no token: 401 "Access denied. No token provided." with WWW-Authenticate: Bearer', async () => {
    const res = await call(base, 'GET', '/dashboard');
    assert.equal(res.status, 401);
    assert.equal(res.headers.get('www-authenticate'), 'Bearer');
    assert.deepEqual(res.json, { status: 'error', message: 'Access denied. No token provided.' });
  });

  forEach([
    ['the wrong scheme (Basic)', 'Basic YW1pbmE6cGFzcw=='],
    ['a token with no scheme', 'justatoken'],
    ['a scheme with no token', 'Bearer'],
    ['extra parts', 'Bearer a b'],
    ['lower-case "bearer"', 'bearer abc.def.ghi'],
  ], 'a malformed Authorization header (%s) is a 401', async ([, header]) => {
    const res = await dashboard({ Authorization: header });
    assert.equal(res.status, 401);
    assert.equal(res.json.status, 'error');
  });

  test('garbage in place of a token is a 401 "Invalid token.", not a 500', async () => {
    for (const bad of ['abc', 'a.b.c', 'a.b', '....', 'x'.repeat(2000)]) {
      const res = await dashboard({ Authorization: `Bearer ${bad}` });
      assert.equal(res.status, 401, bad.slice(0, 20));
      assert.equal(res.json.message, 'Invalid token.');
    }
  });

  test('a token signed with a DIFFERENT secret is rejected', async () => {
    const forged = jwt.sign({ role: 'user' }, 'some-other-secret-some-other-secret-123', { subject: user.id, algorithm: 'HS256' });
    const res = await dashboard({ Authorization: `Bearer ${forged}` });
    assert.equal(res.status, 401);
    assert.equal(res.json.message, 'Invalid token.');
  });

  test('an EXPIRED token is rejected with its own message: "Token expired. Please log in again."', async () => {
    const expired = jwt.sign({ role: 'user' }, SECRET, { subject: user.id, algorithm: 'HS256', expiresIn: -10 });
    const res = await dashboard({ Authorization: `Bearer ${expired}` });
    assert.equal(res.status, 401);
    assert.deepEqual(res.json, { status: 'error', message: 'Token expired. Please log in again.' });
  });

  test('a token with alg "none" (no signature) is rejected', async () => {
    const unsigned = `${b64url({ alg: 'none', typ: 'JWT' })}.${b64url({ sub: user.id, role: 'admin' })}.`;
    assert.equal((await dashboard({ Authorization: `Bearer ${unsigned}` })).status, 401);
  });

  test('a token signed with another algorithm (HS512) is rejected, because only HS256 is accepted', async () => {
    const hs512 = jwt.sign({ role: 'user' }, SECRET, { subject: user.id, algorithm: 'HS512' });
    assert.equal((await dashboard({ Authorization: `Bearer ${hs512}` })).status, 401);
  });

  test('changing the payload of a real token breaks its signature', async () => {
    const [header, , signature] = token.split('.');
    const tampered = `${header}.${b64url({ sub: user.id, role: 'admin', exp: 9999999999 })}.${signature}`;
    assert.equal((await dashboard({ Authorization: `Bearer ${tampered}` })).status, 401);
  });

  test('a validly signed token without a subject (user id) is rejected', async () => {
    const noSub = jwt.sign({ role: 'user' }, SECRET, { algorithm: 'HS256' });
    assert.equal((await dashboard({ Authorization: `Bearer ${noSub}` })).status, 401);
  });

  test('a valid token for a user that no longer exists is rejected: deleting a user logs them out at once', async () => {
    await User.deleteOne({ _id: user.id });
    assert.equal((await call(base, 'GET', '/dashboard', { token })).status, 401);
  });

  test('the token payload is readable by anyone (encoded, not encrypted), so it holds no secrets', async () => {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    assert.deepEqual(Object.keys(payload).sort(), ['exp', 'iat', 'role', 'sub']);
  });

  test('error responses are JSON and never include the token or the secret', async () => {
    const res = await dashboard({ Authorization: 'Bearer abc.def.ghi' });
    assert.match(res.headers.get('content-type'), /^application\/json/);
    assert.ok(!res.text.includes(SECRET) && !res.text.includes('abc.def.ghi'));
  });
});
