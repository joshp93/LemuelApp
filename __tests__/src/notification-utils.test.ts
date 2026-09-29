import {
  EXAMPLE_NOTIFICATION_ID,
  getMeditationRouteParams,
  getNotificationIdForDate,
  getRandomTimeInWindow,
  MEDITATE_ACTION_ID,
  resolveScheduleDate,
} from "../../src/notifications/notification-utils";

describe("notification constants", () => {
  it("exposes stable action and example identifiers", () => {
    expect(MEDITATE_ACTION_ID).toBe("meditate");
    expect(EXAMPLE_NOTIFICATION_ID).toBe("daily-proverb-example");
  });
});

describe("getNotificationIdForDate", () => {
  it("prefixes the date-specific identifier", () => {
    expect(getNotificationIdForDate("2026-09-17")).toBe(
      "daily-proverb-meditation-2026-09-17",
    );
  });
});

describe("getRandomTimeInWindow", () => {
  it("returns a time on the same day within the window", () => {
    const date = new Date(2026, 8, 17);
    for (let i = 0; i < 25; i++) {
      const result = getRandomTimeInWindow(date, 9, 0, 19, 0);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(8);
      expect(result.getDate()).toBe(17);
      const minutes = result.getHours() * 60 + result.getMinutes();
      expect(minutes).toBeGreaterThanOrEqual(9 * 60);
      expect(minutes).toBeLessThan(19 * 60);
    }
  });

  it("returns the window start when start and end are equal", () => {
    const date = new Date(2026, 8, 17);
    const result = getRandomTimeInWindow(date, 9, 0, 9, 0);
    expect(result.getHours()).toBe(9);
    expect(result.getMinutes()).toBe(0);
  });
});

describe("resolveScheduleDate", () => {
  it("builds a date at the given time", () => {
    const result = resolveScheduleDate("2026-09-17", 14, 30);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(8);
    expect(result.getDate()).toBe(17);
    expect(result.getHours()).toBe(14);
    expect(result.getMinutes()).toBe(30);
    expect(result.getSeconds()).toBe(0);
  });
});

describe("getMeditationRouteParams", () => {
  it("builds meditation params from valid data", () => {
    expect(
      getMeditationRouteParams({
        proverb: "Trust in the LORD",
        ref: "Proverbs 3:5",
        date: "2026-09-17",
      }),
    ).toEqual({
      pathname: "/meditation",
      params: {
        proverb: "Trust in the LORD",
        ref: "Proverbs 3:5",
        date: "2026-09-17",
      },
    });
  });

  it("omits the date when absent", () => {
    expect(
      getMeditationRouteParams({ proverb: "Trust", ref: "Proverbs 3:5" }),
    ).toEqual({
      pathname: "/meditation",
      params: { proverb: "Trust", ref: "Proverbs 3:5" },
    });
  });

  it("ignores a non-string date", () => {
    const result = getMeditationRouteParams({
      proverb: "Trust",
      ref: "Proverbs 3:5",
      date: 123,
    });
    expect(result?.params).toEqual({ proverb: "Trust", ref: "Proverbs 3:5" });
  });

  it("returns null when proverb or ref is missing", () => {
    expect(getMeditationRouteParams({ ref: "Proverbs 3:5" })).toBeNull();
    expect(getMeditationRouteParams({ proverb: "Trust" })).toBeNull();
    expect(getMeditationRouteParams({})).toBeNull();
  });
});
