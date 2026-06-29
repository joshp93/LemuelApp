import { Picker } from "@react-native-picker/picker";
import * as Notifications from "expo-notifications";
import { Stack, useNavigation } from "expo-router";
import { useEffect } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { getProverbForTheDay } from "../src/api/proverbs";
import { remoteLog } from "../src/api/remote-logger";
import { getChosenVersion } from "../src/api/version-storage";
import { ExpandableSection } from "../src/components/expandable-section";
import { LemuelButton } from "../src/components/lemuel-button";
import { TimePicker } from "../src/components/time-picker";
import { useSettingsPreferences } from "../src/hooks/useSettingsPreferences";
import { sendProverbNotification } from "../src/notifications/daily-proverb-notification";
import {
  type NotificationMode,
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
import {
  getBatteryOptimizationWarningText,
  openBatteryOptimizationSettings,
} from "../src/utils/battery-optimization";
export default function SettingsScreen() {
  const navigation = useNavigation();
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
              <TimePicker
                mode="random"
                hour={windowStartHour}
                minute={windowStartMinute}
                endHour={windowEndHour}
                endMinute={windowEndMinute}
                onHourChange={setWindowStartHour}
                onMinuteChange={setWindowStartMinute}
                onEndHourChange={setWindowEndHour}
                onEndMinuteChange={setWindowEndMinute}
              />
            </ExpandableSection>

            <ExpandableSection
              selected={mode === "scheduled"}
              onSelect={() => handleModeChange("scheduled")}
              label="Send at a specific time"
            >
              <TimePicker
                mode="scheduled"
                hour={scheduledHour}
                minute={scheduledMinute}
                onHourChange={setScheduledHour}
                onMinuteChange={setScheduledMinute}
              />
            </ExpandableSection>

            <View style={{ marginBottom: 16 }}>
              <LemuelButton onPress={handleSendExample}>
                Send example notification
              </LemuelButton>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                {getBatteryOptimizationWarningText()}
              </Text>
              <LemuelButton onPress={openBatteryOptimizationSettings}>
                Open battery settings
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
});
