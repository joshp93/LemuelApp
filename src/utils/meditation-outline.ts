/**
 * Builds the rounded-rectangle outline the meditation glow is stroked along.
 *
 * The path starts and ends at the top-centre so the four animated segments can
 * each draw from a corner toward that single seam without overlapping.
 *
 * @param width - Canvas width in px.
 * @param height - Canvas height in px.
 * @param cornerRadius - Radius of the screen's rounded corners, in px.
 * @returns The SVG path string, or `null` while the canvas has no measured
 *          size.
 */
export function buildMeditationOutline(
  width: number,
  height: number,
  cornerRadius: number,
): string | null {
  if (width === 0 || height === 0) return null;

  const R = cornerRadius;
  const cx = width / 2;

  return [
    `M ${cx} 0`,
    `L ${width - R} 0`,
    `A ${R} ${R} 0 0 1 ${width} ${R}`,
    `L ${width} ${height - R}`,
    `A ${R} ${R} 0 0 1 ${width - R} ${height}`,
    `L ${R} ${height}`,
    `A ${R} ${R} 0 0 1 0 ${height - R}`,
    `L 0 ${R}`,
    `A ${R} ${R} 0 0 1 ${R} 0`,
    `L ${cx} 0`,
    "Z",
  ].join(" ");
}
