// Shared test set-up: a SEPARATE database, so the tests never touch your development data.
process.env.NODE_ENV = 'test'; // switches the request logger off
process.env.MONGODB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/task_api_test';

const { connect, disconnect, getUri } = require('../db');

// Safety net: these tests delete every task, so refuse to run against a database that is not clearly a test one.
const dbName = new URL(getUri()).pathname.slice(1);
if (!dbName.endsWith('_test')) {
  throw new Error(`Refusing to run tests against database "${dbName}": its name must end with "_test".`);
}

module.exports = { connect, disconnect };
