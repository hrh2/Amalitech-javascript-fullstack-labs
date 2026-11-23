// Express 5 already forwards a rejected promise to the error handler, but this wrapper makes it explicit and works the
// same on any version: whatever an async controller throws goes to next(err) instead of becoming an unhandled rejection.
const catchAsync = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (err) {
    next(err);
  }
};

module.exports = catchAsync;
