import { View, StyleSheet, ViewProps } from "react-native";
import { Text } from "./themed-text";
import { Proverb } from "../models/proverb";

export interface ProverbCardProps extends ViewProps {
  proverb: Proverb;
  compact?: boolean;
}

export function ProverbCard({ proverb, compact = false, style, ...props }: ProverbCardProps) {
  return (
    <View style={[compact ? styles.compact : styles.container, style]} {...props}>
      <Text
        style={compact ? styles.compactText : styles.proverbText}
      >
        {proverb.proverb}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  compact: {
    padding: 8,
  },
  proverbText: {
    fontSize: 40,
    fontStyle: "italic",
  },
  compactText: {
    fontSize: 18,
    fontStyle: "italic",
  },
});