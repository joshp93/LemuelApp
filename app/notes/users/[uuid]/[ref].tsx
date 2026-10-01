import { MaterialIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { recordMeditationCompletion } from "../../../../src/api/meditation";
import {
  deleteUserNote,
  getUserNote,
  saveUserNote,
} from "../../../../src/api/notes";
import { remoteLog } from "../../../../src/api/remote-logger";
import { type WithAuthProps, withAuth } from "../../../../src/auth/with-auth";
import { LemuelButton } from "../../../../src/components/lemuel-button";
import { LemuelKeyboardAwareScrollView } from "../../../../src/components/lemuel-keyboard-aware-scroll-view";
import { LemuelLoadingScreen } from "../../../../src/components/lemuel-loading-screen";
import { LemuelSwitch } from "../../../../src/components/lemuel-switch";
import { ProverbCard } from "../../../../src/components/proverb-card";
import { ProverbReferenceHeaderText } from "../../../../src/components/proverb-reference-header-text";
import { Text } from "../../../../src/components/themed-text";
import {
  CONTENT_COLUMN,
  CONTENT_INSET,
} from "../../../../src/constants/layout";
import { useFitFontSize } from "../../../../src/hooks/useFitFontSize";
import { useProverbForTheDay } from "../../../../src/hooks/useProverbForTheDay";
import { useUnsavedChanges } from "../../../../src/hooks/useUnsavedChanges";
import { confirm } from "../../../../src/utils/confirm";

const NoteEditor = lazy(() => import("../../../../src/components/note-editor"));

const FONT_SIZES = [56, 40, 24];

function UserNotePage({ user: _user }: WithAuthProps) {
  const router = useRouter();
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { uuid, ref, date } = useLocalSearchParams<{
    uuid: string;
    ref: string;
    date?: string;
  }>();

  const {
    proverb,
    loading: proverbLoading,
    error: proverbError,
    selectedVersion,
    availableVersions,
    changeVersion,
  } = useProverbForTheDay(date);

  const [saving, setSaving] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const [notesLoading, setNotesLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const textBoxHeight = windowHeight * 0.6;
  const { fontSize, onTextLayout } = useFitFontSize(
    proverb?.proverb,
    textBoxHeight,
    FONT_SIZES,
  );

  useEffect(() => {
    if (!uuid || !ref) return;
    setNotesLoading(true);

    recordMeditationCompletion(uuid, date ?? "");

    getUserNote(uuid, ref, date)
      .then((data) => {
        if (data) {
          setEditorContent(data.note);
          setIsPrivate(data.isPrivate ?? false);
          setIsDirty(false);
        }
      })
      .catch((err) => {
        remoteLog("error", "[Notes] Failed to load note", { error: err });
      })
      .finally(() => {
        setNotesLoading(false);
      });
  }, [uuid, ref, date]);

  const handleEditorChange = useCallback((html: string) => {
    setEditorContent(html);
    setIsDirty(true);
  }, []);

  const persistNote = useCallback(async () => {
    setSaving(true);
    try {
      await saveUserNote(uuid!, ref!, editorContent, date!, isPrivate);
      setIsDirty(false);
    } catch (err) {
      remoteLog("error", "[Notes] Failed to save note", { error: err });
    } finally {
      setSaving(false);
    }
  }, [uuid, ref, editorContent, date, isPrivate]);

  const handleSave = useCallback(async () => {
    await persistNote();
    router.replace({ pathname: "/", params: { date } });
  }, [persistNote, router, date]);

  useUnsavedChanges(isDirty, persistNote);

  const handleDelete = useCallback(async () => {
    const accepted = await confirm({
      title: "Delete note",
      message: "Are you sure you want to delete this note?",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!accepted) return;

    setDeleting(true);
    try {
      setIsDirty(false);
      await deleteUserNote(uuid!, ref!, date!);
      remoteLog("info", "[Notes] Note deleted", { uuid, ref });
      router.replace("/");
    } catch (err) {
      remoteLog("error", "[Notes] Failed to delete note", { error: err });
      setDeleting(false);
    }
  }, [uuid, ref, date, router]);

  const allLoaded = !notesLoading && !proverbLoading && proverb;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <ProverbReferenceHeaderText
              proverbRef={proverb?.ref}
              loading={proverbLoading}
              error={proverbError}
              selectedVersion={selectedVersion}
              availableVersions={availableVersions}
              onVersionChange={changeVersion}
            />
          ),
        }}
      />
      <LemuelKeyboardAwareScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 16 },
          CONTENT_COLUMN,
        ]}
        keyboardShouldPersistTaps="handled"
        bottomOffset={insets.bottom + 8}
      >
        {proverb && !proverbLoading && !proverbError && (
          <ProverbCard
            proverb={proverb}
            fontSize={fontSize}
            onTextLayout={onTextLayout}
          />
        )}
        <View style={styles.editorBox}>
          <Suspense fallback={<LemuelLoadingScreen />}>
            <NoteEditor
              notesLoading={notesLoading}
              editorContent={editorContent}
              onChange={handleEditorChange}
              onDelete={handleDelete}
              deleting={deleting}
              contentLoaded={allLoaded}
            />
          </Suspense>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <MaterialIcons
                name={isPrivate ? "lock" : "lock-open"}
                size={24}
                color="#666"
              />
              <Text style={{ color: "#666", fontSize: 14 }}>
                Make this a private note
              </Text>
            </View>
            <LemuelSwitch
              value={isPrivate}
              onValueChange={(v) => {
                setIsPrivate(v);
                setIsDirty(true);
              }}
            />
          </View>
          <View>
            <LemuelButton
              style={styles.saveButton}
              onPress={handleSave}
              disabled={saving || notesLoading}
            >
              {saving ? "Saving..." : "Save"}
            </LemuelButton>
          </View>
        </View>
      </LemuelKeyboardAwareScrollView>
    </View>
  );
}

export default withAuth(UserNotePage);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: CONTENT_INSET,
    flexGrow: 1,
  },
  editorBox: {
    marginTop: 16,
    minHeight: 150,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  saveButton: {
    backgroundColor: "black",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    margin: 8,
  },
});
