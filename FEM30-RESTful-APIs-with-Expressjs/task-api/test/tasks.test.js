process.env.NODE_ENV = 'test'; // switches the request logger off (read when app.js is loaded)

const { test, describe, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const { forEach } = require('./each');
const app = require('../app');
const store = require('../models/taskModel');

let server;
let base;

before(async () => {
  // Port 0 = "any free port": the tests never clash with an API you have running.
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://localhost:${server.address().port}`;
});

after(() => new Promise((resolve) => server.close(resolve)));

// Every test starts from the same three seed tasks.
beforeEach(() => store.reset());

async function call(method, path, body, headers = {}) {
  const options = { method, headers };
  if (body !== undefined) {
    options.headers = { 'Content-Type': 'application/json', ...headers };
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  const res = await fetch(`${base}${path}`, options);
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = undefined; }
  return { status: res.status, headers: res.headers, text, json };
}

describe('GET /tasks', () => {
  test('returns 200 and the seed tasks as a JSON array', async () => {
    const res = await call('GET', '/tasks');
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /^application\/json/);
    assert.equal(res.json.length, 3);
    assert.deepEqual(res.json[0], { id: 1, title: 'Design the API', completed: true });
  });

  test('?completed=true and ?completed=false filter the list', async () => {
    assert.deepEqual((await call('GET', '/tasks?completed=true')).json.map((t) => t.id), [1]);
    assert.deepEqual((await call('GET', '/tasks?completed=false')).json.map((t) => t.id), [2, 3]);
  });

  test('an invalid ?completed value is a 400', async () => {
    const res = await call('GET', '/tasks?completed=maybe');
    assert.equal(res.status, 400);
    assert.match(res.json.error, /completed must be/);
  });
});

describe('GET /tasks/:id', () => {
  test('returns the task', async () => {
    const res = await call('GET', '/tasks/2');
    assert.equal(res.status, 200);
    assert.deepEqual(res.json, { id: 2, title: 'Write the routes', completed: false });
  });

  test('a task that does not exist is a 404 with a JSON error', async () => {
    const res = await call('GET', '/tasks/999');
    assert.equal(res.status, 404);
    assert.deepEqual(res.json, { error: 'Task 999 not found' });
  });

  forEach(['abc', '0', '-1', '1.5', '1e3', '%20'], 'a bad id (%s) is a 400, not a 404 or a crash', async (id) => {
    const res = await call('GET', `/tasks/${id}`);
    assert.equal(res.status, 400);
    assert.equal(res.json.error, 'id must be a positive integer');
  });
});

