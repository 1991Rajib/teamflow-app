/**
 * dateUtils.ts
 *
 * Centralised Day.js helpers for the Task due-date feature.
 *
 * Design contract:
 *  - All due-dates travel the stack as plain ISO date strings: "YYYY-MM-DD"
 *  - No time component, no timezone offset — prevents any UTC vs local shift.
 *  - Functions here accept "YYYY-MM-DD" strings and return formatted text or
 *    boolean comparisons using local calendar dates only.
 */

import dayjs from 'dayjs';

/**
 * Returns today's date as a "YYYY-MM-DD" string in the user's local timezone.
 * Use this as the `min` value for <input type="date"> to block past dates.
 */
export function todayISODate(): string {
  return dayjs().format('YYYY-MM-DD');
}

/**
 * Formats a "YYYY-MM-DD" date string for display on task cards.
 * Example: "2026-07-22" → "07/22/2026"
 *
 * Day.js parses "YYYY-MM-DD" as a *local* date (no UTC conversion),
 * so the displayed date always matches the stored calendar date.
 */
export function formatDueDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return dayjs(dateStr).format('MM/DD/YYYY');
}

/**
 * Formats a JS Date or ISO datetime string for general display (created, updated).
 * Example: new Date('2026-07-22T10:00:00Z') → "07/22/2026"
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  return dayjs(date).format('MM/DD/YYYY');
}

/**
 * Returns true if the given "YYYY-MM-DD" date string is strictly before today
 * (i.e. the task is overdue) AND the task status is not 'DONE'.
 *
 * Comparison is calendar-date only — no hour/minute ambiguity.
 */
export function isOverdue(dateStr: string | null | undefined, status: string): boolean {
  if (!dateStr || status === 'DONE') return false;
  // dayjs("YYYY-MM-DD").isBefore(dayjs(), 'day') compares calendar days only
  return dayjs(dateStr).isBefore(dayjs(), 'day');
}

/**
 * Converts a "YYYY-MM-DD" date string to a UTC midnight Date object suitable
 * for MongoDB storage. Storing at UTC midnight is stable across all timezones:
 *   - slice(0,10) of the ISO string always returns the original "YYYY-MM-DD"
 *   - No timezone can shift this date by ±1 day on read-back
 */
export function toUTCMidnightDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}
