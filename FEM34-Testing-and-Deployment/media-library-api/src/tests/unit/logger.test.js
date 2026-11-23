const { Writable } = require('node:stream');
const { createLogger, errorFields } = require('../../utils/logger');

/** A logger whose output is collected in memory instead of printed. */
function capture(options) {
  const lines = [];
  const stream = new Writable({ write(chunk, enc, cb) { lines.push(chunk.toString()); cb(); } });
  return { logger: createLogger({ stream, ...options }), lines };
}

describe('logger', () => {
  test('production: one JSON object per line with level, message, timestamp and the extra fields', () => {
    const { logger, lines } = capture({ nodeEnv: 'production', level: 'info' });
    logger.info('Server started', { port: 4000 });
    expect(lines).toHaveLength(1);
    const entry = JSON.parse(lines[0]);
    expect(entry).toMatchObject({ level: 'info', message: 'Server started', port: 4000 });
    expect(new Date(entry.timestamp).toString()).not.toBe('Invalid Date');
  });

  test('development: pretty text, not JSON', () => {
    const { logger, lines } = capture({ nodeEnv: 'development', level: 'info' });
    logger.info('Server started', { port: 4000 });
    expect(() => JSON.parse(lines[0])).toThrow();
    expect(lines[0]).toContain('Server started');
    expect(lines[0]).toContain('{"port":4000}');
  });

  test.each([
    ['debug', ['debug', 'info', 'warn', 'error']],
    ['info', ['info', 'warn', 'error']],
    ['warn', ['warn', 'error']],
    ['error', ['error']],
  ])('LOG_LEVEL=%s shows only %j', (level, shown) => {
    const { logger, lines } = capture({ nodeEnv: 'production', level });
    for (const name of ['debug', 'info', 'warn', 'error']) logger[name](name);
    expect(lines.map((l) => JSON.parse(l).message)).toEqual(shown);
  });

  test('is silent in the test environment unless a stream is given', () => {
    const spy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    createLogger({ nodeEnv: 'test' }).error('should not print');
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  test('errorFields() turns an Error into loggable fields', () => {
    const err = new Error('boom');
    expect(errorFields(err)).toEqual({ error: 'boom', stack: err.stack });
    expect(errorFields('plain')).toEqual({ error: 'plain', stack: undefined });
  });
});
