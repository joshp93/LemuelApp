import { makeSkSL, TIER_SHADER } from "../../src/utils/meditation-shader";

describe("makeSkSL", () => {
  const base = makeSkSL(8, 10, 0.1, 0.002, 0.53, 0.01, 0.85, 0.45);

  it("declares the expected uniforms", () => {
    expect(base).toContain("uniform float2 u_resolution;");
    expect(base).toContain("uniform float u_time;");
  });

  it("interpolates each numeric parameter with the right precision", () => {
    expect(base).toContain("const float kIterations = 8.0;");
    expect(base).toContain("const float kVolsteps = 10.0;");
    expect(base).toContain("const float kStepsize = 0.10;");
    expect(base).toContain("const float kBrightness = 0.0020;");
    expect(base).toContain("const float kFormuparam = 0.53;");
    expect(base).toContain("const float kShellFloor = 0.010;");
    expect(base).toContain("const float kTile = 0.85;");
    expect(base).toContain("const float kDarkmatter = 0.45;");
  });

  it("defines the main fragment entry point", () => {
    expect(base).toContain("half4 main(vec2 xy) {");
    expect(base.trimEnd().endsWith("}")).toBe(true);
  });

  it("produces different output for different parameters", () => {
    const other = makeSkSL(5, 10, 0.1, 0.004, 0.7, 0.01, 0.85, 0.45);
    expect(other).not.toBe(base);
  });
});

describe("TIER_SHADER", () => {
  it("defines high, medium and low tiers", () => {
    expect(Object.keys(TIER_SHADER).sort()).toEqual(["high", "low", "medium"]);
  });

  it("uses fewer iterations on lower tiers", () => {
    expect(TIER_SHADER.high.kIterations).toBeGreaterThan(
      TIER_SHADER.medium.kIterations,
    );
    expect(TIER_SHADER.medium.kIterations).toBeGreaterThan(
      TIER_SHADER.low.kIterations,
    );
  });
});
