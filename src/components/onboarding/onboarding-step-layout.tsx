import type { ReactNode } from "react";
import {
  ScrollView,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { OnboardingReveal } from "./onboarding-reveal";

interface OnboardingStepLayoutProps {
  children: ReactNode;
  actions: ReactNode;
  /** Whether to apply the shared fade-and-lift entrance. */
  reveal?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Full-screen black shell for an onboarding step.
 *
 * The content scrolls while the action stack stays anchored above the device's
 * bottom inset.
 *
 * @param props - The step content, bottom actions and optional entrance style.
 * @returns The laid-out step.
 */
export function OnboardingStepLayout({
  children,
  actions,
  reveal = false,
  contentStyle,
}: OnboardingStepLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 24,
          },
          contentStyle,
        ]}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        {reveal ? <OnboardingReveal>{children}</OnboardingReveal> : children}
      </ScrollView>
      <View style={[styles.actions, { paddingBottom: insets.bottom + 16 }]}>
        {actions}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  actions: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
});
