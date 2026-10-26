import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Todo } from '../../core/models/todo.model';
import { TodoItemComponent } from '../todo-item/todo-item.component';

/** A titled list of todos (used for both "Active" and "Completed"). */
@Component({
  selector: 'app-todo-section',
  imports: [TodoItemComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 class="text-xl font-semibold text-gray-800 mb-4">{{ heading() }} ({{ todos().length }})</h2>
    <div class="space-y-3 mb-8">
      <!-- track by id: an unchanged todo keeps its DOM and component instance when the list changes -->
      @for (todo of todos(); track todo.id) {
        <app-todo-item [todo]="todo" (toggle)="toggle.emit($event)" (remove)="remove.emit($event)" />
      }
      @if (todos().length === 0 && emptyMessage()) {
        <div class="text-center text-gray-500 p-4">{{ emptyMessage() }}</div>
      }
    </div>
  `,
})
export class TodoSectionComponent {
  readonly heading = input.required<string>();
  readonly todos = input.required<readonly Todo[]>();
  /** Shown when the list is empty; pass '' to show nothing. */
  readonly emptyMessage = input('');

  readonly toggle = output<number>();
  readonly remove = output<number>();
}
