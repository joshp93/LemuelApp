import type { DeviceTier } from "../../src/hooks/useDeviceTier";

let mockTotalMemory: number | null = null;
const mockDeviceYearClass = 7;
const mockModelName = "Pixel 6a";

jest.mock("expo-device", () => ({
  __esModule: true,
  get totalMemory() {
    return mockTotalMemory;
  },
  get deviceYearClass() {
    return mockDeviceYearClass;
  },
  get modelName() {
    return mockModelName;
  },
  get osName() {
    return "Android";
  },
  get osVersion() {
    return "14.0";
  },
}));

jest.mock("../../src/api/remote-logger", () => ({
  remoteLog: jest.fn(),
}));

function getTierInIsolation(): DeviceTier {
  let tier: DeviceTier = "low";
  jest.isolateModules(() => {
    const mod = require("../../src/hooks/useDeviceTier");
    tier = mod.getDeviceTierSync();
  });
  return tier;
}

describe("useDeviceTier", () => {
  beforeEach(() => {
    mockTotalMemory = null;
  });

  describe("classification", () => {
    it("returns low when totalMemory is null (unknown)", () => {
      mockTotalMemory = null;
      expect(getTierInIsolation()).toBe("low");
    });

    it("returns low when totalMemory is less than 3GB", () => {
      mockTotalMemory = 2_147_483_648; // 2 GB
      expect(getTierInIsolation()).toBe("low");
    });

    it("returns medium when totalMemory is exactly 3GB", () => {
      mockTotalMemory = 3_221_225_472; // 3 GB
      expect(getTierInIsolation()).toBe("medium");
    });

    it("returns medium when totalMemory is between 3GB and 8GB", () => {
      mockTotalMemory = 6_442_450_944; // 6 GB (Pixel 6a)
      expect(getTierInIsolation()).toBe("medium");
    });

    it("returns high when totalMemory is exactly 8GB", () => {
      mockTotalMemory = 8_589_934_592; // 8 GB
      expect(getTierInIsolation()).toBe("high");
    });

    it("returns high when totalMemory is above 8GB", () => {
      mockTotalMemory = 12_884_901_888; // 12 GB
      expect(getTierInIsolation()).toBe("high");
    });

    it("caches the tier after first call", () => {
      let tier1: DeviceTier = "low";
      let tier2: DeviceTier = "low";
      jest.isolateModules(() => {
        mockTotalMemory = 2_147_483_648; // 2 GB
        const mod = require("../../src/hooks/useDeviceTier");
        tier1 = mod.getDeviceTierSync();

        // Change memory within same module instance
        mockTotalMemory = 12_884_901_888; // 12 GB
        tier2 = mod.getDeviceTierSync();
      });

      expect(tier1).toBe("low");
      expect(tier2).toBe("low"); // cached, should still be low
    });
  });

  describe("exported type", () => {
    it("TypeScript type check - DeviceTier is a union of three strings", () => {
      const tiers: DeviceTier[] = ["low", "medium", "high"];
      expect(tiers).toHaveLength(3);
      expect(tiers).toContain("low");
      expect(tiers).toContain("medium");
      expect(tiers).toContain("high");
    });
  });
});
