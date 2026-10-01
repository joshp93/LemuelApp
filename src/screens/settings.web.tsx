import { MaterialIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { Stack } from "expo-router";
import { useEffect, useReducer } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LemuelButton } from "../components/lemuel-button";
import { LemuelSwitch } from "../components/lemuel-switch";
import { CONTENT_COLUMN, CONTENT_INSET } from "../constants/layout";
import {
  getEnabledMeditationShaders,
  getMeditationDuration,
  MEDITATION_DURATION_OPTIONS,
  setEnabledMeditationShaders,
  setMeditationDuration,
} from "../settings/meditation-preferences";
import {
  BLANK_SHADER_ID,
  DEFAULT_ENABLED_SHADER_IDS,
  MEDITATION_SHADERS,
  type MeditationShaderId,
} from "../utils/meditation-shaders";

type State = {
  loading: boolean;
  duration: number;
  shaders: MeditationShaderId[];
  isDirty: boolean;
};

type Action =
  | { type: "LOADED"; duration: number; shaders: MeditationShaderId[] }
  | { type: "SET_DURATION"; duration: number }
  | { type: "TOGGLE_SHADER"; id: MeditationShaderId }
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
        shaders: action.shaders,
        isDirty: false,
      };
    case "SET_DURATION":
      return {
        ...state,
        duration: action.duration,
        isDirty: true,
      };
    case "TOGGLE_SHADER": {
      const selected = state.shaders.includes(action.id);
      let shaders: MeditationShaderId[];

      if (action.id === BLANK_SHADER_ID) {
        shaders = selected
          ? state.shaders.filter((id) => id !== BLANK_SHADER_ID)
          : [...state.shaders, BLANK_SHADER_ID];
        if (shaders.length === 0) shaders = [...DEFAULT_ENABLED_SHADER_IDS];
      } else {
        shaders = selected
          ? state.shaders.filter((id) => id !== action.id)
          : [...state.shaders, action.id];
        if (shaders.filter((id) => id !== BLANK_SHADER_ID).length === 0) {
          return state;
        }
      }

      return { ...state, shaders, isDirty: true };
    }
    case "SYNC":
      return { ...state, isDirty: false };
  }
};

const initialState: State = {
  loading: true,
  duration: 60000,
  shaders: [],
  isDirty: false,
};

/**
 * Settings page for the web platform.
 *
 * Shows the meditation timer duration and the enabled meditation animations,
 * plus an informational banner noting that notification and battery-optimisation
 * settings are only available in the native app. Preferences are stored via
 * AsyncStorage, which is backed by localStorage on web.
 */
export default function WebSettingsScreen() {
  const insets = useSafeAreaInsets();
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    (async () => {
      const dur = await getMeditationDuration();
      const shaders = await getEnabledMeditationShaders();
      dispatch({ type: "LOADED", duration: dur, shaders });
    })();
  }, []);

  const handleDurationChange = (value: number) => {
    dispatch({ type: "SET_DURATION", duration: value });
  };

  const handleShaderToggle = (id: MeditationShaderId) => {
    dispatch({ type: "TOGGLE_SHADER", id });
  };

  const handleSave = async () => {
    await setMeditationDuration(state.duration);
    await setEnabledMeditationShaders(state.shaders);
    dispatch({ type: "SYNC" });
  };

  const blankSelected = state.shaders.includes(BLANK_SHADER_ID);

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
          {MEDITATION_SHADERS.map((shader) => {
            const isBlank = shader.id === BLANK_SHADER_ID;
            const isLastAnimation =
              state.shaders.filter((id) => id !== BLANK_SHADER_ID).length ===
                1 && state.shaders.includes(shader.id);

            return (
              <View
                key={shader.id}
                style={[styles.shaderRow, isBlank && styles.shaderRowSpaced]}
              >
                <View style={styles.labelContainer}>
                  <Text style={styles.label}>{shader.label}</Text>
                </View>
                <LemuelSwitch
                  testID={`shader-switch-${shader.id}`}
                  value={state.shaders.includes(shader.id)}
                  onValueChange={() => handleShaderToggle(shader.id)}
                  disabled={!isBlank && (blankSelected || isLastAnimation)}
                />
              </View>
            );
          })}
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
