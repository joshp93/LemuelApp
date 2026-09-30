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
import { getPowerStateAsync } from "expo-battery";
import { getCornerRadius } from "expo-device-corner-radius";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  type LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import { recordMeditationCompletion } from "../api/meditation";
import { remoteLog } from "../api/remote-logger";
import { useAuth } from "../auth/auth-context";
import { LemuelButton } from "../components/lemuel-button";
import { Text } from "../components/themed-text";
import {
  ACCENT_COLOR,
  DEFAULT_CORNER_RADIUS,
  FONT_SIZES,
  glowLayers,
  INSET,
  TIER_GLOW_STEP,
} from "../constants/meditation";
import { useDeviceTier } from "../hooks/useDeviceTier";
import { useFitFontSize } from "../hooks/useFitFontSize";
import { useProverbForTheDay } from "../hooks/useProverbForTheDay";
import type { Proverb } from "../models/proverb";
import { getMeditationDuration } from "../settings/meditation-preferences";
import { makeSkSL, TIER_SHADER } from "../utils/meditation-shader";

export default function MeditationScreen() {
  const [isComplete, setIsComplete] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [deviceCornerRadius, setDeviceCornerRadius] = useState(0);
  const [durationMs, setDurationMs] = useState(60000);
  const { ref: canvasRef } = useCanvasSize();
  const {
    proverb: paramProverb,
    ref: paramRef,
    date: paramDate,
  } = useLocalSearchParams<{
    proverb?: string;
    ref?: string;
    date?: string;
  }>();
  const hasParamProverb =
    typeof paramProverb === "string" && typeof paramRef === "string";
  const paramProverbData: Proverb | null = hasParamProverb
    ? { proverb: paramProverb, ref: paramRef }
    : null;

  const effectiveDate = paramDate ?? new Date().toISOString().split("T")[0];

  const hookResult = useProverbForTheDay(paramDate);
  const proverbData = paramProverbData ?? hookResult.proverb;
  const loading = hasParamProverb ? false : hookResult.loading;

  const { user } = useAuth();
  const router = useRouter();
  const { height: windowHeight } = useWindowDimensions();
  const screenHeight = Dimensions.get("screen").height;
  const hasVisibleNavBar = screenHeight - windowHeight > 30;
  const progress = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const animationStarted = useRef(false);

  const tier = useDeviceTier();

  const resolution = useSharedValue([0, 0]);
  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setCanvasSize({ width, height });
    resolution.value = [width, height];
    setDeviceCornerRadius(getCornerRadius());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cornerRadius =
    deviceCornerRadius > 0 ? deviceCornerRadius : DEFAULT_CORNER_RADIUS;

  const sksl = useMemo(
    () =>
      makeSkSL(
        TIER_SHADER[tier].kIterations,
        TIER_SHADER[tier].kVolsteps,
        TIER_SHADER[tier].kStepsize,
        TIER_SHADER[tier].kBrightness,
        TIER_SHADER[tier].kFormuparam,
        TIER_SHADER[tier].kShellFloor,
        TIER_SHADER[tier].kTile,
        TIER_SHADER[tier].kDarkmatter,
      ),
    [tier],
  );
  const effect = useMemo(() => Skia.RuntimeEffect.Make(sksl), [sksl]);
  const sampledGlowLayers = useMemo(() => {
    const step = TIER_GLOW_STEP[tier];
    return glowLayers.filter((_, i) => i % step === 0);
  }, [tier]);

  useEffect(() => {
    const cfg = TIER_SHADER[tier];
    remoteLog("debug", "[MeditationScreen] Shader configured", {
      tier,
      kIterations: cfg.kIterations,
      kVolsteps: cfg.kVolsteps,
      kStepsize: cfg.kStepsize,
      kBrightness: cfg.kBrightness,
      kFormuparam: cfg.kFormuparam,
      kShellFloor: cfg.kShellFloor,
      kTile: cfg.kTile,
      kDarkmatter: cfg.kDarkmatter,
      glowLayers: sampledGlowLayers.length,
    });
  }, [tier, sampledGlowLayers]);

  useEffect(() => {
    remoteLog("debug", "[MeditationScreen] Corner radius", {
      deviceCornerRadius,
      resolvedCornerRadius: cornerRadius,
      defaultCornerRadius: DEFAULT_CORNER_RADIUS,
      usedFallback: deviceCornerRadius <= 0,
    });
  }, [deviceCornerRadius, cornerRadius]);

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
    if (!animationStarted.current && !loading && proverbData) {
      animationStarted.current = true;
      const userId = user?.userId ?? "";

      getPowerStateAsync().then(({ lowPowerMode }) => {
        if (!lowPowerMode) {
          activateKeepAwakeAsync("meditation");
        }
      });

      progress.value = withTiming(1, { duration: durationMs }, (finished) => {
        if (finished) {
          scheduleOnRN(setIsComplete, true);
          scheduleOnRN(recordMeditationCompletion, userId, effectiveDate);
        }
      });
      textOpacity.value = withTiming(1, { duration: 1000 });
    }
  }, [loading, proverbData, durationMs]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isComplete) {
      deactivateKeepAwake("meditation");
    }
  }, [isComplete]);

  useEffect(() => {
    return () => {
      deactivateKeepAwake("meditation");
    };
  }, []);

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const textBoxHeight = canvasSize.height - (INSET + cornerRadius + 8) - 100;
  const { fontSize, onTextLayout } = useFitFontSize(
    proverbData?.proverb,
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

    const R = cornerRadius;
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
  }, [canvasSize, cornerRadius]);

  const innerContent = (
    <>
      <Stack.Screen
        options={{
          contentStyle: { backgroundColor: "#000" },
          headerShown: false,
          statusBarHidden: true,
        }}
      />
      <Canvas style={StyleSheet.absoluteFill} ref={canvasRef}>
        {effect && uniforms && (
          <Fill>
            <Shader source={effect} uniforms={uniforms} />
          </Fill>
        )}
        {outlinePath &&
          segments.map((seg, si) =>
            sampledGlowLayers.map(({ w, a }, li) => (
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
        {proverbData && !loading && (
          <Animated.View
            style={[
              styles.textContainer,
              {
                paddingHorizontal: INSET + cornerRadius,
                paddingTop: INSET + cornerRadius + 8,
              },
              textAnimatedStyle,
            ]}
          >
            <ScrollView>
              <Text
                style={[styles.proverbText, { fontSize, lineHeight: fontSize }]}
                onTextLayout={onTextLayout}
              >
                {proverbData.proverb}
              </Text>
            </ScrollView>
          </Animated.View>
        )}

        {isComplete && (
          <LemuelButton
            style={styles.captureButton}
            onPress={() => {
              router.replace({
                pathname: "/notes/users/[uuid]/[ref]",
                params: {
                  uuid: user?.userId ?? "{{uuid}}",
                  ref: proverbData!.ref,
                  date: effectiveDate,
                },
              });
            }}
          >
            Capture your thoughts...
          </LemuelButton>
        )}
      </View>
    </>
  );

  if (hasVisibleNavBar) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
        <View style={{ flex: 1 }} onLayout={handleLayout}>
          {innerContent}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.absoluteFill} onLayout={handleLayout}>
      {innerContent}
    </View>
  );
}

const styles = StyleSheet.create({
  absoluteFill: {
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
