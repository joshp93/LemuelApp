/**
 * Builds the SkSL fragment shader source for the "Don't show an animation"
 * option — a flat black background.
 *
 * It draws through the same path as every other animation so the canvas, the
 * screens and the uniforms plumbing all stay uniform. The proverb text is
 * rendered by the overlay, not by the shader, so it is unaffected.
 *
 * @returns The complete SkSL shader source string.
 */
export const makeBlankSkSL = (): string => `uniform float2 u_resolution;
uniform float u_time;

half4 main(vec2 xy) {
    return half4(0.0, 0.0, 0.0, 1.0);
}`;
