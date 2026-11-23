const fs = require('node:fs/promises');
const path = require('node:path');
const { env } = require('../config/env');

/** The path we store and show to clients: "<upload folder name>/<file name>", never an absolute server path. */
function publicPath(fileName) {
  return path.posix.join(path.basename(env.UPLOAD_DIR), fileName);
}

/**
 * Deletes a stored file. Only the file NAME of the stored path is used and it is resolved inside the upload folder,
 * so a tampered database value like "../../etc/passwd" could never delete anything outside it.
 * A file that is already gone is fine (the goal, "no file", is met).
 */
async function removeStoredFile(storedPath) {
  await fs.rm(path.join(env.UPLOAD_DIR, path.basename(storedPath)), { force: true });
}

module.exports = { publicPath, removeStoredFile };
