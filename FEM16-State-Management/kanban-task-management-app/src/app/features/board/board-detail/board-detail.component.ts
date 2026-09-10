import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subscription, combineLatest } from 'rxjs';
import { Board } from '../../../core/models/board.model';
import { Task, TaskStatus } from '../../../core/models/task.model';
import { selectAllBoards, selectIsLoading } from '../../../state/board/board.selectors';

interface StatusColumn {
  status: TaskStatus;
  label: string;
}

@Component({
  selector: 'app-board-detail',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './board-detail.component.html',
  styleUrl: './board-detail.component.css',
})
export class BoardDetailComponent implements OnInit, OnDestroy {
  board?: Board;
  boardId!: number;
  previousBoardId?: number;
  nextBoardId?: number;
  isLoading = true;

  // Same Kanban-column grouping as the Routing & Navigation module's board
  // detail view - just a different display of the same `board.tasks`.
  readonly statusColumns: StatusColumn[] = [
    { status: 'todo', label: 'To do' },
    { status: 'in-progress', label: 'In progress' },
    { status: 'done', label: 'Done' },
  ];

  // Set from the ?taskSaved=created|updated query param that
  // AddTaskComponent/EditTaskComponent attach when they navigate back
  // here after a successful submission - the FEM12 query-param pattern
  // (see the board list's ?sort=...) reused to surface form feedback.
  taskSavedMessage?: string;

  private boardSubscription?: Subscription;
  private queryParamSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store,
  ) {}

  ngOnInit(): void {
    // Read :boardId REACTIVELY, not via route.snapshot: clicking the
    // "next board" / "previous board" links below navigates from
    // boards/:boardId to a different boards/:boardId, which the Router
    // resolves to the same route config and reuses this exact component
    // instance - a snapshot read would only ever pick up the first id.
    // Combined with the store's boards/isLoading selectors, so this view
    // reacts to both "which board was requested" and "has that board's
    // data arrived yet" - the global loadBoards() dispatched once in
    // AppComponent may still be in flight the first time this route loads.
    this.boardSubscription = combineLatest([
      this.route.paramMap,
      this.store.select(selectAllBoards),
      this.store.select(selectIsLoading),
    ]).subscribe(([params, boards, isLoading]) => {
      this.boardId = Number(params.get('boardId'));
      this.isLoading = isLoading;

      const index = boards.findIndex((board) => board.id === this.boardId);
      this.board = boards[index];
      this.previousBoardId = index > 0 ? boards[index - 1].id : undefined;
      this.nextBoardId = index >= 0 && index < boards.length - 1 ? boards[index + 1].id : undefined;

      if (!isLoading && !this.board) {
        this.router.navigate(['/not-found']);
      }
    });

    this.queryParamSubscription = this.route.queryParamMap.subscribe((params) => {
      const taskSaved = params.get('taskSaved');
      this.taskSavedMessage =
        taskSaved === 'created' ? 'Task created.' : taskSaved === 'updated' ? 'Task updated.' : undefined;
    });
  }

  ngOnDestroy(): void {
    this.boardSubscription?.unsubscribe();
    this.queryParamSubscription?.unsubscribe();
  }

  dismissTaskSavedMessage(): void {
    this.taskSavedMessage = undefined;
  }

  subtaskProgress(task: Task): string {
    return `${task.subtasks.filter((subtask) => subtask.completed).length}/${task.subtasks.length}`;
  }

  tasksByStatus(status: TaskStatus): Task[] {
    return this.board?.tasks.filter((task) => task.status === status) ?? [];
  }
}
