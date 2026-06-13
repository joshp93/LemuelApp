import {
  Canvas,
  Fill,
  Path,
  Shader,
  Skia,
  type Uniforms,
  useCanvasSize,
  useClock,
} from "@shopify/react-native-skia";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { recordMeditationCompletion } from "../src/api/meditation";
import { useAuth } from "../src/auth/auth-context";
import { LemuelButton } from "../src/components/lemuel-button";
import { Text } from "../src/components/themed-text";
import { useFitFontSize } from "../src/hooks/useFitFontSize";
import { useProverbForTheDay } from "../src/hooks/useProverbForTheDay";
import { getMeditationDuration } from "../src/settings/meditation-preferences";

const INSET = 20;
const CORNER_RADIUS = 30;
const STROKE_WIDTH = 8;
const ACCENT_COLOR = "rgb(25, 51, 179)";
const FONT_SIZES = [40, 28, 18];

const glowLayers = [
  { w: 80, a: 0.015 },
  { w: 72, a: 0.018 },
  { w: 65, a: 0.021 },
  { w: 59, a: 0.026 },
  { w: 54, a: 0.031 },
  { w: 48, a: 0.037 },
  { w: 44, a: 0.044 },
  { w: 40, a: 0.052 },
  { w: 36, a: 0.062 },
  { w: 32, a: 0.074 },
  { w: 29, a: 0.089 },
  { w: 27, a: 0.106 },
  { w: 24, a: 0.127 },
  { w: 22, a: 0.152 },
  { w: 20, a: 0.181 },
  { w: 18, a: 0.217 },
  { w: 16, a: 0.259 },
  { w: 15, a: 0.309 },
  { w: 13, a: 0.37 },
  { w: 12, a: 0.442 },
  { w: 11, a: 0.528 },
  { w: 10, a: 0.63 },
  { w: 9, a: 0.753 },
  { w: STROKE_WIDTH, a: 0.9 },
];

const sksl = `uniform float2 u_resolution;
uniform float u_time;

const float kIterations = 12.0;
const float kFormuparam = 0.53;
const float kVolsteps = 10.0;
const float kStepsize = 0.1;
const float kZoom = 0.800;
const float kTile = 0.850;
const float kSpeed = 0.010;
const float kBrightness = 0.0015;
const float kDarkmatter = 0.450;
const float kDistfading = 0.730;
const float kSaturation = 0.850;

half4 main(vec2 xy) {
    vec2 uv = xy / u_resolution - 0.5;
    uv.y *= u_resolution.y / u_resolution.x;
    vec3 dir = vec3(uv * kZoom, 1.0);
    float time = u_time * kSpeed + 0.25;

    float a1 = 0.5;
    float a2 = 0.8;
    mat2 rot1 = mat2(cos(a1), sin(a1), -sin(a1), cos(a1));
    mat2 rot2 = mat2(cos(a2), sin(a2), -sin(a2), cos(a2));
    dir.xz *= rot1;
    dir.xy *= rot2;
    vec3 from = vec3(1.0, 0.5, 0.5);
    from += vec3(time * 2.0, time, -2.0);
    from.xz *= rot1;
    from.xy *= rot2;

    float s = 0.1;
    float fade = 1.0;
    vec3 v = vec3(0.0);
    for (float r = 0.0; r < kVolsteps; r++) {
        vec3 p = from + s * dir * 0.5;
        p = abs(vec3(kTile) - mod(p, vec3(kTile * 2.0)));
        float pa = 0.0;
        float a = 0.0;
        for (float i = 0.0; i < kIterations; i++) {
            p = abs(p) / dot(p, p) - kFormuparam;
            a += abs(length(p) - pa);
            pa = length(p);
        }
        float dm = max(0.0, kDarkmatter - a * a * 0.001);
        a *= a * a;
        if (r > 6.0) fade *= 1.0 - dm;
        v += fade;
        v += vec3(s, s * s, s * s * s * s) * a * kBrightness * fade;
        fade *= kDistfading;
        s += kStepsize;
    }
    v = mix(vec3(length(v)), v, kSaturation);
    return half4(v * 0.01, 1.0);
}`;

