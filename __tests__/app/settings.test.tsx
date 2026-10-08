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
  setNotificationsEnabled,
  setRandomWindowHourStart,
  setScheduledTimeHour,
} from "../../src/notifications/notification-preferences";
import {
  getEnabledMeditationShaders,
  getMeditationDuration,
  setEnabledMeditationShaders,
  setMeditationDuration,
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
        expect(getByText("Sunset over sea")).toBeTruthy();
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

    it("refuses to remove the last animation even when the row is toggled directly", async () => {
      const { getByTestId } = render(<SettingsScreen />);
      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      fireEvent(getByTestId("shader-switch-star-field"), "valueChange", false);

      await waitFor(() => {
        expect(getByTestId("shader-switch-star-field").props.value).toBe(true);
      });
      expect(setEnabledMeditationShaders).not.toHaveBeenCalled();
    });
  });

  describe("auto-save", () => {
    it("has no Update button", async () => {
      const { queryByText } = render(<SettingsScreen />);
      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      expect(queryByText("Update")).toBeNull();
    });

    it("does not write the values it has just loaded", async () => {
      render(<SettingsScreen />);
      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockGetMeditationDuration).toHaveBeenCalled();
      });

      expect(setNotificationsEnabled).not.toHaveBeenCalled();
      expect(setMeditationDuration).not.toHaveBeenCalled();
      expect(setEnabledMeditationShaders).not.toHaveBeenCalled();
    });

    it("persists a shader change without pressing anything", async () => {
      const { getByTestId } = render(<SettingsScreen />);
      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(getByTestId("shader-switch-gas-giant").props.value).toBe(false);
      });

      fireEvent(getByTestId("shader-switch-gas-giant"), "valueChange", true);

      await waitFor(() => {
        expect(setEnabledMeditationShaders).toHaveBeenCalledWith([
          "star-field",
          "gas-giant",
        ]);
      });
    });

    it("persists the meditation duration without pressing anything", async () => {
      const { getByTestId } = render(<SettingsScreen />);
      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      fireEvent(getByTestId("duration-picker"), "valueChange", 300000);

      await waitFor(() => {
        expect(setMeditationDuration).toHaveBeenCalledWith(300000);
      });
    });

    it("stores a midnight start hour as 0 rather than the 09:00 fallback", async () => {
      mockGetRandomWindowHourStart.mockResolvedValue(0);
      mockGetScheduledTimeHour.mockResolvedValue(0);

      const { getByTestId } = render(<SettingsScreen />);
      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(getByTestId("shader-switch-gas-giant").props.value).toBe(false);
      });

      fireEvent(getByTestId("shader-switch-gas-giant"), "valueChange", true);

      await waitFor(() => {
        expect(setRandomWindowHourStart).toHaveBeenCalledWith(0);
        expect(setScheduledTimeHour).toHaveBeenCalledWith(0);
      });
    });

    it("holds a later write until the in-flight one lands, then stores the newest values", async () => {
      const mockSetNotificationsEnabled =
        setNotificationsEnabled as jest.MockedFunction<
          typeof setNotificationsEnabled
        >;
      let releaseFirst!: () => void;
      mockSetNotificationsEnabled.mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            releaseFirst = resolve;
          }),
      );

      const { getByTestId } = render(<SettingsScreen />);
      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(getByTestId("shader-switch-gas-giant").props.value).toBe(false);
      });

      fireEvent(getByTestId("shader-switch-gas-giant"), "valueChange", true);
      await waitFor(() => {
        expect(mockSetNotificationsEnabled).toHaveBeenCalledTimes(1);
      });

      fireEvent(
        getByTestId("shader-switch-sine-mountains"),
        "valueChange",
        true,
      );
      await act(async () => {});
      expect(setEnabledMeditationShaders).not.toHaveBeenCalled();

      await act(async () => {
        releaseFirst();
      });

      await waitFor(() => {
        const calls = (setEnabledMeditationShaders as jest.Mock).mock.calls;
        expect(calls.at(-1)?.[0]).toEqual([
          "star-field",
          "gas-giant",
          "sine-mountains",
        ]);
      });
    });
  });
});
