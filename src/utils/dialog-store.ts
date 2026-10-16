/** A single choice offered by a dialog. */
export interface DialogAction {
  /** Identifier resolved when this action is chosen. */
  id: string;
  /** Text shown on the button. */
  label: string;
  /** How the action is drawn. `"cancel"` marks the dismissal action. */
  style?: "default" | "cancel" | "destructive";
}

/** Content and choices for a dialog. */
export interface DialogOptions {
  /** Dialog title. */
  title: string;
  /** Optional explanatory message shown below the title. */
  message?: string;
  /** Choices to offer, in display order. */
  actions: DialogAction[];
}

/** A dialog that is on screen, waiting to be answered. */
export interface PendingDialog {
  /** What to draw. */
  options: DialogOptions;
  /** Called with the chosen action's id, or null when dismissed. */
  resolve: (actionId: string | null) => void;
}

type DialogListener = (dialog: PendingDialog | null) => void;

let pending: PendingDialog | null = null;
const listeners = new Set<DialogListener>();

/** Tells every listener which dialog is on screen now. */
function publish(dialog: PendingDialog | null): void {
  pending = dialog;
  for (const listener of listeners) {
    listener(dialog);
  }
}

/**
 * Puts a dialog on screen and resolves with the answer to it.
 *
 * A dialog cannot be drawn from a plain function, so the request is handed to
 * whichever {@linkcode subscribeToDialogs} listener is mounted and the promise
 * settles when it is answered. Asking for a second dialog while one is waiting
 * dismisses the first, which is what `Alert.alert` did.
 *
 * @param options - Dialog content and choices.
 * @returns The chosen action's id, or `null` when dismissed without a choice.
 */
export function requestDialog(options: DialogOptions): Promise<string | null> {
  return new Promise((resolve) => {
    pending?.resolve(null);
    publish({ options, resolve });
  });
}

/**
 * Starts listening for dialogs to draw.
 *
 * The listener is called immediately with whatever is on screen, so a host that
 * mounts mid-request still draws it.
 *
 * @param listener - Called with the dialog to draw, or null when there is none.
 * @returns A function that stops the listening.
 */
export function subscribeToDialogs(listener: DialogListener): () => void {
  listeners.add(listener);
  listener(pending);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Closes the dialog on screen with an answer.
 *
 * Does nothing when no dialog is waiting, so a stray dismissal cannot resolve
 * somebody else's request.
 *
 * @param actionId - The chosen action's id, or null when dismissed.
 */
export function answerDialog(actionId: string | null): void {
  const dialog = pending;
  if (!dialog) return;

  publish(null);
  dialog.resolve(actionId);
}
