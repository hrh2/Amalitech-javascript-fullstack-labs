import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Zone-based change detection, as in the legacy app: this lab is about
    // controlling WHEN Angular checks components, so the zone must be on.
    provideZoneChangeDetection({ eventCoalescing: true }),
  ],
};
