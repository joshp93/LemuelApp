import {
  PROVERB_TEXT_COLOR,
  PROVERB_TEXT_COLOR_DARK,
} from "../../src/constants/meditation";
import type { DeviceTier } from "../../src/hooks/useDeviceTier";
import {
  BLANK_SHADER_ID,
  DEFAULT_ENABLED_SHADER_IDS,
  DEFAULT_SHADER_ID,
  getMeditationShader,
  isMeditationShaderId,
  MEDITATION_SHADER_IDS,
  MEDITATION_SHADERS,
  type MeditationShaderId,
  pickRandomShaderId,
} from "../../src/utils/meditation-shaders";
import { makeBlankSkSL } from "../../src/utils/meditation-shaders/blank";
import {
  GAS_GIANT_TIERS,
  makeGasGiantSkSL,
} from "../../src/utils/meditation-shaders/gas-giant";
import { makeSineMountainsSkSL } from "../../src/utils/meditation-shaders/sine-mountains";
import {
  makeStarFieldSkSL,
  STAR_FIELD_TIERS,
} from "../../src/utils/meditation-shaders/star-field";
import {
  makeSunsetSkSL,
  SUNSET_TIERS,
} from "../../src/utils/meditation-shaders/sunset";

const TIERS: DeviceTier[] = ["high", "medium", "low"];

describe("makeStarFieldSkSL", () => {
  const base = makeStarFieldSkSL({
    kIterations: 8,
    kVolsteps: 10,
    kStepsize: 0.1,
    kBrightness: 0.002,
    kFormuparam: 0.53,
    kShellFloor: 0.01,
    kTile: 0.85,
    kDarkmatter: 0.45,
  });

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
    const other = makeStarFieldSkSL({
      ...STAR_FIELD_TIERS.low,
    });
    expect(other).not.toBe(base);
  });
});

describe("STAR_FIELD_TIERS", () => {
  it("defines high, medium and low tiers", () => {
    expect(Object.keys(STAR_FIELD_TIERS).sort()).toEqual([
      "high",
      "low",
      "medium",
    ]);
  });

  it("uses fewer iterations on lower tiers", () => {
    expect(STAR_FIELD_TIERS.high.kIterations).toBeGreaterThan(
      STAR_FIELD_TIERS.medium.kIterations,
    );
    expect(STAR_FIELD_TIERS.medium.kIterations).toBeGreaterThan(
      STAR_FIELD_TIERS.low.kIterations,
    );
  });
});

describe("makeGasGiantSkSL", () => {
  const base = makeGasGiantSkSL({ octaves: 6, spin: 0.075 });

  it("declares the expected uniforms", () => {
    expect(base).toContain("uniform float2 u_resolution;");
    expect(base).toContain("uniform float u_time;");
  });

  it("defines the main fragment entry point", () => {
    expect(base).toContain("half4 main(vec2 xy) {");
  });

  it("bakes the octave count as a constant int loop bound", () => {
    expect(base).toContain("const int kOctaves = 6;");
    expect(base).toContain("for (int i = 0; i < kOctaves; ++i)");
  });

  it("emits the rotation rate", () => {
    expect(base).toContain("float theta = u_time * 0.0750;");
  });

  it("flips the fragment coordinate for Skia's y-down space", () => {
    expect(base).toContain(
      "vec2 fragCoord = vec2(xy.x, u_resolution.y - xy.y);",
    );
  });

  it("fits the planet to the narrower screen axis", () => {
    expect(base).toContain("asin(kPlanetSize * kFitMargin / kCamDist)");
    expect(base).toContain(
      "-min(u_resolution.x, u_resolution.y) / (2.0 * tan(fitAngle))",
    );
  });

  it("produces different output for different octave counts", () => {
    expect(makeGasGiantSkSL({ octaves: 4, spin: 0.075 })).not.toBe(base);
  });
});

describe("GAS_GIANT_TIERS", () => {
  it("defines high, medium and low tiers", () => {
    expect(Object.keys(GAS_GIANT_TIERS).sort()).toEqual([
      "high",
      "low",
      "medium",
    ]);
  });

  it("uses fewer octaves on lower tiers", () => {
    expect(GAS_GIANT_TIERS.high.octaves).toBeGreaterThan(
      GAS_GIANT_TIERS.medium.octaves,
    );
    expect(GAS_GIANT_TIERS.medium.octaves).toBeGreaterThan(
      GAS_GIANT_TIERS.low.octaves,
    );
  });

  it("spins at half the source shader's rate on every tier", () => {
    for (const tier of TIERS) {
      expect(GAS_GIANT_TIERS[tier].spin).toBeCloseTo(0.15 / 2, 6);
    }
  });
});

