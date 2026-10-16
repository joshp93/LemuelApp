import { getPowerStateAsync } from "expo-battery";
import {
  activateKeepAwakeAsync,
  deactivateKeepAwake,
  isAvailableAsync,
} from "expo-keep-awake";
import { remoteLog } from "../api/remote-logger";

/** Tags whose power state has already been reported in this app run. */
const reportedTags = new Set<string>();

/**
 * Holds the screen awake until the same tag is released.
 *
 * A lock that cannot be taken is logged and reported as a failure, never
 * thrown: the meditation the lock belongs to must run either way, and outside a
 * development build the log is the only evidence of what happened on the
 * device.
 *
 * @param tag - The name the lock is held under.
 * @returns True when the screen is being kept awake.
 */
export async function acquireWakeLock(tag: string): Promise<boolean> {
  if (!(await canHoldScreenAwake())) {
    remoteLog("debug", "[WakeLock] Screen wake locks are unavailable here", {
      tag,
    });
    return false;
  }

  try {
    await activateKeepAwakeAsync(tag);
  } catch (error) {
    remoteLog("error", "[WakeLock] Failed to keep the screen awake", {
      tag,
      error,
    });
    return false;
  }

  await reportPowerState(tag);
  return true;
}

/**
 * Releases the lock held under `tag`.
 *
 * Failing to release is worth a log rather than an error: the worst case is a
 * screen that stays awake slightly too long.
 *
 * @param tag - The name the lock was acquired under.
 */
export async function releaseWakeLock(tag: string): Promise<void> {
  try {
    await deactivateKeepAwake(tag);
  } catch (error) {
    remoteLog("warn", "[WakeLock] Failed to release the screen lock", {
      tag,
      error,
    });
  }
}

/**
 * Whether this platform can hold the screen awake at all.
 *
 * Only a browser can answer no, and only where the Screen Wake Lock API is
 * missing; asking first is what keeps such a browser from logging a failure for
 * every meditation. A probe that cannot answer at all is not evidence that the
 * lock is unavailable, so the attempt goes ahead and reports for itself.
 *
 * @returns True when a wake lock should be requested.
 */
async function canHoldScreenAwake(): Promise<boolean> {
  if (typeof isAvailableAsync !== "function") return true;

  try {
    return await isAvailableAsync();
  } catch {
    return true;
  }
}

/**
 * Records the power state a lock was taken in, once per tag per app run.
 *
 * Logged at `warn` because {@linkcode remoteLog} drops `debug` and `info`
 * outside a development build, and this line is only worth having on a device
 * that is not the development machine — it is what separates a lock that was
 * never taken from one the system ignored.
 *
 * @param tag - The name the lock was acquired under.
 */
async function reportPowerState(tag: string): Promise<void> {
  if (reportedTags.has(tag)) return;
  reportedTags.add(tag);

  try {
    const { lowPowerMode, batteryLevel } = await getPowerStateAsync();
    remoteLog("warn", "[WakeLock] Screen held awake", {
      tag,
      lowPowerMode,
      batteryLevel,
    });
  } catch (error) {
    remoteLog("warn", "[WakeLock] Power state unavailable", { tag, error });
  }
}
