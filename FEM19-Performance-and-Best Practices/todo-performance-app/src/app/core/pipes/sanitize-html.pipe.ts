import { Pipe, PipeTransform, SecurityContext, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/**
 * Makes untrusted text safe to put in [innerHTML]: Angular's sanitizer drops
 * <script>, event-handler attributes (onerror=...), javascript: URLs, etc.
 * and keeps harmless markup like <b>. Never use bypassSecurityTrustHtml on
 * user or server text - that switches this protection off.
 *
 * A pure pipe, so the sanitiser only runs again when the text itself changes.
 */
@Pipe({ name: 'sanitizeHtml' })
export class SanitizeHtmlPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  transform(value: string | null | undefined): string {
    return this.sanitizer.sanitize(SecurityContext.HTML, value ?? '') ?? '';
  }
}
