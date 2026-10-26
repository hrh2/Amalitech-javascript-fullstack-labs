// Loads the .env file into process.env (dotenv), once, before anything else reads it.
// Real environment variables win over .env, so a host can override a value without editing a file.
require('dotenv').config({ quiet: true });

const MIN_SECRET_LENGTH = 32;

// Values are read when used (getters), so tests can set them before the app is loaded.
const env = {
  get PORT() {
    return process.env.PORT || 5000;
  },
  get DB_URI() {
    return process.env.DB_URI || 'mongodb://127.0.0.1:27017/task_tracker_auth_db';
  },
  get JWT_SECRET() {
    const secret = process.env.JWT_SECRET;
    // The placeholder from .env.example is long enough, so it is rejected by name: copying the file unchanged must not work.
    if (!secret || secret.length < MIN_SECRET_LENGTH || secret.startsWith('replace-me')) {
      throw new Error(`JWT_SECRET must be set to a random string of at least ${MIN_SECRET_LENGTH} characters (see .env.example)`);
    }
    return secret;
  },
  get JWT_EXPIRES_IN() {
    return process.env.JWT_EXPIRES_IN || '1h';
  },
  // bcrypt "cost": each +1 doubles the time one hash takes. 12 is a sensible default today.
  get BCRYPT_ROUNDS() {
    return Number(process.env.BCRYPT_ROUNDS) || 12;
  },
  get AUTH_RATE_LIMIT() {
    return { windowMs: 15 * 60 * 1000, limit: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10 };
  },
};

/** Called at start-up so a missing secret stops the server immediately instead of failing on the first login. */
function assertEnv() {
  void env.JWT_SECRET;
}

module.exports = { env, assertEnv };
