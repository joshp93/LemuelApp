import { memo, useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import {
  deleteReply as deleteReplyApi,
  getReplies,
  postReply as postReplyApi,
} from "../api/notes";
import { useAuth } from "../auth/auth-context";
import type { ReplyEntity } from "../models/reactions-and-replies";
import ReplyCard from "./reply-card";
import ReplyInput from "./reply-input";

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
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Text
        style={{
          fontSize: 14,
          fontFamily: "Nunito_400Regular",
          color: "#fff",
          fontWeight: "600",
        }}
      >
        {expanded ? "Hide" : "View"} replies ({replyCount})
      </Text>
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

  if (!expanded) return null;

  return (
    <View style={{ gap: 4, marginTop: 8 }}>
      {loading && (
        <ActivityIndicator
          size="small"
          color="#999"
          style={{ marginLeft: 12 }}
        />
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
        />
      ))}

      <ReplyInput onSubmit={handlePostReply} />
    </View>
  );
});

export default ReplyThread;
