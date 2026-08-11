import * as Device from "expo-device";
import { useEffect, useState } from "react";
import { remoteLog } from "../api/remote-logger";

export type DeviceTier = "low" | "medium" | "high";

let cachedTier: DeviceTier | null = null;

function classifyTier(totalMemory: number | null): DeviceTier {
  if (totalMemory == null) return "low";

  // High tier requires flagship-class RAM (8 GB). The previous 5 GB cutoff
  // admitted mid-range devices like the Pixel 6a (6 GB) whose GPU struggles
  // with the high-tier shader.
  // 3 GB (3,221,225,472), 8 GB (8,589,934,592)
  if (totalMemory >= 8_589_934_592) return "high";
  if (totalMemory >= 3_221_225_472) return "medium";
  return "low";
}

function tierFromDevice(): DeviceTier {
  const totalMemory = Device.totalMemory;
  const tier = classifyTier(totalMemory);
  remoteLog("debug", "[DeviceTier] Classified device", {
    totalMemory,
    totalMemoryGB:
      totalMemory != null
        ? `${(totalMemory / 1_073_741_824).toFixed(1)} GB`
        : "unknown",
    tier,
    modelName: Device.modelName,
    osName: Device.osName,
    osVersion: Device.osVersion,
    deviceYearClass: Device.deviceYearClass,
  });
  return tier;
}

export function getDeviceTierSync(): DeviceTier {
  if (cachedTier) return cachedTier;
  cachedTier = tierFromDevice();
  return cachedTier;
}

export function useDeviceTier(): DeviceTier {
  const [tier, setTier] = useState<DeviceTier>(() => getDeviceTierSync());

  useEffect(() => {
    if (cachedTier == null) {
      const t = tierFromDevice();
      cachedTier = t;
      setTier(t);
    }
  }, []);

  return tier;
}
