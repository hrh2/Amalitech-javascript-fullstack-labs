import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthService } from './core/services/auth-service/auth.service';
import { Board } from './core/models/board.model';
import { BoardService } from './core/services/board-service/board.service';

const THEME_STORAGE_KEY = 'kanban-theme';

/**
 * The app shell: a persistent sidebar (desktop) / dropdown (mobile) for
 * switching boards and toggling the theme, matching the design reference's
 * layout - see styles.css's header comment. Everything below the shell
 * (the board list, a specific board, settings, login) is still ordinary
 * routed content in <router-outlet>; this component only adds the chrome
 * around it.
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

  private routerSubscription?: Subscription;

  constructor(
    protected authService: AuthService,
    private boardService: BoardService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.boards = this.boardService.getBoards();

    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    this.isDarkMode = savedTheme
      ? savedTheme === 'dark'
      : window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    this.applyTheme();

    this.updateCurrentBoardName(this.router.url);
    this.routerSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.updateCurrentBoardName(event.urlAfterRedirects));
  }

  ngOnDestroy(): void {
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
  // :boardId from the current URL and looks its name up in the already-
  // loaded boards list, so the collapsed mobile header reads "Platform
  // Launch" (matching the design) rather than a generic "Boards" label.
  private updateCurrentBoardName(url: string): void {
    const match = url.match(/\/boards\/(\d+)/);
    const boardId = match ? Number(match[1]) : undefined;
    this.currentBoardName = boardId ? (this.boards.find((board) => board.id === boardId)?.name ?? null) : null;
  }
}
