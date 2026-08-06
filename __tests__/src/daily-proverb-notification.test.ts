import * as Notifications from "expo-notifications";
import type { Proverb } from "../../src/models/proverb";
import {
  cancelProverbNotification,
  cleanupNotifications,
  EXAMPLE_NOTIFICATION_ID,
  getNotificationIdForDate,
  getRandomTimeInWindow,
  initializeNotifications,
  MEDITATE_ACTION_ID,
  resolveScheduleDate,
  scheduleProverbNotification,
  sendExampleProverbNotification,
  sendProverbNotification,
} from "../../src/notifications/daily-proverb-notification";

jest.mock("expo-notifications", () => ({
  SchedulableTriggerInputTypes: {
    DATE: "date",
    TIME_INTERVAL: "timeInterval",
  },
  AndroidImportance: {
    HIGH: "high",
  },
  AndroidNotificationPriority: {
    MAX: "max",
  },
  setNotificationHandler: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  setNotificationCategoryAsync: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
  dismissNotificationAsync: jest.fn(),
}));

jest.mock("../../src/notifications/notification-preferences", () => ({
  addNotificationSentDate: jest.fn(),
  getNotificationSentDates: jest.fn().mockResolvedValue([]),
}));

const mockAddNotificationSentDate =
  require("../../src/notifications/notification-preferences")
    .addNotificationSentDate as jest.Mock;
const mockGetNotificationSentDates =
  require("../../src/notifications/notification-preferences")
    .getNotificationSentDates as jest.Mock;

const mockProverb: Proverb = {
  ref: "Proverbs 3:5",
  proverb: "Trust in the LORD",
};

