// End-to-end: a real app on a free port, a real MongoDB test database, real multipart uploads and real files on disk.
const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { connect, disconnect, reset, startServer, call, upload, uploadedFiles, PNG, PDF, env } = require('./setup');
const app = require('../src/app');
const { forEach } = require('./each');

let server;
let base;
before(async () => {
  await connect();
  ({ server, base } = await startServer(app));
});
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await disconnect();
});
beforeEach(reset);

const field = (res, name) => res.json.details.find((d) => d.field === name)?.message;
const NOT_FOUND_ID = 'a'.repeat(24);

/** Creates several items through the API. */
async function seed(items) {
  const created = [];
  for (const item of items) {
    const r = await upload(base, item);
    assert.equal(r.status, 201, r.text);
    created.push(r.json.data.media);
  }
  return created;
}

describe('POST /media', () => {
  test('uploads a PNG: 201, metadata stored, file saved', async () => {
    const res = await upload(base, { title: 'Company logo', tags: 'brand,logo', category: 'design' });
    assert.equal(res.status, 201);
    assert.equal(res.json.status, 'success');
    const media = res.json.data.media;
    assert.match(media.id, /^[0-9a-f]{24}$/);
    assert.equal(media.title, 'Company logo');
    assert.deepEqual(media.tags, ['brand', 'logo']);
    assert.equal(media.category, 'design');
    assert.equal(media.originalName, 'logo.png');
    assert.equal(media.mimeType, 'image/png');
    assert.equal(media.fileSize, PNG.length);
    assert.match(media.filePath, /^[^/]+\/[0-9a-f-]{36}\.png$/); // "<folder>/<uuid>.png": relative, not the client's file name
    assert.equal(res.headers.get('location'), `/media/${media.id}`);
    assert.equal('_id' in media, false);
    assert.equal('__v' in media, false);
    assert.deepEqual(uploadedFiles(), [path.basename(media.filePath)]);
    assert.deepEqual(fs.readFileSync(path.join(env.UPLOAD_DIR, path.basename(media.filePath))), PNG);
  });

  test('uploads a PDF and a JPEG', async () => {
    const pdf = await upload(base, { title: 'Report' }, { content: PDF, type: 'application/pdf', name: 'r.pdf' });
    const jpg = await upload(base, { title: 'Photo' }, { content: PNG, type: 'image/jpeg', name: 'p.jpeg' });
    assert.equal(pdf.status, 201);
    assert.match(pdf.json.data.media.filePath, /\.pdf$/);
    assert.equal(jpg.status, 201);
    assert.match(jpg.json.data.media.filePath, /\.jpg$/);
  });

  test('defaults: tags [] and category "other"', async () => {
    const m = (await upload(base, { title: 'Plain' })).json.data.media;
    assert.deepEqual(m.tags, []);
    assert.equal(m.category, 'other');
  });

  test('tags can be repeated form fields', async () => {
    const m = (await upload(base, { title: 'T', tags: ['One', 'two'] })).json.data.media;
    assert.deepEqual(m.tags, ['one', 'two']);
  });

  test('two uploads of the same file name get different stored names', async () => {
    const a = (await upload(base, { title: 'A' })).json.data.media;
    const b = (await upload(base, { title: 'B' })).json.data.media;
    assert.notEqual(a.filePath, b.filePath);
    assert.equal(uploadedFiles().length, 2);
  });

  test('a hostile file name is kept as data but never used on disk', async () => {
    const m = (await upload(base, { title: 'x' }, { content: PNG, type: 'image/png', name: '../../evil.png' })).json.data.media;
    assert.match(m.filePath, /^[^/]+\/[0-9a-f-]{36}\.png$/);
    assert.equal(uploadedFiles().length, 1);
  });

  test('metadata cannot overwrite the file information', async () => {
    const m = (await upload(base, { title: 'x', filePath: '/etc/passwd', fileSize: '1', mimeType: 'text/html' })).json.data.media;
    assert.notEqual(m.filePath, '/etc/passwd');
    assert.equal(m.fileSize, PNG.length);
    assert.equal(m.mimeType, 'image/png');
  });

  describe('validation errors: 400, field-level details, and NO file left on disk', () => {
    forEach(
      [
        ['missing title', {}, 'title', 'Title is required'],
        ['blank title', { title: '   ' }, 'title', 'Title is required'],
        ['invalid category', { title: 'x', category: 'memes' }, 'category', /must be one of/],
        ['too many tags', { title: 'x', tags: Array.from({ length: 11 }, (_, i) => `t${i}`) }, 'tags', 'At most 10 tags'],
      ],
      ([name]) => name,
      async ([, fields, name, message]) => {
        const res = await upload(base, fields);
        assert.equal(res.status, 400);
        assert.equal(res.json.status, 'error');
        assert.equal(res.json.message, 'Validation failed');
        assert.match(field(res, name), message instanceof RegExp ? message : new RegExp(`^${message}$`));
        assert.deepEqual(uploadedFiles(), []);
        assert.equal(await require('../src/models/Media').countDocuments(), 0);
      }
    );

    test('reports several problems at once', async () => {
      const res = await upload(base, { category: 'nope' });
      assert.deepEqual(res.json.details.map((d) => d.field).sort(), ['category', 'title']);
    });
  });

  describe('file errors: 400', () => {
    test('no file', async () => {
      const res = await upload(base, { title: 'x' }, null);
      assert.equal(res.status, 400);
      assert.equal(res.json.message, 'A file is required (send it in the form field "file")');
    });

    forEach(
      [
        ['text file', { content: 'hi', type: 'text/plain', name: 'a.txt' }],
        ['gif image', { content: 'GIF89a', type: 'image/gif', name: 'a.gif' }],
        ['executable', { content: 'MZ', type: 'application/octet-stream', name: 'a.exe' }],
        ['svg', { content: '<svg/>', type: 'image/svg+xml', name: 'a.svg' }],
      ],
      ([name]) => `unsupported type: ${name}`,
      async ([, file]) => {
        const res = await upload(base, { title: 'x' }, file);
        assert.equal(res.status, 400);
        assert.match(res.json.message, /^Unsupported file type ".+"\. Allowed: image\/jpeg, image\/png, application\/pdf$/);
        assert.deepEqual(uploadedFiles(), []);
      }
    );

    test('oversized file (5 MB + 1 byte)', async () => {
      const big = Buffer.alloc(5 * 1024 * 1024 + 1, 1);
      const res = await upload(base, { title: 'x' }, { content: big, type: 'image/png', name: 'big.png' });
      assert.equal(res.status, 400);
      assert.equal(res.json.message, 'File too large. The maximum size is 5 MB');
      assert.deepEqual(uploadedFiles(), []);
    });

    test('a file of exactly 5 MB is accepted', async () => {
      const exact = Buffer.alloc(5 * 1024 * 1024, 1);
      const res = await upload(base, { title: 'x' }, { content: exact, type: 'image/png', name: 'exact.png' });
      assert.equal(res.status, 201);
      assert.equal(res.json.data.media.fileSize, 5 * 1024 * 1024);
    });

    test('file sent in the wrong form field', async () => {
      const res = await upload(base, { title: 'x' }, { content: PNG, type: 'image/png', name: 'a.png' }, 'image');
      assert.equal(res.status, 400);
      assert.match(res.json.message, /form field "file"/);
      assert.deepEqual(uploadedFiles(), []);
    });

    test('two files in one request are rejected', async () => {
      const form = new FormData();
      form.append('title', 'x');
      form.append('file', new Blob([PNG], { type: 'image/png' }), 'a.png');
      form.append('file', new Blob([PNG], { type: 'image/png' }), 'b.png');
      const res = await fetch(`${base}/media`, { method: 'POST', body: form });
      assert.equal(res.status, 400);
      assert.deepEqual(uploadedFiles(), []);
    });
  });
});

