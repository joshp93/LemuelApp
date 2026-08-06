export const formatDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
};

/**
 * Returns the given date as a `YYYY-MM-DD` string in LOCAL time.
 *
 * Notification schedule targets are built with local date components
 * (`resolveScheduleDate`), so all date strings used for dedup and proverb
 * lookups must be derived the same way. Using `toISOString()` (UTC) here
 * causes "today" to be the previous day for UTC+X timezones early in the
 * local morning.
 */
export const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
