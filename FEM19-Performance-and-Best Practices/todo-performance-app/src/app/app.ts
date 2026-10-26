import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AddTodoFormComponent } from './components/add-todo-form/add-todo-form.component';
import { TodoSectionComponent } from './components/todo-section/todo-section.component';
import { TodoStatsComponent } from './components/todo-stats/todo-stats.component';
import { WelcomeHeaderComponent } from './components/welcome-header/welcome-header.component';
import { TodoService } from './core/services/todo.service';

/** Page shell: wires the service's signals into small presentational components. */
@Component({
  selector: 'app-root',
  imports: [WelcomeHeaderComponent, AddTodoFormComponent, TodoStatsComponent, TodoSectionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
})
export class App {
  protected readonly todoService = inject(TodoService);
}
