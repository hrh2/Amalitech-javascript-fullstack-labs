import { TestBed } from '@angular/core/testing';
import { TodoStatsComponent } from './todo-stats.component';

describe('TodoStatsComponent', () => {
  function render(values: { total: number; completed: number; pending: number; progress: number }) {
    const fixture = TestBed.createComponent(TodoStatsComponent);
    Object.entries(values).forEach(([name, value]) => fixture.componentRef.setInput(name, value));
    fixture.detectChanges();
    return fixture;
  }

  it('is an OnPush component', () => {
    expect((TodoStatsComponent as any).ɵcmp.onPush).toBe(true);
  });

  it('shows the three counts and the percentage', () => {
    const el: HTMLElement = render({ total: 4, completed: 1, pending: 3, progress: 25 }).nativeElement;
    const text = el.textContent!;
    expect(text).toMatch(/4\s*Total/);
    expect(text).toMatch(/1\s*Completed/);
    expect(text).toMatch(/3\s*Pending/);
    expect(text).toContain('25%');
  });

  it('sizes the bar from the progress and exposes it to assistive technology', () => {
    const el: HTMLElement = render({ total: 4, completed: 3, pending: 1, progress: 75 }).nativeElement;
    expect(el.querySelector<HTMLElement>('.bg-indigo-600')!.style.width).toBe('75%');
    const bar = el.querySelector('[role="progressbar"]')!;
    expect(bar.getAttribute('aria-valuenow')).toBe('75');
  });

  it('re-renders when an input changes', () => {
    const fixture = render({ total: 1, completed: 0, pending: 1, progress: 0 });
    fixture.componentRef.setInput('progress', 100);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('100%');
  });
});
