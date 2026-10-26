const { env, assertEnv } = require('./config/env');
const app = require('./app');
const { connectDB } = require('./config/db');

async function start() {
  // Fail fast: a server that cannot sign tokens must not start.
  try {
    assertEnv();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

  try {
    await connectDB();
  } catch (error) {
    // Never print the full URI: it may contain a password.
    console.error(`Could not connect to MongoDB (${env.DB_URI.replace(/\/\/[^@/]*@/, '//***@')}): ${error.message}`);
    process.exit(1);
  }
  console.log('Connected to MongoDB');

  app.listen(env.PORT, (error) => {
    if (error) {
      console.error(error.code === 'EADDRINUSE' ? `Port ${env.PORT} is already in use.` : `Could not start the server: ${error.message}`);
      process.exit(1);
    }
    console.log(`Secure Task API listening on http://localhost:${env.PORT}`);
  });
}

start();
