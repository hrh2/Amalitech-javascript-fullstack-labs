// npm run seed: empties the tasks collection of the configured database and inserts three sample tasks.
// (Also imported by the tests to start every test from the same data.)
const Task = require('./models/Task');

const SEED_TASKS = [
  { title: 'Design the API', completed: true },
  { title: 'Write the routes', completed: false },
  { title: 'Test with Postman', completed: false },
];

async function seedTasks() {
  await Task.deleteMany({});
  await Task.insertMany(SEED_TASKS);
}

module.exports = { seedTasks, SEED_TASKS };

if (require.main === module) {
  const { connect, disconnect } = require('./config/db');
  (async () => {
    await connect();
    await seedTasks();
    console.log(`Seeded ${SEED_TASKS.length} tasks.`);
    await disconnect();
  })().catch((error) => {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  });
}
