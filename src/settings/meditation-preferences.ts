import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DEFAULT_ENABLED_SHADER_IDS,
  isMeditationShaderId,
  type MeditationShaderId,
} from "../utils/meditation-shaders";

const MEDITATION_DURATION_KEY = "meditation_duration_ms";
const MEDITATION_SHADERS_KEY = "meditation_shaders";
const DEFAULT_DURATION_MS = 60000;

/** Selectable meditation timer durations, in milliseconds. */
export const MEDITATION_DURATION_OPTIONS = [
  { label: "5 seconds", value: 5000 },
  { label: "10 seconds", value: 10000 },
  { label: "20 seconds", value: 20000 },
  { label: "30 seconds", value: 30000 },
  { label: "1 minute", value: 60000 },
  { label: "2 minutes", value: 120000 },
  { label: "5 minutes", value: 300000 },
  { label: "10 minutes", value: 600000 },
] as const;

export const getMeditationDuration = async (): Promise<number> => {
  try {
    const value = await AsyncStorage.getItem(MEDITATION_DURATION_KEY);
    if (value !== null) {
      const num = parseInt(value, 10);
      if (!Number.isNaN(num) && num >= 5000 && num <= 600000) return num;
    }
    return DEFAULT_DURATION_MS;
  } catch (error) {
    console.error("Error getting meditation duration:", error);
    return DEFAULT_DURATION_MS;
  }
};

export const setMeditationDuration = async (ms: number): Promise<void> => {
  try {
    await AsyncStorage.setItem(MEDITATION_DURATION_KEY, ms.toString());
  } catch (error) {
    console.error("Error saving meditation duration:", error);
  }
};

/**
 * Reads the meditation shaders the user has enabled.
 *
 * Unknown ids are dropped, and a missing, malformed or empty selection falls
 * back to {@linkcode DEFAULT_ENABLED_SHADER_IDS} so a meditation always has a
 * background.
 *
 * @returns The enabled shader ids, never empty.
 */
export const getEnabledMeditationShaders = async (): Promise<
  MeditationShaderId[]
> => {
  try {
    const value = await AsyncStorage.getItem(MEDITATION_SHADERS_KEY);
    if (value !== null) {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed)) {
        const ids = parsed.filter(isMeditationShaderId);
        if (ids.length > 0) return ids;
      }
    }
    return [...DEFAULT_ENABLED_SHADER_IDS];
  } catch (error) {
    console.error("Error getting meditation shaders:", error);
    return [...DEFAULT_ENABLED_SHADER_IDS];
  }
};

/**
 * Persists the meditation shaders the user has enabled.
 *
 * An empty selection is stored as {@linkcode DEFAULT_ENABLED_SHADER_IDS} rather
 * than nothing, so a meditation can never end up without a background.
 *
 * @param ids - The shader ids to enable.
 */
export const setEnabledMeditationShaders = async (
  ids: readonly MeditationShaderId[],
): Promise<void> => {
  try {
    const usable = ids.filter(isMeditationShaderId);
    await AsyncStorage.setItem(
      MEDITATION_SHADERS_KEY,
      JSON.stringify(
        usable.length > 0 ? usable : [...DEFAULT_ENABLED_SHADER_IDS],
      ),
    );
  } catch (error) {
    console.error("Error saving meditation shaders:", error);
  }
};
