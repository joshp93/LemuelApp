import type { Proverb } from "../models/proverb";
import type { NonNullNotificationTrigger } from "./notification-utils";
import {
  EXAMPLE_NOTIFICATION_ID,
  getMeditationRouteParams,
  getNotificationIdForDate,
  getRandomTimeInWindow,
  MEDITATE_ACTION_ID,
  resolveScheduleDate,
} from "./notification-utils";

export type { MeditationRouteParams } from "./notification-utils";
export type { NonNullNotificationTrigger };
export {
  EXAMPLE_NOTIFICATION_ID,
  getMeditationRouteParams,
  getNotificationIdForDate,
  getRandomTimeInWindow,
  MEDITATE_ACTION_ID,
  resolveScheduleDate,
};

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

/** No-op on web — notifications are not supported. */
export const initializeNotifications = (): void => {};

/** No-op on web — notifications are not supported. */
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
