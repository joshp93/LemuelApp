import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ACCENT_COLOR } from "../../constants/meditation";
import { LemuelButton } from "../lemuel-button";
import { Text } from "../themed-text";

interface OnboardingActionsProps {
  primaryLabel: string;
  onPrimaryPress: () => void;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
  primaryDisabled?: boolean;
}

/**
 * Bottom action stack shared by the onboarding screens.
 *
 * @param props - The primary and optional secondary actions.
 * @returns The stacked buttons.
 */
export function OnboardingActions({
  primaryLabel,
  onPrimaryPress,
  secondaryLabel,
  onSecondaryPress,
  primaryDisabled = false,
}: OnboardingActionsProps) {
  return (
    <View style={styles.container}>
      <LemuelButton
        color={ACCENT_COLOR}
        disabled={primaryDisabled}
        onPress={onPrimaryPress}
        style={styles.primary}
        textStyle={styles.primaryText}
      >
        {primaryLabel}
      </LemuelButton>
      {secondaryLabel && onSecondaryPress ? (
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.6}
          onPress={onSecondaryPress}
          style={styles.secondary}
        >
          <Text style={styles.secondaryText}>{secondaryLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  primary: {
    paddingVertical: 16,
  },
  primaryText: {
    textAlign: "center",
  },
  secondary: {
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ffffff",
    borderRadius: 8,
  },
  secondaryText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
