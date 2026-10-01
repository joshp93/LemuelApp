import type { DeviceTier } from "../../hooks/useDeviceTier";

/** Procedural gas giant parameters for a single device performance tier. */
export interface GasGiantParams {
  /** fbm octaves. The dominant cost knob. */
  octaves: number;
  /** Planet rotation rate, in radians per second. */
  spin: number;
}

/**
 * Gas giant parameters for each device performance tier. The fbm weights halve
 * each octave, so the top octaves contribute a negligible fraction of the signal
 * and dropping them is visually imperceptible.
 *
 * `spin` is half the source shader's rate, so the planet turns at about half
 * speed.
 */
export const GAS_GIANT_TIERS: Record<DeviceTier, GasGiantParams> = {
  high: { octaves: 6, spin: 0.075 },
  medium: { octaves: 5, spin: 0.075 },
  low: { octaves: 4, spin: 0.075 },
};

/**
 * Builds the SkSL fragment shader source for the gas giant background.
 *
 * The camera focal length is derived from the narrower screen axis so the whole
 * planet fits with a fixed margin at any aspect ratio.
 *
 * @param params - Tier-specific shader parameters.
 * @returns The complete SkSL shader source string.
 */
export const makeGasGiantSkSL = (params: GasGiantParams): string => {
  const { octaves, spin } = params;

  return `uniform float2 u_resolution;
uniform float u_time;

const int kOctaves = ${octaves};

float hashf(float p) {
    p = fract(p * 0.011);
    p *= p + 7.5;
    p *= p + p;
    return fract(p);
}

float vnoise(vec3 x) {
    const vec3 stepv = vec3(110.0, 241.0, 171.0);
    vec3 i = floor(x);
    vec3 f = fract(x);
    float n = dot(i, stepv);
    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(mix(hashf(n + dot(stepv, vec3(0.0, 0.0, 0.0))),
                hashf(n + dot(stepv, vec3(1.0, 0.0, 0.0))), u.x),
            mix(hashf(n + dot(stepv, vec3(0.0, 1.0, 0.0))),
                hashf(n + dot(stepv, vec3(1.0, 1.0, 0.0))), u.x), u.y),
        mix(mix(hashf(n + dot(stepv, vec3(0.0, 0.0, 1.0))),
                hashf(n + dot(stepv, vec3(1.0, 0.0, 1.0))), u.x),
            mix(hashf(n + dot(stepv, vec3(0.0, 1.0, 1.0))),
                hashf(n + dot(stepv, vec3(1.0, 1.0, 1.0))), u.x), u.y),
        u.z);
}

float fbm(vec3 x) {
    float v = 0.0;
    float a = 0.5;
    vec3 shift = vec3(100.0);
    for (int i = 0; i < kOctaves; ++i) {
        v += a * vnoise(x);
        x = x * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

const float kPi = 3.1415926535;
const float kInf = 9999999.9;
const float kPlanetSize = 0.75;
const float kCamDist = 5.0;
const float kFitMargin = 1.15;

float squaref(float x) { return x * x; }
float infIfNegative(float x) { return (x >= 0.0) ? x : kInf; }

float intersectSphere(vec3 C, float r, vec3 P, vec3 w) {
    vec3 v = P - C;
    float b = -dot(w, v);
    float c = dot(v, v) - squaref(r);
    float d = squaref(b) - c;
    if (d < 0.0) { return kInf; }
    float dsqrt = sqrt(d);
    return min(infIfNegative(b - dsqrt), infIfNegative(b + dsqrt));
}

float max3(vec3 v) { return max(max(v.x, v.y), v.z); }

vec3 getColorForCoord(vec2 fragCoord) {
    float theta = u_time * ${spin.toFixed(4)};
    mat3 rot = mat3(cos(theta), 0.0, sin(theta),
                    0.0, 1.0, 0.0,
                    -sin(theta), 0.0, cos(theta));

    vec3 P = vec3(0.0, 0.0, kCamDist);
    float fitAngle = asin(kPlanetSize * kFitMargin / kCamDist);
    float focal = -min(u_resolution.x, u_resolution.y) / (2.0 * tan(fitAngle));
    vec3 w = normalize(vec3(fragCoord.xy - u_resolution.xy * 0.5, focal));

    float t = intersectSphere(vec3(0.0), kPlanetSize, P, w);
    if (t >= kInf) { return vec3(0.0); }

    vec3 X = P + w * t;
    X = rot * X;

    vec3 q = vec3(fbm(X + 0.025 * u_time), fbm(X), fbm(X));
    vec3 r = vec3(fbm(X + 1.0 * q + 0.01 * u_time), fbm(X + q), fbm(X + q));
    float v = fbm(X + 5.0 * r + u_time * 0.005);

    vec3 col_top = vec3(1.0, 1.0, 1.0);
    vec3 col_bot = vec3(0.0, 0.0, 0.0);
    vec3 col_mid1 = vec3(0.1, 0.2, 0.0);
    vec3 col_mid2 = vec3(0.7, 0.4, 0.3);
    vec3 col_mid3 = vec3(1.0, 0.4, 0.2);

    vec3 col_mid = mix(col_mid1, col_mid2, clamp(r, 0.0, 1.0));
    col_mid = mix(col_mid, col_mid3, clamp(q, 0.0, 1.0));

    float pos = v * 2.0 - 1.0;
    vec3 color = mix(col_mid, col_top, clamp(pos, 0.0, 1.0));
    color = mix(color, col_bot, clamp(-pos, 0.0, 1.0));
    color = color / max3(color);

    color = (clamp((0.4 * pow(v, 3.0) + pow(v, 2.0) + 0.5 * v), 0.0, 1.0) * 0.9 + 0.1) * color;

    float diffuse = max(0.0, dot(P + w * t, vec3(1.0, sqrt(0.5), 1.0)));
    float ambient = 0.1;
    color *= clamp(diffuse + ambient, 0.0, 1.0);

    color *= (P + w * t).z * 2.0;
    return color;
}

half4 main(vec2 xy) {
    vec2 fragCoord = vec2(xy.x, u_resolution.y - xy.y);
    vec3 c = getColorForCoord(fragCoord);
    return half4(c.r, c.g, c.b, 1.0);
}`;
};
