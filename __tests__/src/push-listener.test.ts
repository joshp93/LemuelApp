import * as Notifications from "expo-notifications";
import { getProverbForTheDay } from "../../src/api/proverbs";
import { getChosenVersion } from "../../src/api/version-storage";
import {
  getNotificationMode,
  getNotificationSentDates,
  getNotificationsEnabled,
  getRandomWindowEndMinute,
  getRandomWindowHourEnd,
  getRandomWindowHourStart,
  getRandomWindowStartMinute,
  getScheduledTimeHour,
  getScheduledTimeMinute,
} from "../../src/notifications/notification-preferences";
import {
  ensureNotificationsScheduled,
  handleDailyProverbPush,
  resetNotificationEnsureChain,
  scheduleNotificationForModeAndDate,
} from "../../src/notifications/push-listener";
import { updateProverbWidget } from "../../src/widgets";

jest.mock("expo-background-task", () => ({
  getStatusAsync: jest.fn().mockResolvedValue(2),
  registerTaskAsync: jest.fn(),
  BackgroundTaskStatus: { Restricted: 1, Available: 2 },
  BackgroundTaskResult: {
    Success: "Success",
    Failed: "Failed",
  },
}));

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
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
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

jest.mock("expo-task-manager");

jest.mock("../../src/api/proverbs");
jest.mock("../../src/api/version-storage");
jest.mock("../../src/widgets", () => ({
  updateProverbWidget: jest.fn(),
}));
jest.mock("../../src/notifications/notification-preferences", () => ({
  getNotificationMode: jest.fn(),
  getNotificationSentDates: jest.fn().mockResolvedValue([]),
  getNotificationsEnabled: jest.fn(),
  getRandomWindowHourStart: jest.fn(),
  getRandomWindowStartMinute: jest.fn(),
  getRandomWindowHourEnd: jest.fn(),
  getRandomWindowEndMinute: jest.fn(),
  getScheduledTimeHour: jest.fn(),
  getScheduledTimeMinute: jest.fn(),
  addNotificationSentDate: jest.fn(),
}));

const mockProverb = {
  ref: "Proverbs 3:5",
  proverb: "Trust in the LORD",
};

const toLocalDateString = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTodayStr = (): string => toLocalDateString(new Date());

const getTomorrowStr = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toLocalDateString(d);
};

