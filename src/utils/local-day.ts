/**
 * A date's day in local time as a four-digit `YYYY-MM-DD`, which compares as text in day order; an
 * invalid date and a year outside 1 to 9999 have no day.
 */
export function toLocalDay(date: Date): string | null {
  const year = date.getFullYear();
  if (Number.isNaN(year) || year < 1 || year > 9999) return null;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${String(year).padStart(4, '0')}-${month}-${day}`;
}
