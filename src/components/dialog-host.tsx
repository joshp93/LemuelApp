import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet } from "react-native";
import {
  answerDialog,
  type PendingDialog,
  subscribeToDialogs,
} from "../utils/dialog-store";
import { LemuelDialog } from "./lemuel-dialog";

/**
 * Draws whatever dialog is waiting to be answered.
 *
 * Mounted once, near the root, so a dialog can be raised from anywhere —
 * including from code that is not a component and cannot draw one itself.
 * Renders nothing when there is no dialog, and on web, where the dialogs are
 * the browser's own.
 */
export function DialogHost() {
  const [dialog, setDialog] = useState<PendingDialog | null>(null);

  useEffect(() => subscribeToDialogs(setDialog), []);

  if (!dialog) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      onRequestClose={() => answerDialog(null)}
    >
      <Pressable
        style={styles.overlay}
        onPress={() => answerDialog(null)}
        testID="dialog-overlay"
      >
        {/* Swallows taps so pressing the card does not dismiss it. */}
        <Pressable style={styles.card} onPress={() => {}}>
          <LemuelDialog options={dialog.options} onChoose={answerDialog} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
  },
});

export default DialogHost;
