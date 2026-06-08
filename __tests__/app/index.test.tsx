/* eslint-disable @typescript-eslint/no-require-imports */
import { act, render, waitFor } from "@testing-library/react-native";
import { AppState } from "react-native";
import Index from "../../app/index";
import { getProverbNotes } from "../../src/api/notes";
import { useProverbForTheDay } from "../../src/hooks/useProverbForTheDay";
import { updateProverbWidget } from "../../src/widgets";

let appStateCallback: ((state: string) => void) | null = null;

jest.mock("../../src/hooks/useProverbForTheDay");
jest.mock("../../src/widgets", () => ({
  updateProverbWidget: jest.fn(),
}));
jest.mock("../../src/api/notes", () => ({
  ...jest.requireActual("../../src/api/notes"),
  getProverbNotes: jest.fn(),
}));

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
  Stack: { Screen: () => null },
  useRouter: () => ({ push: jest.fn() }),
}));

const mockUseProverbForTheDay = useProverbForTheDay as jest.MockedFunction<
  typeof useProverbForTheDay
>;
const mockUpdateProverbWidget = updateProverbWidget as jest.MockedFunction<
  typeof updateProverbWidget
>;
const mockGetProverbNotes = getProverbNotes as jest.MockedFunction<
  typeof getProverbNotes
>;

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
  changeVersion: jest.fn(),
  refresh: jest.fn(),
};

describe("Index", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: null });
    mockGetProverbNotes.mockResolvedValue({ items: [] });
    appStateCallback = null;
    jest
      .spyOn(AppState, "addEventListener")
      .mockImplementation(
        (event: string, callback: (state: string) => void) => {
          if (event === "change") appStateCallback = callback;
          return { remove: jest.fn() };
        },
      );
  });

  it("should render loading state", () => {
    mockUseProverbForTheDay.mockReturnValue(defaultHookReturn);

    const { getByText } = render(<Index />);

    expect(getByText("Loading proverb...")).toBeTruthy();
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

  it("should render proverb card when loaded", () => {
    mockUseProverbForTheDay.mockReturnValue({
      ...defaultHookReturn,
      loading: false,
      proverb: mockProverb,
    });

    const { getByText } = render(<Index />);

    expect(getByText("Trust in the LORD with all your heart")).toBeTruthy();
  });

  it("should render citation when provided", () => {
    mockUseProverbForTheDay.mockReturnValue({
      ...defaultHookReturn,
      loading: false,
      proverb: {
        ...mockProverb,
        citation: "King James Version (KJV)",
      },
    });

    const { getByText } = render(<Index />);

    expect(getByText("King James Version (KJV)")).toBeTruthy();
  });

  it("should update widget when proverb loads", () => {
    mockUseProverbForTheDay.mockReturnValue({
      ...defaultHookReturn,
      loading: false,
      proverb: mockProverb,
    });

    render(<Index />);

    expect(mockUpdateProverbWidget).toHaveBeenCalledWith(mockProverb);
  });

  it("should not update widget when still loading", () => {
    mockUseProverbForTheDay.mockReturnValue(defaultHookReturn);

    render(<Index />);

    expect(mockUpdateProverbWidget).not.toHaveBeenCalled();
  });

  it("should not update widget on error", () => {
    mockUseProverbForTheDay.mockReturnValue({
      ...defaultHookReturn,
      loading: false,
      error: "Failed to load",
    });

    render(<Index />);

    expect(mockUpdateProverbWidget).not.toHaveBeenCalled();
  });

  it("should render Start Meditation button when proverb is loaded", () => {
    mockUseProverbForTheDay.mockReturnValue({
      ...defaultHookReturn,
      loading: false,
      proverb: mockProverb,
    });

    const { getByText } = render(<Index />);

    expect(getByText("Start Meditation")).toBeTruthy();
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
          note: "<p>My meditation note</p>",
          dateCreated: "2026-06-02T12:00:00.000Z",
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

    const { getByText } = render(<Index />);

    await waitFor(() => {
      expect(getByText("<p>My meditation note</p>")).toBeTruthy();
    });
  });

  it("should refresh proverb and notes on foreground", async () => {
    const mockRefresh = jest.fn();
    mockUseAuth.mockReturnValue({ user: { userId: "user-1" } });
    mockUseProverbForTheDay.mockReturnValue({
      ...defaultHookReturn,
      loading: false,
      proverb: mockProverb,
      refresh: mockRefresh,
    });

    render(<Index />);

    await waitFor(() => {
      expect(mockGetProverbNotes).toHaveBeenCalledTimes(1);
    });

    await act(() => {
      appStateCallback?.("active");
    });

    expect(mockRefresh).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(mockGetProverbNotes).toHaveBeenCalledTimes(2);
    });
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

    const listener = (AppState.addEventListener as jest.Mock).mock.results[0]
      .value;
    unmount();

    expect(listener.remove).toHaveBeenCalled();
  });
});
