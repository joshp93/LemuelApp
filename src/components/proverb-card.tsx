import {
  StyleSheet,
  TextLayoutEvent,
  View,
  ViewProps,
} from "react-native";
import { Proverb } from "../../src/models/proverb";
import { Text } from "./themed-text";

export interface ProverbCardProps extends ViewProps {
  proverb: Proverb;
  /**
   * Font size in px for the proverb text.
   * @default 40
   */
  fontSize?: number;
  /** Called with text layout data for font-fitting. */
  onTextLayout?: (e: TextLayoutEvent) => void;
}

/**
 * Displays a single proverb with optional citation.
 *
 * When `fontSize` is provided the proverb text renders at that size with a
 * proportional line-height. The citation always renders at 12px regardless.
 */
export function ProverbCard({
  proverb,
  fontSize = 40,
  onTextLayout,
  style,
  ...props
}: ProverbCardProps) {
  return (
    <View style={[styles.container, style]} {...props}>
      <Text
        style={[styles.proverbText, { fontSize, lineHeight: fontSize }]}
        onTextLayout={onTextLayout}
      >
        {proverb.proverb}
      </Text>
      {proverb.citation && (
        <Text style={styles.citationText}>{proverb.citation}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  proverbText: {
    fontStyle: "normal",
  },
  citationText: {
    marginTop: 8,
    fontSize: 12,
    color: "#666",
    textAlign: "left",
  },
});