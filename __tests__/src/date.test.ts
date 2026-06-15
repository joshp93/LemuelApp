import { formatDate } from "../../src/utils/date";

describe("formatDate", () => {
  it("should format ISO date string", () => {
    const result = formatDate("2026-06-15T12:00:00.000Z");
    expect(result).toContain("15");
    expect(result).toContain("2026");
  });

  it("should return invalid date string if it cannot be parsed", () => {
    expect(formatDate("not-a-date")).toBe("Invalid Date");
  });
});