describe('POST /tasks', () => {
  test('creates a task: 201, the new task, and a Location header', async () => {
    const res = await call('POST', '/tasks', { title: 'Learn Express' });
    assert.equal(res.status, 201);
    assert.deepEqual(res.json, { id: 4, title: 'Learn Express', completed: false });
    assert.equal(res.headers.get('location'), '/tasks/4');
    assert.equal((await call('GET', '/tasks/4')).status, 200); // it was really stored
  });

  test('trims the title and accepts completed: true', async () => {
    const res = await call('POST', '/tasks', { title: '  Padded  ', completed: true });
    assert.deepEqual(res.json, { id: 4, title: 'Padded', completed: true });
  });

  test('ignores fields it does not know, and an id sent by the client', async () => {
    const res = await call('POST', '/tasks', { id: 99, title: 'x', admin: true });
    assert.deepEqual(res.json, { id: 4, title: 'x', completed: false });
  });

  forEach([
    ['a missing title', { completed: true }],
    ['a blank title', { title: '   ' }],
    ['a non-string title', { title: 42 }],
    ['a non-boolean completed', { title: 'ok', completed: 'yes' }],
    ['an array instead of an object', [{ title: 'x' }]],
  ], '%s is a 400 and stores nothing', async ([, body]) => {
    const res = await call('POST', '/tasks', JSON.stringify(body));
    assert.equal(res.status, 400);
    assert.equal(res.json.error, 'Validation failed');
    assert.ok(Array.isArray(res.json.details) && res.json.details.length > 0);
    assert.equal((await call('GET', '/tasks')).json.length, 3);
  });

  test('a JSON primitive such as null or 42 is rejected with a 400 by the JSON parser (strict mode)', async () => {
    assert.equal((await call('POST', '/tasks', 'null')).status, 400);
    assert.equal((await call('POST', '/tasks', '42')).status, 400);
  });

  test('malformed JSON is a 400 and the server keeps working', async () => {
    const res = await call('POST', '/tasks', '{"title": ');
    assert.equal(res.status, 400);
    assert.equal(res.json.error, 'Malformed JSON in the request body');
    assert.equal((await call('GET', '/tasks')).status, 200);
  });

  test('a non-JSON body (form data) is a 400, not a crash: Express 5 leaves req.body undefined', async () => {
    const res = await fetch(`${base}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'title=oops',
    });
    assert.equal(res.status, 400);
    assert.deepEqual((await res.json()).details, ['Request body must be a JSON object']);
  });

  test('a request with no body at all is a 400', async () => {
    const res = await fetch(`${base}/tasks`, { method: 'POST' });
    assert.equal(res.status, 400);
  });

  test('a body over the size limit is a 413 JSON error', async () => {
    const res = await call('POST', '/tasks', { title: 'x'.repeat(200 * 1024) });
    assert.equal(res.status, 413);
    assert.ok(res.json.error);
  });

  test('POST is not idempotent: sending the same body twice creates two tasks', async () => {
    const first = await call('POST', '/tasks', { title: 'Same' });
    const second = await call('POST', '/tasks', { title: 'Same' });
    assert.notEqual(first.json.id, second.json.id);
  });
});

describe('PUT /tasks/:id', () => {
  test('replaces the whole task', async () => {
    const res = await call('PUT', '/tasks/2', { title: 'Rewrite the routes', completed: true });
    assert.equal(res.status, 200);
    assert.deepEqual(res.json, { id: 2, title: 'Rewrite the routes', completed: true });
  });

  test('fields left out go back to their defaults (that is what "replace" means)', async () => {
    const res = await call('PUT', '/tasks/1', { title: 'Only a title' }); // task 1 was completed: true
    assert.equal(res.json.completed, false);
  });

  test('is idempotent: repeating the same PUT gives the same result and the same state', async () => {
    const body = { title: 'Same again', completed: true };
    const first = await call('PUT', '/tasks/2', body);
    const second = await call('PUT', '/tasks/2', body);
    assert.equal(second.status, 200);
    assert.deepEqual(second.json, first.json);
    assert.equal((await call('GET', '/tasks')).json.length, 3);
  });

  test('requires a title (400) and an existing task (404), and does not change the stored task on 400', async () => {
    assert.equal((await call('PUT', '/tasks/2', { completed: true })).status, 400);
    assert.equal((await call('PUT', '/tasks/999', { title: 'x' })).status, 404);
    assert.equal((await call('PUT', '/tasks/abc', { title: 'x' })).status, 400);
    assert.equal((await call('GET', '/tasks/2')).json.title, 'Write the routes');
  });

  test('cannot change the id', async () => {
    const res = await call('PUT', '/tasks/2', { id: 50, title: 'x' });
    assert.equal(res.json.id, 2);
  });
});

describe('PATCH /tasks/:id', () => {
  test('changes only the supplied field', async () => {
    const res = await call('PATCH', '/tasks/2', { completed: true });
    assert.equal(res.status, 200);
    assert.deepEqual(res.json, { id: 2, title: 'Write the routes', completed: true });
  });

  test('can change just the title', async () => {
    assert.equal((await call('PATCH', '/tasks/2', { title: 'New' })).json.title, 'New');
  });

  test('an empty body {} is a 400', async () => {
    const res = await call('PATCH', '/tasks/2', {});
    assert.equal(res.status, 400);
    assert.deepEqual(res.json.details, ['Provide at least one of: title, completed']);
  });

  test('validates supplied fields, and a missing task is 404', async () => {
    assert.equal((await call('PATCH', '/tasks/2', { title: '' })).status, 400);
    assert.equal((await call('PATCH', '/tasks/2', { completed: 'x' })).status, 400);
    assert.equal((await call('PATCH', '/tasks/999', { completed: true })).status, 404);
  });
});

describe('DELETE /tasks/:id', () => {
  test('answers 204 with no body, and the task is gone', async () => {
    const res = await call('DELETE', '/tasks/3');
    assert.equal(res.status, 204);
    assert.equal(res.text, '');
    assert.equal((await call('GET', '/tasks/3')).status, 404);
    assert.equal((await call('GET', '/tasks')).json.length, 2);
  });

  test('a second DELETE is a 404 (the end state is the same, the response is not)', async () => {
    await call('DELETE', '/tasks/3');
    assert.equal((await call('DELETE', '/tasks/3')).status, 404);
  });

  test('ids are never reused after a delete', async () => {
    await call('DELETE', '/tasks/3');
    const res = await call('POST', '/tasks', { title: 'New' });
    assert.equal(res.json.id, 4);
  });
});

describe('errors and unknown routes', () => {
  test('an unknown route is a JSON 404 that names the route', async () => {
    const res = await call('GET', '/nope');
    assert.equal(res.status, 404);
    assert.match(res.headers.get('content-type'), /^application\/json/);
    assert.deepEqual(res.json, { error: 'Route not found: GET /nope' });
  });

  test('an unsupported method on a known path is a JSON 404', async () => {
    const res = await call('PUT', '/tasks', { title: 'x' });
    assert.equal(res.status, 404);
    assert.ok(res.json.error);
  });

  test('an unexpected failure is a JSON 500 that does not leak the internal message', async (t) => {
    t.mock.method(console, 'error', () => {}); // the handler logs the real error; keep the test output clean
    t.mock.method(store, 'list', () => {
      throw new Error('secret database password is hunter2');
    });
    const res = await call('GET', '/tasks');
    assert.equal(res.status, 500);
    assert.deepEqual(res.json, { error: 'Internal Server Error' });
    assert.ok(!res.text.includes('hunter2'));
    assert.equal(console.error.mock.callCount(), 1); // but it was logged for the developer
  });

  test('no response is ever HTML: every error path sends JSON', async () => {
    const requests = [
      call('GET', '/nope'),
      call('GET', '/tasks/abc'),
      call('POST', '/tasks', '{bad'),
      call('DELETE', '/tasks/999'),
    ];
    for (const res of await Promise.all(requests)) {
      assert.match(res.headers.get('content-type'), /^application\/json/);
    }
  });
});
