import * as BackgroundTask from "expo-background-task";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";
import { z } from "zod";
import { LEMUEL_API_BASE_URL } from "../api/constants";
import { getProverbForTheDay } from "../api/proverbs";
import { remoteLog } from "../api/remote-logger";
import { getChosenVersion } from "../api/version-storage";
import type { Proverb } from "../models/proverb";
import { toLocalDateString } from "../utils/date";
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
  getNotificationSentDates,
  getNotificationsEnabled,
  getRandomWindowEndMinute,
  getRandomWindowHourEnd,
  getRandomWindowHourStart,
  getRandomWindowStartMinute,
  getScheduledTimeHour,
  getScheduledTimeMinute,
} from "./notification-preferences";

const BACKGROUND_NOTIFICATION_TASK = "NOTIFICATION_DATA_RECEIVED";
const BACKGROUND_FETCH_TASK = "ENSURE_NOTIFICATIONS_BACKGROUND_FETCH";

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
 * Serializes calls to {@link ensureNotificationsScheduled} so that concurrent
 * invocations (app launch, background fetch, FCM silent push, settings save)
 * queue instead of racing. This prevents two runs from both passing the
 * dedup checks and both scheduling/sending the same day's notification.
 */
let ensureChain: Promise<void> = Promise.resolve();

/**
 * Resets the internal serialization queue. Test utility only.
 */
export const resetNotificationEnsureChain = () => {
  ensureChain = Promise.resolve();
};

/**
 * Ensures local notifications are scheduled for the next `daysAhead` days.
 * Fetches today's proverb and updates the home screen widget, then schedules
 * notifications according to the user's preferences for each day.
 *
 * Any day already recorded in the handled-dates set is skipped (dedup), so a
 * notification that has already fired is never scheduled or sent again.
 *
 * When `force` is true, cancels and re-schedules future days (used when
 * preferences change). Today is re-scheduled under `force` only while it is
 * still pending; once today's notification has fired it is skipped like any
 * other handled day.
 */
export function ensureNotificationsScheduled(
  daysAhead: number = 5,
  force: boolean = false,
): Promise<void> {
  const run = () => runEnsureNotificationsScheduled(daysAhead, force);
  ensureChain = ensureChain.then(run, run);
  return ensureChain;
}

/**
 * True if a scheduled (pending) notification exists for the given date with
 * the matching date-specific identifier and trigger date.
 */
async function hasPendingNotificationForDate(
  dateStr: string,
  date: Date,
): Promise<boolean> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const expectedId = getNotificationIdForDate(dateStr);
  return scheduled.some((n) => {
    if (n.identifier !== expectedId) return false;
    if (!n.trigger || typeof n.trigger !== "object") return false;
    const trigger = n.trigger as Record<string, unknown>;
    if (trigger.type === Notifications.SchedulableTriggerInputTypes.DATE) {
      const rawDate = trigger.date;
      if (rawDate == null) return false;
      const d =
        typeof rawDate === "number" ? new Date(rawDate) : (rawDate as Date);
      return d.toDateString() === date.toDateString();
    }
    return false;
  });
}

async function runEnsureNotificationsScheduled(
  daysAhead: number = 5,
  force: boolean = false,
) {
  remoteLog("debug", "[PushListener] Ensuring notifications scheduled", {
    daysAhead,
    force,
  });

  try {
    const storedVersion = await getChosenVersion();
    const version = storedVersion || "niv";
    const today = new Date();
    const todayStr = toLocalDateString(today);

    const todayProverb = await getProverbForTheDay(version, todayStr);
    await updateProverbWidget(todayProverb);

    const enabled = await getNotificationsEnabled();
    if (!enabled) {
      remoteLog("debug", "[PushListener] Notifications disabled, skipping");
      return;
    }

    const mode = await getNotificationMode();
    const handledDates = await getNotificationSentDates();

    for (let i = 0; i < daysAhead; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = toLocalDateString(date);
      const isToday = i === 0;

      if (!isToday && !force && handledDates.includes(dateStr)) {
        remoteLog(
          "debug",
          "[PushListener] Future day already handled, skipping",
          { dateStr },
        );
        continue;
      }

      if (isToday) {
        const hasPending = await hasPendingNotificationForDate(dateStr, date);

        if (hasPending && !force) {
          remoteLog(
            "debug",
            "[PushListener] Today's notification already scheduled, skipping",
            { dateStr },
          );
          continue;
        }

        if (hasPending && force) {
          await cancelProverbNotification(dateStr);
          await scheduleNotificationForModeAndDate(mode, dateStr, todayProverb);
          continue;
        }

        if (handledDates.includes(dateStr)) {
          remoteLog(
            "debug",
            "[PushListener] Today's notification already sent, skipping",
            { dateStr },
          );
          continue;
        }

        await cancelProverbNotification(dateStr);
        await scheduleNotificationForModeAndDate(mode, dateStr, todayProverb);
      } else {
        await cancelProverbNotification(dateStr);
        try {
          const proverb = await getProverbForTheDay(version, dateStr);
          await scheduleNotificationForModeAndDate(mode, dateStr, proverb);
        } catch (error) {
          remoteLog("warn", "[PushListener] Failed to schedule for date", {
            dateStr,
            error,
          });
        }
      }
    }

    remoteLog("info", "[PushListener] Notification scheduling complete", {
      daysAhead,
    });
  } catch (error) {
    remoteLog("error", "[PushListener] ensureNotificationsScheduled failed", {
      error,
    });
  }
}

/**
 * Core handler triggered by the daily-proverb FCM silent push.
 * Delegates to {@link ensureNotificationsScheduled} for today and tomorrow.
 *
 * @internal Exported for testing only.
 */
export async function handleDailyProverbPush() {
  await ensureNotificationsScheduled(2);
}

let backgroundFetchTaskDefined = false;

/**
 * Defines the background fetch task handler and registers it with the OS
 * Should be called on every app launch.
 *
 * The task handler calls {@link ensureNotificationsScheduled} as a fallback
 * when neither the app is opened nor an FCM push arrives. The handler is
 * defined via {@link TaskManager.defineTask} immediately before registration
 * to guarantee availability — {@link BackgroundTask.registerTaskAsync}
 * requires the task to be defined first.
 */
export const initializeBackgroundFetch = async () => {
  remoteLog("debug", "[PushListener] Registering background fetch task");

  if (!backgroundFetchTaskDefined) {
    TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
      remoteLog("debug", "[PushListener] Background fetch task fired");
      try {
        await ensureNotificationsScheduled(5);
        return BackgroundTask.BackgroundTaskResult.Success;
      } catch (error) {
        remoteLog("error", "[PushListener] Background fetch task failed", {
          error,
        });
        return BackgroundTask.BackgroundTaskResult.Failed;
      }
    });
    backgroundFetchTaskDefined = true;
  }

  try {
    const status = await BackgroundTask.getStatusAsync();
    if (status === BackgroundTask.BackgroundTaskStatus.Restricted) {
      remoteLog("warn", "[PushListener] Background fetch is restricted");
      return;
    }
    await BackgroundTask.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 21600,
    });
    remoteLog("info", "[PushListener] Background fetch task registered");
  } catch (error) {
    remoteLog(
      "error",
      "[PushListener] Failed to register background fetch task",
      { error },
    );
  }
};

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
    const handledDates = await getNotificationSentDates();
    if (handledDates.includes(dateString)) {
      remoteLog(
        "debug",
        "[PushListener] Date already handled, skipping immediate send",
        { dateString },
      );
      return;
    }
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
