import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Board } from '../../core/models/board.model';
import { BoardService } from '../../core/services/board.service';

type SortOrder = 'name' | 'recent';

/**
 * The "create board" panel deliberately does NOT use FormsModule/ngModel -
 * two-way data binding via ngModel is a FEM13 (Forms) concept. Instead it
 * reads the raw input values through template reference variables
 * (#boardNameInput, #boardDescriptionInput) at the moment the native
 * (submit) event fires - plain template syntax + event binding, both
 * FEM09 fundamentals, with no forms-module dependency at all.
 */
@Component({
  selector: 'app-board-list',
  imports: [CommonModule, RouterLink],
  templateUrl: './board-list.component.html',
  styleUrl: './board-list.component.css',
})
export class BoardListComponent implements OnInit, OnDestroy {
  boards: Board[] = [];
  sortOrder: SortOrder = 'recent';
  isCreating = false;

  private queryParamSubscription?: Subscription;

  constructor(
    private boardService: BoardService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Optional query parameter (?sort=name|recent) driving how the board
    // list is displayed - read reactively so the list re-sorts if the
    // query parameter changes without leaving this route.
    this.queryParamSubscription = this.route.queryParamMap.subscribe((params) => {
      this.sortOrder = (params.get('sort') as SortOrder) ?? 'recent';
      this.applySort();
    });
  }

  ngOnDestroy(): void {
    this.queryParamSubscription?.unsubscribe();
  }

  private applySort(): void {
    const boards = [...this.boardService.getBoards()];
    if (this.sortOrder === 'name') {
      boards.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      boards.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    this.boards = boards;
  }

  toggleCreateForm(): void {
    this.isCreating = !this.isCreating;
  }

  todoCount(board: Board): number {
    return board.tasks.filter((task) => task.status === 'todo').length;
  }

  inProgressCount(board: Board): number {
    return board.tasks.filter((task) => task.status === 'in-progress').length;
  }

  doneCount(board: Board): number {
    return board.tasks.filter((task) => task.status === 'done').length;
  }

  // The native (submit) event, not Angular's (ngSubmit) - (ngSubmit) is
  // only emitted by the NgForm directive that FormsModule provides.
  onCreateSubmit(event: Event, name: string, description: string): void {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }
    const board = this.boardService.addBoard(trimmedName, description.trim());
    this.isCreating = false;

    // Programmatic navigation: navigating to the new board is a
    // *consequence* of successfully saving it, not a direct link click,
    // so the Router service is used instead of routerLink here.
    this.router.navigate(['/boards', board.id]);
  }
}
