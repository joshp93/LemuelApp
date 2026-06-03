import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ProverbCard } from "../src/components/proverb-card";
import { Text } from "../src/components/themed-text";
import { VersionDropdown } from "../src/components/version-dropdown";
import { useFitFontSize } from "../src/hooks/useFitFontSize";
import { useProverbForTheDay } from "../src/hooks/useProverbForTheDay";
import { updateProverbWidget } from "../src/widgets";

const FONT_SIZES = [56, 40, 24];
const BTN_BLOCK = 85;

export default function Index() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const {
    proverb,
    loading,
    error,
    selectedVersion,
    availableVersions,
    changeVersion,
  } = useProverbForTheDay();

  useEffect(() => {
    if (proverb) {
      updateProverbWidget(proverb);
    }
  }, [proverb]);

  const headerHeight = insets.top + (Platform.OS === "ios" ? 44 : 56);
  const textBoxHeight = windowHeight - headerHeight - BTN_BLOCK - 64;

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
        contentContainerStyle={{
          padding: 16,
          flexGrow: 1,
          paddingBottom: 36 + 15 + 36,
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
        <View style={{ justifyContent: "flex-start" }}>
          {proverb && !loading && !error && (
            <ProverbCard proverb={proverb} fontSize={fontSize} onTextLayout={onTextLayout} />
          )}
        </View>
      </ScrollView>
      <Pressable
        style={styles.meditationButton}
        onPress={() => router.push("/meditation")}
      >
        <Text style={styles.meditationButtonText}>Start Meditation</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  meditationButton: {
    position: "absolute",
    bottom: 36,
    left: 16,
    right: 16,
    backgroundColor: "black",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  meditationButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Nunito_400Regular",
  },
});
