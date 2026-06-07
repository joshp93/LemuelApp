import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import * as Notifications from "expo-notifications";
import { Stack, useNavigation } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
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
import { remoteLog } from "../src/api/remote-logger";
import { getChosenVersion } from "../src/api/version-storage";
import { LemuelButton } from "../src/components/lemuel-button";
import { useSettingsPreferences } from "../src/hooks/useSettingsPreferences";
import { sendProverbNotification } from "../src/notifications/daily-proverb-notification";
import {
  NotificationMode,
  setNotificationMode,
  setNotificationsEnabled,
  setRandomWindowEndMinute,
  setRandomWindowHourEnd,
  setRandomWindowHourStart,
  setRandomWindowStartMinute,
  setScheduledTimeHour,
  setScheduledTimeMinute,
} from "../src/notifications/notification-preferences";
import { setMeditationDuration } from "../src/settings/meditation-preferences";

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
  const [animValue] = useState(() => new Animated.Value(selected ? 1 : 0));

  const bodyMaxHeight = useMemo(
    () =>
      animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 300],
      }),
    [animValue],
  );

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: selected ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

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
      <Animated.View style={{ maxHeight: bodyMaxHeight, overflow: "hidden" }}>
        <View style={styles.configContent}>{children}</View>
      </Animated.View>
    </View>
  );
}

export default function SettingsScreen() {
  const navigation = useNavigation();
  const [picking, setPicking] = useState<
    "windowStart" | "windowEnd" | "scheduled" | null
  >(null);
  const {
    loading,
    enabled,
    mode,
    windowStartHour,
    windowStartMinute,
    windowEndHour,
    windowEndMinute,
    scheduledHour,
    scheduledMinute,
    meditationDuration,
    snapshotRef,
    setEnabled,
    setMode,
    setWindowStartHour,
    setWindowStartMinute,
    setWindowEndHour,
    setWindowEndMinute,
    setScheduledHour,
    setScheduledMinute,
    setMeditationDuration: setMeditationDuration_,
    isDirty,
    setIsDirty,
  } = useSettingsPreferences();

  const persistAll = async () => {
    await setNotificationsEnabled(enabled);
    await setNotificationMode(mode);
    await setRandomWindowHourStart(parseInt(windowStartHour, 10) || 9);
    await setRandomWindowStartMinute(parseInt(windowStartMinute, 10) || 0);
    await setRandomWindowHourEnd(parseInt(windowEndHour, 10) || 19);
    await setRandomWindowEndMinute(parseInt(windowEndMinute, 10) || 0);
    await setScheduledTimeHour(parseInt(scheduledHour, 10) || 9);
    await setScheduledTimeMinute(parseInt(scheduledMinute, 10) || 0);
    await setMeditationDuration(meditationDuration);
    snapshotRef.current = {
      enabled,
      mode,
      windowStartHour,
      windowStartMinute,
      windowEndHour,
      windowEndMinute,
      scheduledHour,
      scheduledMinute,
      meditationDuration: meditationDuration.toString(),
    };
    setIsDirty(false);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e: any) => {
      if (!isDirty) return;

      e.preventDefault();
      Alert.alert("Update your settings?", "", [
        {
          text: "Update",
          onPress: async () => {
            await persistAll();
            navigation.dispatch(e.data.action);
          },
        },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => navigation.dispatch(e.data.action),
        },
        { text: "Cancel", style: "cancel" },
      ]);
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, navigation]);

  const handleToggle = async (value: boolean) => {
    setEnabled(value);
    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        setEnabled(false);
      }
    }
  };

  const handleModeChange = (newMode: NotificationMode) => {
    setMode(newMode);
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

  const handleValueChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setPicking(null);
    }
    if (!selectedDate) return;
    const hours = selectedDate.getHours();
    const minutes = selectedDate.getMinutes();
    if (picking === "windowStart") {
      setWindowStartHour(hours.toString());
      setWindowStartMinute(minutes.toString());
    } else if (picking === "windowEnd") {
      setWindowEndHour(hours.toString());
      setWindowEndMinute(minutes.toString());
    } else if (picking === "scheduled") {
      setScheduledHour(hours.toString());
      setScheduledMinute(minutes.toString());
    }
  };

  const handleDismiss = () => {
    setPicking(null);
  };

  const openPicker = (field: "windowStart" | "windowEnd" | "scheduled") => {
    setPicking(field);
  };

  const handleSendExample = async () => {
    try {
      const storedVersion = await getChosenVersion();
      const version = storedVersion || "niv";
      const proverb = await getProverbForTheDay(version);
      await sendProverbNotification(proverb);
    } catch (error) {
      remoteLog("error", "[Settings] Failed to send example notification", {
        error,
      });
    }
  };

  const durationOptions = [
    { label: "5 seconds", value: 5000 },
    { label: "10 seconds", value: 10000 },
    { label: "20 seconds", value: 20000 },
    { label: "30 seconds", value: 30000 },
    { label: "1 minute", value: 60000 },
    { label: "2 minutes", value: 120000 },
    { label: "5 minutes", value: 300000 },
    { label: "10 minutes", value: 600000 },
  ];

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: "Settings" }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <Text style={styles.sectionHeader}>Notifications</Text>

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
          <View>
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

            <View style={{ marginBottom: 16 }}>
              <LemuelButton onPress={handleSendExample}>
                Send example notification
              </LemuelButton>
            </View>
          </View>
        )}

        <Text style={styles.sectionHeader}>Meditations</Text>

        <View style={styles.durationCard}>
          <Text style={styles.durationLabel}>Meditation timer</Text>
          <Picker
            selectedValue={meditationDuration}
            onValueChange={(v: number) => setMeditationDuration_(v)}
          >
            {durationOptions.map((opt) => (
              <Picker.Item
                key={opt.value}
                label={opt.label}
                value={opt.value}
              />
            ))}
          </Picker>
        </View>
      </ScrollView>

      {!loading && isDirty && (
        <View style={styles.updateButtonWrapper}>
          <LemuelButton onPress={persistAll}>Update</LemuelButton>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F0F8FF",
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
    marginTop: 8,
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
  durationCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  durationLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 12,
  },
  updateButtonWrapper: {
    position: "absolute",
    bottom: 36,
    left: 20,
    right: 20,
  },
});
