import { fireEvent, render } from "@testing-library/react-native";
import { TimePicker } from "../../src/components/time-picker";

jest.mock("@react-native-community/datetimepicker", () => {
  const React = require("react");
  const { Pressable, View } = require("react-native");
  const DateTimePicker = ({
    value,
    onValueChange,
  }: {
    value: Date;
    onValueChange: (event: unknown, date: Date) => void;
  }) =>
    React.createElement(
      View,
      {
        testID: "date-time-picker",
        accessibilityValue: {
          text: `${value.getHours()}:${value.getMinutes()}`,
        },
      },
      React.createElement(Pressable, {
        testID: "picker-confirm",
        onPress: () => onValueChange({}, value),
      }),
    );
  return { __esModule: true, default: DateTimePicker };
});

describe("TimePicker", () => {
  const noop = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows midnight as 00:00 rather than the 09:00 fallback", () => {
    const { getByText } = render(
      <TimePicker
        mode="scheduled"
        hour="0"
        minute="0"
        onHourChange={noop}
        onMinuteChange={noop}
      />,
    );

    expect(getByText("00:00")).toBeTruthy();
  });

  it("opens the picker at midnight rather than 09:00", () => {
    const { getByText, getByTestId } = render(
      <TimePicker
        mode="scheduled"
        hour="0"
        minute="30"
        onHourChange={noop}
        onMinuteChange={noop}
      />,
    );

    fireEvent.press(getByText("00:30"));

    expect(getByTestId("date-time-picker").props.accessibilityValue.text).toBe(
      "0:30",
    );
  });

  it("opens the end picker at midnight when the window ends at 00:00", () => {
    const { getByText, getByTestId } = render(
      <TimePicker
        mode="random"
        hour="9"
        minute="0"
        endHour="0"
        endMinute="0"
        onHourChange={noop}
        onMinuteChange={noop}
        onEndHourChange={noop}
        onEndMinuteChange={noop}
      />,
    );

    expect(getByText("09:00")).toBeTruthy();
    expect(getByText("00:00")).toBeTruthy();

    fireEvent.press(getByText("00:00"));

    expect(getByTestId("date-time-picker").props.accessibilityValue.text).toBe(
      "0:0",
    );
  });

  it("falls back to the defaults when hours are missing", () => {
    const { getByText, getByTestId } = render(
      <TimePicker
        mode="random"
        hour="9"
        minute="0"
        onHourChange={noop}
        onMinuteChange={noop}
      />,
    );

    expect(getByText("19:00")).toBeTruthy();

    fireEvent.press(getByText("19:00"));

    expect(getByTestId("date-time-picker").props.accessibilityValue.text).toBe(
      "19:0",
    );
  });

  it("warns when the window start is not before the end", () => {
    const { getByText, queryByText, rerender } = render(
      <TimePicker
        mode="random"
        hour="9"
        minute="0"
        endHour="19"
        endMinute="0"
        onHourChange={noop}
        onMinuteChange={noop}
        onEndHourChange={noop}
        onEndMinuteChange={noop}
      />,
    );

    expect(queryByText("Start time must be before end time")).toBeNull();

    rerender(
      <TimePicker
        mode="random"
        hour="0"
        minute="0"
        endHour="0"
        endMinute="0"
        onHourChange={noop}
        onMinuteChange={noop}
        onEndHourChange={noop}
        onEndMinuteChange={noop}
      />,
    );

    expect(getByText("Start time must be before end time")).toBeTruthy();
  });

  it('reports a picked midnight as the string "0"', () => {
    const onHourChange = jest.fn();
    const onMinuteChange = jest.fn();

    const { getByText, getByTestId } = render(
      <TimePicker
        mode="scheduled"
        hour="0"
        minute="15"
        onHourChange={onHourChange}
        onMinuteChange={onMinuteChange}
      />,
    );

    fireEvent.press(getByText("00:15"));
    fireEvent.press(getByTestId("picker-confirm"));

    expect(onHourChange).toHaveBeenCalledWith("0");
    expect(onMinuteChange).toHaveBeenCalledWith("15");
  });

  it("reports the picked end time through the end handlers", () => {
    const onEndHourChange = jest.fn();
    const onEndMinuteChange = jest.fn();

    const { getByText, getByTestId } = render(
      <TimePicker
        mode="random"
        hour="9"
        minute="0"
        endHour="19"
        endMinute="45"
        onHourChange={noop}
        onMinuteChange={noop}
        onEndHourChange={onEndHourChange}
        onEndMinuteChange={onEndMinuteChange}
      />,
    );

    fireEvent.press(getByText("19:45"));
    fireEvent.press(getByTestId("picker-confirm"));

    expect(onEndHourChange).toHaveBeenCalledWith("19");
    expect(onEndMinuteChange).toHaveBeenCalledWith("45");
  });
});
