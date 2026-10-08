import {
  isShaderToggleDisabled,
  toggleShaderSelection,
} from "../../src/settings/shader-selection";
import {
  BLANK_SHADER_ID,
  DEFAULT_ENABLED_SHADER_IDS,
  type MeditationShaderId,
} from "../../src/utils/meditation-shaders";

const STAR_FIELD: MeditationShaderId = "star-field";
const GAS_GIANT: MeditationShaderId = "gas-giant";

describe("toggleShaderSelection", () => {
  it("adds an animation that was off", () => {
    expect(toggleShaderSelection([STAR_FIELD], GAS_GIANT)).toEqual([
      STAR_FIELD,
      GAS_GIANT,
    ]);
  });

  it("removes an animation that was on", () => {
    expect(toggleShaderSelection([STAR_FIELD, GAS_GIANT], GAS_GIANT)).toEqual([
      STAR_FIELD,
    ]);
  });

  it("refuses to remove the last animation", () => {
    const selected: MeditationShaderId[] = [STAR_FIELD];

    expect(toggleShaderSelection(selected, STAR_FIELD)).toBe(selected);
  });

  it("clears the animations when the blank background is selected", () => {
    expect(
      toggleShaderSelection([STAR_FIELD, GAS_GIANT], BLANK_SHADER_ID),
    ).toEqual([STAR_FIELD, GAS_GIANT, BLANK_SHADER_ID]);
  });

  it("brings the animations back when the blank background is deselected", () => {
    expect(
      toggleShaderSelection([STAR_FIELD, BLANK_SHADER_ID], BLANK_SHADER_ID),
    ).toEqual([STAR_FIELD]);
  });

  it("restores every animation when the blank background was the only selection", () => {
    expect(toggleShaderSelection([BLANK_SHADER_ID], BLANK_SHADER_ID)).toEqual([
      ...DEFAULT_ENABLED_SHADER_IDS,
    ]);
  });

  it("adds the blank background on its own when nothing else is selected", () => {
    const selected: MeditationShaderId[] = [STAR_FIELD];

    expect(toggleShaderSelection(selected, BLANK_SHADER_ID)).toEqual([
      STAR_FIELD,
      BLANK_SHADER_ID,
    ]);
  });

  it("adds an animation alongside the blank background when the row is not locked", () => {
    const selected: MeditationShaderId[] = [BLANK_SHADER_ID];

    expect(toggleShaderSelection(selected, GAS_GIANT)).toEqual([
      BLANK_SHADER_ID,
      GAS_GIANT,
    ]);
  });

  it("does not mutate the selection it is given", () => {
    const selected: MeditationShaderId[] = [STAR_FIELD];

    toggleShaderSelection(selected, GAS_GIANT);

    expect(selected).toEqual([STAR_FIELD]);
  });
});

describe("isShaderToggleDisabled", () => {
  it("never locks the blank background row", () => {
    expect(isShaderToggleDisabled([STAR_FIELD], BLANK_SHADER_ID)).toBe(false);
    expect(isShaderToggleDisabled([BLANK_SHADER_ID], BLANK_SHADER_ID)).toBe(
      false,
    );
  });

  it("locks the last remaining animation", () => {
    expect(isShaderToggleDisabled([STAR_FIELD], STAR_FIELD)).toBe(true);
    expect(isShaderToggleDisabled([STAR_FIELD, GAS_GIANT], STAR_FIELD)).toBe(
      false,
    );
  });

  it("locks every animation while the blank background is selected", () => {
    const selected: MeditationShaderId[] = [BLANK_SHADER_ID, GAS_GIANT];

    expect(isShaderToggleDisabled(selected, GAS_GIANT)).toBe(true);
    expect(isShaderToggleDisabled(selected, STAR_FIELD)).toBe(true);
  });
});
