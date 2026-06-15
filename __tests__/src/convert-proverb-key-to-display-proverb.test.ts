import { convertProverbKeyToDisplayProverb } from "../../src/utils/convertProverbKeyToDisplayProverb";

describe("convertProverbKeyToDisplayProverb", () => {
  it("should add space between book name and chapter number", () => {
    expect(convertProverbKeyToDisplayProverb("Proverbs3:5")).toBe(
      "Proverbs 3:5",
    );
  });

  it("should handle multi-digit chapter numbers", () => {
    expect(convertProverbKeyToDisplayProverb("Proverbs21:12")).toBe(
      "Proverbs 21:12",
    );
  });

  it("should handle single-digit verses", () => {
    expect(convertProverbKeyToDisplayProverb("Proverbs1:1")).toBe(
      "Proverbs 1:1",
    );
  });

  it("should handle multi-digit chapters with single-digit verses", () => {
    expect(convertProverbKeyToDisplayProverb("Proverbs10:5")).toBe(
      "Proverbs 10:5",
    );
  });

  it("should not modify already formatted keys", () => {
    expect(convertProverbKeyToDisplayProverb("Proverbs 3:5")).toBe(
      "Proverbs 3:5",
    );
  });
});
