/* eslint-disable @typescript-eslint/no-require-imports */
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import {
  AppState,
  type AppStateEvent,
  type AppStateStatus,
  type NativeEventSubscription,
} from "react-native";
import Index from "../../app/index";
import {
  getProverbNotes,
  getReactions,
  putReaction,
} from "../../src/api/notes";
import { useProverbForTheDay } from "../../src/hooks/useProverbForTheDay";

let appStateCallback: ((state: AppStateStatus) => void) | null = null;

jest.mock("react-native-reanimated", () => {
  const { View } = require("react-native");
  const Reanimated = {
    View,
    Text: require("react-native").Text,
    Image: require("react-native").Image,
    ScrollView: require("react-native").ScrollView,
    FlatList: require("react-native").FlatList,
  };
  return {
    __esModule: true,
    default: {
      ...Reanimated,
      createAnimatedComponent: (comp: any) => comp,
    },
    ...Reanimated,
    createAnimatedComponent: (comp: any) => comp,
    useAnimatedStyle: () => ({}),
    useDerivedValue: (fn: any) => ({ value: fn() }),
    useSharedValue: (initial: any) => ({ value: initial }),
    useClock: () => ({ value: 0 }),
    useCanvasSize: () => ({ ref: { current: null } }),
    withTiming: (_toValue: any, _config?: any, callback?: any) => {
      callback?.(true);
      return _toValue;
    },
    withSpring: (toValue: any) => toValue,
    withDecay: () => 0,
    runOnJS: (fn: any) => fn,
    runOnUI: (fn: any) => fn,
    measure: () => ({ x: 0, y: 0, width: 0, height: 0 }),
    interpolate: (_val: any, _input: any[], output: any[]) => output[0],
    Extrapolate: { CLAMP: "clamp" },
    Easing: { in: (e: any) => e, out: (e: any) => e, inOut: (e: any) => e },
    Transition: { Together: "Together", Out: "Out", In: "In" },
    processColor: (c: any) => c,
  };
});

jest.mock("../../src/hooks/useProverbForTheDay");
jest.mock("../../src/widgets", () => ({
  updateProverbWidget: jest.fn(),
  initializeWidget: jest.fn(),
}));
jest.mock("../../src/api/notes", () => ({
  ...jest.requireActual("../../src/api/notes"),
  getProverbNotes: jest.fn(),
  getReactions: jest.fn(),
  putReaction: jest.fn(),
  deleteReaction: jest.fn(),
}));

jest.mock("../../src/components/reaction-bar", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ userReaction, reactionCounts, onReactionChange }: any) =>
      React.createElement(
        Pressable,
        {
          testID: "react-pray",
          onPress: () => onReactionChange("🙏"),
        },
        React.createElement(
          Text,
          null,
          `${userReaction ?? "none"}|${reactionCounts["🙏"] ?? 0}`,
        ),
      ),
  };
});

