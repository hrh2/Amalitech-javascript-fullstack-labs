import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withRouterConfig } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    // 'always' makes a child route's paramMap include its ancestors'
    // params too (e.g. AddTaskComponent/EditTaskComponent can read
    // :boardId from the 'boards/:boardId' route they're nested under).
    provideRouter(routes, withRouterConfig({ paramsInheritanceStrategy: 'always' })),

    // Makes HttpClient injectable. Interceptors run in the order listed on
    // the way out (auth first) and in reverse on the way back.
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
  ]
};
