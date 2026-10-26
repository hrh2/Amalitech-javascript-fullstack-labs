import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-todo-stats',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white p-6 rounded-xl shadow-lg mb-8 border border-gray-200">
      <div class="flex justify-around items-center text-center mb-4">
        <div class="p-2">
          <div class="text-3xl font-bold text-gray-800">{{ total() }}</div>
          <div class="text-sm text-gray-500">Total</div>
        </div>
        <div class="p-2">
          <div class="text-3xl font-bold text-green-600">{{ completed() }}</div>
          <div class="text-sm text-gray-500">Completed</div>
        </div>
        <div class="p-2">
          <div class="text-3xl font-bold text-red-500">{{ pending() }}</div>
          <div class="text-sm text-gray-500">Pending</div>
        </div>
      </div>

      <div class="mt-4">
        <div class="flex justify-between items-center mb-1">
          <span class="text-sm font-medium text-gray-700">Progress</span>
          <span class="text-sm font-semibold text-gray-700">{{ progress() }}%</span>
        </div>
        <div
          class="w-full bg-gray-200 rounded-full h-2.5"
          role="progressbar"
          aria-label="Completed tasks"
          aria-valuemin="0"
          aria-valuemax="100"
          [attr.aria-valuenow]="progress()"
        >
          <div
            class="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
            [style.width.%]="progress()"
          ></div>
        </div>
      </div>
    </div>
  `,
})
export class TodoStatsComponent {
  readonly total = input.required<number>();
  readonly completed = input.required<number>();
  readonly pending = input.required<number>();
  /** Whole-number percentage, 0-100. */
  readonly progress = input.required<number>();
}
