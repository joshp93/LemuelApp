import { useEffect, useState } from "react";
import { getEnabledMeditationShaders } from "../settings/meditation-preferences";
import {
  DEFAULT_SHADER_ID,
  getMeditationShader,
  type MeditationShader,
  pickRandomShaderId,
} from "../utils/meditation-shaders";

/**
 * Resolves the background shader for a single meditation.
 *
 * The shader is chosen at random from the user's enabled set, once, when the
 * screen mounts — it never changes while the meditation is running. Until the
 * stored preferences have loaded it returns the default shader, so there is
 * always something to draw.
 *
 * @returns The chosen shader.
 */
export function useMeditationShader(): MeditationShader {
  const [shader, setShader] = useState<MeditationShader>(() =>
    getMeditationShader(DEFAULT_SHADER_ID),
  );

  useEffect(() => {
    let active = true;

    getEnabledMeditationShaders().then((ids) => {
      if (active) setShader(getMeditationShader(pickRandomShaderId(ids)));
    });

    return () => {
      active = false;
    };
  }, []);

  return shader;
}
