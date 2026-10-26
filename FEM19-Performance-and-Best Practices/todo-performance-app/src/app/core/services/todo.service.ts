import { Injectable, computed, signal } from '@angular/core';
import { Todo } from '../models/todo.model';

/**
 * Owns the to-do list. Components read the signals and call the methods;
 * only this service ever changes the list, and it always replaces the array
 * instead of mutating it, so every dependent computed() and OnPush component
 * sees a new reference and updates.
 */
@Injectable({ providedIn: 'root' })
export class TodoService {
  private readonly todosState = signal<Todo[]>([
    { id: 1, description: 'Build a project', completed: false },
    { id: 2, description: 'Learn React', completed: true },
  ]);

  readonly todos = this.todosState.asReadonly();

  // Derived state: each computed() runs once per change to the list and is
  // cached, instead of once per template binding on every change-detection pass.
  readonly activeTodos = computed(() => this.todos().filter((todo) => !todo.completed));
  readonly completedTodos = computed(() => this.todos().filter((todo) => todo.completed));
  readonly total = computed(() => this.todos().length);
  readonly completedCount = computed(() => this.completedTodos().length);
  readonly pendingCount = computed(() => this.activeTodos().length);
  readonly progress = computed(() => (this.total() === 0 ? 0 : Math.round((this.completedCount() / this.total()) * 100)));

  /** Returns false (and adds nothing) when the text is empty after trimming. */
  addTask(description: string): boolean {
    const text = description.trim();
    if (!text) {
      return false;
    }
    const id = this.todos().reduce((max, todo) => Math.max(max, todo.id), 0) + 1;
    this.todosState.update((todos) => [...todos, { id, description: text, completed: false }]);
    return true;
  }

  toggleCompleted(id: number): void {
    this.todosState.update((todos) =>
      todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)),
    );
  }

  deleteTask(id: number): void {
    this.todosState.update((todos) => todos.filter((todo) => todo.id !== id));
  }
}
