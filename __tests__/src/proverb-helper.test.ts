import {
  abbreviateProverbRef,
  convertDisplayProverbToProverbKey,
  convertProverbKeyToDisplayProverb,
} from "../../src/utils/proverb-helper";

describe("convertDisplayProverbToProverbKey", () => {
  it("should remove space between book name and chapter number", () => {
    expect(convertDisplayProverbToProverbKey("Proverbs 3:5")).toBe(
      "Proverbs3:5",
    );
  });

  it("should handle multi-digit chapter numbers", () => {
    expect(convertDisplayProverbToProverbKey("Proverbs 21:12")).toBe(
      "Proverbs21:12",
    );
  });

  it("should work with already compact keys", () => {
    expect(convertDisplayProverbToProverbKey("Proverbs3:5")).toBe(
      "Proverbs3:5",
    );
  });
});

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

describe("abbreviateProverbRef", () => {
  it("should replace 'Proverbs' with 'Prov' in a full reference", () => {
    expect(abbreviateProverbRef("Proverbs 3:5")).toBe("Prov 3:5");
  });

  it("should handle multi-digit chapter numbers", () => {
    expect(abbreviateProverbRef("Proverbs 21:12")).toBe("Prov 21:12");
  });

  it("should handle single-digit verses", () => {
    expect(abbreviateProverbRef("Proverbs 1:1")).toBe("Prov 1:1");
  });

  it("should not modify a reference that doesn't start with 'Proverbs'", () => {
    expect(abbreviateProverbRef("Psalm 23:1")).toBe("Psalm 23:1");
  });

  it("should handle 'Proverbs' at the start followed by a space", () => {
    expect(abbreviateProverbRef("Proverbs 10:5")).toBe("Prov 10:5");
  });

  it("should not abbreviate 'Proverbs' that is not a standalone word", () => {
    expect(abbreviateProverbRef("The Proverbs 3:5")).toBe("The Proverbs 3:5");
  });
});
