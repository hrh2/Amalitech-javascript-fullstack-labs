const { connect, disconnect } = require('./setup');
const { test, describe, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const { forEach } = require('./each');
const app = require('../app');
const store = require('../store');

let server;
let base;
let ids; // the ids of the three seed tasks, by title

before(async () => {
  await connect();
  server = app.listen(0); // port 0 = any free port
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://localhost:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await require('mongoose').connection.dropDatabase(); // remove the test database again
  await disconnect();
});

// Every test starts from the same three seed tasks. MongoDB generates fresh ids each time,
// so the tests look them up instead of hard-coding them.
beforeEach(async () => {
  await store.reset();
  const all = await (await fetch(`${base}/tasks`)).json();
  ids = Object.fromEntries(all.map((task) => [task.title, task.id]));
});

const DESIGN = () => ids['Design the API'];
const ROUTES = () => ids['Write the routes'];
const POSTMAN = () => ids['Test with Postman'];
const MISSING = '507f1f77bcf86cd799439011'; // a well-formed ObjectId that no task has

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
  test('returns 200 and the seed tasks, oldest first, as JSON with string ids', async () => {
    const res = await call('GET', '/tasks');
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /^application\/json/);
    assert.deepEqual(res.json.map((t) => t.title), ['Design the API', 'Write the routes', 'Test with Postman']);
    assert.match(res.json[0].id, /^[0-9a-f]{24}$/);
    assert.equal(res.json[0]._id, undefined); // _id and __v are not exposed
    assert.equal(res.json[0].__v, undefined);
  });

  test('each task has createdAt and updatedAt timestamps from Mongoose', async () => {
    const [first] = (await call('GET', '/tasks')).json;
    assert.ok(!Number.isNaN(Date.parse(first.createdAt)));
    assert.ok(!Number.isNaN(Date.parse(first.updatedAt)));
  });

  test('?completed=true and ?completed=false filter in the database', async () => {
    assert.deepEqual((await call('GET', '/tasks?completed=true')).json.map((t) => t.id), [DESIGN()]);
    assert.deepEqual((await call('GET', '/tasks?completed=false')).json.map((t) => t.id), [ROUTES(), POSTMAN()]);
  });

  test('an invalid ?completed value is a 400', async () => {
    assert.equal((await call('GET', '/tasks?completed=maybe')).status, 400);
  });
});

describe('GET /tasks/:id', () => {
  test('returns the task', async () => {
    const res = await call('GET', `/tasks/${ROUTES()}`);
    assert.equal(res.status, 200);
    assert.equal(res.json.title, 'Write the routes');
    assert.equal(res.json.completed, false);
    assert.equal(res.json.id, ROUTES());
  });

  test('a well-formed id that does not exist is a 404', async () => {
    const res = await call('GET', `/tasks/${MISSING}`);
    assert.equal(res.status, 404);
    assert.deepEqual(res.json, { error: `Task ${MISSING} not found` });
  });

  forEach(['abc', '1', '123', 'zzzzzzzzzzzzzzzzzzzzzzzz', 'abcdefghijkl', '507f1f77bcf86cd79943901', '507f1f77bcf86cd7994390111'],
    'a malformed id (%s) is a 400, never a crash or a database error', async (id) => {
      const res = await call('GET', `/tasks/${id}`);
      assert.equal(res.status, 400);
      assert.match(res.json.error, /ObjectId/);
    });
});

