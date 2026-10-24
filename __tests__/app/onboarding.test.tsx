import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import OnboardingScreen from "../../app/onboarding";
import { setNotificationsEnabled } from "../../src/notifications/notification-preferences";
import { ONBOARDING_STORAGE_KEY } from "../../src/onboarding/onboarding-storage";

const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock("expo-status-bar", () => ({
  StatusBar: () => null,
}));

jest.mock("react-native-reanimated", () => {
  const { View } = require("react-native");
  const Reanimated = {
    View,
    createAnimatedComponent: (component: unknown) => component,
    useAnimatedStyle: () => ({}),
    useSharedValue: (initial: unknown) => ({ value: initial }),
    withTiming: (toValue: unknown) => toValue,
    withDelay: (_delay: number, animation: unknown) => animation,
  };

  return { __esModule: true, default: Reanimated, ...Reanimated };
});

jest.mock("../../src/components/onboarding/meditation-step", () => {
  const { Pressable, Text } = require("react-native");

  return {
    MeditationStep: ({ onNext }: { onNext: () => void }) => (
      <>
        <Text>Meditation preview</Text>
        <Pressable onPress={onNext}>
          <Text>Next</Text>
        </Pressable>
      </>
    ),
  };
});

jest.mock("../../src/components/onboarding/onboarding-settings-modal", () => {
  const { Pressable, Text } = require("react-native");

  return {
    OnboardingSettingsModal: ({
      onClose,
      onDone,
    }: {
      onClose: () => void;
      onDone: () => void;
    }) => (
      <>
        <Text>Reminder settings</Text>
        <Pressable onPress={onClose}>
          <Text>Settings close</Text>
        </Pressable>
        <Pressable onPress={onDone}>
          <Text>Settings done</Text>
        </Pressable>
      </>
    ),
  };
});

jest.mock("../../src/notifications/notification-preferences", () => ({
  setNotificationsEnabled: jest.fn(),
}));

const mockSetNotificationsEnabled =
  setNotificationsEnabled as jest.MockedFunction<
    typeof setNotificationsEnabled
  >;

async function completeOnboardingAndWaitForReplace() {
  await waitFor(() => {
    expect(mockReplace).toHaveBeenCalled();
  });
  await expect(AsyncStorage.getItem(ONBOARDING_STORAGE_KEY)).resolves.toBe(
    "true",
  );
}

describe("OnboardingScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
    mockSetNotificationsEnabled.mockResolvedValue(undefined);
  });

  it("shows the welcome copy and actions", () => {
    const { getByText } = render(<OnboardingScreen />);

    expect(
      getByText(
        "Welcome to Lemuel, the daily proverb app which encourages you to stop and meditate on 1 proverb each day.",
      ),
    ).toBeTruthy();
    expect(getByText("Get started")).toBeTruthy();
    expect(getByText("Skip introduction")).toBeTruthy();
  });

  it("finishes onboarding and goes home when skipped", async () => {
    const { getByText } = render(<OnboardingScreen />);

    fireEvent.press(getByText("Skip introduction"));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
    await completeOnboardingAndWaitForReplace();
  });

  it("slides in the reminder step after Get started", () => {
    const { getByText } = render(<OnboardingScreen />);

    fireEvent.press(getByText("Get started"));

    expect(getByText(/The home screen shows today's proverb/)).toBeTruthy();
    expect(getByText("Enable daily reminder notifications")).toBeTruthy();
    expect(getByText("Continue without reminder notifications")).toBeTruthy();
  });

  it("opens reminder settings and advances when Done is pressed", () => {
    const { getByText } = render(<OnboardingScreen />);

    fireEvent.press(getByText("Get started"));
    fireEvent.press(getByText("Enable daily reminder notifications"));

    expect(getByText("Reminder settings")).toBeTruthy();

    fireEvent.press(getByText("Settings done"));

    expect(getByText("Meditation preview")).toBeTruthy();
  });

  it("disables reminders when continuing without them", () => {
    const { getByText } = render(<OnboardingScreen />);

    fireEvent.press(getByText("Get started"));
    fireEvent.press(getByText("Continue without reminder notifications"));

    expect(mockSetNotificationsEnabled).toHaveBeenCalledWith(false);
    expect(getByText("Meditation preview")).toBeTruthy();
  });

  it("finishes onboarding and opens email entry from Sign up", async () => {
    const { getByText } = render(<OnboardingScreen />);

    fireEvent.press(getByText("Get started"));
    fireEvent.press(getByText("Continue without reminder notifications"));
    fireEvent.press(getByText("Next"));

    expect(getByText("Sign up")).toBeTruthy();
    expect(getByText("Continue without account")).toBeTruthy();

    fireEvent.press(getByText("Sign up"));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/email-entry");
    });
    await completeOnboardingAndWaitForReplace();
  });

  it("finishes onboarding and goes home without an account", async () => {
    const { getByText } = render(<OnboardingScreen />);

    fireEvent.press(getByText("Get started"));
    fireEvent.press(getByText("Continue without reminder notifications"));
    fireEvent.press(getByText("Next"));
    fireEvent.press(getByText("Continue without account"));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
    await completeOnboardingAndWaitForReplace();
  });
});
