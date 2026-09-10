import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subscription, combineLatest } from 'rxjs';
import { Board } from '../../core/models/board.model';
import { addBoard } from '../../state/board/board.actions';
import { selectAllBoards, selectIsLoading } from '../../state/board/board.selectors';

type SortOrder = 'name' | 'recent';

@Component({
  selector: 'app-board-list',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './board-list.component.html',
  styleUrl: './board-list.component.css',
})
export class BoardListComponent implements OnInit, OnDestroy {
  boards: Board[] = [];
  sortOrder: SortOrder = 'recent';
  isLoading = true;

  newBoardName = '';
  newBoardDescription = '';
  isCreating = false;

  private subscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store,
  ) {}

  ngOnInit(): void {
    // Combines the store's boards (global state, dispatched once at app
    // startup - see AppComponent) with the optional ?sort=name|recent
    // query parameter (presentation-local, read reactively so the list
    // re-sorts if it changes without leaving this route).
    this.subscription = combineLatest([
      this.store.select(selectAllBoards),
      this.store.select(selectIsLoading),
      this.route.queryParamMap,
    ]).subscribe(([boards, isLoading, params]) => {
      this.isLoading = isLoading;
      this.sortOrder = (params.get('sort') as SortOrder) ?? 'recent';
      this.boards = this.sortBoards(boards, this.sortOrder);
      // ?create=1 (set by the sidebar's "+ Create New Board" link, reachable
      // from any page) opens the create-board modal automatically once this
      // route loads, since the panel itself only exists on this page.
      if (params.get('create') && !this.isCreating) {
        this.isCreating = true;
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private sortBoards(boards: Board[], sortOrder: SortOrder): Board[] {
    const sorted = [...boards];
    if (sortOrder === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return sorted;
  }

  toggleCreateForm(): void {
    this.isCreating = !this.isCreating;
    this.newBoardName = '';
    this.newBoardDescription = '';
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

  createBoard(boardForm: NgForm): void {
    if (boardForm.invalid) {
      // Reveals every field's error state even if the user never blurred
      // it - the same "mark everything touched on a failed submit"
      // behaviour used by the reactive task form.
      boardForm.form.markAllAsTouched();
      return;
    }

    // The reducer must stay a pure function of (state, action), so the new
    // id/createdAt are computed here, from the boards already held
    // locally, rather than inside the reducer (see board.actions.ts).
    const nextId = this.boards.reduce((max, board) => Math.max(max, board.id), 0) + 1;
    const board: Board = {
      id: nextId,
      name: this.newBoardName.trim(),
      description: this.newBoardDescription.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
      tasks: [],
    };
    this.store.dispatch(addBoard({ board }));
    this.isCreating = false;
    boardForm.resetForm();

    // Programmatic navigation: navigating to the new board is a
    // *consequence* of successfully saving it, not a direct link click,
    // so the Router service is used instead of routerLink here.
    this.router.navigate(['/boards', board.id]);
  }
}
