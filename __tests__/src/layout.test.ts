import { getContentGutter } from "../../src/utils/layout";

describe("getContentGutter", () => {
  it("splits the leftover space when the viewport is wider than the column", () => {
    expect(getContentGutter(2024)).toBe(500);
  });

  it("returns zero when the viewport exactly matches the column", () => {
    expect(getContentGutter(1024)).toBe(0);
  });

  it("returns zero when the viewport is narrower than the column", () => {
    expect(getContentGutter(768)).toBe(0);
  });
});