describe("push-listener", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    resetNotificationEnsureChain();

    (getChosenVersion as jest.Mock).mockResolvedValue("niv");
    (getProverbForTheDay as jest.Mock).mockResolvedValue(mockProverb);
    (updateProverbWidget as jest.Mock).mockResolvedValue(undefined);
    (getNotificationsEnabled as jest.Mock).mockResolvedValue(true);
    (getNotificationSentDates as jest.Mock).mockResolvedValue([]);
    (
      Notifications.getAllScheduledNotificationsAsync as jest.Mock
    ).mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("scheduleNotificationForModeAndDate", () => {
    describe("scheduled mode", () => {
      beforeEach(() => {
        (getScheduledTimeHour as jest.Mock).mockResolvedValue(9);
        (getScheduledTimeMinute as jest.Mock).mockResolvedValue(0);
      });

      it("should schedule a notification for a future time", async () => {
        const futureDate = "2099-06-16";
        await scheduleNotificationForModeAndDate(
          "scheduled",
          futureDate,
          mockProverb,
        );

        expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            identifier: "daily-proverb-meditation-2099-06-16",
            trigger: expect.objectContaining({
              type: Notifications.SchedulableTriggerInputTypes.DATE,
            }),
          }),
        );
      });

      it("should NOT call cancelScheduledNotificationAsync (scheduling is separate from cancellation)", async () => {
        const futureDate = "2099-06-16";
        await scheduleNotificationForModeAndDate(
          "scheduled",
          futureDate,
          mockProverb,
        );

        expect(
          Notifications.cancelScheduledNotificationAsync,
        ).not.toHaveBeenCalled();
      });

      it("should send immediately when target time is in the past", async () => {
        const pastDate = "2020-06-16";
        await scheduleNotificationForModeAndDate(
          "scheduled",
          pastDate,
          mockProverb,
        );

        expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            identifier: "daily-proverb-meditation-2020-06-16",
            trigger: null,
          }),
        );
      });
    });

    describe("random mode", () => {
      beforeEach(() => {
        (getRandomWindowHourStart as jest.Mock).mockResolvedValue(9);
        (getRandomWindowStartMinute as jest.Mock).mockResolvedValue(0);
        (getRandomWindowHourEnd as jest.Mock).mockResolvedValue(19);
        (getRandomWindowEndMinute as jest.Mock).mockResolvedValue(0);
      });

      it("should schedule a notification for the correct date (not always tomorrow)", async () => {
        const futureDate = "2099-06-16";
        jest.spyOn(Math, "random").mockReturnValue(0.5);

        await scheduleNotificationForModeAndDate(
          "random",
          futureDate,
          mockProverb,
        );

        expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            identifier: "daily-proverb-meditation-2099-06-16",
            trigger: expect.objectContaining({
              type: Notifications.SchedulableTriggerInputTypes.DATE,
            }),
          }),
        );

        jest.restoreAllMocks();
      });

      it("should generate different hours for different seed dates", async () => {
        const futureDate = "2099-06-16";
        jest.spyOn(Math, "random").mockReturnValue(0.3);

        await scheduleNotificationForModeAndDate(
          "random",
          futureDate,
          mockProverb,
        );

        const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock
          .calls[0][0];
        const triggerDate = call.trigger.date as Date;

        const resolvedDate = new Date(`${futureDate}T00:00:00`);
        expect(triggerDate.getFullYear()).toBe(resolvedDate.getFullYear());
        expect(triggerDate.getMonth()).toBe(resolvedDate.getMonth());
        expect(triggerDate.getDate()).toBe(resolvedDate.getDate());

        jest.restoreAllMocks();
      });
    });
  });

  describe("handleDailyProverbPush", () => {
    beforeEach(() => {
      (getNotificationMode as jest.Mock).mockResolvedValue("scheduled");
      (getScheduledTimeHour as jest.Mock).mockResolvedValue(9);
      (getScheduledTimeMinute as jest.Mock).mockResolvedValue(0);
    });

    it("should update widget with today's proverb", async () => {
      (getProverbForTheDay as jest.Mock).mockResolvedValue(mockProverb);
      (
        Notifications.getAllScheduledNotificationsAsync as jest.Mock
      ).mockResolvedValue([]);

      await handleDailyProverbPush();

      expect(updateProverbWidget).toHaveBeenCalledWith(mockProverb);
      expect(getProverbForTheDay).toHaveBeenCalledWith(
        "niv",
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      );
    });

    it("should skip scheduling when notifications are disabled", async () => {
      (getNotificationsEnabled as jest.Mock).mockResolvedValue(false);

      await handleDailyProverbPush();

      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it("should cancel and schedule today's notification when none exists", async () => {
      (
        Notifications.getAllScheduledNotificationsAsync as jest.Mock
      ).mockResolvedValue([]);

      await handleDailyProverbPush();

      const todayStr = getTodayStr();
      expect(
        Notifications.cancelScheduledNotificationAsync,
      ).toHaveBeenCalledWith(`daily-proverb-meditation-${todayStr}`);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    });

    it("should skip today's scheduling when today notification already exists (matches by ID)", async () => {
      const todayStr = getTodayStr();
      const todayAt10am = new Date();
      todayAt10am.setHours(10, 0, 0, 0);
      const existingNotification = {
        identifier: `daily-proverb-meditation-${todayStr}`,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: todayAt10am,
        },
      };
      (
        Notifications.getAllScheduledNotificationsAsync as jest.Mock
      ).mockResolvedValue([existingNotification]);

      await handleDailyProverbPush();

      const cancelCalls = (
        Notifications.cancelScheduledNotificationAsync as jest.Mock
      ).mock.calls.map((c: unknown[]) => c[0]);
      const cancelForToday = cancelCalls.filter(
        (id: unknown) => id === `daily-proverb-meditation-${todayStr}`,
      );
      expect(cancelForToday).toHaveLength(0);
    });

    it("should NOT skip today when a notification with a DIFFERENT ID exists for today", async () => {
      const existingNotification = {
        identifier: "some-other-notification",
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(Date.now() + 3600000),
        },
      };
      (
        Notifications.getAllScheduledNotificationsAsync as jest.Mock
      ).mockResolvedValue([existingNotification]);

      await handleDailyProverbPush();

      const todayStr = getTodayStr();
      expect(
        Notifications.cancelScheduledNotificationAsync,
      ).toHaveBeenCalledWith(`daily-proverb-meditation-${todayStr}`);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    });

    it("should schedule today and tomorrow with different notification IDs", async () => {
      (
        Notifications.getAllScheduledNotificationsAsync as jest.Mock
      ).mockResolvedValue([]);

      await handleDailyProverbPush();

      const scheduleCalls = (
        Notifications.scheduleNotificationAsync as jest.Mock
      ).mock.calls.map(
        (c: unknown[]) => (c[0] as { identifier: string }).identifier,
      );

      const todayStr = getTodayStr();
      const tomorrowStr = getTomorrowStr();

      expect(scheduleCalls).toContain(`daily-proverb-meditation-${todayStr}`);
      expect(scheduleCalls).toContain(
        `daily-proverb-meditation-${tomorrowStr}`,
      );
      expect(new Set(scheduleCalls).size).toBe(scheduleCalls.length);
    });

    it("should skip today when notification was already handled (sent-date match)", async () => {
      (getNotificationSentDates as jest.Mock).mockResolvedValue([
        getTodayStr(),
      ]);
      (
        Notifications.getAllScheduledNotificationsAsync as jest.Mock
      ).mockResolvedValue([]);

      await handleDailyProverbPush();

      const cancelCalls = (
        Notifications.cancelScheduledNotificationAsync as jest.Mock
      ).mock.calls.map((c: unknown[]) => c[0]);
      const cancelForToday = cancelCalls.filter(
        (id: unknown) => id === `daily-proverb-meditation-${getTodayStr()}`,
      );
      expect(cancelForToday).toHaveLength(0);
    });

    it("should NOT immediately re-send today when today fired earlier (regression)", async () => {
      const id = `daily-proverb-meditation-${getTodayStr()}`;
      (getNotificationSentDates as jest.Mock).mockResolvedValue([
        getTodayStr(),
      ]);
      (
        Notifications.getAllScheduledNotificationsAsync as jest.Mock
      ).mockResolvedValue([]);

      await handleDailyProverbPush();

      const scheduleCalls = (
        Notifications.scheduleNotificationAsync as jest.Mock
      ).mock.calls.map(
        (c: unknown[]) => (c[0] as { identifier: string }).identifier,
      );
      const scheduleForToday = scheduleCalls.filter((x) => x === id);
      const cancelForToday = (
        Notifications.cancelScheduledNotificationAsync as jest.Mock
      ).mock.calls
        .map((c: unknown[]) => c[0])
        .filter((x: unknown) => x === id);

      expect(scheduleForToday).toHaveLength(0);
      expect(cancelForToday).toHaveLength(0);
    });

    it("should still schedule today when handled set holds only future days (no clobber)", async () => {
      (getNotificationSentDates as jest.Mock).mockResolvedValue([
        getTomorrowStr(),
        "2099-01-01",
      ]);
      (
        Notifications.getAllScheduledNotificationsAsync as jest.Mock
      ).mockResolvedValue([]);

      await handleDailyProverbPush();

      const todayId = `daily-proverb-meditation-${getTodayStr()}`;
      expect(
        Notifications.cancelScheduledNotificationAsync,
      ).toHaveBeenCalledWith(todayId);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    });

    it("should schedule today when no handled dates are recorded", async () => {
      (
        Notifications.getAllScheduledNotificationsAsync as jest.Mock
      ).mockResolvedValue([]);

      await handleDailyProverbPush();

      expect(
        Notifications.cancelScheduledNotificationAsync,
      ).toHaveBeenCalledWith(`daily-proverb-meditation-${getTodayStr()}`);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    });

    it("should cancel today's old notification before scheduling today's new one", async () => {
      (
        Notifications.getAllScheduledNotificationsAsync as jest.Mock
      ).mockResolvedValue([]);

      await handleDailyProverbPush();

      const todayStr = getTodayStr();
      const cancelCalls = (
        Notifications.cancelScheduledNotificationAsync as jest.Mock
      ).mock.calls.map((c: unknown[]) => c[0]);

      expect(cancelCalls).toContain(`daily-proverb-meditation-${todayStr}`);
    });

    it("should cancel tomorrow's old notification before scheduling tomorrow's", async () => {
      (
        Notifications.getAllScheduledNotificationsAsync as jest.Mock
      ).mockResolvedValue([]);

      await handleDailyProverbPush();

      const tomorrowStr = getTomorrowStr();
      const cancelCalls = (
        Notifications.cancelScheduledNotificationAsync as jest.Mock
      ).mock.calls.map((c: unknown[]) => c[0]);

      expect(cancelCalls).toContain(`daily-proverb-meditation-${tomorrowStr}`);
    });

    it("should fetch proverbs for both today and tomorrow", async () => {
      (
        Notifications.getAllScheduledNotificationsAsync as jest.Mock
      ).mockResolvedValue([]);

      await handleDailyProverbPush();

      expect(getProverbForTheDay).toHaveBeenCalledTimes(2);
    });

    it("should handle errors gracefully without throwing", async () => {
      (getProverbForTheDay as jest.Mock).mockRejectedValue(
        new Error("API error"),
      );

      await expect(handleDailyProverbPush()).resolves.not.toThrow();
    });
  });

  describe("ensureNotificationsScheduled force behaviour", () => {
    beforeEach(() => {
      jest.setSystemTime(new Date(2026, 7, 6, 8, 0, 0));
      (getNotificationMode as jest.Mock).mockResolvedValue("scheduled");
      (getScheduledTimeHour as jest.Mock).mockResolvedValue(9);
      (getScheduledTimeMinute as jest.Mock).mockResolvedValue(0);
    });

    const pendingToday = () => ({
      identifier: `daily-proverb-meditation-${getTodayStr()}`,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(),
      },
    });

    it("should skip today when force=true but today already fired", async () => {
      const id = `daily-proverb-meditation-${getTodayStr()}`;
      (getNotificationSentDates as jest.Mock).mockResolvedValue([
        getTodayStr(),
      ]);
      (
        Notifications.getAllScheduledNotificationsAsync as jest.Mock
      ).mockResolvedValue([]);

      await ensureNotificationsScheduled(2, true);

      const scheduleCalls = (
        Notifications.scheduleNotificationAsync as jest.Mock
      ).mock.calls.map(
        (c: unknown[]) => (c[0] as { identifier: string }).identifier,
      );
      const cancelForToday = (
        Notifications.cancelScheduledNotificationAsync as jest.Mock
      ).mock.calls
        .map((c: unknown[]) => c[0])
        .filter((x: unknown) => x === id);

      expect(scheduleCalls).not.toContain(id);
      expect(cancelForToday).toHaveLength(0);
    });

    it("should re-schedule today when force=true and it is still pending", async () => {
      const id = `daily-proverb-meditation-${getTodayStr()}`;
      (getNotificationSentDates as jest.Mock).mockResolvedValue([
        getTodayStr(),
      ]);

      const scheduled: Array<{
        identifier: string;
        trigger: { type: string; date: Date };
      }> = [pendingToday()];
      (
        Notifications.getAllScheduledNotificationsAsync as jest.Mock
      ).mockImplementation(async () => scheduled);
      (
        Notifications.cancelScheduledNotificationAsync as jest.Mock
      ).mockImplementation(async (cancelId: string) => {
        const idx = scheduled.findIndex((n) => n.identifier === cancelId);
        if (idx >= 0) scheduled.splice(idx, 1);
      });

      await ensureNotificationsScheduled(2, true);

      expect(
        Notifications.cancelScheduledNotificationAsync,
      ).toHaveBeenCalledWith(id);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: id,
          trigger: expect.objectContaining({
            type: Notifications.SchedulableTriggerInputTypes.DATE,
          }),
        }),
      );
    });

    it("should skip future days already handled when force=false", async () => {
      (getNotificationSentDates as jest.Mock).mockResolvedValue([
        getTomorrowStr(),
      ]);
      (
        Notifications.getAllScheduledNotificationsAsync as jest.Mock
      ).mockResolvedValue([]);

      await ensureNotificationsScheduled(3, false);

      const cancelCalls = (
        Notifications.cancelScheduledNotificationAsync as jest.Mock
      ).mock.calls.map((c: unknown[]) => c[0]);
      expect(cancelCalls).not.toContain(
        `daily-proverb-meditation-${getTomorrowStr()}`,
      );
      expect(cancelCalls).toContain(
        `daily-proverb-meditation-${getTodayStr()}`,
      );
    });
  });

  describe("ensureNotificationsScheduled serialization", () => {
    it("should queue concurrent calls instead of running them at the same time", async () => {
      jest.setSystemTime(new Date(2026, 7, 6, 8, 0, 0));
      (getNotificationMode as jest.Mock).mockResolvedValue("scheduled");
      (getScheduledTimeHour as jest.Mock).mockResolvedValue(9);
      (getScheduledTimeMinute as jest.Mock).mockResolvedValue(0);
      (
        Notifications.getAllScheduledNotificationsAsync as jest.Mock
      ).mockResolvedValue([]);
      (getNotificationSentDates as jest.Mock).mockResolvedValue([]);

      let release: (() => void) | undefined;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });

      const proverbMock = jest.fn();
      proverbMock.mockReturnValueOnce(gate.then(() => mockProverb));
      proverbMock.mockResolvedValue(mockProverb);
      (getProverbForTheDay as jest.Mock).mockImplementation(proverbMock);

      const first = ensureNotificationsScheduled(5, false);
      const second = ensureNotificationsScheduled(5, false);

      await Promise.resolve();
      await Promise.resolve();

      expect(getProverbForTheDay).toHaveBeenCalledTimes(1);

      release!();
      await Promise.all([first, second]);

      expect(getProverbForTheDay.mock.calls.length).toBeGreaterThan(1);
    });
  });
});
