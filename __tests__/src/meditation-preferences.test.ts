import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getEnabledMeditationShaders,
  getMeditationDuration,
  setEnabledMeditationShaders,
  setMeditationDuration,
} from "../../src/settings/meditation-preferences";
import { DEFAULT_ENABLED_SHADER_IDS } from "../../src/utils/meditation-shaders";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe("meditation-preferences", () => {
  const mockGetItem = AsyncStorage.getItem as jest.MockedFunction<
    typeof AsyncStorage.getItem
  >;
  const mockSetItem = AsyncStorage.setItem as jest.MockedFunction<
    typeof AsyncStorage.setItem
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getMeditationDuration", () => {
    it("returns default 60000 when no value stored", async () => {
      mockGetItem.mockResolvedValueOnce(null);
      const result = await getMeditationDuration();
      expect(result).toBe(60000);
    });

    it("returns stored value when valid", async () => {
      mockGetItem.mockResolvedValueOnce("120000");
      const result = await getMeditationDuration();
      expect(result).toBe(120000);
    });

    it("returns default when stored value is out of range (too small)", async () => {
      mockGetItem.mockResolvedValueOnce("100");
      const result = await getMeditationDuration();
      expect(result).toBe(60000);
    });

    it("returns default when stored value is out of range (too large)", async () => {
      mockGetItem.mockResolvedValueOnce("700000");
      const result = await getMeditationDuration();
      expect(result).toBe(60000);
    });

    it("returns default when stored value is NaN", async () => {
      mockGetItem.mockResolvedValueOnce("not-a-number");
      const result = await getMeditationDuration();
      expect(result).toBe(60000);
    });
  });

  describe("setMeditationDuration", () => {
    it("stores the duration in ms", async () => {
      await setMeditationDuration(120000);
      expect(mockSetItem).toHaveBeenCalledWith(
        "meditation_duration_ms",
        "120000",
      );
    });
  });

  describe("getEnabledMeditationShaders", () => {
    it("returns the default selection when nothing is stored", async () => {
      mockGetItem.mockResolvedValueOnce(null);
      await expect(getEnabledMeditationShaders()).resolves.toEqual(
        DEFAULT_ENABLED_SHADER_IDS,
      );
    });

    it("returns the stored selection", async () => {
      mockGetItem.mockResolvedValueOnce(
        JSON.stringify(["gas-giant", "sine-mountains"]),
      );
      await expect(getEnabledMeditationShaders()).resolves.toEqual([
        "gas-giant",
        "sine-mountains",
      ]);
    });

    it("drops unknown ids", async () => {
      mockGetItem.mockResolvedValueOnce(
        JSON.stringify(["gas-giant", "ocean-planet", "galactic-journey"]),
      );
      await expect(getEnabledMeditationShaders()).resolves.toEqual([
        "gas-giant",
      ]);
    });

    it("falls back to the default selection when every stored id is unknown", async () => {
      mockGetItem.mockResolvedValueOnce(
        JSON.stringify(["ocean-planet", "galactic-journey"]),
      );
      await expect(getEnabledMeditationShaders()).resolves.toEqual(
        DEFAULT_ENABLED_SHADER_IDS,
      );
    });

    it("falls back to the default selection when the stored array is empty", async () => {
      mockGetItem.mockResolvedValueOnce("[]");
      await expect(getEnabledMeditationShaders()).resolves.toEqual(
        DEFAULT_ENABLED_SHADER_IDS,
      );
    });

    it("falls back to the default selection when the stored value is not an array", async () => {
      mockGetItem.mockResolvedValueOnce('"gas-giant"');
      await expect(getEnabledMeditationShaders()).resolves.toEqual(
        DEFAULT_ENABLED_SHADER_IDS,
      );
    });

    it("falls back to the default selection when the stored value is malformed", async () => {
      jest.spyOn(console, "error").mockImplementation(() => {});
      mockGetItem.mockResolvedValueOnce("{not json");
      await expect(getEnabledMeditationShaders()).resolves.toEqual(
        DEFAULT_ENABLED_SHADER_IDS,
      );
      jest.restoreAllMocks();
    });

    it("falls back to the default selection when storage throws", async () => {
      jest.spyOn(console, "error").mockImplementation(() => {});
      mockGetItem.mockRejectedValueOnce(new Error("storage unavailable"));
      await expect(getEnabledMeditationShaders()).resolves.toEqual(
        DEFAULT_ENABLED_SHADER_IDS,
      );
      jest.restoreAllMocks();
    });
  });

  describe("setEnabledMeditationShaders", () => {
    it("stores the selection as JSON", async () => {
      await setEnabledMeditationShaders(["gas-giant", "sine-mountains"]);
      expect(mockSetItem).toHaveBeenCalledWith(
        "meditation_shaders",
        JSON.stringify(["gas-giant", "sine-mountains"]),
      );
    });

    it("stores the default selection rather than an empty one", async () => {
      await setEnabledMeditationShaders([]);
      expect(mockSetItem).toHaveBeenCalledWith(
        "meditation_shaders",
        JSON.stringify(DEFAULT_ENABLED_SHADER_IDS),
      );
    });

    it("drops unknown ids before storing", async () => {
      await setEnabledMeditationShaders(["gas-giant", "ocean-planet"] as never);
      expect(mockSetItem).toHaveBeenCalledWith(
        "meditation_shaders",
        JSON.stringify(["gas-giant"]),
      );
    });

    it("does not throw when storage fails", async () => {
      jest.spyOn(console, "error").mockImplementation(() => {});
      mockSetItem.mockRejectedValueOnce(new Error("storage unavailable"));
      await expect(
        setEnabledMeditationShaders(["gas-giant"]),
      ).resolves.toBeUndefined();
      jest.restoreAllMocks();
    });
  });
});
