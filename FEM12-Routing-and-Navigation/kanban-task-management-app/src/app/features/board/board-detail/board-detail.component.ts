import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { Board } from '../../../core/models/board.model';
import { BoardService } from '../../../core/services/board.service';

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

  private paramSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private boardService: BoardService,
  ) {}

  ngOnInit(): void {
    // Read :boardId REACTIVELY, not via route.snapshot: clicking the
    // "next board" / "previous board" links below navigates from
    // boards/:boardId to a different boards/:boardId, which the Router
    // resolves to the same route config and reuses this exact component
    // instance - a snapshot read would only ever pick up the first id.
    this.paramSubscription = this.route.paramMap.subscribe((params) => {
      this.boardId = Number(params.get('boardId'));
      this.loadBoard();
    });
  }

  ngOnDestroy(): void {
    this.paramSubscription?.unsubscribe();
  }

  private loadBoard(): void {
    this.board = this.boardService.getBoardById(this.boardId);
    this.previousBoardId = this.boardService.getAdjacentBoardId(this.boardId, 'previous');
    this.nextBoardId = this.boardService.getAdjacentBoardId(this.boardId, 'next');

    if (!this.board) {
      this.router.navigate(['/not-found']);
    }
  }
}