describe("makeSineMountainsSkSL", () => {
  const base = makeSineMountainsSkSL();

  it("declares the expected uniforms", () => {
    expect(base).toContain("uniform float2 u_resolution;");
    expect(base).toContain("uniform float u_time;");
  });

  it("defines the main fragment entry point", () => {
    expect(base).toContain("half4 main(vec2 xy) {");
  });

  it("flips the fragment coordinate for Skia's y-down space", () => {
    expect(base).toContain(
      "vec2 fragCoord = vec2(xy.x, u_resolution.y - xy.y);",
    );
  });

  it("replaces the source shader's fwidth call, which SkSL does not provide", () => {
    expect(base).not.toContain("fwidth");
    expect(base).toContain(
      "float pixelWidth() { return 1.0 / u_resolution.y; }",
    );
  });

  it("is identical on every tier, since it takes no tier parameters", () => {
    expect(makeSineMountainsSkSL()).toBe(base);
  });
});

describe("makeBlankSkSL", () => {
  const base = makeBlankSkSL();

  it("declares the uniforms the canvas always supplies", () => {
    expect(base).toContain("uniform float2 u_resolution;");
    expect(base).toContain("uniform float u_time;");
  });

  it("defines the main fragment entry point", () => {
    expect(base).toContain("half4 main(vec2 xy) {");
  });

  it("returns opaque black", () => {
    expect(base).toContain("return half4(0.0, 0.0, 0.0, 1.0);");
  });

  it("is identical on every tier, since it takes no tier parameters", () => {
    expect(makeBlankSkSL()).toBe(base);
  });
});

describe("makeSunsetSkSL", () => {
  const base = makeSunsetSkSL({ steps: 6, stepss: 6 });

  it("declares the expected uniforms", () => {
    expect(base).toContain("uniform float2 u_resolution;");
    expect(base).toContain("uniform float u_time;");
  });

  it("defines the main fragment entry point", () => {
    expect(base).toContain("half4 main(vec2 xy) {");
  });

  it("flips the fragment coordinate for Skia's y-down space", () => {
    expect(base).toContain(
      "vec2 fragCoord = vec2(xy.x, u_resolution.y - xy.y);",
    );
  });

  it("bakes the step counts as constant int loop bounds", () => {
    expect(base).toContain("const int kSteps = 6;");
    expect(base).toContain("const int kStepss = 6;");
    expect(base).toContain("for (int i = 0; i < kSteps; ++i)");
    expect(base).toContain("for (int j = 0; j < kStepss; ++j)");
  });

  it("centres the sun horizontally at any aspect ratio", () => {
    expect(base).toContain("vec2 uvMouse = vec2(0.5 * AR,");
  });

  it("carries no texture, mouse or preprocessor dependency", () => {
    expect(base).not.toContain("iChannel");
    expect(base).not.toContain("texture(");
    expect(base).not.toContain("iMouse");
    expect(base).not.toContain("gl_FragCoord");
    expect(base).not.toContain("#define");
    expect(base).not.toContain("#if");
  });

  it("samples the view ray on a quadratic distribution", () => {
    expect(base).toContain("float l = L * tt * tt;");
    expect(base).toContain("float dli = L * (ttn * ttn - tt * tt);");
    expect(base).not.toContain("float(i) * dl");
  });

  it("divides by the view ray's vertical component only where it is bounded", () => {
    expect(base.split("/ D.y").length - 1).toBe(1);
    expect(base).toContain("float L = -O.y / D.y;");
    expect(base).toContain("if (D.y < -kTs) {");
  });

  it("drops the source's star and aurora layers, which never contribute a pixel", () => {
    expect(base).not.toContain("stars(");
    expect(base).not.toContain("aurora(");
    expect(base).not.toContain("triNoise2d");
  });

  it("produces different output for different step counts", () => {
    expect(makeSunsetSkSL({ steps: 4, stepss: 4 })).not.toBe(base);
  });
});

describe("SUNSET_TIERS", () => {
  it("defines high, medium and low tiers", () => {
    expect(Object.keys(SUNSET_TIERS).sort()).toEqual(["high", "low", "medium"]);
  });

  it("uses fewer steps on lower tiers", () => {
    expect(SUNSET_TIERS.high.steps).toBeGreaterThan(SUNSET_TIERS.medium.steps);
    expect(SUNSET_TIERS.medium.steps).toBeGreaterThan(SUNSET_TIERS.low.steps);
  });

  it("keeps every ray-march step count positive", () => {
    for (const tier of TIERS) {
      expect(SUNSET_TIERS[tier].steps).toBeGreaterThan(0);
      expect(SUNSET_TIERS[tier].stepss).toBeGreaterThan(0);
    }
  });
});

