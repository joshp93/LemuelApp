import { useState, useCallback, useRef } from "react";
import type { TextLayoutEvent } from "react-native";

export function useFitFontSize(
  text: string | undefined,
  boxHeight: number,
  sizes: number[],
) {
  const [index, setIndex] = useState(0);
  const fontSize = sizes[index];
  const keyRef = useRef<string | null>(null);

  const onTextLayout = useCallback(
    (e: TextLayoutEvent) => {
      const key = `${text ?? ""}|${boxHeight}`;

      if (key !== keyRef.current) {
        keyRef.current = key;
        setIndex(0);
      }

      const totalHeight = e.nativeEvent.lines.reduce(
        (sum: number, line: { height: number }) => sum + line.height,
        0,
      );
      if (totalHeight > boxHeight && index < sizes.length - 1) {
        setIndex((i) => i + 1);
      }
    },
    [text, boxHeight, index, sizes.length],
  );

  return { fontSize, onTextLayout };
}