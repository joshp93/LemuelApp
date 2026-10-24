import type { ReactNode } from "react";
import { useEffect } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

interface OnboardingRevealProps {
  children: ReactNode;
  /** Delay before the reveal starts, in milliseconds. */
  delay?: number;
  /** Reveal duration, in milliseconds. */
  duration?: number;
  /** Starting vertical offset, in pixels. */
  offset?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Fades and lifts its content into place.
 *
 * @param props - The content, timing and starting offset.
 * @returns The animated wrapper.
 */
export function OnboardingReveal({
  children,
  delay = 500,
  duration = 300,
  offset = 16,
  style,
}: OnboardingRevealProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(delay, withTiming(1, { duration }));
  }, [delay, duration, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: offset * (1 - progress.value) }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
  );
}
