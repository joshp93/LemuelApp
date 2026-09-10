import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import type { ReactionCounts } from "../models/reactions-and-replies";

const EMOJIS = ["🙏", "❤️", "👍", "💡", "😊"] as const;
const BLUE = "#007AFF";
const GREY = "#000";

const ReactionBar = memo(function ReactionBar({
  reactionCounts,
  userReaction,
  onReactionChange,
}: {
  reactionCounts: ReactionCounts;
  userReaction: string | null;
  onReactionChange: (emoji: string | null) => Promise<void>;
}) {
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupRender, setPopupRender] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const popupScale = useSharedValue(0.3);
  const popupOpacity = useSharedValue(0);

  const openPopup = useCallback(() => {
    setPopupRender(true);
    setPopupOpen(true);
    popupOpacity.value = 0;
    popupScale.value = 0.3;
    popupOpacity.value = withTiming(1, { duration: 150 });
    popupScale.value = withTiming(1, { duration: 200 });
  }, [popupOpacity, popupScale]);

  const closePopup = useCallback(() => {
    setPopupOpen(false);
    popupOpacity.value = withTiming(0, { duration: 120 });
    popupScale.value = withTiming(0.3, { duration: 150 }, () => {
      runOnJS(setPopupRender)(false);
    });
  }, [popupOpacity, popupScale]);

  const handlePress = useCallback(
    async (emoji: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPending(emoji);
      await new Promise((r) => setTimeout(r, 400));
      closePopup();
      const next = emoji === userReaction ? null : emoji;
      try {
        await onReactionChange(next);
      } finally {
        setPending(null);
      }
    },
    [userReaction, onReactionChange, closePopup],
  );

  const popupAnimatedStyle = useAnimatedStyle(() => ({
    opacity: popupOpacity.value,
    transform: [{ scale: popupScale.value }],
  }));

  const sorted = (Object.entries(reactionCounts) as [string, number][])
    .filter(([, c]) => c > 0)
    .sort(([, a], [, b]) => b - a);

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      {sorted.map(([emoji, count]) => (
        <CompactPill
          key={emoji}
          emoji={emoji}
          count={count}
          selected={userReaction === emoji}
          pending={pending === emoji}
        />
      ))}
      <View>
        <Pressable
          onPress={() => (popupOpen ? closePopup() : openPopup())}
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: userReaction ? GREY : BLUE,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <EmojiOverIcon visible={!!userReaction} emoji={userReaction ?? ""} />
        </Pressable>
        {popupRender && (
          <>
            <Pressable
              onPress={closePopup}
              style={{
                position: "absolute",
                top: -9999,
                left: -9999,
                right: -9999,
                bottom: -9999,
              }}
            />
            <Animated.View
              style={[
                {
                  position: "absolute",
                  bottom: 36,
                  right: 0,
                  flexDirection: "row",
                  gap: 4,
                  backgroundColor: "#fff",
                  borderRadius: 20,
                  padding: 6,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 6,
                  elevation: 4,
                  transformOrigin: "bottom right",
                },
                popupAnimatedStyle,
              ]}
            >
              {EMOJIS.map((emoji) => (
                <PopEmoji
                  key={emoji}
                  emoji={emoji}
                  isSelected={userReaction === emoji}
                  onPress={handlePress}
                />
              ))}
            </Animated.View>
          </>
        )}
      </View>
    </View>
  );
});

