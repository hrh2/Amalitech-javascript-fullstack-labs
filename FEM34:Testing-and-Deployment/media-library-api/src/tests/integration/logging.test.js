// The lab's table of "required logged events" and their levels, checked one by one with spies on the logger.
const logger = require('../../utils/logger');
const { app, request, connect, disconnect, reset, upload, seed, Media, NOT_FOUND_ID } = require('../helpers');

let spies;
beforeAll(connect);
afterAll(disconnect);
beforeEach(async () => {
  await reset();
  spies = { debug: jest.spyOn(logger, 'debug'), info: jest.spyOn(logger, 'info'), warn: jest.spyOn(logger, 'warn'), error: jest.spyOn(logger, 'error') };
});
afterEach(() => Object.values(spies).forEach((spy) => spy.mockRestore()));

const messages = (level) => spies[level].mock.calls.map((call) => call[0]);

describe('logged events', () => {
  test('incoming request: info, with method and url', async () => {
    await request(app).get('/media?page=1');
    expect(spies.info).toHaveBeenCalledWith('Incoming request', { method: 'GET', url: '/media?page=1' });
  });

  test('request completed: debug, with status and duration', async () => {
    await request(app).get('/media');
    const [message, meta] = spies.debug.mock.calls.find((c) => c[0] === 'Request completed');
    expect(message).toBe('Request completed');
    expect(meta).toMatchObject({ method: 'GET', url: '/media', status: 200 });
    expect(typeof meta.durationMs).toBe('number');
  });

  test('file uploaded: info, with the file details', async () => {
    const res = await upload({ title: 'Logo' });
    expect(spies.info).toHaveBeenCalledWith('File uploaded', { id: res.body.data.media.id, originalName: 'logo.png', mimeType: 'image/png', fileSize: res.body.data.media.fileSize });
  });

  test('validation error: warn, with the field-level details', async () => {
    await request(app).get('/media?limit=999');
    expect(spies.warn).toHaveBeenCalledWith('Validation error', expect.objectContaining({ status: 400, details: [{ field: 'limit', message: 'limit can be at most 50' }] }));
    expect(spies.error).not.toHaveBeenCalled();
  });

  test('resource not found: warn (an unknown id and an unknown route)', async () => {
    await request(app).get(`/media/${NOT_FOUND_ID}`);
    await request(app).get('/nowhere');
    expect(messages('warn')).toEqual(['Resource not found', 'Resource not found']);
    expect(spies.error).not.toHaveBeenCalled();
  });

  test('an upload rejected for its file type is a warn, not an error', async () => {
    await upload({ title: 'x' }, { content: Buffer.from('hi'), type: 'text/plain', name: 'a.txt' });
    expect(messages('warn')).toEqual(['Request rejected']);
  });

  test('unhandled global error: error, with the real cause (which the client never sees)', async () => {
    const spy = jest.spyOn(Media, 'find').mockImplementation(() => { throw new Error('database exploded'); });
    const res = await request(app).get('/media');
    spy.mockRestore();
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ status: 'error', message: 'Internal Server Error' });
    expect(spies.error).toHaveBeenCalledWith('Unhandled error', expect.objectContaining({ method: 'GET', url: '/media', error: 'database exploded' }));
  });

  test('the failed request still cleans up its uploaded file', async () => {
    const { uploadedFiles } = require('../helpers');
    const spy = jest.spyOn(Media, 'create').mockRejectedValue(new Error('write failed'));
    const res = await upload({ title: 'x' });
    spy.mockRestore();
    expect(res.status).toBe(500);
    expect(uploadedFiles()).toEqual([]);
  });

  test('a seeded library produces no warnings or errors on a normal listing', async () => {
    await seed([{ title: 'a' }]);
    spies.warn.mockClear();
    await request(app).get('/media');
    expect(spies.warn).not.toHaveBeenCalled();
    expect(spies.error).not.toHaveBeenCalled();
  });
});

describe('log line format', () => {
  test('the log message stays the event name; the cause is in "reason" (winston would merge a "message" field into the line)', async () => {
    await request(app).get(`/media/${NOT_FOUND_ID}`);
    expect(spies.warn).toHaveBeenCalledWith('Resource not found', expect.objectContaining({ status: 404, reason: `Media item ${NOT_FOUND_ID} not found` }));
    expect(spies.warn.mock.calls[0][1]).not.toHaveProperty('message');
  });
});
