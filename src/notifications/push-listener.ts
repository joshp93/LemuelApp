import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";
import { z } from "zod";
import { LEMUEL_API_BASE_URL } from "../api/constants";
import { getProverbForTheDay } from "../api/proverbs";
import { remoteLog } from "../api/remote-logger";
import { getChosenVersion } from "../api/version-storage";
import type { Proverb } from "../models/proverb";
import { updateProverbWidget } from "../widgets";
import {
  cancelProverbNotification,
  getNotificationIdForDate,
  getRandomTimeInWindow,
  resolveScheduleDate,
  scheduleProverbNotification,
  sendProverbNotification,
} from "./daily-proverb-notification";
import {
  getNotificationMode,
  getNotificationsEnabled,
  getRandomWindowEndMinute,
  getRandomWindowHourEnd,
  getRandomWindowHourStart,
  getRandomWindowStartMinute,
  getScheduledTimeHour,
  getScheduledTimeMinute,
} from "./notification-preferences";

const BACKGROUND_NOTIFICATION_TASK = "NOTIFICATION_DATA_RECEIVED";

/**
 * Subscribes to FCM token refresh events. When the device token changes
 * (e.g. after app data clear or device restore), re-registers the new token
 * with the backend so push notifications continue to arrive.
 *
 * Returns a subscription that can be removed via `.remove()`.
 */
export const setupTokenListener = () => {
  return Notifications.addPushTokenListener(({ data }) => {
    remoteLog("info", "[PushListener] Device token changed, re-registering");
    registerPushTokenWithBackend(data);
  });
};

/**
 * POSTs the given FCM token to the backend at `POST /push/register-token`.
 * Used by the token change listener to re-register when the token refreshes.
 */
