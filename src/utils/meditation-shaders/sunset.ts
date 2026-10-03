import type { DeviceTier } from "../../hooks/useDeviceTier";

/** Sunset shader parameters for a single device performance tier. */
export interface SunsetParams {
  /** Ray-march steps along the view ray. */
  steps: number;
  /** Ray-march steps toward the sun, per view-ray step. */
  stepss: number;
}

/**
 * Sunset parameters for each device performance tier.
 *
 * Each tier is tuned to cost about 85% of the original background on the same
 * device, and the step count is the fidelity dial: measured against a converged
 * 64×64 render the mean frame error is 19, 24 and 33 out of 255.
 */
export const SUNSET_TIERS: Record<DeviceTier, SunsetParams> = {
  high: { steps: 6, stepss: 6 },
  medium: { steps: 5, stepss: 5 },
  low: { steps: 4, stepss: 4 },
};

/**
 * Builds the SkSL fragment shader source for the sunset-over-ocean background.
 *
 * Departures from the source shader, all deliberate:
 *
 * - **The clouds are removed.** They were the only use of `iChannel0`, and SkSL
 *   runtime effects have no samplers; substituting procedural noise for the
 *   texture both changed the look and rendered visibly blocky. Removing them
 *   removes the texture dependency and takes the shader from ~20× the og's cost
 *   to under 1×. What remains — Rayleigh/Mie scattering, the sun, the water and
 *   its reflection — is the source's actual mechanism.
 * - **The sun is centred horizontally.** The source's default camera offset only
 *   puts the sun dead ahead at ~16:9; on a phone it swings the sun off-screen
 *   entirely. `uvMouse.x = 0.5 * AR` makes the horizontal offset exactly zero at
 *   any aspect.
 * - **The sun is 50% wider.** Its size is the width of the Mie forward lobe,
 *   set by the source's `SOFT_SUN` concentration. 0.9957 (down from 0.999)
 *   widens the disc by half at any resolution, and it is a compile-time
 *   constant, so the cost is unchanged.
 * - `#define`/`#if` blocks are baked, `iMouse` is replaced by the source's own
 *   initial-view defaults, and `gl_FragCoord` becomes the passed coordinate.
 * - The fragment coordinate is flipped, because Skia's is y-down and
 *   Shadertoy's is y-up.
 * - **The stars, the aurora and the scattering floor are removed.** In the
 *   source's own default view they are multiplied by zero: `staratt` and
 *   `scatatt` both clamp to 0 at the default `uvMouse.y` of 0.613, and the
 *   aurora is gated behind `uvMouse.y < 0.5`. They cannot contribute a pixel,
 *   and they are where most of the shader's cost sits. Removing them also
 *   removes the source's one non-finite path: the sky branch sampled its
 *   ripple at `O.y / D.y`, which is infinite on the horizon row, and my `hash21`
 *   substitute propagated that to a NaN that Skia rendered as a bright
 *   one-pixel line across the middle of the screen.
 * - **The sea reflects the sky from the camera, without moving the ray origin.**
 *   The source moved the origin to where the view ray strikes the water before
 *   reflecting it. That point sits up to `50 / |D.y|` metres away, and
 *   `densities` measures altitude against the planet's sphere, so at large canvas
 *   heights the "sea surface" landed nearly a kilometre *above* that sphere. The
 *   reflected ray then integrated a different atmosphere from the sky ray beside
 *   it, and the first water row came out brighter than the last sky row — a
 *   bright line across the horizon, in the sky's own colour, that grew with
 *   resolution. Leaving the origin alone makes the sea an exact mirror of the
 *   sky, dimmed to the source's 0.6.
 * - **The water-surface ripple went with it.** It was driven by the displaced
 *   point's coordinates, so it could not survive, and it moved the water by a
 *   mean of 0.4/255 against a maximum of 255 — invisible either way.
 * - **The view ray is sampled on a quadratic distribution, not an even one.**
 *   Sampling evenly from the camera puts the densest sample — the camera itself,
 *   at sea level — at the head of a slab up to 100 km long, which over-counts the
 *   near field and leaves the horizon row brighter than the rows beside it.
 *   Quadratic spacing makes the near slabs short, where nearly all of the optical
 *   depth accumulates. At equal cost it is both more faithful to a converged
 *   render than even sampling and free of that line.
 *
 * @param params - Tier-specific shader parameters.
 * @returns The complete SkSL shader source string.
 */
