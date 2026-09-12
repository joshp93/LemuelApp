import { MaterialIcons } from "@expo/vector-icons";
import { memo, useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import {
  deleteReply as deleteReplyApi,
  getReplies,
  postReply as postReplyApi,
} from "../api/notes";
import { useAuth } from "../auth/auth-context";
import type { ReplyEntity } from "../models/reactions-and-replies";
import ReplyCard from "./reply-card";
import ReplyInput from "./reply-input";

/**
 * Toggle button for showing / hiding the reply thread.
 * Displays "Replies (x)" with an up or down chevron icon.
 */
export function ReplyToggle({
  replyCount,
  expanded,
  onToggle,
}: {
  replyCount: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => ({
        backgroundColor: "#000",
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 14,
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Text
        style={{
          fontSize: 18,
          fontFamily: "Nunito_400Regular",
          color: "#fff",
          fontWeight: "600",
        }}
      >
        Replies ({replyCount})
      </Text>
      <MaterialIcons
        name={expanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
        size={18}
        color="#fff"
      />
    </Pressable>
  );
}

const ReplyThread = memo(function ReplyThread({
  noteAuthorUuid,
  noteRef,
  noteDate,
  expanded,
  onCountChange,
}: {
  noteAuthorUuid: string;
  noteRef: string;
  noteDate: string;
  expanded: boolean;
  onCountChange: (delta: number) => void;
}) {
  const { user } = useAuth();
  const [replies, setReplies] = useState<ReplyEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);

  const loadReplies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getReplies(noteAuthorUuid, noteRef, noteDate, 50);
      setReplies(res.items);
    } catch {
      setReplies([]);
    } finally {
      setLoading(false);
    }
  }, [noteAuthorUuid, noteRef, noteDate]);

  useEffect(() => {
    if (expanded) {
      setContentHeight(0);
      loadReplies();
    }
  }, [expanded, loadReplies]);

  const handlePostReply = useCallback(
    async (content: string) => {
      const reply = await postReplyApi(
        noteAuthorUuid,
        noteRef,
        noteDate,
        content,
      );
      setReplies((prev) => [...prev, reply]);
      onCountChange(1);
    },
    [noteAuthorUuid, noteRef, noteDate, onCountChange],
  );

  const handleDeleteReply = useCallback(
    async (replySk: string) => {
      await deleteReplyApi(noteAuthorUuid, noteRef, noteDate, replySk);
      setReplies((prev) => prev.filter((r) => r.sk !== replySk));
      onCountChange(-1);
    },
    [noteAuthorUuid, noteRef, noteDate, onCountChange],
  );

  const handleEditReply = useCallback(
    async (replySk: string, newContent: string) => {
      const updated = await postReplyApi(
        noteAuthorUuid,
        noteRef,
        noteDate,
        newContent,
        true,
      );
      setReplies((prev) =>
        prev.map((r) => (r.sk === replySk ? { ...r, content: updated.content } : r)),
      );
    },
    [noteAuthorUuid, noteRef, noteDate],
  );

  const content = (
    <View style={{ gap: 4, marginTop: 8 }}>
      {loading && (
        <ActivityIndicator size="small" color="#999" style={{ marginLeft: 12 }} />
      )}
      {!loading && replies.length === 0 && (
        <Text
          style={{
            fontSize: 13,
            fontFamily: "Nunito_400Regular",
            color: "#999",
            marginLeft: 12,
          }}
        >
          No replies yet
        </Text>
      )}
      {replies.map((reply) => (
        <ReplyCard
          key={reply.sk}
          reply={reply}
          isOwn={reply.authorUuid === user?.userId}
          onDelete={
            reply.authorUuid === user?.userId
              ? () => handleDeleteReply(reply.sk)
              : undefined
          }
          onSaveEdit={
            reply.authorUuid === user?.userId
              ? (content) => handleEditReply(reply.sk, content)
              : undefined
          }
        />
      ))}
      <ReplyInput onSubmit={handlePostReply} />
    </View>
  );

  return (
    <View>
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          opacity: 0,
          zIndex: -1,
        }}
        pointerEvents="none"
      >
        <View
          onLayout={(e) => {
            const next = e.nativeEvent.layout.height;
            setContentHeight((prev) => (next > prev ? next : prev));
          }}
        >
          {content}
        </View>
      </View>
      <Animated.View
        style={{
          overflow: "hidden",
          maxHeight: expanded ? contentHeight : 0,
          transitionProperty: "maxHeight",
          transitionDuration: 300,
        }}
      >
        {content}
      </Animated.View>
    </View>
  );
});

export default ReplyThread;