function PopEmoji({
  emoji,
  isSelected,
  onPress,
}: {
  emoji: string;
  isSelected: boolean;
  onPress: (emoji: string) => void;
}) {
  const scale = useSharedValue(1);
  const bg = useSharedValue(0);

  const triggerBump = useCallback(() => {
    scale.value = withSequence(
      withSpring(1.3, { stiffness: 300 }),
      withSpring(1, { stiffness: 300 }),
    );
    bg.value = withSequence(
      withTiming(0.15, { duration: 100 }),
      withTiming(0, { duration: 200 }),
    );
  }, [scale, bg]);

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const bgStyle = useAnimatedStyle(() => ({
    opacity: bg.value / 0.15,
  }));

  return (
    <View>
      {isSelected && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 18,
            backgroundColor: "rgba(220, 53, 69, 0.15)",
          }}
        />
      )}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 18,
            backgroundColor: "rgba(0,0,0,0.15)",
          },
          bgStyle,
        ]}
      />
      <Pressable
        onPress={() => {
          triggerBump();
          onPress(emoji);
        }}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Animated.View style={emojiStyle}>
          <Text style={{ fontSize: 18 }}>{emoji}</Text>
        </Animated.View>
      </Pressable>
      {isSelected && (
        <View
          style={{
            position: "absolute",
            top: -2,
            right: -2,
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: "#dc3545",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialIcons name="close" size={10} color="#fff" />
        </View>
      )}
    </View>
  );
}

function EmojiOverIcon({
  visible,
  emoji,
}: {
  visible: boolean;
  emoji: string;
}) {
  const prevVisible = useRef(false);
  const prevEmoji = useRef(emoji);
  const offset = useSharedValue(20);

  useEffect(() => {
    const entering =
      (visible && !prevVisible.current) ||
      (visible && prevEmoji.current !== emoji);
    prevVisible.current = visible;
    prevEmoji.current = emoji;

    if (entering) {
      offset.value = 20;
      offset.value = withTiming(0, { duration: 250 });
    } else if (visible) {
      offset.value = 0;
    } else {
      offset.value = withTiming(20, { duration: 200 });
    }
  }, [visible, emoji, offset]);

  const iconAnim = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value - 20 }],
  }));

  const emojiAnim = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  return (
    <View
      style={{
        position: "absolute",
        width: 30,
        height: 30,
        overflow: "hidden",
      }}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            alignItems: "center",
            justifyContent: "center",
            width: 30,
            height: 30,
            opacity: visible ? 0 : 1,
          },
          iconAnim,
        ]}
      >
        <MaterialIcons name="add-reaction" size={16} color="#fff" />
      </Animated.View>
      <Animated.View
        style={[
          {
            position: "absolute",
            alignItems: "center",
            justifyContent: "center",
            width: 30,
            height: 30,
            opacity: visible ? 1 : 0,
          },
          emojiAnim,
        ]}
      >
        <Text style={{ fontSize: 15 }}>{emoji}</Text>
      </Animated.View>
    </View>
  );
}

function CompactPill({
  emoji,
  count,
  selected,
  pending,
}: {
  emoji: string;
  count: number;
  selected: boolean;
  pending: boolean;
}) {
  const prevCount = useRef(0);
  const countOffset = useSharedValue(0);
  const countOpacity = useSharedValue(1);

  useEffect(() => {
    if (count !== prevCount.current) {
      const delta = count - prevCount.current;
      countOffset.value = withTiming(delta > 0 ? -1 : 1, { duration: 250 });
      countOpacity.value = withTiming(0, { duration: 150 }, () => {
        countOffset.value = 0;
        countOpacity.value = withTiming(1, { duration: 150 });
      });
      prevCount.current = count;
    }
  }, [count]); // eslint-disable-line react-hooks/exhaustive-deps

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: countOffset.value * 14 }],
    opacity: countOpacity.value,
  }));

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
        opacity: pending ? 0.4 : 1,
      }}
    >
      <Text style={{ fontSize: 13 }}>{emoji}</Text>
      <Animated.View style={[{ overflow: "hidden" }, animatedStyle]}>
        <Text
          style={{
            fontSize: 11,
            fontFamily: "Nunito_400Regular",
            color: selected ? "#333" : "#999",
            fontWeight: selected ? "700" : "400",
          }}
        >
          {count}
        </Text>
      </Animated.View>
    </View>
  );
}

export default ReactionBar;
