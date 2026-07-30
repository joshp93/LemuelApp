import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { MonthPicker } from "../../src/components/month-picker";

jest.mock("../../src/api/daily-proverbs", () => ({
  getDailyProverbsForMonth: jest.fn(),
}));

import { getDailyProverbsForMonth } from "../../src/api/daily-proverbs";

const mockGetDailyProverbsForMonth =
  getDailyProverbsForMonth as jest.MockedFunction<
    typeof getDailyProverbsForMonth
  >;

function mockDate(iso: string) {
  const fakeNow = new Date(iso).getTime();
  jest.useFakeTimers({ now: fakeNow });
}

describe("MonthPicker", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("should disable future dates even when API returns them", async () => {
    mockDate("2026-06-15T12:00:00Z");

    mockGetDailyProverbsForMonth.mockResolvedValue([
      { sk: "2026-06-14", ref: "Proverbs 14:1" },
      { sk: "2026-06-15", ref: "Proverbs 15:1" },
      { sk: "2026-06-16", ref: "Proverbs 16:1" },
    ]);

    const onSelectDay = jest.fn();
    const { getByTestId, getByText } = render(
      <MonthPicker
        visible
        onClose={jest.fn()}
        onSelectDay={onSelectDay}
        initialMonth="2026-06"
      />,
    );

    await waitFor(() => {
      expect(getByText("14")).toBeTruthy();
    });

    expect(getByTestId("day-2026-06-14")).not.toBeDisabled();
    expect(getByTestId("day-2026-06-15")).not.toBeDisabled();
    expect(getByTestId("day-2026-06-16")).toBeDisabled();

    expect(getByTestId("confirm-btn")).toBeDisabled();

    fireEvent.press(getByTestId("day-2026-06-16"));
    expect(getByTestId("confirm-btn")).toBeDisabled();
  });

  it("should allow selecting today and confirming", async () => {
    mockDate("2026-06-15T12:00:00Z");

    mockGetDailyProverbsForMonth.mockResolvedValue([
      { sk: "2026-06-15", ref: "Proverbs 15:1" },
    ]);

    const onSelectDay = jest.fn();
    const { getByTestId } = render(
      <MonthPicker
        visible
        onClose={jest.fn()}
        onSelectDay={onSelectDay}
        initialMonth="2026-06"
      />,
    );

    await waitFor(() => {
      expect(getByTestId("day-2026-06-15")).toBeTruthy();
    });

    expect(getByTestId("day-2026-06-15")).not.toBeDisabled();

    fireEvent.press(getByTestId("day-2026-06-15"));
    expect(getByTestId("confirm-btn")).not.toBeDisabled();

    fireEvent.press(getByTestId("confirm-btn"));
    expect(onSelectDay).toHaveBeenCalledWith("2026-06-15");
  });

  it("should allow selecting the last day of a month when it is today", async () => {
    mockDate("2026-05-31T12:00:00Z");

    mockGetDailyProverbsForMonth.mockResolvedValue([
      { sk: "2026-05-29", ref: "Proverbs 29:1" },
      { sk: "2026-05-30", ref: "Proverbs 30:1" },
      { sk: "2026-05-31", ref: "Proverbs 31:1" },
    ]);

    const onSelectDay = jest.fn();
    const { getByTestId } = render(
      <MonthPicker
        visible
        onClose={jest.fn()}
        onSelectDay={onSelectDay}
        initialMonth="2026-05"
      />,
    );

    await waitFor(() => {
      expect(getByTestId("day-2026-05-31")).toBeTruthy();
    });

    expect(getByTestId("day-2026-05-29")).not.toBeDisabled();
    expect(getByTestId("day-2026-05-30")).not.toBeDisabled();
    expect(getByTestId("day-2026-05-31")).not.toBeDisabled();

    fireEvent.press(getByTestId("day-2026-05-31"));
    expect(getByTestId("confirm-btn")).not.toBeDisabled();

    fireEvent.press(getByTestId("confirm-btn"));
    expect(onSelectDay).toHaveBeenCalledWith("2026-05-31");
  });

  it("should show loading indicator while fetching", async () => {
    mockDate("2026-06-01T12:00:00Z");

    let resolvePromise!: (value: { sk: string; ref: string }[]) => void;
    const promise = new Promise<{ sk: string; ref: string }[]>((resolve) => {
      resolvePromise = resolve;
    });
    mockGetDailyProverbsForMonth.mockReturnValue(promise);

    const { getByText } = render(
      <MonthPicker
        visible
        onClose={jest.fn()}
        onSelectDay={jest.fn()}
        initialMonth="2026-06"
      />,
    );

    await waitFor(() => {
      expect(getByText("June 2026")).toBeTruthy();
    });

    resolvePromise([{ sk: "2026-06-01", ref: "Proverbs 1:1" }]);
  });
});
