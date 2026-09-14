import { useEffect, useRef, useState } from "react";
import {
  Animated,
  type GestureResponderEvent,
  Modal,
  Pressable,
  Text,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * A single option in the bottom sheet menu.
 */
export interface BottomSheetOption {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  destructive?: boolean;
  align?: "center" | "left";
}

/**
 * A swipe-up menu from the bottom of the screen.
 * Displays a list of options above a dismissible overlay.
 * Built with React Native's Modal and Animated APIs — no external dependency.
 *
 * @param visible - Whether the sheet is shown.
 * @param onClose - Called when the overlay is tapped or the sheet should close.
 * @param options - Array of options to display.
 */
export function BottomSheetMenu({
  visible,
  onClose,
  options,
}: {
  visible: boolean;
  onClose: () => void;
  options: BottomSheetOption[];
}) {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const insets = useSafeAreaInsets();
  const [render, setRender] = useState(false);

  useEffect(() => {
    if (visible) {
      setRender(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setRender(false);
      });
    }
  }, [visible, slideAnim]);

  if (!render) return null;

  return (
    <Modal transparent animationType="none" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={
          {
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "flex-end",
          } as const
        }
      >
        <Animated.View
          style={
            {
              backgroundColor: "#fff",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              paddingTop: 20,
              paddingBottom: insets.bottom + 20,
              paddingHorizontal: 20,
              transform: [{ translateY: slideAnim }],
            } as const
          }
        >
          {options.map((option, index) => (
            <Pressable
              key={option.label}
              onPress={(e) => {
                option.onPress(e);
                onClose();
              }}
              style={{
                paddingVertical: 16,
                borderBottomWidth: index < options.length - 1 ? 1 : 0,
                borderBottomColor: "#eee",
              }}
            >
              <Text
                style={
                  {
                    fontSize: 17,
                    color: option.destructive ? "#dc3545" : "#333",
                    textAlign: option.align ?? "center",
                    fontWeight: option.align === "left" ? "400" : "500",
                  } as const
                }
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
