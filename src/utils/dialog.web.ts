import type { DialogOptions } from "./dialog";

/**
 * Builds the text shown by a browser dialog from its title and message.
 *
 * @param title - Dialog title.
 * @param message - Optional explanatory message.
 * @returns The title and message separated by a blank line.
 */
const toText = (title: string, message?: string): string =>
  message ? `${title}\n\n${message}` : title;

/**
 * Shows a modal dialog and resolves with the chosen action's id.
 *
 * Browsers only expose single-button `alert` and two-button `confirm`
 * dialogs, so a dialog offering more than two choices is presented as a
 * sequence of confirmations. The action styled `"cancel"` is the outcome
 * when every confirmation is declined. Resolves `null` during SSR, where
 * `window` is unavailable.
 *
 * @param options - Dialog content and choices.
 * @returns The chosen action's id, or `null` when dismissed without a choice.
 */
export const showDialog = ({
  title,
  message,
  actions,
}: DialogOptions): Promise<string | null> => {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }

  const text = toText(title, message);

  if (actions.length === 1) {
    window.alert(text);
    return Promise.resolve(actions[0].id);
  }

  const cancel = actions.find((action) => action.style === "cancel");

  if (actions.length === 2) {
    const affirmative = actions.find((action) => action.style !== "cancel");
    return Promise.resolve(
      window.confirm(text)
        ? (affirmative?.id ?? actions[1].id)
        : (cancel?.id ?? actions[0].id),
    );
  }

  for (const choice of actions) {
    if (choice.style === "cancel") continue;
    if (window.confirm(`${text}\n\n${choice.label}?`)) {
      return Promise.resolve(choice.id);
    }
  }
  return Promise.resolve(cancel?.id ?? null);
};

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
