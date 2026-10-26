import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth-service/auth.service';

/**
 * Turns every failed request into an Error with a message that is safe to
 * show the user, so services and components never inspect status codes.
 * A 401 also logs the user out and sends them to /login.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error(`${req.method} ${req.url} failed with status ${error.status}`, error);

      if (error.status === 401) {
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => new Error(messageFor(error.status)));
    }),
  );
};

function messageFor(status: number): string {
  if (status === 0) return 'Cannot reach the server. Is the API running (npm run api)?';
  if (status === 401) return 'Your session has expired. Please log in again.';
  if (status === 404) return 'That item no longer exists.';
  if (status >= 500) return 'The server had a problem. Please try again.';
  return 'The request failed. Please try again.';
}
