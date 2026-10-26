// Loads the .env file (if there is one) into process.env, once, before anything else reads it.
// Real environment variables win over .env, so a host can override a value without editing a file.
require('dotenv').config({ quiet: true });

module.exports = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
};
