import {
  BackgroundTaskResult,
  BackgroundTaskStatus,
  getStatusAsync,
  registerTaskAsync,
} from "expo-background-task";
import * as TaskManager from "expo-task-manager";
import { getProverbForTheDay } from "../api/proverbs";
import { updateProverbWidget } from "../widgets";

const TASK_NAME = "daily-proverb-fetch";

export const registerBackgroundTask = async () => {
  const status = await getStatusAsync();

  if (status === BackgroundTaskStatus.Available) {
    await registerTaskAsync(TASK_NAME, {
      minimumInterval: 60 * 24,
    });
  }
};

export const scheduleBackgroundTask = async () => {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);

  if (!isRegistered) {
    await registerBackgroundTask();
  }
};

export const defineBackgroundTask = () => {
  TaskManager.defineTask(TASK_NAME, async () => {
    try {
      const proverb = await getProverbForTheDay();
      await updateProverbWidget(proverb);
    } catch (error) {
      console.error("Background task failed:", error);
    }

    return BackgroundTaskResult.Success;
  });
};
