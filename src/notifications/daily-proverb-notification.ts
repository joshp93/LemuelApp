import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { remoteLog } from "../api/remote-logger";
import { COLORS } from "../constants/theme";
import { type Proverb, ProverbSchema } from "../models/proverb";

const NOTIFICATION_ID = "daily-proverb-meditation";
const SNOOZE_NOTIFICATION_ID = "daily-proverb-snoozed";
const CATEGORY_ID = "proverb-meditation";
const SNOOZE_ACTION_ID = "snooze";

/**
 * Creates an object to be used as the payload of a notification
 * @param proverb The proverb to include in the notification.
 */
const _createNotificationContent = (proverb: Proverb) => ({
  title: "Daily Proverb Meditation",
  body: `Tap to begin meditation on ${proverb.ref}`,
  data: { proverb: proverb.proverb, ref: proverb.ref },
  categoryIdentifier: CATEGORY_ID,
  ...(Platform.OS === "android"
    ? { priorityAndroid: Notifications.AndroidNotificationPriority.MAX }
    : {}),
});

/**
 * Creates an android channel for proverb notifications if it doesn't already exist. Android channels are required for notifications to work on Android 8.0+.
 * The channel is configured with high importance and a vibration pattern to make the notification more likely to be noticed by the user.
 * iOS does not use channels, so this function has no effect on iOS. This function is called before scheduling any notifications to ensure the channel exists.
 * @param proverb The proverb to include in the notification.
 */
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

/**
 * Schedules a notification, using @link _createNotificationContent to create the content and the provided trigger for scheduling.
 * If a notification with the same ID already exists, it will be replaced.
 * @param proverb The proverb to include in the notification.
 * @param trigger The trigger for scheduling the notification.
 */
export const scheduleProverbNotification = async (
  proverb: Proverb,
  trigger: Notifications.NotificationTriggerInput,
) => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") {
    remoteLog("warn", "[Notifications] Notification permissions not granted");
    return;
  }

  await _createAndroidChannel();

  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID);

  remoteLog("debug", "[Notifications] Scheduling notification", {
    proverb,
    trigger,
  });
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_ID,
    content: _createNotificationContent(proverb),
    trigger,
  });
};

/**
 * Uses the window values provided to schedule a notification at a random time between them.
 * @param date The date, used to determine which day to schedule it for
 * @param startHour The starting hour window
 * @param startMinute The starting minute window
 * @param endHour The ending hour window
 * @param endMinute The ending minute window
 * @returns A Date object representing a random time on the provided date between the provided window values.
 */
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

/**
 * Builds the full date time that from the provided date string, hour and minute values
 * @param isoDateString The date string (YYYY-MM-DD) to resolve the schedule date against
 * @param hour The hour to set
 * @param minute The minute to set
 * @returns A Date object representing the resolved schedule date
 */
export const resolveScheduleDate = (
  isoDateString: string,
  hour: number,
  minute: number,
): Date => {
  const [y, m, d] = isoDateString.split("-").map(Number);
  return new Date(y, m - 1, d, hour, minute, 0, 0);
};

/**
 * Defines the categories for the proverb notifications, which controls the action buttons that show and a few other things.
 */
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

/**
 * Handles the snooze action, rescheduling the notification for 10 minutes later
 * @param notification The notification in question
 */
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

/**
 * Sets up the listener function on the notification snooze action.
 */
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

/**
 * Handles all initial configuration required to send a notification
 */
export const initializeNotifications = () => {
  remoteLog("debug", "[Notifications] Initializing notifications");
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

/**
 * Test utility
 */
export const cleanupNotifications = () => {
  if (_snoozeSubscription) {
    _snoozeSubscription.remove();
    _snoozeSubscription = null;
  }
};

/**
 * Immediately sends a proverb notification, by scheduling one with a null trigger
 * @param proverb The proverb to include in the notification
 */
export const sendProverbNotification = async (proverb: Proverb) => {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      remoteLog(
        "warn",
        "[Notifications] Notification permissions not granted (send)",
      );
      return;
    }

    await _createAndroidChannel();

    await Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_ID,
      content: _createNotificationContent(proverb),
      trigger: null,
    });
  } catch (error) {
    remoteLog(
      "error",
      "[Notifications] Failed to send daily proverb notification",
      { error },
    );
  }
};
