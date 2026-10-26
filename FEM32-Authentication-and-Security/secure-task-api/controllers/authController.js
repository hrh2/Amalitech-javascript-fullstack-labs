const User = require('../models/User');
const Task = require('../models/Task');
const { hashPassword, verifyPassword, verifyAgainstDummy } = require('../utils/passwords');
const { signToken } = require('../utils/tokens');
const { validateRegistration, validateLogin } = require('../utils/validators');
const { sendSuccess, sendError } = require('../utils/responses');
const { env } = require('../config/env');

// POST /auth/register  { name, email, password }  ->  201 { user }
exports.register = async (req, res) => {
  const { value, errors } = validateRegistration(req.body);
  if (errors) {
    return sendError(res, 400, 'Validation failed', errors);
  }

  const password = await hashPassword(value.password);

  try {
    // The role is NOT taken from the request: anyone could otherwise register as an admin
    // (a "mass assignment" vulnerability). Everyone starts as 'user'; see scripts/create-admin.js.
    const user = await User.create({ name: value.name, email: value.email, password });
    return sendSuccess(res, { user }, 201);
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 409, 'Email is already registered');
    }
    throw error;
  }
};

// POST /auth/login  { email, password }  ->  200 { token, tokenType, expiresIn, user }
exports.login = async (req, res) => {
  const { value, errors } = validateLogin(req.body);
  if (errors) {
    return sendError(res, 400, 'Validation failed', errors);
  }

  const user = await User.findOne({ email: value.email }).select('+password');
  const passwordOk = user ? await verifyPassword(value.password, user.password) : await verifyAgainstDummy(value.password);

  // One message for "no such email" and "wrong password", so the response does not reveal which emails are registered.
  if (!user || !passwordOk) {
    return sendError(res, 401, 'Invalid email or password');
  }

  sendSuccess(res, { token: signToken(user), tokenType: 'Bearer', expiresIn: env.JWT_EXPIRES_IN, user });
};

// GET /dashboard  (any logged-in user: their own profile)
exports.dashboard = async (req, res) => {
  const taskCount = await Task.countDocuments({ owner: req.user.id });
  sendSuccess(res, { message: `Welcome, ${req.user.name}`, user: req.user, taskCount });
};
