const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createAppServer } = require('./server');

let server;
let base;

before(async () => {
  server = createAppServer();
  // Port 0 = "any free port", so the tests never clash with a server you have running.
  await new Promise((resolve) => server.listen(0, resolve));
  base = `http://localhost:${server.address().port}`;
});

after(() => new Promise((resolve) => server.close(resolve)));

test('GET / answers 200 with the greeting as plain text', async () => {
  const res = await fetch(`${base}/`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /^text\/plain/);
  assert.equal(await res.text(), 'Hello, this is my first Node.js server!');
});

test('GET /api/health answers 200 {"status":"ok"} as JSON', async () => {
  const res = await fetch(`${base}/api/health`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /^application\/json/);
  assert.deepEqual(await res.json(), { status: 'ok' });
});

test('GET /api/greet?name=Amina greets by name', async () => {
  const res = await fetch(`${base}/api/greet?name=Amina`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { message: 'Hello, Amina!' });
});

test('GET /api/greet without a name greets "stranger"', async () => {
  const res = await fetch(`${base}/api/greet`);
  assert.deepEqual(await res.json(), { message: 'Hello, stranger!' });
});

test('an empty or blank name also falls back to "stranger"', async () => {
  for (const query of ['?name=', '?name=%20%20']) {
    const res = await fetch(`${base}/api/greet${query}`);
    assert.deepEqual(await res.json(), { message: 'Hello, stranger!' });
  }
});

test('names with spaces and special characters are decoded and returned as safe JSON', async () => {
  const res = await fetch(`${base}/api/greet?name=${encodeURIComponent('Ana "the" <b>Dev</b>')}`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { message: 'Hello, Ana "the" <b>Dev</b>!' });
});

test('an unknown path answers 404 with a JSON error that names the path', async () => {
  const res = await fetch(`${base}/does-not-exist`);
  assert.equal(res.status, 404);
  assert.match(res.headers.get('content-type'), /^application\/json/);
  assert.deepEqual(await res.json(), { error: 'Not found', path: '/does-not-exist' });
});

test('the query string is not part of the route: /api/health?x=1 still matches', async () => {
  const res = await fetch(`${base}/api/health?x=1`);
  assert.equal(res.status, 200);
});

test('a known path with the wrong method answers 405 and an Allow header', async () => {
  const res = await fetch(`${base}/api/health`, { method: 'POST' });
  assert.equal(res.status, 405);
  assert.equal(res.headers.get('allow'), 'GET');
  assert.deepEqual(await res.json(), { error: 'Method not allowed' });
});

test('a request target that cannot be parsed answers 400 instead of crashing the server', async () => {
  const net = require('node:net');
  const port = server.address().port;
  const reply = await new Promise((resolve) => {
    const socket = net.connect(port, 'localhost', () => socket.write('GET // HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n'));
    let data = '';
    socket.on('data', (chunk) => (data += chunk));
    socket.on('end', () => resolve(data));
  });
  assert.match(reply, /^HTTP\/1\.1 400/);
  // and the server is still alive afterwards
  assert.equal((await fetch(`${base}/api/health`)).status, 200);
});

test('GET /api/stats counts the requests handled so far', async () => {
  const first = await (await fetch(`${base}/api/stats`)).json();
  await fetch(`${base}/`);
  await fetch(`${base}/`);
  const second = await (await fetch(`${base}/api/stats`)).json();
  // two greetings plus this stats call itself
  assert.equal(second.requestsHandled - first.requestsHandled, 3);
});

test('every response is finished (no hanging request) on every path', async () => {
  const paths = ['/', '/api/health', '/api/greet', '/api/stats', '/nope', '/a/b/c?x=1'];
  const results = await Promise.all(paths.map((p) => fetch(`${base}${p}`, { signal: AbortSignal.timeout(2000) })));
  results.forEach((res) => assert.ok(res.status === 200 || res.status === 404));
});
