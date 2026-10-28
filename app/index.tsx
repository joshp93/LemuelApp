import { MaterialIcons } from "@expo/vector-icons";
import {
  Stack,
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  type AppStateStatus,
  RefreshControl,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import { LemuelKeyboardAwareScrollView } from "../src/components/lemuel-keyboard-aware-scroll-view";
import { LemuelLoadingScreen } from "../src/components/lemuel-loading-screen";
import { MonthPicker } from "../src/components/month-picker";
import { NotTodayBanner } from "../src/components/not-today-banner";
import { ProverbCrossFade } from "../src/components/proverb-cross-fade";
import ProverbNoteCard from "../src/components/proverb-note-card";
import { ProverbReferenceHeaderText } from "../src/components/proverb-reference-header-text";
import { Text } from "../src/components/themed-text";
import { CONTENT_COLUMN, CONTENT_INSET } from "../src/constants/layout";
import { useFitFontSize } from "../src/hooks/useFitFontSize";
import { useNoteReactions } from "../src/hooks/useNoteReactions";
import { useProverbForTheDay } from "../src/hooks/useProverbForTheDay";
import type { ReactionCounts } from "../src/models/reactions-and-replies";
import { toLocalDateString } from "../src/utils/date";
import { reactionKey } from "../src/utils/reactions";

const FONT_SIZES = [56, 40, 24];

/** Shared empty counts, so a note without reactions keeps a stable prop. */
const EMPTY_REACTION_COUNTS: ReactionCounts = {};

export default function Index() {
  const router = useRouter();
  const navigation = useNavigation();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
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
  const todayString = useMemo(() => toLocalDateString(new Date()), []);
  const isToday = !date || date === todayString;
  const [notes, setNotes] = useState<NoteEntity[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userNote, setUserNote] = useState<UserNoteResponse | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  /**
   * Loads the community notes and the reader's own note for the proverb on
   * screen.
   *
   * A silent load leaves what is already displayed alone until the requests
   * answer, so returning to the page does not replace it with a spinner.
   *
   * @param options - Whether to hide the section's loading state.
   */
  const loadPageData = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!proverb?.ref) return;
      remoteLog("debug", "[Index] Loading page data", {
        ref: proverb.ref,
        authenticated: !!user,
      });

      if (!silent) setNotesLoading(true);

      const promises: Promise<void>[] = [];

      if (user) {
        promises.push(
          getProverbNotes(proverb.ref, user.userId)
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
      setNotesLoading(false);
    },
    [proverb, user, date, todayString],
  );

  const { reactionData, changeReaction } = useNoteReactions({
    notes,
    userId: user?.userId ?? null,
    ready: !notesLoading,
  });

  const updateNoteReplyCount = useCallback((noteKey: string, delta: number) => {
    setNotes((prev) =>
      prev.map((n) =>
        reactionKey(n) === noteKey
          ? { ...n, replyCount: Math.max(0, (n.replyCount ?? 0) + delta) }
          : n,
      ),
    );
  }, []);

  /**
   * The date whose notes are on screen. A version change leaves this alone, so
   * the page keeps the notes it is showing while the new wording cross-fades
   * in.
   */
  const dateKey = date ?? todayString;

  useEffect(() => {
    setNotes([]);
    setUserNote(null);
    setNotesLoading(true);
  }, [dateKey]);

  useEffect(() => {
    if (!proverb || loading) return;
    loadPageData();
  }, [proverb, loading, loadPageData]);

  const loadPageDataRef = useRef(loadPageData);
  loadPageDataRef.current = loadPageData;

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (!proverb?.ref) return;
      loadPageDataRef.current({ silent: true });
    });
    return unsubscribe;
  }, [navigation, proverb?.ref]);

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
                changeVersion(v);
              }}
            />
          ),
        }}
      />
      <LemuelKeyboardAwareScrollView
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="white"
          />
        }
        contentContainerStyle={[
          {
            padding: CONTENT_INSET,
            paddingBottom: insets.bottom + 36,
            flexGrow: 1,
          },
          CONTENT_COLUMN,
        ]}
        keyboardShouldPersistTaps="handled"
        bottomOffset={insets.bottom + 8}
      >
        {!proverb && !error && <LemuelLoadingScreen />}
        {error && <Text>{error}</Text>}
        {proverb && !error && (
          <FadeInDown key={proverb.ref}>
            {!isToday && (
              <NotTodayBanner
                date={date!}
                onPressReturnToToday={() => goToDate(undefined)}
              />
            )}
            <ProverbCrossFade
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
                Start meditation
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
                {notesLoading && (
                  <ActivityIndicator
                    size="small"
                    color="#333"
                    style={{ marginTop: 12 }}
                  />
                )}
                {!notesLoading && notes.length === 0 && (
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
                  const rk = reactionKey(note);
                  const rd = reactionData[rk];
                  return (
                    <ProverbNoteCard
                      key={rk}
                      note={note}
                      contentWidth={contentWidth}
                      showEdit={note.uuid === user?.userId}
                      reactionCounts={
                        rd?.reactionCounts ??
                        note.reactionCounts ??
                        EMPTY_REACTION_COUNTS
                      }
                      replyCount={note.replyCount ?? 0}
                      userReaction={rd?.userReaction}
                      onReactionChange={(next) => changeReaction(note, next)}
                      onReplyCountChange={(delta) =>
                        updateNoteReplyCount(rk, delta)
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
                    const prev = new Date(`${dateKey}T00:00:00`);
                    prev.setDate(prev.getDate() - 1);
                    goToDate(toLocalDateString(prev));
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
                      const next = new Date(`${dateKey}T00:00:00`);
                      next.setDate(next.getDate() + 1);
                      goToDate(toLocalDateString(next));
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
      </LemuelKeyboardAwareScrollView>
      <MonthPicker
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelectDay={handleSelectDay}
        initialMonth={(date ?? todayString).slice(0, 7)}
      />
    </View>
  );
}
