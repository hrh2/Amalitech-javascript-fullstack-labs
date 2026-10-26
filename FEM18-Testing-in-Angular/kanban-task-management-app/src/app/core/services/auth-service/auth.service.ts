import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

/**
 * A deliberately simple, hard-coded stand-in for a real authentication
 * service. Real authentication (login endpoints, refresh tokens) is outside
 * this module - this service only gives the CanActivate guard a condition
 * to check and gives authInterceptor a token to attach.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private loggedIn = false;

  isLoggedIn(): boolean {
    return this.loggedIn;
  }

  getToken(): string | null {
    return this.loggedIn ? environment.authToken : null;
  }

  login(): void {
    this.loggedIn = true;
  }

  logout(): void {
    this.loggedIn = false;
  }
}
