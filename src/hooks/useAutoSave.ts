import { useEffect, useRef } from "react";
import { useSerializedSave } from "./useSerializedSave";

/**
 * Persists a settings snapshot whenever it changes.
 *
 * The run that follows the initial load is skipped — that pass carries the
 * values that were just read from storage, so writing them straight back would
 * be a pointless round-trip on every visit to the screen.
 *
 * @param persist - Persists the current snapshot. Must be stable per snapshot
 *                  so a change produces a new identity.
 * @param ready - False while the snapshot is still loading; no save runs until
 *                it is true.
 */
export function useAutoSave(
  persist: () => Promise<void>,
  ready: boolean,
): void {
  const enqueueSave = useSerializedSave();
  const skippedInitialRun = useRef(false);

  useEffect(() => {
    if (!ready) return;
    if (!skippedInitialRun.current) {
      skippedInitialRun.current = true;
      return;
    }
    enqueueSave(persist);
  }, [ready, persist, enqueueSave]);
}
