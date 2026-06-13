import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { LEMUEL_API_BASE_URL } from "./constants";
import { remoteLog } from "./remote-logger";

/**
 * Retrieves the device's FCM push token via expo-notifications and registers it
 * with the backend at `POST /push/register-token`. Called on every app launch.
 */
export const registerPushToken = async () => {
  try {
    remoteLog("debug", "[PushToken] Retrieving device push token");
    const token = (await Notifications.getDevicePushTokenAsync()).data;
    remoteLog("debug", "[PushToken] Registering token with backend");
    await fetch(`${LEMUEL_API_BASE_URL}/push/register-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, platform: Platform.OS }),
    });
    remoteLog("info", "[PushToken] Token registered successfully");
  } catch (error) {
    remoteLog("error", "[PushToken] Failed to register token", { error });
  }
};
