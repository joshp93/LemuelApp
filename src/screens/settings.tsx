import { Picker } from "@react-native-picker/picker";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { getReplyNotificationsEnabled, updateAccount } from "../api/account";
import { remoteLog } from "../api/remote-logger";
import { useAuth } from "../auth/auth-context";
import { ExpandableSection } from "../components/expandable-section";
import { LemuelButton } from "../components/lemuel-button";
import { LemuelSwitch } from "../components/lemuel-switch";
import { TimePicker } from "../components/time-picker";
import { CONTENT_INSET } from "../constants/layout";
import { useAutoSave } from "../hooks/useAutoSave";
import { useSettingsPreferences } from "../hooks/useSettingsPreferences";

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
} from "../notifications/notification-preferences";
import { ensureNotificationsScheduled } from "../notifications/push-listener";
import {
  MEDITATION_DURATION_OPTIONS,
  setEnabledMeditationShaders,
  setMeditationDuration,
} from "../settings/meditation-preferences";
import { isShaderToggleDisabled } from "../settings/shader-selection";
import {
  getBatteryOptimizationWarningText,
  openBatteryOptimizationSettings,
} from "../utils/battery-optimization";
import {
  BLANK_SHADER_ID,
  MEDITATION_SHADERS,
} from "../utils/meditation-shaders";
import { parseTimePart } from "../utils/time-part";

export default function SettingsScreen() {
  const { user } = useAuth();
  const [replyNotificationsEnabled, setReplyNotificationsEnabled] =
    useState<boolean>(true);
  const [replyNotificationsLoading, setReplyNotificationsLoading] =
    useState(true);
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
    enabledShaders,
    setEnabled,
    setMode,
    setWindowStartHour,
    setWindowStartMinute,
    setWindowEndHour,
    setWindowEndMinute,
    setScheduledHour,
    setScheduledMinute,
    setMeditationDuration: setMeditationDuration_,
    toggleShader,
  } = useSettingsPreferences();

  const persist = useCallback(async () => {
    await setNotificationsEnabled(enabled);
    await setNotificationMode(mode);
    await setRandomWindowHourStart(parseTimePart(windowStartHour, 9));
    await setRandomWindowStartMinute(parseTimePart(windowStartMinute, 0));
    await setRandomWindowHourEnd(parseTimePart(windowEndHour, 19));
    await setRandomWindowEndMinute(parseTimePart(windowEndMinute, 0));
    await setScheduledTimeHour(parseTimePart(scheduledHour, 9));
    await setScheduledTimeMinute(parseTimePart(scheduledMinute, 0));
    await setMeditationDuration(meditationDuration);
    await setEnabledMeditationShaders(enabledShaders);
    await ensureNotificationsScheduled(2, true);
  }, [
    enabled,
    mode,
    windowStartHour,
    windowStartMinute,
    windowEndHour,
    windowEndMinute,
    scheduledHour,
    scheduledMinute,
    meditationDuration,
    enabledShaders,
  ]);

  useAutoSave(persist, !loading);

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

  useEffect(() => {
    if (!user) {
      setReplyNotificationsLoading(false);
      return;
    }
    getReplyNotificationsEnabled(user.userId).then((enabled) => {
      setReplyNotificationsEnabled(enabled);
      setReplyNotificationsLoading(false);
    });
  }, [user]);

  const handleReplyNotificationsToggle = async (value: boolean) => {
    setReplyNotificationsEnabled(value);
    try {
      const success = await updateAccount(user!.userId, {
        replyNotificationsEnabled: value,
      });
      remoteLog("info", "[Settings] Reply notifications toggled", { value });
      if (!success) {
        setReplyNotificationsEnabled(!value);
      }
    } catch (error) {
      remoteLog("error", "[Settings] Failed to toggle reply notifications", {
        error,
      });
      setReplyNotificationsEnabled(!value);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: "Settings" }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <Text style={styles.sectionHeader}>Notifications</Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            {getBatteryOptimizationWarningText()}
          </Text>
          <LemuelButton onPress={openBatteryOptimizationSettings}>
            Open battery settings
          </LemuelButton>
        </View>

        <View style={styles.notificationsCard}>
          <View style={styles.settingItemRow}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>
                Enable daily proverb meditation notifications
              </Text>
            </View>
            {!loading && (
              <LemuelSwitch value={enabled} onValueChange={handleToggle} />
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
            </View>
          )}
        </View>

        {user && (
          <View style={styles.notificationsCard}>
            <View style={styles.replyToggleRow}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>
                  Notify me when someone replies to my note
                </Text>
              </View>
              {!replyNotificationsLoading && (
                <LemuelSwitch
                  value={replyNotificationsEnabled}
                  onValueChange={handleReplyNotificationsToggle}
                />
              )}
            </View>
          </View>
        )}

        <Text style={styles.sectionHeader}>Meditations</Text>

        <View style={styles.durationCard}>
          <Text style={styles.durationLabel}>Meditation timer</Text>
          <Picker
            testID="duration-picker"
            selectedValue={meditationDuration}
            onValueChange={(v: number) => setMeditationDuration_(v)}
          >
            {MEDITATION_DURATION_OPTIONS.map((opt) => (
              <Picker.Item
                key={opt.value}
                label={opt.label}
                value={opt.value}
              />
            ))}
          </Picker>
        </View>

        <View style={styles.durationCard}>
          <Text style={styles.durationLabel}>Meditation animations</Text>
          <Text style={styles.shaderHint}>
            A random animation is chosen each time you meditate.
          </Text>
          {MEDITATION_SHADERS.map((shader) => (
            <View
              key={shader.id}
              style={[
                styles.shaderRow,
                shader.id === BLANK_SHADER_ID && styles.shaderRowSpaced,
              ]}
            >
              <View style={styles.labelContainer}>
                <Text style={styles.label}>{shader.label}</Text>
              </View>
              <LemuelSwitch
                testID={`shader-switch-${shader.id}`}
                value={enabledShaders.includes(shader.id)}
                onValueChange={() => toggleShader(shader.id)}
                disabled={isShaderToggleDisabled(enabledShaders, shader.id)}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: CONTENT_INSET,
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
  shaderHint: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  shaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  shaderRowSpaced: {
    marginTop: 14,
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
  notificationsCard: {
    backgroundColor: "white",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 20,
  },
  settingItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  replyToggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
});
