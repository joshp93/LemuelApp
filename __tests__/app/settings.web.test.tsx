import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import type React from "react";
import WebSettingsScreen from "../../src/screens/settings.web";
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

jest.mock("../../src/settings/meditation-preferences", () => {
  const actual = jest.requireActual(
    "../../src/settings/meditation-preferences",
  );
  return {
    ...actual,
    getMeditationDuration: jest.fn(),
    setMeditationDuration: jest.fn(),
    getEnabledMeditationShaders: jest.fn(),
    setEnabledMeditationShaders: jest.fn(),
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
const mockGetEnabledMeditationShaders =
  getEnabledMeditationShaders as jest.MockedFunction<
    typeof getEnabledMeditationShaders
  >;
const mockSetEnabledMeditationShaders =
  setEnabledMeditationShaders as jest.MockedFunction<
    typeof setEnabledMeditationShaders
  >;

describe("WebSettingsScreen", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockGetMeditationDuration.mockResolvedValue(60000);
    mockSetMeditationDuration.mockResolvedValue(undefined);
    mockGetEnabledMeditationShaders.mockResolvedValue(["star-field"]);
    mockSetEnabledMeditationShaders.mockResolvedValue(undefined);
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

  describe("meditation animations", () => {
    it("lists every shader", async () => {
      const { getByText } = render(<WebSettingsScreen />);
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

    it("greys out the animations while the blank background is selected", async () => {
      mockGetEnabledMeditationShaders.mockResolvedValue(["star-field", "none"]);

      const { getByTestId } = render(<WebSettingsScreen />);
      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(getByTestId("shader-switch-none").props.value).toBe(true);
        expect(getByTestId("shader-switch-star-field").props.disabled).toBe(
          true,
        );
        expect(getByTestId("shader-switch-none").props.disabled).toBe(false);
      });
    });

    it("turns the animations back on when the blank background is deselected", async () => {
      mockGetEnabledMeditationShaders.mockResolvedValue(["none"]);

      const { getByTestId } = render(<WebSettingsScreen />);
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

      const { getByTestId } = render(<WebSettingsScreen />);
      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(getByTestId("shader-switch-star-field").props.value).toBe(false);
        expect(getByTestId("shader-switch-gas-giant").props.value).toBe(true);
      });
    });

    it("prevents turning off the last enabled shader", async () => {
      const { getByTestId } = render(<WebSettingsScreen />);
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
      const { getByTestId, getByText } = render(<WebSettingsScreen />);
      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      fireEvent(getByTestId("shader-switch-gas-giant"), "valueChange", true);
      fireEvent.press(getByText("Update"));

      await waitFor(() => {
        expect(mockSetEnabledMeditationShaders).toHaveBeenCalledWith([
          "star-field",
          "gas-giant",
        ]);
      });
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
