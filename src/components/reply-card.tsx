import { MaterialIcons } from "@expo/vector-icons";
import { memo, useCallback, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import type { ReplyEntity } from "../models/reactions-and-replies";
import { BottomSheetMenu, type BottomSheetOption } from "./bottom-sheet-menu";
import { Text as ThemedText } from "./themed-text";

/**
 * Displays a single reply with the author's display name, relative timestamp,
 * and content. If the reply belongs to the current user, an edit button is shown
 * that opens a bottom-sheet menu (Edit / Delete).
 *
 * In edit mode, the reply text is replaced with a plain-text input with
 * cancel (red) and save (black) icon buttons below it.
 * Saving calls `onSaveEdit` with the updated content and `isUpdate: true`.
 */
const ReplyCard = memo(function ReplyCard({
  reply,
  isOwn,
  onDelete,
  onSaveEdit,
}: {
  reply: ReplyEntity;
  isOwn: boolean;
  onDelete?: () => void;
  onSaveEdit?: (content: string) => Promise<void>;
}) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(reply.content);
  const [saving, setSaving] = useState(false);

  const timeAgo = getRelativeTime(reply.createdAt);

  const handleSave = useCallback(async () => {
    const trimmed = editText.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      await onSaveEdit?.(trimmed);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }, [editText, saving, onSaveEdit]);

  const handleCancelEdit = useCallback(() => {
    setEditText(reply.content);
    setEditing(false);
  }, [reply.content]);

  const options: BottomSheetOption[] = [
    {
      label: "Edit",
      onPress: () => {
        setEditText(reply.content);
        setEditing(true);
      },
    },
    {
      label: "Delete",
      onPress: () => onDelete?.(),
      destructive: true,
    },
  ];

  return (
    <View
      style={{
        paddingVertical: 8,
        paddingLeft: 12,
        borderLeftWidth: 2,
        borderLeftColor: "#E5E5E5",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          marginBottom: 4,
        }}
      >
        <ThemedText style={{ fontSize: 13, fontWeight: "700", color: "#333" }}>
          {reply.displayName}
        </ThemedText>
        <ThemedText style={{ fontSize: 12, color: "#999" }}>
          {timeAgo}
        </ThemedText>
        {isOwn && !editing && (
          <Pressable
            onPress={() => setMenuVisible(true)}
            style={{ marginLeft: "auto" }}
            hitSlop={8}
          >
            <MaterialIcons name="edit" size={16} color="#666" />
          </Pressable>
        )}
      </View>

      {editing ? (
        <View>
          <TextInput
            value={editText}
            onChangeText={setEditText}
            multiline
            style={{
              fontSize: 18,
              fontFamily: "Nunito_400Regular",
              color: "#333",
              lineHeight: 24,
              backgroundColor: "#f5f5f5",
              borderRadius: 8,
              padding: 8,
              borderCurve: "continuous",
            }}
          />
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 6,
            }}
          >
            <Pressable
              onPress={handleCancelEdit}
              hitSlop={8}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "#dc3545",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialIcons name="close" size={18} color="white" />
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={!editText.trim() || saving}
              hitSlop={8}
              style={({ pressed }) => ({
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: !editText.trim() || saving ? "#ccc" : "#000",
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <MaterialIcons name="check" size={18} color="white" />
            </Pressable>
          </View>
        </View>
      ) : (
        <Text style={{ fontSize: 18, color: "#333", lineHeight: 24 }}>
          {reply.content}
        </Text>
      )}

      <BottomSheetMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        options={options}
      />
    </View>
  );
});

function getRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export default ReplyCard;
