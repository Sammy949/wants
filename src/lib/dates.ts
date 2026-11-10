/**
 * Target dates are stored as plain calendar dates (YYYY-MM-DD) and formatted
 * in UTC so a phone's timezone can never shift them by a day.
 */
export function formatTargetDate(isoDate: string, locale?: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat(locale, { month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

/** "2 Oct 2026" style, in the phone's timezone, for when something was got. */
export function formatDay(isoTimestamp: string, locale?: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(date);
}

/** A picked Date to a stored calendar day, using the phone's local date. */
export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * A stored calendar day to a local Date for the picker. Noon, so a daylight
 * saving shift can never move it to the previous or next day.
 */
export function fromIsoDate(isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12);
}
