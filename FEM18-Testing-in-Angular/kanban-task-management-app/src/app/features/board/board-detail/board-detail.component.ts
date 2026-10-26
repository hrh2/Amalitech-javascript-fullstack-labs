import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { StatusLabelPipe } from '../../../core/pipes/status-label.pipe';
import { Task, TaskStatus } from '../../../core/models/task.model';
import { BoardService } from '../../../core/services/board-service/board.service';
import { TaskService } from '../../../core/services/task-service/task.service';

const SAVED_MESSAGES: Record<string, string> = {
  created: 'Task created.',
  updated: 'Task updated.',
  deleted: 'Task deleted.',
};

@Component({
  selector: 'app-board-detail',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, StatusLabelPipe],
  templateUrl: './board-detail.component.html',
  styleUrl: './board-detail.component.css',
})
export class BoardDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private boardService = inject(BoardService);
  private taskService = inject(TaskService);

  // Read :boardId reactively: the "next/previous board" links navigate from
  // boards/:boardId to another boards/:boardId, which reuses this same
  // component instance, so a one-time snapshot read would go stale.
  private boardId = toSignal(this.route.paramMap.pipe(map((params) => params.get('boardId') ?? '')), {
    initialValue: '',
  });

  isLoading = computed(() => this.boardService.isLoading() || this.taskService.isLoading());
  loadError = computed(() => this.boardService.error() ?? this.taskService.error());

  private boardIndex = computed(() => this.boardService.boards().findIndex((board) => board.id === this.boardId()));
  board = computed(() => this.boardService.boards()[this.boardIndex()]);
  previousBoardId = computed(() => this.boardService.boards()[this.boardIndex() - 1]?.id);
  nextBoardId = computed(() => this.boardService.boards()[this.boardIndex() + 1]?.id);
  tasks = computed(() => this.taskService.tasks().filter((task) => task.boardId === this.boardId()));

  readonly statuses: TaskStatus[] = ['todo', 'in-progress', 'done'];

  // Add/Edit/Delete task navigate back here with ?taskSaved=created|updated|deleted.
  private savedParam = toSignal(this.route.queryParamMap.pipe(map((params) => params.get('taskSaved'))), {
    initialValue: null,
  });
  private dismissedParam = signal<string | null>(null);
  taskSavedMessage = computed(() => {
    const param = this.savedParam();
    return param && param !== this.dismissedParam() ? SAVED_MESSAGES[param] : undefined;
  });

  isDeleting = signal(false);
  deleteError = signal<string | null>(null);

  constructor() {
    // Once boards have loaded, an id that matches none of them is a 404.
    effect(() => {
      if (this.boardService.hasLoaded() && !this.board()) {
        this.router.navigate(['/not-found']);
      }
    });
  }

  retry(): void {
    this.boardService.loadBoards();
    this.taskService.loadTasks();
  }

  dismissTaskSavedMessage(): void {
    this.dismissedParam.set(this.savedParam());
  }

  deleteBoard(): void {
    const board = this.board();
    if (!board || !window.confirm(`Delete "${board.name}" and all of its tasks? This cannot be undone.`)) {
      return;
    }
    this.isDeleting.set(true);
    this.deleteError.set(null);
    this.boardService.deleteBoard(board.id).subscribe({
      next: () => this.router.navigate(['/boards']),
      error: (err: Error) => {
        this.isDeleting.set(false);
        this.deleteError.set(err.message);
      },
    });
  }

  subtaskProgress(task: Task): string {
    return `${task.subtasks.filter((subtask) => subtask.completed).length}/${task.subtasks.length}`;
  }

  tasksByStatus(status: TaskStatus): Task[] {
    return this.tasks().filter((task) => task.status === status);
  }
}
