// Multer: reads multipart/form-data, checks the file, and saves it to the upload folder (disk storage).
// Folder and size limit come from the environment (UPLOAD_DIR, MAX_FILE_SIZE_MB).
const crypto = require('node:crypto');
const fs = require('node:fs');
const multer = require('multer');
const { env } = require('../config/env');
const { ALLOWED_TYPES } = require('../config/constants');
const AppError = require('../utils/AppError');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });
    cb(null, env.UPLOAD_DIR);
  },
  // A random name + an extension chosen from the checked MIME type: never trust the client's file name.
  filename(req, file, cb) {
    cb(null, `${crypto.randomUUID()}${ALLOWED_TYPES[file.mimetype]}`);
  },
});

function fileFilter(req, file, cb) {
  if (!Object.hasOwn(ALLOWED_TYPES, file.mimetype)) {
    return cb(AppError.badRequest(`Unsupported file type "${file.mimetype}". Allowed: ${Object.keys(ALLOWED_TYPES).join(', ')}`));
  }
  cb(null, true);
}

const upload = multer({ storage, fileFilter, limits: { fileSize: env.MAX_FILE_SIZE_BYTES, files: 1 } });

/** The form field that carries the file is called "file". */
const receiveFile = upload.single('file');

function requireFile(req, res, next) {
  if (!req.file) return next(AppError.badRequest('A file is required (send it in the form field "file")'));
  next();
}

module.exports = { uploadSingleFile: [receiveFile, requireFile] };
