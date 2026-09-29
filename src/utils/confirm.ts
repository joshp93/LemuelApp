import { showDialog } from "./dialog";

/** Options for {@link confirm}. */
export interface ConfirmOptions {
  /** Dialog title. */
  title: string;
  /** Optional explanatory message shown below the title. */
  message?: string;
  /** Label for the accept button. Defaults to "OK". */
  confirmLabel?: string;
  /** Label for the dismiss button. Defaults to "Cancel". */
  cancelLabel?: string;
  /** Style the accept button as destructive. Defaults to false. */
  destructive?: boolean;
}

/**
 * Shows a confirmation dialog and resolves `true` when the user accepts,
 * `false` when they dismiss.
 *
 * Native implementation using `Alert.alert`. See `confirm.web.ts` for the
 * web behaviour.
 *
 * @param options - Dialog content and button labels.
 */
export const confirm = async ({
  title,
  message,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  destructive = false,
}: ConfirmOptions): Promise<boolean> => {
  const chosen = await showDialog({
    title,
    message,
    actions: [
      { id: "cancel", label: cancelLabel, style: "cancel" },
      {
        id: "confirm",
        label: confirmLabel,
        style: destructive ? "destructive" : "default",
      },
    ],
  });

  return chosen === "confirm";
};
