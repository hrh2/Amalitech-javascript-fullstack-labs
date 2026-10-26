import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Todo } from '../../core/models/todo.model';
import { TodoSectionComponent } from './todo-section.component';

describe('TodoSectionComponent', () => {
  let fixture: ComponentFixture<TodoSectionComponent>;
  let el: HTMLElement;
  const a: Todo = { id: 1, description: 'A', completed: false };
  const b: Todo = { id: 2, description: 'B', completed: false };

  function set(todos: Todo[], emptyMessage = '') {
    fixture.componentRef.setInput('todos', todos);
    fixture.componentRef.setInput('emptyMessage', emptyMessage);
    fixture.detectChanges();
  }

  beforeEach(() => {
    fixture = TestBed.createComponent(TodoSectionComponent);
    fixture.componentRef.setInput('heading', 'Active');
    el = fixture.nativeElement;
  });

  it('is an OnPush component', () => {
    expect((TodoSectionComponent as any).ɵcmp.onPush).toBe(true);
  });

  it('shows the heading with the item count and one row per todo', () => {
    set([a, b]);
    expect(el.querySelector('h2')!.textContent).toContain('Active (2)');
    expect(el.querySelectorAll('app-todo-item')).toHaveLength(2);
  });

  it('shows the empty message only when the list is empty and a message was given', () => {
    set([], 'All caught up!');
    expect(el.textContent).toContain('All caught up!');

    set([], '');
    expect(el.textContent).not.toContain('All caught up!');

    set([a], 'All caught up!');
    expect(el.textContent).not.toContain('All caught up!');
  });

  it('tracks rows by id: existing DOM is reused when the list gets a new array', () => {
    set([a, b]);
    const rowA = el.querySelectorAll('app-todo-item')[0];
    const rowB = el.querySelectorAll('app-todo-item')[1];

    // A new array (and a new object for b), like the service produces on every change.
    set([a, { ...b, completed: false, description: 'B edited' }, { id: 3, description: 'C', completed: false }]);

    const rows = el.querySelectorAll('app-todo-item');
    expect(rows).toHaveLength(3);
    expect(rows[0]).toBe(rowA);
    expect(rows[1]).toBe(rowB);
    expect(rows[1].textContent).toContain('B edited');
  });

  it('re-emits toggle and remove from its rows', () => {
    set([a]);
    const toggle = jest.fn();
    const remove = jest.fn();
    fixture.componentInstance.toggle.subscribe(toggle);
    fixture.componentInstance.remove.subscribe(remove);

    el.querySelector<HTMLInputElement>('input')!.dispatchEvent(new Event('change'));
    el.querySelector('button')!.click();

    expect(toggle).toHaveBeenCalledWith(1);
    expect(remove).toHaveBeenCalledWith(1);
  });
});
