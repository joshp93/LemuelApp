import type { ImperativeRouter } from "expo-router";

/**
 * No-op on web — notifications are not supported.
 * @param _router
 */
export const handleInitialNotificationResponse = (
  _router: ImperativeRouter,
): void => {};

/**
 * No-op on web — notifications are not supported.
 * @param _router
 * @returns A function that removes the (never registered) subscription.
 */
export const subscribeToNotificationResponses =
  (_router: ImperativeRouter): (() => void) =>
  () => {};
