import { act, renderHook, waitFor } from "@testing-library/react-native";
import { useMeditationTimer } from "../../src/hooks/useMeditationTimer";
import { getMeditationDuration } from "../../src/settings/meditation-preferences";

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

jest.mock("react-native-reanimated", () => ({
  __esModule: true,
  useSharedValue: (initial: unknown) => ({ value: initial }),
  withTiming: (...args: unknown[]) =>
    (mockWithTiming as (...a: unknown[]) => unknown)(...args),
  runOnJS: (fn: unknown) => fn,
}));

jest.mock("../../src/settings/meditation-preferences", () => ({
  getMeditationDuration: jest.fn(),
}));

const mockGetMeditationDuration = getMeditationDuration as jest.MockedFunction<
  typeof getMeditationDuration
>;

describe("useMeditationTimer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not start until the stored duration has loaded", async () => {
    let resolveDuration!: (ms: number) => void;
    mockGetMeditationDuration.mockReturnValue(
      new Promise<number>((resolve) => {
        resolveDuration = resolve;
      }),
    );
    const onStart = jest.fn();

    renderHook(() =>
      useMeditationTimer({ ready: true, onStart, onComplete: jest.fn() }),
    );

    await act(async () => {});
    expect(onStart).not.toHaveBeenCalled();
    expect(mockWithTiming).not.toHaveBeenCalled();

    await act(async () => {
      resolveDuration(600000);
    });

    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("runs for the configured duration when the proverb is already ready", async () => {
    mockGetMeditationDuration.mockResolvedValue(600000);
    const onComplete = jest.fn();

    const { result } = renderHook(() =>
      useMeditationTimer({ ready: true, onStart: jest.fn(), onComplete }),
    );

    await waitFor(() => {
      expect(result.current.isComplete).toBe(true);
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
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("waits for readiness before starting", async () => {
    mockGetMeditationDuration.mockResolvedValue(60000);
    const onStart = jest.fn();

    const { rerender } = renderHook(
      ({ ready }: { ready: boolean }) =>
        useMeditationTimer({ ready, onStart, onComplete: jest.fn() }),
      { initialProps: { ready: false } },
    );

    await act(async () => {});
    expect(onStart).not.toHaveBeenCalled();

    rerender({ ready: true });

    await waitFor(() => {
      expect(onStart).toHaveBeenCalledTimes(1);
    });
  });

  it("starts and finishes only once even when a callback identity changes", async () => {
    mockGetMeditationDuration.mockResolvedValue(60000);
    const first = jest.fn();
    const second = jest.fn();
    const onStart = jest.fn();

    const { rerender, result } = renderHook(
      ({ onComplete }: { onComplete: () => void }) =>
        useMeditationTimer({ ready: true, onStart, onComplete }),
      { initialProps: { onComplete: first } },
    );

    await waitFor(() => {
      expect(result.current.isComplete).toBe(true);
    });

    rerender({ onComplete: second });
    await act(async () => {});

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
  });

  it("fades the text in over one second once started", async () => {
    mockGetMeditationDuration.mockResolvedValue(60000);

    renderHook(() =>
      useMeditationTimer({ ready: true, onComplete: jest.fn() }),
    );

    await waitFor(() => {
      expect(mockWithTiming).toHaveBeenCalledWith(1, { duration: 1000 });
    });
  });

  it("exposes zeroed timing values before it starts", () => {
    mockGetMeditationDuration.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() =>
      useMeditationTimer({ ready: false, onComplete: jest.fn() }),
    );

    expect(result.current.progress.value).toBe(0);
    expect(result.current.textOpacity.value).toBe(0);
    expect(result.current.isComplete).toBe(false);
  });
});
