import { MaterialIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { Stack } from "expo-router";
import { useEffect, useReducer } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LemuelButton } from "../components/lemuel-button";
import { CONTENT_COLUMN, CONTENT_INSET } from "../constants/layout";
import {
  getMeditationDuration,
  MEDITATION_DURATION_OPTIONS,
  setMeditationDuration,
} from "../settings/meditation-preferences";

type State = { loading: boolean; duration: number; isDirty: boolean };
type Action =
  | { type: "LOADED"; duration: number }
  | { type: "SET_DURATION"; duration: number }
  | { type: "SYNC" };

/**
 * Reducer for the web settings form.
 *
 * @param state - The current form state.
 * @param action - The action to apply.
 * @returns The next form state.
 */
const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "LOADED":
      return {
        loading: false,
        duration: action.duration,
        isDirty: false,
      };
    case "SET_DURATION":
      return {
        ...state,
        duration: action.duration,
        isDirty: true,
      };
    case "SYNC":
      return { ...state, isDirty: false };
  }
};

/**
 * Settings page for the web platform.
 *
 * Shows only the meditation timer duration picker and an informational
 * banner noting that notification and battery-optimisation settings
 * are only available in the native app. Preferences are stored via
 * AsyncStorage, which is backed by localStorage on web.
 */
export default function WebSettingsScreen() {
  const insets = useSafeAreaInsets();
  const [state, dispatch] = useReducer(reducer, {
    loading: true,
    duration: 60000,
    isDirty: false,
  });

  useEffect(() => {
    (async () => {
      const dur = await getMeditationDuration();
      dispatch({ type: "LOADED", duration: dur });
    })();
  }, []);

  const handleDurationChange = (value: number) => {
    dispatch({ type: "SET_DURATION", duration: value });
  };

  const handleSave = async () => {
    await setMeditationDuration(state.duration);
    dispatch({ type: "SYNC" });
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: "Settings" }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.container}
        contentContainerStyle={[styles.content, CONTENT_COLUMN]}
      >
        <View style={styles.infoBanner}>
          <MaterialIcons
            name="info-outline"
            size={20}
            color="#555"
            style={styles.infoIcon}
          />
          <Text style={styles.infoText}>
            Some settings are only available in the native app. Download the
            Lemuel app for the full experience.
          </Text>
        </View>

        <Text style={styles.sectionHeader}>Meditations</Text>

        <View style={styles.durationCard}>
          <Text style={styles.durationLabel}>Meditation timer</Text>
          <Picker
            selectedValue={state.duration}
            onValueChange={handleDurationChange}
            style={styles.durationPicker}
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
      </ScrollView>

      {!state.loading && state.isDirty && (
        <View style={[styles.updateBar, { bottom: insets.bottom + 36 }]}>
          <View style={[styles.updateBarInner, CONTENT_COLUMN]}>
            <LemuelButton onPress={handleSave}>Update</LemuelButton>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: CONTENT_INSET,
    paddingBottom: 100,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
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
  durationPicker: {
    borderWidth: 0,
  },
  updateBar: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  updateBarInner: {
    paddingHorizontal: CONTENT_INSET,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFBEA",
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#92400E",
    lineHeight: 20,
  },
});
