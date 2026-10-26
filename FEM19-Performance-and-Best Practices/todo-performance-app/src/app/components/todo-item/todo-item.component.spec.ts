import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Todo } from '../../core/models/todo.model';
import { TodoItemComponent } from './todo-item.component';

describe('TodoItemComponent', () => {
  let fixture: ComponentFixture<TodoItemComponent>;
  let el: HTMLElement;
  const todo: Todo = { id: 7, description: 'Write tests', completed: false };

  function render(value: Todo) {
    fixture.componentRef.setInput('todo', value);
    fixture.detectChanges();
  }

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    fixture = TestBed.createComponent(TodoItemComponent);
    el = fixture.nativeElement;
  });

  afterEach(() => jest.restoreAllMocks());

  it('is an OnPush component', () => {
    expect((TodoItemComponent as any).ɵcmp.onPush).toBe(true);
  });

  it('shows the description and an unchecked box for an active todo', () => {
    render(todo);
    expect(el.querySelector('span')!.textContent).toBe('Write tests');
    expect(el.querySelector<HTMLInputElement>('input')!.checked).toBe(false);
    expect(el.querySelector('span')!.classList).not.toContain('line-through');
  });

  it('shows a checked box, strike-through and faded style for a completed todo', () => {
    render({ ...todo, completed: true });
    expect(el.querySelector<HTMLInputElement>('input')!.checked).toBe(true);
    expect(el.querySelector('span')!.classList).toContain('line-through');
    expect(el.firstElementChild!.classList).toContain('opacity-70');
  });

  it('updates when the input is replaced with a new object (the OnPush trigger)', () => {
    render(todo);
    render({ ...todo, description: 'Renamed' });
    expect(el.querySelector('span')!.textContent).toBe('Renamed');
  });

  it('emits the id when the checkbox changes', () => {
    render(todo);
    const spy = jest.fn();
    fixture.componentInstance.toggle.subscribe(spy);
    el.querySelector<HTMLInputElement>('input')!.dispatchEvent(new Event('change'));
    expect(spy).toHaveBeenCalledWith(7);
  });

  it('emits the id when Delete is clicked', () => {
    render(todo);
    const spy = jest.fn();
    fixture.componentInstance.remove.subscribe(spy);
    el.querySelector('button')!.click();
    expect(spy).toHaveBeenCalledWith(7);
  });

  describe('XSS', () => {
    it('does not render a script or an inline event handler from the description', () => {
      render({ ...todo, description: 'Buy <img src=x onerror="alert(1)"> milk<script>alert(2)</script>' });
      const span = el.querySelector('span')!;
      expect(span.querySelector('script')).toBeNull();
      expect(span.querySelector('img')?.hasAttribute('onerror') ?? false).toBe(false);
      expect(span.textContent).toContain('Buy');
      expect(span.textContent).toContain('milk');
    });

    it('shows a placeholder when nothing safe is left of the description', () => {
      render({ ...todo, description: '<script>alert(1)</script>' });
      expect(el.querySelector('span')!.textContent).toBe('(content removed for safety)');
    });
  });
});
