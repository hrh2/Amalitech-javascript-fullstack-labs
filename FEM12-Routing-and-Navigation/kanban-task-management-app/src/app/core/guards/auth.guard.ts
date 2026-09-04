import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth-service/auth.service';

/**
 * Protects a route so it can only be entered while "logged in".
 * On denial it redirects to /login and carries the originally
 * requested URL along as a returnUrl query parameter, so the
 * login page can send the user back where they meant to go.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