describe('GET /media', () => {
  test('empty library: success with an empty page', async () => {
    const res = await call(base, 'GET', '/media');
    assert.equal(res.status, 200);
    assert.deepEqual(res.json, { status: 'success', data: { results: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } } });
  });

  test('default page: newest first, limit 10', async () => {
    await seed(Array.from({ length: 12 }, (_, i) => ({ title: `Item ${String(i).padStart(2, '0')}` })));
    const res = await call(base, 'GET', '/media');
    assert.equal(res.json.data.results.length, 10);
    assert.deepEqual(res.json.data.pagination, { total: 12, page: 1, limit: 10, totalPages: 2 });
    assert.equal(res.json.data.results[0].title, 'Item 11'); // created last = first
  });

  test('page 2 holds the rest; a page past the end is empty, not an error', async () => {
    await seed(Array.from({ length: 12 }, (_, i) => ({ title: `Item ${i}` })));
    const p2 = await call(base, 'GET', '/media?page=2');
    assert.equal(p2.json.data.results.length, 2);
    assert.equal(p2.json.data.pagination.page, 2);
    const p9 = await call(base, 'GET', '/media?page=9');
    assert.equal(p9.status, 200);
    assert.deepEqual(p9.json.data.results, []);
    assert.equal(p9.json.data.pagination.total, 12);
  });

  test('pages never repeat or skip an item', async () => {
    await seed(Array.from({ length: 7 }, (_, i) => ({ title: `Same`, tags: `t${i}` })));
    const ids = [];
    for (const page of [1, 2, 3]) ids.push(...(await call(base, 'GET', `/media?limit=3&page=${page}&sortBy=title`)).json.data.results.map((m) => m.id));
    assert.equal(new Set(ids).size, 7);
  });

  test('limit is respected (1..50)', async () => {
    await seed([{ title: 'a' }, { title: 'b' }, { title: 'c' }]);
    const res = await call(base, 'GET', '/media?limit=2');
    assert.equal(res.json.data.results.length, 2);
    assert.deepEqual(res.json.data.pagination, { total: 3, page: 1, limit: 2, totalPages: 2 });
  });

  test('filters by category', async () => {
    await seed([{ title: 'a', category: 'design' }, { title: 'b', category: 'product' }, { title: 'c', category: 'design' }]);
    const res = await call(base, 'GET', '/media?category=design');
    assert.deepEqual(res.json.data.results.map((m) => m.title).sort(), ['a', 'c']);
    assert.equal(res.json.data.pagination.total, 2);
  });

  test('filters by comma-separated tags (any of them)', async () => {
    await seed([{ title: 'a', tags: 'x,y' }, { title: 'b', tags: 'z' }, { title: 'c', tags: 'q' }]);
    const res = await call(base, 'GET', '/media?tags=y,z');
    assert.deepEqual(res.json.data.results.map((m) => m.title).sort(), ['a', 'b']);
    assert.equal((await call(base, 'GET', '/media?tags=Y')).json.data.results.length, 1); // case-insensitive
  });

  test('searches the title (full-text)', async () => {
    await seed([{ title: 'Annual report 2025' }, { title: 'Team photo' }, { title: 'Quarterly reports' }]);
    const res = await call(base, 'GET', '/media?search=report');
    assert.deepEqual(res.json.data.results.map((m) => m.title).sort(), ['Annual report 2025', 'Quarterly reports']);
    assert.equal(res.json.data.pagination.total, 2);
    assert.equal((await call(base, 'GET', '/media?search=zebra')).json.data.results.length, 0);
  });

  test('combines filters: category + tags + search + paging', async () => {
    await seed([
      { title: 'Spring campaign', category: 'marketing', tags: 'spring' },
      { title: 'Spring product sheet', category: 'product', tags: 'spring' },
      { title: 'Summer campaign', category: 'marketing', tags: 'summer' },
    ]);
    const res = await call(base, 'GET', '/media?category=marketing&tags=spring&search=campaign');
    assert.deepEqual(res.json.data.results.map((m) => m.title), ['Spring campaign']);
  });

  test('a search with regex characters is plain text, not a pattern', async () => {
    await seed([{ title: 'Plain' }]);
    const res = await call(base, 'GET', `/media?search=${encodeURIComponent('.*')}`);
    assert.equal(res.status, 200);
    assert.equal(res.json.data.results.length, 0);
  });

  test('sorts by title asc and desc, and by fileSize', async () => {
    await seed([{ title: 'b' }, { title: 'c' }, { title: 'a' }]);
    const asc = await call(base, 'GET', '/media?sortBy=title&order=asc');
    assert.deepEqual(asc.json.data.results.map((m) => m.title), ['a', 'b', 'c']);
    const desc = await call(base, 'GET', '/media?sortBy=title&order=desc');
    assert.deepEqual(desc.json.data.results.map((m) => m.title), ['c', 'b', 'a']);
    await upload(base, { title: 'pdf' }, { content: Buffer.alloc(100), type: 'application/pdf', name: 'x.pdf' });
    const bySize = await call(base, 'GET', '/media?sortBy=fileSize&order=desc&limit=1');
    assert.equal(bySize.json.data.results[0].title, 'pdf');
  });

  test('oldest first with sortBy=createdAt&order=asc', async () => {
    await seed([{ title: 'first' }, { title: 'second' }]);
    const res = await call(base, 'GET', '/media?sortBy=createdAt&order=asc');
    assert.deepEqual(res.json.data.results.map((m) => m.title), ['first', 'second']);
  });

  describe('invalid query parameters: 400 with the field named', () => {
    forEach(
      [
        ['page=0', 'page'], ['page=abc', 'page'], ['page=1.5', 'page'], ['page=-3', 'page'],
        ['limit=0', 'limit'], ['limit=51', 'limit'], ['limit=ten', 'limit'],
        ['category=memes', 'category'], ['sortBy=password', 'sortBy'], ['order=sideways', 'order'],
        ['search=', 'search'], ['page=1&page=2', 'page'],
      ],
      ([query]) => `?${query}`,
      async ([query, name]) => {
        const res = await call(base, 'GET', `/media?${query}`);
        assert.equal(res.status, 400);
        assert.equal(res.json.message, 'Validation failed');
        assert.ok(field(res, name), JSON.stringify(res.json));
      }
    );
  });

  test('operator-looking parameters (NoSQL injection attempt) are never executed', async () => {
    // Express 5 parses the query as plain text, so "category[$ne]=x" is just an unknown parameter name: ignored.
    await seed([{ title: 'a', category: 'design' }, { title: 'b', category: 'product' }]);
    const res = await call(base, 'GET', '/media?category[$ne]=design');
    assert.equal(res.status, 200);
    assert.equal(res.json.data.pagination.total, 2); // not "everything except design"
    // and a repeated value for a text field is refused outright
    assert.equal((await call(base, 'GET', '/media?category=design&category=product')).status, 400);
  });

  test('unknown query parameters are ignored', async () => {
    assert.equal((await call(base, 'GET', '/media?foo=bar')).status, 200);
  });
});

