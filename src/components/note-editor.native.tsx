import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import {
  actions,
  RichEditor,
  RichToolbar,
} from "react-native-pell-rich-editor";
import { NoteEditorLoading } from "./note-editor-loading";

interface NoteEditorProps {
  notesLoading: boolean;
  editorContent: string;
  onChange: (html: string) => void;
  onDelete: () => void;
  deleting: boolean;
  contentLoaded: boolean;
}

/** Toolbar action definitions shared across editor instances. */
const TOOLBAR_ACTIONS = [
  actions.setBold,
  actions.setItalic,
  actions.setUnderline,
  actions.insertBulletsList,
  actions.insertOrderedList,
];

/**
 * Rich-text note editor for Android and iOS.
 * Uses `react-native-pell-rich-editor` for formatting (bold, italic,
 * underline, lists) and a WebView-based editing surface.
 * @returns The editor toolbar and content area, or a loading state.
 */
export default function NoteEditor({
  notesLoading,
  editorContent,
  onChange,
  onDelete,
  deleting,
  contentLoaded,
}: NoteEditorProps) {
  const richTextRef = useRef<RichEditor>(null);

  useEffect(() => {
    if (!contentLoaded) return;
    const timer = setTimeout(() => {
      richTextRef.current?.focusContentEditor();
    }, 300);
    return () => clearTimeout(timer);
  }, [contentLoaded]);

  return (
    <>
      {!notesLoading && (
        <View style={styles.toolbarRow}>
          <View style={styles.toolbarFlex}>
            <RichToolbar
              editor={richTextRef}
              actions={TOOLBAR_ACTIONS}
              iconSize={24}
              iconTint="white"
              selectedIconTint="#ccc"
              style={styles.toolbarInner}
            />
          </View>
          <DeleteButton onPress={onDelete} disabled={deleting} />
        </View>
      )}
      {notesLoading ? (
        <NoteEditorLoading />
      ) : (
        <RichEditor
          ref={richTextRef}
          onChange={onChange}
          placeholder="Capture your thoughts..."
          editorStyle={{
            backgroundColor: "#fff",
            color: "#333",
            placeholderColor: "#999",
            contentCSSText:
              "font-size: 16px; font-family: Nunito; padding: 8px; overflow: hidden;",
          }}
          initialContentHTML={editorContent}
          initialHeight={150}
          autoCapitalize="sentences"
          autoCorrect
          style={{ minHeight: 150 }}
        />
      )}
    </>
  );
}

/** Delete icon button used inside the editor toolbar row. */
const DeleteButton = ({
  onPress,
  disabled,
}: {
  onPress: () => void;
  disabled: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
  >
    <MaterialIcons name="delete" size={24} color="white" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  toolbarInner: {
    backgroundColor: "black",
  },
  toolbarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
    marginTop: 4,
    marginBottom: 8,
    paddingRight: 8,
    backgroundColor: "black",
    borderRadius: 8,
    overflow: "hidden",
  },
  toolbarFlex: {
    flex: 1,
  },
});
