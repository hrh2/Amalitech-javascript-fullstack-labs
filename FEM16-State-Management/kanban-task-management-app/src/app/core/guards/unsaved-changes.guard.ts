import { CanDeactivateFn } from '@angular/router';

/**
 * A component that opts into deactivation protection implements this by
 * reporting whether it currently has edits the user hasn't saved yet.
 */
export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

/**
 * Prevents navigating away from a route while the routed component
 * reports unsaved changes, unless the user confirms they want to
 * discard them. Runs for both routerLink clicks and programmatic
 * navigation, and for the browser's back/forward buttons.
 */
export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => {
  if (!component.hasUnsavedChanges()) {
    return true;
  }

  return window.confirm('You have unsaved changes. Leave this page and discard them?');
};
