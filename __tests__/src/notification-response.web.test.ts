import * as Notifications from "expo-notifications";
import type { ImperativeRouter } from "expo-router";
import {
  handleInitialNotificationResponse,
  subscribeToNotificationResponses,
} from "../../src/notifications/notification-response.web";

jest.mock("expo-notifications", () => ({
  getLastNotificationResponse: jest.fn(),
  clearLastNotificationResponse: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
}));

/**
 * Builds a router whose navigation calls are observable.
 */
const buildRouter = () =>
  ({
    dismissAll: jest.fn(),
    push: jest.fn(),
  }) as unknown as ImperativeRouter;

describe("notification-response on web", () => {
  it("never queries a launch notification", () => {
    handleInitialNotificationResponse(buildRouter());

    expect(Notifications.getLastNotificationResponse).not.toHaveBeenCalled();
    expect(Notifications.clearLastNotificationResponse).not.toHaveBeenCalled();
  });

  it("never subscribes to notification responses", () => {
    const unsubscribe = subscribeToNotificationResponses(buildRouter());

    expect(
      Notifications.addNotificationResponseReceivedListener,
    ).not.toHaveBeenCalled();
    expect(() => unsubscribe()).not.toThrow();
  });
});
