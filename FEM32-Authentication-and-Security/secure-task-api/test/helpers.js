const { call } = require('./setup');
const User = require('../models/User');
const { hashPassword } = require('../utils/passwords');

const PASSWORD = 'correct horse battery';

/** Registers a user through the API and logs in. Returns { user, token }. */
async function registerAndLogin(base, name, password = PASSWORD) {
  const email = `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`;
  const reg = await call(base, 'POST', '/auth/register', { body: { name, email, password } });
  const login = await call(base, 'POST', '/auth/login', { body: { email, password } });
  return { user: reg.json.data.user, token: login.json.data.token, email };
}

/** Creates an admin directly in the database (the API cannot: that is the point), then logs in. */
async function createAdminAndLogin(base, email = 'root.admin@example.com', password = PASSWORD) {
  const user = await User.create({ name: 'Root Admin', email, password: await hashPassword(password), role: 'admin' });
  const login = await call(base, 'POST', '/auth/login', { body: { email, password } });
  return { user: user.toJSON(), token: login.json.data.token, email };
}

module.exports = { PASSWORD, registerAndLogin, createAdminAndLogin };
