import * as Notifications from "expo-notifications";
import {
  initializeNotifications,
  sendProverbNotification,
  scheduleProverbNotification,
  scheduleNextDayProverbNotification,
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
  setNotificationHandler: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
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

  describe("initializeNotifications", () => {
    it("should set notification handler", () => {
      initializeNotifications();
      expect(Notifications.setNotificationHandler).toHaveBeenCalled();
    });
  });

  describe("sendProverbNotification", () => {
    it("should send a notification immediately (null trigger)", async () => {
      await sendProverbNotification(mockProverb);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger: null,
        }),
      );
    });
  });

  describe("scheduleProverbNotification", () => {
    it("should schedule a notification for today", async () => {
      await scheduleProverbNotification(mockProverb);
      const mockCall = (Notifications.scheduleNotificationAsync as jest.Mock)
        .mock.calls[0][0];
      const scheduledDate: Date = mockCall.trigger.date;
      const today = new Date();
      expect(scheduledDate.getDate()).toBe(today.getDate());
      expect(scheduledDate.getFullYear()).toBe(today.getFullYear());
      expect(scheduledDate.getMonth()).toBe(today.getMonth());
    });
  });

  describe("scheduleNextDayProverbNotification", () => {
    it("should schedule a notification for tomorrow", async () => {
      await scheduleNextDayProverbNotification(mockProverb);
      const mockCall = (Notifications.scheduleNotificationAsync as jest.Mock)
        .mock.calls[0][0];
      const scheduledDate: Date = mockCall.trigger.date;
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(scheduledDate.getDate()).toBe(tomorrow.getDate());
    });

    it("should schedule between 9am and 7pm", async () => {
      await scheduleNextDayProverbNotification(mockProverb);
      const mockCall = (Notifications.scheduleNotificationAsync as jest.Mock)
        .mock.calls[0][0];
      const scheduledDate: Date = mockCall.trigger.date;
      expect(scheduledDate.getHours()).toBeGreaterThanOrEqual(9);
      expect(scheduledDate.getHours()).toBeLessThan(19);
    });
  });
});
