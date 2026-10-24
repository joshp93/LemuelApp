import { Image, StyleSheet, View } from "react-native";
import { PROVERB_TEXT_COLOR } from "../../constants/meditation";
import { Text } from "../themed-text";
import { OnboardingActions } from "./onboarding-actions";
import { OnboardingStepLayout } from "./onboarding-step-layout";

const LOGO = require("../../../assets/images/app-logo.png");

const WELCOME_COPY =
  "Welcome to Lemuel, the daily proverb app which encourages you to stop and meditate on 1 proverb each day.";

interface WelcomeStepProps {
  onGetStarted: () => void;
  onSkip: () => void;
}

/**
 * First onboarding screen: brand, welcome copy and entry actions.
 *
 * @param props - The get-started and skip handlers.
 * @returns The welcome step.
 */
export function WelcomeStep({ onGetStarted, onSkip }: WelcomeStepProps) {
  return (
    <OnboardingStepLayout
      actions={
        <OnboardingActions
          primaryLabel="Get started"
          onPrimaryPress={onGetStarted}
          secondaryLabel="Skip introduction"
          onSecondaryPress={onSkip}
        />
      }
      contentStyle={styles.content}
      reveal
    >
      <View style={styles.brand}>
        <Image resizeMode="contain" source={LOGO} style={styles.logo} />
        <Text style={styles.welcome}>{WELCOME_COPY}</Text>
      </View>
    </OnboardingStepLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: "center",
  },
  brand: {
    alignItems: "center",
    paddingTop: 8,
  },
  logo: {
    alignSelf: "center",
    width: 220,
    height: 80,
  },
  welcome: {
    color: PROVERB_TEXT_COLOR,
    fontSize: 20,
    lineHeight: 30,
    marginTop: 24,
    maxWidth: 340,
    textAlign: "center",
  },
});
