/* eslint-disable @typescript-eslint/no-require-imports */
import { render } from "@testing-library/react-native";
import { ProverbCrossFade } from "../../src/components/proverb-cross-fade";

/**
 * `withTiming` deliberately never calls its completion callback here, so the
 * cross-fade stays in progress and both proverbs can be seen at once.
 */
jest.mock("react-native-reanimated", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: { View, createAnimatedComponent: (comp: any) => comp },
    View,
    createAnimatedComponent: (comp: any) => comp,
    useAnimatedStyle: () => ({}),
    useSharedValue: (initial: any) => ({ value: initial }),
    withTiming: (toValue: any) => toValue,
    runOnJS: (fn: any) => fn,
    interpolate: (_val: any, _input: any[], output: any[]) => output[0],
  };
});

const NIV = { ref: "Proverbs 3:5", proverb: "Trust in the LORD" };
const KJV = {
  ref: "Proverbs 3:5",
  proverb: "Trust in the LORD with all thine heart",
};

describe("ProverbCrossFade", () => {
  it("shows the proverb it is given", () => {
    const { getByText } = render(<ProverbCrossFade proverb={NIV} />);

    expect(getByText("Trust in the LORD")).toBeTruthy();
  });

  it("renders nothing before the first proverb arrives", () => {
    const { toJSON } = render(<ProverbCrossFade proverb={null} />);

    expect(toJSON()).toBeNull();
  });

  it("keeps the proverb on screen when the next one has not arrived", () => {
    const { getByText, rerender } = render(<ProverbCrossFade proverb={NIV} />);

    rerender(<ProverbCrossFade proverb={null} />);

    expect(getByText("Trust in the LORD")).toBeTruthy();
  });

  it("holds the old proverb in place while the new one fades in", () => {
    const { getByText, rerender } = render(<ProverbCrossFade proverb={NIV} />);

    rerender(<ProverbCrossFade proverb={KJV} />);

    expect(getByText("Trust in the LORD")).toBeTruthy();
    expect(getByText("Trust in the LORD with all thine heart")).toBeTruthy();
  });
});
