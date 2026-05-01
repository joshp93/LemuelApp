import {
  registerBackgroundTask,
  scheduleBackgroundTask,
  defineBackgroundTask,
} from "../app/background/proverb-task";
import * as BackgroundTask from "expo-background-task";
import * as TaskManager from "expo-task-manager";
import { getProverbForTheDay } from "../app/api/proverbs";
import { updateProverbWidget } from "../app/widgets";

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

jest.mock("../app/api/proverbs", () => ({
  getProverbForTheDay: jest.fn(),
}));

jest.mock("../app/widgets", () => ({
  updateProverbWidget: jest.fn(),
}));

describe("registerBackgroundTask", () => {
  const mockGetStatusAsync = BackgroundTask.getStatusAsync as jest.MockedFunction<
    typeof BackgroundTask.getStatusAsync
  >;
  const mockRegisterTaskAsync = BackgroundTask.registerTaskAsync as jest.MockedFunction<
    typeof BackgroundTask.registerTaskAsync
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should register the task when background tasks are available", async () => {
    mockGetStatusAsync.mockResolvedValueOnce(BackgroundTask.BackgroundTaskStatus.Available);
    mockRegisterTaskAsync.mockResolvedValueOnce(undefined);

    await registerBackgroundTask();

    expect(mockGetStatusAsync).toHaveBeenCalledTimes(1);
    expect(mockRegisterTaskAsync).toHaveBeenCalledWith(
      "daily-proverb-fetch",
      { minimumInterval: 60 * 24 }
    );
  });

  it("should NOT register the task when background tasks are restricted", async () => {
    mockGetStatusAsync.mockResolvedValueOnce(BackgroundTask.BackgroundTaskStatus.Restricted);

    await registerBackgroundTask();

    expect(mockGetStatusAsync).toHaveBeenCalledTimes(1);
    expect(mockRegisterTaskAsync).toHaveBeenCalledTimes(0);
  });
});

describe("scheduleBackgroundTask", () => {
  const mockIsTaskRegisteredAsync =
    TaskManager.isTaskRegisteredAsync as jest.MockedFunction<
      typeof TaskManager.isTaskRegisteredAsync
    >;
  const mockGetStatusAsync = BackgroundTask.getStatusAsync as jest.MockedFunction<
    typeof BackgroundTask.getStatusAsync
  >;
  const mockRegisterTaskAsync = BackgroundTask.registerTaskAsync as jest.MockedFunction<
    typeof BackgroundTask.registerTaskAsync
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should register the background task if not already registered", async () => {
    mockIsTaskRegisteredAsync.mockResolvedValueOnce(false);
    mockGetStatusAsync.mockResolvedValueOnce(BackgroundTask.BackgroundTaskStatus.Available);
    mockRegisterTaskAsync.mockResolvedValueOnce(undefined);

    await scheduleBackgroundTask();

    expect(mockIsTaskRegisteredAsync).toHaveBeenCalledWith("daily-proverb-fetch");
    expect(mockRegisterTaskAsync).toHaveBeenCalledWith(
      "daily-proverb-fetch",
      { minimumInterval: 60 * 24 }
    );
  });

  it("should NOT register if task is already registered", async () => {
    mockIsTaskRegisteredAsync.mockResolvedValueOnce(true);

    await scheduleBackgroundTask();

    expect(mockIsTaskRegisteredAsync).toHaveBeenCalledTimes(1);
    expect(mockGetStatusAsync).toHaveBeenCalledTimes(0);
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

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should define a task with the correct name", async () => {
    mockDefineTask.mockImplementationOnce(() => {});

    defineBackgroundTask();

    expect(mockDefineTask).toHaveBeenCalledWith(
      "daily-proverb-fetch",
      expect.any(Function)
    );
  });

  it("should fetch proverb and update widget when task executes", async () => {
    const mockProverb = {
      ref: "Proverbs 3:5",
      proverb: "Trust in the LORD",
    };
    mockGetProverbForTheDay.mockResolvedValueOnce(mockProverb);
    mockUpdateProverbWidget.mockResolvedValueOnce(undefined);
    
    let taskExecutor: () => Promise<unknown>;
    mockDefineTask.mockImplementationOnce((_name: string, task: () => Promise<unknown>) => {
      taskExecutor = task;
    });

    defineBackgroundTask();
    await taskExecutor!();

    expect(mockGetProverbForTheDay).toHaveBeenCalledTimes(1);
    expect(mockUpdateProverbWidget).toHaveBeenCalledWith(mockProverb);
  });

  it("should return BackgroundTaskResult.Success on success", async () => {
    const mockProverb = {
      ref: "Proverbs 3:5",
      proverb: "Trust in the LORD",
    };
    mockGetProverbForTheDay.mockResolvedValueOnce(mockProverb);
    mockUpdateProverbWidget.mockResolvedValueOnce(undefined);

    let taskExecutor: () => Promise<unknown>;
    mockDefineTask.mockImplementationOnce((_name: string, task: () => Promise<unknown>) => {
      taskExecutor = task;
    });

    defineBackgroundTask();
    const result = await taskExecutor!();

    expect(result).toBe(BackgroundTask.BackgroundTaskResult.Success);
  });

  it("should catch errors and log to console on failure", async () => {
    const error = new Error("Network error");
    mockGetProverbForTheDay.mockRejectedValueOnce(error);
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    let taskExecutor: () => Promise<unknown>;
    mockDefineTask.mockImplementationOnce((_name: string, task: () => Promise<unknown>) => {
      taskExecutor = task;
    });

    defineBackgroundTask();
    await taskExecutor!();

    expect(consoleSpy).toHaveBeenCalledWith("Background task failed:", error);
  });
});