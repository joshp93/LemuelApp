import { MaterialIcons } from "@expo/vector-icons";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import {
  deleteReply as deleteReplyApi,
  getReplies,
  postReply as postReplyApi,
} from "../api/notes";
import { remoteLog } from "../api/remote-logger";
import { useAuth } from "../auth/auth-context";
import type { ReplyEntity } from "../models/reactions-and-replies";
import { buildPendingReply, isPendingReply } from "../utils/replies";
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
  const repliesRef = useRef(replies);
  repliesRef.current = replies;

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
      const authorUuid = user?.userId ?? "";
      const optimistic = buildPendingReply(
        content,
        authorUuid,
        user?.displayName ?? "",
      );

      setReplies((prev) => [...prev, optimistic]);
      onCountChange(1);

      try {
        const reply = await postReplyApi(
          noteAuthorUuid,
          noteRef,
          noteDate,
          content,
        );
        setReplies((prev) =>
          prev.map((existing) =>
            existing.sk === optimistic.sk ? reply : existing,
          ),
        );
      } catch (error) {
        remoteLog("error", "[Replies] Failed to post reply", { error });
        setReplies((prev) =>
          prev.filter((existing) => existing.sk !== optimistic.sk),
        );
        onCountChange(-1);
        throw error;
      }
    },
    [noteAuthorUuid, noteRef, noteDate, onCountChange, user?.userId],
  );

  const handleDeleteReply = useCallback(
    (replySk: string) => {
      const index = repliesRef.current.findIndex(
        (reply) => reply.sk === replySk,
      );
      const removed = index === -1 ? undefined : repliesRef.current[index];

      setReplies((prev) => prev.filter((reply) => reply.sk !== replySk));
      onCountChange(-1);

      const restore = () => {
        if (removed === undefined) return;
        setReplies((prev) =>
          prev.some((reply) => reply.sk === replySk)
            ? prev
            : [...prev.slice(0, index), removed, ...prev.slice(index)],
        );
        onCountChange(1);
      };

      deleteReplyApi(noteAuthorUuid, noteRef, noteDate, replySk).catch(
        (error) => {
          remoteLog("error", "[Replies] Failed to delete reply", { error });
          restore();
        },
      );
    },
    [noteAuthorUuid, noteRef, noteDate, onCountChange],
  );

  const handleEditReply = useCallback(
    async (replySk: string, newContent: string) => {
      const previous = repliesRef.current.find(
        (reply) => reply.sk === replySk,
      )?.content;

      setReplies((prev) =>
        prev.map((reply) =>
          reply.sk === replySk ? { ...reply, content: newContent } : reply,
        ),
      );

      try {
        const updated = await postReplyApi(
          noteAuthorUuid,
          noteRef,
          noteDate,
          newContent,
          true,
          replySk,
        );
        setReplies((prev) =>
          prev.map((reply) =>
            reply.sk === replySk
              ? { ...reply, content: updated.content }
              : reply,
          ),
        );
      } catch (error) {
        remoteLog("error", "[Replies] Failed to edit reply", { error });
        if (previous !== undefined) {
          setReplies((prev) =>
            prev.map((reply) =>
              reply.sk === replySk ? { ...reply, content: previous } : reply,
            ),
          );
        }
        throw error;
      }
    },
    [noteAuthorUuid, noteRef, noteDate],
  );

  const content = (
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
      {replies.map((reply) => {
        const own = reply.authorUuid === user?.userId && !isPendingReply(reply);
        return (
          <ReplyCard
            key={reply.sk}
            reply={reply}
            isOwn={own}
            onDelete={own ? () => handleDeleteReply(reply.sk) : undefined}
            onSaveEdit={
              own ? (edited) => handleEditReply(reply.sk, edited) : undefined
            }
          />
        );
      })}
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
