import {
  BLANK_SHADER_ID,
  DEFAULT_ENABLED_SHADER_IDS,
  type MeditationShaderId,
} from "../utils/meditation-shaders";

/**
 * Applies a shader row toggle.
 *
 * The selection always encodes a single intent: either a set of animations, or
 * "Don't show an animation". Selecting the blank background therefore clears
 * the animations rather than sitting alongside them, and deselecting it brings
 * them back. Turning off the last animation is refused, because a meditation
 * must always have something to draw.
 *
 * @param selected - The currently selected shader ids.
 * @param id - The shader id whose row was toggled.
 * @returns The next selection, or `selected` itself when the toggle is refused.
 */
export function toggleShaderSelection(
  selected: MeditationShaderId[],
  id: MeditationShaderId,
): MeditationShaderId[] {
  const isSelected = selected.includes(id);

  if (id === BLANK_SHADER_ID) {
    const next = isSelected
      ? selected.filter((existing) => existing !== BLANK_SHADER_ID)
      : [...selected, BLANK_SHADER_ID];
    return next.length === 0 ? [...DEFAULT_ENABLED_SHADER_IDS] : next;
  }

  const next = isSelected
    ? selected.filter((existing) => existing !== id)
    : [...selected, id];

  const animations = next.filter((existing) => existing !== BLANK_SHADER_ID);
  return animations.length === 0 ? selected : next;
}

/**
 * Whether a shader row's switch is locked.
 *
 * The blank background is always toggleable. An animation is locked while the
 * blank background is selected — the two are mutually exclusive — and when it
 * is the last animation left.
 *
 * @param selected - The currently selected shader ids.
 * @param id - The shader id for the row being rendered.
 * @returns True when the row cannot be changed.
 */
export function isShaderToggleDisabled(
  selected: readonly MeditationShaderId[],
  id: MeditationShaderId,
): boolean {
  if (id === BLANK_SHADER_ID) return false;
  if (selected.includes(BLANK_SHADER_ID)) return true;

  const animations = selected.filter(
    (existing) => existing !== BLANK_SHADER_ID,
  );
  return animations.length === 1 && selected.includes(id);
}
