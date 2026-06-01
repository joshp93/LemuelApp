import { Canvas, Path, Skia, useCanvasRef } from "@shopify/react-native-skia";
import { Stack } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { Text } from "../src/components/themed-text";
import { useProverbForTheDay } from "../src/hooks/useProverbForTheDay";

const DURATION_MS = 60000;
const INSET = 20;
const CORNER_RADIUS = 30;
const STROKE_WIDTH = 8;
const ACCENT_COLOR = "rgb(25, 51, 179)";

const glowLayers = [
  { w: 80,  a: 0.015 },
  { w: 72,  a: 0.018 },
  { w: 65,  a: 0.021 },
  { w: 59,  a: 0.026 },
  { w: 54,  a: 0.031 },
  { w: 48,  a: 0.037 },
  { w: 44,  a: 0.044 },
  { w: 40,  a: 0.052 },
  { w: 36,  a: 0.062 },
  { w: 32,  a: 0.074 },
  { w: 29,  a: 0.089 },
  { w: 27,  a: 0.106 },
  { w: 24,  a: 0.127 },
  { w: 22,  a: 0.152 },
  { w: 20,  a: 0.181 },
  { w: 18,  a: 0.217 },
  { w: 16,  a: 0.259 },
  { w: 15,  a: 0.309 },
  { w: 13,  a: 0.37 },
  { w: 12,  a: 0.442 },
  { w: 11,  a: 0.528 },
  { w: 10,  a: 0.63 },
  { w: 9,  a: 0.753 },
  { w: STROKE_WIDTH, a: 0.9 },
];

export default function MeditationScreen() {
  const [isComplete, setIsComplete] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const ref = useCanvasRef();
  const { proverb, loading } = useProverbForTheDay();
  const progress = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const animationStarted = useRef(false);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setCanvasSize({ width, height });
  }, []);

  useEffect(() => {
    if (!animationStarted.current && !loading && proverb) {
      animationStarted.current = true;
      progress.value = withTiming(1, { duration: DURATION_MS }, (finished) => {
        if (finished) scheduleOnRN(setIsComplete, true);
      });
      textOpacity.value = withTiming(1, { duration: 1000 });
    }
  }, [loading, proverb]); // eslint-disable-line react-hooks/exhaustive-deps

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const segments = [
    { start: useDerivedValue(() => 0.25), end: useDerivedValue(() => 0.25 + progress.value * 0.25) },
    { start: useDerivedValue(() => 0.25 - progress.value * 0.25), end: useDerivedValue(() => 0.25) },
    { start: useDerivedValue(() => 0.75 - progress.value * 0.25), end: useDerivedValue(() => 0.75) },
    { start: useDerivedValue(() => 0.75), end: useDerivedValue(() => 0.75 + progress.value * 0.25) },
  ];

  const outlinePath = useMemo(() => {
    const { width: W, height: H } = canvasSize;
    if (W === 0 || H === 0) return null;

    const R = CORNER_RADIUS;
    const cx = W / 2;

    const d = [
      `M ${cx} 0`,
      `L ${W - R} 0`,
      `A ${R} ${R} 0 0 1 ${W} ${R}`,
      `L ${W} ${H - R}`,
      `A ${R} ${R} 0 0 1 ${W - R} ${H}`,
      `L ${R} ${H}`,
      `A ${R} ${R} 0 0 1 0 ${H - R}`,
      `L 0 ${R}`,
      `A ${R} ${R} 0 0 1 ${R} 0`,
      `L ${cx} 0`,
      "Z",
    ].join(" ");

    return Skia.Path.MakeFromSVGString(d);
  }, [canvasSize]);

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <Stack.Screen
        options={{
          headerShown: false,
          statusBarHidden: true,
        }}
      />
      <Canvas style={StyleSheet.absoluteFill} ref={ref}>
        {outlinePath && segments.map((seg, si) =>
          glowLayers.map(({ w, a }, li) => (
            <Path
              key={`${si}-${li}`}
              path={outlinePath}
              style="stroke"
              strokeWidth={w}
              color={`rgba(25,51,179,${a})`}
              start={seg.start}
              end={seg.end}
              strokeCap="round"
              strokeJoin="round"
            />
          ))
        )}
      </Canvas>

      {proverb && !loading && (
        <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
          <Text style={styles.proverbText}>{proverb.proverb}</Text>
        </Animated.View>
      )}

      {isComplete && (
        <Pressable style={styles.captureButton} onPress={() => {}}>
          <Text style={styles.captureButtonText}>Capture your thoughts...</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  textContainer: {
    position: "absolute",
    top: INSET + CORNER_RADIUS + 8,
    left: 0,
    right: 0,
    paddingHorizontal: INSET + CORNER_RADIUS,
  },
  proverbText: {
    color: "#b8c8ff",
    fontSize: 24,
    lineHeight: 34,
    textAlign: "left",
  },
  captureButton: {
    position: "absolute",
    bottom: 36,
    left: INSET,
    right: INSET,
    backgroundColor: ACCENT_COLOR,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  captureButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Nunito_400Regular",
  },
});