describe('GET /media/:id', () => {
  test('returns the item', async () => {
    const [m] = await seed([{ title: 'One', tags: 'a' }]);
    const res = await call(base, 'GET', `/media/${m.id}`);
    assert.equal(res.status, 200);
    assert.deepEqual(res.json, { status: 'success', data: { media: m } });
  });

  test('unknown id: 404', async () => {
    const res = await call(base, 'GET', `/media/${NOT_FOUND_ID}`);
    assert.equal(res.status, 404);
    assert.deepEqual(res.json, { status: 'error', message: `Media item ${NOT_FOUND_ID} not found` });
  });

  forEach(['123', 'not-an-id', 'z'.repeat(24)], (id) => `malformed id "${id}": 400`, async (id) => {
    const res = await call(base, 'GET', `/media/${id}`);
    assert.equal(res.status, 400);
    assert.equal(field(res, 'id'), 'id must be a valid 24-character id');
  });
});

describe('PUT /media/:id', () => {
  test('updates title, tags and category; file information is untouched', async () => {
    const [m] = await seed([{ title: 'Old', tags: 'a', category: 'design' }]);
    const res = await call(base, 'PUT', `/media/${m.id}`, { title: 'New', tags: ['x', 'Y'], category: 'product' });
    assert.equal(res.status, 200);
    const updated = res.json.data.media;
    assert.equal(updated.title, 'New');
    assert.deepEqual(updated.tags, ['x', 'y']);
    assert.equal(updated.category, 'product');
    assert.equal(updated.filePath, m.filePath);
    assert.equal(updated.originalName, m.originalName);
    assert.equal(updated.fileSize, m.fileSize);
    assert.notEqual(updated.updatedAt, m.updatedAt);
    assert.deepEqual((await call(base, 'GET', `/media/${m.id}`)).json.data.media, updated);
  });

  test('one field only leaves the others alone', async () => {
    const [m] = await seed([{ title: 'Keep', tags: 'a', category: 'design' }]);
    const res = await call(base, 'PUT', `/media/${m.id}`, { category: 'product' });
    assert.equal(res.json.data.media.title, 'Keep');
    assert.deepEqual(res.json.data.media.tags, ['a']);
  });

  test('tags can be cleared with []', async () => {
    const [m] = await seed([{ title: 'T', tags: 'a,b' }]);
    assert.deepEqual((await call(base, 'PUT', `/media/${m.id}`, { tags: [] })).json.data.media.tags, []);
  });

  test('cannot change file fields or the id', async () => {
    const [m] = await seed([{ title: 'T' }]);
    const res = await call(base, 'PUT', `/media/${m.id}`, { title: 'T2', filePath: '/x', mimeType: 'text/html', id: NOT_FOUND_ID });
    assert.equal(res.json.data.media.filePath, m.filePath);
    assert.equal(res.json.data.media.mimeType, 'image/png');
    assert.equal(res.json.data.media.id, m.id);
  });

  forEach(
    [
      ['empty object', {}, ''],
      ['blank title', { title: '  ' }, 'title'],
      ['invalid category', { category: 'x' }, 'category'],
      ['tags not an array', { tags: 5 }, 'tags'],
      ['title as an object', { title: { $ne: 1 } }, 'title'],
    ],
    ([name]) => `400: ${name}`,
    async ([, body, name]) => {
      const [m] = await seed([{ title: 'T' }]);
      const res = await call(base, 'PUT', `/media/${m.id}`, body);
      assert.equal(res.status, 400);
      assert.equal(res.json.message, 'Validation failed');
      assert.ok(field(res, name || 'body'));
    }
  );

  test('no body at all: 400', async () => {
    const [m] = await seed([{ title: 'T' }]);
    assert.equal((await call(base, 'PUT', `/media/${m.id}`)).status, 400);
  });

  test('malformed JSON: 400', async () => {
    const [m] = await seed([{ title: 'T' }]);
    const res = await call(base, 'PUT', `/media/${m.id}`, '{"title": ');
    assert.equal(res.status, 400);
    assert.equal(res.json.message, 'Malformed JSON in the request body');
  });

  test('unknown id: 404, bad id: 400', async () => {
    assert.equal((await call(base, 'PUT', `/media/${NOT_FOUND_ID}`, { title: 'x' })).status, 404);
    assert.equal((await call(base, 'PUT', '/media/xyz', { title: 'x' })).status, 400);
  });
});

