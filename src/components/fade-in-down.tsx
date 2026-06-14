import { type ReactNode, useEffect } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface FadeInDownProps {
  children: ReactNode;
}

export function FadeInDown({ children }: FadeInDownProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-30);

  useEffect(() => {
    opacity.value = 0;
    translateY.value = -30;
    opacity.value = withTiming(1, { duration: 500 });
    translateY.value = withTiming(0, { duration: 500 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}
