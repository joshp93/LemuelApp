import { useRouter } from "expo-router";
import { StyleSheet } from "react-native";
import { useAuth } from "../auth/auth-context";
import { ACCENT_COLOR, INSET } from "../constants/meditation";
import { LemuelButton } from "./lemuel-button";

interface MeditationCaptureButtonProps {
  /** Reference of the proverb the meditation was for, e.g. `Proverbs 3:5`. */
  proverbRef: string;
  /** Local date the note is filed under, in `YYYY-MM-DD`. */
  date: string;
}

/**
 * Opens the note editor for a finished meditation.
 *
 * Shown once the timer completes so the user can write down what they read.
 * Used by both the native and web meditation screens.
 *
 * @returns The capture button.
 */
export function MeditationCaptureButton({
  proverbRef,
  date,
}: MeditationCaptureButtonProps) {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <LemuelButton
      style={styles.captureButton}
      onPress={() => {
        router.replace({
          pathname: "/notes/users/[uuid]/[ref]",
          params: {
            uuid: user?.userId ?? "{{uuid}}",
            ref: proverbRef,
            date,
          },
        });
      }}
    >
      Capture your thoughts...
    </LemuelButton>
  );
}

const styles = StyleSheet.create({
  captureButton: {
    marginHorizontal: INSET,
    marginBottom: 36,
    backgroundColor: ACCENT_COLOR,
    padding: 15,
  },
});
