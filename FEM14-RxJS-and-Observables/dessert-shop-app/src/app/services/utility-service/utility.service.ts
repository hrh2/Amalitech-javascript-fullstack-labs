import { Injectable } from '@angular/core';

/**
 * General-purpose calculation helpers with no cart or product knowledge of
 * their own. Extracted so the same rounding/summing rules are applied
 * everywhere money is calculated, instead of each component repeating
 * (and potentially drifting on) `price * quantity` style arithmetic.
 */
@Injectable({
  providedIn: 'root'
})
export class UtilityService {
  /** Rounds to 2 decimal places to avoid floating-point cents drift. */
  round2(value: number): number {
    return Math.round(value * 100) / 100;
  }

  lineTotal(price: number, quantity: number): number {
    return this.round2(price * quantity);
  }

  sum(values: number[]): number {
    return this.round2(values.reduce((total, value) => total + value, 0));
  }
}
