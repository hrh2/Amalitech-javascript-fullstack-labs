import { Routes } from '@angular/router';
import { BoardDetailComponent } from './board-detail/board-detail.component';
import { TaskDetailComponent } from './task-detail/task-detail.component';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

// Lazily loaded via app.routes.ts's loadChildren for 'boards/:boardId'.
// '' here means "boards/:boardId itself" - BoardDetailComponent renders
// the board's layout and owns its own <router-outlet> for the nested
// 'tasks/:taskId' child route below.
export const BOARD_ROUTES: Routes = [
  {
    path: '',
    component: BoardDetailComponent,
    children: [
      {
        path: 'tasks/:taskId',
        component: TaskDetailComponent,
        canDeactivate: [unsavedChangesGuard],
      },
    ],
  },
];
