import { TestBed } from '@angular/core/testing';
import { WelcomeHeaderComponent } from './welcome-header.component';

describe('WelcomeHeaderComponent', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('is an OnPush component', () => {
    expect((WelcomeHeaderComponent as any).ɵcmp.onPush).toBe(true);
  });

  it('shows "Todo App" until the message arrives, then the sanitised message (async pipe marks the OnPush view dirty)', () => {
    const fixture = TestBed.createComponent(WelcomeHeaderComponent);
    fixture.detectChanges();
    const h1 = fixture.nativeElement.querySelector('h1') as HTMLElement;
    expect(h1.textContent).toBe('Todo App');

    jest.advanceTimersByTime(300);
    fixture.detectChanges();

    expect(h1.textContent).toBe('My Refactoring App (Sanitized)');
    expect(h1.querySelector('script')).toBeNull();
    expect(h1.querySelector('span')!.classList).toContain('text-indigo-600');
  });
});
