const mongoose = require('mongoose');

const DEFAULT_URI = 'mongodb://127.0.0.1:27017/blog_demo';

function getUri() {
  return process.env.MONGODB_URI || DEFAULT_URI;
}

// Opens the shared connection that every model uses.
async function connect(uri = getUri()) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  return mongoose.connection;
}

async function disconnect() {
  await mongoose.disconnect();
}

module.exports = { connect, disconnect, getUri };
