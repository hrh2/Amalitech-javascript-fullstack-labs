import { TestBed } from '@angular/core/testing';
import { WelcomeService } from './welcome.service';

describe('WelcomeService', () => {
  let service: WelcomeService;
  let log: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    TestBed.configureTestingModule({});
    service = TestBed.inject(WelcomeService);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const apiCalls = () => log.mock.calls.filter(([m]) => String(m).startsWith('API Call')).length;

  it('is lazy: nothing is fetched until somebody subscribes', () => {
    jest.advanceTimersByTime(1000);
    expect(apiCalls()).toBe(0);
  });

  it('runs the underlying "API call" only once for many subscribers, who all get the same value', () => {
    const received: string[] = [];
    service.message$.subscribe((m) => received.push(m));
    service.message$.subscribe((m) => received.push(m));
    service.message$.subscribe((m) => received.push(m));

    jest.advanceTimersByTime(300);

    expect(apiCalls()).toBe(1);
    expect(received).toHaveLength(3);
    expect(new Set(received).size).toBe(1);
  });

  it('replays the cached value to a late subscriber without calling the API again', () => {
    service.message$.subscribe();
    jest.advanceTimersByTime(300);

    const late = jest.fn();
    service.message$.subscribe(late);

    expect(late).toHaveBeenCalledTimes(1); // immediately, no timer needed
    expect(apiCalls()).toBe(1);
  });

  it('keeps the cache after every subscriber has left (refCount: false)', () => {
    const first = service.message$.subscribe();
    jest.advanceTimersByTime(300);
    first.unsubscribe();

    service.message$.subscribe();
    jest.advanceTimersByTime(300);

    expect(apiCalls()).toBe(1);
  });

  it('answers after the simulated latency, not before', () => {
    const received = jest.fn();
    service.message$.subscribe(received);

    jest.advanceTimersByTime(299);
    expect(received).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(received).toHaveBeenCalledTimes(1);
  });
});
