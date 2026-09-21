import {
  Canvas,
  Fill,
  Path,
  Shader,
  Skia,
  type Uniforms,
  useClock,
} from "@shopify/react-native-skia";
import { useMemo } from "react";
import type { SharedValue } from "react-native-reanimated";
import { useDerivedValue } from "react-native-reanimated";
import type { DeviceTier } from "../hooks/useDeviceTier";

/** Nebula shader parameters per device performance tier. */
const TIER_SHADER: Record<
  DeviceTier,
  {
    kIterations: number;
    kVolsteps: number;
    kStepsize: number;
    kBrightness: number;
    kFormuparam: number;
    kShellFloor: number;
    kTile: number;
    kDarkmatter: number;
  }
> = {
  high: {
    kIterations: 12,
    kVolsteps: 10,
    kStepsize: 0.1,
    kBrightness: 0.0015,
    kFormuparam: 0.53,
    kShellFloor: 0.01,
    kTile: 0.85,
    kDarkmatter: 0.45,
  },
  medium: {
    kIterations: 8,
    kVolsteps: 10,
    kStepsize: 0.1,
    kBrightness: 0.002,
    kFormuparam: 0.53,
    kShellFloor: 0.01,
    kTile: 0.85,
    kDarkmatter: 0.45,
  },
  low: {
    kIterations: 5,
    kVolsteps: 10,
    kStepsize: 0.1,
    kBrightness: 0.004,
    kFormuparam: 0.7,
    kShellFloor: 0.01,
    kTile: 0.85,
    kDarkmatter: 0.45,
  },
};

/** Builds the SkSL fragment shader source string for the nebula animation. */
const makeSkSL = (
  kIterations: number,
  kVolsteps: number,
  kStepsize: number,
  kBrightness: number,
  kFormuparam: number,
  kShellFloor: number,
  kTile: number,
  kDarkmatter: number,
): string =>
  [
    "uniform float2 u_resolution;",
    "uniform float u_time;",
    "",
    `const float kIterations = ${kIterations.toFixed(1)};`,
    `const float kFormuparam = ${kFormuparam.toFixed(2)};`,
    `const float kVolsteps = ${kVolsteps.toFixed(1)};`,
    `const float kStepsize = ${kStepsize.toFixed(2)};`,
    `const float kZoom = 0.800;`,
    `const float kTile = ${kTile.toFixed(2)};`,
    `const float kSpeed = 0.010;`,
    `const float kBrightness = ${kBrightness.toFixed(4)};`,
    `const float kShellFloor = ${kShellFloor.toFixed(3)};`,
    `const float kDarkmatter = ${kDarkmatter.toFixed(2)};`,
    `const float kDistfading = 0.730;`,
    `const float kSaturation = 0.850;`,
    "",
    "half4 main(vec2 xy) {",
    "    vec2 uv = xy / u_resolution - 0.5;",
    "    uv.y *= u_resolution.y / u_resolution.x;",
    "    vec3 dir = vec3(uv * kZoom, 1.0);",
    "    float time = u_time * kSpeed + 0.25;",
    "",
    "    float a1 = 0.5;",
    "    float a2 = 0.8;",
    "    mat2 rot1 = mat2(cos(a1), sin(a1), -sin(a1), cos(a1));",
    "    mat2 rot2 = mat2(cos(a2), sin(a2), -sin(a2), cos(a2));",
    "    dir.xz *= rot1;",
    "    dir.xy *= rot2;",
    "    vec3 from = vec3(1.0, 0.5, 0.5);",
    "    from += vec3(time * 2.0, time, -2.0);",
    "    from.xz *= rot1;",
    "    from.xy *= rot2;",
    "",
    "    float s = 0.1;",
    "    float fade = 1.0;",
    "    vec3 v = vec3(0.0);",
    "    for (float r = 0.0; r < kVolsteps; r++) {",
    "        vec3 p = from + s * dir * 0.5;",
    "        p = abs(vec3(kTile) - mod(p, vec3(kTile * 2.0)));",
    "        float pa = 0.0;",
    "        float a = 0.0;",
    "        for (float i = 0.0; i < kIterations; i++) {",
    "            p = abs(p) / dot(p, p) - kFormuparam;",
    "            a += max(abs(length(p) - pa), kShellFloor);",
    "            pa = length(p);",
    "        }",
    "        float dm = max(0.0, kDarkmatter - a * a * 0.001);",
    "        a *= a * a;",
    "        if (r > 6.0) fade *= 1.0 - dm;",
    "        v += fade;",
    "        v += vec3(s, s * s, s * s * s * s) * a * kBrightness * fade;",
    "        fade *= kDistfading;",
    "        s += kStepsize;",
    "    }",
    "    v = mix(vec3(length(v)), v, kSaturation);",
    "    return half4(v * 0.01, 1.0);",
    "}",
  ].join("\n");

/** A single glow layer descriptor used by the meditation arc. */
interface GlowLayer {
  w: number;
  a: number;
}

/** A progress segment with derived start/end values driven by an animation. */
interface ArcSegment {
  start: SharedValue<number>;
  end: SharedValue<number>;
}

interface MeditationCanvasProps {
  outlinePath: string;
  segments: ArcSegment[];
  sampledGlowLayers: GlowLayer[];
  tier: DeviceTier;
  resolution: SharedValue<number[]>;
}

/**
 * Skia canvas that renders the meditation glow arc and nebula shader.
 *
 * This component is loaded lazily via {@linkcode WithSkiaWeb} so that
 * CanvasKit WASM is fully initialised before the Skia module is imported.
 */
export default function MeditationCanvas({
  outlinePath,
  segments,
  sampledGlowLayers,
  tier,
  resolution,
}: MeditationCanvasProps) {
  const sksl = useMemo(
    () =>
      makeSkSL(
        TIER_SHADER[tier].kIterations,
        TIER_SHADER[tier].kVolsteps,
        TIER_SHADER[tier].kStepsize,
        TIER_SHADER[tier].kBrightness,
        TIER_SHADER[tier].kFormuparam,
        TIER_SHADER[tier].kShellFloor,
        TIER_SHADER[tier].kTile,
        TIER_SHADER[tier].kDarkmatter,
      ),
    [tier],
  );
  const effect = useMemo(() => Skia.RuntimeEffect.Make(sksl), [sksl]);

  const clock = useClock();
  const uniforms = useDerivedValue<Uniforms>(() => ({
    u_time: clock.value / 1000,
    u_resolution: resolution.value,
  }));

  return (
    <Canvas
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <Fill color="black" />
      {effect && uniforms && <Shader source={effect} uniforms={uniforms} />}
      {segments.map((seg, si) =>
        sampledGlowLayers.map(({ w, a }, li) => (
          <Path
            key={`${si}-${li}`}
            path={outlinePath}
            style="stroke"
            strokeWidth={w}
            color={`rgba(25,51,179,${a})`}
            start={seg.start}
            end={seg.end}
            strokeCap="round"
            strokeJoin="round"
          />
        )),
      )}
    </Canvas>
  );
}
