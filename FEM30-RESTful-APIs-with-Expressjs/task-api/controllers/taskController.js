// The "C" in MVC: each function handles one kind of request. It reads the request, asks the model
// for data, and decides the HTTP response. It contains no storage code and no routing code.
const Task = require('../models/taskModel');
const { validateTask } = require('../validators/taskValidator');

const notFoundError = (id) => ({ error: `Task ${id} not found` });
const validationError = (details) => ({ error: 'Validation failed', details });

// GET /tasks  or  GET /tasks?completed=true|false
exports.getTasks = (req, res) => {
  const { completed } = req.query;
  if (completed === undefined) {
    return res.json(Task.list());
  }
  if (completed !== 'true' && completed !== 'false') {
    return res.status(400).json({ error: 'completed must be "true" or "false"' });
  }
  res.json(Task.list({ completed: completed === 'true' }));
};

// GET /tasks/:id
exports.getTask = (req, res) => {
  const task = Task.get(req.taskId);
  if (!task) {
    return res.status(404).json(notFoundError(req.taskId));
  }
  res.json(task);
};

// POST /tasks  -> 201 Created + Location header
exports.createTask = (req, res) => {
  const { value, errors } = validateTask(req.body);
  if (errors) {
    return res.status(400).json(validationError(errors));
  }
  const task = Task.create(value);
  res.status(201).location(`/tasks/${task.id}`).json(task);
};

// PUT /tasks/:id  -> replace the whole task (idempotent)
exports.replaceTask = (req, res) => {
  const { value, errors } = validateTask(req.body);
  if (errors) {
    return res.status(400).json(validationError(errors));
  }
  const task = Task.replace(req.taskId, value);
  if (!task) {
    return res.status(404).json(notFoundError(req.taskId));
  }
  res.json(task);
};

// PATCH /tasks/:id  -> change only the supplied fields
exports.updateTask = (req, res) => {
  const { value, errors } = validateTask(req.body, { partial: true });
  if (errors) {
    return res.status(400).json(validationError(errors));
  }
  if (Object.keys(value).length === 0) {
    return res.status(400).json(validationError(['Provide at least one of: title, completed']));
  }
  const task = Task.update(req.taskId, value);
  if (!task) {
    return res.status(404).json(notFoundError(req.taskId));
  }
  res.json(task);
};

// DELETE /tasks/:id  -> 204 with no body; deleting again gives 404
exports.deleteTask = (req, res) => {
  if (!Task.remove(req.taskId)) {
    return res.status(404).json(notFoundError(req.taskId));
  }
  res.sendStatus(204);
};
