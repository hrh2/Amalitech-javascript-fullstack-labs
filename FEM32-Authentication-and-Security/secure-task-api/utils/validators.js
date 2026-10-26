const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PASSWORD_BYTES = 72; // bcrypt ignores everything after 72 bytes, so longer passwords are refused, not silently cut

// Returns { value: { name, email, password } } or { errors: [...] }.
function validateRegistration(body) {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { errors: ['Request body must be a JSON object'] };
  }
  const { name, email, password } = body;
  const errors = [];

  if (typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 100) {
    errors.push('name is required (1-100 characters)');
  }
  if (typeof email !== 'string' || !EMAIL.test(email.trim()) || email.length > 254) {
    errors.push('email must be a valid email address');
  }
  if (typeof password !== 'string') {
    errors.push('password is required');
  } else {
    if (password.length < 8) errors.push('password must be at least 8 characters');
    if (Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_BYTES) errors.push(`password must be at most ${MAX_PASSWORD_BYTES} bytes`);
  }

  return errors.length ? { errors } : { value: { name: name.trim(), email: email.trim().toLowerCase(), password } };
}

// Login only checks the SHAPE (strings, present): password rules may have changed since the user registered.
// Requiring strings also blocks NoSQL injection such as { "email": { "$ne": null } }.
function validateLogin(body) {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { errors: ['Request body must be a JSON object'] };
  }
  const { email, password } = body;
  const errors = [];
  if (typeof email !== 'string' || email.trim() === '') errors.push('email is required');
  if (typeof password !== 'string' || password === '') errors.push('password is required');
  return errors.length ? { errors } : { value: { email: email.trim().toLowerCase(), password } };
}

// A MongoDB id is 24 hex characters.
function parseId(value) {
  return /^[0-9a-fA-F]{24}$/.test(value) ? value : null;
}

// Returns { value } or { errors }. With { partial: true } (PATCH) every field is optional.
function validateTask(body, { partial = false } = {}) {
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
    if (typeof body.completed !== 'boolean') errors.push('completed must be true or false');
    else value.completed = body.completed;
  }
  return errors.length ? { errors } : { value };
}

module.exports = { validateRegistration, validateLogin, validateTask, parseId };
