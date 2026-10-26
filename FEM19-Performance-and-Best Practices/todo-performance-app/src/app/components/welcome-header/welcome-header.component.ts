import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SanitizeHtmlPipe } from '../../core/pipes/sanitize-html.pipe';
import { WelcomeService } from '../../core/services/welcome.service';

@Component({
  selector: 'app-welcome-header',
  imports: [AsyncPipe, SanitizeHtmlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="text-center mb-8">
      <!-- async subscribes and unsubscribes for us, and marks this OnPush component for check when the value arrives -->
      <h1 class="text-3xl font-extrabold text-gray-800" [innerHTML]="(message$ | async) ?? 'Todo App' | sanitizeHtml"></h1>
      <p class="text-gray-500 mt-1">A legacy app built for refactoring practice</p>
    </header>
  `,
})
export class WelcomeHeaderComponent {
  protected readonly message$ = inject(WelcomeService).message$;
}
