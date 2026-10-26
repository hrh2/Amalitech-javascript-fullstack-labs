const { rateLimit } = require('express-rate-limit');
const { env } = require('../config/env');
const { sendError } = require('../utils/responses');

/**
 * Limits how many requests one IP can make in a time window. Used on /auth/* so a script cannot
 * try thousands of passwords. Counters live in this process's memory; with several server instances
 * you would use a shared store (for example Redis).
 */
function createAuthLimiter({ windowMs, limit } = env.AUTH_RATE_LIMIT) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7', // sends RateLimit-* headers
    legacyHeaders: false,
    handler: (req, res) => sendError(res, 429, 'Too many attempts. Please try again later.'),
  });
}

module.exports = { createAuthLimiter };
