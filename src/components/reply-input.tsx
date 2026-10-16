import { MaterialIcons } from "@expo/vector-icons";
import { memo, useCallback, useRef, useState } from "react";
import { Pressable, TextInput, View } from "react-native";

/**
 * Inline text input with a send button for submitting quick plain-text replies.
 *
 * Submitting clears the box at once and does not wait for the server, so the
 * next reply can be typed while the last one is still in flight. A reply that
 * fails to send is put back, unless something has been typed since.
 */
const ReplyInput = memo(function ReplyInput({
  onSubmit,
  disabled,
}: {
  onSubmit: (content: string) => Promise<void>;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const inputRef = useRef<TextInput>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    setText("");
    onSubmit(trimmed).catch(() => {
      setText((current) => (current.length === 0 ? trimmed : current));
    });
  }, [text, disabled, onSubmit]);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 8,
        marginLeft: 12,
      }}
    >
      <TextInput
        ref={inputRef}
        value={text}
        onChangeText={setText}
        placeholder="Write a reply..."
        placeholderTextColor="#999"
        returnKeyType="send"
        onSubmitEditing={handleSubmit}
        editable={!disabled}
        style={{
          flex: 1,
          fontSize: 18,
          fontFamily: "Nunito_400Regular",
          color: "#333",
          paddingVertical: 8,
          paddingHorizontal: 14,
          backgroundColor: "#f5f5f5",
          borderRadius: 20,
          borderCurve: "continuous",
        }}
      />
      <Pressable
        onPress={handleSubmit}
        disabled={!text.trim() || disabled}
        hitSlop={12}
        style={({ pressed }) => ({
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: !text.trim() || disabled ? "#ccc" : "#000",
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <MaterialIcons name="arrow-upward" size={22} color="white" />
      </Pressable>
    </View>
  );
});

export default ReplyInput;
