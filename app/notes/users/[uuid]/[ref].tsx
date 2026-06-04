import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  LayoutChangeEvent,
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
import { withAuth, type WithAuthProps } from "../../../../src/auth/with-auth";
import { LemuelButton } from "../../../../src/components/lemuel-button";
import { ProverbCard } from "../../../../src/components/proverb-card";
import { Text } from "../../../../src/components/themed-text";
import { VersionDropdown } from "../../../../src/components/version-dropdown";
import { useFitFontSize } from "../../../../src/hooks/useFitFontSize";
import { useProverbForTheDay } from "../../../../src/hooks/useProverbForTheDay";

const FONT_SIZES = [40, 28, 18];

function UserNotePage({ user }: WithAuthProps) {
  const router = useRouter();
  const { uuid, ref } = useLocalSearchParams<{ uuid: string; ref: string }>();

  const {
    proverb,
    loading: proverbLoading,
    error: proverbError,
    selectedVersion,
    availableVersions,
    changeVersion,
  } = useProverbForTheDay();

  const [saving, setSaving] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const [isFullScreen, setIsFullScreen] = useState(false);
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
    getUserNote(uuid, ref)
      .then((data) => {
        if (data) {
          setEditorContent(data.note);
          richTextRef.current?.setContentHTML(data.note);
        }
      })
      .catch((err) => {
        console.error("Failed to load note:", err);
      });
  }, [uuid, ref]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await saveUserNote(uuid!, ref!, editorContent);
      router.push("/");
    } catch (err) {
      console.error("Failed to save note:", err);
    } finally {
      setSaving(false);
    }
  }, [uuid, ref, editorContent, router]);

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
            {isFullScreen && (
              <Pressable
                style={styles.closeFullScreen}
                onPress={() => setIsFullScreen(false)}
              >
                <Text style={styles.closeFullScreenText}>Close</Text>
              </Pressable>
            )}
            <View style={isFullScreen ? { flex: 1 } : styles.editorSection}>
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
              />
              {!isFullScreen && (
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
            {/* Save button — outside editor, still in the 50% container */}
            <LemuelButton
              style={styles.saveButton}
              onPress={handleSave}
              disabled={saving}
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
  closeFullScreen: {
    backgroundColor: "black",
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: "flex-end",
    marginRight: 8,
    marginTop: 8,
    borderRadius: 6,
  },
  closeFullScreenText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Nunito_400Regular",
  },
  toolbarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  toolbarFlex: {
    flex: 1,
  },
  fullScreenButton: {
    padding: 8,
    marginLeft: 4,
    backgroundColor: "#eee",
    borderRadius: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  fullScreenButtonText: {
    fontSize: 20,
    color: "#333",
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
