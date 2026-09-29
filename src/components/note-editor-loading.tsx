import { StyleSheet, Text, View } from "react-native";

/**
 * Centered loading state shown while a note's content is being fetched.
 * Shared by the native and web rich-text note editors.
 */
export const NoteEditorLoading = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Loading note...</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
  },
  text: {
    color: "#999",
    fontSize: 16,
    fontFamily: "Nunito_400Regular",
  },
});
