import DateTimePicker from "@react-native-community/datetimepicker";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getProverbForTheDay } from "../src/api/proverbs";
import { getChosenVersion } from "../src/api/version-storage";
import {
  scheduleProverbNotification,
  sendProverbNotification,
} from "../src/notifications/daily-proverb-notification";
import {
  getNotificationMode,
  getRandomWindowEnd,
  getRandomWindowEndMinute,
  getRandomWindowStart,
  getRandomWindowStartMinute,
  getScheduledTimeHour,
  getScheduledTimeMinute,
  setNotificationMode,
  setRandomWindowEnd,
  setRandomWindowEndMinute,
  setRandomWindowStart,
  setRandomWindowStartMinute,
  setScheduledTimeHour,
  setScheduledTimeMinute,
} from "../src/notifications/notification-preferences";
import type { NotificationMode } from "../src/notifications/notification-preferences";
import {
  getNotificationsEnabled,
  setNotificationsEnabled,
} from "../src/notifications/notification-preferences";
import {
  getBatteryOptimizationWarningText,
  openBatteryOptimizationSettings,
} from "../src/utils/battery-optimization";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function ExpandableSection({
  selected,
  onSelect,
  label,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  label: string;
  children: React.ReactNode;
}) {
  const animValue = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: selected ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [selected]);

  const bodyMaxHeight = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 300],
  });

  return (
    <View style={styles.sectionCard}>
      <TouchableOpacity
        style={styles.radioRow}
        onPress={onSelect}
        activeOpacity={0.7}
      >
        <View style={styles.radioOuter}>
          {selected && <View style={styles.radioInner} />}
        </View>
        <Text style={styles.radioLabel}>{label}</Text>
      </TouchableOpacity>
      <Animated.View
        style={{ maxHeight: bodyMaxHeight, overflow: "hidden" }}
      >
        <View style={styles.configContent}>{children}</View>
      </Animated.View>
    </View>
  );
}

