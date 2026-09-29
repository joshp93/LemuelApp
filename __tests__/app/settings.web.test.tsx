import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import type React from "react";
import WebSettingsScreen from "../../src/screens/settings.web";
import {
  getMeditationDuration,
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

jest.mock("../../src/settings/meditation-preferences", () => {
  const actual = jest.requireActual(
    "../../src/settings/meditation-preferences",
  );
  return {
    ...actual,
    getMeditationDuration: jest.fn(),
    setMeditationDuration: jest.fn(),
  };
});

jest.mock("@react-native-picker/picker", () => {
  const { View, Text, Pressable } = require("react-native");
  const Picker = (props: {
    selectedValue: number;
    onValueChange: (v: number) => void;
    children: React.ReactNode;
  }) => (
    <View>
      <Text>{String(props.selectedValue)}</Text>
      <Pressable
        testID="picker-change"
        onPress={() => props.onValueChange(120000)}
      />
      {props.children}
    </View>
  );
  Picker.Item = () => null;
  return { Picker };
});

const mockGetMeditationDuration = getMeditationDuration as jest.MockedFunction<
  typeof getMeditationDuration
>;
const mockSetMeditationDuration = setMeditationDuration as jest.MockedFunction<
  typeof setMeditationDuration
>;

describe("WebSettingsScreen", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockGetMeditationDuration.mockResolvedValue(60000);
    mockSetMeditationDuration.mockResolvedValue(undefined);
  });

  it("shows the info banner about limited settings", async () => {
    const { getByText } = render(<WebSettingsScreen />);
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    await waitFor(() => {
      expect(
        getByText(/some settings.*only available in the native app/i),
      ).toBeTruthy();
    });
  });

  it("shows the Meditations section header", async () => {
    const { getByText } = render(<WebSettingsScreen />);
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    await waitFor(() => {
      expect(getByText("Meditations")).toBeTruthy();
    });
  });

  it("shows the meditation timer picker", async () => {
    const { getByText } = render(<WebSettingsScreen />);
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    await waitFor(() => {
      expect(getByText("Meditation timer")).toBeTruthy();
    });
  });

  it("shows the default duration (60000) when no value stored", async () => {
    const { getByText } = render(<WebSettingsScreen />);
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    await waitFor(() => {
      expect(getByText("60000")).toBeTruthy();
    });
  });

  it("loads the stored duration via getMeditationDuration", async () => {
    mockGetMeditationDuration.mockResolvedValue(120000);

    const { getByText } = render(<WebSettingsScreen />);
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    await waitFor(() => {
      expect(getByText("120000")).toBeTruthy();
    });
  });

  it("persists the new duration when Update is pressed", async () => {
    const { getByText, getByTestId } = render(<WebSettingsScreen />);
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    fireEvent.press(getByTestId("picker-change"));
    fireEvent.press(getByText("Update"));

    await waitFor(() => {
      expect(mockSetMeditationDuration).toHaveBeenCalledWith(120000);
    });
  });

  it("does NOT show notification-related sections", async () => {
    const { queryByText } = render(<WebSettingsScreen />);
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    await waitFor(() => {
      expect(queryByText("Notifications")).toBeNull();
      expect(
        queryByText(/enable daily proverb meditation notifications/i),
      ).toBeNull();
    });
  });
});
