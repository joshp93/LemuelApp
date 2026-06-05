import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  BackgroundTaskResult,
  BackgroundTaskStatus,
  getStatusAsync,
  registerTaskAsync,
} from "expo-background-task";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { getProverbForTheDay } from "../api/proverbs";
import { getChosenVersion } from "../api/version-storage";
import { Proverb } from "../models/proverb";
import {
  getRandomTimeInWindow,
  resolveScheduleDate,
  scheduleProverbNotification,
  sendProverbNotification,
} from "../notifications/daily-proverb-notification";
import {
  getNotificationMode,
  getNotificationsEnabled,
  getRandomWindowEndMinute,
  getRandomWindowHourEnd,
  getRandomWindowHourStart,
  getRandomWindowStartMinute,
  getScheduledTimeHour,
  getScheduledTimeMinute,
} from "../notifications/notification-preferences";
import { updateProverbWidget } from "../widgets";

const TASK_NAME = "daily-proverb-fetch";
const INITIALIZED_KEY = "background_task_initialized";

export const executeBackgroundTask = async () => {
  try {
    const storedVersion = await getChosenVersion();
    const version = storedVersion || "niv";
    const todayStr = new Date().toISOString().split("T")[0];
    const tomorrowStr = new Date(Date.now() + 86400000)
      .toISOString()
      .split("T")[0];

    const todayProverb = await getProverbForTheDay(version, todayStr);
    await updateProverbWidget(todayProverb);

    const enabled = await getNotificationsEnabled();
    if (!enabled) return;

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const hasTodayNotification = scheduled.some((n) => {
      if (!n.trigger || typeof n.trigger !== "object") return false;
      const trigger = n.trigger as Record<string, unknown>;
      if (trigger.type === Notifications.SchedulableTriggerInputTypes.DATE) {
        const date = trigger.date as Date;
        return date.toDateString() === new Date().toDateString();
      }
      return false;
    });
    const mode = await getNotificationMode();

    if (!hasTodayNotification) {
      await scheduleNotificationForModeAndDate(mode, todayStr, todayProverb);
    }

    const tomorrowProverb = await getProverbForTheDay(version, tomorrowStr);
    await scheduleNotificationForModeAndDate(
      mode,
      tomorrowStr,
      tomorrowProverb,
    );
  } catch (error) {
    console.error("Background task failed:", error);
  }
};

const updateWidgetOnly = async () => {
  try {
    const storedVersion = await getChosenVersion();
    const version = storedVersion || "niv";
    const todayStr = new Date().toISOString().split("T")[0];
    const proverb = await getProverbForTheDay(version, todayStr);
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

  const raw = await AsyncStorage.getItem(INITIALIZED_KEY);
  const appVersion = Constants.expoConfig?.version || "1.0.0";

  if (!raw) {
    await updateWidgetOnly();
    await AsyncStorage.setItem(INITIALIZED_KEY, appVersion);
  } else if (raw !== appVersion) {
    await updateWidgetOnly();
    await AsyncStorage.setItem(INITIALIZED_KEY, appVersion);
  }
};

TaskManager.defineTask(TASK_NAME, async () => {
  await executeBackgroundTask();
  return BackgroundTaskResult.Success;
});

/**
 * Schedules a notification, using the provided date and mode
 * @param The {@link NotificationMode | notification mode}, determined by {@link getNotificationMode}
 * @param dateString The date string (YYYY-MM-DD) to resolve the schedule date against
 * @param proverb The proverb to include in the notification content
 */
async function scheduleNotificationForModeAndDate(
  mode: string,
  dateString: string,
  proverb: Proverb,
) {
  let hour: number;
  let minute: number;
  if (mode === "random") {
    const startHour = await getRandomWindowHourStart();
    const startMinute = await getRandomWindowStartMinute();
    const endHour = await getRandomWindowHourEnd();
    const endMinute = await getRandomWindowEndMinute();
    const randomDate = getRandomTimeInWindow(
      new Date(Date.now() + 86400000),
      startHour,
      startMinute,
      endHour,
      endMinute,
    );
    hour = randomDate.getHours();
    minute = randomDate.getMinutes();
  } else {
    hour = await getScheduledTimeHour();
    minute = await getScheduledTimeMinute();
  }

  const targetDate = resolveScheduleDate(dateString, hour, minute);
  if (targetDate <= new Date()) {
    console.debug("Target date is in the past, sending immediately");
    sendProverbNotification(proverb);
    return;
  }
  await scheduleProverbNotification(proverb, {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date: targetDate,
  });
}
