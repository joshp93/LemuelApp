import { StyleSheet, View } from "react-native";
import { PROVERB_TEXT_COLOR } from "../../constants/meditation";
import { Text } from "../themed-text";
import { OnboardingActions } from "./onboarding-actions";
import { OnboardingScreenshot } from "./onboarding-screenshot";
import { OnboardingStepLayout } from "./onboarding-step-layout";

const NOTE_EDITOR_SCREENSHOT = require("../../../assets/images/onboarding/note-editor.webp");

interface AccountStepProps {
  onSignUp: () => void;
  onContinueWithoutAccount: () => void;
}

/**
 * Final onboarding screen: community notes and the account choice.
 *
 * @param props - The sign-up and guest handlers.
 * @returns The account step.
 */
export function AccountStep({
  onSignUp,
  onContinueWithoutAccount,
}: AccountStepProps) {
  return (
    <OnboardingStepLayout
      actions={
        <OnboardingActions
          primaryLabel="Sign up"
          onPrimaryPress={onSignUp}
          secondaryLabel="Continue without account"
          onSecondaryPress={onContinueWithoutAccount}
        />
      }
      contentStyle={styles.content}
      reveal
    >
      <OnboardingScreenshot
        maxHeight={320}
        source={NOTE_EDITOR_SCREENSHOT}
        heightRatio={0.34}
      />
      <View style={styles.copy}>
        <Text style={styles.body}>
          When you capture your thoughts for a proverb, they will appear on the
          home screen under the relevant proverb for all users, unless you
          choose to make them private.
        </Text>
        <Text style={[styles.body, styles.secondary]}>
          In order to make notes against a proverb and to get the full
          experience, you need to create an account.
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
  secondary: {
    fontWeight: "700",
    marginTop: 14,
  },
});
