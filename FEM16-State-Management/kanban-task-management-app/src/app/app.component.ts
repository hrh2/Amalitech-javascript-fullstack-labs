import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { AuthService } from './core/services/auth-service/auth.service';
import { loadBoards } from './state/board/board.actions';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  constructor(
    protected authService: AuthService,
    private store: Store,
  ) {}

  ngOnInit(): void {
    // Dispatched once, at the application root, rather than from
    // BoardListComponent: a user can deep-link straight to a board or
    // task URL (skipping the boards list entirely), so the one component
    // guaranteed to run on every route is the right place to kick off
    // this global piece of state's initial load.
    this.store.dispatch(loadBoards());
  }
}
