import { Routes } from '@angular/router';
import { BoardListComponent } from './pages/board-list/board-list.component';
import { LoginComponent } from './pages/login/login.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Bonus task: redirect the default route to the boards list.
  { path: '', pathMatch: 'full', redirectTo: 'boards' },

  { path: 'boards', component: BoardListComponent },

  // The whole "board" feature area (board detail + nested task detail) is
  // lazy-loaded: its code is only downloaded the first time a user actually
  // navigates into a specific board, per Task 6 of the lab spec.
  {
    path: 'boards/:boardId',
    canActivate: [authGuard],
    loadChildren: () => import('./features/board/board.routes').then((m) => m.BOARD_ROUTES),
  },

  { path: 'settings', component: SettingsComponent, canActivate: [authGuard] },

  { path: 'login', component: LoginComponent },

  // Wildcard route: must stay last so every more specific route above it
  // gets a chance to match first.
  { path: '**', component: NotFoundComponent },
];
