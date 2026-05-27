import AsyncStorage from "@react-native-async-storage/async-storage";
import * as BackgroundTask from "expo-background-task";
import type { TaskManagerTaskExecutor } from "expo-task-manager";
import * as TaskManager from "expo-task-manager";
import { getProverbForTheDay } from "../../src/api/proverbs";
import {
  defineBackgroundTask,
  initializeBackgroundTask,
  registerBackgroundTask,
} from "../../src/background/proverb-task";
import { scheduleProverbNotification } from "../../src/notifications/daily-proverb-notification";
import { getNotificationsEnabled } from "../../src/notifications/notification-preferences";
import { updateProverbWidget } from "../../src/widgets";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock("expo-background-task", () => ({
  getStatusAsync: jest.fn(),
  registerTaskAsync: jest.fn(),
  BackgroundTaskStatus: {
    Available: 2,
    Restricted: 1,
  },
  BackgroundTaskResult: {
    Success: 1,
    Failed: 2,
  },
}));

jest.mock("expo-task-manager", () => ({
  isTaskRegisteredAsync: jest.fn(),
  defineTask: jest.fn(),
}));

jest.mock("../../src/api/proverbs", () => ({
  getProverbForTheDay: jest.fn(),
}));

jest.mock("../../src/widgets", () => ({
  updateProverbWidget: jest.fn(),
}));

jest.mock("../../src/notifications/daily-proverb-notification", () => ({
  scheduleProverbNotification: jest.fn(),
}));
jest.mock("../../src/notifications/notification-preferences", () => ({
  getNotificationsEnabled: jest.fn(),
}));

describe("registerBackgroundTask", () => {
  const mockGetStatusAsync =
    BackgroundTask.getStatusAsync as jest.MockedFunction<
      typeof BackgroundTask.getStatusAsync
    >;
  const mockRegisterTaskAsync =
    BackgroundTask.registerTaskAsync as jest.MockedFunction<
      typeof BackgroundTask.registerTaskAsync
    >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should register the task when background tasks are available", async () => {
    mockGetStatusAsync.mockResolvedValueOnce(
      BackgroundTask.BackgroundTaskStatus.Available,
    );
    mockRegisterTaskAsync.mockResolvedValueOnce(undefined);

    await registerBackgroundTask();

    expect(mockGetStatusAsync).toHaveBeenCalledTimes(1);
    expect(mockRegisterTaskAsync).toHaveBeenCalledWith("daily-proverb-fetch", {
      minimumInterval: 60 * 24,
    });
  });

  it("should NOT register the task when background tasks are restricted", async () => {
    mockGetStatusAsync.mockResolvedValueOnce(
      BackgroundTask.BackgroundTaskStatus.Restricted,
    );

    await registerBackgroundTask();

    expect(mockGetStatusAsync).toHaveBeenCalledTimes(1);
    expect(mockRegisterTaskAsync).toHaveBeenCalledTimes(0);
  });
});

describe("initializeBackgroundTask", () => {
  const mockGetStatusAsync =
    BackgroundTask.getStatusAsync as jest.MockedFunction<
      typeof BackgroundTask.getStatusAsync
    >;
  const mockRegisterTaskAsync =
    BackgroundTask.registerTaskAsync as jest.MockedFunction<
      typeof BackgroundTask.registerTaskAsync
    >;
  const mockGetItem = AsyncStorage.getItem as jest.MockedFunction<
    typeof AsyncStorage.getItem
  >;
  const mockSetItem = AsyncStorage.setItem as jest.MockedFunction<
    typeof AsyncStorage.setItem
  >;
  const mockGetProverbForTheDay = getProverbForTheDay as jest.MockedFunction<
    typeof getProverbForTheDay
  >;
  const mockUpdateProverbWidget = updateProverbWidget as jest.MockedFunction<
    typeof updateProverbWidget
  >;
  const mockScheduleProverbNotification =
    scheduleProverbNotification as jest.MockedFunction<
      typeof scheduleProverbNotification
    >;

  const mockProverb = {
    ref: "Proverbs 3:5",
    proverb: "Trust in the LORD",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should register the task", async () => {
    mockGetItem.mockResolvedValueOnce("true");
    mockGetStatusAsync.mockResolvedValueOnce(
      BackgroundTask.BackgroundTaskStatus.Available,
    );
    mockRegisterTaskAsync.mockResolvedValueOnce(undefined);

    await initializeBackgroundTask();

    expect(mockGetStatusAsync).toHaveBeenCalledTimes(1);
    expect(mockRegisterTaskAsync).toHaveBeenCalledWith("daily-proverb-fetch", {
      minimumInterval: 60 * 24,
    });
  });

  it("should execute widget update on first run only (no notification)", async () => {
    mockGetItem.mockResolvedValueOnce(null);
    mockGetStatusAsync.mockResolvedValueOnce(
      BackgroundTask.BackgroundTaskStatus.Available,
    );
    mockRegisterTaskAsync.mockResolvedValueOnce(undefined);
    mockGetProverbForTheDay.mockResolvedValueOnce(mockProverb);
    mockUpdateProverbWidget.mockResolvedValueOnce(undefined);

    await initializeBackgroundTask();

    expect(mockGetProverbForTheDay).toHaveBeenCalledTimes(1);
    expect(mockUpdateProverbWidget).toHaveBeenCalledWith(mockProverb);
    expect(mockScheduleProverbNotification).not.toHaveBeenCalled();
    expect(mockSetItem).toHaveBeenCalledWith(
      "background_task_initialized",
      "true",
    );
  });

  it("should NOT execute widget update on subsequent runs", async () => {
    mockGetItem.mockResolvedValueOnce("true");
    mockGetStatusAsync.mockResolvedValueOnce(
      BackgroundTask.BackgroundTaskStatus.Available,
    );
    mockRegisterTaskAsync.mockResolvedValueOnce(undefined);

    await initializeBackgroundTask();

    expect(mockGetProverbForTheDay).not.toHaveBeenCalled();
    expect(mockUpdateProverbWidget).not.toHaveBeenCalled();
  });
});

