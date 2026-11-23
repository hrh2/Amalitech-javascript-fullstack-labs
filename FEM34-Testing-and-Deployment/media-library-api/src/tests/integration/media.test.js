// End-to-end with Supertest: the real Express app, a real MongoDB TEST database, real multipart uploads, real files on disk.
const fs = require('node:fs');
const path = require('node:path');
const { app, request, Media, connect, disconnect, reset, upload, seed, uploadedFiles, fieldMessage, FILES, PNG, env, NOT_FOUND_ID } = require('../helpers');

beforeAll(connect);
afterAll(disconnect);
beforeEach(reset);

const ID_PATTERN = /^[0-9a-f]{24}$/;
const STORED_PATH = /^[^/]+\/[0-9a-f-]{36}\.(png|jpg|pdf)$/; // "<folder>/<uuid>.<ext>": relative, never the client's file name

describe('POST /media', () => {
  test('201 for a valid upload: metadata stored, file saved', async () => {
    const res = await upload({ title: 'Company logo', tags: 'brand,logo', category: 'design' });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    const media = res.body.data.media;
    expect(media).toMatchObject({ title: 'Company logo', tags: ['brand', 'logo'], category: 'design', originalName: 'logo.png', mimeType: 'image/png', fileSize: PNG.length });
    expect(media.id).toMatch(ID_PATTERN);
    expect(media.filePath).toMatch(STORED_PATH);
    expect(media).not.toHaveProperty('_id');
    expect(media).not.toHaveProperty('__v');
    expect(res.headers.location).toBe(`/media/${media.id}`);
    expect(uploadedFiles()).toEqual([path.basename(media.filePath)]);
    expect(fs.readFileSync(path.join(env.UPLOAD_DIR, path.basename(media.filePath)))).toEqual(PNG);
  });

  test('accepts a PDF and a JPEG', async () => {
    const pdf = await upload({ title: 'Report' }, FILES.pdf);
    const jpeg = await upload({ title: 'Photo' }, FILES.jpeg);
    expect(pdf.status).toBe(201);
    expect(pdf.body.data.media.filePath).toMatch(/\.pdf$/);
    expect(jpeg.status).toBe(201);
    expect(jpeg.body.data.media.filePath).toMatch(/\.jpg$/);
  });

  test('defaults: tags [] and category "other"', async () => {
    const { media } = (await upload({ title: 'Plain' })).body.data;
    expect(media.tags).toEqual([]);
    expect(media.category).toBe('other');
  });

  test('tags can be repeated form fields', async () => {
    expect((await upload({ title: 'T', tags: ['One', 'two'] })).body.data.media.tags).toEqual(['one', 'two']);
  });

  test('the same file name uploaded twice is stored under two different names', async () => {
    const a = (await upload({ title: 'A' })).body.data.media;
    const b = (await upload({ title: 'B' })).body.data.media;
    expect(a.filePath).not.toBe(b.filePath);
    expect(uploadedFiles()).toHaveLength(2);
  });

  test('a hostile file name is kept as text but never used on disk', async () => {
    const res = await upload({ title: 'x' }, { ...FILES.png, name: '../../evil.png' });
    expect(res.body.data.media.filePath).toMatch(STORED_PATH);
    expect(uploadedFiles()).toHaveLength(1);
  });

  test('metadata cannot overwrite the file information', async () => {
    const { media } = (await upload({ title: 'x', filePath: '/etc/passwd', fileSize: '1', mimeType: 'text/html' })).body.data;
    expect(media.filePath).not.toBe('/etc/passwd');
    expect(media.fileSize).toBe(PNG.length);
    expect(media.mimeType).toBe('image/png');
  });

  describe('400 for invalid fields (and no file is left on disk)', () => {
    test.each([
      ['missing title', {}, 'title', 'Title is required'],
      ['blank title', { title: '   ' }, 'title', 'Title is required'],
      ['invalid category', { title: 'x', category: 'memes' }, 'category', 'category must be one of: marketing, product, design, documentation, other'],
      ['too many tags', { title: 'x', tags: Array.from({ length: 11 }, (_, i) => `t${i}`) }, 'tags', 'At most 10 tags'],
    ])('%s', async (name, fields, field, message) => {
      const res = await upload(fields);
      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ status: 'error', message: 'Validation failed' });
      expect(fieldMessage(res, field)).toBe(message);
      expect(uploadedFiles()).toEqual([]);
      expect(await Media.countDocuments()).toBe(0);
    });

    test('reports several problems at once', async () => {
      const res = await upload({ category: 'nope' });
      expect(res.body.details.map((d) => d.field).sort()).toEqual(['category', 'title']);
    });
  });

  describe('400 for invalid files', () => {
    test('no file at all', async () => {
      const res = await upload({ title: 'x' }, null);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('A file is required (send it in the form field "file")');
    });

    test.each([
      ['a text file', FILES.text],
      ['a gif', { content: Buffer.from('GIF89a'), type: 'image/gif', name: 'a.gif' }],
      ['an executable', { content: Buffer.from('MZ'), type: 'application/octet-stream', name: 'a.exe' }],
      ['an svg', { content: Buffer.from('<svg/>'), type: 'image/svg+xml', name: 'a.svg' }],
    ])('unsupported file type: %s', async (name, file) => {
      const res = await upload({ title: 'x' }, file);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/^Unsupported file type ".+"\. Allowed: image\/jpeg, image\/png, application\/pdf$/);
      expect(uploadedFiles()).toEqual([]);
    });

    test('oversized file (limit + 1 byte)', async () => {
      const big = Buffer.alloc(env.MAX_FILE_SIZE_BYTES + 1, 1);
      const res = await upload({ title: 'x' }, { content: big, type: 'image/png', name: 'big.png' });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe(`File too large. The maximum size is ${env.MAX_FILE_SIZE_MB} MB`);
      expect(uploadedFiles()).toEqual([]);
    });

    test('a file of exactly the limit is accepted', async () => {
      const exact = Buffer.alloc(env.MAX_FILE_SIZE_BYTES, 1);
      const res = await upload({ title: 'x' }, { content: exact, type: 'image/png', name: 'exact.png' });
      expect(res.status).toBe(201);
      expect(res.body.data.media.fileSize).toBe(env.MAX_FILE_SIZE_BYTES);
    });

    test('a file sent in the wrong form field', async () => {
      const res = await upload({ title: 'x' }, FILES.png, 'image');
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/form field "file"/);
      expect(uploadedFiles()).toEqual([]);
    });

    test('two files in one request', async () => {
      const res = await request(app)
        .post('/media')
        .field('title', 'x')
        .attach('file', PNG, { filename: 'a.png', contentType: 'image/png' })
        .attach('file', PNG, { filename: 'b.png', contentType: 'image/png' });
      expect(res.status).toBe(400);
      expect(uploadedFiles()).toEqual([]);
    });
  });
});

