const express = require('express');
const healthRoutes = require('./routes/healthRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const requestLogger = require('./middlewares/requestLogger');
const ensureDb = require('./middlewares/ensureDb');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();

app.use('/health', healthRoutes); // before the logger and the database: monitors ping it often and it needs neither

app.use(requestLogger);
app.use(express.json({ limit: '10kb' })); // JSON bodies (PUT /media/:id). Uploads are read by Multer on the route.
app.use(ensureDb);

app.use('/media', mediaRoutes);

app.use(notFound);
app.use(errorHandler); // always last

module.exports = app; // server.js listens on it; Vercel uses it directly as the request handler
