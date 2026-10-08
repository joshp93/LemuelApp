/* eslint-disable @typescript-eslint/no-require-imports */
import { act, render, waitFor } from "@testing-library/react-native";
import { recordMeditationCompletion } from "../../src/api/meditation";
import WebMeditationScreen from "../../src/screens/meditation.web";
import {
  getEnabledMeditationShaders,
  getMeditationDuration,
} from "../../src/settings/meditation-preferences";
import { toLocalDateString } from "../../src/utils/date";

const mockLocalSearchParams = jest.fn().mockReturnValue({
  proverb: undefined,
  ref: undefined,
  date: undefined,
});

const mockWithTiming = jest.fn(
  (
    toValue: unknown,
    _config?: unknown,
    callback?: (finished: boolean) => void,
  ) => {
    callback?.(true);
    return toValue;
  },
);

jest.mock("@shopify/react-native-skia/lib/module/web", () => ({
  WithSkiaWeb: () => null,
}));

jest.mock("canvaskit-wasm/package.json", () => ({ version: "0.0.0-test" }));

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
    withTiming: (...args: any[]) => (mockWithTiming as any)(...args),
    runOnJS: (fn: any) => fn,
  };
  return { __esModule: true, default: RE, ...RE };
});

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => children,
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
  getMeditationDuration: jest.fn(),
  getEnabledMeditationShaders: jest.fn(),
}));

const mockGetMeditationDuration = getMeditationDuration as jest.MockedFunction<
  typeof getMeditationDuration
>;
const mockGetEnabledMeditationShaders =
  getEnabledMeditationShaders as jest.MockedFunction<
    typeof getEnabledMeditationShaders
  >;
const mockRecordMeditationCompletion =
  recordMeditationCompletion as jest.MockedFunction<
    typeof recordMeditationCompletion
  >;

const NOTIFICATION_PARAMS = {
  proverb: "Trust in the LORD with all your heart",
  ref: "Proverbs 3:5",
};

describe("WebMeditationScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalSearchParams.mockReturnValue({
      proverb: undefined,
      ref: undefined,
      date: undefined,
    });
    mockGetMeditationDuration.mockResolvedValue(60000);
    mockGetEnabledMeditationShaders.mockResolvedValue(["star-field"]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("runs for the configured duration when opened from a notification", async () => {
    mockGetMeditationDuration.mockResolvedValue(600000);
    mockLocalSearchParams.mockReturnValue(NOTIFICATION_PARAMS);

    render(<WebMeditationScreen />);

    await waitFor(() => {
      expect(mockRecordMeditationCompletion).toHaveBeenCalled();
    });

    expect(mockWithTiming).toHaveBeenCalledWith(
      1,
      { duration: 600000 },
      expect.any(Function),
    );
    expect(mockWithTiming).not.toHaveBeenCalledWith(
      1,
      { duration: 60000 },
      expect.any(Function),
    );
  });

  it("does not start before the stored duration has resolved", async () => {
    let resolveDuration!: (ms: number) => void;
    mockGetMeditationDuration.mockReturnValue(
      new Promise<number>((resolve) => {
        resolveDuration = resolve;
      }),
    );
    mockLocalSearchParams.mockReturnValue(NOTIFICATION_PARAMS);

    render(<WebMeditationScreen />);

    await act(async () => {});
    expect(mockWithTiming).not.toHaveBeenCalled();

    await act(async () => {
      resolveDuration(300000);
    });

    expect(mockWithTiming).toHaveBeenCalledWith(
      1,
      { duration: 300000 },
      expect.any(Function),
    );
  });

  it("records the completion against the local date, not UTC", async () => {
    const localToday = toLocalDateString(new Date());
    jest
      .spyOn(Date.prototype, "toISOString")
      .mockReturnValue("2000-01-01T00:00:00.000Z");
    mockLocalSearchParams.mockReturnValue(NOTIFICATION_PARAMS);

    render(<WebMeditationScreen />);

    await waitFor(() => {
      expect(mockRecordMeditationCompletion).toHaveBeenCalledWith(
        "test-user",
        localToday,
      );
    });
    expect(mockRecordMeditationCompletion).not.toHaveBeenCalledWith(
      "test-user",
      "2000-01-01",
    );
  });

  it("offers to capture thoughts once the meditation finishes", async () => {
    mockLocalSearchParams.mockReturnValue(NOTIFICATION_PARAMS);

    const { getByText } = render(<WebMeditationScreen />);

    await waitFor(() => {
      expect(getByText("Capture your thoughts...")).toBeTruthy();
    });
  });

  it("shows the proverb text once the background has resolved", async () => {
    mockLocalSearchParams.mockReturnValue(NOTIFICATION_PARAMS);

    const { getByText } = render(<WebMeditationScreen />);

    await waitFor(() => {
      expect(getByText(NOTIFICATION_PARAMS.proverb)).toBeTruthy();
    });
  });
});