export default function NotificationsSettings() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState<NotificationMode>("random");

  const [windowStartHour, setWindowStartHour] = useState("9");
  const [windowStartMinute, setWindowStartMinute] = useState("0");
  const [windowEndHour, setWindowEndHour] = useState("19");
  const [windowEndMinute, setWindowEndMinute] = useState("0");
  const [scheduledHour, setScheduledHour] = useState("9");
  const [scheduledMinute, setScheduledMinute] = useState("0");

  const [picking, setPicking] = useState<
    "windowStart" | "windowEnd" | "scheduled" | null
  >(null);

  const loadPreferences = useCallback(async () => {
    const isEnabled = await getNotificationsEnabled();
    setEnabled(isEnabled);
    const currentMode = await getNotificationMode();
    setMode(currentMode);
    setWindowStartHour((await getRandomWindowStart()).toString());
    setWindowStartMinute((await getRandomWindowStartMinute()).toString());
    setWindowEndHour((await getRandomWindowEnd()).toString());
    setWindowEndMinute((await getRandomWindowEndMinute()).toString());
    setScheduledHour((await getScheduledTimeHour()).toString());
    setScheduledMinute((await getScheduledTimeMinute()).toString());
  }, []);

  const reschedule = useCallback(async () => {
    try {
      const storedVersion = await getChosenVersion();
      const version = storedVersion || "niv";
      const proverb = await getProverbForTheDay(version);
      await scheduleProverbNotification(proverb);
    } catch (error) {
      console.error("Failed to reschedule notification:", error);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    loadPreferences()
      .then(() => {
        if (mounted) setLoading(false);
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [loadPreferences]);

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
        await reschedule();
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

  const handleModeChange = async (newMode: NotificationMode) => {
    setMode(newMode);
    await setNotificationMode(newMode);
    await reschedule();
  };

  const getPickerDate = (): Date => {
    const d = new Date();
    if (picking === "windowStart") {
      d.setHours(
        parseInt(windowStartHour, 10) || 9,
        parseInt(windowStartMinute, 10) || 0,
        0,
        0,
      );
    } else if (picking === "windowEnd") {
      d.setHours(
        parseInt(windowEndHour, 10) || 19,
        parseInt(windowEndMinute, 10) || 0,
        0,
        0,
      );
    } else if (picking === "scheduled") {
      d.setHours(
        parseInt(scheduledHour, 10) || 9,
        parseInt(scheduledMinute, 10) || 0,
        0,
        0,
      );
    }
    return d;
  };

  const handleValueChange = async (_event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setPicking(null);
    }
    if (!selectedDate) return;
    const hours = selectedDate.getHours();
    const minutes = selectedDate.getMinutes();
    if (picking === "windowStart") {
      setWindowStartHour(hours.toString());
      setWindowStartMinute(minutes.toString());
      await setRandomWindowStart(hours);
      await setRandomWindowStartMinute(minutes);
      await reschedule();
    } else if (picking === "windowEnd") {
      setWindowEndHour(hours.toString());
      setWindowEndMinute(minutes.toString());
      await setRandomWindowEnd(hours);
      await setRandomWindowEndMinute(minutes);
      await reschedule();
    } else if (picking === "scheduled") {
      setScheduledHour(hours.toString());
      setScheduledMinute(minutes.toString());
      await setScheduledTimeHour(hours);
      await setScheduledTimeMinute(minutes);
      await reschedule();
    }
  };

  const handleDismiss = () => {
    setPicking(null);
  };

  const openPicker = (
    field: "windowStart" | "windowEnd" | "scheduled",
  ) => {
    setPicking(field);
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
        <Text style={styles.description}>
          Receive a daily reminder notification to meditate on today&apos;s
          proverb. Notifications will be delivered even if the app is closed.
        </Text>

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
              trackColor={{ false: "#d3d3d3", true: "black" }}
              thumbColor={enabled ? "black" : "#f4f3f4"}
            />
          )}
        </View>

        {enabled && !loading && (
          <>
            <View style={styles.spacer} />

            <ExpandableSection
              selected={mode === "random"}
              onSelect={() => handleModeChange("random")}
              label="Send at a random time"
            >
              <Text style={styles.timeFormatNote}>
                Times are in 24-hour format
              </Text>
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>From:</Text>
                <TouchableOpacity
                  style={styles.timeDisplay}
                  onPress={() => openPicker("windowStart")}
                >
                  <Text style={styles.timeDisplayText}>
                    {pad(parseInt(windowStartHour, 10))}:
                    {pad(parseInt(windowStartMinute, 10))}
                  </Text>
                </TouchableOpacity>
                <View style={styles.timeSpacer} />
                <Text style={styles.timeLabel}>To:</Text>
                <TouchableOpacity
                  style={styles.timeDisplay}
                  onPress={() => openPicker("windowEnd")}
                >
                  <Text style={styles.timeDisplayText}>
                    {pad(parseInt(windowEndHour, 10))}:
                    {pad(parseInt(windowEndMinute, 10))}
                  </Text>
                </TouchableOpacity>
              </View>
              {parseInt(windowStartHour, 10) * 60 +
                parseInt(windowStartMinute, 10) >=
                parseInt(windowEndHour, 10) * 60 +
                  parseInt(windowEndMinute, 10) && (
                <Text style={styles.validationText}>
                  Start time must be before end time
                </Text>
              )}
            </ExpandableSection>

            <ExpandableSection
              selected={mode === "scheduled"}
              onSelect={() => handleModeChange("scheduled")}
              label="Send at a specific time"
            >
              <Text style={styles.timeFormatNote}>
                Times are in 24-hour format
              </Text>
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>Time:</Text>
                <TouchableOpacity
                  style={styles.timeDisplay}
                  onPress={() => openPicker("scheduled")}
                >
                  <Text style={styles.timeDisplayText}>
                    {pad(parseInt(scheduledHour, 10))}:
                    {pad(parseInt(scheduledMinute, 10))}
                  </Text>
                </TouchableOpacity>
              </View>
            </ExpandableSection>

            {picking && (
              <DateTimePicker
                value={getPickerDate()}
                mode="time"
                display="default"
                onValueChange={handleValueChange}
                onDismiss={handleDismiss}
              />
            )}

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
    backgroundColor: "#F0F8FF",
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
    paddingRight: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  description: {
    fontSize: 18,
    color: "#333",
    lineHeight: 26,
    marginBottom: 20,
  },
  spacer: {
    height: 16,
  },
  sectionCard: {
    backgroundColor: "white",
    borderRadius: 8,
    marginBottom: 12,
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "black",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "black",
  },
  radioLabel: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  configContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  timeFormatNote: {
    fontSize: 12,
    color: "#999",
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeLabel: {
    fontSize: 16,
    color: "#333",
    marginRight: 4,
  },
  timeDisplay: {
    backgroundColor: "#F0F8FF",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    minWidth: 70,
    alignItems: "center",
  },
  timeDisplayText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
  },
  timeSpacer: {
    width: 20,
  },
  validationText: {
    color: "#dc3545",
    fontSize: 13,
    marginTop: 8,
  },
  button: {
    backgroundColor: "black",
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
    backgroundColor: "#E6F4FE",
    borderLeftWidth: 4,
    borderLeftColor: "black",
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
    backgroundColor: "black",
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
