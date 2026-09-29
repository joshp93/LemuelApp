import type { ConfirmOptions } from "./confirm";
import { showDialog } from "./dialog.web";

/**
 * Shows a confirmation dialog and resolves `true` when the user accepts,
 * `false` when they dismiss.
 *
 * Web implementation using `window.confirm`, which cannot style a
 * destructive button. Resolves `false` during SSR where `window` is
 * unavailable.
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
