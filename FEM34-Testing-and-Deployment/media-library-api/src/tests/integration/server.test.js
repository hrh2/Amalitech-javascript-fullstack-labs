// Starts the REAL server.js as a separate process, the way `npm start` or a host would.
const { spawn } = require('node:child_process');
const path = require('node:path');

const SERVER = path.resolve(__dirname, '../../../server.js');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Starts server.js. `finished` resolves with { code, out } when the process exits. */
function start(env) {
  const child = spawn(process.execPath, [SERVER], { env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  child.stdout.on('data', (chunk) => { out += chunk; });
  child.stderr.on('data', (chunk) => { out += chunk; });
  const finished = new Promise((resolve) => child.on('exit', (code) => resolve({ code, out })));
  return { child, finished };
}

/** Polls GET /health until the server answers (it is up), or gives up after ~10 s. */
async function healthWhenUp(port) {
  for (let i = 0; i < 100; i++) {
    try {
      return await fetch(`http://localhost:${port}/health`);
    } catch {
      await wait(100);
    }
  }
  throw new Error('the server did not start in time');
}

const randomPort = () => String(41000 + Math.floor(Math.random() * 2000));

describe('server.js', () => {
  test('refuses to start with missing variables and says which ones (exit code 1)', async () => {
    const { code, out } = await start({ PORT: '', MAX_FILE_SIZE_MB: '', LOG_LEVEL: 'loud' }).finished;
    expect(code).toBe(1);
    expect(out).toContain('Invalid environment configuration');
    expect(out).toContain('PORT is missing');
    expect(out).toContain('MAX_FILE_SIZE_MB is missing');
    expect(out).toContain('LOG_LEVEL must be one of: debug, info, warn, error');
  });

  test('refuses to run tests against a non-test database', async () => {
    const { code, out } = await start({ NODE_ENV: 'test', DATABASE_URL: 'mongodb://127.0.0.1:27017/media_library_dev' }).finished;
    expect(code).toBe(1);
    expect(out).toContain('whose name ends with "_test"');
  });

  test('production: logs "Server started" as JSON, serves /health, and stops cleanly on SIGTERM (exit 0)', async () => {
    const port = randomPort();
    const { child, finished } = start({ NODE_ENV: 'production', PORT: port, LOG_LEVEL: 'info' });
    const res = await healthWhenUp(port);
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe('ok');

    child.kill('SIGTERM');
    const { code, out } = await finished;
    expect(code).toBe(0);
    const line = out.split('\n').find((l) => l.includes('Server started'));
    expect(JSON.parse(line)).toMatchObject({ level: 'info', message: 'Server started', port: Number(port), environment: 'production' });
  });
});