describe('GET /media', () => {
  test('empty library: success with an empty page and the pagination metadata', async () => {
    const res = await request(app).get('/media');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'success', data: { results: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } } });
  });

  test('default page: newest first, limit 10, pagination metadata', async () => {
    await seed(Array.from({ length: 12 }, (_, i) => ({ title: `Item ${String(i).padStart(2, '0')}` })));
    const res = await request(app).get('/media');
    expect(res.body.data.results).toHaveLength(10);
    expect(res.body.data.pagination).toEqual({ total: 12, page: 1, limit: 10, totalPages: 2 });
    expect(res.body.data.results[0].title).toBe('Item 11');
  });

  test('page 2 holds the rest; a page past the end is empty, not an error', async () => {
    await seed(Array.from({ length: 12 }, (_, i) => ({ title: `Item ${i}` })));
    const p2 = await request(app).get('/media?page=2');
    expect(p2.body.data.results).toHaveLength(2);
    expect(p2.body.data.pagination.page).toBe(2);
    const p9 = await request(app).get('/media?page=9');
    expect(p9.status).toBe(200);
    expect(p9.body.data.results).toEqual([]);
    expect(p9.body.data.pagination.total).toBe(12);
  });

  test('pages never repeat or skip an item', async () => {
    await seed(Array.from({ length: 7 }, (_, i) => ({ title: 'Same', tags: `t${i}` })));
    const ids = [];
    for (const page of [1, 2, 3]) ids.push(...(await request(app).get(`/media?limit=3&page=${page}&sortBy=title`)).body.data.results.map((m) => m.id));
    expect(new Set(ids).size).toBe(7);
  });

  test('limit is respected', async () => {
    await seed([{ title: 'a' }, { title: 'b' }, { title: 'c' }]);
    const res = await request(app).get('/media?limit=2');
    expect(res.body.data.results).toHaveLength(2);
    expect(res.body.data.pagination).toEqual({ total: 3, page: 1, limit: 2, totalPages: 2 });
  });

  test('filters by category', async () => {
    await seed([{ title: 'a', category: 'design' }, { title: 'b', category: 'product' }, { title: 'c', category: 'design' }]);
    const res = await request(app).get('/media?category=design');
    expect(res.body.data.results.map((m) => m.title).sort()).toEqual(['a', 'c']);
    expect(res.body.data.pagination.total).toBe(2);
  });

  test('filters by comma-separated tags (any of them, case-insensitive)', async () => {
    await seed([{ title: 'a', tags: 'x,y' }, { title: 'b', tags: 'z' }, { title: 'c', tags: 'q' }]);
    expect((await request(app).get('/media?tags=y,z')).body.data.results.map((m) => m.title).sort()).toEqual(['a', 'b']);
    expect((await request(app).get('/media?tags=Y')).body.data.results).toHaveLength(1);
  });

  test('search finds matching titles and nothing else', async () => {
    await seed([{ title: 'Annual report 2025' }, { title: 'Team photo' }, { title: 'Quarterly reports' }]);
    const res = await request(app).get('/media?search=report');
    expect(res.body.data.results.map((m) => m.title).sort()).toEqual(['Annual report 2025', 'Quarterly reports']);
    expect(res.body.data.pagination.total).toBe(2);
    expect((await request(app).get('/media?search=zebra')).body.data.results).toEqual([]);
  });

  test('combines category + tags + search', async () => {
    await seed([
      { title: 'Spring campaign', category: 'marketing', tags: 'spring' },
      { title: 'Spring product sheet', category: 'product', tags: 'spring' },
      { title: 'Summer campaign', category: 'marketing', tags: 'summer' },
    ]);
    const res = await request(app).get('/media?category=marketing&tags=spring&search=campaign');
    expect(res.body.data.results.map((m) => m.title)).toEqual(['Spring campaign']);
  });

  test('search text is data, not a regex pattern', async () => {
    await seed([{ title: 'Plain' }]);
    const res = await request(app).get('/media').query({ search: '.*' });
    expect(res.status).toBe(200);
    expect(res.body.data.results).toEqual([]);
  });

  test('sorts by title (asc / desc), by fileSize and by createdAt', async () => {
    await seed([{ title: 'b' }, { title: 'c' }, { title: 'a' }]);
    const titles = async (q) => (await request(app).get(`/media?${q}`)).body.data.results.map((m) => m.title);
    expect(await titles('sortBy=title&order=asc')).toEqual(['a', 'b', 'c']);
    expect(await titles('sortBy=title&order=desc')).toEqual(['c', 'b', 'a']);
    expect(await titles('sortBy=createdAt&order=asc')).toEqual(['b', 'c', 'a']);
    await upload({ title: 'pdf' }, { content: Buffer.alloc(100), type: 'application/pdf', name: 'x.pdf' });
    expect(await titles('sortBy=fileSize&order=desc&limit=1')).toEqual(['pdf']);
  });

  test.each([
    ['page=0', 'page'], ['page=abc', 'page'], ['page=1.5', 'page'], ['page=-3', 'page'],
    ['limit=0', 'limit'], ['limit=51', 'limit'], ['limit=ten', 'limit'],
    ['category=memes', 'category'], ['sortBy=password', 'sortBy'], ['order=sideways', 'order'],
    ['search=', 'search'], ['page=1&page=2', 'page'],
  ])('400 for invalid query ?%s', async (query, field) => {
    const res = await request(app).get(`/media?${query}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation failed');
    expect(fieldMessage(res, field)).toEqual(expect.any(String));
  });

  test('operator-looking parameters (NoSQL injection attempt) are never executed', async () => {
    await seed([{ title: 'a', category: 'design' }, { title: 'b', category: 'product' }]);
    const res = await request(app).get('/media?category[$ne]=design');
    expect(res.status).toBe(200);
    expect(res.body.data.pagination.total).toBe(2);
    expect((await request(app).get('/media?category=design&category=product')).status).toBe(400);
  });

  test('unknown query parameters are ignored', async () => {
    expect((await request(app).get('/media?foo=bar')).status).toBe(200);
  });
});

describe('GET /media/:id', () => {
  test('200 for a valid id', async () => {
    const [media] = await seed([{ title: 'One', tags: 'a' }]);
    const res = await request(app).get(`/media/${media.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'success', data: { media } });
  });

  test('404 for a missing resource', async () => {
    const res = await request(app).get(`/media/${NOT_FOUND_ID}`);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ status: 'error', message: `Media item ${NOT_FOUND_ID} not found` });
  });

  test.each(['123', 'not-an-id', 'z'.repeat(24)])('400 for the malformed id "%s"', async (id) => {
    const res = await request(app).get(`/media/${id}`);
    expect(res.status).toBe(400);
    expect(fieldMessage(res, 'id')).toBe('id must be a valid 24-character id');
  });
});

