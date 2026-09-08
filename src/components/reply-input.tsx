import { MaterialIcons } from "@expo/vector-icons";
import { memo, useCallback, useRef, useState } from "react";
import { Pressable, TextInput, View } from "react-native";

/**
 * Inline text input with a send button for submitting quick plain-text replies.
 * Disables input while submitting and clears on success.
 */
const ReplyInput = memo(function ReplyInput({
  onSubmit,
  disabled,
}: {
  onSubmit: (content: string) => Promise<void>;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleSubmit = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || submitting || disabled) return;

    setSubmitting(true);
    try {
      await onSubmit(trimmed);
      setText("");
    } finally {
      setSubmitting(false);
    }
  }, [text, submitting, disabled, onSubmit]);

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
        editable={!submitting && !disabled}
        style={{
          flex: 1,
          fontSize: 15,
          fontFamily: "Nunito_400Regular",
          color: "#333",
          paddingVertical: 6,
          paddingHorizontal: 12,
          backgroundColor: "#f5f5f5",
          borderRadius: 20,
          borderCurve: "continuous",
        }}
      />
      <Pressable
        onPress={handleSubmit}
        disabled={!text.trim() || submitting || disabled}
        style={({ pressed }) => ({
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor:
            !text.trim() || submitting || disabled ? "#ccc" : "#000",
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <MaterialIcons name="arrow-upward" size={18} color="white" />
      </Pressable>
    </View>
  );
});

export default ReplyInput;