const mockUseAuth = jest.fn().mockReturnValue({ user: null });
jest.mock("../../src/auth/auth-context", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("react-native-render-html", () => {
  const { Text } = require("react-native");
  return ({ source }: { source: { html: string } }) => (
    <Text>{source.html}</Text>
  );
});

jest.mock("expo-router", () => ({
  useFocusEffect: jest.fn(),
  Stack: { Screen: () => null },
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useNavigation: () => ({
    addListener: jest.fn(() => jest.fn()),
  }),
  useLocalSearchParams: () => ({ date: undefined }),
}));

const mockUseProverbForTheDay = useProverbForTheDay as jest.MockedFunction<
  typeof useProverbForTheDay
>;
const mockGetProverbNotes = getProverbNotes as jest.MockedFunction<
  typeof getProverbNotes
>;
const mockGetReactions = getReactions as jest.MockedFunction<
  typeof getReactions
>;
const mockPutReaction = putReaction as jest.MockedFunction<typeof putReaction>;

const mockProverb = {
  ref: "Proverbs 3:5",
  proverb: "Trust in the LORD with all your heart",
};

const defaultHookReturn = {
  proverb: null as typeof mockProverb | null,
  loading: true,
  error: null as string | null,
  selectedVersion: null as string | null,
  availableVersions: [] as string[],
  date: undefined as string | undefined,
  changeVersion: jest.fn(),
  goToDate: jest.fn(),
};

describe("Index", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: null });
    mockGetProverbNotes.mockResolvedValue({ items: [] });
    mockGetReactions.mockResolvedValue({ reactionCounts: {}, reactions: [] });
    mockPutReaction.mockResolvedValue(undefined);
    appStateCallback = null;
    jest
      .spyOn(AppState, "addEventListener")
      .mockImplementation(
        (
          event: AppStateEvent,
          callback: (state: AppStateStatus) => void,
        ): NativeEventSubscription => {
          if (event === "change") appStateCallback = callback;
          return { remove: jest.fn() };
        },
      );
  });

  it("should render loading state", () => {
    mockUseProverbForTheDay.mockReturnValue(defaultHookReturn);

    const { getByTestId } = render(<Index />);

    expect(getByTestId("lemuel-loading")).toBeTruthy();
  });

  it("should render error state", () => {
    mockUseProverbForTheDay.mockReturnValue({
      ...defaultHookReturn,
      loading: false,
      error: "Failed to load proverb",
    });

    const { getByText } = render(<Index />);

    expect(getByText("Failed to load proverb")).toBeTruthy();
  });

  it("should render proverb card when loaded", async () => {
    mockUseProverbForTheDay.mockReturnValue({
      ...defaultHookReturn,
      loading: false,
      proverb: mockProverb,
    });

    const { getByText } = render(<Index />);

    await waitFor(() => {
      expect(getByText("Trust in the LORD with all your heart")).toBeTruthy();
    });
  });

  it("should render citation when provided", async () => {
    mockUseProverbForTheDay.mockReturnValue({
      ...defaultHookReturn,
      loading: false,
      proverb: {
        ...mockProverb,
        citation: "King James Version (KJV)",
      },
    });

    const { getByText } = render(<Index />);

    await waitFor(() => {
      expect(getByText("King James Version (KJV)")).toBeTruthy();
    });
  });

  it("should render loading state when proverb is loading", () => {
    const { getByTestId } = render(<Index />);

    expect(getByTestId("lemuel-loading")).toBeTruthy();
  });

  it("should render error message on error", () => {
    mockUseProverbForTheDay.mockReturnValue({
      ...defaultHookReturn,
      loading: false,
      error: "Failed to load",
    });

    const { getByText } = render(<Index />);

    expect(getByText("Failed to load")).toBeTruthy();
  });

  it("should render Start Meditation button when proverb is loaded", async () => {
    mockUseProverbForTheDay.mockReturnValue({
      ...defaultHookReturn,
      loading: false,
      proverb: mockProverb,
    });

    const { getByText } = render(<Index />);

    await waitFor(() => {
      expect(getByText("Start meditation")).toBeTruthy();
    });
  });

  it("should not show meditations section when user is not logged in", () => {
    mockUseAuth.mockReturnValue({ user: null });
    mockUseProverbForTheDay.mockReturnValue({
      ...defaultHookReturn,
      loading: false,
      proverb: mockProverb,
    });

    const { queryByText } = render(<Index />);

    expect(queryByText("Meditations")).toBeNull();
  });

  it("should show meditations section when user is logged in", async () => {
    mockUseAuth.mockReturnValue({ user: { userId: "user-1" } });
    mockUseProverbForTheDay.mockReturnValue({
      ...defaultHookReturn,
      loading: false,
      proverb: mockProverb,
    });

    const { getByText } = render(<Index />);

    await waitFor(() => {
      expect(getByText("Meditations")).toBeTruthy();
    });
  });

  it("should show no meditations yet when notes are empty", async () => {
    mockUseAuth.mockReturnValue({ user: { userId: "user-1" } });
    mockGetProverbNotes.mockResolvedValue({ items: [] });
    mockUseProverbForTheDay.mockReturnValue({
      ...defaultHookReturn,
      loading: false,
      proverb: mockProverb,
    });

    const { getByText } = render(<Index />);

    await waitFor(() => {
      expect(getByText("No meditations yet")).toBeTruthy();
    });
  });

  it("should render note content when notes are available", async () => {
    mockUseAuth.mockReturnValue({ user: { userId: "user-1" } });
    mockGetProverbNotes.mockResolvedValue({
      items: [
        {
          pk: "uuid-1",
          sk: "Proverbs3:5",
          displayName: "Proverbs 3:5",
          note: "<p>My meditation note</p>",
          dateCreated: "2026-06-02T12:00:00.000Z",
          date: "2026-06-02T12:00:00.000Z",
          uuid: "uuid-1",
          ref: "Proverbs3:5",
        },
      ],
    });
    mockUseProverbForTheDay.mockReturnValue({
      ...defaultHookReturn,
      loading: false,
      proverb: mockProverb,
    });

    const { getAllByText } = render(<Index />);

    await waitFor(() => {
      const elements = getAllByText("<p>My meditation note</p>");
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("should refresh proverb and notes on foreground", async () => {
    mockUseAuth.mockReturnValue({ user: { userId: "user-1" } });
    const mockGoToDate = jest.fn();
    mockUseProverbForTheDay.mockReturnValue({
      ...defaultHookReturn,
      loading: false,
      proverb: mockProverb,
      goToDate: mockGoToDate,
    });

    render(<Index />);

    await waitFor(() => {
      expect(mockGetProverbNotes).toHaveBeenCalledTimes(1);
    });

    await act(() => {
      appStateCallback?.("active");
    });

    expect(mockGoToDate).toHaveBeenCalledWith(undefined);
  });

  it("should register AppState listener on mount and remove on unmount", () => {
    mockUseProverbForTheDay.mockReturnValue({
      ...defaultHookReturn,
      loading: false,
      proverb: mockProverb,
    });

    const { unmount } = render(<Index />);

    expect(AppState.addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
    expect(appStateCallback).toBeTruthy();

    const listener = (
      AppState.addEventListener as jest.MockedFunction<
        typeof AppState.addEventListener
      >
    ).mock.results[0].value;
    unmount();

    expect(listener.remove).toHaveBeenCalled();
  });

  describe("reactions", () => {
    const NOTE = {
      pk: "uuid-1",
      sk: "Proverbs3:5",
      displayName: "Proverbs 3:5",
      note: "<p>My meditation note</p>",
      dateCreated: "2026-06-02T12:00:00.000Z",
      date: "2026-06-02",
      uuid: "uuid-1",
      ref: "Proverbs3:5",
    };

    /** Renders the screen with one note by a signed-in user. */
    function renderWithNote() {
      mockUseAuth.mockReturnValue({ user: { userId: "user-1" } });
      mockGetProverbNotes.mockResolvedValue({ items: [NOTE] });
      mockUseProverbForTheDay.mockReturnValue({
        ...defaultHookReturn,
        loading: false,
        proverb: mockProverb,
      });

      return render(<Index />);
    }

    /** Presses the note's reaction control once its note has rendered. */
    async function pressReaction(
      getAllByTestId: (id: string) => unknown[],
    ): Promise<void> {
      await waitFor(() => {
        expect(getAllByTestId("react-pray").length).toBeGreaterThan(0);
      });
      fireEvent.press(getAllByTestId("react-pray")[0] as never);
    }

    it("shows the reaction before the server has answered", async () => {
      mockPutReaction.mockReturnValue(new Promise(() => {}));

      const { getAllByTestId, getAllByText } = renderWithNote();

      await pressReaction(getAllByTestId);

      await waitFor(() => {
        expect(getAllByText("🙏|1").length).toBeGreaterThan(0);
      });
    });

    it("settles on the counts the server reports", async () => {
      mockGetReactions
        .mockResolvedValueOnce({ reactionCounts: {}, reactions: [] })
        .mockResolvedValueOnce({
          reactionCounts: { "🙏": 5 },
          userReaction: "🙏",
          reactions: [],
        });

      const { getAllByTestId, getAllByText } = renderWithNote();

      await pressReaction(getAllByTestId);

      await waitFor(() => {
        expect(getAllByText("🙏|5").length).toBeGreaterThan(0);
      });
    });

    it("takes the reaction back when the write fails", async () => {
      let rejectWrite!: (error: Error) => void;
      mockPutReaction.mockReturnValue(
        new Promise((_resolve, reject) => {
          rejectWrite = reject;
        }),
      );

      const { getAllByTestId, getAllByText } = renderWithNote();

      await pressReaction(getAllByTestId);

      await waitFor(() => {
        expect(getAllByText("🙏|1").length).toBeGreaterThan(0);
      });

      await act(async () => {
        rejectWrite(new Error("offline"));
      });

      await waitFor(() => {
        expect(getAllByText("none|0").length).toBeGreaterThan(0);
      });
    });
  });
});
