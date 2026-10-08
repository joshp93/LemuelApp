import { MaterialIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { Stack } from "expo-router";
import { useCallback, useEffect, useReducer } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { LemuelSwitch } from "../components/lemuel-switch";
import { CONTENT_COLUMN, CONTENT_INSET } from "../constants/layout";
import { useAutoSave } from "../hooks/useAutoSave";
import {
  getEnabledMeditationShaders,
  getMeditationDuration,
  MEDITATION_DURATION_OPTIONS,
  setEnabledMeditationShaders,
  setMeditationDuration,
} from "../settings/meditation-preferences";
import {
  isShaderToggleDisabled,
  toggleShaderSelection,
} from "../settings/shader-selection";
import {
  BLANK_SHADER_ID,
  MEDITATION_SHADERS,
  type MeditationShaderId,
} from "../utils/meditation-shaders";

type State = {
  loading: boolean;
  duration: number;
  shaders: MeditationShaderId[];
};

type Action =
  | { type: "LOADED"; duration: number; shaders: MeditationShaderId[] }
  | { type: "SET_DURATION"; duration: number }
  | { type: "TOGGLE_SHADER"; id: MeditationShaderId };

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
        shaders: action.shaders,
      };
    case "SET_DURATION":
      return { ...state, duration: action.duration };
    case "TOGGLE_SHADER": {
      const shaders = toggleShaderSelection(state.shaders, action.id);
      return shaders === state.shaders ? state : { ...state, shaders };
    }
  }
};

const initialState: State = {
  loading: true,
  duration: 60000,
  shaders: [],
};

/**
 * Settings page for the web platform.
 *
 * Shows the meditation timer duration and the enabled meditation animations,
 * plus an informational banner noting that notification and battery-optimisation
 * settings are only available in the native app. Preferences are stored via
 * AsyncStorage, which is backed by localStorage on web, and written as soon as
 * a control changes.
 */
export default function WebSettingsScreen() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    (async () => {
      const [duration, shaders] = await Promise.all([
        getMeditationDuration(),
        getEnabledMeditationShaders(),
      ]);
      dispatch({ type: "LOADED", duration, shaders });
    })();
  }, []);

  const persist = useCallback(async () => {
    await setMeditationDuration(state.duration);
    await setEnabledMeditationShaders(state.shaders);
  }, [state.duration, state.shaders]);

  useAutoSave(persist, !state.loading);

  const handleDurationChange = (value: number) => {
    dispatch({ type: "SET_DURATION", duration: value });
  };

  const handleShaderToggle = (id: MeditationShaderId) => {
    dispatch({ type: "TOGGLE_SHADER", id });
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
                value={state.shaders.includes(shader.id)}
                onValueChange={() => handleShaderToggle(shader.id)}
                disabled={isShaderToggleDisabled(state.shaders, shader.id)}
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
  labelContainer: {
    flex: 1,
    paddingRight: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
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
