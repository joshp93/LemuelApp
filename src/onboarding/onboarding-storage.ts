import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Storage key for the first-launch check.
 *
 * The key predates onboarding: it was written by the daily-reminder prompt, so
 * every existing installation already has it and will skip onboarding.
 */
export const ONBOARDING_STORAGE_KEY = "notification_prompt_shown";

/**
 * Reports whether the user has already been through the first-launch flow.
 *
 * @returns True when onboarding has been completed on this installation.
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY)) !== null;
  } catch (error) {
    console.error("Error reading onboarding state:", error);
    return false;
  }
}

/**
 * Records that the first-launch flow has been completed.
 */
export async function completeOnboarding(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
  } catch (error) {
    console.error("Error saving onboarding state:", error);
  }
}
