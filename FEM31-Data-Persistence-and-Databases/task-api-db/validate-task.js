// A MongoDB id is an ObjectId: 24 hexadecimal characters.
// (mongoose.isValidObjectId is deliberately NOT used: it also accepts any 12-character string like "abcdefghijkl".)
function parseId(value) {
  return /^[0-9a-fA-F]{24}$/.test(value) ? value : null;
}

// Returns { value } when the input is valid, or { errors: [...] } when it is not.
// With { partial: true } (for PATCH) every field is optional.
// This is the API's own check; the Mongoose schema is a second line of defence at the database layer.
function validateTask(body, { partial = false } = {}) {
  // Express 5 leaves req.body undefined when the request had no JSON body.
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
