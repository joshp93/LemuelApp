import { useEffect, useMemo, useState } from "react";
import {
  type LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import {
  cancelAnimation,
  runOnJS,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ACCENT_COLOR,
  DEFAULT_CORNER_RADIUS,
  glowLayers,
  PROVERB_TEXT_COLOR,
  TIER_GLOW_STEP,
} from "../../constants/meditation";
import { useDeviceTier } from "../../hooks/useDeviceTier";
import { useFitFontSize } from "../../hooks/useFitFontSize";
import { useMeditationSegments } from "../../hooks/useMeditationSegments";
import { buildMeditationOutline } from "../../utils/meditation-outline";
import { LemuelButton } from "../lemuel-button";
import MeditationCanvas from "../meditation-canvas";
import { Text } from "../themed-text";
import { OnboardingReveal } from "./onboarding-reveal";

const MEDITATION_INTRO = "This is the meditation screen.";
const MEDITATION_COPY =
  "This screen is designed to help you focus on the proverb for a fixed amount of time.\n\nOnce the edges of the screen fill up with blue, the meditation session is complete. The animations and duration are configurable from the settings.";

const STEP_FONT_SIZES = [24, 22, 20, 18, 16];
const OUTLINE_DURATION_MS = 3000;
const OUTLINE_DELAY_MS = 500;

interface MeditationStepProps {
  onNext: () => void;
}

/**
 * Third onboarding screen: an interactive preview of the meditation session.
 *
 * The star field and the blue outline are drawn with the same components as the
 * real meditation screen. The outline fills over three seconds, after which the
 * Next action appears.
 *
 * @param props - The next handler.
 * @returns The meditation preview step.
 */
export function MeditationStep({ onNext }: MeditationStepProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const tier = useDeviceTier();
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isComplete, setIsComplete] = useState(false);
  const progress = useSharedValue(0);
  const resolution = useSharedValue([0, 0]);

  const segments = useMeditationSegments(progress);
  const sampledGlowLayers = useMemo(() => {
    const step = TIER_GLOW_STEP[tier];
    return glowLayers.filter((_, index) => index % step === 0);
  }, [tier]);

  const outlinePath = useMemo(
    () =>
      buildMeditationOutline(
        canvasSize.width,
        canvasSize.height,
        DEFAULT_CORNER_RADIUS,
      ),
    [canvasSize],
  );

  const textBoxHeight = Math.max(
    height - insets.top - insets.bottom - 140,
    180,
  );
  const { fontSize, onTextLayout } = useFitFontSize(
    `${MEDITATION_INTRO}\n\n${MEDITATION_COPY}`,
    textBoxHeight,
    STEP_FONT_SIZES,
  );

  useEffect(() => {
    const delay = setTimeout(() => {
      progress.value = withTiming(
        1,
        { duration: OUTLINE_DURATION_MS },
        (finished) => {
          if (finished) runOnJS(setIsComplete)(true);
        },
      );
    }, OUTLINE_DELAY_MS);

    return () => {
      clearTimeout(delay);
      cancelAnimation(progress);
    };
  }, [progress]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height: measuredHeight } = event.nativeEvent.layout;
    setCanvasSize({ width, height: measuredHeight });
    resolution.value = [width, measuredHeight];
  };

  return (
    <View style={styles.root} onLayout={handleLayout}>
      {outlinePath ? (
        <MeditationCanvas
          outlinePath={outlinePath}
          resolution={resolution}
          sampledGlowLayers={sampledGlowLayers}
          segments={segments}
          shaderId="star-field"
          tier={tier}
        />
      ) : null}

      <View
        style={[
          styles.textContainer,
          {
            paddingTop: insets.top + 44,
            paddingBottom: insets.bottom + 96,
          },
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.textContent}
          style={styles.textScroll}
        >
          <OnboardingReveal>
            <Text
              onTextLayout={onTextLayout}
              style={[
                styles.body,
                {
                  fontSize,
                  lineHeight: fontSize * 1.45,
                },
              ]}
            >
              {MEDITATION_INTRO}
              {"\n\n"}
              {MEDITATION_COPY}
            </Text>
          </OnboardingReveal>
        </ScrollView>
      </View>

      {isComplete ? (
        <View
          style={[
            styles.actions,
            {
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          <OnboardingReveal delay={0} offset={12}>
            <LemuelButton
              color={ACCENT_COLOR}
              onPress={onNext}
              style={styles.nextButton}
            >
              Next
            </LemuelButton>
          </OnboardingReveal>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  textContainer: {
    flex: 1,
    paddingHorizontal: 40,
  },
  textScroll: {
    flex: 1,
  },
  textContent: {
    paddingBottom: 8,
  },
  body: {
    color: PROVERB_TEXT_COLOR,
    textAlign: "left",
  },
  actions: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  nextButton: {
    paddingVertical: 16,
  },
});
