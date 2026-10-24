import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { AccountStep } from "../components/onboarding/account-step";
import { MeditationStep } from "../components/onboarding/meditation-step";
import { OnboardingSettingsModal } from "../components/onboarding/onboarding-settings-modal";
import { OnboardingSlideIn } from "../components/onboarding/onboarding-slide-in";
import { ReminderStep } from "../components/onboarding/reminder-step";
import { WelcomeStep } from "../components/onboarding/welcome-step";
import { setNotificationsEnabled } from "../notifications/notification-preferences";
import { completeOnboarding } from "../onboarding/onboarding-storage";

type OnboardingStep = 1 | 2 | 3 | 4;
type FinishDestination = "/" | "/email-entry";

/**
 * Native first-launch onboarding flow.
 *
 * Steps share one screen so the reminder explanation can slide over the
 * welcome screen, and Settings can open as a full-screen modal without adding
 * an onboarding route to the navigation stack.
 *
 * @returns The onboarding flow.
 */
export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>(1);
  const [settingsVisible, setSettingsVisible] = useState(false);

  const finish = useCallback(
    async (destination: FinishDestination) => {
      await completeOnboarding();
      router.replace(destination);
    },
    [router],
  );

  const handleSkip = useCallback(() => {
    void finish("/");
  }, [finish]);

  const handleContinueWithoutReminders = useCallback(() => {
    void setNotificationsEnabled(false);
    setStep(3);
  }, []);

  const handleSettingsDone = useCallback(() => {
    setSettingsVisible(false);
    setStep(3);
  }, []);

  return (
    <View style={styles.root}>
      <Stack.Screen
        options={{
          contentStyle: styles.screen,
          headerShown: false,
        }}
      />
      <StatusBar style={settingsVisible ? "dark" : "light"} />

      {step === 1 ? (
        <WelcomeStep onGetStarted={() => setStep(2)} onSkip={handleSkip} />
      ) : null}

      {step === 2 ? (
        <OnboardingSlideIn>
          <ReminderStep
            onContinueWithoutReminders={handleContinueWithoutReminders}
            onEnableReminders={() => setSettingsVisible(true)}
          />
        </OnboardingSlideIn>
      ) : null}

      {step === 3 ? <MeditationStep onNext={() => setStep(4)} /> : null}

      {step === 4 ? (
        <AccountStep
          onContinueWithoutAccount={() => void finish("/")}
          onSignUp={() => void finish("/email-entry")}
        />
      ) : null}

      {settingsVisible ? (
        <OnboardingSettingsModal
          onClose={() => setSettingsVisible(false)}
          onDone={handleSettingsDone}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  screen: {
    backgroundColor: "#000",
  },
});
