import * as ProverbApi from "../app/_api/proverbs";
import { Proverb } from "../app/_models/proverb";
import {
  getDelayUntilNextUpdate,
  manuallyUpdateWidget,
} from "../app/_services/widget-background-task";
import * as WidgetStorage from "../app/_services/widget-storage";

// Mock dependencies
jest.mock("../app/_api/proverbs");
jest.mock("../app/_services/widget-storage");
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Mock expo modules with manual mock setup
jest.mock("expo-background-fetch", () => ({
  registerTaskAsync: jest.fn().mockResolvedValue(undefined),
  unregisterTaskAsync: jest.fn().mockResolvedValue(undefined),
  getRegisteredTasksAsync: jest.fn().mockResolvedValue([]),
  BackgroundFetchResult: {
    NewData: 1,
    NoData: 2,
    Failed: 3,
  },
}));

jest.mock("expo-task-manager", () => ({
  defineTask: jest.fn(),
}));

const mockProverb: Proverb = {
  proverb: "A wise man knows himself to be a fool",
  ref: "Proverbs 12:15",
};

describe("Widget Background Task Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("getDelayUntilNextUpdate", () => {
    it("should calculate delay until 5:05 AM today if not yet passed", () => {
      // Set time to 3:00 AM
      jest.setSystemTime(new Date("2026-04-28T03:00:00").getTime());

      const delay = getDelayUntilNextUpdate();

      // Should be approximately 2 hours 5 minutes
      const expectedDelay = (5 * 60 + 5 - 3 * 60) * 60 * 1000;
      expect(Math.abs(delay - expectedDelay)).toBeLessThan(1000); // Within 1 second
    });

    it("should calculate delay until 5:05 AM tomorrow if already passed today", () => {
      // Set time to 6:00 AM
      jest.setSystemTime(new Date("2026-04-28T06:00:00").getTime());

      const delay = getDelayUntilNextUpdate();

      // Should be approximately 23 hours 5 minutes
      const nextDay = new Date("2026-04-29T05:05:00").getTime();
      const currentTime = new Date("2026-04-28T06:00:00").getTime();
      const expectedDelay = nextDay - currentTime;

      expect(Math.abs(delay - expectedDelay)).toBeLessThan(1000); // Within 1 second
    });

    it("should calculate delay exactly at 5:05 AM (should be tomorrow)", () => {
      // Set time to exactly 5:05 AM
      jest.setSystemTime(new Date("2026-04-28T05:05:00").getTime());

      const delay = getDelayUntilNextUpdate();

      // Should be approximately 24 hours
      const nextDay = new Date("2026-04-29T05:05:00").getTime();
      const currentTime = new Date("2026-04-28T05:05:00").getTime();
      const expectedDelay = nextDay - currentTime;

      expect(Math.abs(delay - expectedDelay)).toBeLessThan(1000); // Within 1 second
    });

    it("should handle time just before 5:05 AM", () => {
      // Set time to 5:04 AM
      jest.setSystemTime(new Date("2026-04-28T05:04:00").getTime());

      const delay = getDelayUntilNextUpdate();

      // Should be approximately 1 minute
      const expectedDelay = 60 * 1000;
      expect(Math.abs(delay - expectedDelay)).toBeLessThan(1000); // Within 1 second
    });
  });

  describe("manuallyUpdateWidget", () => {
    it("should fetch and save proverb", async () => {
      (ProverbApi.getProverbForTheDay as jest.Mock).mockResolvedValue(
        mockProverb,
      );
      (WidgetStorage.saveProverbForWidget as jest.Mock).mockResolvedValue(
        undefined,
      );

      await manuallyUpdateWidget();

      expect(ProverbApi.getProverbForTheDay).toHaveBeenCalled();
      expect(WidgetStorage.saveProverbForWidget).toHaveBeenCalledWith(
        mockProverb,
      );
    });

    it("should throw error if fetch fails", async () => {
      const error = new Error("Fetch failed");
      (ProverbApi.getProverbForTheDay as jest.Mock).mockRejectedValue(error);

      await expect(manuallyUpdateWidget()).rejects.toThrow("Fetch failed");
    });

    it("should throw error if save fails", async () => {
      (ProverbApi.getProverbForTheDay as jest.Mock).mockResolvedValue(
        mockProverb,
      );
      const error = new Error("Save failed");
      (WidgetStorage.saveProverbForWidget as jest.Mock).mockRejectedValue(
        error,
      );

      await expect(manuallyUpdateWidget()).rejects.toThrow("Save failed");
    });
  });
});
