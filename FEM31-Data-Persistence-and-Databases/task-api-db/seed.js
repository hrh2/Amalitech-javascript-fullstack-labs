// npm run seed: empties the tasks collection of the configured database and inserts the three sample tasks.
try {
  process.loadEnvFile();
} catch {
  /* no .env file */
}

const { connect, disconnect } = require('./db');
const store = require('./store');

(async () => {
  await connect();
  await store.reset();
  console.log('Seeded 3 tasks.');
  await disconnect();
})().catch((error) => {
  console.error('Seeding failed:', error.message);
  process.exit(1);
});
