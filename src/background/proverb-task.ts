import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  BackgroundTaskResult,
  BackgroundTaskStatus,
  getStatusAsync,
  registerTaskAsync,
} from "expo-background-task";
import * as TaskManager from "expo-task-manager";
import { getProverbForTheDay } from "../api/proverbs";
import { getChosenVersion } from "../api/version-storage";
import { scheduleProverbNotification } from "../notifications/daily-proverb-notification";
import { getNotificationsEnabled } from "../notifications/notification-preferences";
import { updateProverbWidget } from "../widgets";

const TASK_NAME = "daily-proverb-fetch";
const INITIALIZED_KEY = "background_task_initialized";

const executeBackgroundTask = async () => {
  try {
    const storedVersion = await getChosenVersion();
    const version = storedVersion || "niv";
    const proverb = await getProverbForTheDay(version);
    await updateProverbWidget(proverb);

    const notificationsEnabled = await getNotificationsEnabled();
    if (notificationsEnabled) {
      await scheduleProverbNotification(proverb);
    }
  } catch (error) {
    console.error("Background task failed:", error);
  }
};

const updateWidgetOnly = async () => {
  try {
    const storedVersion = await getChosenVersion();
    const version = storedVersion || "niv";
    const proverb = await getProverbForTheDay(version);
    await updateProverbWidget(proverb);
  } catch (error) {
    console.error("Failed to update widget:", error);
  }
};

export const registerBackgroundTask = async () => {
  const status = await getStatusAsync();

  if (status === BackgroundTaskStatus.Available) {
    await registerTaskAsync(TASK_NAME, {
      minimumInterval: 60 * 24,
    });
  }
};

export const initializeBackgroundTask = async () => {
  await registerBackgroundTask();

  const hasInitialized = await AsyncStorage.getItem(INITIALIZED_KEY);
  if (!hasInitialized) {
    // On first run, populate widget without sending notification
    await updateWidgetOnly();
    await AsyncStorage.setItem(INITIALIZED_KEY, "true");
  }
};

export const defineBackgroundTask = () => {
  TaskManager.defineTask(TASK_NAME, async () => {
    await executeBackgroundTask();
    return BackgroundTaskResult.Success;
  });
};
