import { Injectable } from '@angular/core';
import { Observable, defer, delay, of, shareReplay } from 'rxjs';

/** Stand-in for a server reply. Deliberately contains a <script> to prove it gets stripped. */
const WELCOME_HTML =
  '<span class="text-indigo-600 font-bold">My Refactoring App (Sanitized)</span>' +
  '<script>console.warn("SECURITY WARNING: XSS vulnerability active in header!");</script>';

@Injectable({ providedIn: 'root' })
export class WelcomeService {
  /**
   * defer() makes the "request" start only on the first subscription;
   * shareReplay() then shares that one request with every subscriber and
   * replays its result to late ones. Without it, each subscribe() would
   * fire its own call. refCount stays false so the cached value survives
   * even when the last subscriber goes away.
   */
  readonly message$: Observable<string> = defer(() => {
    console.log('API Call: fetching welcome message');
    return of(WELCOME_HTML).pipe(delay(300));
  }).pipe(shareReplay({ bufferSize: 1, refCount: false }));
}
