import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  type LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import {
  actions,
  RichEditor,
  RichToolbar,
} from "react-native-pell-rich-editor";
import { getUserNote, saveUserNote } from "../../../../src/api/notes";
import { remoteLog } from "../../../../src/api/remote-logger";
import { type WithAuthProps, withAuth } from "../../../../src/auth/with-auth";
import { LemuelButton } from "../../../../src/components/lemuel-button";
import { ProverbCard } from "../../../../src/components/proverb-card";
import { ProverbReferenceHeaderText } from "../../../../src/components/proverb-reference-header-text";
import { Text } from "../../../../src/components/themed-text";
import { useFitFontSize } from "../../../../src/hooks/useFitFontSize";
import { useProverbForTheDay } from "../../../../src/hooks/useProverbForTheDay";

const FONT_SIZES = [56, 40, 24];

function UserNotePage({ user: _user }: WithAuthProps) {
  const router = useRouter();
  const { height: windowHeight } = useWindowDimensions();
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
  const richTextRef = useRef<RichEditor>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const textBoxHeight = windowHeight * 0.6;
  const bottomPadding = Math.max(36, saveButtonHeight + 8);
  const { fontSize, onTextLayout } = useFitFontSize(
    proverb?.proverb,
    textBoxHeight,
    FONT_SIZES,
  );

  useEffect(() => {
    if (!uuid || !ref) return;
    setNotesLoading(true);
    getUserNote(uuid, ref)
      .then((data) => {
        if (data) {
          setEditorContent(data.note);
        }
      })
      .catch((err) => {
        remoteLog("error", "[Notes] Failed to load note", { error: err });
      })
      .finally(() => {
        setNotesLoading(false);
      });
  }, [uuid, ref]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await saveUserNote(uuid!, ref!, editorContent, date!);
      router.push("/");
    } catch (err) {
      remoteLog("error", "[Notes] Failed to save note", { error: err });
    } finally {
      setSaving(false);
    }
  }, [uuid, ref, editorContent, date, router]);

  const handleSaveButtonLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0) {
      setSaveButtonHeight((prev) => (prev > 0 ? prev : h));
    }
  }, []);

  const allLoaded = !notesLoading && !proverbLoading && proverb;

  useEffect(() => {
    if (!allLoaded) return;

    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
      richTextRef.current?.focusContentEditor();
    }, 300);

    return () => clearTimeout(timer);
  }, [allLoaded]);

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
              </View>
            )}
            {notesLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading note...</Text>
              </View>
            ) : (
              <RichEditor
                ref={richTextRef}
                onChange={setEditorContent}
                placeholder="Capture your thoughts..."
                editorStyle={{
                  backgroundColor: "#fff",
                  color: "#333",
                  placeholderColor: "#999",
                  contentCSSText:
                    "font-size: 16px; font-family: Nunito; padding: 8px;",
                }}
                initialContentHTML={editorContent}
                useContainer={false}
                style={{ minHeight: 150 }}
              />
            )}
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
