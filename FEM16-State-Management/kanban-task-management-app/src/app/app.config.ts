import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withRouterConfig } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { routes } from './app.routes';
import { boardReducer } from './state/board/board.reducer';
import { BoardEffects } from './state/board/board.effects';

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

    // The 'board' key here is the exact string createFeatureSelector<BoardState>('board')
    // (state/board/board.selectors.ts) reads back out of the store.
    provideStore({ board: boardReducer }),
    provideEffects([BoardEffects]),
    // logOnly in production: DevTools stays wired up for inspection but
    // won't accept dispatches from the extension outside a dev build.
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode(), connectInZone: true }),
  ]
};
