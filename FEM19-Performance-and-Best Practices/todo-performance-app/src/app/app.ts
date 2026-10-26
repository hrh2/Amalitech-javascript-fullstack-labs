import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription, of } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TodoService } from './core/services/todo.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-xl mx-auto p-4 bg-gray-50 min-h-screen">
      <header class="text-center mb-8">
        <h1 class="text-3xl font-extrabold text-gray-800" [innerHTML]="welcomeMessage"></h1>
        <p class="text-gray-500 mt-1">A legacy app built for refactoring practice</p>
      </header>

      <div class="flex mb-8">
        <input
          [(ngModel)]="newTaskDescription"
          (keyup.enter)="addTask()"
          placeholder="What needs to be done? (Try adding a script tag!)"
          class="flex-grow p-3 border border-gray-300 rounded-l-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          (click)="addTask()"
          class="px-5 py-3 bg-gray-800 text-white font-semibold rounded-r-lg hover:bg-black transition duration-150"
        >
          Add
        </button>
      </div>

      <div class="bg-white p-6 rounded-xl shadow-lg mb-8 border border-gray-200">
        <div class="flex justify-around items-center text-center mb-4">
          <div class="p-2">
            <div class="text-3xl font-bold text-gray-800">{{ todoService.total() }}</div>
            <div class="text-sm text-gray-500">Total</div>
          </div>
          <div class="p-2">
            <div class="text-3xl font-bold text-green-600">{{ todoService.completedCount() }}</div>
            <div class="text-sm text-gray-500">Completed</div>
          </div>
          <div class="p-2">
            <div class="text-3xl font-bold text-red-500">{{ todoService.pendingCount() }}</div>
            <div class="text-sm text-gray-500">Pending</div>
          </div>
        </div>

        <div class="mt-4">
          <div class="flex justify-between items-center mb-1">
            <span class="text-sm font-medium text-gray-700">Progress</span>
            <span class="text-sm font-semibold text-gray-700">{{ todoService.progress() }}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2.5">
            <div
              class="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
              [style.width.%]="todoService.progress()"
            ></div>
          </div>
        </div>
      </div>

      <h2 class="text-xl font-semibold text-gray-800 mb-4">Active ({{ todoService.pendingCount() }})</h2>
      <div class="space-y-3 mb-8">
        @for (todo of todoService.activeTodos(); track todo.id) {
          <div
            class="flex items-center justify-between bg-white p-4 rounded-xl shadow-md transition duration-150 border border-gray-100 hover:shadow-lg"
          >
            <label class="flex items-center cursor-pointer flex-grow">
              <input
                type="checkbox"
                [checked]="todo.completed"
                (change)="todoService.toggleCompleted(todo.id)"
                class="form-checkbox h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 mr-4"
              />
              <span class="text-gray-700" [innerHTML]="todo.description"></span>
            </label>
            <button
              (click)="todoService.deleteTask(todo.id)"
              class="ml-4 text-sm text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50 transition duration-150"
            >
              Delete
            </button>
          </div>
        }
        <div
          *ngIf="todoService.pendingCount() === 0 && todoService.total() > 0"
          class="text-center text-gray-500 p-4"
        >
          All caught up!
        </div>
      </div>

      <h2 class="text-xl font-semibold text-gray-800 mb-4">
        Completed ({{ todoService.completedCount() }})
      </h2>
      <div class="space-y-3">
        @for (todo of todoService.completedTodos(); track todo.id) {
          <div
            class="flex items-center justify-between bg-white p-4 rounded-xl shadow-md transition duration-150 border border-gray-100 opacity-70"
          >
            <label class="flex items-center cursor-pointer flex-grow">
              <input
                type="checkbox"
                [checked]="todo.completed"
                (change)="todoService.toggleCompleted(todo.id)"
                class="form-checkbox h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 mr-4"
              />
              <span class="text-gray-700 line-through" [innerHTML]="todo.description"></span>
            </label>
            <button
              (click)="todoService.deleteTask(todo.id)"
              class="ml-4 text-sm text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50 transition duration-150"
            >
              Delete
            </button>
          </div>
        }
        <div
          *ngIf="todoService.completedCount() === 0 && todoService.total() > 0"
          class="text-center text-gray-500 p-4"
        >
          No completed tasks yet.
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .form-checkbox {
        appearance: none;
        display: inline-block;
        border: 2px solid #d1d5db;
        border-radius: 0.25rem;
        width: 1.25rem;
        height: 1.25rem;
        background-color: #fff;
        cursor: pointer;
        position: relative;
      }
      .form-checkbox:checked {
        background-color: #4f46e5;
        border-color: #4f46e5;
      }
      .form-checkbox:checked::after {
        content: '';
        position: absolute;
        top: 2px;
        left: 4px;
        width: 5px;
        height: 10px;
        border: solid white;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
      }
    `,
  ],
})
export class App implements OnInit, OnDestroy {
  private sanitizer = inject(DomSanitizer);
  protected readonly todoService = inject(TodoService);

  public newTaskDescription = signal('');
  public welcomeMessage: SafeHtml = 'Todo App';

  private welcomeSub: Subscription | undefined;

  constructor() {
    console.log('App component initialized (Monolithic Structure)');
  }

  private simulateFetchWelcomeMessage(): Observable<string> {
    console.log('API Call: Fetching welcome message (no caching)');
    return of(
      '<span style="color: #4f46e5; font-weight: bold;">My Refactoring App (Sanitized)</span><script>console.warn("SECURITY WARNING: XSS vulnerability active in header!");</script>'
    );
  }

  ngOnInit(): void {
    this.welcomeSub = this.simulateFetchWelcomeMessage().subscribe((message: string) => {
      this.welcomeMessage = this.sanitizer.bypassSecurityTrustHtml(message);
    });
  }

  ngOnDestroy(): void {
    if (this.welcomeSub) {
      this.welcomeSub.unsubscribe();
      console.log('RxJS: Welcome message manually unsubscribed in ngOnDestroy.');
    }
  }

  public addTask(): void {
    if (this.todoService.addTask(this.newTaskDescription())) {
      this.newTaskDescription.set('');
    }
  }
}
