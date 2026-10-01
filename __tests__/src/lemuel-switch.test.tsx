import { fireEvent, render } from "@testing-library/react-native";
import { Platform, Switch } from "react-native";
import { LemuelSwitch } from "../../src/components/lemuel-switch";

/**
 * The component branches on `Platform.OS` to add the props react-native-web
 * reads, so the tests pin it to `web` and restore it afterwards.
 */
const platform = Platform as unknown as { OS: string };
const originalOS = platform.OS;

beforeAll(() => {
  platform.OS = "web";
});

afterAll(() => {
  platform.OS = originalOS;
});

/**
 * Renders the switch and returns the props it passes down to `Switch`, which is
 * the component's actual contract — `Switch` rewrites the colour props before
 * they reach the host element.
 *
 * @param props - Overrides for the switch props.
 * @returns The rendering result and the props handed to `Switch`.
 */
function renderSwitch(props: Partial<Parameters<typeof LemuelSwitch>[0]>) {
  const utils = render(
    <LemuelSwitch
      testID="switch"
      value={false}
      onValueChange={jest.fn()}
      {...props}
    />,
  );

  return { ...utils, switchProps: utils.UNSAFE_getByType(Switch).props };
}

describe("LemuelSwitch", () => {
  it("renders the on state with the standard colours", () => {
    const { switchProps } = renderSwitch({ value: true });

    expect(switchProps.value).toBe(true);
    expect(switchProps.trackColor).toEqual({
      false: "#d3d3d3",
      true: "black",
    });
    expect(switchProps.thumbColor).toBe("black");
    expect(switchProps.disabled).toBe(false);
  });

  it("renders the off state with the standard colours", () => {
    const { switchProps } = renderSwitch({ value: false });

    expect(switchProps.value).toBe(false);
    expect(switchProps.trackColor).toEqual({
      false: "#d3d3d3",
      true: "black",
    });
    expect(switchProps.thumbColor).toBe("#f4f3f4");
  });

  it("passes the on-state colours through the props react-native-web reads", () => {
    const { switchProps } = renderSwitch({ value: true });

    expect(switchProps.activeThumbColor).toBe("black");
    expect(switchProps.activeTrackColor).toBe("black");
  });

  it("greys the switch out and fades it when disabled", () => {
    const { switchProps } = renderSwitch({ value: true, disabled: true });

    expect(switchProps.disabled).toBe(true);
    expect(switchProps.trackColor).toEqual({
      false: "#9e9e9e",
      true: "#9e9e9e",
    });
    expect(switchProps.thumbColor).toBe("#9e9e9e");
    expect(switchProps.activeThumbColor).toBe("#9e9e9e");
    expect(switchProps.activeTrackColor).toBe("#9e9e9e");
    expect(switchProps.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ opacity: 0.5 })]),
    );
  });

  it("greys out the disabled off state too", () => {
    const { switchProps } = renderSwitch({ value: false, disabled: true });

    expect(switchProps.thumbColor).toBe("#9e9e9e");
    expect(switchProps.activeThumbColor).toBe("#9e9e9e");
    expect(switchProps.activeTrackColor).toBe("#9e9e9e");
  });

  it("does not fade the switch while it is enabled", () => {
    const { switchProps } = renderSwitch({ value: true });

    expect(switchProps.style).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ opacity: 0.5 })]),
    );
  });

  it("forwards value changes", () => {
    const onValueChange = jest.fn();
    const { UNSAFE_getByType } = renderSwitch({ onValueChange });

    fireEvent(UNSAFE_getByType(Switch), "valueChange", true);

    expect(onValueChange).toHaveBeenCalledWith(true);
  });
});
