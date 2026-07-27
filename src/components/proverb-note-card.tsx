import { MaterialIcons } from "@expo/vector-icons";
import { memo, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import RenderHtml from "react-native-render-html";
import type { NoteEntity } from "../api/notes";
import { LemuelButton } from "./lemuel-button";

const CLAMP = 60;

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

  return (
    <View
      style={{
        backgroundColor: "white",
        borderRadius: 8,
        padding: 12,
        marginTop: 12,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 4,
        }}
      >
        {showEdit && note.isPrivate && (
          <MaterialIcons
            name="lock"
            size={12}
            color="#999"
            style={{ marginRight: 4 }}
          />
        )}
        {note.displayName ? (
          <>
            <MaterialIcons
              name="person"
              size={12}
              color="#999"
              style={{ marginRight: 3 }}
            />
            <Text
              style={{
                color: "#666",
                fontSize: 11,
                fontWeight: "500",
              }}
            >
              {note.displayName}
            </Text>
          </>
        ) : null}
      </View>
      <View
        style={{
          position: "absolute",
          left: 12,
          right: 12,
          opacity: 0,
          zIndex: -1,
        }}
        pointerEvents="none"
      >
        <View
          onLayout={(e) => {
            if (contentHeight === 0) {
              setContentHeight(e.nativeEvent.layout.height);
            }
          }}
        >
          <RenderHtml
            contentWidth={contentWidth}
            source={source}
            baseStyle={{ color: "#333", fontSize: 18 }}
          />
        </View>
      </View>
      <Pressable onPress={() => setExpanded(!expanded)}>
        <Animated.View
          style={{
            overflow: "hidden",
            maxHeight: expanded ? contentHeight : CLAMP,
            transitionProperty: "maxHeight",
            transitionDuration: 300,
          }}
        >
          <RenderHtml
            contentWidth={contentWidth}
            source={source}
            baseStyle={{ color: "#333", fontSize: 18 }}
          />
        </Animated.View>
      </Pressable>
      {(contentHeight > CLAMP || showEdit) && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 8,
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
          <View style={{ flex: 1 }} />
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
                name={expanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
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
