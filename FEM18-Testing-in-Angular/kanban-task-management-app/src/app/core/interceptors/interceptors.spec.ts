import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth-service/auth.service';
import { authInterceptor } from './auth.interceptor';
import { errorInterceptor } from './error.interceptor';

describe('HTTP interceptors', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let auth: AuthService;
  const router = { navigate: jest.fn() };

  beforeEach(() => {
    router.navigate.mockReset();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => {
    controller.verify();
    jest.restoreAllMocks();
  });

  describe('authInterceptor', () => {
    it('adds a Bearer Authorization header while logged in', () => {
      auth.login();
      http.get('/x').subscribe();
      const req = controller.expectOne('/x');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${environment.authToken}`);
      req.flush({});
    });

    it('sends no Authorization header while logged out', () => {
      http.get('/x').subscribe();
      const req = controller.expectOne('/x');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });
  });

  describe('errorInterceptor', () => {
    async function failWith(status: number): Promise<Error> {
      const result = firstValueFrom(http.get('/x')).catch((e: Error) => e);
      const req = controller.expectOne('/x');
      if (status === 0) {
        req.error(new ProgressEvent('error'));
      } else {
        req.flush('x', { status, statusText: 'err' });
      }
      return result as Promise<Error>;
    }

    it.each([
      [0, 'Cannot reach the server'],
      [404, 'no longer exists'],
      [500, 'server had a problem'],
      [400, 'request failed'],
    ])('turns status %s into a friendly Error message', async (status, fragment) => {
      const error = await failWith(status);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toContain(fragment);
    });

    it('logs the failure for developers', async () => {
      await failWith(500);
      expect(console.error).toHaveBeenCalled();
    });

    it('on 401 logs the user out, redirects to /login, and still re-throws', async () => {
      auth.login();
      const error = await failWith(401);

      expect(auth.isLoggedIn()).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
      expect(error.message).toContain('session has expired');
    });

    it('does not redirect for non-401 errors', async () => {
      await failWith(500);
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });
});
