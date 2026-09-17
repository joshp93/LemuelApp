/* eslint-disable @typescript-eslint/no-require-imports */
import { render, waitFor } from "@testing-library/react-native";
import { getPowerStateAsync } from "expo-battery";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import MeditationScreen from "../../app/meditation";

const mockLocalSearchParams = jest.fn().mockReturnValue({
  proverb: undefined,
  ref: undefined,
  date: undefined,
});

jest.mock("@shopify/react-native-skia", () => {
  const { View } = require("react-native");
  return {
    Canvas: View,
    Fill: View,
    Path: View,
    Shader: View,
    Skia: {
      RuntimeEffect: { Make: jest.fn(() => null) },
      Path: { MakeFromSVGString: jest.fn(() => null) },
    },
    useCanvasSize: () => ({ ref: { current: null } }),
    useClock: () => ({ value: 0 }),
  };
});

jest.mock("expo-battery", () => ({
  getPowerStateAsync: jest.fn(),
}));

jest.mock("expo-device-corner-radius", () => ({
  getCornerRadius: () => 30,
}));

jest.mock("expo-keep-awake", () => ({
  activateKeepAwakeAsync: jest.fn(),
  deactivateKeepAwake: jest.fn(),
}));

jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ replace: jest.fn() }),
  useLocalSearchParams: () => mockLocalSearchParams(),
}));

jest.mock("react-native-reanimated", () => {
  const { View } = require("react-native");
  const RE = {
    View,
    Text: require("react-native").Text,
    createAnimatedComponent: (comp: any) => comp,
    useAnimatedStyle: () => ({}),
    useDerivedValue: (fn: any) => ({ value: fn() }),
    useSharedValue: (initial: any) => ({ value: initial }),
    withTiming: (_toValue: any, _config?: any, callback?: any) => {
      callback?.(true);
      return _toValue;
    },
    withSpring: (toValue: any) => toValue,
    runOnJS: (fn: any) => fn,
    runOnUI: (fn: any) => fn,
    interpolate: (_val: any, _input: any[], output: any[]) => output[0],
    Easing: { in: (e: any) => e, out: (e: any) => e, inOut: (e: any) => e },
    processColor: (c: any) => c,
  };
  return { __esModule: true, default: RE, ...RE };
});

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => children,
}));

jest.mock("react-native-worklets", () => ({
  scheduleOnRN: (fn: (...args: any[]) => any, ...args: any[]) => fn(...args),
}));

jest.mock("../../src/api/meditation", () => ({
  recordMeditationCompletion: jest.fn(),
}));

jest.mock("../../src/api/remote-logger", () => ({
  remoteLog: jest.fn(),
}));

jest.mock("../../src/auth/auth-context", () => ({
  useAuth: () => ({ user: { userId: "test-user" } }),
}));

jest.mock("../../src/components/lemuel-button", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return {
    LemuelButton: ({ children, onPress }: any) => (
      <TouchableOpacity onPress={onPress}>
        <Text>{children}</Text>
      </TouchableOpacity>
    ),
  };
});

jest.mock("../../src/components/themed-text", () => {
  const { Text } = require("react-native");
  return { Text };
});

jest.mock("../../src/hooks/useDeviceTier", () => ({
  useDeviceTier: () => "high",
}));

jest.mock("../../src/hooks/useFitFontSize", () => ({
  useFitFontSize: () => ({ fontSize: 28, onTextLayout: jest.fn() }),
}));

jest.mock("../../src/hooks/useProverbForTheDay", () => ({
  useProverbForTheDay: jest.fn().mockReturnValue({
    proverb: null,
    loading: true,
    error: null,
    selectedVersion: null,
    availableVersions: [],
    date: undefined,
    changeVersion: jest.fn(),
    goToDate: jest.fn(),
  }),
}));

jest.mock("../../src/settings/meditation-preferences", () => ({
  getMeditationDuration: jest.fn().mockResolvedValue(60000),
}));

function renderMeditation() {
  return render(<MeditationScreen />);
}

describe("MeditationScreen - keep awake", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalSearchParams.mockReturnValue({
      proverb: undefined,
      ref: undefined,
      date: undefined,
    });
  });

  describe("wake lock activation", () => {
    it("activates wake lock when lowPowerMode is false", async () => {
      (getPowerStateAsync as jest.Mock).mockResolvedValue({
        lowPowerMode: false,
      });
      mockLocalSearchParams.mockReturnValue({
        proverb: "Trust in the LORD with all your heart",
        ref: "Proverbs 3:5",
      });

      renderMeditation();

      await waitFor(() => {
        expect(activateKeepAwakeAsync).toHaveBeenCalledWith("meditation");
      });
    });

    it("does not activate wake lock when lowPowerMode is true (battery saver)", async () => {
      (getPowerStateAsync as jest.Mock).mockResolvedValue({
        lowPowerMode: true,
      });
      mockLocalSearchParams.mockReturnValue({
        proverb: "Trust in the LORD with all your heart",
        ref: "Proverbs 3:5",
      });

      renderMeditation();

      await waitFor(() => {
        expect(activateKeepAwakeAsync).not.toHaveBeenCalled();
      });
    });
  });

  describe("wake lock deactivation", () => {
    it("deactivates wake lock when meditation completes", async () => {
      (getPowerStateAsync as jest.Mock).mockResolvedValue({
        lowPowerMode: false,
      });
      mockLocalSearchParams.mockReturnValue({
        proverb: "Trust in the LORD with all your heart",
        ref: "Proverbs 3:5",
      });

      renderMeditation();

      await waitFor(() => {
        expect(deactivateKeepAwake).toHaveBeenCalledWith("meditation");
      });
    });

    it("deactivates wake lock on unmount via cleanup effect", () => {
      mockLocalSearchParams.mockReturnValue({
        proverb: undefined,
        ref: undefined,
      });

      const { unmount } = renderMeditation();
      unmount();

      expect(deactivateKeepAwake).toHaveBeenCalledWith("meditation");
    });
  });
});
