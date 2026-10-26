// Runs when no route matched.
function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Error-handling middleware: Express recognises it by its FOUR parameters.
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  // The database layer can reject data the API-level validation let through.
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation failed', details: Object.values(err.errors).map((e) => e.message) });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Invalid value for ${err.path}` });
  }

  // body-parser errors carry a 4xx status (400 malformed JSON, 413 body too large, ...).
  const status = err.status ?? err.statusCode ?? 500;

  if (status >= 500) {
    console.error(err); // details (including database errors) go to the server log only
    return res.status(500).json({ error: 'Internal Server Error' });
  }

  const message = err.type === 'entity.parse.failed' ? 'Malformed JSON in the request body' : err.message;
  res.status(status).json({ error: message });
}

module.exports = { notFound, errorHandler };
