/**
 * Builds the SkSL fragment shader source for the sine mountains scene.
 *
 * The source shader used `fwidth(uv.x)` as an anti-aliasing width, but SkSL
 * runtime effects expose no derivative functions. Because `uv.x` is a linear
 * function of the fragment coordinate, `fwidth(uv.x)` is exactly
 * `1.0 / u_resolution.y`, which is what the `pixelWidth` helper returns.
 *
 * The scene has no loops and needs no per-tier parameters — it is cheap enough
 * to run unchanged on every device tier.
 *
 * @returns The complete SkSL shader source string.
 */
export const makeSineMountainsSkSL = (): string => `uniform float2 u_resolution;
uniform float u_time;

const float kPi = 3.14159265358979;
const float kTwoPi = 6.28318530717959;

const vec3 whitec = vec3(0xdc, 0xe0, 0xd1) / float(0xff);
const vec3 darkc = vec3(0x1a, 0x13, 0x21) / float(0xff);
const vec3 bluebg = vec3(0x00, 0x19, 0x5e) / float(0xff);
const vec3 colsun = vec3(0x07, 0xaf, 0x81) / float(0xff);
const vec3 white2 = vec3(0xec, 0xe8, 0x9e) / float(0xff);
const vec3 l1 = vec3(0x07, 0x27, 0x21) / float(0xff);
const vec3 l2 = vec3(0x00, 0x6c, 0xae) / float(0xff);
const vec3 l3 = vec3(0x00, 0x48, 0x7f) / float(0xff);
const vec3 treecol = vec3(0x12, 0x19, 0x27) / float(0xff);
const vec3 watercol = vec3(0xcf, 0xe5, 0xf2) / float(0xff);
const vec3 traincol = vec3(0x00, 0x6a, 0xb9) / float(0xff);
const vec3 trainlcol = vec3(0xef, 0xe8, 0x95) / float(0xff);

float pixelWidth() { return 1.0 / u_resolution.y; }

float xRandom(float x) { return mod(x * 7241.6465 + 2130.465521, 64.984131); }

float mfunc(float x, float xx, float yy) {
    x /= 0.20 * 3.14159;
    x = mod((x) * 2.0, 2.8) - 1.195;
    x *= 19.0 * 3.14159;
    return abs(8.0 + abs(-19.15 + abs(-15.0 + yy + abs(-12.25 - yy + abs(-18.0 + xx + abs(-15.0 - xx + abs(0.95 * x + 4.0))))))) / 100.0;
}

float hash2f(vec2 p) {
    return fract(dot(sin(p.x * 591.32 + p.y * 154.077), cos(p.x * 391.32 + p.y * 49.077)));
}

float noise2f(float y, float t) {
    vec2 fl = vec2(floor(y), floor(t));
    vec2 fr = vec2(fract(y), fract(t));
    float a = mix(hash2f(fl + vec2(0.0, 0.0)), hash2f(fl + vec2(1.0, 0.0)), fr.x);
    float b = mix(hash2f(fl + vec2(0.0, 1.0)), hash2f(fl + vec2(1.0, 1.0)), fr.x);
    return mix(a, b, fr.y);
}

float lineF(vec2 uv, float width, float center) {
    return 1.0 - smoothstep(0.0, width / 2.0, (uv.y - center));
}

float circleF(vec2 uv, float r1, float r2, bool disk) {
    float w = 2.0 * pixelWidth();
    float t = r1 - r2;
    float r = r1;
    if (!disk) {
        return smoothstep(-w / 2.0, w / 2.0, abs(length(uv) - r) - t / 2.0);
    }
    return smoothstep(-w / 3.0, w / 3.0, (length(uv) - r));
}

float circle2F(vec2 uv, float r1, float r2, bool disk) {
    float w = 2.0 * pixelWidth();
    float t = r1 - r2;
    float r = r1;
    if (!disk) {
        return smoothstep(-w / 2.0, w / 2.0, abs(length(uv) - r) - t / 2.0);
    }
    return smoothstep(-w / 3.0, 1.05 + w / 3.0, (length(uv) - r));
}

float w1F(float x) {
    x += -0.45;
    float t = mod(u_time + 150.1, 310.0);
    if (t > 150.0) {
        return 1.5 + 10.15 * mfunc(x * 0.7, -80.0 * (cos(0.5 + mod(0.0 / 150.0 + 1.0, 3.0))), 0.0);
    }
    if (t > 5.0) {
        return 1.5 + 10.15 * mfunc(x * 0.7, -80.0 * (cos(0.5 + mod((t - 5.0) / 140.0 + 1.0, 3.0))), 0.0);
    }
    return 1.5 + 10.15 * mfunc(x * 0.7, -80.0 * (cos(0.5 + mod(0.0 / 140.0 + 1.0, 3.0))), 0.0);
}

float layerF(vec2 uv) {
    float t = mod(u_time + 150.1, 310.0);
    uv *= 0.5;
    if (t > 150.0) { uv.x += ((t - 150.0) / 200.0); }
    uv.x += 50.0;
    uv.y += -0.21;
    float Line_Smooth = 1.0;
    float Amplitude1 = w1F(uv.x);
    vec2 p = uv;
    float Light_Track = lineF(vec2(p.x, p.y * 1.5 + (Amplitude1 - 0.5) * 0.12 * Line_Smooth), 0.005, 0.0);
    if (t < 150.0) { return Light_Track * smoothstep(0.0, 5.0, t); }
    if (t < 300.0) { return Light_Track * smoothstep(150.0, 155.0, t); }
    return Light_Track * smoothstep(305.0, 300.0, t);
}

float shapeF(vec2 uv, int N, float radius_in, float radius_out, float zoom) {
    float a = atan(uv.x, uv.y) + kPi;
    float rx = kTwoPi / float(N);
    float d = cos(floor(0.5 + a / rx) * rx - a) * length(uv);
    float color = smoothstep(0.44, 0.44 + (2.0 + 1.2 * zoom) / u_resolution.y,
                             abs(d - radius_in) + radius_out);
    return 1.0 - color;
}

float msineF(vec2 uv) {
    float heightA = 0.025;
    float heightB = 0.025;
    float heightC = 0.013;
    float y = sin((uv.x + 1.0) * 5.0) * heightA;
    y = y + sin((uv.x + 0.0 / 5.0) * 3.0) * heightB;
    y = y + sin((uv.x + 1.0) * 2.0) * heightC;
    return y;
}

float treesF(vec2 uv) {
    float zoom = 10.0;
    uv.x += u_time / 35.0;
    uv *= zoom;
    vec2 tuvy = vec2(0.0, 8.0 * msineF(vec2(floor(uv.x / 0.38), uv.y) / zoom));
    float rval = xRandom(floor(uv.x / 0.38));
    float d = 0.0;
    if (rval > 85.0 * fract(cos(rval)) + 85.0 * (sin(rval))) {
        rval = max(1.0, 2.5 * abs(sin(rval)));
        uv.x = mod(uv.x, 0.38) - 0.19;
        uv += tuvy;
        uv *= rval;
        float xval = 1.2 * sin(xRandom(tuvy.y)) * 0.19 * (1.25 - rval);
        uv.y += 0.75 / rval;
        uv.x += xval;
        vec2 ouv = uv;
        uv.y *= 0.85;
        d = shapeF(uv, 3, -0.380, 0.0, zoom + rval);
        uv.y += 0.12;
        uv.y *= 0.75;
        d = max(d, shapeF(uv, 3, -0.370, 0.0, zoom + rval));
        uv.y += 0.1;
        uv.y *= 1.2;
        d = max(d, shapeF(uv, 3, -0.3650, 0.0, zoom + rval));
        d = max(d, smoothstep(0.02 + (2.0 + 1.2 * (zoom + rval)) / u_resolution.y,
                              0.02, abs(uv.x)) * step(ouv.y, 0.0)) *
                step(-0.75 + 0.12 * (2.5 - rval), ouv.y);
    }
    return d;
}

float layer_bghillsF(vec2 uv) {
    uv.x += u_time / 35.0;
    return smoothstep(0.5 + 20.0 / u_resolution.y, 0.5,
                      msineF(uv / 0.38 - 0.038) * 10.0 + uv.y * 10.0 + 1.6);
}

float treexF(vec2 uv) {
    uv.y += 0.08;
    return treesF(uv);
}

float waterF(vec2 uv) { return step(uv.y, -0.25); }

float hash11(float p) {
    vec3 p3 = fract(vec3(p) * 443.8975);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
}

float lerp1(float a, float b, float t) { return a + t * (b - a); }

float noise1(float p) {
    float i = floor(p);
    float f = fract(p);
    float t = f * f * (3.0 - 2.0 * f);
    return lerp1(f * hash11(i), (f - 1.0) * hash11(i + 1.0), t);
}

float fbm1(float x, float persistence) {
    float total = 0.0;
    float maxValue = 0.0;
    float amplitude = 1.0;
    float frequency = 1.0;
    for (int i = 0; i < 4; ++i) {
        total += noise1(x * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= persistence;
        frequency *= 2.0;
    }
    return total / maxValue;
}

float msine2F(vec2 uv) { return fbm1(uv.x / 10.0, 0.25) * 20.0 + 0.5; }

float trees2F(vec2 uv) {
    float zoom = 10.0;
    uv.x += u_time / 45.0;
    uv *= zoom;
    vec2 tuvy = vec2(0.0, 0.2 * msine2F(vec2(floor(uv.x / 0.38), uv.y)));
    float rval = xRandom(floor(uv.x / 0.38));
    float d = 0.0;
    if (rval > 55.0 * fract(cos(rval)) + 85.0 * (sin(rval))) {
        rval = max(1.5, 2.5 * abs(sin(rval)));
        uv.x = mod(uv.x, 0.38) - 0.19;
        uv += tuvy;
        uv *= rval;
        float xval = -1.2 * sin(xRandom(tuvy.y)) * 0.19 * (1.25 - rval);
        uv.y += -0.25 / rval;
        uv.x += xval;
        vec2 ouv = uv;
        uv.y *= 0.85;
        d = shapeF(uv, 3, -0.380, 0.0, zoom + rval);
        uv.y += 0.12;
        uv.y *= 0.75;
        d = max(d, shapeF(uv, 3, -0.370, 0.0, zoom + rval));
        uv.y += 0.1;
        uv.y *= 1.2;
        d = max(d, shapeF(uv, 3, -0.3650, 0.0, zoom + rval));
        d = max(d, smoothstep(0.02 + (2.0 + 1.2 * (zoom + rval)) / u_resolution.y,
                              0.02, abs(uv.x)) * step(ouv.y, 0.0)) *
                step(-0.75 + 0.12 * (2.5 - rval), ouv.y);
    }
    return d;
}

float layer_bghills2F(vec2 uv) {
    uv.x += 1.2;
    uv.x += u_time / 45.0;
    float d = smoothstep(5.5 + 20.0 / u_resolution.y, 5.5,
                         msine2F(uv / 0.38 - 0.038) * 40.0 + uv.y * 40.0 + 10.6);
    d = smoothstep(-0.1555 + 8.0 / u_resolution.y, -0.1555,
                   0.2 * msine2F((uv * 10.0) / 0.38 - 0.038) + uv.y * 11.0 + 0.86);
    return d;
}

float treex2F(vec2 uv) {
    uv.x += 1.2;
    uv.y += 0.08;
    return trees2F(uv);
}

vec3 undw(vec2 uv, vec3 tc) {
    vec2 res = u_resolution.xy / u_resolution.y;
    uv.x += u_time / 10.0;
    uv += res / 2.0;
    uv.y = 1.0 - uv.y;
    uv.y += -0.759;
    uv.x *= 0.5;
    uv *= 5.3;
    float divs = 5.0;
    float slope = 4.2;
    float y_off = sin(2.0 * uv.y);
    float vy = (uv.y + (floor(5.0 - (uv.y + 2.75) / 0.52) / 5.0) * sin(uv.x * 6.28318 + y_off) * 0.1 - 0.05);
    float c = (smoothstep(0.0, 1.0, mod(vy * divs, 1.0) * slope) + floor(vy * divs)) / divs;
    vec2 uv_d = vec2(uv.x * 0.3 + y_off * 0.01, c);
    vec3 fragColor = vec3(0.0);
    fragColor.r = pow(c, 1.0 / tc.r);
    fragColor.g = pow(c, 1.0 / tc.g);
    fragColor.b = pow(c, 1.0 / tc.b);
    fragColor.rgb *= tc * (-noise2f(uv_d.x, uv_d.y) * 0.3 + 0.7);
    return max(vec3(0.0), fragColor);
}

float trainxlF(vec2 uv) {
    uv.y += 0.3;
    uv.y += -0.07;
    vec2 ouv = uv;
    uv.x = mod(uv.x, 0.01) - 0.005;
    float d = smoothstep(0.0045 + 2.0 / u_resolution.y, 0.0025, abs(uv.x));
    d *= step(abs(uv.y), 0.0025);
    uv.x = ouv.x;
    uv.x = mod(uv.x, 0.15) - 0.005;
    d *= step(abs(uv.x), 0.0025 * 50.0);
    d *= step(ouv.x, -0.05);
    d *= step(-0.50, ouv.x);
    d += smoothstep(0.0110 + 2.0 / u_resolution.y, 0.01, abs(ouv.x + 0.021)) * step(abs(uv.y), 0.0025);
    d += smoothstep(0.025 + 2.0 / u_resolution.y, 0.024, abs(ouv.x - 0.035)) * step(abs(uv.y), 0.0025);
    return d;
}

float trainxF(vec2 uv) {
    uv.y += 0.325;
    float d = 1.0 - circleF(uv, 0.11, 0.0, true);
    float stval = step(0.07, uv.y);
    d *= stval;
    d = max(d, step(-0.5, uv.x) * step(uv.x, 0.0) * step(uv.y, 0.109)) * stval;
    d = max(d, 1.0 - circleF(uv + vec2(0.5, 0.0), 0.11, 0.0, true)) * stval;
    return d;
}

half4 main(vec2 xy) {
    vec2 fragCoord = vec2(xy.x, u_resolution.y - xy.y);
    vec2 res = u_resolution.xy / u_resolution.y;
    vec2 uv = fragCoord / u_resolution.y - res / 2.0;
    float b = 1.0 - circleF(uv - 0.21, 0.1242, 0.22, true);
    vec3 col = vec3(bluebg);
    float b1 = 1.0 - circle2F(uv - 0.21, 0.1242, 0.22, true);
    float b2 = smoothstep(-1.0, -0.05, uv.y);
    float lx1 = layerF(uv + vec2(0.0, -0.152));
    col = col - lx1 * l1 * b1;
    col += b1 * colsun;
    col = mix(col, white2, min(b, 1.0 - lx1));
    col = mix(col, l2 * b1, layer_bghills2F(uv + vec2(0.0, -0.05)));
    col = mix(col, 3.0 * treecol * b1, treex2F(uv + vec2(0.0, -0.05)));
    col = mix(col, l3 * b1, layer_bghillsF(uv + vec2(0.0, 0.0)));
    col = mix(col, treecol * b1, treexF(uv + vec2(0.0, 0.0)));
    vec3 toplvlcol2 = vec3(0.0);
    if (uv.y < -0.25) { toplvlcol2 = undw(uv, watercol); }
    col = mix(col, toplvlcol2 + 0.42 * b2 * l2, waterF(uv));
    uv.x += 0.3 * (sin(0.5 * sin(u_time / 8.0) + cos(u_time / 10.0)));
    float trx = trainxF(uv);
    col = mix(col, traincol * b1, (trx * (1.0 - waterF(uv))));
    col = mix(col, trainlcol, trainxlF(uv) * trx);
    return half4(col.r, col.g, col.b, 1.0);
}`;
