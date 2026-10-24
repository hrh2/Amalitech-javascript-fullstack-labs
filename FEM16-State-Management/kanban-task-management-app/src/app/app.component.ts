import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subscription, filter } from 'rxjs';
import { AuthService } from './core/services/auth-service/auth.service';
import { Board } from './core/models/board.model';
import { loadBoards } from './state/board/board.actions';
import { selectAllBoards } from './state/board/board.selectors';

const THEME_STORAGE_KEY = 'kanban-theme';

/**
 * The app shell: a persistent sidebar (desktop) / dropdown (mobile) for
 * switching boards and toggling the theme, matching the design reference's
 * layout - see styles.css's header comment. Boards come from the NgRx
 * store (selectAllBoards) exactly like every other component in this
 * module's build - this component reads state the same way as
 * BoardListComponent/BoardDetailComponent, it just also owns the
 * shell-level UI state (theme, sidebar/mobile-menu open) that has nothing
 * to do with the store.
 */
@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, OnDestroy {
  boards: Board[] = [];
  isDarkMode = false;
  isSidebarCollapsed = false;
  isMobileMenuOpen = false;
  currentBoardName: string | null = null;

  private boardsSubscription?: Subscription;
  private routerSubscription?: Subscription;

  constructor(
    protected authService: AuthService,
    private store: Store,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Dispatched once, at the application root, rather than from
    // BoardListComponent: a user can deep-link straight to a board or
    // task URL (skipping the boards list entirely), so the one component
    // guaranteed to run on every route is the right place to kick off
    // this global piece of state's initial load.
    this.store.dispatch(loadBoards());

    this.boardsSubscription = this.store.select(selectAllBoards).subscribe((boards) => {
      this.boards = boards;
      this.updateCurrentBoardName(this.router.url);
    });

    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    this.isDarkMode = savedTheme
      ? savedTheme === 'dark'
      : window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    this.applyTheme();

    this.routerSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.updateCurrentBoardName(event.urlAfterRedirects));
  }

  ngOnDestroy(): void {
    this.boardsSubscription?.unsubscribe();
    this.routerSubscription?.unsubscribe();
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem(THEME_STORAGE_KEY, this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  private applyTheme(): void {
    document.documentElement.setAttribute('data-theme', this.isDarkMode ? 'dark' : 'light');
  }

  // Drives the mobile header's board-name dropdown trigger: extracts
  // :boardId from the current URL and looks its name up in the store's
  // already-loaded boards list, so the collapsed mobile header reads
  // "Platform Launch" (matching the design) rather than a generic
  // "Boards" label.
  private updateCurrentBoardName(url: string): void {
    const match = url.match(/\/boards\/(\d+)/);
    const boardId = match ? Number(match[1]) : undefined;
    this.currentBoardName = boardId ? (this.boards.find((board) => board.id === boardId)?.name ?? null) : null;
  }
}
