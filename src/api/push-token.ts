import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { getAuthenticatedUser } from "./auth";
import { LEMUEL_API_BASE_URL } from "./constants";
import { remoteLog } from "./remote-logger";

/** Retrieves the device's FCM push token via expo-notifications and registers it
 *  with the backend at POST /push/register-token. Called on every app launch.
 *  Includes the Cognito uuid when the user is signed in so the token is linked
 *  to the user's account. */
export const registerPushToken = async () => {
  try {
    remoteLog("debug", "[PushToken] Retrieving device push token");
    const token = (await Notifications.getDevicePushTokenAsync()).data;
    const user = await getAuthenticatedUser();
    const body: Record<string, string> = { token, platform: Platform.OS };
    if (user?.userId) {
      body.uuid = user.userId;
    }
    remoteLog("debug", "[PushToken] Registering token with backend");
    await fetch(`${LEMUEL_API_BASE_URL}/push/register-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    remoteLog("info", "[PushToken] Token registered successfully");
  } catch (error) {
    remoteLog("error", "[PushToken] Failed to register token", { error });
  }
};
