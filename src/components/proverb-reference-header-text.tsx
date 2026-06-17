import { useCallback, useEffect, useState } from "react";
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
  selectedVersion?: string;
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
  const [fullTextWidth, setFullTextWidth] = useState(0);
  const [availableWidth, setAvailableWidth] = useState(0);

  useEffect(() => {
    setFullTextWidth(0);
  }, [proverbRef]);

  const handleFullTextLayout = useCallback((e: TextLayoutEvent) => {
    const w = e.nativeEvent.lines[0]?.width ?? 0;
    if (w > 0) {
      setFullTextWidth(w);
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

  const needsAbbrev =
    availableWidth > 0 &&
    fullTextWidth > 0 &&
    fullTextWidth + (showVersionDropdown ? APPROX_DROPDOWN_WIDTH : 0) >
      availableWidth;

  const title =
    proverbRef && !loading && !error
      ? needsAbbrev
        ? abbreviateProverbRef(proverbRef)
        : proverbRef
      : "Daily Proverb";

  return (
    <View
      onLayout={handleParentLayout}
      style={[{ flexDirection: "row", alignItems: "center" }, style]}
      {...props}
    >
      {proverbRef && !loading && !error && (
        <View style={{ position: "absolute", opacity: 0 }}>
          <Text
            style={{
              fontSize: 18,
              fontFamily: "Nunito_400Regular",
            }}
            onTextLayout={handleFullTextLayout}
          >
            {proverbRef}
          </Text>
        </View>
      )}
      <Text
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