describe("Notification Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetNotificationSentDates.mockResolvedValue([]);
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "granted",
    });
    (
      Notifications.getAllScheduledNotificationsAsync as jest.Mock
    ).mockResolvedValue([]);
  });

  afterEach(() => {
    cleanupNotifications();
  });

  describe("initializeNotifications", () => {
    it("should set notification handler", () => {
      initializeNotifications();
      expect(Notifications.setNotificationHandler).toHaveBeenCalled();
    });

    it("should create category with meditate and snooze buttons", () => {
      initializeNotifications();
      expect(Notifications.setNotificationCategoryAsync).toHaveBeenCalledWith(
        "proverb-meditation",
        [
          expect.objectContaining({
            identifier: MEDITATE_ACTION_ID,
            buttonTitle: "Begin meditation",
            options: { opensAppToForeground: true },
          }),
          expect.objectContaining({
            identifier: "snooze",
            buttonTitle: "Snooze 10 min",
            options: { opensAppToForeground: false },
          }),
        ],
      );
    });

    it("should set up snooze response listener", () => {
      initializeNotifications();
      expect(
        Notifications.addNotificationResponseReceivedListener,
      ).toHaveBeenCalled();
    });

    it("should not set up duplicate listener", () => {
      const mockAdd =
        Notifications.addNotificationResponseReceivedListener as jest.Mock;
      initializeNotifications();
      initializeNotifications();
      expect(mockAdd).toHaveBeenCalledTimes(1);
    });
  });

  describe("cleanupNotifications", () => {
    it("should remove the snooze listener", () => {
      const mockRemove = jest.fn();
      (
        Notifications.addNotificationResponseReceivedListener as jest.Mock
      ).mockReturnValueOnce({ remove: mockRemove });

      initializeNotifications();
      cleanupNotifications();

      expect(mockRemove).toHaveBeenCalled();
    });
  });

  describe("MEDITATE_ACTION_ID", () => {
    it("should export the meditate action identifier", () => {
      expect(MEDITATE_ACTION_ID).toBe("meditate");
    });
  });

  describe("notification response handling", () => {
    it("should navigate to meditation when meditate action is triggered", () => {
      initializeNotifications();

      const listenerCallback = (
        Notifications.addNotificationResponseReceivedListener as jest.Mock
      ).mock.calls[0][0];

      const push = jest.fn();
      const response = {
        actionIdentifier: MEDITATE_ACTION_ID,
        notification: {
          request: {
            content: {
              data: { proverb: "Trust in the LORD", ref: "Proverbs 3:5" },
            },
          },
        },
      };

      if (response.actionIdentifier === MEDITATE_ACTION_ID) {
        const { proverb, ref } = response.notification.request.content
          .data as Record<string, unknown>;
        if (typeof proverb === "string" && typeof ref === "string") {
          push({ pathname: "/meditation", params: { proverb, ref } });
        }
      }

      expect(push).toHaveBeenCalledWith({
        pathname: "/meditation",
        params: { proverb: "Trust in the LORD", ref: "Proverbs 3:5" },
      });
    });

    it("should not navigate for non-meditate actions", () => {
      initializeNotifications();

      const push = jest.fn();
      const response = {
        actionIdentifier: "snooze",
        notification: {
          request: {
            content: {
              data: { proverb: "Trust in the LORD", ref: "Proverbs 3:5" },
            },
          },
        },
      };

      if (
        response.actionIdentifier === "meditate" &&
        typeof response.notification.request.content.data.proverb ===
          "string" &&
        typeof response.notification.request.content.data.ref === "string"
      ) {
        push({ pathname: "/meditation", params: { proverb: "", ref: "" } });
      }

      expect(push).not.toHaveBeenCalled();
    });

    it("should not navigate when proverb data is missing", () => {
      initializeNotifications();

      const push = jest.fn();
      const response = {
        actionIdentifier: MEDITATE_ACTION_ID,
        notification: {
          request: {
            content: {
              data: {},
            },
          },
        },
      };

      if (response.actionIdentifier === MEDITATE_ACTION_ID) {
        const { proverb, ref } = response.notification.request.content
          .data as Record<string, unknown>;
        if (typeof proverb === "string" && typeof ref === "string") {
          push({ pathname: "/meditation", params: { proverb, ref } });
        }
      }

      expect(push).not.toHaveBeenCalled();
    });
  });

  describe("getNotificationIdForDate", () => {
    it("should return the correct ID for a given date string", () => {
      const id = getNotificationIdForDate("2026-06-16");
      expect(id).toBe("daily-proverb-meditation-2026-06-16");
    });

    it("should produce different IDs for different dates", () => {
      const id1 = getNotificationIdForDate("2026-06-16");
      const id2 = getNotificationIdForDate("2026-06-17");
      expect(id1).not.toBe(id2);
    });
  });

  describe("cancelProverbNotification", () => {
    it("should cancel with the correct date-specific ID", async () => {
      await cancelProverbNotification("2026-06-16");
      expect(
        Notifications.cancelScheduledNotificationAsync,
      ).toHaveBeenCalledWith("daily-proverb-meditation-2026-06-16");
    });

    it("should cancel a different ID for a different date", async () => {
      await cancelProverbNotification("2026-06-17");
      expect(
        Notifications.cancelScheduledNotificationAsync,
      ).toHaveBeenCalledWith("daily-proverb-meditation-2026-06-17");
    });
  });

  describe("scheduleProverbNotification", () => {
    it("should schedule with a date-specific identifier", async () => {
      const trigger = {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date("2026-06-16T09:00:00"),
      };
      await scheduleProverbNotification(mockProverb, trigger, "2026-06-16");

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: "daily-proverb-meditation-2026-06-16",
          trigger,
        }),
      );
    });

    it("should NOT cancel existing scheduled notifications (split from scheduling)", async () => {
      const trigger = {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date("2026-06-16T09:00:00"),
      };
      await scheduleProverbNotification(mockProverb, trigger, "2026-06-16");

      expect(
        Notifications.cancelScheduledNotificationAsync,
      ).not.toHaveBeenCalled();
    });

    it("should not schedule if permissions are not granted", async () => {
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "denied",
      });

      const trigger = {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date("2026-06-16T09:00:00"),
      };
      await scheduleProverbNotification(mockProverb, trigger, "2026-06-16");

      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it("should use MAX priority on Android", async () => {
      const { Platform } = require("react-native");
      Platform.OS = "android";

      const trigger = {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date("2026-06-16T09:00:00"),
      };
      await scheduleProverbNotification(mockProverb, trigger, "2026-06-16");

      const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock
        .calls[0][0];
      expect(call.content.priorityAndroid).toBe("max");
    });

    it("should use different identifiers for different dates", async () => {
      const trigger = {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date("2026-06-16T09:00:00"),
      };
      const trigger2 = {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date("2026-06-17T09:00:00"),
      };

      await scheduleProverbNotification(mockProverb, trigger, "2026-06-16");
      await scheduleProverbNotification(mockProverb, trigger2, "2026-06-17");

      const calls = (
        Notifications.scheduleNotificationAsync as jest.Mock
      ).mock.calls.map(
        (c: unknown[]) => (c[0] as { identifier: string }).identifier,
      );
      expect(calls).toEqual([
        "daily-proverb-meditation-2026-06-16",
        "daily-proverb-meditation-2026-06-17",
      ]);
    });

    it("should create Android channel before scheduling", async () => {
      const trigger = {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date("2026-06-16T09:00:00"),
      };
      await scheduleProverbNotification(mockProverb, trigger, "2026-06-16");

      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
        "daily-proverb",
        expect.objectContaining({ name: "Daily Proverb" }),
      );
    });

    it("should skip scheduling when notification for that date already exists", async () => {
      (
        Notifications.getAllScheduledNotificationsAsync as jest.Mock
      ).mockResolvedValue([
        { identifier: "daily-proverb-meditation-2026-06-16" },
      ]);

      const trigger = {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date("2026-06-16T09:00:00"),
      };
      const result = await scheduleProverbNotification(
        mockProverb,
        trigger,
        "2026-06-16",
      );

      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("should record sent date after successful scheduling", async () => {
      const trigger = {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date("2026-06-16T09:00:00"),
      };
      await scheduleProverbNotification(mockProverb, trigger, "2026-06-16");

      expect(mockAddNotificationSentDate).toHaveBeenCalledWith("2026-06-16");
    });

    it("should NOT record sent date when scheduling is skipped (duplicate)", async () => {
      (
        Notifications.getAllScheduledNotificationsAsync as jest.Mock
      ).mockResolvedValue([
        { identifier: "daily-proverb-meditation-2026-06-16" },
      ]);

      const trigger = {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date("2026-06-16T09:00:00"),
      };
      await scheduleProverbNotification(mockProverb, trigger, "2026-06-16");

      expect(mockAddNotificationSentDate).not.toHaveBeenCalled();
    });

    it("should NOT record sent date when permissions are denied", async () => {
      mockAddNotificationSentDate.mockClear();
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "denied",
      });

      const trigger = {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date("2026-06-16T09:00:00"),
      };
      await scheduleProverbNotification(mockProverb, trigger, "2026-06-16");

      expect(mockAddNotificationSentDate).not.toHaveBeenCalled();
    });

    it("should still schedule when notification for a different date exists", async () => {
      (
        Notifications.getAllScheduledNotificationsAsync as jest.Mock
      ).mockResolvedValue([
        { identifier: "daily-proverb-meditation-2026-06-15" },
      ]);

      const trigger = {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date("2026-06-16T09:00:00"),
      };
      const result = await scheduleProverbNotification(
        mockProverb,
        trigger,
        "2026-06-16",
      );

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
      expect(result).toBe("daily-proverb-meditation-2026-06-16");
    });
  });

  describe("sendProverbNotification", () => {
    const localTodayStr = () => {
      const now = new Date();
      return [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
      ].join("-");
    };

    it("should send immediately with null trigger", async () => {
      await sendProverbNotification(mockProverb, "2026-06-16");
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: "daily-proverb-meditation-2026-06-16",
          trigger: null,
        }),
      );
    });

    it("should use today's local date when no dateString is provided", async () => {
      await sendProverbNotification(mockProverb);

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: `daily-proverb-meditation-${localTodayStr()}`,
          trigger: null,
        }),
      );
    });

    it("should use MAX priority on Android", async () => {
      const { Platform } = require("react-native");
      Platform.OS = "android";

      await sendProverbNotification(mockProverb, "2026-06-16");
      const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock
        .calls[0][0];
      expect(call.content.priorityAndroid).toBe("max");
    });

    it("should not cancel all scheduled notifications", async () => {
      await sendProverbNotification(mockProverb, "2026-06-16");
      expect(
        Notifications.cancelAllScheduledNotificationsAsync,
      ).not.toHaveBeenCalled();
    });

    it("should not send if permissions are not granted", async () => {
      mockAddNotificationSentDate.mockClear();
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "denied",
      });

      await sendProverbNotification(mockProverb, "2026-06-16");
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
      expect(mockAddNotificationSentDate).not.toHaveBeenCalled();
    });

    it("should skip sending when the date has already been handled", async () => {
      mockGetNotificationSentDates.mockResolvedValue(["2026-06-16"]);

      await sendProverbNotification(mockProverb, "2026-06-16");

      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
      expect(mockAddNotificationSentDate).not.toHaveBeenCalled();
    });

    it("should record sent date after successful immediate send", async () => {
      mockAddNotificationSentDate.mockClear();
      await sendProverbNotification(mockProverb, "2026-06-16");

      expect(mockAddNotificationSentDate).toHaveBeenCalledWith("2026-06-16");
    });

    it("should record today's date when no dateString is provided", async () => {
      mockAddNotificationSentDate.mockClear();
      await sendProverbNotification(mockProverb);

      expect(mockAddNotificationSentDate).toHaveBeenCalledWith(localTodayStr());
    });
  });

  describe("sendExampleProverbNotification", () => {
    beforeEach(() => {
      mockGetNotificationSentDates.mockResolvedValue([]);
    });

    it("should send immediately using the dedicated example identifier", async () => {
      await sendExampleProverbNotification(mockProverb);

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: EXAMPLE_NOTIFICATION_ID,
          trigger: null,
        }),
      );
    });

    it("should NOT touch the real sent-dates list", async () => {
      await sendExampleProverbNotification(mockProverb);

      expect(mockAddNotificationSentDate).not.toHaveBeenCalled();
    });

    it("should not send if permissions are not granted", async () => {
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "denied",
      });

      await sendExampleProverbNotification(mockProverb);

      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });
  });

  describe("getRandomTimeInWindow", () => {
    it("returns a time within the given window", () => {
      const baseDate = new Date("2026-05-29T00:00:00");
      jest.spyOn(Math, "random").mockReturnValue(0.5);
      const result = getRandomTimeInWindow(baseDate, 9, 0, 19, 0);
      const minutes =
        (result.getHours() - baseDate.getHours()) * 60 + result.getMinutes();
      expect(minutes).toBeGreaterThanOrEqual(9 * 60);
      expect(minutes).toBeLessThan(19 * 60);
      jest.restoreAllMocks();
    });

    it("respects Math.random for min and max", () => {
      const baseDate = new Date("2026-05-29T00:00:00");

      jest.spyOn(Math, "random").mockReturnValue(0);
      const minResult = getRandomTimeInWindow(baseDate, 9, 0, 19, 0);
      expect(minResult.getHours()).toBe(9);
      expect(minResult.getMinutes()).toBe(0);

      jest.spyOn(Math, "random").mockReturnValue(0.9999);
      const maxResult = getRandomTimeInWindow(baseDate, 9, 0, 19, 0);
      expect(maxResult.getHours()).toBeLessThan(19);

      jest.restoreAllMocks();
    });
  });

  describe(resolveScheduleDate.name, () => {
    it("returns a date for the given date string and time", () => {
      const result = resolveScheduleDate("2026-06-04", 14, 30);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(5);
      expect(result.getDate()).toBe(4);
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(30);
    });

    it("handles month boundary date", () => {
      const result = resolveScheduleDate("2026-12-31", 9, 0);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(11);
      expect(result.getDate()).toBe(31);
      expect(result.getHours()).toBe(9);
      expect(result.getMinutes()).toBe(0);
    });
  });
});
