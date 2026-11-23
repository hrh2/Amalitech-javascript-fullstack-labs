// Reusable validation middleware: validate({ body, query, params }) checks each part of the request with its Zod
// schema. On success the CLEAN values are put on req.validated (the controller reads only those). On failure it
// stops with a 400 that lists every problem as { field, message }.
const AppError = require('../utils/AppError');

const PARTS = ['params', 'query', 'body'];

const validate = (schemas) => (req, res, next) => {
  const validated = {};
  const details = [];

  for (const part of PARTS) {
    if (!schemas[part]) continue;
    const input = part === 'body' ? req.body ?? {} : req[part]; // Express 5: req.body is undefined when no body was sent
    const result = schemas[part].safeParse(input);
    if (result.success) {
      validated[part] = result.data;
    } else {
      for (const issue of result.error.issues) {
        details.push({ field: issue.path.join('.') || part, message: issue.message });
      }
    }
  }

  if (details.length > 0) return next(AppError.badRequest('Validation failed', details));
  req.validated = validated;
  next();
};

module.exports = validate;
