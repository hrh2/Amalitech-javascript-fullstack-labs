import { TestBed } from '@angular/core/testing';
import { TodoService } from './todo.service';

describe('TodoService', () => {
  let service: TodoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TodoService);
  });

  it('starts with the two seed todos and matching derived numbers', () => {
    expect(service.todos().map((t) => t.description)).toEqual(['Build a project', 'Learn React']);
    expect(service.total()).toBe(2);
    expect(service.completedCount()).toBe(1);
    expect(service.pendingCount()).toBe(1);
    expect(service.progress()).toBe(50);
  });

  describe('addTask', () => {
    it('adds a trimmed, incomplete todo with the next free id and returns true', () => {
      expect(service.addTask('  Write tests  ')).toBe(true);
      expect(service.todos().at(-1)).toEqual({ id: 3, description: 'Write tests', completed: false });
    });

    it.each(['', '   ', '\n\t'])('ignores blank input %j and returns false', (text) => {
      expect(service.addTask(text)).toBe(false);
      expect(service.total()).toBe(2);
    });

    it('never reuses an id after a delete', () => {
      service.addTask('three'); // id 3
      service.deleteTask(1);
      service.addTask('four');
      expect(service.todos().map((t) => t.id)).toEqual([2, 3, 4]);
    });

    it('replaces the array (new reference) instead of mutating it', () => {
      const before = service.todos();
      service.addTask('x');
      expect(service.todos()).not.toBe(before);
      expect(before).toHaveLength(2);
    });
  });

  describe('toggleCompleted', () => {
    it('flips only the targeted todo, and only that todo gets a new object', () => {
      const [first, second] = service.todos();
      service.toggleCompleted(1);

      const [newFirst, newSecond] = service.todos();
      expect(newFirst.completed).toBe(true);
      expect(newFirst).not.toBe(first);
      expect(newSecond).toBe(second); // untouched item keeps its reference -> OnPush child is skipped
    });

    it('moves the todo between the active and completed lists', () => {
      service.toggleCompleted(1);
      expect(service.activeTodos()).toHaveLength(0);
      expect(service.completedTodos().map((t) => t.id)).toEqual([1, 2]);

      service.toggleCompleted(2);
      expect(service.activeTodos().map((t) => t.id)).toEqual([2]);
    });

    it('does nothing for an unknown id', () => {
      service.toggleCompleted(99);
      expect(service.completedCount()).toBe(1);
    });
  });

  describe('deleteTask', () => {
    it('removes the todo and updates the derived numbers', () => {
      service.deleteTask(2);
      expect(service.todos().map((t) => t.id)).toEqual([1]);
      expect(service.completedCount()).toBe(0);
      expect(service.progress()).toBe(0);
    });

    it('gives progress 0 (not NaN) for an empty list', () => {
      service.deleteTask(1);
      service.deleteTask(2);
      expect(service.total()).toBe(0);
      expect(service.progress()).toBe(0);
    });
  });

  describe('progress', () => {
    it('is a rounded whole percentage', () => {
      service.addTask('three'); // 1 of 3 done
      expect(service.progress()).toBe(33);
      service.toggleCompleted(1); // 2 of 3
      expect(service.progress()).toBe(67);
    });
  });

  describe('computed() caching', () => {
    it('returns the very same array until the list changes (so OnPush inputs stay stable)', () => {
      expect(service.activeTodos()).toBe(service.activeTodos());

      const before = service.activeTodos();
      service.addTask('new');
      expect(service.activeTodos()).not.toBe(before);
    });
  });
});
