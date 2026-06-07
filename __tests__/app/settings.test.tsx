import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import SettingsScreen from "../../app/settings";
import { getProverbForTheDay } from "../../src/api/proverbs";
import { getChosenVersion } from "../../src/api/version-storage";
import { sendProverbNotification } from "../../src/notifications/daily-proverb-notification";
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
import { getMeditationDuration } from "../../src/settings/meditation-preferences";

jest.mock("expo-router", () => ({
  useNavigation: () => ({
    addListener: jest.fn(() => jest.fn()),
  }),
  Stack: {
    Screen: () => null,
  },
}));

jest.mock("expo-notifications");

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
const mockSendProverbNotification =
  sendProverbNotification as jest.MockedFunction<
    typeof sendProverbNotification
  >;
const mockGetProverbForTheDay = getProverbForTheDay as jest.MockedFunction<
  typeof getProverbForTheDay
>;
const mockGetChosenVersion = getChosenVersion as jest.MockedFunction<
  typeof getChosenVersion
>;
const mockGetMeditationDuration = getMeditationDuration as jest.MockedFunction<
  typeof getMeditationDuration
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
    mockSendProverbNotification.mockResolvedValue(undefined);
    mockGetProverbForTheDay.mockResolvedValue(mockProverb);
    mockGetChosenVersion.mockResolvedValue("niv");
    mockGetMeditationDuration.mockResolvedValue(60000);
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

  it("sends an example notification when button pressed", async () => {
    mockGetNotificationsEnabled.mockResolvedValue(true);
    const { findByText } = render(<SettingsScreen />);
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    const sendButton = await findByText("Send example notification");
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(mockSendProverbNotification).toHaveBeenCalled();
    });
  });
});
