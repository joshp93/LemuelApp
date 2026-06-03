import { COLORS } from "../constants/theme";
import { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface VersionDropdownProps {
  versions: string[];
  selectedVersion: string;
  onSelect: (version: string) => void;
}

export function VersionDropdown({
  versions,
  selectedVersion,
  onSelect,
}: VersionDropdownProps) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Pressable onPress={() => setVisible(true)} style={styles.badge}>
        <Text style={styles.badgeText}>{selectedVersion.toUpperCase()}</Text>
        <Text style={styles.arrow}>▾</Text>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={styles.menu}>
            <Text style={styles.menuTitle}>Bible Version</Text>
            <FlatList
              data={versions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    item === selectedVersion && styles.menuItemSelected,
                  ]}
                  onPress={() => {
                    setVisible(false);
                    onSelect(item);
                  }}
                >
                  <Text
                    style={[
                      styles.menuItemText,
                      item === selectedVersion && styles.menuItemTextSelected,
                    ]}
                  >
                    {item.toUpperCase()}
                  </Text>
                  {item === selectedVersion && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "black",
    borderRadius: 25,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: "white",
    height: 35,
  },
  badgeText: {
    color: "white",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  arrow: {
    color: "white",
    fontSize: 20,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  menu: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    minWidth: 200,
    maxHeight: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    textAlign: "center",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  menuItemSelected: {
    backgroundColor: COLORS.lightBackground,
  },
  menuItemText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
    letterSpacing: 1,
  },
  menuItemTextSelected: {
    color: "#007AFF",
  },
  checkmark: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
