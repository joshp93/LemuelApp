import { useCallback, useEffect, useRef, useState } from "react";
import {
  runOnJS,
  type SharedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { getMeditationDuration } from "../settings/meditation-preferences";

/** Timing state shared by the native and web meditation screens. */
export interface MeditationTimer {
  /** Runs 0 → 1 across the meditation, driving the outline arc. */
  progress: SharedValue<number>;
  /** Fades the proverb text in as the meditation starts. */
  textOpacity: SharedValue<number>;
  /** True once the timer has run its full duration. */
  isComplete: boolean;
}

interface UseMeditationTimerOptions {
  /**
   * Whether the proverb and the background are resolved. The stored duration
   * is awaited here as well, so callers do not have to account for it.
   */
  ready: boolean;
  /** Called once, on the JS thread, when the timer starts. */
  onStart?: () => void;
  /** Called once, on the JS thread, when the timer finishes. */
  onComplete: () => void;
}

/**
 * Runs the meditation timer.
 *
 * The stored duration is part of the start condition rather than a separate
 * effect, so a meditation opened from a notification tap — where the proverb
 * arrives as a route param and `ready` is already true on the first render —
 * still runs for the duration the user configured instead of the fallback.
 *
 * @param options - Readiness and lifecycle callbacks.
 * @returns The shared timing values and the completion flag.
 */
export function useMeditationTimer({
  ready,
  onStart,
  onComplete,
}: UseMeditationTimerOptions): MeditationTimer {
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const progress = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const started = useRef(false);

  useEffect(() => {
    let active = true;

    getMeditationDuration().then((duration) => {
      if (active) setDurationMs(duration);
    });

    return () => {
      active = false;
    };
  }, []);

  const finish = useCallback(() => {
    setIsComplete(true);
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    if (started.current || !ready || durationMs === null) return;
    started.current = true;

    onStart?.();

    progress.value = withTiming(1, { duration: durationMs }, (finished) => {
      if (finished) runOnJS(finish)();
    });
    textOpacity.value = withTiming(1, { duration: 1000 });
  }, [ready, durationMs, onStart, finish, progress, textOpacity]);

  return { progress, textOpacity, isComplete };
}
