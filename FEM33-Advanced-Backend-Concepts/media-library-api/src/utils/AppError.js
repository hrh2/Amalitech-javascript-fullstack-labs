// An "operational" error: something we expected could go wrong (bad input, missing record) and know the HTTP answer for.
// Anything that is NOT an AppError is a bug, and the error handler answers it with a generic 500.
class AppError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details; // optional: [{ field, message }]
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details) {
    return new AppError(400, message, details);
  }

  static notFound(message) {
    return new AppError(404, message);
  }
}

module.exports = AppError;
