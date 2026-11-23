// Loads .env (dotenv) once, before anything else reads process.env. Real environment variables win over the file.
require('dotenv').config({ quiet: true });
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');

// Read when used (getters), so tests can set the variables before the app is loaded.
const env = {
  get PORT() {
    return process.env.PORT || 4000;
  },
  get DB_URI() {
    return process.env.DB_URI || 'mongodb://127.0.0.1:27017/media_library_db';
  },
  get NODE_ENV() {
    return process.env.NODE_ENV || 'development';
  },
  /** Absolute folder where uploaded files are saved. */
  get UPLOAD_DIR() {
    return path.resolve(ROOT, process.env.UPLOAD_DIR || 'uploads');
  },
};

module.exports = { env };
