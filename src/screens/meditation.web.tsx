import { WithSkiaWeb } from "@shopify/react-native-skia/lib/module/web";
import { version } from "canvaskit-wasm/package.json";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  useSharedValue,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { recordMeditationCompletion } from "../api/meditation";
import { remoteLog } from "../api/remote-logger";
import { useAuth } from "../auth/auth-context";
import { MeditationCaptureButton } from "../components/meditation-capture-button";
import { Text } from "../components/themed-text";
import {
  DEFAULT_CORNER_RADIUS,
  FONT_SIZES,
  glowLayers,
  INSET,
  TIER_GLOW_STEP,
} from "../constants/meditation";
import { useDeviceTier } from "../hooks/useDeviceTier";
import { useFitFontSize } from "../hooks/useFitFontSize";
import { useMeditationSegments } from "../hooks/useMeditationSegments";
import { useMeditationShader } from "../hooks/useMeditationShader";
import { useMeditationTimer } from "../hooks/useMeditationTimer";
import { useProverbForTheDay } from "../hooks/useProverbForTheDay";
import type { Proverb } from "../models/proverb";
import { toLocalDateString } from "../utils/date";
import { buildMeditationOutline } from "../utils/meditation-outline";

const CORNER_RADIUS = DEFAULT_CORNER_RADIUS;

/**
 * Meditation screen for web.
 *
 * Uses {@linkcode WithSkiaWeb} to defer loading the Skia glow-arc canvas until
 * CanvasKit WASM has finished loading. During SSR and CanvasKit initialisation
 * a plain black background is shown. The corner radius is a constant rather
 * than a device measurement, and the keep-awake and battery APIs are omitted —
 * they either require native modules or are not available on web.
 */
export default function WebMeditationScreen() {
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
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

  const effectiveDate = paramDate ?? toLocalDateString(new Date());

  const hookResult = useProverbForTheDay(paramDate);
  const proverbData = paramProverbData ?? hookResult.proverb;
  const loading = hasParamProverb ? false : hookResult.loading;

  const { user } = useAuth();
  const { height: windowHeight } = useWindowDimensions();
  const screenHeight = Dimensions.get("screen").height;
  const hasVisibleNavBar = screenHeight - windowHeight > 30;

  const tier = useDeviceTier();
  const shader = useMeditationShader();

  const complete = useCallback(() => {
    void recordMeditationCompletion(user?.userId ?? "", effectiveDate);
  }, [user?.userId, effectiveDate]);

  const { progress, textOpacity, isComplete } = useMeditationTimer({
    ready: !loading && proverbData !== null && shader !== null,
    onComplete: complete,
  });

  const resolution = useSharedValue([0, 0]);
  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const { width, height } = e.nativeEvent.layout;
      setCanvasSize({ width, height });
      resolution.value = [width, height];
    },
    [resolution],
  );

  const sampledGlowLayers = useMemo(() => {
    const step = TIER_GLOW_STEP[tier];
    return glowLayers.filter((_, i) => i % step === 0);
  }, [tier]);

  useEffect(() => {
    remoteLog("debug", "[MeditationScreen] Shader configured (web)", {
      shader: shader?.id ?? null,
      tier,
      glowLayers: sampledGlowLayers.length,
    });
  }, [shader, tier, sampledGlowLayers]);

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const textBoxHeight = canvasSize.height - (INSET + CORNER_RADIUS + 8) - 100;
  const { fontSize, onTextLayout } = useFitFontSize(
    proverbData?.proverb,
    textBoxHeight,
    FONT_SIZES,
  );

  const segments = useMeditationSegments(progress);

  const outlinePath = useMemo(
    () =>
      buildMeditationOutline(
        canvasSize.width,
        canvasSize.height,
        CORNER_RADIUS,
      ),
    [canvasSize],
  );

  const showCanvas = outlinePath !== null && shader !== null;

  const innerContent = (
    <>
      <Stack.Screen
        options={{
          contentStyle: { backgroundColor: "#000" },
          headerShown: false,
          statusBarHidden: true,
        }}
      />
      {showCanvas ? (
        <WithSkiaWeb
          opts={{
            locateFile: (file) =>
              `https://cdn.jsdelivr.net/npm/canvaskit-wasm@${version}/bin/full/${file}`,
          }}
          getComponent={() => import("../components/meditation-canvas")}
          componentProps={{
            shaderId: shader.id,
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
        {proverbData && !loading && shader && (
          <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
            <ScrollView>
              <Text
                style={[
                  styles.proverbText,
                  {
                    fontSize,
                    lineHeight: fontSize,
                    color: shader.textColour,
                  },
                ]}
                onTextLayout={onTextLayout}
              >
                {proverbData.proverb}
              </Text>
            </ScrollView>
          </Animated.View>
        )}

        {isComplete && proverbData && (
          <MeditationCaptureButton
            proverbRef={proverbData.ref}
            date={effectiveDate}
          />
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
    textAlign: "left",
  },
});
