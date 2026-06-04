import { getMeditationDuration, setMeditationDuration } from "../../src/settings/meditation-preferences";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
});