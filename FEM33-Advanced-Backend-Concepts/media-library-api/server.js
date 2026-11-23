// The only file that starts things: handlers first, then the database, then the HTTP server.
const app = require('./src/app');
const { env } = require('./src/config/env');
const { connectDB, disconnectDB } = require('./src/config/db');
const Media = require('./src/models/Media');
const logger = require('./src/utils/logger');
const { registerProcessHandlers, createShutdown } = require('./src/utils/processHandlers');

let server;
const shutdown = createShutdown({ getServer: () => server, disconnect: disconnectDB });
registerProcessHandlers({ shutdown }); // before anything async, so nothing can slip past

async function start() {
  await connectDB();
  await Media.init(); // make sure the indexes (incl. the text index used by ?search=) exist before serving
  logger.info(`Connected to MongoDB database "${new URL(env.DB_URI).pathname.slice(1)}"`);

  server = app.listen(env.PORT, (error) => {
    if (error) { // Express 5 passes start-up errors (e.g. port in use) here
      logger.error('Could not start the server', error);
      return shutdown(1);
    }
    logger.info(`Media Library API listening on http://localhost:${env.PORT}`);
  });
}

start().catch((err) => {
  logger.error('Start-up failed', err);
  shutdown(1);
});
