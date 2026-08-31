import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ExpoConfig } from "@expo/config-types";

// Load .env.local for local development — ignored on EAS builds where
// environment variables are set via eas.json
try {
  const envPath = resolve(__dirname, ".env.local");
  if (existsSync(envPath)) {
    const envFile = readFileSync(envPath, "utf-8");
    for (const line of envFile.split("\n")) {
      const trimmed = line.trim();
      if (trimmed === "" || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
} catch {
  // .env.local is optional
}

const config: ExpoConfig = {
  name: "Lemuel",
  slug: "lemuel",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "lemuel",
  userInterfaceStyle: "automatic",
  ios: {
    supportsTablet: true,
    icon: "./assets/images/icon.png",
  },
  android: {
    package: "com.lemuel.app",
    googleServicesFile: "./google-services.json",
    adaptiveIcon: {
      foregroundImage: "./assets/images/icon.png",
      backgroundColor: "#000000",
    },
    predictiveBackGestureEnabled: false,
    permissions: [
      "INTERNET",
      "RECEIVE_BOOT_COMPLETED",
      "POST_NOTIFICATIONS",
      "REQUEST_IGNORE_BATTERY_OPTIMIZATIONS",
    ],
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  description: "Get a daily proverb and take a short moment to meditate on it.",
  plugins: [
    "./plugins/withBlackAccentColor",
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#000000",
        dark: {
          backgroundColor: "#000000",
        },
      },
    ],
    [
      "voltra/app.plugin.js",
      {
        android: {
          widgets: [
            {
              id: "proverb_widget",
              displayName: "Lemuel",
              description:
                "Get a daily proverb and take a short moment to meditate on it.",
              minCellWidth: 2,
              minCellHeight: 2,
              targetCellWidth: 2,
              targetCellHeight: 2,
              initialStatePath: "./src/widgets/proverb-widget-initial.js",
              serverUpdate: {
                url: "https://vua1tbtwtd.execute-api.eu-west-2.amazonaws.com/prod/widgets/render",
                intervalMinutes: 60,
                refresh: false,
              },
            },
          ],
        },
      },
    ],
    "expo-web-browser",
    [
      "expo-notifications",
      {
        icon: "./assets/images/notification-icon.png",
        color: "#000000",
      },
    ],
    "expo-font",
    "expo-image",
    "expo-status-bar",
    "expo-background-task",
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: "4f9b6729-a417-468d-931e-263877cf9764",
    },
    widgetServerHmacKey: process.env.WIDGET_HMAC_KEY,
  },
  owner: "joshpr26",
};

export default config;