describe('POST /tasks', () => {
  test('creates and PERSISTS a task: 201, Location header, and it can be read back', async () => {
    const res = await call('POST', '/tasks', { title: 'Learn Mongoose' });
    assert.equal(res.status, 201);
    assert.equal(res.json.title, 'Learn Mongoose');
    assert.equal(res.json.completed, false);
    assert.equal(res.headers.get('location'), `/tasks/${res.json.id}`);
    const again = await call('GET', `/tasks/${res.json.id}`);
    assert.equal(again.status, 200);
    assert.equal(again.json.title, 'Learn Mongoose');
    assert.equal((await call('GET', '/tasks')).json.length, 4);
  });

  test('trims the title and accepts completed: true', async () => {
    const res = await call('POST', '/tasks', { title: '  Padded  ', completed: true });
    assert.equal(res.json.title, 'Padded');
    assert.equal(res.json.completed, true);
  });

  test('unknown fields, and an id sent by the client, are ignored', async () => {
    const res = await call('POST', '/tasks', { id: MISSING, _id: MISSING, title: 'x', admin: true });
    assert.notEqual(res.json.id, MISSING);
    assert.equal(res.json.admin, undefined);
    const stored = await store.get(res.json.id);
    assert.equal(stored.toObject().admin, undefined); // not stored in MongoDB either
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
    assert.equal((await call('GET', '/tasks')).json.length, 3);
  });

  test('malformed JSON, a form body, no body and an oversized body are all rejected with JSON errors', async () => {
    assert.equal((await call('POST', '/tasks', '{"title": ')).status, 400);
    const form = await fetch(`${base}/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'title=x' });
    assert.equal(form.status, 400);
    assert.equal((await fetch(`${base}/tasks`, { method: 'POST' })).status, 400);
    assert.equal((await call('POST', '/tasks', { title: 'x'.repeat(200 * 1024) })).status, 413);
    assert.equal((await call('GET', '/tasks')).json.length, 3);
  });

  test('a title longer than the schema allows (200) is rejected by the DATABASE layer as a 400', async () => {
    const res = await call('POST', '/tasks', { title: 'x'.repeat(201) });
    assert.equal(res.status, 400);
    assert.equal(res.json.error, 'Validation failed');
    assert.deepEqual(res.json.details, ['title must be at most 200 characters']);
    assert.equal((await call('GET', '/tasks')).json.length, 3);
  });

  test('POST is not idempotent: the same body twice creates two tasks with different ids', async () => {
    const first = await call('POST', '/tasks', { title: 'Same' });
    const second = await call('POST', '/tasks', { title: 'Same' });
    assert.notEqual(first.json.id, second.json.id);
  });
});

describe('PUT /tasks/:id', () => {
  test('replaces the whole task and the change is stored', async () => {
    const res = await call('PUT', `/tasks/${ROUTES()}`, { title: 'Rewrite the routes', completed: true });
    assert.equal(res.status, 200);
    assert.equal(res.json.title, 'Rewrite the routes');
    assert.equal(res.json.completed, true);
    assert.equal((await call('GET', `/tasks/${ROUTES()}`)).json.title, 'Rewrite the routes');
  });

  test('fields left out go back to their defaults', async () => {
    const res = await call('PUT', `/tasks/${DESIGN()}`, { title: 'Only a title' }); // it was completed: true
    assert.equal(res.json.completed, false);
  });

  test('is idempotent: the same PUT twice leaves the same data, and createdAt is kept', async () => {
    const body = { title: 'Same again', completed: true };
    const first = await call('PUT', `/tasks/${ROUTES()}`, body);
    const second = await call('PUT', `/tasks/${ROUTES()}`, body);
    assert.equal(second.status, 200);
    assert.equal(second.json.title, first.json.title);
    assert.equal(second.json.completed, first.json.completed);
    assert.equal(second.json.createdAt, first.json.createdAt);
    assert.equal((await call('GET', '/tasks')).json.length, 3);
  });

  test('updatedAt moves forward when a task changes', async () => {
    const before = (await call('GET', `/tasks/${ROUTES()}`)).json;
    await new Promise((resolve) => setTimeout(resolve, 20));
    const after = (await call('PUT', `/tasks/${ROUTES()}`, { title: 'Changed' })).json;
    assert.ok(Date.parse(after.updatedAt) > Date.parse(before.updatedAt));
    assert.equal(after.createdAt, before.createdAt);
  });

  test('400 for invalid input or id, 404 for a missing task, and a 400 changes nothing stored', async () => {
    assert.equal((await call('PUT', `/tasks/${ROUTES()}`, { completed: true })).status, 400);
    assert.equal((await call('PUT', `/tasks/${MISSING}`, { title: 'x' })).status, 404);
    assert.equal((await call('PUT', '/tasks/abc', { title: 'x' })).status, 400);
    assert.equal((await call('GET', `/tasks/${ROUTES()}`)).json.title, 'Write the routes');
  });
});

describe('PATCH /tasks/:id', () => {
  test('changes only the supplied field', async () => {
    const res = await call('PATCH', `/tasks/${ROUTES()}`, { completed: true });
    assert.equal(res.status, 200);
    assert.equal(res.json.title, 'Write the routes');
    assert.equal(res.json.completed, true);
    assert.equal((await call('GET', `/tasks/${ROUTES()}`)).json.completed, true);
  });

  test('an empty body {} is a 400; invalid fields are a 400; a missing task is a 404', async () => {
    assert.equal((await call('PATCH', `/tasks/${ROUTES()}`, {})).status, 400);
    assert.equal((await call('PATCH', `/tasks/${ROUTES()}`, { title: '' })).status, 400);
    assert.equal((await call('PATCH', `/tasks/${ROUTES()}`, { completed: 'x' })).status, 400);
    assert.equal((await call('PATCH', `/tasks/${MISSING}`, { completed: true })).status, 404);
  });
});

describe('DELETE /tasks/:id', () => {
  test('answers 204 with no body, and the task is gone from the database', async () => {
    const res = await call('DELETE', `/tasks/${POSTMAN()}`);
    assert.equal(res.status, 204);
    assert.equal(res.text, '');
    assert.equal((await call('GET', `/tasks/${POSTMAN()}`)).status, 404);
    assert.equal((await call('GET', '/tasks')).json.length, 2);
  });

  test('a second DELETE is a 404', async () => {
    await call('DELETE', `/tasks/${POSTMAN()}`);
    assert.equal((await call('DELETE', `/tasks/${POSTMAN()}`)).status, 404);
  });
});

describe('errors and unknown routes', () => {
  test('an unknown route is a JSON 404', async () => {
    const res = await call('GET', '/nope');
    assert.equal(res.status, 404);
    assert.deepEqual(res.json, { error: 'Route not found: GET /nope' });
  });

  test('a database failure is a JSON 500 that does not leak the internal message', async (t) => {
    t.mock.method(console, 'error', () => {});
    t.mock.method(store, 'list', async () => {
      throw new Error('connect ECONNREFUSED mongodb://admin:hunter2@db.internal:27017');
    });
    const res = await call('GET', '/tasks');
    assert.equal(res.status, 500);
    assert.deepEqual(res.json, { error: 'Internal Server Error' });
    assert.ok(!res.text.includes('hunter2'));
    assert.equal(console.error.mock.callCount(), 1);
  });

  test('every error path sends JSON, never HTML', async () => {
    const responses = await Promise.all([
      call('GET', '/nope'),
      call('GET', '/tasks/abc'),
      call('POST', '/tasks', '{bad'),
      call('DELETE', `/tasks/${MISSING}`),
    ]);
    for (const res of responses) {
      assert.match(res.headers.get('content-type'), /^application\/json/);
    }
  });
});
