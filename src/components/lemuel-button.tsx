import {
  StyleSheet,
  Text,
  type TextStyle,
  TouchableOpacity,
  type TouchableOpacityProps,
} from "react-native";

type LemuelButtonProps = TouchableOpacityProps & {
  color?: string;
  size?: "sm" | "md";
  children: React.ReactNode;
  textStyle?: TextStyle;
  props?: TouchableOpacityProps;
};

export function LemuelButton({
  onPress,
  disabled,
  color = "black",
  size = "md",
  children,
  textStyle,
  style,
  ...props
}: LemuelButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        size === "md" ? styles.md : styles.sm,
        { backgroundColor: color },
        disabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      <Text style={[styles.text, textStyle]}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  md: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  sm: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
