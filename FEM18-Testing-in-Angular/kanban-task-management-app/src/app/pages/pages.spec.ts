import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../core/services/auth-service/auth.service';
import { LoginComponent } from './login/login.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { SettingsComponent } from './settings/settings.component';

describe('LoginComponent', () => {
  function setup(queryParams: Record<string, string> = {}) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { queryParamMap: of(convertToParamMap(queryParams)) } },
      ],
    });
    const router = TestBed.inject(Router);
    const navigateByUrl = jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    return { fixture, navigateByUrl, auth: TestBed.inject(AuthService) };
  }

  it('logs in and goes to /boards by default', () => {
    const { fixture, navigateByUrl, auth } = setup();
    fixture.nativeElement.querySelector('button').click();
    expect(auth.isLoggedIn()).toBe(true);
    expect(navigateByUrl).toHaveBeenCalledWith('/boards');
  });

  it('returns the user to the page the guard blocked (?returnUrl=)', () => {
    const { fixture, navigateByUrl } = setup({ returnUrl: '/boards/2' });
    fixture.nativeElement.querySelector('button').click();
    expect(navigateByUrl).toHaveBeenCalledWith('/boards/2');
  });
});

describe('SettingsComponent', () => {
  it('log out clears the session and navigates to /boards', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const auth = TestBed.inject(AuthService);
    auth.login();
    const navigate = jest.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(SettingsComponent);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('button').click();

    expect(auth.isLoggedIn()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/boards']);
  });
});

describe('NotFoundComponent', () => {
  it('shows a 404 message and a link back to the boards list', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(NotFoundComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('h1')!.textContent).toBe('404');
    expect(el.querySelector('a')!.getAttribute('href')).toBe('/boards');
  });
});
