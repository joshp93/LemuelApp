import { APP_VERSION, toVersionCode } from "../../config/version";

describe("APP_VERSION", () => {
  it("is a plain major.minor.patch version", () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe("toVersionCode", () => {
  it("starts each major range at its own base", () => {
    expect(toVersionCode("1.0.0")).toBe(10000);
    expect(toVersionCode("2.0.0")).toBe(20000);
  });

  it("increments the code for every patch release", () => {
    expect(toVersionCode("1.0.1")).toBe(10001);
  });

  it("encodes the minor and patch parts into two digits each", () => {
    expect(toVersionCode("1.2.3")).toBe(10203);
    expect(toVersionCode("1.99.99")).toBe(19999);
  });

  it("never repeats or decreases across a release sequence", () => {
    const sequence = ["1.0.0", "1.0.1", "1.0.99", "1.1.0", "1.99.99", "2.0.0"];
    const codes = sequence.map(toVersionCode);

    expect(codes).toEqual([...codes].sort((a, b) => a - b));
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("converts the version the app currently ships", () => {
    expect(toVersionCode(APP_VERSION)).toBeGreaterThan(0);
  });

  it("rejects a prerelease or build suffix rather than colliding with the final release", () => {
    expect(() => toVersionCode("1.0.0-beta.1")).toThrow(/prerelease/);
    expect(() => toVersionCode("1.0.0+build.5")).toThrow(/prerelease/);
  });

  it("rejects a version that is not a major.minor.patch triple", () => {
    expect(() => toVersionCode("1.0")).toThrow(/major\.minor\.patch/);
    expect(() => toVersionCode("v1.0.0")).toThrow(/major\.minor\.patch/);
  });

  it("rejects a part that exceeds the two-digit range", () => {
    expect(() => toVersionCode("1.100.0")).toThrow(/at most 99/);
  });
});
