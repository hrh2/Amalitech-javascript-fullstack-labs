import { Injectable } from '@angular/core';

/**
 * A deliberately simple, hard-coded stand-in for a real authentication
 * service. Real authentication (tokens, refresh, HTTP interceptors) is
 * outside the scope of this routing-focused module - this service only
 * exists to give the CanActivate guard a real condition to check.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private loggedIn = false;

  isLoggedIn(): boolean {
    return this.loggedIn;
  }

  login(): void {
    this.loggedIn = true;
  }

  logout(): void {
    this.loggedIn = false;
  }
}
