import AsyncStorage from "@react-native-async-storage/async-storage";

const MEDITATION_DURATION_KEY = "meditation_duration_ms";
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
