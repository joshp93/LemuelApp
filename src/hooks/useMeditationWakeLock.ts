import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { acquireWakeLock, releaseWakeLock } from "../utils/wake-lock";

/** The tag the meditation screen holds its wake lock under. */
export const MEDITATION_WAKE_LOCK_TAG = "meditation";

/**
 * Keeps the screen awake while a meditation is on screen.
 *
 * The lock is taken as soon as the screen mounts rather than when the timer
 * starts, so the window before the proverb and the background have resolved is
 * covered too — otherwise a slow load leaves the screen free to sleep for the
 * first seconds of the meditation.
 *
 * It is re-taken whenever the app returns to the foreground, because a browser
 * releases a screen wake lock the moment its tab is hidden and never asks for
 * it again.
 *
 * @param active - False once the meditation has finished, which drops the lock.
 */
export function useMeditationWakeLock(active: boolean): void {
  const held = useRef(false);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const tag = MEDITATION_WAKE_LOCK_TAG;

    const take = async () => {
      const acquired = await acquireWakeLock(tag);
      if (!acquired) return;

      if (cancelled) {
        await releaseWakeLock(tag);
        return;
      }
      held.current = true;
    };

    void take();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && held.current) {
        void acquireWakeLock(tag);
      }
    });

    return () => {
      cancelled = true;
      subscription.remove();
      if (!held.current) return;
      held.current = false;
      void releaseWakeLock(tag);
    };
  }, [active]);
}
