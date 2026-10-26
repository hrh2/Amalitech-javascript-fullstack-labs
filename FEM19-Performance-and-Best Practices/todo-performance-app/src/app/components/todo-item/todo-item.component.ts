import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { SanitizeHtmlPipe } from '../../core/pipes/sanitize-html.pipe';
import { Todo } from '../../core/models/todo.model';

@Component({
  selector: 'app-todo-item',
  imports: [SanitizeHtmlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let item = todo();
    @let safeHtml = item.description | sanitizeHtml;
    <div
      class="flex items-center justify-between bg-white p-4 rounded-xl shadow-md transition duration-150 border border-gray-100"
      [class.hover:shadow-lg]="!item.completed"
      [class.opacity-70]="item.completed"
    >
      <label class="flex items-center cursor-pointer flex-grow">
        <input
          type="checkbox"
          [checked]="item.completed"
          (change)="toggle.emit(item.id)"
          class="form-checkbox h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 mr-4"
        />
        <span class="text-gray-700" [class.line-through]="item.completed" [innerHTML]="safeHtml || '(content removed for safety)'"></span>
      </label>
      <button
        type="button"
        (click)="remove.emit(item.id)"
        class="ml-4 text-sm text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50 transition duration-150"
      >
        Delete
      </button>
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
export class TodoItemComponent {
  readonly todo = input.required<Todo>();

  /** Emit the id so the parent never needs the whole object back. */
  readonly toggle = output<number>();
  readonly remove = output<number>();
}
