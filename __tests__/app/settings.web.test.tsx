import { act, render, waitFor } from "@testing-library/react-native";
import type React from "react";
import WebSettingsScreen from "../../app/settings.web";

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

jest.mock("@react-native-picker/picker", () => {
  const { View } = require("react-native");
  const { Text } = require("react-native");
  const Picker = (props: {
    selectedValue: number;
    children: React.ReactNode;
  }) => (
    <View>
      <Text>{String(props.selectedValue)}</Text>
      {props.children}
    </View>
  );
  Picker.Item = () => null;
  return { Picker };
});

describe("WebSettingsScreen", () => {
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    jest.useFakeTimers();
    localStorageMock = {};
    Object.defineProperty(global, "localStorage", {
      value: {
        getItem: jest.fn((key: string) => localStorageMock[key] ?? null),
        setItem: jest.fn(
          (key: string, value: string) => (localStorageMock[key] = value),
        ),
        removeItem: jest.fn((key: string) => delete localStorageMock[key]),
        clear: jest.fn(() => {
          localStorageMock = {};
        }),
        get length() {
          return Object.keys(localStorageMock).length;
        },
        key: jest.fn((index: number) => Object.keys(localStorageMock)[index]),
      },
      writable: true,
      configurable: true,
    });
    jest.clearAllMocks();
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

  it("loads stored duration from localStorage", async () => {
    localStorageMock.meditation_duration_ms = "120000";

    const { getByText } = render(<WebSettingsScreen />);
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    await waitFor(() => {
      expect(getByText("120000")).toBeTruthy();
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
