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
import { Stack, useLocalSearchParams } from "expo-router";
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

export default function MeditationScreen() {
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [deviceCornerRadius, setDeviceCornerRadius] = useState<number | null>(
    null,
  );
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

  const keepAwakeAllowed = useRef(true);
  useEffect(() => {
    keepAwakeAllowed.current = true;
    return () => {
      keepAwakeAllowed.current = false;
      deactivateKeepAwake("meditation");
    };
  }, []);

  const keepAwake = useCallback(() => {
    getPowerStateAsync().then(({ lowPowerMode }) => {
      if (lowPowerMode || !keepAwakeAllowed.current) return;
      activateKeepAwakeAsync("meditation");
    });
  }, []);

  const releaseKeepAwake = useCallback(() => {
    deactivateKeepAwake("meditation");
    void recordMeditationCompletion(user?.userId ?? "", effectiveDate);
  }, [user?.userId, effectiveDate]);

  const { progress, textOpacity, isComplete } = useMeditationTimer({
    ready: !loading && proverbData !== null && shader !== null,
    onStart: keepAwake,
    onComplete: releaseKeepAwake,
  });

  const resolution = useSharedValue([0, 0]);
  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const { width, height } = e.nativeEvent.layout;
      setCanvasSize({ width, height });
      resolution.value = [width, height];
      setDeviceCornerRadius(getCornerRadius());
    },
    [resolution],
  );

  const cornerRadius =
    deviceCornerRadius !== null && deviceCornerRadius > 0
      ? deviceCornerRadius
      : DEFAULT_CORNER_RADIUS;

  const sksl = useMemo(() => shader?.makeSkSL(tier) ?? null, [shader, tier]);
  const effect = useMemo(
    () => (sksl === null ? null : Skia.RuntimeEffect.Make(sksl)),
    [sksl],
  );
  const sampledGlowLayers = useMemo(() => {
    const step = TIER_GLOW_STEP[tier];
    return glowLayers.filter((_, i) => i % step === 0);
  }, [tier]);

  useEffect(() => {
    remoteLog("debug", "[MeditationScreen] Shader configured", {
      shader: shader?.id ?? null,
      tier,
      glowLayers: sampledGlowLayers.length,
    });
  }, [shader, tier, sampledGlowLayers]);

  useEffect(() => {
    if (deviceCornerRadius === null) return;
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

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const textBoxHeight = canvasSize.height - (INSET + cornerRadius + 8) - 100;
  const { fontSize, onTextLayout } = useFitFontSize(
    proverbData?.proverb,
    textBoxHeight,
    FONT_SIZES,
  );

  const segments = useMeditationSegments(progress);

  const outlinePath = useMemo(() => {
    const d = buildMeditationOutline(
      canvasSize.width,
      canvasSize.height,
      cornerRadius,
    );
    return d === null ? null : Skia.Path.MakeFromSVGString(d);
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
        {proverbData && !loading && shader && (
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
    paddingBottom: 100,
  },
  proverbText: {
    textAlign: "left",
  },
});