describe('PUT /media/:id', () => {
  test('200 for a valid update; file information is untouched', async () => {
    const [media] = await seed([{ title: 'Old', tags: 'a', category: 'design' }]);
    const res = await request(app).put(`/media/${media.id}`).send({ title: 'New', tags: ['x', 'Y'], category: 'product' });
    expect(res.status).toBe(200);
    expect(res.body.data.media).toMatchObject({ title: 'New', tags: ['x', 'y'], category: 'product', filePath: media.filePath, originalName: media.originalName, fileSize: media.fileSize });
    expect(res.body.data.media.updatedAt).not.toBe(media.updatedAt);
    expect((await request(app).get(`/media/${media.id}`)).body.data.media).toEqual(res.body.data.media);
  });

  test('one field only leaves the others alone', async () => {
    const [media] = await seed([{ title: 'Keep', tags: 'a', category: 'design' }]);
    const res = await request(app).put(`/media/${media.id}`).send({ category: 'product' });
    expect(res.body.data.media).toMatchObject({ title: 'Keep', tags: ['a'], category: 'product' });
  });

  test('tags can be cleared with []', async () => {
    const [media] = await seed([{ title: 'T', tags: 'a,b' }]);
    expect((await request(app).put(`/media/${media.id}`).send({ tags: [] })).body.data.media.tags).toEqual([]);
  });

  test('cannot change file fields or the id', async () => {
    const [media] = await seed([{ title: 'T' }]);
    const res = await request(app).put(`/media/${media.id}`).send({ title: 'T2', filePath: '/x', mimeType: 'text/html', id: NOT_FOUND_ID });
    expect(res.body.data.media).toMatchObject({ filePath: media.filePath, mimeType: 'image/png', id: media.id });
  });

  test.each([
    ['an empty object', {}, 'body'],
    ['a blank title', { title: '  ' }, 'title'],
    ['an invalid category', { category: 'x' }, 'category'],
    ['tags that are not a list', { tags: 5 }, 'tags'],
    ['a title that is an object', { title: { $ne: 1 } }, 'title'],
  ])('400 for an invalid body: %s', async (name, body, field) => {
    const [media] = await seed([{ title: 'T' }]);
    const res = await request(app).put(`/media/${media.id}`).send(body);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation failed');
    expect(fieldMessage(res, field)).toEqual(expect.any(String));
  });

  test('400 when there is no body at all', async () => {
    const [media] = await seed([{ title: 'T' }]);
    expect((await request(app).put(`/media/${media.id}`)).status).toBe(400);
  });

  test('400 for malformed JSON', async () => {
    const [media] = await seed([{ title: 'T' }]);
    const res = await request(app).put(`/media/${media.id}`).set('Content-Type', 'application/json').send('{"title": ');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Malformed JSON in the request body');
  });

  test('413 for a body over the 10 KB limit', async () => {
    const [media] = await seed([{ title: 'T' }]);
    const res = await request(app).put(`/media/${media.id}`).send({ title: 'x'.repeat(20000) });
    expect(res.status).toBe(413);
  });

  test('404 for an unknown id, 400 for a malformed one', async () => {
    expect((await request(app).put(`/media/${NOT_FOUND_ID}`).send({ title: 'x' })).status).toBe(404);
    expect((await request(app).put('/media/xyz').send({ title: 'x' })).status).toBe(400);
  });
});

