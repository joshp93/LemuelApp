import { convertDisplayProverbToProverbKey } from "../../src/utils/convertDisplayProverbToProverbKey";

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
