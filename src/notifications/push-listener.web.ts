import type { Proverb } from "../models/proverb";

/** Shape of a subscription that can be removed. */
type Subscription = { remove: () => void };

/**
 * Subscribes to push token refresh events.
 * On web this returns a no-op subscription since web push is not used.
 */
export const setupTokenListener = (): Subscription => ({
  remove: () => {},
});

/**
 * No-op on web — background notification handling is not supported.
 */
export const initializePushHandler = async (): Promise<void> => {};

/**
 * No-op on web — the serialisation queue has nothing to reset.
 */
export const resetNotificationEnsureChain = (): void => {};

/**
 * No-op on web — local notifications are not supported.
 * @param _daysAhead
 * @param _force
 */
export function ensureNotificationsScheduled(
  _daysAhead: number = 2,
  _force: boolean = false,
): Promise<void> {
  return Promise.resolve();
}

/**
 * No-op on web — silent push notifications are not supported.
 */
export async function handleDailyProverbPush(): Promise<void> {}

/**
 * No-op on web — background fetch tasks are not supported.
 */
export const initializeBackgroundFetch = async (): Promise<void> => {};

/**
 * No-op on web — local notifications are not supported.
 * @param _mode
 * @param _dateString
 * @param _proverb
 */
export async function scheduleNotificationForModeAndDate(
  _mode: string,
  _dateString: string,
  _proverb: Proverb,
): Promise<void> {}

/**
 * No-op on web — notification categories are not supported.
 */
export const registerReplyNotificationCategory = async (): Promise<void> => {};
