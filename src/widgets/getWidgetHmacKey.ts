import Constants from "expo-constants";

/**
 * Reads the widget HMAC key injected at build time from the
 * `WIDGET_HMAC_KEY` environment variable (exposed via
 * `expo.extra.widgetServerHmacKey`).
 *
 * Throws if the value is missing or empty — the app cannot initialise the
 * server-driven widget without it.
 */
export const getWidgetHmacKey = (): string => {
  const value = Constants.expoConfig?.extra?.widgetServerHmacKey;

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(
      "[WidgetCredentials] widgetServerHmacKey is missing from expo.extra — ensure WIDGET_HMAC_KEY is set in eas.json env or as a local environment variable",
    );
  }

  return value;
};