import { reloadAndroidWidgets } from "voltra/android/client";
import { remoteLog } from "../api/remote-logger";

/**
 * Triggers an immediate widget update on app launch.
 *
 * The widget endpoint is unauthenticated and rate-limited at the API Gateway
 * level (100 req/s steady, 200 burst). No credentials are required.
 */
export const initializeWidget = async (): Promise<void> => {
  remoteLog("debug", "[Widget] Triggering immediate widget reload");
  await reloadAndroidWidgets(["proverb_widget"]);
  remoteLog("debug", "[Widget] Widget reload complete");
};