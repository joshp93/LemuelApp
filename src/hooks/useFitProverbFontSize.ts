import { fitFontSize, layout, prepare } from "expo-pretext";
import { useMemo } from "react";

const FONT_FAMILY = "Nunito_400Regular";

/** Options to configure the font size binary search bounds. */
export interface FitOptions {
  /** Minimum font size in px (default 12). Text will never go below this. */
  minSize?: number;
  /** Maximum font size in px (default 48). Text will never exceed this. */
  maxSize?: number;
  /** Granularity of the binary search in px (default 1). Lower = more precise but more iterations. */
  step?: number;
}

/** Result of the font size fitting calculation. */
export interface FitResult {
  /** The computed font size in px, clamped to [minSize, maxSize]. */
  fontSize: number;
  /** True when even minSize is too tall for the box — indicates scroll may be needed. */
  overflowsAtMin: boolean;
}

/**
 * Determines the largest font size that fits a proverb within a bounding box,
 * clamped by min/max constraints.
 *
 * Uses `expo-pretext`'s `fitFontSize` to synchronously binary-search the
 * optimal font. When the result hits `minSize`, a second measurement verifies
 * whether the text actually overflows (`overflowsAtMin`).
 *
 * @param text - The proverb text to measure.
 * @param boxWidth - Available width in px for the text to wrap within.
 * @param boxHeight - Available height in px the text must fit within.
 * @param options - Bounds and precision for the binary search.
 *
 * @returns An object with the best-fit font size and an overflow flag.
 *
 * @example
 * ```ts
 * const { fontSize, overflowsAtMin } = useFitProverbFontSize(
 *   proverb?.proverb,
 *   screenWidth - 64,
 *   screenHeight - 200,
 *   { minSize: 20, maxSize: 56 },
 * )
 * ```
 */
export function useFitProverbFontSize(
  text: string | undefined,
  boxWidth: number,
  boxHeight: number,
  { minSize = 12, maxSize = 48, step = 1 }: FitOptions = {},
): FitResult {
  return useMemo(() => {
    if (!text || boxWidth <= 0 || boxHeight <= 0) {
      return { fontSize: maxSize, overflowsAtMin: false };
    }

    const computed = fitFontSize(
      text,
      { fontFamily: FONT_FAMILY, fontSize: 1 },
      boxWidth,
      boxHeight,
      { minSize, maxSize, step },
    );

    let overflowsAtMin = false;
    if (computed === minSize) {
      const p = prepare(text, { fontFamily: FONT_FAMILY, fontSize: minSize });
      const r = layout(p, boxWidth);
      overflowsAtMin = r.height > boxHeight;
    }

    return { fontSize: computed, overflowsAtMin };
  }, [text, boxWidth, boxHeight, minSize, maxSize, step]);
}