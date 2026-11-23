// Last line of defence for errors that no route caught: a promise nobody awaited that rejected, or a thrown error
// outside any request. After one of these the program may be in a broken state, so the safe move is: log it,
// stop accepting requests, finish the ones in progress, and exit so a process manager (Docker, PM2, the host)
// starts a fresh copy. The functions are passed in so the behaviour can be tested without really exiting.
const logger = require('./logger');
const { errorFields } = require('./logger');

function registerProcessHandlers({ proc = process, shutdown }) {
  proc.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection. Shutting down.', errorFields(reason));
    shutdown(1);
  });
  proc.on('uncaughtException', (err) => {
    logger.error('Uncaught exception. Shutting down.', errorFields(err));
    shutdown(1);
  });
  // A normal stop request (Ctrl+C, `docker stop`): same graceful path, but a success exit code.
  proc.on('SIGTERM', () => shutdown(0));
  proc.on('SIGINT', () => shutdown(0));
}

/** Builds shutdown(code): close the HTTP server, close the database, then exit. Forces the exit after a timeout. */
function createShutdown({ getServer, disconnect, exit = process.exit, forceAfterMs = 10000 }) {
  let shuttingDown = false;
  return async function shutdown(code) {
    if (shuttingDown) return;
    shuttingDown = true;
    setTimeout(() => exit(1), forceAfterMs).unref(); // if closing hangs, do not hang forever
    try {
      const server = getServer();
      if (server) await new Promise((resolve) => server.close(resolve));
      await disconnect();
    } catch (err) {
      logger.error('Error during shutdown', errorFields(err));
      code = 1;
    }
    exit(code);
  };
}

module.exports = { registerProcessHandlers, createShutdown };
