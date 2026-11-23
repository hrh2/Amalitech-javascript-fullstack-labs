const { app, request } = require('../helpers');

describe('GET /health', () => {
  test('200 with status, uptime and an ISO timestamp', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptime).toBe('number');
    expect(res.body.uptime).toBeGreaterThan(0);
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
  });

  test('works without a database connection (it only reports that the process is alive)', async () => {
    // These tests never connect to MongoDB in this file, so a 200 proves /health does not depend on it.
    expect((await request(app).get('/health')).status).toBe(200);
  });

  test('is not logged as a request (monitors ping it constantly)', async () => {
    const logger = require('../../utils/logger');
    const spy = jest.spyOn(logger, 'info');
    await request(app).get('/health');
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
