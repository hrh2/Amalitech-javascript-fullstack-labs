const express = require('express');
const store = require('../store');
const { parseId, validateTask } = require('../validate-task');

const router = express.Router();

// Express 5 passes a rejected promise from an async handler to the error handler,
// so these handlers need no try/catch.

router.param('id', (req, res, next, value) => {
  const id = parseId(value);
  if (id === null) {
    return res.status(400).json({ error: 'id must be a valid 24-character ObjectId' });
  }
  req.taskId = id;
  next();
});

const notFoundError = (id) => ({ error: `Task ${id} not found` });
const validationError = (details) => ({ error: 'Validation failed', details });

router.get('/', async (req, res) => {
  const { completed } = req.query;
  if (completed === undefined) {
    return res.json(await store.list());
  }
  if (completed !== 'true' && completed !== 'false') {
    return res.status(400).json({ error: 'completed must be "true" or "false"' });
  }
  res.json(await store.list({ completed: completed === 'true' }));
});

router.get('/:id', async (req, res) => {
  const task = await store.get(req.taskId);
  if (!task) {
    return res.status(404).json(notFoundError(req.taskId));
  }
  res.json(task);
});

router.post('/', async (req, res) => {
  const { value, errors } = validateTask(req.body);
  if (errors) {
    return res.status(400).json(validationError(errors));
  }
  const task = await store.create(value);
  res.status(201).location(`/tasks/${task.id}`).json(task);
});

router.put('/:id', async (req, res) => {
  const { value, errors } = validateTask(req.body);
  if (errors) {
    return res.status(400).json(validationError(errors));
  }
  const task = await store.replace(req.taskId, value);
  if (!task) {
    return res.status(404).json(notFoundError(req.taskId));
  }
  res.json(task);
});

router.patch('/:id', async (req, res) => {
  const { value, errors } = validateTask(req.body, { partial: true });
  if (errors) {
    return res.status(400).json(validationError(errors));
  }
  if (Object.keys(value).length === 0) {
    return res.status(400).json(validationError(['Provide at least one of: title, completed']));
  }
  const task = await store.update(req.taskId, value);
  if (!task) {
    return res.status(404).json(notFoundError(req.taskId));
  }
  res.json(task);
});

router.delete('/:id', async (req, res) => {
  if (!(await store.remove(req.taskId))) {
    return res.status(404).json(notFoundError(req.taskId));
  }
  res.sendStatus(204);
});

module.exports = router;
