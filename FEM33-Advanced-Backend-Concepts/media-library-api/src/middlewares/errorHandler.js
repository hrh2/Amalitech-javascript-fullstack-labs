// Centralised error handling: every error in the app ends up here, so every failure has the same JSON shape:
//   { "status": "error", "message": "...", "details": [ { "field", "message" } ] }   (details only when there are any)
const multer = require('multer');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { MAX_FILE_SIZE } = require('../config/constants');
const { removeStoredFile } = require('../utils/fileStorage');

/** Unknown routes become a 404 AppError and flow into the handler below. */
function notFound(req, res, next) {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

/** Turns known library errors into AppErrors, so there is one code path for the response. */
function normalize(err) {
  if (err instanceof AppError) return err;

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return AppError.badRequest(`File too large. The maximum size is ${MAX_FILE_SIZE / 1024 / 1024} MB`);
    if (err.code === 'LIMIT_UNEXPECTED_FILE') return AppError.badRequest('Unexpected file field. Send the file in the form field "file"');
    return AppError.badRequest(err.message);
  }
  if (err.type === 'entity.parse.failed') return AppError.badRequest('Malformed JSON in the request body');
  if (err.type === 'entity.too.large') return new AppError(413, 'Request body too large');
  if (err.name === 'ValidationError') {
    return AppError.badRequest('Validation failed', Object.entries(err.errors).map(([field, e]) => ({ field, message: e.message })));
  }
  if (err.name === 'CastError') return AppError.badRequest(`Invalid value for ${err.path}`);
  return err; // not recognised: a bug, handled as a 500 below
}

// Express knows this is an error handler because it has FOUR parameters. Register it LAST in app.js.
async function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  // If the request failed after the file was saved, the file must not stay behind as an orphan.
  if (req.file) {
    try {
      await removeStoredFile(req.file.filename);
    } catch (cleanupError) {
      logger.error('Could not remove the uploaded file of a failed request', cleanupError);
    }
  }

  const error = normalize(err);
  if (!error.isOperational) {
    logger.error(err); // details go to the server log only, never to the client
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }

  const body = { status: 'error', message: error.message };
  if (error.details) body.details = error.details;
  res.status(error.statusCode).json(body);
}

module.exports = { notFound, errorHandler };
