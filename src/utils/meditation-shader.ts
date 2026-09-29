import type { DeviceTier } from "../hooks/useDeviceTier";

/**
 * Nebula shader parameters for each device performance tier. Lower tiers
 * reduce the iteration/volume-step counts to keep the fragment shader cheap.
 */
export const TIER_SHADER: Record<
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

/**
 * Builds the SkSL fragment shader source for the nebula background animation.
 *
 * @param kIterations - Fractal iteration count.
 * @param kVolsteps - Volume ray-march step count.
 * @param kStepsize - Distance advanced per volume step.
 * @param kBrightness - Overall brightness multiplier.
 * @param kFormuparam - Fractal fold parameter.
 * @param kShellFloor - Minimum shell distance (prevents banding).
 * @param kTile - Domain-repeat tile size.
 * @param kDarkmatter - Dark-matter attenuation factor.
 * @returns The complete SkSL shader source string.
 */
export const makeSkSL = (
  kIterations: number,
  kVolsteps: number,
  kStepsize: number,
  kBrightness: number,
  kFormuparam: number,
  kShellFloor: number,
  kTile: number,
  kDarkmatter: number,
): string => `uniform float2 u_resolution;
uniform float u_time;

const float kIterations = ${kIterations.toFixed(1)};
const float kFormuparam = ${kFormuparam.toFixed(2)};
const float kVolsteps = ${kVolsteps.toFixed(1)};
const float kStepsize = ${kStepsize.toFixed(2)};
const float kZoom = 0.800;
const float kTile = ${kTile.toFixed(2)};
const float kSpeed = 0.010;
const float kBrightness = ${kBrightness.toFixed(4)};
const float kShellFloor = ${kShellFloor.toFixed(3)};
const float kDarkmatter = ${kDarkmatter.toFixed(2)};
const float kDistfading = 0.730;
const float kSaturation = 0.850;

half4 main(vec2 xy) {
    vec2 uv = xy / u_resolution - 0.5;
    uv.y *= u_resolution.y / u_resolution.x;
    vec3 dir = vec3(uv * kZoom, 1.0);
    float time = u_time * kSpeed + 0.25;

    float a1 = 0.5;
    float a2 = 0.8;
    mat2 rot1 = mat2(cos(a1), sin(a1), -sin(a1), cos(a1));
    mat2 rot2 = mat2(cos(a2), sin(a2), -sin(a2), cos(a2));
    dir.xz *= rot1;
    dir.xy *= rot2;
    vec3 from = vec3(1.0, 0.5, 0.5);
    from += vec3(time * 2.0, time, -2.0);
    from.xz *= rot1;
    from.xy *= rot2;

    float s = 0.1;
    float fade = 1.0;
    vec3 v = vec3(0.0);
    for (float r = 0.0; r < kVolsteps; r++) {
        vec3 p = from + s * dir * 0.5;
        p = abs(vec3(kTile) - mod(p, vec3(kTile * 2.0)));
        float pa = 0.0;
        float a = 0.0;
        for (float i = 0.0; i < kIterations; i++) {
            p = abs(p) / dot(p, p) - kFormuparam;
            a += max(abs(length(p) - pa), kShellFloor);
            pa = length(p);
        }
        float dm = max(0.0, kDarkmatter - a * a * 0.001);
        a *= a * a;
        if (r > 6.0) fade *= 1.0 - dm;
        v += fade;
        v += vec3(s, s * s, s * s * s * s) * a * kBrightness * fade;
        fade *= kDistfading;
        s += kStepsize;
    }
    v = mix(vec3(length(v)), v, kSaturation);
    return half4(v * 0.01, 1.0);
}`;
