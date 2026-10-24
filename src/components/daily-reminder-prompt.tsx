import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";
import { ONBOARDING_STORAGE_KEY } from "../onboarding/onboarding-storage";
import { confirm } from "../utils/confirm";

/**
 * The original first-launch daily-reminder prompt.
 *
 * This component is deliberately not mounted. Onboarding now owns the
 * first-launch experience; the prompt is retained for reference.
 *
 * @returns Nothing.
 */
export function DailyReminderPrompt() {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === "web") return;

    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    (async () => {
      const shown = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (!shown && active) {
        timer = setTimeout(async () => {
          const accepted = await confirm({
            title: "Daily proverb reminders",
            message:
              "Would you like to receive a daily notification with the proverb of the day? You can adjust this anytime in Settings.",
            confirmLabel: "Go to settings",
            cancelLabel: "Not now",
          });
          if (accepted) {
            router.push("/settings");
          }
        }, 1000);
        await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
      }
    })();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [router]);

  return null;
}
