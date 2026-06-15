import { pad } from "../../src/utils/format";

describe("pad", () => {
  it("should pad single digit number", () => {
    expect(pad(5)).toBe("05");
  });

  it("should not pad two-digit number", () => {
    expect(pad(12)).toBe("12");
  });

  it("should handle zero", () => {
    expect(pad(0)).toBe("00");
  });
});
