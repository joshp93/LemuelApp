import {
  PROVERB_TEXT_COLOR,
  PROVERB_TEXT_COLOR_DARK,
} from "../../constants/meditation";
import type { DeviceTier } from "../../hooks/useDeviceTier";
import { makeBlankSkSL } from "./blank";
import { GAS_GIANT_TIERS, makeGasGiantSkSL } from "./gas-giant";
import { makeSineMountainsSkSL } from "./sine-mountains";
import { makeStarFieldSkSL, STAR_FIELD_TIERS } from "./star-field";
import { makeSunsetSkSL, SUNSET_TIERS } from "./sunset";

/**
 * Identifier for a selectable meditation background. `"none"` is the
 * "Don't show an animation" option, which renders a flat black background.
 */
export type MeditationShaderId =
  | "star-field"
  | "gas-giant"
  | "sine-mountains"
  | "sunset"
  | "none";

/** A selectable meditation background. */
export interface MeditationShader {
  id: MeditationShaderId;
  /** Sentence-case name shown in the settings list. */
  label: string;
  /**
   * Colour of the proverb text drawn over this background. Darker backgrounds
   * take the light default; bright ones need a dark grey to stay legible.
   */
  textColour: string;
  /**
   * Builds the SkSL source for this shader at a device performance tier.
   *
   * @param tier - The device's performance tier.
   * @returns The complete SkSL shader source string.
   */
  makeSkSL: (tier: DeviceTier) => string;
}

/** Every shader, in settings-list order. */
export const MEDITATION_SHADERS: readonly MeditationShader[] = [
  {
    id: "star-field",
    label: "Star field",
    textColour: PROVERB_TEXT_COLOR,
    makeSkSL: (tier) => makeStarFieldSkSL(STAR_FIELD_TIERS[tier]),
  },
  {
    id: "gas-giant",
    label: "Gas giant",
    textColour: PROVERB_TEXT_COLOR,
    makeSkSL: (tier) => makeGasGiantSkSL(GAS_GIANT_TIERS[tier]),
  },
  {
    id: "sine-mountains",
    label: "Sine mountains",
    textColour: PROVERB_TEXT_COLOR,
    makeSkSL: () => makeSineMountainsSkSL(),
  },
  {
    id: "sunset",
    label: "Sunset",
    textColour: PROVERB_TEXT_COLOR_DARK,
    makeSkSL: (tier) => makeSunsetSkSL(SUNSET_TIERS[tier]),
  },
  {
    id: "none",
    label: "Don't show an animation",
    textColour: PROVERB_TEXT_COLOR,
    makeSkSL: () => makeBlankSkSL(),
  },
];

/** Every valid shader id. */
export const MEDITATION_SHADER_IDS: readonly MeditationShaderId[] =
  MEDITATION_SHADERS.map((shader) => shader.id);

/** The blank-background option, which renders no animation. */
export const BLANK_SHADER_ID: MeditationShaderId = "none";

/**
 * Shaders enabled for a user who has never made a choice: every animation, but
 * not the blank background.
 */
export const DEFAULT_ENABLED_SHADER_IDS: readonly MeditationShaderId[] =
  MEDITATION_SHADER_IDS.filter((id) => id !== BLANK_SHADER_ID);

/** The shader used when the user has no usable selection. */
export const DEFAULT_SHADER_ID: MeditationShaderId = "star-field";

const SHADERS_BY_ID: Record<MeditationShaderId, MeditationShader> =
  Object.fromEntries(
    MEDITATION_SHADERS.map((shader) => [shader.id, shader]),
  ) as Record<MeditationShaderId, MeditationShader>;

/**
 * Narrows an unknown value to a known shader id.
 *
 * @param value - The value to test.
 * @returns True when the value is a known shader id.
 */
export function isMeditationShaderId(
  value: unknown,
): value is MeditationShaderId {
  return (
    typeof value === "string" &&
    (MEDITATION_SHADER_IDS as readonly string[]).includes(value)
  );
}

/**
 * Looks up a shader by id.
 *
 * @param id - The shader id.
 * @returns The matching shader.
 */
export function getMeditationShader(id: MeditationShaderId): MeditationShader {
  return SHADERS_BY_ID[id];
}

/**
 * Picks a shader at random from an enabled set.
 *
 * {@linkcode BLANK_SHADER_ID} is exclusive: when it is selected it wins outright
 * and the animations are ignored, which is what "Don't show an animation" means
 * in Settings. The animations it is stored alongside are remembered so they come
 * back when it is deselected.
 *
 * Unknown ids in `enabled` are ignored, and an empty (or entirely unknown) set
 * falls back to {@linkcode DEFAULT_SHADER_ID} so a meditation always has a
 * background.
 *
 * @param enabled - The shader ids the user has enabled.
 * @returns The id of the chosen shader.
 */
export function pickRandomShaderId(
  enabled: readonly MeditationShaderId[],
): MeditationShaderId {
  const usable = enabled.filter(isMeditationShaderId);
  if (usable.length === 0) return DEFAULT_SHADER_ID;
  if (usable.includes(BLANK_SHADER_ID)) return BLANK_SHADER_ID;
  return usable[Math.floor(Math.random() * usable.length)];
}
