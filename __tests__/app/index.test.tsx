import { render } from "@testing-library/react-native";
import { useProverbForTheDay } from "../../src/hooks/useProverbForTheDay";
import { updateProverbWidget } from "../../src/widgets";
import Index from "../../app/index";

jest.mock("../../src/hooks/useProverbForTheDay");
jest.mock("../../src/widgets", () => ({
  updateProverbWidget: jest.fn(),
}));

jest.mock("react-native-safe-area-context", () => ({
  ...jest.requireActual("react-native-safe-area-context"),
  useSafeAreaInsets: () => ({ top: 47, left: 0, right: 0, bottom: 34 }),
}));

const mockRouterPush = jest.fn();
jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ push: mockRouterPush }),
}));

const mockUseProverbForTheDay = useProverbForTheDay as jest.MockedFunction<
  typeof useProverbForTheDay
>;
const mockUpdateProverbWidget = updateProverbWidget as jest.MockedFunction<
  typeof updateProverbWidget
>;

describe("Index", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render loading state", () => {
    mockUseProverbForTheDay.mockReturnValue({
      proverb: null,
      loading: true,
      error: null,
    });

    const { getByText } = render(<Index />);

    expect(getByText("Loading proverb...")).toBeTruthy();
  });

  it("should render error state", () => {
    mockUseProverbForTheDay.mockReturnValue({
      proverb: null,
      loading: false,
      error: "Failed to load proverb",
    });

    const { getByText } = render(<Index />);

    expect(getByText("Failed to load proverb")).toBeTruthy();
  });

  it("should render proverb card when loaded", () => {
    const mockProverb = {
      ref: "Proverbs 3:5",
      proverb: "Trust in the LORD with all your heart",
    };
    mockUseProverbForTheDay.mockReturnValue({
      proverb: mockProverb,
      loading: false,
      error: null,
    });

    const { getByText } = render(<Index />);

    expect(getByText("Trust in the LORD with all your heart")).toBeTruthy();
  });

  it("should render citation when provided", () => {
    const mockProverb = {
      ref: "Proverbs 3:5",
      proverb: "Trust in the LORD with all your heart",
      citation: "King James Version (KJV)",
    };
    mockUseProverbForTheDay.mockReturnValue({
      proverb: mockProverb,
      loading: false,
      error: null,
    });

    const { getByText } = render(<Index />);

    expect(getByText("King James Version (KJV)")).toBeTruthy();
  });

  it("should update widget when proverb loads", () => {
    const mockProverb = {
      ref: "Proverbs 3:5",
      proverb: "Trust in the LORD with all your heart",
    };
    mockUseProverbForTheDay.mockReturnValue({
      proverb: mockProverb,
      loading: false,
      error: null,
    });

    render(<Index />);

    expect(mockUpdateProverbWidget).toHaveBeenCalledWith(mockProverb);
  });

  it("should not update widget when still loading", () => {
    mockUseProverbForTheDay.mockReturnValue({
      proverb: null,
      loading: true,
      error: null,
    });

    render(<Index />);

    expect(mockUpdateProverbWidget).not.toHaveBeenCalled();
  });

  it("should not update widget on error", () => {
    mockUseProverbForTheDay.mockReturnValue({
      proverb: null,
      loading: false,
      error: "Failed to load",
    });

    render(<Index />);

    expect(mockUpdateProverbWidget).not.toHaveBeenCalled();
  });
});