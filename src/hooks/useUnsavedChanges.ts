import { useNavigation } from "expo-router";
import { useEffect, useRef } from "react";
import { showDialog } from "../utils/dialog";

/**
 * Prompts before leaving a screen with unsaved changes.
 *
 * Offers to save, discard or stay. Nothing is lost if the prompt cannot be
 * shown — the screen is only left once a choice is made.
 *
 * @param isDirty - Whether there are unsaved changes to guard.
 * @param onSave - Persists the changes when the user chooses to save.
 */
export function useUnsavedChanges(
  isDirty: boolean,
  onSave?: () => Promise<void>,
) {
  const navigation = useNavigation();
  const saveRef = useRef(onSave);
  saveRef.current = onSave;

  useEffect(() => {
    const unsubscribe = navigation.addListener(
      "beforeRemove",
      async (e: any) => {
        if (!isDirty) return;

        e.preventDefault();

        const choice = await showDialog({
          title: "Unsaved Changes",
          message: "You have unsaved changes.",
          actions: [
            { id: "save", label: "Save" },
            { id: "discard", label: "Discard", style: "destructive" },
            { id: "cancel", label: "Cancel", style: "cancel" },
          ],
        });

        if (choice === "save") {
          await saveRef.current?.();
          navigation.dispatch(e.data.action);
        } else if (choice === "discard") {
          navigation.dispatch(e.data.action);
        }
      },
    );
    return unsubscribe;
  }, [isDirty, navigation]);
}
