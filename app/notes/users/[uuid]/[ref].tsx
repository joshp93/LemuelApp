import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  type LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
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
import { Text } from "../../../../src/components/themed-text";
import { VersionDropdown } from "../../../../src/components/version-dropdown";
import { useFitFontSize } from "../../../../src/hooks/useFitFontSize";
import { useProverbForTheDay } from "../../../../src/hooks/useProverbForTheDay";

const FONT_SIZES = [40, 28, 18];

function UserNotePage({ user: _user }: WithAuthProps) {
  const router = useRouter();
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
    goToDate,
  } = useProverbForTheDay(date);

  const [saving, setSaving] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [notesLoading, setNotesLoading] = useState(true);
  const richTextRef = useRef<RichEditor>(null);
  const [topHalfHeight, setTopHalfHeight] = useState(0);

  const textAreaHeight = Math.max(topHalfHeight - 24, 100);
  const { fontSize, onTextLayout } = useFitFontSize(
    proverb?.proverb,
    textAreaHeight,
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

  const handleTopHalfLayout = useCallback((e: LayoutChangeEvent) => {
    setTopHalfHeight(e.nativeEvent.layout.height);
  }, []);

  const title =
    proverb && !proverbLoading && !proverbError ? proverb.ref : "Daily Proverb";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
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

        <View style={styles.row}>
          <View
            style={isFullScreen ? { display: "none" } : styles.half}
            onLayout={handleTopHalfLayout}
          >
            <ScrollView contentContainerStyle={styles.proverbContent}>
              {proverb && !proverbLoading && !proverbError && (
                <ProverbCard
                  proverb={proverb}
                  fontSize={fontSize}
                  onTextLayout={onTextLayout}
                />
              )}
            </ScrollView>
          </View>

          <View style={isFullScreen ? styles.editorFullScreen : styles.half}>
            <View style={isFullScreen ? { flex: 1 } : styles.editorSection}>
              {isFullScreen && (
                <View style={styles.fullScreenHeader}>
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
                  <Pressable
                    style={styles.closeFullScreenInline}
                    onPress={() => {
                      try {
                        setIsFullScreen(false);
                      } catch (err) {
                        remoteLog("error", "[FullScreen] Failed to close", {
                          error: err,
                        });
                      }
                    }}
                  >
                    <Text style={styles.closeFullScreenText}>✕</Text>
                  </Pressable>
                </View>
              )}
              {notesLoading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading note...</Text>
                </View>
              ) : (
                <RichEditor
                  key={isFullScreen ? "full" : "split"}
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
                />
              )}
              {!isFullScreen && !notesLoading && (
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
                  <LemuelButton
                    style={styles.fullScreenButton}
                    onPress={() => setIsFullScreen(true)}
                    textStyle={styles.fullScreenButtonText}
                  >
                    ⛶
                  </LemuelButton>
                </View>
              )}
            </View>
            <LemuelButton
              style={styles.saveButton}
              onPress={handleSave}
              disabled={saving || notesLoading}
            >
              {saving ? "Saving..." : "Save"}
            </LemuelButton>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

export default withAuth(UserNotePage);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  row: {
    flex: 1,
    flexDirection: "column",
  },
  half: {
    flex: 1,
  },
  proverbContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  editorSection: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  editorFullScreen: {
    ...StyleSheet.absoluteFill,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    backgroundColor: "#fff",
  },
  toolbarInner: {
    backgroundColor: "black",
  },
  fullScreenHeader: {
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
  closeFullScreenInline: {
    padding: 8,
    marginLeft: 4,
  },
  closeFullScreenText: {
    color: "white",
    fontSize: 20,
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
    flex: 1,
    justifyContent: "center",
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
  fullScreenButton: {
    padding: 8,
    marginLeft: 4,
    backgroundColor: "black",
    borderRadius: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  fullScreenButtonText: {
    fontSize: 20,
    color: "white",
  },
  saveButton: {
    backgroundColor: "black",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 36,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Nunito_400Regular",
  },
});
