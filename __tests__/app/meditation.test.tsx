/* eslint-disable @typescript-eslint/no-require-imports */
import { act, render, waitFor } from "@testing-library/react-native";
import { getPowerStateAsync } from "expo-battery";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import MeditationScreen from "../../app/meditation";
import { recordMeditationCompletion } from "../../src/api/meditation";
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
    withTiming: (...args: any[]) => (mockWithTiming as any)(...args),
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
const mockGetPowerStateAsync = getPowerStateAsync as jest.MockedFunction<
  typeof getPowerStateAsync
>;
const mockRecordMeditationCompletion =
  recordMeditationCompletion as jest.MockedFunction<
    typeof recordMeditationCompletion
  >;

/** Params for a meditation opened from a notification tap. */
const NOTIFICATION_PARAMS = {
  proverb: "Trust in the LORD with all your heart",
  ref: "Proverbs 3:5",
};

function renderMeditation() {
  return render(<MeditationScreen />);
}

async function renderToCompletion() {
  const rendered = renderMeditation();
  await waitFor(() => {
    expect(mockRecordMeditationCompletion).toHaveBeenCalled();
  });
  return rendered;
}

describe("MeditationScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalSearchParams.mockReturnValue({
      proverb: undefined,
      ref: undefined,
      date: undefined,
    });
    mockGetMeditationDuration.mockResolvedValue(60000);
    mockGetEnabledMeditationShaders.mockResolvedValue(["star-field"]);
    mockGetPowerStateAsync.mockResolvedValue({
      lowPowerMode: false,
    } as Awaited<ReturnType<typeof getPowerStateAsync>>);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("wake lock activation", () => {
    it("activates wake lock when lowPowerMode is false", async () => {
      mockGetPowerStateAsync.mockResolvedValue({
        lowPowerMode: false,
      } as Awaited<ReturnType<typeof getPowerStateAsync>>);
      mockLocalSearchParams.mockReturnValue(NOTIFICATION_PARAMS);

      renderMeditation();

      await waitFor(() => {
        expect(activateKeepAwakeAsync).toHaveBeenCalledWith("meditation");
      });
    });

    it("does not activate wake lock when lowPowerMode is true (battery saver)", async () => {
      mockGetPowerStateAsync.mockResolvedValue({
        lowPowerMode: true,
      } as Awaited<ReturnType<typeof getPowerStateAsync>>);
      mockLocalSearchParams.mockReturnValue(NOTIFICATION_PARAMS);

      renderMeditation();

      await waitFor(() => {
        expect(mockGetPowerStateAsync).toHaveBeenCalled();
      });
      expect(activateKeepAwakeAsync).not.toHaveBeenCalled();
    });

    it("does not re-activate the wake lock after the screen has unmounted", async () => {
      let resolvePowerState!: (
        state: Awaited<ReturnType<typeof getPowerStateAsync>>,
      ) => void;
      mockGetPowerStateAsync.mockReturnValue(
        new Promise((resolve) => {
          resolvePowerState = resolve;
        }),
      );
      mockLocalSearchParams.mockReturnValue(NOTIFICATION_PARAMS);

      const { unmount } = renderMeditation();

      await waitFor(() => {
        expect(mockGetPowerStateAsync).toHaveBeenCalled();
      });

      unmount();

      await act(async () => {
        resolvePowerState({
          lowPowerMode: false,
        } as Awaited<ReturnType<typeof getPowerStateAsync>>);
      });

      expect(activateKeepAwakeAsync).not.toHaveBeenCalled();
    });
  });

  describe("wake lock deactivation", () => {
    it("deactivates wake lock when meditation completes", async () => {
      mockLocalSearchParams.mockReturnValue(NOTIFICATION_PARAMS);

      await renderToCompletion();

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

  describe("duration", () => {
    it("runs for the configured duration when opened from a notification", async () => {
      mockGetMeditationDuration.mockResolvedValue(600000);
      mockLocalSearchParams.mockReturnValue(NOTIFICATION_PARAMS);

      await renderToCompletion();

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

      renderMeditation();

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

    it("does not start before the background shader has resolved", async () => {
      let resolveShaders!: (ids: string[]) => void;
      mockGetEnabledMeditationShaders.mockReturnValue(
        new Promise<string[]>((resolve) => {
          resolveShaders = resolve;
        }) as never,
      );
      mockLocalSearchParams.mockReturnValue(NOTIFICATION_PARAMS);

      renderMeditation();

      await act(async () => {});
      expect(mockWithTiming).not.toHaveBeenCalled();

      await act(async () => {
        resolveShaders(["star-field"]);
      });

      await waitFor(() => {
        expect(mockWithTiming).toHaveBeenCalled();
      });
    });
  });

  describe("completion date", () => {
    it("records the completion against the local date, not UTC", async () => {
      const localToday = toLocalDateString(new Date());
      jest
        .spyOn(Date.prototype, "toISOString")
        .mockReturnValue("2000-01-01T00:00:00.000Z");
      mockLocalSearchParams.mockReturnValue(NOTIFICATION_PARAMS);

      await renderToCompletion();

      expect(mockRecordMeditationCompletion).toHaveBeenCalledWith(
        "test-user",
        localToday,
      );
      expect(mockRecordMeditationCompletion).not.toHaveBeenCalledWith(
        "test-user",
        "2000-01-01",
      );
    });

    it("prefers an explicit date param over today", async () => {
      mockLocalSearchParams.mockReturnValue({
        ...NOTIFICATION_PARAMS,
        date: "2026-06-14",
      });

      await renderToCompletion();

      expect(mockRecordMeditationCompletion).toHaveBeenCalledWith(
        "test-user",
        "2026-06-14",
      );
    });
  });

  describe("completion UI", () => {
    it("offers to capture thoughts once the meditation finishes", async () => {
      mockLocalSearchParams.mockReturnValue(NOTIFICATION_PARAMS);

      const { getByText } = await renderToCompletion();

      await waitFor(() => {
        expect(getByText("Capture your thoughts...")).toBeTruthy();
      });
    });
  });
});
