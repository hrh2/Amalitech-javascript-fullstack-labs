// The "C" in MVC: reads the request, asks the Task model for data (with await), decides the HTTP response.
// Express 5 passes a rejected promise from an async handler to the error handler, so there is no try/catch here:
// a database failure ends up in middleware/errors.js (generic 500 for the client, details in the server log).
const Task = require('../models/Task');
const { validateTask } = require('../validators/taskValidator');

const notFoundError = (id) => ({ error: `Task ${id} not found` });
const validationError = (details) => ({ error: 'Validation failed', details });

// GET /tasks  or  GET /tasks?completed=true|false  (oldest first)
exports.getTasks = async (req, res) => {
  const { completed } = req.query;
  if (completed !== undefined && completed !== 'true' && completed !== 'false') {
    return res.status(400).json({ error: 'completed must be "true" or "false"' });
  }
  const query = completed === undefined ? {} : { completed: completed === 'true' };
  res.json(await Task.find(query).sort({ _id: 1 }));
};

// GET /tasks/:id
exports.getTask = async (req, res) => {
  const task = await Task.findById(req.taskId); // null when there is no such task
  if (!task) {
    return res.status(404).json(notFoundError(req.taskId));
  }
  res.json(task);
};

// POST /tasks  -> 201 Created + Location header
exports.createTask = async (req, res) => {
  const { value, errors } = validateTask(req.body);
  if (errors) {
    return res.status(400).json(validationError(errors));
  }
  const task = await Task.create(value);
  res.status(201).location(`/tasks/${task.id}`).json(task);
};

// PUT /tasks/:id  -> replace the whole task: a field that is not supplied goes back to its default
exports.replaceTask = async (req, res) => {
  const { value, errors } = validateTask(req.body);
  if (errors) {
    return res.status(400).json(validationError(errors));
  }
  const task = await Task.findById(req.taskId);
  if (!task) {
    return res.status(404).json(notFoundError(req.taskId));
  }
  // find-then-save (instead of one findByIdAndUpdate) so schema validation and the updatedAt timestamp run
  task.set({ title: value.title, completed: value.completed ?? false });
  res.json(await task.save());
};

// PATCH /tasks/:id  -> change only the supplied fields
exports.updateTask = async (req, res) => {
  const { value, errors } = validateTask(req.body, { partial: true });
  if (errors) {
    return res.status(400).json(validationError(errors));
  }
  if (Object.keys(value).length === 0) {
    return res.status(400).json(validationError(['Provide at least one of: title, completed']));
  }
  const task = await Task.findById(req.taskId);
  if (!task) {
    return res.status(404).json(notFoundError(req.taskId));
  }
  task.set(value);
  res.json(await task.save());
};

// DELETE /tasks/:id  -> 204 with no body; deleting again gives 404
exports.deleteTask = async (req, res) => {
  const result = await Task.deleteOne({ _id: req.taskId });
  if (result.deletedCount === 0) {
    return res.status(404).json(notFoundError(req.taskId));
  }
  res.sendStatus(204);
};
