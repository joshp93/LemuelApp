import { Pressable, StyleSheet, Text, View } from "react-native";
import type { DialogOptions } from "../utils/dialog-store";

export interface LemuelDialogProps {
  /** What to draw. */
  options: DialogOptions;
  /** Called with the chosen action's id. */
  onChoose: (actionId: string) => void;
}

/**
 * The app's own dialog, drawn on black to match the header.
 *
 * Android's system dialog is grey and cannot be restyled, which is why the app
 * draws its own; the actions sit in a column so that a dialog offering three of
 * them still fits.
 */
export function LemuelDialog({ options, onChoose }: LemuelDialogProps) {
  return (
    <View style={styles.card} testID="lemuel-dialog">
      <Text style={styles.title}>{options.title}</Text>
      {options.message ? (
        <Text style={styles.message}>{options.message}</Text>
      ) : null}

      <View style={styles.actions}>
        {options.actions.map((action, index) => (
          <Pressable
            key={action.id}
            testID={`dialog-action-${action.id}`}
            onPress={() => onChoose(action.id)}
            style={({ pressed }) => [
              styles.action,
              index > 0 && styles.actionDivider,
              pressed && styles.actionPressed,
            ]}
          >
            <Text
              style={[
                styles.actionLabel,
                ACTION_STYLES[action.style ?? "default"],
              ]}
            >
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/** How each kind of action is coloured. */
const ACTION_STYLES = StyleSheet.create({
  default: { color: "#fff" },
  cancel: { color: "rgba(255,255,255,0.6)" },
  destructive: { color: "#dc3545" },
});

const styles = StyleSheet.create({
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#000",
    borderRadius: 20,
    overflow: "hidden",
    paddingTop: 24,
    paddingHorizontal: 24,
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Nunito_400Regular",
    textAlign: "center",
  },
  message: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 15,
    lineHeight: 21,
    fontFamily: "Nunito_400Regular",
    textAlign: "center",
    marginTop: 8,
  },
  actions: {
    marginTop: 20,
    marginHorizontal: -24,
  },
  action: {
    paddingVertical: 16,
    alignItems: "center",
  },
  actionDivider: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.15)",
  },
  actionPressed: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Nunito_400Regular",
  },
});