const registerPushTokenWithBackend = async (token: string) => {
  try {
    await fetch(`${LEMUEL_API_BASE_URL}/push/register-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, platform: Platform.OS }),
    });
    remoteLog("debug", "[PushListener] Token re-registered after change");
  } catch (error) {
    remoteLog("error", "[PushListener] Failed to re-register token", {
      error,
    });
  }
};

/**
 * Registers the `NOTIFICATION_DATA_RECEIVED` background task with the OS.
 * Must be called on every app launch. After registration, incoming FCM data
 * messages will wake the app process and invoke the task handler even when
 * the app is closed.
 */
export const initializePushHandler = async () => {
  remoteLog("debug", "[PushListener] Registering data-received task");
  await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
  remoteLog("info", "[PushListener] Data-received task registered");
};

const DailyProverbPushDataSchema = z.object({
  collapseKey: z.string().nullable(),
  data: z.object({ dataString: z.any().nullable(), type: z.string() }),
  from: z.string().nullable(),
  messageId: z.string(),
  messageType: z.any().nullable(),
  notification: z.any().nullable(),
  originalPriority: z.number(),
  priority: z.number(),
  sentTime: z.number(),
  to: z.string().nullable(),
  ttl: z.number(),
});

/**
 * System-level background task handler for FCM silent data messages.
 * Invoked automatically by the OS when an FCM data message arrives with the
 * app in the background. Filters for `type === "daily-proverb"` and delegates
 * to {@link handleDailyProverbPush}.
 */
TaskManager.defineTask(
  BACKGROUND_NOTIFICATION_TASK,
  async ({ data, error }) => {
    if (error) {
      remoteLog("error", "[PushListener] Background task error", { error });
      return;
    }

    const parseResult = DailyProverbPushDataSchema.safeParse(data);
    if (!parseResult.success) {
      remoteLog(
        "warn",
        "[PushListener] Received task with invalid data payload",
        {
          error: parseResult.error,
        },
      );
      return;
    }

    const pushNotificationData = parseResult.data;

    if (pushNotificationData.data.type !== "daily-proverb") {
      remoteLog("debug", "[PushListener] Ignoring non-proverb data message", {
        type: pushNotificationData.data.type,
      });
      return;
    }

    remoteLog("info", "[PushListener] Received daily-proverb silent push");
    await handleDailyProverbPush();
  },
);

/**
 * Core handler triggered by the daily-proverb FCM silent push.
 * Fetches today's proverb from the API, updates the home screen widget,
 * and schedules local notifications for today and tomorrow at the user's
 * configured time (if notifications are enabled).
 *
 * @internal Exported for testing only.
 */
export async function handleDailyProverbPush() {
  try {
    remoteLog("debug", "[PushListener] Handling daily proverb push");

    const storedVersion = await getChosenVersion();
    const version = storedVersion || "niv";
    const todayStr = new Date().toISOString().split("T")[0];
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = tomorrowDate.toISOString().split("T")[0];

    remoteLog("debug", "[PushListener] Fetching today's proverb", {
      date: todayStr,
    });
    const todayProverb = await getProverbForTheDay(version, todayStr);

    remoteLog("debug", "[PushListener] Updating widget");
    await updateProverbWidget(todayProverb);
    remoteLog("info", "[PushListener] Widget updated");

    const enabled = await getNotificationsEnabled();
    if (!enabled) {
      remoteLog("debug", "[PushListener] Notifications disabled, skipping");
      return;
    }

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const expectedTodayId = getNotificationIdForDate(todayStr);
    const hasTodayNotification = scheduled.some((n) => {
      if (n.identifier !== expectedTodayId) return false;
      if (!n.trigger || typeof n.trigger !== "object") return false;
      const trigger = n.trigger as Record<string, unknown>;
      if (trigger.type === Notifications.SchedulableTriggerInputTypes.DATE) {
        const rawDate = trigger.date;
        if (rawDate == null) return false;
        const date =
          typeof rawDate === "number" ? new Date(rawDate) : (rawDate as Date);
        return date.toDateString() === new Date().toDateString();
      }
      return false;
    });

    remoteLog("debug", "[PushListener] Existing today notification found", {
      hasTodayNotification,
    });

    const mode = await getNotificationMode();

    if (!hasTodayNotification) {
      remoteLog("debug", "[PushListener] Cancelling and scheduling today", {
        mode,
        date: todayStr,
      });
      await cancelProverbNotification(todayStr);
      await scheduleNotificationForModeAndDate(mode, todayStr, todayProverb);
    } else {
      remoteLog(
        "debug",
        "[PushListener] Today's notification already scheduled, skipping",
      );
    }

    remoteLog("debug", "[PushListener] Fetching tomorrow's proverb", {
      date: tomorrowStr,
    });
    const tomorrowProverb = await getProverbForTheDay(version, tomorrowStr);

    remoteLog("debug", "[PushListener] Cancelling and scheduling tomorrow", {
      mode,
      date: tomorrowStr,
    });
    await cancelProverbNotification(tomorrowStr);
    await scheduleNotificationForModeAndDate(
      mode,
      tomorrowStr,
      tomorrowProverb,
    );

    remoteLog("info", "[PushListener] Daily proverb push handler complete");
  } catch (error) {
    remoteLog("error", "[PushListener] Background task failed", { error });
  }
}

/**
 * Schedules a local notification for a specific date using the user's
 * notification mode preferences. Supports both random-window and
 * specific-time modes.
 *
 * @param mode - The notification mode (`"random"` or `"scheduled"`)
 * @param dateString - ISO date string (`YYYY-MM-DD`) for the target day
 * @param proverb - The proverb to include in the notification content
 *
 * @internal Exported for testing only.
 */
export async function scheduleNotificationForModeAndDate(
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

    const [y, m, d] = dateString.split("-").map(Number);
    const seedDate = new Date(y, m - 1, d);

    const randomDate = getRandomTimeInWindow(
      seedDate,
      startHour,
      startMinute,
      endHour,
      endMinute,
    );
    hour = randomDate.getHours();
    minute = randomDate.getMinutes();
    remoteLog("debug", "[PushListener] Random notification time", {
      hour,
      minute,
      date: dateString,
    });
  } else {
    hour = await getScheduledTimeHour();
    minute = await getScheduledTimeMinute();
    remoteLog("debug", "[PushListener] Scheduled notification time", {
      hour,
      minute,
      date: dateString,
    });
  }

  const targetDate = resolveScheduleDate(dateString, hour, minute);
  if (targetDate <= new Date()) {
    remoteLog(
      "debug",
      "[PushListener] Target date is in the past, sending immediately",
    );
    await sendProverbNotification(proverb, dateString);
    return;
  }
  await scheduleProverbNotification(
    proverb,
    {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: targetDate,
    },
    dateString,
  );
  remoteLog("debug", "[PushListener] Notification scheduled", {
    targetDate: targetDate.toISOString(),
    dateString,
  });
}
