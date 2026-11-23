// Structured logging with Winston.
//   development: pretty, coloured lines     12:00:01 info Server started {"port":4000}
//   production : one JSON object per line   {"level":"info","message":"Server started","port":4000,"timestamp":"..."}
//                (log services such as Vercel Logs, Datadog or CloudWatch can search and filter JSON fields)
//   test       : silent (tests check calls with spies instead)
// LOG_LEVEL decides what is shown: debug < info < warn < error. "warn" hides debug and info.
const { createLogger: createWinston, format, transports } = require('winston');
const { env } = require('../config/env');

const pretty = format.combine(
  format.colorize(),
  format.timestamp({ format: 'HH:mm:ss' }),
  format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const extra = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level} ${message}${extra}${stack ? `\n${stack}` : ''}`;
  })
);
const json = format.combine(format.timestamp(), format.errors({ stack: true }), format.json());

/** Builds a logger. Options exist so tests can capture the output; the app uses the default instance below. */
function createLogger({ level = env.LOG_LEVEL, nodeEnv = env.NODE_ENV, stream } = {}) {
  return createWinston({
    level,
    silent: nodeEnv === 'test' && !stream,
    format: nodeEnv === 'production' ? json : pretty,
    transports: [stream ? new transports.Stream({ stream }) : new transports.Console()],
  });
}

/** Turns an Error into plain fields. (An Error object has no enumerable fields, so it would log as {}.) */
const errorFields = (err) => ({ error: err?.message ?? String(err), stack: err?.stack });

const logger = createLogger();

module.exports = logger;
module.exports.createLogger = createLogger;
module.exports.errorFields = errorFields;
