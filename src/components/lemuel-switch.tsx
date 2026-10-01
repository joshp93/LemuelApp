import {
  Platform,
  type StyleProp,
  StyleSheet,
  Switch,
  type ViewStyle,
} from "react-native";

/** Track colour when the switch is off. */
const TRACK_OFF = "#d3d3d3";
/** Track and thumb colour when the switch is on. */
const TRACK_ON = "black";
/** Thumb colour when the switch is off. */
const THUMB_OFF = "#f4f3f4";
/** Track and thumb colour when the switch is disabled. */
const DISABLED_COLOR = "#9e9e9e";
/** Opacity applied to the whole switch when it is disabled. */
const DISABLED_OPACITY = 0.5;

interface LemuelSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/**
 * The app's switch control, carrying the shared on/off/disabled styling.
 *
 * `react-native-web` reads `activeThumbColor` for the on-state thumb and ignores
 * `thumbColor` there, so the on-state colour is also passed through that prop on
 * web; without it the thumb keeps the browser default and the switch never reads
 * as black.
 *
 * @param props - The switch value, its change handler, and optional disabled
 * state, test id, style and accessibility label.
 */
export function LemuelSwitch({
  value,
  onValueChange,
  disabled = false,
  testID,
  style,
  accessibilityLabel,
}: LemuelSwitchProps) {
  const trackColor = disabled
    ? { false: DISABLED_COLOR, true: DISABLED_COLOR }
    : { false: TRACK_OFF, true: TRACK_ON };
  const thumbColor = disabled ? DISABLED_COLOR : value ? TRACK_ON : THUMB_OFF;

  const webOnlyProps =
    Platform.OS === "web"
      ? { activeThumbColor: thumbColor, activeTrackColor: trackColor.true }
      : {};

  return (
    <Switch
      testID={testID}
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      trackColor={trackColor}
      thumbColor={thumbColor}
      style={[style, disabled && styles.disabled]}
      {...webOnlyProps}
    />
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: DISABLED_OPACITY,
  },
});
