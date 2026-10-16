import type { DialogOptions } from "./dialog-store";
import { requestDialog } from "./dialog-store";

export type { DialogAction, DialogOptions } from "./dialog-store";

/**
 * Shows a modal dialog and resolves with the chosen action's id.
 *
 * The dialog is the app's own — see `dialog-host.tsx` for what draws it, and
 * `dialog.web.ts` for the browser's own dialogs. Asking for a second dialog
 * while one is waiting dismisses the first unanswered.
 *
 * @param options - Dialog content and choices.
 * @returns The chosen action's id, or `null` when dismissed without a choice.
 */
export const showDialog = (options: DialogOptions): Promise<string | null> =>
  requestDialog(options);

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
