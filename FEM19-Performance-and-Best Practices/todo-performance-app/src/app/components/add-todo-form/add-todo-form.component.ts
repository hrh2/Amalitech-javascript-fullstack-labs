import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-todo-form',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex mb-8">
      <input
        [(ngModel)]="description"
        (keyup.enter)="submit()"
        placeholder="What needs to be done? (Try adding a script tag!)"
        aria-label="New task description"
        class="flex-grow p-3 border border-gray-300 rounded-l-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <button
        type="button"
        (click)="submit()"
        class="px-5 py-3 bg-gray-800 text-white font-semibold rounded-r-lg hover:bg-black transition duration-150"
      >
        Add
      </button>
    </div>
  `,
})
export class AddTodoFormComponent {
  /** Local UI state: only this form cares what is being typed. */
  protected readonly description = signal('');

  readonly add = output<string>();

  protected submit(): void {
    const text = this.description().trim();
    if (!text) {
      return;
    }
    this.add.emit(text);
    this.description.set('');
  }
}