describe("MEDITATION_SHADERS registry", () => {
  it("lists the expected shaders in settings order", () => {
    expect(MEDITATION_SHADER_IDS).toEqual([
      "star-field",
      "gas-giant",
      "sine-mountains",
      "sunset",
      "none",
    ]);
  });

  it("enables every animation but not the blank background by default", () => {
    expect(DEFAULT_ENABLED_SHADER_IDS).toEqual([
      "star-field",
      "gas-giant",
      "sine-mountains",
      "sunset",
    ]);
    expect(DEFAULT_ENABLED_SHADER_IDS).not.toContain(BLANK_SHADER_ID);
  });

  it("pairs every shader with a proverb text colour", () => {
    for (const shader of MEDITATION_SHADERS) {
      expect(shader.textColour).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("gives the bright sunset background a darker text colour than the rest", () => {
    expect(getMeditationShader("sunset").textColour).toBe(
      PROVERB_TEXT_COLOR_DARK,
    );
    expect(getMeditationShader("star-field").textColour).toBe(
      PROVERB_TEXT_COLOR,
    );
    expect(getMeditationShader("gas-giant").textColour).toBe(
      PROVERB_TEXT_COLOR,
    );
    expect(getMeditationShader("sine-mountains").textColour).toBe(
      PROVERB_TEXT_COLOR,
    );
  });

  it("has no duplicate ids", () => {
    expect(new Set(MEDITATION_SHADER_IDS).size).toBe(
      MEDITATION_SHADER_IDS.length,
    );
  });

  it("uses sentence-case labels", () => {
    for (const shader of MEDITATION_SHADERS) {
      expect(shader.label).toMatch(/^[A-Z][a-z]/);
    }
  });

  it("looks up a shader by id", () => {
    for (const id of MEDITATION_SHADER_IDS) {
      expect(getMeditationShader(id).id).toBe(id);
    }
  });

  it("builds shader source for every shader at every tier", () => {
    for (const shader of MEDITATION_SHADERS) {
      for (const tier of TIERS) {
        const source = shader.makeSkSL(tier);
        expect(source).toContain("uniform float2 u_resolution;");
        expect(source).toContain("uniform float u_time;");
        expect(source).toContain("half4 main(vec2 xy) {");
      }
    }
  });

  it("defaults to a shader that exists", () => {
    expect(MEDITATION_SHADER_IDS).toContain(DEFAULT_SHADER_ID);
  });
});

describe("isMeditationShaderId", () => {
  it("accepts every known id", () => {
    for (const id of MEDITATION_SHADER_IDS) {
      expect(isMeditationShaderId(id)).toBe(true);
    }
  });

  it("rejects unknown ids and non-strings", () => {
    expect(isMeditationShaderId("ocean-planet")).toBe(false);
    expect(isMeditationShaderId("")).toBe(false);
    expect(isMeditationShaderId(null)).toBe(false);
    expect(isMeditationShaderId(undefined)).toBe(false);
    expect(isMeditationShaderId(3)).toBe(false);
    expect(isMeditationShaderId({ id: "star-field" })).toBe(false);
  });
});

describe("pickRandomShaderId", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns the only enabled shader", () => {
    expect(pickRandomShaderId(["gas-giant"])).toBe("gas-giant");
  });

  it("returns a member of the enabled set", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.999);
    expect(pickRandomShaderId(["star-field", "gas-giant"])).toBe("gas-giant");
  });

  it("is reachable across the whole enabled set", () => {
    jest.spyOn(Math, "random").mockReturnValue(0);
    expect(pickRandomShaderId(["star-field", "gas-giant"])).toBe("star-field");
  });

  it("returns the blank background whenever it is enabled, since it is exclusive", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.5);
    expect(pickRandomShaderId(["star-field", "gas-giant", "none"])).toBe(
      "none",
    );
    expect(pickRandomShaderId(["none"])).toBe("none");
  });

  it("falls back to the default when nothing is enabled", () => {
    expect(pickRandomShaderId([])).toBe(DEFAULT_SHADER_ID);
  });

  it("ignores unknown ids and falls back when none are usable", () => {
    expect(
      pickRandomShaderId(["ocean-planet", "galactic-journey"] as never),
    ).toBe(DEFAULT_SHADER_ID);
  });

  it("picks only from the usable ids when the list is mixed", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.5);
    expect(
      pickRandomShaderId(["ocean-planet", "gas-giant"] as MeditationShaderId[]),
    ).toBe("gas-giant");
  });
});
