import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth-service/auth.service';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit, OnDestroy {
  private returnUrl = '/boards';
  private queryParamSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // ?returnUrl=... is set by authGuard when it redirects here, so the
    // user lands back on the page they originally asked for.
    this.queryParamSubscription = this.route.queryParamMap.subscribe((params) => {
      this.returnUrl = params.get('returnUrl') ?? '/boards';
    });
  }

  ngOnDestroy(): void {
    this.queryParamSubscription?.unsubscribe();
  }

  login(): void {
    this.authService.login();
    this.router.navigateByUrl(this.returnUrl);
  }
}
