import { useNavigation } from "expo-router";
import { useEffect, useRef } from "react";
import { Alert } from "react-native";

export function useUnsavedChanges(
  isDirty: boolean,
  onSave?: () => Promise<void>,
) {
  const navigation = useNavigation();
  const saveRef = useRef(onSave);
  saveRef.current = onSave;

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e: any) => {
      if (!isDirty) return;

      e.preventDefault();
      Alert.alert("Unsaved Changes", "You have unsaved changes.", [
        {
          text: "Save",
          onPress: async () => {
            await saveRef.current?.();
            navigation.dispatch(e.data.action);
          },
        },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => navigation.dispatch(e.data.action),
        },
        { text: "Cancel", style: "cancel" },
      ]);
    });
    return unsubscribe;
  }, [isDirty, navigation]);
}
