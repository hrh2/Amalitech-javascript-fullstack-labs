# Angular & TypeScript — Essential Implementation Reference

Practical, runnable code patterns for the technical/hands-on part of the interview. Organized so you can jump straight to what you need. Each section is self-contained — copy, adapt, explain out loud.

---

## 1. TypeScript Essentials

### Interfaces vs Types
```typescript
interface User {
  id: number;
  name: string;
  email?: string;        // optional
  readonly createdAt: Date; // can't be reassigned after creation
}

type Status = 'pending' | 'active' | 'archived'; // union type
type UserWithStatus = User & { status: Status };  // intersection

// Interfaces: better for object shapes that might be extended/merged.
// Types: better for unions, tuples, mapped/conditional types.
```

### Generics
```typescript
function firstItem<T>(items: T[]): T | undefined {
  return items[0];
}

interface ApiResponse<T> {
  data: T;
  error: string | null;
}

class Repository<T extends { id: number }> {
  private items: T[] = [];
  add(item: T): void { this.items.push(item); }
  findById(id: number): T | undefined {
    return this.items.find(i => i.id === id);
  }
}
```

### Utility Types (commonly asked)
```typescript
interface User { id: number; name: string; email: string; }

type PartialUser = Partial<User>;         // all props optional
type RequiredUser = Required<User>;       // all props required
type UserPreview = Pick<User, 'id' | 'name'>;   // subset of props
type UserWithoutEmail = Omit<User, 'email'>;    // exclude a prop
type ReadonlyUser = Readonly<User>;       // immutable
type UserRecord = Record<string, User>;   // key-value map shape
```

### Type Guards & Narrowing
```typescript
interface Cat { kind: 'cat'; meow(): void; }
interface Dog { kind: 'dog'; bark(): void; }
type Pet = Cat | Dog;

function isCat(pet: Pet): pet is Cat {
  return pet.kind === 'cat';
}

function handle(pet: Pet) {
  if (isCat(pet)) {
    pet.meow(); // TypeScript knows it's a Cat here
  } else {
    pet.bark();
  }
}
```

### Enums vs Union Literal Types
```typescript
enum Role { Admin = 'ADMIN', User = 'USER' }

// Often preferred in modern TS — no runtime object, better tree-shaking:
type RoleLiteral = 'ADMIN' | 'USER';
```

### Optional Chaining & Nullish Coalescing
```typescript
const city = user?.address?.city ?? 'Unknown'; // safe access + default
```

---

## 2. Core JavaScript Patterns Worth Having Ready

### Closures
```javascript
function counter() {
  let count = 0;
  return () => ++count; // closure retains access to `count`
}
const increment = counter();
increment(); // 1
increment(); // 2
```

### Debounce (from scratch — commonly asked to implement live)
```typescript
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
```

### Throttle
```typescript
function throttle<T extends (...args: any[]) => void>(fn: T, limit: number) {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
```

### Deep Clone
```typescript
const original = { a: 1, nested: { b: 2 } };
const shallow = { ...original };              // nested still shared
const deep = structuredClone(original);       // fully independent (modern browsers/Node 17+)
```

### Array Methods Cheat Sheet
```javascript
arr.map(x => x * 2);              // transform
arr.filter(x => x > 5);           // subset
arr.reduce((acc, x) => acc + x, 0); // aggregate
arr.find(x => x.id === 3);        // first match
arr.some(x => x > 10);            // any match?
arr.every(x => x > 0);            // all match?
[...new Set(arr)];                // unique values
arr.flatMap(x => [x, x * 2]);     // map + flatten
```

### Async/Await + Error Handling
```typescript
async function loadUser(id: number): Promise<User | null> {
  try {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to load user', err);
    return null;
  }
}
```

### Promise.all vs allSettled
```typescript
const results = await Promise.all([p1, p2, p3]); // rejects if any fails
const outcomes = await Promise.allSettled([p1, p2, p3]);
// [{status: 'fulfilled', value}, {status: 'rejected', reason}, ...]
```

---

## 3. Angular Components — Modern Standalone Style

### Basic Standalone Component
```typescript
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card" (click)="select.emit(user.id)">
      <h3>{{ user.name }}</h3>
      <p *ngIf="user.email">{{ user.email }}</p>
    </div>
  `
})
export class UserCardComponent {
  @Input({ required: true }) user!: { id: number; name: string; email?: string };
  @Output() select = new EventEmitter<number>();
}
```

### Lifecycle Hooks (order matters — common interview ask)
```typescript
import { Component, OnInit, OnChanges, OnDestroy, SimpleChanges, AfterViewInit } from '@angular/core';

