import { useCallback, useRef } from "react";
import { remoteLog } from "../api/remote-logger";

/** An async persistence task. */
type SaveTask = () => Promise<void>;

/**
 * Serialises async save tasks so their writes never interleave.
 *
 * A task that arrives while another is running replaces any task already
 * waiting. That is enough for settings, where each task persists the whole
 * current state: coalescing keeps the newest values, and running one task at a
 * time means the last write to land is always the latest change rather than
 * whichever round-trip happened to finish last.
 *
 * Failures are logged and swallowed — a save is fire-and-forget, so callers are
 * not left holding a rejected promise.
 *
 * @returns A function that enqueues a task.
 */
export function useSerializedSave(): (task: SaveTask) => void {
  const pendingRef = useRef<SaveTask | null>(null);
  const runningRef = useRef(false);

  return useCallback((task: SaveTask) => {
    pendingRef.current = task;
    if (runningRef.current) return;

    runningRef.current = true;
    void (async () => {
      try {
        while (pendingRef.current) {
          const next = pendingRef.current;
          pendingRef.current = null;
          try {
            await next();
          } catch (error) {
            remoteLog("error", "[Settings] Failed to save preferences", {
              error,
            });
          }
        }
      } finally {
        runningRef.current = false;
      }
    })();
  }, []);
}
