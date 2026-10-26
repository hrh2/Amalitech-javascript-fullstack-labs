const express = require('express');
const store = require('../store');
const { parseId, validateTask } = require('../validate-task');

const router = express.Router();

// Runs once for every route that contains :id, so the id is validated in a single place.
router.param('id', (req, res, next, value) => {
  const id = parseId(value);
  if (id === null) {
    return res.status(400).json({ error: 'id must be a positive integer' });
  }
  req.taskId = id;
  next();
});

const notFoundError = (id) => ({ error: `Task ${id} not found` });
const validationError = (details) => ({ error: 'Validation failed', details });

// GET /tasks  or  GET /tasks?completed=true|false
router.get('/', (req, res) => {
  const { completed } = req.query;
  if (completed === undefined) {
    return res.json(store.list());
  }
  if (completed !== 'true' && completed !== 'false') {
    return res.status(400).json({ error: 'completed must be "true" or "false"' });
  }
  res.json(store.list({ completed: completed === 'true' }));
});

// GET /tasks/:id
router.get('/:id', (req, res) => {
  const task = store.get(req.taskId);
  if (!task) {
    return res.status(404).json(notFoundError(req.taskId));
  }
  res.json(task);
});

// POST /tasks  -> 201 Created + Location header
router.post('/', (req, res) => {
  const { value, errors } = validateTask(req.body);
  if (errors) {
    return res.status(400).json(validationError(errors));
  }
  const task = store.create(value);
  res.status(201).location(`/tasks/${task.id}`).json(task);
});

// PUT /tasks/:id  -> replace the whole task (idempotent)
router.put('/:id', (req, res) => {
  const { value, errors } = validateTask(req.body);
  if (errors) {
    return res.status(400).json(validationError(errors));
  }
  const task = store.replace(req.taskId, value);
  if (!task) {
    return res.status(404).json(notFoundError(req.taskId));
  }
  res.json(task);
});

// PATCH /tasks/:id  -> change only the supplied fields
router.patch('/:id', (req, res) => {
  const { value, errors } = validateTask(req.body, { partial: true });
  if (errors) {
    return res.status(400).json(validationError(errors));
  }
  if (Object.keys(value).length === 0) {
    return res.status(400).json(validationError(['Provide at least one of: title, completed']));
  }
  const task = store.update(req.taskId, value);
  if (!task) {
    return res.status(404).json(notFoundError(req.taskId));
  }
  res.json(task);
});

// DELETE /tasks/:id  -> 204 with no body; deleting again gives 404
router.delete('/:id', (req, res) => {
  if (!store.remove(req.taskId)) {
    return res.status(404).json(notFoundError(req.taskId));
  }
  res.sendStatus(204);
});

module.exports = router;
