import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIFICATIONS_ENABLED_KEY = "notifications_enabled";
const NOTIFICATION_MODE_KEY = "notification_mode";
const RANDOM_WINDOW_START_KEY = "random_window_start";
const RANDOM_WINDOW_END_KEY = "random_window_end";
const RANDOM_WINDOW_START_MINUTE_KEY = "random_window_start_minute";
const RANDOM_WINDOW_END_MINUTE_KEY = "random_window_end_minute";
const SCHEDULED_TIME_HOUR_KEY = "scheduled_time_hour";
const SCHEDULED_TIME_MINUTE_KEY = "scheduled_time_minute";

export type NotificationMode = "random" | "scheduled";

const DEFAULT_MODE: NotificationMode = "random";
const DEFAULT_WINDOW_START = 9;
const DEFAULT_WINDOW_END = 19;
const DEFAULT_WINDOW_START_MINUTE = 0;
const DEFAULT_WINDOW_END_MINUTE = 0;
const DEFAULT_SCHEDULED_HOUR = 9;
const DEFAULT_SCHEDULED_MINUTE = 0;

/**
 * Determines if notifications are enabled by the user
 */
export const getNotificationsEnabled = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
    return value === "true";
  } catch (error) {
    console.error("Error getting notification preference:", error);
    return false;
  }
};

/**
 * Sets the user's preference for enabling / disabling notifications
 * @param enabled Whether they are enabled or not
 */
export const setNotificationsEnabled = async (
  enabled: boolean,
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      NOTIFICATIONS_ENABLED_KEY,
      enabled ? "true" : "false",
    );
  } catch (error) {
    console.error("Error saving notification preference:", error);
  }
};

/**
 * Determines the user's selected {@link NotificationMode | notification mode}
 */
export const getNotificationMode = async (): Promise<NotificationMode> => {
  try {
    const value = await AsyncStorage.getItem(NOTIFICATION_MODE_KEY);
    if (value === "random" || value === "scheduled") return value;
    return DEFAULT_MODE;
  } catch (error) {
    console.error("Error getting notification mode:", error);
    return DEFAULT_MODE;
  }
};

/**
 * Sets the user's chosen {@link NotificationMode | notification mode}
 */
export const setNotificationMode = async (
  mode: NotificationMode,
): Promise<void> => {
  try {
    await AsyncStorage.setItem(NOTIFICATION_MODE_KEY, mode);
  } catch (error) {
    console.error("Error saving notification mode:", error);
  }
};

/**
 * Get's the starting hour window for sending a random notification.
 * Notifications should not be scheduled before this hour.
 */
export const getRandomWindowHourStart = async (): Promise<number> => {
  try {
    const value = await AsyncStorage.getItem(RANDOM_WINDOW_START_KEY);
    if (value !== null) {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num >= 0 && num <= 23) return num;
    }
    return DEFAULT_WINDOW_START;
  } catch (error) {
    console.error("Error getting random window start:", error);
    return DEFAULT_WINDOW_START;
  }
};

/**
 * Set's the starting hour window for sending a random notification.
 * Notifications should not be scheduled before this hour.
 */
export const setRandomWindowHourStart = async (hour: number): Promise<void> => {
  try {
    await AsyncStorage.setItem(RANDOM_WINDOW_START_KEY, hour.toString());
  } catch (error) {
    console.error("Error saving random window start:", error);
  }
};

/**
 * Get's the ending hour window for sending a random notification.
 * Notifications should not be scheduled after this hour.
 */
export const getRandomWindowHourEnd = async (): Promise<number> => {
  try {
    const value = await AsyncStorage.getItem(RANDOM_WINDOW_END_KEY);
    if (value !== null) {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num >= 0 && num <= 23) return num;
    }
    return DEFAULT_WINDOW_END;
  } catch (error) {
    console.error("Error getting random window end:", error);
    return DEFAULT_WINDOW_END;
  }
};

/**
 * Set's the ending hour window for sending a random notification.
 * Notifications should not be scheduled after this hour.
 */
export const setRandomWindowHourEnd = async (hour: number): Promise<void> => {
  try {
    await AsyncStorage.setItem(RANDOM_WINDOW_END_KEY, hour.toString());
  } catch (error) {
    console.error("Error saving random window end:", error);
  }
};

