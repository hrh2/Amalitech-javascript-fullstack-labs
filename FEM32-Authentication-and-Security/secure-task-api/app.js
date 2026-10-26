require('./config/env'); // load .env first, before any other file reads process.env
const express = require('express');
const helmet = require('helmet');
const requestLogger = require('./middleware/requestLogger');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const taskRoutes = require('./routes/taskRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(helmet()); // security headers (X-Content-Type-Options, Strict-Transport-Security, ...) and no X-Powered-By
if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger);
}
app.use(express.json({ limit: '10kb' })); // these bodies are tiny, so a small limit costs nothing and blocks big payloads

app.use('/auth', authRoutes);           // POST /auth/register, POST /auth/login       (public)
app.use('/dashboard', dashboardRoutes); // GET /dashboard                              (any logged-in user)
app.use('/api/tasks', taskRoutes);      // the CRUD API                                (logged-in; owner / admin rules)
app.use('/api/users', userRoutes);      // GET /api/users, DELETE /api/users/:id       (admin only)
app.use('/admin', userRoutes);          // DELETE /admin/user/:id                      (admin only)

app.use(notFound);
app.use(errorHandler);

module.exports = app;
