import { useEffect, useState } from "react";
import { StyleSheet, type TextLayoutEvent, type ViewProps } from "react-native";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import type { Proverb } from "../models/proverb";
import { ProverbCard } from "./proverb-card";

/** How long the old proverb takes to give way to the new one. */
const CROSS_FADE_MS = 500;

export interface ProverbCrossFadeProps extends ViewProps {
  /**
   * The proverb to show. A null value keeps whatever is already on screen, so
   * a failed fetch never blanks the card.
   */
  proverb: Proverb | null;
  /** Font size in px for the proverb text. */
  fontSize?: number;
  /** Called with text layout data for font-fitting. */
  onTextLayout?: (e: TextLayoutEvent) => void;
}

/**
 * Swaps one proverb for another without the page collapsing in between.
 *
 * The outgoing proverb is held in place until the incoming one has arrived, and
 * the two then cross-fade over {@linkcode CROSS_FADE_MS} while the box height
 * animates from one to the other. Nothing is unmounted while a version change
 * is in flight, so the content below the proverb — the note editor — never
 * jumps up and back down.
 *
 * A layer that has just mounted has not been measured yet, so the outgoing one
 * starts at the height it is taking over from rather than at nothing.
 */
export function ProverbCrossFade({
  proverb,
  fontSize = 40,
  onTextLayout,
  style,
  ...props
}: ProverbCrossFadeProps) {
  const [shown, setShown] = useState<Proverb | null>(proverb);
  const [outgoing, setOutgoing] = useState<Proverb | null>(null);
  const progress = useSharedValue(1);
  const outgoingHeight = useSharedValue(0);
  const shownHeight = useSharedValue(0);

  useEffect(() => {
    if (proverb === null || proverb === shown) return;

    setOutgoing(shown);
    setShown(proverb);
    outgoingHeight.value = shownHeight.value;
    progress.value = 0;
    progress.value = withTiming(1, { duration: CROSS_FADE_MS }, (finished) => {
      if (finished) runOnJS(setOutgoing)(null);
    });
  }, [proverb, shown, progress, outgoingHeight, shownHeight]);

  const containerStyle = useAnimatedStyle(() => ({
    height: interpolate(
      progress.value,
      [0, 1],
      [outgoingHeight.value, shownHeight.value],
    ),
  }));

  const outgoingStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
  }));

  const shownStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  if (shown === null && outgoing === null) return null;

  return (
    <Animated.View style={[styles.container, containerStyle, style]} {...props}>
      {outgoing && (
        <Animated.View
          key={`outgoing-${outgoing.proverb}`}
          style={[styles.layer, outgoingStyle]}
          onLayout={(e) => {
            outgoingHeight.value = e.nativeEvent.layout.height;
          }}
        >
          <ProverbCard proverb={outgoing} fontSize={fontSize} />
        </Animated.View>
      )}
      {shown && (
        <Animated.View
          key={`shown-${shown.proverb}`}
          style={[styles.layer, shownStyle]}
          onLayout={(e) => {
            shownHeight.value = e.nativeEvent.layout.height;
          }}
        >
          <ProverbCard
            proverb={shown}
            fontSize={fontSize}
            onTextLayout={onTextLayout}
          />
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  layer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
});

export default ProverbCrossFade;
