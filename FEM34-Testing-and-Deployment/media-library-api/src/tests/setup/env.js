// Runs before every test file. Gives the tests a safe, complete environment even when no .env.test file exists
// (a fresh clone, or CI): a TEST database and a temporary upload folder, never development data or the real uploads/.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

process.env.NODE_ENV = 'test';
process.env.PORT ??= '4001';
process.env.DATABASE_URL ??= 'mongodb://127.0.0.1:27017/media_library_test'; // CI sets its own; env.js refuses names not ending in _test
process.env.JWT_SECRET ??= 'test-only-secret-test-only-secret-1234567890';
process.env.MAX_FILE_SIZE_MB ??= '5';
process.env.LOG_LEVEL ??= 'error';
process.env.UPLOAD_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'media-library-test-')); // always a fresh temp folder
