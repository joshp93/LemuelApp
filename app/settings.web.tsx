import { MaterialIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { Stack } from "expo-router";
import { useEffect, useReducer, useRef } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LemuelButton } from "../src/components/lemuel-button";

/**
 * Loads the stored meditation duration from localStorage.
 * Falls back to the default 60 seconds when no value is stored.
 */
const getDuration = (): Promise<number> => {
  if (typeof localStorage === "undefined") {
    return Promise.resolve(60000);
  }
  try {
    const raw = localStorage.getItem("meditation_duration_ms");
    if (raw !== null) {
      const num = Number.parseInt(raw, 10);
      if (!Number.isNaN(num) && num >= 5000 && num <= 600000) {
        return Promise.resolve(num);
      }
    }
  } catch {
    /* ignore */
  }
  return Promise.resolve(60000);
};

/**
 * Persists the meditation duration to localStorage.
 */
const persistDuration = async (ms: number): Promise<void> => {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem("meditation_duration_ms", ms.toString());
  } catch {
    /* ignore */
  }
};

type State = { loading: boolean; duration: number; isDirty: boolean };
type Action =
  | { type: "LOADED"; duration: number }
  | { type: "SET_DURATION"; duration: number }
  | { type: "SYNC" };

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

/** Options for meditation timer duration. */
const DURATION_OPTIONS = [
  { label: "5 seconds", value: 5000 },
  { label: "10 seconds", value: 10000 },
  { label: "20 seconds", value: 20000 },
  { label: "30 seconds", value: 30000 },
  { label: "1 minute", value: 60000 },
  { label: "2 minutes", value: 120000 },
  { label: "5 minutes", value: 300000 },
  { label: "10 minutes", value: 600000 },
] as const;

/**
 * Settings page for the web platform.
 *
 * Shows only the meditation timer duration picker and an informational
 * banner noting that notification and battery-optimisation settings
 * are only available in the native app. Preferences are stored in
 * localStorage (cookies on the server-rendered page).
 */
export default function WebSettingsScreen() {
  const insets = useSafeAreaInsets();
  const savedDuration = useRef(60000);
  const [state, dispatch] = useReducer(reducer, {
    loading: true,
    duration: 60000,
    isDirty: false,
  });

  useEffect(() => {
    (async () => {
      const dur = await getDuration();
      savedDuration.current = dur;
      dispatch({ type: "LOADED", duration: dur });
    })();
  }, []);

  const handleDurationChange = (value: number) => {
    dispatch({ type: "SET_DURATION", duration: value });
  };

  const handleSave = async () => {
    await persistDuration(state.duration);
    savedDuration.current = state.duration;
    dispatch({ type: "SYNC" });
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: "Settings" }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={styles.infoBanner}>
          <MaterialIcons
            name="info-outline"
            size={20}
            color="#555"
            style={styles.infoIcon}
          />
          <Text style={styles.infoText}>
            Some settings (notifications, battery optimisation) are only
            available in the native app. Download the Lemuel app for the full
            experience.
          </Text>
        </View>

        <Text style={styles.sectionHeader}>Meditations</Text>

        <View style={styles.durationCard}>
          <Text style={styles.durationLabel}>Meditation timer</Text>
          <Picker
            selectedValue={state.duration}
            onValueChange={handleDurationChange}
          >
            {DURATION_OPTIONS.map((opt) => (
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
        <View
          style={[styles.updateButtonWrapper, { bottom: insets.bottom + 36 }]}
        >
          <LemuelButton onPress={handleSave}>Update</LemuelButton>
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
