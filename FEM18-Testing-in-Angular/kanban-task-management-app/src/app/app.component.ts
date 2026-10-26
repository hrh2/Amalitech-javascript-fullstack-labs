import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { AuthService } from './core/services/auth-service/auth.service';
import { BoardService } from './core/services/board-service/board.service';
import { TaskService } from './core/services/task-service/task.service';

const THEME_STORAGE_KEY = 'kanban-theme';

/**
 * The app shell: a persistent sidebar (desktop) / dropdown (mobile) for
 * switching boards and toggling the theme, matching the design reference's
 * layout - see styles.css's header comment. It also starts the initial
 * data load, since this is the one component that exists on every route.
 */
@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  protected authService = inject(AuthService);
  private boardService = inject(BoardService);
  private taskService = inject(TaskService);
  private router = inject(Router);

  boards = this.boardService.boards;
  isDarkMode = false;
  isSidebarCollapsed = false;
  isMobileMenuOpen = false;

  // Drives the mobile header's board-name dropdown trigger: reads :boardId
  // from the current URL and looks its name up in the loaded boards.
  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  currentBoardName = computed(() => {
    const boardId = this.currentUrl().match(/\/boards\/([^/?#]+)/)?.[1];
    return this.boards().find((board) => board.id === boardId)?.name ?? null;
  });

  ngOnInit(): void {
    // A user can deep-link straight to a board or task URL, so the root
    // component is the one place guaranteed to run first on every route.
    this.boardService.loadBoards();
    this.taskService.loadTasks();

    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    this.isDarkMode = savedTheme
      ? savedTheme === 'dark'
      : window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    this.applyTheme();
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
}
