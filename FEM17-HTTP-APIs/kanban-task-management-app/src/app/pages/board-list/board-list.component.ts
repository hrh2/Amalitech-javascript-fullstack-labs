import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Board, NewBoard } from '../../core/models/board.model';
import { TaskStatus } from '../../core/models/task.model';
import { BoardService } from '../../core/services/board-service/board.service';
import { TaskService } from '../../core/services/task-service/task.service';

type SortOrder = 'name' | 'recent';

@Component({
  selector: 'app-board-list',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './board-list.component.html',
  styleUrl: './board-list.component.css',
})
export class BoardListComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private boardService = inject(BoardService);
  private taskService = inject(TaskService);

  isLoading = this.boardService.isLoading;
  loadError = this.boardService.error;

  // ?sort=name|recent is presentation-local, so it stays a query parameter
  // rather than service state.
  sortOrder = toSignal(this.route.queryParamMap.pipe(map((params) => (params.get('sort') as SortOrder) ?? 'recent')), {
    initialValue: 'recent' as SortOrder,
  });

  boards = computed(() => {
    const sorted = [...this.boardService.boards()];
    if (this.sortOrder() === 'name') {
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });

  newBoardName = '';
  newBoardDescription = '';
  isCreating = false;
  isSaving = signal(false);
  saveError = signal<string | null>(null);

  ngOnInit(): void {
    // ?create=1 (set by the sidebar's "+ Create New Board" link, reachable
    // from any page) opens the create-board modal once this route loads.
    this.route.queryParamMap.subscribe((params) => {
      if (params.get('create') && !this.isCreating) {
        this.isCreating = true;
      }
    });
  }

  retry(): void {
    this.boardService.loadBoards();
    this.taskService.loadTasks();
  }

  toggleCreateForm(): void {
    this.isCreating = !this.isCreating;
    this.newBoardName = '';
    this.newBoardDescription = '';
    this.saveError.set(null);
  }

  taskCount(board: Board): number {
    return this.taskService.tasks().filter((task) => task.boardId === board.id).length;
  }

  countWithStatus(board: Board, status: TaskStatus): number {
    return this.taskService.tasks().filter((task) => task.boardId === board.id && task.status === status).length;
  }

  createBoard(boardForm: NgForm): void {
    if (boardForm.invalid) {
      // Reveals every field's error state even if the user never blurred it.
      boardForm.form.markAllAsTouched();
      return;
    }

    const board: NewBoard = {
      name: this.newBoardName.trim(),
      description: this.newBoardDescription.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
    };
    this.isSaving.set(true);
    this.saveError.set(null);
    this.boardService.createBoard(board).subscribe({
      next: (created) => {
        this.isSaving.set(false);
        this.isCreating = false;
        boardForm.resetForm();
        // Navigating to the new board is a consequence of saving it, not a
        // link click, so the Router service is used instead of routerLink.
        this.router.navigate(['/boards', created.id]);
      },
      error: (err: Error) => {
        this.isSaving.set(false);
        this.saveError.set(err.message);
      },
    });
  }
}
