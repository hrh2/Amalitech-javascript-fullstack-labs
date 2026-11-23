// Makes sure MongoDB is connected before a request reaches a controller. Needed on Vercel (no server.js there);
// on a normal server the connection is already open, so this costs one cheap check.
const { connectDB } = require('../config/db');

async function ensureDb(req, res, next) {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = ensureDb;
