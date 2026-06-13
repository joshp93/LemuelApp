import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  AppState,
  type AppStateStatus,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import RenderHtml from "react-native-render-html";
import { getProverbNotes, type NoteEntity } from "../src/api/notes";
import { useAuth } from "../src/auth/auth-context";
import { LemuelButton } from "../src/components/lemuel-button";
import { ProverbCard } from "../src/components/proverb-card";
import { Text } from "../src/components/themed-text";
import { VersionDropdown } from "../src/components/version-dropdown";
import { useFitFontSize } from "../src/hooks/useFitFontSize";
import { useProverbForTheDay } from "../src/hooks/useProverbForTheDay";
import { updateProverbWidget } from "../src/widgets";

const FONT_SIZES = [56, 40, 24];

function ProverbNoteCard({
  note,
  contentWidth,
}: {
  note: NoteEntity;
  contentWidth: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
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
      <View
        style={{
          overflow: "hidden",
          maxHeight: expanded ? undefined : CLAMP,
        }}
      >
        <View onLayout={(e) => setContentHeight(e.nativeEvent.layout.height)}>
          <RenderHtml
            contentWidth={contentWidth}
            source={{ html: note.note }}
            baseStyle={{ color: "#333", fontSize: 18 }}
          />
        </View>
      </View>
      {contentHeight > CLAMP && (
        <TouchableOpacity onPress={() => setExpanded(!expanded)}>
          <Text
            style={{
              color: "#333",
              fontWeight: "600",
              marginTop: 4,
              fontSize: 13,
              textAlign: "right",
            }}
          >
            {expanded ? "Show less" : "Show more"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function Index() {
  const router = useRouter();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const { user } = useAuth();
  const {
    proverb,
    loading,
    error,
    selectedVersion,
    availableVersions,
    changeVersion,
    refresh,
  } = useProverbForTheDay();
  const [notes, setNotes] = useState<NoteEntity[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshCount((c) => c + 1);
    setRefreshing(false);
  }, [refresh]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active") {
        refresh();
        setRefreshCount((c) => c + 1);
      }
    });
    return () => sub.remove();
  }, [refresh]);

  useEffect(() => {
    if (proverb) {
      updateProverbWidget(proverb);
    }
  }, [proverb]);

  useEffect(() => {
    let cancelled = false;
    if (proverb?.ref && user) {
      getProverbNotes(proverb.ref)
        .then((res) => {
          if (!cancelled) setNotes(res.items);
        })
        .catch(() => {
          if (!cancelled) setNotes([]);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [proverb?.ref, user, refreshCount]);

  const textBoxHeight = windowHeight * 0.6;

  const { fontSize, onTextLayout } = useFitFontSize(
    proverb?.proverb,
    textBoxHeight,
    FONT_SIZES,
  );

  const title = proverb && !loading && !error ? proverb.ref : "Daily Proverb";

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text
                style={{
                  color: "white",
                  fontSize: 18,
                  fontFamily: "Nunito_400Regular",
                }}
              >
                {title}
              </Text>
              {availableVersions &&
                availableVersions.length > 0 &&
                selectedVersion && (
                  <VersionDropdown
                    versions={availableVersions}
                    selectedVersion={selectedVersion}
                    onSelect={changeVersion}
                  />
                )}
            </View>
          ),
        }}
      />
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="white"
          />
        }
        contentContainerStyle={{
          padding: 16,
          flexGrow: 1,
          paddingBottom: 36,
        }}
        style={{
          flex: 1,
        }}
      >
        {loading && (
          <Text
            style={{
              textAlign: "center",
            }}
          >
            Loading proverb...
          </Text>
        )}
        {error && <Text>{error}</Text>}
        {proverb && !loading && !error && (
          <>
            <ProverbCard
              proverb={proverb}
              fontSize={fontSize}
              onTextLayout={onTextLayout}
            />
            <LemuelButton
              onPress={() => router.push("/meditation")}
              style={{ marginTop: 16 }}
            >
              Start Meditation
            </LemuelButton>
            {user && (
              <>
                <View
                  style={{
                    height: 1,
                    backgroundColor: "#333",
                    marginVertical: 16,
                  }}
                />
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: "#333",
                    marginBottom: 8,
                  }}
                >
                  Meditations
                </Text>
                {notes.length === 0 && (
                  <Text
                    style={{
                      color: "white",
                      textAlign: "center",
                      marginTop: 12,
                    }}
                  >
                    No meditations yet
                  </Text>
                )}
                {notes.map((note, i) => (
                  <ProverbNoteCard
                    key={i}
                    note={note}
                    contentWidth={windowWidth - 56}
                  />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
