import { MaterialIcons } from "@expo/vector-icons";
import {
  Stack,
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AppState,
  type AppStateStatus,
  RefreshControl,
  useWindowDimensions,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  type GetReactionsResponse,
  getProverbNotes,
  getReactions,
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
import { NotTodayBanner } from "../src/components/not-today-banner";
import { ProverbCard } from "../src/components/proverb-card";
import ProverbNoteCard from "../src/components/proverb-note-card";
import { ProverbReferenceHeaderText } from "../src/components/proverb-reference-header-text";
import { Text } from "../src/components/themed-text";
import { useFitFontSize } from "../src/hooks/useFitFontSize";
import { useProverbForTheDay } from "../src/hooks/useProverbForTheDay";

const FONT_SIZES = [56, 40, 24];

export default function Index() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
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
    goToDate,
  } = useProverbForTheDay();
  const { date: paramDate } = useLocalSearchParams<{ date?: string }>();
  const todayString = useMemo(() => new Date().toISOString().split("T")[0], []);
  const isToday = !date || date === todayString;
  const [notes, setNotes] = useState<NoteEntity[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [userNote, setUserNote] = useState<UserNoteResponse | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [reactionData, setReactionData] = useState<
    Record<string, GetReactionsResponse>
  >({});
  const [reactionVersion, setReactionVersion] = useState(0);

  const loadPageData = useCallback(async () => {
    if (!proverb?.ref) return;
    remoteLog("debug", "[Index] Loading page data", {
      ref: proverb.ref,
      authenticated: !!user,
    });
    const promises: Promise<void>[] = [];

    if (user) {
      promises.push(
        getProverbNotes(proverb.ref, user!.userId)
          .then((res) => setNotes(res.items))
          .catch(() => setNotes([])),
      );
      promises.push(
        getUserNote(user.userId, proverb.ref, date ?? todayString)
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
  }, [proverb, user, date, todayString]);

  const loadReactions = useCallback(async () => {
    if (!user || notes.length === 0) return;

    try {
      const results = await Promise.allSettled(
        notes.map((n) => getReactions(n.uuid, n.ref, n.date, user.userId)),
      );
      const data: Record<string, GetReactionsResponse> = {};
      results.forEach((result, i) => {
        if (result.status === "fulfilled") {
          data[`${notes[i].uuid}#${notes[i].ref}#${notes[i].date}`] =
            result.value;
        }
      });
      setReactionData(data);
    } catch {
      setReactionData({});
    }
  }, [notes, user]);

  useEffect(() => {
    if (dataReady) {
      loadReactions();
    }
  }, [dataReady, loadReactions, reactionVersion]);

  const triggerReactionsRefresh = useCallback(() => {
    setReactionVersion((v) => v + 1);
  }, []);

  const updateNoteReplyCount = useCallback((pk: string, delta: number) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.pk === pk
          ? { ...n, replyCount: Math.max(0, (n.replyCount ?? 0) + delta) }
          : n,
      ),
    );
  }, []);

  useEffect(() => {
    if (!proverb || loading) return;
    setDataReady(false);
    loadPageData();
  }, [proverb, loading, loadPageData]);

  const loadPageDataRef = useRef(loadPageData);
  loadPageDataRef.current = loadPageData;

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (!proverb?.ref) return;
      setDataReady(false);
      loadPageDataRef.current();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (paramDate && selectedVersion) {
      goToDate(paramDate);
    }
  }, [paramDate, selectedVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const onRefresh = useCallback(async () => {
    remoteLog("debug", "[Index] Pull-to-refresh triggered", { date });
    setRefreshing(true);
    await goToDate(date);
    setRefreshing(false);
  }, [goToDate, date]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active") {
        remoteLog("debug", "[Index] App returned to foreground, refreshing", {
          date,
        });
        goToDate(date);
      }
    });
    return () => sub.remove();
  }, [goToDate, date]);

  const textBoxHeight = windowHeight * 0.6 - insets.bottom;

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
      <KeyboardAwareScrollView
        contentInsetAdjustmentBehavior="automatic"
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
          paddingBottom: insets.bottom + 36,
        }}
        style={{
          flex: 1,
        }}
        bottomOffset={insets.bottom + 8}
        keyboardShouldPersistTaps="handled"
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
            {!isToday && (
              <NotTodayBanner
                date={date!}
                onPressReturnToToday={() => {
                  setDataReady(false);
                  goToDate(undefined);
                }}
              />
            )}
            <ProverbCard
              proverb={proverb}
              fontSize={fontSize}
              onTextLayout={onTextLayout}
            />
            {!userNote && (
              <LemuelButton
                onPress={() =>
                  router.push({
                    pathname: "/meditation",
                    params: { date },
                  })
                }
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
                {notes.map((note) => {
                  const rk = `${note.uuid}#${note.ref}#${note.date}`;
                  const rd = reactionData[rk];
                  return (
                    <ProverbNoteCard
                      key={note.pk}
                      note={note}
                      contentWidth={contentWidth}
                      showEdit={note.uuid === user?.userId}
                      reactionCounts={
                        rd?.reactionCounts ?? note.reactionCounts ?? {}
                      }
                      replyCount={note.replyCount ?? 0}
                      userReaction={rd?.userReaction}
                      onReactionChange={triggerReactionsRefresh}
                      onReplyCountChange={(delta) =>
                        updateNoteReplyCount(note.pk, delta)
                      }
                      onEdit={
                        note.uuid === user?.userId
                          ? () =>
                              router.push(
                                `/notes/users/${user!.userId}/${note.ref}?date=${note.date}`,
                              )
                          : undefined
                      }
                    />
                  );
                })}
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
      </KeyboardAwareScrollView>
      <MonthPicker
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelectDay={handleSelectDay}
        initialMonth={(date ?? todayString).slice(0, 7)}
      />
    </View>
  );
}
