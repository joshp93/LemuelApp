import { buildMeditationOutline } from "../../src/utils/meditation-outline";

describe("buildMeditationOutline", () => {
  it("returns null before the canvas has been measured", () => {
    expect(buildMeditationOutline(0, 0, 30)).toBeNull();
  });

  it("returns null when only the width is missing", () => {
    expect(buildMeditationOutline(0, 800, 30)).toBeNull();
  });

  it("returns null when only the height is missing", () => {
    expect(buildMeditationOutline(400, 0, 30)).toBeNull();
  });

  it("starts and ends at the top centre so the glow has one seam", () => {
    const d = buildMeditationOutline(400, 800, 30);

    expect(d).not.toBeNull();
    expect(d?.startsWith("M 200 0")).toBe(true);
    expect(d?.endsWith("L 200 0 Z")).toBe(true);
  });

  it("rounds every corner with the supplied radius", () => {
    const d = buildMeditationOutline(400, 800, 44);

    expect(d?.match(/A 44 44 0 0 1/g)).toHaveLength(4);
  });

  it("traces the canvas edges", () => {
    const d = buildMeditationOutline(400, 800, 30);

    expect(d).toContain("L 370 0");
    expect(d).toContain("L 400 770");
    expect(d).toContain("L 30 800");
    expect(d).toContain("L 0 30");
  });

  it("scales with the canvas size", () => {
    const d = buildMeditationOutline(1000, 2000, 30);

    expect(d?.startsWith("M 500 0")).toBe(true);
    expect(d).toContain("L 1000 1970");
  });
});
