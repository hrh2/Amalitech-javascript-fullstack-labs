/**
 * main.js
 * -----------------------------------------------------------------------
 * Entry point: wires together the API client, models, and processor
 * utilities behind a TaskManager controller, and exposes a minimal
 * CLI menu for interacting with the data.
 * -----------------------------------------------------------------------
 */

import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { APIClient } from './api.js';
import { User } from './models.js';
import * as processor from './taskProcessor.js';

/** Orchestrates data loading and processing for the whole app. */
class TaskManager {
  constructor(apiClient = new APIClient()) {
    this.api = apiClient;
    this.tasks = [];
    this.users = new Map(); // userId -> User instance
  }

  /** Load users + todos concurrently and build the in-memory model. */
  async load() {
    const { users, todos } = await this.api.fetchAllData();

    this.tasks = processor.mapTodosToTasks(todos);

    const byUser = processor.groupByUser(this.tasks);

    this.users = new Map(
      users.map((raw) => {
        const { id } = raw;
        const user = new User({ ...raw, tasks: byUser.get(id) ?? [] });
        return [id, user];
      })
    );

    return this;
  }

  getAllTasks() {
    return this.tasks;
  }

  getUser(userId) {
    return this.users.get(userId);
  }

  getAllUsers() {
    return [...this.users.values()];
  }

  getOverallStatistics() {
    return processor.calculateStatistics(this.tasks);
  }

  searchTasks(query) {
    return processor.searchTasksByTitle(this.tasks, query);
  }
}

// ---------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------

const MENU = `
==================================================
  Task Manager API Client
==================================================
  1) Show overall statistics
  2) List all users with completion rates
  3) List tasks for a specific user
  4) List overdue priority tasks
  5) Search tasks by title
  6) Show unique priority levels in use
  7) Exit
--------------------------------------------------`;

const formatStats = ({ total, completed, pending, overdue, completionRate, priorityBreakdown }) => `
  Total tasks:      ${total}
  Completed:        ${completed}
  Pending:          ${pending}
  Overdue:          ${overdue}
  Completion rate:  ${completionRate}%
  Priority mix:     ${
    Object.entries(priorityBreakdown)
      .map(([priority, count]) => `${priority}=${count}`)
      .join(', ') || 'n/a'
  }`;

async function runCLI(manager) {
  const rl = readline.createInterface({ input, output });

  let running = true;
  while (running) {
    console.log(MENU);
    const choice = (await rl.question('Choose an option (1-7): ')).trim();

    switch (choice) {
      case '1': {
        console.log(formatStats(manager.getOverallStatistics()));
        break;
      }
      case '2': {
        manager.getAllUsers().forEach((user) => console.log(`  ${user.summary()}`));
        break;
      }
      case '3': {
        const idStr = await rl.question('  Enter user id: ');
        const user = manager.getUser(Number(idStr));
        if (!user) {
          console.log('  No such user.');
          break;
        }
        console.log(`  Tasks for ${user.name}:`);
        user.tasks.forEach((task) => console.log(`    ${task.toString()}`));
        break;
      }
      case '4': {
        const overdue = processor.filterOverdue(manager.getAllTasks());
        if (overdue.length === 0) {
          console.log('  No overdue priority tasks. Nice!');
        } else {
          overdue.forEach((task) => console.log(`  ${task.toString()}`));
        }
        break;
      }
      case '5': {
        const query = await rl.question('  Search term: ');
        const results = manager.searchTasks(query);
        console.log(`  Found ${results.length} task(s):`);
        results.slice(0, 20).forEach((task) => console.log(`    ${task.toString()}`));
        if (results.length > 20) console.log(`    ...and ${results.length - 20} more`);
        break;
      }
      case '6': {
        const priorities = processor.getUniquePriorities(manager.getAllTasks());
        console.log(`  Priorities in use: ${[...priorities].join(', ') || 'none'}`);
        break;
      }
      case '7': {
        running = false;
        break;
      }
      default: {
        console.log('  Invalid option, please choose 1-7.');
      }
    }
  }

  rl.close();
  console.log('Goodbye!');
}

async function main() {
  console.log('Loading data from JSONPlaceholder...');
  const manager = new TaskManager();

  try {
    await manager.load();
  } catch (err) {
    console.error(`Fatal error while loading data: ${err.message}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Loaded ${manager.getAllTasks().length} tasks for ${manager.getAllUsers().length} users.`);
  await runCLI(manager);
}

main();

export { TaskManager };
