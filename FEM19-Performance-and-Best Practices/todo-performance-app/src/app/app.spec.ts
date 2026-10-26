import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { TodoService } from './core/services/todo.service';

/** The whole page: real service, real child components, only timers faked. */
describe('App', () => {
  let el: HTMLElement;
  let fixture: ReturnType<typeof TestBed.createComponent<App>>;

  const rows = (heading: string) =>
    Array.from(el.querySelectorAll('app-todo-section'))
      .find((s) => s.querySelector('h2')!.textContent!.startsWith(heading))!
      .querySelectorAll('app-todo-item');
  const typeAndAdd = async (text: string) => {
    const input = el.querySelector<HTMLInputElement>('input[aria-label="New task description"]')!;
    input.value = text;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    el.querySelector<HTMLButtonElement>('app-add-todo-form button')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    fixture = TestBed.createComponent(App);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => jest.restoreAllMocks());

  it('is an OnPush component', () => {
    expect((App as any).ɵcmp.onPush).toBe(true);
  });

  it('shows the seed todos split into Active and Completed, with stats', () => {
    expect(rows('Active')).toHaveLength(1);
    expect(rows('Completed')).toHaveLength(1);
    expect(el.querySelector('app-todo-stats')!.textContent).toContain('50%');
  });

  it('adding a task through the form updates the list and the stats (OnPush parent and children still refresh)', async () => {
    await typeAndAdd('Ship it');

    expect(rows('Active')).toHaveLength(2);
    expect(el.textContent).toContain('Ship it');
    expect(el.querySelector('app-todo-stats')!.textContent).toMatch(/3\s*Total/);
    expect(el.querySelector('app-todo-stats')!.textContent).toContain('33%');
  });

  it('ticking a task moves it to Completed and updates stats and the empty message', () => {
    el.querySelector<HTMLInputElement>('app-todo-section input[type="checkbox"]')!.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(rows('Active')).toHaveLength(0);
    expect(rows('Completed')).toHaveLength(2);
    expect(el.textContent).toContain('All caught up!');
    expect(el.querySelector('app-todo-stats')!.textContent).toContain('100%');
  });

  it('deleting a task removes it', () => {
    el.querySelector<HTMLButtonElement>('app-todo-section button')!.click();
    fixture.detectChanges();
    expect(rows('Active')).toHaveLength(0);
    expect(el.textContent).toContain('All caught up!');
  });

  it('a malicious task description is rendered inert', async () => {
    await typeAndAdd('<img src=x onerror="window.__pwned = true"><script>window.__pwned = true</script>Pay rent');

    expect(el.textContent).toContain('Pay rent');
    expect(el.querySelector('script')).toBeNull();
    expect(el.querySelector('[onerror]')).toBeNull();
    expect((window as unknown as { __pwned?: boolean }).__pwned).toBeUndefined();
  });

  it('shows the empty-state messages for an emptied list only when something existed', () => {
    const service = TestBed.inject(TodoService);
    service.deleteTask(1);
    service.deleteTask(2);
    fixture.detectChanges();

    expect(el.textContent).not.toContain('All caught up!');
    expect(el.textContent).not.toContain('No completed tasks yet.');
  });
});
