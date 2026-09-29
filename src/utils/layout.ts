import { MAX_CONTENT_WIDTH } from "../constants/layout";

/**
 * Calculates the gutter either side of the content column.
 *
 * @param windowWidth - Width of the viewport in logical pixels.
 * @returns Half of the space left over once the content column is removed,
 *   or `0` when the viewport is no wider than the column.
 */
export function getContentGutter(windowWidth: number): number {
  return Math.max(0, (windowWidth - MAX_CONTENT_WIDTH) / 2);
}