@Component({ /* ... */ })
export class ExampleComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  ngOnChanges(changes: SimpleChanges): void {
    // Runs BEFORE ngOnInit, and on every @Input() change after that
  }
  ngOnInit(): void {
    // Runs once, after first ngOnChanges — good place to fetch initial data
  }
  ngAfterViewInit(): void {
    // View + child components are now available (ViewChild refs populated)
  }
  ngOnDestroy(): void {
    // Cleanup: unsubscribe, clear timers/intervals
  }
}
// Order: constructor → ngOnChanges → ngOnInit → ngAfterContentInit →
//        ngAfterViewInit → ... → ngOnDestroy
```

### ViewChild / ContentChild
```typescript
import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-search',
  standalone: true,
  template: `<input #searchInput type="text" />`
})
export class SearchComponent implements AfterViewInit {
  @ViewChild('searchInput') inputRef!: ElementRef<HTMLInputElement>;

  ngAfterViewInit(): void {
    this.inputRef.nativeElement.focus();
  }
}
```

---

## 4. Component Communication Patterns

### Parent → Child (Input) / Child → Parent (Output)
```typescript
// Child
@Component({
  selector: 'app-child',
  standalone: true,
  template: `<button (click)="notify.emit('clicked')">Go</button>`
})
export class ChildComponent {
  @Input() label = '';
  @Output() notify = new EventEmitter<string>();
}

// Parent template
// <app-child [label]="parentLabel" (notify)="onNotify($event)" />
```

### Shared Service (for unrelated components)
```typescript
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private _count = signal(0);
  readonly count = this._count.asReadonly(); // expose read-only

  increment(): void { this._count.update(c => c + 1); }
  reset(): void { this._count.set(0); }
}

// Any component can inject and read/update through the controlled API:
// constructor(private notifications: NotificationService) {}
```

---

## 5. Dependency Injection

```typescript
import { Injectable, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  log(msg: string): void { console.log(`[LOG] ${msg}`); }
}

@Component({ /* ... */ })
export class SomeComponent {
  // Modern function-based injection (Angular 14+):
  private logger = inject(LoggerService);

  // Classic constructor injection (still valid, common in older code):
  // constructor(private logger: LoggerService) {}
}
```

### Injection Tokens (for non-class dependencies, e.g., config)
```typescript
import { InjectionToken } from '@angular/core';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

// In providers: { provide: API_BASE_URL, useValue: 'https://api.example.com' }
// Usage: private baseUrl = inject(API_BASE_URL);
```

---

## 6. Routing

### Route Config with Lazy Loading
```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component')
      .then(m => m.DashboardComponent),
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: '' }, // wildcard fallback
];
```

### Functional Route Guard
```typescript
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;
  router.navigate(['/login']);
  return false;
};
```

### Route Params & Query Params
```typescript
import { ActivatedRoute } from '@angular/router';

export class UserDetailComponent {
  private route = inject(ActivatedRoute);
  userId$ = this.route.paramMap.pipe(map(params => params.get('id')));
  // For query params: this.route.queryParamMap
}
```

---

## 7. Forms

### Reactive Form with Validation
```typescript
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <input formControlName="email" />
      <div *ngIf="form.get('email')?.invalid && form.get('email')?.touched">
        Invalid email
      </div>
      <button [disabled]="form.invalid">Submit</button>
    </form>
  `
})
export class SignupComponent {
  private fb = inject(FormBuilder);

  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  onSubmit(): void {
    if (this.form.valid) {
      console.log(this.form.value);
    }
  }
}
```

### Custom Validator (sync)
```typescript
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function noWhitespaceValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const isWhitespace = (control.value || '').trim().length === 0;
    return isWhitespace ? { whitespace: true } : null;
  };
}
```

### Async Validator (e.g., username availability)
```typescript
import { AsyncValidatorFn } from '@angular/forms';
import { map, catchError, of } from 'rxjs';

export function usernameTakenValidator(api: UserApiService): AsyncValidatorFn {
  return (control) =>
    control.valueChanges ? // (illustrative — usually wired via control.value + debounce upstream)
    api.checkUsername(control.value).pipe(
      map(taken => (taken ? { usernameTaken: true } : null)),
      catchError(() => of(null))
    ) : of(null);
}
```

---

## 8. RxJS & Observables

