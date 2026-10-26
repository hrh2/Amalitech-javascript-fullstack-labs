const User = require('../models/User');
const Task = require('../models/Task');
const { sendSuccess, sendError } = require('../utils/responses');

// GET /api/users  (admin) -> all users, never with their password hashes
exports.getUsers = async (req, res) => {
  const users = await User.find().sort({ _id: 1 });
  sendSuccess(res, { count: users.length, users });
};

// DELETE /api/users/:id  and  DELETE /admin/user/:id  (admin)
// Also removes the user's tasks, so nothing is left pointing at a missing owner.
exports.deleteUser = async (req, res) => {
  if (req.userId === req.user.id) {
    return sendError(res, 409, 'Admins cannot delete their own account');
  }
  const result = await User.deleteOne({ _id: req.userId });
  if (result.deletedCount === 0) {
    return sendError(res, 404, `User ${req.userId} not found`);
  }
  await Task.deleteMany({ owner: req.userId });
  sendSuccess(res, { message: `User ${req.userId} deleted` });
};
