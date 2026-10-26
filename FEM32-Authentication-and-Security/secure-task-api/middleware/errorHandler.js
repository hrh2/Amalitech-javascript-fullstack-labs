const { sendError } = require('../utils/responses');

function notFound(req, res) {
  sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
}

// Error-handling middleware: Express recognises it by its FOUR parameters.
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err.name === 'ValidationError') {
    return sendError(res, 400, 'Validation failed', Object.values(err.errors).map((e) => e.message));
  }
  if (err.name === 'CastError') {
    return sendError(res, 400, `Invalid value for ${err.path}`);
  }
  if (err.code === 11000) {
    return sendError(res, 409, 'That value is already in use');
  }

  const status = err.status ?? err.statusCode ?? 500;
  if (status >= 500) {
    console.error(err); // details go to the server log only
    return sendError(res, 500, 'Internal Server Error');
  }

  sendError(res, status, err.type === 'entity.parse.failed' ? 'Malformed JSON in the request body' : err.message);
}

module.exports = { notFound, errorHandler };
