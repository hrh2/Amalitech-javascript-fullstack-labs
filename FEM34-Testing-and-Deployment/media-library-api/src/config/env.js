// Environment configuration with START-UP VALIDATION.
//
// dotenv-flow loads, in this order (later files win, real environment variables always win):
//   .env  ->  .env.local  ->  .env.<NODE_ENV>  ->  .env.<NODE_ENV>.local
// so NODE_ENV=development reads .env.development, NODE_ENV=test reads .env.test, NODE_ENV=production reads .env.production.
// (On a host like Vercel there are no files: the variables come from the dashboard.)
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
require('dotenv-flow').config({ path: ROOT, node_env: process.env.NODE_ENV || 'development', silent: true });

const ENVIRONMENTS = ['development', 'test', 'production'];
const LOG_LEVELS = ['debug', 'info', 'warn', 'error'];
const MIN_SECRET_LENGTH = 32;

/**
 * Checks every required variable and returns a clean config object. If anything is wrong it throws ONE error that lists
 * ALL the problems (so you fix them in one go). It never prints the values of secrets.
 * `source` is a parameter so the rules can be unit tested without touching process.env.
 */
function loadEnv(source = process.env) {
  const problems = [];
  const missing = (name) => source[name] === undefined || String(source[name]).trim() === '';
  const need = (name, check) => {
    if (missing(name)) return problems.push(`${name} is missing`);
    const message = check(String(source[name]).trim());
    if (message) problems.push(`${name} ${message}`);
  };

  need('NODE_ENV', (v) => !ENVIRONMENTS.includes(v) && `must be one of: ${ENVIRONMENTS.join(', ')}`);
  need('PORT', (v) => !(/^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 65535) && 'must be a port number between 1 and 65535');
  need('DATABASE_URL', (v) => !/^mongodb(\+srv)?:\/\/.+/.test(v) && 'must be a MongoDB connection string (mongodb:// or mongodb+srv://)');
  need('JWT_SECRET', (v) =>
    (v.length < MIN_SECRET_LENGTH || v.startsWith('replace-me')) && `must be a random string of at least ${MIN_SECRET_LENGTH} characters (not the placeholder from .env.example)`
  );
  need('MAX_FILE_SIZE_MB', (v) => !(/^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 100) && 'must be a whole number of megabytes between 1 and 100');
  need('UPLOAD_DIR', () => null);
  need('LOG_LEVEL', (v) => !LOG_LEVELS.includes(v) && `must be one of: ${LOG_LEVELS.join(', ')}`);

  // Tests delete data. They may only ever run against a database whose name ends in "_test".
  if (!missing('NODE_ENV') && !missing('DATABASE_URL') && String(source.NODE_ENV).trim() === 'test') {
    const dbName = databaseName(source.DATABASE_URL);
    if (!dbName.endsWith('_test')) problems.push('DATABASE_URL must point to a database whose name ends with "_test" when NODE_ENV=test');
  }

  if (problems.length > 0) {
    throw new Error(`Invalid environment configuration:\n${problems.map((p) => `  - ${p}`).join('\n')}\nSee .env.example for the expected variables.`);
  }

  const maxMb = Number(source.MAX_FILE_SIZE_MB);
  return Object.freeze({
    NODE_ENV: source.NODE_ENV.trim(),
    PORT: Number(source.PORT),
    DATABASE_URL: source.DATABASE_URL.trim(),
    JWT_SECRET: source.JWT_SECRET, // reserved for the optional authentication extension; the API does not use it yet
    MAX_FILE_SIZE_MB: maxMb,
    MAX_FILE_SIZE_BYTES: maxMb * 1024 * 1024,
    UPLOAD_DIR: path.resolve(ROOT, source.UPLOAD_DIR.trim()), // absolute; a relative value is relative to the project folder
    LOG_LEVEL: source.LOG_LEVEL.trim(),
  });
}

/** The database name inside a connection string ("" when there is none). Used for checks and for safe logging. */
function databaseName(uri) {
  try {
    return new URL(uri).pathname.slice(1);
  } catch {
    return '';
  }
}

module.exports = { env: loadEnv(), loadEnv, databaseName };
