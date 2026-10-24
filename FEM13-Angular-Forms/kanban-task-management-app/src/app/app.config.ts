import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withRouterConfig } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    // 'always' makes a child route's paramMap include its ancestors'
    // params too (e.g. AddTaskComponent/EditTaskComponent can read
    // :boardId from the 'boards/:boardId' route they're nested under, not
    // just their own :taskId) - without it, only routes with an empty
    // path inherit parent params, which breaks the two-level board/task
    // nesting here.
    provideRouter(routes, withRouterConfig({ paramsInheritanceStrategy: 'always' })),
  ]
};
