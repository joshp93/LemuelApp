import type { DeviceTier } from "../hooks/useDeviceTier";

/** Horizontal/vertical inset used around meditation UI content. */
export const INSET = 20;

/** Fallback corner radius when the device doesn't report one. */
export const DEFAULT_CORNER_RADIUS = 30;

/** Stroke width of the innermost (brightest) glow layer. */
export const STROKE_WIDTH = 8;

/** Accent colour used for the meditation UI and capture button. */
export const ACCENT_COLOR = "rgb(25, 51, 179)";

/** Proverb text colour for the dark backgrounds, which light text reads against. */
export const PROVERB_TEXT_COLOR = "#b8c8ff";

/**
 * Proverb text colour for the bright backgrounds — Sunset is a pale sky and
 * Cloud-free star fields are not, so a dark grey carries where light text washes
 * out.
 */
export const PROVERB_TEXT_COLOR_DARK = "#444444";

/** Candidate font sizes (largest first) for fitting the proverb text. */
export const FONT_SIZES = [40, 28, 18];

/**
 * Concentric stroke layers that form the breathing glow around the screen
 * edge. `w` is the stroke width in px, `a` the layer opacity.
 */
export const glowLayers = [
  { w: 80, a: 0.015 },
  { w: 72, a: 0.018 },
  { w: 65, a: 0.021 },
  { w: 59, a: 0.026 },
  { w: 54, a: 0.031 },
  { w: 48, a: 0.037 },
  { w: 44, a: 0.044 },
  { w: 40, a: 0.052 },
  { w: 36, a: 0.062 },
  { w: 32, a: 0.074 },
  { w: 29, a: 0.089 },
  { w: 27, a: 0.106 },
  { w: 24, a: 0.127 },
  { w: 22, a: 0.152 },
  { w: 20, a: 0.181 },
  { w: 18, a: 0.217 },
  { w: 16, a: 0.259 },
  { w: 15, a: 0.309 },
  { w: 13, a: 0.37 },
  { w: 12, a: 0.442 },
  { w: 11, a: 0.528 },
  { w: 10, a: 0.63 },
  { w: 9, a: 0.753 },
  { w: STROKE_WIDTH, a: 0.9 },
];

/** How many glow layers to skip per device tier (higher = fewer layers). */
export const TIER_GLOW_STEP: Record<DeviceTier, number> = {
  high: 1,
  medium: 2,
  low: 3,
};
