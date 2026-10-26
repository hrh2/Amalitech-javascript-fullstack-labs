const mongoose = require('mongoose');

const DEFAULT_URI = 'mongodb://127.0.0.1:27017/task_api_dev';

function getUri() {
  return process.env.MONGODB_URI || DEFAULT_URI;
}

/**
 * Opens the one shared connection. Mongoose keeps it in `mongoose.connection`,
 * and every model uses it automatically.
 */
async function connect(uri = getUri()) {
  // Fail after 5 s instead of the default 30 s when no MongoDB is reachable.
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  return mongoose.connection;
}

async function disconnect() {
  await mongoose.disconnect();
}

module.exports = { connect, disconnect, getUri };
