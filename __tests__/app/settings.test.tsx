import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import SettingsScreen from "../../app/settings";
import {
  getNotificationMode,
  getNotificationsEnabled,
  getRandomWindowEndMinute,
  getRandomWindowHourEnd,
  getRandomWindowHourStart,
  getRandomWindowStartMinute,
  getScheduledTimeHour,
  getScheduledTimeMinute,
} from "../../src/notifications/notification-preferences";
import {
  getEnabledMeditationShaders,
  getMeditationDuration,
  setEnabledMeditationShaders,
} from "../../src/settings/meditation-preferences";

jest.mock("expo-router", () => ({
  useNavigation: () => ({
    addListener: jest.fn(() => jest.fn()),
  }),
  Stack: {
    Screen: () => null,
  },
}));

jest.mock("../../src/auth/auth-context", () => ({
  useAuth: () => ({
    user: null,
    refreshUser: jest.fn(),
    loading: false,
  }),
}));

jest.mock("expo-notifications");

jest.mock("@use-voltra/android-client", () => ({
  updateAndroidWidget: jest.fn(),
}));

jest.mock("../../src/notifications/notification-preferences");
jest.mock("../../src/notifications/daily-proverb-notification");
jest.mock("../../src/api/proverbs");
jest.mock("../../src/api/version-storage");
jest.mock("../../src/settings/meditation-preferences");
jest.mock("@react-native-community/datetimepicker", () => "DateTimePicker");

const mockGetNotificationsEnabled =
  getNotificationsEnabled as jest.MockedFunction<
    typeof getNotificationsEnabled
  >;
const mockGetNotificationMode = getNotificationMode as jest.MockedFunction<
  typeof getNotificationMode
>;
const mockGetRandomWindowHourStart =
  getRandomWindowHourStart as jest.MockedFunction<
    typeof getRandomWindowHourStart
  >;
const mockGetRandomWindowHourEnd =
  getRandomWindowHourEnd as jest.MockedFunction<typeof getRandomWindowHourEnd>;
const mockGetRandomWindowStartMinute =
  getRandomWindowStartMinute as jest.MockedFunction<
    typeof getRandomWindowStartMinute
  >;
const mockGetRandomWindowEndMinute =
  getRandomWindowEndMinute as jest.MockedFunction<
    typeof getRandomWindowEndMinute
  >;
const mockGetScheduledTimeHour = getScheduledTimeHour as jest.MockedFunction<
  typeof getScheduledTimeHour
>;
const mockGetScheduledTimeMinute =
  getScheduledTimeMinute as jest.MockedFunction<typeof getScheduledTimeMinute>;
const mockGetMeditationDuration = getMeditationDuration as jest.MockedFunction<
  typeof getMeditationDuration
>;
const mockGetEnabledMeditationShaders =
  getEnabledMeditationShaders as jest.MockedFunction<
    typeof getEnabledMeditationShaders
  >;

