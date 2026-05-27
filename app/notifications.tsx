import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  scheduleNextDayProverbNotification,
  sendProverbNotification,
} from "../src/notifications/daily-proverb-notification";
import { getProverbForTheDay } from "../src/api/proverbs";
import { getChosenVersion } from "../src/api/version-storage";
import {
  getNotificationsEnabled,
  setNotificationsEnabled,
} from "../src/notifications/notification-preferences";
import {
  openBatteryOptimizationSettings,
  getBatteryOptimizationWarningText,
} from "../src/utils/battery-optimization";

export default function NotificationsSettings() {
  const router = useRouter();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotificationPreference();
  }, []);

  const loadNotificationPreference = async () => {
    const isEnabled = await getNotificationsEnabled();
    setEnabled(isEnabled);
    setLoading(false);
  };

  const handleToggle = async (value: boolean) => {
    setEnabled(value);
    await setNotificationsEnabled(value);

    if (value) {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== "granted") {
          setEnabled(false);
          await setNotificationsEnabled(false);
          return;
        }
        const storedVersion = await getChosenVersion();
        const version = storedVersion || "niv";
        const proverb = await getProverbForTheDay(version);
        await scheduleNextDayProverbNotification(proverb);
      } catch (error) {
        console.error("Failed to request notification permissions:", error);
        setEnabled(false);
        await setNotificationsEnabled(false);
      }
    } else {
      try {
        console.debug("Cancelling all scheduled notifications...");
        await Notifications.cancelAllScheduledNotificationsAsync();
      } catch (error) {
        console.error("Failed to cancel notifications:", error);
      }
    }
  };

  const handleSendExample = async () => {
    try {
      const storedVersion = await getChosenVersion();
      const version = storedVersion || "niv";
      const proverb = await getProverbForTheDay(version);
      await sendProverbNotification(proverb);
    } catch (error) {
      console.error("Failed to send example notification:", error);
    }
  };

  const handleOpenBatterySettings = async () => {
    await openBatteryOptimizationSettings();
  };

  return (
    <>
      <Stack.Screen options={{ title: "Notifications" }} />
      <ScrollView style={styles.container}>
        <View style={styles.settingItem}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>
              Enable daily proverb meditation notifications
            </Text>
          </View>
          {!loading && (
            <Switch
              value={enabled}
              onValueChange={handleToggle}
              trackColor={{ false: "#d3d3d3", true: "#007AFF" }}
              thumbColor={enabled ? "#007AFF" : "#f4f3f4"}
            />
          )}
        </View>
        <Text style={styles.description}>
          Receive a daily reminder notification to meditate on today&apos;s
          proverb.
        </Text>

        {enabled && (
          <>
            <View style={styles.spacer} />
            <TouchableOpacity
              style={styles.button}
              onPress={handleSendExample}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>Send example notification</Text>
            </TouchableOpacity>

            <View style={styles.spacer} />
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                {getBatteryOptimizationWarningText()}
              </Text>
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={handleOpenBatterySettings}
                activeOpacity={0.7}
              >
                <Text style={styles.settingsButtonText}>
                  Open battery settings
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F0F8FF", // Light blue background
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: "white",
    borderRadius: 8,
    marginBottom: 20,
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  description: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 20,
  },
  spacer: {
    height: 16,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  infoBox: {
    backgroundColor: "#E6F4FE", // Light blue background
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF", // Blue accent
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 13,
    color: "#333",
    lineHeight: 20,
    marginBottom: 12,
  },
  settingsButton: {
    backgroundColor: "#007AFF", // Blue button
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  settingsButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
