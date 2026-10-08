import { useEffect, useState } from "react";
import { getEnabledMeditationShaders } from "../settings/meditation-preferences";
import {
  getMeditationShader,
  type MeditationShader,
  pickRandomShaderId,
} from "../utils/meditation-shaders";

/**
 * Resolves the background shader for a single meditation.
 *
 * The shader is chosen at random from the user's enabled set, once, when the
 * screen mounts — it never changes while the meditation is running.
 *
 * `null` is returned until the stored preferences have resolved. Seeding the
 * state with a default shader instead would compile and paint that shader for
 * the first frames and then swap, which flashes the wrong background and costs
 * a second runtime-effect compile during the screen's entrance. Callers hold a
 * black background until a shader is available.
 *
 * @returns The chosen shader, or `null` while preferences are loading.
 */
export function useMeditationShader(): MeditationShader | null {
  const [shader, setShader] = useState<MeditationShader | null>(null);

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
