import * as Notifications from "expo-notifications";
import type { ImperativeRouter } from "expo-router";
import {
  getMeditationRouteParams,
  MEDITATE_ACTION_ID,
} from "./daily-proverb-notification";

/**
 * Routes a tapped notification to the screen it refers to. A proverb
 * notification (or a plain tap on any notification) opens the meditation
 * screen for that notification's date, and a reply notification opens the home
 * screen on the date it refers to. The delivered notification is dismissed
 * from the tray once it has been handled.
 *
 * @param router - The router used to navigate.
 * @param response - The response emitted for the tapped notification.
 */
const handleResponse = (
  router: ImperativeRouter,
  response: Notifications.NotificationResponse,
): void => {
  const data = response.notification.request.content.data as
    | Record<string, unknown>
    | undefined;

  const isProverbAction =
    response.actionIdentifier === MEDITATE_ACTION_ID ||
    response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER;

  if (
    isProverbAction &&
    data &&
    (data as Record<string, string>).type === undefined
  ) {
    const routeParams = getMeditationRouteParams(
      response.notification.request.content.data as Record<string, unknown>,
    );
    if (!routeParams) return;

    router.dismissAll();
    router.push(routeParams);
    Notifications.dismissNotificationAsync(
      response.notification.request.identifier,
    );
    return;
  }

  if (data?.type === "reply") {
    router.dismissAll();
    router.push(`/?date=${data.date}`);
    Notifications.dismissNotificationAsync(
      response.notification.request.identifier,
    );
  }
};

/**
 * Handles the notification that launched the app, if there was one, then
 * clears it so it is not handled again on the next launch.
 *
 * @param router - The router used to navigate.
 */
export const handleInitialNotificationResponse = (
  router: ImperativeRouter,
): void => {
  const response = Notifications.getLastNotificationResponse();
  if (!response) return;
  handleResponse(router, response);
  Notifications.clearLastNotificationResponse();
};

/**
 * Subscribes to notification taps received while the app is running.
 *
 * @param router - The router used to navigate.
 * @returns A function that removes the subscription.
 */
export const subscribeToNotificationResponses = (
  router: ImperativeRouter,
): (() => void) => {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => handleResponse(router, response),
  );
  return () => subscription.remove();
};
