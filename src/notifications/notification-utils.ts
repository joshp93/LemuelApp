import type { SchedulableNotificationTriggerInput } from "expo-notifications";

/** Prefix for date-specific daily-proverb notification identifiers. */
export const NOTIFICATION_ID_PREFIX = "daily-proverb-meditation";

/** Identifier used for example/test notifications (never a real date). */
export const EXAMPLE_NOTIFICATION_ID = "daily-proverb-example";

/** Action identifier for the "Begin meditation" notification button. */
export const MEDITATE_ACTION_ID = "meditate";

/**
 * A notification trigger that guarantees a schedulable (non-null) value.
 * Excludes the `null` and `ChannelAwareTriggerInput` variants of
 * `NotificationTriggerInput`.
 */
export type NonNullNotificationTrigger = SchedulableNotificationTriggerInput;

/**
 * Builds the date-specific notification identifier for a given proverb date.
 *
 * @param dateString - ISO date string (YYYY-MM-DD).
 * @returns The notification identifier.
 */
export const getNotificationIdForDate = (dateString: string): string =>
  `${NOTIFICATION_ID_PREFIX}-${dateString}`;

/**
 * Picks a random time within the given window on the provided date.
 *
 * @param date - The day to schedule on.
 * @param startHour - Window start hour (0-23).
 * @param startMinute - Window start minute (0-59).
 * @param endHour - Window end hour (0-23).
 * @param endMinute - Window end minute (0-59).
 * @returns A Date at a random time inside the window.
 */
export const getRandomTimeInWindow = (
  date: Date,
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number,
): Date => {
  const startOfDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const windowStartMinutes = startHour * 60 + startMinute;
  const windowEndMinutes = endHour * 60 + endMinute;
  const range = Math.max(windowEndMinutes - windowStartMinutes, 1);
  const randomMinutes = windowStartMinutes + Math.floor(Math.random() * range);
  return new Date(startOfDay.getTime() + randomMinutes * 60000);
};

/**
 * Builds a Date from an ISO date string (YYYY-MM-DD) and a time.
 *
 * @param isoDateString - The date string to resolve against.
 * @param hour - The hour to set (0-23).
 * @param minute - The minute to set (0-59).
 * @returns A Date representing the resolved schedule date.
 */
export const resolveScheduleDate = (
  isoDateString: string,
  hour: number,
  minute: number,
): Date => {
  const [y, m, d] = isoDateString.split("-").map(Number);
  return new Date(y, m - 1, d, hour, minute, 0, 0);
};

/**
 * Navigation params for the meditation screen derived from a notification's
 * content data. Includes the proverb date when present so tapping the
 * notification lands on the correct daily proverb rather than today's.
 */
export type MeditationRouteParams = {
  pathname: "/meditation";
  params: { proverb: string; ref: string; date?: string };
};

/**
 * Extracts meditation navigation params from a notification's content data.
 *
 * @param data - The `content.data` payload of a notification response.
 * @returns Route params, or null when the data cannot be used to navigate.
 */
export const getMeditationRouteParams = (
  data: Record<string, unknown>,
): MeditationRouteParams | null => {
  const { proverb, ref, date } = data;
  if (typeof proverb !== "string" || typeof ref !== "string") return null;
  const params: MeditationRouteParams["params"] = { proverb, ref };
  if (typeof date === "string") params.date = date;
  return { pathname: "/meditation", params };
};
