import { Text as RNText, StyleSheet, TextProps } from "react-native";

export function Text(props: TextProps) {
  const { style, ...otherProps } = props;

  // Check if the style prop includes fontStyle: 'italic'
  const styleArray = Array.isArray(style) ? style : [style];
  const hasItalic = styleArray.some(
    (s) =>
      s && typeof s === "object" && "fontStyle" in s && s.fontStyle === "italic"
  );

  return (
    <RNText
      {...otherProps}
      style={[styles.defaultText, hasItalic && styles.italicText, style]}
    />
  );
}

const styles = StyleSheet.create({
  defaultText: {
    fontFamily: "Nunito_400Regular",
  },
  italicText: {
    fontFamily: "Nunito_400Regular_Italic",
  },
});
