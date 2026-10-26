import { environment } from '../../../../environments/environment';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => (service = new AuthService()));

  it('starts logged out with no token', () => {
    expect(service.isLoggedIn()).toBe(false);
    expect(service.getToken()).toBeNull();
  });

  it('login() makes isLoggedIn true and exposes the configured token', () => {
    service.login();
    expect(service.isLoggedIn()).toBe(true);
    expect(service.getToken()).toBe(environment.authToken);
  });

  it('logout() clears both', () => {
    service.login();
    service.logout();
    expect(service.isLoggedIn()).toBe(false);
    expect(service.getToken()).toBeNull();
  });
});
