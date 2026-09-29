import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { remoteLog } from "../api/remote-logger";
import { COLORS } from "../constants/theme";
import { type Proverb, ProverbSchema } from "../models/proverb";
import { toLocalDateString } from "../utils/date";
import {
  addNotificationSentDate,
  getNotificationSentDates,
} from "./notification-preferences";
import type { NonNullNotificationTrigger } from "./notification-utils";
import {
  EXAMPLE_NOTIFICATION_ID,
  getMeditationRouteParams,
  getNotificationIdForDate,
  getRandomTimeInWindow,
  MEDITATE_ACTION_ID,
  resolveScheduleDate,
} from "./notification-utils";

export type { MeditationRouteParams } from "./notification-utils";
export type { NonNullNotificationTrigger };
export {
  EXAMPLE_NOTIFICATION_ID,
  getMeditationRouteParams,
  getNotificationIdForDate,
  getRandomTimeInWindow,
  MEDITATE_ACTION_ID,
  resolveScheduleDate,
};

const SNOOZE_NOTIFICATION_ID = "daily-proverb-snoozed";
const CATEGORY_ID = "proverb-meditation";
const SNOOZE_ACTION_ID = "snooze";

/**
 * Creates an object to be used as the payload of a notification
 * @param proverb The proverb to include in the notification.
 * @param dateString The ISO date string (YYYY-MM-DD) of the daily proverb,
 * used to navigate to the correct proverb when the notification is tapped.
 */
const _createNotificationContent = (proverb: Proverb, dateString: string) => ({
  title: "Daily Proverb Meditation",
  body: `Tap to begin meditation on ${proverb.ref}`,
  data: { proverb: proverb.proverb, ref: proverb.ref, date: dateString },
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
 * Skips scheduling if a notification with the same date-specific ID already exists.
 * Does NOT cancel any existing notification — call @link cancelProverbNotification first if replacement is needed.
 * @param proverb The proverb to include in the notification.
 * @param trigger The trigger for scheduling the notification.
 * @param dateString The ISO date string (YYYY-MM-DD) this notification is for, used as the notification identifier.
 * @returns The notification ID if scheduled, or null if skipped because one already exists.
 */
export const scheduleProverbNotification = async (
  proverb: Proverb,
  trigger: NonNullNotificationTrigger,
  dateString: string,
): Promise<string | null> => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") {
    remoteLog("warn", "[Notifications] Notification permissions not granted");
    return null;
  }

  const notificationId = getNotificationIdForDate(dateString);

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  if (scheduled.some((n) => n.identifier === notificationId)) {
    remoteLog(
      "debug",
      "[Notifications] Notification already scheduled, skipping",
      {
        notificationId,
        dateString,
      },
    );
    return null;
  }

  await _createAndroidChannel();

  remoteLog("debug", "[Notifications] Scheduling notification", {
    notificationId,
    triggerType: trigger.type,
    dateString,
  });
  await Notifications.scheduleNotificationAsync({
    identifier: notificationId,
    content: _createNotificationContent(proverb, dateString),
    trigger,
  });
  await addNotificationSentDate(dateString);
  remoteLog("debug", "[Notifications] Notification scheduled", {
    notificationId,
    dateString,
  });
  return notificationId;
};

/**
 * Defines the categories for the proverb notifications, which controls the action buttons that show and a few other things.
 */
const _initializeCategories = async () => {
  await Notifications.setNotificationCategoryAsync(CATEGORY_ID, [
    {
      identifier: MEDITATE_ACTION_ID,
      buttonTitle: "Begin meditation",
      options: {
        opensAppToForeground: true,
      },
    },
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
  const data = notification.request.content.data;
  if (!data) return;
  const proverb = ProverbSchema.safeParse(data);
  if (!proverb.success) return;

  const date =
    typeof data.date === "string" ? data.date : toLocalDateString(new Date());

  const snoozeDate = new Date();
  snoozeDate.setMinutes(snoozeDate.getMinutes() + 10);

  await Notifications.scheduleNotificationAsync({
    identifier: SNOOZE_NOTIFICATION_ID,
    content: _createNotificationContent(proverb.data, date),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: snoozeDate,
    },
  });

  if (Platform.OS === "android") {
    await Notifications.dismissNotificationAsync(
      notification.request.identifier,
    );
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

export const cancelProverbNotification = async (dateString: string) => {
  const notificationId = getNotificationIdForDate(dateString);
  remoteLog("debug", "[Notifications] Cancelling notification", {
    notificationId,
    dateString,
  });
  await Notifications.cancelScheduledNotificationAsync(notificationId);
};

/**
 * Sends a notification immediately without any scheduled trigger.
 * Uses the dateString (or today's date if not provided) for the notification identifier.
 * Skips sending if the date has already been handled (dedup).
 * @param proverb The proverb to include in the notification
 * @param dateString Optional ISO date string (YYYY-MM-DD), defaults to today
 */
export const sendProverbNotification = async (
  proverb: Proverb,
  dateString?: string,
) => {
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

    const ds = dateString || toLocalDateString(new Date());
    const notificationId = getNotificationIdForDate(ds);

    const sentDates = await getNotificationSentDates();
    if (sentDates.includes(ds)) {
      remoteLog(
        "debug",
        "[Notifications] Date already handled, skipping immediate send",
        { dateString: ds },
      );
      return;
    }

    remoteLog("debug", "[Notifications] Sending immediate notification", {
      notificationId,
      dateString: ds,
    });
    await Notifications.scheduleNotificationAsync({
      identifier: notificationId,
      content: _createNotificationContent(proverb, ds),
      trigger: null,
    });
    await addNotificationSentDate(ds);
    remoteLog("debug", "[Notifications] Immediate notification sent", {
      notificationId,
    });
  } catch (error) {
    remoteLog(
      "error",
      "[Notifications] Failed to send daily proverb notification",
      { error },
    );
  }
};

/**
 * Sends a test/example notification immediately using a dedicated identifier
 * that never collides with the real daily-proverb notifications and never
 * marks a real date as handled.
 * @param proverb The proverb to include in the notification
 */
export const sendExampleProverbNotification = async (proverb: Proverb) => {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      remoteLog(
        "warn",
        "[Notifications] Notification permissions not granted (example)",
      );
      return;
    }

    await _createAndroidChannel();

    remoteLog("debug", "[Notifications] Sending example notification", {
      notificationId: EXAMPLE_NOTIFICATION_ID,
    });
    await Notifications.scheduleNotificationAsync({
      identifier: EXAMPLE_NOTIFICATION_ID,
      content: _createNotificationContent(
        proverb,
        toLocalDateString(new Date()),
      ),
      trigger: null,
    });
    remoteLog("debug", "[Notifications] Example notification sent", {
      notificationId: EXAMPLE_NOTIFICATION_ID,
    });
  } catch (error) {
    remoteLog("error", "[Notifications] Failed to send example notification", {
      error,
    });
  }
};
