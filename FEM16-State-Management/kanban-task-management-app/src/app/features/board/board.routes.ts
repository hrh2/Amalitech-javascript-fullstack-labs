import { Routes } from '@angular/router';
import { BoardDetailComponent } from './board-detail/board-detail.component';
import { AddTaskComponent } from './add-task/add-task.component';
import { EditTaskComponent } from './edit-task/edit-task.component';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

// Lazily loaded via app.routes.ts's loadChildren for 'boards/:boardId'.
// '' here means "boards/:boardId itself" - BoardDetailComponent renders
// the board's layout and owns its own <router-outlet> for the nested
// 'new-task' / 'edit/:taskId' child routes below (FEM13 Task 2).
export const BOARD_ROUTES: Routes = [
  {
    path: '',
    component: BoardDetailComponent,
    children: [
      {
        path: 'new-task',
        component: AddTaskComponent,
        canDeactivate: [unsavedChangesGuard],
      },
      {
        path: 'edit/:taskId',
        component: EditTaskComponent,
        canDeactivate: [unsavedChangesGuard],
      },
    ],
  },
];
