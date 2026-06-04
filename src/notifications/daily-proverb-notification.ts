import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { ProverbSchema, type Proverb } from "../models/proverb";
import {
  getNotificationMode,
  getRandomWindowEnd,
  getRandomWindowEndMinute,
  getRandomWindowStart,
  getRandomWindowStartMinute,
  getScheduledTimeHour,
  getScheduledTimeMinute,
} from "./notification-preferences";
import { COLORS } from "../constants/theme";

const NOTIFICATION_ID = "daily-proverb-meditation";
const SNOOZE_NOTIFICATION_ID = "daily-proverb-snoozed";
const CATEGORY_ID = "proverb-meditation";
const SNOOZE_ACTION_ID = "snooze";

const _createNotificationContent = (proverb: Proverb) => ({
  title: "Daily Proverb Meditation",
  body: `Tap to begin meditation on "${proverb.ref}"`,
  data: { proverb: proverb.proverb, ref: proverb.ref },
  categoryIdentifier: CATEGORY_ID,
  ...(Platform.OS === "android"
    ? { priorityAndroid: Notifications.AndroidNotificationPriority.MAX }
    : {}),
});

const _createAndroidChannel = async () => {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("daily-proverb", {
      name: "Daily Proverb",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: COLORS.lightBackground,
    });
  }
};

export const _scheduleNotification = async (
  proverb: Proverb,
  trigger: Notifications.NotificationTriggerInput,
) => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") {
    console.warn("Notification permissions not granted.");
    return;
  }

  await _createAndroidChannel();

  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID);

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_ID,
    content: _createNotificationContent(proverb),
    trigger,
  });
};

export const getRandomTimeInWindow = (
  date: Date,
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number,
): Date => {
  const startOfDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const windowStartMinutes = startHour * 60 + startMinute;
  const windowEndMinutes = endHour * 60 + endMinute;
  const range = Math.max(windowEndMinutes - windowStartMinutes, 1);
  const randomMinutes = windowStartMinutes + Math.floor(Math.random() * range);
  return new Date(startOfDay.getTime() + randomMinutes * 60000);
};

export const resolveScheduleDate = (hour: number, minute: number): Date => {
  const now = new Date();
  const candidate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour,
    minute,
    0,
    0,
  );
  if (candidate.getTime() > now.getTime()) {
    return candidate;
  }
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    hour,
    minute,
    0,
    0,
  );
};

export const resolveScheduleDateForDate = (
  dateStr: string,
  hour: number,
  minute: number,
): Date => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, hour, minute, 0, 0);
};

const _initializeCategories = async () => {
  await Notifications.setNotificationCategoryAsync(CATEGORY_ID, [
    {
      identifier: SNOOZE_ACTION_ID,
      buttonTitle: "Snooze 10 min",
      options: {
        opensAppToForeground: false,
      },
    },
  ]);
};

let _snoozeSubscription: Notifications.EventSubscription | null = null;

const _handleSnooze = async (notification: Notifications.Notification) => {
  const { data } = notification.request.content;
  const proverb = ProverbSchema.safeParse(data);
  if (!proverb.success) return;

  const snoozeDate = new Date();
  snoozeDate.setMinutes(snoozeDate.getMinutes() + 10);

  await Notifications.scheduleNotificationAsync({
    identifier: SNOOZE_NOTIFICATION_ID,
    content: _createNotificationContent(proverb.data),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: snoozeDate,
    },
  });

  if (Platform.OS === "android") {
    await Notifications.dismissNotificationAsync(NOTIFICATION_ID);
  }
};

const _setupSnoozeListener = () => {
  if (_snoozeSubscription) return;
  _snoozeSubscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      if (response.actionIdentifier === SNOOZE_ACTION_ID) {
        _handleSnooze(response.notification);
      }
    },
  );
};

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
  _initializeCategories();
  _setupSnoozeListener();
};

export const cleanupNotifications = () => {
  if (_snoozeSubscription) {
    _snoozeSubscription.remove();
    _snoozeSubscription = null;
  }
};

export const sendProverbNotification = async (proverb: Proverb) => {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      console.warn("Notification permissions not granted.");
      return;
    }

    await _createAndroidChannel();

    await Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_ID,
      content: _createNotificationContent(proverb),
      trigger: null,
    });
  } catch (error) {
    console.error("Failed to send daily proverb notification:", error);
  }
};