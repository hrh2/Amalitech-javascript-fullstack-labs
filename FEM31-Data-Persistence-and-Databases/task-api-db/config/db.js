const mongoose = require('mongoose');
const env = require('./env');

/**
 * Opens the one shared connection. Mongoose keeps it in `mongoose.connection`,
 * and every model uses it automatically.
 */
async function connect(uri = env.DB_URI) {
  // Fail after 5 s instead of the default 30 s when no MongoDB is reachable.
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  return mongoose.connection;
}

async function disconnect() {
  await mongoose.disconnect();
}

const getUri = () => env.DB_URI;

module.exports = { connect, disconnect, getUri };
