import { MaterialIcons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppState,
  type AppStateStatus,
  RefreshControl,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import {
  getProverbNotes,
  getUserNote,
  type NoteEntity,
  type UserNoteResponse,
} from "../src/api/notes";
import { remoteLog } from "../src/api/remote-logger";
import { useAuth } from "../src/auth/auth-context";
import { DividingLine } from "../src/components/dividing-line";
import { FadeInDown } from "../src/components/fade-in-down";
import { LemuelButton } from "../src/components/lemuel-button";
import { MonthPicker } from "../src/components/month-picker";
import { ProverbCard } from "../src/components/proverb-card";
import ProverbNoteCard from "../src/components/proverb-note-card";
import { ProverbReferenceHeaderText } from "../src/components/proverb-reference-header-text";
import { Text } from "../src/components/themed-text";
import { useFitFontSize } from "../src/hooks/useFitFontSize";
import { useProverbForTheDay } from "../src/hooks/useProverbForTheDay";
import { updateProverbWidget } from "../src/widgets";

const FONT_SIZES = [56, 40, 24];

export default function Index() {
  const router = useRouter();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const contentWidth = useMemo(() => windowWidth - 56, [windowWidth]);
  const { user } = useAuth();
  const {
    proverb,
    loading,
    error,
    selectedVersion,
    availableVersions,
    date,
    changeVersion,
    refresh,
    goToDate,
  } = useProverbForTheDay();
  const todayString = useMemo(() => new Date().toISOString().split("T")[0], []);
  const isToday = !date || date === todayString;
  const [notes, setNotes] = useState<NoteEntity[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [userNote, setUserNote] = useState<UserNoteResponse | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const loadPageData = useCallback(async () => {
    if (!proverb?.ref) return;
    remoteLog("debug", "[Index] Loading page data", {
      ref: proverb.ref,
      authenticated: !!user,
    });
    const promises: Promise<void>[] = [];

    if (user) {
      promises.push(
        getProverbNotes(proverb.ref)
          .then((res) => setNotes(res.items))
          .catch(() => setNotes([])),
      );
      promises.push(
        getUserNote(user.userId, proverb.ref)
          .then(setUserNote)
          .catch(() => setUserNote(null)),
      );
    } else {
      setNotes([]);
      setUserNote(null);
    }

    await Promise.all(promises);
    remoteLog("info", "[Index] Page data loaded", { ref: proverb.ref });
    setDataReady(true);
  }, [proverb, user]);

  useEffect(() => {
    if (!proverb || loading) return;
    setDataReady(false);
    loadPageData();
  }, [proverb, loading, loadPageData]);

  const onRefresh = useCallback(async () => {
    remoteLog("debug", "[Index] Pull-to-refresh triggered");
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active") {
        remoteLog("debug", "[Index] App returned to foreground, refreshing");
        refresh();
      }
    });
    return () => sub.remove();
  }, [refresh]);

  useEffect(() => {
    if (proverb) {
      updateProverbWidget(proverb);
    }
  }, [proverb]);

  const textBoxHeight = windowHeight * 0.6;

  const { fontSize, onTextLayout } = useFitFontSize(
    proverb?.proverb,
    textBoxHeight,
    FONT_SIZES,
  );

  const handleSelectDay = useCallback(
    (day: string) => {
      remoteLog("debug", "[Index] Date selected from picker", { day });
      setShowDatePicker(false);
      setDataReady(false);
      goToDate(day);
    },
    [goToDate],
  );

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <ProverbReferenceHeaderText
              proverbRef={proverb?.ref}
              loading={loading}
              error={error}
              selectedVersion={selectedVersion}
              availableVersions={availableVersions}
              onVersionChange={(v) => {
                remoteLog("info", "[Index] Version changed", {
                  version: v,
                });
                setDataReady(false);
                changeVersion(v);
              }}
            />
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
        {!dataReady && !error && (
          <Text
            style={{
              textAlign: "center",
            }}
          >
            Loading proverb...
          </Text>
        )}
        {error && <Text>{error}</Text>}
        {dataReady && proverb && !error && (
          <FadeInDown key={proverb.ref}>
            <ProverbCard
              proverb={proverb}
              fontSize={fontSize}
              onTextLayout={onTextLayout}
            />
            {!userNote && (
              <LemuelButton
                onPress={() => router.push("/meditation")}
                style={{ marginTop: 16 }}
              >
                Start Meditation
              </LemuelButton>
            )}
            {user && (
              <>
                <DividingLine />
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
                      color: "black",
                      textAlign: "center",
                      marginTop: 12,
                    }}
                  >
                    No meditations yet
                  </Text>
                )}
                {notes.map((note) => (
                  <ProverbNoteCard
                    key={note.pk}
                    note={note}
                    contentWidth={contentWidth}
                    showEdit={note.uuid === user?.userId}
                    onEdit={
                      note.uuid === user?.userId
                        ? () =>
                            router.push(
                              `/notes/users/${user!.userId}/${note.ref}?date=${note.date}`,
                            )
                        : undefined
                    }
                  />
                ))}
              </>
            )}
            <DividingLine />
            <Text
              style={{
                color: "#333",
                fontSize: 18,
                fontWeight: "700",
                textAlign: "center",
                marginBottom: 12,
              }}
            >
              {(date
                ? new Date(`${date}T00:00:00`)
                : new Date()
              ).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flex: 1, alignItems: "flex-start" }}>
                <LemuelButton
                  size="sm"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    padding: 0,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onPress={() => {
                    setDataReady(false);
                    const prev = new Date(date ?? todayString);
                    prev.setDate(prev.getDate() - 1);
                    goToDate(prev.toISOString().split("T")[0]);
                  }}
                >
                  <MaterialIcons name="arrow-back" size={24} color="white" />
                </LemuelButton>
              </View>
              <View style={{ flex: 1, alignItems: "center" }}>
                <LemuelButton
                  size="sm"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    padding: 0,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onPress={() => setShowDatePicker(true)}
                >
                  <MaterialIcons
                    name="calendar-today"
                    size={24}
                    color="white"
                  />
                </LemuelButton>
              </View>
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                {!isToday && (
                  <LemuelButton
                    size="sm"
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      padding: 0,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onPress={() => {
                      setDataReady(false);
                      const next = new Date(date ?? todayString);
                      next.setDate(next.getDate() + 1);
                      goToDate(next.toISOString().split("T")[0]);
                    }}
                  >
                    <MaterialIcons
                      name="arrow-forward"
                      size={24}
                      color="white"
                    />
                  </LemuelButton>
                )}
              </View>
            </View>
          </FadeInDown>
        )}
      </ScrollView>
      <MonthPicker
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelectDay={handleSelectDay}
        initialMonth={(date ?? todayString).slice(0, 7)}
      />
    </View>
  );
}
