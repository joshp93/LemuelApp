import { MaterialIcons } from "@expo/vector-icons";
import { memo } from "react";
import { Pressable, Text, View } from "react-native";
import type { ReplyEntity } from "../models/reactions-and-replies";
import { Text as ThemedText } from "./themed-text";

/**
 * Displays a single reply with the author's display name, relative timestamp,
 * and content. If the reply belongs to the current user, a delete button is shown.
 */
const ReplyCard = memo(function ReplyCard({
  reply,
  isOwn,
  onDelete,
}: {
  reply: ReplyEntity;
  isOwn: boolean;
  onDelete?: () => void;
}) {
  const timeAgo = getRelativeTime(reply.createdAt);

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
        {isOwn && onDelete && (
          <Pressable
            onPress={onDelete}
            style={{ marginLeft: "auto" }}
            hitSlop={8}
          >
            <MaterialIcons name="delete-outline" size={14} color="#dc3545" />
          </Pressable>
        )}
      </View>
      <Text style={{ fontSize: 15, color: "#333", lineHeight: 20 }}>
        {reply.content}
      </Text>
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
