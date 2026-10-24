import type { ReactNode } from "react";
import { useEffect } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface OnboardingSlideInProps {
  children: ReactNode;
}

/**
 * Slides its content in from the right edge of the screen.
 *
 * @param props - The screen content.
 * @returns The animated wrapper.
 */
export function OnboardingSlideIn({ children }: OnboardingSlideInProps) {
  const { width } = useWindowDimensions();
  const translateX = useSharedValue(width);

  useEffect(() => {
    translateX.value = withTiming(0, { duration: 350 });
  }, [translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[styles.root, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
});
