// The data layer. It used to be an in-memory array (FEM30); now it talks to MongoDB through Mongoose.
// The function names are the same as before, they just return promises, which is why
// the routes changed so little: they only needed `await`.
const Task = require('./models/task');

const SEED_TASKS = [
  { title: 'Design the API', completed: true },
  { title: 'Write the routes', completed: false },
  { title: 'Test with Postman', completed: false },
];

module.exports = {
  /** All tasks in creation order, or only those with the given `completed` value. */
  list(filter = {}) {
    const query = typeof filter.completed === 'boolean' ? { completed: filter.completed } : {};
    return Task.find(query).sort({ _id: 1 });
  },

  get(id) {
    return Task.findById(id); // resolves to null when there is no such task
  },

  create({ title, completed }) {
    return Task.create({ title, completed });
  },

  /** PUT: the whole task is replaced, so a field that is not supplied goes back to its default. */
  async replace(id, { title, completed = false }) {
    const task = await Task.findById(id);
    if (!task) return null;
    task.set({ title, completed });
    return task.save();
  },

  /** PATCH: only the supplied fields change. */
  async update(id, changes) {
    const task = await Task.findById(id);
    if (!task) return null;
    task.set(changes);
    return task.save();
  },

  /** Resolves to true if a task was deleted, false if there was none. */
  async remove(id) {
    const result = await Task.deleteOne({ _id: id });
    return result.deletedCount === 1;
  },

  /** Empties the collection and inserts the three seed tasks. Used by `npm run seed` and the tests. */
  async reset() {
    await Task.deleteMany({});
    await Task.insertMany(SEED_TASKS);
  },
};