### Subject vs BehaviorSubject vs ReplaySubject
```typescript
import { Subject, BehaviorSubject, ReplaySubject } from 'rxjs';

const subject = new Subject<number>();          // no initial value, no replay
const behavior = new BehaviorSubject<number>(0); // has current value, emits it immediately on subscribe
const replay = new ReplaySubject<number>(2);     // replays last N values to new subscribers
```

### Common Operators
```typescript
import { of, interval } from 'rxjs';
import { map, filter, debounceTime, distinctUntilChanged, switchMap, catchError, tap } from 'rxjs/operators';

searchTerm$.pipe(
  debounceTime(300),          // wait for pause in typing
  distinctUntilChanged(),     // skip if value didn't change
  switchMap(term => this.api.search(term)), // cancel previous request on new term
  catchError(err => { console.error(err); return of([]); }),
).subscribe(results => this.results = results);
```

### switchMap vs mergeMap vs concatMap vs exhaustMap
```typescript
// switchMap: cancels previous inner observable — use for search/typeahead
// mergeMap:  runs all inner observables concurrently — use for independent parallel calls
// concatMap: queues inner observables sequentially — use when order matters
// exhaustMap: ignores new emissions while one is in progress — use for "submit" buttons (prevent double-submit)
```

### Unsubscribing Properly
```typescript
import { Subject, takeUntil } from 'rxjs';

@Component({ /* ... */ })
export class ExampleComponent implements OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.someService.data$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => this.data = data);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

// Modern alternative (Angular 16+):
// this.someService.data$.pipe(takeUntilDestroyed()).subscribe(...);
```

### combineLatest / forkJoin
```typescript
import { combineLatest, forkJoin } from 'rxjs';

// combineLatest: re-emits whenever ANY source emits (ongoing streams)
combineLatest([user$, settings$]).subscribe(([user, settings]) => { /* ... */ });

// forkJoin: waits for ALL to complete, emits once (like Promise.all for observables)
forkJoin([this.api.getUser(), this.api.getSettings()]).subscribe(([user, settings]) => { /* ... */ });
```

---

## 9. Angular Signals

```typescript
import { signal, computed, effect } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  template: `
    <p>Count: {{ count() }}</p>
    <p>Doubled: {{ doubled() }}</p>
    <button (click)="increment()">+</button>
  `
})
export class CounterComponent {
  count = signal(0);
  doubled = computed(() => this.count() * 2); // derived, auto-updates

  constructor() {
    effect(() => {
      console.log('Count changed to', this.count()); // side effect, runs on dependency change
    });
  }

  increment(): void {
    this.count.update(c => c + 1); // or this.count.set(newValue)
  }
}
```

### Signal Inputs (Angular 17.1+)
```typescript
import { input, output } from '@angular/core';

@Component({ selector: 'app-child', standalone: true, template: `...` })
export class ChildComponent {
  label = input.required<string>();      // required signal input
  count = input(0);                      // optional with default
  notify = output<string>();             // replaces @Output/EventEmitter
}
```

### toSignal / toObservable (interop)
```typescript
import { toSignal, toObservable } from '@angular/core/rxjs-interop';

const user = toSignal(this.userService.user$, { initialValue: null });
const count$ = toObservable(this.count); // signal -> observable
```

---

## 10. State Management (Lightweight Pattern)

```typescript
import { Injectable, signal, computed } from '@angular/core';

interface CartItem { id: number; name: string; qty: number; }

@Injectable({ providedIn: 'root' })
export class CartStore {
  private items = signal<CartItem[]>([]);

  readonly cartItems = this.items.asReadonly();
  readonly total = computed(() =>
    this.items().reduce((sum, item) => sum + item.qty, 0)
  );

  addItem(item: CartItem): void {
    this.items.update(items => [...items, item]); // new array reference — immutable update
  }

  removeItem(id: number): void {
    this.items.update(items => items.filter(i => i.id !== id));
  }
}
```

---

## 11. HTTP Client

### Basic GET/POST with typed response
```typescript
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private http = inject(HttpClient);
  private baseUrl = '/api/users';

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.baseUrl);
  }

  createUser(user: Partial<User>): Observable<User> {
    return this.http.post<User>(this.baseUrl, user);
  }

  updateUser(id: number, changes: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.baseUrl}/${id}`, changes);
  }
}
```

### HTTP Interceptor (functional, Angular 15+)
```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  const cloned = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(cloned).pipe(
    catchError(err => {
      if (err.status === 401) {
        auth.logout();
      }
      return throwError(() => err);
    })
  );
};

