import { WithSkiaWeb } from "@shopify/react-native-skia/lib/module/web";
import { version } from "canvaskit-wasm/package.json";
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

const CORNER_RADIUS = DEFAULT_CORNER_RADIUS;

/**
 * Meditation screen for web.
 *
 * Uses {@linkcode WithSkiaWeb} to defer loading the Skia glow-arc canvas
 * until CanvasKit WASM has finished loading. During SSR and CanvasKit
 * initialisation a plain black background is shown. The nebula shader,
 * keep-awake and battery APIs are omitted — they either require native
 * modules or are not available on web.
 */
export default function WebMeditationScreen() {
  const [isComplete, setIsComplete] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [durationMs, setDurationMs] = useState(60000);
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
  const resolution = useSharedValue([0, 0]);
  const animationStarted = useRef(false);

  const tier = useDeviceTier();

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setCanvasSize({ width, height });
    resolution.value = [width, height];
  }, []);

  const sampledGlowLayers = useMemo(() => {
    const step = TIER_GLOW_STEP[tier];
    return glowLayers.filter((_, i) => i % step === 0);
  }, [tier]);

  useEffect(() => {
    const cfg = TIER_GLOW_STEP;
    remoteLog("debug", "[MeditationScreen] Shader configured (web)", {
      tier,
      glowLayers: sampledGlowLayers.length,
    });
  }, [tier, sampledGlowLayers]);

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

      progress.value = withTiming(1, { duration: durationMs }, (finished) => {
        if (finished) {
          setIsComplete(true);
          recordMeditationCompletion(userId, effectiveDate);
        }
      });
      textOpacity.value = withTiming(1, { duration: 1000 });
    }
  }, [loading, proverbData, durationMs]); // eslint-disable-line react-hooks/exhaustive-deps

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const textBoxHeight = canvasSize.height - (INSET + CORNER_RADIUS + 8) - 100;
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

    return d;
  }, [canvasSize]);

  const innerContent = (
    <>
      <Stack.Screen
        options={{
          contentStyle: { backgroundColor: "#000" },
          headerShown: false,
          statusBarHidden: true,
        }}
      />
      {outlinePath ? (
        <WithSkiaWeb
          opts={{
            locateFile: (file) =>
              `https://cdn.jsdelivr.net/npm/canvaskit-wasm@${version}/bin/full/${file}`,
          }}
          getComponent={() => import("../components/meditation-canvas")}
          componentProps={{
            outlinePath,
            segments,
            sampledGlowLayers,
            tier,
            resolution,
          }}
          fallback={
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: "#000" }]}
            />
          }
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "#000" }]} />
      )}

      <View style={styles.overlay}>
        {proverbData && !loading && (
          <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
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
