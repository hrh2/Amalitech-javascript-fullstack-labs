// Pieces that need neither a server nor a database.
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
require('./setup');
const AppError = require('../src/utils/AppError');
const catchAsync = require('../src/utils/catchAsync');
const validate = require('../src/middlewares/validate');
const { createMediaService } = require('../src/services/mediaService');
const { registerProcessHandlers, createShutdown } = require('../src/utils/processHandlers');
const { createMediaBody, updateMediaBody, mediaIdParams, listMediaQuery } = require('../src/validators/mediaSchemas');
const { forEach } = require('./each');

const fields = (schema, input) => {
  const r = schema.safeParse(input);
  return r.success ? { ok: r.data } : { errors: r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) };
};

describe('AppError', () => {
  test('carries status, message, details and is operational', () => {
    const e = AppError.badRequest('Validation failed', [{ field: 'title', message: 'x' }]);
    assert.equal(e.statusCode, 400);
    assert.equal(e.isOperational, true);
    assert.deepEqual(e.details, [{ field: 'title', message: 'x' }]);
    assert.ok(e instanceof Error);
    assert.equal(AppError.notFound('nope').statusCode, 404);
  });
});

describe('catchAsync', () => {
  test('passes a rejection to next() instead of leaving it unhandled', async () => {
    const boom = new Error('boom');
    let received;
    await catchAsync(async () => { throw boom; })({}, {}, (err) => { received = err; });
    assert.equal(received, boom);
  });

  test('does not call next() when the handler succeeds', async () => {
    let called = false;
    await catchAsync(async () => {})({}, {}, () => { called = true; });
    assert.equal(called, false);
  });
});

describe('createMediaBody', () => {
  test('title only: tags default to [] and category to "other"', () => {
    assert.deepEqual(fields(createMediaBody, { title: '  Logo  ' }).ok, { title: 'Logo', tags: [], category: 'other' });
  });

  forEach(
    [
      ['a,b', ['a', 'b']],
      [' Red , Blue ,, ', ['red', 'blue']],
      [['x', 'Y'], ['x', 'y']],
      [['a,b', 'c'], ['a', 'b', 'c']],
      ['', []],
    ],
    ([input, expected]) => `tags ${JSON.stringify(input)} -> ${JSON.stringify(expected)}`,
    ([input, expected]) => assert.deepEqual(fields(createMediaBody, { title: 't', tags: input }).ok.tags, expected)
  );

  forEach(
    [
      [{}, 'title: Title is required'],
      [{ title: '' }, 'title: Title is required'],
      [{ title: '   ' }, 'title: Title is required'],
      [{ title: 5 }, 'title: Title is required'],
      [{ title: 'a'.repeat(201) }, 'title: Title can be at most 200 characters'],
      [{ title: 't', category: 'memes' }, 'category: category must be one of: marketing, product, design, documentation, other'],
      [{ title: 't', tags: 7 }, 'tags: tags must be an array of text values'],
      [{ title: 't', tags: Array.from({ length: 11 }, (_, i) => `t${i}`) }, 'tags: At most 10 tags'],
      [{ title: 't', tags: ['a'.repeat(31)] }, 'tags.0: A tag can be at most 30 characters'],
    ],
    ([input]) => `rejects ${JSON.stringify(input).slice(0, 50)}`,
    ([input, message]) => assert.ok(fields(createMediaBody, input).errors.includes(message), JSON.stringify(fields(createMediaBody, input))),
  );

  test('ignores fields the client must not set (filePath, id...)', () => {
    const r = fields(createMediaBody, { title: 't', filePath: '/etc/passwd', id: 'x' }).ok;
    assert.deepEqual(Object.keys(r).sort(), ['category', 'tags', 'title']);
  });
});

describe('updateMediaBody', () => {
  test('accepts one field', () => assert.deepEqual(fields(updateMediaBody, { category: 'design' }).ok, { category: 'design' }));
  test('rejects an empty body', () => assert.deepEqual(fields(updateMediaBody, {}).errors, [': Send at least one of: title, tags, category']));
  test('a missing tags field is NOT turned into an empty list', () => assert.equal('tags' in fields(updateMediaBody, { title: 'x' }).ok, false));
});

describe('mediaIdParams', () => {
  test('accepts a 24-hex id', () => assert.ok(fields(mediaIdParams, { id: 'a'.repeat(24) }).ok));
  forEach(['', '123', 'z'.repeat(24), 'a'.repeat(25), '1234567890ab'], (id) => `rejects "${id}"`, (id) => assert.ok(fields(mediaIdParams, { id }).errors));
});

describe('listMediaQuery', () => {
  test('defaults', () => {
    assert.deepEqual(fields(listMediaQuery, {}).ok, { page: 1, limit: 10, sortBy: 'createdAt', order: 'desc' });
  });

  test('converts text to numbers and splits tags', () => {
    const r = fields(listMediaQuery, { page: '2', limit: '50', tags: 'a,b', category: 'design', search: ' hello ', sortBy: 'title', order: 'asc' }).ok;
    assert.deepEqual(r, { page: 2, limit: 50, tags: ['a', 'b'], category: 'design', search: 'hello', sortBy: 'title', order: 'asc' });
  });

  forEach(
    [
      [{ page: '0' }, 'page: page must be at least 1'],
      [{ page: '-1' }, 'page: page must be at least 1'],
      [{ page: 'abc' }, 'page: page must be a number'],
      [{ page: '1.5' }, 'page: page must be a whole number'],
      [{ limit: '51' }, 'limit: limit can be at most 50'],
      [{ limit: '0' }, 'limit: limit must be at least 1'],
      [{ category: 'x' }, 'category: category must be one of: marketing, product, design, documentation, other'],
      [{ sortBy: 'password' }, 'sortBy: sortBy must be one of: createdAt, title, fileSize, category'],
      [{ order: 'up' }, 'order: order must be asc or desc'],
      [{ search: '   ' }, 'search: search cannot be empty'],
      [{ page: ['1', '2'] }, 'page: page must be a number'],
    ],
    ([input]) => `rejects ${JSON.stringify(input)}`,
    ([input, message]) => assert.ok(fields(listMediaQuery, input).errors.includes(message), JSON.stringify(fields(listMediaQuery, input)))
  );
});

