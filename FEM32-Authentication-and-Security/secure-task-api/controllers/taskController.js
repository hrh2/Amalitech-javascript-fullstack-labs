// Access rules (task description):
//   GET    /api/tasks      logged-in; a user sees their own tasks, an admin sees all tasks
//   POST   /api/tasks      logged-in; the task is owned by the caller
//   PUT    /api/tasks/:id  task OWNER only
//   DELETE /api/tasks/:id  task owner OR admin
// (GET /:id and PATCH /:id follow the same rules as GET list and PUT.)
// A user asking for someone else's task gets 404, not 403, so the API does not reveal that the id exists.
const Task = require('../models/Task');
const { validateTask } = require('../utils/validators');
const { sendSuccess, sendError } = require('../utils/responses');

const isAdmin = (req) => req.user.role === 'admin';
const notFound = (res, id) => sendError(res, 404, `Task ${id} not found`);

// Who may READ / DELETE: the owner, or an admin.
const readableBy = (req, id) => (isAdmin(req) ? { _id: id } : { _id: id, owner: req.user.id });
// Who may CHANGE (PUT / PATCH): the owner only.
const ownedBy = (req, id) => ({ _id: id, owner: req.user.id });

// GET /api/tasks  or  /api/tasks?completed=true|false
exports.getTasks = async (req, res) => {
  const { completed } = req.query;
  if (completed !== undefined && completed !== 'true' && completed !== 'false') {
    return sendError(res, 400, 'completed must be "true" or "false"');
  }
  const query = isAdmin(req) ? {} : { owner: req.user.id };
  if (completed !== undefined) query.completed = completed === 'true';

  const tasks = await Task.find(query).sort({ _id: 1 });
  sendSuccess(res, { count: tasks.length, tasks });
};

// GET /api/tasks/:id
exports.getTask = async (req, res) => {
  const task = await Task.findOne(readableBy(req, req.taskId));
  if (!task) return notFound(res, req.taskId);
  sendSuccess(res, { task });
};

// POST /api/tasks
exports.createTask = async (req, res) => {
  const { value, errors } = validateTask(req.body);
  if (errors) return sendError(res, 400, 'Validation failed', errors);

  const task = await Task.create({ ...value, owner: req.user.id }); // owner comes from the token, never the body
  res.location(`/api/tasks/${task.id}`);
  sendSuccess(res, { task }, 201);
};

// PUT /api/tasks/:id  -> replace the whole task (owner only)
exports.replaceTask = async (req, res) => {
  const { value, errors } = validateTask(req.body);
  if (errors) return sendError(res, 400, 'Validation failed', errors);

  const task = await Task.findOne(ownedBy(req, req.taskId));
  if (!task) return notFound(res, req.taskId);

  task.set({ title: value.title, completed: value.completed ?? false });
  sendSuccess(res, { task: await task.save() });
};

// PATCH /api/tasks/:id  -> change only the supplied fields (owner only)
exports.updateTask = async (req, res) => {
  const { value, errors } = validateTask(req.body, { partial: true });
  if (errors) return sendError(res, 400, 'Validation failed', errors);
  if (Object.keys(value).length === 0) {
    return sendError(res, 400, 'Validation failed', ['Provide at least one of: title, completed']);
  }

  const task = await Task.findOne(ownedBy(req, req.taskId));
  if (!task) return notFound(res, req.taskId);

  task.set(value);
  sendSuccess(res, { task: await task.save() });
};

// DELETE /api/tasks/:id  (owner or admin)
exports.deleteTask = async (req, res) => {
  const result = await Task.deleteOne(readableBy(req, req.taskId));
  if (result.deletedCount === 0) return notFound(res, req.taskId);
  sendSuccess(res, { message: `Task ${req.taskId} deleted` });
};
