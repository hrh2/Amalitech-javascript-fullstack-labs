// The "M" in MVC: the Task data and the only code allowed to touch it.
// In-memory storage (a plain array), so the data lives only as long as the process does.
// It knows nothing about HTTP: it takes plain values and returns plain values.
let tasks = [];
let nextId = 1;

function seed() {
  tasks = [
    { id: 1, title: 'Design the API', completed: true },
    { id: 2, title: 'Write the routes', completed: false },
    { id: 3, title: 'Test with Postman', completed: false },
  ];
  nextId = 4;
}
seed();

module.exports = {
  /** All tasks, or only those with the given `completed` value. Returns a copy of the array. */
  list(filter = {}) {
    if (typeof filter.completed === 'boolean') {
      return tasks.filter((task) => task.completed === filter.completed);
    }
    return [...tasks];
  },

  get(id) {
    return tasks.find((task) => task.id === id);
  },

  create({ title, completed = false }) {
    const task = { id: nextId++, title, completed };
    tasks.push(task);
    return task;
  },

  /** PUT: swap the whole task. Fields not supplied go back to their defaults. */
  replace(id, { title, completed = false }) {
    const index = tasks.findIndex((task) => task.id === id);
    if (index === -1) return undefined;
    tasks[index] = { id, title, completed };
    return tasks[index];
  },

  /** PATCH: change only the supplied fields. */
  update(id, changes) {
    const task = tasks.find((candidate) => candidate.id === id);
    if (!task) return undefined;
    Object.assign(task, changes);
    return task;
  },

  remove(id) {
    const index = tasks.findIndex((task) => task.id === id);
    if (index === -1) return false;
    tasks.splice(index, 1);
    return true;
  },

  /** Puts the seed data back (used by the tests). */
  reset: seed,
};
