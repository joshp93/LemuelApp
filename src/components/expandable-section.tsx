import { useEffect, useMemo, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ExpandableSectionProps {
  selected: boolean;
  onSelect: () => void;
  label: string;
  children: React.ReactNode;
}

export function ExpandableSection({
  selected,
  onSelect,
  label,
  children,
}: ExpandableSectionProps) {
  const [animValue] = useState(() => new Animated.Value(selected ? 1 : 0));

  const bodyMaxHeight = useMemo(
    () =>
      animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 300],
      }),
    [animValue],
  );

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: selected ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={styles.sectionCard}>
      <TouchableOpacity
        style={styles.radioRow}
        onPress={onSelect}
        activeOpacity={0.7}
      >
        <View style={styles.radioOuter}>
          {selected && <View style={styles.radioInner} />}
        </View>
        <Text style={styles.radioLabel}>{label}</Text>
      </TouchableOpacity>
      <Animated.View style={{ maxHeight: bodyMaxHeight, overflow: "hidden" }}>
        <View style={styles.configContent}>{children}</View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: "white",
    borderRadius: 8,
    marginBottom: 12,
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "black",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "black",
  },
  radioLabel: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  configContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});
