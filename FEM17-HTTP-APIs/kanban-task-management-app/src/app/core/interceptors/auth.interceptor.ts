import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth-service/auth.service';

/** Adds the Authorization header to every outgoing request, once, here. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();
  if (!token) {
    return next(req);
  }
  // Requests are immutable, so clone() is how a modified copy is made.
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
