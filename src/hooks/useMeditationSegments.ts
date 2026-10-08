import { type SharedValue, useDerivedValue } from "react-native-reanimated";

/** One animated stroke of the meditation outline. */
export interface MeditationSegment {
  start: SharedValue<number>;
  end: SharedValue<number>;
}

/**
 * Derives the four arcs of the meditation outline from a single progress value.
 *
 * Each arc grows out of its own corner toward the seam at the top-centre, so
 * the four together trace the whole screen edge as `progress` runs 0 → 1.
 *
 * @param progress - Shared value running 0 → 1 across the meditation.
 * @returns The four outline segments, in draw order.
 */
export function useMeditationSegments(
  progress: SharedValue<number>,
): MeditationSegment[] {
  return [
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
}
