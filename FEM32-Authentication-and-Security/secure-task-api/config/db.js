const mongoose = require('mongoose');
const { env } = require('./env');

/** Opens the one shared connection that every model uses. */
async function connectDB(uri = env.DB_URI) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 }); // fail in 5 s instead of 30 s when MongoDB is down
  return mongoose.connection;
}

async function disconnectDB() {
  await mongoose.disconnect();
}

module.exports = { connectDB, disconnectDB };
