import * as Notifications from "expo-notifications";
import {
  cleanupNotifications,
  getRandomTimeInWindow,
  initializeNotifications,
  resolveScheduleDate,
  resolveScheduleDateForDate,
  sendProverbNotification,
} from "../../src/notifications/daily-proverb-notification";
import type { Proverb } from "../../src/models/proverb";

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
  scheduleNotificationAsync: jest.fn(),
  setNotificationCategoryAsync: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
  dismissNotificationAsync: jest.fn(),
}));

const mockProverb: Proverb = {
  ref: "Proverbs 3:5",
  proverb: "Trust in the LORD",
};

describe("Notification Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "granted",
    });
  });

  afterEach(() => {
    cleanupNotifications();
  });

  describe("initializeNotifications", () => {
    it("should set notification handler", () => {
      initializeNotifications();
      expect(Notifications.setNotificationHandler).toHaveBeenCalled();
    });

    it("should create snooze category", () => {
      initializeNotifications();
      expect(
        Notifications.setNotificationCategoryAsync,
      ).toHaveBeenCalledWith("proverb-meditation", [
        expect.objectContaining({
          identifier: "snooze",
          buttonTitle: "Snooze 10 min",
        }),
      ]);
    });

    it("should set up snooze response listener", () => {
      initializeNotifications();
      expect(
        Notifications.addNotificationResponseReceivedListener,
      ).toHaveBeenCalled();
    });

    it("should not set up duplicate listener", () => {
      const mockAdd = Notifications
        .addNotificationResponseReceivedListener as jest.Mock;
      initializeNotifications();
      initializeNotifications();
      expect(mockAdd).toHaveBeenCalledTimes(1);
    });
  });

  describe("cleanupNotifications", () => {
    it("should remove the snooze listener", () => {
      const mockRemove = jest.fn();
      (
        Notifications
          .addNotificationResponseReceivedListener as jest.Mock
      ).mockReturnValueOnce({ remove: mockRemove });

      initializeNotifications();
      cleanupNotifications();

      expect(mockRemove).toHaveBeenCalled();
    });
  });

  describe("sendProverbNotification", () => {
    it("should send a notification immediately (null trigger) without cancelling all", async () => {
      await sendProverbNotification(mockProverb);
      expect(
        Notifications.cancelAllScheduledNotificationsAsync,
      ).not.toHaveBeenCalled();
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger: null,
        }),
      );
    });

    it("should use MAX priority on Android", async () => {
      const { Platform } = require("react-native");
      Platform.OS = "android";

      await sendProverbNotification(mockProverb);
      const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock
        .calls[0][0];
      expect(call.content.priorityAndroid).toBe("max");
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

  describe("resolveScheduleDate", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("returns today when the time has not passed yet", () => {
      jest.setSystemTime(new Date("2026-05-29T10:00:00"));
      const result = resolveScheduleDate(14, 30);
      expect(result.getDate()).toBe(29);
      expect(result.getMonth()).toBe(4);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(30);
    });

    it("returns tomorrow when the time has already passed", () => {
      jest.setSystemTime(new Date("2026-05-29T15:00:00"));
      const result = resolveScheduleDate(14, 30);
      expect(result.getDate()).toBe(30);
      expect(result.getMonth()).toBe(4);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(30);
    });

    it("handles month boundary (May 31 to June 1)", () => {
      jest.setSystemTime(new Date("2026-05-31T23:00:00"));
      const result = resolveScheduleDate(9, 0);
      expect(result.getDate()).toBe(1);
      expect(result.getMonth()).toBe(5);
      expect(result.getFullYear()).toBe(2026);
    });
  });

  describe("resolveScheduleDateForDate", () => {
    it("returns a date for the given date string and time", () => {
      const result = resolveScheduleDateForDate("2026-06-04", 14, 30);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(5);
      expect(result.getDate()).toBe(4);
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(30);
    });

    it("handles month boundary date", () => {
      const result = resolveScheduleDateForDate("2026-12-31", 9, 0);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(11);
      expect(result.getDate()).toBe(31);
      expect(result.getHours()).toBe(9);
      expect(result.getMinutes()).toBe(0);
    });
  });
});