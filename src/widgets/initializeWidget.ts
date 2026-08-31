import {
  reloadAndroidWidgets,
  setWidgetServerCredentials,
} from "voltra/android/client";
import { remoteLog } from "../api/remote-logger";
import { getChosenVersion } from "../api/version-storage";
import { getWidgetHmacKey } from "./getWidgetHmacKey";

/**
 * Initialises the Voltra server-driven widget credentials and triggers an
 * immediate update.
 *
 * Reads the shared HMAC key via {@link getWidgetHmacKey} (injected at build
 * time from the `WIDGET_HMAC_KEY` environment variable), reads the user's
 * chosen Bible version from AsyncStorage (defaulting to `"niv"`), stores the
 * HMAC token and `X-Bible-Version` header via
 * {@link setWidgetServerCredentials} for the WorkManager background worker,
 * then calls {@link reloadAndroidWidgets} to immediately fetch fresh widget
 * content from the server.
 *
 * Should be called once on app launch.
 */
export const initializeWidget = async (): Promise<void> => {
  remoteLog("debug", "[WidgetCredentials] Initialising widget credentials");

  const hmacKey = getWidgetHmacKey();

  const version = (await getChosenVersion()) || "niv";
  remoteLog("debug", "[WidgetCredentials] Setting server credentials", {
    version,
  });

  await setWidgetServerCredentials({
    token: hmacKey,
    headers: { "X-Bible-Version": version },
  });

  remoteLog(
    "debug",
    "[WidgetCredentials] Credentials stored, triggering immediate widget reload",
  );
  await reloadAndroidWidgets(["proverb_widget"]);
  remoteLog("debug", "[WidgetCredentials] Widget reload complete");
};