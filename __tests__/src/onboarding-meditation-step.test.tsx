import { act, fireEvent, render } from "@testing-library/react-native";
import { MeditationStep } from "../../src/components/onboarding/meditation-step";

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

jest.mock("react-native-reanimated", () => {
  const { View } = require("react-native");
  const Reanimated = {
    View,
    createAnimatedComponent: (component: unknown) => component,
    useAnimatedStyle: () => ({}),
    useDerivedValue: (fn: () => unknown) => ({ value: fn() }),
    useSharedValue: (initial: unknown) => ({ value: initial }),
    withTiming: (
      toValue: unknown,
      config?: unknown,
      callback?: (finished: boolean) => void,
    ) => mockWithTiming(toValue, config, callback),
    withDelay: (_delay: number, animation: unknown) => animation,
    runOnJS: (fn: (...args: unknown[]) => unknown) => fn,
    cancelAnimation: jest.fn(),
  };

  return { __esModule: true, default: Reanimated, ...Reanimated };
});

jest.mock("../../src/components/meditation-canvas", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("../../src/hooks/useDeviceTier", () => ({
  useDeviceTier: () => "high",
}));

jest.mock("../../src/hooks/useFitFontSize", () => ({
  useFitFontSize: () => ({ fontSize: 22, onTextLayout: jest.fn() }),
}));

describe("MeditationStep", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows the explanation immediately and the Next button only after the outline fills", () => {
    const onNext = jest.fn();
    const { getByText, queryByText } = render(
      <MeditationStep onNext={onNext} />,
    );

    expect(getByText(/This is the meditation screen\./)).toBeTruthy();
    expect(getByText(/This screen is designed/)).toBeTruthy();
    expect(queryByText("Next")).toBeNull();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockWithTiming).toHaveBeenCalledWith(
      1,
      { duration: 3000 },
      expect.any(Function),
    );
    expect(getByText("Next")).toBeTruthy();

    fireEvent.press(getByText("Next"));
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