describe('DELETE /media/:id', () => {
  test('removes the record AND the file', async () => {
    const [m] = await seed([{ title: 'Bye' }]);
    assert.equal(uploadedFiles().length, 1);
    const res = await call(base, 'DELETE', `/media/${m.id}`);
    assert.deepEqual(res.json, { status: 'success', data: { id: m.id } });
    assert.equal((await call(base, 'GET', `/media/${m.id}`)).status, 404);
    assert.deepEqual(uploadedFiles(), []);
  });

  test('deleting only touches that item', async () => {
    const [a, b] = await seed([{ title: 'A' }, { title: 'B' }]);
    await call(base, 'DELETE', `/media/${a.id}`);
    assert.deepEqual(uploadedFiles(), [path.basename(b.filePath)]);
    assert.equal((await call(base, 'GET', `/media/${b.id}`)).status, 200);
  });

  test('second delete: 404', async () => {
    const [m] = await seed([{ title: 'Bye' }]);
    await call(base, 'DELETE', `/media/${m.id}`);
    assert.equal((await call(base, 'DELETE', `/media/${m.id}`)).status, 404);
  });

  test('still succeeds when the file was already removed from disk', async () => {
    const [m] = await seed([{ title: 'Ghost' }]);
    fs.rmSync(path.join(env.UPLOAD_DIR, path.basename(m.filePath)));
    assert.equal((await call(base, 'DELETE', `/media/${m.id}`)).status, 200);
  });

  test('a tampered filePath in the database cannot delete files outside the upload folder', async () => {
    const outside = path.join(path.dirname(env.UPLOAD_DIR), `outside-${process.pid}.txt`);
    fs.writeFileSync(outside, 'keep me');
    try {
      const [m] = await seed([{ title: 'Tampered' }]);
      await require('../src/models/Media').updateOne({ _id: m.id }, { filePath: `../${path.basename(outside)}` });
      assert.equal((await call(base, 'DELETE', `/media/${m.id}`)).status, 200);
      assert.ok(fs.existsSync(outside));
    } finally {
      fs.rmSync(outside, { force: true });
    }
  });

  test('bad id: 400, unknown id: 404', async () => {
    assert.equal((await call(base, 'DELETE', '/media/xyz')).status, 400);
    assert.equal((await call(base, 'DELETE', `/media/${NOT_FOUND_ID}`)).status, 404);
  });
});

