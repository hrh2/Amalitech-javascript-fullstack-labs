// "42" -> 42; anything that is not a positive whole number -> null.
// (Number('abc') is NaN and Number('') is 0, so a regular expression is the safer check.)
function parseId(value) {
  return /^[1-9]\d*$/.test(value) ? Number(value) : null;
}

// Returns { value } when the input is valid, or { errors: [...] } when it is not.
// With { partial: true } (for PATCH) every field is optional.
function validateTask(body, { partial = false } = {}) {
  // Express 5 leaves req.body undefined when the request had no JSON body,
  // so check the shape before reading any property of it.
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { errors: ['Request body must be a JSON object'] };
  }

  const errors = [];
  const value = {};

  if (!partial || 'title' in body) {
    if (typeof body.title !== 'string' || body.title.trim() === '') {
      errors.push('title is required and must be a non-empty string');
    } else {
      value.title = body.title.trim();
    }
  }

  if ('completed' in body) {
    if (typeof body.completed !== 'boolean') {
      errors.push('completed must be true or false');
    } else {
      value.completed = body.completed;
    }
  }

  return errors.length ? { errors } : { value };
}

module.exports = { parseId, validateTask };
