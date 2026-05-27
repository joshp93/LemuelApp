import * as Notifications from "expo-notifications";
import type { Proverb } from "../models/proverb";

const NOTIFICATION_ID = "daily-proverb-meditation";

const WINDOW_START_HOUR = 9;
const WINDOW_END_HOUR = 19;

export const initializeNotifications = () => {
  console.debug("Initializing notifications...");
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
};

const createAndroidChannel = async () => {
  await Notifications.setNotificationChannelAsync("daily-proverb", {
    name: "Daily Proverb",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#E6F4FE",
  });
};

const getRandomTimeInWindow = (date: Date): Date => {
  const startOfDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const windowStartMinutes = WINDOW_START_HOUR * 60;
  const windowEndMinutes = WINDOW_END_HOUR * 60;
  const randomMinutes =
    windowStartMinutes +
    Math.floor(Math.random() * (windowEndMinutes - windowStartMinutes));

  const randomDate = new Date(startOfDay.getTime() + randomMinutes * 60 * 1000);
  console.debug("Scheduled notification for:", randomDate);
  return randomDate;
};

export const sendProverbNotification = async (proverb: Proverb) => {
  try {
    await Notifications.requestPermissionsAsync();
    await createAndroidChannel();
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_ID,
      content: {
        title: "Daily Proverb Meditation",
        body: `Tap to begin meditation on "${proverb.proverb}"`,
        data: { proverb: proverb.proverb, ref: proverb.ref },
      },
      trigger: null, // send immediately
    });
  } catch (error) {
    console.error("Failed to send daily proverb notification:", error);
  }
};

export const scheduleProverbNotification = async (proverb: Proverb) => {
  try {
    await Notifications.requestPermissionsAsync();
    await createAndroidChannel();
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_ID,
      content: {
        title: "Daily Proverb Meditation",
        body: `Tap to begin meditation on "${proverb.ref}"`,
        data: { proverb: proverb.proverb, ref: proverb.ref },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: getRandomTimeInWindow(new Date()),
      },
    });
  } catch (error) {
    console.error("Failed to schedule daily proverb notification:", error);
  }
};

export const scheduleNextDayProverbNotification = async (proverb: Proverb) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  try {
    await Notifications.requestPermissionsAsync();
    await createAndroidChannel();
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_ID,
      content: {
        title: "Daily Proverb Meditation",
        body: `Tap to begin meditation on "${proverb.proverb}"`,
        data: { proverb: proverb.proverb, ref: proverb.ref },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: getRandomTimeInWindow(tomorrow),
      },
    });
  } catch (error) {
    console.error("Failed to schedule next day proverb notification:", error);
  }
};