describe('global error handling', () => {
  test('unknown route: 404 in the standard error shape', async () => {
    const res = await call(base, 'GET', '/nope');
    assert.equal(res.status, 404);
    assert.deepEqual(res.json, { status: 'error', message: 'Route not found: GET /nope' });
  });

  test('wrong method on a known path: 404 (no such route)', async () => {
    assert.equal((await call(base, 'PATCH', '/media')).status, 404);
  });

  test('every error response has status "error" and a message', async () => {
    for (const [method, url] of [['GET', '/media?page=0'], ['GET', '/media/xyz'], ['DELETE', `/media/${NOT_FOUND_ID}`], ['GET', '/x']]) {
      const res = await call(base, method, url);
      assert.equal(res.json.status, 'error', url);
      assert.equal(typeof res.json.message, 'string', url);
      assert.ok(res.headers.get('content-type').includes('application/json'), url);
    }
  });

  test('an unexpected failure is a generic 500 that leaks nothing, and the upload is cleaned up', async () => {
    const Media = require('../src/models/Media');
    const original = Media.create;
    Media.create = async () => { throw new Error('secret database detail'); };
    try {
      const res = await upload(base, { title: 'x' });
      assert.equal(res.status, 500);
      assert.deepEqual(res.json, { status: 'error', message: 'Internal Server Error' });
      assert.ok(!res.text.includes('secret'));
      assert.deepEqual(uploadedFiles(), []);
    } finally {
      Media.create = original;
    }
  });
});
