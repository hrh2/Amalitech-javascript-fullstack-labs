// Optional settings file: copy .env.example to .env. Ignored if there is no .env.
try {
  process.loadEnvFile();
} catch {
  /* no .env file: use the defaults */
}

const app = require('./app');
const { connect, getUri } = require('./db');

const PORT = process.env.PORT || 3000;

async function start() {
  // Connect first: there is no point accepting requests that cannot be answered.
  try {
    await connect();
  } catch (error) {
    // Never print the full URI: it may contain a password.
    console.error(`Could not connect to MongoDB (${getUri().replace(/\/\/[^@/]*@/, '//***@')}): ${error.message}`);
    console.error('Is mongod running? Start it, or set MONGODB_URI in .env.');
    process.exit(1);
  }
  console.log('Connected to MongoDB');

  app.listen(PORT, (error) => {
    if (error) {
      console.error(error.code === 'EADDRINUSE' ? `Port ${PORT} is already in use.` : `Could not start the server: ${error.message}`);
      process.exit(1);
    }
    console.log(`Task API listening on http://localhost:${PORT}`);
  });
}

start();
