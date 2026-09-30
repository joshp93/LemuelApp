import * as Notifications from "expo-notifications";
import type { ImperativeRouter } from "expo-router";
import {
  getMeditationRouteParams,
  MEDITATE_ACTION_ID,
} from "../../src/notifications/daily-proverb-notification";
import {
  handleInitialNotificationResponse,
  subscribeToNotificationResponses,
} from "../../src/notifications/notification-response";

jest.mock("expo-notifications", () => ({
  DEFAULT_ACTION_IDENTIFIER: "expo.modules.notifications.actions.DEFAULT",
  addNotificationResponseReceivedListener: jest.fn(),
  dismissNotificationAsync: jest.fn(),
  getLastNotificationResponse: jest.fn(),
  clearLastNotificationResponse: jest.fn(),
}));

jest.mock("../../src/notifications/daily-proverb-notification", () => ({
  MEDITATE_ACTION_ID: "BEGIN_MEDITATION",
  getMeditationRouteParams: jest.fn(),
}));

const mockGetLastNotificationResponse = jest.mocked(
  Notifications.getLastNotificationResponse,
);
const mockClearLastNotificationResponse = jest.mocked(
  Notifications.clearLastNotificationResponse,
);
const mockDismissNotificationAsync = jest.mocked(
  Notifications.dismissNotificationAsync,
);
const mockAddListener = jest.mocked(
  Notifications.addNotificationResponseReceivedListener,
);
const mockGetMeditationRouteParams = jest.mocked(getMeditationRouteParams);

type FakeResponse = Notifications.NotificationResponse;

/**
 * Builds a minimal notification response with the given action and payload.
 */
const buildResponse = (
  actionIdentifier: string,
  data: Record<string, unknown>,
  identifier = "notification-1",
): FakeResponse =>
  ({
    actionIdentifier,
    notification: {
      request: { identifier, content: { data } },
    },
  }) as unknown as FakeResponse;

/**
 * Builds a router whose navigation calls are observable.
 */
const buildRouter = () =>
  ({
    dismissAll: jest.fn(),
    push: jest.fn(),
  }) as unknown as ImperativeRouter;

beforeEach(() => {
  jest.clearAllMocks();
  mockGetMeditationRouteParams.mockReturnValue({ pathname: "/meditation" });
});

describe("handleInitialNotificationResponse", () => {
  it("does nothing when the app was not launched from a notification", () => {
    mockGetLastNotificationResponse.mockReturnValue(null);
    const router = buildRouter();

    handleInitialNotificationResponse(router);

    expect(router.push).not.toHaveBeenCalled();
    expect(mockClearLastNotificationResponse).not.toHaveBeenCalled();
  });

  it("opens the meditation screen for a proverb notification", () => {
    mockGetLastNotificationResponse.mockReturnValue(
      buildResponse(MEDITATE_ACTION_ID, { dateString: "2026-09-30" }),
    );
    const router = buildRouter();

    handleInitialNotificationResponse(router);

    expect(mockGetMeditationRouteParams).toHaveBeenCalledWith({
      dateString: "2026-09-30",
    });
    expect(router.dismissAll).toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith({ pathname: "/meditation" });
    expect(mockDismissNotificationAsync).toHaveBeenCalledWith("notification-1");
    expect(mockClearLastNotificationResponse).toHaveBeenCalled();
  });

  it("opens the meditation screen for a plain tap", () => {
    mockGetLastNotificationResponse.mockReturnValue(
      buildResponse(Notifications.DEFAULT_ACTION_IDENTIFIER, {}),
    );
    const router = buildRouter();

    handleInitialNotificationResponse(router);

    expect(router.push).toHaveBeenCalledWith({ pathname: "/meditation" });
  });

  it("opens the home screen on the referring date for a reply notification", () => {
    mockGetLastNotificationResponse.mockReturnValue(
      buildResponse(Notifications.DEFAULT_ACTION_IDENTIFIER, {
        type: "reply",
        date: "2026-09-29",
      }),
    );
    const router = buildRouter();

    handleInitialNotificationResponse(router);

    expect(router.push).toHaveBeenCalledWith("/?date=2026-09-29");
    expect(mockDismissNotificationAsync).toHaveBeenCalledWith("notification-1");
    expect(mockClearLastNotificationResponse).toHaveBeenCalled();
  });

  it("does not navigate when the proverb has no route params", () => {
    mockGetLastNotificationResponse.mockReturnValue(
      buildResponse(MEDITATE_ACTION_ID, {}),
    );
    mockGetMeditationRouteParams.mockReturnValue(null);
    const router = buildRouter();

    handleInitialNotificationResponse(router);

    expect(router.push).not.toHaveBeenCalled();
    expect(mockDismissNotificationAsync).not.toHaveBeenCalled();
  });

  it("clears the launch response without navigating for an unknown payload", () => {
    mockGetLastNotificationResponse.mockReturnValue(
      buildResponse(MEDITATE_ACTION_ID, { type: "widget" }),
    );
    const router = buildRouter();

    handleInitialNotificationResponse(router);

    expect(router.push).not.toHaveBeenCalled();
    expect(mockClearLastNotificationResponse).toHaveBeenCalled();
  });

  it("ignores a non-meditation action with no reply payload", () => {
    mockGetLastNotificationResponse.mockReturnValue(
      buildResponse("SOME_OTHER_ACTION", {}),
    );
    const router = buildRouter();

    handleInitialNotificationResponse(router);

    expect(router.push).not.toHaveBeenCalled();
  });
});

describe("subscribeToNotificationResponses", () => {
  it("routes a tap received while the app is running", () => {
    const router = buildRouter();
    const remove = jest.fn();
    let listener: (response: FakeResponse) => void = () => {};
    mockAddListener.mockImplementation((handler) => {
      listener = handler as (response: FakeResponse) => void;
      return { remove } as never;
    });

    const unsubscribe = subscribeToNotificationResponses(router);
    listener(buildResponse(MEDITATE_ACTION_ID, {}));

    expect(router.push).toHaveBeenCalledWith({ pathname: "/meditation" });
    expect(mockDismissNotificationAsync).toHaveBeenCalledWith("notification-1");

    unsubscribe();
    expect(remove).toHaveBeenCalled();
  });
});
