import { Canvas, Fill, Path } from "@shopify/react-native-skia";
import type { SharedValue } from "react-native-reanimated";

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
  outlinePath: string;
  segments: ArcSegment[];
  sampledGlowLayers: GlowLayer[];
}

/**
 * Skia canvas that renders the meditation glow arc.
 *
 * This component is loaded lazily via {@linkcode WithSkiaWeb} so that
 * CanvasKit WASM is fully initialised before the Skia module is imported.
 * It is the *only* file in the project that imports from
 * `@shopify/react-native-skia` on web.
 */
export default function MeditationCanvas({
  outlinePath,
  segments,
  sampledGlowLayers,
}: MeditationCanvasProps) {
  return (
    <Canvas
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <Fill color="black" />
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
