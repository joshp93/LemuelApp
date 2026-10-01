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
 * The integral resolves the sky gradient, which converges almost immediately —
 * 16×16, 8×8, 6×6 and 4×4 all render identically. The step counts are therefore
 * chosen purely to stay under the original shader's cost.
 */
export const SUNSET_TIERS: Record<DeviceTier, SunsetParams> = {
  high: { steps: 5, stepss: 5 },
  medium: { steps: 4, stepss: 4 },
  low: { steps: 3, stepss: 3 },
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
 * - `#define`/`#if` blocks are baked, `iMouse` is replaced by the source's own
 *   initial-view defaults, and `gl_FragCoord` becomes the passed coordinate.
 * - The fragment coordinate is flipped, because Skia's is y-down and
 *   Shadertoy's is y-up.
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
const float s = 0.999;
const float s2 = s;
const float Hr = 8e3;
const float Hm = 1.2e3;

const vec3 bM = vec3(21e-6);
const vec3 bR = vec3(5.8e-6, 13.5e-6, 33.1e-6);
const vec3 C = vec3(0.0, -R0, 0.0);

const mat2 kM2 = mat2(0.95534, 0.29552, -0.29552, 0.95534);

mat2 mm2(float a) {
    float c = cos(a);
    float sn = sin(a);
    return mat2(c, sn, -sn, c);
}

float tri(float x) { return clamp(abs(fract(x) - 0.5), 0.01, 0.49); }

vec2 tri2(vec2 p) {
    return vec2(tri(p.x) + tri(p.y), tri(p.y + tri(p.x)));
}

float triNoise2d(vec2 p, float spd) {
    float z = 1.8;
    float z2 = 2.5;
    float rz = 0.0;
    p *= mm2(p.x * 0.06);
    vec2 bp = p;
    for (float i = 0.0; i < 5.0; i++) {
        vec2 dg = tri2(bp * 1.85) * 0.75;
        dg *= mm2(u_time * spd);
        p -= dg / z2;
        bp *= 1.3;
        z2 *= 1.45;
        z *= 0.42;
        p *= 1.21 + (rz - 1.0) * 0.02;
        rz += tri(p.x + tri(p.y)) * z;
        p *= -kM2;
    }
    return clamp(1.0 / pow(rz * 29.0, 1.3), 0.0, 0.55);
}

float hash21(vec2 n) {
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

vec4 aurora(vec3 ro, vec3 rd, vec2 fragCoord) {
    vec4 col = vec4(0.0);
    vec4 avgCol = vec4(0.0);
    ro *= 1e-5;
    float mt = 10.0;
    for (float i = 0.0; i < 5.0; i++) {
        float of = 0.006 * hash21(fragCoord) * smoothstep(0.0, 15.0, i * mt);
        float pt = ((0.8 + pow((i * mt), 1.2) * 0.001) - rd.y) / (rd.y * 2.0 + 0.4);
        pt -= of;
        vec3 bpos = ro + pt * rd;
        vec2 p = bpos.zx;
        float rzt = triNoise2d(p, 0.1);
        vec4 col2 = vec4(0.0, 0.0, 0.0, rzt);
        col2.rgb = (sin(1.0 - vec3(2.15, -0.5, 1.2) + (i * mt) * 0.053) * (0.5 * mt)) * rzt;
        avgCol = mix(avgCol, col2, 0.5);
        col += avgCol * exp2((-i * mt) * 0.04 - 2.5) * smoothstep(0.0, 5.0, i * mt);
    }
    col *= (clamp(rd.y * 15.0 + 0.4, 0.0, 1.2));
    return col * 2.8;
}

float noise(vec2 v) { return hash21(floor(v + 0.5)); }

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

void scatter(vec3 o, vec3 d, vec3 Ds, out vec3 col, out vec3 scat) {
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

    float dl = L / float(kSteps);
    for (int i = 0; i < kSteps; ++i) {
        float l = float(i) * dl;
        vec3 p = (o + d * l);
        float dR, dM;
        densities(p, dR, dM);
        dR *= dl;
        dM *= dl;
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

    col = (kSunLight) * (M * bM * phaseM);
    col += (kSunIntensity) * (M * bM * phaseS);
    col += (kSunLight) * (R * bR * phaseR);
    scat = 0.1 * (bM * depthM);
}

vec3 hash33(vec3 p) {
    p = fract(p * vec3(443.8975, 397.2973, 491.1871));
    p += dot(p.zxy, p.yxz + 19.27);
    return fract(vec3(p.x * p.y, p.z * p.x, p.y * p.z));
}

vec3 stars(vec3 p) {
    vec3 c = vec3(0.0);
    float res = u_resolution.x * 2.5;
    for (float i = 0.0; i < 4.0; i++) {
        vec3 q = fract(p * (0.15 * res)) - 0.5;
        vec3 id = floor(p * (0.15 * res));
        vec2 rn = hash33(id).xy;
        float c2 = 1.0 - smoothstep(0.0, 0.6, length(q));
        c2 *= step(rn.x, 0.0005 + i * i * 0.001);
        c += c2 * (mix(vec3(1.0, 0.49, 0.1), vec3(0.75, 0.9, 1.0), rn.y) * 0.1 + 0.9);
        p *= 1.3;
    }
    return c * c * 0.8;
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

    vec3 color = vec3(0.0);
    vec3 scat = vec3(0.0);
    float att = 1.0;
    vec3 star = vec3(0.0);
    vec4 aur = vec4(0.0);

    float fade = smoothstep(0.0, 0.01, abs(D.y)) * 0.5 + 0.9;

    float staratt = 1.0 - min(1.0, (uvMouse.y * 2.0));
    float scatatt = 1.0 - min(1.0, (uvMouse.y * 2.2));

    if (D.y < -kTs) {
        float L = -O.y / D.y;
        O = O + D * L;
        D.y = -D.y;
        D = normalize(D + vec3(0.0, 0.003 * sin(u_time + 6.2831 * noise(O.xz + vec2(0.0, -u_time * 1e3))), 0.0));
        att = 0.6;
        star = stars(D);
        if (uvMouse.y < 0.5) { aur = smoothstep(0.0, 2.5, aurora(O, D, fragCoord)); }
    } else {
        float L1 = O.y / D.y;
        vec3 O1 = O + D * L1;
        vec3 D1 = normalize(D + vec3(1.0, 0.0009 * sin(u_time + 6.2831 * noise(O1.xz + vec2(0.0, u_time * 0.8))), 0.0));
        star = stars(D1);
        if (uvMouse.y < 0.5) { aur = smoothstep(0.0, 1.5, aurora(O, D, fragCoord)) * fade; }
    }

    star *= att * staratt;

    scatter(O, D, Ds, color, scat);
    color *= att;
    scat *= att * scatatt;

    color += scat;
    color += star;
    color += aur.rgb * scatatt;

    return half4(pow(color, vec3(1.0 / 2.2)), 1.0);
}`;
};
