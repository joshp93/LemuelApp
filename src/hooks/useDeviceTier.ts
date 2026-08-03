import * as Device from "expo-device";
import { useEffect, useState } from "react";
import { remoteLog } from "../api/remote-logger";

export type DeviceTier = "low" | "medium" | "high";

let cachedTier: DeviceTier | null = null;

function classifyTier(totalMemory: number | null): DeviceTier {
  if (totalMemory == null) return "low";

  // 3 GB (3,221,225,472), 5 GB (5,368,709,120)
  if (totalMemory >= 5_368_709_120) return "high";
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
