import { MaterialIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  type LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import {
  actions,
  RichEditor,
  RichToolbar,
} from "react-native-pell-rich-editor";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  deleteUserNote,
  getUserNote,
  saveUserNote,
} from "../../../../src/api/notes";
import { remoteLog } from "../../../../src/api/remote-logger";
import { type WithAuthProps, withAuth } from "../../../../src/auth/with-auth";
import { LemuelButton } from "../../../../src/components/lemuel-button";
import { ProverbCard } from "../../../../src/components/proverb-card";
import { ProverbReferenceHeaderText } from "../../../../src/components/proverb-reference-header-text";
import { Text } from "../../../../src/components/themed-text";
import { useFitFontSize } from "../../../../src/hooks/useFitFontSize";
import { useKeyboardHeight } from "../../../../src/hooks/useKeyboardHeight";
import { useProverbForTheDay } from "../../../../src/hooks/useProverbForTheDay";
import { useUnsavedChanges } from "../../../../src/hooks/useUnsavedChanges";

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
  const [saveButtonHeight, setSaveButtonHeight] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const richTextRef = useRef<RichEditor>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const keyboardHeight = useKeyboardHeight();

  const textBoxHeight = windowHeight * 0.6 - insets.bottom;
  const bottomPadding = saveButtonHeight + 15 + insets.bottom;
  const { fontSize, onTextLayout } = useFitFontSize(
    proverb?.proverb,
    textBoxHeight,
    FONT_SIZES,
  );

  useEffect(() => {
    if (!uuid || !ref) return;
    setNotesLoading(true);
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
  }, [uuid, ref]);

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

  const handleDelete = useCallback(() => {
    Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          try {
            setIsDirty(false);
            await deleteUserNote(uuid!, ref!, date!);
            remoteLog("info", "[Notes] Note deleted", { uuid, ref });
            router.replace("/");
          } catch (err) {
            remoteLog("error", "[Notes] Failed to delete note", {
              error: err,
            });
            setDeleting(false);
          }
        },
      },
    ]);
  }, [uuid, ref, date, router]);

  const handleSaveButtonLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0) {
      setSaveButtonHeight((prev) => (prev > 0 ? prev : h));
    }
  }, []);

  const allLoaded = !notesLoading && !proverbLoading && proverb;

  const hasInitiallyScrolled = useRef(false);

  useEffect(() => {
    if (!allLoaded) return;

    const timer = setTimeout(() => {
      richTextRef.current?.focusContentEditor();
    }, 300);

    return () => clearTimeout(timer);
  }, [allLoaded]);

  useEffect(() => {
    if (!allLoaded || keyboardHeight === 0 || hasInitiallyScrolled.current)
      return;
    hasInitiallyScrolled.current = true;

    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    return () => clearTimeout(timer);
  }, [keyboardHeight, allLoaded]);

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
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
        <ScrollView
          ref={scrollViewRef}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[
            styles.contentContainer,
            { paddingBottom: bottomPadding },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {proverb && !proverbLoading && !proverbError && (
            <ProverbCard
              proverb={proverb}
              fontSize={fontSize}
              onTextLayout={onTextLayout}
            />
          )}
          <View style={styles.editorBox}>
            {!notesLoading && (
              <View style={styles.toolbarRow}>
                <View style={styles.toolbarFlex}>
                  <RichToolbar
                    editor={richTextRef}
                    actions={[
                      actions.setBold,
                      actions.setItalic,
                      actions.setUnderline,
                      actions.insertBulletsList,
                      actions.insertOrderedList,
                    ]}
                    iconSize={24}
                    iconTint="white"
                    selectedIconTint="#ccc"
                    style={styles.toolbarInner}
                  />
                </View>
                <TouchableOpacity
                  onPress={handleDelete}
                  disabled={deleting}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons name="delete" size={24} color="white" />
                </TouchableOpacity>
              </View>
            )}
            {notesLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading note...</Text>
              </View>
            ) : (
              <RichEditor
                ref={richTextRef}
                onChange={handleEditorChange}
                placeholder="Capture your thoughts..."
                editorStyle={{
                  backgroundColor: "#fff",
                  color: "#333",
                  placeholderColor: "#999",
                  contentCSSText:
                    "font-size: 16px; font-family: Nunito; padding: 8px; overflow: hidden;",
                }}
                initialContentHTML={editorContent}
                initialHeight={150}
                autoCapitalize="sentences"
                autoCorrect
                style={{ minHeight: 150 }}
              />
            )}
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
                  size={18}
                  color="#666"
                />
                <Text style={{ color: "#666", fontSize: 14 }}>
                  Keep private
                </Text>
              </View>
              <Switch
                value={isPrivate}
                onValueChange={(v) => {
                  setIsPrivate(v);
                  setIsDirty(true);
                }}
                trackColor={{ false: "#ccc", true: "#666" }}
              />
            </View>
            <View onLayout={handleSaveButtonLayout}>
              <LemuelButton
                style={styles.saveButton}
                onPress={handleSave}
                disabled={saving || notesLoading}
              >
                {saving ? "Saving..." : "Save"}
              </LemuelButton>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

export default withAuth(UserNotePage);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    flexGrow: 1,
  },
  editorBox: {
    marginTop: 16,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  toolbarInner: {
    backgroundColor: "black",
  },
  toolbarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
    marginTop: 4,
    marginBottom: 8,
    paddingRight: 8,
    backgroundColor: "black",
    borderRadius: 8,
    overflow: "hidden",
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    color: "#999",
    fontSize: 16,
    fontFamily: "Nunito_400Regular",
  },
  toolbarFlex: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: "black",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    margin: 8,
  },
});
