import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Board } from '../../core/models/board.model';
import { BoardService } from '../../core/services/board-service/board.service';

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

  newBoardName = '';
  newBoardDescription = '';
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

    const name = this.newBoardName.trim();
    const board = this.boardService.addBoard(name, this.newBoardDescription.trim());
    this.isCreating = false;
    boardForm.resetForm();

    // Programmatic navigation: navigating to the new board is a
    // *consequence* of successfully saving it, not a direct link click,
    // so the Router service is used instead of routerLink here.
    this.router.navigate(['/boards', board.id]);
  }
}
