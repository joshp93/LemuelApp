import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  completeOnboarding,
  hasCompletedOnboarding,
  ONBOARDING_STORAGE_KEY,
} from "../../src/onboarding/onboarding-storage";

describe("onboarding-storage", () => {
  beforeEach(() => {
    AsyncStorage.clear();
  });

  it("reports incomplete when the key is absent", async () => {
    await expect(hasCompletedOnboarding()).resolves.toBe(false);
  });

  it("reports complete when the legacy key is present", async () => {
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, "true");

    await expect(hasCompletedOnboarding()).resolves.toBe(true);
  });

  it("persists completion", async () => {
    await completeOnboarding();

    await expect(hasCompletedOnboarding()).resolves.toBe(true);
  });
});
