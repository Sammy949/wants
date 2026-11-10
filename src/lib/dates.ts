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
