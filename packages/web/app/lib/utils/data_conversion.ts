type DateInput = string | number | Date;

function toDate(date: DateInput): Date | null {
  const parsed = date instanceof Date ? date : new Date(date);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Long date: "Wednesday, March 12, 2026"
 */
export function formatDate(date: DateInput): string {
  const d = toDate(date);
  if (!d) return 'Invalid Date';
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Compact date: "Wed, Mar 12, 2026"
 */
export function formatDateCompact(date: DateInput): string {
  const d = toDate(date);
  if (!d) return 'Invalid Date';
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Short date (no weekday): "Mar 12, 2026"
 */
export function formatDateShort(date: DateInput): string {
  const d = toDate(date);
  if (!d) return 'Invalid Date';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * 12-hour time: "3:45 PM"
 */
export function format12hourTime(date: DateInput): string {
  const d = toDate(date);
  if (!d) return 'Pick a date';
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const ampm = hours < 12 ? 'AM' : 'PM';
  return `${formattedHours}:${formattedMinutes} ${ampm}`;
}

/**
 * Date + time: "Wed Mar 12 2026 3:45 PM"
 */
export function formatDateTime(date: DateInput): string {
  const d = toDate(date);
  if (!d) return 'Pick a date';
  return `${d.toDateString()} ${format12hourTime(d)}`;
}
