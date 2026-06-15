import { MaterialIcons } from "@expo/vector-icons";
import { memo, useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import Animated from "react-native-reanimated";
import RenderHtml from "react-native-render-html";
import type { NoteEntity } from "../api/notes";
import { LemuelButton } from "./lemuel-button";

const ProverbNoteCard = memo(function ProverbNoteCard({
  note,
  contentWidth,
  showEdit,
  onEdit,
}: {
  note: NoteEntity;
  contentWidth: number;
  showEdit?: boolean;
  onEdit?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const source = useMemo(() => ({ html: note.note }), [note.note]);
  const CLAMP = 60;

  return (
    <View
      style={{
        backgroundColor: "white",
        borderRadius: 8,
        padding: 12,
        marginTop: 12,
      }}
    >
      <Pressable onPress={() => setExpanded(!expanded)}>
        <Animated.View
          style={{
            overflow: "hidden",
            maxHeight: expanded ? contentHeight : CLAMP,
            transitionProperty: "maxHeight",
            transitionDuration: 300,
          }}
        >
          <View
            onLayout={(e) => {
              setContentHeight(e.nativeEvent.layout.height);
            }}
          >
            <RenderHtml
              contentWidth={contentWidth}
              source={source}
              baseStyle={{ color: "#333", fontSize: 18 }}
            />
          </View>
        </Animated.View>
      </Pressable>
      {(contentHeight > CLAMP || showEdit) && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 8,
            justifyContent:
              !showEdit && contentHeight > CLAMP ? "flex-end" : "flex-start",
          }}
        >
          {showEdit && (
            <LemuelButton
              size="sm"
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                padding: 0,
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={onEdit}
            >
              <MaterialIcons name="edit" size={16} color="white" />
            </LemuelButton>
          )}
          {showEdit && contentHeight > CLAMP && <View style={{ flex: 1 }} />}
          {contentHeight > CLAMP && (
            <LemuelButton
              size="sm"
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                padding: 0,
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={() => setExpanded(!expanded)}
            >
              <MaterialIcons
                name={expanded ? "keyboard-arrow-down" : "keyboard-arrow-up"}
                size={16}
                color="white"
              />
            </LemuelButton>
          )}
        </View>
      )}
    </View>
  );
});

export default ProverbNoteCard;