// Registered in app.config.ts:
// provideHttpClient(withInterceptors([authInterceptor]))
```

### Error Handling Pattern
```typescript
this.userApi.getUsers().pipe(
  catchError(err => {
    console.error('Failed to load users', err);
    return of([] as User[]); // fallback so the stream doesn't die
  })
).subscribe(users => this.users = users);
```

---

## 12. Testing

### Component Test (TestBed)
```typescript
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';

describe('UserCardComponent', () => {
  let fixture: ComponentFixture<UserCardComponent>;
  let component: UserCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserCardComponent], // standalone components go in `imports`
    }).compileComponents();

    fixture = TestBed.createComponent(UserCardComponent);
    component = fixture.componentInstance;
    component.user = { id: 1, name: 'Alice' };
    fixture.detectChanges();
  });

  it('should display the user name', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('h3')?.textContent).toContain('Alice');
  });

  it('should emit select on click', () => {
    spyOn(component.select, 'emit');
    fixture.nativeElement.querySelector('.card').click();
    expect(component.select.emit).toHaveBeenCalledWith(1);
  });
});
```

### Service Test with Mocked HttpClient
```typescript
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

describe('UserApiService', () => {
  let service: UserApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserApiService],
    });
    service = TestBed.inject(UserApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify()); // ensures no unexpected requests

  it('should fetch users', () => {
    const mockUsers: User[] = [{ id: 1, name: 'Alice' }];

    service.getUsers().subscribe(users => {
      expect(users).toEqual(mockUsers);
    });

    const req = httpMock.expectOne('/api/users');
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers); // simulate the server response
  });
});
```

### Testing Async Code (fakeAsync/tick)
```typescript
import { fakeAsync, tick } from '@angular/core/testing';

it('should debounce search input', fakeAsync(() => {
  component.onSearchInput('a');
  component.onSearchInput('an');
  component.onSearchInput('ang');
  tick(300); // simulate time passing
  expect(component.searchCallCount).toBe(1); // only the last one fired
}));
```

### Spying / Mocking a Dependency
```typescript
const mockAuthService = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'logout']);
mockAuthService.isLoggedIn.and.returnValue(true);

TestBed.configureTestingModule({
  providers: [{ provide: AuthService, useValue: mockAuthService }],
});
```

---

## 13. Performance Patterns

### OnPush + trackBy
```typescript
@Component({
  selector: 'app-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *ngFor="let item of items; trackBy: trackById">{{ item.name }}</div>
  `
})
export class ListComponent {
  @Input() items: Item[] = [];
  trackById(index: number, item: Item): number { return item.id; }
}
```

### Virtual Scrolling
```typescript
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  standalone: true,
  imports: [ScrollingModule],
  template: `
    <cdk-virtual-scroll-viewport itemSize="50" style="height: 400px">
      <div *cdkVirtualFor="let item of items">{{ item.name }}</div>
    </cdk-virtual-scroll-viewport>
  `
})
export class VirtualListComponent {
  items: Item[] = [];
}
```

### Lazy-Loaded Standalone Component (route-level)
```typescript
{
  path: 'reports',
  loadComponent: () => import('./reports.component').then(m => m.ReportsComponent),
}
```

### Memoization Pattern (for expensive computed values)
```typescript
// With signals, `computed()` already memoizes automatically:
filteredItems = computed(() => 
  this.items().filter(i => i.category === this.selectedCategory())
);
// Only recomputes when `items` or `selectedCategory` actually change.
```

---

## 14. Quick-Reference: Common Pitfalls to Mention Out Loud

| Pitfall | Fix |
|---|---|
| Mutating an array/object instead of replacing it | Use spread (`[...arr]`, `{...obj}`) or `structuredClone` |
| Missing `trackBy` in large `*ngFor` lists | Add `trackBy` to avoid full DOM recreation |
| Manual `.subscribe()` without teardown | Use `async` pipe or `takeUntilDestroyed()` |
| `forEach` with async callback | Use `for...of` + `await`, or `Promise.all` |
| Async validator firing on every keystroke | Combine with `debounceTime` + `switchMap` |
| `any` typing on external API responses | Validate at the boundary (Zod/schema) and derive types from it |
| Calling `setState`/mutating state at a high component level (Flutter parallel) | Scope updates narrowly (ValueListenableBuilder, signals, OnPush) |
| N+1 queries on the backend | Batch fetch with `IN` clause or ORM eager loading |

---

*Tip: in the interview, don't just recite this — pick the relevant snippet, explain what it does and why you'd reach for it, and be ready to adapt it live if asked to modify it (e.g., "now make this handle an error case" or "now make this OnPush-safe").*
