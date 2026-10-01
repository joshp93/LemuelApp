import {
  Canvas,
  Fill,
  Path,
  Shader,
  Skia,
  type Uniforms,
  useClock,
} from "@shopify/react-native-skia";
import { useMemo } from "react";
import type { SharedValue } from "react-native-reanimated";
import { useDerivedValue } from "react-native-reanimated";
import type { DeviceTier } from "../hooks/useDeviceTier";
import {
  getMeditationShader,
  type MeditationShaderId,
} from "../utils/meditation-shaders";

/** A single glow layer descriptor used by the meditation arc. */
interface GlowLayer {
  w: number;
  a: number;
}

/** A progress segment with derived start/end values driven by an animation. */
interface ArcSegment {
  start: SharedValue<number>;
  end: SharedValue<number>;
}

interface MeditationCanvasProps {
  shaderId: MeditationShaderId;
  outlinePath: string;
  segments: ArcSegment[];
  sampledGlowLayers: GlowLayer[];
  tier: DeviceTier;
  resolution: SharedValue<number[]>;
}

/**
 * Skia canvas that renders the meditation glow arc and the selected background
 * shader.
 *
 * This component is loaded lazily via {@linkcode WithSkiaWeb} so that
 * CanvasKit WASM is fully initialised before the Skia module is imported.
 */
export default function MeditationCanvas({
  shaderId,
  outlinePath,
  segments,
  sampledGlowLayers,
  tier,
  resolution,
}: MeditationCanvasProps) {
  const sksl = useMemo(
    () => getMeditationShader(shaderId).makeSkSL(tier),
    [shaderId, tier],
  );
  const effect = useMemo(() => Skia.RuntimeEffect.Make(sksl), [sksl]);

  const clock = useClock();
  const uniforms = useDerivedValue<Uniforms>(() => ({
    u_time: clock.value / 1000,
    u_resolution: resolution.value,
  }));

  return (
    <Canvas
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {effect && uniforms ? (
        <Fill>
          <Shader source={effect} uniforms={uniforms} />
        </Fill>
      ) : (
        <Fill color="black" />
      )}
      {segments.map((seg, si) =>
        sampledGlowLayers.map(({ w, a }, li) => (
          <Path
            key={`${si}-${li}`}
            path={outlinePath}
            style="stroke"
            strokeWidth={w}
            color={`rgba(25,51,179,${a})`}
            start={seg.start}
            end={seg.end}
            strokeCap="round"
            strokeJoin="round"
          />
        )),
      )}
    </Canvas>
  );
}
