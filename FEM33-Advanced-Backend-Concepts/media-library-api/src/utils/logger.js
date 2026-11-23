// A tiny logger: one line per event, silent in tests. (FEM34 replaces this with structured logging.)
const quiet = () => process.env.NODE_ENV === 'test';

const logger = {
  info: (...args) => !quiet() && console.log(new Date().toISOString(), 'INFO ', ...args),
  error: (...args) => !quiet() && console.error(new Date().toISOString(), 'ERROR', ...args),
};

module.exports = logger;
