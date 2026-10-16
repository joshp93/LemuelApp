import { fireEvent, render } from "@testing-library/react-native";
import ReactionBar from "../../src/components/reaction-bar";

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light" },
}));

jest.mock("react-native-reanimated", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: { View, createAnimatedComponent: (comp: any) => comp },
    View,
    createAnimatedComponent: (comp: any) => comp,
    useAnimatedStyle: () => ({}),
    useSharedValue: (initial: any) => ({ value: initial }),
    withTiming: (toValue: any, _config?: any, callback?: any) => {
      callback?.(true);
      return toValue;
    },
    withSequence: (...values: any[]) => values[values.length - 1],
    withSpring: (toValue: any) => toValue,
    runOnJS: (fn: any) => fn,
  };
});

function renderBar(
  overrides: Partial<{
    reactionCounts: Record<string, number>;
    userReaction: string | null;
    onReactionChange: (emoji: string | null) => Promise<void>;
  }> = {},
) {
  const onReactionChange = jest.fn().mockResolvedValue(undefined);

  const rendered = render(
    <ReactionBar
      reactionCounts={overrides.reactionCounts ?? {}}
      userReaction={overrides.userReaction ?? null}
      onReactionChange={overrides.onReactionChange ?? onReactionChange}
    />,
  );

  return { ...rendered, onReactionChange };
}

/** Opens the picker and presses one of its emoji. */
function pickEmoji(getByTestId: (id: string) => unknown, emoji: string): void {
  fireEvent.press(getByTestId("reaction-picker") as never);
  fireEvent.press(getByTestId(`reaction-option-${emoji}`) as never);
}

describe("ReactionBar", () => {
  it("shows only the emoji that have been used", () => {
    const { queryByText, getByText } = renderBar({
      reactionCounts: { "🙏": 3, "👍": 0 },
    });

    expect(getByText("🙏")).toBeTruthy();
    expect(getByText("3")).toBeTruthy();
    expect(queryByText("👍")).toBeNull();
  });

  it("leaves the emoji out until the picker is opened", () => {
    const { queryByText } = renderBar();

    expect(queryByText("❤️")).toBeNull();
  });

  it("reports the chosen emoji straight away", () => {
    const { onReactionChange, getByTestId } = renderBar();

    pickEmoji(getByTestId, "🙏");

    expect(onReactionChange).toHaveBeenCalledWith("🙏");
  });

  it("reports the same emoji again as removing it", () => {
    const { onReactionChange, getByTestId } = renderBar({
      userReaction: "🙏",
      reactionCounts: { "🙏": 1 },
    });

    pickEmoji(getByTestId, "🙏");

    expect(onReactionChange).toHaveBeenCalledWith(null);
  });

  it("reports a different emoji as a change", () => {
    const { onReactionChange, getByTestId } = renderBar({
      userReaction: "🙏",
      reactionCounts: { "🙏": 1 },
    });

    pickEmoji(getByTestId, "❤️");

    expect(onReactionChange).toHaveBeenCalledWith("❤️");
  });

  it("does not wait for the server before reporting", () => {
    const onReactionChange = jest.fn().mockReturnValue(new Promise(() => {}));
    const { getByTestId } = renderBar({ onReactionChange });

    pickEmoji(getByTestId, "👍");

    expect(onReactionChange).toHaveBeenCalledTimes(1);
  });
});
