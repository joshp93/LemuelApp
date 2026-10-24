import { StyleSheet, View } from "react-native";
import { PROVERB_TEXT_COLOR } from "../../constants/meditation";
import { Text } from "../themed-text";
import { OnboardingActions } from "./onboarding-actions";
import { OnboardingScreenshot } from "./onboarding-screenshot";
import { OnboardingStepLayout } from "./onboarding-step-layout";

const HOME_SCREENSHOT = require("../../../assets/images/onboarding/home-screen.webp");

interface ReminderStepProps {
  onEnableReminders: () => void;
  onContinueWithoutReminders: () => void;
}

/**
 * Second onboarding screen: home-screen tour and the daily reminder choice.
 *
 * @param props - The reminder settings and continuation handlers.
 * @returns The reminder step.
 */
export function ReminderStep({
  onEnableReminders,
  onContinueWithoutReminders,
}: ReminderStepProps) {
  return (
    <OnboardingStepLayout
      actions={
        <OnboardingActions
          primaryLabel="Enable daily reminder notifications"
          onPrimaryPress={onEnableReminders}
          secondaryLabel="Continue without reminder notifications"
          onSecondaryPress={onContinueWithoutReminders}
        />
      }
      contentStyle={styles.content}
    >
      <OnboardingScreenshot source={HOME_SCREENSHOT} heightRatio={0.35} />
      <View style={styles.copy}>
        <Text style={styles.body}>
          The home screen shows today's proverb. You can also view previous days
          by selecting them.
        </Text>
        <Text style={[styles.body, styles.question]}>
          Would you like to receive daily reminder notifications?
        </Text>
      </View>
    </OnboardingStepLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: "center",
  },
  copy: {
    marginTop: 20,
    maxWidth: 360,
  },
  body: {
    color: PROVERB_TEXT_COLOR,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "left",
  },
  question: {
    fontWeight: "700",
    marginTop: 16,
  },
});
