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
import { useAuth } from "../src/auth/auth-context";
import { DividingLine } from "../src/components/dividing-line";
import { FadeInDown } from "../src/components/fade-in-down";
import { LemuelButton } from "../src/components/lemuel-button";
import { MonthPicker } from "../src/components/month-picker";
import { ProverbCard } from "../src/components/proverb-card";
import ProverbNoteCard from "../src/components/proverb-note-card";
import { Text } from "../src/components/themed-text";
import { VersionDropdown } from "../src/components/version-dropdown";
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
    setDataReady(true);
  }, [proverb, user]);

  useEffect(() => {
    if (!proverb || loading) return;
    setDataReady(false);
    loadPageData();
  }, [proverb, loading, loadPageData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active") {
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

  const title = proverb && !loading && !error ? proverb.ref : "Daily Proverb";

  const handleSelectDay = useCallback(
    (day: string) => {
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
                    onSelect={(v) => {
                      setDataReady(false);
                      changeVersion(v);
                    }}
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
                              `/notes/users/${user!.userId}/${note.ref}`,
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
