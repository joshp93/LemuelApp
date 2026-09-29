import { MaterialIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { NoteEditorLoading } from "./note-editor-loading";

interface WebNoteEditorProps {
  notesLoading: boolean;
  editorContent: string;
  onChange: (html: string) => void;
  onDelete: () => void;
  deleting: boolean;
  contentLoaded: boolean;
}

/** Formatting commands exposed by the editor toolbar. */
interface ToolbarAction {
  icon: keyof typeof MaterialIcons.glyphMap;
  command: string;
  label: string;
}

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  { icon: "format-bold", command: "bold", label: "Bold" },
  { icon: "format-italic", command: "italic", label: "Italic" },
  { icon: "format-underlined", command: "underline", label: "Underline" },
  {
    icon: "format-list-bulleted",
    command: "insertUnorderedList",
    label: "Bullet list",
  },
  {
    icon: "format-list-numbered",
    command: "insertOrderedList",
    label: "Numbered list",
  },
];

/**
 * Rich-text note editor for web.
 * Uses a `contentEditable` div and `document.execCommand` for formatting.
 * Returns `null` during server-side rendering (no browser DOM available).
 * @returns The editor toolbar and content area, or a loading state.
 */
export default function WebNoteEditor({
  notesLoading,
  editorContent,
  onChange,
  onDelete,
  deleting,
  contentLoaded,
}: WebNoteEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isBrowser = useRef(false);

  useEffect(() => {
    isBrowser.current = true;
  }, []);

  useEffect(() => {
    if (!contentLoaded || !editorRef.current) return;
    const timer = setTimeout(() => {
      editorRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, [contentLoaded]);

  const contentInitialised = useRef(false);
  useEffect(() => {
    if (!contentLoaded || !editorRef.current || contentInitialised.current)
      return;
    contentInitialised.current = true;
    editorRef.current.innerHTML = editorContent;
  }, [contentLoaded, editorContent]);

  const exec = useCallback(
    (command: string, value?: string) => {
      document.execCommand(command, false, value);
      editorRef.current?.focus();
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    },
    [onChange],
  );

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const isBrowserReady = isBrowser.current;

  return (
    <>
      {!notesLoading && (
        <Toolbar
          actions={TOOLBAR_ACTIONS}
          onAction={exec}
          onDelete={onDelete}
          deleting={deleting}
        />
      )}
      {notesLoading ? (
        <NoteEditorLoading />
      ) : isBrowserReady ? (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          style={{
            minHeight: 150,
            padding: 12,
            fontSize: 16,
            fontFamily: "Nunito, sans-serif",
            color: "#333",
            outline: "none",
            lineHeight: 1.5,
          }}
          data-placeholder="Capture your thoughts..."
        />
      ) : null}
    </>
  );
}

/** Formatting toolbar row. */
const Toolbar = ({
  actions,
  onAction,
  onDelete,
  deleting,
}: {
  actions: ToolbarAction[];
  onAction: (command: string) => void;
  onDelete: () => void;
  deleting: boolean;
}) => (
  <View style={styles.toolbarRow}>
    {actions.map(({ icon, command, label }) => (
      <TouchableOpacity
        key={command}
        style={styles.toolbarButton}
        onPress={() => onAction(command)}
        accessibilityLabel={label}
      >
        <MaterialIcons name={icon} size={20} color="white" />
      </TouchableOpacity>
    ))}
    <View style={styles.toolbarSeparator} />
    <View style={{ flex: 1 }} />
    <TouchableOpacity
      onPress={onDelete}
      disabled={deleting}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <MaterialIcons name="delete" size={24} color="white" />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  toolbarRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "black",
    borderRadius: 8,
    marginHorizontal: 8,
    marginTop: 4,
    marginBottom: 8,
    overflow: "hidden",
  },
  toolbarButton: {
    padding: 6,
    borderRadius: 4,
  },
  toolbarSeparator: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginHorizontal: 4,
  },
});
