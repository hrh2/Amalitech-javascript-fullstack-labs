const express = require('express');
const mediaRoutes = require('./routes/mediaRoutes');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const logger = require('./utils/logger');

const app = express();

app.use(express.json({ limit: '10kb' })); // JSON bodies (PUT /media/:id). Uploads are read by Multer on the route.

app.use((req, res, next) => {
  res.on('finish', () => logger.info(`${req.method} ${req.originalUrl} -> ${res.statusCode}`));
  next();
});

app.use('/media', mediaRoutes);

app.use(notFound);
app.use(errorHandler); // always last

module.exports = app;
