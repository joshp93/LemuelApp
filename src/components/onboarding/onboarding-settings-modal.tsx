import { Modal, StyleSheet, View } from "react-native";
import SettingsScreen from "../../screens/settings";

interface OnboardingSettingsModalProps {
  onClose: () => void;
  onDone: () => void;
}

/**
 * Full-screen Settings presentation used by onboarding.
 *
 * The native navigation header stays out of the way; Settings provides its own
 * fixed Done action while in onboarding mode.
 *
 * @param props - The dismiss and completion handlers.
 * @returns The full-screen settings modal.
 */
export function OnboardingSettingsModal({
  onClose,
  onDone,
}: OnboardingSettingsModalProps) {
  return (
    <Modal
      animationType="slide"
      navigationBarTranslucent
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      statusBarTranslucent
      visible
    >
      <View style={styles.root}>
        <SettingsScreen onboarding onDone={onDone} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F0F8FF",
  },
});
