import { Injectable } from '@angular/core';

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'error';
  message: string;
}

/**
 * App-wide activity log (cart actions, order lifecycle, errors).
 * Kept as a single root-provided instance so every service/component
 * that logs writes to the same history, and it can be inspected as a
 * whole (e.g. `getLog()`) rather than being scattered per-component.
 */
@Injectable({
  providedIn: 'root'
})
export class LoggingService {
  private readonly entries: LogEntry[] = [];

  logInfo(message: string): void {
    this.record('info', message);
  }

  logError(message: string): void {
    this.record('error', message);
  }

  /** Returns a copy of the recorded log entries, oldest first. */
  getLog(): readonly LogEntry[] {
    return [...this.entries];
  }

  private record(level: LogEntry['level'], message: string): void {
    const entry: LogEntry = { timestamp: new Date().toISOString(), level, message };
    this.entries.push(entry);
    const write = level === 'error' ? console.error : console.info;
    write(`[${entry.timestamp}] ${message}`);
  }
}
