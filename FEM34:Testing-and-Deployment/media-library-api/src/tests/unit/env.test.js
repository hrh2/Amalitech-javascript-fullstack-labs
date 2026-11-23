const { loadEnv, databaseName } = require('../../config/env');

const valid = () => ({
  NODE_ENV: 'development',
  PORT: '4000',
  DATABASE_URL: 'mongodb://127.0.0.1:27017/media_library_dev',
  JWT_SECRET: 'x'.repeat(40),
  MAX_FILE_SIZE_MB: '5',
  UPLOAD_DIR: 'uploads',
  LOG_LEVEL: 'info',
});

describe('loadEnv (start-up validation)', () => {
  test('a complete configuration is converted to the right types', () => {
    const env = loadEnv(valid());
    expect(env).toMatchObject({ NODE_ENV: 'development', PORT: 4000, MAX_FILE_SIZE_MB: 5, MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, LOG_LEVEL: 'info' });
    expect(env.UPLOAD_DIR).toMatch(/^\/.*uploads$/); // made absolute
    expect(Object.isFrozen(env)).toBe(true);
  });

  test('keeps an absolute UPLOAD_DIR as it is (Vercel: /tmp/uploads)', () => {
    expect(loadEnv({ ...valid(), UPLOAD_DIR: '/tmp/uploads' }).UPLOAD_DIR).toBe('/tmp/uploads');
  });

  test.each(['NODE_ENV', 'PORT', 'DATABASE_URL', 'JWT_SECRET', 'MAX_FILE_SIZE_MB', 'UPLOAD_DIR', 'LOG_LEVEL'])('%s missing: throws and names it', (name) => {
    const source = valid();
    delete source[name];
    expect(() => loadEnv(source)).toThrow(`${name} is missing`);
  });

  test('a blank value counts as missing', () => {
    expect(() => loadEnv({ ...valid(), PORT: '   ' })).toThrow('PORT is missing');
  });

  test.each([
    ['NODE_ENV', 'staging', 'NODE_ENV must be one of: development, test, production'],
    ['PORT', 'abc', 'PORT must be a port number'],
    ['PORT', '70000', 'PORT must be a port number'],
    ['DATABASE_URL', 'http://localhost', 'DATABASE_URL must be a MongoDB connection string'],
    ['JWT_SECRET', 'short', 'JWT_SECRET must be a random string of at least 32 characters'],
    ['JWT_SECRET', `replace-me-${'x'.repeat(40)}`, 'JWT_SECRET must be a random string'],
    ['MAX_FILE_SIZE_MB', '0', 'MAX_FILE_SIZE_MB must be a whole number'],
    ['MAX_FILE_SIZE_MB', '5.5', 'MAX_FILE_SIZE_MB must be a whole number'],
    ['LOG_LEVEL', 'verbose', 'LOG_LEVEL must be one of: debug, info, warn, error'],
  ])('%s=%s is rejected', (name, value, message) => {
    expect(() => loadEnv({ ...valid(), [name]: value })).toThrow(message);
  });

  test('ALL problems are reported in one error, and secrets are never printed', () => {
    let message;
    try {
      loadEnv({ NODE_ENV: 'development', JWT_SECRET: 'short-secret-value', LOG_LEVEL: 'loud' });
    } catch (err) {
      message = err.message;
    }
    expect(message).toMatch(/^Invalid environment configuration:/);
    for (const name of ['PORT is missing', 'DATABASE_URL is missing', 'MAX_FILE_SIZE_MB is missing', 'UPLOAD_DIR is missing', 'JWT_SECRET must', 'LOG_LEVEL must']) {
      expect(message).toContain(name);
    }
    expect(message).not.toContain('short-secret-value');
    expect(message).toContain('.env.example');
  });

  describe('tests can never run against a non-test database', () => {
    test('NODE_ENV=test with a normal database is refused', () => {
      expect(() => loadEnv({ ...valid(), NODE_ENV: 'test' })).toThrow('must point to a database whose name ends with "_test"');
    });
    test('NODE_ENV=test with a *_test database is accepted', () => {
      expect(() => loadEnv({ ...valid(), NODE_ENV: 'test', DATABASE_URL: 'mongodb://127.0.0.1/media_library_test' })).not.toThrow();
    });
    test('other environments may use any database name', () => {
      expect(() => loadEnv({ ...valid(), NODE_ENV: 'production' })).not.toThrow();
    });
  });
});

describe('databaseName', () => {
  test.each([
    ['mongodb://127.0.0.1:27017/media_library_dev', 'media_library_dev'],
    ['mongodb+srv://user:pw@cluster.mongodb.net/prod?retryWrites=true', 'prod'],
    ['mongodb://127.0.0.1:27017', ''],
    ['not a url', ''],
  ])('%s -> "%s"', (uri, name) => expect(databaseName(uri)).toBe(name));
});