describe('validate middleware', () => {
  test('puts clean values on req.validated and calls next()', () => {
    const req = { body: { title: ' x ' }, query: {}, params: { id: 'a'.repeat(24) } };
    let err = 'unset';
    validate({ body: createMediaBody, params: mediaIdParams })(req, {}, (e) => { err = e; });
    assert.equal(err, undefined);
    assert.equal(req.validated.body.title, 'x');
    assert.equal(req.validated.params.id, 'a'.repeat(24));
  });

  test('collects problems from several parts into one AppError', () => {
    const req = { body: {}, params: { id: 'bad' } };
    let err;
    validate({ params: mediaIdParams, body: createMediaBody })(req, {}, (e) => { err = e; });
    assert.equal(err.statusCode, 400);
    assert.equal(err.message, 'Validation failed');
    assert.deepEqual(err.details.map((d) => d.field).sort(), ['id', 'title']);
  });

  test('treats an undefined body (Express 5, no body sent) as {}', () => {
    let err;
    validate({ body: createMediaBody })({ body: undefined }, {}, (e) => { err = e; });
    assert.deepEqual(err.details, [{ field: 'title', message: 'Title is required' }]);
  });
});

describe('mediaService.list (no database)', () => {
  const makeService = (repository) => createMediaService({ repository, storage: {} });

  test('does the page query and the count at the same time (Promise.all)', async () => {
    const events = [];
    const repository = {
      find: async () => { events.push('find started'); await new Promise((r) => setTimeout(r, 20)); events.push('find done'); return ['a']; },
      count: async () => { events.push('count started'); await new Promise((r) => setTimeout(r, 20)); events.push('count done'); return 1; },
    };
    await makeService(repository).list({ page: 1, limit: 10, sortBy: 'createdAt', order: 'desc' });
    // both started before either finished = they ran concurrently
    assert.deepEqual(events.slice(0, 2), ['find started', 'count started']);
  });

  test('computes skip and totalPages', async () => {
    let args;
    const repository = { find: async (c, o) => { args = o; return []; }, count: async () => 84 };
    const r = await makeService(repository).list({ page: 2, limit: 10, sortBy: 'title', order: 'asc' });
    assert.deepEqual(args, { sort: { title: 1 }, skip: 10, limit: 10 });
    assert.deepEqual(r.pagination, { total: 84, page: 2, limit: 10, totalPages: 9 });
  });

  test('totalPages is 0 when nothing matches', async () => {
    const r = await makeService({ find: async () => [], count: async () => 0 }).list({ page: 1, limit: 10, sortBy: 'createdAt', order: 'desc' });
    assert.equal(r.pagination.totalPages, 0);
  });

  test('passes only the filter fields to the repository', async () => {
    let criteria;
    const repository = { find: async (c) => { criteria = c; return []; }, count: async () => 0 };
    await makeService(repository).list({ page: 1, limit: 10, sortBy: 'createdAt', order: 'desc', category: 'design', search: 'x' });
    assert.deepEqual(criteria, { category: 'design', search: 'x' });
  });

  test('remove(): a missing record is a 404 and no file is touched', async () => {
    let removed = false;
    const service = createMediaService({ repository: { deleteById: async () => null }, storage: { removeStoredFile: async () => { removed = true; } } });
    await assert.rejects(() => service.remove('x'), (e) => e.statusCode === 404);
    assert.equal(removed, false);
  });
});

describe('process handlers', () => {
  test('an unhandled rejection and an uncaught exception both trigger shutdown(1)', () => {
    const proc = new EventEmitter();
    const codes = [];
    registerProcessHandlers({ proc, shutdown: (c) => codes.push(c) });
    proc.emit('unhandledRejection', new Error('x'));
    proc.emit('uncaughtException', new Error('y'));
    assert.deepEqual(codes, [1, 1]);
  });

  test('SIGTERM and SIGINT shut down with code 0', () => {
    const proc = new EventEmitter();
    const codes = [];
    registerProcessHandlers({ proc, shutdown: (c) => codes.push(c) });
    proc.emit('SIGTERM');
    proc.emit('SIGINT');
    assert.deepEqual(codes, [0, 0]);
  });

  test('createShutdown closes the server, then the database, then exits once', async () => {
    const order = [];
    const server = { close: (cb) => { order.push('server closed'); cb(); } };
    const shutdown = createShutdown({
      getServer: () => server,
      disconnect: async () => order.push('db closed'),
      exit: (code) => order.push(`exit ${code}`),
    });
    await shutdown(1);
    await shutdown(1); // a second signal must not run it again
    assert.deepEqual(order, ['server closed', 'db closed', 'exit 1']);
  });

  test('createShutdown exits with 1 when closing fails', async () => {
    const exits = [];
    const shutdown = createShutdown({ getServer: () => null, disconnect: async () => { throw new Error('x'); }, exit: (c) => exits.push(c) });
    await shutdown(0);
    assert.deepEqual(exits, [1]);
  });
});
