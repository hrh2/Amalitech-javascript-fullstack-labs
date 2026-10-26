import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth-service/auth.service';
import { authGuard } from './auth.guard';
import { unsavedChangesGuard } from './unsaved-changes.guard';

describe('authGuard', () => {
  const router = { navigate: jest.fn() };
  let auth: AuthService;

  const run = () =>
    TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/boards/2' } as RouterStateSnapshot),
    );

  beforeEach(() => {
    router.navigate.mockReset();
    TestBed.configureTestingModule({ providers: [{ provide: Router, useValue: router }] });
    auth = TestBed.inject(AuthService);
  });

  it('allows navigation when logged in', () => {
    auth.login();
    expect(run()).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('blocks and redirects to /login with the requested URL as returnUrl when logged out', () => {
    expect(run()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/boards/2' } });
  });
});

describe('unsavedChangesGuard', () => {
  const run = (dirty: boolean) =>
    TestBed.runInInjectionContext(() =>
      unsavedChangesGuard(
        { hasUnsavedChanges: () => dirty },
        {} as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
        {} as RouterStateSnapshot,
      ),
    );

  afterEach(() => jest.restoreAllMocks());

  it('allows leaving without asking when nothing is unsaved', () => {
    const confirm = jest.spyOn(window, 'confirm');
    expect(run(false)).toBe(true);
    expect(confirm).not.toHaveBeenCalled();
  });

  it.each([true, false])('asks for confirmation when dirty and returns the answer (%s)', (answer) => {
    jest.spyOn(window, 'confirm').mockReturnValue(answer);
    expect(run(true)).toBe(answer);
    expect(window.confirm).toHaveBeenCalledTimes(1);
  });
});
