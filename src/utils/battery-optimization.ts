import * as Application from "expo-application";
import * as Linking from "expo-linking";
import { Platform } from "react-native";

export const openBatteryOptimizationSettings = async () => {
  try {
    if (Platform.OS === "android") {
      const pkg = Application.applicationId;
      const intent = "android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS";

      try {
        const canOpen = await Linking.canOpenURL(intent);
        if (canOpen) {
          await Linking.sendIntent(intent);
          return;
        }
      } catch (e) {}

      if (pkg) {
        try {
          const url = `package:${pkg}`;
          await Linking.openURL(url);
          return;
        } catch (e) {}
      }

      await Linking.openSettings();
    } else if (Platform.OS === "ios") {
      await Linking.openURL("app-settings:");
    }
  } catch (error) {
    console.error("Failed to open battery optimization settings:", error);
  }
};

export const getBatteryOptimizationWarningText = (): string => {
  return "To ensure timely notifications, please disable battery optimization for this app in your device's settings. This setting can sometimes delay background notifications.";
};
