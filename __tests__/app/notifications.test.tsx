import { fireEvent, render, waitFor } from "@testing-library/react-native";
import * as Notifications from "expo-notifications";
import NotificationsSettings from "../../app/notifications";
import {
  getNotificationsEnabled,
  setNotificationsEnabled,
} from "../../src/notifications/notification-preferences";
import {
  scheduleNextDayProverbNotification,
  sendProverbNotification,
} from "../../src/notifications/daily-proverb-notification";
import { getProverbForTheDay } from "../../src/api/proverbs";
import { getChosenVersion } from "../../src/api/version-storage";

jest.mock("expo-router", () => ({
  useRouter: () => ({}),
  Stack: {
    Screen: () => null,
  },
}));

jest.mock("expo-notifications");

jest.mock("../../src/notifications/notification-preferences");
jest.mock("../../src/notifications/daily-proverb-notification");
jest.mock("../../src/api/proverbs");
jest.mock("../../src/api/version-storage");
jest.mock("../../src/utils/battery-optimization", () => ({
  openBatteryOptimizationSettings: jest.fn(),
  getBatteryOptimizationWarningText: jest.fn(
    () => "ℹ️ To ensure timely notifications...",
  ),
}));

const mockGetNotificationsEnabled =
  getNotificationsEnabled as jest.MockedFunction<typeof getNotificationsEnabled>;
const mockSetNotificationsEnabled =
  setNotificationsEnabled as jest.MockedFunction<typeof setNotificationsEnabled>;
const mockScheduleNextDayProverbNotification =
  scheduleNextDayProverbNotification as jest.MockedFunction<
    typeof scheduleNextDayProverbNotification
  >;
const mockGetProverbForTheDay = getProverbForTheDay as jest.MockedFunction<
  typeof getProverbForTheDay
>;
const mockGetChosenVersion = getChosenVersion as jest.MockedFunction<
  typeof getChosenVersion
>;

describe("NotificationsSettings", () => {
  const mockProverb = {
    ref: "Proverbs 3:5",
    proverb: "Trust in the LORD",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetNotificationsEnabled.mockResolvedValue(false);
    mockSetNotificationsEnabled.mockResolvedValue(undefined);
    mockScheduleNextDayProverbNotification.mockResolvedValue(undefined);
    mockGetProverbForTheDay.mockResolvedValue(mockProverb);
    mockGetChosenVersion.mockResolvedValue("niv");
  });

  it("schedules a notification for the next day when toggled on", async () => {
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: "granted",
    });

    const { UNSAFE_getByType } = render(<NotificationsSettings />);

    let switches: any;
    await waitFor(() => {
      switches = UNSAFE_getByType(require("react-native").Switch);
    });

    fireEvent(switches, "valueChange", true);

    await waitFor(() => {
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
      expect(mockScheduleNextDayProverbNotification).toHaveBeenCalledWith(
        mockProverb,
      );
      expect(mockSetNotificationsEnabled).toHaveBeenCalledWith(true);
    });
  });
});