describe("defineBackgroundTask", () => {
  const mockDefineTask = TaskManager.defineTask as jest.MockedFunction<
    typeof TaskManager.defineTask
  >;
  const mockGetProverbForTheDay = getProverbForTheDay as jest.MockedFunction<
    typeof getProverbForTheDay
  >;
  const mockUpdateProverbWidget = updateProverbWidget as jest.MockedFunction<
    typeof updateProverbWidget
  >;
  const mockScheduleProverbNotification =
    scheduleProverbNotification as jest.MockedFunction<
      typeof scheduleProverbNotification
    >;
  const mockGetNotificationsEnabled =
    getNotificationsEnabled as jest.MockedFunction<
      typeof getNotificationsEnabled
    >;

  const mockProverb = {
    ref: "Proverbs 3:5",
    proverb: "Trust in the LORD",
  };

  let taskExecutor: TaskManagerTaskExecutor;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockDefineTask.mockImplementation(
      (_name: string, task: TaskManagerTaskExecutor) => {
        taskExecutor = task;
      },
    );
    mockGetProverbForTheDay.mockResolvedValue(mockProverb);
    defineBackgroundTask();
  });

  it("should define a task with the correct name", () => {
    expect(mockDefineTask).toHaveBeenCalledWith(
      "daily-proverb-fetch",
      expect.any(Function),
    );
  });

  describe("when notifications are enabled", () => {
    it("should fetch proverb, update widget, and schedule notification", async () => {
      mockGetNotificationsEnabled.mockResolvedValue(true);

      await taskExecutor({
        data: {},
        error: null,
        executionInfo: { eventId: "", taskName: "" },
      });

      expect(mockGetProverbForTheDay).toHaveBeenCalledTimes(1);
      expect(mockUpdateProverbWidget).toHaveBeenCalledWith(mockProverb);
      expect(mockScheduleProverbNotification).toHaveBeenCalledWith(mockProverb);
    });
  });

  describe("when notifications are disabled", () => {
    it("should fetch proverb, update widget, but NOT schedule notification", async () => {
      mockGetNotificationsEnabled.mockResolvedValue(false);

      await taskExecutor({
        data: {},
        error: null,
        executionInfo: { eventId: "", taskName: "" },
      });

      expect(mockGetProverbForTheDay).toHaveBeenCalledTimes(1);
      expect(mockUpdateProverbWidget).toHaveBeenCalledWith(mockProverb);
      expect(mockScheduleProverbNotification).not.toHaveBeenCalled();
    });
  });

  it("should return BackgroundTaskResult.Success on success", async () => {
    mockGetNotificationsEnabled.mockResolvedValue(true);

    const result = await taskExecutor({
      data: {},
      error: null,
      executionInfo: { eventId: "", taskName: "" },
    });

    expect(result).toBe(BackgroundTask.BackgroundTaskResult.Success);
  });

  it("should catch errors and log to console on failure", async () => {
    const error = new Error("Network error");
    mockGetProverbForTheDay.mockRejectedValueOnce(error);
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await taskExecutor({
      data: {},
      error: null,
      executionInfo: { eventId: "", taskName: "" },
    });

    expect(consoleSpy).toHaveBeenCalledWith("Background task failed:", error);
  });
});