export const makeSunsetSkSL = (params: SunsetParams): string => {
  const { steps, stepss } = params;

  return `uniform float2 u_resolution;
uniform float u_time;

const int kSteps = ${steps};
const int kStepss = ${stepss};

const float kFov = 1.7320508;
const float kHaze = 0.1;
const float kCameraHeight = 50.0;

const float R0 = 6360e3;
const float Ra = 6380e3;
const float kSunLight = 10.0;
const float kSunIntensity = 5.0;
const float g = 0.45;
const float g2 = g * g;
const float kTs = (kCameraHeight / 2.5e5);
const float s = 0.9957;
const float s2 = s;
const float Hr = 8e3;
const float Hm = 1.2e3;

const vec3 bM = vec3(21e-6);
const vec3 bR = vec3(5.8e-6, 13.5e-6, 33.1e-6);
const vec3 C = vec3(0.0, -R0, 0.0);

void densities(vec3 pos, out float rayleigh, out float mie) {
    float h = length(pos - C) - R0;
    rayleigh = exp(-h / Hr);
    mie = exp(-h / Hm) + kHaze;
}

float escape(vec3 p, vec3 d, float R) {
    vec3 v = p - C;
    float b = dot(v, d);
    float c = dot(v, v) - R * R;
    float det2 = b * b - c;
    if (det2 < 0.0) return -1.0;
    float det = sqrt(det2);
    float t1 = -b - det, t2 = -b + det;
    return (t1 >= 0.0) ? t1 : t2;
}

vec3 scatter(vec3 o, vec3 d, vec3 Ds) {
    float L = escape(o, d, Ra);
    float mu = dot(d, Ds);
    float opmu2 = 1.0 + mu * mu;
    float phaseR = 0.0596831 * opmu2;
    float phaseM = 0.1193662 * (1.0 - g2) * opmu2 / ((2.0 + g2) * pow(1.0 + g2 - 2.0 * g * mu, 1.5));
    float phaseS = 0.1193662 * (1.0 - s2) * opmu2 / ((2.0 + s2) * pow(1.0 + s2 - 2.0 * s * mu, 1.5));

    float depthR = 0.0;
    float depthM = 0.0;
    vec3 R = vec3(0.0);
    vec3 M = vec3(0.0);

    float invN = 1.0 / float(kSteps);
    for (int i = 0; i < kSteps; ++i) {
        float tt = float(i) * invN;
        float ttn = tt + invN;
        float l = L * tt * tt;
        float dli = L * (ttn * ttn - tt * tt);
        vec3 p = (o + d * l);
        float dR, dM;
        densities(p, dR, dM);
        dR *= dli;
        dM *= dli;
        depthR += dR;
        depthM += dM;

        float Ls = escape(p, Ds, Ra);
        if (Ls > 0.0) {
            float dls = Ls / float(kStepss);
            float depthRs = 0.0;
            float depthMs = 0.0;
            for (int j = 0; j < kStepss; ++j) {
                float ls = float(j) * dls;
                vec3 ps = (p + Ds * ls);
                float dRs, dMs;
                densities(ps, dRs, dMs);
                depthRs += dRs * dls;
                depthMs += dMs * dls;
            }
            vec3 A = exp(-(bR * (depthRs + depthR) + bM * (depthMs + depthM)));
            R += (A * dR);
            M += A * dM;
        }
    }

    vec3 col = (kSunLight) * (M * bM * phaseM);
    col += (kSunIntensity) * (M * bM * phaseS);
    col += (kSunLight) * (R * bR * phaseR);
    return col;
}

half4 main(vec2 xy) {
    vec2 fragCoord = vec2(xy.x, u_resolution.y - xy.y);
    float AR = u_resolution.x / u_resolution.y;

    vec2 uvMouse = vec2(0.5 * AR, (0.7 - (0.05 * kFov)));

    vec2 uv0 = (fragCoord.xy / u_resolution.xy);
    vec2 uv = uv0 * 2.0 - 1.0;
    uv.x *= AR;

    vec3 Ds = normalize(vec3(uvMouse.x - ((0.5 * AR)), uvMouse.y - 0.5, (kFov / -2.0)));

    vec3 O = vec3(0.0, kCameraHeight, 0.0);
    vec3 D = normalize(vec3(uv, -kFov));

    float att = 1.0;

    if (D.y < -kTs) {
        D.y = -D.y;
        att = 0.6;
    }

    vec3 color = scatter(O, D, Ds) * att;

    return half4(pow(color, vec3(1.0 / 2.2)), 1.0);
}`;
};