export default function MeditationScreen() {
  const [isComplete, setIsComplete] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [durationMs, setDurationMs] = useState(60000);
  const { ref } = useCanvasSize();
  const { proverb, loading } = useProverbForTheDay();
  const { user } = useAuth();
  const router = useRouter();
  const progress = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const animationStarted = useRef(false);

  const resolution = useSharedValue([0, 0]);
  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setCanvasSize({ width, height });
    resolution.value = [width, height];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const effect = useMemo(() => Skia.RuntimeEffect.Make(sksl), []);
  const clock = useClock();
  const uniforms = useDerivedValue<Uniforms>(() => ({
    u_time: clock.value / 1000,
    u_resolution: resolution.value,
  }));

  useEffect(() => {
    (async () => {
      const dur = await getMeditationDuration();
      setDurationMs(dur);
    })();
  }, []);

  useEffect(() => {
    if (!animationStarted.current && !loading && proverb) {
      animationStarted.current = true;
      const today = new Date().toISOString().split("T")[0];
      const userId = user?.userId ?? "";
      progress.value = withTiming(1, { duration: durationMs }, (finished) => {
        if (finished) {
          scheduleOnRN(setIsComplete, true);
          scheduleOnRN(recordMeditationCompletion, userId, today);
        }
      });
      textOpacity.value = withTiming(1, { duration: 1000 });
    }
  }, [loading, proverb, durationMs]); // eslint-disable-line react-hooks/exhaustive-deps

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const textBoxHeight = canvasSize.height - (INSET + CORNER_RADIUS + 8) - 100;
  const { fontSize, onTextLayout } = useFitFontSize(
    proverb?.proverb,
    textBoxHeight,
    FONT_SIZES,
  );

  const segments = [
    {
      start: useDerivedValue(() => 0.25),
      end: useDerivedValue(() => 0.25 + progress.value * 0.25),
    },
    {
      start: useDerivedValue(() => 0.25 - progress.value * 0.25),
      end: useDerivedValue(() => 0.25),
    },
    {
      start: useDerivedValue(() => 0.75 - progress.value * 0.25),
      end: useDerivedValue(() => 0.75),
    },
    {
      start: useDerivedValue(() => 0.75),
      end: useDerivedValue(() => 0.75 + progress.value * 0.25),
    },
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
          contentStyle: { backgroundColor: "#000" },
          headerShown: false,
          statusBarHidden: true,
        }}
      />
      <Canvas style={StyleSheet.absoluteFill} ref={ref}>
        {effect && uniforms && (
          <Fill>
            <Shader source={effect} uniforms={uniforms} />
          </Fill>
        )}
        {outlinePath &&
          segments.map((seg, si) =>
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
            )),
          )}
      </Canvas>

      <View style={styles.overlay}>
        {proverb && !loading && (
          <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
            <ScrollView>
              <Text
                style={[styles.proverbText, { fontSize, lineHeight: fontSize }]}
                onTextLayout={onTextLayout}
              >
                {proverb.proverb}
              </Text>
            </ScrollView>
          </Animated.View>
        )}

        {isComplete && (
          <LemuelButton
            style={styles.captureButton}
            onPress={() =>
              router.replace({
                pathname: "/notes/users/[uuid]/[ref]",
                params: { uuid: user?.userId ?? "", ref: proverb!.ref },
              })
            }
          >
            Capture your thoughts...
          </LemuelButton>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000",
  },
  overlay: {
    flex: 1,
  },
  textContainer: {
    flex: 1,
    paddingHorizontal: INSET + CORNER_RADIUS,
    paddingTop: INSET + CORNER_RADIUS + 8,
    paddingBottom: 100,
  },
  proverbText: {
    color: "#b8c8ff",
    textAlign: "left",
  },
  captureButton: {
    marginHorizontal: INSET,
    marginBottom: 36,
    backgroundColor: ACCENT_COLOR,
    padding: 15,
  },
});
