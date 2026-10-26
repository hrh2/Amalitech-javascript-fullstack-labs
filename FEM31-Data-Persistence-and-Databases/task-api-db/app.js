require('./config/env'); // load .env first, before any other file reads process.env
const express = require('express');
const requestLogger = require('./middleware/request-logger');
const tasksRouter = require('./routes/taskRoutes');
const { notFound, errorHandler } = require('./middleware/errors');

const app = express();

// Order matters: middleware runs top to bottom for every request.
if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger);   // 1. log every request (skipped in tests to keep their output readable)
}
app.use(express.json());    // 2. parse JSON bodies into req.body

app.use('/tasks', tasksRouter);   // 3. the routes

app.use(notFound);          // 4. nothing matched -> JSON 404
app.use(errorHandler);      // 5. anything that threw or called next(err) -> JSON error

module.exports = app;
