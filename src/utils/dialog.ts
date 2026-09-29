import { Alert, type AlertButton } from "react-native";

/** A single choice offered by {@link showDialog}. */
export interface DialogAction {
  /** Identifier resolved when this action is chosen. */
  id: string;
  /** Text shown on the button. */
  label: string;
  /** Native button style. `"cancel"` marks the dismissal action. */
  style?: "default" | "cancel" | "destructive";
}

/** Content and choices for {@link showDialog}. */
export interface DialogOptions {
  /** Dialog title. */
  title: string;
  /** Optional explanatory message shown below the title. */
  message?: string;
  /** Choices to offer, in display order. */
  actions: DialogAction[];
}

/**
 * Shows a modal dialog and resolves with the chosen action's id.
 *
 * Native implementation using `Alert.alert`. See `dialog.web.ts` for the
 * web behaviour.
 *
 * @param options - Dialog content and choices.
 * @returns The chosen action's id, or `null` when dismissed without a choice.
 */
export const showDialog = ({
  title,
  message,
  actions,
}: DialogOptions): Promise<string | null> =>
  new Promise((resolve) => {
    const buttons: AlertButton[] = actions.map(({ id, label, style }) => ({
      text: label,
      style,
      onPress: () => resolve(id),
    }));

    Alert.alert(title, message, buttons, {
      cancelable: true,
      onDismiss: () => resolve(null),
    });
  });

/**
 * Shows a single-button dialog to report something to the user.
 *
 * @param title - Dialog title.
 * @param message - Optional explanatory message shown below the title.
 */
export const notify = async (
  title: string,
  message?: string,
): Promise<void> => {
  await showDialog({ title, message, actions: [{ id: "ok", label: "OK" }] });
};