describe("SettingsScreen", () => {
  const mockProverb = {
    ref: "Proverbs 3:5",
    proverb: "Trust in the LORD",
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockGetNotificationsEnabled.mockResolvedValue(false);
    mockGetNotificationMode.mockResolvedValue("random");
    mockGetRandomWindowHourStart.mockResolvedValue(9);
    mockGetRandomWindowStartMinute.mockResolvedValue(0);
    mockGetRandomWindowHourEnd.mockResolvedValue(19);
    mockGetRandomWindowEndMinute.mockResolvedValue(0);
    mockGetScheduledTimeHour.mockResolvedValue(8);
    mockGetScheduledTimeMinute.mockResolvedValue(0);
    mockGetMeditationDuration.mockResolvedValue(60000);
    mockGetEnabledMeditationShaders.mockResolvedValue(["star-field"]);
  });

  it("shows the Settings title", async () => {
    const { getByText } = render(<SettingsScreen />);
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    await waitFor(() => {
      expect(getByText("Notifications")).toBeTruthy();
    });
  });

  it("shows meditation duration section", async () => {
    const { getByText } = render(<SettingsScreen />);
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    await waitFor(() => {
      expect(getByText("Meditation timer")).toBeTruthy();
    });
  });

  it("shows expandable sections when notifications enabled", async () => {
    mockGetNotificationsEnabled.mockResolvedValue(true);

    const { getByText } = render(<SettingsScreen />);
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(getByText("Send at a random time")).toBeTruthy();
      expect(getByText("Send at a specific time")).toBeTruthy();
    });
  });

  it("does not show expandable sections when notifications disabled", async () => {
    const { queryByText } = render(<SettingsScreen />);
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(queryByText("Send at a random time")).toBeNull();
      expect(queryByText("Send at a specific time")).toBeNull();
    });
  });

  it("shows random time picker buttons when random mode is selected", async () => {
    mockGetNotificationsEnabled.mockResolvedValue(true);
    mockGetNotificationMode.mockResolvedValue("random");

    const { getByText } = render(<SettingsScreen />);
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(getByText("09:00")).toBeTruthy();
      expect(getByText("19:00")).toBeTruthy();
    });
  });

  it("shows scheduled time picker buttons when scheduled mode is selected", async () => {
    mockGetNotificationsEnabled.mockResolvedValue(true);
    mockGetNotificationMode.mockResolvedValue("scheduled");
    mockGetScheduledTimeHour.mockResolvedValue(14);
    mockGetScheduledTimeMinute.mockResolvedValue(30);

    const { getByText } = render(<SettingsScreen />);
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(getByText("14:30")).toBeTruthy();
    });
  });

  describe("meditation animations", () => {
    it("shows the Meditation animations section with every shader", async () => {
      const { getByText } = render(<SettingsScreen />);
      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(getByText("Meditation animations")).toBeTruthy();
        expect(getByText("Star field")).toBeTruthy();
        expect(getByText("Gas giant")).toBeTruthy();
        expect(getByText("Sine mountains")).toBeTruthy();
        expect(getByText("Sunset")).toBeTruthy();
        expect(getByText("Don't show an animation")).toBeTruthy();
      });
    });

    it("selects every animation but not the blank background by default", async () => {
      mockGetEnabledMeditationShaders.mockResolvedValue([
        "star-field",
        "gas-giant",
        "sine-mountains",
      ]);

      const { getByTestId } = render(<SettingsScreen />);
      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(getByTestId("shader-switch-star-field").props.value).toBe(true);
        expect(getByTestId("shader-switch-gas-giant").props.value).toBe(true);
        expect(getByTestId("shader-switch-sine-mountains").props.value).toBe(
          true,
        );
        expect(getByTestId("shader-switch-none").props.value).toBe(false);
      });
    });

    it("greys out the animations while the blank background is selected", async () => {
      mockGetEnabledMeditationShaders.mockResolvedValue([
        "star-field",
        "gas-giant",
        "none",
      ]);

      const { getByTestId } = render(<SettingsScreen />);
      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(getByTestId("shader-switch-none").props.value).toBe(true);
        expect(getByTestId("shader-switch-star-field").props.disabled).toBe(
          true,
        );
        expect(getByTestId("shader-switch-gas-giant").props.disabled).toBe(
          true,
        );
        expect(getByTestId("shader-switch-sine-mountains").props.disabled).toBe(
          true,
        );
        expect(getByTestId("shader-switch-none").props.disabled).toBe(false);
      });
    });

    it("leaves every animation greyed when the blank background is the only selection", async () => {
      mockGetEnabledMeditationShaders.mockResolvedValue(["none"]);

      const { getByTestId } = render(<SettingsScreen />);
      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(getByTestId("shader-switch-none").props.value).toBe(true);
        expect(getByTestId("shader-switch-none").props.disabled).toBe(false);
        expect(getByTestId("shader-switch-star-field").props.disabled).toBe(
          true,
        );
      });
    });

    it("turns the animations back on when the blank background is deselected", async () => {
      mockGetEnabledMeditationShaders.mockResolvedValue(["none"]);

      const { getByTestId } = render(<SettingsScreen />);
      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      fireEvent(getByTestId("shader-switch-none"), "valueChange", false);

      await waitFor(() => {
        expect(getByTestId("shader-switch-none").props.value).toBe(false);
        expect(getByTestId("shader-switch-star-field").props.value).toBe(true);
        expect(getByTestId("shader-switch-gas-giant").props.value).toBe(true);
      });
    });

    it("reflects the stored selection", async () => {
      mockGetEnabledMeditationShaders.mockResolvedValue([
        "gas-giant",
        "sine-mountains",
      ]);

      const { getByTestId } = render(<SettingsScreen />);
      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(getByTestId("shader-switch-star-field").props.value).toBe(false);
        expect(getByTestId("shader-switch-gas-giant").props.value).toBe(true);
        expect(getByTestId("shader-switch-sine-mountains").props.value).toBe(
          true,
        );
      });
    });

    it("enables a shader that is toggled on", async () => {
      const { getByTestId } = render(<SettingsScreen />);
      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(getByTestId("shader-switch-gas-giant").props.value).toBe(false);
      });

      fireEvent(getByTestId("shader-switch-gas-giant"), "valueChange", true);

      await waitFor(() => {
        expect(getByTestId("shader-switch-gas-giant").props.value).toBe(true);
      });
    });

    it("marks the form dirty when a shader is toggled", async () => {
      const { getByTestId, queryByText } = render(<SettingsScreen />);
      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(queryByText("Update")).toBeNull();
      });

      fireEvent(getByTestId("shader-switch-gas-giant"), "valueChange", true);

      await waitFor(() => {
        expect(queryByText("Update")).toBeTruthy();
      });
    });

    it("prevents turning off the last enabled shader", async () => {
      const { getByTestId } = render(<SettingsScreen />);
      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(getByTestId("shader-switch-star-field").props.disabled).toBe(
          true,
        );
        expect(getByTestId("shader-switch-gas-giant").props.disabled).toBe(
          false,
        );
      });
    });

    it("persists the selection when Update is pressed", async () => {
      const { getByTestId, getByText } = render(<SettingsScreen />);
      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      fireEvent(getByTestId("shader-switch-gas-giant"), "valueChange", true);
      fireEvent.press(getByText("Update"));

      await waitFor(() => {
        expect(setEnabledMeditationShaders).toHaveBeenCalledWith([
          "star-field",
          "gas-giant",
        ]);
      });
    });
  });
});
