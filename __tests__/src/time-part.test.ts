import { parseTimePart } from "../../src/utils/time-part";

describe("parseTimePart", () => {
  it("keeps midnight rather than falling back", () => {
    expect(parseTimePart("0", 9)).toBe(0);
  });

  it("keeps zero minutes rather than falling back", () => {
    expect(parseTimePart("0", 30)).toBe(0);
  });

  it("parses a normal hour", () => {
    expect(parseTimePart("19", 9)).toBe(19);
  });

  it("parses the end of the day", () => {
    expect(parseTimePart("23", 9)).toBe(23);
  });

  it("falls back when the value is undefined", () => {
    expect(parseTimePart(undefined, 19)).toBe(19);
  });

  it("falls back when the value is empty", () => {
    expect(parseTimePart("", 9)).toBe(9);
  });

  it("falls back when the value is not a number", () => {
    expect(parseTimePart("not-a-time", 9)).toBe(9);
  });
});
