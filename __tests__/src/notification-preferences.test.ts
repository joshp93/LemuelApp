import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getNotificationMode,
  getNotificationsEnabled,
  getRandomWindowEndMinute,
  getRandomWindowHourEnd,
  getRandomWindowHourStart,
  getRandomWindowStartMinute,
  getScheduledTimeHour,
  getScheduledTimeMinute,
  setNotificationMode,
  setNotificationsEnabled,
  setRandomWindowEndMinute,
  setRandomWindowHourEnd,
  setRandomWindowHourStart,
  setRandomWindowStartMinute,
  setScheduledTimeHour,
  setScheduledTimeMinute,
} from "../../src/notifications/notification-preferences";

describe("notification-preferences", () => {
  beforeEach(() => {
    AsyncStorage.clear();
  });

  describe("notifications enabled", () => {
    it("returns false when nothing stored", async () => {
      const result = await getNotificationsEnabled();
      expect(result).toBe(false);
    });

    it("returns true after setting enabled", async () => {
      await setNotificationsEnabled(true);
      const result = await getNotificationsEnabled();
      expect(result).toBe(true);
    });

    it("returns false after setting disabled", async () => {
      await setNotificationsEnabled(false);
      const result = await getNotificationsEnabled();
      expect(result).toBe(false);
    });
  });

  describe("notification mode", () => {
    it("returns default 'random' when nothing stored", async () => {
      const mode = await getNotificationMode();
      expect(mode).toBe("random");
    });

    it("returns saved mode", async () => {
      await setNotificationMode("scheduled");
      const mode = await getNotificationMode();
      expect(mode).toBe("scheduled");
    });

    it("can switch back to random", async () => {
      await setNotificationMode("scheduled");
      await setNotificationMode("random");
      const mode = await getNotificationMode();
      expect(mode).toBe("random");
    });

    it("returns default for invalid stored value", async () => {
      await AsyncStorage.setItem("notification_mode", "invalid");
      const mode = await getNotificationMode();
      expect(mode).toBe("random");
    });
  });

  describe("random window start", () => {
    it("returns default 9 when nothing stored", async () => {
      const result = await getRandomWindowHourStart();
      expect(result).toBe(9);
    });

    it("returns saved value", async () => {
      await setRandomWindowHourStart(12);
      const result = await getRandomWindowHourStart();
      expect(result).toBe(12);
    });

    it("clamps to 0-23 range on save and retrieve", async () => {
      await AsyncStorage.setItem("random_window_start", "25");
      const result = await getRandomWindowHourStart();
      expect(result).toBe(9);
    });
  });

  describe("random window end", () => {
    it("returns default 19 when nothing stored", async () => {
      const result = await getRandomWindowHourEnd();
      expect(result).toBe(19);
    });

    it("returns saved value", async () => {
      await setRandomWindowHourEnd(14);
      const result = await getRandomWindowHourEnd();
      expect(result).toBe(14);
    });
  });

  describe("random window start minute", () => {
    it("returns default 0 when nothing stored", async () => {
      const result = await getRandomWindowStartMinute();
      expect(result).toBe(0);
    });

    it("returns saved value", async () => {
      await setRandomWindowStartMinute(30);
      const result = await getRandomWindowStartMinute();
      expect(result).toBe(30);
    });

    it("clamps to 0-59 range on save and retrieve", async () => {
      await AsyncStorage.setItem("random_window_start_minute", "99");
      const result = await getRandomWindowStartMinute();
      expect(result).toBe(0);
    });
  });

  describe("random window end minute", () => {
    it("returns default 0 when nothing stored", async () => {
      const result = await getRandomWindowEndMinute();
      expect(result).toBe(0);
    });

    it("returns saved value", async () => {
      await setRandomWindowEndMinute(45);
      const result = await getRandomWindowEndMinute();
      expect(result).toBe(45);
    });
  });

  describe("scheduled time hour", () => {
    it("returns default 9 when nothing stored", async () => {
      const result = await getScheduledTimeHour();
      expect(result).toBe(9);
    });

    it("returns saved value", async () => {
      await setScheduledTimeHour(14);
      const result = await getScheduledTimeHour();
      expect(result).toBe(14);
    });
  });

  describe("scheduled time minute", () => {
    it("returns default 0 when nothing stored", async () => {
      const result = await getScheduledTimeMinute();
      expect(result).toBe(0);
    });

    it("returns saved value", async () => {
      await setScheduledTimeMinute(30);
      const result = await getScheduledTimeMinute();
      expect(result).toBe(30);
    });

    it("clamps invalid stored values", async () => {
      await AsyncStorage.setItem("scheduled_time_minute", "99");
      const result = await getScheduledTimeMinute();
      expect(result).toBe(0);
    });
  });
});
