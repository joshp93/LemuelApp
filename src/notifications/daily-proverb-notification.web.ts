import type { SchedulableNotificationTriggerInput } from "expo-notifications";
import type { Proverb } from "../models/proverb";

/** Placeholder notification ID used for example/test notifications. */
export const EXAMPLE_NOTIFICATION_ID = "daily-proverb-example";

/** Action identifier used by notification categories for meditation actions. */
export const MEDITATE_ACTION_ID = "meditate";

/** Placeholder notification trigger type — matches the native type on web. */
export type NonNullNotificationTrigger = SchedulableNotificationTriggerInput;

/**
 * Returns a date-specific notification identifier string.
 * On web this returns the same string as native but notifications are never scheduled.
 * @param dateString - ISO date string (YYYY-MM-DD)
 */
export const getNotificationIdForDate = (dateString: string): string =>
  `daily-proverb-meditation-${dateString}`;

/**
 * No-op on web — notifications are not supported.
 * @param _proverb
 * @param _trigger
 * @param _dateString
 */
export const scheduleProverbNotification = async (
  _proverb: Proverb,
  _trigger: NonNullNotificationTrigger,
  _dateString: string,
): Promise<string | null> => null;

/**
 * Returns the current time as a fallback value.
 * Matches the signature of the native implementation.
 * @param date
 * @param _startHour
 * @param _startMinute
 * @param _endHour
 * @param _endMinute
 */
export const getRandomTimeInWindow = (
  date: Date,
  _startHour: number,
  _startMinute: number,
  _endHour: number,
  _endMinute: number,
): Date => new Date(date);

/**
 * Builds a Date from the given ISO date string and time values.
 * Matches the signature of the native implementation.
 * @param isoDateString
 * @param hour
 * @param minute
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
 * No-op on web — notifications are not supported.
 */
export const initializeNotifications = (): void => {};

/**
 * No-op on web — notifications are not supported.
 */
export const cleanupNotifications = (): void => {};

/**
 * No-op on web — notifications are not supported.
 * @param _dateString
 */
export const cancelProverbNotification = async (
  _dateString: string,
): Promise<void> => {};

/**
 * No-op on web — notifications are not supported.
 * @param _proverb
 * @param _dateString
 */
export const sendProverbNotification = async (
  _proverb: Proverb,
  _dateString?: string,
): Promise<void> => {};

/**
 * No-op on web — notifications are not supported.
 * @param _proverb
 */
export const sendExampleProverbNotification = async (
  _proverb: Proverb,
): Promise<void> => {};

/** Navigation params shape matching the native implementation. */
export type MeditationRouteParams = {
  pathname: "/meditation";
  params: { proverb: string; ref: string; date?: string };
};

/**
 * Extracts meditation navigation params from a notification response data payload.
 * On web this always returns null since notifications never arrive.
 * @param data
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