describe('DELETE /media/:id', () => {
  test('200: removes the record AND the file', async () => {
    const [media] = await seed([{ title: 'Bye' }]);
    expect(uploadedFiles()).toHaveLength(1);
    const res = await request(app).delete(`/media/${media.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'success', data: { id: media.id } });
    expect((await request(app).get(`/media/${media.id}`)).status).toBe(404);
    expect(uploadedFiles()).toEqual([]);
  });

  test('only that item is deleted', async () => {
    const [a, b] = await seed([{ title: 'A' }, { title: 'B' }]);
    await request(app).delete(`/media/${a.id}`);
    expect(uploadedFiles()).toEqual([path.basename(b.filePath)]);
    expect((await request(app).get(`/media/${b.id}`)).status).toBe(200);
  });

  test('404 when deleting the same item twice', async () => {
    const [media] = await seed([{ title: 'Bye' }]);
    await request(app).delete(`/media/${media.id}`);
    expect((await request(app).delete(`/media/${media.id}`)).status).toBe(404);
  });

  test('still 200 when the file was already removed from disk', async () => {
    const [media] = await seed([{ title: 'Ghost' }]);
    fs.rmSync(path.join(env.UPLOAD_DIR, path.basename(media.filePath)));
    expect((await request(app).delete(`/media/${media.id}`)).status).toBe(200);
  });

  test('a tampered filePath in the database cannot delete files outside the upload folder', async () => {
    const outside = path.join(path.dirname(env.UPLOAD_DIR), `outside-${process.pid}.txt`);
    fs.writeFileSync(outside, 'keep me');
    try {
      const [media] = await seed([{ title: 'Tampered' }]);
      await Media.updateOne({ _id: media.id }, { filePath: `../${path.basename(outside)}` });
      expect((await request(app).delete(`/media/${media.id}`)).status).toBe(200);
      expect(fs.existsSync(outside)).toBe(true);
    } finally {
      fs.rmSync(outside, { force: true });
    }
  });

  test('404 for an unknown id, 400 for a malformed one', async () => {
    expect((await request(app).delete(`/media/${NOT_FOUND_ID}`)).status).toBe(404);
    expect((await request(app).delete('/media/xyz')).status).toBe(400);
  });
});
