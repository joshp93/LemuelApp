import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type LayoutChangeEvent,
  type TextLayoutEvent,
  View,
  type ViewProps,
} from "react-native";
import { abbreviateProverbRef } from "../utils/proverb-helper";
import { Text } from "./themed-text";
import { VersionDropdown } from "./version-dropdown";

const APPROX_DROPDOWN_WIDTH = 72;

interface ProverbReferenceHeaderTextProps {
  proverbRef?: string;
  loading?: boolean;
  error?: unknown;
  selectedVersion: string | null;
  availableVersions?: string[];
  onVersionChange?: (version: string) => void;
}

export function ProverbReferenceHeaderText({
  proverbRef,
  loading,
  error,
  selectedVersion,
  availableVersions,
  onVersionChange,
  style,
  ...props
}: ProverbReferenceHeaderTextProps & ViewProps) {
  const [variantWidths, setVariantWidths] = useState<number[]>([]);
  const [availableWidth, setAvailableWidth] = useState(0);

  useEffect(() => {
    setVariantWidths([]);
  }, [proverbRef]);

  const handleTextLayout = useCallback((e: TextLayoutEvent) => {
    const widths = e.nativeEvent.lines.map((l) => l.width);
    if (widths.length >= 3 && widths.every((w) => w > 0)) {
      setVariantWidths(widths);
    }
  }, []);

  const handleParentLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) {
      setAvailableWidth(w);
    }
  }, []);

  const showVersionDropdown =
    availableVersions && availableVersions.length > 0 && selectedVersion;

  const variants = useMemo(() => {
    if (!proverbRef) return [];
    return [
      proverbRef,
      abbreviateProverbRef(proverbRef),
      proverbRef.replace(/^Proverbs\s+/, ""),
    ];
  }, [proverbRef]);

  const title = useMemo(() => {
    if (!proverbRef || loading || error) return "Daily Proverb";
    if (variantWidths.length < 3 || availableWidth <= 0) return proverbRef;

    const dropdownWidth = showVersionDropdown ? APPROX_DROPDOWN_WIDTH : 0;
    for (let i = 0; i < variants.length; i++) {
      if (variantWidths[i] + dropdownWidth <= availableWidth) {
        return variants[i];
      }
    }
    return variants[2];
  }, [
    proverbRef,
    loading,
    error,
    variantWidths,
    availableWidth,
    showVersionDropdown,
    variants,
  ]);

  return (
    <View
      testID="header-root"
      onLayout={handleParentLayout}
      style={[{ flexDirection: "row", alignItems: "center" }, style]}
      {...props}
    >
      {proverbRef && !loading && !error && (
        <View style={{ position: "absolute", opacity: 0 }}>
          <Text
            testID="measurement-text"
            style={{
              fontSize: 18,
              fontFamily: "Nunito_400Regular",
            }}
            onTextLayout={handleTextLayout}
          >
            {variants.join("\n")}
          </Text>
        </View>
      )}
      <Text
        testID="header-title"
        style={{
          color: "white",
          fontSize: 18,
          fontFamily: "Nunito_400Regular",
        }}
      >
        {title}
      </Text>
      {showVersionDropdown && (
        <VersionDropdown
          versions={availableVersions}
          selectedVersion={selectedVersion}
          onSelect={(v) => onVersionChange?.(v)}
        />
      )}
    </View>
  );
}
