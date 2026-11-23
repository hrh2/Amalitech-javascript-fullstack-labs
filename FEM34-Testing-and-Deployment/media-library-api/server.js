// The only file that starts things. Order: check the environment, install the process handlers, connect the
// database, then listen.
let env;
try {
  ({ env } = require('./src/config/env')); // validates every required variable
} catch (err) {
  console.error(err.message); // the logger needs a valid config, so this one message uses console
  process.exit(1);
}

const app = require('./src/app');
const { connectDB, disconnectDB } = require('./src/config/db');
const logger = require('./src/utils/logger');
const { errorFields } = require('./src/utils/logger');
const { databaseName } = require('./src/config/env');
const { registerProcessHandlers, createShutdown } = require('./src/utils/processHandlers');

let server;
const shutdown = createShutdown({ getServer: () => server, disconnect: disconnectDB });
registerProcessHandlers({ shutdown }); // before anything async, so nothing can slip past

async function start() {
  await connectDB();
  logger.info('Connected to MongoDB', { database: databaseName(env.DATABASE_URL) });

  server = app.listen(env.PORT, (error) => {
    if (error) { // Express 5 passes start-up errors (e.g. port in use) here
      logger.error('Could not start the server', errorFields(error));
      return shutdown(1);
    }
    logger.info('Server started', { port: env.PORT, environment: env.NODE_ENV, logLevel: env.LOG_LEVEL });
  });
}

start().catch((err) => {
  logger.error('Start-up failed', errorFields(err));
  shutdown(1);
});