/**
 * Get's the starting minute window for sending a random notification, used in conjunction with the hour window.
 * Notifications should not be scheduled before this minute of the hour.
 */
export const getRandomWindowStartMinute = async (): Promise<number> => {
  try {
    const value = await AsyncStorage.getItem(RANDOM_WINDOW_START_MINUTE_KEY);
    if (value !== null) {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num >= 0 && num <= 59) return num;
    }
    return DEFAULT_WINDOW_START_MINUTE;
  } catch (error) {
    console.error("Error getting random window start minute:", error);
    return DEFAULT_WINDOW_START_MINUTE;
  }
};

/**
 * Set's the starting minute window for sending a random notification, used in conjunction with the hour window.
 * Notifications should not be scheduled before this minute of the hour.
 */
export const setRandomWindowStartMinute = async (
  minute: number,
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      RANDOM_WINDOW_START_MINUTE_KEY,
      minute.toString(),
    );
  } catch (error) {
    console.error("Error saving random window start minute:", error);
  }
};

/**
 * Get's the ending minute window for sending a random notification, used in conjunction with the hour window.
 * Notifications should not be scheduled after this minute of the hour.
 */
export const getRandomWindowEndMinute = async (): Promise<number> => {
  try {
    const value = await AsyncStorage.getItem(RANDOM_WINDOW_END_MINUTE_KEY);
    if (value !== null) {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num >= 0 && num <= 59) return num;
    }
    return DEFAULT_WINDOW_END_MINUTE;
  } catch (error) {
    console.error("Error getting random window end minute:", error);
    return DEFAULT_WINDOW_END_MINUTE;
  }
};

/**
 * Set's the ending minute window for sending a random notification, used in conjunction with the hour window.
 * Notifications should not be scheduled after this minute of the hour.
 */
export const setRandomWindowEndMinute = async (
  minute: number,
): Promise<void> => {
  try {
    await AsyncStorage.setItem(RANDOM_WINDOW_END_MINUTE_KEY, minute.toString());
  } catch (error) {
    console.error("Error saving random window end minute:", error);
  }
};

/**
 * Gets the user's selected hour for scheduled notifications. Used when {@link getNotificationMode | notification mode} is "scheduled".
 * Notifications should be scheduled at this hour of the day.
 */
export const getScheduledTimeHour = async (): Promise<number> => {
  try {
    const value = await AsyncStorage.getItem(SCHEDULED_TIME_HOUR_KEY);
    if (value !== null) {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num >= 0 && num <= 23) return num;
    }
    return DEFAULT_SCHEDULED_HOUR;
  } catch (error) {
    console.error("Error getting scheduled time hour:", error);
    return DEFAULT_SCHEDULED_HOUR;
  }
};

/**
 * Sets the user's selected hour for scheduled notifications. Used when {@link getNotificationMode | notification mode} is "scheduled".
 * Notifications should be scheduled at this hour of the day.
 */
export const setScheduledTimeHour = async (hour: number): Promise<void> => {
  try {
    await AsyncStorage.setItem(SCHEDULED_TIME_HOUR_KEY, hour.toString());
  } catch (error) {
    console.error("Error saving scheduled time hour:", error);
  }
};

/**
 * Gets the user's selected minute for scheduled notifications. Used when {@link getNotificationMode | notification mode} is "scheduled".
 * Notifications should be scheduled at this minute of the hour.
 */
export const getScheduledTimeMinute = async (): Promise<number> => {
  try {
    const value = await AsyncStorage.getItem(SCHEDULED_TIME_MINUTE_KEY);
    if (value !== null) {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num >= 0 && num <= 59) return num;
    }
    return DEFAULT_SCHEDULED_MINUTE;
  } catch (error) {
    console.error("Error getting scheduled time minute:", error);
    return DEFAULT_SCHEDULED_MINUTE;
  }
};

/**
 * Sets the user's selected minute for scheduled notifications. Used when {@link getNotificationMode | notification mode} is "scheduled".
 * Notifications should be scheduled at this minute of the hour.
 */
export const setScheduledTimeMinute = async (minute: number): Promise<void> => {
  try {
    await AsyncStorage.setItem(SCHEDULED_TIME_MINUTE_KEY, minute.toString());
  } catch (error) {
    console.error("Error saving scheduled time minute:", error);
  }
};
