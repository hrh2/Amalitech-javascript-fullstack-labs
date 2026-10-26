// Loads the .env file (if there is one) into process.env, once, before anything else reads it.
// Real environment variables win over .env, so a host can override a value without editing a file.
require('dotenv').config({ quiet: true });

module.exports = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  // Where the database lives (host, port and the database NAME at the end).
  get DB_URI() {
    return process.env.DB_URI || 'mongodb://127.0.0.1:27017/task_tracker_db';
  },
};
