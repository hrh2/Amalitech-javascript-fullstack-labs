const logger = require('../utils/logger');

// "Incoming request" (info) when it arrives; "Request completed" (debug) with the status and how long it took.
function requestLogger(req, res, next) {
  const startedAt = process.hrtime.bigint();
  logger.info('Incoming request', { method: req.method, url: req.originalUrl });
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    logger.debug('Request completed', { method: req.method, url: req.originalUrl, status: res.statusCode, durationMs: Math.round(durationMs) });
  });
  next();
}

module.exports = requestLogger;
