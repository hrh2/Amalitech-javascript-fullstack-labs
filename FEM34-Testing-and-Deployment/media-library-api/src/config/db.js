const mongoose = require('mongoose');
const { env } = require('./env');

let pending = null; // a connection attempt that is in progress, shared by everyone who asks at the same time

async function open(uri) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 }); // fail in 5 s instead of 30 s when MongoDB is down
  // Build the indexes (including the text index behind ?search=) before the first request needs them.
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
}

/**
 * Opens the one shared connection. Safe to call many times: it reuses the open connection. That matters on Vercel, where
 * there is no server.js: the app connects on the first request of each (cold) instance and reuses the connection after that.
 */
async function connectDB(uri = env.DATABASE_URL) {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (!pending) pending = open(uri);
  try {
    await pending;
  } finally {
    pending = null;
  }
  return mongoose.connection;
}

async function disconnectDB() {
  await mongoose.disconnect();
}

module.exports = { connectDB, disconnectDB };
